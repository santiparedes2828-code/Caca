import React from "react";
import { useCurrentFrame } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "./Gancho";
import { PhoneFeed, Ticket } from "./props";
import { FilmStrip, Gate, MuteIcon, Trophy } from "./props2";
import { A, FONT, LABEL, Paper, Rope } from "./system";

// Photo dump de Gancho para carrusel de Instagram (1080 × 1350, 4:5). Cada fotograma = una imagen.
// Fotos tipo polaroid de "la vida en Hookhouse": misma utilería y sonidos visuales de los reels, sin texto doble.

export const DUMP_SLIDES = 8;
const PH = 820; // lado de la foto
const INK = A.ink;
const PAPER = "#FBF8F2";

// Polaroid: marco de papel, foto recortada y pie escrito; `tone` = fondo de la foto
const Polaroid: React.FC<{ x: number; y: number; rot: number; tone?: string; caption?: string; size?: number; children: React.ReactNode }> = ({ x, y, rot, tone = "#E9E2D5", caption, size = PH, children }) => (
  <div style={{ position: "absolute", left: x - size / 2 - 34, top: y - size / 2 - 34, width: size + 68, padding: 34, paddingBottom: caption ? 30 : 34, background: PAPER, border: `6px solid ${INK}`, borderRadius: 14, transform: `rotate(${rot}deg)`, boxShadow: "0 30px 50px rgba(14,13,11,0.22), 0 6px 0 rgba(14,13,11,0.9)" }}>
    <div style={{ position: "relative", width: size, height: size, overflow: "hidden", background: tone, borderRadius: 6, border: `4px solid ${INK}` }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: size * 0.86, height: 3, background: "rgba(14,13,11,0.12)" }} />
      {/* escena en coordenadas de foto de 820 × 820, escalada al tamaño */}
      <div style={{ position: "absolute", left: 0, top: 0, width: PH, height: PH, transformOrigin: "0 0", transform: `scale(${size / PH})` }}>{children}</div>
    </div>
    {caption ? <div style={{ marginTop: 26, fontFamily: FONT, fontWeight: 800, fontSize: 50, letterSpacing: "-0.035em", lineHeight: 1.08, color: INK }}>{caption}</div> : null}
  </div>
);

const Floor = 705; // suelo dentro de la foto
const G: React.FC<Omit<GanchoPose, "t" | "y"> & { y?: number }> = (p) => <Gancho y={Floor} t={0.4} {...p} />;

const Stamp: React.FC<{ n: number }> = ({ n }) => (
  <div style={{ position: "absolute", right: 72, bottom: 56, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.1em", color: INK, opacity: 0.6 }}>
    <span style={{ color: A.orange }}>● </span>
    HOOKHOUSE · {String(n + 1).padStart(2, "0")}/{String(DUMP_SLIDES).padStart(2, "0")}
  </div>
);

const Slide: React.FC<{ i: number }> = ({ i }) => {
  switch (i) {
    case 0:
      return (
        <>
          <div style={{ position: "absolute", left: 72, top: 96, fontFamily: FONT, fontWeight: 800, fontSize: 168, lineHeight: 0.88, letterSpacing: "-0.06em", color: INK }}>
            photo
            <br />
            <span style={{ color: A.orange }}>dump</span>
          </div>
          <div style={{ position: "absolute", left: 80, top: 430, fontFamily: LABEL, fontSize: 30, letterSpacing: "0.08em", color: INK }}>
            <span style={{ color: A.orange }}>● </span>OCTUBRE EN HOOKHOUSE
          </div>
          <Polaroid x={590} y={850} rot={5} size={640}>
            <G x={360} scale={1.3} expr="happy" item="frame" armR={70} armL={150} />
          </Polaroid>
          {/* la línea-firma sale del título y sujeta la foto */}
          <Rope ax={500} ay={330} bx={560} by={520} slack={0.5} t={0} />
        </>
      );
    case 1:
      return (
        <Polaroid x={540} y={600} rot={-3} tone="#DCD3C3" caption="cortando lo que sobra a las 3 a. m.">
          <FilmStrip x={330} y={Floor - 230} scale={1.05} n={5} t={0} cut={0.55} />
          <G x={560} scale={1.0} expr="focused" item="scissors" armR={80} armL={30} look={{ x: -1, y: 0.2 }} />
        </Polaroid>
      );
    case 2:
      return (
        <Polaroid x={540} y={600} rot={2.5} tone="#2A2724" caption="viendo tus primeros 3 segundos con palomitas">
          <PhoneFeed x={230} y={Floor} scale={1.0} scroll={120} />
          <G x={560} scale={1.0} expr="surprised" item="popcorn" armR={60} armL={40} look={{ x: -1, y: -0.2 }} />
        </Polaroid>
      );
    case 3:
      return (
        <Polaroid x={540} y={600} rot={-2} caption="cuando alguien sube un video sin subtítulos">
          <G x={410} scale={1.0} squash={0.7} expr="squashed" armL={120} armR={120} />
          <MuteIcon x={410} y={Floor - 290} scale={1.0} rotate={-8} shadow={false} />
        </Polaroid>
      );
    case 4:
      return (
        <Polaroid x={540} y={600} rot={3} tone="#DCD3C3" caption="intentando pasar del segundo 3">
          <Gate x={520} y={Floor} scale={1.15} open={0.08} />
          <G x={280} scale={1.0} expr="strain" lean={-18} armL={88} armR={95} />
        </Polaroid>
      );
    case 5: {
      const faces: { expr: GanchoPose["expr"]; label: string; tone: string; arm?: number }[] = [
        { expr: "smug", label: "hook listo", tone: "#E9E2D5" },
        { expr: "surprised", label: "el cliente pide otro cambio", tone: "#DCD3C3" },
        { expr: "love", label: "el corte perfecto", tone: "#F4C7AE" },
        { expr: "squashed", label: "se cerró After Effects", tone: "#D9D3C7" },
      ];
      return (
        <>
          <div style={{ position: "absolute", left: 72, top: 70, fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: "-0.05em", color: INK }}>
            mis caras <span style={{ color: A.orange }}>editando</span>
          </div>
          {faces.map((fc, k) => (
            <div key={k} style={{ position: "absolute", left: 72 + (k % 2) * 480, top: 220 + Math.floor(k / 2) * 520, width: 456, height: 496, background: PAPER, border: `6px solid ${INK}`, borderRadius: 14, transform: `rotate(${[-2, 1.5, 2, -1.5][k]}deg)`, boxShadow: "0 18px 30px rgba(14,13,11,0.2)" }}>
              <div style={{ position: "absolute", left: 18, top: 18, width: 408, height: 360, overflow: "hidden", background: fc.tone, borderRadius: 6, border: `4px solid ${INK}` }}>
                <Gancho x={204} y={470} scale={0.95} t={0.4} expr={fc.expr} squash={fc.expr === "squashed" ? 0.4 : 0} armL={fc.expr === "love" ? 150 : 30} armR={fc.expr === "love" ? 150 : 40} />
              </div>
              <div style={{ position: "absolute", left: 22, right: 18, top: 392, fontFamily: FONT, fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.03em", color: INK }}>{fc.label}</div>
            </div>
          ))}
        </>
      );
    }
    case 6:
      return (
        <Polaroid x={540} y={600} rot={-2.5} tone="#F4C7AE" caption="el render salió a la primera (pasa poco)">
          <Trophy x={300} y={Floor} scale={1.5} />
          <G x={590} scale={1.0} expr="happy" armL={160} armR={150} squash={-0.08} />
        </Polaroid>
      );
    case 7: {
      const g: GanchoPose = { x: 300, y: 1180, scale: 0.85, t: 0.4, expr: "happy", hookOut: true, lean: 8, armL: 30, armR: 40 };
      const a = antennaWorld(g);
      return (
        <>
          <div style={{ position: "absolute", left: 72, top: 120, width: 936, fontFamily: FONT, fontWeight: 800, fontSize: 104, lineHeight: 0.98, letterSpacing: "-0.05em", color: INK }}>
            ¿quieres salir
            <br />
            en el próximo <span style={{ color: A.orange }}>dump</span>?
          </div>
          <div style={{ position: "absolute", left: 72, top: 470, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: INK }}>
            Escríbeme
            <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 8px", borderRadius: 18, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>HOOK</span>
          </div>
          <div style={{ position: "absolute", left: 72, top: 600, fontFamily: LABEL, fontSize: 30, letterSpacing: "0.08em", color: INK }}>POR DM</div>
          <Ticket x={720} y={1030} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1180, height: 3, background: "rgba(14,13,11,0.10)" }} />
          <Gancho {...g} />
          <Rope ax={a.x} ay={a.y} bx={716} by={592} slack={0.15} t={0} />
        </>
      );
    }
    default:
      return null;
  }
};

export const Dump: React.FC = () => {
  const i = useCurrentFrame();
  return (
    <Paper>
      <Slide i={i} />
      <Stamp n={i} />
    </Paper>
  );
};
