import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { ROOT } from "../../autopilot/config";
import { buildSentences, findClaims, keywords, scoreSentences, topicBoundaries } from "../../autopilot/editorial/analyze";
import { clipCandidates, selectClips } from "../../autopilot/editorial/candidates";
import { planWithClaude } from "../../autopilot/editorial/claude";
import { loadLibrary, matchBroll, pickMusic } from "../../autopilot/editorial/library";
import { musicGain } from "../../src/autopilot/mix";
import { pickEmphasis } from "../../src/autopilot/paginate";
import { makeTestLibrary } from "../fixtures";
import { startFakeAnthropic } from "../support/fake-anthropic";

const tmp = path.join(ROOT, ".cache", "test-s3", String(process.pid));
type W = { text: string; startMs: number; endMs: number };
let real: W[];

before(async () => {
  const j = JSON.parse(await fs.readFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), "utf8"));
  real = j.words.map((w: { text: string; start: number; end: number }) => ({ text: w.text, startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000) }));
});
after(async () => fs.rm(tmp, { recursive: true, force: true }));

// Texto sintético con tiempos: 1 palabra cada 300 ms
const timed = (text: string) => text.split(" ").map((t, i) => ({ text: t, startMs: i * 300, endMs: i * 300 + 250 }));

test("frases y rasgos sobre la transcripción real de ElevenLabs", () => {
  const s = scoreSentences(buildSentences(real, null));
  assert.equal(s.length, 9);
  assert.equal(s[3].text, "No es falta de talento, es falta de sistema.");
  assert.ok(s[3].features.hook.length > 0, "gancho detectado");
  assert.ok(s.every((x) => x.complete), "todas completas (la última sin punto cuenta como completa)");
  assert.ok(keywords(s).some((k) => k.word === "sistema"));
});

test("clips: tramos continuos que empiezan una idea, acaban completos y no se solapan", () => {
  const s = scoreSentences(buildSentences(real, null));
  const cands = clipCandidates(s, { minMs: 8000, maxMs: 16000, boundaries: topicBoundaries(s), mode: "clips" });
  const sel = selectClips(cands, 3);
  assert.ok(sel.length >= 2);
  for (const c of sel) {
    assert.ok(c.durationMs >= 8000 && c.durationMs <= 16000);
    assert.equal(c.startMs, s[c.startSentence].startMs);
    assert.ok(s[c.endSentence].complete);
  }
  for (let i = 1; i < sel.length; i++) assert.ok(sel[i].startMs >= sel[i - 1].endMs - 0.2 * Math.min(sel[i].durationMs, sel[i - 1].durationMs));
  // El fragmento con gancho es el mejor puntuado
  assert.equal(cands[0].startSentence, 3);
});

test("una frase que depende de la anterior no abre un clip", () => {
  const s = scoreSentences(buildSentences(timed("Hoy hablamos de ventas. Pero esto no funciona siempre. La clave es medir todo."), null));
  const c = clipCandidates(s, { minMs: 500, maxMs: 10000, boundaries: [], mode: "podcast" });
  assert.ok(c.length > 0);
  assert.ok(!c.some((x) => x.startSentence === 1));
});

test("anuncio: se señalan cifras, superlativos y garantías para verificar", () => {
  const s = scoreSentences(buildSentences(timed("El 90% de los clientes repite. Es el mejor del mercado. Pruébalo hoy."), null));
  assert.deepEqual(findClaims(s).map((c) => c.sentence), [0, 1]);
});

test("cambios de tema por similitud léxica", () => {
  const a = "La edición de vídeo automática ahorra tiempo de edición. Editar vídeo con un sistema de edición es rápido. El vídeo editado sale listo.";
  const b = "Las recetas de cocina italiana usan tomate. La pasta con tomate es una receta típica. Cocina italiana con aceite y tomate.";
  const s = scoreSentences(buildSentences(timed(`${a} ${b}`), null));
  assert.deepEqual(topicBoundaries(s, 2), [3]);
});

test("biblioteca: solo recursos con licencia válida; emparejado de B-roll con reglas", async () => {
  await makeTestLibrary(path.join(tmp, "lib"));
  // Recurso del cliente con licencia cc-by sin atribución y otro que intenta salir de la carpeta
  const clientLib = path.join(tmp, "clients", "demo", "library", "broll");
  await fs.mkdir(clientLib, { recursive: true });
  await fs.copyFile(path.join(tmp, "lib", "broll", "sistema.jpg"), path.join(clientLib, "propio.jpg"));
  await fs.writeFile(
    path.join(clientLib, "catalog.json"),
    JSON.stringify({
      items: [
        { id: "propio", file: "propio.jpg", kind: "image", tags: ["sistema"], license: { type: "cliente", source: "Cliente demo" } },
        { id: "ccby", file: "propio.jpg", kind: "image", tags: ["x"], license: { type: "cc-by", source: "Autor" } },
        { id: "fuera", file: "../../../../lib/broll/agencias.jpg", kind: "image", tags: ["x"], license: { type: "propia", source: "yo" } },
      ],
    }),
  );
  const lib = await loadLibrary({ libraryDir: path.join(tmp, "lib"), clientsDir: path.join(tmp, "clients"), clientId: "demo", kind: "broll" });
  assert.deepEqual(lib.items.map((i) => i.id).sort(), ["agencias", "editor", "propio", "sistema", "subtitulos"]);
  assert.equal(lib.rejected.length, 3, JSON.stringify(lib.rejected)); // sin licencia, cc-by sin atribución, ruta fuera
  const s = scoreSentences(buildSentences(real, null));
  const picks = matchBroll(s, lib.items, 36000);
  assert.ok(picks.length >= 2);
  assert.equal(new Set(picks.map((p) => p.item.id)).size, picks.length, "sin repetir recursos");
  for (let i = 1; i < picks.length; i++) assert.ok(picks[i].startMs - picks[i - 1].endMs >= 4000);
  assert.ok(picks.reduce((n, p) => n + p.endMs - p.startMs, 0) <= 0.3 * 36000);
  // "sistema" existe en el cliente y en la biblioteca interna: gana el del cliente
  const sys = picks.find((p) => p.matched.includes("sistema"));
  assert.equal(sys?.item.id, "propio");
  const music = await loadLibrary({ libraryDir: path.join(tmp, "lib"), clientsDir: path.join(tmp, "clients"), clientId: "demo", kind: "music" });
  assert.equal(pickMusic(music.items, "tranquila", null)?.id, "acorde");
  assert.equal(pickMusic(music.items, "energica", null), null);
  assert.equal(pickMusic(music.items, null, "no-existe"), null);
  assert.ok(music.items[0].durationSec! > 19);
});

test("música: atenuada mientras hay voz y con fundidos", () => {
  const m = { src: "x", gain: 0.1, duckGain: 0.03, fadeInMs: 1000, fadeOutMs: 1000, speech: [{ startMs: 3000, endMs: 5000 }] };
  assert.equal(musicGain(m, 0, 10000), 0);
  assert.ok(Math.abs(musicGain(m, 2000, 10000) - 0.1) < 1e-9);
  assert.ok(Math.abs(musicGain(m, 4000, 10000) - 0.03) < 1e-9);
  assert.ok(musicGain(m, 2875, 10000) < 0.1 && musicGain(m, 2875, 10000) > 0.03, "rampa antes de hablar");
  assert.equal(musicGain(m, 10000, 10000), 0);
});

test("énfasis: las palabras clave del plan tienen prioridad sobre la heurística", () => {
  const w = timed("automatizamos nuestro sistema");
  assert.equal(pickEmphasis(w), 0);
  assert.equal(pickEmphasis(w, ["sistema"]), 2);
  assert.equal(pickEmphasis(timed("las agencias crecen"), ["agencia"]), 1);
});

test("Claude (API simulada): petición correcta, validación de la respuesta y errores", async () => {
  const s = scoreSentences(buildSentences(real, null));
  const srv = await startFakeAnthropic([
    {
      kind: "plan",
      plan: {
        clips: [
          { start_sentence: 3, end_sentence: 4, title: "Falta de sistema", reason: "gancho" },
          { start_sentence: 0, end_sentence: 8, title: "Todo", reason: "demasiado largo" },
          { start_sentence: 40, end_sentence: 41, title: "Inventado", reason: "ids que no existen" },
          { start_sentence: 4, end_sentence: 5, title: "Se solapa", reason: "solapa" },
        ],
        keywords: ["sistema", "edición"],
        claims_to_verify: [{ sentence: 5, reason: "promesa de resultado" }],
      },
    },
    { kind: "status", status: 401, type: "authentication_error", message: "invalid x-api-key" },
    { kind: "refusal" },
  ]);
  const client = new Anthropic({ apiKey: "sk-ant-prueba", baseURL: srv.url, maxRetries: 0 });
  const opts = { sentences: s, mode: "clips" as const, count: 3, minMs: 6000, maxMs: 16000, model: "claude-opus-5-5", effort: "medium" as const, client };
  try {
    const r = await planWithClaude(opts);
    assert.deepEqual(r.clips.map((c) => [c.startSentence, c.endSentence]), [[3, 4]]);
    assert.equal(r.rejected.length, 3);
    assert.deepEqual(r.keywords, ["sistema", "edición"]);
    assert.equal(r.usage.inputTokens, 1200);
    const req = srv.requests[0];
    assert.equal(req.body.model, "claude-opus-5-5");
    assert.equal(req.body.fallbacks, "default");
    assert.match(String(req.headers["anthropic-beta"]), /server-side-fallback-2026-07-01/);
    assert.equal((req.body.output_config as { effort: string }).effort, "medium");
    assert.equal((req.body.output_config as { format: { type: string } }).format.type, "json_schema");
    assert.match(JSON.stringify(req.body.messages), /No es falta de talento/);
    await assert.rejects(planWithClaude(opts), Anthropic.AuthenticationError);
    await assert.rejects(planWithClaude(opts), /refusal/);
  } finally {
    await srv.close();
  }
});
