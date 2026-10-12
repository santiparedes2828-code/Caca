import type { CaptionPage, CaptionToken } from "./props";

// Agrupa palabras con tiempos en páginas de subtítulo. Código puro: lo usan el backend y las demos.
//
// Reglas (estilo-hookhouse.md + requisitos de subtítulos):
// - Nunca se parte una palabra; una palabra más larga que la línea va sola y el render reduce el cuerpo.
// - Página nueva al llegar al máximo de palabras, al no caber en maxLines, tras una pausa larga
//   o después de un final de frase (. ? ! …), para no mezclar dos frases.
// - Una página se mantiene en pantalla hasta la siguiente si el hueco es corto; si no, holdMs tras su última palabra.

export type TimedWord = { text: string; startMs: number; endMs: number };

export type PaginateOptions = {
  maxWordsPerPage: number;
  maxCharsPerLine: number;
  maxLines: number;
  pauseBreakMs: number;
  holdMs?: number;
  bridgeGapMs?: number;
  emphasis?: boolean; // marca una palabra destacada por página (heurística, ver pickEmphasis)
  keywords?: string[]; // conceptos del plan editorial: si aparecen, se destacan antes que la heurística
};

const SENTENCE_END = /[.?!…]["»”)]*$/;

// Palabras vacías frecuentes (es/en) que nunca se destacan
const STOP = new Set(
  (
    "para pero porque como cuando donde desde hasta sobre entre este esta estos estas ese esa esos esas aquel " +
    "todo toda todos todas nada algo cada otro otra otros otras mismo misma tiene tienen hacer puede pueden " +
    "también siempre nunca ahora antes después muy más menos tanto solo sólo there their about would could should " +
    "these those which where while because really"
  ).split(" "),
);

const bare = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Heurística provisional (Etapa 1): número o palabra de contenido más larga (≥ 6 letras).
// La Etapa 3 la sustituye por el énfasis que decida el plan editorial.
const keyForm = (t: string) => {
  const b = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
  return b.length > 5 && b.endsWith("s") ? b.slice(0, -1) : b;
};

export const pickEmphasis = (
  words: TimedWord[],
  keywords: string[] = [],
): number => {
  if (keywords.length) {
    const keys = new Set(keywords.map(keyForm));
    const k = words.findIndex((w) => keys.has(keyForm(w.text)));
    if (k >= 0) return k;
  }
  const num = words.findIndex((w) => /\d/.test(w.text));
  if (num >= 0) return num;
  let best = -1;
  let bestLen = 5;
  words.forEach((w, i) => {
    const b = bare(w.text);
    if (b.length > bestLen && !STOP.has(b)) {
      best = i;
      bestLen = b.length;
    }
  });
  return best;
};

const lineLen = (line: TimedWord[]) =>
  line.reduce((n, w, i) => n + w.text.length + (i > 0 ? 1 : 0), 0);

export const paginateWords = (
  words: TimedWord[],
  o: PaginateOptions,
): CaptionPage[] => {
  const holdMs = o.holdMs ?? 400;
  const bridge = o.bridgeGapMs ?? 1000;
  const groups: TimedWord[][][] = [];
  let lines: TimedWord[][] = [[]];
  let count = 0;

  const flush = () => {
    if (count > 0) groups.push(lines);
    lines = [[]];
    count = 0;
  };

  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (count > 0) {
      const pause = prev && w.startMs - prev.endMs >= o.pauseBreakMs;
      const sentence = prev && SENTENCE_END.test(prev.text);
      if (count >= o.maxWordsPerPage || pause || sentence) flush();
    }
    let line = lines[lines.length - 1];
    if (
      line.length > 0 &&
      lineLen(line) + 1 + w.text.length > o.maxCharsPerLine
    ) {
      if (lines.length >= o.maxLines) flush();
      else lines.push([]);
      line = lines[lines.length - 1];
    }
    line.push(w);
    count++;
  });
  flush();

  return groups.map((g, k) => {
    const flat = g.flat();
    const first = flat[0];
    const last = flat[flat.length - 1];
    const next = groups[k + 1]?.[0][0];
    const endMs =
      next && next.startMs - last.endMs <= bridge
        ? next.startMs
        : last.endMs + holdMs;
    const emph = o.emphasis ? pickEmphasis(flat, o.keywords) : -1;
    let idx = 0;
    return {
      startMs: first.startMs,
      endMs: next ? Math.min(endMs, next.startMs) : endMs,
      lines: g.map((line) =>
        line.map(
          (w): CaptionToken => ({
            text: w.text,
            startMs: w.startMs,
            endMs: w.endMs,
            emphasis: idx++ === emph,
          }),
        ),
      ),
    };
  });
};

// Subtítulos por segmento (SRT/VTT): cada bloque es una página; no hay tiempos por palabra.
// Si un bloque no cabe en maxLines se divide en páginas con tiempos ESTIMADOS por número de caracteres
// (se devuelve cuántos para que el informe lo diga).
export const paginateSegments = (
  segments: TimedWord[],
  o: Pick<PaginateOptions, "maxCharsPerLine" | "maxLines">,
): { pages: CaptionPage[]; estimatedSplits: number } => {
  const pages: CaptionPage[] = [];
  let estimatedSplits = 0;
  for (const seg of segments) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    const lines: string[][] = [[]];
    for (const w of words) {
      const line = lines[lines.length - 1];
      const len = line.join(" ").length;
      if (line.length > 0 && len + 1 + w.length > o.maxCharsPerLine)
        lines.push([w]);
      else line.push(w);
    }
    const chunks: string[][][] = [];
    for (let i = 0; i < lines.length; i += o.maxLines)
      chunks.push(lines.slice(i, i + o.maxLines));
    if (chunks.length > 1) estimatedSplits += chunks.length - 1;
    const total =
      chunks.reduce((n, c) => n + c.flat().join(" ").length, 0) || 1;
    let t = seg.startMs;
    chunks.forEach((c, k) => {
      const share = c.flat().join(" ").length / total;
      const end =
        k === chunks.length - 1
          ? seg.endMs
          : Math.round(t + (seg.endMs - seg.startMs) * share);
      pages.push({
        startMs: t,
        endMs: end,
        lines: c.map((line) =>
          line.map((text) => ({
            text,
            startMs: t,
            endMs: end,
            emphasis: false,
          })),
        ),
      });
      t = end;
    });
  }
  return { pages, estimatedSplits };
};
