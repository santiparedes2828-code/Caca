import { z } from "zod";

// Esquemas compartidos entre las composiciones de Remotion (navegador) y el backend (Node).
// No importar aquí nada de Node ni del DOM.

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "color hexadecimal #RRGGBB");

// "static:<ruta en public/>" o "url:<http(s)://…>" (el backend traduce "client:<ruta>" a "url:")
export const fontSrcSchema = z.string().regex(/^(static|url|client):\S+$/);

// Regla de la casa: todo el texto en Inter (ver src/design/inter.ts). Ningún perfil puede usar otra.
export const fontSchema = z.object({
  role: z.enum(["sans", "serif", "mono"]),
  family: z.string().refine((f) => f === "Inter", "Regla de la casa: todo el texto va en Inter"),
  weight: z.string().regex(/^[1-9]00$/),
  style: z.enum(["normal", "italic"]),
  src: fontSrcSchema,
});

export const captionModeSchema = z.enum([
  "palabra",
  "palabra-activa",
  "grupos",
  "frases",
  "dinamico",
]);
export type CaptionMode = z.infer<typeof captionModeSchema>;

export const intensitySchema = z.enum(["sutil", "dinamica", "alto-impacto"]);
export type Intensity = z.infer<typeof intensitySchema>;

export const brandSchema = z.object({
  colors: z.object({
    bg: hex,
    ink: hex,
    accent: hex,
    accentDark: hex,
    muted: hex,
    fill: hex,
    white: hex,
  }),
  fonts: z.array(fontSchema).min(1),
  typography: z.object({
    headlineWeight: z.number().int().min(100).max(900),
    headlineTracking: z.string(),
    headlineLineHeight: z.number().min(0.7).max(1.6),
    monoTracking: z.string(),
  }),
  layout: z.object({
    margin: z.number().min(0).max(300),
    stroke: z.number().min(1).max(30),
    radius: z.number().min(0).max(200),
    // Zonas que tapa la interfaz de TikTok/Reels/Shorts en un lienzo 1080x1920 (se escalan a otros formatos)
    safeZone: z.object({
      top: z.number().min(0),
      bottom: z.number().min(0),
      left: z.number().min(0),
      right: z.number().min(0),
    }),
  }),
  motion: z.object({
    wordInFrames: z.number().int().min(1).max(30),
    wordBlurPx: z.number().min(0).max(30),
    wordRisePx: z.number().min(0).max(60),
    dimFrames: z.number().int().min(1).max(30),
    dimOpacity: z.number().min(0).max(1),
    enterFrames: z.number().int().min(1).max(60),
    enterDamping: z.number().min(1).max(1000),
    enterScaleFrom: z.number().min(0.5).max(1),
  }),
  captions: z.object({
    variant: z.enum(["card", "shadow"]),
    fontRole: z.enum(["sans", "serif", "mono"]),
    fontWeight: z.number().int().min(100).max(900),
    fontSize: z.number().min(24).max(200),
    lineHeight: z.number().min(0.8).max(2),
    tracking: z.string(),
    maxCharsPerLine: z.number().int().min(6).max(60),
    maxLines: z.number().int().min(1).max(4),
    positionY: z.number().min(0.1).max(0.95), // centro vertical del bloque, fracción del alto
    highlight: z.enum(["box", "color"]),
    emphasisRole: z.enum(["sans", "serif", "mono"]),
    minFontSize: z.number().min(16).max(200),
  }),
});
export type Brand = z.infer<typeof brandSchema>;
export type BrandFont = z.infer<typeof fontSchema>;

export const formatSchema = z.enum(["vertical", "horizontal", "cuadrado"]);
export type FormatName = z.infer<typeof formatSchema>;

export const FORMATS: Record<FormatName, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
  cuadrado: { width: 1080, height: 1080 },
};

export const reframeSchema = z.object({
  mode: z.enum(["cover", "blur-fill", "contain"]),
  focusX: z.number().min(0).max(1),
  focusY: z.number().min(0).max(1),
});
export type Reframe = z.infer<typeof reframeSchema>;
