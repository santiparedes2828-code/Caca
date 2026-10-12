import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { loadProfile } from "../../autopilot/clients/profile";
import { loadConfig, ROOT } from "../../autopilot/config";
import { probe } from "../../autopilot/media/probe";
import { alignmentToWords, narrate, ttsCharsToday } from "../../autopilot/narration/tts";
import { runOk } from "../../autopilot/util/exec";
import { startFakeElevenLabs } from "../support/fake-elevenlabs";

// Narración con la API de ElevenLabs SIMULADA (la real no es accesible desde el contenedor de pruebas).
const tmp = path.join(ROOT, ".cache", "test-s4", String(process.pid));
after(async () => fs.rm(tmp, { recursive: true, force: true }));

test("alineación por caracteres → palabras", () => {
  const w = alignmentToWords({ characters: [..."Hola mundo."], character_start_times_seconds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1] });
  assert.deepEqual(w, [
    { text: "Hola", startMs: 0, endMs: 400 },
    { text: "mundo.", startMs: 500, endMs: 1100 },
  ]);
});

test("narración: voz de marca, audio y tiempos, caché y límites", async () => {
  await fs.mkdir(tmp, { recursive: true });
  const mp3 = path.join(tmp, "voz.mp3");
  await runOk("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "sine=f=220:d=2", "-c:a", "libmp3lame", mp3]);
  const srv = await startFakeElevenLabs([], { kind: "ok" }, await fs.readFile(mp3));
  try {
    const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: "sk_prueba_123456", ELEVENLABS_BASE_URL: srv.url, HH_DATA_DIR: path.join(tmp, "data") });
    const profile = await loadProfile(cfg.HH_CLIENTS_DIR, "hookhouse");
    const r = await narrate({ cfg, profile, jobId: "j1", text: "Este video no lo editó nadie." });
    assert.equal(r.cached, false);
    assert.equal(r.words.length, 6);
    assert.ok((await probe(r.audio)).audio);
    const q = srv.requests.at(-1)!;
    assert.match(q.path, /^\/v1\/text-to-speech\/1p905cdbJ1e1JQxhFTGJ\/with-timestamps\?output_format=mp3_44100_128$/);
    assert.equal(q.apiKey, "sk_prueba_123456");
    const again = await narrate({ cfg, profile, jobId: "j2", text: "Este video  no lo editó nadie." });
    assert.equal(again.cached, true);
    assert.equal(srv.requests.length, 1);
    assert.equal(await ttsCharsToday(cfg), 29);
    await assert.rejects(narrate({ cfg: { ...cfg, HH_TTS_MAX_CHARS_PER_JOB: 5 }, profile, jobId: "j3", text: "Otro texto distinto" }), /límite por trabajo/);
    await assert.rejects(narrate({ cfg: { ...cfg, ELEVENLABS_API_KEY: undefined }, profile, jobId: "j4", text: "Sin clave" }), /ELEVENLABS_API_KEY/);
  } finally {
    await srv.close();
  }
});
