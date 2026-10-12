import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { z } from "zod";
import captionsJson from "../data/captions-viral.json";
import { useBrandFonts } from "../design/fonts";
import { INTENSITY, MODE_MAX_WORDS } from "../design/intensity";
import { captionModeSchema, intensitySchema } from "../design/schema";
import { HOOKHOUSE } from "../design/tokens";
import { Captions } from "./Captions";
import { paginateWords } from "./paginate";

// Demo/prueba visual de los modos de subtítulo con la locución real de marca (voz_viral.wav y sus
// tiempos por palabra de ElevenLabs Scribe). Se renderiza en las pruebas de la Etapa 1.

export const captionDemoSchema = z.object({
  mode: captionModeSchema,
  intensity: intensitySchema,
  variant: z.enum(["card", "shadow"]),
});

const words = (captionsJson as Caption[]).map((c) => ({
  text: c.text,
  startMs: c.startMs,
  endMs: c.endMs,
}));
export const captionDemoDuration = (fps: number) =>
  Math.ceil(((words[words.length - 1].endMs + 600) / 1000) * fps);

export const CaptionModesDemo: React.FC<z.infer<typeof captionDemoSchema>> = ({
  mode,
  intensity,
  variant,
}) => {
  const brand = useMemo(
    () => ({ ...HOOKHOUSE, captions: { ...HOOKHOUSE.captions, variant } }),
    [variant],
  );
  const ready = useBrandFonts(brand);
  const pages = useMemo(
    () =>
      paginateWords(words, {
        maxWordsPerPage: Math.min(
          MODE_MAX_WORDS[mode],
          INTENSITY[intensity].captions.maxWordsPerPage,
        ),
        maxCharsPerLine: brand.captions.maxCharsPerLine,
        maxLines: brand.captions.maxLines,
        pauseBreakMs: INTENSITY[intensity].captions.pauseBreakMs,
        emphasis: mode === "dinamico",
      }),
    [mode, intensity, brand],
  );
  return (
    <AbsoluteFill
      style={{
        background:
          variant === "card" ? brand.colors.ink : brand.colors.accentDark,
      }}
    >
      <Audio src={staticFile("audio/voz_viral.wav")} />
      <Captions
        pages={pages}
        mode={mode}
        brand={brand}
        intensity={intensity}
        fontsReady={ready}
      />
    </AbsoluteFill>
  );
};
