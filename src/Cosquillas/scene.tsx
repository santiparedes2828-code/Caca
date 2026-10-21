import React from "react";
import { E } from "../Reflejo/scene";

// Ilustración única del reel (estilo-explicador.md §4): persona en el sofá haciéndose cosquillas en el pie.
// Coordenadas de escena: 1080 x 720. Plana, crema + contorno grueso, sin degradados.

const SW = 9;

export const SPOT = {
  foot: { x: 640, y: 440 },
  hand: { x: 590, y: 400 },
  head: { x: 380, y: 236 },
  wide: { x: 540, y: 390 },
};

export type Face = "flat" | "laugh" | "think";

// Ondas de sensación alrededor del pie: fuertes y rojas (cosquillas de otro) o pequeñas y grises (las tuyas)
const Waves: React.FC<{ amount: number; color: string; t: number }> = ({ amount, color, t }) => {
  if (amount <= 0) return null;
  return (
    <g opacity={Math.min(1, amount * 1.5)}>
      {[0, 1, 2].map((k) => {
        const r = 70 + k * 34 + ((t * 90) % 34);
        return (
          <g key={k}>
            {[-70, -20, 30].map((a) => (
              <path
                key={a}
                d={`M${SPOT.foot.x + r * Math.cos((a * Math.PI) / 180)} ${SPOT.foot.y + r * Math.sin((a * Math.PI) / 180)} l ${10 * amount} ${-8 * amount} l ${10 * amount} ${8 * amount} l ${10 * amount} ${-8 * amount}`}
                transform={`rotate(${a + 90} ${SPOT.foot.x + r * Math.cos((a * Math.PI) / 180)} ${SPOT.foot.y + r * Math.sin((a * Math.PI) / 180)})`}
                stroke={color}
                strokeWidth={5 + 3 * amount}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

const Head: React.FC<{ face: Face; t: number }> = ({ face, t }) => {
  const { x, y } = SPOT.head;
  return (
    <g>
      <circle cx={x} cy={y} r={62} fill={E.skin} stroke={E.line} strokeWidth={SW} />
      {/* Pelo */}
      <path d={`M${x - 62} ${y - 4} A62 62 0 0 1 ${x + 62} ${y - 4} L${x + 50} ${y - 10} Q${x} ${y - 44} ${x - 50} ${y - 10} Z`} fill={E.line} />
      {face === "laugh" ? (
        <g stroke={E.line} strokeWidth={6} fill="none" strokeLinecap="round">
          <path d={`M${x - 34} ${y + 8} l10 -10 l10 10`} />
          <path d={`M${x + 14} ${y + 8} l10 -10 l10 10`} />
          <path d={`M${x - 28} ${y + 24} Q${x} ${y + 64} ${x + 28} ${y + 24} Z`} fill={E.wood} />
          <path d={`M${x - 42} ${y + 14} q-6 ${14 + 4 * Math.sin(t * 9)} 2 22`} stroke="#6FB7E8" strokeWidth={5} />
        </g>
      ) : (
        <g>
          <circle cx={x - 22} cy={y + 4} r={6} fill={E.line} />
          <circle cx={x + 22} cy={y + 4} r={6} fill={E.line} />
          {face === "think" ? (
            <path d={`M${x - 14} ${y + 34} q14 -8 28 0`} stroke={E.line} strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <line x1={x - 16} y1={y + 32} x2={x + 16} y2={y + 32} stroke={E.line} strokeWidth={6} strokeLinecap="round" />
          )}
          <path d={`M${x - 34} ${y - 14} h22 M${x + 12} ${y - 14} h22`} stroke={E.line} strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

// Mano con cuatro dedos que se mueven (cosquillas). `sleeve` es el color de la manga.
const Hand: React.FC<{ x: number; y: number; rot: number; wiggle: number; sleeve: string; from: { x: number; y: number }; outline?: number }> = ({ x, y, rot, wiggle, sleeve, from, outline = 0 }) => (
  <g>
    {outline > 0 ? <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={E.red} strokeWidth={84} strokeLinecap="round" opacity={outline} /> : null}
    <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={E.line} strokeWidth={66} strokeLinecap="round" />
    <line x1={from.x} y1={from.y} x2={x} y2={y} stroke={sleeve} strokeWidth={48} strokeLinecap="round" />
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={34} ry={28} fill={E.skin} stroke={E.line} strokeWidth={6} />
      {[-18, -6, 6, 18].map((dy, k) => {
        const bend = 10 * Math.sin(wiggle + k * 1.3);
        return <path key={k} d={`M18 ${dy} q20 ${bend} 40 ${bend * 0.4}`} stroke={E.line} strokeWidth={17} strokeLinecap="round" fill="none" />;
      })}
      {[-18, -6, 6, 18].map((dy, k) => {
        const bend = 10 * Math.sin(wiggle + k * 1.3);
        return <path key={`s${k}`} d={`M18 ${dy} q20 ${bend} 40 ${bend * 0.4}`} stroke={E.skin} strokeWidth={8} strokeLinecap="round" fill="none" />;
      })}
    </g>
  </g>
);

export const Sofa: React.FC<{
  t: number;
  face: Face;
  shake: number;
  ownWiggle: number; // velocidad de tus dedos (0 = quietos)
  other: number; // 0..1 entra la mano de otra persona
  waves: number;
  mute: number;
  outline: number;
}> = ({ t, face, shake, ownWiggle, other, waves, mute, outline }) => {
  const dx = shake * Math.sin(t * 60) * 6;
  const otherX = 1240 - 520 * other;
  return (
    <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ overflow: "visible" }}>
      {/* Lámpara y cuadro de fondo */}
      <rect x={760} y={40} width={210} height={150} fill={E.shade} stroke={E.line} strokeWidth={SW} />
      <path d="M790 160 L840 100 L880 130 L940 80" stroke={E.wood} strokeWidth={8} fill="none" strokeLinejoin="round" />
      {/* Sofá */}
      <rect x={60} y={170} width={960} height={300} rx={40} fill={E.wood} stroke={E.line} strokeWidth={SW} />
      <rect x={110} y={420} width={860} height={130} rx={26} fill={E.cream} stroke={E.line} strokeWidth={SW} />
      <rect x={20} y={300} width={120} height={270} rx={36} fill={E.wood} stroke={E.line} strokeWidth={SW} />
      <rect x={940} y={300} width={120} height={270} rx={36} fill={E.wood} stroke={E.line} strokeWidth={SW} />
      {[150, 900].map((x) => (
        <rect key={x} x={x} y={550} width={34} height={70} fill={E.line} />
      ))}
      <line x1={540} y1={430} x2={540} y2={540} stroke={E.shade} strokeWidth={6} />
      {/* Suelo */}
      <rect x={-200} y={620} width={1480} height={200} fill="#2B2622" />

      <g transform={`translate(${dx} 0)`}>
        {/* Torso */}
        <path d="M380 300 Q370 380 392 470" stroke={E.line} strokeWidth={128} strokeLinecap="round" fill="none" />
        <path d="M380 300 Q370 380 392 470" stroke={E.cream} strokeWidth={110} strokeLinecap="round" fill="none" />
        {/* Pierna recogida: muslo hacia la rodilla y espinilla bajando al pie */}
        <path d="M400 470 L560 360 L640 470" stroke={E.line} strokeWidth={92} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M400 470 L560 360 L640 470" stroke="#3B4A63" strokeWidth={74} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Pie (planta hacia la cámara) */}
        <ellipse cx={SPOT.foot.x + 16} cy={SPOT.foot.y + 18} rx={46} ry={66} transform={`rotate(-30 ${SPOT.foot.x + 16} ${SPOT.foot.y + 18})`} fill={E.skin} stroke={E.line} strokeWidth={SW} />
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={SPOT.foot.x + 44 + k * 9} cy={SPOT.foot.y - 30 + k * 13} r={11 - k} fill={E.skin} stroke={E.line} strokeWidth={5} />
        ))}
        <Head face={face} t={t} />
        {/* Tu brazo: del hombro a la planta del pie */}
        <Hand x={SPOT.hand.x} y={SPOT.hand.y} rot={20} wiggle={t * ownWiggle} sleeve={E.cream} from={{ x: 410, y: 320 }} outline={outline} />
      </g>
      <Waves amount={mute} color={E.dim} t={t} />
      <Waves amount={waves} color={E.red} t={t} />
      {/* Mano de otra persona, entra desde la derecha */}
      {other > 0 ? <Hand x={otherX - 300 * 0 + 0} y={SPOT.foot.y + 40} rot={200} wiggle={t * 30} sleeve={E.gold} from={{ x: otherX + 400, y: SPOT.foot.y + 110 }} /> : null}
    </svg>
  );
};
