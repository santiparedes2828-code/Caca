import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, FLOOR, ScreenRope, Snd, Stage, ctaRope, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, Tag, fall, impact, lin, yank } from "../system";

// Antes / después con Hookie sobre una edición propia de Hookhouse (clip de entrevista de MrBeast).
// 0 s: el bruto cae como tarjeta con "¿Lo verías hasta el final?"; Hookie bosteza, niega, lo engancha y lo arranca →
// la edición de Hookhouse sigue la frase sin corte a pantalla completa. Después, las dos versiones lado a lado
// (ANTES | DESPUÉS) y CTA con la muestra gratis.
// El bruto solo existe en baja resolución (ventana de 262 × 466 px), por eso va siempre como tarjeta, nunca a pantalla completa.

const RAW = "portfolio/mrbeast_bruto.mp4";
const EDIT = "portfolio/mrbeast_edit.mp4";
const RAW_OFFSET = 0.1; // el bruto va 0,1 s por delante de la edición
const PANEL = { x: 12, y: 220, w: 262, h: 466, W: 576, H: 1024 }; // ventana del bruto dentro de su vídeo
const YANK = 88;
const AFTER = 100;
const EDIT_END = 20.0; // s de la edición donde empieza la comparación
const CMP = Math.round(EDIT_END * 30); // la edición corre en tiempo real desde el frame 0 (oculta durante el ANTES)
const CTA = CMP + 105;
export const ANTES_DESPUES_BEAST_FRAMES = CTA + 140;

// El bruto recortado a su ventana, dentro de una caja w × h
const RawPanel: React.FC<{ w: number; h: number; startFrom: number }> = ({ w, h, startFrom }) => {
  // escala por el ancho y recorta por arriba (la marca de agua de TikTok del bruto queda por debajo en el ANTES)
  const s = w / PANEL.w;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: w, height: h }}>
      <OffthreadVideo src={staticFile(RAW)} trimBefore={Math.round(startFrom * 30)} muted style={{ position: "absolute", width: PANEL.W * s, height: PANEL.H * s, left: -PANEL.x * s, top: -PANEL.y * s, maxWidth: "none" }} />
    </div>
  );
};

const Card: React.FC<{ x: number; y: number; w: number; h: number; rot: number; sq?: number; children: React.ReactNode }> = ({ x, y, w, h, rot, sq = 0, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 26, overflow: "hidden", border: `6px solid ${A.ink}`, boxShadow: "0 40px 60px rgba(14,13,11,0.35)", transform: `rotate(${rot}deg) scale(${1 + sq}, ${1 - sq})`, background: A.ink }}>
    {children}
  </div>
);
const Pill: React.FC<{ x: number; y: number; text: string; bg: string; fg: string; o?: number }> = ({ x, y, text, bg, fg, o = 1 }) => (
  <span style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", background: bg, color: fg, fontFamily: FONT, fontWeight: 800, fontSize: 50, letterSpacing: "-0.03em", padding: "6px 22px 10px", borderRadius: 14, opacity: o, whiteSpace: "nowrap" }}>{text}</span>
);

export const AntesDespuesBeast: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  // ---------- ANTES ----------
  const drop = fall(f, fps);
  const pull = yank(f - YANK, 10);
  const cW = 470;
  const cH = 430; // solo la parte de arriba de la ventana: abajo a la izquierda va la marca de agua del vídeo fuente
  const cardX = 380 + pull * 1300;
  const cardY = 900 - (1 - drop) * 90;
  const cardRot = -2 + pull * 12;
  let g: GanchoPose = { x: 860, y: FLOOR, scale: 0.55, t, expr: "normal", blink: 0.55, lean: 4 * Math.sin(t * 2), armL: 30, armR: 30 };
  let rope: RopeSpec = null;
  if (f >= 38 && f < 64) g = { ...g, expr: "smug", blink: 0, lean: 12 * Math.sin((f - 38) * 0.7), armR: 60 };
  if (f >= 64 && f < AFTER) {
    g = { ...g, expr: f < YANK ? "focused" : "strain", blink: 0, hookOut: true, lean: f < YANK ? -6 : 16, armL: 90, armR: 100 };
    rope = { screen: true, bx: cardX + cW / 2 - 30, by: cardY - cH / 2 + 60, slack: lin(f, 64, 74, 0.7, 0.05), buzz: f >= YANK - 6 ? 0.6 : 0 };
  }

  // ---------- COMPARACIÓN ----------
  const inL = fall(f - CMP - 4, fps);
  const inR = fall(f - CMP - 10, fps);
  // ---------- CTA ----------
  const tEscr = CTA + 18;
  const tHook = CTA + 36;
  const tMuestra = CTA + 60;
  if (f >= CMP && f < CTA) g = { x: 540, y: FLOOR + 40, scale: 0.42, t, expr: f >= CMP + 30 ? "love" : "surprised", armL: 40, armR: 120, look: { x: 1, y: -0.4 } };
  if (f >= CTA) {
    g = { x: 300, y: FLOOR, scale: 0.6, t, expr: f >= tMuestra ? "happy" : "focused", armL: 30, armR: 40 };
    rope = null;
    if (f >= tHook + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, tHook);
    }
  }
  const showG = f < AFTER || f >= CMP;
  const editVol = (fr: number) => (fr < AFTER - 2 ? 0 : 1 - lin(fr, CTA - 6, CTA + 8));

  return (
    <AbsoluteFill style={{ background: A.ink }}>
      {/* La edición corre en tiempo real desde el principio; se ve a partir del tirón */}
      <OffthreadVideo src={staticFile(EDIT)} volume={editVol} style={{ width: 1080, height: 1920, opacity: f >= AFTER - 2 && f < CMP ? 1 : 0 }} />

      {/* ANTES */}
      {f < AFTER ? (
        <Paper>
          <div style={{ position: "absolute", left: 72, top: 230, width: 936, fontFamily: FONT, fontWeight: 800, fontSize: 96, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink }}>
            ¿Lo verías hasta el <span style={{ color: A.orange }}>final</span>?
          </div>
          <Card x={cardX} y={cardY} w={cW} h={cH} rot={cardRot} sq={0.04 * impact(f - 6)}>
            <RawPanel w={cW} h={cH} startFrom={RAW_OFFSET} />
          </Card>
          <Tag x={150} y={cardY + cH / 2 + 26} text="ANTES · EN BRUTO" opacity={1 - pull} />
        </Paper>
      ) : null}
      {f >= AFTER && f < AFTER + 60 ? (
        <div style={{ position: "absolute", left: 72, top: 230, opacity: lin(f, AFTER, AFTER + 6) * (1 - lin(f, AFTER + 50, AFTER + 60)) }}>
          <span style={{ display: "inline-block", background: A.orange, color: A.ivory, fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em", padding: "6px 22px 10px", borderRadius: 14 }}>DESPUÉS</span>
          <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: "0.08em", color: A.ivory, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>EDITADO POR HOOKHOUSE</div>
        </div>
      ) : null}

      {/* COMPARACIÓN: las dos versiones lado a lado, sincronizadas */}
      {f >= CMP && f < CTA + 8 ? (
        <AbsoluteFill style={{ opacity: 1 - lin(f, CTA, CTA + 8) }}>
          <Paper>
            <Pill x={290} y={300} text="ANTES" bg={A.ink} fg={A.ivory} o={lin(f, CMP + 8, CMP + 14)} />
            <Pill x={790} y={300} text="DESPUÉS" bg={A.orange} fg={A.ivory} o={lin(f, CMP + 14, CMP + 20)} />
            <Card x={290} y={830 - (1 - inL) * 900} w={440} h={782} rot={-3} sq={0.04 * impact(f - CMP - 12)}>
              <Sequence from={CMP} layout="none">
                <RawPanel w={440} h={782} startFrom={EDIT_END + RAW_OFFSET} />
              </Sequence>
            </Card>
            <Card x={790} y={830 - (1 - inR) * 900} w={440} h={782} rot={3} sq={0.04 * impact(f - CMP - 18)}>
              <Sequence from={CMP} layout="none">
                <OffthreadVideo src={staticFile(EDIT)} trimBefore={Math.round(EDIT_END * 30)} muted style={{ width: 440, height: 782 }} />
              </Sequence>
            </Card>
          </Paper>
        </AbsoluteFill>
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
        <AbsoluteFill>
          <Stage>
            <Gancho {...g} />
          </Stage>
          <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
        </AbsoluteFill>
      ) : null}
      <Cta f={f} fps={fps} tEscr={tEscr} tHook={tHook} tMuestra={tMuestra} until={ANTES_DESPUES_BEAST_FRAMES + 20} />

      {/* Sonido: el bruto suena en el ANTES (sin su música de fondo no hay forma de separarlo: es su audio tal cual) */}
      <Sequence durationInFrames={AFTER}>
        <Audio src={staticFile(RAW)} trimBefore={Math.round(RAW_OFFSET * 30)} volume={(fr) => 1 - lin(fr, YANK - 2, AFTER - 2)} />
      </Sequence>
      <Snd at={5} src={SOUND.impacto} vol={0.8} />
      <Snd at={62} src={SOUND.tension} vol={0.5} />
      <Snd at={YANK} src={SOUND.tiron} vol={0.9} />
      <Snd at={CMP + 14} src={SOUND.impacto} vol={0.6} />
      <Snd at={CMP + 20} src={SOUND.impacto} vol={0.6} />
      <Snd at={tHook} src={SOUND.impacto} vol={0.5} />
      <Snd at={tMuestra + 1} src={SOUND.impacto} vol={0.8} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(fr) => (fr >= CTA - 10 ? 0.08 : 0)} />
    </AbsoluteFill>
  );
};
