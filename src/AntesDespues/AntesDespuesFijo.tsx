import React from "react";
import { z } from "zod";
import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { B, SANS } from "../HookHouse/brand";

// Antes/después fijo (pedido del usuario el 13-10-2026: «sin animar tanto»): un solo plano sin movimientos de cámara.
// Arriba el vídeo editado (después) y abajo el símbolo del audio (antes), una onda que se mueve con la voz. Fondo
// claro con cuadrícula suave. Solo entran con un fundido corto; el sonido es el del vídeo editado. Todo en Inter.

export const antesDespuesFijoSchema = z.object({
  video: z.string().min(1), // ruta en public/ del vídeo editado
  videoSeconds: z.number().positive().max(180),
  envelope: z.array(z.number().min(0).max(1)).max(6000), // nivel de la voz por fotograma (0–1)
  labels: z.tuple([z.string(), z.string(), z.string()]).default(["Antes", "Después", "Solo audio"]),
});
type Props = z.infer<typeof antesDespuesFijoSchema>;

export const calculateAntesDespuesFijoMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.round(props.videoSeconds * 30),
  fps: 30,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const VIDEO = { x: 160, y: 110, w: 760, h: 1351 };
const WAVE = { x: 160, y: 1540, w: 760, h: 270 };

const Pill: React.FC<{ text: string; green: boolean; x: number; y: number }> = ({ text, green, x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translateY(-50%)",
      padding: "12px 30px",
      borderRadius: 999,
      background: green ? B.green : B.ink,
      color: B.white,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: "0.08em",
      whiteSpace: "nowrap",
      boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
    }}
  >
    {text.toUpperCase()}
  </div>
);

export const AntesDespuesFijo: React.FC<Props> = ({ video, envelope, labels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  const at = (f: number) => envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(f)))] ?? 0;
  const n = 31;
  const gap = 10;
  const bw = (WAVE.w - 120 - gap * (n - 1)) / n;
  const pop = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      {/* fondo: cuadrícula suave y un degradado verde muy tenue detrás del vídeo */}
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(20,20,20,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,20,0.045) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <AbsoluteFill style={{ background: "radial-gradient(60% 45% at 50% 38%, rgba(18,161,80,0.16) 0%, rgba(18,161,80,0) 70%)" }} />

      {/* Después: el vídeo editado */}
      <div style={{ position: "absolute", left: VIDEO.x, top: VIDEO.y, width: VIDEO.w, height: VIDEO.h, borderRadius: 44, overflow: "hidden", background: B.ink, border: `7px solid ${B.green}`, boxShadow: "0 30px 80px rgba(0,0,0,0.25)", opacity: fade }}>
        <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ opacity: fade }}>
        <Pill text={labels[1]} green x={VIDEO.x + 34} y={VIDEO.y} />
      </div>

      {/* Antes: el símbolo del audio, que se mueve con la voz */}
      <div style={{ position: "absolute", left: WAVE.x, top: WAVE.y, width: WAVE.w, height: WAVE.h, borderRadius: 40, background: B.white, boxShadow: "0 20px 50px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap, opacity: fade, transform: `scale(${0.96 + 0.04 * pop})` }}>
        {Array.from({ length: n }, (_, i) => {
          const off = (i - (n - 1) / 2) * 1.5;
          const v = (at(frame + off) + at(frame + off - 1) + at(frame + off + 1)) / 3;
          const edge = 1 - (Math.abs(i - (n - 1) / 2) / ((n - 1) / 2)) * 0.5;
          return <div key={i} style={{ width: bw, height: WAVE.h * (0.07 + 0.66 * v * edge), borderRadius: bw, background: B.ink, opacity: 0.35 + 0.65 * v }} />;
        })}
      </div>
      <div style={{ opacity: fade }}>
        <Pill text={labels[0]} green={false} x={WAVE.x + 34} y={WAVE.y} />
        <div style={{ position: "absolute", left: WAVE.x, width: WAVE.w, top: WAVE.y + WAVE.h + 22, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 34, color: B.grey }}>{labels[2]}</div>
      </div>
    </AbsoluteFill>
  );
};
