import { promises as fs } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { ROOT } from "../../autopilot/config";

// SIMULACIÓN de la API de ElevenLabs, SOLO PARA PRUEBAS. No demuestra que la integración real funcione:
// sirve para ejercitar el cliente HTTP (cabeceras, multipart, reintentos, errores) sin red ni coste.
// La respuesta usa el texto y los tiempos REALES que devolvió ElevenLabs Scribe para public/audio/voz_a.mp3
// (tests/data/elevenlabs-scribe-voz_a.words.json); los campos que ese archivo no trae (spacing, logprob,
// speaker_id, audio_duration_secs) se añaden con la forma de SpeechToTextChunkResponseModel del SDK oficial.

export type FakeReply =
  | { kind: "ok"; lowLogprobWords?: string[]; maxSec?: number; audioDurationSecs?: number }
  | { kind: "status"; status: number; body?: unknown; retryAfter?: number }
  | { kind: "delay"; ms: number }
  | { kind: "bad-json" };

export type FakeRequest = { path: string; apiKey: string | null; fields: Record<string, string>; fileBytes: number; fileName: string | null };

export const realScribeWords = async () =>
  (JSON.parse(await fs.readFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), "utf8")) as {
    words: { text: string; type: string; start: number; end: number }[];
  }).words;

export const startFakeElevenLabs = async (script: FakeReply[], fallback: FakeReply = { kind: "ok" }, ttsAudio?: Buffer) => {
  const requests: FakeRequest[] = [];
  const words = await realScribeWords();
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const body = Buffer.concat(chunks);
    const rec: FakeRequest = { path: req.url ?? "", apiKey: (req.headers["xi-api-key"] as string) ?? null, fields: {}, fileBytes: 0, fileName: null };
    if (req.method === "POST" && String(req.headers["content-type"]).startsWith("multipart/")) {
      const form = await new Request("http://x", { method: "POST", headers: req.headers as Record<string, string>, body }).formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === "string") rec.fields[k] = v;
        else {
          rec.fileBytes = v.size;
          rec.fileName = v.name;
        }
      }
    }
    requests.push(rec);
    const reply = script.shift() ?? fallback;
    if (req.url?.startsWith("/v1/text-to-speech/")) {
      if (reply.kind === "status") {
        return void res.writeHead(reply.status, { "Content-Type": "application/json" }).end(JSON.stringify({ detail: { status: "error", message: "simulado" } }));
      }
      const { text } = JSON.parse(body.toString()) as { text: string };
      const chars = [...text];
      res.writeHead(200, { "Content-Type": "application/json" });
      return void res.end(
        JSON.stringify({
          audio_base64: (ttsAudio ?? Buffer.from("x")).toString("base64"),
          alignment: { characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.06), character_end_times_seconds: chars.map((_, i) => i * 0.06 + 0.05) },
        }),
      );
    }
    if (req.url === "/v1/user/subscription") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return void res.end(JSON.stringify({ tier: "creator", status: "active", character_count: 1234, character_limit: 100000, next_character_count_reset_unix: 1792000000, voice_limit: 30 }));
    }
    if (reply.kind === "delay") {
      await new Promise((r) => setTimeout(r, reply.ms));
      if (!res.writableEnded && !res.destroyed) res.writeHead(200).end("{}");
      return;
    }
    if (reply.kind === "bad-json") return void res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ hola: 1 }));
    if (reply.kind === "status") {
      const h: Record<string, string> = { "Content-Type": "application/json" };
      if (reply.retryAfter !== undefined) h["Retry-After"] = String(reply.retryAfter);
      return void res.writeHead(reply.status, h).end(JSON.stringify(reply.body ?? { detail: { status: "error", message: `simulado ${reply.status}` } }));
    }
    if (!rec.apiKey) return void res.writeHead(401).end(JSON.stringify({ detail: { status: "needs_authorization", message: "missing key" } }));
    const max = reply.maxSec ?? Infinity;
    const out: unknown[] = [];
    const sel = words.filter((w) => w.end <= max);
    sel.forEach((w, i) => {
      out.push({ text: w.text, start: w.start, end: w.end, type: "word", speaker_id: "speaker_0", logprob: reply.lowLogprobWords?.includes(w.text) ? -2.3 : -0.04 });
      if (i < sel.length - 1) out.push({ text: " ", start: w.end, end: sel[i + 1].start, type: "spacing", speaker_id: "speaker_0", logprob: 0 });
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        language_code: "spa",
        language_probability: 0.9459,
        text: sel.map((w) => w.text).join(" "),
        words: out,
        transcription_id: "simulado-1",
        audio_duration_secs: reply.audioDurationSecs ?? (sel.length ? sel[sel.length - 1].end : 0),
      }),
    );
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    script,
    close: () =>
      new Promise<void>((r) => {
        server.closeAllConnections();
        server.close(() => r());
      }),
  };
};
