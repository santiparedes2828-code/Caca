import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
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
  const { fps, width, height } = useVideoConfig();
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
  if (o.presentation === "tarjeta") {
    // Tarjeta sobre el vídeo (capturas, gráficos): entra subiendo con muelle, la persona se sigue viendo detrás
    const u = Math.min(width, height) / 1080;
    const s = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
    return (
      <AbsoluteFill style={{ opacity: out, backgroundColor: `rgba(0,0,0,${0.18 * Math.min(enter, 1)})` }}>
        <div
          style={{
            position: "absolute",
            left: width * 0.11,
            width: width * 0.78,
            top: height * 0.15,
            height: height * 0.42,
            borderRadius: 40 * u,
            overflow: "hidden",
            border: `${6 * u}px solid ${brand.colors.white}`,
            boxShadow: `0 ${24 * u}px ${60 * u}px rgba(0,0,0,0.45)`,
            backgroundColor: brand.colors.ink,
            opacity: Math.min(1, s * 1.4),
            transform: `translateY(${(1 - s) * 90 * u}px) scale(${0.9 + 0.1 * s}) rotate(${(1 - s) * -3}deg)`,
          }}
        >
          {o.kind === "image" ? <Img src={o.src} style={style} /> : <OffthreadVideo src={o.src} muted style={style} />}
        </div>
      </AbsoluteFill>
    );
  }
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

// Efectos de sonido propios (public/sfx/, sintetizados para el proyecto) en el fotograma que planifica el backend
export const SoundEffects: React.FC<{ sfx: EditProps["sfx"] }> = ({ sfx }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {sfx.map((e, i) => (
        <Sequence key={`sfx${i}`} name={`Efecto · ${e.name}`} from={e.frame} durationInFrames={Math.round(fps * 1.5)} layout="none">
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
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
