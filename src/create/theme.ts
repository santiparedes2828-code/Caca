import { z } from "zod";
import { createPropsSchema, MODELS, sceneSchema } from "./props";

// Estilo visual por temática para vídeos creados desde una idea o un guion (motion graphics).
// La identidad de un cliente (p. ej. Hook House) se usa con AutopilotCreate; este tema se elige según el
// contenido. Todo son datos validados: la IA o el planificador eligen entre opciones cerradas.

// Regla de la casa: todo el texto en Inter, preferiblemente Inter Bold (ver src/design/inter.ts).
// La personalidad de cada tema sale de la paleta, el movimiento, el fondo y cómo se destacan las palabras.
export const THEME_FONTS = {
  inter: { family: "Inter", weight: 700, file: "inter-latin-700-normal.woff2", upper: false, scale: 1 },
} as const;
export type ThemeFont = keyof typeof THEME_FONTS;
export const FONT_KEYS = Object.keys(THEME_FONTS) as [ThemeFont, ...ThemeFont[]];
// Etiquetas pequeñas (cabecera, cifras)
export const LABEL_FONT = { family: "Inter", weight: 700, file: "inter-latin-700-normal.woff2" } as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "color #rrggbb");
export const TRANSITIONS = ["barrido", "destello", "transforma", "corte"] as const;
export const REVEALS = ["salto", "mascara"] as const;
export const CAMERAS = ["empuje", "sigue"] as const;
export const iconName = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export const themeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,30}$/),
  name: z.string().min(1).max(40),
  palette: z.object({
    bg: hex, // fondo (arriba)
    bg2: hex, // fondo (abajo)
    ink: hex, // texto
    accent: hex, // color principal: palabras destacadas, CTA, barra de progreso
    onAccent: hex, // texto sobre accent
    accent2: hex, // detalles y transiciones
    card: hex, // tarjetas de lista y halo de los iconos
  }),
  font: z.enum(FONT_KEYS),
  captionStyle: z.enum(["caja", "color", "subrayado", "brillo"]), // cómo se destacan las palabras (brillo = resplandor)
  motion: z.enum(["suave", "rebote", "energico"]),
  background: z.enum(["burbujas", "patron", "degradado", "estrellas", "liso"]),
  // Lo normal en el tema; cada escena puede variarlo (fx) para dar ritmo. Transiciones: barrido/destello (no se
  // usan con movimiento suave), transforma (el icono crece hasta ser la pantalla y se recoge en el de la siguiente)
  // o corte (seco)
  sceneTransition: z.enum(TRANSITIONS).default("barrido"),
  // Cómo entran las palabras del titular: salto (suben con muelle) o mascara (suben desde detrás de una regla)
  reveal: z.enum(REVEALS).default("salto"),
  // Cámara: empuje (acercamiento lento) o sigue (acompaña la palabra que suena, el bloque empujado, la tarjeta nueva)
  camera: z.enum(CAMERAS).default("empuje"),
  // Cifras: odometro (los dígitos ruedan dentro de una máscara) o cuenta (de 0 al valor)
  counter: z.enum(["cuenta", "odometro"]).default("odometro"),
});
export type Theme = z.infer<typeof themeSchema>;

// Sincronía con la voz: índice (en captions) de la palabra en que se nombra cada cosa; la pieza entra en ese momento.
// null = no se nombra (entra a su ritmo).
export const cuesSchema = z.object({
  icon: z.number().int().min(0).nullable(), // palabra que eligió el icono de la escena
  value: z.number().int().min(0).nullable(), // cifra o palabra del CTA
  items: z.array(z.number().int().min(0).nullable()).max(4), // elementos de la lista o de la cadena
});
export type Cues = z.infer<typeof cuesSchema>;

// Dinamismo: lo que varía esta escena respecto al tema (null = lo del tema). Las animaciones son recursos para dar
// ritmo, no un paquete: el planificador (planDynamics) pone como mucho una especial por escena y las alterna
export const sceneFxSchema = z.object({
  reveal: z.enum(REVEALS).nullable(),
  camera: z.enum(CAMERAS).nullable(),
  sceneTransition: z.enum(TRANSITIONS).nullable(), // cómo llega esta escena desde la anterior
});
export type SceneFx = z.infer<typeof sceneFxSchema>;

export const themedSceneSchema = sceneSchema.extend({
  icon: iconName.nullable().default(null), // icono grande de la escena
  itemIcons: z.array(iconName).max(4).default([]), // iconos de los elementos de una lista o una cadena
  cues: cuesSchema.default({ icon: null, value: null, items: [] }),
  fx: sceneFxSchema.default({ reveal: null, camera: null, sceneTransition: null }),
});
export type ThemedScene = z.infer<typeof themedSceneSchema>;

// Los iconos llegan ya resueltos por el backend como SVG en data URI (nunca URLs externas ni código)
const svgDataUri = z.string().regex(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/]+=*$/).max(200_000);

// Efectos de sonido propios (sintetizados para el proyecto, public/sfx/; ver scripts/sfx.sh)
export const SFX_NAMES = ["whoosh", "pop", "hit", "click", "brillo"] as const;
export const sfxEventSchema = z.object({
  name: z.enum(SFX_NAMES),
  frame: z.number().int().min(0),
  volume: z.number().min(0).max(1),
});

export const themedPropsSchema = createPropsSchema
  .omit({ scenes: true, logoSeconds: true })
  .extend({
    theme: themeSchema,
    scenes: z.array(themedSceneSchema).min(1),
    icons: z.record(iconName, svgDataUri),
    bgIcons: z.array(iconName).max(4),
    pointerIcon: iconName.nullable(),
    // Palabras clave: fuente (Inter salvo excepción pedida, ver src/design/excepciones.ts) y tamaño relativo
    accentFont: z.enum(["inter", "garamond"]).default("inter"),
    accentScale: z.number().min(1).max(1.6).default(1),
    sfx: z.array(sfxEventSchema).max(80).default([]),
  })
  .superRefine((p, ctx) => {
    const used = [...p.bgIcons, ...(p.pointerIcon ? [p.pointerIcon] : []), ...p.scenes.flatMap((s) => [...(s.icon ? [s.icon] : []), ...s.itemIcons])];
    for (const n of used) if (!p.icons[n]) ctx.addIssue({ code: "custom", message: `Icono sin resolver: ${n}` });
    for (const s of p.scenes) {
      if (s.to >= p.captions.length || s.from > s.to) ctx.addIssue({ code: "custom", message: "Escena fuera de los subtítulos" });
      if (s.component === "modelo" && !(MODELS as readonly string[]).includes(s.label)) ctx.addIssue({ code: "custom", message: `Modelo desconocido: ${s.label}` });
      if (s.component === "cadena" && (s.items.length < 2 || s.items.length > 4)) ctx.addIssue({ code: "custom", message: "Una cadena lleva de 2 a 4 bloques" });
      if (s.component === "paso" && !s.label) ctx.addIssue({ code: "custom", message: "Un paso necesita título" });
      if (s.component === "prompt" && !s.body) ctx.addIssue({ code: "custom", message: "La tarjeta [prompt] necesita el texto que se escribe" });
      const cues = [s.cues.icon, s.cues.value, ...s.cues.items].filter((c): c is number => c !== null);
      if (cues.some((c) => c < s.from || c > s.to)) ctx.addIssue({ code: "custom", message: "Una sincronía apunta a una palabra fuera de su escena" });
    }
  });
export type ThemedProps = z.infer<typeof themedPropsSchema>;
