import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCaptions, estimateWordTiming } from "../../autopilot/captions/build";
import { normalize, parseCaptionsText, parseVtt, toSrt } from "../../autopilot/captions/load";
import { paginateSegments, paginateWords, pickEmphasis } from "../../src/autopilot/paginate";
import { HOOKHOUSE } from "../../src/design/tokens";
import { parseSrt } from "@remotion/captions";

const W = (text: string, s: number, e: number) => ({ text, startMs: s, endMs: e });
const words = [
  W("Este", 0, 200), W("video", 220, 500), W("no", 520, 600), W("lo", 620, 700), W("editó", 720, 1000),
  W("nadie.", 1020, 1400), W("Ni", 2600, 2700), W("un", 2720, 2800), W("solo", 2820, 3000), W("corte.", 3020, 3400),
];

test("paginateWords: nunca parte palabras y respeta caracteres por línea y líneas por página", () => {
  const pages = paginateWords(words, { maxWordsPerPage: 6, maxCharsPerLine: 12, maxLines: 2, pauseBreakMs: 600 });
  const all = pages.flatMap((p) => p.lines.flat().map((t) => t.text));
  assert.deepEqual(all, words.map((w) => w.text));
  for (const p of pages) {
    assert.ok(p.lines.length <= 2);
    for (const l of p.lines) if (l.length > 1) assert.ok(l.map((t) => t.text).join(" ").length <= 12);
  }
});

test("paginateWords: corta después de final de frase y tras pausas largas, sin solapes", () => {
  const pages = paginateWords(words, { maxWordsPerPage: 20, maxCharsPerLine: 40, maxLines: 2, pauseBreakMs: 600 });
  assert.equal(pages.length, 2);
  assert.equal(pages[0].lines.flat().at(-1)!.text, "nadie.");
  assert.ok(pages[0].endMs <= pages[1].startMs);
  // hueco de 1,2 s (> 1 s) → la primera página se mantiene holdMs tras su última palabra, no hasta la siguiente
  assert.equal(pages[0].endMs, 1400 + 400);
});

test("paginateWords: una palabra más larga que la línea va sola", () => {
  const pages = paginateWords([W("a", 0, 100), W("supercalifragilístico", 100, 900), W("b", 900, 1000)], {
    maxWordsPerPage: 6, maxCharsPerLine: 10, maxLines: 3, pauseBreakMs: 600,
  });
  assert.deepEqual(pages[0].lines.map((l) => l.map((t) => t.text)), [["a"], ["supercalifragilístico"], ["b"]]);
});

test("pickEmphasis: prefiere números y palabras de contenido largas", () => {
  assert.equal(pickEmphasis([W("tengo", 0, 1), W("3", 0, 1), W("clientes", 0, 1)]), 1);
  assert.equal(pickEmphasis([W("para", 0, 1), W("automatizar", 0, 1), W("todo", 0, 1)]), 1);
  assert.equal(pickEmphasis([W("ya", 0, 1), W("no", 0, 1)]), -1);
});

test("paginateSegments: divide bloques largos con tiempos estimados y lo cuenta", () => {
  const r = paginateSegments([W("una frase bastante larga que no cabe en dos líneas cortas de subtítulo", 0, 4000)], {
    maxCharsPerLine: 14, maxLines: 2,
  });
  assert.ok(r.pages.length > 1);
  assert.equal(r.estimatedSplits, r.pages.length - 1);
  assert.equal(r.pages[0].startMs, 0);
  assert.equal(r.pages.at(-1)!.endMs, 4000);
});

test("parse: SRT, VTT, JSON de Scribe y Caption[] de Remotion", () => {
  const srt = parseCaptionsText("1\n00:00:00,500 --> 00:00:01,500\nHola <i>mundo</i>\n\n2\n00:00:02,000 --> 00:00:03,000\nAdiós\n", ".srt");
  assert.equal(srt.precision, "segment");
  assert.equal(srt.items.length, 2);
  const vtt = parseVtt("WEBVTT\n\nNOTE x\n\n00:01.000 --> 00:02.500 align:center\nHola\n\nid2\n01:00:00.000 --> 01:00:01.000\nFin\n");
  assert.deepEqual(vtt.map((v) => [v.startMs, v.endMs]), [[1000, 2500], [3600000, 3601000]]);
  const sc = parseCaptionsText(JSON.stringify({ words: [{ text: "Hola", start: 0.1, end: 0.4, type: "word" }, { text: " ", start: 0.4, end: 0.5, type: "spacing" }] }), ".json");
  assert.equal(sc.precision, "word");
  assert.deepEqual(sc.items, [W("Hola", 100, 400)]);
  const rc = parseCaptionsText(JSON.stringify([{ text: "Hola", startMs: 0, endMs: 300 }]), ".json");
  assert.equal(rc.precision, "word");
  assert.throws(() => parseCaptionsText("{}", ".json"));
});

test("normalize: limpia, ordena, corrige solapes y descarta lo que empieza tras el final", () => {
  const warnings: string[] = [];
  const out = normalize([W(" b ", 500, 2000), W("a", 0, 800), W("", 900, 950), W("tarde", 9000, 9500)], 5000, warnings);
  assert.deepEqual(out, [W("a", 0, 500), W("b", 500, 2000)]);
  assert.equal(warnings.length, 2);
});

test("buildCaptions: con SRT un modo por palabra cae a 'frases' (no se inventa precisión)", () => {
  const loaded = { precision: "segment" as const, items: [W("Hola mundo", 0, 1000)], warnings: [], source: "srt" };
  const b = buildCaptions({ loaded, mode: "palabra-activa", intensity: "sutil", brand: HOOKHOUSE, allowEstimatedWordTiming: false, trimStartMs: 0, durationMs: 5000 });
  assert.equal(b.mode, "frases");
  assert.equal(b.precision, "segment");
  assert.ok(b.warnings.some((w) => w.includes("no se inventa")));
  const e = buildCaptions({ loaded, mode: "palabra-activa", intensity: "sutil", brand: HOOKHOUSE, allowEstimatedWordTiming: true, trimStartMs: 0, durationMs: 5000 });
  assert.equal(e.mode, "palabra-activa");
  assert.equal(e.precision, "estimated");
  assert.ok(e.warnings.some((w) => w.includes("ESTIMADOS")));
});

test("buildCaptions: el recorte desplaza los tiempos y el SRT exportado es válido", () => {
  const loaded = { precision: "word" as const, items: words, warnings: [], source: "json" };
  const b = buildCaptions({ loaded, mode: "dinamico", intensity: "alto-impacto", brand: HOOKHOUSE, allowEstimatedWordTiming: false, trimStartMs: 650, durationMs: 2000 });
  assert.equal(b.pages[0].lines[0][0].text, "lo");
  assert.equal(b.pages[0].startMs, 0);
  assert.ok(b.pages.every((p) => p.endMs <= 2000), "ninguna página pasa del final del vídeo");
  assert.ok(parseSrt({ input: b.srt }).captions.every((c) => c.endMs <= 2000));
  assert.ok(b.pages.every((p) => p.lines.flat().length <= 3));
  const parsed = parseSrt({ input: b.srt, strict: true }).captions;
  assert.ok(parsed.length > 0);
});

test("estimateWordTiming reparte el bloque completo", () => {
  const r = estimateWordTiming([W("uno dos tres", 1000, 2000)]);
  assert.equal(r.length, 3);
  assert.equal(r[0].startMs, 1000);
  assert.equal(r[2].endMs, 2000);
});

test("toSrt formatea horas y milisegundos", () => {
  assert.equal(toSrt([{ startMs: 3723004, endMs: 3724000, lines: ["a", "b"] }]), "1\n01:02:03,004 --> 01:02:04,000\na\nb\n");
});
