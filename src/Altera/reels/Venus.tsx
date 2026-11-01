import React from "react";
import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-venus-1.json";
import c2 from "../../data/captions-venus-2.json";
import c3 from "../../data/captions-venus-3.json";
import c4 from "../../data/captions-venus-4.json";
import c5 from "../../data/captions-venus-5.json";
import { Snd, timing } from "../reelkit";
import { SOUND } from "../system";
import { BigName, Bokeh, C, Dust, Grain, Label, Pill, Sparks, Stars, Studio, Tap, Vignette, bump, decay, eio, eo, ln, pop } from "./Servilleta";

// «Un día en Venus» — dato curioso de Hook House (2026-11-01). Estilo animado (estilo-animado.md), tema espacio.
// Dato verificado (NASA Space Place, Natural History Museum de Londres): Venus tarda ~243 días terrestres en girar una vez
// sobre sí misma y ~225 en dar la vuelta al Sol (su día sideral es más largo que su año); gira al revés, así que el Sol
// sale por el oeste; es el planeta más caliente (≈ 462–480 °C, alcanza para derretir plomo, que funde a 327 °C) aunque
// Mercurio está más cerca del Sol. Ojo: de amanecer a amanecer son ~117 días; por eso el guion dice «dar una vuelta
// sobre sí misma». 5 variantes de gancho con el mismo cuerpo; cierre: «Comentá Venus».

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";
const DIA = "#FF8A3D";
const SKY = "#7CC4FF";
const MERC = "#B8C4D6";

const CAPS: Caption[][] = [c1, c2, c3, c4, c5];
export const venusFrames = (v: number) => timing(CAPS[v - 1]).frames;

const KEYCOLOR: [RegExp, string][] = [
  [/^(venus|planeta)$/i, C.gold],
  [/^(día|días)$/i, DIA],
  [/^(año|años)$/i, C.green],
  [/^(revés|oeste|sol)$/i, SKY],
  [/^(caliente|grados|plomo|derretir)$/i, C.red],
  [/^(mercurio)$/i, MERC],
];
const keyColor = (w: string) => {
  const clean = w.toLowerCase().replace(/[¿?¡!.,:…"«»]/g, "");
  for (const [re, col] of KEYCOLOR) if (re.test(clean)) return col;
  return null;
};

const Subs: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number }> = ({ words, f, fps }) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at || i === 0) cur = i;
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

// ---------- piezas ----------
const Space: React.FC<{ f: number; tint?: string }> = ({ f, tint = "#1A1030" }) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${tint} 0%, #07060E 75%)` }} />
    <Stars f={f} n={110} h={1920} />
    <Bokeh f={f} color="#B98CFF" seed={11} n={8} />
  </>
);

// Venus: nubes en bandas que se desplazan según el giro (rot crece = gira); marcador en la superficie
let venusId = 0;
const Venus: React.FC<{ x: number; y: number; r: number; rot: number; f: number; marker?: boolean; heat?: number; arrow?: number; dir?: number }> = ({ x, y, r, rot, f, marker = false, heat = 0, arrow = 0, dir = -1 }) => {
  const id = `vn${venusId++ % 50}`;
  const bands = 7;
  const mx = Math.sin(rot) * r * 0.8;
  const mz = Math.cos(rot);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <radialGradient id={`${id}g`} cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor={heat > 0 ? "#FFE0A0" : "#FBE3B0"} />
          <stop offset="55%" stopColor={heat > 0 ? `rgb(${230},${Math.round(140 - 60 * heat)},${Math.round(60 - 30 * heat)})` : "#E2A157"} />
          <stop offset="100%" stopColor={heat > 0 ? "#6A1A10" : "#7A4220"} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r * 1.12} fill={`rgba(255,${heat > 0 ? 90 : 190},${heat > 0 ? 40 : 110},${0.18 + 0.25 * heat})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`} opacity={0.55}>
        {Array.from({ length: bands }, (_, i) => {
          const yy = y - r + ((i + 0.5) * 2 * r) / bands;
          const off = ((rot * r * (0.8 + 0.1 * (i % 3)) * (i % 2 ? 1 : 1.2)) % (r * 2)) - r;
          return (
            <g key={i}>
              {[-2, 0, 2].map((k) => (
                <path key={k} d={`M${x - r * 2 + off + k * r * 2} ${yy} q${r * 0.5} ${-18} ${r} 0 t${r} 0`} stroke={i % 2 ? "#FFF1D2" : "#B9672E"} strokeWidth={r * 0.09} fill="none" strokeLinecap="round" />
              ))}
            </g>
          );
        })}
        <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.7} fill="#FFFFFF" opacity={0.12} />
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={r * 0.06} />
      {marker && mz > -0.1 ? (
        <g transform={`translate(${x + mx} ${y - r * 0.2})`} opacity={Math.min(1, (mz + 0.1) * 3)}>
          <line x1={0} y1={0} x2={0} y2={-r * 0.36} stroke="#FFFFFF" strokeWidth={6} />
          <path d={`M0 ${-r * 0.36} l${r * 0.22} ${r * 0.07} l${-r * 0.22} ${r * 0.07} Z`} fill={DIA} />
          <circle cx={0} cy={0} r={8} fill="#FFFFFF" />
        </g>
      ) : null}
      {arrow > 0 ? (
        <g opacity={arrow} transform={`translate(${x} ${y}) scale(${dir} 1)`}>
          <path d={`M${-r * 0.9} ${r * 1.18} A${r * 1.25} ${r * 0.35} 0 0 0 ${r * 0.9} ${r * 1.18}`} stroke={SKY} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={`${arrow * 900} 900`} />
          <path d={`M${r * 0.9} ${r * 1.18} l-34 -24 l6 40 Z`} fill={SKY} />
        </g>
      ) : null}
    </svg>
  );
};

const Sun: React.FC<{ x: number; y: number; r: number; f: number }> = ({ x, y, r, f }) => (
  <>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) rotate(${f * 0.6})`} opacity={0.35}>
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M0 0 L${r * 0.18} ${-r * 4} L${-r * 0.18} ${-r * 4} Z`} fill="#FFE2A8" transform={`rotate(${i * 22.5})`} />
        ))}
      </g>
    </svg>
    <div style={{ position: "absolute", left: x - r * 1.6, top: y - r * 1.6, width: r * 3.2, height: r * 3.2, borderRadius: "50%", background: "radial-gradient(circle, #FFF6D0 0%, #FFD36A 30%, #FF9A3D 45%, rgba(255,154,61,0) 70%)", transform: `scale(${1 + 0.04 * Math.sin(f * 0.25)})` }} />
  </>
);

// Superficie de Venus: cielo naranja con bruma, volcanes, rocas; el Sol puede salir por la izquierda (oeste)
const Surface: React.FC<{ f: number; sunrise?: number; heat?: number }> = ({ f, sunrise = 0, heat = 0 }) => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${heat > 0 ? "#5A1408" : "#5A2A12"} 0%, ${heat > 0 ? "#C2401E" : "#C27A2E"} 45%, ${heat > 0 ? "#FF8A3D" : "#F2C070"} 70%)` }} />
    {sunrise > 0 ? (
      <div style={{ position: "absolute", left: 190 - 150, top: 1240 - 380 * sunrise - 150, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #FFF6D0 0%, #FFD36A 40%, rgba(255,211,106,0) 70%)", boxShadow: `0 0 ${120 * sunrise}px rgba(255,220,140,0.6)` }} />
    ) : null}
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M-60 ${700 + i * 90 + 14 * Math.sin(f * 0.04 + i)} C300 ${680 + i * 90} 700 ${720 + i * 90} 1140 ${690 + i * 90}`} stroke="#FFE2B0" strokeWidth={30} opacity={0.06} fill="none" />
      ))}
      <path d="M-60 1260 L120 1180 L260 1230 L420 1060 L520 1050 L640 1200 L800 1150 L1140 1240 L1140 1920 L-60 1920 Z" fill={heat > 0 ? "#3A0E08" : "#5A2C14"} />
      <path d="M420 1060 Q470 1020 520 1050" stroke="#FF6A2B" strokeWidth={10} fill="none" opacity={0.6 + 0.3 * Math.sin(f * 0.4)} />
      {Array.from({ length: 6 }, (_, i) => {
        const k = ((f * 0.6 + i * 20) % 120) / 120;
        return <circle key={i} cx={470 + 30 * Math.sin(i * 2 + f * 0.05)} cy={1040 - 300 * k} r={20 + 40 * k} fill="#6A4A3A" opacity={0.35 * (1 - k)} />;
      })}
      <path d="M-60 1420 C300 1380 700 1440 1140 1400 L1140 1920 L-60 1920 Z" fill={heat > 0 ? "#2A0A06" : "#3E1E0E"} />
      {[
        [160, 1500, 50],
        [600, 1560, 70],
        [900, 1480, 40],
      ].map(([cx, cy, rr], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rr} ry={rr * 0.45} fill="#24110A" />
      ))}
    </svg>
    <Dust f={f} x0={0} x1={1080} y0={700} y1={1700} n={34} color="#FFD8A0" />
  </>
);

const Thermo: React.FC<{ x: number; y: number; p: number; f: number }> = ({ x, y, p, f }) => {
  const h = 760;
  const fill = h * p;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) rotate(${1.5 * Math.sin(f * 0.15)})`}>
        <rect x={-46} y={-h} width={92} height={h} rx={46} fill="rgba(255,255,255,0.15)" stroke="#FFFFFF" strokeWidth={8} />
        <rect x={-26} y={-fill} width={52} height={fill} rx={26} fill={C.red} style={{ filter: "drop-shadow(0 0 16px rgba(229,72,77,0.9))" }} />
        <circle cx={0} cy={30} r={78} fill={C.red} stroke="#FFFFFF" strokeWidth={8} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={56} y1={-h + 60 + i * 80} x2={86} y2={-h + 60 + i * 80} stroke="#FFFFFF" strokeWidth={5} opacity={0.6} />
        ))}
      </g>
    </svg>
  );
};

// Lingote de plomo que se derrite (melt 0..1)
const Ingot: React.FC<{ x: number; y: number; melt: number; f: number }> = ({ x, y, melt, f }) => {
  const hh = 150 * (1 - 0.85 * melt);
  const sag = 30 * melt;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <ellipse cx={x} cy={y + 6} rx={150 + 230 * melt} ry={26 + 22 * melt} fill="#8E96A6" opacity={0.25 + 0.75 * melt} />
      <ellipse cx={x - 40 * melt} cy={y} rx={(150 + 200 * melt) * 0.7} ry={(18 + 16 * melt) * 0.6} fill="#C9D0DC" opacity={melt} />
      <path d={`M${x - 170} ${y} Q${x - 170 + sag} ${y - hh / 2} ${x - 130} ${y - hh} L${x + 130} ${y - hh} Q${x + 170 - sag} ${y - hh / 2} ${x + 170} ${y} Z`} fill="#9AA2B2" stroke="#5E6676" strokeWidth={6} />
      <path d={`M${x - 130} ${y - hh} L${x + 130} ${y - hh} L${x + 100} ${y - hh - 40 * (1 - melt)} L${x - 100} ${y - hh - 40 * (1 - melt)} Z`} fill="#C3CAD6" stroke="#5E6676" strokeWidth={6} />
      {melt < 0.7 ? (
        <text x={x} y={y - hh / 2 + 22} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={64 * (1 - melt * 0.6)} fill="#4A5262">
          Pb
        </text>
      ) : null}
      {Array.from({ length: 4 }, (_, i) => {
        const k = ((f * 0.8 + i * 9) % 30) / 30;
        return melt > 0.05 && melt < 0.95 ? <ellipse key={i} cx={x - 120 + i * 80} cy={y - hh * 0.4 + 60 * k} rx={9} ry={14} fill="#C9D0DC" opacity={1 - k} /> : null;
      })}
    </svg>
  );
};

// Torta de cumpleaños con velas que titilan
const Cake: React.FC<{ x: number; y: number; s: number; f: number }> = ({ x, y, s, f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-170} y={-120} width={340} height={120} rx={20} fill="#F7C6D8" />
      <rect x={-130} y={-210} width={260} height={96} rx={18} fill="#FBE3EC" />
      <path d="M-170 -96 q28 30 56 0 q28 30 56 0 q28 30 56 0 q28 30 56 0 q28 30 56 0 q28 30 58 0" stroke="#FFFFFF" strokeWidth={14} fill="none" />
      {[-70, 0, 70].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 9} y={-290} width={18} height={80} rx={6} fill={[SKY, C.gold, C.green][i]} />
          <ellipse cx={cx + 3 * Math.sin(f * 0.8 + i)} cy={-306} rx={12} ry={20 + 4 * Math.sin(f * 1.2 + i)} fill="#FFD36A" />
          <ellipse cx={cx} cy={-300} rx={5} ry={9} fill="#FFFFFF" />
        </g>
      ))}
    </g>
  </svg>
);

// Caracol (para «gira tan lento»)
const Snail: React.FC<{ x: number; y: number; s: number; f: number }> = ({ x, y, s, f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M-90 0 Q-100 -30 -60 -34 L60 -34 Q100 -34 110 -70 L118 -${96 + 4 * Math.sin(f * 0.3)} M100 -60 L96 -${92 + 4 * Math.cos(f * 0.3)}`} stroke="#E8E2F2" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M-100 0 L110 0 Q130 -10 110 -34 L-60 -34 Q-100 -30 -100 0 Z" fill="#E8E2F2" />
      <circle cx={-10} cy={-90} r={70} fill={C.gold} stroke="#9A6A1F" strokeWidth={8} />
      <path d="M-10 -90 m0 -50 a50 50 0 1 1 -1 0 m1 22 a28 28 0 1 1 -1 0 m1 14 a14 14 0 1 1 -1 0" stroke="#9A6A1F" strokeWidth={7} fill="none" />
    </g>
  </svg>
);

type SceneId = "hook" | "giro" | "orbita" | "compara" | "reves" | "mercurio" | "calor" | "plomo" | "cta";

export const VenusReel: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const T = timing(CAPS[v - 1]);
  const { W, E, idx } = T;
  const END = T.frames;
  const words = T.words;

  // ---- cuerpo ----
  const iTarda = idx("tarda");
  const iB = iTarda - 1;
  const i243 = idx("243", iTarda);
  const iVuelta = idx("vuelta", i243);
  const iPero = idx("pero", iVuelta);
  const i225 = idx("225", iPero);
  const iOsea = idx("o", i225);
  const iDia = idx("día", iOsea);
  const iAno = idx("año", iDia);
  const iGira = idx("gira", iAno);
  const iReves = idx("revés", iGira);
  const iOeste = idx("oeste", iReves);
  const iEncima = idx("encima", iOeste);
  const iMerc = idx("mercurio", iEncima);
  const iVenus2 = idx("venus", iMerc);
  const iCaliente = idx("caliente", iVenus2);
  const i450 = idx("450", iCaliente);
  const iAlcanza = idx("alcanza", i450);
  const iPlomo = idx("plomo", iAlcanza);
  const iComenta = idx("comentá", iPlomo);

  const S = {
    giro: W(iB) - 3,
    orbita: W(iPero) - 2,
    compara: W(iOsea) - 2,
    reves: W(iGira - 1) - 2,
    mercurio: W(iEncima) - 2,
    calor: W(iVenus2) - 2,
    plomo: W(iAlcanza) - 2,
    cta: W(iComenta) - 2,
  };
  const raw: [SceneId, number][] = [["hook", 0], ...(Object.entries(S) as [SceneId, number][])];
  const scenes = raw.filter(([, s], i) => i === 0 || s > raw[i - 1][1]);
  let si = 0;
  while (si < scenes.length - 1 && f >= scenes[si + 1][1]) si++;
  const sceneStart = scenes[si][1];
  const sceneEnd = si + 1 < scenes.length ? scenes[si + 1][1] : END;

  const t243 = W(i243);
  const t225 = W(i225);
  const tDia = W(iDia);
  const tAno = W(iAno);
  const tReves = W(iReves);
  const tOeste = W(iOeste);
  const tMerc = W(iMerc);
  const tCal = W(iCaliente);
  const t450 = W(i450);
  const tPlomo = W(iPlomo);
  const tCta = S.cta;

  // ---- ganchos ----
  const hk = { dia: idx("día"), ano: idx("año"), seg: idx("2"), cumpl: idx("cumplirías"), termine: idx("termine"), lento: idx("lento"), oeste: idx("oeste"), planeta: idx("planeta") };
  const tTimer = E(hk.seg) + 2;

  const DayYear: React.FC<{ show: number; p: number; big?: boolean; gtAt: number }> = ({ show, p, big = false, gtAt }) => {
    // barras verticales: DÍA 243 contra AÑO 225
    const H = big ? 760 : 560;
    const base = big ? 1560 : 1500;
    const hD = H * p;
    const hA = H * (225 / 243) * ln(p, 0.15, 1);
    return show <= 0 ? null : (
      <div style={{ position: "absolute", inset: 0, opacity: show }}>
        {[
          { x: 300, h: hD, col: DIA, lab: "DÍA", num: "243 días" },
          { x: 780, h: hA, col: C.green, lab: "AÑO", num: "225 días" },
        ].map((b, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: b.x - 120, top: base - b.h, width: 240, height: b.h, borderRadius: "28px 28px 8px 8px", background: `linear-gradient(180deg, ${b.col}, ${b.col}88)`, boxShadow: `0 0 40px ${b.col}66` }} />
            <div style={{ position: "absolute", left: b.x - 200, width: 400, top: base + 20, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 64, color: b.col, textShadow: `0 0 24px ${b.col}` }}>{b.lab}</div>
            {b.h > 80 ? <Pill x={b.x} y={base - b.h - 60} text={b.num} s={Math.min(1, b.h / 200)} size={50} /> : null}
          </React.Fragment>
        ))}
        {f >= gtAt ? <div style={{ position: "absolute", left: 470, width: 140, top: base - H * 0.6, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 150, color: C.white, transform: `scale(${pop(f, gtAt, fps) * (1 + 0.05 * Math.sin(f * 0.4))})`, textShadow: "0 0 30px rgba(255,255,255,0.6)" }}>&gt;</div> : null}
      </div>
    );
  };

  const renderHook = (): React.ReactNode => {
    if (v === 1) {
      const k = Math.max(0, Math.min(1, (f - tTimer) / 60));
      const ringR = 150;
      const orbA = f * 0.06;
      return (
        <>
          <Space f={f} />
          <AbsoluteFill style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}>
            <AbsoluteFill style={{ background: "radial-gradient(ellipse at 25% 55%, #3A1E10 0%, rgba(0,0,0,0) 60%)" }} />
            <Venus x={270} y={1150} r={200} rot={f * 0.02} f={f} marker />
          </AbsoluteFill>
          <AbsoluteFill style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}>
            <Sun x={810} y={1150} r={80} f={f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <ellipse cx={810} cy={1150} rx={210} ry={210} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeDasharray="12 12" />
            </svg>
            <Venus x={810 + 210 * Math.cos(orbA)} y={1150 + 210 * Math.sin(orbA)} r={42} rot={0} f={f} />
          </AbsoluteFill>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={540} y1={560} x2={540} y2={1760} stroke="#FFF6E6" strokeWidth={6} opacity={0.7} />
          </svg>
          {f >= W(hk.dia) ? <Pill x={270} y={760} text="UN DÍA" s={pop(f, W(hk.dia), fps)} size={66} rot={-3} /> : null}
          {f >= W(hk.ano) ? <Pill x={810} y={760} text="UN AÑO" s={pop(f, W(hk.ano), fps)} size={66} rot={3} dark /> : null}
          {f >= W(hk.seg) ? (
            <>
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <circle cx={540} cy={1560} r={ringR} fill="rgba(10,8,14,0.7)" stroke="rgba(255,255,255,0.15)" strokeWidth={12} />
                <circle cx={540} cy={1560} r={ringR} fill="none" stroke={C.gold} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(1 - k) * 2 * Math.PI * ringR} ${2 * Math.PI * ringR}`} transform="rotate(-90 540 1560)" style={{ filter: "drop-shadow(0 0 12px rgba(247,185,85,0.8))" }} />
              </svg>
              <div style={{ position: "absolute", left: 340, width: 400, top: 1505, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 90, color: C.white, transform: `scale(${pop(f, W(hk.seg), fps) * (1 + 0.15 * bump(f, tTimer + 60))})` }}>{(2 * (1 - k)).toFixed(1).replace(".", ",")}</div>
            </>
          ) : null}
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 2 || v === 4) {
      const p = ln(f, W(hk.dia) - 4, W(hk.ano) + 10, 0, 1, eo);
      return (
        <>
          <Space f={f} tint="#2A1410" />
          <Venus x={540} y={v === 4 ? 1120 : 1000} r={v === 4 ? 300 : 230} rot={f * 0.01} f={f} marker arrow={v === 4 ? ln(f, 4, 30) : 0} dir={-1} />
          {v === 4 && f < W(hk.dia) - 4 ? <Snail x={540} y={1120 - 300 + 6} s={0.8} f={f} /> : null}
          {f >= W(hk.dia) - 4 ? <DayYear show={1} p={p} gtAt={W(hk.ano) + 8} /> : null}
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 3) {
      const day = ln(f, 0, W(hk.termine) + 10, 0, 0.92);
      return (
        <>
          <Surface f={f} />
          <Cake x={540} y={1420} s={1.1 * (1 + 0.03 * Math.sin(f * 0.4))} f={f} />
          <Pill x={540} y={1610} text="VENUS" s={0.9 + 0.03 * Math.sin(f * 0.3)} size={56} dark />
          {/* reloj del día que no termina */}
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <circle cx={540} cy={820} r={130} fill="rgba(10,8,14,0.7)" stroke="#FFFFFF" strokeWidth={8} />
            <circle cx={540} cy={820} r={130} fill="none" stroke={DIA} strokeWidth={14} strokeDasharray={`${day * 2 * Math.PI * 130} 999`} transform="rotate(-90 540 820)" />
            <line x1={540} y1={820} x2={540 + 100 * Math.sin(day * 2 * Math.PI)} y2={820 - 100 * Math.cos(day * 2 * Math.PI)} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />
          </svg>
          {f >= W(hk.termine) ? <Pill x={540} y={1010} text="el día sigue…" s={pop(f, W(hk.termine), fps)} size={56} dark /> : null}
          <Sparks f={f} at={W(hk.cumpl)} x={540} y={1150} n={22} color={C.gold} spread={360} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    // v5: el Sol sale por el oeste
    const rise = ln(f, W(hk.oeste) - 18, W(hk.oeste) + 12, 0, 1, eo);
    return (
      <>
        <Surface f={f} sunrise={rise} />
        <Pill x={190} y={1330} text="OESTE" s={f >= W(hk.oeste) ? pop(f, W(hk.oeste), fps) : 0.0001} size={60} rot={-3} />
        <Pill x={900} y={1330} text="ESTE" s={0.8} size={50} dark />
        <Label text="ILUSTRACIÓN" x={72} y={1780} />
      </>
    );
  };

  const renderScene = (id: SceneId): React.ReactNode => {
    switch (id) {
      case "hook":
        return renderHook();
      case "giro": {
        const days = Math.round(ln(f, S.giro + 2, t243 + 2, 1, 243, eio));
        const rot = ln(f, S.giro, sceneEnd, 0, Math.PI * 1.6);
        return (
          <>
            <Space f={f} tint="#2A1410" />
            <Venus x={540} y={1150} r={330} rot={rot} f={f} marker />
            <Pill x={540} y={700} text={`DÍA ${days}`} s={(1 + 0.12 * bump(f, t243 + 2)) * (1 + 0.03 * Math.sin(f * 0.5))} size={96} rot={2 * Math.sin(f * 0.15)} />
            {f >= W(iVuelta) ? <Pill x={540} y={1600} text="1 vuelta sobre sí misma" s={pop(f, W(iVuelta), fps)} size={52} dark /> : null}
            <Sparks f={f} at={t243 + 2} x={540} y={700} n={18} color={DIA} spread={320} />
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      }
      case "orbita": {
        const a = ln(f, S.orbita, t225 + 4, -Math.PI / 2, Math.PI * 1.5, eio);
        const days = Math.round(ln(f, S.orbita, t225 + 4, 0, 225, eio));
        return (
          <>
            <Space f={f} />
            <Sun x={540} y={1150} r={110} f={f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <circle cx={540} cy={1150} r={360} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={4} strokeDasharray="14 14" />
              <path d={`M540 790 A360 360 0 ${a + Math.PI / 2 > Math.PI ? 1 : 0} 1 ${540 + 360 * Math.cos(a)} ${1150 + 360 * Math.sin(a)}`} stroke={C.green} strokeWidth={12} fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 12px rgba(74,222,128,0.8))" }} />
            </svg>
            <Venus x={540 + 360 * Math.cos(a)} y={1150 + 360 * Math.sin(a)} r={62} rot={0} f={f} />
            <Pill x={540} y={680} text={`AÑO: ${days} días`} s={(1 + 0.12 * bump(f, t225 + 4)) * (1 + 0.03 * Math.sin(f * 0.5))} size={80} rot={2 * Math.sin(f * 0.15)} />
            <Sparks f={f} at={t225 + 4} x={540} y={790} n={18} color={C.green} spread={300} />
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      }
      case "compara": {
        const p = ln(f, tDia - 6, tAno + 8, 0, 1, eo);
        return (
          <>
            <Studio f={f} tint="#2A1A30" />
            <DayYear show={1} p={p} big gtAt={tAno + 8} />
            <Sparks f={f} at={tAno + 8} x={540} y={1100} n={22} color={C.white} spread={380} />
          </>
        );
      }
      case "reves": {
        const rise = ln(f, tOeste - 14, tOeste + 14, 0, 1, eo);
        const flip = ln(f, tReves - 4, tReves + 8);
        return (
          <>
            <Surface f={f} sunrise={rise} />
            {/* flechas de giro: la Tierra (como siempre) y Venus (al revés) */}
            <div style={{ position: "absolute", left: 760, top: 560, width: 260, height: 220, borderRadius: 30, background: "rgba(16,13,20,0.7)", boxShadow: "0 16px 30px rgba(0,0,0,0.4)" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center", fontFamily: PF, fontWeight: 600, fontSize: 24, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)" }}>VENUS GIRA</div>
              <svg width={260} height={180} viewBox="0 0 260 180" style={{ position: "absolute", left: 0, top: 40 }}>
                <circle cx={130} cy={80} r={46} fill="#E2A157" />
                <g transform={`translate(130 80) scale(${1 - 2 * flip} 1)`}>
                  <path d="M-80 30 A86 30 0 0 0 80 30" stroke={SKY} strokeWidth={10} fill="none" strokeLinecap="round" />
                  <path d="M80 30 l-26 -16 l2 30 Z" fill={SKY} />
                </g>
              </svg>
            </div>
            {f >= tReves ? <Pill x={890} y={830} text="AL REVÉS" s={pop(f, tReves, fps)} size={50} rot={3} /> : null}
            {f >= tOeste ? <Pill x={190} y={1330} text="OESTE" s={pop(f, tOeste, fps)} size={60} rot={-3} /> : null}
            <Pill x={900} y={1330} text="ESTE" s={0.8} size={50} dark />
            <Sparks f={f} at={tOeste + 6} x={190} y={900} n={18} color="#FFE2A8" spread={300} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      }
      case "mercurio": {
        const m = f >= tMerc - 2 ? pop(f, tMerc - 2, fps) : 0;
        return (
          <>
            <Space f={f} />
            <Sun x={-40} y={1150} r={260} f={f} />
            <Venus x={820} y={1150} r={130} rot={f * 0.01} f={f} />
            {m > 0 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <g transform={`translate(440 1150) scale(${m})`}>
                  <circle r={70} fill="#9EA6B4" />
                  <circle cx={-20} cy={-18} r={12} fill="#7E8696" />
                  <circle cx={24} cy={20} r={16} fill="#7E8696" />
                  <circle cx={10} cy={-30} r={8} fill="#7E8696" />
                </g>
                <line x1={250} y1={1330} x2={250 + 140 * m} y2={1330} stroke={MERC} strokeWidth={10} strokeLinecap="round" />
                <line x1={250} y1={1390} x2={250 + 520 * m} y2={1390} stroke={C.gold} strokeWidth={10} strokeLinecap="round" />
              </svg>
            ) : null}
            {m > 0 ? <Pill x={440} y={970} text="MERCURIO" s={m} size={50} dark /> : null}
            <Pill x={820} y={940} text="VENUS" s={pop(f, S.mercurio + 4, fps)} size={50} />
            {f >= W(iMerc + 2) ? <Pill x={440} y={1480} text="más cerca del Sol" s={pop(f, W(iMerc + 2), fps)} size={50} rot={-2} /> : null}
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      }
      case "calor": {
        const p = ln(f, tCal - 4, t450 + 6, 0, 1, eio);
        const temp = Math.round(450 * p);
        return (
          <>
            <Space f={f} tint="#3A0E08" />
            <Venus x={330} y={1150} r={250} rot={f * 0.01} f={f} heat={p} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 6 }, (_, i) => {
                const k = ((f * 0.9 + i * 10) % 60) / 60;
                return <path key={i} d={`M${200 + i * 50} ${880 - 200 * k} q20 -20 0 -40 q-20 -20 0 -40`} stroke="#FF8A3D" strokeWidth={6} fill="none" opacity={(1 - k) * p} />;
              })}
            </svg>
            <Thermo x={820} y={1500} p={p} f={f} />
            <Pill x={820} y={640} text={`${temp} °C`} s={(1 + 0.15 * bump(f, t450 + 6)) * (1 + 0.03 * Math.sin(f * 0.5))} size={100} rot={2 * Math.sin(f * 0.15)} />
            <Sparks f={f} at={t450 + 6} x={820} y={760} n={22} color={C.red} spread={360} />
            {f >= tCal ? <Pill x={330} y={1520} text="el más caliente" s={pop(f, tCal, fps)} size={52} dark /> : null}
          </>
        );
      }
      case "plomo": {
        const melt = ln(f, tPlomo - 6, sceneEnd, 0, 1);
        return (
          <>
            <Surface f={f} heat={1} />
            <Ingot x={540} y={1440} melt={melt} f={f} />
            {f >= tPlomo ? <Pill x={540} y={760} text="el plomo se derrite a 327 °C" s={pop(f, tPlomo, fps)} size={48} dark rot={-2 + 2 * Math.sin(f * 0.2)} /> : null}
            <Sparks f={f} at={tPlomo + 4} x={540} y={1380} n={20} color="#FFB347" spread={300} />
          </>
        );
      }
      case "cta": {
        const typed = "Venus".slice(0, Math.max(0, Math.floor((f - tCta - 10) / 3)));
        const sent = f >= tCta + 40;
        return (
          <>
            <Studio f={f} tint="#3A2030" />
            <BigName text="Comentá" f={f} at={tCta} fps={fps} y={480} size={140} />
            <Venus x={540} y={1450} r={190} rot={f * 0.01} f={f} />
            <div style={{ position: "absolute", left: 90, top: 780, width: 900, height: 150, borderRadius: 40, background: "rgba(16,13,20,0.92)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", transform: `scale(${pop(f, tCta + 4, fps)})` }}>
              <div style={{ position: "absolute", left: 30, top: 35, width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${DIA})` }} />
              <div style={{ position: "absolute", left: 140, top: 38, fontFamily: PF, fontWeight: 800, fontSize: 64, color: sent ? C.gold : C.white }}>
                {typed}
                {!sent && Math.floor(f / 8) % 2 ? "|" : ""}
              </div>
              <div style={{ position: "absolute", right: 30, top: 35, width: 80, height: 80, borderRadius: "50%", background: sent ? C.green : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PF, fontWeight: 800, fontSize: 44, color: C.white }}>↑</div>
            </div>
            {sent ? <Pill x={540} y={1040} text="si no lo sabías 🤯" s={pop(f, tCta + 40, fps)} size={54} /> : null}
            <Tap x={930} y={860} f={f} from={tCta + 34} />
            {sent
              ? Array.from({ length: 6 }, (_, i) => {
                  const k = ((f - tCta - 40 + i * 6) % 36) / 36;
                  return <div key={i} style={{ position: "absolute", left: 860 + 40 * Math.sin(i * 2 + k * 6), top: 760 - 300 * k, fontSize: 54, opacity: 1 - k }}>❤️</div>;
                })
              : null}
            <Sparks f={f} at={tCta + 40} x={540} y={850} n={22} color={C.gold} spread={380} />
          </>
        );
      }
    }
  };

  // ---- cámara ----
  const impacts = [v === 1 ? tTimer + 60 : -99, v === 2 || v === 4 ? W(hk.ano) + 8 : -99, v === 3 ? W(hk.cumpl) : -99, v === 5 ? W(hk.oeste) : -99, t243 + 2, t225 + 4, tAno + 8, tReves, tOeste, tMerc, t450 + 6, tPlomo + 4, tCta + 40];
  const shake = impacts.reduce((a, at) => a + decay(f, at, 3), 0);
  const prog = ln(f, sceneStart, sceneEnd, 0, 1, eio);
  const hot = scenes[si][0] === "calor" || scenes[si][0] === "plomo" ? 1 : 0;
  const camX = 9 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.1) + shake * 10 * Math.sin(f * 2.7) + hot * 3 * Math.sin(f * 1.9);
  const camY = 7 * Math.sin(t * 1.05 + 1) + shake * 8 * Math.cos(f * 3.3);
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
  const heatHaze = hot ? 0.08 + 0.04 * Math.sin(f * 0.3) : 0;

  const hideCaps = f >= tCta;
  const transitionAts = scenes.slice(1).map(([, s]) => s);
  const popAts = [W(iVuelta), tReves, tOeste, tMerc - 2, tCal, tPlomo, tCta + 4, ...(v === 1 ? [W(hk.dia), W(hk.ano), W(hk.seg)] : []), ...(v === 3 ? [W(hk.termine)] : []), ...(v === 5 ? [W(hk.oeste)] : [])];

  return (
    <AbsoluteFill style={{ background: "#07060E", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "540px 1000px", transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${camS})` }}>
        {scenePrev ? <AbsoluteFill style={trPrev}>{scenePrev}</AbsoluteFill> : null}
        <AbsoluteFill style={trNow}>{sceneNow}</AbsoluteFill>
      </AbsoluteFill>
      {heatHaze > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(255,90,40,${heatHaze}) 0%, rgba(0,0,0,0) 70%)` }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFF6E6", opacity: flash * 0.85 }} /> : null}
      <Vignette />
      <Grain f={f} />
      {hideCaps ? null : <Subs words={words} f={f} fps={fps} />}

      <Audio src={staticFile(`audio/voz_venus_${v}.wav`)} />
      <Audio src={staticFile(`audio/musica_venus_${v}.wav`)} volume={0.22} />

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
      {v === 2 || v === 4 ? <Snd at={W(hk.ano) + 8} src={SOUND.impacto} vol={0.6} /> : null}
      {v === 3 ? <Snd at={W(hk.cumpl)} src={SOUND.impacto} vol={0.6} /> : null}
      {v === 5 ? <Snd at={W(hk.oeste)} src={SOUND.impacto} vol={0.6} /> : null}
      <Snd at={S.giro + 2} src={SOUND.tension} vol={0.25} />
      <Snd at={t243 + 2} src={SOUND.impacto} vol={0.55} />
      <Snd at={S.orbita + 2} src={SOUND.tiron} vol={0.35} />
      <Snd at={t225 + 4} src="sfx/hit.wav" vol={0.5} />
      <Snd at={tAno + 8} src={SOUND.impacto} vol={0.7} />
      <Snd at={tReves} src="sfx/rebobinar.wav" vol={0.4} />
      <Snd at={tOeste} src="sfx/cristal.wav" vol={0.35} />
      <Snd at={tMerc} src="sfx/hit.wav" vol={0.4} />
      <Snd at={tCal} src="sfx/fuego.wav" vol={0.35} />
      <Snd at={t450 + 6} src={SOUND.impacto} vol={0.7} />
      <Snd at={tPlomo} src="sfx/fuego.wav" vol={0.3} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Snd key={`k${i}`} at={tCta + 10 + i * 3} src="sfx/click.wav" vol={0.25} />
      ))}
      <Snd at={tCta + 40} src="sfx/pop.wav" vol={0.55} />
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const VenusPortada: React.FC<{ v?: number }> = ({ v = 1 }) => {
  const lines: Record<number, string[]> = {
    1: ["En Venus,", "¿qué dura más?", "¿Un día o un año?"],
    2: ["En Venus", "un día dura más", "que un año"],
    3: ["En Venus cumplirías", "años antes de que", "termine el día 🎂"],
    4: ["Gira tan lento", "que su día dura", "más que su año"],
    5: ["Acá el Sol", "sale por", "el oeste"],
  };
  const L = lines[v];
  return (
    <AbsoluteFill style={{ background: "#07060E" }}>
      <Space f={20} tint="#2A1410" />
      <Venus x={540} y={1300} r={360} rot={0.6} f={20} marker={v !== 3} />
      {v === 3 ? <Cake x={540} y={960} s={0.9} f={20} /> : null}
      <Vignette />
      <div style={{ position: "absolute", left: 30, width: 1020, top: 230, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: v === 3 ? 88 : 100, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.white, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>
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

