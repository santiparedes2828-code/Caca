import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneFrom } from "./Kinetic";
import { C, HANDLE, WHIP, aberration, bold } from "./theme";

export type Bg = "light" | "dark" | "black";

// estilo.md §7 — fondo claro con viñeta / oscuro con foco / negro puro
const background: Record<Bg, string> = {
  light:
    "radial-gradient(ellipse 85% 70% at 50% 45%, #EDEDED 0%, #D6D6D6 55%, #8F8F8F 100%)",
  dark: "radial-gradient(ellipse 70% 45% at 50% 28%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 70%), #070707",
  black: "#000000",
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  // estilo.md §7 — grano fino (~4 %), cambia cada frame
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${frame}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed={Math.floor(random(`g${frame}`) * 1000)}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Formas negras grandes desenfocadas en las esquinas (estilo.md §4)
export const Petals: React.FC<{ readonly flip?: boolean }> = ({ flip }) => {
  const frame = useCurrentFrame();
  const petal = (x: number, y: number, r: number, w: number, h: number) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: "50%",
        background: "#0B0B0B",
        rotate: `${r + frame * 0.15}deg`,
        filter: `blur(6px) ${aberration(5)}`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ scale: flip ? "-1 1" : "1 1" }}>
      {petal(-120, -60, 35, 300, 120)}
      {petal(-40, 120, 75, 260, 100)}
      {petal(820, 1700, -30, 320, 120)}
      {petal(900, 1520, 15, 240, 90)}
    </AbsoluteFill>
  );
};

const SceneBody: React.FC<{
  readonly duration: number;
  readonly bg: Bg;
  readonly enter: "whip" | "cut";
  readonly exit: "whip" | "cut";
  readonly children: React.ReactNode;
}> = ({ duration, bg, enter, exit, children }) => {
  const frame = useCurrentFrame();
  const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const inP = enter === "whip" ? interpolate(frame, [0, WHIP], [1, 0], { ...opt, easing: Easing.out(Easing.cubic) }) : 0;
  const outP = exit === "whip" ? interpolate(frame, [duration - WHIP, duration], [0, 1], { ...opt, easing: Easing.in(Easing.cubic) }) : 0;
  const motion = Math.max(inP, outP);

  return (
    <AbsoluteFill
      style={{
        background: background[bg],
        overflow: "hidden",
        // Whip vertical con desenfoque y aberración (estilo.md §5)
        translate: `0px ${inP * 760 - outP * 760}px`,
        filter: motion > 0.01 ? `blur(${motion * 28}px) ${aberration(2 + motion * 10)}` : undefined,
      }}
    >
      {/* Push-in constante 1,00 → 1,08 + deriva (estilo.md §6) */}
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, duration], [1, 1.08], opt),
          translate: interpolate(frame, [0, duration], ["0px 0px", "-18px -24px"], opt),
        }}
      >
        {children}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 1640,
          width: "100%",
          textAlign: "center",
          fontFamily: bold,
          fontWeight: 600,
          fontSize: 30,
          color: bg === "light" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)",
        }}
      >
        {HANDLE}
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{
  readonly name: string;
  readonly from: number;
  readonly duration: number;
  readonly bg: Bg;
  readonly enter: "whip" | "cut";
  readonly exit: "whip" | "cut";
  readonly children: React.ReactNode;
}> = ({ name, from, duration, bg, enter, exit, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={name} from={from} durationInFrames={duration} premountFor={fps}>
      <SceneFrom.Provider value={from}>
        <SceneBody duration={duration} bg={bg} enter={enter} exit={exit}>
          {children}
        </SceneBody>
      </SceneFrom.Provider>
    </Sequence>
  );
};

// Zona de texto: el bloque crece hacia arriba y termina en y = 930 (estilo.md §2: 38–45 % del alto)
export const TextZone: React.FC<{ readonly children: React.ReactNode; readonly bottom?: number }> = ({
  children,
  bottom = 930,
}) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      right: 70,
      top: 0,
      height: bottom,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 6,
    }}
  >
    {children}
  </div>
);

// Zona del gráfico: debajo del texto, centrada (estilo.md §4)
export const GraphicZone: React.FC<{ readonly children: React.ReactNode; readonly top?: number }> = ({
  children,
  top = 990,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 0,
      right: 0,
      height: 600,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      filter: aberration(2),
    }}
  >
    {children}
  </div>
);

export const SmallPrint: React.FC<{ readonly dark?: boolean; readonly top?: number }> = ({ dark, top = 250 }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 190,
      right: 190,
      fontFamily: bold,
      fontWeight: 600,
      fontSize: 15,
      lineHeight: 1.35,
      textAlign: "center",
      color: dark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.32)",
    }}
  >
    Proceso: grabación en bruto, detección de silencios, transcripción palabra a palabra,
    subtítulos animados, zooms de ritmo, b-roll, diseño sonoro y exportación vertical
    1080x1920 lista para publicar en TikTok, Reels y Shorts.
  </div>
);

export const ink = (bg: Bg) => (bg === "light" ? C.ink : C.paper);
