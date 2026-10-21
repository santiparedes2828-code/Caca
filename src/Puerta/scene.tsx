import React from "react";
import { random } from "remotion";
import { E } from "../Reflejo/scene";

// Ilustración única del reel (estilo-explicador.md §4): salón y cocina separados por una puerta, en corte.
// Coordenadas de escena: 1080 x 720. Plana, crema + contorno grueso, sin degradados.

const SW = 9;
export const FLOOR = 620;
export const DOOR = { x0: 500, x1: 580, top: 200 };
export const SPOT = {
  door: { x: 540, y: 400 },
  kitchen: { x: 800, y: 380 },
  hall: { x: 260, y: 420 },
  wide: { x: 540, y: 380 },
};
export const headOf = (x: number) => ({ x, y: 300 });

export type Bubble = { kind: "glass" | "question" | "blank" | "brain"; s: number; shatter: number };
export type Face = "normal" | "blank";

const Shards: React.FC<{ cx: number; cy: number; p: number }> = ({ cx, cy, p }) => (
  <g opacity={1 - p * 0.9}>
    {Array.from({ length: 16 }, (_, i) => {
      const a = random(`a${i}`) * Math.PI * 2;
      const d = (60 + random(`d${i}`) * 160) * p;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d + 120 * p * p;
      const r = 8 + random(`r${i}`) * 16;
      return <path key={i} d={`M${x} ${y - r} L${x + r * 0.8} ${y + r * 0.6} L${x - r * 0.7} ${y + r * 0.4} Z`} fill={i % 3 === 0 ? E.red : E.cream} stroke={E.line} strokeWidth={4} transform={`rotate(${p * 400 * (random(`s${i}`) - 0.5)} ${x} ${y})`} />;
    })}
  </g>
);

const ThoughtBubble: React.FC<{ x: number; y: number; b: Bubble; t: number }> = ({ x, y, b, t }) => {
  if (b.s <= 0) return null;
  const cx = x + 120;
  const cy = y - 170;
  if (b.shatter > 0) return <Shards cx={cx} cy={cy} p={b.shatter} />;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${b.s}) translate(${-cx} ${-cy})`}>
      <circle cx={x + 40} cy={y - 70} r={10} fill={E.cream} stroke={E.line} strokeWidth={5} />
      <circle cx={x + 64} cy={y - 100} r={15} fill={E.cream} stroke={E.line} strokeWidth={6} />
      <path
        d={`M${cx - 90} ${cy + 40} C${cx - 140} ${cy + 40} ${cx - 140} ${cy - 30} ${cx - 90} ${cy - 34} C${cx - 90} ${cy - 90} ${cx - 10} ${cy - 96} ${cx + 4} ${cy - 60} C${cx + 30} ${cy - 100} ${cx + 120} ${cy - 80} ${cx + 100} ${cy - 24} C${cx + 150} ${cy - 10} ${cx + 130} ${cy + 50} ${cx + 84} ${cy + 44} Z`}
        fill={b.kind === "blank" ? "#FFFFFF" : E.cream}
        stroke={E.line}
        strokeWidth={8}
      />
      {b.kind === "glass" ? (
        <g transform={`translate(${cx} ${cy - 10}) rotate(${6 * Math.sin(t * 7)})`}>
          <path d="M-28 -40 L28 -40 L20 38 L-20 38 Z" fill="#CFE7F2" stroke={E.line} strokeWidth={6} strokeLinejoin="round" />
          <path d="M-24 -6 L24 -6 L20 38 L-20 38 Z" fill="#6FB7E8" />
          <path d="M-28 -40 L28 -40 L20 38 L-20 38 Z" fill="none" stroke={E.line} strokeWidth={6} strokeLinejoin="round" />
        </g>
      ) : null}
      {b.kind === "question" ? (
        <text x={cx} y={cy + 26} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={86} fill={E.line}>
          ?
        </text>
      ) : null}
      {b.kind === "brain" ? (
        <g transform={`translate(${cx} ${cy - 6})`}>
          <path d="M-40 10 C-56 -10 -40 -40 -16 -36 C-8 -52 22 -50 26 -34 C50 -34 56 -6 40 8 C46 30 20 42 4 32 C-12 44 -40 34 -40 10 Z" fill="#F2B8B5" stroke={E.line} strokeWidth={6} />
          <path d="M-2 -32 C-10 -10 8 6 0 30 M-30 -6 C-16 -8 -12 4 -20 14 M28 -14 C16 -10 18 4 30 10" stroke={E.line} strokeWidth={4} fill="none" />
          <path d="M-46 -46 L46 46 M46 -46 L-46 46" stroke={E.red} strokeWidth={12} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

const Person: React.FC<{ x: number; walk: number; face: Face }> = ({ x, walk, face }) => {
  const sw = Math.sin(walk);
  const bob = Math.abs(Math.cos(walk)) * 6;
  const hip = { x, y: 470 - bob };
  const leg = (s: number) => `M${hip.x} ${hip.y} L${hip.x + 34 * s} ${FLOOR - 14}`;
  const arm = (s: number) => `M${x} ${380 - bob} L${x - 30 * s} ${460 - bob}`;
  const head = headOf(x);
  return (
    <g>
      {[sw, -sw].map((s, k) => (
        <g key={k}>
          <path d={leg(s)} stroke={E.line} strokeWidth={44} strokeLinecap="round" />
          <path d={leg(s)} stroke="#3B4A63" strokeWidth={28} strokeLinecap="round" />
        </g>
      ))}
      <rect x={x - 46} y={350 - bob} width={92} height={140} rx={40} fill={E.cream} stroke={E.line} strokeWidth={SW} />
      <path d={arm(sw)} stroke={E.line} strokeWidth={38} strokeLinecap="round" />
      <path d={arm(sw)} stroke={E.cream} strokeWidth={22} strokeLinecap="round" />
      <g transform={`translate(0 ${-bob})`}>
        <circle cx={head.x} cy={head.y} r={52} fill={E.skin} stroke={E.line} strokeWidth={SW} />
        <path d={`M${head.x - 52} ${head.y - 6} A52 52 0 0 1 ${head.x + 52} ${head.y - 6} L${head.x + 40} ${head.y - 14} Q${head.x} ${head.y - 40} ${head.x - 40} ${head.y - 14} Z`} fill={E.line} />
        {face === "blank" ? (
          <g>
            <circle cx={head.x + 6} cy={head.y + 6} r={10} fill="#fff" stroke={E.line} strokeWidth={4} />
            <circle cx={head.x + 34} cy={head.y + 6} r={10} fill="#fff" stroke={E.line} strokeWidth={4} />
            <circle cx={head.x + 6} cy={head.y + 6} r={3} fill={E.line} />
            <circle cx={head.x + 34} cy={head.y + 6} r={3} fill={E.line} />
            <ellipse cx={head.x + 22} cy={head.y + 32} rx={8} ry={6} fill={E.line} />
          </g>
        ) : (
          <g>
            <circle cx={head.x + 8} cy={head.y + 4} r={6} fill={E.line} />
            <circle cx={head.x + 34} cy={head.y + 4} r={6} fill={E.line} />
            <path d={`M${head.x + 12} ${head.y + 28} q10 8 22 0`} stroke={E.line} strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
};

export const Rooms: React.FC<{
  t: number;
  personX: number;
  walk: number;
  face: Face;
  bubble: Bubble;
  leftGrey: number; // 0..1 el salón se "archiva"
  doorGlow: number;
}> = ({ t, personX, walk, face, bubble, leftGrey, doorGlow }) => (
  <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ overflow: "visible" }}>
    <defs>
      <clipPath id="salon">
        <rect x={-300} y={-200} width={300 + DOOR.x0} height={1100} />
      </clipPath>
    </defs>
    {/* Salón */}
    <rect x={-300} y={-200} width={800} height={820} fill={E.cream} />
    <rect x={120} y={60} width={200} height={160} fill="#BFD9E6" stroke={E.line} strokeWidth={SW} />
    <line x1={220} y1={60} x2={220} y2={220} stroke={E.line} strokeWidth={6} />
    <rect x={-120} y={440} width={240} height={110} rx={24} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <rect x={-120} y={380} width={240} height={80} rx={24} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <line x1={380} y1={260} x2={380} y2={FLOOR} stroke={E.line} strokeWidth={8} />
    <path d="M340 200 L420 200 L400 260 L360 260 Z" fill={E.gold} stroke={E.line} strokeWidth={7} strokeLinejoin="round" />
    {/* Velo gris: lo de antes queda archivado */}
    <rect x={-300} y={-200} width={300 + DOOR.x0} height={820} fill="#1E1A17" opacity={0.55 * leftGrey} />
    {/* Cocina */}
    <rect x={DOOR.x1} y={-200} width={900} height={820} fill={E.shade} />
    {Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 12 }, (_, c) => <rect key={`${r}-${c}`} x={DOOR.x1 + 20 + c * 56} y={300 + r * 56} width={50} height={50} fill="none" stroke="rgba(26,22,19,0.08)" strokeWidth={3} />),
    )}
    <rect x={820} y={230} width={170} height={390} rx={18} fill="#F7F4EC" stroke={E.line} strokeWidth={SW} />
    <line x1={820} y1={360} x2={990} y2={360} stroke={E.line} strokeWidth={6} />
    <rect x={836} y={280} width={10} height={60} rx={5} fill={E.line} />
    <rect x={836} y={380} width={10} height={80} rx={5} fill={E.line} />
    {/* Pared con la puerta */}
    <rect x={DOOR.x0 - 30} y={-200} width={DOOR.x1 - DOOR.x0 + 60} height={DOOR.top + 200} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <rect x={DOOR.x0 - 30} y={DOOR.top - 10} width={30} height={FLOOR - DOOR.top + 10} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    {/* Hoja de la puerta, abierta hacia el salón */}
    <path d={`M${DOOR.x0} ${DOOR.top} L${DOOR.x0 - 120} ${DOOR.top + 40} L${DOOR.x0 - 120} ${FLOOR - 20} L${DOOR.x0} ${FLOOR}`} fill="#8A6A55" stroke={E.line} strokeWidth={SW} strokeLinejoin="round" />
    <circle cx={DOOR.x0 - 100} cy={420} r={8} fill={E.gold} stroke={E.line} strokeWidth={4} />
    {doorGlow > 0 ? (
      <rect x={DOOR.x0 - 6} y={DOOR.top - 6} width={DOOR.x1 - DOOR.x0 + 12} height={FLOOR - DOOR.top + 6} fill="rgba(226,72,61,0.12)" stroke={E.red} strokeWidth={10} opacity={doorGlow} />
    ) : null}
    {/* Suelo */}
    <rect x={-300} y={FLOOR} width={1700} height={300} fill="#2B2622" />
    <line x1={-300} y1={FLOOR} x2={1400} y2={FLOOR} stroke={E.line} strokeWidth={SW} />

    <Person x={personX} walk={walk} face={face} />
    {/* Marco derecho por delante de la persona: se nota que "cruza" */}
    <rect x={DOOR.x1} y={DOOR.top - 10} width={30} height={FLOOR - DOOR.top + 10} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <ThoughtBubble x={personX} y={headOf(personX).y} b={bubble} t={t} />
  </svg>
);
