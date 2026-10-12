import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseCaptionsText } from "../../autopilot/captions/load";
import { loadConfig, ROOT } from "../../autopilot/config";
import { createElevenLabsClient, ProviderError } from "../../autopilot/transcription/elevenlabs";
import { extractSpeechAudio, fromElevenLabs, lowConfidence, transcribeWithElevenLabs, usedSecondsToday } from "../../autopilot/transcription/transcribe";
import { makeSpeechVideo } from "../fixtures";
import { realScribeWords, startFakeElevenLabs } from "../support/fake-elevenlabs";

// Cliente REST probado contra la SIMULACIÓN local de la API (tests/support/fake-elevenlabs.ts).
const tmp = path.join(ROOT, ".cache", "test-el", String(process.pid));
const KEY = "sk_prueba_no_real_123456";
let audio: string;

before(async () => {
  const video = await makeSpeechVideo(path.join(tmp, "fx"), 6);
  audio = await extractSpeechAudio(video, path.join(tmp, "fx", "audio.m4a"));
});
after(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const client = (url: string, retries = 2, timeoutMs = 5000) => createElevenLabsClient({ apiKey: KEY, baseUrl: url, retries, timeoutMs });
const req = (file: string) => ({ file, model: "scribe_v2", language: "es", diarize: true, tagAudioEvents: true });

test("la transcripción REAL de ElevenLabs (words.json) se lee como subtítulos por palabra", async () => {
  const text = await fs.readFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), "utf8");
  const r = parseCaptionsText(text, ".json");
  assert.equal(r.precision, "word");
  assert.equal(r.items.length, 79);
  assert.deepEqual(r.items[6], { text: "TikTok", startMs: 1900, endMs: 2400 });
});

test("petición: cabecera xi-api-key, multipart con los campos del SDK oficial y audio adjunto", async () => {
  const srv = await startFakeElevenLabs([{ kind: "ok", maxSec: 6 }]);
  try {
    const r = await client(srv.url).transcribe(req(audio));
    const q = srv.requests[0];
    assert.equal(q.path, "/v1/speech-to-text");
    assert.equal(q.apiKey, KEY);
    assert.deepEqual(q.fields, { model_id: "scribe_v2", language_code: "es", timestamps_granularity: "word", diarize: "true", tag_audio_events: "true" });
    assert.ok(q.fileBytes > 1000);
    assert.equal(q.fileName, "audio.m4a");
    const t = fromElevenLabs(r, "scribe_v2", "api");
    assert.ok(t.words.length > 5);
    assert.ok(t.words.every((w) => w.text.trim() === w.text && w.text !== ""), "sin entradas spacing");
    assert.equal(t.words[0].speaker, "speaker_0");
    assert.equal(t.languageCode, "spa");
  } finally {
    await srv.close();
  }
});

test("429 con Retry-After se reintenta; 401 no se reintenta y no filtra la clave", async () => {
  const srv = await startFakeElevenLabs([{ kind: "status", status: 429, retryAfter: 0 }, { kind: "ok", maxSec: 3 }]);
  const retries: string[] = [];
  try {
    await client(srv.url).transcribe({ ...req(audio), onRetry: (_n, _w, why) => retries.push(why) });
    assert.equal(srv.requests.length, 2);
    assert.match(retries[0], /429/);
  } finally {
    await srv.close();
  }
  const s401 = await startFakeElevenLabs([{ kind: "status", status: 401, body: { detail: { status: "invalid_api_key", message: `bad key ${KEY}` } } }]);
  try {
    await assert.rejects(client(s401.url).transcribe(req(audio)), (e: ProviderError) => {
      assert.equal(e.code, "elevenlabs_401");
      assert.equal(e.retryable, false);
      assert.ok(!e.message.includes(KEY), "la clave no aparece en el error");
      return true;
    });
    assert.equal(s401.requests.length, 1);
  } finally {
    await s401.close();
  }
});

test("500 persistente agota los reintentos; red caída da error de conexión", async () => {
  const srv = await startFakeElevenLabs([], { kind: "status", status: 500 });
  try {
    await assert.rejects(client(srv.url, 1).transcribe(req(audio)), /ElevenLabs respondió 500/);
    assert.equal(srv.requests.length, 2);
  } finally {
    await srv.close();
  }
  await assert.rejects(client("http://127.0.0.1:9", 0).transcribe(req(audio)), (e: ProviderError) => e.code === "elevenlabs_red");
});

test("timeout del cliente NO se reintenta (evita pagar dos veces) y respuesta inesperada se rechaza", async () => {
  const srv = await startFakeElevenLabs([{ kind: "delay", ms: 1500 }, { kind: "bad-json" }]);
  try {
    await assert.rejects(client(srv.url, 3, 300).transcribe(req(audio)), (e: ProviderError) => e.code === "elevenlabs_timeout");
    assert.equal(srv.requests.length, 1);
    await assert.rejects(client(srv.url).transcribe(req(audio)), (e: ProviderError) => e.code === "elevenlabs_respuesta");
  } finally {
    await srv.close();
  }
});

test("caché por cliente, registro de uso y presupuesto por trabajo y por día", async () => {
  const srv = await startFakeElevenLabs([], { kind: "ok", maxSec: 6, audioDurationSecs: 6 });
  const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: KEY, ELEVENLABS_BASE_URL: srv.url, HH_DATA_DIR: path.join(tmp, "data") });
  const base = { cfg, clientId: "hookhouse", jobId: "20261012-000000-aaaaaa", audio, model: "scribe_v2", language: "es", diarize: true, tagAudioEvents: true };
  try {
    const a = await transcribeWithElevenLabs(base);
    assert.equal(a.billedSeconds, 6);
    assert.equal(a.transcript.source, "api");
    const b = await transcribeWithElevenLabs(base);
    assert.equal(b.transcript.source, "cache");
    assert.equal(b.billedSeconds, 0);
    assert.equal(srv.requests.length, 1, "la segunda vez sale de la caché");
    assert.equal(await usedSecondsToday(cfg), 6);
    // Otro cliente no comparte caché
    await transcribeWithElevenLabs({ ...base, clientId: "otro-cliente" });
    assert.equal(srv.requests.length, 2);
    // Límite por trabajo y por día: se rechaza ANTES de llamar a la API
    await assert.rejects(transcribeWithElevenLabs({ ...base, language: "en", cfg: { ...cfg, HH_STT_MAX_SECONDS_PER_JOB: 2 } }), /límite por trabajo/);
    await assert.rejects(transcribeWithElevenLabs({ ...base, language: "en", cfg: { ...cfg, HH_STT_MAX_SECONDS_PER_DAY: 15 } }), /límite diario/);
    assert.equal(srv.requests.length, 2);
    // Sin clave
    await assert.rejects(transcribeWithElevenLabs({ ...base, language: "en", cfg: { ...cfg, ELEVENLABS_API_KEY: undefined } }), (e: ProviderError) => e.code === "sin_clave");
  } finally {
    await srv.close();
  }
});

test("palabras de baja confianza y eventos de audio separados del texto", async () => {
  const words = await realScribeWords();
  const t = fromElevenLabs(
    {
      language_code: "spa",
      language_probability: 0.9,
      text: "",
      words: [
        { text: words[0].text, start: 0.1, end: 0.24, type: "word", logprob: -0.01 },
        { text: " ", start: 0.24, end: 0.3, type: "spacing", logprob: 0 },
        { text: "(risas)", start: 0.3, end: 0.9, type: "audio_event", logprob: -0.2 },
        { text: "agencias", start: 1, end: 1.5, type: "word", logprob: -2.5 },
        { text: "sin", type: "word", logprob: -0.1 },
      ],
    },
    "scribe_v2",
    "api",
  );
  assert.deepEqual(t.words.map((w) => w.text), ["Las", "agencias"]);
  assert.deepEqual(t.events.map((e) => e.text), ["(risas)"]);
  assert.deepEqual(lowConfidence(t, -1).map((w) => w.text), ["agencias"]);
});

test("suscripción: plan y uso", async () => {
  const srv = await startFakeElevenLabs([]);
  try {
    const s = await client(srv.url).subscription();
    assert.equal(s.tier, "creator");
    assert.equal(srv.requests[0].apiKey, KEY);
  } finally {
    await srv.close();
  }
});
