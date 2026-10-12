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
});
export type CaptionToken = z.infer<typeof captionTokenSchema>;

export const captionPageSchema = z.object({
  startMs: z.number().min(0),
  endMs: z.number().min(0),
  lines: z.array(z.array(captionTokenSchema).min(1)).min(1),
  // Centro vertical (fracción del alto) cuando el planificador lo mueve para no tapar una cara
  positionY: z.number().min(0.05).max(0.95).optional(),
});
export type CaptionPage = z.infer<typeof captionPageSchema>;

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
  intensity: intensitySchema,
  brand: brandSchema,
  captions: z.object({
    mode: captionModeSchema,
    pages: z.array(captionPageSchema),
  }),
});
export type EditProps = z.infer<typeof editPropsSchema>;
