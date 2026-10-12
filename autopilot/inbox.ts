import { promises as fs } from "node:fs";
import path from "node:path";
import { loadProfile } from "./clients/profile";
import type { Config } from "./config";
import { EXT } from "./ingest/ingest";
import { listJobs, resolveConfig } from "./jobs/store";
import { jobOverridesSchema, type Job, type JobOverrides } from "./jobs/types";
import { submitJob } from "./pipeline/run";
import { ensureDir, sha256File } from "./util/fs";

// Bandeja de entrada: inbox/<cliente>/*.mp4 (+ subtítulos con el mismo nombre)
export const processInbox = async (cfg: Config, clientId: string, onJob: (job: Job) => void = () => undefined, settleMs = 1500) => {
  const dir = await ensureDir(path.join(cfg.HH_INBOX_DIR, clientId));
  const done = await ensureDir(path.join(dir, "_procesados"));
  const entries = (await fs.readdir(dir, { withFileTypes: true })).filter((e) => e.isFile());
  const videos = entries.filter((e) => (EXT.video as readonly string[]).includes(path.extname(e.name).toLowerCase())).map((e) => e.name).sort();
  const results: Job[] = [];
  for (const name of videos) {
    const stem = name.slice(0, name.length - path.extname(name).length);
    const capName = [".srt", ".vtt", ".json"].map((x) => stem + x).find((n) => entries.some((e) => e.name === n && !n.endsWith(".job.json")));
    const settingsName = entries.find((e) => e.name === `${stem}.job.json`)?.name;
    // Archivo que todavía se está copiando: esperar a la siguiente pasada
    const s1 = (await fs.stat(path.join(dir, name))).size;
    await new Promise((r) => setTimeout(r, settleMs));
    if ((await fs.stat(path.join(dir, name))).size !== s1) {
      console.log(`· ${name} aún se está copiando; se procesará en la siguiente pasada`);
      continue;
    }
    let overrides: JobOverrides = {};
    if (settingsName) overrides = jobOverridesSchema.parse(JSON.parse(await fs.readFile(path.join(dir, settingsName), "utf8")));
    // Evitar procesar dos veces el mismo vídeo con la misma configuración
    const hash = await sha256File(path.join(dir, name));
    const wanted = JSON.stringify(resolveConfig(await loadProfile(cfg.HH_CLIENTS_DIR, clientId), overrides));
    const prev = (await listJobs(cfg, clientId)).find(
      (j) => j.inputs.some((i) => i.sha256 === hash) && ["completado", "requiere_revision"].includes(j.status) && JSON.stringify(j.config) === wanted,
    );
    console.log(`\n▶ ${name}${capName ? ` + ${capName}` : " (sin subtítulos)"}`);
    const job = prev
      ? (console.log(`· Ya procesado en el trabajo ${prev.id}: no se repite`), prev)
      : await submitJob(cfg, { clientId, video: path.join(dir, name), captions: capName ? path.join(dir, capName) : null, overrides });
    onJob(job);
    results.push(job);
    const dest = await ensureDir(path.join(done, job.id));
    for (const f of [name, capName, settingsName].filter(Boolean) as string[]) await fs.rename(path.join(dir, f), path.join(dest, f));
  }
  return results;
};
