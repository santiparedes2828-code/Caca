import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Defs, FONT, Sarten, Vapor, pop, rnd } from "./Huevos";
import { Libro, Marca, Reloj } from "./RecetaVideo";

// Video 2 del recetario (20,5 s): «Quesadilla de jamón y queso», receta de EJEMPLO inventada.
// Cambios respecto del video 1 (27 s), pensados a partir de revisarlo (no hay métricas de esa cuenta):
// - más corto; - el plano más llamativo (el queso estirándose) va en el fotograma 0, no al final;
// - no se cuenta la receta dos veces (el video 1 la mostraba acelerada y después explicada);
// - cada frase se ve escrita cuando se oye; - el final vuelve al plano del principio (bucle).
// Audio: public/ebook/quesadilla_mezcla.wav (produccion/ebook, ffmpeg). Tiempos de la voz (Scribe) abajo.

export const QUESADILLA_FRAMES = Math.round(20.5 * 30);

const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

const T = {
  ingredientes: 2.62, // «Tortilla 2,79 · jamón 3,59 · queso 4,23»
  armado: 4.95, // «Queso 5,0 · jamón 5,68 · más queso 6,6 · y doblás 7,72»
  doblar: 7.72,
  sarten: 8.65, // «Dos minutos por lado» 8,84–9,96; chisporroteo 8,65–11,65
  vuelta: 9.75,
  corte: 10.4, // «Cortás…» 10,55; el riser sube hasta 11,9
  revela: 11.9, // golpe; «y mirá esto» 11,95–13,1
  libro: 13.4, // «Treinta y cinco recetas así de fáciles, en mi ebook» 13,54–17,14
  cta: 17.25, // «Escribime por DM y te lo paso» 17,37–19,4
  fin: 20.5,
};

// ---------- dibujos ----------
export const QDefs: React.FC = () => (
  <defs>
    <radialGradient id="tortilla" cx="0.45" cy="0.4" r="0.65">
      <stop offset="0" stopColor="#FBEBC8" />
      <stop offset="0.8" stopColor="#F0D49E" />
      <stop offset="1" stopColor="#D9B377" />
    </radialGradient>
    <linearGradient id="dorada" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#F4C978" />
      <stop offset="0.6" stopColor="#E3A651" />
      <stop offset="1" stopColor="#B97A30" />
    </linearGradient>
    <radialGradient id="jamon" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stopColor="#FFC2BE" />
      <stop offset="0.7" stopColor="#F29A98" />
      <stop offset="1" stopColor="#D97474" />
    </radialGradient>
    <linearGradient id="quesoDerretido" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE38A" />
      <stop offset="1" stopColor="#F6B92B" />
    </linearGradient>
    <linearGradient id="quesoBloque" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFE58F" />
      <stop offset="1" stopColor="#F2B530" />
    </linearGradient>
  </defs>
);

export const Mesa: React.FC = () => (
  <>
    <rect width={1080} height={1920} fill="url(#madera)" />
    <rect width={1080} height={1920} fill="#fff" filter="url(#grano)" />
    {Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} y1={160 + i * 330} x2={1080} y2={150 + i * 330} stroke="#9A5E2C" strokeWidth={5} opacity={0.5} />)}
    <radialGradient id="focoQ" cx="0.5" cy="0.55" r="0.65">
      <stop offset="0.5" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#2A1206" stopOpacity="0.5" />
    </radialGradient>
    <rect width={1080} height={1920} fill="url(#focoQ)" />
  </>
);

export const Tablita: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g filter="url(#sombra)">
    <ellipse cx={cx} cy={cy + 22} rx={r} ry={r * 0.86} fill="url(#maderaCanto)" />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.86} fill="#E9B97C" />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.86} fill="#fff" filter="url(#grano)" opacity={0.8} />
    <ellipse cx={cx} cy={cy} rx={r * 0.96} ry={r * 0.82} fill="none" stroke="#F6D3A0" strokeWidth={6} opacity={0.6} />
  </g>
);

const Manchitas: React.FC<{ cx: number; cy: number; rx: number; ry: number; n: number; seed: number; color: string; clip?: string }> = ({ cx, cy, rx, ry, n, seed, color, clip }) => (
  <g clipPath={clip}>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(seed + i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + i + 50)) * 0.92;
      return <ellipse key={i} cx={cx + Math.cos(a) * rx * d} cy={cy + Math.sin(a) * ry * d} rx={8 + rnd(seed + i + 9) * 22} ry={5 + rnd(seed + i + 19) * 12} fill={color} opacity={0.35 + rnd(seed + i + 29) * 0.35} transform={`rotate(${rnd(seed + i + 39) * 180} ${cx + Math.cos(a) * rx * d} ${cy + Math.sin(a) * ry * d})`} />;
    })}
  </g>
);

export const Tortilla: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g>
    <ellipse cx={cx + 8} cy={cy + 14} rx={r} ry={r * 0.86} fill="#4A2408" opacity={0.25} filter="url(#vapor)" />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.86} fill="url(#tortilla)" />
    <Manchitas cx={cx} cy={cy} rx={r} ry={r * 0.86} n={26} seed={3} color="#C9934E" />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.86} fill="none" stroke="#D2A86B" strokeWidth={4} />
  </g>
);

const Jamon: React.FC<{ cx: number; cy: number; r: number; rot?: number }> = ({ cx, cy, r, rot = 0 }) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <path d={`M ${cx - r} ${cy} C ${cx - r} ${cy - r * 0.9} ${cx + r * 0.9} ${cy - r} ${cx + r} ${cy - r * 0.1} C ${cx + r * 1.05} ${cy + r * 0.8} ${cx - r * 0.7} ${cy + r * 0.95} ${cx - r} ${cy} Z`} fill="url(#jamon)" stroke="#C96464" strokeWidth={4} />
    <path d={`M ${cx - r * 0.5} ${cy - r * 0.2} q ${r * 0.4} ${-r * 0.3} ${r * 0.9} ${r * 0.05}`} stroke="#FFE1DD" strokeWidth={r * 0.08} fill="none" opacity={0.7} strokeLinecap="round" />
    <path d={`M ${cx - r * 0.3} ${cy + r * 0.35} q ${r * 0.3} ${r * 0.1} ${r * 0.6} ${-r * 0.1}`} stroke="#FFE1DD" strokeWidth={r * 0.05} fill="none" opacity={0.5} strokeLinecap="round" />
  </g>
);

const Rallado: React.FC<{ cx: number; cy: number; rx: number; ry: number; n: number; seed: number; k: number }> = ({ cx, cy, rx, ry, n, seed, k }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const local = lin(k, (i / n) * 0.6, (i / n) * 0.6 + 0.4);
      if (local <= 0) return null;
      const a = rnd(seed + i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + i + 70)) * 0.95;
      const x = cx + Math.cos(a) * rx * d;
      const y = cy + Math.sin(a) * ry * d - (1 - local) * 500;
      return <rect key={i} x={x - 18} y={y - 5} width={36} height={10} rx={5} fill={i % 3 ? "#FFD45C" : "#F7BF3A"} transform={`rotate(${rnd(seed + i + 5) * 180} ${x} ${y})`} opacity={Math.min(1, local * 3)} />;
    })}
  </>
);

// media luna dorada (quesadilla doblada), vista desde arriba; el lado recto abajo
export const MediaLuna: React.FC<{ cx: number; cy: number; r: number; tostado: number; derrame?: number; sinQueso?: boolean }> = ({ cx, cy, r, tostado, derrame = 1, sinQueso = false }) => {
  const d = `M ${cx - r} ${cy} A ${r} ${r * 0.86} 0 0 1 ${cx + r} ${cy} Z`;
  return (
    <g>
      <path d={d} fill="#4A2408" opacity={0.3} transform="translate(8 16)" filter="url(#vapor)" />
      {/* queso que asoma por el borde recto */}
      {!sinQueso && <path d={`M ${cx - r * 0.85} ${cy} q ${r * 0.1} ${30 * derrame} ${r * 0.25} ${10 * derrame} q ${r * 0.15} ${42 * derrame} ${r * 0.3} ${8 * derrame} q ${r * 0.2} ${36 * derrame} ${r * 0.35} ${4 * derrame} q ${r * 0.25} ${48 * derrame} ${r * 0.4} ${0} q ${r * 0.2} ${30 * derrame} ${r * 0.4} ${-2 * derrame} Z`} fill="url(#quesoDerretido)" />}
      {!sinQueso && <path d={`M ${cx - r * 0.6} ${cy - 2} L ${cx + r * 0.2} ${cy - 2}`} stroke="#F29A98" strokeWidth={10} strokeLinecap="round" />}
      <path d={d} fill="url(#tortilla)" />
      <path d={d} fill="url(#dorada)" opacity={tostado} />
      <clipPath id={`ml${Math.round(cx)}${Math.round(cy)}`}>
        <path d={d} />
      </clipPath>
      <Manchitas cx={cx} cy={cy - r * 0.4} rx={r} ry={r * 0.5} n={22} seed={11} color="#8E5420" clip={`url(#ml${Math.round(cx)}${Math.round(cy)})`} />
      <g opacity={tostado}>
        <Manchitas cx={cx} cy={cy - r * 0.4} rx={r} ry={r * 0.5} n={16} seed={31} color="#7A4318" clip={`url(#ml${Math.round(cx)}${Math.round(cy)})`} />
      </g>
      <path d={`M ${cx - r * 0.7} ${cy - r * 0.45} A ${r * 0.7} ${r * 0.55} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.7}`} stroke="#FFF3D6" strokeWidth={12} fill="none" opacity={0.35} strokeLinecap="round" />
    </g>
  );
};

// hilos de queso entre las dos mitades que se separan: distinto grosor, caída y altura; algunos ya cortados
const Hilos: React.FC<{ x1: number; x2: number; yBase: number; alto: number; t: number }> = ({ x1, x2, yBase, alto, t }) => {
  const ancho = x2 - x1;
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const yy1 = yBase - 30 - rnd(i + 3) * alto;
        const yy2 = yy1 + (rnd(i + 13) - 0.5) * 60;
        const sag = 30 + rnd(i + 23) * 110 + Math.sin(t * 5 + i) * 8 + ancho * 0.12;
        const g = Math.max(4, (8 + rnd(i + 33) * 26) * (1 - Math.min(0.7, ancho / 900)));
        const roto = i % 4 === 3 && ancho > 220;
        const mx = x1 + ancho * (0.3 + rnd(i + 43) * 0.4);
        const d = roto
          ? `M ${x1} ${yy1} Q ${x1 + ancho * 0.2} ${yy1 + sag * 1.4} ${x1 + ancho * 0.3} ${yy1 + sag * 1.8}`
          : `M ${x1} ${yy1} C ${x1 + ancho * 0.25} ${yy1 + sag} ${mx} ${Math.max(yy1, yy2) + sag} ${x2} ${yy2}`;
        return (
          <g key={i}>
            <path d={d} stroke="#E9A21C" strokeWidth={g + 4} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#FFCF45" strokeWidth={g} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#FFF2B8" strokeWidth={Math.max(2, g * 0.28)} fill="none" strokeLinecap="round" opacity={0.85} transform="translate(0 -3)" />
          </g>
        );
      })}
    </g>
  );
};

// mitad de la quesadilla (media luna cortada al medio), con la cara del corte a la vista
const Mitad: React.FC<{ cx: number; cy: number; r: number; lado: "izq" | "der"; dx: number; rot: number; sinQueso?: boolean }> = ({ cx, cy, r, lado, dx, rot, sinQueso = false }) => {
  const s = lado === "izq" ? -1 : 1;
  const ry = r * 0.86;
  const id = `mitad${lado}`;
  return (
    <g transform={`translate(${dx} 0) rotate(${rot} ${cx} ${cy})`}>
      <clipPath id={id}>
        <rect x={lado === "izq" ? cx - r - 60 : cx} y={cy - ry - 60} width={r + 60} height={ry + 200} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <MediaLuna cx={cx} cy={cy} r={r} tostado={1} sinQueso={sinQueso} />
      </g>
      {/* cara del corte: tortilla / queso / jamón / queso / tortilla */}
      <g transform={`translate(${cx} ${cy})`}>
        <path d={`M 0 0 L 0 ${-ry} L ${-s * 16} ${-ry + 10} L ${-s * 16} 8 Z`} fill="#E8C688" />
        <rect x={lado === "izq" ? -14 : 2} y={-ry + 14} width={12} height={ry - 14} fill={sinQueso ? "#E3C27E" : "#FFC93C"} />
        {sinQueso && [0.25, 0.45, 0.65, 0.85].map((k, i) => <rect key={i} x={lado === "izq" ? -16 : 0} y={-ry * k} width={16} height={14} rx={4} fill={i % 2 ? "#D9B266" : "#F0D9A0"} />)}
        {!sinQueso && <rect x={lado === "izq" ? -9 : 5} y={-ry * 0.8} width={5} height={ry * 0.7} fill="#F29A98" />}
        {/* queso que chorrea por la cara del corte */}
        {!sinQueso && [0.2, 0.45, 0.7].map((k, i) => (
          <path key={i} d={`M ${-s * 4} ${-ry * k} q ${s * 18} 10 ${s * 10} ${30 + i * 12} q ${-s * 4} 10 ${-s * 10} 0 Z`} fill="#FFC93C" />
        ))}
      </g>
    </g>
  );
};

export const EscenaEstirado: React.FC<{ s: number; desde: number; sinQueso?: boolean }> = ({ s, desde, sinQueso = false }) => {
  const u = s - desde;
  const sep = 40 + Math.min(1, u / 1.6) ** 0.8 * 300 + Math.sin(u * 3) * 8;
  const cx = 540;
  const cy = 1240;
  const r = 400;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <Defs />
      <QDefs />
      <Mesa />
      <Tablita cx={540} cy={1140} r={490} />
      <Mitad cx={cx} cy={cy} r={r} lado="izq" dx={-sep / 2} rot={-3 - Math.min(1, u) * 3} sinQueso={sinQueso} />
      <Mitad cx={cx} cy={cy} r={r} lado="der" dx={sep / 2} rot={3 + Math.min(1, u) * 3} sinQueso={sinQueso} />
      {!sinQueso && <Hilos x1={cx - sep / 2 - 6} x2={cx + sep / 2 + 6} yBase={cy} alto={r * 0.7} t={u} />}
      <g transform={`translate(0 ${-((u * 50) % 60)})`}>
        <Vapor x={380} y={880} h={260} o={0.45} />
        <Vapor x={700} y={860} h={240} o={0.4} />
      </g>
    </svg>
  );
};

// ---------- textos ----------
type Pal = { txt: string; t: number; marca?: boolean };
export const Frase: React.FC<{ s: number; palabras: Pal[]; top?: number; size?: number; color?: string }> = ({ s, palabras, top = 250, size = 104, color = C.ink }) => (
  <div style={{ position: "absolute", left: 72, right: 72, top, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${size * 0.1}px ${size * 0.24}px`, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.05 }}>
    {palabras.map((p, i) => {
      const k = pop(s, p.t);
      return (
        <span
          key={i}
          style={
            p.marca
              ? { display: "inline-block", background: C.tomato, color: "#FFF", padding: `0 ${size * 0.16}px`, borderRadius: size * 0.16, transform: `rotate(${-2 - (1 - Math.min(1, k)) * 12}deg) scale(${k})`, boxShadow: "0 10px 0 #A8240F" }
              : { display: "inline-block", color, transform: `scale(${k})`, opacity: Math.min(1, k * 3), textShadow: color === C.ink ? "0 4px 0 rgba(255,255,255,0.7)" : "0 6px 0 rgba(0,0,0,0.3)" }
          }
        >
          {p.txt}
        </span>
      );
    })}
  </div>
);

// ---------- composición ----------
export const Quesadilla: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  const tramo = s < T.ingredientes ? 0 : s < T.armado ? 1 : s < T.sarten ? 2 : s < T.corte ? 3 : s < T.revela ? 4 : s < T.libro ? 5 : s < T.cta ? 6 : 7;
  // corte duro entre tramos con un pequeño golpe de zoom
  const inicio = [0, T.ingredientes, T.armado, T.sarten, T.corte, T.revela, T.libro, T.cta][tramo];
  const golpe = 1 + 0.08 * Math.exp(-(s - inicio) * 9);
  const flash = tramo === 5 ? lin(s, T.revela, T.revela + 0.15, 0.9, 0) : 0;

  // temblor creciente mientras sube el riser (corte → revelación)
  const temblor = tramo === 4 ? lin(s, T.corte, T.revela, 1, 14, Easing.in(Easing.quad)) : 0;
  const tx = (rnd(frame) - 0.5) * 2 * temblor;
  const ty = (rnd(frame + 77) - 0.5) * 2 * temblor;

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      <Audio src={staticFile("ebook/quesadilla_mezcla.wav")} />
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${golpe})` }}>
        {/* 0 · gancho: el queso estirándose desde el fotograma 0 */}
        {tramo === 0 && (
          <>
            <AbsoluteFill style={{ transform: `scale(${1.25 - lin(s, 0, 2.7) * 0.15})`, transformOrigin: "50% 60%" }}>
              <EscenaEstirado s={s} desde={0} />
            </AbsoluteFill>
            <Frase s={s} palabras={[{ txt: "3", t: 0, marca: true }, { txt: "INGREDIENTES", t: 0.15 }]} top={250} size={100} />
            <Frase s={s} palabras={[{ txt: "5 MINUTOS", t: 1.55 }]} top={400} size={100} />
          </>
        )}

        {/* 1 · ingredientes que caen al ritmo de la voz */}
        {tramo === 1 && (
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <QDefs />
              <Mesa />
              {(() => {
                const caer = (d: number) => {
                  const u = s - d;
                  if (u < 0) return -1500;
                  if (u < 0.2) return -1500 * (1 - u / 0.2) ** 2;
                  return -Math.exp(-(u - 0.2) * 9) * Math.abs(Math.sin((u - 0.2) * 16)) * 50;
                };
                return (
                  <>
                    <g transform={`translate(0 ${caer(2.52)})`}>
                      <Tortilla cx={360} cy={1000} r={260} />
                      <Tortilla cx={372} cy={985} r={260} />
                    </g>
                    <g transform={`translate(0 ${caer(3.38)})`}>
                      <Jamon cx={790} cy={900} r={150} rot={-20} />
                      <Jamon cx={760} cy={960} r={150} rot={15} />
                    </g>
                    <g transform={`translate(0 ${caer(4.02)})`} filter="url(#sombra)">
                      <path d="M 520 1300 L 900 1240 L 960 1420 L 560 1500 Z" fill="url(#quesoBloque)" />
                      <path d="M 560 1500 L 960 1420 L 960 1470 L 560 1555 Z" fill="#E09F1E" />
                      {[[620, 1360, 18], [760, 1320, 12], [850, 1400, 16], [690, 1440, 10]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.7} fill="#E8A622" opacity={0.6} />)}
                    </g>
                  </>
                );
              })()}
            </svg>
            <Frase s={s} palabras={[{ txt: "Tortilla,", t: 2.79 }, { txt: "jamón", t: 3.59 }, { txt: "y", t: 4.1 }, { txt: "queso", t: 4.23, marca: true }]} top={250} size={96} />
          </>
        )}

        {/* 2 · armado y doblez */}
        {tramo === 2 && (
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <QDefs />
              <Mesa />
              <Tablita cx={540} cy={1060} r={470} />
              {s < T.doblar + 0.35 ? (
                <>
                  <Tortilla cx={540} cy={1060} r={360} />
                  {/* todo va sobre la mitad de arriba, para doblar la de abajo */}
                  <Rallado cx={540} cy={930} rx={300} ry={160} n={50} seed={7} k={lin(s, 5.0, 5.7)} />
                  {[[440, 930, -10], [640, 920, 20]].map(([x, y, r], i) => (
                    <g key={i} transform={`translate(0 ${-(1 - lin(s, 5.68 + i * 0.12, 5.98 + i * 0.12, 0, 1, Easing.out(Easing.back(1.5)))) * 900})`}>
                      <Jamon cx={x} cy={y} r={130} rot={r} />
                    </g>
                  ))}
                  <Rallado cx={540} cy={930} rx={300} ry={160} n={40} seed={77} k={lin(s, 6.55, 7.2)} />
                  {/* la mitad de abajo se pliega hacia arriba */}
                  {s >= T.doblar && (
                    <g transform={`translate(0 ${1060}) scale(1 ${1 - 2 * lin(s, T.doblar, T.doblar + 0.35, 0, 1, Easing.inOut(Easing.quad))}) translate(0 ${-1060})`}>
                      <path d={`M ${540 - 360} 1060 A 360 310 0 0 0 ${540 + 360} 1060 Z`} fill="url(#tortilla)" stroke="#D2A86B" strokeWidth={4} />
                    </g>
                  )}
                </>
              ) : (
                <g transform={`translate(0 ${-Math.exp(-(s - T.doblar - 0.35) * 9) * 30})`}>
                  <MediaLuna cx={540} cy={1060} r={360} tostado={0} derrame={0.4} />
                </g>
              )}
            </svg>
            <Frase s={s} palabras={[{ txt: "Queso,", t: 5.0 }, { txt: "jamón,", t: 5.68 }, { txt: "más queso", t: 6.53 }]} top={250} size={92} />
            <Frase s={s} palabras={[{ txt: "y doblás", t: 7.65, marca: true }]} top={480} size={92} />
          </>
        )}

        {/* 3 · sartén, 2 minutos por lado, vuelta */}
        {tramo === 3 && (
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <QDefs />
              <radialGradient id="hornallaQ" cx="0.5" cy="0.6" r="0.6">
                <stop offset="0" stopColor="#5A463C" />
                <stop offset="1" stopColor="#1E1714" />
              </radialGradient>
              <rect width={1080} height={1920} fill="url(#hornallaQ)" />
              <Sarten cx={540} cy={1080} rx={470} ry={370} mango="izq">
                {(() => {
                  const v = lin(s, T.vuelta, T.vuelta + 0.4);
                  const salto = Math.sin(Math.PI * v) * -260;
                  const esc = Math.cos(Math.PI * v);
                  return (
                    <g transform={`translate(0 ${salto}) translate(0 1130) scale(1 ${Math.abs(esc) < 0.05 ? 0.05 : Math.abs(esc)}) translate(0 -1130)`}>
                      <MediaLuna cx={540} cy={1130} r={340} tostado={v < 0.5 ? lin(s, T.sarten, T.vuelta, 0, 0.5) : 1} derrame={v < 0.5 ? 0.6 : 1} />
                    </g>
                  );
                })()}
              </Sarten>
              <g transform={`translate(0 ${-((s * 60) % 70)})`}>
                <Vapor x={360} y={930} h={260} o={0.45} />
                <Vapor x={720} y={910} h={280} o={0.4} />
              </g>
              {/* chispitas de grasa del chisporroteo */}
              {Array.from({ length: 14 }, (_, i) => {
                const ph = (s * 2.2 + rnd(i + 200)) % 1;
                return <circle key={i} cx={300 + rnd(i + 210) * 480} cy={1100 - ph * 200} r={3 + rnd(i) * 3} fill="#FFF3B0" opacity={0.7 * (1 - ph)} />;
              })}
            </svg>
            <Frase s={s} palabras={[{ txt: "2 MIN", t: 8.84, marca: true }, { txt: "por lado", t: 9.35 }]} top={250} size={100} color="#FFF6EA" />
            <div style={{ position: "absolute", right: 90, top: 450, transform: `scale(${pop(s, 8.9)})` }}>
              <Reloj t={lin(s, 8.9, T.corte) * 2} size={150} />
            </div>
          </>
        )}

        {/* 4 · corte (sube el riser) */}
        {tramo === 4 && (
          <>
            <AbsoluteFill style={{ transform: `scale(${lin(s, T.corte, T.revela, 1, 1.25, Easing.in(Easing.quad))})`, transformOrigin: "50% 58%" }}>
              <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
                <Defs />
                <QDefs />
                <Mesa />
                <Tablita cx={540} cy={1080} r={470} />
                <MediaLuna cx={540} cy={1120} r={360} tostado={1} />
                {/* líneas de corte que aparecen detrás del cuchillo */}
                {[0, 1].map((i) => {
                  const k = lin(s, 10.55 + i * 0.45, 10.85 + i * 0.45);
                  const ang = i === 0 ? -0.55 : 0.55;
                  const x2 = 540 + Math.sin(ang) * 330 * k;
                  const y2 = 1120 - Math.cos(ang) * 300 * k;
                  return <line key={i} x1={540} y1={1120} x2={x2} y2={y2} stroke="#7A4318" strokeWidth={8} strokeLinecap="round" opacity={k > 0 ? 1 : 0} />;
                })}
                {/* cuchillo */}
                {(() => {
                  const i = s < 11.0 ? 0 : 1;
                  const k = lin(s, 10.55 + i * 0.45, 10.85 + i * 0.45);
                  const ang = i === 0 ? -0.55 : 0.55;
                  const x = 540 + Math.sin(ang) * 330 * k;
                  const y = 1120 - Math.cos(ang) * 300 * k;
                  return (
                    <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`} filter="url(#sombra)">
                      <path d="M -14 0 L -14 -360 Q 0 -420 40 -360 L 40 0 Z" fill="url(#metal)" />
                      <rect x={-20} y={0} width={66} height={210} rx={18} fill="#2B2118" />
                      <circle cx={13} cy={60} r={7} fill="#B8B8B8" />
                      <circle cx={13} cy={150} r={7} fill="#B8B8B8" />
                    </g>
                  );
                })()}
              </svg>
            </AbsoluteFill>
            <Frase s={s} palabras={[{ txt: "Cortás…", t: 10.55 }]} top={250} size={110} />
          </>
        )}

        {/* 5 · revelación: el queso estirándose (vuelve el plano del principio) */}
        {tramo === 5 && (
          <>
            <AbsoluteFill style={{ transform: `scale(${1.1 - 0.1 * spring({ frame: frame - T.revela * fps, fps, config: { damping: 12, stiffness: 120 } })}) rotate(${(1 - spring({ frame: frame - T.revela * fps, fps, config: { damping: 12, stiffness: 120 } })) * -5}deg)` }}>
              <EscenaEstirado s={s} desde={T.revela} />
            </AbsoluteFill>
            <Frase s={s} palabras={[{ txt: "Quesadilla", t: 12.0 }]} top={250} size={104} />
            <Frase s={s} palabras={[{ txt: "de jamón y", t: 12.35 }, { txt: "queso", t: 12.6, marca: true }]} top={380} size={84} />
            <div style={{ position: "absolute", left: 72, right: 72, top: 1610, display: "flex", justifyContent: "center", opacity: lin(s, 12.8, 13.0) }}>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: "#FFF6EA", background: "rgba(43,33,24,0.78)", padding: "8px 22px", borderRadius: 30 }}>Receta de ejemplo · ilustración</div>
            </div>
          </>
        )}

        {/* 6 · ebook */}
        {tramo === 6 && (() => {
          const k = spring({ frame: frame - T.libro * fps, fps, config: { damping: 14, stiffness: 120 } });
          const n = Math.round(lin(s, 13.5, 14.1, 1, 35, Easing.out(Easing.quad)));
          return (
            <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, #F07A55 0%, ${C.tomato} 55%, #A8240F 100%)` }}>
              <div style={{ position: "absolute", left: 72, right: 72, top: 240, textAlign: "center", fontFamily: FONT, fontWeight: 800, color: "#FFF6EA", lineHeight: 1.0, textShadow: "0 6px 0 rgba(0,0,0,0.25)" }}>
                <div style={{ fontSize: 150, color: C.mustard, transform: `scale(${pop(s, 13.5)})` }}>{n} recetas</div>
                <div style={{ fontSize: 86, transform: `scale(${pop(s, 14.95)})` }}>así de fáciles</div>
              </div>
              <div style={{ position: "absolute", left: 540 - 250, top: 640 + (1 - k) * 900, perspective: 1600 }}>
                <div style={{ transform: `rotateY(${-22 + Math.sin(s * 1.2) * 4}deg) rotateZ(${-4 + (1 - k) * 20}deg)` }}>
                  <Libro w={500} />
                </div>
              </div>
              <div style={{ position: "absolute", left: 72, right: 72, top: 1390, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "#FFF6EA", transform: `scale(${pop(s, 16.4)})` }}>
                en mi <span style={{ color: C.mustard }}>ebook</span>
              </div>
            </AbsoluteFill>
          );
        })()}

        {/* 7 · CTA */}
        {tramo === 7 && (() => {
          const k = spring({ frame: frame - T.cta * fps, fps, config: { damping: 14, stiffness: 140 } });
          const kb = spring({ frame: frame - 18.3 * fps, fps, config: { damping: 12, stiffness: 160 } });
          const envio = lin(s, 19.2, 19.7, 0, 1, Easing.in(Easing.quad));
          return (
            <AbsoluteFill style={{ background: C.cream }}>
              <div style={{ position: "absolute", left: 72, right: 72, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 118, lineHeight: 1.08, color: C.ink, transform: `scale(${0.8 + 0.2 * k})`, opacity: k }}>
                Escribime
                <br />
                por <Marca>DM</Marca>
              </div>
              <div style={{ position: "absolute", left: 72, right: 72, top: 600, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 56, color: C.ink, opacity: lin(s, 18.3, 18.6) }}>y te paso el ebook</div>
              <div style={{ position: "absolute", right: 110, top: 800 - envio * 60, transform: `scale(${kb})`, transformOrigin: "100% 100%" }}>
                <div style={{ background: C.tomato, color: "#FFF", fontFamily: FONT, fontWeight: 600, fontSize: 48, padding: "26px 40px", borderRadius: "40px 40px 8px 40px", boxShadow: "0 10px 0 #A8240F" }}>Hola, quiero el ebook</div>
                <div style={{ textAlign: "right", fontFamily: FONT, fontWeight: 600, fontSize: 30, color: "#8A7A6A", marginTop: 18, opacity: lin(s, 19.6, 19.9) }}>Enviado ✓</div>
              </div>
              <div style={{ position: "absolute", left: 140, top: 1020 + (1 - k) * 700 }}>
                <div style={{ transform: `rotate(${-8 + Math.sin(s * 2) * 2}deg)` }}>
                  <Libro w={330} />
                </div>
              </div>
              <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: 600 + envio * 200, top: 1130 - envio * 300, opacity: kb * (1 - envio * 0.8) }}>
                <path d="M 40 150 L 260 60 L 200 250 L 150 170 Z" fill={C.ink} />
                <path d="M 150 170 L 260 60" stroke={C.cream} strokeWidth={8} />
              </svg>
            </AbsoluteFill>
          );
        })()}
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </AbsoluteFill>
  );
};
