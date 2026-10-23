import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, FLOOR, ScreenRope, Snd, Stage, ctaRope, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, fall, impact, lin, yank } from "../system";

// Antes / después con Hookie sobre una edición propia de Hookhouse (entrevista de MrBeast).
// v2 (2026-10-23, metricas.md): la v1 abría con el bruto y perdió al 62 % en 3 s. Ahora el frame 0 ES la comparación:
// las dos versiones lado a lado en el momento más visual del después (100 K $ → 1,5 M $) con su audio. Hookie arranca
// el ANTES, el DESPUÉS crece a pantalla completa y la edición se ve desde el principio. Después, CTA.
// El bruto solo existe en baja resolución (ventana de 262 × 466 px), por eso va siempre en tarjeta.

const RAW = "portfolio/mrbeast_bruto.mp4";
const EDIT = "portfolio/mrbeast_edit.mp4";
const RAW_OFFSET = 0.1; // el bruto va 0,1 s por delante de la edición
const PANEL = { x: 12, y: 220, w: 262, h: 466, W: 576, H: 1024 }; // ventana del bruto dentro de su vídeo
const HOOK_T = 20.2; // s de la edición: "two years ago we're spending a hundred grand… now… 1.5 million"
const OPEN = 112; // la apertura dura lo que esa frase
const YANK = 84;
const GROW = 96;
const AFTER_D = Math.round(17.6 * 30); // la edición desde el principio hasta "three weeks editing"
const CTA = OPEN + AFTER_D;
export const ANTES_DESPUES_BEAST_FRAMES = CTA + 126;

const RawPanel: React.FC<{ w: number; h: number; startFrom: number }> = ({ w, h, startFrom }) => {
  const s = w / PANEL.w;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", width: w, height: h }}>
      <OffthreadVideo src={staticFile(RAW)} trimBefore={Math.round(startFrom * 30)} muted style={{ position: "absolute", width: PANEL.W * s, height: PANEL.H * s, left: -PANEL.x * s, top: -PANEL.y * s, maxWidth: "none" }} />
    </div>
  );
};
const Card: React.FC<{ x: number; y: number; w: number; h: number; rot: number; sq?: number; radius?: number; border?: number; children: React.ReactNode }> = ({ x, y, w, h, rot, sq = 0, radius = 26, border = 6, children }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: radius, overflow: "hidden", border: border ? `${border}px solid ${A.ink}` : undefined, boxShadow: border ? "0 40px 60px rgba(14,13,11,0.35)" : undefined, transform: `rotate(${rot}deg) scale(${1 + sq}, ${1 - sq})`, background: A.ink }}>
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

  // ---------- APERTURA: comparación ----------
  const inL = fall(f + 8, fps);
  const inR = fall(f + 4, fps);
  const pull = yank(f - YANK, 10);
  const L = { x: 290 - pull * 900, y: 880 - (1 - inL) * 300, rot: -3 - pull * 14 };
  const g01 = lin(f, GROW, OPEN, 0, 1, (x) => 1 - (1 - x) ** 3);
  const R = { x: interpolate(g01, [0, 1], [790, 540]), y: interpolate(g01, [0, 1], [880 - (1 - inR) * 300, 960]), w: interpolate(g01, [0, 1], [440, 1080]), h: interpolate(g01, [0, 1], [782, 1920]), rot: 3 * (1 - g01) };
  let g: GanchoPose = { x: 540, y: FLOOR + 40, scale: 0.42, t, expr: "surprised", armL: 40, armR: 40, look: { x: Math.sin(t * 3), y: -0.4 } };
  let rope: RopeSpec = null;
  if (f >= 26 && f < 56) g = { ...g, expr: "smug", look: { x: -1, y: -0.3 }, lean: 10 * Math.sin((f - 26) * 0.6), armL: 60 };
  if (f >= 56 && f < GROW) {
    g = { ...g, expr: f < YANK ? "focused" : "strain", hookOut: true, lean: f < YANK ? 6 : -14, armL: 90, armR: 100, look: { x: -1, y: -0.5 } };
    rope = { screen: true, bx: L.x - 150, by: L.y - 330, slack: lin(f, 56, 66, 0.7, 0.05), buzz: f >= YANK - 6 ? 0.6 : 0 };
  }
  if (f >= GROW && f < OPEN) g = { ...g, expr: "love", look: { x: 1, y: -0.6 }, armL: 150, armR: 150 };

  // ---------- CTA ----------
  const tEscr = CTA + 16;
  const tHook = CTA + 32;
  const tMuestra = CTA + 54;
  if (f >= CTA) {
    g = { x: 300, y: FLOOR, scale: 0.6, t, expr: f >= tMuestra ? "happy" : "focused", armL: 30, armR: 40 };
    rope = null;
    if (f >= tHook + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, tHook);
    }
  }
  const showG = f < OPEN || f >= CTA;

  return (
    <AbsoluteFill style={{ background: A.ink }}>
      {/* APERTURA */}
      {f < OPEN ? (
        <Paper>
          <div style={{ position: "absolute", left: 72, top: 220, width: 936, fontFamily: FONT, fontWeight: 800, fontSize: 100, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink, opacity: 1 - g01 }}>
            ¿Cuál <span style={{ color: A.orange }}>verías</span>?
          </div>
          <Pill x={290} y={370} text="ANTES" bg={A.ink} fg={A.ivory} o={1 - Math.min(1, pull * 2)} />
          <Pill x={790} y={370} text="DESPUÉS" bg={A.orange} fg={A.ivory} o={1 - g01} />
          <Card x={L.x} y={L.y} w={440} h={782} rot={L.rot} sq={0.04 * impact(f - 2)}>
            <RawPanel w={440} h={782} startFrom={HOOK_T + RAW_OFFSET} />
          </Card>
          <Card x={R.x} y={R.y} w={R.w} h={R.h} rot={R.rot} sq={0.04 * impact(f + 2)} radius={26 * (1 - g01)} border={g01 < 1 ? 6 : 0}>
            <OffthreadVideo src={staticFile(EDIT)} trimBefore={Math.round(HOOK_T * 30)} muted style={{ width: R.w, height: R.h }} />
          </Card>
        </Paper>
      ) : null}

      {/* DESPUÉS a pantalla completa, desde el principio */}
      <Sequence from={OPEN} durationInFrames={AFTER_D + 10}>
        <OffthreadVideo src={staticFile(EDIT)} volume={(fr) => 1 - lin(fr, AFTER_D - 4, AFTER_D + 8)} />
      </Sequence>
      {f >= OPEN && f < OPEN + 54 ? (
        <div style={{ position: "absolute", left: 72, top: 230, opacity: lin(f, OPEN, OPEN + 6) * (1 - lin(f, OPEN + 44, OPEN + 54)) }}>
          <span style={{ display: "inline-block", background: A.orange, color: A.ivory, fontFamily: FONT, fontWeight: 800, fontSize: 56, letterSpacing: "-0.03em", padding: "6px 22px 10px", borderRadius: 14 }}>DESPUÉS</span>
          <div style={{ marginTop: 14, fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: "0.08em", color: A.ivory, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>EDITADO POR HOOKHOUSE</div>
        </div>
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
        <AbsoluteFill style={{ opacity: f >= CTA ? lin(f, CTA, CTA + 8) : 1 - lin(f, GROW + 4, OPEN) }}>
          <Stage>
            <Gancho {...g} />
          </Stage>
          <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
        </AbsoluteFill>
      ) : null}
      <Cta f={f} fps={fps} tEscr={tEscr} tHook={tHook} tMuestra={tMuestra} until={ANTES_DESPUES_BEAST_FRAMES + 20} />

      {/* Audio de la apertura: la frase del millón y medio (de la edición) */}
      <Sequence durationInFrames={OPEN + 4}>
        <Audio src={staticFile(EDIT)} trimBefore={Math.round(HOOK_T * 30)} volume={(fr) => 1 - lin(fr, OPEN - 4, OPEN + 2)} />
      </Sequence>
      <Snd at={2} src={SOUND.impacto} vol={0.8} />
      <Snd at={54} src={SOUND.tension} vol={0.5} />
      <Snd at={YANK} src={SOUND.tiron} vol={0.9} />
      <Snd at={GROW + 4} src={SOUND.tiron} vol={0.5} />
      <Snd at={tHook} src={SOUND.impacto} vol={0.5} />
      <Snd at={tMuestra + 1} src={SOUND.impacto} vol={0.8} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(fr) => (fr >= CTA - 10 ? 0.08 : 0)} />
    </AbsoluteFill>
  );
};
