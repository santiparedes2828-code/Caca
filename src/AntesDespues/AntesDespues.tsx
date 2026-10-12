import { Audio } from "@remotion/media";
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { B, SANS } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";

// Antes y después para publicar el trabajo de Hook House, en un único plano animado (sin cortes):
//   antes   → solo una tarjeta con la onda del audio, que se mueve con la voz real
//   después → sin cortar, la onda se encoge hasta ser una ficha y de ella crece el vídeo en grande, sincronizado
//   cierre  → el vídeo se recoge un poco y aparece el logotipo
// Identidad Hook House (contenido de la propia marca); todo el texto en Inter. El sonido es el del vídeo desde el
// primer fotograma: el audio siempre estuvo ahí, lo que aparece es la edición.

export const antesDespuesSchema = z.object({
  video: z.string().min(1), // ruta en public/
  audio: z.string().min(1), // el sonido del vídeo (ruta en public/)
  videoSeconds: z.number().positive().max(180),
  envelope: z.array(z.number().min(0).max(1)).max(6000), // nivel de la voz por fotograma (0–1)
  introSeconds: z.number().min(1).max(8).default(2.6),
  labels: z.tuple([z.string(), z.string(), z.string()]).default(["Antes", "Después", "Solo un audio"]),
});
type Props = z.infer<typeof antesDespuesSchema>;

const END_SECONDS = 2.4;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const calculateAntesDespuesMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.round((props.videoSeconds + END_SECONDS) * 30),
  fps: 30,
});

type Rect = { x: number; y: number; w: number; h: number };
const lerp = (a: Rect, b: Rect, p: number): Rect => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p });

// Posiciones en el lienzo 1080x1920
const WAVE_BIG: Rect = { x: 120, y: 760, w: 840, h: 400 };
const WAVE_CHIP: Rect = { x: 56, y: 280, w: 300, h: 132 };
const VIDEO_FULL: Rect = { x: 150, y: 340, w: 780, h: 1387 };
const VIDEO_END: Rect = { x: 220, y: 270, w: 640, h: 1138 };

const Pill: React.FC<{ text: string; green: boolean; size: number; style?: React.CSSProperties }> = ({ text, green, size, style }) => (
  <div
    style={{
      position: "absolute",
      padding: `${size * 0.32}px ${size * 0.85}px`,
      borderRadius: 999,
      background: green ? B.green : B.ink,
      color: B.white,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: "0.08em",
      whiteSpace: "nowrap",
      boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
      ...style,
    }}
  >
    {text.toUpperCase()}
  </div>
);

// Onda de barras que avanza con la voz: cada barra es el nivel del audio unos fotogramas antes o después
const Wave: React.FC<{ envelope: number[]; frame: number; r: Rect }> = ({ envelope, frame, r }) => {
  const n = 25;
  const gap = r.w * 0.012;
  const bw = (r.w * 0.82 - gap * (n - 1)) / n;
  const at = (f: number) => envelope[Math.max(0, Math.min(envelope.length - 1, Math.round(f)))] ?? 0;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap }}>
      {Array.from({ length: n }, (_, i) => {
        const off = (i - (n - 1) / 2) * 1.6;
        const v = (at(frame + off) + at(frame + off - 1) + at(frame + off + 1)) / 3;
        const edge = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) * 0.45; // centro más alto
        const h = r.h * (0.08 + 0.62 * v * edge);
        return <div key={i} style={{ width: bw, height: h, borderRadius: bw, background: B.green, opacity: 0.55 + 0.45 * v }} />;
      })}
    </div>
  );
};

export const AntesDespues: React.FC<Props> = ({ video, audio, videoSeconds, envelope, introSeconds, labels }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = Math.round(introSeconds * fps);
  const end = Math.round(videoSeconds * fps);
  // Entrada de la onda, transformación (la onda se encoge y el vídeo crece desde ella) y cierre
  const waveIn = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const morph = interpolate(frame, [intro - 6, intro + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const grow = spring({ frame: frame - intro + 4, fps, config: { damping: 15, stiffness: 120, mass: 0.9 } });
  const close = interpolate(frame, [end - 2, end + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const wave = lerp(WAVE_BIG, WAVE_CHIP, morph);
  const vid = lerp(lerp({ ...WAVE_BIG, x: WAVE_BIG.x + WAVE_BIG.w / 2 - 60, w: 120, y: WAVE_BIG.y, h: 213 }, VIDEO_FULL, grow), VIDEO_END, close);
  const shown = Math.min(1, grow * 1.6);
  const mark = spring({ frame: frame - end - 6, fps, config: { damping: 200 } });
  const subtitle = 1 - interpolate(frame, [intro - 10, intro], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <Audio src={staticFile(audio)} />
      {/* Después: el vídeo (siempre sincronizado con el audio; aparece al transformarse la onda) */}
      {frame >= intro - 8 ? (
        <div
          style={{
            position: "absolute",
            left: vid.x,
            top: vid.y,
            width: vid.w,
            height: vid.h,
            borderRadius: 44,
            overflow: "hidden",
            background: B.ink,
            border: `7px solid ${B.green}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
            opacity: shown,
          }}
        >
          <OffthreadVideo src={staticFile(video)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}
      {frame >= intro - 8 ? (
        <Pill text={labels[1]} green size={40} style={{ left: vid.x + vid.w - 40, top: vid.y - 30, transform: `translateX(-100%) scale(${shown})`, transformOrigin: "100% 50%" }} />
      ) : null}
      {/* Antes: la onda del audio (grande y luego ficha) */}
      <div
        style={{
          position: "absolute",
          left: wave.x,
          top: wave.y,
          width: wave.w,
          height: wave.h,
          borderRadius: 48 - 20 * morph,
          background: B.white,
          boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
          opacity: Math.min(1, waveIn * 1.5),
          transform: `scale(${0.85 + 0.15 * waveIn})`,
        }}
      >
        <Wave envelope={envelope} frame={frame} r={wave} />
      </div>
      <Pill
        text={labels[0]}
        green={false}
        size={46 - 18 * morph}
        style={{ left: wave.x + wave.w / 2, top: wave.y - 34 + 10 * morph, transform: `translateX(-50%) scale(${Math.min(1, waveIn * 1.2)})` }}
      />
      <div
        style={{
          position: "absolute",
          top: WAVE_BIG.y + WAVE_BIG.h + 48,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 54,
          color: B.grey,
          opacity: Math.min(1, waveIn) * subtitle,
          transform: `translateY(${(1 - waveIn) * 30}px)`,
        }}
      >
        {labels[2]}
      </div>
      {/* Cierre: el logotipo en el mismo plano */}
      <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: mark, transform: `translateY(${(1 - mark) * 40}px)` }}>
        <Wordmark size={110} />
      </div>
    </AbsoluteFill>
  );
};
