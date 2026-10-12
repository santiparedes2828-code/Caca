import { readFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { type Cues, type SceneFx, type SFX_NAMES, THEME_FONTS, themeSchema, type Theme } from "../../src/create/theme";
import { chainTimeline, cueFrame, iconFrame, itemFrames, odometerDuration, sceneStartFrame, STEP, typingSchedule, valueFrame } from "../../src/create/timeline";
import { ROOT } from "../config";
import motivos from "./data/motivos-es.json";

// Elección del estilo visual de un vídeo creado: identidad de marca del cliente o tema según el contenido,
// y los iconos (motion graphics) de cada escena. Todo local y determinista; Claude, si está configurado,
// solo podría elegir entre estas mismas opciones validadas.

export type Style = "auto" | "tema" | "marca";

type Preset = { keywords: string[]; icons: string[]; theme: Theme };
const preset = (keywords: string[], icons: string[], theme: z.input<typeof themeSchema>): Preset => ({
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
  preset(["belleza", "maquillaje", "piel", "skincare", "moda", "ropa", "cabello", "pelo", "unas", "perfume", "outfit"], ["lipstick", "sparkles", "dress"], {
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
  preset(
    ["einstein", "newton", "tesla", "curie", "darwin", "hawking", "fisica", "quimica", "relatividad", "cientifico", "atomo", "universo", "espacio", "galaxia", "planeta", "estrella", "gravedad", "cuantica", "nasa", "astronauta", "nobel", "luz", "energia"],
    ["atom-symbol", "glowing-star", "milky-way"],
    {
      id: "ciencia",
      name: "Ciencia",
      palette: { bg: "#070B1A", bg2: "#161C44", ink: "#F4F6FF", accent: "#FFD24A", onAccent: "#0B0F24", accent2: "#6CE1FF", card: "#1B2352" },
      font: "inter",
      captionStyle: "brillo",
      motion: "energico",
      background: "estrellas",
      sceneTransition: "destello",
    },
  ),
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

// Plural → singular, lo justo para emparejar "mandarinas" con "mandarina", "limones" con "limon", "luces" con "luz"
// y "patentes" con "patente" (el "-es" solo se quita tras las consonantes que lo piden en español)
const stem = (w: string) =>
  w.length > 4 && /[lnrdjy]es$/.test(w)
    ? w.slice(0, -2)
    : w.length > 4 && w.endsWith("ces")
      ? `${w.slice(0, -3)}z`
      : w.length > 3 && w.endsWith("s")
        ? w.slice(0, -1)
        : w;

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

// Las instrucciones de producción («con música baja», «efectos de sonido», «subtítulos…», «duración…») no
// cuentan para elegir el tema: describen el vídeo, no de qué trata
export const stripProduction = (text: string) =>
  text
    .replace(/(con |y )?(m[uú]sica|efectos? de sonido|subt[ií]tulos?|tipograf[ií]as?|duraci[oó]n)[^,.;\n]*/gi, " ")
    .replace(/(estilo |con |en )?(motion graphics?|animaciones avanzadas)/gi, " ")
    .replace(/\bcon (muchas |varias )?animaciones\b/gi, " ");

export const pickPreset = (text: string): Preset => {
  text = stripProduction(text);
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
// Palabras frecuentes en guiones que no son el nombre de ningún emoji: se emparejan a mano con el icono más claro
const SINONIMOS: Record<string, string> = {
  nobel: "trophy",
  premio: "trophy",
  fisica: "atom-symbol",
  atomo: "atom-symbol",
  cientifico: "scientist",
  ciencia: "microscope",
  einstein: "scientist",
  ecuacion: "abacus",
  formula: "abacus",
  patente: "page-facing-up",
  articulo: "newspaper",
  universo: "milky-way",
  galaxia: "milky-way",
  espacio: "milky-way",
  tiempo: "hourglass-not-done",
  relatividad: "ringed-planet",
  gravedad: "ringed-planet",
  genio: "brain",
  luz: "light-bulb",
  energia: "high-voltage",
  estrella: "glowing-star",
  // Redes y vídeo (lo que más sale en los guiones de los clientes)
  vista: "eyes",
  visita: "eyes",
  seguidor: "busts-in-silhouette",
  like: "red-heart",
  comentario: "speech-balloon",
  guarda: "bookmark",
  guardar: "bookmark",
  guion: "memo",
  voz: "studio-microphone",
  edicion: "clapper-board",
  editar: "clapper-board",
  animacion: "film-frames",
  grabar: "movie-camera",
  camara: "movie-camera",
};
const index = [
  ...(motivos as { entradas: Motif[] }).entradas,
  ...Object.entries(SINONIMOS).map(([word, icon]) => ({ icon, label: word, tags: [], group: 7 })),
].map((m) => ({
  ...m,
  labelTokens: tokens(m.label),
  tagTokens: new Set(m.tags.flatMap(tokens)),
}));

// Puntuación de cada icono para un texto: nombre exacto > primera palabra del nombre > resto del nombre > etiquetas.
// Los símbolos (grupo 8: formas, flechas, colores) cuentan poco para no confundir "naranja" con "círculo naranja".
export const findIcons = (text: string, opts: { preferGroups?: number[]; max?: number; minScore?: number } = {}) => {
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
    .filter(([, s]) => s >= (opts.minScore ?? 1.5))
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
// Escenas cuyo protagonista es otro gráfico (sin icono grande)
const NO_STICKER = new Set(["modelo", "cadena", "paso", "prompt"]);

export const planTheme = (opts: { topic: string; scenes: SceneIn[]; presetId?: string | null }) => {
  const topic = stripProduction(opts.topic);
  const all = `${topic} ${opts.scenes.map((s) => s.text).join(" ")}`;
  const byId = opts.presetId ? presetById(opts.presetId) : null;
  if (opts.presetId && !byId) throw new Error(`Tema desconocido: ${opts.presetId} (válidos: ${[...THEME_PRESETS, GENERAL_PRESET].map((p) => p.theme.id).join(", ")})`);
  // La idea manda; si no dice nada reconocible, se mira también el guion
  let preset = byId ?? pickPreset(topic);
  if (!byId && preset.theme.id === "general") preset = pickPreset(all);
  const prefer = FOOD.includes(preset.theme.id) ? [4] : NATURE.includes(preset.theme.id) ? [3] : [];
  const find = (t: string, max = 5, minScore = 2) => findIcons(t, { preferGroups: prefer, max, minScore });
  // Iconos del tema: lo que dice la idea primero, luego los del estilo. Para el texto entero solo valen
  // coincidencias claras (el nombre del emoji), no palabras sueltas como «detrás» o «línea»
  const topicIcons = find(topic, 3, 4);
  const bgIcons = [...new Set([...topicIcons, ...preset.icons])].slice(0, 3);
  const fallback = [...new Set([...topicIcons, ...find(all, 3, 4), ...preset.icons])];
  // 1) Escenas con coincidencias: manda la palabra destacada, luego el resto del texto, sin repetir seguido
  const picked: (string | null)[] = [];
  for (const s of opts.scenes) {
    if (NO_STICKER.has(s.component)) {
      picked.push(null);
      continue;
    }
    const words = s.text.split(" ");
    const accent = s.accentWords.map((i) => words[i]).join(" ");
    const cands = [...(accent ? find(accent) : []), ...find(s.text)];
    picked.push(cands.find((i) => i !== picked[picked.length - 1]) ?? null);
  }
  // 2) Escenas sin coincidencias: se alternan los iconos del tema, distintos de los vecinos
  let k = 0;
  for (let i = 0; i < picked.length; i++) {
    if (picked[i] || NO_STICKER.has(opts.scenes[i].component)) continue;
    for (let tries = 0; tries < fallback.length && !picked[i]; tries++) {
      const c = fallback[k++ % fallback.length];
      if (c !== picked[i - 1] && c !== picked[i + 1]) picked[i] = c;
    }
  }
  // Cadena: iconos solo si todos los bloques tienen uno (si no, todos llevan sus iniciales, como el «Aa»)
  const chainIcons = (items: string[]) => {
    const found = items.map((it) => find(it, 1)[0]);
    return found.every(Boolean) ? (found as string[]) : [];
  };
  const scenes = opts.scenes.map((s, i) => ({
    icon: picked[i],
    itemIcons: s.component === "lista" ? s.items.map((it) => find(it, 1)[0] ?? CHECK) : s.component === "cadena" ? chainIcons(s.items) : [],
  }));
  const pointerIcon = opts.scenes.some((s) => s.component === "cta") ? POINTER : null;
  const names = [...new Set([...bgIcons, ...scenes.flatMap((s) => [...(s.icon ? [s.icon] : []), ...s.itemIcons]), ...(pointerIcon ? [pointerIcon] : [])])];
  const icons = Object.fromEntries(names.map((n) => [n, iconDataUri(n)]));
  const font = THEME_FONTS[preset.theme.font].family;
  return { theme: preset.theme, bgIcons, scenes, pointerIcon, icons, credits: [`Iconos: ${ICON_CREDIT}`, `Fuente: ${font} · SIL Open Font License 1.1 (public/fonts/licencias)`] };
};

// ——— Dinamismo ———
// Las animaciones de estilo-animaciones.md son recursos para dar ritmo, no un paquete: el 12-10-2026 el usuario pidió
// no usarlas todas juntas, sino para dar dinamismo. Reparto:
// - En las escenas de solo texto (las que más se parecen a una diapositiva), una de cada dos lleva una animación
//   especial, alternando la máscara y la cámara que sigue; nunca dos en la misma escena ni la misma seguida.
//   La primera escena (el gancho) abre con la máscara.
// - Las escenas con gráfico propio (lista, cifra, modelo, cadena, paso, tarjeta, llamada a la acción) ya se mueven:
//   no llevan más.
// - Entre escenas, la transición del tema salvo una transformación (dos en vídeos largos) donde la escena que sale
//   tiene icono: hacia la llamada a la acción o cerca de la mitad. La escena que llega así no lleva otra especial.
// - En los temas enérgicos, algún corte seco entre dos escenas cortas, nunca dos seguidos.

const OWN_MOTION = new Set(["lista", "cifra", "modelo", "cadena", "paso", "prompt", "cta"]);
const WITH_ICON = new Set(["titular", "lista", "cifra", "cta"]);
type DynScene = { component: string; from: number; to: number; icon: string | null };

export const planDynamics = (scenes: DynScene[], caps: { startMs: number; endMs: number }[], theme: Theme): SceneFx[] => {
  const n = scenes.length;
  const fx: SceneFx[] = scenes.map(() => ({ reveal: null, camera: null, sceneTransition: null }));
  // 1) Transformaciones
  const morphs: number[] = [];
  const want = n >= 8 ? 2 : n >= 3 ? 1 : 0;
  const cands = Array.from({ length: Math.max(0, n - 1) }, (_, i) => i + 1).filter((k) => WITH_ICON.has(scenes[k - 1].component) && !!scenes[k - 1].icon);
  const score = (k: number) => (scenes[k].component === "cta" ? 100 : 0) - Math.abs(k - n / 2);
  for (const k of [...cands].sort((x, y) => score(y) - score(x) || x - y)) {
    if (morphs.length < want && morphs.every((m) => Math.abs(m - k) > 1)) morphs.push(k);
  }
  for (const k of morphs) fx[k].sceneTransition = "transforma";
  // 2) Texto y cámara en las escenas de solo texto, una de cada dos y alternando
  let plain = 0;
  let next: "mascara" | "sigue" = "mascara";
  scenes.forEach((s, k) => {
    if (OWN_MOTION.has(s.component)) return;
    const turn = plain++ % 2 === 0;
    if (!turn || fx[k].sceneTransition === "transforma") return;
    // La cámara que sigue luce con texto que recorrer (5 palabras o más); si no, máscara
    const pick = next === "sigue" && s.to - s.from + 1 < 5 ? "mascara" : next;
    if (pick === "mascara" && theme.reveal !== "mascara") fx[k].reveal = "mascara";
    if (pick === "sigue" && theme.camera !== "sigue") fx[k].camera = "sigue";
    next = pick === "mascara" ? "sigue" : "mascara";
  });
  // 3) Cortes secos entre escenas cortas (< 2 s) en los temas enérgicos
  if (theme.motion === "energico") {
    const dur = (s: DynScene) => (caps[s.to].endMs - caps[s.from].startMs) / 1000;
    let prev = false;
    for (let k = 1; k < n; k++) {
      const cut: boolean = !prev && !fx[k].sceneTransition && dur(scenes[k - 1]) < 2 && dur(scenes[k]) < 2;
      if (cut) fx[k].sceneTransition = "corte";
      prev = cut;
    }
  }
  return fx;
};

// Resumen para el informe: dónde va cada animación especial (escenas numeradas desde 1)
export const describeDynamics = (fx: SceneFx[]) => {
  const at = (pred: (f: SceneFx) => boolean) =>
    fx
      .map((f, i) => (pred(f) ? i + 1 : 0))
      .filter(Boolean)
      .join(", ");
  const parts = [
    [at((f) => f.reveal === "mascara"), "máscara en la escena"],
    [at((f) => f.camera === "sigue"), "cámara que sigue en la escena"],
    [at((f) => f.sceneTransition === "transforma"), "transformación al llegar a la escena"],
    [at((f) => f.sceneTransition === "corte"), "corte seco al llegar a la escena"],
  ].filter(([where]) => where);
  return parts.map(([where, what]) => `${what} ${where}`).join(" · ");
};

// ——— Sincronía con la voz ———
// Para cada escena, la palabra (índice en los subtítulos) en que se nombra cada pieza: el icono, cada elemento
// de una lista o una cadena y la cifra o la palabra del CTA. La composición los hace entrar en ese momento.

const UNIDADES = "cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte veintiuno veintidos veintitres veinticuatro veinticinco veintiseis veintisiete veintiocho veintinueve".split(" ");
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
// Primera palabra con la que se dice un número en español ("1000" → "mil", "35" → "treinta", "2500" → "dos")
export const firstNumberWord = (n: number): string => {
  if (n < 30) return UNIDADES[n];
  if (n < 100) return DECENAS[Math.floor(n / 10)];
  if (n === 100) return "cien";
  if (n < 1000) return CENTENAS[Math.floor(n / 100)];
  if (n < 2000) return "mil";
  if (n < 1_000_000) return firstNumberWord(Math.floor(n / 1000));
  if (n < 2_000_000) return "un";
  return firstNumberWord(Math.floor(n / 1_000_000));
};

type CueScene = { from: number; to: number; accent: [number, number] | null; component: string; items: string[]; label: string; value: string };

const wordKeys = (w: string) => {
  const n = norm(w).replace(/ /g, "");
  return new Set([n, stem(n)]);
};

export const planCues = (caps: { text: string }[], scenes: CueScene[], icons: (string | null)[]): Cues[] =>
  scenes.map((s, k) => {
    const range = Array.from({ length: s.to - s.from + 1 }, (_, i) => s.from + i);
    const keys = range.map((i) => wordKeys(caps[i].text));
    const findWord = (cands: string[], after = -1) => {
      const want = cands.flatMap((c) => [...wordKeys(c)]).filter(Boolean);
      const j = range.findIndex((i, n) => i > after && want.some((x) => keys[n].has(x)));
      return j < 0 ? null : range[j];
    };
    // Icono: la palabra que lo trae; si es un icono del tema (no sale de ninguna palabra), entra con la escena
    const icon = icons[k];
    const iconCue = icon ? (range.find((i) => findIcons(caps[i].text, { max: 8 }).includes(icon)) ?? null) : null;
    // Elementos, en orden: por su nombre completo o por sus palabras
    const items: (number | null)[] = [];
    let after = -1;
    for (const it of s.items) {
      const c = findWord([it.replace(/\s+/g, ""), ...tokens(it), ...it.split(/\s+/)], after);
      items.push(c);
      if (c !== null) after = c;
    }
    // Cifra: el número escrito con dígitos o en palabras (o su etiqueta); CTA: su palabra
    let value: number | null = null;
    if (s.component === "cifra" && s.value) {
      const digits = s.value.replace(/[^\d]/g, "");
      const n = digits ? Number(digits) : NaN;
      value = findWord([digits, ...(Number.isFinite(n) && n <= 1e9 ? [firstNumberWord(n)] : [])].filter(Boolean)) ?? (s.label ? findWord(tokens(s.label)) : null);
    }
    if (s.component === "cta" && s.value) value = findWord([s.value]);
    return { icon: iconCue, value, items };
  });

// ——— Efectos de sonido ———
// Propios del proyecto (public/sfx, sintetizados con ffmpeg). Suaves: acompañan sin tapar la voz. Usan los mismos
// tiempos que la composición (src/create/timeline.ts): cada golpe suena cuando se ve.
type SceneTiming = {
  from: number;
  to: number;
  accent: [number, number] | null;
  component: string;
  items: string[];
  value: string;
  body: string;
  icon: string | null;
  cues: Cues;
  fx?: SceneFx;
};
export const planSfx = (scenes: SceneTiming[], caps: { startMs: number }[], fps: number, theme: Theme, endFrame: number) => {
  const ev: { name: (typeof SFX_NAMES)[number]; frame: number; volume: number }[] = [];
  const add = (name: (typeof SFX_NAMES)[number], frame: number, volume: number) => ev.push({ name, frame: Math.max(0, Math.round(frame)), volume });
  const starts = scenes.map((s) => sceneStartFrame(caps[s.from].startMs, fps));
  scenes.forEach((s, k) => {
    const start = starts[k];
    const end = k + 1 < scenes.length ? starts[k + 1] : endFrame;
    const cue = (i: number | null | undefined) => cueFrame(caps, i, fps);
    // Transición con la que llega la escena: whoosh salvo en el corte seco (y en el barrido de los temas suaves,
    // que no lo dibujan)
    const t = s.fx?.sceneTransition ?? theme.sceneTransition;
    if (k > 0 && (t === "transforma" || t === "destello" || (t === "barrido" && theme.motion !== "suave"))) add("whoosh", start - (t === "transforma" ? 9 : 6), 0.3);
    const itemCues = s.items.map((_, i) => cue(s.cues.items[i]));
    if (s.component === "cifra") {
      const at = valueFrame(start, cue(s.cues.value));
      add("hit", at + 2, 0.26);
      // Odómetro: tic-tac mientras ruedan los dígitos
      if (theme.counter === "odometro" && /\d/.test(s.value)) {
        const dur = odometerDuration(Math.max(0, s.value.replace(/[^\d]/g, "").length - 1));
        for (let t = 3; t < dur; t += 3) add("click", at + t, 0.1);
      }
    } else if (s.component === "modelo") add("hit", start + 6, 0.26);
    else if (s.component === "paso") add("pop", start + 2 + STEP.box, 0.26);
    else if (s.component === "prompt") add("click", typingSchedule(start, end, s.body.replace(/\*/g, "").length).send, 0.3);
    else if (s.component === "cadena" && s.items.length >= 2) {
      const tl = chainTimeline(start + 8, itemCues, s.items.length);
      add("whoosh", tl.tIn, 0.16);
      for (let i = 1; i < s.items.length; i++) add("hit", tl.hits[i], 0.24);
      add("pop", tl.action, 0.3);
    } else add("pop", s.icon ? iconFrame(start, cue(s.cues.icon)) : start + 2, 0.2);
    if (s.accent) add(theme.captionStyle === "brillo" ? "brillo" : "click", cueFrame(caps, s.accent[0], fps)!, 0.28);
    if (s.component === "lista") itemFrames(start, itemCues, s.items.length).forEach((t) => add("click", t, 0.24));
    if (s.component === "cta") add("pop", valueFrame(start, cue(s.cues.value)), 0.28);
  });
  return ev.sort((a, b) => a.frame - b.frame);
};
