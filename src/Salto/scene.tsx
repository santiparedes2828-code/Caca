import React from "react";
import { Gancho, type Expr } from "../Altera/Gancho";
import { E } from "../Reflejo/scene";

// Ilustración única del reel del salto (estilo-explicador.md §4) con Hookie acostado de lado en la cama.
// Coordenadas de escena: 1080 x 720, como Reflejo. Hookie va girado 90° (la cabeza hacia la almohada, a la derecha).

const SW = 9;

export const HOOKIE = { x: 470, y: 352, scale: 1.0 }; // pies del rig (antes de girarlo)
export const SPOT = {
  head: { x: 760, y: 352 },
  crown: { x: 835, y: 352 }, // coronilla: la diana va aquí para no tapar los ojos
  body: { x: 560, y: 330 },
  heart: { x: 600, y: 360 },
  wide: { x: 540, y: 380 },
};

// Borde superior de la manta (también se usa para el contorno rojo de tensión)
const BLANKET_TOP = "M-40 300 Q260 268 520 284 Q590 290 630 300";
const BLANKET = `${BLANKET_TOP} L646 440 L-40 440 Z`;

export type Sleep = {
  t: number;
  expr: Expr;
  blink: number; // 1 = dormido
  arm: number; // ángulo del brazo de arriba (rig; 0 = estirado hacia los pies, sobre la manta)
  jump: number; // 0..1 sacudida del cuerpo (se despega del colchón)
  outline: number; // contorno rojo de tensión
  heart: number;
  heartBeat: number;
};

export const Bed: React.FC<Sleep> = ({ t, expr, blink, arm, jump, outline, heart, heartBeat }) => {
  const lift = -38 * jump;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 720 }}>
      <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* Cabecero y patas */}
        <rect x={960} y={200} width={52} height={520} rx={10} fill={E.wood} stroke={E.line} strokeWidth={SW} />
        <rect x={870} y={560} width={34} height={160} fill={E.wood} stroke={E.line} strokeWidth={SW} />
        <rect x={-40} y={520} width={1010} height={56} fill={E.wood} stroke={E.line} strokeWidth={SW} />
        {/* Colchón */}
        <rect x={-40} y={436} width={990} height={92} rx={24} fill={E.cream} stroke={E.line} strokeWidth={SW} />
        <line x1={0} y1={482} x2={920} y2={482} stroke={E.dim} strokeWidth={4} strokeDasharray="14 18" />
        {/* Almohada */}
        <ellipse cx={840} cy={414} rx={112} ry={36} fill="#F7F4EC" stroke={E.line} strokeWidth={SW} />
      </svg>

      {/* Hookie acostado: el rig girado 90° sobre los pies */}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${lift}px) rotate(${-3 * jump}deg)`, transformOrigin: "600px 400px" }}>
        <Gancho x={HOOKIE.x} y={HOOKIE.y} scale={HOOKIE.scale} lean={90} t={t} expr={expr} blink={blink} armL={arm} armR={-20} bendL={0.2} look={{ x: 0, y: 0 }} />
        {/* Ojos cerrados: los párpados son de tinta como el cuerpo, así que dormido se dibujan dos arcos marfil */}
        {blink >= 0.9 ? (
          <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`rotate(90 ${HOOKIE.x} ${HOOKIE.y}) translate(${HOOKIE.x - 200 * HOOKIE.scale} ${HOOKIE.y - 520 * HOOKIE.scale}) scale(${HOOKIE.scale})`}>
              {[165, 235].map((cx) => (
                <path key={cx} d={`M${cx - 28} 266 Q${cx} 296 ${cx + 28} 266`} stroke="#FBF8F2" strokeWidth={11} fill="none" strokeLinecap="round" />
              ))}
            </g>
          </svg>
        ) : null}
      </div>

      <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* Manta (tapa piernas y la mitad del cuerpo); sube con la sacudida */}
        <g transform={`translate(0 ${lift * 0.6})`}>
          {outline > 0 ? <path d={BLANKET} fill="none" stroke={E.red} strokeWidth={22} strokeLinejoin="round" opacity={outline} /> : null}
          <path d={BLANKET} fill={E.cream} stroke={E.line} strokeWidth={SW} strokeLinejoin="round" />
          {[140, 300, 460].map((x) => (
            <path key={x} d={`M${x} 292 Q${x + 30} 370 ${x + 10} 436`} stroke={E.shade} strokeWidth={6} fill="none" />
          ))}
          <rect x={40} y={290} width={26} height={150} rx={10} fill={E.line} />
        </g>
        {/* Contorno rojo también alrededor de la cabeza cuando se tensa */}
        {outline > 0 ? <circle cx={SPOT.head.x} cy={SPOT.head.y + lift} r={150} fill="none" stroke={E.red} strokeWidth={6} strokeDasharray="18 14" opacity={outline} /> : null}
        {/* Corazón (sobre la manta, a la altura del pecho) */}
        <g transform={`translate(${SPOT.heart.x} ${SPOT.heart.y + lift * 0.6}) scale(${heart * heartBeat})`} opacity={heart}>
          <path d="M0 22 C-34 -2 -26 -30 -10 -30 C-2 -30 0 -22 0 -18 C0 -22 2 -30 10 -30 C26 -30 34 -2 0 22 Z" fill={E.red} stroke={E.line} strokeWidth={5} />
        </g>
      </svg>
    </div>
  );
};
