import React from "react";
import { A } from "./system";

// GANCHO — el personaje de Hookhouse (biblia en personaje-gancho.md).
// Un frijol de tinta con ojos enormes y un anzuelo naranja que le nace de la cabeza: es la línea-firma de la marca.
// Lo lanza para enganchar, tensar y arrastrar cosas. Coordenadas locales: 400 × 520, ancla = centro de los pies (200, 520).

export type Expr = "normal" | "happy" | "surprised" | "focused" | "smug" | "strain" | "squashed" | "love";
export type Item = "none" | "scissors" | "frame" | "cover" | "popcorn";

export type GanchoPose = {
  x: number; // centro de los pies en el plano
  y: number; // suelo
  scale?: number;
  squash?: number; // + aplasta, − estira (desde los pies)
  lean?: number; // grados
  armL?: number; // ángulo del brazo izquierdo (0 = abajo, 90 = horizontal hacia fuera, 180 = arriba)
  armR?: number;
  bendL?: number; // curvatura del brazo (−1..1)
  bendR?: number;
  walk?: number; // fase de paso (radianes); undefined = quieto
  expr?: Expr;
  look?: { x: number; y: number }; // −1..1
  blink?: number; // 0 abierto · 1 cerrado
  hookOut?: boolean; // el anzuelo está lanzado (se dibuja aparte con <Rope>)
  item?: Item; // objeto en la mano derecha
  flip?: boolean; // mira a la izquierda
  talk?: number; // 0..1 apertura de la boca al hablar (Gancho narra)
  t: number;
};

const INK = A.ink;
const IVORY = "#FBF8F2";
const SH = { L: { x: 108, y: 300 }, R: { x: 292, y: 300 } };
const ARM = 132;
export const ANTENNA = { x: 200, y: 92 }; // punto del que sale la línea cuando lanza el anzuelo

const hand = (side: -1 | 1, angle: number) => {
  const s = side === -1 ? SH.L : SH.R;
  const a = (angle * Math.PI) / 180;
  return { x: s.x + side * Math.sin(a) * ARM, y: s.y + Math.cos(a) * ARM };
};

const Arm: React.FC<{ side: -1 | 1; angle: number; bend: number }> = ({ side, angle, bend }) => {
  const s = side === -1 ? SH.L : SH.R;
  const h = hand(side, angle);
  const mx = (s.x + h.x) / 2;
  const my = (s.y + h.y) / 2;
  const dx = h.x - s.x;
  const dy = h.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend * 34 * side;
  const cy = my + (dx / len) * bend * 34 * side;
  return (
    <g>
      <path d={`M${s.x} ${s.y} Q${cx} ${cy} ${h.x} ${h.y}`} stroke={INK} strokeWidth={17} fill="none" strokeLinecap="round" />
      <circle cx={h.x} cy={h.y} r={23} fill={IVORY} stroke={INK} strokeWidth={7} />
    </g>
  );
};

const Eyes: React.FC<{ expr: Expr; look: { x: number; y: number }; blink: number }> = ({ expr, look, blink }) => {
  const big = expr === "surprised" || expr === "squashed";
  const rx = big ? 40 : 34;
  const ry = big ? 50 : 42;
  const pr = big ? 10 : 14;
  if (expr === "happy" || expr === "love") {
    return (
      <g>
        {[165, 235].map((cx) =>
          expr === "love" ? (
            <path key={cx} d="M0 26 C-46 -4 -34 -36 -14 -36 C-4 -36 0 -28 0 -22 C0 -28 4 -36 14 -36 C34 -36 46 -4 0 26 Z" fill={A.orange} transform={`translate(${cx} 276)`} />
          ) : (
            <path key={cx} d={`M${cx - 26} ${282} Q${cx} ${248} ${cx + 26} ${282}`} stroke={IVORY} strokeWidth={11} fill="none" strokeLinecap="round" />
          ),
        )}
      </g>
    );
  }
  const lidBase = expr === "focused" ? 0.45 : expr === "smug" ? 0.5 : expr === "strain" ? 0.3 : 0;
  return (
    <g>
      {[165, 235].map((cx, k) => {
        const lid = Math.min(1, Math.max(lidBase * (expr === "smug" && k === 0 ? 0.3 : 1), blink));
        return (
          <g key={cx}>
            <ellipse cx={cx} cy={270} rx={rx} ry={ry} fill={IVORY} />
            <circle cx={cx + look.x * (rx - pr - 6)} cy={270 + look.y * (ry - pr - 8)} r={pr} fill={INK} />
            <circle cx={cx + look.x * (rx - pr - 6) + 4} cy={270 + look.y * (ry - pr - 8) - 5} r={4} fill={IVORY} />
            {lid > 0 ? <rect x={cx - rx - 2} y={270 - ry - 2} width={rx * 2 + 4} height={(ry * 2 + 4) * lid} fill={INK} /> : null}
          </g>
        );
      })}
      {expr === "focused" || expr === "strain" ? (
        <g stroke={IVORY} strokeWidth={9} strokeLinecap="round">
          <line x1={136} y1={214} x2={186} y2={228} />
          <line x1={264} y1={214} x2={214} y2={228} />
        </g>
      ) : null}
      {expr === "surprised" ? (
        <g stroke={IVORY} strokeWidth={8} strokeLinecap="round">
          <path d="M135 205 Q165 190 192 205" fill="none" />
          <path d="M208 205 Q235 190 265 205" fill="none" />
        </g>
      ) : null}
    </g>
  );
};

const Mouth: React.FC<{ expr: Expr; t: number; talk: number }> = ({ expr, talk }) => {
  if (talk > 0.05 && (expr === "normal" || expr === "smug" || expr === "happy" || expr === "focused")) {
    return <ellipse cx={200} cy={346} rx={22} ry={5 + 16 * talk} fill={IVORY} />;
  }
  switch (expr) {
    case "happy":
    case "love":
      return <path d="M168 336 Q200 380 232 336 Z" fill={IVORY} />;
    case "surprised":
      return <ellipse cx={200} cy={352} rx={16} ry={20} fill={IVORY} />;
    case "squashed":
      return <path d="M176 350 L188 340 L200 352 L212 340 L224 350" stroke={IVORY} strokeWidth={7} fill="none" strokeLinejoin="round" />;
    case "strain":
      return (
        <g>
          <rect x={172} y={338} width={56} height={22} rx={6} fill={IVORY} />
          <line x1={186} y1={338} x2={186} y2={360} stroke={INK} strokeWidth={4} />
          <line x1={200} y1={338} x2={200} y2={360} stroke={INK} strokeWidth={4} />
          <line x1={214} y1={338} x2={214} y2={360} stroke={INK} strokeWidth={4} />
        </g>
      );
    case "smug":
      return <path d="M178 346 Q206 356 226 334" stroke={IVORY} strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "focused":
      return <line x1={186} y1={348} x2={214} y2={348} stroke={IVORY} strokeWidth={8} strokeLinecap="round" />;
    default:
      return <path d="M180 340 Q200 358 220 340" stroke={IVORY} strokeWidth={8} fill="none" strokeLinecap="round" />;
  }
};

const ItemInHand: React.FC<{ item: Item; at: { x: number; y: number }; t: number }> = ({ item, at, t }) => {
  if (item === "scissors") {
    const open = 14 + 12 * Math.sin(t * 18);
    return (
      <g transform={`translate(${at.x} ${at.y})`}>
        <g transform={`rotate(${-open})`}>
          <path d="M0 0 L120 -10 L118 4 Z" fill="#D9D3C7" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={-26} cy={-14} r={18} fill="none" stroke={INK} strokeWidth={9} />
        </g>
        <g transform={`rotate(${open})`}>
          <path d="M0 0 L120 10 L118 -4 Z" fill="#D9D3C7" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={-26} cy={14} r={18} fill="none" stroke={INK} strokeWidth={9} />
        </g>
        <circle r={7} fill={INK} />
      </g>
    );
  }
  if (item === "frame") {
    return (
      <g transform={`translate(${at.x} ${at.y})`} stroke={A.orange} strokeWidth={12} fill="none" strokeLinecap="square">
        <path d="M-10 -70 L-10 -110 L30 -110" />
        <path d="M110 30 L150 30 L150 -10" />
      </g>
    );
  }
  if (item === "popcorn") {
    return (
      <g transform={`translate(${at.x} ${at.y - 30})`}>
        {[-18, 0, 18, -9, 9].map((dx, k) => (
          <circle key={k} cx={dx} cy={-36 - (k > 2 ? 14 : 0)} r={13} fill={IVORY} stroke={INK} strokeWidth={4} />
        ))}
        <path d="M-34 -30 L34 -30 L26 40 L-26 40 Z" fill={IVORY} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-17 -30 L-13 40 M17 -30 L13 40" stroke={INK} strokeWidth={8} />
      </g>
    );
  }
  return null;
};

export const Gancho: React.FC<GanchoPose> = (p) => {
  const s = p.scale ?? 1;
  const sq = p.squash ?? 0;
  const expr = p.expr ?? "normal";
  const look = p.look ?? { x: 0, y: 0 };
  // Parpadeo automático cada ~3,2 s si no se fuerza
  const autoBlink = (() => {
    const c = (p.t % 3.2) / 3.2;
    return c > 0.96 ? 1 - Math.abs(c - 0.98) / 0.02 : 0;
  })();
  const blink = Math.max(p.blink ?? 0, autoBlink);
  const w = p.walk;
  const step = w === undefined ? 0 : Math.sin(w);
  const bob = w === undefined ? 0 : Math.abs(Math.cos(w)) * 8;
  const idle = w === undefined ? Math.sin(p.t * 2.4) * 0.012 : 0; // respira
  const sy = (1 - 0.3 * sq) * (1 + idle);
  const sx = 1 + 0.2 * sq - idle * 0.5;
  const handR = hand(1, p.armR ?? 20);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - 200 * s,
        top: p.y - 520 * s,
        width: 400 * s,
        height: 520 * s,
        transformOrigin: "50% 100%",
        transform: `rotate(${p.lean ?? 0}deg) scale(${(p.flip ? -1 : 1) * sx}, ${sy})`,
      }}
    >
      {/* Sombra de contacto */}
      <div style={{ position: "absolute", left: 60 * s, top: 500 * s, width: 280 * s, height: 40 * s, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(14,13,11,0.35) 0%, rgba(14,13,11,0) 70%)", filter: "blur(4px)" }} />
      <svg width={400 * s} height={520 * s} viewBox="0 0 400 520" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={`translate(0 ${-bob})`}>
          {/* Piernas y pies */}
          {[-1, 1].map((side) => {
            const hx = 200 + side * 40;
            const fx = hx + side * 6 + step * 26 * side;
            return (
              <g key={side}>
                <path d={`M${hx} 420 L${fx} ${498 + bob}`} stroke={INK} strokeWidth={18} strokeLinecap="round" />
                <ellipse cx={fx + side * 14} cy={504 + bob} rx={38} ry={17} fill={INK} />
              </g>
            );
          })}
          {/* Anzuelo de la cabeza (si no está lanzado) */}
          <path d={`M200 176 L200 ${ANTENNA.y + 24}`} stroke={A.orange} strokeWidth={15} strokeLinecap="round" />
          {!p.hookOut ? (
            <g transform={`rotate(${4 * Math.sin(p.t * 3)} 200 120)`}>
              <path d={`M200 ${ANTENNA.y + 24} L200 92 C200 52 258 52 258 92 L258 112`} stroke={A.orange} strokeWidth={15} fill="none" strokeLinecap="round" />
              <path d="M258 112 L246 98" stroke={A.orange} strokeWidth={11} strokeLinecap="round" />
            </g>
          ) : (
            <circle cx={200} cy={ANTENNA.y + 24} r={11} fill={A.orangeDeep} />
          )}
          {/* Cuerpo: frijol de tinta */}
          <path d="M200 168 C292 168 318 240 316 312 C314 392 270 440 200 440 C130 440 86 392 84 312 C82 240 108 168 200 168 Z" fill={INK} />
          <path d="M128 222 C140 196 164 184 186 182" stroke="rgba(251,248,242,0.16)" strokeWidth={10} fill="none" strokeLinecap="round" />
          <Eyes expr={expr} look={look} blink={blink} />
          <Mouth expr={expr} t={p.t} talk={p.talk ?? 0} />
          {/* Brazos */}
          <Arm side={-1} angle={p.armL ?? 20} bend={p.bendL ?? 0.4} />
          <Arm side={1} angle={p.armR ?? 20} bend={p.bendR ?? 0.4} />
          <ItemInHand item={p.item ?? "none"} at={handR} t={p.t} />
        </g>
      </svg>
    </div>
  );
};

// Punto del plano del que sale la línea cuando lanza el anzuelo (para <Rope ax ay>)
export const antennaWorld = (p: Pick<GanchoPose, "x" | "y" | "scale" | "squash" | "lean">) => {
  const s = p.scale ?? 1;
  const sy = 1 - 0.3 * (p.squash ?? 0);
  const lx = (ANTENNA.x - 200) * s;
  const ly = -(520 - ANTENNA.y - 24) * s * sy;
  const a = ((p.lean ?? 0) * Math.PI) / 180;
  return { x: p.x + lx * Math.cos(a) - ly * Math.sin(a), y: p.y + lx * Math.sin(a) + ly * Math.cos(a) };
};
