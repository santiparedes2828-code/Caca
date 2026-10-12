import path from "node:path";
import { parseArgs } from "node:util";
import { listClients, loadProfile } from "./clients/profile";
import { submitCreation } from "./create/run";
import { narrate } from "./narration/tts";
import { loadConfig, type Config } from "./config";
import { processInbox } from "./inbox";
import { findJob, listJobs, requestCancel } from "./jobs/store";
import { jobOverridesSchema, type Job, type JobOverrides } from "./jobs/types";
import { approvePlan, redoCaptions, retryJob, runJob, submitJob } from "./pipeline/run";
import { createElevenLabsClient } from "./transcription/elevenlabs";
import { usedSecondsToday } from "./transcription/transcribe";

const HELP = `Hook House Autopilot — edición automática (Etapa 1)

Uso: npm run autopilot -- <comando> [opciones]

  procesar <video> [--srt archivo.srt|.vtt|.json] [--cliente hookhouse] [opciones]
        Crea un trabajo, valida y copia los archivos, renderiza y verifica.
  bandeja [--cliente hookhouse] [--vigilar] [--intervalo 10]
        Procesa los vídeos que dejes en inbox/<cliente>/ (con su .srt/.vtt/.json del mismo nombre
        y opcionalmente <nombre>.job.json con ajustes). Los procesados pasan a inbox/<cliente>/_procesados/.
  crear --guion guion.txt | --brief "…" [--tipo anuncio] [--segundos 30] [--etiqueta "(01) …"]
        [--voz narracion.mp3 --tiempos tiempos.json]
        Crea un vídeo desde cero: guion → narración con la voz de marca (ElevenLabs) → escenas → MP4.
        Formato del guion: ver autopilot/create/script.ts. --brief necesita ANTHROPIC_API_KEY.
  narrar --texto "…"                        Genera solo la narración (mp3 + tiempos) con la voz de marca.
  estado [<id>] [--cliente hookhouse]     Lista trabajos o muestra uno.
  reintentar <id>                          Continúa un trabajo fallido desde el paso que falló.
  rehacer-subtitulos <id>                  Rehace subtítulos, render y control desde work/transcript.json
                                           (por ejemplo, tras corregir a mano una palabra). No vuelve a pagar.
  elevenlabs                               Comprueba la clave y muestra el plan y el uso reales de ElevenLabs.
  aprobar <id>                             Aprueba el plan (output/plan.md) de un trabajo en pausa y continúa.
  cancelar <id>                            Pide cancelar un trabajo en curso.

Opciones de procesado:
  --formato vertical|horizontal|cuadrado   (por defecto: el del perfil del cliente)
  --modo palabra|palabra-activa|grupos|frases|dinamico
  --intensidad sutil|dinamica|alto-impacto
  --reencuadre cover|blur-fill|contain  --foco-x 0..1  --foco-y 0..1
  --desde <s> --hasta <s>                  Recorte del original (no destructivo)
  --estimar-palabras                       Permite tiempos por palabra estimados a partir de un SRT
  --sin-normalizar                         No normaliza la sonoridad
  --sin-transcripcion                      No transcribe aunque no haya SRT (el vídeo sale sin subtítulos)
  --cortar-silencios | --sin-cortes        Quita (o no) los silencios sin voz (por defecto: perfil del cliente)
  --seguir-caras | --foco-fijo             El encuadre sigue a la cara principal, o usa --foco-x/--foco-y fijos
  --reducir-ruido                          Reducción de ruido básica (afftdn); no es restauración profesional

Edición inteligente (Etapa 3):
  --edicion talking-head|podcast|clips|anuncio|educativo   Tipo de vídeo y reglas editoriales
  --clips N --clip-min S --clip-max S       Número y duración de los clips candidatos
  --corto 30,60                            Versiones cortas del vídeo (segundos)
  --con-principal | --sin-principal        Entregar también el vídeo completo en modos de clips
  --broll | --sin-broll                    B-roll de la biblioteca autorizada (library/, clients/<id>/library/)
  --musica [--musica-id ID] | --sin-musica Música autorizada de la biblioteca, con atenuación bajo la voz
  --planificador local|claude              Claude solo elige fragmentos; requiere ANTHROPIC_API_KEY
  --aprobar-plan                           Para tras el plan hasta ejecutar "aprobar <id>"
  --idioma es|en|…                         Idioma de la transcripción (por defecto el del perfil)

Transcripción: si no hay SRT/VTT/JSON, se transcribe con ElevenLabs Scribe (ELEVENLABS_API_KEY en .env).
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
  if (v["sin-transcripcion"]) o.transcribe = false;
  if (v["cortar-silencios"]) o.cutSilences = true;
  if (v["sin-cortes"]) o.cutSilences = false;
  if (v["seguir-caras"]) o.followFaces = true;
  if (v["foco-fijo"]) o.followFaces = false;
  if (v["reducir-ruido"]) o.audio = { ...(o.audio as object), denoise: "suave" };
  if (v.edicion) o.editMode = v.edicion;
  const clips: Record<string, number> = {};
  if (v.clips) clips.count = Number(v.clips);
  if (v["clip-min"]) clips.minSec = Number(v["clip-min"]);
  if (v["clip-max"]) clips.maxSec = Number(v["clip-max"]);
  if (Object.keys(clips).length) o.clips = clips;
  if (typeof v.corto === "string") o.shortVersions = v.corto.split(",").map(Number);
  if (v["con-principal"]) o.keepPrincipal = true;
  if (v["sin-principal"]) o.keepPrincipal = false;
  if (v.broll) o.broll = true;
  if (v["sin-broll"]) o.broll = false;
  if (v.musica || v["musica-id"]) o.music = true;
  if (typeof v["musica-id"] === "string") o.musicId = v["musica-id"];
  if (v["sin-musica"]) o.music = false;
  if (v.planificador) o.planner = v.planificador;
  if (v["aprobar-plan"]) o.approvePlan = true;
  if (v.idioma) o.language = v.idioma;
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
      "sin-transcripcion": { type: "boolean" },
      "cortar-silencios": { type: "boolean" },
      "sin-cortes": { type: "boolean" },
      "seguir-caras": { type: "boolean" },
      "foco-fijo": { type: "boolean" },
      "reducir-ruido": { type: "boolean" },
      edicion: { type: "string" },
      clips: { type: "string" },
      "clip-min": { type: "string" },
      "clip-max": { type: "string" },
      corto: { type: "string" },
      "con-principal": { type: "boolean" },
      "sin-principal": { type: "boolean" },
      broll: { type: "boolean" },
      "sin-broll": { type: "boolean" },
      musica: { type: "boolean" },
      "musica-id": { type: "string" },
      "sin-musica": { type: "boolean" },
      planificador: { type: "string" },
      "aprobar-plan": { type: "boolean" },
      guion: { type: "string" },
      brief: { type: "string" },
      tipo: { type: "string" },
      segundos: { type: "string" },
      voz: { type: "string" },
      tiempos: { type: "string" },
      etiqueta: { type: "string" },
      texto: { type: "string" },
      idioma: { type: "string" },
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
    case "rehacer-subtitulos": {
      const j = await findJob(cfg, positionals[0] ?? "");
      const job = await redoCaptions(cfg, j.clientId, j.id);
      printResult(cfg, job);
      process.exitCode = job.status === "fallido" ? 1 : 0;
      return;
    }
    case "elevenlabs": {
      if (!cfg.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY no está configurada: añádela a .env (ver .env.example). Nunca la pegues en un chat.");
      const el = createElevenLabsClient({ apiKey: cfg.ELEVENLABS_API_KEY, baseUrl: cfg.ELEVENLABS_BASE_URL, retries: 1, timeoutMs: 30_000 });
      const sub = await el.subscription();
      console.log(`Clave válida. Plan: ${sub.tier} (${sub.status})`);
      console.log(`Créditos usados en el periodo: ${sub.character_count} de ${sub.character_limit}`);
      if (sub.next_character_count_reset_unix) console.log(`Próximo reinicio: ${new Date(sub.next_character_count_reset_unix * 1000).toISOString()}`);
      console.log(`Transcrito hoy por Autopilot: ${Math.round(await usedSecondsToday(cfg))} s de ${cfg.HH_STT_MAX_SECONDS_PER_DAY} s permitidos`);
      return;
    }
    case "aprobar": {
      const j = await findJob(cfg, positionals[0] ?? "");
      const job = await approvePlan(cfg, j.clientId, j.id);
      printResult(cfg, job);
      process.exitCode = job.status === "fallido" ? 1 : 0;
      return;
    }
    case "crear": {
      const job = await submitCreation(cfg, {
        clientId: values.cliente!,
        script: values.guion ?? null,
        brief: values.brief ?? null,
        type: values.tipo ?? "redes",
        seconds: values.segundos ? Number(values.segundos) : 30,
        audio: values.voz ?? null,
        timings: values.tiempos ?? null,
        label: values.etiqueta ?? "",
      });
      printResult(cfg, job);
      process.exitCode = job.status === "fallido" ? 1 : 0;
      return;
    }
    case "narrar": {
      if (!values.texto) throw new Error("Falta --texto");
      const profile = await loadProfile(cfg.HH_CLIENTS_DIR, values.cliente!);
      const n = await narrate({ cfg, profile, jobId: "cli", text: values.texto, log: console.log });
      console.log(`${n.cached ? "Reutilizada de caché" : "Generada"}: ${path.relative(process.cwd(), n.audio)} (${n.words.length} palabras con tiempos en el .json de al lado)`);
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
