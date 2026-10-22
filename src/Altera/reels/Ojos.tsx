import type { Caption } from "@remotion/captions";
import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-ojos.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Card, PhoneFeed } from "../props";
import { BigEye, BigStat, Target, WordsCard } from "../props2";
import { Cta, FLOOR, M, ScreenRope, Snd, Stage, TopCaptions, ctaRope, timing, type RopeSpec } from "../reelkit";
import { A, Paper, SOUND, Tag, fall, impact, lin } from "../system";

// "Tus ojos acaban de saltar tres veces" — Gancho · retención (formula-viral, corrección 2026-10-22).
// Dato: los ojos hacen ~3 sacadas por segundo (movimientos rápidos entre puntos de fijación).
// Frame 0: un ojo gigante cuya pupila salta 3 veces por segundo entre dianas y un contador de saltos en tiempo real.
// Remate: "¿Notaste dónde miraste? Justo donde yo quería" → la diana cae sobre la palabra naranja del subtítulo.

const caps = captionsJson as Caption[];
const T = timing(caps);
export const OJOS_FRAMES = T.frames;
const LOOP = OJOS_FRAMES - 14;
const SPOTS = [
  { x: -0.9, y: -0.4 },
  { x: 0.8, y: 0.5 },
  { x: 0.1, y: -0.6 },
  { x: -0.6, y: 0.6 },
  { x: 0.9, y: -0.2 },
];

export const Ojos: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;
  const between = (a: number, b: number) => f >= a && f < b;

  const iNotaste = idx("notaste");
  const iSacadas = idx("sacadas");
  const iSegundo = idx("segundo");
  const iAterr = idx("aterrizar");
  const iFuera = idx("fuera");
  const iTrucos = idx("trucos");
  const iMov = idx("movimiento");
  const iColor = idx("color");
  const iCorte = idx("corte");
  const iCansa = idx("cansa");
  const iMiraste = idx("miraste");
  const iQueria = idx("quería");
  const iEscr = idx("escríbeme");
  const iHook = idx("hook", iEscr);
  const iMuestra = idx("muestra");

  // Sacadas: la pupila salta cada 10 frames (3 por segundo) con un salto de 2 frames
  const jump = Math.floor(f / 10);
  const k = f - jump * 10;
  const a = SPOTS[jump % SPOTS.length];
  const b = SPOTS[(jump + 1) % SPOTS.length];
  const sp = k < 8 ? 0 : (k - 7) / 3;
  let px = a.x + (b.x - a.x) * Math.min(1, sp);
  let py = a.y + (b.y - a.y) * Math.min(1, sp);
  const jumps = Math.max(0, jump);
  // "saltan fuera de tu video": la pupila se escapa del todo
  if (between(W(iFuera), W(iTrucos))) {
    px = 1.6;
    py = -0.2;
  }
  const lid = between(W(iCansa) - 2, W(iCansa) + 14) ? lin(f, W(iCansa) - 2, W(iCansa) + 8) : 0;
  const eyeOn = f < W(iTrucos) || between(W(iCorte) - 4, W(iMiraste)) || f >= LOOP;
  const eyeY = FLOOR - 300;

  // ---------- Gancho ----------
  let g: GanchoPose = { x: 800, y: FLOOR, scale: 0.55, t, talk: T.talkAt(f), expr: "surprised", look: { x: px * 0.6, y: py * 0.4 } };
  let rope: RopeSpec = null;
  if (f < W(iSacadas)) g = { ...g, x: 800, squash: 0.2 * impact(f - 10), lean: 6 * Math.sin(f * 0.6) };
  else if (f < W(iTrucos)) g = { ...g, x: 820, expr: f >= W(iFuera) ? "squashed" : "focused" };
  else if (f < W(iColor)) g = { ...g, x: 470, y: FLOOR - 40 * Math.abs(Math.sin(t * 7)), expr: "happy", armL: 150, armR: 150 };
  else if (f < W(iCorte)) g = { ...g, x: 820, expr: "smug", armR: 95, look: { x: -1, y: -0.2 } };
  else if (f < W(iMiraste)) g = { ...g, x: 820, expr: f >= W(iCansa) + 8 ? "surprised" : "normal", item: f >= W(iCansa) + 4 && f < W(iCansa) + 16 ? "scissors" : "none", armR: 80 };
  else if (f < W(iEscr)) g = { ...g, x: 800, expr: "smug", armR: 150, look: { x: -0.4, y: -1 } };
  else {
    g = { ...g, x: 760, expr: f >= W(iMuestra) ? "happy" : "focused", armL: 30, armR: 40, look: { x: 0, y: 0 } };
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, W(iHook));
    }
  }
  if (f >= LOOP) {
    g = { x: 800, y: FLOOR, scale: 0.55, t, expr: "surprised", look: { x: px * 0.6, y: py * 0.4 } };
    rope = null;
  }

  // Diana sobre la pupila cuando aterriza (pantalla)
  const pupilStage = { x: 470 + px * 150 * 1.1, y: eyeY - 340 * 1.1 + (170 + py * 60) * 1.1 };
  const pupilScreen = M(pupilStage.x, pupilStage.y);
  const landed = k < 8 && (f < W(iAterr) + 30 || f >= LOOP);

  return (
    <Paper>
      <Stage bump={0.5 * impact(f - W(iCansa) - 10)}>
        {eyeOn ? <BigEye x={470} y={eyeY} scale={1.1} px={px} py={py} lid={lid} /> : null}
        {/* Contador de saltos en tiempo real */}
        {f < W(iFuera) || f >= LOOP ? <BigStat x={470} y={FLOOR} scale={0.62} value={String(f >= LOOP ? 0 : jumps)} label="SALTOS" fill={(jumps % 3) / 3 + (k / 30)} /> : null}
        {/* Fuera del video */}
        {between(W(iFuera) - 4, W(iTrucos)) ? <PhoneFeed x={300} y={FLOOR} scale={0.9} scroll={f * 2} lift={(1 - fall(f - W(iFuera) + 4, fps)) * 900} /> : null}
        {/* Truco 1: una sola cosa en movimiento (todo lo demás quieto) */}
        {between(W(iMov) - 6, W(iColor)) ? (
          <>
            <Card x={180} y={FLOOR} kind="word" text="QUIETO" lift={(1 - fall(f - W(iMov) + 6, fps)) * 900} />
            <Card x={760} y={FLOOR} kind="word" text="QUIETO" lift={(1 - fall(f - W(iMov) + 3, fps)) * 900} />
          </>
        ) : null}
        {/* Truco 2: la palabra clave en otro color */}
        {between(W(iColor) - 10, W(iCorte) - 4) ? <WordsCard x={430} y={FLOOR - 40} scale={1.05} words={["tu", "palabra", "clave"]} hot={f >= W(iColor) ? 1 : -1} big lift={(1 - fall(f - W(iColor) + 10, fps)) * 900} squash={0.3 * impact(f - W(iColor))} /> : null}
        <Gancho {...g} />
      </Stage>

      {/* Diana: donde aterriza la mirada; al final cae sobre la palabra naranja del subtítulo */}
      {landed ? <Target x={pupilScreen.x} y={pupilScreen.y} s={0.9} opacity={0.9} /> : null}
      {between(W(iColor), W(iCorte) - 4) ? <Target x={M(430, FLOOR - 150).x} y={M(430, FLOOR - 150).y} s={1.1} /> : null}
      {between(W(iQueria) - 2, W(iHook) + 4) ? <Target x={interpolate(lin(f, W(iQueria) - 2, W(iQueria) + 8, 0, 1, (x) => 1 - (1 - x) ** 3), [0, 1], [pupilScreen.x, 712])} y={interpolate(lin(f, W(iQueria) - 2, W(iQueria) + 8, 0, 1, (x) => 1 - (1 - x) ** 3), [0, 1], [pupilScreen.y, 520])} s={1.3} /> : null}
      {between(W(iSacadas), W(iFuera)) ? <Tag x={540} y={1400} text="SACADAS · ~3 POR SEGUNDO" align="center" opacity={lin(f, W(iSacadas), W(iSacadas) + 6)} /> : null}
      {/* Corte cuando la mirada se cansa: destello de corte */}
      {between(W(iCansa) + 8, W(iCansa) + 12) ? <div style={{ position: "absolute", inset: 0, background: A.ivory }} /> : null}

      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iMuestra)} until={LOOP} />
      <TopCaptions words={T.words} f={f} fps={fps} keys={[idx("saltar"), iSacadas, iSegundo, iFuera, iMov, iColor, iCorte, iQueria]} hide={f >= W(iEscr)} />

      <Audio src={staticFile("audio/voz_ojos.wav")} />
      <Snd at={0} src={SOUND.tension} vol={0.5} />
      {[10, 20, 30].map((at) => (
        <Snd key={at} at={at} src={SOUND.impacto} vol={0.35} />
      ))}
      <Snd at={W(iNotaste)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iFuera)} src={SOUND.tiron} vol={0.7} />
      <Snd at={W(iMov) + 2} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iColor)} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iCansa) + 8} src={SOUND.tiron} vol={0.7} />
      <Snd at={W(iQueria)} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iMuestra) + 1} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};
