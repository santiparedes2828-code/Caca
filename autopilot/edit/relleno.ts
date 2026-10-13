import type { CaptionPage, Graphic } from "../../src/autopilot/props";
import { detectLang, findIcons, hasIcon } from "../create/theme";

// Regla del usuario (13-10-2026): en un vídeo hablado nunca pasan más de 3 s sin un B-roll o un motion graphic,
// porque se pierde la atención. Tras colocar los apoyos del plan (gráficos con datos, B-roll), cada hueco de más de
// 3 s se rellena con un «concepto»: la palabra con más peso de lo que se está diciendo en ese momento, tal cual
// (nunca un texto inventado), con su emoji si hay uno claro.
//   - tarjeta: sobre el vídeo, encima de los subtítulos; el que habla sigue a la vista (la mayoría)
//   - pantalla: escena a pantalla completa en estilo «estudio» (una de cada tres, si el hueco es largo)

type Interval = { startMs: number; endMs: number };
type Concepto = Extract<Graphic, { kind: "concepto" }>;

export const MAX_HUECO_MS = 3000;
const PRIMERO_MS = 2200; // un hueco se corta a los 2,2 s
const DURA = { tarjeta: 1600, pantalla: 1900 } as const;

const FUNCTION = new Set(
  (
    "a an the to of in on at and or but so for with we i you it is are was were be been like uh um that this then there " +
    "they he she my your our their what when just really very about from have has had do did not no yes okay oh " +
    "el la los las un una unos unas de del en y o que se lo le les mi tu su nos es son fue ser muy pero como para por con sin ya"
  ).split(" "),
);
const NUMBERS = new Set("one two three four five six seven eight nine ten hundred thousand million billion uno dos tres cuatro cinco seis siete ocho nueve diez cien mil millon".split(" "));
const HOMONYMS = new Set(["paperclip", "linked-paperclips", "shorts", "key", "old-key", "one-oclock", "first-quarter-moon"]);
const clean = (t: string) => t.replace(/[.,;:!?…"»”)]+$/u, "").replace(/^["«“(¿¡]+/u, "");

const tokensIn = (pages: CaptionPage[], a: number, b: number) =>
  pages.flatMap((p) => p.lines.flat()).filter((t) => t.startMs < b && t.endMs > a);

// La palabra con más peso: una clave del subtítulo si la hay; si no, la más larga que no sea de enlace
const pick = (pages: CaptionPage[], a: number, b: number, used: Set<string>, lang: "es" | "en") => {
  for (const pad of [0, 700, 1500]) {
    const toks = tokensIn(pages, a - pad, b + pad).filter((t) => {
      const w = clean(t.text).toLowerCase();
      return w.length >= 3 && !FUNCTION.has(w) && !NUMBERS.has(w) && !/^\d+$/.test(w);
    });
    if (!toks.length) continue;
    const fresh = toks.filter((t) => !used.has(clean(t.text).toLowerCase()));
    const pool = fresh.length ? fresh : toks;
    const withIcon = pool.filter((t) => iconFor(clean(t.text), lang));
    const pool2 = withIcon.length ? withIcon : pool;
    const key = pool2.find((t) => t.emphasis) ?? [...pool2].sort((x, y) => clean(y.text).length - clean(x.text).length)[0];
    const page = pages.find((p) => p.lines.flat().includes(key));
    const context = page
      ? page.lines
          .flat()
          .filter((t) => t !== key)
          .map((t) => clean(t.text))
          .join(" ")
      : "";
    return { text: clean(key.text), context: context.slice(0, 60) };
  }
  return null;
};

// Conceptos frecuentes en vídeos hablados de negocio y contenido → emoji (raíz de la palabra, inglés y español)
const CONCEPTS: [RegExp, string][] = [
  [/^(idea|ideas|ideation|brainstorm|creativ|creat|pensar|creativ)/, "light-bulb"],
  [/^(brain|mind|mente|cerebro|think|piens)/, "brain"],
  [/^(video|videos|film|filming|camera|grab|rodaj|shoot)/, "movie-camera"],
  [/^(edit|edici|editing|cut|cort|montaj)/, "clapper-board"],
  [/^(money|grand|dollar|million|budget|spend|cost|dinero|dolar|millon|presupuest|gast|cuesta|precio|price|paid|pay)/, "money-bag"],
  [/^(grow|growth|crec|scale|escal|increas|aument|views|vistas)/, "chart-increasing"],
  [/^(month|week|year|day|mes|semana|año|dia|calendar|schedule|advance)/, "spiral-calendar"],
  [/^(time|tiempo|hour|hora|minute|minuto|fast|rapid|quick|speed|velocidad)/, "stopwatch"],
  [/^(audience|people|viewer|fans|public|gente|seguidor|follower|community|comunidad|team|equipo)/, "busts-in-silhouette"],
  [/^(launch|lanz|start|empez|upload|subi|publish|public)/, "rocket"],
  [/^(goal|target|objetiv|meta|aim|focus|enfoq)/, "bullseye"],
  [/^(win|winner|success|exito|ganar|gana|best|mejor|top)/, "trophy"],
  [/^(work|trabaj|build|constru|making|hacer|process|proceso|system|sistema)/, "hammer-and-wrench"],
  [/^(phone|mobile|movil|celular|tiktok|instagram|reels|shorts|social|redes)/, "mobile-phone"],
  [/^(podcast|microphone|micro|voice|voz|talk|habl|interview|entrevist)/, "studio-microphone"],
  [/^(learn|aprend|teach|enseñ|book|libro|study|estudi|school|escuela|lesson|lecci)/, "books"],
  [/^(business|negocio|company|empresa|client|cliente|sell|vend|sales|ventas|deal)/, "briefcase"],
  [/^(problem|problema|mistake|error|wrong|fail|fall)/, "warning"],
  [/^(love|amor|passion|pasion|heart|corazon)/, "red-heart"],
  [/^(world|mundo|global|internacional|countr|pais)/, "globe-showing-americas"],
  [/^(question|pregunt|why|porque|how|como)/, "thinking-face"],
  [/^(attention|atencion|watch|look|mira|ver|see)/, "eyes"],
  [/^(energy|energ|power|poder|fuerza|strong)/, "high-voltage"],
];

const iconFor = (text: string, lang: "es" | "en") => {
  const w = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const [re, icon] of CONCEPTS) if (re.test(w) && hasIcon(icon)) return icon;
  // Solo coincidencias claras (en inglés, el nombre exacto del emoji): un emoji que no encaja distrae más que ninguno
  const icon = findIcons(text, { lang, max: 3, minScore: lang === "en" ? 6 : 4 }).find((i) => !HOMONYMS.has(i) && hasIcon(i));
  return icon ?? undefined;
};

export const rellenarHuecos = (o: { pages: CaptionPage[]; graphics: Graphic[]; busy: Interval[]; durationMs: number }) => {
  const lang = detectLang(o.pages.flatMap((p) => p.lines.flat().map((t) => t.text)).join(" "));
  const taken = [...o.graphics, ...o.busy].map((x) => ({ startMs: x.startMs, endMs: x.endMs })).sort((a, b) => a.startMs - b.startMs);
  const added: Concepto[] = [];
  const used = new Set<string>();
  let count = 0;
  // Huecos entre apoyos (desde el inicio hasta el final del vídeo)
  let cursor = 0;
  const walls = [...taken, { startMs: o.durationMs, endMs: o.durationMs }];
  for (const w of walls) {
    let gs = cursor;
    const ge = w.startMs;
    while (ge - gs > MAX_HUECO_MS) {
      const modo = count % 3 === 2 && ge - gs > 5000 ? "pantalla" : "tarjeta";
      // Normalmente a los 2,2 s; en un hueco justo (3–3,4 s), antes, para que quepa uno corto
      const startMs = gs + Math.max(500, Math.min(PRIMERO_MS, ge - gs - 1150));
      const endMs = Math.min(startMs + DURA[modo], ge - 250);
      if (endMs - startMs < 900) break;
      const c = pick(o.pages, startMs, endMs, used, lang);
      if (!c) {
        gs = startMs;
        continue;
      }
      used.add(c.text.toLowerCase());
      added.push({ kind: "concepto", startMs, endMs, text: c.text.slice(0, 28), context: c.context, icon: iconFor(c.text, lang), modo });
      count++;
      gs = endMs;
    }
    cursor = Math.max(cursor, w.endMs);
  }
  const graphics = [...o.graphics, ...added].sort((a, b) => a.startMs - b.startMs);
  return { graphics, added, maxGapMs: maxGap([...graphics, ...o.busy], o.durationMs) };
};

// Mayor tiempo seguido sin ningún apoyo visual (para el informe y las pruebas)
export const maxGap = (items: Interval[], durationMs: number) => {
  const xs = [...items].sort((a, b) => a.startMs - b.startMs);
  let cursor = 0;
  let max = 0;
  for (const x of xs) {
    max = Math.max(max, x.startMs - cursor);
    cursor = Math.max(cursor, x.endMs);
  }
  return Math.max(max, durationMs - cursor);
};
