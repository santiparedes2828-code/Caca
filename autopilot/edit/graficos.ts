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

type Candidate = (
  | Omit<Extract<Graphic, { kind: "calendario" }>, "startMs" | "endMs">
  | Omit<Extract<Graphic, { kind: "lista" }>, "startMs" | "endMs">
  | Omit<Extract<Graphic, { kind: "cifra" }>, "startMs" | "endMs">
  | Omit<Extract<Graphic, { kind: "comparacion" }>, "startMs" | "endMs">
) & {
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

// ——— Cifras dichas («a hundred grand», «one point five million», «35,000», «150 millones») ———
const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11,
  doce: 12, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};
const SCALES: Record<string, number> = {
  hundred: 100, cien: 100, ciento: 100, cientos: 100, thousand: 1e3, grand: 1e3, k: 1e3, mil: 1e3, million: 1e6, millions: 1e6,
  millon: 1e6, millones: 1e6, billion: 1e9, billions: 1e9,
};
const MONEY = /^(\$|dollars?|bucks|grand|usd|dolares|euros?|€)$/;

type Amount = { value: number; money: boolean; from: number; to: number };

// Una cifra empieza por un número (palabra o dígitos) y sigue mientras haya números, «point/punto», escalas o «and»
const amounts = (words: TimedWord[]): Amount[] => {
  const out: Amount[] = [];
  let i = 0;
  while (i < words.length) {
    const raw = words[i].text.toLowerCase().replace(/[.,;:!?…]+$/, "");
    const p0 = plain(words[i].text);
    const digit = raw.replace(/^\$/, "").match(/^(\d[\d,]*(?:\.\d+)?)(k|m)?$/);
    const startsA = (p0 === "a" || p0 === "an") && i + 1 < words.length && SCALES[plain(words[i + 1].text)] !== undefined;
    const startsScale = ["cien", "ciento", "mil", "hundred", "thousand"].includes(p0);
    if (!digit && UNITS[p0] === undefined && !startsA && !startsScale) {
      i++;
      continue;
    }
    let total = 0;
    let cur = 0;
    let dec = 0; // decimales tras «point»
    let decDiv = 0;
    let j = i;
    let money = raw.startsWith("$");
    for (; j < words.length; j++) {
      const r = words[j].text.toLowerCase().replace(/[.,;:!?…]+$/, "");
      const pw = plain(words[j].text);
      const d = r.replace(/^\$/, "").match(/^(\d[\d,]*(?:\.\d+)?)(k|m)?$/);
      if (j > i && /[.,;!?…]$/.test(words[j - 1].text)) break; // la frase o la pausa corta la cifra
      if (d) {
        if (j > i && (cur || total) && !decDiv) break;
        cur += Number(d[1].replace(/,/g, "")) * (d[2] === "k" ? 1e3 : d[2] === "m" ? 1e6 : 1);
        if (r.startsWith("$")) money = true;
      } else if ((pw === "a" || pw === "an") && j === i) cur = 1;
      else if (UNITS[pw] !== undefined) {
        if (decDiv) {
          dec += UNITS[pw] / decDiv;
          decDiv *= 10;
        } else cur += UNITS[pw];
      } else if ((pw === "point" || pw === "punto") && !decDiv) decDiv = 10;
      else if ((pw === "y" || pw === "and") && total && j + 1 < words.length && /^(medio|media|half)$/.test(plain(words[j + 1].text))) {
        // «un millón y medio», «a million and a half»
        total *= 1.5;
        j++;
      } else if (pw === "and" && j + 2 < words.length && plain(words[j + 1].text) === "a" && plain(words[j + 2].text) === "half" && total) {
        total *= 1.5;
        j += 2;
      } else if (pw === "and" && cur && !decDiv) continue;
      else if (SCALES[pw] !== undefined) {
        const sc = SCALES[pw];
        if (pw === "grand") money = true;
        if (sc === 100) cur = (cur || 1) * 100;
        else {
          total += ((cur || 1) + dec) * sc;
          cur = 0;
          dec = 0;
          decDiv = 0;
        }
      } else break;
    }
    const value = total + cur + dec;
    const next = j < words.length ? plain(words[j].text) : "";
    if (MONEY.test(next)) money = true;
    if (j > i && value > 0) out.push({ value, money, from: i, to: j - 1 });
    i = Math.max(j, i + 1);
  }
  return out;
};

const short1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ""));
const display = (a: { value: number; money: boolean }) => {
  const v = a.value;
  const body = v >= 1e9 ? `${short1(v / 1e9)}B` : v >= 1e6 ? `${short1(v / 1e6)}M` : v >= 1e4 && a.money ? `${short1(v / 1e3)}K` : v.toLocaleString("en-US");
  return a.money ? `$${body}` : body;
};
const TIME_MARK = /^(ago|now|today|before|then|antes|ahora|hoy|hace|currently|before|last|this|next)$/;

// Etiqueta de una cifra en una comparación: la referencia de tiempo dicha justo antes («two years ago», «now»)
const timeLabel = (words: TimedWord[], from: number, floor: number) => {
  for (let k = from - 1; k >= Math.max(floor, from - 7); k--) {
    const pw = plain(words[k].text);
    if (!TIME_MARK.test(pw)) continue;
    if (pw === "ago") return capitalize(words.slice(Math.max(floor, k - 2), k + 1).map((w) => clean(w.text)).join(" "));
    if (pw === "hace") return capitalize(words.slice(k, Math.min(k + 3, from)).map((w) => clean(w.text)).join(" "));
    return capitalize(clean(words[k].text));
  }
  return "";
};

// Lo que acompaña a una cifra sola, dicho tal cual («decisions every single day», «a video»): hasta 4 palabras
const tailLabel = (words: TimedWord[], to: number) => {
  const out: string[] = [];
  for (let k = to + 1; k < words.length && out.length < 4; k++) {
    const t = clean(words[k].text);
    if (MONEY.test(plain(words[k].text)) && !out.length) continue;
    out.push(t);
    if (/[.,;!?…]$/.test(words[k].text)) break;
  }
  return out.join(" ");
};

const figures = (words: TimedWord[]): Candidate[] => {
  const all = amounts(words).filter((a) => a.money || a.value >= 1000);
  const out: Candidate[] = [];
  for (let k = 0; k < all.length; k++) {
    const a = all[k];
    const b = all[k + 1];
    // Dos cifras de dinero (o dos grandes) a menos de 6 s: comparación con barras
    // Dos cifras de la misma frase (sin punto entre medias) a menos de 6 s: comparación con barras. Si una es dinero, la
    // otra también («a hundred grand… now one point five million»)
    const sameSentence = b && !words.slice(a.to, b.from).some((w) => SENTENCE_END.test(w.text));
    if (b && sameSentence && (a.money || b.money || (a.value >= 1000 && b.value >= 1000)) && words[b.from].startMs - words[a.to].endMs < 6000) {
      a.money = b.money = a.money || b.money;
      const la = timeLabel(words, a.from, 0);
      const lb = timeLabel(words, b.from, a.to + 1);
      out.push({
        kind: "comparacion",
        items: [
          { label: la.slice(0, 24), value: a.value, display: display(a), startMs: words[a.from].startMs },
          { label: lb.slice(0, 24), value: b.value, display: display(b), startMs: words[b.from].startMs },
        ],
        fromMs: words[a.from].startMs,
        lastMs: words[b.to].endMs,
        what: `comparación «${display(a)} → ${display(b)}»`,
      });
      k++;
      continue;
    }
    const label = tailLabel(words, a.to).slice(0, 40);
    out.push({ kind: "cifra", value: a.value, display: display(a), label, fromMs: words[a.from].startMs, lastMs: words[a.to].endMs + 900, what: `cifra «${display(a)} ${label}»` });
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
  for (const c of [...calendars(words), ...lists(words), ...figures(words)].sort((a, b) => a.fromMs - b.fromMs)) {
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
        : c.kind === "lista"
          ? { kind: "lista", startMs, endMs, items: c.items }
          : c.kind === "cifra"
            ? { kind: "cifra", startMs, endMs, value: c.value, display: c.display, label: c.label }
            : { kind: "comparacion", startMs, endMs, items: c.items },
    );
    notes.push(`Gráfico ${(startMs / 1000).toFixed(1)}–${(endMs / 1000).toFixed(1)} s: ${c.what}`);
  }
  return { graphics, notes };
};

// Intervalos ocupados por gráficos (para que emojis y páginas destacadas no coincidan con ellos)
export const graphicIntervals = (graphics: Graphic[]): Interval[] => graphics.map((g) => ({ startMs: g.startMs, endMs: g.endMs }));
