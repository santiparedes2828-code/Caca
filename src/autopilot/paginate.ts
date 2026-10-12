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
  // "frase": una palabra destacada por frase corta (modo impacto, ver phraseEmphasis)
  emphasisPer?: "pagina" | "frase";
  // Fraseo de los vídeos hablados (modo impacto): página nueva también tras una coma, y ninguna página acaba en
  // palabra de función («in», «de», «the») ni separa una cifra de su unidad («150 / millones»)
  phrasing?: boolean;
};

const SENTENCE_END = /[.?!…]["»”)]*$/;

// Palabras vacías frecuentes (es/en) que nunca se destacan
const STOP = new Set(
  (
    "para pero porque como cuando donde desde hasta sobre entre este esta estos estas ese esa esos esas aquel " +
    "todo toda todos todas nada algo cada otro otra otros otras mismo misma tiene tienen hacer puede pueden " +
    "también siempre nunca ahora antes después muy más menos tanto solo sólo there their about would could should " +
    "these those which where while because really porque entonces realmente básicamente literalmente tenemos estamos " +
    "estaba estaban nuestro nuestra nosotros ustedes alguien cualquier mientras bastante demasiado haciendo diciendo " +
    "before after people things something anything everything actually basically literally little pretty always " +
    "another around through without between during within myself yourself themselves against across almost already " +
    "though although whether thinking talking saying getting making"
  ).split(" "),
);

// Palabras que se repiten mucho pero no dicen nada por sí solas: no sirven de clave aunque el plan las cuente
const WEAK = new Set(
  "first second third last next year years day days time times thing things week weeks month months primero primera segundo segunda ultimo ultima año años dia dias vez veces cosa cosas semana semanas mes meses".split(
    " ",
  ),
);

// Palabras de función (es/en) que no deberían cerrar una página en el modo impacto: se leen con la siguiente
const FUNCTION = new Set(
  (
    "a an the of in on at to for with from by into and or but so our your my his her their its this that these those " +
    "de del la el lo los las un una unos unas y e o u ni en con por para sin al a su sus mi mis tu tus nuestro nuestra " +
    "nuestros nuestras que como pero se le les me te nos muy mas más"
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

// Cifras y sus unidades: «150 millones», «90 días» se leen juntas, así que la unidad nunca se destaca sola
const UNIT = new Set(
  "million millions billion billions thousand thousands percent millon millones mil miles billon billones porciento euros dolares dollars pesos days dias weeks semanas months meses years anos hours horas minutes minutos".split(
    " ",
  ),
);
const plain = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
export const isUnitAfterNumber = (words: { text: string }[], i: number) =>
  i > 0 && i < words.length && /\d/.test(words[i - 1].text) && UNIT.has(plain(words[i].text));

const PHRASE_END = /[.?!…,;:]["»”)]*$/;

export type PhraseEmphasisOptions = {
  pauseMs?: number; // una pausa así de larga también cierra la frase
  perWords?: number; // una clave más por cada tantas palabras de la frase
  minGapMs?: number; // separación mínima entre dos claves
};

// Palabras destacadas de los vídeos hablados (modo impacto): una por frase corta (final de frase, coma o pausa) y
// otra más cada ~6 palabras si queda a ≥ 1,2 s de las demás, para que el color y el tamaño no pierdan fuerza. Manda la
// cifra (2 dígitos o más; su unidad va con ella), luego el concepto del plan (sin palabras flojas como «first» o
// «año») y si no la palabra de contenido (≥ 6 letras) más al final: en español y en inglés lo nuevo va al final.
export const phraseEmphasis = (words: TimedWord[], keywords: string[] = [], o: PhraseEmphasisOptions = {}) => {
  const pauseMs = o.pauseMs ?? 700;
  const perWords = o.perWords ?? 6;
  const minGap = o.minGapMs ?? 1200;
  const strong = new Set(keywords.filter((k) => !WEAK.has(keyForm(k)) && !STOP.has(bare(k))).map(keyForm));
  const level = (i: number) => {
    const t = words[i].text;
    if (/\d{2,}/.test(t)) return 3;
    if (isUnitAfterNumber(words, i) || WEAK.has(keyForm(t)) || STOP.has(bare(t))) return 0;
    if (strong.has(keyForm(t))) return 2;
    return bare(t).length > 5 ? 1 : 0;
  };
  const picked: number[] = [];
  let start = 0;
  words.forEach((w, i) => {
    const next = words[i + 1];
    if (next && !PHRASE_END.test(w.text) && next.startMs - w.endMs < pauseMs) return;
    const max = Math.ceil((i + 1 - start) / perWords);
    const ranked = Array.from({ length: i + 1 - start }, (_, k) => start + k)
      .filter((j) => level(j) > 0)
      .sort((a, b) => level(b) - level(a) || b - a);
    let n = 0;
    for (const j of ranked) {
      if (n >= max) break;
      if (picked.some((c) => Math.abs(words[c].startMs - words[j].startMs) < minGap)) continue;
      picked.push(j);
      n++;
    }
    start = i + 1;
  });
  return new Set(picked);
};

export const paginateWords = (
  words: TimedWord[],
  o: PaginateOptions,
): CaptionPage[] => {
  const holdMs = o.holdMs ?? 400;
  const perSentence = o.emphasis && o.emphasisPer === "frase" ? phraseEmphasis(words, o.keywords) : null;
  const index = new Map(words.map((w, i) => [w, i]));
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
    const next = words[i + 1];
    if (count > 0) {
      const pause = prev && w.startMs - prev.endMs >= o.pauseBreakMs;
      const sentence = prev && (o.phrasing ? PHRASE_END : SENTENCE_END).test(prev.text);
      // Fraseo: si esta palabra cerraría la página y es de función (o una cifra cuya unidad va detrás), abre la
      // siguiente, salvo que la página quedara demasiado corta para leerla (< 300 ms)
      const closes =
        count + 1 >= o.maxWordsPerPage &&
        !!next &&
        !PHRASE_END.test(w.text) &&
        next.startMs - w.endMs < o.pauseBreakMs &&
        w.startMs - lines[0][0].startMs >= 300;
      const dangling = !!o.phrasing && closes && (FUNCTION.has(bare(w.text)) || isUnitAfterNumber(words, i + 1));
      if (count >= o.maxWordsPerPage || pause || sentence || dangling) flush();
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
    const emph = o.emphasis && !perSentence ? pickEmphasis(flat, o.keywords) : -1;
    let idx = 0;
    return {
      startMs: first.startMs,
      endMs: next ? Math.min(endMs, next.startMs) : endMs,
      lines: g.map((line) =>
        line.map((w): CaptionToken => {
          const emphasis = perSentence ? perSentence.has(index.get(w)!) : idx === emph;
          idx++;
          return { text: w.text, startMs: w.startMs, endMs: w.endMs, emphasis };
        }),
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
