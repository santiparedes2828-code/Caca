import type { Caption } from "@remotion/captions";
import React, { createContext, useContext } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions.json";
import { C, bold, script } from "./theme";

export const captions = captionsJson as Caption[];

// Frame (absoluto) en el que empieza a sonar la palabra i
export const wordFrame = (i: number, fps: number) =>
  Math.round((captions[i].startMs / 1000) * fps);

// Frame absoluto en el que empieza la escena que contiene al componente
export const SceneFrom = createContext(0);

// Frame de la palabra i relativo a la escena actual
export const useWordFrame = (i: number) => {
  const { fps } = useVideoConfig();
  return wordFrame(i, fps) - useContext(SceneFrom);
};

const clean = (t: string) => t.replace(/[…:]/g, "");

export type Highlight = {
  readonly from: number;
  readonly to: number;
  readonly kind: "box" | "glow" | "green";
};

// estilo.md §2: cada palabra entra con desenfoque 12→0, opacidad 0→1, escala 1,08→1 en 6 frames
const Word: React.FC<{ i: number; children: React.ReactNode }> = ({
  i,
  children,
}) => {
  const frame = useCurrentFrame();
  const local = frame - useWordFrame(i);
  const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: interpolate(local, [0, 6], [0, 1], opt),
        filter: `blur(${interpolate(local, [0, 6], [12, 0], opt)}px)`,
        scale: interpolate(local, [0, 6], [1.08, 1], opt),
      }}
    >
      {children}
    </span>
  );
};

export const Words: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly font: "script" | "bold";
  readonly size: number;
  readonly color: string;
  readonly hl?: Highlight;
  readonly style?: React.CSSProperties;
}> = ({ from, to, font, size, color, hl, style }) => {
  const frame = useCurrentFrame();
  const hlFrame = useWordFrame(hl ? hl.from : from);
  const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const idx = Array.from({ length: to - from + 1 }, (_, k) => from + k);

  const renderWord = (i: number, last: boolean) => (
    <Word key={i} i={i}>
      {clean(captions[i].text)}
      {last ? "" : " "}
    </Word>
  );

  const before = hl ? idx.filter((i) => i < hl.from) : idx;
  const inside = hl ? idx.filter((i) => i >= hl.from && i <= hl.to) : [];
  const after = hl ? idx.filter((i) => i > hl.to) : [];

  const hlStyle: React.CSSProperties =
    hl?.kind === "glow"
      ? { color: C.red, textShadow: "0 0 18px rgba(227,18,27,0.8)" }
      : hl?.kind === "green"
        ? { color: C.green }
        : {
            color: C.ink,
            fontStyle: "italic",
            position: "relative",
            padding: "0 0.12em",
          };

  return (
    <div
      style={{
        fontFamily: font === "script" ? script : bold,
        fontWeight: font === "script" ? 400 : 800,
        fontSize: size,
        lineHeight: font === "script" ? 1.25 : 1.08,
        letterSpacing: font === "script" ? 0 : "-0.02em",
        color,
        textAlign: "center",
        // Golpe de zoom al aparecer la palabra destacada (estilo.md §6)
        scale: hl
          ? interpolate(frame - hlFrame, [0, 3, 9], [1, 1.04, 1], opt)
          : 1,
        ...style,
      }}
    >
      {before.map((i) => renderWord(i, i === to))}
      {inside.length > 0 ? (
        <span style={{ display: "inline-block", ...hlStyle }}>
          {hl?.kind === "box" ? (
            <span
              style={{
                position: "absolute",
                inset: "0.08em 0 0.02em 0",
                background: C.red,
                transformOrigin: "left center",
                scale: `${interpolate(frame - hlFrame, [0, 6], [0, 1], opt)} 1`,
              }}
            />
          ) : null}
          <span style={{ position: "relative" }}>
            {inside.map((i) => renderWord(i, i === hl!.to))}
          </span>
        </span>
      ) : null}
      {after.length > 0 ? " " : null}
      {after.map((i) => renderWord(i, i === to))}
    </div>
  );
};
