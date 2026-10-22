import type { Caption } from "@remotion/captions";
import React from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-sonido.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Speech } from "../props";
import { BigStat, FilmStrip, Megaphone, MuteIcon, SoundWaves, WordsCard } from "../props2";
import { Cta, FLOOR, ScreenRope, Snd, Stage, TopCaptions, ctaRope, timing, type RopeSpec } from "../reelkit";
import { Paper, SOUND, Tag, fall, impact, lin } from "../system";

// "¿Me estás escuchando?" — Gancho · retención (formula-viral, corrección 2026-10-22).
// Dato: hasta el 85 % de los videos de Facebook se reproducen sin sonido (Digiday, 2016).
// Frame 0: Gancho grita por un megáfono; a los 0,3 s un icono de silencio gigante cae y aplasta las ondas.
// Remate: "Si leíste esto sin audio… ya lo entendiste" (el propio video se entiende sin sonido).

const caps = captionsJson as Caption[];
const T = timing(caps);
export const SONIDO_FRAMES = T.frames;
const LOOP = SONIDO_FRAMES - 14;
const SLAM = 9;

export const Sonido: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;
  const between = (a: number, b: number) => f >= a && f < b;

  const iProb = idx("probablemente");
  const i85 = idx("85");
  const iSin = idx("sin", i85);
  const iDigi = idx("digiday");
  const iIdea = idx("idea");
  const iNadie = idx("nadie");
  const iTres = idx("tres");
  const iSub = idx("subtítulos");
  const iImagen = idx("imagen");
  const iGancho = idx("gancho");
  const iLeiste = idx("leíste");
  const iEnt = idx("entendiste");
  const iEscr = idx("escríbeme");
  const iHook = idx("hook", iEscr);
  const iMuestra = idx("muestra");

  // ---------- Gancho ----------
  let g: GanchoPose = { x: 300, y: FLOOR, scale: 0.6, t, talk: T.talkAt(f), expr: "normal" };
  let rope: RopeSpec = null;
  const yelling = f < W(iProb);
  if (yelling) g = { ...g, expr: f < SLAM ? "happy" : "surprised", armR: 92, armL: 100, bendL: -0.6, lean: f < SLAM ? -4 : 6, squash: 0.3 * impact(f - SLAM) };
  else if (f < W(i85)) g = { ...g, expr: "smug", armL: 150, armR: 150, squash: 0.15 };
  else if (f < W(iIdea)) g = { ...g, x: 760, expr: "surprised", look: { x: -1, y: -0.3 } };
  else if (f < W(iTres)) g = { ...g, x: 700, expr: f >= W(iNadie) ? "squashed" : "normal", armR: 120 };
  else if (f < W(iLeiste)) g = { ...g, x: 820, scale: 0.5, expr: "focused", armR: 95, look: { x: -1, y: 0 } };
  else if (f < W(iEscr)) g = { ...g, x: 720, expr: "happy", armR: 160, armL: 30 };
  else {
    g = { ...g, x: 760, expr: f >= W(iMuestra) ? "happy" : "focused", armL: 30, armR: 40 };
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, W(iHook));
    }
  }
  if (f >= LOOP) {
    g = { x: 300, y: FLOOR, scale: 0.6, t, expr: "happy", armR: 92, armL: 100, bendL: -0.6, lean: -4 };
    rope = null;
  }

  // ---------- Objetos ----------
  const muteDrop = f < SLAM ? 1 - f / SLAM : 0;
  const muteOut = lin(f, W(iProb) + 8, W(iProb) + 18, 0, 1, (x) => x * x);
  const pct = Math.round(85 * lin(f, W(i85), W(i85) + 18, 0, 1, (x) => 1 - (1 - x) ** 3));
  const statOn = between(W(i85) - 2, W(iIdea));
  const bubbleIn = between(W(iIdea) - 2, W(iTres));
  const ghost = lin(f, W(iNadie), W(iNadie) + 10);
  const endMute = between(W(iLeiste), W(iEscr));

  return (
    <Paper>
      <Stage bump={impact(f - SLAM) + 0.6 * impact(f - W(iEnt))}>
        {/* Frame 0: megáfono + ondas; el silencio cae encima y las aplasta */}
        {f < W(i85) || f >= LOOP ? (
          <>
            <Megaphone x={430} y={FLOOR - 120} scale={1} opacity={1 - lin(f, W(i85) - 6, W(i85))} />
            <SoundWaves x={660} y={FLOOR - 30} scale={1.2} t={t} crush={f >= LOOP ? 0 : lin(f, SLAM, SLAM + 3)} opacity={1 - lin(f, W(i85) - 6, W(i85))} />
            {f < LOOP ? <MuteIcon x={660 + muteOut * 700} y={FLOOR} scale={1.15} lift={muteDrop * 1300 + muteOut * 300} rotate={muteOut * 30} squash={0.5 * impact(f - SLAM)} /> : null}
          </>
        ) : null}
        {/* El dato */}
        {statOn ? <BigStat x={470} y={FLOOR} scale={1.15} value={`${pct}%`} label="SIN SONIDO" fill={pct / 100} lift={(1 - fall(f - W(i85) + 2, fps)) * 900} squash={0.4 * impact(f - W(i85) - 6)} /> : null}
        {/* La idea solo en la voz: nadie la ve */}
        {bubbleIn ? <Speech x={430} y={FLOOR - 330} text="MI IDEA" opacity={1 - 0.85 * ghost} lift={20 * Math.sin(t * 3)} /> : null}
        {bubbleIn && f >= W(iNadie) ? <MuteIcon x={440} y={FLOOR} scale={0.6} lift={(1 - fall(f - W(iNadie), fps)) * 900} squash={0.4 * impact(f - W(iNadie) - 6)} /> : null}
        {/* Tres arreglos: uno detrás de otro, grandes, en el centro */}
        {between(W(iSub) - 4, W(iImagen) - 2) ? <WordsCard x={430} y={FLOOR - 20} scale={1.0} words={["ASÍ", "DE", "GRANDES"]} hot={2} big lift={(1 - fall(f - W(iSub) + 4, fps)) * 900} squash={0.4 * impact(f - W(iSub) + 1)} /> : null}
        {between(W(iImagen) - 2, W(iGancho) - 2) ? <FilmStrip x={430} y={FLOOR - 40} scale={1.0} n={5} t={t} jump={lin(f, W(iImagen) + 6, W(iImagen) + 18)} lift={(1 - fall(f - W(iImagen) + 2, fps)) * 900} /> : null}
        {between(W(iGancho) - 2, W(iLeiste)) ? <WordsCard x={430} y={FLOOR - 20} scale={1.0} words={["¿SABÍAS", "QUE…?"]} hot={0} big lift={(1 - fall(f - W(iGancho) + 2, fps)) * 900} squash={0.4 * impact(f - W(iGancho) - 6)} /> : null}
        {/* Remate: el silencio vuelve… y se entiende igual */}
        {endMute ? <MuteIcon x={420} y={FLOOR} scale={1.05} lift={(1 - fall(f - W(iLeiste), fps)) * 900} squash={0.4 * impact(f - W(iLeiste) - 6)} /> : null}
        <Gancho {...g} />
      </Stage>

      {between(W(iDigi), W(iIdea)) ? <Tag x={540} y={1400} text="DIGIDAY · 2016 · VIDEOS DE FACEBOOK" align="center" opacity={lin(f, W(iDigi), W(iDigi) + 6)} /> : null}
      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iMuestra)} until={LOOP} />
      <TopCaptions words={T.words} f={f} fps={fps} keys={[0, i85, iSin, iIdea, iNadie, iSub, iImagen, iGancho, iEnt]} hide={f >= W(iEscr)} />

      <Audio src={staticFile("audio/voz_sonido.wav")} />
      <Snd at={SLAM - 1} src={SOUND.impacto} vol={1} />
      <Snd at={W(iProb) + 8} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(i85) + 5} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iNadie) + 5} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iSub) + 5} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iImagen) + 5} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iGancho) + 5} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iLeiste) + 5} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iMuestra) + 1} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};
