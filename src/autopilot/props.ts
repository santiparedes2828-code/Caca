import { z } from "zod";
import {
  brandSchema,
  captionModeSchema,
  intensitySchema,
  reframeSchema,
} from "../design/schema";

// Contrato entre el backend (autopilot/) y la composición AutopilotEdit.
// El backend construye estas props, las valida con este esquema y Remotion las vuelve a validar.

export const captionTokenSchema = z.object({
  text: z.string().min(1),
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  emphasis: z.boolean(),
  // Apoyo visual: emoji con licencia (clave de `icons`) que salta junto a la palabra (modo impacto)
  icon: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
});
export type CaptionToken = z.infer<typeof captionTokenSchema>;

export const captionPageSchema = z.object({
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  lines: z.array(z.array(captionTokenSchema).min(1)).min(1),
  // Centro vertical (fracción del alto) cuando el planificador lo mueve para no tapar una cara
  positionY: z.number().min(0.05).max(0.95).optional(),
  // Página destacada (modo impacto): la palabra clave va enorme en su propia línea
  feature: z.boolean().optional(),
});
export type CaptionPage = z.infer<typeof captionPageSchema>;

// Apoyo gráfico a pantalla completa (vídeos hablados, estilo-hablado.md): el vídeo se desenfoca detrás y entra una
// tarjeta con el dato que se está diciendo. Solo datos dichos tal cual (autopilot/edit/graficos.ts).
export const graphicSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("calendario"),
    startMs: z.number().min(0),
    endMs: z.number().min(0),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(1900).max(2100),
    label: z.string().min(1).max(20), // el mes como se dijo («February», «febrero»)
    lang: z.enum(["es", "en"]),
  }),
  z.object({
    kind: z.literal("lista"),
    startMs: z.number().min(0),
    endMs: z.number().min(0),
    // cada elemento aparece con su check cuando se dice
    items: z.array(z.object({ text: z.string().min(1).max(32), startMs: z.number().min(0) })).min(2).max(5),
  }),
]);
export type Graphic = z.infer<typeof graphicSchema>;

export const editPropsSchema = z.object({
  fps: z.number().int().min(1).max(120),
  width: z.number().int().min(16).max(4096),
  height: z.number().int().min(16).max(4096),
  durationInFrames: z.number().int().min(1),
  video: z.object({
    // URL http(s) servida por el backend al renderizar ("" = sin vídeo: solo fondo de marca, para demos)
    src: z.string(),
    width: z.number().int().min(1),
    height: z.number().int().min(1),
    hasAudio: z.boolean(),
    volume: z.number().min(0).max(2),
    // Tramos del vídeo fuente que se encadenan (cortes no destructivos). Suman durationInFrames.
    segments: z
      .array(
        z.object({
          srcStartFrame: z.number().int().min(0),
          durationInFrames: z.number().int().min(1),
        }),
      )
      .min(1),
  }),
  reframe: reframeSchema,
  // Trayectoria del foco (caras) en el tiempo del vídeo final; vacía = foco fijo de reframe
  focusTrack: z.array(
    z.object({
      tMs: z.number().min(0),
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }),
  ),
  // B-roll a pantalla completa sobre el vídeo (los subtítulos quedan encima). src: URL servida por el backend
  overlays: z.array(
    z.object({
      startMs: z.number().min(0),
      endMs: z.number().min(0),
      src: z.string(),
      kind: z.enum(["image", "video"]),
      // pantalla: cubre el plano; tarjeta: imagen con esquinas redondeadas sobre el vídeo (la persona se sigue viendo)
      presentation: z.enum(["pantalla", "tarjeta"]).default("pantalla"),
    }),
  ),
  // Música autorizada: volumen base y atenuación (ducking) mientras hay voz
  music: z
    .object({
      src: z.string(),
      gain: z.number().min(0).max(1),
      duckGain: z.number().min(0).max(1),
      fadeInMs: z.number().min(0),
      fadeOutMs: z.number().min(0),
      speech: z.array(z.object({ startMs: z.number(), endMs: z.number() })),
    })
    .nullable(),
  intensity: intensitySchema,
  brand: brandSchema,
  // Emojis con licencia (Fluent Emoji en color) como SVG en data URI; los resuelve el backend
  icons: z.record(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), z.string().regex(/^data:image\/svg\+xml;base64,[A-Za-z0-9+/]+=*$/).max(200_000)).default({}),
  graphics: z.array(graphicSchema).default([]),
  captions: z.object({
    mode: captionModeSchema,
    pages: z.array(captionPageSchema),
  }),
});
export type EditProps = z.infer<typeof editPropsSchema>;
