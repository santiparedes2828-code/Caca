import { isUnitAfterNumber } from "../../src/autopilot/paginate";
import type { CaptionPage, CaptionToken } from "../../src/autopilot/props";
import { detectLang, findIcons, iconDataUri, type Lang } from "../create/theme";

// Apoyos visuales de los vídeos hablados (estilo-hablado.md), sobre los subtítulos del modo impacto:
//   - página destacada: la palabra clave enorme en su propia línea (el gancho del principio y las cifras)
//   - emoji con licencia (Fluent Emoji en color) que salta junto a la palabra clave cuando hay uno claro
// Pocos y espaciados, y nunca dos a la vez: la protagonista es la persona (corrección del 12-10-2026: los efectos
// dan ritmo, no se juntan). Las fotos y vídeos (B-roll) los pone la biblioteca con licencia, aparte.

export type ApoyosOptions = {
  lang?: Lang; // si no se indica, se detecta por el texto
  hookMs?: number; // la primera palabra clave antes de este instante abre como página destacada
  featureGapMs?: number; // mínimo entre páginas destacadas
  iconGapMs?: number; // mínimo entre emojis
  gapMs?: number; // mínimo entre dos apoyos cualesquiera (nunca dos a la vez)
  iconMinMs?: number; // el emoji solo se pone si su página sigue en pantalla al menos esto desde la clave
  busy?: { startMs: number; endMs: number }[]; // apoyos gráficos a pantalla completa: mientras están, nada más
};

const isNumber = (t: string) => /\d{2,}/.test(t);

// Reparte la página destacada en líneas: lo que va antes de la clave, la clave (con su unidad si es una cifra:
// «150 millones») y lo que va después
const featureLines = (flat: CaptionToken[], k: number): CaptionToken[][] => {
  const e = isUnitAfterNumber(flat, k + 1) ? k + 2 : k + 1;
  return [flat.slice(0, k), flat.slice(k, e), flat.slice(e)].filter((l) => l.length > 0);
};

export const planApoyos = (pages: CaptionPage[], o: ApoyosOptions = {}) => {
  const text = pages.map((p) => p.lines.flat().map((t) => t.text).join(" ")).join(" ");
  const lang = o.lang ?? detectLang(text);
  const hookMs = o.hookMs ?? 3000;
  const featureGap = o.featureGapMs ?? 5000;
  const iconGap = o.iconGapMs ?? 2500;
  const gap = o.gapMs ?? 1500;
  const iconMin = o.iconMinMs ?? 600;
  const icons: Record<string, string> = {};
  const notes: string[] = [];
  let lastFeature = -Infinity;
  let lastIcon = -Infinity;
  let last = -Infinity;
  let firstKey = true;
  const out = pages.map((p): CaptionPage => {
    const flat = p.lines.flat();
    const k = flat.findIndex((t) => t.emphasis);
    if (k < 0) return p;
    const key = flat[k];
    const hook = firstKey && key.startMs < hookMs;
    firstKey = false;
    if ((o.busy ?? []).some((b) => key.startMs >= b.startMs - 300 && key.startMs < b.endMs + 300)) return p;
    // 1) Página destacada: el gancho o una cifra, como mucho una cada featureGap
    if (key.startMs - last < gap) return p;
    if ((hook || isNumber(key.text)) && key.startMs - lastFeature >= featureGap) {
      lastFeature = last = key.startMs;
      notes.push(`Página destacada en ${(key.startMs / 1000).toFixed(1)} s: «${key.text}»`);
      return { ...p, feature: true, lines: featureLines(flat, k) };
    }
    // 2) Emoji junto a la clave si hay uno claro (nombre del emoji o sinónimo), como mucho uno cada iconGap, sin
    //    repetir el mismo en el vídeo y solo si da tiempo a verlo (las claves a final de frase, que duran más)
    if (key.startMs - lastIcon < iconGap || p.endMs - key.startMs < iconMin) return p;
    const icon = findIcons(key.text, { lang, max: 1, minScore: 4 })[0];
    if (!icon || icons[icon]) return p;
    lastIcon = last = key.startMs;
    icons[icon] = iconDataUri(icon);
    notes.push(`Emoji ${icon} junto a «${key.text}» en ${(key.startMs / 1000).toFixed(1)} s`);
    return { ...p, lines: p.lines.map((l) => l.map((t) => (t === key ? { ...t, icon } : t))) };
  });
  return { pages: out, icons, lang, notes };
};
