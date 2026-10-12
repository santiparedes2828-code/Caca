import { measureText } from "@remotion/layout-utils";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../design/schema";
import { captionLayout } from "./geometry";
import type { Graphic } from "./props";

// Apoyos gráficos a pantalla completa de los vídeos hablados (estilo-hablado.md, ref. 1): mientras la voz sigue, el
// vídeo se desenfoca y oscurece detrás y entra una tarjeta clara con lo que se está diciendo: un calendario con el mes
// y el año (sin marcar ningún día: no se ha dicho) o una lista que se marca al nombrar cada cosa. Los subtítulos
// siguen encima. Entrada con muelle y salida de 6 frames: el cambio se nota pero no distrae.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FAMILY = '"Inter"';
const FADE = 6;

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

type Calendario = Extract<Graphic, { kind: "calendario" }>;
type Lista = Extract<Graphic, { kind: "lista" }>;

const WEEK = { es: ["L", "M", "X", "J", "V", "S", "D"], en: ["M", "T", "W", "T", "F", "S", "S"] } as const;

const Calendar: React.FC<{ g: Calendario; brand: Brand; u: number; from: number }> = ({ g, brand, u, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Rejilla real del mes (empieza en lunes); no se marca ningún día porque no se ha dicho
  const first = (new Date(Date.UTC(g.year, g.month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(g.year, g.month, 0)).getUTCDate();
  const cells = [...Array.from({ length: first }, () => 0), ...Array.from({ length: days }, (_, i) => i + 1)];
  const year = spring({ frame: frame - from - 4, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  const width = 760 * u;
  const pad = 40 * u;
  const cell = (width - 2 * pad) / 7;
  return (
    <div
      style={{
        width,
        borderRadius: 44 * u,
        overflow: "hidden",
        background: brand.colors.white,
        boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.45)`,
        fontFamily: FAMILY,
        color: brand.colors.ink,
      }}
    >
      <div style={{ background: brand.colors.accent, fontWeight: 800, fontSize: 62 * u, letterSpacing: "0.08em", textAlign: "center", padding: `${30 * u}px 0 ${26 * u}px` }}>
        {g.label.toUpperCase()}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 196 * u,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          textAlign: "center",
          padding: `${30 * u}px 0 ${16 * u}px`,
          opacity: Math.min(1, year * 2),
          transform: `scale(${0.6 + 0.4 * year})`,
        }}
      >
        {g.year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, rowGap: 4 * u, padding: `${6 * u}px ${pad}px ${36 * u}px` }}>
        {WEEK[g.lang].map((d, i) => (
          <div key={`d${i}`} style={{ textAlign: "center", fontWeight: 700, fontSize: 30 * u, color: brand.colors.muted, paddingBottom: 8 * u }}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const p = interpolate(frame - from - 6 - i * 0.6, [0, 6], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 40 * u,
                lineHeight: `${cell * 0.7}px`,
                opacity: d ? p : 0,
                transform: `translateY(${(1 - p) * 10 * u}px)`,
              }}
            >
              {d || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Check: React.FC<{ size: number; pop: number; draw: number; color: string; bg: string }> = ({ size, pop, draw, color, bg }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transform: `scale(${pop})`,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
      <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - draw)} />
    </svg>
  </div>
);

const Checklist: React.FC<{ g: Lista; brand: Brand; u: number; width: number; fontsReady: boolean }> = ({ g, brand, u, width, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const padX = 40 * u;
  const check = 88 * u;
  const gap = 32 * u;
  const rowH = 150 * u;
  // Cuerpo único para toda la lista, reducido si el elemento más largo no cabe
  const fontSize = useMemo(() => {
    const target = 72 * u;
    if (!fontsReady) return target;
    const room = width - 2 * padX - check - gap;
    const widest = Math.max(...g.items.map((it) => measureText({ text: it.text, fontFamily: FAMILY, fontWeight: 800, fontSize: target, validateFontIsLoaded: false }).width));
    return widest > room ? (target * room) / widest : target;
  }, [g.items, u, width, padX, check, gap, fontsReady]);
  return (
    <div
      style={{
        width,
        borderRadius: 44 * u,
        background: brand.colors.white,
        boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.45)`,
        padding: `${14 * u}px ${padX}px`,
        fontFamily: FAMILY,
        color: brand.colors.ink,
      }}
    >
      {g.items.map((it, i) => {
        // Cada elemento entra al decirse (un frame antes, como los subtítulos), la tarjeta crece para hacerle sitio y
        // su check se dibuja después
        const at = Math.round((it.startMs / 1000) * fps) - 1;
        const s = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 190, mass: 0.6 } });
        const pop = spring({ frame: frame - at - 3, fps, config: { damping: 9, stiffness: 200, mass: 0.5 } });
        const draw = interpolate(frame - at - 5, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const shown = frame >= at;
        return (
          <div
            key={i}
            style={{
              height: shown ? rowH * Math.min(s, 1.04) : 0,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap,
              borderTop: i && shown ? `${2 * u}px solid ${rgba(brand.colors.ink, 0.08)}` : undefined,
            }}
          >
            <Check size={check} pop={shown ? pop : 0} draw={draw} color={brand.colors.ink} bg={brand.colors.accent} />
            <div
              style={{
                fontWeight: 800,
                fontSize,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                opacity: shown ? Math.min(1, s * 1.5) : 0,
                transform: `translateX(${(1 - s) * -40 * u}px)`,
              }}
            >
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Cutaway: React.FC<{ g: Graphic; brand: Brand; fontsReady: boolean }> = ({ g, brand, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const lay = captionLayout(brand, width, height);
  const a = (g.startMs / 1000) * fps;
  const b = (g.endMs / 1000) * fps;
  const inP = interpolate(frame, [a, a + FADE], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(frame, [b - FADE, b], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const dim = inP * (1 - outP);
  const s = spring({ frame: frame - a, fps, config: { damping: 14, stiffness: 170, mass: 0.7 } });
  const filter = `blur(${26 * lay.unit * dim}px) brightness(${1 - 0.4 * dim}) saturate(${1 - 0.3 * dim})`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backdropFilter: filter, WebkitBackdropFilter: filter, background: rgba(brand.colors.bg, 0.22 * dim) }} />
      <div
        style={{
          position: "absolute",
          left: lay.left,
          right: lay.right,
          top: Math.max(lay.top, height * 0.17),
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, s * 1.6) * (1 - outP),
          transform: `translateY(${((1 - s) * 70 + outP * 24) * lay.unit}px) scale(${(0.9 + 0.1 * s) * (1 - 0.05 * outP)})`,
          transformOrigin: "50% 30%",
        }}
      >
        {g.kind === "calendario" ? (
          <Calendar g={g} brand={brand} u={lay.unit} from={a} />
        ) : (
          <Checklist g={g} brand={brand} u={lay.unit} width={width - lay.left - lay.right} fontsReady={fontsReady} />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Graphics: React.FC<{ graphics: Graphic[]; brand: Brand; fontsReady: boolean }> = ({ graphics, brand, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const g = graphics.find((x) => t >= x.startMs && t < x.endMs);
  return g ? <Cutaway g={g} brand={brand} fontsReady={fontsReady} /> : null;
};
