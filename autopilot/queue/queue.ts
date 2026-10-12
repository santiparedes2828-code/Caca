import { promises as fs, readFileSync } from "node:fs";
import path from "node:path";
import { listClients } from "../clients/profile";
import type { Config } from "../config";
import { runCreation } from "../create/run";
import { jobDir, listJobs, loadJob, saveJob } from "../jobs/store";
import type { Job } from "../jobs/types";
import { runJob } from "../pipeline/run";
import { exists } from "../util/fs";
import { ttsCharsToday } from "../narration/tts";
import { usedSecondsToday } from "../transcription/transcribe";

// Cola de trabajos (Etapa 6). La cola son los propios trabajos en disco: un trabajo "encolado" tiene queuedAt.
// El trabajador los procesa por orden de llegada, N a la vez, con reintentos automáticos solo para fallos
// temporales (red, 429/5xx, render) y espera creciente. El bloqueo por trabajo evita procesarlos dos veces,
// incluso con varios trabajadores. Pausa: existe data/queue/PAUSA.

const ACTIVE = ["validando", "analizando", "transcribiendo", "planificando", "generando_recursos", "componiendo", "renderizando", "verificando"];
// Errores que no se arreglan reintentando (hace falta una persona)
const PERMANENT = /^(ingesta|formato|formato_peligroso|extension|tamano|vacio|duracion|sin_video|no_existe|enlace|ilegible|presupuesto|sin_clave|sin_voz|sin_texto|sin_guion|narracion|elevenlabs_40[0-4]|elevenlabs_422|recurso_faltante|recorte|subtitulos_vacios|sin_subtitulos|guion_audio|tiempos|transcripcion_editada|cancelado|qc_fallido)$/;

const pauseFile = (cfg: Config) => path.join(cfg.HH_DATA_DIR, "queue", "PAUSA");
export const pauseQueue = async (cfg: Config) => {
  await fs.mkdir(path.dirname(pauseFile(cfg)), { recursive: true });
  await fs.writeFile(pauseFile(cfg), new Date().toISOString());
};
export const resumeQueue = async (cfg: Config) => fs.rm(pauseFile(cfg), { force: true });
export const isPaused = (cfg: Config) => exists(pauseFile(cfg));

export const enqueue = async (cfg: Config, job: Job) => {
  if (job.status === "fallido") return job; // la ingesta ya lo rechazó: no se encola
  job.queuedAt = new Date().toISOString();
  job.status = "recibido";
  await saveJob(cfg, job);
  return job;
};

const lockAlive = (dir: string) => {
  try {
    const pid = Number(readFileSync(path.join(dir, "job.lock"), "utf8"));
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const allJobs = async (cfg: Config) => {
  const out: Job[] = [];
  for (const c of await listClients(cfg.HH_CLIENTS_DIR)) out.push(...(await listJobs(cfg, c)));
  return out;
};

export type QueueEntry = { job: Job; reason: "nuevo" | "reintento" | "recuperado" };

// Trabajos listos para procesar ahora, por orden de llegada
export const nextJobs = async (cfg: Config, exclude: Set<string>): Promise<QueueEntry[]> => {
  const now = Date.now();
  const out: QueueEntry[] = [];
  for (const j of await allJobs(cfg)) {
    if (!j.queuedAt || exclude.has(j.id)) continue;
    const dir = jobDir(cfg, j.clientId, j.id);
    if (j.status === "recibido") out.push({ job: j, reason: "nuevo" });
    else if (ACTIVE.includes(j.status) && !lockAlive(dir)) out.push({ job: j, reason: "recuperado" }); // proceso muerto a mitad
    else if (j.status === "fallido" && j.nextRetryAt && Date.parse(j.nextRetryAt) <= now) out.push({ job: j, reason: "reintento" });
  }
  return out.sort((a, b) => (a.job.queuedAt! < b.job.queuedAt! ? -1 : 1));
};

const runOne = async (cfg: Config, entry: QueueEntry, log: (m: string) => void) => {
  const { job } = entry;
  if (entry.reason !== "nuevo") {
    const fresh = await loadJob(cfg, job.clientId, job.id);
    fresh.status = "recibido";
    fresh.nextRetryAt = null;
    await saveJob(cfg, fresh);
  }
  log(`▶ ${job.id} (${job.clientId}, ${job.type}${entry.reason !== "nuevo" ? `, ${entry.reason}` : ""})`);
  let done: Job;
  try {
    done = job.type === "creacion" ? await runCreation(cfg, job.clientId, job.id) : await runJob(cfg, job.clientId, job.id);
  } catch (e) {
    log(`  ✖ ${job.id}: ${(e as Error).message}`);
    return;
  }
  if (done.status === "fallido") {
    const code = done.errors.at(-1)?.code ?? "";
    if (!PERMANENT.test(code) && done.autoRetries < cfg.HH_QUEUE_AUTO_RETRIES) {
      done.autoRetries++;
      const wait = cfg.HH_QUEUE_RETRY_BASE_SEC * 2 ** (done.autoRetries - 1);
      done.nextRetryAt = new Date(Date.now() + wait * 1000).toISOString();
      await saveJob(cfg, done);
      log(`  ↻ ${job.id} falló (${code}); reintento ${done.autoRetries}/${cfg.HH_QUEUE_AUTO_RETRIES} en ${wait} s`);
      return;
    }
    done.queuedAt = null; // sale de la cola: requiere una persona
    await saveJob(cfg, done);
    log(`  ✖ ${job.id} fallido (${code}); requiere revisión`);
    return;
  }
  if (done.status !== "requiere_revision" || !done.warnings.some((w) => w.code === "plan_pendiente")) {
    done.queuedAt = null;
    await saveJob(cfg, done);
  }
  log(`  ✓ ${job.id} ${done.status}${done.verdict ? ` (${done.verdict})` : ""}`);
};

// Trabajador: procesa la cola hasta vaciarla (once) o indefinidamente
export const work = async (cfg: Config, opts: { once?: boolean; concurrency?: number; log?: (m: string) => void; stop?: () => boolean } = {}) => {
  const log = opts.log ?? ((m: string) => console.log(m));
  const n = opts.concurrency ?? cfg.HH_QUEUE_CONCURRENCY;
  const running = new Map<string, Promise<void>>();
  let processed = 0;
  for (;;) {
    if (opts.stop?.()) break;
    if (!isPaused(cfg) && running.size < n) {
      const ready = await nextJobs(cfg, new Set(running.keys()));
      for (const e of ready.slice(0, n - running.size)) {
        const p = runOne(cfg, e, log).finally(() => running.delete(e.job.id));
        running.set(e.job.id, p);
        processed++;
      }
    }
    if (opts.once && running.size === 0) {
      const pendingRetry = (await allJobs(cfg)).some((j) => j.queuedAt && j.status === "fallido" && j.nextRetryAt);
      const ready = isPaused(cfg) ? [] : await nextJobs(cfg, new Set());
      if (!ready.length && !pendingRetry) break;
      if (!ready.length && pendingRetry && isPaused(cfg)) break;
    }
    if (running.size) await Promise.race([...running.values(), new Promise((r) => setTimeout(r, cfg.HH_QUEUE_POLL_SEC * 1000))]);
    else await new Promise((r) => setTimeout(r, opts.once ? 200 : cfg.HH_QUEUE_POLL_SEC * 1000));
  }
  await Promise.all(running.values());
  return processed;
};

export const queueStatus = async (cfg: Config) => {
  const jobs = (await allJobs(cfg)).filter((j) => j.queuedAt);
  return {
    paused: isPaused(cfg),
    pending: jobs.filter((j) => j.status === "recibido").length,
    running: jobs.filter((j) => ACTIVE.includes(j.status)).length,
    retrying: jobs.filter((j) => j.status === "fallido" && j.nextRetryAt).length,
    jobs,
  };
};

// Costes: reales (lo que dicen los proveedores) y estimados, por cliente y proveedor; alertas de uso diario
export const costSummary = async (cfg: Config, days = 30) => {
  const since = Date.now() - days * 86400_000;
  const rows: Record<string, { real: Record<string, number>; estimatedUsd: number; jobs: number }> = {};
  for (const j of await allJobs(cfg)) {
    if (Date.parse(j.createdAt) < since) continue;
    const r = (rows[j.clientId] ??= { real: {}, estimatedUsd: 0, jobs: 0 });
    r.jobs++;
    for (const c of j.costs.real) r.real[`${c.provider} · ${c.unit.split(" (")[0]}`] = (r.real[`${c.provider} · ${c.unit.split(" (")[0]}`] ?? 0) + c.amount;
    for (const c of j.costs.estimated) if (c.unit === "USD") r.estimatedUsd += c.amount;
  }
  const stt = await usedSecondsToday(cfg);
  const tts = await ttsCharsToday(cfg);
  const alerts: string[] = [];
  const pct = (used: number, max: number) => (100 * used) / max;
  if (pct(stt, cfg.HH_STT_MAX_SECONDS_PER_DAY) >= cfg.HH_ALERT_PERCENT) alerts.push(`Transcripción: hoy ${Math.round(stt)} s de ${cfg.HH_STT_MAX_SECONDS_PER_DAY} s (${Math.round(pct(stt, cfg.HH_STT_MAX_SECONDS_PER_DAY))} %)`);
  if (pct(tts, cfg.HH_TTS_MAX_CHARS_PER_DAY) >= cfg.HH_ALERT_PERCENT) alerts.push(`Narración: hoy ${tts} de ${cfg.HH_TTS_MAX_CHARS_PER_DAY} caracteres (${Math.round(pct(tts, cfg.HH_TTS_MAX_CHARS_PER_DAY))} %)`);
  return { days, byClient: rows, today: { sttSeconds: stt, ttsChars: tts }, alerts };
};
