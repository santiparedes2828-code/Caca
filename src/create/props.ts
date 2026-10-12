import { z } from "zod";

// Contrato de la composición de creación (vídeo hecho desde un guion con narración).
// El backend valida estas props; la IA nunca genera código, solo datos de este esquema.

export const SCENE_COMPONENTS = ["titular", "lista", "cifra", "cta"] as const;

export const sceneSchema = z.object({
  from: z.number().int().min(0), // índice de la primera palabra de la escena en `captions`
  to: z.number().int().min(0), // índice de la última
  accent: z.tuple([z.number().int(), z.number().int()]).nullable(), // palabras en serif verde
  component: z.enum(SCENE_COMPONENTS),
  items: z.array(z.string().min(1).max(24)).max(4).default([]), // lista A/B/C
  label: z.string().max(40).default(""), // cifra: etiqueta
  value: z.string().max(12).default(""), // cifra: valor | cta: palabra
});
export type Scene = z.infer<typeof sceneSchema>;

export const createPropsSchema = z.object({
  fps: z.number().int().min(1).max(60),
  durationInFrames: z.number().int().min(1),
  audioSrc: z.string(), // narración (URL servida por el backend o staticFile)
  captions: z.array(
    z.object({
      text: z.string(),
      startMs: z.number(),
      endMs: z.number(),
      timestampMs: z.number().nullable(),
      confidence: z.number().nullable(),
    }),
  ),
  scenes: z.array(sceneSchema).min(1),
  headerLabel: z.string().max(40),
  logoSeconds: z.number().min(0).max(5),
});
export type CreateProps = z.infer<typeof createPropsSchema>;
