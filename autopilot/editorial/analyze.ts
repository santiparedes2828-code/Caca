import type { TimedWord } from "../../src/autopilot/paginate";

// Análisis editorial local (sin IA): frases, rasgos, palabras clave y cambios de tema a partir de la
// transcripción con tiempos. Todo es determinista y explicable: cada puntuación lleva sus motivos.

export type Sentence = {
  id: number;
  text: string;
  startMs: number;
  endMs: number;
  firstWord: number; // índice en la lista de palabras
  lastWord: number;
  speaker: string | null;
  complete: boolean; // termina en . ? ! …
  features: {
    words: number;
    wordsPerSec: number;
    question: boolean;
    numbers: boolean;
    hook: string[]; // expresiones de gancho encontradas
    cta: boolean;
    fillers: number;
    dangling: boolean; // empieza dependiendo de lo anterior ("y", "pero", "eso"…)
  };
  score: number;
  reasons: string[];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s%]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// Expresiones de gancho (es/en). Son pistas, no reglas: suman puntos y se citan en el motivo.
const HOOKS = [
  "sabias que", "nadie te", "nadie habla", "el secreto", "la clave", "el error", "los errores", "deja de", "dejen de",
  "por que", "como hacer", "como conseguir", "lo que nadie", "la verdad", "te voy a", "te explico", "imagina",
  "nunca", "siempre", "el problema", "el mayor", "lo mas importante", "no es falta", "esto cambia", "atencion",
  "truco", "paso a paso", "en serio", "increible", "you need", "the secret", "nobody", "stop doing", "the truth", "here is why",
];
const CTA = ["escribeme", "comenta", "sigueme", "suscribete", "link en", "enlace en", "dm", "mensaje directo", "guarda este", "comparte", "follow", "subscribe", "comment"];
const FILLERS = new Set(["eh", "em", "este", "osea", "pues", "bueno", "um", "uh", "like", "mmm", "ehh"]);
const DANGLING = ["y ", "pero ", "entonces ", "porque ", "eso ", "esto ", "tambien ", "ademas ", "o sea ", "asi que ", "por eso ", "and ", "but ", "so ", "that "];
const STOP = new Set(
  (
    "a al algo algun alguna algunos ante antes asi aun aunque bien cada como con contra cual cuando de del desde donde dos el ella ellas ellos en entre era eres es esa ese eso esta este esto estos estas estoy fue ha hace hacer hay la las le les lo los mas me mi mis mucho muy nada ni no nos nosotros o os otra otro para pero poco por porque que quien se ser si sin sobre solo son su sus tambien te tengo tiene tienen todo todos tu tus un una uno unos usted vamos y ya yo the a an and or but of to in on for with is are was be it this that you your we our"
  ).split(" "),
);

export const buildSentences = (words: TimedWord[], speakers: (string | null)[] | null, pauseBreakMs = 900): Sentence[] => {
  const out: Sentence[] = [];
  let start = 0;
  const close = (end: number) => {
    const isLast = end === words.length - 1;
    if (end < start) return;
    const ws = words.slice(start, end + 1);
    const text = ws.map((w) => w.text).join(" ");
    out.push({
      id: out.length,
      text,
      startMs: ws[0].startMs,
      endMs: ws[ws.length - 1].endMs,
      firstWord: start,
      lastWord: end,
      speaker: speakers?.[start] ?? null,
      // La última frase de la grabación cuenta como completa aunque la transcripción no ponga punto
      complete: isLast || /[.?!…]["»”)]*$/.test(ws[ws.length - 1].text),
      features: { words: ws.length, wordsPerSec: 0, question: false, numbers: false, hook: [], cta: false, fillers: 0, dangling: false },
      score: 0,
      reasons: [],
    });
    start = end + 1;
  };
  words.forEach((w, i) => {
    const next = words[i + 1];
    const endsSentence = /[.?!…]["»”)]*$/.test(w.text);
    const longPause = next && next.startMs - w.endMs >= pauseBreakMs;
    const speakerChange = next && speakers && speakers[i + 1] !== speakers[i];
    if (endsSentence || longPause || speakerChange || !next) close(i);
  });
  return out;
};

export const scoreSentences = (sentences: Sentence[]) => {
  for (const s of sentences) {
    const n = norm(s.text);
    const dur = Math.max(0.2, (s.endMs - s.startMs) / 1000);
    const f = s.features;
    f.wordsPerSec = Number((f.words / dur).toFixed(2));
    f.question = /[?¿]/.test(s.text);
    f.numbers = /\d/.test(s.text) || /\b(uno|dos|tres|cuatro|cinco|diez|cien|mil|primero|segundo|tercero)\b/.test(n);
    f.hook = HOOKS.filter((h) => ` ${n} `.includes(` ${h} `));
    f.cta = CTA.some((c) => ` ${n} `.includes(` ${c} `));
    f.fillers = n.split(" ").filter((w) => FILLERS.has(w)).length;
    f.dangling = DANGLING.some((d) => (n + " ").startsWith(d));
    let score = 1;
    const reasons: string[] = [];
    if (f.hook.length) {
      score += 2 * f.hook.length;
      reasons.push(`gancho ("${f.hook.join('", "')}")`);
    }
    if (f.question) {
      score += 1.5;
      reasons.push("pregunta");
    }
    if (f.numbers) {
      score += 1;
      reasons.push("dato o número");
    }
    if (s.complete) score += 0.5;
    if (f.fillers) {
      score -= 0.5 * f.fillers;
      reasons.push(`${f.fillers} muletillas`);
    }
    if (f.wordsPerSec < 1.3) score -= 0.5; // habla lenta o con huecos
    if (f.dangling) reasons.push("depende de lo anterior");
    s.score = Number(score.toFixed(2));
    s.reasons = reasons;
  }
  return sentences;
};

const bag = (text: string) =>
  norm(text)
    .split(" ")
    .filter((w) => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .map((w) => (w.length > 5 && w.endsWith("s") ? w.slice(0, -1) : w));

// Palabras clave: frecuencia ponderada por longitud (las repetidas y largas son los conceptos del vídeo)
export const keywords = (sentences: Sentence[], max = 12) => {
  const freq = new Map<string, number>();
  for (const s of sentences) for (const w of bag(s.text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] * Math.log(b[0].length) - a[1] * Math.log(a[0].length))
    .slice(0, max)
    .map(([w, c]) => ({ word: w, count: c }));
};

// Cambios de tema al estilo TextTiling: similitud léxica entre bloques de frases vecinos;
// un mínimo local claramente bajo marca el inicio de un tema nuevo.
export const topicBoundaries = (sentences: Sentence[], block = 3) => {
  if (sentences.length < block * 2 + 1) return [] as number[];
  const vec = (from: number, to: number) => {
    const m = new Map<string, number>();
    for (const s of sentences.slice(Math.max(0, from), to)) for (const w of bag(s.text)) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  };
  const cos = (a: Map<string, number>, b: Map<string, number>) => {
    let dot = 0;
    for (const [k, v] of a) dot += v * (b.get(k) ?? 0);
    const na = Math.sqrt([...a.values()].reduce((n, v) => n + v * v, 0));
    const nb = Math.sqrt([...b.values()].reduce((n, v) => n + v * v, 0));
    return na && nb ? dot / (na * nb) : 0;
  };
  const sims = sentences.map((_, i) => (i === 0 ? 1 : cos(vec(i - block, i), vec(i, i + block))));
  const mean = sims.slice(1).reduce((n, v) => n + v, 0) / (sims.length - 1);
  const out: number[] = [];
  for (let i = block; i < sentences.length - block; i++) {
    if (sims[i] < mean * 0.5 && sims[i] <= sims[i - 1] && sims[i] <= sims[i + 1] && !out.some((b) => i - b < block)) out.push(i);
  }
  return out; // índices de la frase que abre un tema nuevo
};

// Afirmaciones que en un anuncio hay que poder demostrar (cifras, superlativos, garantías)
const CLAIM = /(\d+\s?%|\d+\s?(x|veces)|el mejor|la mejor|los mejores|numero 1|nº ?1|garantizad|100 ?%|sin riesgo|cientificamente|clinicamente|demostrado|unico|unica|el mas|la mas|best|guaranteed|proven|#1)/;
export const findClaims = (sentences: Sentence[]) =>
  sentences.filter((s) => CLAIM.test(norm(s.text) + " " + s.text.toLowerCase())).map((s) => ({ sentence: s.id, text: s.text, startMs: s.startMs }));
