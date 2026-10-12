import { appendFileSync, promises as fs } from "node:fs";
import path from "node:path";
import type { TimedWord } from "../../src/autopilot/paginate";
import type { ClientProfile } from "../clients/profile";
import type { Config } from "../config";
import { createElevenLabsClient, ProviderError, type TtsResponse } from "../transcription/elevenlabs";
import { ensureDir, exists, readJson, sha256, writeJsonAtomic } from "../util/fs";

// Narración con la voz de marca (ElevenLabs text-to-speech con tiempos por carácter).
// Los tiempos por palabra salen de la alineación que devuelve ElevenLabs: precisión real, no estimada.

export type Narration = { audio: string; words: TimedWord[]; chars: number; cached: boolean; voice: string; model: string };

// Caracteres con tiempo → palabras (se agrupan entre espacios)
export const alignmentToWords = (a: NonNullable<TtsResponse["alignment"]>): TimedWord[] => {
  const out: TimedWord[] = [];
  let cur: { text: string; s: number; e: number } | null = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) out.push({ text: cur.text, startMs: Math.round(cur.s * 1000), endMs: Math.round(cur.e * 1000) });
      cur = null;
      return;
    }
    const s = a.character_start_times_seconds[i];
    const e = a.character_end_times_seconds[i];
    cur = cur ? { text: cur.text + ch, s: cur.s, e } : { text: ch, s, e };
  });
  if (cur) {
    const c = cur as { text: string; s: number; e: number };
    out.push({ text: c.text, startMs: Math.round(c.s * 1000), endMs: Math.round(c.e * 1000) });
  }
  return out;
};

const ledger = (cfg: Config) => path.join(cfg.HH_DATA_DIR, "usage", "elevenlabs-tts.jsonl");

export const ttsCharsToday = async (cfg: Config) => {
  const day = new Date().toISOString().slice(0, 10);
  const txt = await fs.readFile(ledger(cfg), "utf8").catch(() => "");
  return txt
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { t: string; chars: number; cached: boolean })
    .filter((l) => !l.cached && l.t.startsWith(day))
    .reduce((n, l) => n + l.chars, 0);
};

export const narrate = async (opts: { cfg: Config; profile: ClientProfile; jobId: string; text: string; log?: (m: string) => void }): Promise<Narration> => {
  const { cfg, profile } = opts;
  const voice = profile.defaults.voice;
  if (!voice) throw new ProviderError("sin_voz", `El cliente ${profile.id} no tiene voz configurada (defaults.voice)`, false);
  const text = opts.text.replace(/\s+/g, " ").trim();
  if (!text) throw new ProviderError("sin_texto", "No hay texto que narrar", false);
  const settings = { stability: 0.5, similarity_boost: 0.8, style: 0, speed: 1 };
  const outputFormat = "mp3_44100_128";
  const key = sha256(JSON.stringify({ text, voice: voice.voiceId, model: voice.model, language: voice.language, settings, outputFormat }));
  const dir = path.join(cfg.HH_DATA_DIR, "clients", profile.id, "cache", "tts");
  const audio = path.join(dir, `${key}.mp3`);
  const meta = path.join(dir, `${key}.json`);
  const record = async (chars: number, cached: boolean) => {
    await ensureDir(path.dirname(ledger(cfg)));
    appendFileSync(ledger(cfg), JSON.stringify({ t: new Date().toISOString(), clientId: profile.id, jobId: opts.jobId, chars, cached }) + "\n");
  };
  if (exists(audio) && exists(meta)) {
    await record(text.length, true);
    return { audio, words: await readJson<TimedWord[]>(meta), chars: text.length, cached: true, voice: voice.name, model: voice.model };
  }
  if (!cfg.ELEVENLABS_API_KEY) throw new ProviderError("sin_clave", "ELEVENLABS_API_KEY no está configurada (ver .env.example)", false);
  if (text.length > cfg.HH_TTS_MAX_CHARS_PER_JOB) {
    throw new ProviderError("presupuesto", `El texto tiene ${text.length} caracteres; el límite por trabajo es ${cfg.HH_TTS_MAX_CHARS_PER_JOB} (HH_TTS_MAX_CHARS_PER_JOB)`, false);
  }
  const today = await ttsCharsToday(cfg);
  if (today + text.length > cfg.HH_TTS_MAX_CHARS_PER_DAY) {
    throw new ProviderError("presupuesto", `Hoy ya se han narrado ${today} caracteres; este texto supera el límite diario de ${cfg.HH_TTS_MAX_CHARS_PER_DAY}`, false);
  }
  opts.log?.(`Narrando ${text.length} caracteres con ElevenLabs (${voice.name}, ${voice.model})…`);
  const client = createElevenLabsClient({ apiKey: cfg.ELEVENLABS_API_KEY, baseUrl: cfg.ELEVENLABS_BASE_URL, retries: cfg.HH_STT_RETRIES, timeoutMs: cfg.HH_STT_TIMEOUT_MS });
  const r = await client.speak({ voiceId: voice.voiceId, text, model: voice.model, language: voice.language, settings, outputFormat });
  if (!r.alignment) throw new ProviderError("elevenlabs_sin_tiempos", "ElevenLabs no devolvió la alineación por caracteres", false);
  const words = alignmentToWords(r.alignment);
  await ensureDir(dir);
  await fs.writeFile(audio, Buffer.from(r.audio_base64, "base64"));
  await writeJsonAtomic(meta, words);
  await record(text.length, false);
  return { audio, words, chars: text.length, cached: false, voice: voice.name, model: voice.model };
};
