import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, FLOOR, ScreenRope, Snd, Stage, ctaRope, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, Tag, fall, impact, lin, yank } from "../system";

// Antes / después con Hookie (contenido propio de Hookhouse: aquí SÍ va el estilo Altera).
// 0 s: el clip en bruto cae sobre el papel con la pregunta "¿Lo verías hasta el final?"; Hookie bosteza, niega,
// lo engancha y lo arranca → debajo aparece la edición del Estudio a pantalla completa (dos tramos).
// Después, cortina comparativa que Hookie arrastra con su línea (ANTES | DESPUÉS) y CTA con la muestra gratis.
// Honestidad: se rotula como demo sobre un clip público de podcast (no es un cliente).

const RAW = "portfolio/podcast_raw.mp4";
const EDIT = "portfolio/estudio_demo.mp4";
const YANK = 90; // empieza el tirón
const AFTER = 100; // empieza la edición
const A1: [number, number] = [0, 9.7]; // tramos de la edición (s)
const A2: [number, number] = [13.3, 17.0]; // sigue sin corte dentro de la cortina
const D1 = Math.round((A1[1] - A1[0]) * 30);
const D2 = Math.round((A2[1] - A2[0]) * 30);
const CMP = AFTER + D1 + D2; // cortina comparativa
const CTA = CMP + 102;
export const ANTES_DESPUES_FRAMES = CTA + 140;

const Raw: React.FC<{ from: number; style?: React.CSSProperties }> = ({ from, style }) => (
  <OffthreadVideo src={staticFile(RAW)} trimBefore={Math.round(from * 30)} muted style={style} />
);

export const AntesDespues: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  // ---------- ANTES ----------
  const drop = fall(f, fps);
  const pull = yank(f - YANK, 10);
  const cardX = 540 + pull * 1400;
  const cardY = 780 - (1 - drop) * 90;
  const cardRot = -2 + pull * 12;
  let g: GanchoPose = { x: 790, y: FLOOR, scale: 0.6, t, expr: "normal", blink: 0.55, lean: 4 * Math.sin(t * 2), armL: 30, armR: 30 };
  let rope: RopeSpec = null;
  if (f >= 40 && f < 68) g = { ...g, expr: "smug", blink: 0, lean: 12 * Math.sin((f - 40) * 0.7), armR: 60 };
  if (f >= 68 && f < AFTER) {
    g = { ...g, expr: f < YANK ? "focused" : "strain", blink: 0, hookOut: true, lean: f < YANK ? -6 : 16, armL: 90, armR: 100 };
    const hx = cardX + 430;
    const hy = cardY - 230;
    rope = { screen: true, bx: hx, by: hy, slack: lin(f, 68, 78, 0.7, 0.05), buzz: f >= YANK - 6 ? 0.6 : 0 };
  }

  // ---------- CORTINA ----------
  const divX = 1080 - lin(f, CMP + 6, CMP + 30, 0, 1, (x) => 1 - (1 - x) ** 3) * 540;
  // ---------- CTA ----------
  const tEscr = CTA + 18;
  const tHook = CTA + 36;
  const tMuestra = CTA + 60;
  if (f >= CTA) {
    g = { x: 300, y: FLOOR, scale: 0.6, t, expr: f >= tMuestra ? "happy" : "focused", armL: 30, armR: 40 };
    rope = null;
    if (f >= tHook + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, tHook);
    }
  }
  const showG = f < AFTER || f >= CTA;

  return (
    <AbsoluteFill style={{ background: A.ink }}>
      {/* ANTES: papel + clip en bruto */}
      {f < AFTER + 2 ? (
        <Paper>
          <div style={{ position: "absolute", left: 72, top: 230, width: 936, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink }}>
            ¿Lo verías hasta el <span style={{ color: A.orange }}>final</span>?
          </div>
          <div style={{ position: "absolute", left: cardX - 470, top: cardY - 264, width: 940, height: 529, borderRadius: 26, overflow: "hidden", border: `6px solid ${A.ink}`, boxShadow: "0 40px 60px rgba(14,13,11,0.35)", transform: `rotate(${cardRot}deg) scale(${1 + 0.04 * impact(f - 6)}, ${1 - 0.04 * impact(f - 6)})` }}>
            <Raw from={0} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.85)" }} />
          </div>
          <Tag x={72} y={cardY + 300} text="ANTES · TAL CUAL SE GRABÓ" opacity={1 - pull} />
        </Paper>
      ) : null}

      {/* DESPUÉS: la edición del Estudio a pantalla completa */}
      <Sequence from={AFTER} durationInFrames={D1}>
        <OffthreadVideo src={staticFile(EDIT)} trimBefore={Math.round(A1[0] * 30)} trimAfter={Math.round(A1[1] * 30)} />
      </Sequence>
      <Sequence from={AFTER + D1} durationInFrames={D2 + 110}>
        <OffthreadVideo src={staticFile(EDIT)} trimBefore={Math.round(A2[0] * 30)} volume={(fr) => 1 - lin(fr, CTA - AFTER - D1 - 6, CTA - AFTER - D1 + 8)} />
      </Sequence>
      {f >= AFTER && f < AFTER + 60 ? (
        <div style={{ position: "absolute", left: 72, top: 230, opacity: lin(f, AFTER, AFTER + 6) * (1 - lin(f, AFTER + 50, AFTER + 60)) }}>
          <span style={{ display: "inline-block", background: A.orange, color: A.ivory, fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em", padding: "6px 22px 10px", borderRadius: 14 }}>DESPUÉS</span>
          <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: "0.08em", color: A.ivory, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>DEMO · CLIP PÚBLICO DE PODCAST</div>
        </div>
      ) : null}

      {/* CORTINA: Hookie arrastra la línea y descubre el ANTES a la izquierda */}
      {f >= CMP && f < CTA + 4 ? (
        <AbsoluteFill style={{ clipPath: `inset(0 ${1080 - divX}px 0 0)` }}>
          <AbsoluteFill style={{ background: A.ink }}>
            <Sequence from={CMP} durationInFrames={110}>
              <Raw from={15.68} style={{ position: "absolute", height: 2976, width: 5291, left: 540 - 0.205 * 5291, top: 960 - 0.45 * 2976, maxWidth: "none", filter: "saturate(0.85)" }} />
            </Sequence>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
      {f >= CMP && f < CTA ? (
        <>
          <div style={{ position: "absolute", left: divX - 6, top: 0, width: 12, height: 1920, background: A.orange, boxShadow: "0 0 30px rgba(0,0,0,0.4)" }} />
          {[
            { text: "ANTES", x: 72, show: divX < 900, bg: A.ivory, fg: A.ink },
            { text: "DESPUÉS", x: 640, show: true, bg: A.orange, fg: A.ivory },
          ].map((l) =>
            l.show ? (
              <span key={l.text} style={{ position: "absolute", left: l.x, top: 230, background: l.bg, color: l.fg, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: "-0.03em", padding: "6px 20px 10px", borderRadius: 14, opacity: lin(f, CMP + 10, CMP + 18) }}>
                {l.text}
              </span>
            ) : null,
          )}
          {/* Hookie tira de la línea desde abajo */}
          <AbsoluteFill>
            <Stage>
              <Gancho x={(divX - 540) / 1.25 + 540 + 70} y={FLOOR} scale={0.5} t={t} expr="strain" lean={-14} armL={150} armR={150} walk={f < CMP + 30 ? t * 20 : undefined} />
            </Stage>
          </AbsoluteFill>
        </>
      ) : null}

      {/* CTA */}
      {f >= CTA ? (
        <AbsoluteFill style={{ opacity: lin(f, CTA, CTA + 8) }}>
          <Paper>
            <div style={{ position: "absolute", left: 72, top: 260, width: 936, fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink, opacity: lin(f, CTA + 2, CTA + 10) }}>
              ¿Quieres el <span style={{ color: A.orange }}>tuyo</span> así?
            </div>
          </Paper>
        </AbsoluteFill>
      ) : null}

      {showG ? (
        <AbsoluteFill style={{ opacity: f >= CTA ? lin(f, CTA, CTA + 8) : 1 }}>
          <Stage>
            <Gancho {...g} />
          </Stage>
          <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
        </AbsoluteFill>
      ) : null}
      <Cta f={f} fps={fps} tEscr={tEscr} tHook={tHook} tMuestra={tMuestra} until={ANTES_DESPUES_FRAMES + 20} />

      {/* Sonido: el bruto suena en el ANTES; la edición trae su propio audio */}
      <Sequence durationInFrames={AFTER}>
        <Audio src={staticFile(RAW)} trimBefore={0} volume={(fr) => 1 - lin(fr, YANK - 4, AFTER)} />
      </Sequence>
      <Snd at={5} src={SOUND.impacto} vol={0.8} />
      <Snd at={66} src={SOUND.tension} vol={0.5} />
      <Snd at={YANK} src={SOUND.tiron} vol={0.9} />
      <Snd at={AFTER} src={SOUND.impacto} vol={0.6} />
      <Snd at={CMP + 4} src={SOUND.tiron} vol={0.7} />
      <Snd at={tHook} src={SOUND.impacto} vol={0.5} />
      <Snd at={tMuestra + 1} src={SOUND.impacto} vol={0.8} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(fr) => (fr >= CTA - 10 ? 0.08 : 0)} />
    </AbsoluteFill>
  );
};

