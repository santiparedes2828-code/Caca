import React from "react";
import { AbsoluteFill, Audio, Easing, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-cleopatra-1.json";
import c2 from "../../data/captions-cleopatra-2.json";
import c3 from "../../data/captions-cleopatra-3.json";
import c4 from "../../data/captions-cleopatra-4.json";
import c5 from "../../data/captions-cleopatra-5.json";
import { Snd, timing } from "../reelkit";
import { SOUND } from "../system";
import { BigName, Bokeh, C, DarkPhone, Dust, Grain, Label, Pill, Sparks, Stars, Studio, Tap, Vignette, bump, decay, eio, eo, ln, pop, rnd } from "./Servilleta";

// «Cleopatra y la Luna» — dato curioso de Hook House (2026-10-31), mismo estilo de edición que «La servilleta»
// (estilo-animado.md) con un tema totalmente distinto. Dato verificado: la Gran Pirámide de Guiza se terminó hacia
// 2580–2500 a. C. (Britannica: comienzos del siglo XXV a. C.; estimación habitual c. 2560 a. C.); Cleopatra VII vivió
// 69–30 a. C.; el Apolo 11 llegó a la Luna el 20/7/1969; Julio César murió en el 44 a. C. Con cualquier par de fechas:
// pirámide → Cleopatra ≈ 2.430–2.510 años; Cleopatra → Luna ≈ 2.000–2.040; Cleopatra → hoy (2026) ≈ 2.055–2.095;
// César → hoy ≈ 2.070. Personas: siluetas genéricas, sin caras. 5 variantes de gancho con el mismo cuerpo.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";
const SAND = "#FFB45C";
const SKY = "#7CC4FF";

const CAPS: Caption[][] = [c1, c2, c3, c4, c5];
export const cleopatraFrames = (v: number) => timing(CAPS[v - 1]).frames;

// protagonistas en dorado · lo cercano (Luna, vos, este video) en verde · las pirámides en arena · lo negativo en rojo
const KEYCOLOR: [RegExp, string][] = [
  [/^(cleopatra|reina|julio|césar)$/i, C.gold],
  [/^(luna|cohete|vos|video|cerca)$/i, C.green],
  [/^(pirámides|pirámide|antiguas)$/i, SAND],
  [/^(ni)$/i, C.red],
];
const keyColor = (w: string) => {
  const clean = w.toLowerCase().replace(/[¿?¡!.,:…"]/g, "");
  for (const [re, col] of KEYCOLOR) if (re.test(clean)) return col;
  return null;
};

const Subs: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number }> = ({ words, f, fps }) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at || i === 0) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?!]$/.test(words[i - 1].text) || n >= 4)) {
      start = i;
      n = 0;
    }
    n++;
  }
  return (
    <div style={{ position: "absolute", top: 270, left: 50, width: 980, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 78, lineHeight: 1.22, letterSpacing: "-0.01em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const d = spring({ frame: f - words[i].at + (i === 0 ? 8 : 0), fps, config: { damping: 9, stiffness: 300 } });
        const now = i === cur;
        const txt = words[i].text.replace(/[,:…]+$/, "").replace(/\.$/, "").replace(/"/g, "");
        const num = /\d/.test(txt);
        const wob = now ? 1 + 0.04 * Math.sin(f * 0.5) : 1;
        const kc = keyColor(txt);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 9px", opacity: Math.min(1, d * 1.5), transform: `translateY(${(1 - d) * 40}px) scale(${(0.7 + 0.3 * d) * wob}) rotate(${(1 - d) * (i % 2 ? 8 : -8)}deg)` }}>
            {num && now ? (
              <span style={{ display: "inline-block", padding: "0 22px 6px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 8px 0 rgba(0,0,0,0.45)" }}>{txt}</span>
            ) : kc ? (
              <span style={{ color: kc, opacity: now ? 1 : 0.85, textShadow: now ? `0 0 30px ${kc}, 0 4px 14px rgba(0,0,0,0.6)` : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            ) : (
              <span style={{ color: now ? C.white : C.grey, textShadow: now ? "0 0 26px rgba(255,255,255,0.45), 0 4px 14px rgba(0,0,0,0.6)" : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ---------- piezas ilustradas ----------
// Pirámide (cara iluminada + cara en sombra + hiladas); build < 1 = en construcción (sube de a capas)
export const Pyramid: React.FC<{ x: number; y: number; w: number; build?: number; old?: number; glow?: number }> = ({ x, y, w, build = 1, old = 0, glow = 0 }) => {
  const h = w * 0.64;
  const rows = 14;
  const shown = Math.max(0, Math.min(rows, build * rows));
  const topY = y - h * (shown / rows);
  const halfAt = (yy: number) => (w / 2) * ((yy - (y - h)) / h);
  const lx = (yy: number) => x - halfAt(yy);
  const rx = (yy: number) => x + halfAt(yy);
  const apexX = x + w * 0.12;
  const clipTop = topY;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <clipPath id={`pyc${Math.round(x)}${Math.round(w)}`}>
          <rect x={x - w} y={clipTop} width={w * 2} height={h + 10} />
        </clipPath>
      </defs>
      <g clipPath={`url(#pyc${Math.round(x)}${Math.round(w)})`} style={glow > 0 ? { filter: `drop-shadow(0 0 ${30 * glow}px rgba(255,180,92,${0.8 * glow}))` } : undefined}>
        <path d={`M${lx(y)} ${y} L${apexX} ${y - h} L${apexX} ${y} Z`} fill="#E9A65C" />
        <path d={`M${apexX} ${y - h} L${rx(y)} ${y} L${apexX} ${y} Z`} fill="#A8643A" />
        {Array.from({ length: rows }, (_, r) => {
          const yy = y - (h / rows) * (r + 1);
          return <line key={r} x1={lx(yy) + (apexX - x) * ((y - yy) / h)} y1={yy} x2={rx(yy) + (apexX - x) * ((y - yy) / h)} y2={yy} stroke="#7A4524" strokeWidth={2.5} opacity={0.45} />;
        })}
        {old > 0
          ? [0, 1, 2].map((i) => <path key={i} d={`M${x - w * 0.2 + i * w * 0.18} ${y - h * (0.2 + 0.15 * i)} l${10} ${18} l${-8} ${16} l${12} ${14}`} stroke="#5A3018" strokeWidth={3} fill="none" opacity={old} />)
          : null}
      </g>
    </svg>
  );
};

// Desierto al atardecer: sol con rayos que giran, dunas en capas, arena que vuela, pájaros, calor que ondula
export const Desert: React.FC<{ f: number; k?: number; build?: number; old?: number; night?: number; glow?: number; pyr?: { x: number; y: number; w: number } }> = ({ f, k = 0, build = 1, old = 0, night = 0, glow = 0, pyr = { x: 560, y: 1330, w: 720 } }) => (
  <>
    <AbsoluteFill style={{ background: night > 0.5 ? "linear-gradient(180deg, #0B1030 0%, #1E2350 55%, #3A2C4A 100%)" : "linear-gradient(180deg, #2B1B3A 0%, #8E3E3C 35%, #E07A44 58%, #F6B866 72%)" }} />
    {night > 0.5 ? <Stars f={f} n={70} h={1000} /> : null}
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${760 - 30 * k} 980) rotate(${f * 0.5})`} opacity={night > 0.5 ? 0.12 : 0.3}>
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d="M0 0 L36 -900 L-36 -900 Z" fill="#FFE2A8" transform={`rotate(${i * 25.7})`} />
        ))}
      </g>
    </svg>
    <div style={{ position: "absolute", left: 760 - 30 * k - 130, top: 980 - 130, width: 260, height: 260, borderRadius: "50%", background: night > 0.5 ? "radial-gradient(circle, #F5F1E3 0%, #DCD6C2 60%, rgba(220,214,194,0) 72%)" : "radial-gradient(circle, #FFF2C8 0%, #FFD98A 55%, rgba(255,217,138,0) 72%)", transform: `scale(${1 + 0.04 * Math.sin(f * 0.2)})` }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 4 }, (_, i) => {
        const x = ((f * (2.5 + i) + i * 300) % 1300) - 120;
        const y = 720 + i * 60 + 20 * Math.sin(f * 0.1 + i);
        const w = 9 * Math.sin(f * 0.6 + i);
        return <path key={i} d={`M${x - 20} ${y - w} Q${x - 9} ${y - 4} ${x} ${y} Q${x + 9} ${y - 4} ${x + 20} ${y - w}`} stroke="#2A1420" strokeWidth={5} fill="none" strokeLinecap="round" />;
      })}
      <path d={`M-60 ${1250 + 6 * Math.sin(f * 0.02)} C200 ${1200 - 20 * k} 420 1260 640 1230 C820 1205 960 1240 1140 1225 L1140 1920 L-60 1920 Z`} fill={night > 0.5 ? "#2A2440" : "#C9783E"} />
    </svg>
    <Pyramid x={pyr.x - 330} y={pyr.y - 40} w={pyr.w * 0.42} old={old} />
    <Pyramid x={pyr.x + 300} y={pyr.y - 20} w={pyr.w * 0.55} old={old} />
    <Pyramid x={pyr.x} y={pyr.y} w={pyr.w} build={build} old={old} glow={glow} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d={`M-60 1400 C260 ${1350 + 10 * Math.sin(f * 0.03)} 560 1420 1140 1370 L1140 1920 L-60 1920 Z`} fill={night > 0.5 ? "#1A1630" : "#A85A2E"} />
      <path d="M-60 1560 C300 1500 700 1590 1140 1530 L1140 1920 L-60 1920 Z" fill={night > 0.5 ? "#110E22" : "#7E3E1E"} />
    </svg>
    {/* arena que vuela de costado */}
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 40 }, (_, i) => {
        const sp = 4 + rnd(i) * 8;
        const x = ((rnd(i + 1) * 1200 + f * sp) % 1240) - 80;
        const y = 1250 + rnd(i + 2) * 600 + 14 * Math.sin(f * 0.1 + i);
        return <line key={i} x1={x} y1={y} x2={x + 10 + sp * 2} y2={y - 2} stroke={night > 0.5 ? "#8A86B0" : "#FFE2B0"} strokeWidth={2.5} opacity={0.35 + 0.3 * Math.sin(f * 0.2 + i)} strokeLinecap="round" />;
      })}
    </svg>
  </>
);

// Busto de reina egipcia (silueta de perfil, sin cara): tocado, cobra en la frente y collar dorado
export const CleoBust: React.FC<{ x: number; y: number; s?: number; f: number; lit?: number; flip?: boolean }> = ({ x, y, s = 1, f, lit = 0, flip = false }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y + 5 * Math.sin(f * 0.11)}) scale(${(flip ? -1 : 1) * s} ${s})`} style={{ filter: `drop-shadow(0 0 ${14 + 26 * lit}px rgba(247,185,85,${0.35 + 0.55 * lit}))` }}>
      <path d="M-150 220 Q-150 80 -20 64 Q110 70 130 220 Z" fill="#120C14" />
      <path d="M-40 70 L-30 0 L30 0 L36 70 Z" fill="#120C14" />
      <g transform={`rotate(${2 * Math.sin(f * 0.08)} 0 -40)`}>
        <ellipse cx={8} cy={-70} rx={70} ry={80} fill="#120C14" />
        <path d="M30 -60 Q86 -64 84 -40 Q80 -26 60 -24 Q74 -10 56 4 L30 4 Z" fill="#120C14" />
        {/* tocado */}
        <path d="M-74 -96 Q-10 -170 66 -116 L74 -60 L-84 70 L-118 70 Q-110 -30 -74 -96 Z" fill="#1E1624" />
        <path d="M-70 -96 Q-10 -166 66 -116" stroke={C.gold} strokeWidth={8} fill="none" />
        <path d="M-84 -40 L-104 60 M-64 -60 L-86 60 M-44 -76 L-66 60" stroke={C.gold} strokeWidth={5} opacity={0.65} />
        <path d="M58 -118 q16 -24 6 -40 q-8 10 -16 6 q10 14 10 34 Z" fill={C.gold} />
      </g>
      <path d="M-120 120 Q-10 170 106 120" stroke={C.gold} strokeWidth={14} fill="none" opacity={0.9} />
      <path d="M-110 146 Q-10 196 98 146" stroke="#3FA7A0" strokeWidth={10} fill="none" opacity={0.8} />
    </g>
  </svg>
);

// Busto romano (silueta de perfil) con corona de laurel
export const CaesarBust: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y + 5 * Math.sin(f * 0.1 + 2)}) scale(${s} ${s})`}>
      <path d="M-150 220 Q-150 80 -20 64 Q110 70 130 220 Z" fill="#14121A" />
      <path d="M-60 210 Q-20 120 120 110 L130 220 Z" fill="#2A2232" opacity={0.9} />
      <path d="M-40 70 L-30 0 L30 0 L36 70 Z" fill="#14121A" />
      <ellipse cx={8} cy={-70} rx={70} ry={80} fill="#14121A" />
      <path d="M30 -60 Q86 -64 84 -40 Q80 -26 60 -24 Q74 -10 56 4 L30 4 Z" fill="#14121A" />
      {Array.from({ length: 7 }, (_, i) => {
        const a = Math.PI * (0.95 + i * 0.13);
        return <ellipse key={i} cx={8 + 70 * Math.cos(a)} cy={-90 + 60 * Math.sin(a)} rx={20} ry={9} fill={C.gold} transform={`rotate(${(a * 180) / Math.PI + 70} ${8 + 70 * Math.cos(a)} ${-90 + 60 * Math.sin(a)})`} />;
      })}
    </g>
  </svg>
);

// Cohete genérico con llama que titila y humo; launch 0..1 lo hace subir
export const Rocket: React.FC<{ x: number; y: number; s?: number; f: number; launch?: number; smoke?: number }> = ({ x, y, s = 1, f, launch = 0, smoke = 0 }) => {
  const up = 1400 * Easing.in(Easing.quad)(launch);
  const fl = 0.8 + 0.25 * Math.sin(f * 2.1) + 0.15 * Math.sin(f * 3.7);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {smoke > 0
        ? Array.from({ length: 12 }, (_, i) => {
            const dir = i % 2 ? 1 : -1;
            const g = Math.min(1, smoke * 1.3);
            return <circle key={i} cx={x + dir * (40 + i * 26) * g + 6 * Math.sin(f * 0.1 + i)} cy={y + 150 * s - 10 * (i % 3) - 20 * g} r={(50 + (i % 4) * 18) * g * s} fill="#E9E4F2" opacity={0.8 - 0.04 * i} />;
          })
        : null}
      <g transform={`translate(${x + 2 * Math.sin(f * 1.7) * (launch > 0 ? 1 : 0)} ${y - up}) scale(${s})`}>
        <path d={`M-26 150 Q0 ${150 + 160 * fl} 26 150 Z`} fill="#FFB347" opacity={launch > 0 || smoke > 0 ? 1 : 0} />
        <path d={`M-14 150 Q0 ${150 + 100 * fl} 14 150 Z`} fill="#FFF3B0" opacity={launch > 0 || smoke > 0 ? 1 : 0} />
        <path d="M-40 150 L-70 190 L-70 120 L-40 80 Z" fill="#C9C2D6" />
        <path d="M40 150 L70 190 L70 120 L40 80 Z" fill="#A8A0B8" />
        <rect x={-40} y={-160} width={80} height={310} rx={14} fill="#F4F1EA" />
        <rect x={-40} y={-30} width={80} height={16} fill="#1E1A28" />
        <rect x={-40} y={60} width={80} height={16} fill="#1E1A28" />
        <path d="M-40 -150 Q0 -290 40 -150 Z" fill="#F4F1EA" />
        <circle cx={0} cy={-90} r={18} fill={SKY} stroke="#1E1A28" strokeWidth={6} />
      </g>
    </svg>
  );
};

// Luna: superficie con cráteres, la Tierra en el cielo y un astronauta (dos piernas) que clava la bandera
export const MoonScene: React.FC<{ f: number; plant: number; astro?: boolean }> = ({ f, plant, astro = true }) => {
  const step = Math.sin(f * 0.25);
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #03040C 0%, #0B1024 70%, #151A30 100%)" }} />
      <Stars f={f} n={90} h={1300} />
      <div style={{ position: "absolute", left: 720, top: 560, width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #8FD3FF 0%, #2E6FB8 55%, #0E2A55 100%)", boxShadow: "0 0 60px rgba(124,196,255,0.5)", transform: `rotate(${f * 0.3}deg)` }}>
        <div style={{ position: "absolute", left: 40, top: 50, width: 70, height: 40, borderRadius: "50%", background: "#3E9E5C", opacity: 0.85 }} />
        <div style={{ position: "absolute", left: 100, top: 110, width: 50, height: 34, borderRadius: "50%", background: "#3E9E5C", opacity: 0.85 }} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d="M-60 1300 C260 1260 620 1320 1140 1270 L1140 1920 L-60 1920 Z" fill="#B9B6C4" />
        <path d="M-60 1460 C320 1420 700 1480 1140 1440 L1140 1920 L-60 1920 Z" fill="#8E8A9C" />
        {[
          [200, 1380, 70],
          [760, 1360, 50],
          [520, 1600, 110],
          [900, 1620, 60],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.32} fill="#6E6A7E" />
        ))}
        {/* bandera */}
        <g transform={`translate(380 ${1330 - 260 * plant})`} opacity={plant > 0 ? 1 : 0}>
          <line x1={0} y1={0} x2={0} y2={260} stroke="#E8E6EE" strokeWidth={8} />
          <line x1={0} y1={6} x2={160} y2={6} stroke="#E8E6EE" strokeWidth={6} />
          <g transform={`skewY(${2 * Math.sin(f * 0.2)})`}>
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x={0} y={8 + i * 14} width={160} height={14} fill={i % 2 ? "#F4F1EA" : "#C8323C"} />
            ))}
            <rect x={0} y={8} width={70} height={56} fill="#2A3F8A" />
          </g>
        </g>
        {/* astronauta: dos piernas que giran desde la cadera, dos brazos, casco con visor */}
        <g transform="translate(600 1330)" opacity={astro ? 1 : 0}>
          <g transform={`rotate(${10 * step} 0 -150)`}>
            <rect x={-30} y={-150} width={34} height={150} rx={16} fill="#E8E6EE" />
            <rect x={-36} y={-12} width={46} height={22} rx={10} fill="#B8B4C6" />
          </g>
          <g transform={`rotate(${-10 * step} 0 -150)`}>
            <rect x={-4} y={-150} width={34} height={150} rx={16} fill="#F4F2F8" />
            <rect x={-10} y={-12} width={46} height={22} rx={10} fill="#C8C4D4" />
          </g>
          <rect x={-60} y={-320} width={120} height={185} rx={40} fill="#F4F2F8" />
          <rect x={-86} y={-310} width={40} height={130} rx={14} fill="#C8C4D4" />
          <g transform={`rotate(${-60 + 40 * plant} 55 -290)`}>
            <rect x={40} y={-300} width={30} height={130} rx={15} fill="#F4F2F8" />
          </g>
          <circle cx={0} cy={-370} r={62} fill="#F4F2F8" />
          <ellipse cx={14} cy={-370} rx={42} ry={34} fill="#C9A24A" />
          <ellipse cx={4} cy={-382} rx={14} ry={8} fill="#FFF6D8" opacity={0.7} />
        </g>
      </svg>
      <Dust f={f} x0={100} x1={980} y0={1250} y1={1700} n={20} color="#D8D6E4" />
    </>
  );
};

// Línea de tiempo VERTICAL (aprovecha el 9:16): arriba la pirámide, abajo la Luna / este video. Los años bajan a
// escala fija; un punto viajero opcional; llaves a la derecha con la distancia en una pastilla.
type Mark = { year: number; label: string; kind: "pyr" | "cleo" | "luna" | "hoy" };
const yearTxt = (y: number) => (y < 0 ? `${-y} a. C.` : `${y}`);
const AX = 190;
const Y0 = 600;
const Y1 = 1700;
const YR0 = -2560;
const YR1 = 2026;
const TY = (yr: number) => Y0 + ((yr - YR0) / (YR1 - YR0)) * (Y1 - Y0);
const Timeline: React.FC<{ f: number; marks: Mark[]; show: number[]; braces: { a: number; b: number; text: string; color: string; p: number; x?: number }[]; dot?: number; grow?: number }> = ({ f, marks, show, braces, dot, grow = 1 }) => {
  const yEnd = Y0 + (Y1 - Y0) * grow;
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #0E0C1A 0%, #1C1A34 60%, #100E18 100%)" }} />
      <Bokeh f={f} color="#7C8CFF" seed={4} n={10} />
      <Dust f={f} x0={60} x1={1020} y0={500} y1={1800} n={26} color="#C9C2FF" />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={AX} y1={Y0 - 30} x2={AX} y2={yEnd + 30} stroke="rgba(255,255,255,0.8)" strokeWidth={10} strokeLinecap="round" />
        {Array.from({ length: 10 }, (_, i) => {
          const yr = -2500 + i * 500;
          const y = TY(yr);
          return y <= yEnd ? <line key={i} x1={AX - 16} y1={y} x2={AX + 16} y2={y} stroke="#FFFFFF" strokeWidth={4} opacity={0.5} /> : null;
        })}
        {TY(0) <= yEnd ? (
          <text x={AX - 30} y={TY(0) + 9} textAnchor="end" fontFamily={PF} fontWeight={600} fontSize={26} fill="rgba(255,255,255,0.5)">
            año 0
          </text>
        ) : null}
        {braces.map((b, i) => {
          if (b.p <= 0) return null;
          const bx = b.x ?? 640;
          const y0 = TY(b.a);
          const y1 = y0 + (TY(b.b) - y0) * eo(Math.min(1, b.p));
          return (
            <g key={i}>
              <path d={`M${bx - 30} ${y0} L${bx} ${y0} L${bx} ${y1} L${bx - 30} ${y1}`} stroke={b.color} strokeWidth={10} fill="none" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 14px ${b.color})` }} />
              {b.p > 0.6 ? (
                <g transform={`translate(${bx + 190} ${(y0 + TY(b.b)) / 2}) scale(${Math.min(1, (b.p - 0.6) * 4)})`}>
                  <rect x={-170} y={-48} width={340} height={92} rx={46} fill={C.cream} />
                  <text x={0} y={16} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={50} fill={b.color === C.green ? "#15803D" : b.color === C.red ? "#B91C1C" : "#9A5A12"}>
                    {b.text}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
        {dot !== undefined ? <circle cx={AX} cy={TY(dot)} r={22 + 4 * Math.sin(f * 0.6)} fill={C.gold} style={{ filter: "drop-shadow(0 0 16px rgba(247,185,85,0.9))" }} /> : null}
      </svg>
      {marks.map((m, i) => {
        const sc = show[i] ?? 0;
        if (sc <= 0) return null;
        const y = TY(m.year);
        return (
          <div key={m.label} style={{ position: "absolute", left: AX - 80, top: y - 80, width: 460, height: 160, transform: `scale(${sc}) translateX(${4 * Math.sin(f * 0.15 + i)}px)`, transformOrigin: "80px 80px" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 160, height: 160, borderRadius: 38, background: m.kind === "pyr" ? "linear-gradient(180deg, #F6B866, #C9783E)" : m.kind === "luna" ? "linear-gradient(180deg, #0B1024, #1E2A50)" : m.kind === "hoy" ? "linear-gradient(180deg, #2A2238, #120E18)" : "linear-gradient(180deg, #3A2A44, #1A1220)", boxShadow: "0 16px 30px rgba(0,0,0,0.5), 0 0 0 5px rgba(255,255,255,0.85)", overflow: "hidden" }}>
              <svg width={160} height={160} viewBox="0 0 180 180">
                {m.kind === "pyr" ? (
                  <>
                    <path d="M20 150 L96 50 L96 150 Z" fill="#FFE2B0" />
                    <path d="M96 50 L165 150 L96 150 Z" fill="#A8643A" />
                  </>
                ) : m.kind === "luna" ? (
                  <>
                    <circle cx={90} cy={86} r={50} fill="#E3E1EA" />
                    <circle cx={74} cy={74} r={10} fill="#B9B6C4" />
                    <circle cx={108} cy={104} r={14} fill="#B9B6C4" />
                  </>
                ) : m.kind === "hoy" ? (
                  <>
                    <rect x={58} y={24} width={64} height={130} rx={14} fill="#0E0C12" stroke="#4A4558" strokeWidth={4} />
                    <path d="M80 72 L106 88 L80 104 Z" fill={C.green} />
                  </>
                ) : (
                  <>
                    <circle cx={92} cy={80} r={34} fill="#120C14" />
                    <path d="M58 70 Q92 30 126 64 L128 90 L54 130 Z" fill="#1E1624" />
                    <path d="M58 70 Q92 32 126 64" stroke={C.gold} strokeWidth={6} fill="none" />
                    <path d="M40 170 Q40 118 92 112 Q144 118 144 170 Z" fill="#120C14" />
                    <path d="M54 140 Q92 160 130 140" stroke={C.gold} strokeWidth={8} fill="none" />
                  </>
                )}
              </svg>
            </div>
            <div style={{ position: "absolute", left: 180, top: 28, fontFamily: PF, fontWeight: 800, fontSize: 46, color: C.white, whiteSpace: "nowrap", textShadow: "0 4px 12px rgba(0,0,0,0.7)" }}>{m.label}</div>
            <div style={{ position: "absolute", left: 180, top: 88, fontFamily: PF, fontWeight: 600, fontSize: 32, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>{yearTxt(m.year)}</div>
          </div>
        );
      })}
    </>
  );
};

// Escena «cerca / lejos»: la reina, algo cerca (la Luna, el cohete, vos) y la pirámide lejos
export const NearFar: React.FC<{ f: number; near: "luna" | "cohete" | "vos"; tNear: number; tFar: number; tQueen: number; fps: number; labels?: boolean }> = ({ f, near, tNear, tFar, tQueen, fps, labels = false }) => {
  const far = ln(f, tFar - 2, tFar + 16, 0, 1, eo);
  const q = f >= tQueen ? pop(f, tQueen, fps) : 0;
  const n = f >= tNear ? pop(f, tNear, fps) : 0;
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #E07A44 0%, #8E3E3C 30%, #2A2040 55%, #0B1030 100%)" }} />
      <Stars f={f} n={50} h={1300} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d="M-60 1420 C300 1380 700 1440 1140 1400 L1140 1920 L-60 1920 Z" fill="#1A1424" />
      </svg>
      {/* la pirámide: se aleja cuando suena «pirámides» */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: "120px 1400px", transform: `scale(${1 - 0.65 * far}) translateX(${-120 * far}px)` }}>
        <Pyramid x={220} y={1420} w={420} />
      </div>
      {far > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={420} y1={1500} x2={420 - 330 * far} y2={1500} stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={-f * 2} />
          <path d={`M${420 - 330 * far} 1500 l26 -18 l0 36 Z`} fill={C.red} />
        </svg>
      ) : null}
      <CleoBust x={500} y={1260} s={1.2 * q} f={f} lit={q} />
      {n > 0 ? (
        near === "luna" ? (
          <div style={{ position: "absolute", left: 760 - 150 * n, top: 860 - 150 * n, width: 300 * n, height: 300 * n, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #FFFFFF 0%, #E3E1EA 50%, #9E9AAE 100%)", boxShadow: `0 0 ${80 + 20 * Math.sin(f * 0.3)}px rgba(255,255,255,0.45)`, transform: `rotate(${f * 0.4}deg)` }}>
            <div style={{ position: "absolute", left: "25%", top: "30%", width: "18%", height: "18%", borderRadius: "50%", background: "#B9B6C4" }} />
            <div style={{ position: "absolute", left: "58%", top: "56%", width: "24%", height: "24%", borderRadius: "50%", background: "#B9B6C4" }} />
          </div>
        ) : near === "cohete" ? (
          <Rocket x={820} y={1120} s={1.15 * n} f={f} smoke={0.4 * n} />
        ) : (
          <DarkPhone x={820} y={1140} s={0.5 * n} f={f}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2A2238, #120E18)" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 90, color: C.green }}>VOS</div>
            </div>
          </DarkPhone>
        )
      ) : null}
      {n > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={640} y1={1500} x2={640 + 110 * n} y2={1500} stroke={C.green} strokeWidth={10} strokeLinecap="round" />
          <path d={`M${640 + 110 * n} 1500 l-26 -18 l0 36 Z`} fill={C.green} />
        </svg>
      ) : null}
      {labels && q > 0 ? <Pill x={500} y={1580} text="ESTA REINA" s={q * 0.8} size={50} dark /> : null}
      {labels && n > 0 ? <Pill x={840} y={1660} text="ESTE COHETE" s={n * 0.8} size={50} dark /> : null}
      {labels && far > 0.3 ? <Pill x={200} y={1660} text="ESTA PIRÁMIDE" s={far * 0.8} size={46} dark /> : null}
      <Sparks f={f} at={tNear} x={820} y={1000} n={18} color={C.green} spread={320} />
      <Label text="SILUETAS ILUSTRADAS" x={72} y={1760} />
    </>
  );
};

type SceneId = "hook" | "piramide" | "nace" | "ella" | "cesar" | "despegue" | "luna" | "linea" | "video" | "cta";

export const Cleopatra: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const T = timing(CAPS[v - 1]);
  const { W, E, idx } = T;
  const END = T.frames;
  const words = T.words;

  // ---- índices del cuerpo ----
  const iLa = idx("gran") - 1;
  const iGran = idx("gran");
  const i4500 = idx("4500", iGran);
  const iCleoN = idx("cleopatra", i4500);
  const i2500 = idx("2500", iCleoN);
  const iPara = idx("para", i2500);
  const iAntiguas = idx("antiguas", iPara);
  const iJulio = idx("julio", iAntiguas);
  const iNos = idx("nosotros", iJulio);
  const i1969 = idx("1969", iNos);
  const iHombre = idx("hombre", i1969);
  const iLuna = idx("luna", iHombre);
  const i2000 = idx("2000", iLuna);
  const iCleo3 = idx("cleopatra", i2000);
  const iOsea = idx("o", iCleo3);
  const iVideo = idx("video", iOsea);
  const iPirFin = idx("pirámides", iVideo);
  const iSeguime = idx("seguime", iPirFin);
  const iCabeza = idx("cabeza", iSeguime);

  const S = {
    piramide: W(iLa) - 3,
    nace: W(iCleoN) - 2,
    ella: W(iPara) - 2,
    cesar: W(iJulio) - 6,
    despegue: W(i1969 - 2) - 2,
    luna: W(iHombre) - 2,
    linea: W(i2000 - 1) - 2,
    video: W(iOsea) - 2,
    cta: W(iSeguime),
  };
  const raw: [SceneId, number][] = [["hook", 0], ...(Object.entries(S) as [SceneId, number][])];
  const scenes = raw.filter(([, s], i) => i === 0 || s > raw[i - 1][1]);
  let si = 0;
  while (si < scenes.length - 1 && f >= scenes[si + 1][1]) si++;
  const sceneStart = scenes[si][1];
  const sceneEnd = si + 1 < scenes.length ? scenes[si + 1][1] : END;
  const endOf = (id: SceneId) => {
    const k = scenes.findIndex(([s]) => s === id);
    return k >= 0 && k + 1 < scenes.length ? scenes[k + 1][1] : END;
  };

  const t4500 = W(i4500);
  const t2500 = W(i2500);
  const tAnt = W(iAntiguas);
  const tJulio = W(iJulio);
  const t1969 = W(i1969);
  const tLuna = W(iLuna);
  const t2000 = W(i2000);
  const tVideo = W(iVideo);
  const tPirFin = W(iPirFin);
  const tBtn = S.cta + 4;

  // ---- ganchos ----
  const hk = {
    pir: idx("pirámides"),
    luna: idx("luna"),
    seg: idx("2"),
    reina: idx("reina"),
    cohete: idx("cohete"),
    pir1: idx("pirámide"),
    vio: idx("vio"),
    ni: idx("ni"),
    vos: idx("vos"),
    cleo: idx("cleopatra"),
  };
  const tTimer = E(hk.seg) + 2;

  const renderHook = (): React.ReactNode => {
    if (v === 1) {
      const k = Math.max(0, Math.min(1, (f - tTimer) / 60));
      const ringR = 170;
      return (
        <>
          <AbsoluteFill style={{ clipPath: "polygon(0 0, 58% 0, 42% 100%, 0 100%)" }}>
            <Desert f={f} pyr={{ x: 300, y: 1330, w: 560 }} />
          </AbsoluteFill>
          <AbsoluteFill style={{ clipPath: "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)" }}>
            <MoonScene f={f} plant={0} astro={false} />
            <Rocket x={850} y={1120} s={0.9} f={f} smoke={0.5} />
          </AbsoluteFill>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={626} y1={0} x2={454} y2={1920} stroke="#FFF6E6" strokeWidth={8} opacity={0.8 + 0.2 * Math.sin(f * 0.4)} style={{ filter: "drop-shadow(0 0 16px rgba(255,246,230,0.9))" }} />
          </svg>
          <CleoBust x={540} y={1400} s={1.0} f={f} lit={0.6} />
          {f >= W(hk.pir) ? <Pill x={250} y={760} text="PIRÁMIDES" s={pop(f, W(hk.pir), fps) * (1 + 0.04 * Math.sin(f * 0.4))} size={58} rot={-4} /> : null}
          {f >= W(hk.luna) ? <Pill x={830} y={760} text="LUNA" s={pop(f, W(hk.luna), fps) * (1 + 0.04 * Math.sin(f * 0.4 + 1))} size={58} rot={4} dark /> : null}
          {f >= W(hk.seg) ? (
            <>
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <circle cx={540} cy={960} r={ringR} fill="rgba(10,8,14,0.55)" stroke="rgba(255,255,255,0.15)" strokeWidth={12} />
                <circle cx={540} cy={960} r={ringR} fill="none" stroke={C.gold} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(1 - k) * 2 * Math.PI * ringR} ${2 * Math.PI * ringR}`} transform="rotate(-90 540 960)" style={{ filter: "drop-shadow(0 0 12px rgba(247,185,85,0.8))" }} />
              </svg>
              <div style={{ position: "absolute", left: 340, width: 400, top: 900, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 96, color: C.white, transform: `scale(${pop(f, W(hk.seg), fps) * (1 + 0.15 * bump(f, tTimer + 60))})`, textShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>{(2 * (1 - k)).toFixed(1).replace(".", ",")}</div>
            </>
          ) : null}
          <Label text="ILUSTRACIÓN" x={72} y={1760} />
        </>
      );
    }
    if (v === 2) return <NearFar f={f} near="luna" tNear={W(hk.luna)} tFar={W(hk.pir)} tQueen={0} fps={fps} />;
    if (v === 3) return <NearFar f={f} near="cohete" tNear={W(hk.cohete)} tFar={W(hk.pir1)} tQueen={W(hk.reina) - 2} fps={fps} labels />;
    if (v === 5) return <NearFar f={f} near="vos" tNear={W(hk.vos)} tFar={W(hk.pir)} tQueen={0} fps={fps} />;
    // v4: «¿Cleopatra vio cómo construían las pirámides? Ni cerca.»
    const tNi = W(hk.ni);
    const after = f >= tNi;
    const build = ln(f, 0, tNi, 0.35, 0.95);
    return (
      <>
        <AbsoluteFill style={{ filter: after ? `grayscale(${ln(f, tNi, tNi + 6)}) brightness(${1 - 0.35 * ln(f, tNi, tNi + 6)})` : undefined }}>
          <Desert f={f} build={build} />
          {/* bloques que suben por la rampa */}
          {!after
            ? [0, 1, 2].map((i) => {
                const ph = ((f + i * 12) % 36) / 36;
                return <div key={i} style={{ position: "absolute", left: 240 + 260 * ph, top: 1300 - 200 * ph, width: 46, height: 34, background: "#E9A65C", border: "3px solid #7A4524", borderRadius: 4, transform: `rotate(${-30}deg)` }} />;
              })
            : null}
          <CleoBust x={250} y={1380} s={1.05} f={f} lit={0.4} flip={false} />
        </AbsoluteFill>
        {after ? (
          <div style={{ position: "absolute", left: 540, top: 860, transform: `translate(-50%, -50%) rotate(-10deg) scale(${2.2 - 1.2 * Math.min(1, spring({ frame: f - tNi, fps, config: { damping: 11, stiffness: 260 } }))})`, border: `14px solid ${C.red}`, borderRadius: 28, padding: "10px 46px 18px", color: C.red, fontFamily: PF, fontWeight: 800, fontSize: 140, letterSpacing: "0.02em", background: "rgba(20,10,14,0.55)", boxShadow: `0 0 40px rgba(229,72,77,0.5)` }}>NI CERCA</div>
        ) : null}
        <Label text="ILUSTRACIÓN" x={72} y={1760} />
      </>
    );
  };

  const MARKS: Mark[] = [
    { year: -2560, label: "Gran Pirámide", kind: "pyr" },
    { year: -69, label: "Cleopatra", kind: "cleo" },
    { year: 1969, label: "La Luna", kind: "luna" },
    { year: 2026, label: "Este video", kind: "hoy" },
  ];

  const renderScene = (id: SceneId): React.ReactNode => {
    switch (id) {
      case "hook":
        return renderHook();
      case "piramide": {
        const build = ln(f, S.piramide, t4500 + 4, 0.15, 1, eio);
        return (
          <>
            <Desert f={f} build={build} glow={decay(f, t4500 + 4, 10)} />
            {build < 1
              ? [0, 1, 2].map((i) => {
                  const ph = ((f + i * 10) % 30) / 30;
                  return <div key={i} style={{ position: "absolute", left: 250 + 240 * ph, top: 1310 - 190 * ph, width: 46, height: 34, background: "#E9A65C", border: "3px solid #7A4524", borderRadius: 4, transform: "rotate(-30deg)" }} />;
                })
              : null}
            {f >= t4500 ? <Pill x={540} y={680} text="hace 4.500 años" s={pop(f, t4500, fps) * (1 + 0.03 * Math.sin(f * 0.4))} size={84} rot={2 * Math.sin(f * 0.15)} /> : null}
            <Sparks f={f} at={t4500 + 4} x={560} y={1000} n={20} color={SAND} spread={420} />
            <Label text="GUIZA, EGIPTO · ILUSTRACIÓN" x={72} y={1760} />
          </>
        );
      }
      case "nace": {
        const w = ln(f, S.nace, t2500 + 6, 0, 1, eio);
        const yr = -2560 + 2491 * w;
        return (
          <>
            <Timeline f={f} marks={MARKS} show={[1, f >= t2500 ? pop(f, t2500, fps) : 0, 0, 0]} dot={yr} grow={0.62} braces={[{ a: -2560, b: -69, text: "≈ 2.500 años", color: SAND, p: ln(f, S.nace + 2, t2500 + 4) }]} />
            {f < t2500 ? <Pill x={760} y={TY(yr)} text={yearTxt(Math.round(yr / 10) * 10)} s={1 + 0.03 * Math.sin(f * 0.5)} size={64} dark /> : null}
          </>
        );
      }
      case "ella": {
        const old = ln(f, tAnt - 4, tAnt + 10);
        return (
          <>
            <Desert f={f} night={1} old={old} pyr={{ x: 640, y: 1330, w: 560 }} />
            <CleoBust x={250} y={1360} s={1.25} f={f} lit={0.7} flip={false} />
            {f >= tAnt ? <Pill x={640} y={720} text="ya eran antiguas" s={pop(f, tAnt, fps)} size={70} rot={-2 + 2 * Math.sin(f * 0.18)} /> : null}
            <Dust f={f} x0={400} x1={1000} y0={800} y1={1400} n={30} color="#E7D8FF" />
            <Label text="SILUETA ILUSTRADA" x={72} y={1760} />
          </>
        );
      }
      case "cesar": {
        const p1 = ln(f, S.cesar + 2, S.cesar + 18);
        const p2 = ln(f, tJulio + 2, W(iNos) + 6);
        const barW = 560;
        return (
          <>
            <Studio f={f} tint="#2A2238" />
            {/* arriba: para Cleopatra, la pirámide ya tenía ≈ 2.500 años */}
            <div style={{ position: "absolute", left: 40, top: 560, width: 1000, height: 470, borderRadius: 40, background: "linear-gradient(180deg, rgba(80,40,30,0.55), rgba(16,13,20,0.85))", boxShadow: "0 20px 40px rgba(0,0,0,0.45)" }}>
              <div style={{ position: "absolute", left: 34, top: 26, fontFamily: PF, fontWeight: 800, fontSize: 36, letterSpacing: "0.1em", color: C.gold }}>PARA CLEOPATRA</div>
            </div>
            <Pyramid x={250} y={960} w={340} />
            <CleoBust x={860} y={840} s={0.82} f={f} lit={0.6} flip />
            <div style={{ position: "absolute", left: 260, top: 990, width: barW * p1, height: 24, borderRadius: 12, background: SAND, boxShadow: `0 0 18px ${SAND}` }} />
            {p1 > 0.5 ? <Pill x={560} y={700} text="≈ 2.500 años" s={Math.min(1, (p1 - 0.5) * 3)} size={60} /> : null}
            {/* abajo: para nosotros, César tiene ≈ 2.070 años */}
            <div style={{ position: "absolute", left: 40, top: 1070, width: 1000, height: 470, borderRadius: 40, background: "linear-gradient(180deg, rgba(40,40,80,0.55), rgba(16,13,20,0.85))", boxShadow: "0 20px 40px rgba(0,0,0,0.45)" }}>
              <div style={{ position: "absolute", left: 34, top: 26, fontFamily: PF, fontWeight: 800, fontSize: 36, letterSpacing: "0.1em", color: SKY }}>PARA NOSOTROS</div>
            </div>
            {f >= tJulio - 2 ? <CaesarBust x={230} y={1340} s={0.82 * pop(f, tJulio - 2, fps)} f={f} /> : null}
            <DarkPhone x={880} y={1330} s={0.36} f={f}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2A2238, #120E18)" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 120, color: C.green }}>HOY</div>
              </div>
            </DarkPhone>
            <div style={{ position: "absolute", left: 260, top: 1500, width: barW * (2070 / 2500) * p2, height: 24, borderRadius: 12, background: C.gold, boxShadow: `0 0 18px ${C.gold}` }} />
            {p2 > 0.5 ? <Pill x={560} y={1210} text="≈ 2.070 años" s={Math.min(1, (p2 - 0.5) * 3)} size={60} /> : null}
            <Sparks f={f} at={tJulio} x={230} y={1250} n={14} color={C.gold} spread={200} />
          </>
        );
      }
      case "despegue": {
        const launch = ln(f, t1969 + 2, endOf("despegue") + 8, 0, 1);
        return (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1030 0%, #2A3A6A 60%, #E07A44 100%)" }} />
            <Stars f={f} n={50} h={1000} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <rect x={640} y={700} width={40} height={700} fill="#2A2238" />
              {Array.from({ length: 10 }, (_, i) => (
                <line key={i} x1={640} y1={720 + i * 70} x2={680} y2={760 + i * 70} stroke="#3E3450" strokeWidth={6} />
              ))}
              <path d="M-60 1460 C300 1430 700 1480 1140 1440 L1140 1920 L-60 1920 Z" fill="#1A1424" />
            </svg>
            <Rocket x={520} y={1180} s={1.25} f={f} launch={launch} smoke={ln(f, S.despegue, t1969 + 8)} />
            {f >= t1969 ? <Pill x={540} y={700} text="1969" s={pop(f, t1969, fps) * (1 + 0.12 * bump(f, t1969))} size={120} rot={2 * Math.sin(f * 0.15)} /> : null}
            <Sparks f={f} at={t1969 + 2} x={520} y={1400} n={22} color="#FFB347" spread={380} />
            <Label text="ILUSTRACIÓN" x={72} y={1760} />
          </>
        );
      }
      case "luna":
        return (
          <>
            <MoonScene f={f} plant={ln(f, tLuna - 8, tLuna + 8, 0, 1, eo)} />
            <Sparks f={f} at={tLuna + 6} x={380} y={1330} n={16} color="#FFFFFF" spread={260} />
            <Label text="APOLO 11 · ILUSTRACIÓN" x={72} y={1760} />
          </>
        );
      case "linea":
        return (
          <>
            <Timeline
              f={f}
              marks={MARKS}
              show={[1, 1, pop(f, S.linea + 2, fps), 0]}
              grow={ln(f, S.linea, S.linea + 10, 0.62, 1, eo)}
              braces={[
                { a: -2560, b: -69, text: "≈ 2.500 años", color: C.red, p: 1 },
                { a: -69, b: 1969, text: "≈ 2.000 años", color: C.green, p: ln(f, t2000 - 6, t2000 + 8) },
              ]}
            />
            <Sparks f={f} at={t2000 + 4} x={640} y={TY(950)} n={20} color={C.green} spread={360} />
          </>
        );
      case "video":
        return (
          <>
            <Timeline
              f={f}
              marks={MARKS}
              show={[1, 1, 1 - ln(f, tVideo - 6, tVideo), f >= tVideo - 2 ? pop(f, tVideo - 2, fps) : 0]}
              braces={[
                { a: -2560, b: -69, text: "≈ 2.500 años", color: C.red, p: 1 },
                { a: -69, b: f >= tVideo - 2 ? 2026 : 1969, text: f >= tVideo - 2 ? "≈ 2.095 años" : "≈ 2.000 años", color: C.green, p: 1 },
              ]}
            />
            <Sparks f={f} at={tVideo} x={AX} y={TY(2026)} n={22} color={C.green} spread={380} />
            {f >= tPirFin ? <Pill x={540} y={530} text="más cerca de vos 🤯" s={pop(f, tPirFin, fps)} size={64} rot={2 * Math.sin(f * 0.18)} /> : null}
          </>
        );
      case "cta":
        return (
          <>
            <Studio f={f} tint="#3A2030" />
            <BigName text="Seguime" f={f} at={S.cta} fps={fps} y={520} size={150} />
            <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%, -50%) scale(${pop(f, tBtn, fps) * (1 + 0.06 * Math.sin(f * 0.4))})`, padding: "18px 80px 24px", borderRadius: 26, background: C.orange, color: C.white, fontFamily: PF, fontWeight: 800, fontSize: 64, boxShadow: `0 10px 0 rgba(0,0,0,0.4), 0 0 ${40 + 30 * Math.sin(f * 0.4)}px rgba(255,106,43,0.6)` }}>Seguir</div>
            <Tap x={600} y={830} f={f} from={tBtn + 8} />
            {f >= W(iCabeza) - 6 ? (
              <div style={{ position: "absolute", left: 540, top: 1060, transform: `translate(-50%, -50%) scale(${pop(f, W(iCabeza) - 6, fps)}) rotate(${1.2 * Math.sin(f * 0.15)}deg)`, width: 820, borderRadius: 28, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, padding: "26px 0 30px", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 28, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>MÁS DATOS ASÍ</div>
                <div style={{ fontFamily: PF, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.15 }}>
                  que te <span style={{ color: C.gold }}>rompen la cabeza</span>
                </div>
              </div>
            ) : null}
            <Pyramid x={300} y={1520} w={260} />
            <Rocket x={800} y={1360} s={0.55} f={f} smoke={0.3} />
            <CleoBust x={540} y={1470} s={0.62} f={f} lit={1} />
            <Sparks f={f} at={tBtn} x={540} y={800} n={22} color={C.orange} spread={360} />
          </>
        );
    }
  };

  // ---- cámara viva (sin zoom por palabra) ----
  const impacts = [v === 1 ? tTimer + 60 : -99, v === 4 ? W(hk.ni) : -99, v === 2 ? W(hk.luna) : v === 5 ? W(hk.vos) : -99, v === 3 ? W(hk.cohete) : -99, t4500 + 4, t2500, tAnt, tJulio, t1969, tLuna, t2000, tVideo, tBtn];
  const shake = impacts.reduce((a, at) => a + decay(f, at, 3), 0);
  const prog = ln(f, sceneStart, sceneEnd, 0, 1, eio);
  const rumble = si > 0 && scenes[si][0] === "despegue" ? ln(f, t1969, t1969 + 10) : 0;
  const camX = 9 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.1) + shake * 10 * Math.sin(f * 2.7) + rumble * 5 * Math.sin(f * 3.9);
  const camY = 7 * Math.sin(t * 1.05 + 1) + shake * 8 * Math.cos(f * 3.3) + rumble * 4 * Math.cos(f * 4.3);
  const camR = 0.6 * Math.sin(t * 0.9) + shake * 0.6 * Math.sin(f * 2.1);
  const camS = 1 + 0.1 * prog;

  const TR = 9;
  const local = f - sceneStart;
  const inTr = si > 0 && local < TR;
  const kind = si % 3;
  const p = inTr ? eo(local / TR) : 1;
  const sceneNow = renderScene(scenes[si][0]);
  const scenePrev = inTr ? renderScene(scenes[si - 1][0]) : null;
  const dir = si % 2 ? 1 : -1;
  const trNow: React.CSSProperties = !inTr ? {} : kind === 0 ? { transform: `translateX(${dir * 1100 * (1 - p)}px)`, filter: `blur(${18 * (1 - p)}px)` } : kind === 1 ? { transform: `scale(${1.6 - 0.6 * p})`, opacity: p, filter: `blur(${14 * (1 - p)}px)` } : { opacity: p };
  const trPrev: React.CSSProperties = kind === 0 ? { transform: `translateX(${-dir * 1100 * p}px)`, filter: `blur(${18 * p}px)` } : kind === 1 ? { transform: `scale(${1 + 0.4 * p})`, opacity: 1 - p } : { opacity: 1 - p };
  const flash = inTr && kind === 2 ? 1 - p : 0;

  const hideCaps = f >= S.cta;
  const transitionAts = scenes.slice(1).map(([, s]) => s);
  const popAts = [t4500, t2500, tAnt, tJulio - 2, t1969, W(iCabeza) - 6, tPirFin, ...(v === 1 ? [W(hk.pir), W(hk.luna), W(hk.seg)] : []), ...(v === 2 ? [W(hk.luna)] : []), ...(v === 3 ? [W(hk.reina) - 2, W(hk.cohete)] : []), ...(v === 5 ? [W(hk.vos)] : [])];

  return (
    <AbsoluteFill style={{ background: "#0E0B12", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "540px 1000px", transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${camS})` }}>
        {scenePrev ? <AbsoluteFill style={trPrev}>{scenePrev}</AbsoluteFill> : null}
        <AbsoluteFill style={trNow}>{sceneNow}</AbsoluteFill>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFF6E6", opacity: flash * 0.85 }} /> : null}
      <Vignette />
      <Grain f={f} />
      {hideCaps ? null : <Subs words={words} f={f} fps={fps} />}

      <Audio src={staticFile(`audio/voz_cleopatra_${v}.wav`)} />
      <Audio src={staticFile(`audio/musica_cleopatra_${v}.wav`)} volume={0.22} />

      {transitionAts.map((at) => (
        <Snd key={`w${at}`} at={at - 3} src="sfx/whoosh.wav" vol={0.35} />
      ))}
      {popAts.map((at) => (
        <Snd key={`p${at}`} at={at} src="sfx/pop.wav" vol={0.4} />
      ))}
      {v === 1 ? (
        <>
          {[0, 15, 30, 45].map((k) => (
            <Snd key={k} at={tTimer + k} src="sfx/click.wav" vol={0.45} />
          ))}
          <Snd at={tTimer + 60} src={SOUND.impacto} vol={0.6} />
        </>
      ) : null}
      {v === 2 ? <Snd at={W(hk.luna)} src={SOUND.impacto} vol={0.6} /> : null}
      {v === 3 ? <Snd at={W(hk.cohete)} src={SOUND.impacto} vol={0.6} /> : null}
      {v === 4 ? (
        <>
          <Snd at={W(hk.ni) - 2} src="sfx/rebobinar.wav" vol={0.5} />
          <Snd at={W(hk.ni)} src={SOUND.impacto} vol={0.8} />
        </>
      ) : null}
      {v === 5 ? <Snd at={W(hk.vos)} src={SOUND.impacto} vol={0.6} /> : null}
      <Snd at={t4500 + 4} src={SOUND.impacto} vol={0.55} />
      <Snd at={S.nace + 2} src={SOUND.tiron} vol={0.4} />
      <Snd at={t2500} src="sfx/hit.wav" vol={0.45} />
      <Snd at={tAnt} src={SOUND.tension} vol={0.25} />
      <Snd at={tJulio} src="sfx/hit.wav" vol={0.45} />
      <Snd at={t1969} src="sfx/boom.wav" vol={0.35} />
      <Snd at={t1969 + 2} src={SOUND.impacto} vol={0.5} />
      <Snd at={tLuna} src="sfx/hit.wav" vol={0.5} />
      <Snd at={t2000} src={SOUND.tiron} vol={0.45} />
      <Snd at={tVideo} src={SOUND.impacto} vol={0.7} />
      <Snd at={tVideo} src="sfx/cristal.wav" vol={0.35} />
      <Snd at={tBtn} src="sfx/pop.wav" vol={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Snd key={`c${i}`} at={tBtn + 8 + i * 24 + 4} src="sfx/click.wav" vol={0.3} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const CleopatraPortada: React.FC<{ v?: number }> = ({ v = 1 }) => {
  const lines: Record<number, string[]> = {
    1: ["¿Más cerca de", "las pirámides", "o de la Luna?"],
    2: ["Cleopatra", "vivió más cerca", "de la Luna"],
    3: ["Más cerca de", "este cohete", "que de la pirámide"],
    4: ["¿Vio construir", "las pirámides?", "Ni cerca"],
    5: ["Cleopatra está", "más cerca de vos", "que de las pirámides"],
  };
  const L = lines[v];
  return (
    <AbsoluteFill style={{ background: "#0E0B12" }}>
      <AbsoluteFill style={{ clipPath: "polygon(0 0, 58% 0, 42% 100%, 0 100%)" }}>
        <Desert f={30} pyr={{ x: 300, y: 1330, w: 560 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: "polygon(58% 0, 100% 0, 100% 100%, 42% 100%)" }}>
        <MoonScene f={30} plant={0} astro={false} />
        <Rocket x={850} y={1120} s={0.9} f={30} smoke={0.5} />
      </AbsoluteFill>
      <CleoBust x={540} y={1330} s={1.05} f={0} lit={0.8} />
      <Vignette />
      <div style={{ position: "absolute", left: 50, width: 980, top: 260, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 96, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.white, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>
        {L.map((l, k) =>
          k === L.length - 1 ? (
            <div key={k} style={{ display: "inline-block", marginTop: 14, padding: "4px 36px 14px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 12px 0 rgba(0,0,0,0.45)" }}>
              {l}
            </div>
          ) : (
            <div key={k}>{l}</div>
          ),
        )}
      </div>
      <Grain f={0} />
    </AbsoluteFill>
  );
};
