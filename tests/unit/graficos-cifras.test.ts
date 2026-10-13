import assert from "node:assert/strict";
import { test } from "node:test";
import { planGraficos } from "../../autopilot/edit/graficos";

const timed = (s: string, t0 = 3000) => s.split(" ").map((text, i) => ({ text, startMs: t0 + i * 300, endMs: t0 + i * 300 + 280 }));

test("dos cifras de dinero en la misma frase → comparación con la referencia de tiempo dicha", () => {
  const w = timed("Okay. Two years ago we're spending a hundred grand a video, now we're spending probably one point five million a video.");
  const g = planGraficos(w, { durationMs: 60000 }).graphics;
  assert.equal(g.length, 1);
  assert.equal(g[0].kind, "comparacion");
  if (g[0].kind !== "comparacion") return;
  assert.deepEqual(g[0].items.map((i) => [i.label, i.value, i.display]), [["Two years ago", 100000, "$100K"], ["Now", 1500000, "$1.5M"]]);
});

test("cifra sola grande → contador con lo que se dice después; en español con «y medio»", () => {
  const g = planGraficos(timed("Hola a todos. Tomamos 35,000 decisiones cada día."), { durationMs: 60000 }).graphics;
  assert.equal(g[0].kind, "cifra");
  if (g[0].kind === "cifra") assert.equal(g[0].display, "35,000");
  const es = planGraficos(timed("Hola a todos. Hace dos años gastábamos cien mil dólares, ahora gastamos un millón y medio."), { durationMs: 60000 }).graphics;
  assert.equal(es[0].kind, "comparacion");
  if (es[0].kind === "comparacion") assert.deepEqual(es[0].items.map((i) => i.value), [100000, 1500000]);
});

test("cifras pequeñas sin dinero no generan gráfico", () => {
  assert.equal(planGraficos(timed("Hello there. It takes three to four months and two weeks."), { durationMs: 60000 }).graphics.length, 0);
});
