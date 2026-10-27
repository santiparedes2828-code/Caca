import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";

// Video del recetario — nueva apertura (2026-10-25): ingredientes → preparación → plato revelado.
// Receta de EJEMPLO inventada (no sale del ebook): «Huevos en salsa de tomate», para 2.
// Ingredientes: aceite de oliva, 1 cebolla, 2 dientes de ajo, 400 g de tomate triturado, 1 cdta de pimentón, sal, 3–4 huevos, perejil.
// Pasos: cebolla 5 min → ajo + pimentón 1 min → tomate 10 min → huecos y huevos → tapado 6–8 min.
// Por ahora solo tres fotogramas clave (Still); la animación se arma cuando se aprueben.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });

export const C = { cream: "#FFF6EA", ink: "#2B2118", tomato: "#E4572E", basil: "#3C8D5A", mustard: "#F2B134", skin: "#F1C7A1", hair: "#4A2E1F" };
export const FONT = "Poppins";

// pseudoaleatorio fijo, para que cada render dé lo mismo
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// contorno orgánico (claras, salsa): radio que ondula, cerrado con curvas suaves
export const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.12, n = 14) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * (Math.sin(a * 3 + seed) * 0.6 + Math.sin(a * 5 + seed * 2.3) * 0.4) + (rnd(seed + i) - 0.5) * wob * 0.6;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = `M ${mid(pts[n - 1], pts[0]).join(" ")}`;
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  });
  return d + " Z";
};

// ---------- definiciones compartidas ----------
export const Defs: React.FC = () => (
  <defs>
    <filter id="sombra" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#3A1E0E" floodOpacity="0.35" />
    </filter>
    <filter id="sombraSuave" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3A1E0E" floodOpacity="0.3" />
    </filter>
    <filter id="desenfoque"><feGaussianBlur stdDeviation="14" /></filter>
    <filter id="vapor"><feGaussianBlur stdDeviation="9" /></filter>
    <filter id="grano" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="3" seed="4" />
      <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.55 -0.12" />
      <feComposite in2="SourceGraphic" operator="in" />
    </filter>
    <filter id="textura" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="9" />
      <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0.5 -0.15" />
      <feComposite in2="SourceGraphic" operator="in" />
    </filter>
    <linearGradient id="pared" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FCE9D2" />
      <stop offset="1" stopColor="#F2CFA8" />
    </linearGradient>
    <radialGradient id="luzVentana" cx="0.15" cy="0.12" r="0.8">
      <stop offset="0" stopColor="#FFF8E6" stopOpacity="0.95" />
      <stop offset="1" stopColor="#FFF8E6" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="madera" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0" stopColor="#D69A5C" />
      <stop offset="0.5" stopColor="#E3AE70" />
      <stop offset="1" stopColor="#C2834A" />
    </linearGradient>
    <linearGradient id="maderaCanto" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#A86634" />
      <stop offset="1" stopColor="#7A4320" />
    </linearGradient>
    <linearGradient id="mesada" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E8D6C0" />
      <stop offset="1" stopColor="#CDB497" />
    </linearGradient>
    <radialGradient id="tomate" cx="0.38" cy="0.35" r="0.7">
      <stop offset="0" stopColor="#FF9273" />
      <stop offset="0.45" stopColor="#E9502A" />
      <stop offset="1" stopColor="#A8240F" />
    </radialGradient>
    <radialGradient id="cebolla" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#F7D28F" />
      <stop offset="0.55" stopColor="#D79A48" />
      <stop offset="1" stopColor="#8E531F" />
    </radialGradient>
    <radialGradient id="ajo" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.6" stopColor="#F1E6E4" />
      <stop offset="1" stopColor="#C9AFB4" />
    </radialGradient>
    <radialGradient id="huevo" cx="0.38" cy="0.32" r="0.75">
      <stop offset="0" stopColor="#FBEBD3" />
      <stop offset="0.55" stopColor="#E4BE92" />
      <stop offset="1" stopColor="#A9784C" />
    </radialGradient>
    <linearGradient id="lata" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8E1F12" />
      <stop offset="0.3" stopColor="#D8432A" />
      <stop offset="0.45" stopColor="#F07656" />
      <stop offset="1" stopColor="#7A180C" />
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8D8D8D" />
      <stop offset="0.4" stopColor="#F2F2F2" />
      <stop offset="1" stopColor="#7A7A7A" />
    </linearGradient>
    <linearGradient id="aceite" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#5E6B12" />
      <stop offset="0.35" stopColor="#B8B83A" />
      <stop offset="0.5" stopColor="#E3DD7A" />
      <stop offset="1" stopColor="#4C5610" />
    </linearGradient>
    <radialGradient id="piel" cx="0.4" cy="0.35" r="0.75">
      <stop offset="0" stopColor="#FAD9B8" />
      <stop offset="1" stopColor="#D9A47C" />
    </radialGradient>
    <radialGradient id="hierro" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0.75" stopColor="#3A3330" />
      <stop offset="1" stopColor="#141110" />
    </radialGradient>
    <linearGradient id="borde" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#5C5450" />
      <stop offset="0.5" stopColor="#2A2422" />
      <stop offset="1" stopColor="#111" />
    </linearGradient>
    <radialGradient id="salsa" cx="0.45" cy="0.42" r="0.62">
      <stop offset="0" stopColor="#E8492A" />
      <stop offset="0.6" stopColor="#C7321A" />
      <stop offset="0.92" stopColor="#8E1E0E" />
      <stop offset="1" stopColor="#5E1208" />
    </radialGradient>
    <radialGradient id="clara" cx="0.45" cy="0.4" r="0.65">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.8" stopColor="#FBF6EE" />
      <stop offset="1" stopColor="#EADCC8" />
    </radialGradient>
    <radialGradient id="claraCruda" cx="0.45" cy="0.4" r="0.65">
      <stop offset="0" stopColor="#FFF4E2" stopOpacity="0.75" />
      <stop offset="1" stopColor="#F6D9B8" stopOpacity="0.45" />
    </radialGradient>
    <radialGradient id="yema" cx="0.38" cy="0.32" r="0.72">
      <stop offset="0" stopColor="#FFD36A" />
      <stop offset="0.5" stopColor="#FFA21F" />
      <stop offset="1" stopColor="#D36A00" />
    </radialGradient>
  </defs>
);

// ---------- ingredientes ----------
const Sombra: React.FC<{ cx: number; cy: number; rx: number; ry?: number; o?: number }> = ({ cx, cy, rx, ry = rx * 0.22, o = 0.35 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#4A2408" opacity={o} filter="url(#vapor)" />
);

export const Tomate: React.FC<{ cx: number; cy: number; r: number; rot?: number }> = ({ cx, cy, r, rot = 0 }) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <Sombra cx={cx} cy={cy + r * 0.85} rx={r * 0.95} />
    <path d={blob(cx, cy, r * 1.06, r * 0.92, rot + 3, 0.05, 10)} fill="url(#tomate)" />
    {[-0.45, 0, 0.45].map((k) => (
      <path key={k} d={`M ${cx + k * r} ${cy - r * 0.75} Q ${cx + k * r * 1.5} ${cy} ${cx + k * r} ${cy + r * 0.8}`} stroke="#9E220E" strokeWidth={r * 0.04} fill="none" opacity={0.35} />
    ))}
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.42} rx={r * 0.28} ry={r * 0.14} fill="#FFFFFF" opacity={0.55} transform={`rotate(-25 ${cx - r * 0.35} ${cy - r * 0.42})`} />
    <ellipse cx={cx - r * 0.12} cy={cy - r * 0.6} rx={r * 0.07} ry={r * 0.04} fill="#FFFFFF" opacity={0.8} />
    {/* cáliz */}
    <g transform={`translate(${cx} ${cy - r * 0.78})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d={`M 0 0 Q ${r * 0.12} ${-r * 0.06} ${r * 0.32} ${r * 0.02} Q ${r * 0.12} ${r * 0.07} 0 0`} fill="#3E7A2A" transform={`rotate(${a}) scale(1 0.55)`} />
      ))}
      <path d={`M 0 0 q ${r * 0.03} ${-r * 0.16} ${r * 0.11} ${-r * 0.2}`} stroke="#4F8A30" strokeWidth={r * 0.06} strokeLinecap="round" fill="none" />
    </g>
  </g>
);

export const Cebolla: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g>
    <Sombra cx={cx} cy={cy + r * 0.85} rx={r * 0.9} />
    <path d={`M ${cx} ${cy - r * 1.35} C ${cx + r * 0.25} ${cy - r * 0.95} ${cx + r * 1.05} ${cy - r * 0.75} ${cx + r * 1.0} ${cy + r * 0.1} C ${cx + r * 0.95} ${cy + r * 0.85} ${cx + r * 0.4} ${cy + r * 0.95} ${cx} ${cy + r * 0.95} C ${cx - r * 0.4} ${cy + r * 0.95} ${cx - r * 0.95} ${cy + r * 0.85} ${cx - r * 1.0} ${cy + r * 0.1} C ${cx - r * 1.05} ${cy - r * 0.75} ${cx - r * 0.25} ${cy - r * 0.95} ${cx} ${cy - r * 1.35} Z`} fill="url(#cebolla)" />
    {[-0.62, -0.32, 0, 0.32, 0.62].map((k) => (
      <path key={k} d={`M ${cx} ${cy - r * 1.25} Q ${cx + k * r * 1.9} ${cy - r * 0.1} ${cx + k * r * 0.3} ${cy + r * 0.92}`} stroke="#8A4E1C" strokeWidth={r * 0.025} fill="none" opacity={0.45} />
    ))}
    <ellipse cx={cx - r * 0.4} cy={cy - r * 0.25} rx={r * 0.18} ry={r * 0.4} fill="#FFF3D6" opacity={0.45} transform={`rotate(18 ${cx - r * 0.4} ${cy - r * 0.25})`} />
    <path d={`M ${cx} ${cy - r * 1.3} q ${-r * 0.05} ${-r * 0.25} ${r * 0.1} ${-r * 0.42}`} stroke="#A9732F" strokeWidth={r * 0.08} strokeLinecap="round" fill="none" />
    {[-3, -1, 1, 3].map((k) => (
      <path key={k} d={`M ${cx + k * r * 0.04} ${cy + r * 0.93} q ${k * r * 0.05} ${r * 0.12} ${k * r * 0.09} ${r * 0.16}`} stroke="#C9A77A" strokeWidth={r * 0.025} fill="none" />
    ))}
  </g>
);

export const Ajo: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g>
    <Sombra cx={cx} cy={cy + r * 0.8} rx={r * 0.95} />
    {[-0.55, 0.55, -0.2, 0.2].map((k, i) => (
      <path key={i} d={`M ${cx + k * r} ${cy - r * 0.9} Q ${cx + k * r * 2.1} ${cy} ${cx + k * r * 0.9} ${cy + r * 0.85} Q ${cx + k * r * 0.2} ${cy + r * 0.95} ${cx + k * r * 0.1} ${cy} Z`} fill="url(#ajo)" stroke="#D7C4C6" strokeWidth={2} />
    ))}
    <path d={`M ${cx} ${cy - r * 1.25} C ${cx + r * 0.7} ${cy - r * 0.6} ${cx + r * 0.95} ${cy + r * 0.6} ${cx} ${cy + r * 0.9} C ${cx - r * 0.95} ${cy + r * 0.6} ${cx - r * 0.7} ${cy - r * 0.6} ${cx} ${cy - r * 1.25} Z`} fill="url(#ajo)" />
    {[-0.3, 0, 0.3].map((k) => (
      <path key={k} d={`M ${cx} ${cy - r * 1.15} Q ${cx + k * r * 1.6} ${cy} ${cx + k * r * 0.4} ${cy + r * 0.85}`} stroke="#B58F9A" strokeWidth={r * 0.03} fill="none" opacity={0.5} />
    ))}
    {/* un diente suelto */}
    <g transform={`translate(${cx + r * 1.25} ${cy + r * 0.45}) rotate(-35)`}>
      <path d={`M 0 ${-r * 0.5} Q ${r * 0.42} ${-r * 0.1} ${r * 0.2} ${r * 0.4} Q 0 ${r * 0.5} ${-r * 0.2} ${r * 0.4} Q ${-r * 0.3} 0 0 ${-r * 0.5} Z`} fill="url(#ajo)" filter="url(#sombraSuave)" />
    </g>
  </g>
);

export const Huevo: React.FC<{ cx: number; cy: number; r: number; rot?: number }> = ({ cx, cy, r, rot = 0 }) => (
  <g transform={`rotate(${rot} ${cx} ${cy})`}>
    <Sombra cx={cx} cy={cy + r * 1.1} rx={r * 0.85} />
    <path d={`M ${cx} ${cy - r * 1.3} C ${cx + r * 0.75} ${cy - r * 1.3} ${cx + r} ${cy + r * 0.1} ${cx + r * 0.95} ${cy + r * 0.45} C ${cx + r * 0.85} ${cy + r * 1.15} ${cx - r * 0.85} ${cy + r * 1.15} ${cx - r * 0.95} ${cy + r * 0.45} C ${cx - r} ${cy + r * 0.1} ${cx - r * 0.75} ${cy - r * 1.3} ${cx} ${cy - r * 1.3} Z`} fill="url(#huevo)" />
    <ellipse cx={cx - r * 0.35} cy={cy - r * 0.55} rx={r * 0.2} ry={r * 0.32} fill="#FFFFFF" opacity={0.5} transform={`rotate(20 ${cx - r * 0.35} ${cy - r * 0.55})`} />
  </g>
);

export const Pimenton: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g filter="url(#sombra)">
    <rect x={x} y={y} width={w} height={h} fill="url(#lata)" />
    <ellipse cx={x + w / 2} cy={y + h} rx={w / 2} ry={w * 0.14} fill="#7A180C" />
    <rect x={x} y={y + h * 0.3} width={w} height={h * 0.42} fill="#F6E3B4" />
    <rect x={x} y={y + h * 0.3} width={w * 0.14} height={h * 0.42} fill="#000" opacity={0.18} />
    <rect x={x + w * 0.82} y={y + h * 0.3} width={w * 0.18} height={h * 0.42} fill="#000" opacity={0.22} />
    <text x={x + w / 2} y={y + h * 0.48} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={w * 0.17} fill="#9E2412">PIMENTÓN</text>
    <text x={x + w / 2} y={y + h * 0.62} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={w * 0.11} fill="#7A4320">dulce</text>
    <rect x={x} y={y - h * 0.04} width={w} height={h * 0.08} fill="url(#metal)" />
    <ellipse cx={x + w / 2} cy={y - h * 0.04} rx={w / 2} ry={w * 0.14} fill="#D8D8D8" stroke="#9A9A9A" strokeWidth={3} />
    <ellipse cx={x + w / 2} cy={y - h * 0.04} rx={w * 0.38} ry={w * 0.09} fill="none" stroke="#A9A9A9" strokeWidth={3} />
  </g>
);

export const Perejil: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => {
  const hoja = (hx: number, hy: number, k: number, a: number) => (
    <g transform={`translate(${hx} ${hy}) rotate(${a}) scale(${k})`}>
      <path d="M 0 0 C -18 -10 -30 -34 -14 -46 C -10 -60 10 -60 14 -46 C 30 -34 18 -10 0 0 Z" fill="#3C8D5A" />
      <path d="M 0 0 C -6 -18 -8 -30 -14 -40 M 0 0 L 0 -48 M 0 0 C 6 -18 8 -30 14 -40" stroke="#2C6B42" strokeWidth={2} fill="none" />
      <path d="M -6 -40 C -2 -50 6 -50 8 -42" stroke="#7CC08E" strokeWidth={3} fill="none" opacity={0.7} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} filter="url(#sombraSuave)">
      <path d="M 0 0 Q 30 -60 70 -110 M 30 -55 Q 10 -100 -10 -130 M 52 -85 Q 90 -110 120 -120" stroke="#4E9A55" strokeWidth={6} strokeLinecap="round" fill="none" />
      {hoja(70, -110, 1, 20)}
      {hoja(-10, -130, 0.9, -30)}
      {hoja(120, -120, 0.85, 70)}
      {hoja(88, -96, 0.7, 120)}
      {hoja(4, -112, 0.7, -80)}
    </g>
  );
};

export const Aceite: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} filter="url(#sombra)">
    <path d="M -60 0 L -60 -260 Q -60 -300 -26 -330 L -22 -400 L 22 -400 L 26 -330 Q 60 -300 60 -260 L 60 0 Z" fill="url(#aceite)" />
    <rect x={-26} y={-440} width={52} height={44} rx={6} fill="#2E2A26" />
    <rect x={-60} y={-200} width={120} height={110} fill="#F7EEDC" />
    <text x={0} y={-150} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#4C5610">ACEITE</text>
    <text x={0} y={-122} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={15} fill="#4C5610">de oliva</text>
    <rect x={-40} y={-300} width={14} height={280} rx={7} fill="#FFFFFF" opacity={0.35} />
  </g>
);

// ---------- cocinera (primer plano, duda) ----------
export const Cocinera: React.FC<{ cx: number; cy: number; s: number; feliz?: boolean }> = ({ cx, cy, s, feliz = false }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    {/* torso y delantal */}
    <path d="M -230 420 Q -220 230 -90 200 L 90 200 Q 220 230 230 420 Z" fill="#F4EDE3" />
    <path d="M -120 420 L -110 260 Q 0 290 110 260 L 120 420 Z" fill={C.tomato} />
    <path d="M -100 262 L -60 205 M 100 262 L 60 205" stroke={C.tomato} strokeWidth={16} strokeLinecap="round" />
    <path d="M -230 420 Q -220 230 -90 200 L -70 230 Q -170 270 -180 420 Z" fill="#000" opacity={0.07} />
    {/* cuello */}
    <path d="M -45 150 L -45 215 Q 0 240 45 215 L 45 150 Z" fill="#E0AE86" />
    {/* pelo de atrás */}
    <ellipse cx={0} cy={-20} rx={170} ry={175} fill={C.hair} />
    <circle cx={0} cy={-205} r={70} fill={C.hair} />
    <circle cx={-18} cy={-222} r={22} fill="#6A4430" opacity={0.6} />
    {/* cara */}
    <ellipse cx={0} cy={10} rx={140} ry={158} fill="url(#piel)" />
    <ellipse cx={-140} cy={20} rx={24} ry={34} fill="#E3AE86" />
    <ellipse cx={140} cy={20} rx={24} ry={34} fill="#E3AE86" />
    {/* flequillo */}
    <path d="M -150 -30 Q -140 -150 0 -158 Q 140 -150 150 -30 Q 110 -110 30 -100 Q -40 -130 -150 -30 Z" fill={C.hair} />
    <path d="M -60 -120 Q 0 -150 80 -118" stroke="#6A4430" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
{feliz ? (
  <>
    {/* cejas arriba, mirada al frente */}
    <path d="M -96 -62 Q -62 -86 -28 -66" stroke={C.hair} strokeWidth={13} strokeLinecap="round" fill="none" />
    <path d="M 28 -66 Q 62 -86 96 -62" stroke={C.hair} strokeWidth={13} strokeLinecap="round" fill="none" />
    {[-60, 60].map((ex) => (
      <g key={ex}>
        <ellipse cx={ex} cy={-12} rx={26} ry={30} fill="#FFFFFF" />
        <circle cx={ex} cy={-10} r={17} fill="#3B2416" />
        <circle cx={ex - 6} cy={-17} r={6} fill="#FFFFFF" />
        <circle cx={ex + 6} cy={-3} r={2.5} fill="#FFFFFF" />
        <path d={`M ${ex - 28} -38 Q ${ex} -50 ${ex + 28} -38`} stroke="#3B2416" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    ))}
  </>
) : (
  <>
    {/* cejas: una alta (duda), otra baja */}
    <path d="M -95 -55 Q -62 -88 -28 -66" stroke={C.hair} strokeWidth={13} strokeLinecap="round" fill="none" />
    <path d="M 30 -45 Q 64 -52 96 -40" stroke={C.hair} strokeWidth={13} strokeLinecap="round" fill="none" />
    {/* ojos mirando hacia abajo a la izquierda (a los ingredientes) */}
    {[-60, 62].map((ex) => (
      <g key={ex}>
        <ellipse cx={ex} cy={-12} rx={26} ry={ex < 0 ? 30 : 24} fill="#FFFFFF" />
        <circle cx={ex - 9} cy={-4} r={15} fill="#3B2416" />
        <circle cx={ex - 14} cy={-10} r={5} fill="#FFFFFF" />
        <path d={`M ${ex - 28} ${ex < 0 ? -40 : -30} Q ${ex} ${ex < 0 ? -50 : -38} ${ex + 28} ${ex < 0 ? -40 : -30}`} stroke="#3B2416" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    ))}
  </>
)}
    {/* mejillas y nariz */}
    <ellipse cx={-88} cy={50} rx={26} ry={14} fill="#F08A7A" opacity={0.35} />
    <ellipse cx={90} cy={50} rx={26} ry={14} fill="#F08A7A" opacity={0.35} />
    <path d="M 4 10 Q -10 45 6 52" stroke="#C78A62" strokeWidth={6} fill="none" strokeLinecap="round" />
{feliz ? (
      <g>
        {/* sonrisa abierta */}
        <path d="M -52 78 Q 0 92 52 78 Q 44 132 0 134 Q -44 132 -52 78 Z" fill="#8E3B2A" />
        <path d="M -40 82 Q 0 92 40 82 L 38 94 Q 0 102 -38 94 Z" fill="#FFFFFF" />
        <path d="M -24 120 Q 0 108 24 120 Q 12 130 0 130 Q -12 130 -24 120 Z" fill="#E86A5A" />
      </g>
    ) : (
      <>
    {/* boca torcida */}
    <path d="M -38 98 Q -5 88 22 96 Q 36 100 44 90" stroke="#8E3B2A" strokeWidth={8} fill="none" strokeLinecap="round" />
    {/* mano en el mentón */}
    <g filter="url(#sombraSuave)">
      <path d="M 150 420 Q 160 260 80 170 Q 60 150 40 160" stroke="#F4EDE3" strokeWidth={70} strokeLinecap="round" fill="none" />
      <path d="M 10 150 Q 30 120 70 128 Q 100 136 96 168 Q 90 196 52 196 Q 16 192 10 150 Z" fill="url(#piel)" />
      <path d="M 26 140 Q 20 110 34 104" stroke="#E0AE86" strokeWidth={18} strokeLinecap="round" fill="none" />
      <path d="M 40 150 L 80 150 M 44 168 L 84 168" stroke="#C78A62" strokeWidth={3} opacity={0.6} />
    </g>
    {/* signos de duda */}
    <text x={175} y={-150} fontFamily={FONT} fontWeight={800} fontSize={110} fill={C.tomato} transform="rotate(14 175 -150)">?</text>
    <text x={-235} y={-120} fontFamily={FONT} fontWeight={800} fontSize={70} fill={C.ink} opacity={0.8} transform="rotate(-12 -235 -120)">?</text>
      </>
    )}
  </g>
);

// ---------- movimiento (t en segundos; por defecto 99 = todo quieto, para los fotogramas fijos) ----------
// algo que cae desde arriba y rebota al apoyarse: desplazamiento vertical en px
const caida = (t: number, desde: number, alto = 1300) => {
  const u = t - desde;
  if (u < 0) return -alto;
  if (u < 0.22) return -alto * (1 - u / 0.22) ** 2;
  return -Math.exp(-(u - 0.22) * 9) * Math.abs(Math.sin((u - 0.22) * 16)) * 60;
};
// escala de algo que aparece de golpe y se asienta
export const pop = (t: number, desde: number) => {
  const u = t - desde;
  if (u <= 0) return 0;
  const k = Math.min(1, u / 0.09);
  return k + Math.exp(-u * 8) * Math.sin(u * 20) * 0.25 * k;
};
const Cae: React.FC<{ t: number; desde: number; children: React.ReactNode }> = ({ t, desde, children }) => (
  <g transform={`translate(0 ${caida(t, desde)})`}>{children}</g>
);

// ---------- textos ----------
type Parte = { t: string; marca?: boolean };
export const Titulo: React.FC<{ lineas: Parte[][]; y: number; size: number; derecha?: number; t?: number; apar?: number[] }> = ({ lineas, y, size, derecha = 150, t = 99, apar = [] }) => {
  let n = 0;
  return (
  <div style={{ position: "absolute", left: 72, right: derecha, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.08 }}>
    {lineas.map((l, i) => (
      <div key={i} style={{ display: "flex", gap: size * 0.25, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.05, color: C.ink, letterSpacing: -1, whiteSpace: "nowrap" }}>
        {l.map((p, j) => {
          const k = pop(t, apar[n++] ?? -1);
          return (
            <span
              key={j}
              style={
                p.marca
                  ? { display: "inline-block", background: C.tomato, color: "#FFF", padding: `0 ${size * 0.16}px`, borderRadius: size * 0.16, transform: `rotate(${-2 - (1 - Math.min(1, k)) * 12}deg) scale(${k})`, boxShadow: "0 10px 0 #A8240F" }
                  : { display: "inline-block", textShadow: "0 4px 0 rgba(255,255,255,0.7)", transform: `scale(${k})`, opacity: Math.min(1, k * 3) }
              }
            >
              {p.t}
            </span>
          );
        })}
      </div>
    ))}
  </div>
  );
};

const Fondo: React.FC = () => (
  <>
    <rect width={1080} height={1920} fill="url(#pared)" />
    {/* azulejos desenfocados */}
    <g opacity={0.35} filter="url(#desenfoque)">
      {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 135} y1={0} x2={i * 135} y2={900} stroke="#D9B48C" strokeWidth={6} />)}
      {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 135} x2={1080} y2={i * 135} stroke="#D9B48C" strokeWidth={6} />)}
    </g>
    <rect width={1080} height={1920} fill="url(#luzVentana)" />
  </>
);

// ---------- escena 1: ingredientes ----------
export const Ingredientes: React.FC<{ t?: number; sinTitulo?: boolean }> = ({ t = 99, sinTitulo = false }) => (
  <AbsoluteFill style={{ background: C.cream }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <Defs />
      <Fondo />
      <g transform={`translate(0 ${(1 - Math.min(1, pop(t, 0.05))) * 420}) rotate(${Math.sin(t * 5) * 3 * Math.exp(-Math.max(0, t - 99))} 790 1000)`}>
        <Cocinera cx={790} cy={720} s={1.05} />
      </g>
      {/* mesada */}
      <rect x={0} y={1040} width={1080} height={880} fill="url(#mesada)" />
      <rect x={0} y={1040} width={1080} height={880} fill="#fff" filter="url(#textura)" opacity={0.25} />
      <rect x={0} y={1030} width={1080} height={22} fill="#F7EBDD" />
      <Cae t={t} desde={0.05}><Aceite x={150} y={1150} s={0.9} /></Cae>
      {/* tabla de madera en perspectiva */}
      <g filter="url(#sombra)">
        <path d="M 40 1230 L 1040 1210 L 1080 1640 L 0 1660 Z" fill="url(#maderaCanto)" />
        <path d="M 40 1200 L 1040 1180 L 1080 1610 L 0 1630 Z" fill="url(#madera)" />
      </g>
      <path d="M 40 1200 L 1040 1180 L 1080 1610 L 0 1630 Z" fill="#fff" filter="url(#grano)" />
      <path d="M 40 1200 L 1040 1180" stroke="#F3C891" strokeWidth={5} />
      {/* ingredientes grandes, en primer plano */}
      <Cae t={t} desde={0.0}><Cebolla cx={250} cy={1310} r={125} /></Cae>
      <Cae t={t} desde={0.26}><Pimenton x={760} y={1090} w={170} h={230} /></Cae>
      <Cae t={t} desde={0.14}><Ajo cx={560} cy={1290} r={80} /></Cae>
      <Cae t={t} desde={0.08}><Tomate cx={190} cy={1500} r={135} rot={-8} /></Cae>
      <Cae t={t} desde={0.2}><Tomate cx={455} cy={1490} r={120} rot={12} /></Cae>
      <Cae t={t} desde={0.38}><Tomate cx={340} cy={1600} r={95} rot={4} /></Cae>
      <Cae t={t} desde={0.32}><Huevo cx={700} cy={1455} r={72} rot={-10} /></Cae>
      <Cae t={t} desde={0.44}><Huevo cx={855} cy={1460} r={70} rot={14} /></Cae>
      <Cae t={t} desde={0.5}><Huevo cx={780} cy={1575} r={68} rot={-70} /></Cae>
      <Cae t={t} desde={0.56}><Perejil x={890} y={1640} s={1.2} rot={-40} /></Cae>
      {/* sal en grano */}
      <g opacity={Math.min(1, Math.max(0, (t - 0.6) * 5))}>{Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={590 + rnd(i) * 120} y={1590 + rnd(i + 40) * 40} width={7} height={7} fill="#FFFFFF" opacity={0.9} transform={`rotate(${rnd(i + 7) * 90} ${594 + rnd(i) * 120} ${1594 + rnd(i + 40) * 40})`} />
      ))}</g>
    </svg>
    {!sinTitulo && <Titulo lineas={[[{ t: "¿QUÉ HARÍAS" }], [{ t: "CON" }, { t: "ESTO?", marca: true }]]} y={250} size={112} t={t} apar={[0.1, 0.75, 1.0]} />}
  </AbsoluteFill>
);

// ---------- escena 2: preparación ----------
export const Burbujas: React.FC<{ cx: number; cy: number; rx: number; ry: number; n: number; seed: number }> = ({ cx, cy, rx, ry, n, seed }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(seed + i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + i + 99));
      const x = cx + Math.cos(a) * rx * d * 0.9;
      const y = cy + Math.sin(a) * ry * d * 0.9;
      const r = 6 + rnd(seed + i + 7) * 16;
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#F2603C" />
          <circle cx={x} cy={y} r={r} fill="none" stroke="#8E1E0E" strokeWidth={2} opacity={0.5} />
          <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.35} ry={r * 0.2} fill="#FFFFFF" opacity={0.7} />
        </g>
      );
    })}
  </>
);

export const Picado: React.FC<{ cx: number; cy: number; rx: number; ry: number; n: number; seed: number }> = ({ cx, cy, rx, ry, n, seed }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(seed + i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + i + 50));
      const x = cx + Math.cos(a) * rx * d * 0.92;
      const y = cy + Math.sin(a) * ry * d * 0.92;
      const tipo = i % 3;
      const rot = rnd(seed + i + 3) * 180;
      if (tipo === 0) return <path key={i} d={`M ${x - 14} ${y} q 14 -12 28 0`} stroke="#F3C996" strokeWidth={6} fill="none" opacity={0.75} strokeLinecap="round" transform={`rotate(${rot} ${x} ${y})`} />;
      if (tipo === 1) return <rect key={i} x={x} y={y} width={9} height={5} fill="#7A1A0A" opacity={0.6} transform={`rotate(${rot} ${x} ${y})`} />;
      return <circle key={i} cx={x} cy={y} r={3} fill="#5E1208" opacity={0.5} />;
    })}
  </>
);

export const Vapor: React.FC<{ x: number; y: number; h: number; o?: number }> = ({ x, y, h, o = 0.55 }) => (
  <g opacity={o} filter="url(#vapor)">
    <path d={`M ${x} ${y} c -70 ${-h * 0.18} 70 ${-h * 0.36} 0 ${-h * 0.55} c -60 ${-h * 0.16} 50 ${-h * 0.3} 20 ${-h * 0.45}`} stroke="#FFFFFF" strokeWidth={44} strokeLinecap="round" fill="none" />
    <path d={`M ${x + 40} ${y - 20} c 50 ${-h * 0.15} -50 ${-h * 0.3} 10 ${-h * 0.5}`} stroke="#FFFFFF" strokeWidth={26} strokeLinecap="round" fill="none" opacity={0.7} />
  </g>
);

export const Sarten: React.FC<{ cx: number; cy: number; rx: number; ry: number; mango?: "izq" | "der"; children?: React.ReactNode }> = ({ cx, cy, rx, ry, mango = "der", children }) => (
  <g>
    <ellipse cx={cx + 10} cy={cy + ry * 0.2} rx={rx * 1.05} ry={ry * 1.02} fill="#3A1E0E" opacity={0.4} filter="url(#desenfoque)" />
    {mango === "der" ? (
      <path d={`M ${cx + rx * 0.9} ${cy + ry * 0.15} L ${cx + rx * 1.6} ${cy + ry * 0.55} Q ${cx + rx * 1.68} ${cy + ry * 0.66} ${cx + rx * 1.58} ${cy + ry * 0.72} L ${cx + rx * 0.84} ${cy + ry * 0.42} Z`} fill="url(#borde)" />
    ) : (
      <path d={`M ${cx - rx * 0.9} ${cy + ry * 0.15} L ${cx - rx * 1.6} ${cy + ry * 0.55} Q ${cx - rx * 1.68} ${cy + ry * 0.66} ${cx - rx * 1.58} ${cy + ry * 0.72} L ${cx - rx * 0.84} ${cy + ry * 0.42} Z`} fill="url(#borde)" />
    )}
    <ellipse cx={cx} cy={cy + ry * 0.12} rx={rx} ry={ry} fill="url(#borde)" />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#4A423E" />
    <ellipse cx={cx} cy={cy + ry * 0.04} rx={rx * 0.93} ry={ry * 0.9} fill="url(#hierro)" />
    <path d={`M ${cx - rx * 0.85} ${cy - ry * 0.25} A ${rx} ${ry} 0 0 1 ${cx + rx * 0.2} ${cy - ry * 0.98}`} stroke="#8A817C" strokeWidth={6} fill="none" opacity={0.7} />
    {children}
  </g>
);

export const Salsa: React.FC<{ cx: number; cy: number; rx: number; ry: number; seed: number }> = ({ cx, cy, rx, ry, seed }) => (
  <>
    <path d={blob(cx, cy, rx, ry, seed, 0.03, 18)} fill="url(#salsa)" />
    <path d={blob(cx, cy, rx, ry, seed, 0.03, 18)} fill="#fff" filter="url(#textura)" opacity={0.6} />
    <path d={blob(cx - rx * 0.15, cy - ry * 0.2, rx * 0.45, ry * 0.3, seed + 5, 0.2, 10)} fill="#FF7A55" opacity={0.25} />
  </>
);

const Preparacion: React.FC = () => {
  const P = { cx: 520, cy: 1130, rx: 470, ry: 330 };
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <Defs />
        <rect width={1080} height={1920} fill="#3B2C25" />
        <radialGradient id="hornalla" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#5A463C" />
          <stop offset="1" stopColor="#1E1714" />
        </radialGradient>
        <rect width={1080} height={1920} fill="url(#hornalla)" />
        {/* llama azul bajo la sartén */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const x = P.cx + Math.cos(a) * P.rx * 0.95;
          const y = P.cy + P.ry * 0.25 + Math.sin(a) * P.ry * 0.95;
          return <ellipse key={i} cx={x} cy={y} rx={18} ry={34} fill="#5EA8FF" opacity={0.55} filter="url(#vapor)" />;
        })}
        <Sarten {...P} mango="izq">
          <Salsa cx={P.cx} cy={P.cy + 10} rx={P.rx * 0.88} ry={P.ry * 0.84} seed={2} />
          <Picado cx={P.cx} cy={P.cy + 10} rx={P.rx * 0.85} ry={P.ry * 0.8} n={70} seed={11} />
          <Burbujas cx={P.cx} cy={P.cy + 10} rx={P.rx * 0.8} ry={P.ry * 0.75} n={16} seed={5} />
          {/* hueco con un huevo recién caído (clara cruda) */}
          <ellipse cx={P.cx - 170} cy={P.cy + 60} rx={110} ry={70} fill="#6E160A" opacity={0.6} />
          <path d={blob(P.cx - 170, P.cy + 55, 105, 66, 3, 0.14)} fill="url(#claraCruda)" />
          <ellipse cx={P.cx - 165} cy={P.cy + 48} rx={42} ry={32} fill="url(#yema)" filter="url(#sombraSuave)" />
          <ellipse cx={P.cx - 178} cy={P.cy + 38} rx={13} ry={7} fill="#FFFFFF" opacity={0.85} />
          {/* hueco vacío esperando el siguiente */}
          <ellipse cx={P.cx + 160} cy={P.cy - 20} rx={100} ry={64} fill="#5E1208" opacity={0.75} />
          <ellipse cx={P.cx + 160} cy={P.cy - 12} rx={84} ry={50} fill="#3A0A04" opacity={0.4} />
          {/* gota de clara y yema cayendo */}
          <path d={`M ${P.cx + 170} ${P.cy - 330} q -22 120 -8 240 q 14 30 28 0 q 6 -120 -20 -240`} fill="#FFF4E2" opacity={0.6} />
          <ellipse cx={P.cx + 172} cy={P.cy - 130} rx={34} ry={40} fill="url(#yema)" />
          <ellipse cx={P.cx + 162} cy={P.cy - 145} rx={10} ry={7} fill="#FFFFFF" opacity={0.85} />
        </Sarten>
        <Vapor x={300} y={1010} h={300} o={0.5} />
        <Vapor x={520} y={960} h={240} o={0.35} />
        {/* mano partiendo el huevo: las dos mitades de cáscara se separan */}
        <g filter="url(#sombra)">
          <path d="M 1180 470 Q 960 500 870 620" stroke="#F4EDE3" strokeWidth={120} strokeLinecap="round" fill="none" />
          <path d="M 1180 470 Q 960 500 870 620" stroke="#000" strokeWidth={120} strokeLinecap="round" fill="none" opacity={0.06} />
          {/* palma */}
          <ellipse cx={810} cy={665} rx={92} ry={70} fill="url(#piel)" transform="rotate(-18 810 665)" />
          {/* media cáscara izquierda, sostenida entre pulgar e índice */}
          <path d="M 640 735 Q 650 810 715 815 Q 770 812 776 750 L 760 762 L 744 746 L 728 764 L 712 746 L 696 764 L 680 746 L 664 764 L 650 746 Z" fill="url(#huevo)" />
          <path d="M 650 750 Q 700 735 770 752" stroke="#FFF4E2" strokeWidth={6} fill="none" opacity={0.8} />
          {/* media cáscara derecha */}
          <path d="M 800 770 Q 806 840 866 846 Q 924 842 930 776 L 914 788 L 898 772 L 882 790 L 866 772 L 850 790 L 834 772 L 818 790 Z" fill="url(#huevo)" />
          {/* dedos que abrazan cada mitad */}
          {[[690, 718, -30], [728, 712, -10], [842, 742, 10], [880, 744, 28]].map(([x, y, r], i) => (
            <rect key={i} x={x - 17} y={y - 48} width={34} height={92} rx={17} fill="url(#piel)" stroke="#D9A47C" strokeWidth={2} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          <rect x={758} y={700} width={36} height={100} rx={18} fill="url(#piel)" stroke="#D9A47C" strokeWidth={2} transform="rotate(-4 776 750)" />
        </g>
      </svg>
      {/* salto de tiempo */}
      <div style={{ position: "absolute", left: 72, top: 250, display: "flex", alignItems: "center", gap: 26 }}>
        <svg width={150} height={150} viewBox="0 0 150 150">
          <circle cx={75} cy={75} r={68} fill={C.cream} stroke={C.ink} strokeWidth={10} />
          <path d="M 75 75 L 75 7 A 68 68 0 0 1 133 110 Z" fill={C.tomato} opacity={0.85} />
          <path d="M 75 75 L 75 30 M 75 75 L 108 92" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
          <circle cx={75} cy={75} r={8} fill={C.ink} />
        </svg>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, lineHeight: 0.98, color: "#FFF6EA", textShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>
          10 MIN
          <br />
          <span style={{ color: C.mustard }}>DESPUÉS</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, top: 1500, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {["cebolla", "ajo + pimentón", "tomate", "huevos"].map((p, i, a) => (
          <div key={p} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 36, color: i === a.length - 1 ? C.ink : "#FFF6EA", background: i === a.length - 1 ? C.mustard : "rgba(255,246,234,0.14)", padding: "10px 22px", borderRadius: 40 }}>
            {i === a.length - 1 ? "→ " : ""}
            {p}
            {i < a.length - 2 ? " ✓" : i === a.length - 2 ? " ✓" : ""}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- escena 3: plato revelado ----------
export const HuevoCocido: React.FC<{ cx: number; cy: number; r: number; seed: number }> = ({ cx, cy, r, seed }) => (
  <g>
    <path d={blob(cx + 6, cy + 10, r * 1.15, r * 0.95, seed, 0.16)} fill="#5E1208" opacity={0.45} filter="url(#sombraSuave)" />
    <path d={blob(cx, cy, r * 1.1, r * 0.9, seed, 0.16)} fill="url(#clara)" />
    <path d={blob(cx, cy, r * 1.1, r * 0.9, seed, 0.16)} fill="none" stroke="#E8C9A0" strokeWidth={4} opacity={0.7} />
    {/* bordes apenas dorados */}
    <path d={blob(cx, cy, r * 1.1, r * 0.9, seed, 0.16)} fill="none" stroke="#D99A55" strokeWidth={2} opacity={0.4} strokeDasharray="30 50" />
    <ellipse cx={cx + r * 0.08} cy={cy + r * 0.08} rx={r * 0.48} ry={r * 0.42} fill="#B86A1A" opacity={0.35} filter="url(#vapor)" />
    <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.4} fill="url(#yema)" />
    <ellipse cx={cx - r * 0.14} cy={cy - r * 0.16} rx={r * 0.13} ry={r * 0.08} fill="#FFFFFF" opacity={0.9} transform={`rotate(-20 ${cx - r * 0.14} ${cy - r * 0.16})`} />
    <ellipse cx={cx + r * 0.12} cy={cy + r * 0.15} rx={r * 0.06} ry={r * 0.03} fill="#FFFFFF" opacity={0.5} />
  </g>
);

export const Hojitas: React.FC<{ cx: number; cy: number; rx: number; ry: number; n: number; seed: number }> = ({ cx, cy, rx, ry, n, seed }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(seed + i) * Math.PI * 2;
      const d = Math.sqrt(rnd(seed + i + 31));
      const x = cx + Math.cos(a) * rx * d;
      const y = cy + Math.sin(a) * ry * d;
      const s = 0.5 + rnd(seed + i + 17) * 0.7;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rnd(seed + i + 3) * 360}) scale(${s})`}>
          <path d="M 0 0 C -10 -6 -16 -18 -8 -24 C -6 -32 6 -32 8 -24 C 16 -18 10 -6 0 0 Z" fill={i % 4 === 0 ? "#2C6B42" : "#3C8D5A"} />
          <path d="M 0 0 L 0 -24" stroke="#7CC08E" strokeWidth={1.5} opacity={0.7} />
        </g>
      );
    })}
  </>
);

export const Revelacion: React.FC<{ t?: number; limpio?: boolean }> = ({ t = 99, limpio = false }) => {
  const plop = (d: number) => { const u = Math.max(0, t - d); return 1 + 0.14 * Math.exp(-u * 7) * Math.cos(u * 18); };
  const P = { cx: 540, cy: 1040, rx: 505, ry: 400 };
  const S = { cx: P.cx, cy: P.cy + 8, rx: P.rx * 0.9, ry: P.ry * 0.86 };
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
        <Defs />
        {/* mesa de madera vista desde arriba */}
        <rect width={1080} height={1920} fill="url(#madera)" />
        <rect width={1080} height={1920} fill="#fff" filter="url(#grano)" />
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} y1={160 + i * 330} x2={1080} y2={150 + i * 330} stroke="#9A5E2C" strokeWidth={5} opacity={0.5} />)}
        <radialGradient id="foco" cx="0.5" cy="0.55" r="0.65">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2A1206" stopOpacity="0.55" />
        </radialGradient>
        <rect width={1080} height={1920} fill="url(#foco)" />
        {/* paño */}
        <g transform="rotate(-8 900 1600)" filter="url(#sombra)">
          <rect x={640} y={1460} width={520} height={360} rx={16} fill="#F7F1E6" />
          {Array.from({ length: 5 }, (_, i) => <rect key={i} x={640} y={1490 + i * 64} width={520} height={18} fill={C.tomato} opacity={0.75} />)}
        </g>
        <Sarten {...P} mango="der">
          <Salsa {...S} seed={7} />
          <Picado {...S} n={110} seed={23} />
          {/* reducción oscura junto al borde */}
          <path d={blob(S.cx, S.cy, S.rx, S.ry, 7, 0.03, 18)} fill="none" stroke="#5E1208" strokeWidth={22} opacity={0.5} />
          <g transform={`translate(${P.cx - 200} ${P.cy - 120}) scale(${plop(0.0)}) translate(${-(P.cx - 200)} ${-(P.cy - 120)})`}><HuevoCocido cx={P.cx - 200} cy={P.cy - 120} r={130} seed={1} /></g>
          <g transform={`translate(${P.cx + 195} ${P.cy - 100}) scale(${plop(0.07)}) translate(${-(P.cx + 195)} ${-(P.cy - 100)})`}><HuevoCocido cx={P.cx + 195} cy={P.cy - 100} r={125} seed={4} /></g>
          <g transform={`translate(${P.cx - 150} ${P.cy + 175}) scale(${plop(0.14)}) translate(${-(P.cx - 150)} ${-(P.cy + 175)})`}><HuevoCocido cx={P.cx - 150} cy={P.cy + 175} r={128} seed={8} /></g>
          <g transform={`translate(${P.cx + 220} ${P.cy + 170}) scale(${plop(0.21)}) translate(${-(P.cx + 220)} ${-(P.cy + 170)})`}><HuevoCocido cx={P.cx + 220} cy={P.cy + 170} r={122} seed={12} /></g>
          <g transform={`translate(0 ${-(1 - Math.min(1, Math.max(0, (t - 0.25) / 0.5))) * 140})`} opacity={Math.min(1, Math.max(0, (t - 0.25) / 0.3))}>
            <Hojitas {...S} n={46} seed={41} />
          </g>
          {/* pimienta y pimentón por encima */}
          {Array.from({ length: 60 }, (_, i) => {
            const a = rnd(i + 300) * Math.PI * 2;
            const d = Math.sqrt(rnd(i + 400));
            return <circle key={i} cx={S.cx + Math.cos(a) * S.rx * d} cy={S.cy + Math.sin(a) * S.ry * d} r={2 + rnd(i) * 2.5} fill={i % 2 ? "#2B2118" : "#9E2412"} opacity={0.7} />;
          })}
        </Sarten>
        <Vapor x={360} y={960} h={300} o={0.5} />
        <Vapor x={700} y={930} h={340} o={0.42} />
        {/* pan para mojar */}
        <g transform="rotate(18 150 1560)" filter="url(#sombra)">
          <path d="M 30 1500 Q 20 1420 110 1410 Q 200 1400 260 1440 Q 300 1480 280 1560 L 60 1590 Q 30 1560 30 1500 Z" fill="#B8742F" />
          <path d="M 52 1505 Q 46 1440 115 1432 Q 190 1424 240 1456 Q 268 1484 256 1548 L 74 1572 Q 54 1550 52 1505 Z" fill="#F2DCAE" />
          {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={90 + rnd(i + 60) * 150} cy={1460 + rnd(i + 70) * 90} r={3 + rnd(i) * 4} fill="#D9B97E" />)}
        </g>
      </svg>
      {!limpio && (
        <>
      <Titulo lineas={[[{ t: "HUEVOS EN SALSA" }], [{ t: "DE" }, { t: "TOMATE", marca: true }]]} y={250} size={88} derecha={72} t={t} apar={[0.2, 0.85, 1.2]} />
      <div style={{ position: "absolute", left: 72, right: 72, top: 1500, display: "flex", gap: 16, justifyContent: "center" }}>
        {["Para 2", "≈ 25 min", "8 ingredientes"].map((p, i) => (
          <div key={p} style={{ transform: `scale(${pop(t, 1.5 + i * 0.1)})`, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.ink, background: C.cream, padding: "12px 26px", borderRadius: 40, boxShadow: "0 8px 0 rgba(43,33,24,0.25)" }}>
            {p}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, top: 1610, display: "flex", justifyContent: "center", opacity: Math.min(1, Math.max(0, (t - 1.8) * 4)) }}>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: "#FFF6EA", background: "rgba(43,33,24,0.78)", padding: "8px 22px", borderRadius: 30 }}>
        Receta de ejemplo · ilustración
        </div>
      </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- logo para el perfil (TikTok lo recorta en círculo) ----------
export const Logo: React.FC = () => (
  <AbsoluteFill style={{ background: C.cream }}>
    <svg width={1080} height={1080} viewBox="0 0 1080 1080">
      <Defs />
      <radialGradient id="fondoLogo" cx="0.5" cy="0.42" r="0.6">
        <stop offset="0" stopColor="#F27A55" />
        <stop offset="0.7" stopColor={C.tomato} />
        <stop offset="1" stopColor="#B83218" />
      </radialGradient>
      <rect width={1080} height={1080} fill="url(#fondoLogo)" />
      {/* rayos suaves detrás */}
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M 540 470 L 520 -200 L 560 -200 Z" fill="#FFF6EA" opacity={0.08} transform={`rotate(${i * 22.5} 540 470)`} />
      ))}
      <circle cx={540} cy={470} r={330} fill="#FFF6EA" opacity={0.95} />
      <Cocinera cx={540} cy={540} s={1.75} feliz />
      {/* sartén chiquita con huevos, abajo a la derecha */}
      <g transform="translate(760 820) rotate(-14) scale(0.36) translate(-540 -1040)" filter="url(#sombra)">
        <Sarten cx={540} cy={1040} rx={440} ry={350} mango="der">
          <Salsa cx={540} cy={1048} rx={396} ry={300} seed={7} />
          <HuevoCocido cx={380} cy={950} r={120} seed={1} />
          <HuevoCocido cx={700} cy={960} r={118} seed={4} />
          <HuevoCocido cx={540} cy={1170} r={120} seed={8} />
        </Sarten>
      </g>
    </svg>
  </AbsoluteFill>
);

export const HuevosClave: React.FC<{ escena: 1 | 2 | 3 }> = ({ escena }) =>
  escena === 1 ? <Ingredientes /> : escena === 2 ? <Preparacion /> : <Revelacion />;
