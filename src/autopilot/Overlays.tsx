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
import { musicGain } from "./mix";
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
