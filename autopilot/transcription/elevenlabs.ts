import { openAsBlob } from "node:fs";
import path from "node:path";
import { z } from "zod";

// Cliente mínimo de la API REST de ElevenLabs. Contrato verificado con el SDK oficial
// @elevenlabs/elevenlabs-js 2.71.0 (capa de serialización, nombres en snake_case):
//   POST /v1/speech-to-text   multipart: model_id, file, language_code, timestamps_granularity,
//                             diarize, tag_audio_events  → SpeechToTextChunkResponseModel
//   GET  /v1/user/subscription                          → Subscription (plan, créditos)
// Autenticación: cabecera xi-api-key. La clave nunca se escribe en logs, errores ni informes.

export class ProviderError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean,
    public status: number | null = null,
  ) {
    super(message);
  }
}

const wordSchema = z.object({
  text: z.string(),
  start: z.number().nullish(),
  end: z.number().nullish(),
  type: z.enum(["word", "spacing", "audio_event"]),
  speaker_id: z.string().nullish(),
  logprob: z.number().nullish(),
});

export const sttResponseSchema = z.object({
  language_code: z.string(),
  language_probability: z.number(),
  text: z.string(),
  words: z.array(wordSchema),
  transcription_id: z.string().nullish(),
  audio_duration_secs: z.number().nullish(),
});
export type SttResponse = z.infer<typeof sttResponseSchema>;

export const subscriptionSchema = z
  .object({
    tier: z.string(),
    status: z.string(),
    character_count: z.number(),
    character_limit: z.number(),
    next_character_count_reset_unix: z.number().nullish(),
  })
  .passthrough();

// POST /v1/text-to-speech/{voice_id}/with-timestamps (AudioWithTimestampsResponse del SDK)
export const ttsResponseSchema = z.object({
  audio_base64: z.string().min(1),
  alignment: z
    .object({
      characters: z.array(z.string()),
      character_start_times_seconds: z.array(z.number()),
      character_end_times_seconds: z.array(z.number()),
    })
    .nullish(),
});
export type TtsResponse = z.infer<typeof ttsResponseSchema>;
export type TtsRequest = {
  voiceId: string;
  text: string;
  model: string;
  language: string | null;
  settings: { stability?: number; similarity_boost?: number; style?: number; speed?: number };
  outputFormat: string; // p. ej. mp3_44100_128
};

export type ElevenLabsClient = {
  speak: (opts: TtsRequest) => Promise<TtsResponse>;
  transcribe: (opts: SttRequest) => Promise<SttResponse>;
  subscription: () => Promise<z.infer<typeof subscriptionSchema>>;
};

export type SttRequest = {
  file: string;
  model: string;
  language: string | null;
  diarize: boolean;
  tagAudioEvents: boolean;
  signal?: AbortSignal;
  onRetry?: (attempt: number, waitMs: number, reason: string) => void;
};

// Mensaje de error de la API sin datos sensibles (su cuerpo suele ser {"detail":{"status","message"}})
const describe = async (r: Response) => {
  const body = await r.text().catch(() => "");
  try {
    const j = JSON.parse(body) as { detail?: { status?: string; message?: string } | string };
    const d = j.detail;
    if (typeof d === "string") return d.slice(0, 300);
    if (d) return [d.status, d.message].filter(Boolean).join(": ").slice(0, 300);
  } catch {
    /* no JSON */
  }
  return body.slice(0, 300) || r.statusText;
};

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const createElevenLabsClient = (cfg: { apiKey: string; baseUrl: string; retries: number; timeoutMs: number }): ElevenLabsClient => {
  const url = (p: string) => new URL(p, cfg.baseUrl.endsWith("/") ? cfg.baseUrl : cfg.baseUrl + "/").toString();

  // Reintenta solo cuando la API no llegó a procesar la petición (429, 5xx, red caída).
  // Un timeout del lado cliente NO se reintenta: ElevenLabs podría haberla procesado y cobrado.
  const call = async (make: () => Promise<RequestInit>, p: string, onRetry?: SttRequest["onRetry"], signal?: AbortSignal) => {
    for (let attempt = 0; ; attempt++) {
      let r: Response;
      try {
        const init = await make();
        const timeout = AbortSignal.timeout(cfg.timeoutMs);
        r = await fetch(url(p), { ...init, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      } catch (e) {
        const err = e as Error;
        if (err.name === "TimeoutError") {
          throw new ProviderError("elevenlabs_timeout", `ElevenLabs no respondió en ${Math.round(cfg.timeoutMs / 1000)} s (no se reintenta para no pagar dos veces)`, false);
        }
        if (err.name === "AbortError") throw new ProviderError("cancelado", "Petición a ElevenLabs cancelada", false);
        if (attempt >= cfg.retries) {
          const cause = (err as Error & { cause?: { code?: string } }).cause?.code;
          throw new ProviderError("elevenlabs_red", `No se pudo conectar con ElevenLabs (${cause ?? err.message})`, true);
        }
        const wait = 1000 * 2 ** attempt;
        onRetry?.(attempt + 1, wait, `red: ${err.message}`);
        await sleep(wait);
        continue;
      }
      if (r.ok) return r;
      const detail = (await describe(r)).split(cfg.apiKey).join("***");
      if (RETRYABLE.has(r.status) && attempt < cfg.retries) {
        const ra = Number(r.headers.get("retry-after"));
        const wait = Math.min(60_000, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt);
        onRetry?.(attempt + 1, wait, `HTTP ${r.status}: ${detail}`);
        await sleep(wait);
        continue;
      }
      const hint =
        r.status === 401 ? " (clave no válida o sin permiso para este endpoint)" : r.status === 402 || r.status === 403 ? " (plan o créditos insuficientes)" : r.status === 429 ? " (límite de peticiones o concurrencia del plan)" : "";
      throw new ProviderError(`elevenlabs_${r.status}`, `ElevenLabs respondió ${r.status}${hint}: ${detail}`, RETRYABLE.has(r.status), r.status);
    }
  };

  return {
    speak: async (o) => {
      const body = JSON.stringify({ text: o.text, model_id: o.model, ...(o.language ? { language_code: o.language } : {}), voice_settings: o.settings });
      const r = await call(
        async () => ({ method: "POST", headers: { "xi-api-key": cfg.apiKey, "Content-Type": "application/json" }, body }),
        `v1/text-to-speech/${encodeURIComponent(o.voiceId)}/with-timestamps?output_format=${encodeURIComponent(o.outputFormat)}`,
      );
      const parsed = ttsResponseSchema.safeParse(await r.json().catch(() => null));
      if (!parsed.success) throw new ProviderError("elevenlabs_respuesta", "Respuesta de texto a voz con formato inesperado", false);
      return parsed.data;
    },
    transcribe: async (o) => {
      const make = async (): Promise<RequestInit> => {
        const form = new FormData();
        form.append("model_id", o.model);
        form.append("file", await openAsBlob(o.file), path.basename(o.file));
        if (o.language) form.append("language_code", o.language);
        form.append("timestamps_granularity", "word");
        form.append("diarize", String(o.diarize));
        form.append("tag_audio_events", String(o.tagAudioEvents));
        return { method: "POST", headers: { "xi-api-key": cfg.apiKey }, body: form };
      };
      const r = await call(make, "v1/speech-to-text", o.onRetry, o.signal);
      const parsed = sttResponseSchema.safeParse(await r.json().catch(() => null));
      if (!parsed.success) {
        throw new ProviderError("elevenlabs_respuesta", `Respuesta de ElevenLabs con formato inesperado: ${parsed.error.issues[0]?.message ?? ""}`, false);
      }
      return parsed.data;
    },
    subscription: async () => {
      const r = await call(async () => ({ headers: { "xi-api-key": cfg.apiKey } }), "v1/user/subscription");
      return subscriptionSchema.parse(await r.json());
    },
  };
};
