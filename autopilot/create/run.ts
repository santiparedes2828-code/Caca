import { promises as fs } from "node:fs";
import path from "node:path";
import type { Caption } from "@remotion/captions";
import type { CaptionPage } from "../../src/autopilot/props";
import { createPropsSchema, type CreateProps, type Scene } from "../../src/create/props";
import { normalize, parseCaptionsText, toSrt } from "../captions/load";
import { loadProfile } from "../clients/profile";
import { ROOT, type Config } from "../config";
import { IngestError, storeOriginal, validateFile } from "../ingest/ingest";
import { acquireLock, cancelRequested, createJob, jobDir, loadJob, saveJob } from "../jobs/store";
import type { Job, JobStatus } from "../jobs/types";
import { normalizeAudio } from "../media/prepare";
import { probe } from "../media/probe";
import { narrate } from "../narration/tts";
import { runQc } from "../qc/qc";
import { reportMarkdown } from "../qc/report";
import { startAssetServer } from "../render/assetServer";
import { getBundle } from "../render/bundle";
import { renderComposition } from "../render/render";
import { ProviderError } from "../transcription/elevenlabs";
import { runOk } from "../util/exec";
import { readJson, writeJsonAtomic, writeTextAtomic } from "../util/fs";
import { createLogger, redact } from "../util/log";
import { alignScript, parseScript, scriptFromBrief, scriptText } from "./script";

// Creación desde cero (Etapa 5): guion (archivo o brief con Claude) → narración con la voz de marca
// (ElevenLabs, o un audio propio con sus tiempos) → escenas con componentes validados → render → QC.
// Si algo falla, se reintenta todo: la narración y el guion generados quedan en caché, sin volver a pagar.

export type CreationRequest = {
  clientId: string;
  script?: string | null; // archivo .txt/.md
  brief?: string | null; // texto libre (requiere Claude)
  type?: string; // anuncio, educativo, producto, explicativo, redes…
  seconds?: number;
  audio?: string | null; // narración propia (mp3/wav)
  timings?: string | null; // sus tiempos por palabra (JSON de ElevenLabs/Whisper o Caption[])
  label?: string;
};

const LOGO_SECONDS = 1.5;

export const submitCreation = async (cfg: Config, req: CreationRequest): Promise<Job> => {
  const profile = await loadProfile(cfg.HH_CLIENTS_DIR, req.clientId);
  const job = await createJob(cfg, profile);
  job.type = "creacion";
  const dir = jobDir(cfg, profile.id, job.id);
  const log = createLogger(path.join(dir, "logs", "job.log"), [ROOT, cfg.HH_DATA_DIR]);
  job.status = "validando";
  await saveJob(cfg, job);
  try {
    if (!req.script && !req.brief) throw new IngestError("sin_guion", "Falta el guion (--guion archivo) o el brief (--brief \"…\")");
    if (!!req.audio !== !!req.timings) throw new IngestError("narracion", "Para usar un audio propio hacen falta el audio y sus tiempos por palabra (--voz y --tiempos)");
    const files: [string, "guion" | "audio" | "captions"][] = [];
    if (req.script) files.push([req.script, "guion"]);
    if (req.audio) files.push([req.audio, "audio"]);
    if (req.timings) files.push([req.timings, "captions"]);
    for (const [f, role] of files) {
      const v = await validateFile(cfg, path.resolve(f), role);
      job.inputs.push(await storeOriginal(dir, path.resolve(f), v));
    }
    if (req.brief) await writeTextAtomic(path.join(dir, "input", "original", "brief.txt"), req.brief.slice(0, 4000));
    await writeJsonAtomic(path.join(dir, "work", "creacion.json"), { type: req.type ?? "redes", seconds: req.seconds ?? 30, label: req.label ?? "" });
    job.steps.ingest = { status: "hecho", finishedAt: new Date().toISOString() };
    job.status = "recibido";
    await saveJob(cfg, job);
  } catch (e) {
    job.status = "fallido";
    job.errors.push({ step: "ingest", code: e instanceof IngestError ? e.code : "ingesta", message: (e as Error).message });
    await saveJob(cfg, job);
    log.error((e as Error).message);
    return job;
  }
  return runCreation(cfg, profile.id, job.id);
};

export const runCreation = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const dir = jobDir(cfg, clientId, jobId);
  const release = acquireLock(dir);
  const job = await loadJob(cfg, clientId, jobId);
  const log = createLogger(path.join(dir, "logs", "job.log"), [ROOT, cfg.HH_DATA_DIR]);
  const W = (...p: string[]) => path.join(dir, "work", ...p);
  const O = (...p: string[]) => path.join(dir, "output", ...p);
  const step = async (status: JobStatus, progress: number) => {
    if (cancelRequested(cfg, job)) throw new ProviderError("cancelado", "Cancelado a petición del usuario", false);
    job.status = status;
    job.progress = progress;
    await saveJob(cfg, job);
  };
  try {
    const profile = await loadProfile(cfg.HH_CLIENTS_DIR, clientId);
    const meta = await readJson<{ type: string; seconds: number; label: string }>(W("creacion.json"));
    job.attempts++;
    job.costs = { real: [], estimated: [] };

    // 1. Guion
    await step("planificando", 0.1);
    let script: string;
    const scriptInput = job.inputs.find((i) => i.role === "guion");
    if (scriptInput) script = await fs.readFile(path.join(dir, scriptInput.path), "utf8");
    else {
      const cached = await fs.readFile(W("guion.txt"), "utf8").catch(() => null);
      if (cached) script = cached;
      else {
        const brief = await fs.readFile(path.join(dir, "input", "original", "brief.txt"), "utf8");
        const ed = profile.defaults.editorial.claude;
        log.info("Generando el guion con Claude a partir del brief…");
        const r = await scriptFromBrief({ brief, type: meta.type, seconds: meta.seconds, model: ed.model, effort: ed.effort });
        script = r.script;
        job.costs.real.push({ provider: "anthropic", amount: r.usage.input + r.usage.output, unit: `tokens (${r.usage.input} entrada + ${r.usage.output} salida)`, note: `guion ${r.usage.model}` });
        job.costs.estimated.push({
          provider: "anthropic",
          amount: Number(((r.usage.input * cfg.HH_CLAUDE_USD_PER_MTOK_IN + r.usage.output * cfg.HH_CLAUDE_USD_PER_MTOK_OUT) / 1e6).toFixed(4)),
          unit: "USD",
          note: "estimado con la tarifa pública; la factura manda",
        });
        for (const c of r.claims) job.warnings.push({ step: "plan", code: "afirmacion", message: `Afirmación a verificar antes de publicar: ${c}` });
      }
    }
    await writeTextAtomic(W("guion.txt"), script);
    const scenes = parseScript(script);

    // 2. Narración
    await step("generando_recursos", 0.25);
    let words: { text: string; startMs: number; endMs: number }[];
    let audioFile: string;
    const audioIn = job.inputs.find((i) => i.role === "audio");
    if (audioIn) {
      const t = job.inputs.find((i) => i.role === "captions")!;
      const parsed = parseCaptionsText(await fs.readFile(path.join(dir, t.path), "utf8"), path.extname(t.path).toLowerCase());
      if (parsed.precision !== "word") throw new ProviderError("tiempos", "Los tiempos de la narración propia deben ser por palabra (JSON)", false);
      const dur = (await probe(path.join(dir, audioIn.path))).durationSec * 1000;
      words = normalize(parsed.items, dur, []);
      audioFile = W(`narracion${path.extname(audioIn.path)}`);
      await fs.copyFile(path.join(dir, audioIn.path), audioFile);
    } else {
      const n = await narrate({ cfg, profile, jobId, text: scriptText(scenes), log: (m) => log.info(m) });
      words = n.words;
      audioFile = W("narracion.mp3");
      await fs.copyFile(n.audio, audioFile);
      if (!n.cached) job.costs.real.push({ provider: "elevenlabs", amount: n.chars, unit: "caracteres narrados", note: `text-to-speech ${n.model} · voz ${n.voice}` });
    }
    // Narración a la sonoridad de la marca (−14 LUFS) antes de componer
    const normalized = W("narracion-norm.m4a");
    const okNorm = await normalizeAudio(audioFile, normalized, profile.defaults.audio.targetLufs, profile.defaults.audio.truePeakDb);
    audioFile = normalized;
    const al = alignScript(scenes, words);
    if (al.unmatched > al.total * 0.2) {
      throw new ProviderError("guion_audio", `El guion no coincide con la narración (${al.unmatched} de ${al.total} palabras distintas)`, false);
    }
    if (al.unmatched) job.warnings.push({ step: "compose", code: "alineacion", message: `${al.unmatched} palabras del guion no coinciden exactamente con la narración` });

    // 3. Escenas → props validadas
    await step("componiendo", 0.35);
    const fps = 30;
    const caps: Caption[] = words.map((w) => ({ text: w.text, startMs: w.startMs, endMs: w.endMs, timestampMs: (w.startMs + w.endMs) / 2, confidence: null }));
    let offset = 0;
    const sceneProps: Scene[] = scenes.map((s) => {
      const n = s.text.split(" ").length;
      const from = al.map[offset];
      const to = Math.max(from, al.map[offset + n - 1]);
      const acc = s.accentWords.length ? al.map[offset + s.accentWords[0]] : null;
      const accEnd = s.accentWords.length ? al.map[offset + s.accentWords[s.accentWords.length - 1]] : null;
      offset += n;
      return { from, to, accent: acc === null ? null : [acc, Math.max(acc, accEnd!)], component: s.component, items: s.items, label: s.label, value: s.value };
    });
    const lastMs = words[words.length - 1].endMs;
    const durationInFrames = Math.ceil(((lastMs + 600) / 1000 + LOGO_SECONDS) * fps);
    const props: CreateProps = createPropsSchema.parse({
      fps,
      durationInFrames,
      audioSrc: `job:${path.basename(audioFile)}`,
      captions: caps,
      scenes: sceneProps,
      headerLabel: meta.label || `(01) ${meta.type}`,
      logoSeconds: LOGO_SECONDS,
    });
    await writeJsonAtomic(W("create-props.json"), props);
    const pages: CaptionPage[] = sceneProps.map((s) => ({
      startMs: caps[s.from].startMs,
      endMs: caps[s.to].endMs,
      lines: [caps.slice(s.from, s.to + 1).map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs, emphasis: false }))],
    }));
    const srt = toSrt(pages.map((p) => ({ startMs: p.startMs, endMs: p.endMs, lines: [p.lines[0].map((t) => t.text).join(" ")] })));

    // 4. Render
    await step("renderizando", 0.4);
    const bundle = await getBundle((m) => log.info(m));
    const server = await startAssetServer({ job: W() });
    try {
      await renderComposition({
        cfg,
        serveUrl: bundle.serveUrl,
        id: "AutopilotCreate",
        props: { ...props, audioSrc: server.url("job", path.basename(audioFile)) },
        output: W("render.partial.mp4"),
        shouldCancel: () => cancelRequested(cfg, job),
        onProgress: (p) => {
          job.progress = 0.4 + 0.45 * p;
        },
      });
    } finally {
      await server.close();
    }
    await runOk("ffmpeg", ["-v", "error", "-y", "-i", W("render.partial.mp4"), "-c", "copy", "-movflags", "+faststart", W("render.mp4")]);

    // 5. Control de calidad y entrega
    await step("verificando", 0.9);
    await fs.mkdir(O("qc", "principal"), { recursive: true });
    const qc = await runQc({
      output: W("render.mp4"),
      source: null,
      qcDir: O("qc", "principal"),
      expected: { width: 1080, height: 1920, fps, durationSec: durationInFrames / fps, hasAudio: true },
      audioTarget: { lufs: profile.defaults.audio.targetLufs, truePeakDb: profile.defaults.audio.truePeakDb, normalized: okNorm },
      // El titular reparte el texto en varias líneas por sí mismo: aquí solo se comprueban tiempos y SRT
      captions: { pages, srt, maxCharsPerLine: 400, mode: "titular" },
      captionsRequired: false,
      frames: cfg.HH_QC_FRAMES,
    });
    job.verdict = qc.verdict;
    job.outputs = [];
    const base = `${job.id}_creacion`;
    if (qc.verdict !== "FALLIDO") {
      await fs.copyFile(W("render.mp4"), O(`${base}.mp4`));
      await writeTextAtomic(O(`${base}.srt`), srt);
      job.outputs.push({ kind: "video", path: `output/${base}.mp4`, variant: "principal" }, { kind: "subtitulos_srt", path: `output/${base}.srt`, variant: "principal" });
    }
    await fs.copyFile(W("guion.txt"), O("guion.txt"));
    job.outputs.push({ kind: "guion", path: "output/guion.txt" }, { kind: "informe", path: "output/informe.md" });
    const mustReview = job.warnings.some((w) => w.code === "afirmacion");
    job.status = qc.verdict === "FALLIDO" ? "fallido" : qc.verdict === "APROBADO" && !mustReview ? "completado" : "requiere_revision";
    if (qc.verdict === "FALLIDO") job.errors.push({ step: "qc", code: "qc_fallido", message: qc.checks.filter((c) => c.status === "fallo").map((c) => c.label).join(", ") });
    job.progress = 1;
    await writeTextAtomic(
      O("informe.md"),
      reportMarkdown(job, [{ id: "principal", title: null, durationMs: (durationInFrames / fps) * 1000, reason: `${scenes.length} escenas`, qc }], {
        analysis: { tipo: meta.type, escenas: scenes.length, narración: audioIn ? "audio propio" : `ElevenLabs · ${profile.defaults.voice?.name}` },
      }),
    );
    await saveJob(cfg, job);
    log.info(`Creación ${job.id} terminada: ${job.status} (${job.verdict})`);
    return job;
  } catch (e) {
    const code = e instanceof ProviderError ? e.code : "error_creacion";
    const message = redact((e as Error).message, [ROOT, cfg.HH_DATA_DIR]);
    job.status = code === "cancelado" ? "cancelado" : "fallido";
    job.errors.push({ step: "compose", code, message });
    log.error(message, { code });
    await writeTextAtomic(O("informe.md"), reportMarkdown(job, null));
    await saveJob(cfg, job);
    return job;
  } finally {
    release();
  }
};
