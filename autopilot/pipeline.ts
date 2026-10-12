import { promises as fs } from "node:fs";
import path from "node:path";
import type { EditProps } from "../src/autopilot/props";
import { FORMATS } from "../src/design/schema";
import { buildCaptions, type BuiltCaptions } from "./captions/build";
import { loadCaptionsFile, normalize, type LoadedCaptions } from "./captions/load";
import { loadProfile, type ClientProfile } from "./clients/profile";
import { ROOT, type Config } from "./config";
import { IngestError, storeOriginal, validateFile } from "./ingest/ingest";
import { acquireLock, cancelRequested, CANCEL_FILE, createJob, jobDir, loadJob, saveJob } from "./jobs/store";
import { STEP_STATUS, STEPS, type Job, type JobOverrides, type StepName } from "./jobs/types";
import { prepareWorkingCopy, type PrepareResult } from "./media/prepare";
import { loudness, probe, silences, volumeStats, type ProbeResult } from "./media/probe";
import { runQc, type QcResult } from "./qc/qc";
import { reportMarkdown } from "./qc/report";
import { startAssetServer } from "./render/assetServer";
import { getBundle } from "./render/bundle";
import { renderEdit } from "./render/render";
import { ProviderError } from "./transcription/elevenlabs";
import { extractSpeechAudio, lowConfidence, transcribeWithElevenLabs, transcriptSchema, type Transcript } from "./transcription/transcribe";
import { runOk } from "./util/exec";
import { exists, readJson, resolveInside, sha256, writeJsonAtomic, writeTextAtomic } from "./util/fs";
import { createLogger, redact, type Logger } from "./util/log";

// Orquestación de UN trabajo de edición (Etapa 1). Cada paso deja sus resultados en work/ y se marca
// como hecho en job.json; si el proceso se corta o falla, `retry` continúa desde el primer paso
// pendiente o cuyo resultado falte, sin repetir lo que ya está bien.

type Ctx = { cfg: Config; job: Job; dir: string; profile: ClientProfile; log: Logger };

const W = (ctx: Ctx, ...p: string[]) => path.join(ctx.dir, "work", ...p);
const O = (ctx: Ctx, ...p: string[]) => path.join(ctx.dir, "output", ...p);

// Artefactos que deja cada paso: si falta alguno, el paso (y los siguientes) se repiten
const ARTIFACTS: Record<StepName, string[]> = {
  ingest: [],
  analyze: ["work/analysis.json"],
  prepare: ["work/source.mp4", "work/prepare.json"],
  captions: ["work/captions.json"],
  compose: ["work/props.json"],
  render: ["work/render.mp4"],
  qc: ["work/qc.json"],
  deliver: ["output/informe.md"],
};

const PROGRESS: Record<StepName, number> = {
  ingest: 0.05,
  analyze: 0.1,
  prepare: 0.2,
  captions: 0.25,
  compose: 0.3,
  render: 0.85,
  qc: 0.95,
  deliver: 1,
};

export class StepError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const warn = (ctx: Ctx, step: StepName, code: string, message: string) => {
  if (!ctx.job.warnings.some((w) => w.step === step && w.message === message)) ctx.job.warnings.push({ step, code, message });
  ctx.log.warn(message, { step, code });
};

const videoInput = (job: Job) => {
  const v = job.inputs.find((i) => i.role === "video");
  if (!v) throw new StepError("sin_video", "El trabajo no tiene vídeo de entrada");
  return v;
};

type Analysis = {
  original: ProbeResult;
  loudness: Awaited<ReturnType<typeof loudness>>;
  volume: Awaited<ReturnType<typeof volumeStats>> | null;
  silences: { count: number; totalSec: number; longestSec: number };
};
type Prepared = PrepareResult & { probe: ProbeResult; startSec: number; durationSec: number };
type CaptionsTranscription = {
  provider: string;
  model: string;
  source: "api" | "cache";
  words: number;
  withConfidence: number;
  lowConfidence: { text: string; startMs: number }[];
};
type CaptionsArtifact = { none: true } | ({ none: false; transcription?: CaptionsTranscription | null } & BuiltCaptions);

// Transcripción del tramo editado. Orden: work/transcript.json existente (quizá corregido a mano, sin
// coste) → proveedor del cliente (ElevenLabs) → nada (se avisa y el vídeo sale sin subtítulos).
const getTranscript = async (ctx: Ctx, prep: Prepared): Promise<Transcript | null> => {
  const file = W(ctx, "transcript.json");
  if (exists(file)) {
    const parsed = transcriptSchema.safeParse(await readJson(file));
    if (!parsed.success) {
      throw new StepError("transcripcion_editada", `work/transcript.json no es válido tras editarlo: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`);
    }
    ctx.log.info("Usando la transcripción ya guardada en work/transcript.json (sin nueva llamada a la API)");
    return parsed.data;
  }
  const t = ctx.profile.defaults.transcription;
  if (!ctx.job.config.transcribe || t.provider === "ninguno") {
    warn(ctx, "captions", "sin_subtitulos", "No se ha recibido SRT/VTT/JSON y la transcripción automática está desactivada para este trabajo");
    return null;
  }
  if (!prep.probe.audio) {
    warn(ctx, "captions", "sin_subtitulos", "Sin pista de audio: no hay nada que transcribir");
    return null;
  }
  if (!ctx.cfg.ELEVENLABS_API_KEY) {
    warn(
      ctx,
      "captions",
      "sin_subtitulos",
      "Sin subtítulos: no se ha recibido SRT/VTT/JSON y ELEVENLABS_API_KEY no está configurada (ver .env.example). Añade un SRT o configura la clave y usa `reintentar`/`rehacer-subtitulos`",
    );
    return null;
  }
  const audio = await extractSpeechAudio(W(ctx, "source.mp4"), W(ctx, "stt-audio.m4a"));
  let r;
  try {
    r = await transcribeWithElevenLabs({
      cfg: ctx.cfg,
      clientId: ctx.job.clientId,
      jobId: ctx.job.id,
      audio,
      model: t.model,
      language: ctx.job.config.language,
      diarize: t.diarize,
      tagAudioEvents: t.tagAudioEvents,
      log: (m) => ctx.log.info(m),
    });
  } catch (e) {
    if (e instanceof ProviderError) throw new StepError(e.code, e.message);
    throw e;
  }
  for (const n of r.notes) ctx.log.info(n);
  if (r.billedSeconds > 0) {
    ctx.job.costs.real.push({
      provider: "elevenlabs",
      amount: Number(r.billedSeconds.toFixed(2)),
      unit: "s de audio transcrito (audio_duration_secs de la respuesta)",
      note: `speech-to-text ${t.model}`,
    });
    if (ctx.cfg.HH_ELEVENLABS_STT_USD_PER_HOUR) {
      ctx.job.costs.estimated.push({
        provider: "elevenlabs",
        amount: Number(((r.billedSeconds / 3600) * ctx.cfg.HH_ELEVENLABS_STT_USD_PER_HOUR).toFixed(4)),
        unit: "USD",
        note: "estimación con HH_ELEVENLABS_STT_USD_PER_HOUR (precio de tu plan; no verificado con la factura)",
      });
    }
  }
  await writeJsonAtomic(file, r.transcript);
  return r.transcript;
};

const STEP_IMPL: Record<Exclude<StepName, "ingest">, (ctx: Ctx) => Promise<void>> = {
  // Análisis técnico del original (sin modificarlo)
  analyze: async (ctx) => {
    const file = path.join(ctx.dir, videoInput(ctx.job).path);
    const original = await probe(file);
    let ld = null;
    let vol = null;
    let sil = { count: 0, totalSec: 0, longestSec: 0 };
    if (original.audio) {
      ld = await loudness(file);
      vol = await volumeStats(file);
      const s = await silences(file);
      sil = {
        count: s.length,
        totalSec: Number(s.reduce((n, x) => n + x.endSec - x.startSec, 0).toFixed(2)),
        longestSec: Number(Math.max(0, ...s.map((x) => x.endSec - x.startSec)).toFixed(2)),
      };
      if (vol.maxDb !== null && vol.maxDb < -60) warn(ctx, "analyze", "audio_mudo", "La pista de audio del original está prácticamente muda");
      if (vol.maxDb !== null && vol.maxDb >= -0.1) warn(ctx, "analyze", "audio_saturado", "El audio del original llega a 0 dBFS: puede tener saturación (no se puede reparar con normalización)");
    } else {
      warn(ctx, "analyze", "sin_audio", "El vídeo no tiene pista de audio: el entregable será mudo y no se puede transcribir");
    }
    const analysis: Analysis = { original, loudness: ld, volume: vol, silences: sil };
    await writeJsonAtomic(W(ctx, "analysis.json"), analysis);
  },

  // Copia de trabajo normalizada (el original no se toca)
  prepare: async (ctx) => {
    const a = await readJson<Analysis>(W(ctx, "analysis.json"));
    const { trim, fps, audio } = ctx.job.config;
    const end = Math.min(trim.endSec ?? a.original.durationSec, a.original.durationSec);
    const durationSec = end - trim.startSec;
    if (durationSec < 0.5) throw new StepError("recorte", `El recorte deja ${durationSec.toFixed(2)} s de vídeo`);
    const tmp = W(ctx, "source.partial.mp4");
    const r = await prepareWorkingCopy({
      input: path.join(ctx.dir, videoInput(ctx.job).path),
      output: tmp,
      probe: a.original,
      fps,
      startSec: trim.startSec,
      durationSec,
      normalize: audio.normalize,
      targetLufs: audio.targetLufs,
      truePeakDb: audio.truePeakDb,
    });
    await fs.rename(tmp, W(ctx, "source.mp4"));
    for (const n of r.notes) warn(ctx, "prepare", "audio", n);
    const p = await probe(W(ctx, "source.mp4"));
    const out: Prepared = { ...r, probe: p, startSec: trim.startSec, durationSec: p.durationSec };
    await writeJsonAtomic(W(ctx, "prepare.json"), out);
  },

  // Subtítulos: SRT/VTT/JSON del cliente → formato interno → páginas + SRT del vídeo final
  captions: async (ctx) => {
    const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
    const input = ctx.job.inputs.find((i) => i.role === "captions");
    let loaded: LoadedCaptions | null = null;
    let trimStartMs = prep.startSec * 1000;
    let transcription: CaptionsTranscription | null = null;
    if (input) {
      loaded = await loadCaptionsFile(path.join(ctx.dir, input.path), (prep.startSec + prep.durationSec) * 1000);
    } else {
      const transcript = await getTranscript(ctx, prep);
      if (transcript) {
        // La transcripción se hace sobre la copia de trabajo: sus tiempos ya están en el eje del vídeo final
        trimStartMs = 0;
        const warnings: string[] = [];
        const items = normalize(transcript.words, prep.durationSec * 1000, warnings);
        const t = ctx.profile.defaults.transcription;
        const low = lowConfidence(transcript, t.lowConfidenceLogprob);
        transcription = {
          provider: transcript.provider,
          model: transcript.model,
          source: transcript.source,
          words: transcript.words.length,
          withConfidence: transcript.words.filter((w) => w.logprob !== null).length,
          lowConfidence: low.map((w) => ({ text: w.text, startMs: w.startMs })),
        };
        if (low.length) {
          warn(
            ctx,
            "captions",
            "baja_confianza",
            `${low.length} palabras con baja confianza en la transcripción (revisa y, si hace falta, corrige work/transcript.json): ${low
              .slice(0, 12)
              .map((w) => `"${w.text}" ${(w.startMs / 1000).toFixed(1)} s`)
              .join(", ")}${low.length > 12 ? "…" : ""}`,
          );
        }
        if (items.length) loaded = { precision: "word", items, warnings, source: transcript.provider };
        else warn(ctx, "captions", "sin_voz", "La transcripción no contiene palabras (¿vídeo sin voz?)");
      }
    }
    if (!loaded) {
      if (ctx.job.config.captionsRequired) throw new StepError("sin_subtitulos", "El vídeo no tiene subtítulos y son obligatorios para este cliente");
      await writeJsonAtomic(W(ctx, "captions.json"), { none: true });
      return;
    }
    const built = buildCaptions({
      loaded,
      mode: ctx.job.config.captionMode,
      intensity: ctx.job.config.intensity,
      brand: ctx.profile.brand,
      allowEstimatedWordTiming: ctx.job.config.allowEstimatedWordTiming,
      trimStartMs,
      durationMs: prep.durationSec * 1000,
    });
    if (built.pages.length === 0) throw new StepError("subtitulos_vacios", "Ningún subtítulo cae dentro del tramo del vídeo");
    for (const w of built.warnings) warn(ctx, "captions", "subtitulos", w);
    const art: CaptionsArtifact = { none: false, ...built, transcription };
    await writeJsonAtomic(W(ctx, "captions.json"), art);
  },

  // Props de la composición (con marcadores en lugar de URLs, para que la clave de render sea estable)
  compose: async (ctx) => {
    const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
    const caps = await readJson<CaptionsArtifact>(W(ctx, "captions.json"));
    const { config } = ctx.job;
    for (const f of ctx.profile.brand.fonts) {
      if (f.src.startsWith("static:") && !exists(path.join(ROOT, "public", f.src.slice(7)))) {
        throw new StepError("recurso_faltante", `Falta la fuente de marca ${f.family} ${f.weight}: public/${f.src.slice(7)}`);
      }
    }
    const v = prep.probe.video;
    if (!v) throw new StepError("sin_video", "La copia de trabajo no tiene vídeo");
    const size = FORMATS[config.format];
    const props: EditProps = {
      fps: config.fps,
      width: size.width,
      height: size.height,
      durationInFrames: Math.max(1, Math.floor(prep.durationSec * config.fps)),
      video: { src: "job:source.mp4", width: v.width, height: v.height, hasAudio: !!prep.probe.audio, trimStartFrames: 0, volume: 1 },
      reframe: config.reframe,
      intensity: config.intensity,
      brand: ctx.profile.brand,
      captions: caps.none ? { mode: config.captionMode, pages: [] } : { mode: caps.mode, pages: caps.pages },
    };
    const srcRatio = v.width / v.height;
    const outRatio = size.width / size.height;
    if (Math.abs(srcRatio - outRatio) > 0.02 && config.reframe.mode === "cover") {
      const kept = srcRatio > outRatio ? outRatio / srcRatio : srcRatio / outRatio;
      warn(
        ctx,
        "compose",
        "reencuadre",
        `Reencuadre ${v.width}x${v.height} → ${size.width}x${size.height} recortando (se conserva el ${(kept * 100).toFixed(0)} % del ${srcRatio > outRatio ? "ancho" : "alto"}, foco x=${config.reframe.focusX}, y=${config.reframe.focusY}). Revisa que no se corten caras; sin detección de rostro hasta la Etapa 2`,
      );
    }
    await writeJsonAtomic(W(ctx, "props.json"), props);
  },

  render: async (ctx) => {
    const props = await readJson<EditProps>(W(ctx, "props.json"));
    const bundle = await getBundle((m) => ctx.log.info(m));
    const key = sha256(JSON.stringify(props) + bundle.hash + (await fs.stat(W(ctx, "source.mp4"))).size);
    if (ctx.job.renderKey === key && exists(W(ctx, "render.mp4"))) {
      ctx.log.info("Render ya hecho con las mismas entradas: no se repite");
      return;
    }
    const server = await startAssetServer({
      job: W(ctx),
      client: path.join(ctx.cfg.HH_CLIENTS_DIR, ctx.job.clientId, "assets"),
    });
    const t0 = Date.now();
    let last = 0;
    try {
      const live: EditProps = {
        ...props,
        video: { ...props.video, src: server.url("job", props.video.src.slice("job:".length)) },
        brand: {
          ...props.brand,
          fonts: props.brand.fonts.map((f) => (f.src.startsWith("client:") ? { ...f, src: `url:${server.url("client", f.src.slice(7))}` } : f)),
        },
      };
      const partial = W(ctx, "render.partial.mp4");
      await renderEdit({
        cfg: ctx.cfg,
        serveUrl: bundle.serveUrl,
        props: live,
        output: partial,
        shouldCancel: () => cancelRequested(ctx.cfg, ctx.job),
        onBrowserError: (m) => ctx.log.warn(`Navegador: ${m}`),
        onProgress: (p) => {
          if (p - last >= 0.1 || p === 1) {
            last = p;
            ctx.log.info(`Render ${(p * 100).toFixed(0)} %`);
            ctx.job.progress = PROGRESS.compose + (PROGRESS.render - PROGRESS.compose) * p;
            void saveJob(ctx.cfg, ctx.job).catch(() => undefined);
          }
        },
      });
      // moov al principio: reproducción inmediata en web/móvil
      await runOk("ffmpeg", ["-v", "error", "-y", "-i", partial, "-c", "copy", "-movflags", "+faststart", W(ctx, "render.faststart.mp4")]);
      await fs.rename(W(ctx, "render.faststart.mp4"), W(ctx, "render.mp4"));
      await fs.rm(partial, { force: true });
    } finally {
      await server.close();
    }
    ctx.job.renderKey = key;
    ctx.log.info(`Render terminado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  },

  qc: async (ctx) => {
    const props = await readJson<EditProps>(W(ctx, "props.json"));
    const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
    const caps = await readJson<CaptionsArtifact>(W(ctx, "captions.json"));
    const qcDir = O(ctx, "qc");
    await fs.mkdir(qcDir, { recursive: true });
    const qc = await runQc({
      output: W(ctx, "render.mp4"),
      source: W(ctx, "source.mp4"),
      qcDir,
      expected: { width: props.width, height: props.height, fps: props.fps, durationSec: props.durationInFrames / props.fps, hasAudio: props.video.hasAudio },
      audioTarget: { lufs: ctx.job.config.audio.targetLufs, truePeakDb: ctx.job.config.audio.truePeakDb, normalized: prep.normalized },
      captions: caps.none
        ? null
        : { pages: caps.pages, srt: caps.srt, maxCharsPerLine: ctx.profile.brand.captions.maxCharsPerLine, mode: caps.mode, transcription: caps.transcription ?? null },
      captionsRequired: ctx.job.config.captionsRequired,
      frames: ctx.cfg.HH_QC_FRAMES,
    });
    await writeJsonAtomic(W(ctx, "qc.json"), qc);
    ctx.job.verdict = qc.verdict;
    for (const c of qc.checks) ctx.log[c.status === "ok" ? "info" : "warn"](`QC ${c.status}: ${c.label} — ${c.detail}`);
  },

  // Entrega: MP4 + SRT + informe en output/. Un FALLIDO no se entrega (queda en work/ para diagnóstico).
  deliver: async (ctx) => {
    const qc = await readJson<QcResult>(W(ctx, "qc.json"));
    const caps = await readJson<CaptionsArtifact>(W(ctx, "captions.json"));
    const analysis = await readJson<Analysis>(W(ctx, "analysis.json"));
    const base = `${ctx.job.id}_${ctx.job.config.format}`;
    ctx.job.outputs = [];
    if (qc.verdict !== "FALLIDO") {
      await fs.copyFile(W(ctx, "render.mp4"), O(ctx, `${base}.mp4`));
      ctx.job.outputs.push({ kind: "video", path: `output/${base}.mp4` });
      if (!caps.none) {
        await writeTextAtomic(O(ctx, `${base}.srt`), caps.srt);
        ctx.job.outputs.push({ kind: "subtitulos_srt", path: `output/${base}.srt` });
      }
    }
    ctx.job.outputs.push({ kind: "informe", path: "output/informe.md" }, { kind: "informe_json", path: "output/informe.json" });
    if (qc.sheet) ctx.job.outputs.push({ kind: "fotogramas_qc", path: `output/qc/${qc.sheet}` });
    ctx.job.status = qc.verdict === "APROBADO" ? "completado" : qc.verdict === "ADVERTENCIA" ? "requiere_revision" : "fallido";
    if (qc.verdict === "FALLIDO") {
      const failed = qc.checks.filter((c) => c.status === "fallo").map((c) => `${c.label}: ${c.detail}`);
      ctx.job.errors.push({ step: "qc", code: "qc_fallido", message: `No entregable. ${failed.join(" · ")}` });
    }
    const o = analysis.original;
    const summary = {
      duración: `${o.durationSec.toFixed(2)} s`,
      vídeo: o.video ? `${o.video.width}x${o.video.height} · ${o.video.fps.toFixed(2)} fps · ${o.video.codec}${o.video.variableFrameRate ? " · VFR" : ""}` : "—",
      audio: o.audio ? `${o.audio.codec} · ${o.audio.channels} canales · ${o.audio.sampleRate} Hz` : "sin audio",
      sonoridad: analysis.loudness ? `${analysis.loudness.integratedLufs.toFixed(1)} LUFS · pico ${analysis.loudness.truePeakDb.toFixed(1)} dBTP` : "—",
      silencios: `${analysis.silences.count} (≥ 0,5 s) · ${analysis.silences.totalSec} s en total`,
      subtítulos: caps.none
        ? "ninguno"
        : `${caps.precision === "word" ? "por palabra" : caps.precision === "segment" ? "por bloque" : "por palabra ESTIMADOS"} · modo ${caps.mode}${caps.mode !== caps.requestedMode ? ` (pedido ${caps.requestedMode})` : ""}`,
      transcripción: caps.none || !caps.transcription
        ? "no (subtítulos aportados por el cliente o sin subtítulos)"
        : `${caps.transcription.provider} ${caps.transcription.model} · ${caps.transcription.source === "cache" ? "reutilizada de caché, sin coste" : "llamada a la API"} · ${caps.transcription.words} palabras`,
    };
    await writeJsonAtomic(O(ctx, "informe.json"), { job: ctx.job, analysis: summary, qc });
    await writeTextAtomic(O(ctx, "informe.md"), reportMarkdown(ctx.job, qc, { analysis: summary }));
  },
};

// Primer paso que hay que (re)hacer: pendiente/fallido o con algún artefacto perdido
const firstStepToRun = (ctx: Ctx) => {
  for (const s of STEPS) {
    const st = ctx.job.steps[s].status;
    if (st !== "hecho" && st !== "omitido") return s;
    if (ARTIFACTS[s].some((a) => !exists(path.join(ctx.dir, a)))) return s;
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
    const start = firstStepToRun(ctx);
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
      await saveJob(cfg, job);
    }
    log.info(`Trabajo ${job.id} terminado: ${job.status} (${job.verdict})`);
    return job;
  } finally {
    release();
  }
};

// Reintento manual: permitido tras un fallo, hasta HH_MAX_ATTEMPTS. Si falló el control de calidad,
// se recalculan subtítulos y composición y se fuerza un render nuevo (los pasos caros previos se conservan).
export const retryJob = async (cfg: Config, clientId: string, jobId: string): Promise<Job> => {
  const job = await loadJob(cfg, clientId, jobId);
  if (job.status !== "fallido" && job.status !== "cancelado") throw new Error(`El trabajo está "${job.status}": solo se reintenta si ha fallado o se canceló`);
  if (job.attempts >= cfg.HH_MAX_ATTEMPTS) throw new Error(`El trabajo ya tiene ${job.attempts} intentos (máximo ${cfg.HH_MAX_ATTEMPTS})`);
  if (job.steps.ingest.status !== "hecho") throw new Error("La ingesta falló: los archivos no son válidos. Crea un trabajo nuevo con archivos correctos");
  const dir = jobDir(cfg, clientId, jobId);
  await fs.rm(path.join(dir, CANCEL_FILE), { force: true });
  if (job.errors.at(-1)?.code === "qc_fallido") {
    job.renderKey = null;
    for (const s of ["captions", "compose", "render", "qc", "deliver"] as const) job.steps[s] = { status: "pendiente" };
    await fs.rm(path.join(dir, "work", "render.mp4"), { force: true });
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
  for (const s of ["captions", "compose", "render", "qc", "deliver"] as const) job.steps[s] = { status: "pendiente" };
  job.renderKey = null;
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
