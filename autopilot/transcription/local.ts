import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { pythonExecutable, ROOT, type Config } from "../config";
import { runOk } from "../util/exec";
import type { Transcript } from "./transcribe";

// Transcripción local con tiempos por palabra: sherpa-onnx + NVIDIA Parakeet TDT 0.6B v3 (25 idiomas europeos,
// detecta el idioma). El audio no sale del equipo. Se instala con `npm run setup:asr` (modelo en models/asr/).

export const LOCAL_ASR_MODEL = "parakeet-tdt-0.6b-v3-int8 (sherpa-onnx)";
const MODEL_FILES = ["encoder.int8.onnx", "decoder.int8.onnx", "joiner.int8.onnx", "tokens.txt"];

export const localAsrAvailable = (cfg: Config) => MODEL_FILES.every((f) => existsSync(path.join(cfg.HH_ASR_MODEL_DIR, f)));

type Raw = { text: string; tokens: string[]; timestamps: number[]; durations: number[]; logprobs: number[]; lang: string | null; audioDurationSec: number };

// Une los tokens del modelo en palabras: un token que empieza por espacio abre palabra; la puntuación y los trozos
// sin espacio se pegan a la anterior. Inicio = primer token; fin = último token + su duración (sin pisar la siguiente).
export const tokensToWords = (raw: Pick<Raw, "tokens" | "timestamps" | "durations" | "logprobs">) => {
  const words: { text: string; startMs: number; endMs: number; logprobs: number[] }[] = [];
  raw.tokens.forEach((tk, i) => {
    const t = raw.timestamps[i] ?? 0;
    const d = raw.durations[i] ?? 0;
    const lp = raw.logprobs[i];
    const cur = words[words.length - 1];
    if (!cur || tk.startsWith(" ")) {
      words.push({ text: tk.trim(), startMs: t * 1000, endMs: (t + Math.max(d, 0.04)) * 1000, logprobs: lp === undefined ? [] : [lp] });
    } else {
      cur.text += tk;
      cur.endMs = Math.max(cur.endMs, (t + Math.max(d, 0.04)) * 1000);
      if (lp !== undefined) cur.logprobs.push(lp);
    }
  });
  const out = words.filter((w) => /[\p{L}\p{N}]/u.test(w.text));
  return out.map((w, i) => {
    const next = out[i + 1];
    const startMs = Math.round(w.startMs);
    const endMs = Math.round(Math.max(w.startMs + 50, next ? Math.min(w.endMs, next.startMs) : w.endMs));
    const logprob = w.logprobs.length ? Number((w.logprobs.reduce((a, b) => a + b, 0) / w.logprobs.length).toFixed(3)) : null;
    return { text: w.text, startMs, endMs, speaker: null, logprob };
  });
};

export const transcribeLocal = async (opts: { cfg: Config; audioWav: string; workDir: string; log?: (m: string) => void }): Promise<Transcript> => {
  const out = path.join(opts.workDir, "stt-local.json");
  opts.log?.(`Transcribiendo en local (${LOCAL_ASR_MODEL}); el audio no sale de este equipo…`);
  await runOk(pythonExecutable(opts.cfg), ["-I", path.join(ROOT, "scripts", "transcribir_local.py"), opts.audioWav, opts.cfg.HH_ASR_MODEL_DIR, out], { timeoutMs: 20 * 60_000 });
  const raw = JSON.parse(await fs.readFile(out, "utf8")) as Raw;
  return {
    provider: "local",
    model: LOCAL_ASR_MODEL,
    languageCode: raw.lang,
    languageProbability: null,
    audioDurationSec: raw.audioDurationSec,
    source: "local",
    transcriptionId: null,
    words: tokensToWords(raw),
    events: [],
  };
};
