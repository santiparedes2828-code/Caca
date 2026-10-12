import type { Caption } from "@remotion/captions";
import React, { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions.json";
import { B, MONO, SANS, SERIF } from "./brand";

export const captions = captionsJson as Caption[];
export const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Frame absoluto en el que suena la palabra i
export const wf = (i: number, fps: number) => Math.round((captions[i].startMs / 1000) * fps);
// Otros vídeos con la misma marca pasan su propia línea de tiempo con <CaptionsCtx.Provider>
export const CaptionsCtx = createContext<Caption[]>(captions);
export const useWf = () => {
  const { fps } = useVideoConfig();
  const caps = useContext(CaptionsCtx);
  return (i: number) => Math.round((caps[i].startMs / 1000) * fps);
};

const clean = (t: string) => t.replace(/[…:,]/g, "");

// estilo-hookhouse.md §2: opacidad 0→1, gris→tinta, desenfoque 8→0 en 5 frames
const Word: React.FC<{ i: number; accent: boolean; last: boolean; color: string }> = ({ i, accent, last, color }) => {
  const frame = useCurrentFrame();
  const w = useWf();
  const caps = useContext(CaptionsCtx);
  const local = frame - w(i);
  const p = interpolate(local, [0, 5], [0, 1], opt);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: p,
        filter: `blur(${(1 - p) * 8}px)`,
        color: accent ? B.green : p < 1 ? B.grey : color,
        translate: accent ? `0px ${(1 - p) * 10}px` : undefined,
        ...(accent ? { fontFamily: SERIF, fontWeight: 800 } : {}),
      }}
    >
      {clean(caps[i].text)}
      {last ? "" : " "}
    </span>
  );
};

export const Headline: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly accent?: readonly [number, number];
  readonly size: number;
  readonly top: number;
  readonly align?: "left" | "center";
  readonly dimAt?: number; // frame absoluto en el que la línea pasa a gris (sección siguiente)
  readonly underline?: boolean;
  readonly color?: string;
}> = ({ from, to, accent, size, top, align = "left", dimAt, underline, color = B.ink }) => {
  const frame = useCurrentFrame();
  const w = useWf();
  const idx = Array.from({ length: to - from + 1 }, (_, k) => from + k);
  const isAcc = (i: number) => !!accent && i >= accent[0] && i <= accent[1];
  const dim = dimAt === undefined ? 1 : interpolate(frame, [dimAt, dimAt + 6], [1, 0.3], opt);
  const ulStart = accent ? w(accent[1]) + 6 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: align === "left" ? 80 : 60,
        right: align === "left" ? 80 : 60,
        textAlign: align,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.98,
        letterSpacing: "-0.055em",
        opacity: dim,
      }}
    >
      {idx.map((i) =>
        isAcc(i) && underline && i === accent![1] ? (
          <span key={i} style={{ position: "relative", display: "inline-block" }}>
            <Word i={i} accent last={i === to} color={color} />
            <span
              style={{
                position: "absolute",
                left: 0,
                right: "0.1em",
                bottom: "-0.02em",
                height: 8,
                background: B.green,
                transformOrigin: "left center",
                scale: `${interpolate(frame, [ulStart, ulStart + 8], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) })} 1`,
              }}
            />
          </span>
        ) : (
          <Word key={i} i={i} accent={isAcc(i)} last={i === to} color={color} />
        ),
      )}
    </div>
  );
};

// Etiqueta monoespaciada en mayúsculas
export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 26,
  color = B.grey,
  style,
}) => (
  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: "0.08em", textTransform: "uppercase", color, ...style }}>
    {children}
  </span>
);

// Texto escrito a máquina: 1 carácter cada 1,5 frames y cursor que parpadea cada 15 frames
export const Typed: React.FC<{ text: string; accentFrom?: number; start: number; size: number; top: number }> = ({
  text,
  accentFrom,
  start,
  size,
  top,
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - start) / 1.5)));
  const shown = text.slice(0, n);
  const plain = accentFrom === undefined ? shown : shown.slice(0, accentFrom);
  const acc = accentFrom === undefined ? "" : shown.slice(accentFrom);
  const cursor = frame >= start && (n < text.length || Math.floor(frame / 15) % 2 === 0);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.055em",
        color: B.ink,
        whiteSpace: "pre",
      }}
    >
      {plain}
      <span style={{ fontFamily: SERIF, fontWeight: 800, color: B.green }}>{acc}</span>
      <span style={{ opacity: cursor ? 1 : 0, fontWeight: 500, color: B.ink }}>|</span>
    </div>
  );
};
