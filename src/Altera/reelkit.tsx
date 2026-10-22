import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { Ticket } from "./props";
import { A, Captions, FONT, Rope, impact, fall, lin } from "./system";

// Base común de los reels de Gancho (Segundos, Sonido, Tres, Ojos): tiempos por palabra, escenario 1,25×,
// subtítulos arriba, línea del anzuelo en pantalla, CTA con beneficio y sonidos.

export const FLOOR = 1150; // suelo en coordenadas de maqueta
export const S = 1.25;
export const FLOOR_SCREEN = 1330;
export const M = (x: number, y: number) => ({ x: 540 + (x - 540) * S, y: FLOOR_SCREEN + (y - FLOOR) * S });
export const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

export const timing = (caps: Caption[]) => {
  const W = (i: number) => Math.round((caps[Math.max(0, Math.min(caps.length - 1, i))].startMs / 1000) * 30);
  const E = (i: number) => Math.round((caps[Math.max(0, Math.min(caps.length - 1, i))].endMs / 1000) * 30);
  // Primera palabra que empieza por `w` desde `from` (robusto a la puntuación de Scribe)
  const idx = (w: string, from = 0) => {
    for (let i = from; i < caps.length; i++) if (caps[i].text.toLowerCase().replace(/[¿?¡!.,:…]/g, "").startsWith(w)) return i;
    return from;
  };
  const talkAt = (f: number) => {
    for (let i = 0; i < caps.length; i++) {
      const a = W(i);
      const b = Math.max(a + 3, E(i));
      if (f >= a && f < b) return 0.35 + 0.65 * Math.abs(Math.sin((f - a) * 0.9));
    }
    return 0;
  };
  const words = caps.map((c, i) => ({ text: c.text, at: W(i) }));
  const frames = E(caps.length - 1) + 36;
  return { W, E, idx, talkAt, words, frames };
};

// Escenario en coordenadas de maqueta (suelo y = 1150) escalado 1,25× con el suelo en y = 1330
export const Stage: React.FC<{ children: React.ReactNode; dx?: number; bump?: number }> = ({ children, dx = 0, bump = 0 }) => (
  <AbsoluteFill style={{ transformOrigin: `540px ${FLOOR}px`, transform: `translate(${dx}px, ${FLOOR_SCREEN - FLOOR + 30 * bump}px) scale(${S * (1 + 0.04 * bump)})` }}>
    <div style={{ position: "absolute", left: -400, right: -400, top: FLOOR + 6, height: 2, background: "rgba(14,13,11,0.10)" }} />
    {children}
  </AbsoluteFill>
);

export type RopeSpec = { bx: number; by: number; slack: number; buzz: number; screen?: boolean } | null;
export const ScreenRope: React.FC<{ from: { x: number; y: number }; rope: RopeSpec; t: number }> = ({ from, rope, t }) => {
  if (!rope) return null;
  const a = M(from.x, from.y);
  const b = rope.screen ? { x: rope.bx, y: rope.by } : M(rope.bx, rope.by);
  return <Rope ax={a.x} ay={a.y} bx={b.x} by={b.y} slack={rope.slack} buzz={rope.buzz} t={t} />;
};

// CTA: "Escríbeme" + caja HOOK (Gancho la engancha en (712, 476) de pantalla) + ticket que cae
export const Cta: React.FC<{ f: number; fps: number; tEscr: number; tHook: number; tMuestra: number; until: number; ticketY?: number }> = ({ f, fps, tEscr, tHook, tMuestra, until, ticketY = 1062 }) => {
  if (f < tEscr || f >= until + 6) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - lin(f, until, until + 6) }}>
      <div style={{ position: "absolute", left: 72, width: 858, top: 470, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: A.ink }}>
        <span style={{ opacity: lin(f, tEscr, tEscr + 6) }}>Escríbeme</span>
        <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 8px", borderRadius: 18, transformOrigin: "50% 100%", transform: `scale(${1 + 0.25 * impact(f - tHook)}, ${f < tHook ? 0 : 1 - 0.3 * impact(f - tHook)})`, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>HOOK</span>
      </div>
      {f >= tMuestra - 6 && f < until ? <Ticket x={540} y={ticketY} lift={(1 - fall(f - (tMuestra - 6), fps)) * 1200} squash={0.4 * impact(f - tMuestra - 1)} /> : null}
    </AbsoluteFill>
  );
};
export const ctaRope = (f: number, tHook: number): RopeSpec => (f >= tHook + 4 ? { screen: true, bx: 712, by: 476, slack: interpolate(f, [tHook + 4, tHook + 14], [0.8, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), buzz: f >= tHook + 14 ? 0.4 : 0 } : null);

export const TopCaptions: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number; keys: number[]; hide?: boolean }> = ({ words, f, fps, keys, hide }) =>
  hide ? null : <Captions words={words} f={f} fps={fps} top={250} size={82} keys={keys} />;

export const Snd: React.FC<{ at: number; src: string; vol: number }> = ({ at, src, vol }) => (
  <Sequence name={src} from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

// Pulgar gigante que intenta pasar el video
export const Thumb: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <svg width={520} height={760} viewBox="0 0 520 760" style={{ position: "absolute", left: x - 140, top: y - 120, transform: `rotate(${rot}deg)`, transformOrigin: "260px 700px", overflow: "visible" }}>
    <path d="M180 40 C120 40 100 90 100 140 L100 420 C70 400 30 410 30 460 C30 520 120 560 160 640 L180 760 L470 760 L470 380 C470 330 430 310 400 320 C400 280 360 260 330 280 C330 250 290 230 260 250 L260 140 C260 90 240 40 180 40 Z" fill="#FBF8F2" stroke={A.ink} strokeWidth={12} strokeLinejoin="round" />
    <path d="M128 92 C128 70 150 60 176 62 C210 64 228 84 228 108 L228 150 C200 160 150 160 128 150 Z" fill="#E6DFD2" stroke={A.ink} strokeWidth={8} />
  </svg>
);

// Huecos numerados 1·2·3 en el suelo (las "tres cosas")
export const Slots: React.FC<{ xs: number[]; f: number; at: number; done?: number[] }> = ({ xs, f, at }) => (
  <>
    {xs.map((x, k) => (
      <svg key={k} width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: lin(f, at + k * 3, at + k * 3 + 6) }}>
        <ellipse cx={x} cy={FLOOR} rx={130} ry={24} fill="none" stroke={A.ink} strokeWidth={6} strokeDasharray="14 12" />
        <text x={x} y={FLOOR + 70} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill={A.orange}>
          {k + 1}
        </text>
      </svg>
    ))}
  </>
);
