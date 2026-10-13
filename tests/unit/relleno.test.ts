import assert from "node:assert/strict";
import { test } from "node:test";
import { maxGap, rellenarHuecos } from "../../autopilot/edit/relleno";
import type { CaptionPage } from "../../src/autopilot/props";

// Páginas de 2 palabras cada 600 ms durante 20 s (habla continua)
const words = "creative process ideas video editing audience retention budget million growth".split(" ");
const pages: CaptionPage[] = Array.from({ length: 33 }, (_, i) => ({
  startMs: i * 600,
  endMs: i * 600 + 600,
  lines: [[{ text: "the", startMs: i * 600, endMs: i * 600 + 250, emphasis: false }, { text: words[i % words.length], startMs: i * 600 + 250, endMs: i * 600 + 600, emphasis: false }]],
}));

test("nunca más de 3 s sin apoyo visual: se rellenan los huecos con conceptos dichos", () => {
  const r = rellenarHuecos({ pages, graphics: [], busy: [{ startMs: 9000, endMs: 11000 }], durationMs: 20000 });
  assert.ok(r.maxGapMs <= 3000, `hueco máximo ${r.maxGapMs}`);
  assert.ok(r.added.length >= 4);
  for (const g of r.added) {
    assert.ok(words.includes(g.text.toLowerCase()), `«${g.text}» tiene que ser una palabra dicha`);
    assert.ok(!(g.startMs < 11000 && g.endMs > 9000), "no pisa el B-roll");
  }
  assert.ok(r.added.some((g) => g.modo === "pantalla") && r.added.some((g) => g.modo === "tarjeta"));
});

test("maxGap mide el mayor tramo sin apoyo, incluido el final", () => {
  assert.equal(maxGap([{ startMs: 1000, endMs: 2000 }], 6000), 4000);
});
