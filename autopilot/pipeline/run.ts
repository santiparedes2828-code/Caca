import { promises as fs } from "node:fs";
import path from "node:path";
import { loadProfile } from "../clients/profile";
import { ROOT, type Config } from "../config";
import { IngestError, storeOriginal, validateFile } from "../ingest/ingest";
import { acquireLock, cancelRequested, CANCEL_FILE, createJob, jobDir, loadJob, saveJob } from "../jobs/store";
import { STEP_STATUS, STEPS, type Job, type JobOverrides, type StepName } from "../jobs/types";
import { reportMarkdown } from "../qc/report";
import { exists, readJson, resolveInside, writeTextAtomic } from "../util/fs";
import { createLogger, redact } from "../util/log";
import { StepError, type Ctx, type RenderIndex } from "./context";
import { compose, deliver, qc, render } from "./steps/output";
import { plan } from "./steps/plan";
import { analyze, captions, prepare } from "./steps/source";

// Orquestación de UN trabajo. Cada paso deja sus resultados en work/ y se marca como hecho en job.json;
// si el proceso se corta o falla, se continúa desde el primer paso pendiente o cuyo resultado falte.

const STEP_IMPL: Record<Exclude<StepName, "ingest">, (ctx: Ctx) => Promise<void>> = {
  analyze,
  prepare,
  captions,
  plan,
  compose,
  render,
  qc,
  deliver,
};

const PROGRESS: Record<StepName, number> = {
  ingest: 0.05,
  analyze: 0.1,
  prepare: 0.2,
  captions: 0.28,
  plan: 0.35,
  compose: 0.4,
  render: 0.85,
  qc: 0.95,
  deliver: 1,
};

// Artefactos que deja cada paso: si falta alguno, el paso (y los siguientes) se repiten
const artifacts = async (ctx: Ctx, step: StepName): Promise<string[]> => {
  switch (step) {
    case "ingest":
      return [];
    case "analyze":
      return ["work/analysis.json"];
    case "prepare":
      return ["work/source.mp4", "work/prepare.json"];
    case "captions":
      return ["work/source-captions.json"];
    case "plan":
      return ["work/plan.json"];
    case "compose":
      return ["work/compose.json"];
    case "render": {
      const f = path.join(ctx.dir, "work", "render.json");
      if (!exists(f)) return ["work/render.json"];
      const idx = await readJson<RenderIndex>(f);
      return ["work/render.json", ...Object.values(idx.variants).map((v) => path.join("work", v.file))];
    }
    case "qc":
      return ["work/qc.json"];
    case "deliver":
      return ["output/informe.md"];
  }
};

const firstStepToRun = async (ctx: Ctx) => {
  for (const s of STEPS) {
    const st = ctx.job.steps[s]?.status;
    if (st !== "hecho" && st !== "omitido") return s;
    for (const a of await artifacts(ctx, s)) if (!exists(path.join(ctx.dir, a))) return s;
  }
  return null;
};

export const runJob = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const dir = jobDir(cfg, clientId, jobId);
  const release = acquireLock(dir);
  const job = await loadJob(cfg, clientId, jobId);
  const log = createLogger(path.join(dir, "logs", "job.log"), [ROOT, cfg.HH_DATA_DIR]);
  try {
    const profile = await loadProfile(cfg.HH_CLIENTS_DIR, clientId);
    const ctx: Ctx = { cfg, job, dir, profile, log };
    if (["completado", "requiere_revision", "cancelado"].includes(job.status)) return job;
    const start = await firstStepToRun(ctx);
    if (!start) return job;
    if (start === "ingest") throw new StepError("ingesta", "La ingesta no terminó: crea un trabajo nuevo con los archivos");
    const from = STEPS.indexOf(start);
    for (const s of STEPS.slice(from)) job.steps[s] = { status: "pendiente" };
    job.attempts++;
    job.verdict = null;
    log.info(`Trabajo ${job.id} (${clientId}): intento ${job.attempts}, desde el paso "${start}"`);

    for (const step of STEPS.slice(from) as Exclude<StepName, "ingest">[]) {
      if (cancelRequested(cfg, job)) {
        job.status = "cancelado";
        log.warn("Cancelado a petición del usuario");
        await saveJob(cfg, job);
        return job;
      }
      job.status = STEP_STATUS[step];
      job.steps[step] = { status: "en_curso", startedAt: new Date().toISOString() };
      await saveJob(cfg, job);
      log.info(`Paso ${step} → ${job.status}`);
      try {
        await STEP_IMPL[step](ctx);
      } catch (e) {
        const cancelled = cancelRequested(cfg, job);
        const code = e instanceof StepError || e instanceof IngestError ? e.code : cancelled ? "cancelado" : `error_${step}`;
        const message = redact((e as Error).message, [ROOT, cfg.HH_DATA_DIR]);
        job.steps[step] = { ...job.steps[step], status: "fallido", finishedAt: new Date().toISOString(), error: message };
        job.status = cancelled ? "cancelado" : "fallido";
        job.errors.push({ step, code, message });
        log.error(`Paso ${step} falló: ${message}`, { code });
        await writeTextAtomic(path.join(dir, "output", "informe.md"), reportMarkdown(job, null));
        await saveJob(cfg, job);
        return job;
      }
      job.steps[step] = { ...job.steps[step], status: "hecho", finishedAt: new Date().toISOString() };
      job.progress = PROGRESS[step];
      if (ctx.pause) {
        job.status = "requiere_revision";
        log.warn(`Trabajo en pausa tras el paso ${step}: pendiente de aprobación`);
        await saveJob(cfg, job);
        return job;
      }
      await saveJob(cfg, job);
    }
    log.info(`Trabajo ${job.id} terminado: ${job.status} (${job.verdict})`);
    return job;
  } finally {
    release();
  }
};

const resetFrom = (job: Job, from: StepName) => {
  for (const s of STEPS.slice(STEPS.indexOf(from))) job.steps[s] = { status: "pendiente" };
};

// Reintento manual: permitido tras un fallo, hasta HH_MAX_ATTEMPTS. Si falló el control de calidad,
// se recalcula desde los subtítulos y se fuerza un render nuevo (los pasos caros previos se conservan).
export const retryJob = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const job = await loadJob(cfg, clientId, jobId);
  if (job.status !== "fallido" && job.status !== "cancelado") throw new Error(`El trabajo está "${job.status}": solo se reintenta si ha fallado o se canceló`);
  if (job.attempts >= cfg.HH_MAX_ATTEMPTS) throw new Error(`El trabajo ya tiene ${job.attempts} intentos (máximo ${cfg.HH_MAX_ATTEMPTS})`);
  if (job.steps.ingest.status !== "hecho") throw new Error("La ingesta falló: los archivos no son válidos. Crea un trabajo nuevo con archivos correctos");
  const dir = jobDir(cfg, clientId, jobId);
  await fs.rm(path.join(dir, CANCEL_FILE), { force: true });
  if (job.errors.at(-1)?.code === "qc_fallido") {
    job.renderKey = null;
    resetFrom(job, "captions");
    await fs.rm(path.join(dir, "work", "render.json"), { force: true });
  }
  job.status = "recibido";
  await saveJob(cfg, job);
  return runJob(cfg, clientId, jobId);
};

// Rehace subtítulos → entrega reutilizando work/transcript.json (p. ej. tras corregir el texto a mano)
export const redoCaptions = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const job = await loadJob(cfg, clientId, jobId);
  if (job.steps.prepare.status !== "hecho") throw new Error("El trabajo no ha llegado a los subtítulos: usa reintentar");
  if (job.attempts >= cfg.HH_MAX_ATTEMPTS + 5) throw new Error("Demasiados intentos en este trabajo");
  resetFrom(job, "captions");
  job.renderKey = null;
  job.status = "recibido";
  await saveJob(cfg, job);
  return runJob(cfg, clientId, jobId);
};

// Aprobación del plan: el trabajo continúa desde la composición (el plan no se recalcula)
export const approvePlan = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const job = await loadJob(cfg, clientId, jobId);
  if (job.steps.plan.status !== "hecho") throw new Error("El trabajo no tiene un plan terminado que aprobar");
  if (job.planApproved) throw new Error("El plan ya estaba aprobado");
  job.planApproved = true;
  job.warnings = job.warnings.filter((w) => w.code !== "plan_pendiente");
  job.status = "recibido";
  await saveJob(cfg, job);
  return runJob(cfg, clientId, jobId);
};

export type Submission = { clientId: string; video: string; captions?: string | null; overrides?: JobOverrides };

// Crea el trabajo, valida y copia los archivos (ingesta) y ejecuta el pipeline
export const submitJob = async (cfg: Config, sub: Submission, opts: { run?: boolean } = {}): Promise<Job> => {
  const profile = await loadProfile(cfg.HH_CLIENTS_DIR, sub.clientId);
  const job = await createJob(cfg, profile, sub.overrides);
  const dir = jobDir(cfg, profile.id, job.id);
  const log = createLogger(path.join(dir, "logs", "job.log"), [ROOT, cfg.HH_DATA_DIR, path.dirname(path.resolve(sub.video))]);
  log.info(`Trabajo ${job.id} recibido para ${profile.name}`);
  job.status = "validando";
  job.steps.ingest = { status: "en_curso", startedAt: new Date().toISOString() };
  await saveJob(cfg, job);
  try {
    const files: [string, "video" | "captions"][] = [[sub.video, "video"]];
    if (sub.captions) files.push([sub.captions, "captions"]);
    for (const [file, role] of files) {
      const v = await validateFile(cfg, path.resolve(file), role);
      for (const w of v.warnings) job.warnings.push({ step: "ingest", code: "entrada", message: w });
      job.inputs.push(await storeOriginal(dir, path.resolve(file), v));
      log.info(`Entrada ${role} validada: ${v.detected}`);
    }
    job.steps.ingest = { ...job.steps.ingest, status: "hecho", finishedAt: new Date().toISOString() };
    job.progress = PROGRESS.ingest;
    job.status = "recibido";
    await saveJob(cfg, job);
  } catch (e) {
    const code = e instanceof IngestError ? e.code : "ingesta";
    job.steps.ingest = { ...job.steps.ingest, status: "fallido", finishedAt: new Date().toISOString(), error: (e as Error).message };
    job.status = "fallido";
    job.errors.push({ step: "ingest", code, message: (e as Error).message });
    log.error(`Ingesta rechazada: ${(e as Error).message}`, { code });
    await saveJob(cfg, job);
    await writeTextAtomic(path.join(dir, "output", "informe.md"), reportMarkdown(job, null));
    return job;
  }
  return opts.run === false ? job : runJob(cfg, profile.id, job.id);
};

export const jobPath = (cfg: Config, job: Job, rel: string) => resolveInside(jobDir(cfg, job.clientId, job.id), rel);
