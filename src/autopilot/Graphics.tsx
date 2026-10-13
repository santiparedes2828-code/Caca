import { measureText } from "@remotion/layout-utils";
import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../design/schema";
import { captionLayout } from "./geometry";
import type { Graphic } from "./props";

// Apoyos gráficos a pantalla completa de los vídeos hablados: mientras la voz sigue, entra una escena de motion
// graphics con el dato que se está diciendo (calendario, lista, cifra o comparación). Solo datos dichos tal cual
// (autopilot/edit/graficos.ts). Estilo «estudio», abajo.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FAMILY = '"Inter"';

type Calendario = Extract<Graphic, { kind: "calendario" }>;
type Lista = Extract<Graphic, { kind: "lista" }>;
type Cifra = Extract<Graphic, { kind: "cifra" }>;
type Comparacion = Extract<Graphic, { kind: "comparacion" }>;

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

// ——— Estilo «estudio» (pedido del usuario el 13-10-2026 con un vídeo de referencia de motion graphics) ———
// Escena a pantalla completa sobre gris claro con cuadrícula fina, estrellas moradas de cuatro puntas, un arco gris
// que barre y una bola lima. Texto: el contexto en Inter Medium gris, la clave en Inter ExtraBold que entra
// desenfocada; cifras en degradado naranja con brillo; barras en degradado (turquesa, morado, rosa, naranja) con
// línea de tendencia; etiquetas en cajas de borde discontinuo que entran una a una. Entra con un círculo que se
// abre desde el centro y sale encogiéndose. Los subtítulos siguen encima, en tinta.

const S = {
  bg: "#DCDCDE",
  grid: "rgba(20,20,40,0.05)",
  ink: "#141414",
  muted: "#55555F",
  purple: "#3D14C8",
  purple2: "#7B3FE4",
  lime: "#C6F25B",
  orange: ["#F9C74F", "#F8961E", "#F3722C"],
  bars: [
    ["#3CC6C0", "#2A8F8A"],
    ["#7B5CF0", "#4B2BD0"],
    ["#F25CA2", "#C2307A"],
    ["#F9A03F", "#F25F2E"],
  ],
} as const;

const Star: React.FC<{ size: number; x: number; y: number; rot: number; s: number }> = ({ size, x, y, rot, s }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `rotate(${rot}deg) scale(${s})`, overflow: "visible" }}>
    <defs>
      <linearGradient id="estrella" x1="0" y1="-1" x2="0" y2="1">
        <stop offset="0%" stopColor={S.purple2} />
        <stop offset="100%" stopColor="#2A0A6B" />
      </linearGradient>
    </defs>
    <path d="M0 -50 C 6 -12, 12 -6, 50 0 C 12 6, 6 12, 0 50 C -6 12, -12 6, -50 0 C -12 -6, -6 -12, 0 -50 Z" fill="url(#estrella)" />
  </svg>
);

const Backdrop: React.FC<{ local: number; u: number; w: number; h: number }> = ({ local, u, w, h }) => {
  const { fps } = useVideoConfig();
  const st = spring({ frame: local - 2, fps, config: { damping: 12, stiffness: 120 } });
  const arc = interpolate(local, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const R = w * 0.95;
  return (
    <AbsoluteFill style={{ background: S.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${S.grid} 1px, transparent 1px), linear-gradient(90deg, ${S.grid} 1px, transparent 1px)`, backgroundSize: `${60 * u}px ${60 * u}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)" }} />
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M ${-w * 0.2} ${h * 0.95} A ${R} ${R} 0 0 1 ${w * 1.1} ${h * 0.35}`}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={70 * u}
          strokeLinecap="round"
          strokeDasharray={3000 * u}
          strokeDashoffset={3000 * u * (1 - arc)}
        />
      </svg>
      <Star size={150 * u} x={w * 0.9} y={h * 0.06} rot={20 + local * 0.8} s={st} />
      <Star size={120 * u} x={w * 0.1} y={h * 0.93} rot={-15 - local * 0.6} s={st} />
      <div style={{ position: "absolute", left: w * 0.86, top: h * 0.88, width: 46 * u, height: 46 * u, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, #E9FFB0, ${S.lime} 60%, #8DBB2A)`, transform: `scale(${st}) translateY(${Math.sin(local / 9) * 8 * u}px)` }} />
    </AbsoluteFill>
  );
};

// Texto que entra desenfocado y subiendo (como la referencia)
const BlurIn: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <div style={{ opacity: p, filter: `blur(${(1 - p) * 12}px)`, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};

const fmtCount = (v: number, display: string, p: number) => {
  // Cuenta hasta el valor manteniendo el formato del final («$1.5M», «35,000»)
  const m = display.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
  if (!m) return display;
  const [, pre, num, post] = m;
  const target = Number(num.replace(/,/g, ""));
  const dec = (num.split(".")[1] ?? "").length;
  const cur = target * p;
  const txt = num.includes(",") ? Math.round(cur).toLocaleString("en-US") : cur.toFixed(dec);
  return `${pre}${txt}${post}`;
};

const Counter: React.FC<{ g: Cifra; u: number; from: number; icon: string | null }> = ({ g, u, from, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ring = spring({ frame: frame - from - 2, fps, config: { damping: 12, stiffness: 140 } });
  const p = interpolate(frame - from - 6, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 * u }}>
      {icon ? (
        <div style={{ width: 300 * u, height: 300 * u, borderRadius: "50%", border: `${3 * u}px dashed rgba(0,0,0,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ring}) rotate(${(1 - ring) * -40}deg)` }}>
          <Img src={icon} style={{ width: 190 * u, height: 190 * u, filter: `drop-shadow(0 ${10 * u}px ${18 * u}px rgba(0,0,0,0.25))` }} />
        </div>
      ) : null}
      <div
        style={{
          fontWeight: 800,
          fontSize: 230 * u,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          backgroundImage: `linear-gradient(180deg, ${S.orange[0]}, ${S.orange[1]} 55%, ${S.orange[2]})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: `drop-shadow(0 0 ${30 * u}px rgba(248,150,30,0.45))`,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${0.8 + 0.2 * ring})`,
        }}
      >
        {fmtCount(g.value, g.display, p)}
      </div>
      {g.label ? (
        <BlurIn at={from + 12}>
          <div style={{ fontWeight: 500, fontSize: 64 * u, color: S.muted, letterSpacing: "-0.01em" }}>{g.label}</div>
        </BlurIn>
      ) : null}
    </div>
  );
};

const Bars: React.FC<{ g: Comparacion; u: number; w: number }> = ({ g, u, w }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...g.items.map((it) => it.value), 1);
  const chartH = 380 * u;
  const barW = Math.min(240 * u, (w * 0.8) / g.items.length - 70 * u);
  const gap = 120 * u;
  const total = g.items.length * barW + (g.items.length - 1) * gap;
    const bars = g.items.map((it, i) => {
    const at = Math.round((it.startMs / 1000) * fps) - 1;
    const p = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 110, mass: 0.8 } });
    const shown = frame >= at;
    // Altura mínima visible para la cifra pequeña (la diferencia se entiende igual con las etiquetas)
    const h = chartH * Math.max(0.08, it.value / max) * (shown ? p : 0);
    const x = i * (barW + gap);
    const [c1, c2] = S.bars[(i + (g.items.length === 2 ? 1 : 0)) % S.bars.length];
    return (
      <div key={i} style={{ position: "absolute", left: x, bottom: 0, width: barW, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ opacity: shown ? Math.min(1, p * 1.5) : 0, transform: `translateY(${(1 - p) * 20}px)`, marginBottom: 14 * u, fontWeight: 800, fontSize: 92 * u, letterSpacing: "-0.03em", color: S.ink, whiteSpace: "nowrap" }}>
          {fmtCount(it.value, it.display, shown ? Math.min(1, p) : 0)}
        </div>
        <div style={{ width: barW, height: h, borderRadius: `${16 * u}px ${16 * u}px 0 0`, background: `linear-gradient(180deg, ${c1}, ${c2})`, boxShadow: `0 ${16 * u}px ${30 * u}px rgba(0,0,0,0.18)` }} />
      </div>
    );
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: total, height: chartH + 130 * u }}>
        {bars}
      </div>
      <div style={{ height: 6 * u, width: total + 60 * u, background: S.ink, borderRadius: 3 * u }} />
      <div style={{ display: "flex", gap, marginTop: 26 * u }}>
        {g.items.map((it, i) => {
          const at = Math.round((it.startMs / 1000) * fps) - 1;
          return (
            <BlurIn key={i} at={at + 4} style={{ width: barW, display: "flex", justifyContent: "center" }}>
              <Tag text={it.label} u={u} size={34} />
            </BlurIn>
          );
        })}
      </div>
    </div>
  );
};

// Etiqueta en caja de borde discontinuo con puntos en las esquinas («Faster»)
const Tag: React.FC<{ text: string; u: number; size: number }> = ({ text, u, size }) =>
  text ? (
    <span style={{ position: "relative", display: "inline-block", padding: `${6 * u}px ${18 * u}px`, border: `${2 * u}px dashed rgba(20,20,20,0.45)`, fontWeight: 500, fontSize: size * u, color: S.ink, whiteSpace: "nowrap" }}>
      {[0, 1, 2, 3].map((k) => (
        <span key={k} style={{ position: "absolute", width: 8 * u, height: 8 * u, background: S.ink, left: k % 2 ? undefined : -5 * u, right: k % 2 ? -5 * u : undefined, top: k < 2 ? -5 * u : undefined, bottom: k < 2 ? undefined : -5 * u }} />
      ))}
      {text}
    </span>
  ) : null;

// Lista: cada elemento entra al decirse con su número en un cuadrado de color. Si el texto lleva «dato: detalle»
// («3–4 months: building it»), el dato va grande y el detalle debajo, en pequeño y gris
const StudioList: React.FC<{ g: Lista; u: number; w: number; fontsReady: boolean }> = ({ g, u, w, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = g.items.map((it) => {
    const k = it.text.indexOf(":");
    return k > 0 ? { head: it.text.slice(0, k).trim(), tail: it.text.slice(k + 1).trim() } : { head: it.text, tail: "" };
  });
  const box = 104 * u;
  const room = w * 0.94 - box - 40 * u;
  const size = useMemo(() => {
    const target = 86;
    if (!fontsReady) return target;
    const widest = Math.max(...parts.map((pt) => measureText({ text: pt.head, fontFamily: FAMILY, fontWeight: 800, fontSize: target * u, validateFontIsLoaded: false }).width));
    return widest > room ? (target * room) / widest : target;
  }, [parts, u, room, fontsReady]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30 * u, width: w * 0.94 }}>
      {g.items.map((it, i) => {
        const at = Math.round((it.startMs / 1000) * fps) - 1;
        const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
        const shown = frame >= at;
        const q = shown ? Math.min(1, p) : 0;
        const [c1, c2] = S.bars[i % S.bars.length];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 30 * u, opacity: Math.min(1, q * 1.4), filter: `blur(${(1 - q) * 10}px)`, transform: `translateX(${(1 - q) * -60 * u}px)` }}>
            <div style={{ width: box, height: box, borderRadius: 26 * u, background: `linear-gradient(160deg, ${c1}, ${c2})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 58 * u, flexShrink: 0, boxShadow: `0 ${10 * u}px ${20 * u}px rgba(0,0,0,0.18)` }}>
              {i + 1}
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.02 }}>
              <span style={{ fontWeight: 800, fontSize: size * u, letterSpacing: "-0.03em", color: S.ink, whiteSpace: "nowrap" }}>{parts[i].head}</span>
              {parts[i].tail ? <span style={{ fontWeight: 500, fontSize: Math.min(size * 0.55, 50) * u, color: S.muted, whiteSpace: "nowrap" }}>{parts[i].tail}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Cutaway: React.FC<{ g: Graphic; brand: Brand; fontsReady: boolean; icons: Record<string, string> }> = ({ g, brand, fontsReady, icons }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const lay = captionLayout(brand, width, height);
  const u0 = lay.unit;
  // El contenido de la escena es grande, como en la referencia: ocupa el centro de la pantalla
  const u = u0 * 1.45;
  const a = Math.round((g.startMs / 1000) * fps);
  const b = Math.round((g.endMs / 1000) * fps);
  const open = interpolate(frame, [a, a + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const close = interpolate(frame, [b - 7, b], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const radius = Math.hypot(width, height) * (open * (1 - close));
  const s = spring({ frame: frame - a - 3, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const w = width - lay.left * 0.6 - lay.right * 0.6;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${radius}px at 50% 45%)` }}>
      <Backdrop local={frame - a} u={u0} w={width} h={height} />
      <div
        style={{
          position: "absolute",
          left: lay.left,
          right: lay.right,
          top: height * 0.1,
          height: height * 0.52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FAMILY,
          opacity: Math.min(1, s * 1.6),
          transform: `translateY(${(1 - s) * 50 * u}px) scale(${0.94 + 0.06 * s})`,
          transformOrigin: "50% 30%",
        }}
      >
        {g.kind === "calendario" ? (
          <Calendar g={g} brand={brand} u={u} from={a} />
        ) : g.kind === "lista" ? (
          <StudioList g={g} u={u} w={w} fontsReady={fontsReady} />
        ) : g.kind === "cifra" ? (
          <Counter g={g} u={u} from={a} icon={g.icon ? (icons[g.icon] ?? null) : null} />
        ) : (
          <Bars g={g} u={u} w={w} />
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Graphics: React.FC<{ graphics: Graphic[]; brand: Brand; fontsReady: boolean; icons?: Record<string, string> }> = ({ graphics, brand, fontsReady, icons }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const g = graphics.find((x) => t >= x.startMs && t < x.endMs);
  return g ? <Cutaway g={g} brand={brand} fontsReady={fontsReady} icons={icons ?? {}} /> : null;
};
