import type { CaptionMode, Intensity } from "./schema";

// Presets de intensidad. Los tres respetan la marca: solo cambian ritmo y énfasis, nunca colores ni fuentes.
// estilo-hookhouse.md §6 ("cámara fija") es la base de "sutil"; los zooms solo aparecen en edición de
// material grabado (talking head) y con un mínimo de segundos entre cambios para no marear.
export type IntensityPreset = {
  zoom: {
    mode: "none" | "drift" | "punch";
    amount: number;
    transitionFrames: number;
    minSecondsBetween: number;
  };
  captions: { maxWordsPerPage: number; popScale: number; pauseBreakMs: number };
};

export const INTENSITY: Record<Intensity, IntensityPreset> = {
  sutil: {
    zoom: {
      mode: "none",
      amount: 0,
      transitionFrames: 0,
      minSecondsBetween: 0,
    },
    captions: { maxWordsPerPage: 6, popScale: 1, pauseBreakMs: 600 },
  },
  dinamica: {
    zoom: {
      mode: "drift",
      amount: 0.04,
      transitionFrames: 0,
      minSecondsBetween: 2,
    },
    captions: { maxWordsPerPage: 4, popScale: 1.06, pauseBreakMs: 450 },
  },
  "alto-impacto": {
    zoom: {
      mode: "punch",
      amount: 0.1,
      transitionFrames: 4,
      minSecondsBetween: 2.5,
    },
    captions: { maxWordsPerPage: 3, popScale: 1.12, pauseBreakMs: 350 },
  },
};

// Palabras por página según modo (se combina con el máximo de la intensidad)
export const MODE_MAX_WORDS: Record<CaptionMode, number> = {
  palabra: 1,
  "palabra-activa": 6,
  grupos: 6,
  frases: 12,
  dinamico: 4,
};

// Modos que necesitan tiempos por palabra reales (no se inventa precisión)
export const WORD_TIMING_MODES: readonly CaptionMode[] = [
  "palabra",
  "palabra-activa",
  "grupos",
  "dinamico",
];
