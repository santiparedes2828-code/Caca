import type { EditProps } from "./props";

// Ganancia de la música en el instante t: base, atenuada mientras hay voz (rampa de 250 ms),
// con fundido de entrada y de salida.
export const musicGain = (
  m: NonNullable<EditProps["music"]>,
  tMs: number,
  totalMs: number,
) => {
  const RAMP = 250;
  let duck = 0;
  for (const s of m.speech) {
    if (tMs >= s.startMs - RAMP && tMs <= s.endMs + RAMP) {
      const d =
        tMs < s.startMs
          ? 1 - (s.startMs - tMs) / RAMP
          : tMs > s.endMs
            ? 1 - (tMs - s.endMs) / RAMP
            : 1;
      duck = Math.max(duck, d);
      if (duck === 1) break;
    }
  }
  const g = m.gain + (m.duckGain - m.gain) * duck;
  const fadeIn = m.fadeInMs ? Math.min(1, tMs / m.fadeInMs) : 1;
  const fadeOut = m.fadeOutMs ? Math.min(1, (totalMs - tMs) / m.fadeOutMs) : 1;
  return Math.max(0, g * Math.min(fadeIn, fadeOut));
};
