import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "./Gancho";
import { A, FONT, Paper, Rope } from "./system";

// Logo de Hookhouse con Gancho: su anzuelo engancha la "h" del wordmark (la línea-firma de la marca).
// LogoWide (2400 × 1000): 0 = sobre marfil · 1 = sobre naranja.
// LogoSquare (1600 × 1600): 0 = versión apilada · 1 = avatar con aro naranja · 2 = avatar marfil.

const Word: React.FC<{ x: number; y: number; size: number; color: string; accent: string }> = ({ x, y, size, color, accent }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.06em", color, whiteSpace: "nowrap" }}>
    hook<span style={{ color: accent }}>house</span>
  </div>
);

// Gancho con el anzuelo lanzado hasta (hx, hy)
const Hooked: React.FC<{ g: Omit<GanchoPose, "t">; hx: number; hy: number; line?: number; color?: string }> = ({ g, hx, hy, line = 16, color }) => {
  const pose: GanchoPose = { ...g, t: 0.4, hookOut: true };
  const a = antennaWorld(pose);
  return (
    <>
      <Gancho {...pose} />
      <Rope ax={a.x} ay={a.y} bx={hx} by={hy} slack={-0.3} t={0} width={line} color={color} />
    </>
  );
};

const Wide: React.FC<{ v: number }> = ({ v }) => {
  const orange = v === 1;
  const body = (
    <>
      <Word x={720} y={380} size={290} color={A.ink} accent={orange ? A.ivory : A.orange} />
      <Hooked g={{ x: 400, y: 860, scale: 1.25, expr: "happy", armL: 150, armR: 40, lean: 6 }} hx={760} hy={360} line={18} color={orange ? A.ink : undefined} />
    </>
  );
  return orange ? <AbsoluteFill style={{ background: A.orange }}>{body}</AbsoluteFill> : <Paper>{body}</Paper>;
};

const Square: React.FC<{ v: number }> = ({ v }) => {
  if (v === 0)
    return (
      <Paper>
        <Gancho x={800} y={1000} scale={1.45} t={0.4} expr="happy" armL={150} armR={150} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 1080, textAlign: "center" }}>
          <div style={{ display: "inline-block", fontFamily: FONT, fontWeight: 800, fontSize: 250, lineHeight: 1, letterSpacing: "-0.06em", color: A.ink }}>
            hook<span style={{ color: A.orange }}>house</span>
          </div>
        </div>
      </Paper>
    );
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: A.orange }} />
      <div style={{ position: "absolute", inset: v === 1 ? 90 : 0, borderRadius: "50%", overflow: "hidden", background: A.ivory }}>
        <Gancho x={800 - (v === 1 ? 90 : 0)} y={1640 - (v === 1 ? 90 : 0)} scale={2.2} t={0.4} expr="happy" armL={30} armR={40} />
      </div>
    </AbsoluteFill>
  );
};

export const LogoWide: React.FC = () => <Wide v={useCurrentFrame()} />;
export const LogoSquare: React.FC = () => <Square v={useCurrentFrame()} />;
