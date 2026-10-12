import { promises as fs } from "node:fs";
import path from "node:path";
import { loadCaptionsFile, normalize } from "../../captions/load";
import { prepareWorkingCopy } from "../../media/prepare";
import { loudness, probe, silences, volumeStats } from "../../media/probe";
import { ProviderError } from "../../transcription/elevenlabs";
import { localAsrAvailable, transcribeLocal } from "../../transcription/local";
import { extractSpeechAudio, lowConfidence, transcribeWithElevenLabs, transcriptSchema, type Transcript } from "../../transcription/transcribe";
import { runOk } from "../../util/exec";
import { exists, readJson, writeJsonAtomic } from "../../util/fs";
import { StepError, videoInput, W, warn, type Analysis, type Ctx, type Prepared, type SourceCaptions } from "../context";

// Pasos sobre el material de origen: análisis del original, copia de trabajo y subtítulos/transcripción.

export const analyze = async (ctx: Ctx) => {
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
    if (vol.maxDb !== null && vol.maxDb >= -0.1) {
      warn(ctx, "analyze", "audio_saturado", "El audio del original llega a 0 dBFS: puede tener saturación (no se puede reparar con normalización)");
    }
  } else {
    warn(ctx, "analyze", "sin_audio", "El vídeo no tiene pista de audio: el entregable será mudo y no se puede transcribir");
  }
  const analysis: Analysis = { original, loudness: ld, volume: vol, silences: sil };
  await writeJsonAtomic(W(ctx, "analysis.json"), analysis);
};

// Copia de trabajo normalizada (el original no se toca)
export const prepare = async (ctx: Ctx) => {
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
    denoise: audio.denoise,
    targetLufs: audio.targetLufs,
    truePeakDb: audio.truePeakDb,
  });
  await fs.rename(tmp, W(ctx, "source.mp4"));
  for (const n of r.notes) warn(ctx, "prepare", "audio", n);
  const p = await probe(W(ctx, "source.mp4"));
  const out: Prepared = { ...r, probe: p, startSec: trim.startSec, durationSec: p.durationSec };
  await writeJsonAtomic(W(ctx, "prepare.json"), out);
};

// Transcripción del tramo editado. Orden: work/transcript.json existente (quizá corregido a mano, sin
// coste) → proveedor del cliente (ElevenLabs, o local en este equipo) → nada (se avisa y el vídeo sale sin
// subtítulos). Con ElevenLabs y sin clave, se usa la transcripción local si está instalada (npm run setup:asr).
const getTranscript = async (ctx: Ctx, prep: Prepared): Promise<Transcript | null> => {
  const file = W(ctx, "transcript.json");
  if (exists(file)) {
    const parsed = transcriptSchema.safeParse(await readJson(file));
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      throw new StepError("transcripcion_editada", `work/transcript.json no es válido tras editarlo: ${i?.path.join(".")} ${i?.message}`);
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
  const local = t.provider === "local" || (!ctx.cfg.ELEVENLABS_API_KEY && localAsrAvailable(ctx.cfg));
  if (local) {
    if (!localAsrAvailable(ctx.cfg)) {
      warn(ctx, "captions", "sin_subtitulos", "Sin subtítulos: la transcripción local no está instalada (npm run setup:asr)");
      return null;
    }
    if (t.provider !== "local") ctx.log.info("ELEVENLABS_API_KEY no está configurada: se transcribe en local");
    const wav = W(ctx, "stt-audio.wav");
    await runOk("ffmpeg", ["-v", "error", "-y", "-i", W(ctx, "source.mp4"), "-vn", "-map_metadata", "-1", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
    let tr: Transcript;
    try {
      tr = await transcribeLocal({ cfg: ctx.cfg, audioWav: wav, workDir: W(ctx), log: (m) => ctx.log.info(m) });
    } catch (e) {
      throw new StepError("transcripcion_local", `La transcripción local falló: ${(e as Error).message.slice(0, 300)}`);
    }
    await writeJsonAtomic(file, tr);
    return tr;
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

// Subtítulos del cliente o transcripción, en el tiempo de la copia de trabajo (ya recortada)
export const captions = async (ctx: Ctx) => {
  const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
  const durMs = prep.durationSec * 1000;
  const input = ctx.job.inputs.find((i) => i.role === "captions");
  let out: SourceCaptions = { none: true };
  if (input) {
    const loaded = await loadCaptionsFile(path.join(ctx.dir, input.path), (prep.startSec + prep.durationSec) * 1000);
    // Los tiempos del cliente están en el original: se llevan al eje de la copia de trabajo (recorte inicial)
    const shift = prep.startSec * 1000;
    const items = loaded.items
      .map((x) => ({ text: x.text, startMs: x.startMs - shift, endMs: Math.min(x.endMs - shift, durMs) }))
      .filter((x) => x.endMs > 0 && x.startMs < durMs)
      .map((x) => ({ ...x, startMs: Math.max(0, x.startMs) }));
    if (!items.length) throw new StepError("subtitulos_vacios", "Ningún subtítulo cae dentro del tramo del vídeo");
    out = { none: false, ...loaded, items, transcription: null, events: [] };
  } else {
    const transcript = await getTranscript(ctx, prep);
    if (transcript) {
      const warnings: string[] = [];
      const items = normalize(transcript.words, durMs, warnings);
      const low = lowConfidence(transcript, ctx.profile.defaults.transcription.lowConfidenceLogprob);
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
      if (items.length) {
        out = {
          none: false,
          precision: "word",
          items,
          warnings,
          source: transcript.provider,
          events: transcript.events.map((e) => ({ startMs: e.startMs, endMs: e.endMs })),
          // normalize() conserva el orden de las palabras; se emparejan por inicio
          speakers: items.map((it) => transcript.words.find((w) => w.startMs === it.startMs)?.speaker ?? null),
          transcription: {
            provider: transcript.provider,
            model: transcript.model,
            source: transcript.source,
            words: transcript.words.length,
            withConfidence: transcript.words.filter((w) => w.logprob !== null).length,
            lowConfidence: low.map((w) => ({ text: w.text, startMs: w.startMs })),
          },
        };
      } else warn(ctx, "captions", "sin_voz", "La transcripción no contiene palabras (¿vídeo sin voz?)");
    }
  }
  if (out.none && ctx.job.config.captionsRequired) throw new StepError("sin_subtitulos", "El vídeo no tiene subtítulos y son obligatorios para este cliente");
  await writeJsonAtomic(W(ctx, "source-captions.json"), out);
};
