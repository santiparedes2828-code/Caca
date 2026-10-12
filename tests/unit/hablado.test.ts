import assert from "node:assert/strict";
import { test } from "node:test";
import { detectLang, findIcons } from "../../autopilot/create/theme";
import { planApoyos } from "../../autopilot/edit/apoyos";
import { planGraficos } from "../../autopilot/edit/graficos";
import { planEditSfx } from "../../autopilot/edit/sonido";
import { matchBroll, type LibraryItem } from "../../autopilot/editorial/library";
import type { Sentence } from "../../autopilot/editorial/analyze";
import { tokensToWords } from "../../autopilot/transcription/local";
import { cutZoomKeys, emphasisPunch } from "../../src/autopilot/geometry";
import { paginateWords, phraseEmphasis } from "../../src/autopilot/paginate";
import { graphicSchema, type CaptionPage } from "../../src/autopilot/props";

// Vídeos hablados para redes (estilo-hablado.md): transcripción local, claves por frase, fraseo de las páginas,
// zoom alterno, apoyos (páginas destacadas, emojis, gráficos) y B-roll inmobiliario.

// Palabras con tiempos a ritmo de habla (≈ 4 palabras/s); "|" marca una pausa de 500 ms
const speak = (text: string, from = 0) => {
  let t = from;
  return text.split(" ").flatMap((w) => {
    if (w === "|") {
      t += 500;
      return [];
    }
    const word = { text: w, startMs: t, endMs: t + 220 };
    t += 250;
    return [word];
  });
};
const marked = (words: { text: string }[], picked: Set<number>) => words.filter((_, i) => picked.has(i)).map((w) => w.text);
const pageText = (p: CaptionPage) => p.lines.flat().map((t) => t.text).join(" ");

test("transcripción local: los tokens del modelo se unen en palabras con tiempos y confianza", () => {
  const words = tokensToWords({
    tokens: [" This", " is", " our", " fir", "st", " year", ".", " 2", "023", ","],
    timestamps: [0, 0.08, 0.24, 0.4, 0.48, 0.56, 0.8, 1.2, 1.28, 1.6],
    durations: [0.08, 0.16, 0.16, 0.08, 0.08, 0.24, 0, 0.08, 0.32, 0],
    logprobs: [-0.1, -0.2, -0.1, -0.5, -0.3, -0.2, -0.1, -0.4, -0.2, -0.1],
  });
  assert.deepEqual(
    words.map((w) => w.text),
    ["This", "is", "our", "first", "year.", "2023,"],
  );
  assert.equal(words[3].startMs, 400);
  assert.equal(words[3].endMs, 560); // fin del último trozo, sin pisar la palabra siguiente
  assert.equal(words[3].logprob, -0.4);
  assert.equal(words[5].startMs, 1200);
  for (let i = 1; i < words.length; i++) assert.ok(words[i].startMs >= words[i - 1].endMs);
});

test("claves por frase: manda la cifra, la unidad va con ella y no se destacan palabras flojas", () => {
  const w = speak("We started in February of 2023, and we're projected to make a little bit over a million this first year.");
  const picked = phraseEmphasis(w, ["first", "million", "year"]);
  const keys = marked(w, picked);
  assert.ok(keys.includes("2023,"));
  assert.ok(keys.includes("million"));
  assert.ok(!keys.includes("first") && !keys.includes("year."));
  const v = speak("we guarantee up to 150 million views in the first 90 days working with us.");
  const vk = marked(v, phraseEmphasis(v));
  assert.ok(vk.includes("150") && vk.includes("90"));
  assert.ok(!vk.includes("million"), "la unidad de la cifra no se destaca sola");
  // Dos claves de una misma frase nunca a menos de 1,2 s
  const times = [...phraseEmphasis(v)].map((i) => v[i].startMs).sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 1200);
  // Sin cifra ni concepto del plan: la palabra de contenido más al final (lo nuevo va al final)
  const c = speak("And we fully specialize in short form content.");
  assert.deepEqual(marked(c, phraseEmphasis(c)), ["content."]);
});

test("fraseo del modo impacto: páginas de 1–3 palabras que no acaban en «in/de» ni separan la cifra de su unidad", () => {
  const w = speak("We started in February of 2023, and we guarantee up to 150 million views in the first 90 days. Trabajamos con agencias de Madrid.");
  const opts = { maxWordsPerPage: 3, maxCharsPerLine: 16, maxLines: 2, pauseBreakMs: 300, emphasis: true, emphasisPer: "frase" as const };
  const pages = paginateWords(w, { ...opts, phrasing: true });
  const FUNCTION = new Set(["in", "of", "to", "the", "a", "con", "de", "en"]);
  for (const p of pages.slice(0, -1)) {
    const flat = p.lines.flat();
    assert.ok(flat.length >= 1 && flat.length <= 3);
    const last = flat[flat.length - 1].text.toLowerCase();
    if (flat.length === 3) assert.ok(!FUNCTION.has(last), `página que acaba en «${last}»: ${pageText(p)}`);
  }
  assert.ok(pages.some((p) => /\b150 million\b/.test(pageText(p))), "«150 million» va en la misma página");
  assert.ok(pages.some((p) => pageText(p).endsWith("2023,")), "la coma cierra la página");
  // Todas las palabras, en orden y sin solapes
  assert.deepEqual(pages.flatMap((p) => p.lines.flat().map((t) => t.text)), w.map((x) => x.text));
  for (let i = 1; i < pages.length; i++) assert.ok(pages[i].startMs >= pages[i - 1].endMs);
  // Sin fraseo (resto de modos) el comportamiento anterior no cambia
  const plainPages = paginateWords(w, opts);
  assert.ok(plainPages.some((p) => pageText(p).split(" ").pop() === "in"));
});

test("zoom alterno de redes: corte instantáneo en cada corte, cambio suave en frases espaciadas", () => {
  const page = (startMs: number, text: string): CaptionPage => ({ startMs, endMs: startMs + 400, lines: [[{ text, startMs, endMs: startMs + 400, emphasis: false }]] });
  const pages = [page(0, "Hola."), page(1000, "Esto."), page(3000, "Sigue."), page(5000, "Casi."), page(7000, "Fin.")];
  const keys = cutZoomKeys([4000, 4200], pages, 8000, 2.5);
  assert.deepEqual(
    keys.map((k) => [k.startMs, k.cut, k.level]),
    [
      [0, true, 0],
      [3000, false, 1], // inicio de frase a ≥ 2,5 s del anterior
      [4000, true, 0], // corte (los dos cortes juntos cuentan como uno); la frase de 5 s queda demasiado cerca
      [7000, false, 1],
    ],
  );
  assert.equal(keys[keys.length - 1].endMs, 8000);
  // Golpe en las claves: sube en 4 frames, baja en 14 y como mucho uno cada 2,5 s
  const emph = (startMs: number): CaptionPage => ({ startMs, endMs: startMs + 300, lines: [[{ text: "clave", startMs, endMs: startMs + 300, emphasis: true }]] });
  const ps = [emph(1000), emph(2000), emph(4000)];
  assert.equal(emphasisPunch(ps, 30, 30, 2.5), 0);
  assert.ok(emphasisPunch(ps, 34, 30, 2.5) > 0.99);
  assert.equal(emphasisPunch(ps, 60, 30, 2.5), 0, "la segunda clave está a menos de 2,5 s: sin golpe");
  assert.ok(emphasisPunch(ps, 124, 30, 2.5) > 0.99);
});

test("apoyos: gancho y cifras destacadas, emojis claros que se ven y nunca dos a la vez", () => {
  const tok = (text: string, startMs: number, emphasis = false) => ({ text, startMs, endMs: startMs + 250, emphasis });
  const pages: CaptionPage[] = [
    { startMs: 700, endMs: 1300, lines: [[tok("in", 700), tok("business.", 900, true)]] },
    { startMs: 5000, endMs: 5400, lines: [[tok("a", 5000), tok("million", 5100, true)]] }, // página corta: sin emoji
    { startMs: 7400, endMs: 8900, lines: [[tok("large", 7400), tok("creators,", 8100, true)]] },
    { startMs: 9000, endMs: 10400, lines: [[tok("podcasts,", 9700, true)]] }, // a menos de 2,5 s del emoji anterior
    { startMs: 11500, endMs: 12600, lines: [[tok("up", 11500), tok("150", 11700, true), tok("million", 12300), tok("views", 12450)]] },
    { startMs: 14000, endMs: 15500, lines: [[tok("more", 14000), tok("creators.", 14300, true)]] }, // mismo emoji: no se repite
  ];
  const ap = planApoyos(pages, { lang: "en" });
  assert.equal(ap.pages[0].feature, true, "el gancho abre como página destacada");
  assert.deepEqual(ap.pages[0].lines.map((l) => l.map((t) => t.text)), [["in"], ["business."]]);
  assert.equal(ap.pages[1].lines.flat()[1].icon, undefined);
  assert.equal(ap.pages[2].lines.flat()[1].icon, "movie-camera");
  assert.equal(ap.pages[3].lines.flat()[0].icon, undefined);
  assert.equal(ap.pages[4].feature, true);
  assert.deepEqual(ap.pages[4].lines.map((l) => l.map((t) => t.text)), [["up"], ["150", "million"], ["views"]], "la unidad va con la cifra");
  assert.equal(ap.pages[5].lines.flat()[1].icon, undefined);
  assert.deepEqual(Object.keys(ap.icons), ["movie-camera"]);
  assert.match(ap.icons["movie-camera"], /^data:image\/svg\+xml;base64,/);
  // Mientras hay un gráfico a pantalla completa no se añade nada más
  const busy = planApoyos(pages, { lang: "en", busy: [{ startMs: 7000, endMs: 13000 }] });
  assert.equal(busy.pages[2].lines.flat()[1].icon, undefined);
  assert.notEqual(busy.pages[4].feature, true);
});

test("gráficos: calendario con el mes y el año dichos y lista al enumerar, nunca en el gancho", () => {
  const w = speak(
    "Hola a todos. | Empezamos en febrero del 2021 con dos personas y muchas ganas de crecer en todo el país. | Hoy trabajamos con agencias, marcas personales, podcasts y creadores.",
  );
  const { graphics, notes } = planGraficos(w, { durationMs: 20000 });
  assert.deepEqual(
    graphics.map((g) => g.kind),
    ["calendario", "lista"],
    notes.join(" | "),
  );
  const [cal, list] = graphics;
  assert.ok(cal.kind === "calendario" && cal.month === 2 && cal.year === 2021 && cal.label === "Febrero" && cal.lang === "es");
  assert.ok(list.kind === "lista");
  assert.deepEqual(
    list.items.map((i) => i.text),
    ["Agencias", "Marcas personales", "Podcasts", "Creadores"],
  );
  // Cada elemento aparece cuando se dice y el gráfico dura lo justo
  for (const it of list.items) assert.ok(w.some((x) => x.startMs === it.startMs));
  for (const g of graphics) {
    assert.ok(g.endMs - g.startMs >= 1200 && g.endMs - g.startMs <= 3600);
    assert.ok(graphicSchema.safeParse(g).success);
  }
  // En inglés, y sin inventar: «May» sin año no es una fecha y «We help coaches,» no es un elemento
  const en = speak("Hello there. | We help coaches, agencies and creators grow. | You may 2 times. Since June 2020 we grew.");
  const g2 = planGraficos(en, { durationMs: 20000 });
  assert.deepEqual(
    g2.graphics.map((g) => (g.kind === "calendario" ? `${g.label} ${g.year}` : g.kind)),
    ["June 2020"],
  );
  // El gancho, el B-roll y el máximo del 30 % del vídeo mandan
  const hook = speak("En marzo de 2020 empezamos. | Y seguimos.");
  assert.equal(planGraficos(hook, { durationMs: 10000 }).graphics.length, 0);
  assert.equal(planGraficos(w, { durationMs: 20000, busy: [{ startMs: 3000, endMs: 5000 }] }).graphics.length, 1);
  assert.equal(planGraficos(w, { durationMs: 4000 }).graphics.length, 0);
});

test("efectos de sonido: solo donde pasa algo (gráfico, B-roll, página destacada, emoji, check), suaves y sin pisarse", () => {
  const tok = (text: string, startMs: number, emphasis = false, icon?: string) => ({ text, startMs, endMs: startMs + 250, emphasis, ...(icon ? { icon } : {}) });
  const pages: CaptionPage[] = [
    { startMs: 700, endMs: 1300, feature: true, lines: [[tok("in", 700)], [tok("business.", 900, true)]] },
    { startMs: 2000, endMs: 2600, lines: [[tok("dos", 2000), tok("palabras", 2300)]] }, // sin nada especial: sin efecto
    { startMs: 9000, endMs: 10000, lines: [[tok("creators,", 9100, true, "movie-camera")]] },
  ];
  const graphics = [
    { kind: "calendario" as const, startMs: 3000, endMs: 5400, month: 2, year: 2023, label: "February", lang: "en" as const },
    { kind: "lista" as const, startMs: 6000, endMs: 8400, items: [{ text: "A", startMs: 6000 }, { text: "B", startMs: 6500 }, { text: "C", startMs: 7000 }] },
  ];
  const { sfx, note } = planEditSfx({ pages, graphics, overlays: [{ startMs: 12000, endMs: 14000 }], fps: 30, durationInFrames: 30 * 16 });
  const names = sfx.map((e) => `${e.name}@${e.frame}`);
  assert.deepEqual(names, ["hit@26", "whoosh@85", "pop@95", "whoosh@155", "whoosh@175", "click@184", "click@199", "click@214", "whoosh@245", "pop@274", "whoosh@355"]);
  assert.ok(sfx.every((e) => e.volume > 0 && e.volume <= 0.3), "volúmenes bajos bajo la voz");
  assert.match(note ?? "", /5 whoosh, 1 hit, 2 pop, 3 click/);
  // Sin apoyos no hay efectos
  assert.deepEqual(planEditSfx({ pages: [pages[1]], graphics: [], overlays: [], fps: 30, durationInFrames: 300 }), { sfx: [], note: null });
});

test("emojis en español e inglés según el idioma del vídeo", () => {
  assert.equal(detectLang("This is our first year in business and we work with creators"), "en");
  assert.equal(detectLang("Este es nuestro primer año y trabajamos con creadores de contenido"), "es");
  assert.deepEqual(findIcons("business", { lang: "en", max: 1, minScore: 4 }), ["briefcase"]);
  assert.deepEqual(findIcons("negocio", { lang: "es", max: 1, minScore: 4 }), ["briefcase"]);
  assert.deepEqual(findIcons("piscina", { lang: "es", max: 1, minScore: 4 }), ["person-swimming"]);
  assert.deepEqual(findIcons("pool", { lang: "en", max: 1, minScore: 4 }), ["person-swimming"], "no la bola de billar");
  assert.deepEqual(findIcons("projected", { lang: "en", max: 1, minScore: 4 }), []);
});

test("B-roll inmobiliario: sinónimos de España y Latinoamérica y presentación en tarjeta", () => {
  const item = (id: string, tags: string[], presentation: "pantalla" | "tarjeta" = "pantalla"): LibraryItem => ({
    id,
    file: `${id}.jpg`,
    kind: "image",
    tags,
    description: "",
    presentation,
    license: { type: "cliente", source: "fotos de la propiedad entregadas por el cliente" },
    scope: "cliente",
    src: `clientlib:${id}.jpg`,
    durationSec: null,
  });
  const s = (id: number, text: string, startMs: number): Sentence => ({
    id,
    text,
    startMs,
    endMs: startMs + 3200,
    firstWord: 0,
    lastWord: 0,
    speaker: null,
    complete: true,
    features: { words: 6, wordsPerSec: 2, question: false, numbers: false, hook: [], cta: false, fillers: 0, dangling: false },
    score: 0,
    reasons: [],
  });
  const picks = matchBroll(
    [s(0, "Bienvenidos a esta casa increíble.", 0), s(1, "La alberca es enorme y tiene vistas.", 5000), s(2, "Y la recámara principal es preciosa.", 14000)],
    [item("piscina", ["piscina"]), item("dormitorio", ["dormitorio"], "tarjeta")],
    30000,
  );
  assert.deepEqual(
    picks.map((p) => [p.item.id, p.item.presentation]),
    [
      ["piscina", "pantalla"],
      ["dormitorio", "tarjeta"],
    ],
  );
});
