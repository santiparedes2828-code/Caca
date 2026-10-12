import { z } from "zod";
import { createPropsSchema, sceneSchema } from "./props";

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
  captionStyle: z.enum(["caja", "color", "subrayado"]), // cómo se destacan las palabras
  motion: z.enum(["suave", "rebote", "energico"]),
  background: z.enum(["burbujas", "patron", "degradado"]),
});
export type Theme = z.infer<typeof themeSchema>;

export const themedSceneSchema = sceneSchema.extend({
  icon: iconName.nullable().default(null), // icono grande de la escena
  itemIcons: z.array(iconName).max(4).default([]), // iconos de los elementos de una lista
});
export type ThemedScene = z.infer<typeof themedSceneSchema>;

// Los iconos llegan ya resueltos por el backend como SVG en data URI (nunca URLs externas ni código)
const svgDataUri = z.string().regex(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/]+=*$/).max(200_000);

export const themedPropsSchema = createPropsSchema
  .omit({ scenes: true, logoSeconds: true })
  .extend({
    theme: themeSchema,
    scenes: z.array(themedSceneSchema).min(1),
    icons: z.record(iconName, svgDataUri),
    bgIcons: z.array(iconName).max(4),
    pointerIcon: iconName.nullable(),
  })
  .superRefine((p, ctx) => {
    const used = [...p.bgIcons, ...(p.pointerIcon ? [p.pointerIcon] : []), ...p.scenes.flatMap((s) => [...(s.icon ? [s.icon] : []), ...s.itemIcons])];
    for (const n of used) if (!p.icons[n]) ctx.addIssue({ code: "custom", message: `Icono sin resolver: ${n}` });
    for (const s of p.scenes) {
      if (s.to >= p.captions.length || s.from > s.to) ctx.addIssue({ code: "custom", message: "Escena fuera de los subtítulos" });
    }
  });
export type ThemedProps = z.infer<typeof themedPropsSchema>;
