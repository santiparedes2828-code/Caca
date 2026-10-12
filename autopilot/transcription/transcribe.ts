import { appendFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Config } from "../config";
import { probe } from "../media/probe";
import { runOk } from "../util/exec";
import { ensureDir, exists, readJson, sha256, sha256File, writeJsonAtomic } from "../util/fs";
import { createElevenLabsClient, ProviderError, type SttResponse } from "./elevenlabs";

// Transcripción con tiempos por palabra. Formato propio (work/transcript.json), editable a mano:
// se puede corregir el texto de cualquier palabra y rehacer los subtítulos sin volver a pagar.

export const transcriptSchema = z.object({
  provider: z.string(),
  model: z.string(),
  languageCode: z.string().nullable(),
  languageProbability: z.number().nullable(),
  audioDurationSec: z.number().nullable(),
  source: z.enum(["api", "cache"]),
  transcriptionId: z.string().nullable(),
  words: z.array(
    z.object({
      text: z.string().min(1),
      startMs: z.number().min(0),
      endMs: z.number().min(0),
      speaker: z.string().nullable(),
      logprob: z.number().nullable(),
    }),
  ),
  events: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
});
export type Transcript = z.infer<typeof transcriptSchema>;

export const fromElevenLabs = (r: SttResponse, model: string, source: "api" | "cache"): Transcript => {
  const timed = r.words.filter((w) => w.start != null && w.end != null);
  return {
    provider: "elevenlabs",
    model,
    languageCode: r.language_code,
    languageProbability: r.language_probability,
    audioDurationSec: r.audio_duration_secs ?? null,
    source,
    transcriptionId: r.transcription_id ?? null,
    words: timed
      .filter((w) => w.type === "word" && w.text.trim())
      .map((w) => ({
        text: w.text.trim(),
        startMs: Math.round(w.start! * 1000),
        endMs: Math.round(w.end! * 1000),
        speaker: w.speaker_id ?? null,
        logprob: w.logprob ?? null,
      })),
    events: timed.filter((w) => w.type === "audio_event").map((w) => ({ text: w.text, startMs: Math.round(w.start! * 1000), endMs: Math.round(w.end! * 1000) })),
  };
};

// Solo se envía a ElevenLabs la pista de audio (mono, 16 kHz, sin metadatos) del tramo que se va a editar
export const extractSpeechAudio = async (video: string, out: string) => {
  await runOk("ffmpeg", ["-v", "error", "-y", "-i", video, "-vn", "-map_metadata", "-1", "-ac", "1", "-ar", "16000", "-c:a", "aac", "-b:a", "64k", out]);
  return out;
};

// Registro de uso (data/usage/elevenlabs-stt.jsonl) para el presupuesto diario y la auditoría de costes
type UsageLine = { t: string; clientId: string; jobId: string; seconds: number; model: string; cached: boolean };
const ledgerFile = (cfg: Config) => path.join(cfg.HH_DATA_DIR, "usage", "elevenlabs-stt.jsonl");

export const usedSecondsToday = async (cfg: Config) => {
  const today = new Date().toISOString().slice(0, 10);
  const text = await fs.readFile(ledgerFile(cfg), "utf8").catch(() => "");
  return text
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as UsageLine)
    .filter((l) => !l.cached && l.t.startsWith(today))
    .reduce((n, l) => n + l.seconds, 0);
};

const recordUsage = async (cfg: Config, line: UsageLine) => {
  await ensureDir(path.dirname(ledgerFile(cfg)));
  appendFileSync(ledgerFile(cfg), JSON.stringify(line) + "\n");
};

export type TranscribeResult = { transcript: Transcript; billedSeconds: number; notes: string[] };

export const transcribeWithElevenLabs = async (opts: {
  cfg: Config;
  clientId: string;
  jobId: string;
  audio: string; // salida de extractSpeechAudio
  model: string;
  language: string | null;
  diarize: boolean;
  tagAudioEvents: boolean;
  log?: (m: string) => void;
  signal?: AbortSignal;
}): Promise<TranscribeResult> => {
  const { cfg } = opts;
  const notes: string[] = [];
  const dur = (await probe(opts.audio)).durationSec;

  // Caché por cliente: mismo audio + mismos parámetros = misma transcripción, sin volver a pagar
  const key = sha256(
    JSON.stringify({ audio: await sha256File(opts.audio), model: opts.model, language: opts.language, diarize: opts.diarize, events: opts.tagAudioEvents }),
  );
  const cacheDir = path.join(cfg.HH_DATA_DIR, "clients", opts.clientId, "cache", "stt");
  const cacheFile = path.join(cacheDir, `${key}.json`);
  if (exists(cacheFile)) {
    const raw = await readJson<SttResponse>(cacheFile);
    notes.push("Transcripción reutilizada de la caché (sin coste)");
    await recordUsage(cfg, { t: new Date().toISOString(), clientId: opts.clientId, jobId: opts.jobId, seconds: dur, model: opts.model, cached: true });
    return { transcript: fromElevenLabs(raw, opts.model, "cache"), billedSeconds: 0, notes };
  }

  if (!cfg.ELEVENLABS_API_KEY) throw new ProviderError("sin_clave", "ELEVENLABS_API_KEY no está configurada", false);
  if (dur > cfg.HH_STT_MAX_SECONDS_PER_JOB) {
    throw new ProviderError("presupuesto", `El audio dura ${Math.round(dur)} s y el límite por trabajo es ${cfg.HH_STT_MAX_SECONDS_PER_JOB} s (HH_STT_MAX_SECONDS_PER_JOB)`, false);
  }
  const today = await usedSecondsToday(cfg);
  if (today + dur > cfg.HH_STT_MAX_SECONDS_PER_DAY) {
    throw new ProviderError(
      "presupuesto",
      `Hoy ya se han transcrito ${Math.round(today)} s; este audio (${Math.round(dur)} s) supera el límite diario de ${cfg.HH_STT_MAX_SECONDS_PER_DAY} s (HH_STT_MAX_SECONDS_PER_DAY)`,
      false,
    );
  }

  const client = createElevenLabsClient({ apiKey: cfg.ELEVENLABS_API_KEY!, baseUrl: cfg.ELEVENLABS_BASE_URL, retries: cfg.HH_STT_RETRIES, timeoutMs: cfg.HH_STT_TIMEOUT_MS });
  opts.log?.(`Transcribiendo ${dur.toFixed(1)} s de audio con ElevenLabs (${opts.model}${opts.language ? `, ${opts.language}` : ""})…`);
  const raw = await client.transcribe({
    file: opts.audio,
    model: opts.model,
    language: opts.language,
    diarize: opts.diarize,
    tagAudioEvents: opts.tagAudioEvents,
    signal: opts.signal,
    onRetry: (n, wait, reason) => {
      notes.push(`Reintento ${n} tras ${reason}`);
      opts.log?.(`ElevenLabs: reintento ${n} en ${Math.round(wait / 1000)} s (${reason})`);
    },
  });
  await ensureDir(cacheDir);
  await writeJsonAtomic(cacheFile, raw);
  const billed = raw.audio_duration_secs ?? dur;
  await recordUsage(cfg, { t: new Date().toISOString(), clientId: opts.clientId, jobId: opts.jobId, seconds: billed, model: opts.model, cached: false });
  return { transcript: fromElevenLabs(raw, opts.model, "api"), billedSeconds: billed, notes };
};

// Palabras con baja confianza (logprob bajo): candidatas a error de transcripción
export const lowConfidence = (t: Transcript, threshold: number) => t.words.filter((w) => w.logprob !== null && w.logprob < threshold);
