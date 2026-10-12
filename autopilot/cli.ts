import path from "node:path";
import { parseArgs } from "node:util";
import { listClients } from "./clients/profile";
import { loadConfig, type Config } from "./config";
import { processInbox } from "./inbox";
import { findJob, listJobs, requestCancel } from "./jobs/store";
import { jobOverridesSchema, type Job, type JobOverrides } from "./jobs/types";
import { retryJob, runJob, submitJob } from "./pipeline";

const HELP = `Hook House Autopilot — edición automática (Etapa 1)

Uso: npm run autopilot -- <comando> [opciones]

  procesar <video> [--srt archivo.srt|.vtt|.json] [--cliente hookhouse] [opciones]
        Crea un trabajo, valida y copia los archivos, renderiza y verifica.
  bandeja [--cliente hookhouse] [--vigilar] [--intervalo 10]
        Procesa los vídeos que dejes en inbox/<cliente>/ (con su .srt/.vtt/.json del mismo nombre
        y opcionalmente <nombre>.job.json con ajustes). Los procesados pasan a inbox/<cliente>/_procesados/.
  estado [<id>] [--cliente hookhouse]     Lista trabajos o muestra uno.
  reintentar <id>                          Continúa un trabajo fallido desde el paso que falló.
  cancelar <id>                            Pide cancelar un trabajo en curso.

Opciones de procesado:
  --formato vertical|horizontal|cuadrado   (por defecto: el del perfil del cliente)
  --modo palabra|palabra-activa|grupos|frases|dinamico
  --intensidad sutil|dinamica|alto-impacto
  --reencuadre cover|blur-fill|contain  --foco-x 0..1  --foco-y 0..1
  --desde <s> --hasta <s>                  Recorte del original (no destructivo)
  --estimar-palabras                       Permite tiempos por palabra estimados a partir de un SRT
  --sin-normalizar                         No normaliza la sonoridad
`;

const fmtJob = (j: Job) =>
  `${j.id}  ${j.clientId.padEnd(10)} ${j.status.padEnd(17)} ${(j.progress * 100).toFixed(0).padStart(3)} %  ${j.verdict ?? ""}`;

const overridesFrom = (v: Record<string, string | boolean | undefined>): JobOverrides => {
  const o: Record<string, unknown> = {};
  if (v.formato) o.format = v.formato;
  if (v.modo) o.captionMode = v.modo;
  if (v.intensidad) o.intensity = v.intensidad;
  if (v.fps) o.fps = Number(v.fps);
  const r: Record<string, unknown> = {};
  if (v.reencuadre) r.mode = v.reencuadre;
  if (v["foco-x"]) r.focusX = Number(v["foco-x"]);
  if (v["foco-y"]) r.focusY = Number(v["foco-y"]);
  if (Object.keys(r).length) o.reframe = r;
  if (v.desde || v.hasta) o.trim = { startSec: v.desde ? Number(v.desde) : undefined, endSec: v.hasta ? Number(v.hasta) : undefined };
  if (v["estimar-palabras"]) o.allowEstimatedWordTiming = true;
  if (v["sin-normalizar"]) o.audio = { normalize: false };
  return jobOverridesSchema.parse(o);
};

export const printResult = (cfg: Config, job: Job) => {
  console.log("");
  console.log(fmtJob(job));
  const dir = path.relative(process.cwd(), path.join(cfg.HH_DATA_DIR, "clients", job.clientId, "jobs", job.id));
  for (const o of job.outputs) console.log(`  ${o.kind.padEnd(16)} ${path.join(dir, o.path)}`);
  if (!job.outputs.length) console.log(`  informe          ${path.join(dir, "output", "informe.md")}`);
  if (job.status === "fallido" || job.status === "cancelado") {
    const e = job.errors.at(-1);
    if (e) console.log(`  ✖ [${e.step}] ${e.message}`);
  }
};

const main = async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      cliente: { type: "string", default: "hookhouse" },
      srt: { type: "string" },
      formato: { type: "string" },
      modo: { type: "string" },
      intensidad: { type: "string" },
      fps: { type: "string" },
      reencuadre: { type: "string" },
      "foco-x": { type: "string" },
      "foco-y": { type: "string" },
      desde: { type: "string" },
      hasta: { type: "string" },
      "estimar-palabras": { type: "boolean" },
      "sin-normalizar": { type: "boolean" },
      vigilar: { type: "boolean" },
      intervalo: { type: "string", default: "10" },
    },
  });
  const cfg = loadConfig();
  switch (cmd) {
    case "procesar": {
      if (!positionals[0]) throw new Error("Falta la ruta del vídeo");
      const job = await submitJob(cfg, { clientId: values.cliente!, video: positionals[0], captions: values.srt ?? null, overrides: overridesFrom(values) });
      printResult(cfg, job);
      process.exitCode = job.status === "fallido" ? 1 : 0;
      return;
    }
    case "bandeja": {
      do {
        const r = await processInbox(cfg, values.cliente!, (j) => printResult(cfg, j));
        if (!values.vigilar) {
          if (!r.length) console.log(`No hay vídeos en ${path.relative(process.cwd(), path.join(cfg.HH_INBOX_DIR, values.cliente!))}/`);
          return;
        }
        await new Promise((res) => setTimeout(res, Number(values.intervalo) * 1000));
      } while (values.vigilar);
      return;
    }
    case "estado": {
      if (positionals[0]) {
        const j = await findJob(cfg, positionals[0]);
        console.log(JSON.stringify({ ...j, inputs: j.inputs.map((i) => ({ ...i, sha256: i.sha256.slice(0, 16) })) }, null, 2));
        return;
      }
      for (const c of values.cliente === "todos" ? await listClients(cfg.HH_CLIENTS_DIR) : [values.cliente!]) {
        for (const j of await listJobs(cfg, c)) console.log(fmtJob(j));
      }
      return;
    }
    case "reintentar": {
      const j = await findJob(cfg, positionals[0] ?? "");
      const job = await retryJob(cfg, j.clientId, j.id);
      printResult(cfg, job);
      process.exitCode = job.status === "fallido" ? 1 : 0;
      return;
    }
    case "continuar": {
      const j = await findJob(cfg, positionals[0] ?? "");
      printResult(cfg, await runJob(cfg, j.clientId, j.id));
      return;
    }
    case "cancelar": {
      const j = await findJob(cfg, positionals[0] ?? "");
      await requestCancel(cfg, j);
      console.log(`Cancelación pedida para ${j.id}`);
      return;
    }
    default:
      console.log(HELP);
  }
};

main().catch((e) => {
  console.error(`✖ ${(e as Error).message}`);
  process.exitCode = 1;
});
