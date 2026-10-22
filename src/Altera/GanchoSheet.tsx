import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type Expr } from "./Gancho";
import { A, FONT, LABEL, Paper, Rope } from "./system";

// Hoja de personaje de Gancho (1920 × 1080): pose principal, expresiones, poses de acción y paleta.

const Label: React.FC<{ x: number; y: number; text: string; size?: number; color?: string }> = ({ x, y, text, size = 22, color = A.grey }) => (
  <div style={{ position: "absolute", left: x - 150, width: 300, top: y, textAlign: "center", fontFamily: LABEL, fontSize: size, letterSpacing: "0.08em", color }}>{text}</div>
);

export const GanchoSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = 1.1 + frame / fps;
  const exprs: Expr[] = ["normal", "happy", "surprised", "focused", "smug", "strain", "squashed", "love"];
  const castPose = { x: 1700, y: 1010, scale: 0.5, lean: -6 };
  const NAMES: Record<Expr, string> = { normal: "NORMAL", happy: "FELIZ", surprised: "SORPRESA", focused: "CONCENTRADO", smug: "PÍCARO", strain: "ESFUERZO", squashed: "APLASTADO", love: "ENAMORADO" };
  const ant = antennaWorld(castPose);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 70, top: 50, fontFamily: FONT, fontWeight: 800, fontSize: 96, letterSpacing: "-0.05em", color: A.ink }}>
        GANCHO<span style={{ color: A.orange }}>.</span>
      </div>
      <div style={{ position: "absolute", left: 74, top: 158, fontFamily: LABEL, fontSize: 24, letterSpacing: "0.08em", color: A.ink }}>
        <span style={{ color: A.orange }}>● </span>PERSONAJE DE HOOKHOUSE · HOJA DE MODELO v1
      </div>
      {/* Pose principal */}
      <Gancho x={330} y={980} scale={1.35} t={t} expr="smug" armL={30} armR={150} bendR={-0.2} look={{ x: 0.3, y: -0.2 }} />
      <Label x={330} y={1012} text="POSE PRINCIPAL" />
      {/* Proporciones */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <line x1={640} y1={278} x2={640} y2={980} stroke={A.grey} strokeWidth={2} strokeDasharray="8 8" />
        {[
          [278, "ANZUELO"],
          [507, "CUERPO 2/3"],
          [980, "PIES"],
        ].map(([y, l]) => (
          <g key={String(l)}>
            <line x1={630} y1={Number(y)} x2={650} y2={Number(y)} stroke={A.grey} strokeWidth={3} />
            <text x={660} y={Number(y) + 8} fontFamily={LABEL} fontSize={18} fill={A.grey}>
              {String(l)}
            </text>
          </g>
        ))}
      </svg>
      {/* Expresiones */}
      {exprs.map((e, k) => {
        const x = 880 + (k % 4) * 200;
        const y = 500 + Math.floor(k / 4) * 300;
        return (
          <React.Fragment key={e}>
            <Gancho x={x} y={y} scale={0.44} t={t + k} expr={e} armL={e === "happy" || e === "love" ? 150 : 25} armR={e === "happy" ? 150 : e === "strain" ? 165 : 25} squash={e === "squashed" ? 0.6 : 0} look={e === "smug" ? { x: 0.6, y: 0 } : { x: 0, y: 0 }} />
            <Label x={x} y={y + 6} text={NAMES[e]} size={18} />
          </React.Fragment>
        );
      })}
      {/* Acciones */}
      <Gancho x={1700} y={420} scale={0.44} t={t} expr="focused" armL={40} armR={95} item="scissors" />
      <Label x={1700} y={426} text="CORTA" size={18} />
      <Gancho x={1700} y={720} scale={0.44} t={t} expr="happy" armL={140} armR={110} item="frame" walk={t * 8} />
      <Label x={1700} y={726} text="ENCUADRA / CAMINA" size={18} />
      <Rope ax={ant.x} ay={ant.y} bx={1880} by={790} slack={0.15} buzz={1} t={t} />
      <Gancho {...castPose} t={t} expr="strain" armL={160} armR={170} hookOut />
      <Label x={1700} y={1016} text="LANZA Y TIRA" size={18} />
      {/* Paleta */}
      {[
        [A.ivory, "MARFIL #F2EDE3"],
        [A.ink, "TINTA #0E0D0B"],
        [A.orange, "NARANJA #FF5A1F"],
        ["#FBF8F2", "OJOS #FBF8F2"],
      ].map(([c, l], k) => (
        <div key={l} style={{ position: "absolute", left: 880 + k * 170, top: 925, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: c, border: `4px solid ${A.ink}` }} />
          <div style={{ fontFamily: LABEL, fontSize: 14, color: A.ink, letterSpacing: "0.02em", width: 110 }}>{l}</div>
        </div>
      ))}
    </Paper>
  );
};
