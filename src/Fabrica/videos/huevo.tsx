import React from "react";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-huevo-1.json";
import c2 from "../../data/captions-huevo-2.json";
import c3 from "../../data/captions-huevo-3.json";
import { SOUND } from "../../Altera/system";
import type { Ctx, Video } from "../Motor";
import { PF } from "../Motor";
import { Bokeh, C, CTASeguir, Dividida, Dust, Estampa, Label, Pill, PortadaTexto, PriceCard, Reto, Sparks, Stars, Studio, bump, decay, eio, eo, ln, pop, rnd } from "../kit";

// «¿Qué vino primero, el huevo o la gallina?» — Fábrica viral (2026-11-01). Investigación y fuentes:
// produccion/huevo/investigacion.md (Live Science, PopSci, Curious/Australian Academy of Science, PNAS 2022).
// Ilustraciones planas propias: gallina y pollito (2 patas), ave «casi gallina» (2 patas), dinosaurio de cuello largo
// (4 patas), paisaje prehistórico, arrozales, reloj de 24 h, podio, ADN dentro del huevo.

const SKY = "#7CC4FF";
const LILA = "#C9A0FF";
const PARDA = "#C8742E";

// ---------- ilustraciones ----------
const eggPath = (W: number, H: number) => `M0 ${-H} C${W * 0.62} ${-H} ${W} ${H * 0.1} ${W * 0.86} ${H * 0.45} C${W * 0.7} ${H * 0.95} ${-W * 0.7} ${H * 0.95} ${-W * 0.86} ${H * 0.45} C${-W} ${H * 0.1} ${-W * 0.62} ${-H} 0 ${-H} Z`;

/** Huevo: wob = tiembla, crack 0..1 = grieta, open 0..1 = se levanta la tapa (sale algo). */
const Huevo: React.FC<{ x: number; y: number; s?: number; f: number; tipo?: "gallina" | "dino" | "reptil"; wob?: number; crack?: number; open?: number; glow?: number }> = ({ x, y, s = 1, f, tipo = "gallina", wob = 0, crack = 0, open = 0, glow = 0 }) => {
  const W = tipo === "dino" ? 95 : tipo === "reptil" ? 70 : 78;
  const H = tipo === "dino" ? 130 : tipo === "reptil" ? 92 : 100;
  const fill = tipo === "dino" ? "#B9C7A6" : tipo === "reptil" ? "#F1EDE2" : "#E9B57F";
  const shade = tipo === "dino" ? "#8EA07A" : tipo === "reptil" ? "#D4CDBB" : "#C98B55";
  const r = wob * 6 * Math.sin(f * 1.3);
  const id = `eg${tipo}${Math.round(x)}${Math.round(y)}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="30%" stopColor={fill} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} style={{ filter: `drop-shadow(0 20px 20px rgba(0,0,0,0.4))${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(247,185,85,${0.8 * glow}))` : ""}` }}>
        <ellipse cx={0} cy={H * 0.95} rx={W * 0.9} ry={H * 0.12} fill="#000" opacity={0.25} />
        {open > 0 ? (
          <>
            <path d={eggPath(W, H)} fill={`url(#${id})`} clipPath={`inset(${H * 0.95}px 0 0 0)`} />
            <g transform={`translate(${W * 0.6 * open} ${-H * 0.9 * open}) rotate(${40 * open})`}>
              <path d={`M${-W * 0.86} ${-H * 0.05} L${-W * 0.5} ${-H * 0.2} L${-W * 0.2} ${0} L${W * 0.15} ${-H * 0.18} L${W * 0.5} ${0} L${W * 0.86} ${-H * 0.05} C${W} ${-H * 0.5} ${W * 0.62} ${-H} 0 ${-H} C${-W * 0.62} ${-H} ${-W} ${-H * 0.5} ${-W * 0.86} ${-H * 0.05} Z`} fill={fill} />
            </g>
            <path d={`M${-W * 0.86} ${-H * 0.05} L${-W * 0.5} ${-H * 0.2} L${-W * 0.2} ${0} L${W * 0.15} ${-H * 0.18} L${W * 0.5} ${0} L${W * 0.86} ${-H * 0.05} C${W} ${H * 0.4} ${W * 0.7} ${H * 0.95} 0 ${H * 0.95} C${-W * 0.7} ${H * 0.95} ${-W} ${H * 0.4} ${-W * 0.86} ${-H * 0.05} Z`} fill={`url(#${id})`} />
          </>
        ) : (
          <path d={eggPath(W, H)} fill={`url(#${id})`} />
        )}
        {tipo === "dino"
          ? Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={(rnd(i) - 0.5) * W * 1.2} cy={(rnd(i + 3) - 0.5) * H * 1.4} rx={6 + 6 * rnd(i + 5)} ry={4 + 4 * rnd(i + 7)} fill="#6E7E5C" opacity={0.6} />)
          : null}
        {crack > 0 && open <= 0 ? (
          <path d={`M${-W * 0.86} ${-H * 0.05} L${-W * 0.5} ${-H * 0.2} L${-W * 0.2} ${0} L${W * 0.15} ${-H * 0.18} L${W * 0.5} ${0} L${W * 0.86} ${-H * 0.05}`} fill="none" stroke="#5A3418" strokeWidth={6} strokeLinejoin="round" strokeDasharray={`${crack * 400} 400`} />
        ) : null}
      </g>
    </svg>
  );
};

/** Gallina de perfil (mira a la derecha): dos patas que caminan, cabeza que se mueve, picoteo. */
const Gallina: React.FC<{ x: number; y: number; s?: number; f: number; walk?: number; peck?: number; proto?: boolean; flip?: boolean; lit?: number }> = ({ x, y, s = 1, f, walk = 0, peck = 0, proto = false, flip = false, lit = 0 }) => {
  const body = proto ? "#B5482A" : PARDA;
  const wing = proto ? "#7A2A16" : "#8E4A1E";
  const tail = proto ? "#1E3A2A" : "#3A2A1E";
  const sw = walk * Math.sin(f * 0.45);
  const bob = 4 * Math.sin(f * 0.3) + (walk > 0 ? 3 * Math.abs(Math.sin(f * 0.45)) : 0);
  const pk = peck * Math.max(0, Math.sin(f * 0.35));
  const leg = (dx: number, a: number, back: boolean) => (
    <g transform={`translate(${dx} -46) rotate(${a})`} opacity={back ? 0.8 : 1}>
      <line x1={0} y1={0} x2={0} y2={46} stroke="#E8A13A" strokeWidth={12} strokeLinecap="round" />
      <path d="M0 46 l24 4 M0 46 l16 -8 M0 46 l-14 4" stroke="#E8A13A" strokeWidth={7} strokeLinecap="round" />
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`} style={lit > 0 ? { filter: `drop-shadow(0 0 ${20 * lit}px rgba(255,138,61,${0.8 * lit}))` } : { filter: "drop-shadow(0 14px 14px rgba(0,0,0,0.35))" }}>
        <ellipse cx={0} cy={4} rx={70} ry={10} fill="#000" opacity={0.25} />
        {leg(-14, 18 * sw, true)}
        <g transform={`translate(0 ${-bob})`}>
          {/* cola */}
          <path d={proto ? "M-70 -110 C-150 -230 -190 -130 -170 -70 C-140 -100 -110 -100 -78 -90 Z" : "M-74 -104 C-130 -190 -150 -120 -138 -82 C-114 -100 -96 -96 -76 -88 Z"} fill={tail} />
          {/* cuerpo: redondo y bajo */}
          <path d="M-86 -96 C-92 -160 -10 -176 44 -150 C92 -128 92 -70 46 -50 C0 -32 -82 -44 -86 -96 Z" fill={body} />
          <path d="M-60 -60 C-20 -40 30 -40 60 -60" stroke={wing} strokeWidth={6} fill="none" opacity={0.5} />
          {/* ala */}
          <path d={`M-52 -112 C-16 ${-138 - 6 * Math.sin(f * 0.5)} 34 -124 40 -98 C10 -78 -34 -80 -52 -112 Z`} fill={wing} />
          {/* cuello corto y cabeza (picotea) */}
          <g transform={`rotate(${32 * pk} 46 -132)`}>
            <path d="M28 -140 C40 -160 48 -172 58 -178 L82 -164 C76 -150 66 -132 54 -118 Z" fill={body} />
            <circle cx={68} cy={-180} r={28} fill={body} />
            <path d="M50 -204 q7 -20 14 -3 q7 -20 14 -3 q7 -18 12 2 Z" fill="#E0322A" />
            <path d="M94 -184 L118 -176 L94 -168 Z" fill="#F2B233" />
            <path d="M92 -166 q8 16 -4 22 q-10 -4 -5 -20 Z" fill="#E0322A" />
            <circle cx={78} cy={-186} r={5} fill="#111" />
          </g>
        </g>
        {leg(12, -18 * sw, false)}
      </g>
    </svg>
  );
};

/** Pollito amarillo (2 patas). */
const Pollito: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y + -4 * Math.abs(Math.sin(f * 0.4))}) scale(${s})`}>
      <line x1={-10} y1={-20} x2={-12} y2={0} stroke="#E8A13A" strokeWidth={6} strokeLinecap="round" />
      <line x1={10} y1={-20} x2={12} y2={0} stroke="#E8A13A" strokeWidth={6} strokeLinecap="round" />
      <circle cx={0} cy={-52} r={36} fill="#FFD84A" />
      <circle cx={22} cy={-92} r={24} fill="#FFD84A" />
      <path d="M44 -94 L58 -90 L44 -86 Z" fill="#F28C28" />
      <circle cx={30} cy={-97} r={4} fill="#111" />
      <path d={`M-20 -60 q-20 ${-10 + 8 * Math.sin(f * 0.8)} -30 4`} stroke="#F2C23A" strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

/** Dinosaurio de cuello largo (cuatro patas: dos lejanas más oscuras). */
const Dino: React.FC<{ x: number; y: number; s?: number; f: number; walk?: number }> = ({ x, y, s = 1, f, walk = 1 }) => {
  const sw = walk * Math.sin(f * 0.18);
  const pata = (dx: number, a: number, col: string) => (
    <g transform={`translate(${dx} -150) rotate(${a})`}>
      <rect x={-22} y={0} width={44} height={150} rx={18} fill={col} />
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx={0} cy={6} rx={200} ry={20} fill="#000" opacity={0.25} />
        {pata(-90, 10 * sw, "#2F5A3A")}
        {pata(110, -10 * sw, "#2F5A3A")}
        <path d={`M-150 -220 C-260 -230 -360 -150 -420 ${-110 + 10 * Math.sin(f * 0.1)} C-350 -150 -260 -180 -150 -170 Z`} fill="#4E8A5A" />
        <ellipse cx={0} cy={-210} rx={175} ry={92} fill="#4E8A5A" />
        <path d="M-120 -250 C-60 -290 60 -290 120 -250" stroke="#6AAE76" strokeWidth={18} fill="none" strokeLinecap="round" opacity={0.6} />
        <g transform={`rotate(${3 * Math.sin(f * 0.12)} 130 -250)`}>
          <path d="M110 -270 C170 -320 210 -420 260 -470 L300 -450 C260 -400 210 -300 160 -220 Z" fill="#4E8A5A" />
          <ellipse cx={300} cy={-470} rx={46} ry={26} fill="#4E8A5A" />
          <circle cx={312} cy={-478} r={5} fill="#111" />
          <path d="M330 -462 q10 4 14 0" stroke="#2F5A3A" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
        {pata(-60, -10 * sw, "#4E8A5A")}
        {pata(140, 10 * sw, "#4E8A5A")}
      </g>
    </svg>
  );
};

const Prehistoria: React.FC<{ f: number }> = ({ f }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #2A1E3A 0%, #8A3E3A 40%, #E07A44 62%, #F2A65A 74%)" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d="M-40 1220 L180 980 L300 1080 L460 900 L640 1100 L820 960 L1120 1220 Z" fill="#5A2E3A" opacity={0.7} />
      <path d="M560 1240 L760 860 L800 860 L1000 1240 Z" fill="#2A1A20" />
      <path d="M760 860 Q780 830 800 860" stroke="#FF6A2B" strokeWidth={14} fill="none" opacity={0.7 + 0.3 * Math.sin(f * 0.4)} />
      {Array.from({ length: 7 }, (_, i) => {
        const k = ((f * 0.7 + i * 17) % 120) / 120;
        return <circle key={i} cx={780 + 40 * Math.sin(i * 2 + f * 0.03) + 120 * k} cy={840 - 420 * k} r={30 + 70 * k} fill="#4A3A40" opacity={0.5 * (1 - k)} />;
      })}
      <path d="M-40 1240 C300 1200 700 1260 1120 1220 L1120 1920 L-40 1920 Z" fill="#3A2A1E" />
      {Array.from({ length: 9 }, (_, i) => {
        const bx = 40 + i * 125;
        const by = 1250 + (i % 2) * 40;
        const a = 8 * Math.sin(f * 0.08 + i);
        return (
          <g key={i} transform={`translate(${bx} ${by}) rotate(${a})`}>
            {Array.from({ length: 6 }, (_, j) => (
              <path key={j} d={`M0 0 Q${(j - 2.5) * 30} ${-90 - 20 * (j % 2)} ${(j - 2.5) * 60} ${-150 + 20 * Math.abs(j - 2.5)}`} stroke="#2E5A2E" strokeWidth={14} fill="none" strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </svg>
    <Dust f={f} x0={0} x1={1080} y0={700} y1={1600} n={26} color="#FFD8A0" />
  </>
);

const Arrozal: React.FC<{ f: number }> = ({ f }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #8EC5E8 0%, #F6D8A0 48%, #F7C27A 60%)" }} />
    <div style={{ position: "absolute", left: 700, top: 820, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, #FFF6D0 0%, #FFD36A 50%, rgba(255,211,106,0) 72%)", transform: `scale(${1 + 0.04 * Math.sin(f * 0.2)})` }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d="M-40 1120 C300 1080 700 1130 1120 1100 L1120 1920 L-40 1920 Z" fill="#5E9A4A" />
      {Array.from({ length: 6 }, (_, i) => {
        const y = 1150 + i * 110;
        return (
          <g key={i}>
            <path d={`M-40 ${y} C300 ${y - 30} 700 ${y + 20} 1120 ${y - 10} L1120 ${y + 80} L-40 ${y + 80} Z`} fill={i % 2 ? "#7DB85A" : "#6AA84E"} />
            <path d={`M-40 ${y + 40} C300 ${y + 10} 700 ${y + 60} 1120 ${y + 30}`} stroke="#BFE3F2" strokeWidth={6} fill="none" opacity={0.4 + 0.2 * Math.sin(f * 0.2 + i)} strokeDasharray="40 30" strokeDashoffset={-f * 1.5} />
          </g>
        );
      })}
      <g transform="translate(160 1070)">
        <path d="M-70 0 L0 -80 L70 0 Z" fill="#6A4A2A" />
        <rect x={-50} y={0} width={100} height={60} fill="#8A6A3A" />
        <rect x={-14} y={20} width={28} height={40} fill="#3A2A1A" />
      </g>
      {[880, 980].map((px, i) => (
        <g key={i} transform={`translate(${px} 1100) rotate(${3 * Math.sin(f * 0.1 + i)})`}>
          <rect x={-6} y={-180} width={12} height={180} fill="#5A3A1E" />
          {Array.from({ length: 5 }, (_, j) => (
            <path key={j} d={`M0 -180 q${(j - 2) * 40} -30 ${(j - 2) * 70} 10`} stroke="#3E7A3A" strokeWidth={14} fill="none" strokeLinecap="round" />
          ))}
        </g>
      ))}
    </svg>
  </>
);

/** Reloj de 24 h: la aguja da una vuelta (prog 0..1) y la hora digital llega a 23:59:59. */
const Reloj24: React.FC<{ f: number; prog: number; galloAt: number; fps: number }> = ({ f, prog, galloAt, fps }) => {
  const cx = 540;
  const cy = 1120;
  const R = 330;
  const secs = Math.min(86399, Math.round(86399 * prog));
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const a = prog * 2 * Math.PI - Math.PI / 2;
  const g = f >= galloAt ? pop(f, galloAt, fps) : 0;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={R + 30} fill="rgba(16,13,20,0.85)" stroke="#FFFFFF" strokeWidth={10} />
        {prog > 0.995 ? (
          <circle cx={cx} cy={cy} r={R} stroke={C.gold} strokeWidth={22} fill="none" opacity={0.85} style={{ filter: "drop-shadow(0 0 12px rgba(247,185,85,0.8))" }} />
        ) : (
          <path d={`M${cx} ${cy - R} A${R} ${R} 0 ${prog > 0.5 ? 1 : 0} 1 ${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}`} stroke={C.gold} strokeWidth={22} fill="none" strokeLinecap="round" opacity={0.85} style={{ filter: "drop-shadow(0 0 12px rgba(247,185,85,0.8))" }} />
        )}
        {Array.from({ length: 24 }, (_, i) => {
          const t = (i / 24) * 2 * Math.PI - Math.PI / 2;
          return <line key={i} x1={cx + (R - 20) * Math.cos(t)} y1={cy + (R - 20) * Math.sin(t)} x2={cx + (R - (i % 6 === 0 ? 60 : 40)) * Math.cos(t)} y2={cy + (R - (i % 6 === 0 ? 60 : 40)) * Math.sin(t)} stroke="#FFFFFF" strokeWidth={i % 6 === 0 ? 8 : 4} opacity={0.8} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const t = (h / 24) * 2 * Math.PI - Math.PI / 2;
          return (
            <text key={h} x={cx + (R - 100) * Math.cos(t)} y={cy + (R - 100) * Math.sin(t) + 14} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={40} fill="rgba(255,255,255,0.75)">
              {h}
            </text>
          );
        })}
        <line x1={cx} y1={cy} x2={cx + (R - 30) * Math.cos(a)} y2={cy + (R - 30) * Math.sin(a)} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={18} fill={C.gold} />
      </svg>
      <div style={{ position: "absolute", left: 340, width: 400, top: cy + 70, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 70, color: secs >= 86399 ? SKY : C.white, fontVariantNumeric: "tabular-nums", textShadow: secs >= 86399 ? `0 0 26px ${SKY}` : undefined }}>
        {hh}:{mm}:{ss}
      </div>
      <Huevo x={cx} y={cy - R - 120} s={0.6} f={f} />
      {g > 0 ? <Gallina x={cx - 150} y={cy - R - 40} s={0.75 * g} f={f} lit={decay(f, galloAt, 12)} /> : null}
    </>
  );
};

/** ADN dentro del huevo (corte): la hélice cambia de color en `cambio`. */
const Adn: React.FC<{ f: number; cambio: number }> = ({ f, cambio }) => {
  const cx = 540;
  const cy = 1120;
  const col = cambio > 0 ? `rgb(${Math.round(247 + 8 * cambio)},${Math.round(185 - 47 * cambio)},${Math.round(85 - 24 * cambio)})` : C.gold;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) scale(3.4)`}>
        <path d={eggPath(78, 100)} fill="#FBF3E2" stroke="#E9B57F" strokeWidth={4} />
        <circle cx={0} cy={18} r={52} fill="#F6C25A" opacity={0.85} />
      </g>
      {Array.from({ length: 18 }, (_, i) => {
        const yy = cy - 120 + i * 16;
        const ph = f * 0.12 + i * 0.5;
        const x1 = cx + 70 * Math.sin(ph);
        const x2 = cx - 70 * Math.sin(ph);
        return (
          <g key={i}>
            <line x1={x1} y1={yy + 40} x2={x2} y2={yy + 40} stroke={col} strokeWidth={4} opacity={0.7} />
            <circle cx={x1} cy={yy + 40} r={9} fill={col} style={{ filter: cambio > 0 ? `drop-shadow(0 0 ${10 * cambio}px ${col})` : undefined }} />
            <circle cx={x2} cy={yy + 40} r={9} fill="#FFF6E0" />
          </g>
        );
      })}
    </svg>
  );
};

const Podio: React.FC<{ f: number; fps: number; at: number }> = ({ f, fps, at }) => {
  const p = pop(f, at, fps);
  return (
    <>
      <div style={{ position: "absolute", left: 360, top: 1180 + 200 * (1 - p), width: 360, height: 520, background: `linear-gradient(180deg, ${C.gold}, #B9822C)`, borderRadius: "20px 20px 0 0", boxShadow: "0 0 40px rgba(247,185,85,0.5)" }}>
        <div style={{ textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 160, color: "#5A3A10", marginTop: 40 }}>1</div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 1380 + 200 * (1 - p), width: 300, height: 320, background: "linear-gradient(180deg, #D8DCE6, #8E94A6)", borderRadius: "20px 20px 0 0" }}>
        <div style={{ textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 120, color: "#3A3E4A", marginTop: 20 }}>2</div>
      </div>
      <Huevo x={540} y={1060 + 200 * (1 - p)} s={1.1} f={f} glow={0.6 + 0.3 * Math.sin(f * 0.3)} />
      <Gallina x={190} y={1380 + 200 * (1 - p)} s={0.9} f={f} peck={0.4} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {f >= at
          ? Array.from({ length: 40 }, (_, i) => {
              const k = f - at;
              const x = 540 + (rnd(i) - 0.5) * 1100 + 30 * Math.sin(k * 0.2 + i);
              const y = 500 + ((k * (6 + 6 * rnd(i + 2)) + rnd(i + 4) * 600) % 1300);
              return <rect key={i} x={x} y={y} width={14} height={24} fill={[C.gold, C.orange, C.green, SKY, LILA][i % 5]} transform={`rotate(${k * 9 + i * 20} ${x + 7} ${y + 12})`} />;
            })
          : null}
      </svg>
    </>
  );
};

// ---------- el video ----------
const ib = (c: Ctx) => c.i("depende");

export const huevo: Video = {
  slug: "huevo",
  titulo: "¿El huevo o la gallina?",
  captions: [c1, c2, c3] as Caption[][],
  colores: [
    [/^(huevo|huevos)$/i, C.gold],
    [/^(gallina|gallinas|ave)$/i, C.orange],
    [/^(dinosaurios)$/i, C.green],
    [/^(día|último|segundo)$/i, SKY],
    [/^(cambio|adentro)$/i, LILA],
    [/^(respuesta|tiene)$/i, C.green],
  ],

  gancho: (c) => {
    const { f, fps, v } = c;
    if (v === 1) {
      const seg = c.i("2");
      return (
        <>
          <Dividida
            f={f}
            corte={[56, 44]}
            izq={
              <>
                <Prehistoria f={f} />
                <Huevo x={290} y={1180} s={1.6} f={f} wob={1} />
              </>
            }
            der={
              <>
                <Arrozal f={f} />
                <Gallina x={800} y={1330} s={1.5} f={f} peck={0.6} flip />
              </>
            }
          />
          {f >= c.w("huevo") ? <Pill x={280} y={760} text="HUEVO" s={pop(f, c.w("huevo"), fps)} size={66} rot={-3} /> : null}
          {f >= c.w("gallina") ? <Pill x={800} y={760} text="GALLINA" s={pop(f, c.w("gallina"), fps)} size={66} rot={3} dark /> : null}
          <Reto f={f} fps={fps} aparece={c.W(seg)} desde={c.E(seg) + 2} y={1560} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 2) {
      const t300 = c.w("300");
      const count = ln(f, 0, t300 + 4, 0, 300000000, eio);
      return (
        <>
          <Prehistoria f={f} />
          <Huevo x={340} y={1300} s={1.3} f={f} wob={0.6} glow={0.5 + 0.3 * Math.sin(f * 0.3)} />
          <Gallina x={760} y={1440} s={1.2} f={f} peck={0.5} flip />
          <PriceCard x={540} y={720} label="LA RESPUESTA TIENE" value={`${Math.round(count).toLocaleString("es-AR")} años`} s={(1 + 0.08 * bump(f, t300 + 4)) * (1 + 0.015 * Math.sin(f * 0.4))} glow={decay(f, t300 + 4, 10) + 0.2} money={false} rot={1.2 * Math.sin(f * 0.12)} />
          <Sparks f={f} at={t300 + 4} x={540} y={720} n={20} color={C.gold} spread={380} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    // v3: el círculo «sin respuesta» y el sello «TIENE RESPUESTA»
    const tPero = c.w("pero");
    const ang = f * 0.06;
    return (
      <>
        <Studio f={f} tint="#2A2238" />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={540} cy={1150} r={300} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeDasharray="30 22" strokeDashoffset={-f * 4} />
          {[0, Math.PI].map((o, i) => (
            <path key={i} d={`M${540 + 300 * Math.cos(ang + o + 0.6)} ${1150 + 300 * Math.sin(ang + o + 0.6)} l-30 -10 l10 30 Z`} fill="rgba(255,255,255,0.6)" transform={`rotate(${((ang + o + 0.6) * 180) / Math.PI + 90} ${540 + 300 * Math.cos(ang + o + 0.6)} ${1150 + 300 * Math.sin(ang + o + 0.6)})`} />
          ))}
        </svg>
        <Huevo x={540 + 300 * Math.cos(ang)} y={1150 + 300 * Math.sin(ang)} s={0.9} f={f} />
        <Gallina x={540 + 300 * Math.cos(ang + Math.PI)} y={1230 + 300 * Math.sin(ang + Math.PI)} s={0.8} f={f} />
        <div style={{ position: "absolute", left: 340, width: 400, top: 1060, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 150, color: "rgba(255,255,255,0.85)", transform: `scale(${1 + 0.12 * Math.sin(f * 0.25)})`, textShadow: "0 0 30px rgba(255,255,255,0.4)" }}>?</div>
        <Estampa f={f} fps={fps} at={tPero + 4} texto="TIENE RESPUESTA" color={C.green} y={1150} />
        <Label text="ILUSTRACIÓN" x={72} y={1780} />
      </>
    );
  },

  escenas: [
    {
      id: "trampa",
      desde: (c) => c.W(ib(c)) - 3,
      dibujar: (c) => {
        const t = c.inicio;
        return (
          <>
            <Studio f={c.f} tint="#2A1E30" />
            {[
              { x: 220, tipo: "dino" as const, lab: "DINOSAURIO", d: 2 },
              { x: 540, tipo: "reptil" as const, lab: "REPTIL", d: 8 },
              { x: 860, tipo: "gallina" as const, lab: "GALLINA", d: 14 },
            ].map((h) => {
              const p = c.f >= t + h.d ? pop(c.f, t + h.d, c.fps) : 0;
              return (
                <React.Fragment key={h.lab}>
                  {p > 0 ? <Huevo x={h.x} y={1150} s={1.2 * p} f={c.f} tipo={h.tipo} wob={0.4} /> : null}
                  {p > 0 ? <Pill x={h.x} y={1390} text={h.lab} s={p * 0.75} size={44} dark /> : null}
                </React.Fragment>
              );
            })}
            <div style={{ position: "absolute", left: 440, width: 200, top: 700 + 20 * Math.abs(Math.sin(c.f * 0.3)), textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 180, color: C.gold, textShadow: "0 0 30px rgba(247,185,85,0.7)", transform: `scale(${pop(c.f, t + 4, c.fps)})` }}>?</div>
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "prehistoria",
      desde: (c) => c.w("hace", ib(c)) - 2,
      dibujar: (c) => {
        const t300 = c.w("300", ib(c));
        return (
          <>
            <Prehistoria f={c.f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <ellipse cx={540} cy={1440} rx={240} ry={70} fill="#6A4A2A" />
              <ellipse cx={540} cy={1420} rx={200} ry={50} fill="#8A6A3A" />
            </svg>
            {[420, 540, 660].map((x, i) => (
              <Huevo key={x} x={x} y={1360 - (i === 1 ? 20 : 0)} s={0.8} f={c.f} tipo="reptil" wob={0.5} />
            ))}
            {c.f >= t300 - 2 ? <Pill x={540} y={760} text="hace +300 millones de años" s={pop(c.f, t300 - 2, c.fps) * (1 + 0.1 * bump(c.f, t300 + 4))} size={60} rot={2 * Math.sin(c.f * 0.15)} /> : null}
            <Sparks f={c.f} at={t300 + 4} x={540} y={1300} n={18} color={C.gold} spread={320} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "dinos",
      desde: (c) => c.w("los", ib(c)) - 2,
      dibujar: (c) => (
        <>
          <Prehistoria f={c.f} />
          <Dino x={ln(c.f, c.inicio, c.fin + 20, 980, 520)} y={1400} s={1.05} f={c.f} />
          {[180, 280].map((x, i) => (
            <Huevo key={x} x={x} y={1500 - i * 10} s={0.75} f={c.f} tipo="dino" wob={0.5} />
          ))}
          {c.f >= c.w("dinosaurios", ib(c)) ? <Pill x={540} y={760} text="los dinosaurios ponían huevos" s={pop(c.f, c.w("dinosaurios", ib(c)), c.fps)} size={52} dark /> : null}
          <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
        </>
      ),
    },
    {
      id: "gallinas",
      desde: (c) => c.w("las", ib(c)) - 2,
      dibujar: (c) => {
        const t35 = c.w("3500", ib(c));
        const walkIn = ln(c.f, c.inicio, c.inicio + 30, 0, 1, eo);
        return (
          <>
            <Arrozal f={c.f} />
            <Gallina x={1200 - 650 * walkIn} y={1460} s={1.6} f={c.f} walk={1 - ln(c.f, c.inicio + 26, c.inicio + 32)} peck={walkIn >= 1 ? 0.7 : 0} flip />
            {c.f >= t35 - 2 ? <Pill x={540} y={760} text="hace unos 3.500 años" s={pop(c.f, t35 - 2, c.fps) * (1 + 0.1 * bump(c.f, t35 + 4))} size={70} rot={2 * Math.sin(c.f * 0.15)} /> : null}
            <Label text="PRIMERAS GALLINAS DOMÉSTICAS: TAILANDIA (PNAS 2022) · ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "reloj",
      desde: (c) => c.w("si", ib(c)) - 2,
      dibujar: (c) => {
        const tUlt = c.w("último", ib(c));
        const prog = ln(c.f, c.inicio + 4, tUlt, 0, 1, Easing01);
        return (
          <>
            <Studio f={c.f} tint="#1E2238" />
            <Stars f={c.f} n={50} h={1900} />
            <Reloj24 f={c.f} prog={prog} galloAt={c.w("segundo", ib(c))} fps={c.fps} />
            {c.f >= c.w("segundo", ib(c)) ? <Pill x={540} y={1600} text="la gallina: el último segundo" s={pop(c.f, c.w("segundo", ib(c)), c.fps)} size={50} /> : null}
            <Sparks f={c.f} at={c.w("segundo", ib(c))} x={390} y={740} n={22} color={C.orange} spread={300} />
          </>
        );
      },
    },
    {
      id: "casi",
      desde: (c) => c.W(c.i("huevo", c.i("segundo", ib(c))) - 2) - 2, // «¿Y el huevo de gallina?»
      dibujar: (c) => {
        const iPrim = c.i("primera", ib(c));
        const tSalio = c.w("salió", iPrim);
        const tAve = c.w("ave", iPrim);
        const crack = ln(c.f, tSalio - 10, tSalio, 0, 1);
        const open = ln(c.f, tSalio, tSalio + 10, 0, 1, eo);
        return (
          <>
            <Arrozal f={c.f} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(20,10,20,0.25)" }} />
            <Gallina x={300} y={1460} s={1.5} f={c.f} proto lit={ln(c.f, tAve, tAve + 8)} peck={0.3} />
            <Huevo x={720} y={1380} s={1.3} f={c.f} wob={c.f < tSalio ? 1 : 0} crack={crack} open={open} />
            {open > 0.3 ? <Pollito x={720} y={1440 - 60 * open} s={1.2 * open} f={c.f} /> : null}
            {c.f >= tAve ? <Pill x={300} y={1060} text="CASI GALLINA" s={pop(c.f, tAve, c.fps)} size={56} rot={-3} /> : null}
            {c.f >= tSalio ? <Pill x={760} y={1060} text="1.ª GALLINA" s={pop(c.f, tSalio, c.fps)} size={56} rot={3} dark /> : null}
            <Sparks f={c.f} at={tSalio} x={720} y={1300} n={20} color="#FFD84A" spread={300} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "adn",
      desde: (c) => c.w("el", c.i("gallina", c.i("ave", ib(c)))) - 2,
      dibujar: (c) => {
        const tCambio = c.w("cambio", c.i("ave", ib(c)));
        return (
          <>
            <Studio f={c.f} tint="#2A1A3A" />
            <Adn f={c.f} cambio={ln(c.f, tCambio, tCambio + 10)} />
            {c.f >= tCambio ? <Pill x={540} y={700} text="el cambio, adentro del huevo" s={pop(c.f, tCambio, c.fps)} size={54} dark /> : null}
            <Sparks f={c.f} at={tCambio + 2} x={540} y={1120} n={22} color={LILA} spread={360} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "gano",
      desde: (c) => c.w("o", c.i("cambio", ib(c))) - 2,
      dibujar: (c) => {
        const tGano = c.w("ganó", ib(c));
        return (
          <>
            <Studio f={c.f} tint="#3A2A10" />
            <Bokeh f={c.f} color="#FFD27A" seed={5} n={12} />
            <Podio f={c.f} fps={c.fps} at={c.inicio + 2} />
            <Estampa f={c.f} fps={c.fps} at={tGano + 4} texto="GANÓ EL HUEVO" color={C.gold} y={760} />
          </>
        );
      },
    },
    {
      id: "cta",
      subtitulos: false,
      desde: (c) => c.w("seguime"),
      dibujar: (c) => (
        <CTASeguir
          f={c.f}
          fps={c.fps}
          at={c.inicio}
          tarjeta={{ etiqueta: "MÁS PREGUNTAS", texto: <>que parecen <span style={{ color: C.gold }}>imposibles</span></>, desde: c.w("preguntas", c.inicio > 0 ? c.i("seguime") : 0) - 4 }}
          abajo={
            <>
              <Huevo x={420} y={1460} s={0.9} f={c.f} glow={0.6} />
              <Gallina x={700} y={1560} s={0.95} f={c.f} peck={0.5} flip />
            </>
          }
        />
      ),
    },
  ],

  impactos: (c) => {
    const b = ib(c);
    const g = c.v === 1 ? c.E(c.i("2")) + 62 : c.v === 2 ? c.w("300") + 4 : c.w("pero") + 4;
    return [g, c.w("300", b) + 4, c.w("3500", b) + 4, c.w("segundo", b), c.w("salió", b), c.w("cambio", b) + 2, c.w("ganó", b) + 4];
  },
  pops: (c) => {
    const b = ib(c);
    const out = [c.W(b) + 2, c.W(b) + 8, c.W(b) + 14, c.w("300", b) - 2, c.w("dinosaurios", b), c.w("3500", b) - 2, c.w("ave", b), c.w("cambio", b)];
    if (c.v === 1) out.push(c.w("huevo"), c.w("gallina"), c.W(c.i("2")));
    return out;
  },
  sfx: (c) => {
    const b = ib(c);
    const out = [
      { at: c.w("300", b) + 4, src: SOUND.impacto, vol: 0.55 },
      { at: c.w("dinosaurios", b), src: "sfx/boom.wav", vol: 0.12 },
      { at: c.w("3500", b) + 4, src: "sfx/hit.wav", vol: 0.5 },
      { at: c.w("si", b), src: SOUND.tension, vol: 0.3 },
      { at: c.w("segundo", b), src: SOUND.impacto, vol: 0.7 },
      { at: c.w("salió", b) - 10, src: "sfx/cristal.wav", vol: 0.35 },
      { at: c.w("salió", b), src: "sfx/pop.wav", vol: 0.5 },
      { at: c.w("cambio", b) + 2, src: SOUND.tiron, vol: 0.4 },
      { at: c.w("ganó", b) + 4, src: SOUND.impacto, vol: 0.75 },
      { at: c.w("seguime") + 4, src: "sfx/pop.wav", vol: 0.5 },
      ...[0, 1, 2, 3].map((k) => ({ at: c.w("seguime") + 16 + k * 24, src: "sfx/click.wav", vol: 0.3 })),
    ];
    if (c.v === 1) {
      const t0 = c.E(c.i("2")) + 2;
      out.push(...[0, 15, 30, 45].map((k) => ({ at: t0 + k, src: "sfx/click.wav", vol: 0.45 })), { at: t0 + 60, src: SOUND.impacto, vol: 0.6 });
    } else if (c.v === 2) {
      out.push({ at: c.w("300") + 4, src: SOUND.impacto, vol: 0.6 });
    } else {
      out.push({ at: c.w("pero") + 4, src: SOUND.impacto, vol: 0.7 });
    }
    return out;
  },

  portada: (v) => (
    <PortadaTexto
      lineas={v === 2 ? ["Una respuesta de", "300 millones", "de años"] : v === 3 ? ["¿El huevo o", "la gallina?", "Tiene respuesta"] : ["¿Qué vino", "primero?", "¿Huevo o gallina?"]}
      fondo={
        <Dividida
          f={20}
          corte={[56, 44]}
          izq={
            <>
              <Prehistoria f={20} />
              <Huevo x={290} y={1180} s={1.6} f={20} />
            </>
          }
          der={
            <>
              <Arrozal f={20} />
              <Gallina x={800} y={1330} s={1.5} f={20} flip />
            </>
          }
        />
      }
    />
  ),
};

function Easing01(x: number) {
  // rápido al principio y lento al final: los últimos segundos del día se ven pasar
  return 1 - Math.pow(1 - x, 3.2);
}
