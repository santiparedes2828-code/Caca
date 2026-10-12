import type { TimedWord } from "../../src/autopilot/paginate";
import type { Graphic } from "../../src/autopilot/props";

// Apoyos gráficos de los vídeos hablados (estilo-hablado.md, ref. 1): cortes a pantalla completa de 1,5–3 s con un
// gráfico hecho con código mientras la voz sigue:
//   - calendario cuando se dice una fecha con mes y año («febrero de 2023»)
//   - lista con checks cuando se enumeran 3 cosas o más separadas por comas («con X, Y y Z»)
// Solo lo que se dice, tal cual (nunca se inventa un dato ni un día), uno cada vez, nunca durante el gancho y como
// mucho un 30 % del vídeo. El plan los enseña y se pueden quitar o añadir en work/plan.json antes de aprobarlo.

type Interval = { startMs: number; endMs: number };

const MONTHS: Record<string, [number, "es" | "en"]> = {
  enero: [1, "es"],
  febrero: [2, "es"],
  marzo: [3, "es"],
  abril: [4, "es"],
  mayo: [5, "es"],
  junio: [6, "es"],
  julio: [7, "es"],
  agosto: [8, "es"],
  septiembre: [9, "es"],
  setiembre: [9, "es"],
  octubre: [10, "es"],
  noviembre: [11, "es"],
  diciembre: [12, "es"],
  january: [1, "en"],
  february: [2, "en"],
  march: [3, "en"],
  april: [4, "en"],
  may: [5, "en"],
  june: [6, "en"],
  july: [7, "en"],
  august: [8, "en"],
  september: [9, "en"],
  october: [10, "en"],
  november: [11, "en"],
  december: [12, "en"],
};
const BETWEEN = new Set(["of", "de", "del", "in", "en", "the"]); // «February of 2023», «febrero del 2023»
const YEAR = /^(19|20)\d{2}$/;
// Lo que presenta una enumeración («trabajamos con…», «we work with…») y las conjunciones del último elemento
const LEAD = new Set(
  "con para como incluye incluyendo tiene tienen hay ofrece ofrecemos with for like including includes has have offers features".split(" "),
);
const CONJ = new Set(["y", "e", "o", "u", "ni", "and", "or"]);
// Un primer trozo sin presentación que empieza por sujeto («We help coaches,») no es un elemento de la lista
const PRON = new Set(["i", "we", "you", "they", "he", "she", "it", "yo", "tu", "nosotros", "nosotras", "ellos", "ellas", "el", "ella", "usted", "ustedes"]);
const SENTENCE_END = /[.?!…]["»”)]*$/;
const COMMA = /[,;]["»”)]*$/;

const plain = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
const clean = (t: string) => t.replace(/[.,;:!?…"»”)]+$/u, "").replace(/^["«“(¿¡]+/u, "");
const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Candidate = (Omit<Extract<Graphic, { kind: "calendario" }>, "startMs" | "endMs"> | Omit<Extract<Graphic, { kind: "lista" }>, "startMs" | "endMs">) & {
  fromMs: number; // empieza al decirse el primer dato
  lastMs: number; // fin del último dato dicho
  what: string; // para el plan y el informe
};

const calendars = (words: TimedWord[]): Candidate[] => {
  const out: Candidate[] = [];
  words.forEach((w, i) => {
    const m = MONTHS[plain(w.text)];
    if (!m) return;
    for (let j = i + 1; j <= Math.min(i + 3, words.length - 1); j++) {
      const p = plain(words[j].text);
      if (YEAR.test(p)) {
        const label = capitalize(clean(w.text));
        out.push({ kind: "calendario", month: m[0], lang: m[1], year: Number(p), label, fromMs: w.startMs, lastMs: words[j].endMs, what: `calendario «${label} ${p}»` });
        return;
      }
      if (!BETWEEN.has(p)) return;
    }
  });
  return out;
};

// Trozos de frase separados por comas; una lista son 3 o más elementos seguidos de 1–3 palabras: el primero tras su
// presentación («con…», «with…») o de 1–2 palabras si no la hay, y el último puede ir tras «y/and» («X, Y y Z»)
const lists = (words: TimedWord[]): Candidate[] => {
  const chunks: { words: TimedWord[]; comma: boolean }[] = [];
  let cur: TimedWord[] = [];
  for (const w of words) {
    cur.push(w);
    const comma = COMMA.test(w.text);
    if (comma || SENTENCE_END.test(w.text)) {
      chunks.push({ words: cur, comma });
      cur = [];
    }
  }
  if (cur.length) chunks.push({ words: cur, comma: false });
  const short = (ws: TimedWord[]) => ws.length >= 1 && ws.length <= 3 && ws.some((w) => plain(w.text).length >= 2);
  const out: Candidate[] = [];
  for (let k = 0; k < chunks.length; k++) {
    if (!chunks[k].comma) continue;
    const first = chunks[k].words;
    const lead = first.map((w) => LEAD.has(plain(w.text))).lastIndexOf(true);
    const head = lead >= 0 ? first.slice(lead + 1) : first.length <= 2 && !PRON.has(plain(first[0].text)) ? first : [];
    if (!short(head)) continue;
    const items: TimedWord[][] = [head];
    let m = k + 1;
    for (; m < chunks.length; m++) {
      const ws = chunks[m].words;
      const c = ws.findIndex((w) => CONJ.has(plain(w.text)));
      if (c === 0) {
        // último elemento: «y Z» corto que cierra la enumeración
        if (short(ws.slice(1))) items.push(ws.slice(1));
        break;
      }
      if (c > 0) {
        // «Y y Z»: los dos últimos elementos en el mismo trozo
        if (short(ws.slice(0, c)) && short(ws.slice(c + 1))) items.push(ws.slice(0, c), ws.slice(c + 1));
        break;
      }
      if (!short(ws)) break;
      items.push(ws);
      if (!chunks[m].comma) break;
    }
    if (items.length >= 3 && items.length <= 5) {
      const texts = items.map((ws) => capitalize(clean(ws.map((w) => w.text).join(" "))));
      if (texts.every((t) => t.length <= 32)) {
        out.push({
          kind: "lista",
          items: texts.map((text, i) => ({ text, startMs: items[i][0].startMs })),
          fromMs: items[0][0].startMs,
          lastMs: items[items.length - 1].slice(-1)[0].endMs,
          what: `lista «${texts.join(" · ")}»`,
        });
        k = m;
      }
    }
  }
  return out;
};

export type GraficosOptions = {
  durationMs: number;
  busy?: Interval[]; // B-roll ya planificado: los gráficos no se le acercan
  maxShare?: number; // fracción máxima del vídeo con gráficos
  gapMs?: number; // separación mínima con otro apoyo
  minMs?: number;
  maxMs?: number;
};

export const planGraficos = (words: TimedWord[], o: GraficosOptions) => {
  const maxShare = o.maxShare ?? 0.3;
  const gap = o.gapMs ?? 1500;
  const minMs = o.minMs ?? 1600;
  const maxMs = o.maxMs ?? 3600;
  // El gancho se dice mirando a cámara: nada antes del final de la primera frase (ni de 1,5 s)
  const firstEnd = words.find((w) => SENTENCE_END.test(w.text))?.endMs ?? 0;
  const notBefore = Math.max(1500, firstEnd);
  const graphics: Graphic[] = [];
  const notes: string[] = [];
  let covered = 0;
  for (const c of [...calendars(words), ...lists(words)].sort((a, b) => a.fromMs - b.fromMs)) {
    const startMs = c.fromMs;
    const endMs = Math.min(o.durationMs - 200, startMs + maxMs, Math.max(startMs + minMs, c.lastMs + 700));
    const prev = graphics[graphics.length - 1];
    const skip =
      startMs < notBefore
        ? "durante el gancho"
        : endMs - startMs < 1200
          ? "no da tiempo a verlo"
          : prev && startMs - prev.endMs < gap
            ? "demasiado cerca del anterior"
            : (o.busy ?? []).some((b) => startMs < b.endMs + gap && b.startMs < endMs + gap)
              ? "coincide con un B-roll"
              : covered + (endMs - startMs) > maxShare * o.durationMs
                ? `pasaría del ${Math.round(maxShare * 100)} % del vídeo`
                : null;
    if (skip) {
      notes.push(`Gráfico descartado (${skip}): ${c.what}`);
      continue;
    }
    covered += endMs - startMs;
    graphics.push(
      c.kind === "calendario"
        ? { kind: "calendario", startMs, endMs, month: c.month, year: c.year, label: c.label, lang: c.lang }
        : { kind: "lista", startMs, endMs, items: c.items },
    );
    notes.push(`Gráfico ${(startMs / 1000).toFixed(1)}–${(endMs / 1000).toFixed(1)} s: ${c.what}`);
  }
  return { graphics, notes };
};

// Intervalos ocupados por gráficos (para que emojis y páginas destacadas no coincidan con ellos)
export const graphicIntervals = (graphics: Graphic[]): Interval[] => graphics.map((g) => ({ startMs: g.startMs, endMs: g.endMs }));
