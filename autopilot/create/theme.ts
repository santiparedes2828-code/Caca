import { readFileSync } from "node:fs";
import path from "node:path";
import { THEME_FONTS, themeSchema, type Theme } from "../../src/create/theme";
import { ROOT } from "../config";
import motivos from "./data/motivos-es.json";

// Elección del estilo visual de un vídeo creado: identidad de marca del cliente o tema según el contenido,
// y los iconos (motion graphics) de cada escena. Todo local y determinista; Claude, si está configurado,
// solo podría elegir entre estas mismas opciones validadas.

export type Style = "auto" | "tema" | "marca";

type Preset = { keywords: string[]; icons: string[]; theme: Theme };
const preset = (keywords: string[], icons: string[], theme: Omit<Theme, "id"> & { id: string }): Preset => ({
  keywords,
  icons,
  theme: themeSchema.parse(theme),
});

// Paletas pensadas para contraste (texto ≥ 7:1 sobre el fondo; texto sobre accent ≥ 3:1 en cuerpo grande)
export const THEME_PRESETS: Preset[] = [
  preset(["mandarina", "naranja", "limon", "lima", "pomelo", "toronja", "citrico", "clementina", "jugo", "zumo", "vitamina c"], ["tangerine", "lemon", "leafy-green"], {
    id: "citrico",
    name: "Cítrico",
    palette: { bg: "#FFF3E2", bg2: "#FFD6A0", ink: "#2A1606", accent: "#E96400", onAccent: "#FFFFFF", accent2: "#3B9B3A", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "caja",
    motion: "rebote",
    background: "burbujas",
  }),
  preset(["comida", "receta", "cocina", "cocinar", "pizza", "hamburguesa", "postre", "chocolate", "pan", "pasta", "restaurante", "desayuno", "cena", "fruta", "verdura", "comer"], ["fork-and-knife-with-plate", "pizza", "red-apple"], {
    id: "comida",
    name: "Comida",
    palette: { bg: "#FFF6EC", bg2: "#FFDDBF", ink: "#2B1408", accent: "#D93A2B", onAccent: "#FFFFFF", accent2: "#F2A900", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "caja",
    motion: "rebote",
    background: "burbujas",
  }),
  preset(["salud", "medico", "nutricion", "dieta", "sueno", "dormir", "estres", "ansiedad", "bienestar", "hidratacion", "agua", "vitamina", "habito", "meditacion"], ["green-heart", "droplet", "sparkles"], {
    id: "salud",
    name: "Salud",
    palette: { bg: "#F1FBF8", bg2: "#CDEEE4", ink: "#0E2A25", accent: "#0B7A6B", onAccent: "#FFFFFF", accent2: "#6FCDB7", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "subrayado",
    motion: "suave",
    background: "degradado",
  }),
  preset(["gimnasio", "gym", "entrenamiento", "entrenar", "musculo", "deporte", "futbol", "correr", "running", "fitness", "pesas", "rutina", "cardio"], ["flexed-biceps", "fire", "person-running"], {
    id: "deporte",
    name: "Deporte",
    palette: { bg: "#0E0E10", bg2: "#1D1D24", ink: "#F5F5F0", accent: "#C6FF3D", onAccent: "#0E0E10", accent2: "#FF4D2E", card: "#25252E" },
    font: "inter",
    captionStyle: "caja",
    motion: "energico",
    background: "patron",
  }),
  preset(["tecnologia", "inteligencia artificial", "ia", "app", "aplicacion", "software", "programacion", "codigo", "celular", "movil", "internet", "computadora", "ordenador", "robot", "chatgpt"], ["robot", "laptop", "high-voltage"], {
    id: "tecnologia",
    name: "Tecnología",
    palette: { bg: "#0B1020", bg2: "#18214A", ink: "#EEF2FF", accent: "#6B95FF", onAccent: "#0B1020", accent2: "#B072FF", card: "#1B2550" },
    font: "inter",
    captionStyle: "color",
    motion: "energico",
    background: "patron",
  }),
  preset(["dinero", "ahorro", "ahorrar", "inversion", "invertir", "finanzas", "negocio", "ventas", "vender", "emprender", "emprendimiento", "empresa", "marketing", "cliente", "precio", "sueldo"], ["money-bag", "chart-increasing", "coin"], {
    id: "finanzas",
    name: "Finanzas",
    palette: { bg: "#F6F4EE", bg2: "#E6DEC8", ink: "#10223D", accent: "#10223D", onAccent: "#F6D27A", accent2: "#C8961E", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "subrayado",
    motion: "suave",
    background: "degradado",
  }),
  preset(["belleza", "maquillaje", "piel", "skincare", "moda", "ropa", "cabello", "pelo", "unas", "perfume", "estilo", "outfit"], ["lipstick", "sparkles", "dress"], {
    id: "belleza",
    name: "Belleza",
    palette: { bg: "#FFF1F3", bg2: "#F9D0DA", ink: "#3A1028", accent: "#B8155A", onAccent: "#FFFFFF", accent2: "#F48FB1", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "color",
    motion: "suave",
    background: "burbujas",
  }),
  preset(["viaje", "viajar", "playa", "vacaciones", "hotel", "avion", "vuelo", "montana", "turismo", "destino", "ciudad", "pais"], ["airplane", "beach-with-umbrella", "world-map"], {
    id: "viajes",
    name: "Viajes",
    palette: { bg: "#EAF6FF", bg2: "#BCE0FF", ink: "#0B2540", accent: "#0069B8", onAccent: "#FFFFFF", accent2: "#FFC24B", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "caja",
    motion: "rebote",
    background: "burbujas",
  }),
  preset(["planta", "plantas", "jardin", "bosque", "arbol", "naturaleza", "reciclaje", "reciclar", "ecologia", "clima", "medio ambiente", "flor", "semilla"], ["seedling", "deciduous-tree", "herb"], {
    id: "naturaleza",
    name: "Naturaleza",
    palette: { bg: "#F2F8EC", bg2: "#D3E8BE", ink: "#1D2B12", accent: "#3A7420", onAccent: "#FFFFFF", accent2: "#A3C85A", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "subrayado",
    motion: "suave",
    background: "patron",
  }),
  preset(["perro", "gato", "mascota", "cachorro", "gatito", "veterinario", "animal", "animales"], ["dog-face", "cat-face", "paw-prints"], {
    id: "mascotas",
    name: "Mascotas",
    palette: { bg: "#FFF8E8", bg2: "#FFE2A0", ink: "#2E2110", accent: "#8A4B14", onAccent: "#FFFFFF", accent2: "#FFB703", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "caja",
    motion: "rebote",
    background: "burbujas",
  }),
  preset(["musica", "cancion", "cantante", "concierto", "cine", "pelicula", "serie", "videojuego", "juego", "fiesta", "baile"], ["musical-notes", "headphone", "clapper-board"], {
    id: "entretenimiento",
    name: "Entretenimiento",
    palette: { bg: "#12061F", bg2: "#2C0D4A", ink: "#FCEFFF", accent: "#FF3DAE", onAccent: "#12061F", accent2: "#3DDCFF", card: "#2E1450" },
    font: "inter",
    captionStyle: "color",
    motion: "energico",
    background: "burbujas",
  }),
  preset(["dato", "curiosidad", "curioso", "ciencia", "historia", "aprender", "sabias", "sabia", "explicacion", "estudio", "escuela", "universidad", "examen"], ["light-bulb", "brain", "books"], {
    id: "curiosidades",
    name: "Curiosidades",
    palette: { bg: "#F4F0FF", bg2: "#D9CEFF", ink: "#1C1240", accent: "#5F33E6", onAccent: "#FFFFFF", accent2: "#FFC83D", card: "#FFFFFF" },
    font: "inter",
    captionStyle: "caja",
    motion: "energico",
    background: "patron",
  }),
];

export const GENERAL_PRESET: Preset = preset([], ["sparkles", "light-bulb", "fire"], {
  id: "general",
  name: "General",
  palette: { bg: "#FAFAF7", bg2: "#E9E7DF", ink: "#121212", accent: "#E8492A", onAccent: "#FFFFFF", accent2: "#3D5AFE", card: "#FFFFFF" },
  font: "inter",
  captionStyle: "caja",
  motion: "energico",
  background: "burbujas",
});

export const presetById = (id: string) => [...THEME_PRESETS, GENERAL_PRESET].find((p) => p.theme.id === id) ?? null;

// ——— Texto ———

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Plural → singular, lo justo para emparejar "mandarinas" con "mandarina" o "limones" con "limon"
const stem = (w: string) => (w.length > 4 && /[^aeiou]es$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

const STOP = new Set(
  "que los las una uno unos unas del por para con sin sobre como pero mas muy esto esta este eso esa ese estos estas esos esas aqui alli ahi asi todo toda todos todas cada otro otra otros otras sus mis tus nos les ser son era eran fue han hay tiene tienen tener hace hacer puede pueden debe deben vez veces solo tambien aunque porque cuando donde quien cual cuales algo nada nadie mismo misma entre hasta desde hacia segun video videos tiktok viral reel reels shorts sobre"
    .split(" "),
);

const tokens = (text: string) =>
  norm(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem);

// ——— Tema ———

export const pickPreset = (text: string): Preset => {
  const t = ` ${norm(text)} `;
  const toks = new Set(tokens(text));
  let best: Preset | null = null;
  let bestScore = 0;
  for (const p of THEME_PRESETS) {
    let score = 0;
    for (const k of p.keywords) {
      if (k.includes(" ")) score += t.includes(` ${k} `) ? 2 : 0;
      else if (toks.has(stem(k))) score += 1;
    }
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best ?? GENERAL_PRESET;
};

// El contenido habla de la propia marca del cliente → su identidad; si no, tema según el contenido
export const resolveStyle = (style: Style, text: string, brandName: string): "tema" | "marca" => {
  if (style !== "auto") return style;
  const b = norm(brandName);
  return b && ` ${norm(text)} `.includes(` ${b} `) ? "marca" : "tema";
};

// ——— Iconos ———
// Regla de la casa: emojis estilo iOS. Los de Apple son propiedad de Apple y solo tienen licencia para usarse
// en sus dispositivos, así que se usa el set con licencia más parecido: Fluent Emoji en color (Microsoft, MIT),
// con brillo y degradados. Para cambiarlo: EMOJI_SET y regenerar el índice (scripts/motivos.ts).
export const EMOJI_SET = "fluent-emoji";

type Motif = { icon: string; label: string; tags: string[]; group: number };
const index = (motivos as { entradas: Motif[] }).entradas.map((m) => ({
  ...m,
  labelTokens: tokens(m.label),
  tagTokens: new Set(m.tags.flatMap(tokens)),
}));

// Puntuación de cada icono para un texto: nombre exacto > primera palabra del nombre > resto del nombre > etiquetas.
// Los símbolos (grupo 8: formas, flechas, colores) cuentan poco para no confundir "naranja" con "círculo naranja".
export const findIcons = (text: string, opts: { preferGroups?: number[]; max?: number } = {}) => {
  const toks = tokens(text);
  if (!toks.length) return [];
  const scores = new Map<string, number>();
  for (const m of index) {
    let s = 0;
    for (const t of toks) {
      if (m.labelTokens.length === 1 && m.labelTokens[0] === t) s += 6;
      else if (m.labelTokens[0] === t) s += 4;
      else if (m.labelTokens.includes(t)) s += 1.5;
      else if (m.tagTokens.has(t)) s += 1;
    }
    if (!s) continue;
    if (m.group === 8) s *= 0.3;
    if (opts.preferGroups?.includes(m.group)) s *= 1.6;
    scores.set(m.icon, Math.max(scores.get(m.icon) ?? 0, s));
  }
  return [...scores.entries()]
    .filter(([, s]) => s >= 1.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, opts.max ?? 5)
    .map(([icon]) => icon);
};

let iconSet: { icons: Record<string, { body: string; width?: number; height?: number }>; width?: number; height?: number } | null = null;
const loadIconSet = () =>
  (iconSet ??= JSON.parse(readFileSync(path.join(ROOT, `node_modules/@iconify-json/${EMOJI_SET}/icons.json`), "utf8")));

export const hasIcon = (name: string) => !!loadIconSet().icons[name];

// SVG del icono como data URI (el contenido viene del paquete instalado, nunca de la IA)
export const iconDataUri = (name: string) => {
  const set = loadIconSet();
  const icon = set.icons[name];
  if (!icon) throw new Error(`Icono desconocido: ${name}`);
  const w = icon.width ?? set.width ?? 32;
  const h = icon.height ?? set.height ?? 32;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 16}" height="${h * 16}" viewBox="0 0 ${w} ${h}">${icon.body}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

export const ICON_CREDIT = (motivos as { fuente: { iconos: string } }).fuente.iconos;

// ——— Plan visual de un vídeo con tema ———

const FOOD = ["citrico", "comida"];
const NATURE = ["naturaleza", "mascotas"];
const POINTER = "backhand-index-pointing-down";
const CHECK = "check-mark-button";

type SceneIn = { text: string; accentWords: number[]; component: string; items: string[] };

export const planTheme = (opts: { topic: string; scenes: SceneIn[]; presetId?: string | null }) => {
  const all = `${opts.topic} ${opts.scenes.map((s) => s.text).join(" ")}`;
  const byId = opts.presetId ? presetById(opts.presetId) : null;
  if (opts.presetId && !byId) throw new Error(`Tema desconocido: ${opts.presetId} (válidos: ${[...THEME_PRESETS, GENERAL_PRESET].map((p) => p.theme.id).join(", ")})`);
  // La idea manda; si no dice nada reconocible, se mira también el guion
  let preset = byId ?? pickPreset(opts.topic);
  if (!byId && preset.theme.id === "general") preset = pickPreset(all);
  const prefer = FOOD.includes(preset.theme.id) ? [4] : NATURE.includes(preset.theme.id) ? [3] : [];
  const find = (t: string, max = 5) => findIcons(t, { preferGroups: prefer, max });
  // Iconos del tema: lo que dice la idea primero, luego los del estilo
  const topicIcons = find(opts.topic, 3);
  const bgIcons = [...new Set([...topicIcons, ...preset.icons])].slice(0, 3);
  const fallback = [...new Set([...topicIcons, ...find(all, 3), ...preset.icons])];
  // 1) Escenas con coincidencias: manda la palabra destacada, luego el resto del texto, sin repetir seguido
  const picked: (string | null)[] = [];
  for (const s of opts.scenes) {
    const words = s.text.split(" ");
    const accent = s.accentWords.map((i) => words[i]).join(" ");
    const cands = [...(accent ? find(accent) : []), ...find(s.text)];
    picked.push(cands.find((i) => i !== picked[picked.length - 1]) ?? null);
  }
  // 2) Escenas sin coincidencias: se alternan los iconos del tema, distintos de los vecinos
  let k = 0;
  for (let i = 0; i < picked.length; i++) {
    if (picked[i]) continue;
    for (let tries = 0; tries < fallback.length && !picked[i]; tries++) {
      const c = fallback[k++ % fallback.length];
      if (c !== picked[i - 1] && c !== picked[i + 1]) picked[i] = c;
    }
  }
  const scenes = opts.scenes.map((s, i) => ({
    icon: picked[i],
    itemIcons: s.component === "lista" ? s.items.map((it) => find(it, 1)[0] ?? CHECK) : [],
  }));
  const pointerIcon = opts.scenes.some((s) => s.component === "cta") ? POINTER : null;
  const names = [...new Set([...bgIcons, ...scenes.flatMap((s) => [...(s.icon ? [s.icon] : []), ...s.itemIcons]), ...(pointerIcon ? [pointerIcon] : [])])];
  const icons = Object.fromEntries(names.map((n) => [n, iconDataUri(n)]));
  const font = THEME_FONTS[preset.theme.font].family;
  return { theme: preset.theme, bgIcons, scenes, pointerIcon, icons, credits: [`Iconos: ${ICON_CREDIT}`, `Fuente: ${font} · SIL Open Font License 1.1 (public/fonts/licencias)`] };
};
