import React from "react";
import { z } from "zod";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, type CalculateMetadataFunction } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Montaje dinámico para redes con los clips de un cliente (sin voz): cortes al pulso de la música, empuje de cámara
// en cada plano, destellos cálidos entre bloques y rótulos apilados (contexto pequeño, palabra clave enorme). Los
// clips verticales llenan la pantalla; los horizontales van en una franja ancha sobre su propio fondo desenfocado,
// para no recortarlos a un tercio. Todo en Inter (regla de la casa).

loadInter();

const segSchema = z.object({
  src: z.string().min(1), // ruta en public/
  from: z.number().min(0), // segundo del clip donde empieza
  beats: z.number().int().min(1).max(16),
  vertical: z.boolean(),
  zoom: z.enum(["in", "out"]).default("in"),
  focusX: z.number().min(0).max(100).default(50), // encuadre horizontal de la franja (%)
  small: z.string().max(40).optional(),
  big: z.string().max(24).optional(),
  leak: z.boolean().default(false), // destello cálido al entrar (cambio de bloque)
});

export const montajeSchema = z.object({
  bpm: z.number().min(60).max(180),
  segments: z.array(segSchema).min(1).max(60),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  music: z.string().optional(),
  musicVolume: z.number().min(0).max(1).default(0.5),
  end: z.object({ beats: z.number().int().min(2).max(16), title: z.string().max(30), lines: z.array(z.string().max(40)).max(3), cta: z.string().max(40) }),
});
type Props = z.infer<typeof montajeSchema>;
type Seg = z.infer<typeof segSchema>;

const FPS = 30;
const beatF = (bpm: number) => (60 / bpm) * FPS;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const calculateMontajeMetadata: CalculateMetadataFunction<Props> = ({ props }) => {
  const beats = props.segments.reduce((n, s) => n + s.beats, 0) + props.end.beats;
  return { durationInFrames: Math.round(beats * beatF(props.bpm)), fps: FPS };
};

const Shot: React.FC<{ seg: Seg; dur: number }> = ({ seg, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Golpe de entrada (1,14 → 1) y empuje lento durante el plano
  const hit = spring({ frame, fps, config: { damping: 18, stiffness: 220, mass: 0.6 } });
  const push = interpolate(frame, [0, dur], seg.zoom === "in" ? [1, 1.08] : [1.08, 1], clamp);
  const scale = (1.14 - 0.14 * hit) * push;
  const blur = interpolate(frame, [0, 4], [10, 0], clamp);
  const video = (style: React.CSSProperties) => <OffthreadVideo src={staticFile(seg.src)} startFrom={Math.round(seg.from * FPS)} muted style={style} />;
  if (seg.vertical)
    return <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>{video({ width: "100%", height: "100%", objectFit: "cover" })}</AbsoluteFill>;
  const H = 820; // franja ancha (se ve ~el 75 % del ancho del clip)
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <AbsoluteFill style={{ transform: "scale(1.25)", filter: "blur(38px) brightness(0.55) saturate(1.2)" }}>{video({ width: "100%", height: "100%", objectFit: "cover" })}</AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: (1920 - H) / 2, height: H, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,0.5)" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${scale})`, filter: `blur(${blur}px)` }}>
          {video({ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${seg.focusX}% 50%` })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Leak: React.FC<{ len: number }> = ({ len }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, len * 0.3, len], [0, 0.85, 0], clamp);
  const x = interpolate(frame, [0, len], [-20, 120], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        mixBlendMode: "screen",
        background: `radial-gradient(60% 45% at ${x}% 40%, rgba(255,170,70,1) 0%, rgba(255,120,40,0.7) 35%, rgba(255,90,20,0) 75%)`,
      }}
    />
  );
};

const Rotulo: React.FC<{ small?: string; big?: string; accent: string; top: number }> = ({ small, big, accent, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame: frame - 2, fps, config: { damping: 16, stiffness: 200 } });
  const s2 = spring({ frame: frame - 5, fps, config: { damping: 13, stiffness: 170, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: INTER, textAlign: "center" }}>
      {small ? (
        <div style={{ fontWeight: 700, fontSize: 52, color: "#fff", opacity: s1, transform: `translateY(${(1 - s1) * 24}px)`, textShadow: "0 3px 14px rgba(0,0,0,0.6)" }}>{small}</div>
      ) : null}
      {big ? (
        <div
          style={{
            fontWeight: 800,
            fontSize: Math.min(150, 1700 / Math.max(6, big.length)),
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginTop: 6,
            opacity: s2,
            transform: `scale(${1.2 - 0.2 * s2})`,
            filter: `blur(${(1 - s2) * 10}px) drop-shadow(0 6px 18px rgba(0,0,0,0.55))`,
            backgroundImage: "linear-gradient(180deg, #FFFFFF 40%, #D9D9D9 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {big.toUpperCase()}
        </div>
      ) : null}
      {big ? <div style={{ width: 120 * s2, height: 8, borderRadius: 8, background: accent, marginTop: 18 }} /> : null}
    </div>
  );
};

const EndCard: React.FC<{ end: Props["end"]; accent: string }> = ({ end, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 200 } });
  const at = (d: number) => spring({ frame: frame - d, fps, config: { damping: 16, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: `rgba(10,14,16,${0.55 * a})`, alignItems: "center", justifyContent: "center", fontFamily: INTER }}>
      <div style={{ fontWeight: 800, fontSize: 150, letterSpacing: "-0.04em", color: "#fff", opacity: at(3), transform: `scale(${1.15 - 0.15 * at(3)})` }}>{end.title}</div>
      {end.lines.map((l, i) => (
        <div key={l} style={{ fontWeight: 500, fontSize: 48, color: "rgba(255,255,255,0.9)", marginTop: i ? 6 : 18, opacity: at(8 + i * 4), transform: `translateY(${(1 - at(8 + i * 4)) * 20}px)` }}>
          {l}
        </div>
      ))}
      <div
        style={{
          marginTop: 60,
          padding: "26px 56px",
          borderRadius: 999,
          background: accent,
          color: "#fff",
          fontWeight: 800,
          fontSize: 54,
          opacity: at(18),
          transform: `scale(${(0.8 + 0.2 * at(18)) * (1 + 0.03 * Math.sin(frame / 5))})`,
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        {end.cta}
      </div>
    </AbsoluteFill>
  );
};

export const Montaje: React.FC<Props> = (props) => {
  const b = beatF(props.bpm);
  let f = 0;
  const shots = props.segments.map((seg) => {
    const from = Math.round(f);
    f += seg.beats * b;
    return { seg, from, dur: Math.round(f) - from };
  });
  const endFrom = Math.round(f);
  const endDur = Math.round(props.end.beats * b);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {shots.map(({ seg, from, dur }, i) => (
        <Sequence key={i} from={from} durationInFrames={dur + (i === shots.length - 1 ? endDur : 0)} layout="none">
          <Shot seg={seg} dur={dur} />
          {seg.small || seg.big ? <Rotulo small={seg.small} big={seg.big} accent={props.accent} top={seg.vertical ? 1180 : 1500} /> : null}
          {seg.leak ? <Leak len={12} /> : null}
          {seg.leak ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} /> : null}
          {!seg.leak && seg.big ? <Audio src={staticFile("sfx/pop.wav")} volume={0.35} /> : null}
        </Sequence>
      ))}
      <Sequence from={endFrom} durationInFrames={endDur} layout="none">
        <EndCard end={props.end} accent={props.accent} />
        <Audio src={staticFile("sfx/hit.wav")} volume={0.5} />
      </Sequence>
      {props.music ? (
        <Audio
          src={staticFile(props.music)}
          volume={(fr) => props.musicVolume * interpolate(fr, [endFrom + endDur - 20, endFrom + endDur], [1, 0], clamp)}
        />
      ) : null}
    </AbsoluteFill>
  );
};
