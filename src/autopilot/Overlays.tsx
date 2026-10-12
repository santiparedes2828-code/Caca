import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Brand } from "../design/schema";
import type { EditProps } from "./props";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Un recurso de B-roll: entra con la animación de marca (escala + opacidad, sin rebote), deriva
// lentamente (Ken Burns +6 %) y sale con un fundido corto. Cubre el plano; los subtítulos van encima.
const BrollItem: React.FC<{
  o: EditProps["overlays"][number];
  brand: Brand;
  frames: number;
}> = ({ o, brand, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = brand.motion;
  const enter = spring({
    frame,
    fps,
    config: { damping: m.enterDamping },
    durationInFrames: m.enterFrames,
  });
  const out = interpolate(frame, [frames - 4, frames], [1, 0], clamp);
  const drift = interpolate(frame, [0, frames], [1, 1.06], clamp);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    scale: `${drift}`,
  };
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter, out),
        scale: `${m.enterScaleFrom + (1 - m.enterScaleFrom) * enter}`,
        backgroundColor: brand.colors.ink,
        overflow: "hidden",
      }}
    >
      {o.kind === "image" ? (
        <Img src={o.src} style={style} />
      ) : (
        <OffthreadVideo src={o.src} muted style={style} />
      )}
    </AbsoluteFill>
  );
};

export const Broll: React.FC<{
  overlays: EditProps["overlays"];
  brand: Brand;
}> = ({ overlays, brand }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {overlays.map((o, k) => {
        const from = Math.round((o.startMs / 1000) * fps);
        const frames = Math.max(
          1,
          Math.round(((o.endMs - o.startMs) / 1000) * fps),
        );
        return (
          <Sequence
            key={k}
            from={from}
            durationInFrames={frames}
            premountFor={fps}
            name={`B-roll ${k + 1}`}
          >
            <BrollItem o={o} brand={brand} frames={frames} />
          </Sequence>
        );
      })}
    </>
  );
};

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

export const Music: React.FC<{ music: NonNullable<EditProps["music"]> }> = ({
  music,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const totalMs = (durationInFrames / fps) * 1000;
  return (
    <Audio
      src={music.src}
      loop
      loopVolumeCurveBehavior="extend"
      volume={(f) => musicGain(music, (f / fps) * 1000, totalMs)}
    />
  );
};
