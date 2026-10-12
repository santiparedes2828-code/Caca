import { randomBytes } from "node:crypto";
import { closeSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ClientProfile } from "../clients/profile";
import { assertClientId } from "../clients/profile";
import type { Config } from "../config";
import { ensureDir, exists, readJson, resolveInside, writeJsonAtomic } from "../util/fs";
import { jobConfigSchema, jobSchema, STEPS, type Job, type JobConfig, type JobOverrides } from "./types";

// Cada trabajo vive en data/clients/<cliente>/jobs/<id>/ con:
//   job.json          estado y metadatos (escritura atómica)
//   input/original/   copias de los archivos recibidos, de solo lectura (nunca se modifican)
//   work/             copias de trabajo e intermedios (se pueden borrar y regenerar)
//   output/           entregables: MP4, SRT, informe, fotogramas de control
//   logs/job.log      log JSON por líneas, sin secretos
export const JOB_ID = /^\d{8}-\d{6}-[0-9a-f]{6}$/;

export const assertJobId = (id: string) => {
  if (!JOB_ID.test(id)) throw new Error(`Identificador de trabajo no válido: "${id}"`);
  return id;
};

export const clientDir = (cfg: Config, clientId: string) =>
  resolveInside(path.join(cfg.HH_DATA_DIR, "clients"), assertClientId(clientId));

export const jobDir = (cfg: Config, clientId: string, jobId: string) =>
  resolveInside(path.join(clientDir(cfg, clientId), "jobs"), assertJobId(jobId));

const newJobId = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `${stamp}-${randomBytes(3).toString("hex")}`;
};

export const resolveConfig = (profile: ClientProfile, o: JobOverrides = {}): JobConfig =>
  jobConfigSchema.parse({
    format: o.format ?? profile.defaults.format,
    fps: o.fps ?? profile.defaults.fps,
    captionMode: o.captionMode ?? profile.defaults.captionMode,
    intensity: o.intensity ?? profile.defaults.intensity,
    reframe: { ...profile.defaults.reframe, ...o.reframe },
    captionsRequired: o.captionsRequired ?? profile.defaults.captionsRequired,
    allowEstimatedWordTiming: o.allowEstimatedWordTiming ?? false,
    transcribe: o.transcribe ?? profile.defaults.transcription.provider !== "ninguno",
    language: o.language === undefined ? profile.defaults.transcription.language : o.language,
    trim: { startSec: o.trim?.startSec ?? 0, endSec: o.trim?.endSec ?? null },
    audio: { ...profile.defaults.audio, ...(o.audio?.normalize === undefined ? {} : { normalize: o.audio.normalize }) },
  });

export const createJob = async (cfg: Config, profile: ClientProfile, overrides: JobOverrides = {}): Promise<Job> => {
  const id = newJobId();
  const dir = jobDir(cfg, profile.id, id);
  if (exists(dir)) throw new Error(`El trabajo ${id} ya existe`);
  for (const sub of ["input/original", "work", "output", "logs"]) await ensureDir(path.join(dir, sub));
  const now = new Date().toISOString();
  const job: Job = {
    id,
    clientId: profile.id,
    type: "edicion",
    createdAt: now,
    updatedAt: now,
    status: "recibido",
    progress: 0,
    attempts: 0,
    config: resolveConfig(profile, overrides),
    inputs: [],
    steps: Object.fromEntries(STEPS.map((s) => [s, { status: "pendiente" as const }])),
    warnings: [],
    errors: [],
    outputs: [],
    renderKey: null,
    verdict: null,
    costs: { real: [], estimated: [] },
  };
  await writeJsonAtomic(path.join(dir, "job.json"), job);
  return job;
};

export const loadJob = async (cfg: Config, clientId: string, jobId: string): Promise<Job> =>
  jobSchema.parse(await readJson(path.join(jobDir(cfg, clientId, jobId), "job.json")));

export const saveJob = async (cfg: Config, job: Job) => {
  job.updatedAt = new Date().toISOString();
  await writeJsonAtomic(path.join(jobDir(cfg, job.clientId, job.id), "job.json"), jobSchema.parse(job));
};

export const listJobs = async (cfg: Config, clientId: string): Promise<Job[]> => {
  const dir = path.join(clientDir(cfg, clientId), "jobs");
  const ids = (await fs.readdir(dir).catch(() => [] as string[])).filter((x) => JOB_ID.test(x)).sort();
  const jobs: Job[] = [];
  for (const id of ids) jobs.push(await loadJob(cfg, clientId, id));
  return jobs;
};

// Para la CLI local: localizar un trabajo por id entre todos los clientes.
// (Una interfaz expuesta a internet debe usar loadJob con el cliente autenticado, nunca esto.)
export const findJob = async (cfg: Config, jobId: string): Promise<Job> => {
  assertJobId(jobId);
  const base = path.join(cfg.HH_DATA_DIR, "clients");
  for (const c of await fs.readdir(base).catch(() => [] as string[])) {
    if (exists(path.join(base, c, "jobs", jobId, "job.json"))) return loadJob(cfg, c, jobId);
  }
  throw new Error(`No existe el trabajo ${jobId}`);
};

// Bloqueo por trabajo: evita que dos procesos rendericen el mismo trabajo a la vez
export const acquireLock = (dir: string): (() => void) => {
  const file = path.join(dir, "job.lock");
  const tryOpen = () => {
    const fd = openSync(file, "wx");
    writeSync(fd, String(process.pid));
    closeSync(fd);
  };
  try {
    tryOpen();
  } catch {
    const pid = Number(readFileSync(file, "utf8"));
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {
      alive = false;
    }
    if (alive) throw new Error(`El trabajo ya lo está procesando otro proceso (pid ${pid})`);
    unlinkSync(file); // bloqueo huérfano de un proceso que murió
    tryOpen();
  }
  return () => {
    try {
      unlinkSync(file);
    } catch {
      /* ya liberado */
    }
  };
};

export const CANCEL_FILE = "cancel.request";
export const requestCancel = async (cfg: Config, job: Job) =>
  fs.writeFile(path.join(jobDir(cfg, job.clientId, job.id), CANCEL_FILE), new Date().toISOString());
export const cancelRequested = (cfg: Config, job: Job) => exists(path.join(jobDir(cfg, job.clientId, job.id), CANCEL_FILE));
