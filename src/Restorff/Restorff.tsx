import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-restorff.json";
import { MONO, SANS } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { FieldScene, GREEN, R, type Cam, type FieldState } from "./field3d";

// Reel "Efecto Von Restorff" — Hook House (guion-restorff.md · skill formula-viral).
// Otro tipo de edición 3D: estudio claro, plano único sin cortes, cámara que vuela sobre un campo de esferas
// y subtítulos grandes al centro con la palabra que suena en verde.
// Locución: Rodrigo Zabú (ElevenLabs, eleven_v4, toma 2) en public/audio/voz_restorff.wav; tiempos de Scribe.

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const restorffDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const KEY = new Set([12, 22, 39, 50, 60, 64, 65, 76, 78]);
const G: [number, number, number] = [GREEN.x, GREEN.y, GREEN.z];

type V3 = [number, number, number];
const mix = (a: V3, b: V3, p: number): V3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];

// Subtítulos centrales: hasta 3 palabras; la que suena va en caja verde, las clave quedan en verde
const Captions: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= sec(i)) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?]$/.test(caps[i - 1].text) || n >= 3)) {
      start = i;
      n = 0;
    }
    n++;
  }
  if (t > caps[cur].endMs / 1000 + 0.5 && cur < caps.length - 1) return null;
  return (
    <div style={{ position: "absolute", top: 1300, left: 50, right: 50, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 96, lineHeight: 1.12, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const local = frame - Math.round(sec(i) * fps);
        const s = spring({ frame: local, fps, config: { damping: 10, stiffness: 300, mass: 0.5 } });
        const isCur = i === cur;
        const box = isCur ? spring({ frame: local, fps, config: { damping: 14, stiffness: 320 } }) : 0;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "pre",
              margin: "0 0.16em",
              color: isCur ? "#fff" : KEY.has(i) ? R.green : R.ink,
              transform: `scale(${0.7 + 0.3 * s}) translateY(${(1 - s) * 24}px)`,
              opacity: Math.min(1, s * 2.5),
              textShadow: isCur ? "none" : "0 4px 0 rgba(255,255,255,0.9)",
            }}
          >
            {isCur ? (
              <span
                style={{
                  position: "absolute",
                  inset: "-4px -14px -8px -14px",
                  background: R.green,
                  borderRadius: 16,
                  transform: `scale(${0.6 + 0.4 * box}) rotate(${(random(`b${i}`) - 0.5) * 6}deg)`,
                  zIndex: -1,
                  boxShadow: "0 10px 30px rgba(18,161,80,0.35)",
                }}
              />
            ) : null}
            {caps[i].text}
          </span>
        );
      })}
    </div>
  );
};

const DmBubble: React.FC<{ start: number; send: number }> = ({ start, send }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - start, fps, config: { damping: 14 } });
  const s = spring({ frame: frame - send, fps, config: { damping: 10, stiffness: 200 } });
  if (frame < start) return null;
  return (
    <div style={{ position: "absolute", top: 640, left: 140, right: 140, height: 380, borderRadius: 40, background: "rgba(255,255,255,0.94)", boxShadow: "0 30px 80px rgba(0,0,0,0.18)", opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 32px", borderBottom: "2px solid #E4E1D8" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: R.green, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>h</div>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: R.ink }}>hookhouse</span>
      </div>
      <div style={{ position: "absolute", right: 32, bottom: 36, transformOrigin: "right bottom", transform: `scale(${s})`, opacity: frame >= send ? 1 : 0 }}>
        <div style={{ padding: "10px 40px 18px", borderRadius: "34px 34px 8px 34px", background: R.green, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 120, lineHeight: 1, letterSpacing: "-0.05em" }}>HOOK</div>
      </div>
    </div>
  );
};

export const Restorff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);
  const end = endStart(fps);
  const ease = { ...opt, easing: Easing.inOut(Easing.cubic) };

  // Cámara: plano único. Cada tramo define su encuadre; entre tramos se funde en 16 frames.
  const seg = (k: number): Cam => {
    switch (k) {
      case 0: {
        // Vuelo rasante hacia la esfera verde
        const p = interpolate(frame, [0, w(12)], [0, 1], { ...opt, easing: Easing.out(Easing.quad) });
        return { pos: [G[0] - 1.5 + 0.8 * p, 1.1 + 0.3 * p, 9 - 9.5 * p], look: [G[0], 0.4, G[2] - 4 + 3 * p] };
      }
      case 1:
        return { pos: [G[0] + 2.2, 1.6, G[2] + 3.4], look: [G[0], 0.6, G[2]] };
      case 2: {
        // Travelling lateral por una fila de esferas idénticas
        const p = interpolate(frame, [w(13), w(19)], [0, 1], opt);
        const x = -6 + 6 * p;
        return { pos: [x, 1.2, -1.5], look: [x + 3.5, 0.4, -5] };
      }
      case 3:
        return { pos: [G[0] + 2.6, 1.9, G[2] + 4.4], look: [G[0], 0.9, G[2]] };
      case 4:
        return { pos: [0, 10, 7], look: [0, 0, -6] };
      case 5:
        return { pos: [G[0] + 5, 6, G[2] + 7.5], look: [G[0], 0, G[2]] };
      case 6:
        return { pos: [0, 5.5, 9], look: [0, 0, -6] };
      case 7:
        return { pos: [G[0] + 4.5, 3.4, G[2] + 9], look: [G[0], 2, G[2]] };
      case 8: {
        const a = (frame - w(61)) * 0.05;
        return { pos: [G[0] + Math.sin(a) * 10, 4.5, G[2] + Math.cos(a) * 10], look: [G[0], 2.2, G[2]] };
      }
      default:
        return { pos: [G[0] + 0.01, 15, G[2] + 0.5], look: [G[0], 0, G[2]] };
    }
  };
  const starts = [0, w(12), w(13), w(19), w(23), w(33), w(40), w(51), w(61), w(66)];
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) k = i;
  const a = seg(Math.max(0, k - 1));
  const b = seg(k);
  const p = k === 0 ? 1 : interpolate(frame, [starts[k], starts[k] + 16], [0, 1], ease);
  let pos = mix(a.pos, b.pos, p);
  const look = mix(a.look, b.look, p);
  // Sacudidas en los golpes
  for (const h of [w(12), w(34), w(63)]) {
    const d = frame - h;
    if (d >= 0 && d < 10) {
      const amp = 0.12 * Math.exp(-d / 3);
      pos = [pos[0] + (random(`x${h}${frame}`) - 0.5) * amp, pos[1] + (random(`y${h}${frame}`) - 0.5) * amp, pos[2]];
    }
  }

  const pop = spring({ frame: frame - w(12), fps, config: { damping: 8, stiffness: 180 } });
  const rise = spring({ frame: frame - w(54), fps, config: { damping: 16, stiffness: 60 } });
  const hop = frame >= w(19) && frame < w(23) ? Math.abs(Math.sin((frame - w(19)) / 5)) * 0.8 : 0;
  const s: FieldState = {
    cam: { pos, look },
    t,
    bob: interpolate(frame, [w(13), w(14), w(18), w(19)], [0, 0.28, 0.28, 0], opt),
    fade: interpolate(frame, [w(25), w(32), w(40), w(42)], [0, 1, 1, 0], opt),
    waveT: frame >= w(34) ? (frame - w(34)) / fps : -1,
    sink: interpolate(frame, [w(45), w(50) + 6], [0, 1], { ...opt, easing: Easing.in(Easing.quad) }),
    greenLift: (frame >= w(12) ? 0.35 * pop : 0) + hop + 1.9 * rise,
    greenScale: 1 + 0.25 * (frame >= w(12) ? pop : 0) + 3 * rise,
    greenGlow: interpolate(frame, [w(34), w(34) + 4, w(40)], [0, 1, 0.3], opt) + 0.5 * rise,
  };

  const reveal = frame >= w(63) && frame < w(66);
  const revealIn = spring({ frame: frame - w(63), fps, config: { damping: 10, stiffness: 220 } });
  const flash = interpolate(frame - w(63), [0, 1, 6], [0, 0.7, 0], opt);
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ background: R.bg }}>
      <FieldScene s={s} width={1080} height={1920} />
      {/* Barra de progreso del vídeo (arriba) */}
      <div style={{ position: "absolute", top: 120, left: 80, right: 80, height: 10, borderRadius: 5, background: "rgba(11,11,11,0.12)" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 5, background: R.green }} />
      </div>
      {reveal ? (
        <div
          style={{
            position: "absolute",
            top: 190,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 120,
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            color: R.ink,
            transform: `scale(${1.4 - 0.4 * revealIn})`,
            opacity: revealIn,
          }}
        >
          EFECTO
          <br />
          <span style={{ color: R.green }}>VON RESTORFF</span>
        </div>
      ) : null}
      <DmBubble start={w(69)} send={w(78)} />
      <Captions t={t} frame={frame} fps={fps} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      <Audio src={staticFile("audio/voz_restorff.wav")} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(f) => interpolate(f, [0, 6, end, end + 30], [0, 0.14, 0.14, 0], opt)} />
      <Sequence name="Pop verde" from={w(12)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.45} />
      </Sequence>
      <Sequence name="Onda" from={w(34)} durationInFrames={18} premountFor={fps}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.4} />
      </Sequence>
      <Sequence name="Revelación" from={w(63)} durationInFrames={24} premountFor={fps}>
        <Audio src={staticFile("sfx/slam.wav")} volume={0.45} />
      </Sequence>
      {starts.slice(2).map((f) => (
        <Sequence key={`w${f}`} name="Whoosh" from={f - 3} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} />
        </Sequence>
      ))}
      <Sequence name="Pop HOOK" from={w(78)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const house = interpolate(frame, [4, 10], [0, 1], opt);
  const dot = interpolate(frame, [8, 14], [0, 1], { ...opt, easing: Easing.out(Easing.back(2.5)) });
  return (
    <AbsoluteFill style={{ background: R.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: sIn }}>
      <Wordmark size={150} color={R.ink} houseOpacity={house} dot={dot} />
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.08em", color: "#8A8A84", opacity: house }}>ESCRÍBEME «HOOK» POR DM</div>
    </AbsoluteFill>
  );
};
