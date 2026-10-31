import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-servilleta-1.json";
import c2 from "../../data/captions-servilleta-2.json";
import c3 from "../../data/captions-servilleta-3.json";
import { Snd, timing } from "../reelkit";
import { SOUND } from "../system";
import { Hero, Shop } from "./Medialuna";

// «La servilleta de Messi» — dato curioso de Hook House para negocios locales (2026-10-31), en el estilo de animación de
// las referencias del usuario (escenas ilustradas a pantalla completa: fondos oscuros o atardecer con degradés y luz,
// siluetas y personajes planos, profundidad, subtítulos redondeados con la palabra actual en blanco, cifras en pastillas
// y tarjetas). Sin Hookie y sin el sistema ALTERA. 3 variantes de gancho con el mismo cuerpo:
// 1 precio primero · 2 reto («adiviná qué jugador… tenés dos segundos») · 3 nicho («si tenés un negocio y no subís videos…»).
// Dato: el 14/12/2000 Carles Rexach (director deportivo del Barcelona) escribió en una servilleta el acuerdo para fichar a
// Messi (13 años); Bonhams la subastó en mayo de 2024 por £762.400 (≈ US$ 965.000). La servilleta y las personas son
// ilustraciones genéricas: no reproducen el texto real ni la cara de nadie.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";

const CAPS: Caption[][] = [c1, c2, c3];
const C = {
  ink: "#15111C",
  white: "#FFFFFF",
  cream: "#FBF5EA",
  gold: "#F7B955",
  orange: "#FF6A2B",
  red: "#E5484D",
  grey: "rgba(214,206,226,0.55)",
};

// ---------- utilidades ----------
const ln = (f: number, a: number, b: number, from = 0, to = 1, ease?: (x: number) => number) => (b <= a ? (f >= b ? to : from) : interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
const eo = Easing.out(Easing.cubic);
const eio = Easing.inOut(Easing.cubic);
const pop = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 12, stiffness: 220 } });
const drop = (f: number, at: number, fps: number) => Math.min(1, spring({ frame: f - at, fps, config: { damping: 14, stiffness: 240, mass: 1.2 } }));
const bump = (f: number, at: number) => (f < at ? 0 : Math.exp(-(f - at) / 5) * Math.cos((f - at) * 0.75));

const makeTimes = (v: number) => {
  const T = timing(CAPS[v - 1]);
  const { W: W0, E: E0, idx } = T;
  let splitAt = 99999;
  let gap = 0;
  let tStart = -1;
  if (v === 2) {
    const iSeg = idx("segundos");
    const iLio = idx("lionel", iSeg);
    tStart = W0(idx("tenés"));
    splitAt = iLio;
    gap = Math.max(0, tStart + 60 + 4 - W0(iLio));
  }
  const W = (i: number) => W0(i) + (i >= splitAt ? gap : 0);
  const E = (i: number) => E0(i) + (i >= splitAt ? gap : 0);
  const cut = splitAt < 99999 ? W0(splitAt) - 2 : 0;
  return { T, W, E, idx, gap, cut, tStart, frames: T.frames + gap };
};
export const servilletaFrames = (v: number) => makeTimes(v).frames;

// ---------- textura y luz ----------
const Grain: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.18, pointerEvents: "none" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={1080} height={1920} filter="url(#grain)" />
  </svg>
);
const Vignette: React.FC<{ k?: number }> = ({ k = 0.55 }) => <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${k}) 100%)`, pointerEvents: "none" }} />;
const Bokeh: React.FC<{ f: number; color: string; n?: number; seed?: number; top?: number; h?: number }> = ({ f, color, n = 14, seed = 1, top = 0, h = 1300 }) => (
  <>
    {Array.from({ length: n }, (_, k) => {
      const r = 30 + ((k * 37 + seed * 11) % 70);
      const x = ((k * 263 + seed * 97) % 1180) - 50 + 18 * Math.sin(f * 0.012 + k);
      const y = top + ((k * 151 + seed * 53) % h) - ((f * (0.2 + (k % 3) * 0.15)) % 80);
      const o = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(f * 0.04 + k * 1.7));
      return <div key={k} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: color, opacity: o, filter: "blur(6px)" }} />;
    })}
  </>
);
const Stars: React.FC<{ f: number; n?: number; h?: number }> = ({ f, n = 70, h = 1100 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: n }, (_, k) => {
      const x = (k * 197) % 1080;
      const y = (k * 113) % h;
      const o = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(f * 0.08 + k * 2.3));
      return <circle key={k} cx={x} cy={y} r={k % 7 === 0 ? 3 : 1.8} fill="#FFFFFF" opacity={o} />;
    })}
  </svg>
);

// ---------- piezas de texto (pastilla y tarjeta, como en las referencias) ----------
const Pill: React.FC<{ x: number; y: number; text: string; s?: number; size?: number; dark?: boolean; rot?: number }> = ({ x, y, text, s = 1, size = 76, dark = false, rot = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${rot}deg)`, whiteSpace: "nowrap" }}>
    <div style={{ padding: `${size * 0.16}px ${size * 0.5}px ${size * 0.22}px`, borderRadius: 999, background: dark ? C.ink : C.cream, color: dark ? C.white : C.ink, fontFamily: PF, fontWeight: 800, fontSize: size, letterSpacing: "-0.01em", boxShadow: `0 ${size * 0.12}px 0 rgba(0,0,0,0.45), 0 ${size * 0.3}px ${size * 0.6}px rgba(0,0,0,0.35)` }}>{text}</div>
  </div>
);
const PriceCard: React.FC<{ x: number; y: number; label: string; value: string; s?: number; shake?: number; note?: string }> = ({ x, y, label, value, s = 1, shake = 0, note }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) translateX(${shake}px)`, width: 860 }}>
    <div style={{ borderRadius: 30, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, boxShadow: "0 30px 60px rgba(0,0,0,0.5)", padding: "26px 0 30px", textAlign: "center" }}>
      <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 30, letterSpacing: "0.22em", color: "rgba(255,255,255,0.6)" }}>{label}</div>
      <div style={{ fontFamily: PF, fontWeight: 800, fontSize: 118, letterSpacing: "-0.02em", color: C.white, fontVariantNumeric: "tabular-nums", lineHeight: 1.08 }}>{value}</div>
      {note ? <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 24, letterSpacing: "0.12em", color: "rgba(255,255,255,0.45)" }}>{note}</div> : null}
    </div>
  </div>
);
const Label: React.FC<{ text: string; x?: number; y?: number }> = ({ text, x = 72, y = 1500 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: PF, fontWeight: 600, fontSize: 24, letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)" }}>{text}</div>
);

// ---------- subtítulos: anteriores en gris, la que suena en blanco; cifras en pastilla ----------
const Subs: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number }> = ({ words, f, fps }) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at) cur = i;
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
    <div style={{ position: "absolute", top: 270, left: 60, width: 880, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 78, lineHeight: 1.22, letterSpacing: "-0.01em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const d = spring({ frame: f - words[i].at, fps, config: { damping: 14, stiffness: 260 } });
        const now = i === cur;
        const txt = words[i].text.replace(/[,:…]+$/, "").replace(/\.$/, "").replace(/"/g, "");
        const num = /\d/.test(txt);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 9px", opacity: Math.min(1, d * 1.5), transform: `translateY(${(1 - d) * 22}px) scale(${0.92 + 0.08 * d})` }}>
            {num && now ? (
              <span style={{ display: "inline-block", padding: "0 22px 6px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 8px 0 rgba(0,0,0,0.45)" }}>{txt}</span>
            ) : (
              <span style={{ color: now ? C.white : C.grey, textShadow: now ? "0 0 26px rgba(255,255,255,0.35), 0 4px 14px rgba(0,0,0,0.6)" : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ---------- la servilleta (recreación) ----------
const LINES = [
  "M70 120 C110 104 150 132 190 118 C230 104 270 128 310 116 C350 104 390 126 430 114",
  "M70 168 C120 150 160 182 210 166 C260 150 300 178 350 164 C380 156 410 172 440 162",
  "M70 216 C100 202 140 228 180 214 C220 200 260 226 300 212",
  "M70 264 C120 248 170 278 220 262 C270 246 320 274 370 260 C400 252 420 266 440 258",
  "M70 312 C110 298 150 322 200 308 C240 296 280 318 320 306",
];
const SIGS = ["M80 420 c20 -40 40 30 60 -10 s30 -30 50 10", "M220 424 c10 -30 30 -10 40 -30 c10 20 30 30 60 0", "M350 418 c20 -20 30 20 50 -6 s20 -10 40 6"];
const NTOT = LINES.length + SIGS.length;
const Napkin: React.FC<{ x: number; y: number; s?: number; write?: number; glow?: number; blur?: number; rot?: number }> = ({ x, y, s = 1, write = 1, glow = 0, blur = 0, rot = 0 }) => {
  const inkCol = glow > 0 ? `rgb(${Math.round(42 + 205 * glow)},${Math.round(58 + 127 * glow)},${Math.round(106 - 21 * glow)})` : "#2A3A6A";
  return (
    <div style={{ position: "absolute", left: x - 260, top: y - 260, width: 520, height: 520, transform: `scale(${s}) rotate(${rot}deg)`, filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.45))" }}>
      <svg width={520} height={520} viewBox="0 0 520 520" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="nap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF8EC" />
            <stop offset="100%" stopColor="#E9DCC6" />
          </linearGradient>
        </defs>
        <path d="M14 18 Q130 8 260 14 T506 16 Q514 140 508 260 T512 504 Q390 512 260 506 T16 508 Q8 380 12 260 T14 18 Z" fill="url(#nap)" />
        <path d="M40 44 L480 44 L480 476 L40 476 Z" fill="none" stroke="#D9CBB2" strokeWidth={3} strokeDasharray="6 8" />
        <path d="M506 16 L506 96 L428 18 Z" fill="#DCCDB3" />
        <g style={{ filter: blur > 0 ? `blur(${blur * 12}px)` : glow > 0 ? `drop-shadow(0 0 ${10 * glow}px rgba(247,185,85,0.9))` : undefined }}>
          {[...LINES, ...SIGS].map((d, k) => {
            const p = Math.max(0, Math.min(1, write * NTOT - k));
            return <path key={k} d={d} fill="none" stroke={inkCol} strokeWidth={k >= LINES.length ? 6 : 5} strokeLinecap="round" strokeDasharray={`${p * 520} 520`} />;
          })}
        </g>
      </svg>
    </div>
  );
};
const penTip = (write: number) => {
  const k = Math.min(NTOT - 1, Math.floor(write * NTOT));
  const fr = (write * NTOT) % 1;
  if (k < LINES.length) return { x: 70 + 370 * fr, y: 120 + k * 48 };
  return { x: 80 + (k - LINES.length) * 135 + 90 * fr, y: 420 };
};

// ---------- escenarios ----------
// Restaurante de noche: lámpara que cuelga, luz cálida, mesa de madera
const Restaurant: React.FC<{ f: number; lamp?: number }> = ({ f, lamp = 1 }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1A1220 0%, #33202E 45%, #2A1A1E 100%)" }} />
    <Bokeh f={f} color="#FFB86B" seed={3} />
    {/* ventana con la ciudad de fondo */}
    <div style={{ position: "absolute", left: 640, top: 520, width: 340, height: 520, borderRadius: 18, background: "linear-gradient(180deg, #1C2A52, #3A3260)", border: "10px solid #120C14", overflow: "hidden", opacity: 0.85 }}>
      {Array.from({ length: 12 }, (_, k) => (
        <div key={k} style={{ position: "absolute", left: (k * 61) % 320, bottom: 0, width: 40 + (k % 3) * 20, height: 120 + ((k * 53) % 220), background: "#0D1226" }}>
          {Array.from({ length: 6 }, (_, j) => (
            <div key={j} style={{ position: "absolute", left: 8 + (j % 2) * 16, top: 12 + Math.floor(j / 2) * 26, width: 8, height: 10, background: "#FFD58A", opacity: (k + j + Math.floor(f / 40)) % 3 === 0 ? 0.9 : 0.25 }} />
          ))}
        </div>
      ))}
    </div>
    {/* lámpara */}
    <div style={{ position: "absolute", left: 538, top: 0, width: 4, height: 560, background: "#0E0A10" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD9A0" stopOpacity={0.35 * lamp} />
          <stop offset="100%" stopColor="#FFD9A0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d="M470 600 L610 600 L1000 1500 L80 1500 Z" fill="url(#cone)" />
      <path d="M450 600 Q540 520 630 600 Z" fill="#1E1418" stroke="#3A2A2A" strokeWidth={4} />
      <ellipse cx={540} cy={604} rx={40} ry={12} fill="#FFE2B0" opacity={0.9 * lamp + 0.05 * Math.sin(f * 0.3)} />
    </svg>
    {/* mesa */}
    <div style={{ position: "absolute", left: -40, right: -40, top: 1180, bottom: -40, background: "linear-gradient(180deg, #7A4A2A 0%, #4E2E19 40%, #2C1A0F 100%)" }} />
    <div style={{ position: "absolute", left: -40, right: -40, top: 1176, height: 10, background: "#A26A3E", opacity: 0.8 }} />
    <svg width={1080} height={800} style={{ position: "absolute", left: 0, top: 1180, opacity: 0.25 }}>
      {Array.from({ length: 9 }, (_, k) => (
        <path key={k} d={`M0 ${40 + k * 80} C300 ${20 + k * 80} 700 ${70 + k * 80} 1080 ${40 + k * 80}`} stroke="#2A160A" strokeWidth={4} fill="none" />
      ))}
    </svg>
    <div style={{ position: "absolute", left: 140, top: 1150, width: 800, height: 260, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,210,150,0.45) 0%, rgba(255,210,150,0) 70%)" }} />
  </>
);

// Ciudad de noche (Barcelona genérica, sin monumentos reconocibles)
const City: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0B1230 0%, #1C2752 55%, #3B3466 100%)" }} />
    <Stars f={f} />
    <div style={{ position: "absolute", left: 700, top: 560 - 30 * k, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, #FFF7E3 0%, #F2E7C9 60%, rgba(242,231,201,0) 72%)", boxShadow: "0 0 120px rgba(255,240,200,0.35)" }} />
    {[0, 1, 2].map((layer) => (
      <div key={layer} style={{ position: "absolute", left: -60 - layer * 40 + k * (10 + layer * 25), bottom: 380 - layer * 140, width: 1300, height: 700 }}>
        {Array.from({ length: 16 }, (_, b) => {
          const w = 70 + ((b * 37 + layer * 11) % 60);
          const h = 180 + ((b * 97 + layer * 29) % 320) + layer * 60;
          return (
            <div key={b} style={{ position: "absolute", left: b * 82, bottom: 0, width: w, height: h, background: ["#1A2148", "#121839", "#0B0F27"][layer] }}>
              {Array.from({ length: 10 }, (_, j) => (
                <div key={j} style={{ position: "absolute", left: 10 + (j % 3) * 20, top: 16 + Math.floor(j / 3) * 34, width: 10, height: 14, background: "#FFD58A", opacity: (b + j + layer + Math.floor(f / 30)) % 4 === 0 ? 0.85 : 0.12 }} />
              ))}
            </div>
          );
        })}
      </div>
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 400, background: "#070A1A" }} />
  </>
);

// Atardecer en un potrero: sol, lomas y un chico (silueta genérica) haciendo jueguitos
const Field: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const ph = (f % 20) / 20;
  const ballY = 4 * ph * (1 - ph);
  const knee = ph < 0.15 ? 1 - ph / 0.15 : 0;
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #3E2140 0%, #A8473F 38%, #F09A55 60%, #F7C27A 72%, #6E3A35 73%, #3A1E28 100%)" }} />
      <div style={{ position: "absolute", left: 360 - 20 * k, top: 1040, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, #FFF2C8 0%, #FFD98A 55%, rgba(255,217,138,0) 72%)", filter: "blur(2px)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M-40 1290 C200 ${1250 + 10 * k} 420 1300 640 1270 C820 1245 960 1280 1120 1265 L1120 1920 L-40 1920 Z`} fill="#5A2C30" />
        <path d="M-40 1380 C260 1340 560 1400 1120 1350 L1120 1920 L-40 1920 Z" fill="#2E1620" />
        {/* arco de fútbol a lo lejos */}
        <path d="M800 1268 L800 1200 L960 1200 L960 1268" stroke="#2A1420" strokeWidth={8} fill="none" />
        {/* chico */}
        <g transform="translate(470 1385) scale(1.55)">
          <ellipse cx={0} cy={6} rx={90} ry={12} fill="#000" opacity={0.35} />
          <path d="M-22 -150 L-30 -10 L-8 -10 L-2 -120 L6 -120 L16 -10 L36 -10 L26 -150 Z" fill="#1A0D14" />
          <g transform={`rotate(${-35 * knee} 18 -120)`}>
            <path d="M10 -125 L60 -60 L70 -70 L24 -130 Z" fill="#1A0D14" />
          </g>
          <path d="M-36 -290 Q0 -310 36 -290 L40 -150 L-40 -150 Z" fill="#1A0D14" />
          <path d="M-36 -280 L-70 -200 L-60 -194 L-30 -260 Z" fill="#1A0D14" />
          <path d="M36 -280 L74 -210 L64 -204 L30 -260 Z" fill="#1A0D14" />
          <circle cx={0} cy={-330} r={38} fill="#1A0D14" />
          <circle cx={58} cy={-74 - ballY * 260} r={24} fill="#1A0D14" />
        </g>
      </svg>
    </>
  );
};

// Sala de subastas: foco cenital, atril con la servilleta, siluetas que levantan la paleta
const Auction: React.FC<{ f: number; from: number }> = ({ f, from }) => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #120E18 0%, #241A2C 60%, #120E14 100%)" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0D0" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#FFF0D0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d="M500 0 L580 0 L860 1300 L220 1300 Z" fill="url(#spot)" />
      <rect x={380} y={1240} width={320} height={300} rx={14} fill="#3A2730" />
      <rect x={360} y={1220} width={360} height={40} rx={10} fill="#4E3440" />
      {Array.from({ length: 9 }, (_, k) => {
        const x = 40 + k * 125;
        const up = Math.max(0, Math.sin((f - from) * 0.12 + k * 1.3)) > 0.7 ? 1 : 0;
        return (
          <g key={k} transform={`translate(${x} ${1600 + (k % 2) * 60})`}>
            <circle cx={0} cy={-120} r={46} fill="#0A070C" />
            <path d="M-70 0 Q-70 -80 0 -80 Q70 -80 70 0 Z" fill="#0A070C" />
            {up ? (
              <g>
                <rect x={40} y={-200} width={8} height={110} fill="#0A070C" />
                <rect x={20} y={-250} width={50} height={60} rx={6} fill={C.cream} />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  </>
);

// Fondo neutro oscuro (lección y CTA)
const Studio: React.FC<{ f: number; tint?: string }> = ({ f, tint = "#2D1E3A" }) => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #120E1A 0%, ${tint} 60%, #120E16 100%)` }} />
    <Bokeh f={f} color="#B98CFF" seed={7} n={10} />
    <Bokeh f={f} color="#FFB86B" seed={2} n={6} top={700} />
  </>
);

// Hombre de traje (personaje plano genérico) detrás de la mesa
const Director: React.FC<{ f: number; pat: number; look?: number }> = ({ f, pat, look = 0 }) => {
  const bob = 4 * Math.sin(f * 0.15);
  const patY = pat > 0 ? 20 * Math.abs(Math.sin(f * 0.6)) : 0;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(0 ${bob})`}>
        <path d="M370 1190 Q370 930 540 910 Q710 930 710 1190 Z" fill="#2E3A5C" />
        <path d="M500 912 L540 1000 L580 912 Z" fill="#F4F1EA" />
        <path d="M530 930 L550 930 L560 1040 L540 1070 L520 1040 Z" fill="#D9573B" />
        <rect x={515} y={850} width={50} height={70} rx={14} fill="#E3A57E" />
        <circle cx={540} cy={790} r={92} fill="#E8B48C" />
        <path d="M448 780 Q450 690 540 690 Q632 690 634 770 Q600 735 540 740 Q480 742 448 780 Z" fill="#2B1F1A" />
        <ellipse cx={510 + 10 * look} cy={795} rx={9} ry={11} fill="#1E1620" />
        <ellipse cx={575 + 10 * look} cy={795} rx={9} ry={11} fill="#1E1620" />
        <path d="M495 768 Q510 760 525 768 M560 768 Q575 760 590 768" stroke="#2B1F1A" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d={pat > 0 ? "M520 840 Q540 832 560 840" : "M515 835 Q540 858 565 835"} stroke="#8A3B2E" strokeWidth={7} fill="none" strokeLinecap="round" />
        {/* brazos: apoyados o palpándose los bolsillos («no tenía contrato a mano») */}
        {pat > 0 ? (
          <>
            <path d={`M400 960 Q380 1060 470 ${1030 - patY}`} stroke="#2E3A5C" strokeWidth={46} fill="none" strokeLinecap="round" />
            <circle cx={470} cy={1030 - patY} r={26} fill="#E8B48C" />
            <path d={`M680 960 Q700 1060 610 ${1040 - patY * 0.6}`} stroke="#2E3A5C" strokeWidth={46} fill="none" strokeLinecap="round" />
            <circle cx={610} cy={1040 - patY * 0.6} r={26} fill="#E8B48C" />
          </>
        ) : (
          <>
            <path d="M400 960 Q370 1100 470 1170" stroke="#2E3A5C" strokeWidth={46} fill="none" strokeLinecap="round" />
            <circle cx={470} cy={1172} r={26} fill="#E8B48C" />
            <path d="M680 960 Q720 1080 610 1170" stroke="#2E3A5C" strokeWidth={46} fill="none" strokeLinecap="round" />
            <circle cx={610} cy={1172} r={26} fill="#E8B48C" />
          </>
        )}
      </g>
    </svg>
  );
};

// Cámara cara (ilustrada, con etiqueta de precio)
const ProCam: React.FC<{ x: number; y: number; s?: number; f: number; crossed?: number }> = ({ x, y, s = 1, f, crossed = 0 }) => (
  <div style={{ position: "absolute", left: x - 200, top: y - 150, width: 400, height: 300, transform: `scale(${s})`, filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.5))" }}>
    <svg width={400} height={300} viewBox="0 0 400 300" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="cb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3644" />
          <stop offset="100%" stopColor="#15121C" />
        </linearGradient>
        <radialGradient id="lens" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#6F86C8" />
          <stop offset="45%" stopColor="#1C2440" />
          <stop offset="100%" stopColor="#05060C" />
        </radialGradient>
      </defs>
      <rect x={110} y={40} width={110} height={50} rx={12} fill="url(#cb)" />
      <rect x={30} y={80} width={320} height={190} rx={30} fill="url(#cb)" />
      <circle cx={190} cy={175} r={86} fill="#0B0A10" stroke="#55506A" strokeWidth={8} />
      <circle cx={190} cy={175} r={60} fill="url(#lens)" />
      <circle cx={170} cy={152} r={14} fill="#FFFFFF" opacity={0.6} />
      <rect x={290} y={96} width={40} height={20} rx={6} fill={C.red} />
      <g transform={`translate(330 100) rotate(${16 * Math.sin(f * 0.12)})`}>
        <line x1={0} y1={0} x2={30} y2={80} stroke="#C9C2D6" strokeWidth={4} />
        <g transform="translate(30 80) rotate(-10)">
          <path d="M0 0 L96 0 L114 30 L96 60 L0 60 Z" fill={C.cream} />
          <text x={50} y={42} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={34} fill={C.ink}>
            $$$
          </text>
        </g>
      </g>
      {crossed > 0 ? (
        <g stroke={C.red} strokeWidth={22} strokeLinecap="round" opacity={Math.min(1, crossed * 3)}>
          <line x1={40} y1={40} x2={40 + 300 * Math.min(1, crossed * 2)} y2={40 + 230 * Math.min(1, crossed * 2)} />
          {crossed > 0.5 ? <line x1={340} y1={40} x2={340 - 300 * (crossed * 2 - 1)} y2={40 + 230 * (crossed * 2 - 1)} /> : null}
        </g>
      ) : null}
    </svg>
  </div>
);

// Celular oscuro (como en las referencias) con contenido de 452 × 826
const DarkPhone: React.FC<{ x: number; y: number; s: number; children: React.ReactNode; lift?: number }> = ({ x, y, s, children, lift = 0 }) => (
  <div style={{ position: "absolute", left: x - 250, top: y - 500 - lift, width: 500, height: 1000, transform: `scale(${s})`, borderRadius: 70, background: "linear-gradient(160deg, #3A3646, #1A1722)", padding: 14, boxSizing: "border-box", boxShadow: "0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 3px #4A4558" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 58, overflow: "hidden", background: "#0E0C12" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 452, height: 826, transform: "scale(1.04, 1.175)", transformOrigin: "0 0" }}>{children}</div>
      <div style={{ position: "absolute", left: "50%", top: 18, width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: "#000" }} />
      <div style={{ position: "absolute", left: 34, top: 22, fontFamily: PF, fontWeight: 600, fontSize: 26, color: "rgba(255,255,255,0.8)" }}>9:41</div>
    </div>
  </div>
);

export const Servilleta: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { T, W, E, idx, gap, cut, tStart, frames: END } = makeTimes(v);
  const words = T.words.map((w, i) => ({ text: w.text, at: W(i) }));

  // ---- índices ----
  const i14 = idx("14");
  const i2000 = idx("2000");
  const iDirector = idx("director");
  const iContrato = idx("contrato");
  const iEscribio = idx("escribió");
  const iServ = idx("servilleta", iEscribio);
  const i13 = idx("13");
  const iLionel = idx("lionel");
  const iSubasto = idx("subastó");
  const iDolares = v === 1 ? idx("dólares") : idx("dólares", iSubasto);
  const iPapel = idx("papel");
  const iNada = idx("nada", iPapel);
  const iEscrito = idx("escrito", iNada);
  const iPasa = idx("pasa", iEscrito);
  const iCamara = idx("cámara", iPasa);
  const iMostras = idx("mostrás");
  const iEditas = idx("editás");
  const iSeguime = idx("seguime");
  const iMejorar = idx("mejorar", iSeguime);

  const H = W(i14);
  const S_DIR = W(iDirector) - 2;
  const S_WRITE = W(iEscribio) - 2;
  const S_13 = W(i13 - 2);
  const S_NAME1 = v === 1 ? W(idx("lionel", i13) - 2) : 99999; // «Se llamaba Lionel Messi»
  const S_AUC = v === 1 ? 99999 : W(idx("2024")) - 4;
  const S_PAPEL = W(iPapel);
  const S_LESSON = W(iPasa - 2);
  const S_CTA = W(iSeguime);

  // ---- escena actual: la cámara siempre avanza y cada escena entra con un fundido corto ----
  const cuts = [0, H, S_DIR, S_WRITE, S_13, Math.min(S_NAME1, S_AUC), S_PAPEL, S_LESSON, S_CTA, END].filter((x, i, a) => x < 99999 && (i === 0 || x > a[i - 1]));
  let si = 0;
  while (si < cuts.length - 2 && f >= cuts[si + 1]) si++;
  const sceneStart = cuts[si];
  const sceneEnd = cuts[si + 1];
  const local = f - sceneStart;
  const push = 1 + 0.05 * ln(f, sceneStart, sceneEnd);
  const enter = si === 0 ? 1 : ln(local, 0, 8, 0, 1, eo);

  const sounds: React.ReactNode[] = [];
  let scene: React.ReactNode = null;

  if (f < H) {
    // ======================= GANCHOS =======================
    if (v === 1) {
      const iVendio = idx("vendió");
      const iPor = idx("por", iDolares);
      const slam = W(iDolares);
      const count = ln(f, 0, Math.max(slam, W(iVendio) + 10), 0, 965000, eio);
      scene = (
        <>
          <Restaurant f={f} />
          <Napkin x={540} y={1220 - (1 - drop(f, -4, fps)) * 900} s={0.95} rot={-4 + 1.5 * Math.sin(f * 0.06)} />
          <PriceCard x={540} y={620} label="SE VENDIÓ POR" value={`US$ ${Math.round(count).toLocaleString("es-AR")}`} s={1 + 0.06 * bump(f, slam)} shake={f > slam - 2 && f < slam + 8 ? 6 * Math.sin(f * 3) : 0} note={f >= slam ? "SUBASTA DE BONHAMS · 2024" : undefined} />
          {f >= W(iPor) ? <Pill x={540} y={900} text="¿Por qué?" s={pop(f, W(iPor), fps)} size={80} /> : null}
          <Label text="RECREACIÓN ILUSTRADA" />
        </>
      );
      sounds.push(<Snd key="s" at={slam} src={SOUND.impacto} vol={0.9} />, <Snd key="q" at={W(iPor)} src={SOUND.impacto} vol={0.35} />);
    } else if (v === 2) {
      const iPero = idx("pero");
      const iCuanto = idx("cuánto");
      const k = Math.max(0, Math.min(1, (f - tStart) / 60));
      const reveal = f >= W(iLionel);
      const tease = f >= W(iCuanto);
      const ringR = 330;
      scene = (
        <>
          <Restaurant f={f} lamp={0.7 + 0.3 * k} />
          <Napkin x={540} y={1220 - (1 - drop(f, -4, fps)) * 900} s={0.95} blur={reveal ? 1 - ln(f, W(iLionel), W(iLionel) + 10) : 1} rot={-3 + 1.5 * Math.sin(f * 0.06)} />
          {!reveal ? (
            <>
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <circle cx={540} cy={1220} r={ringR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
                <circle cx={540} cy={1220} r={ringR} fill="none" stroke={C.gold} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${(1 - k) * 2 * Math.PI * ringR} ${2 * Math.PI * ringR}`} transform="rotate(-90 540 1220)" style={{ filter: "drop-shadow(0 0 12px rgba(247,185,85,0.8))" }} />
              </svg>
              <Pill x={540} y={680} text="¿Qué jugador?" s={pop(f, 2, fps)} size={84} />
              <Pill x={540} y={820} text={`${(2 * (1 - k)).toFixed(1).replace(".", ",")} s`} s={1 + 0.15 * bump(f, tStart + 60)} size={64} dark />
            </>
          ) : null}
          {reveal ? (
            <div style={{ position: "absolute", left: 0, width: 1080, top: 640, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 130, color: C.white, letterSpacing: "-0.02em", textShadow: "0 0 40px rgba(255,215,140,0.6), 0 10px 30px rgba(0,0,0,0.6)", transform: `scale(${pop(f, W(iLionel), fps)}) translateY(${-60 * ln(f, W(iPero), W(iPero) + 10, 0, 1, eo)}px)` }}>Lionel Messi</div>
          ) : null}
          {tease ? <PriceCard x={540} y={900} label="HOY VALE" value="US$ ???.???" s={pop(f, W(iCuanto), fps)} shake={4 * Math.sin(f * 2.4)} /> : null}
          <Label text="RECREACIÓN ILUSTRADA" />
        </>
      );
      sounds.push(<Snd key="go" at={tStart} src={SOUND.tension} vol={0.35} />, <Snd key="end" at={tStart + 60} src={SOUND.impacto} vol={0.7} />, <Snd key="n" at={W(iLionel)} src={SOUND.impacto} vol={0.9} />, <Snd key="t" at={W(iCuanto)} src={SOUND.tension} vol={0.3} />);
    } else {
      const iCam0 = idx("cámara");
      const iMira = idx("mirá");
      const out = ln(f, W(iMira) - 2, W(iMira) + 10, 0, 1, eio);
      const nDrop = W(iMira) + 4;
      scene = (
        <>
          <Restaurant f={f} lamp={0.5 + 0.5 * out} />
          {out < 1 ? <ProCam x={540 - 900 * out} y={1050} s={1.6} f={f} crossed={ln(f, W(iCam0) + 2, W(iCam0) + 12)} /> : null}
          {f >= nDrop - 10 ? <Napkin x={540} y={1220 - (1 - drop(f, nDrop - 10, fps)) * 1100} s={0.95} rot={-4 + 1.5 * Math.sin(f * 0.06)} /> : null}
          {f >= W(iLionel) ? <Pill x={540} y={700} text="1er acuerdo de Messi con el Barça" s={pop(f, W(iLionel), fps)} size={50} /> : null}
          <Label text={f >= nDrop ? "RECREACIÓN ILUSTRADA" : "PARA NEGOCIOS LOCALES"} />
        </>
      );
      sounds.push(<Snd key="x" at={W(iCam0) + 2} src={SOUND.impacto} vol={0.5} />, <Snd key="d" at={nDrop} src={SOUND.impacto} vol={0.9} />, <Snd key="n" at={W(iLionel)} src={SOUND.impacto} vol={0.6} />);
    }
  } else if (f < S_DIR) {
    // ======================= 14 de diciembre de 2000 =======================
    const land = W(i2000) + 2;
    const k = ln(f, H, land, 0, 1, eio);
    const year = Math.round(2026 - 26 * k);
    scene = (
      <>
        <City f={f} k={k} />
        <Pill x={540} y={760} text={k >= 1 ? "14 dic 2000" : `${1 + Math.floor((f * 2) % 28)} · ${year}`} s={1 + 0.12 * bump(f, land)} size={92} />
        <Label text="BARCELONA" x={72} y={1500} />
      </>
    );
    sounds.push(<Snd key="c" at={land} src={SOUND.impacto} vol={0.6} />);
  } else if (f < S_WRITE) {
    // ======================= el director deportivo no tenía un contrato a mano =======================
    const pat = f >= W(iContrato) - 4 ? 1 : 0;
    scene = (
      <>
        <Restaurant f={f} />
        <Director f={f} pat={pat} look={0.5 * Math.sin(f * 0.1)} />
        <Pill x={540} y={600} text="Carles Rexach" s={pop(f, S_DIR + 2, fps)} size={70} />
        <div style={{ position: "absolute", left: 0, width: 1080, top: 660, textAlign: "center", fontFamily: PF, fontWeight: 600, fontSize: 30, letterSpacing: "0.14em", color: "rgba(255,255,255,0.75)", opacity: ln(local, 6, 14) }}>DIRECTOR DEPORTIVO DEL BARCELONA</div>
        {pat ? <Pill x={800} y={780} text="¿Contrato?" s={pop(f, W(iContrato), fps)} size={50} dark rot={6} /> : null}
        <Label text="ILUSTRACIÓN" />
      </>
    );
    sounds.push(<Snd key="d" at={S_DIR + 2} src={SOUND.impacto} vol={0.4} />, <Snd key="c" at={W(iContrato)} src={SOUND.impacto} vol={0.4} />);
  } else if (f < S_13) {
    // ======================= escribió el acuerdo en una servilleta =======================
    const write = ln(f, S_WRITE + 4, E(iServ) + 8);
    const tip = penTip(write);
    const s = 1.3;
    const px = 540 + (tip.x - 260) * s;
    const py = 1060 + (tip.y - 260) * s;
    scene = (
      <>
        <Restaurant f={f} lamp={1} />
        <AbsoluteFill style={{ background: "rgba(10,6,10,0.35)" }} />
        <Napkin x={540} y={1060} s={s} write={write} rot={-2} />
        {write < 1 ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`translate(${px} ${py + 3 * Math.sin(f * 1.4)})`}>
              <path d="M0 0 L-12 -40 L12 -40 Z" fill="#C9C2B4" />
              <rect x={-12} y={-230} width={24} height={190} rx={10} fill="#1E1A28" />
              <ellipse cx={30} cy={-150} rx={70} ry={52} fill="#E8B48C" />
              <path d="M60 -170 L260 -300 L320 -230 L110 -110 Z" fill="#2E3A5C" />
            </g>
          </svg>
        ) : null}
        <Label text="RECREACIÓN ILUSTRADA" />
      </>
    );
    sounds.push(<Snd key="w" at={S_WRITE + 4} src={SOUND.tension} vol={0.25} />);
  } else if (f < Math.min(S_NAME1, S_AUC, S_PAPEL)) {
    // ======================= tenía 13 años =======================
    scene = (
      <>
        <Field f={f} k={ln(f, S_13, S_13 + 120)} />
        {f >= W(i13) ? <Pill x={540} y={700} text="13 años" s={pop(f, W(i13), fps)} size={96} /> : null}
      </>
    );
    sounds.push(<Snd key="13" at={W(i13)} src={SOUND.impacto} vol={0.6} />);
  } else if (f < S_PAPEL && v === 1) {
    // ======================= Se llamaba Lionel Messi =======================
    const at = W(idx("lionel", i13));
    scene = (
      <>
        <Field f={f} k={1 + ln(f, S_NAME1, S_PAPEL) * 0.5} />
        <AbsoluteFill style={{ background: "rgba(20,8,16,0.25)" }} />
        {f >= at ? <div style={{ position: "absolute", left: 0, width: 1080, top: 640, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 140, color: C.white, letterSpacing: "-0.02em", textShadow: "0 0 50px rgba(255,215,140,0.7), 0 10px 30px rgba(0,0,0,0.6)", transform: `scale(${pop(f, at, fps)})` }}>Lionel Messi</div> : null}
      </>
    );
    sounds.push(<Snd key="n" at={at} src={SOUND.impacto} vol={0.9} />);
  } else if (f < S_PAPEL) {
    // ======================= subasta 2024 =======================
    const slam = W(iDolares);
    scene = (
      <>
        <Auction f={f} from={S_AUC} />
        <Napkin x={540} y={1060} s={0.62} rot={-2 + Math.sin(f * 0.06)} />
        <PriceCard x={540} y={620} label="BONHAMS · MAYO 2024" value={`US$ ${Math.round(ln(f, S_AUC + 6, slam, 0, 965000, eio)).toLocaleString("es-AR")}`} s={1 + 0.06 * bump(f, slam)} note={f >= slam ? "≈ £762.400" : undefined} />
        <svg width={220} height={220} viewBox="-110 -110 220 220" style={{ position: "absolute", left: 760, top: 820, overflow: "visible" }}>
          <g transform={`rotate(${f < slam - 6 ? -40 : f < slam ? -40 + 50 * ((f - (slam - 6)) / 6) : 10 - 10 * Math.min(1, (f - slam) / 8)})`}>
            <rect x={-10} y={-10} width={20} height={150} rx={8} fill="#8A5A2B" />
            <rect x={-60} y={-46} width={120} height={50} rx={14} fill="#B07A44" />
          </g>
        </svg>
      </>
    );
    sounds.push(<Snd key="g" at={slam} src={SOUND.impacto} vol={0.9} />);
  } else if (f < S_LESSON) {
    // ======================= El papel no valía nada: valía lo que tenía escrito =======================
    const tNada = W(iNada);
    const tGlow = W(iEscrito) - 2;
    const gl = ln(f, tGlow, tGlow + 12);
    const tagGone = ln(f, tGlow - 4, tGlow + 10, 0, 1, Easing.in(Easing.cubic));
    scene = (
      <>
        <Studio f={f} tint="#2A1A22" />
        <div style={{ position: "absolute", left: 140, top: 700, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, rgba(247,185,85,${0.35 * gl}) 0%, rgba(247,185,85,0) 65%)` }} />
        <Napkin x={540} y={1080} s={1.15} glow={gl} rot={-3 + Math.sin(f * 0.05)} />
        {tagGone < 1 ? (
          <div style={{ position: "absolute", left: 760 + tagGone * 500, top: 760 - tagGone * 400, transform: `rotate(${14 + 10 * Math.sin(f * 0.18) + tagGone * 90}deg)`, transformOrigin: "0 50%" }}>
            <svg width={220} height={120} viewBox="0 0 220 120">
              <path d="M36 8 L210 8 L210 112 L36 112 L6 60 Z" fill={C.cream} />
              <circle cx={36} cy={60} r={10} fill={C.ink} />
              <text x={124} y={82} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={60} fill={f >= tNada ? C.red : C.ink}>
                $0
              </text>
            </svg>
          </div>
        ) : null}
      </>
    );
    sounds.push(<Snd key="n" at={tNada} src={SOUND.impacto} vol={0.5} />, <Snd key="g" at={tGlow} src={SOUND.tiron} vol={0.5} />);
  } else if (f < S_CTA) {
    // ======================= no importa la cámara: importa qué mostrás y cómo lo editás =======================
    const tCam = W(iCamara);
    const tMos = W(iMostras);
    const tEd = W(iEditas);
    scene = (
      <>
        <Studio f={f} />
        {f >= tCam - 10 ? <ProCam x={250} y={760 - (1 - drop(f, tCam - 10, fps)) * 900} s={0.85} f={f} crossed={ln(f, tCam + 2, tCam + 12)} /> : null}
        <DarkPhone x={680} y={1060} s={0.82} lift={(1 - drop(f, S_LESSON - 2, fps)) * 1300}>
          {f < tMos ? <Shop t={f / fps} /> : <Hero t={f / fps} f={f} from={tMos} />}
        </DarkPhone>
        {f >= tEd - 6 ? (
          <div style={{ position: "absolute", left: 130, top: 1470, width: 820, height: 64, opacity: ln(f, tEd - 6, tEd) }}>
            {[0, 1, 2, 3].map((k) => {
              const cutAt = tEd + 2;
              const shift = f >= cutAt && k >= 2 ? -40 * ln(f, cutAt, cutAt + 8, 0, 1, eo) : 0;
              const gone = f >= cutAt && k === 1 ? ln(f, cutAt, cutAt + 10) : 0;
              return <div key={k} style={{ position: "absolute", left: k * 205 + shift, top: gone * 120, width: 195, height: 64, borderRadius: 14, background: k === 1 ? "#5A4E66" : "linear-gradient(90deg, #6B4E9E, #9A6BD6)", opacity: 1 - gone, transform: `rotate(${gone * 20}deg)` }} />;
            })}
            {f >= tEd - 2 && f < tEd + 8 ? <div style={{ position: "absolute", left: 200, top: -30, width: 10, height: 124, background: C.orange, boxShadow: "0 0 18px rgba(255,106,43,0.9)" }} /> : null}
          </div>
        ) : null}
      </>
    );
    sounds.push(<Snd key="p" at={S_LESSON + 6} src={SOUND.impacto} vol={0.4} />, <Snd key="x" at={tCam + 2} src={SOUND.impacto} vol={0.5} />, <Snd key="m" at={tMos} src={SOUND.impacto} vol={0.4} />, <Snd key="e" at={tEd + 2} src={SOUND.tiron} vol={0.5} />);
  } else {
    // ======================= CTA: Seguime =======================
    const tBtn = S_CTA + 4;
    scene = (
      <>
        <Studio f={f} tint="#3A2030" />
        <div style={{ position: "absolute", left: 0, width: 1080, top: 520, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 150, color: C.white, letterSpacing: "-0.03em", textShadow: "0 0 40px rgba(255,255,255,0.25)", transform: `scale(${pop(f, S_CTA, fps)})` }}>Seguime</div>
        <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%, -50%) scale(${pop(f, tBtn, fps) * (1 + 0.04 * Math.sin(f * 0.25))})`, padding: "18px 80px 24px", borderRadius: 26, background: C.orange, color: C.white, fontFamily: PF, fontWeight: 800, fontSize: 64, boxShadow: "0 10px 0 rgba(0,0,0,0.4), 0 0 50px rgba(255,106,43,0.5)" }}>Seguir</div>
        {f >= W(iMejorar) - 4 ? (
          <div style={{ position: "absolute", left: 540, top: 1040, transform: `translate(-50%, -50%) scale(${pop(f, W(iMejorar) - 4, fps)})`, width: 820, borderRadius: 28, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, padding: "26px 0 30px", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 28, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>EN EL PRÓXIMO VIDEO</div>
            <div style={{ fontFamily: PF, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.15 }}>
              mejoro el de <span style={{ color: C.gold }}>otro negocio</span>
            </div>
          </div>
        ) : null}
        <Napkin x={250} y={1340} s={0.42} glow={1} rot={-8} />
        <DarkPhone x={830} y={1330} s={0.36}>
          <Hero t={f / fps} f={f} from={S_CTA} />
        </DarkPhone>
      </>
    );
    sounds.push(<Snd key="b" at={tBtn} src={SOUND.impacto} vol={0.6} />, <Snd key="k" at={W(iMejorar)} src={SOUND.impacto} vol={0.5} />);
  }

  const hideCaps = f >= S_CTA;

  return (
    <AbsoluteFill style={{ background: "#0E0B12" }}>
      <AbsoluteFill style={{ transformOrigin: "540px 1000px", transform: `scale(${push * (0.96 + 0.04 * enter)})`, opacity: 0.35 + 0.65 * enter }}>{scene}</AbsoluteFill>
      <Vignette />
      <Grain />
      {hideCaps ? null : <Subs words={words} f={f} fps={fps} />}

      {gap > 0 ? (
        <>
          <Sequence from={0} durationInFrames={cut}>
            <Audio src={staticFile(`audio/voz_servilleta_${v}.wav`)} trimAfter={cut} />
          </Sequence>
          <Sequence from={cut + gap}>
            <Audio src={staticFile(`audio/voz_servilleta_${v}.wav`)} trimBefore={cut} />
          </Sequence>
        </>
      ) : (
        <Audio src={staticFile(`audio/voz_servilleta_${v}.wav`)} />
      )}
      <Audio src={staticFile(`audio/musica_servilleta_${v}.wav`)} volume={0.22} />
      {sounds}
    </AbsoluteFill>
  );
};

// ---------- portadas (el gancho de cada variante, sin revelar la respuesta) ----------
const COVER: Record<number, string[]> = { 1: ["Esta servilleta", "se vendió por", "US$ 965.000"], 2: ["¿Qué jugador", "se fichó con", "esta servilleta?"], 3: ["¿Sin buena cámara?", "Mirá esta", "servilleta"] };
export const ServilletaPortada: React.FC<{ v?: number }> = ({ v = 1 }) => (
  <AbsoluteFill style={{ background: "#0E0B12" }}>
    <Restaurant f={20} />
    <Napkin x={540} y={1220} s={1} rot={-4} blur={v === 2 ? 1 : 0} />
    <Vignette />
    <div style={{ position: "absolute", left: 60, width: 960, top: 300, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 100, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.white, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>
      {COVER[v].map((l, k) =>
        k === COVER[v].length - 1 ? (
          <div key={k} style={{ display: "inline-block", marginTop: 14, padding: "4px 36px 14px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 12px 0 rgba(0,0,0,0.45)" }}>
            {l}
          </div>
        ) : (
          <div key={k}>{l}</div>
        ),
      )}
    </div>
    <Grain />
  </AbsoluteFill>
);
