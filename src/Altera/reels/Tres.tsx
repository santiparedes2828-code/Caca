import type { Caption } from "@remotion/captions";
import React from "react";
import { Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-tres.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { BigStat, FilmStrip, Gate, Trophy } from "../props2";
import { Cta, FLOOR, ScreenRope, Snd, Stage, TopCaptions, ctaRope, fmt1, timing, type RopeSpec } from "../reelkit";
import { Paper, SOUND, Tag, fall, impact, lin } from "../system";

// "Si pasas de los 3 segundos… ganas" — Gancho · retención (formula-viral, corrección 2026-10-22).
// Dato: el 65 % de quienes ven los 3 primeros segundos de un video sigue al menos 10 s (Facebook).
// Frame 0: contador en tiempo real + Gancho chocando contra una puerta naranja "3 s" que solo se abre
// EXACTAMENTE a los 3,0 s del video. Remate: "¿Ves? Ya pasaste de los 10" con el contador real.

const caps = captionsJson as Caption[];
const T = timing(caps);
export const TRES_FRAMES = T.frames;
const LOOP = TRES_FRAMES - 14;
const OPEN = 90; // 3,0 s
const BONK = 8;

export const Tres: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;
  const between = (a: number, b: number) => f >= a && f < b;

  const iPorque = idx("porque");
  const i65 = idx("65");
  const i10 = idx("10", i65);
  const iFace = idx("facebook");
  const iPuerta = idx("puerta");
  const iTresC = idx("tres", iPuerta);
  const iFinal = idx("final");
  const iResult = idx("resultado");
  const iCortar = idx("cortar");
  const iVes = idx("ves");
  const iEscr = idx("escríbeme");
  const iHook = idx("hook", iEscr);
  const iMuestra = idx("muestra");

  // ---------- Contador real ----------
  const counterOn = f < W(i65) - 2 || between(W(iVes) - 4, LOOP) || f >= LOOP;
  const counterVal = f >= LOOP ? "0,0" : fmt1(t);

  // ---------- Gancho ----------
  let g: GanchoPose = { x: 300, y: FLOOR, scale: 0.6, t, talk: T.talkAt(f), expr: "normal" };
  let rope: RopeSpec = null;
  if (f < OPEN + 20) {
    // corre contra la puerta, rebota (BONK), empuja con todo y a los 3,0 s cae del otro lado
    const run = f < BONK ? interpolate(f, [0, BONK], [250, 520]) : f < BONK + 10 ? 520 - 70 * Math.sin((Math.PI * (f - BONK)) / 10) : 520;
    const through = lin(f, OPEN, OPEN + 14, 0, 1, (x) => x * x);
    g = { ...g, x: run + 330 * through, walk: f < BONK || through > 0 ? t * 20 : undefined, expr: f < BONK ? "focused" : f < BONK + 10 ? "squashed" : f < OPEN ? "strain" : "happy", lean: f >= BONK + 10 && f < OPEN ? -18 : 0, armR: f >= BONK + 10 && f < OPEN ? 95 : 40, armL: f >= BONK + 10 && f < OPEN ? 85 : 40, squash: 0.5 * impact(f - BONK) };
  } else if (f < W(iPuerta)) g = { ...g, x: 800, expr: "smug", armR: 100, look: { x: -1, y: -0.2 } };
  else if (f < W(iTresC)) g = { ...g, x: 330, expr: "strain", armL: 160, armR: 160 };
  else if (f < W(iVes)) {
    const cutting = f >= W(iCortar) - 2;
    g = { ...g, x: 810, scale: 0.5, expr: cutting ? "focused" : "normal", item: cutting ? "scissors" : "none", armR: cutting ? 80 : 100, look: { x: -1, y: 0 } };
  } else if (f < W(iEscr)) g = { ...g, x: 780, expr: "smug", armR: 95, armL: 30 };
  else {
    g = { ...g, x: 760, expr: f >= W(iMuestra) ? "happy" : "focused", armL: 30, armR: 40 };
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, W(iHook));
    }
  }
  if (f >= LOOP) {
    g = { x: 250, y: FLOOR, scale: 0.6, t, expr: "focused", walk: t * 20 };
    rope = null;
  }

  const gateOpen = f >= LOOP ? 0 : lin(f, OPEN, OPEN + 6, 0, 1, (x) => 1 - (1 - x) ** 2);
  const pct = Math.round(65 * lin(f, W(i65), W(i65) + 18, 0, 1, (x) => 1 - (1 - x) ** 3));

  return (
    <Paper>
      <Stage bump={impact(f - BONK) * 0.6 + impact(f - OPEN)}>
        {/* Puerta de los 3 segundos */}
        {f < W(i65) || between(W(iPuerta) - 2, W(iTresC)) || f >= LOOP ? (
          <Gate x={f < W(i65) || f >= LOOP ? 640 : 520} y={FLOOR} scale={0.9} open={f >= W(iPuerta) - 2 && f < LOOP ? lin(f, W(iPuerta) + 4, W(iPuerta) + 12) : gateOpen} lift={f >= W(iPuerta) - 2 && f < LOOP ? (1 - fall(f - W(iPuerta) + 2, fps)) * 900 : 0} />
        ) : null}
        {/* Contador real */}
        {counterOn ? <BigStat x={f >= W(iVes) - 4 && f < LOOP ? 420 : 300} y={f >= W(iVes) - 4 && f < LOOP ? FLOOR : FLOOR - 560} scale={f >= W(iVes) - 4 && f < LOOP ? 1.1 : 0.9} value={counterVal} label="SEGUNDOS" fill={Math.min(1, t / 3)} shadow={f >= W(iVes) - 4} squash={0.4 * impact(f - OPEN) + 0.4 * impact(f - W(iVes))} /> : null}
        {/* El dato */}
        {between(W(i65) - 2, W(iPuerta) - 2) ? <BigStat x={460} y={FLOOR} scale={1.15} value={`${pct}%`} label={f >= W(i10) ? "LLEGA A LOS 10 S" : "VE LOS 3 PRIMEROS"} fill={pct / 100} lift={(1 - fall(f - W(i65) + 2, fps)) * 900} squash={0.4 * impact(f - W(i65) - 6) + 0.3 * impact(f - W(i10))} /> : null}
        {/* Las tres cosas, una detrás de otra en el centro */}
        {between(W(iFinal) - 4, W(iResult) - 2) ? <FilmStrip x={430} y={FLOOR - 40} scale={1.0} n={5} t={t} jump={lin(f, W(iFinal) + 2, W(iFinal) + 14)} lift={(1 - fall(f - W(iFinal) + 4, fps)) * 900} /> : null}
        {between(W(iResult) - 2, W(iCortar) - 2) ? <Trophy x={430} y={FLOOR} scale={1.4} lift={(1 - fall(f - W(iResult) + 2, fps)) * 900} squash={0.4 * impact(f - W(iResult) - 6)} /> : null}
        {between(W(iCortar) - 2, W(iVes) - 4) ? <FilmStrip x={430} y={FLOOR - 40} scale={1.0} n={5} t={t} cut={lin(f, W(iCortar) + 6, W(iCortar) + 20)} /> : null}
        <Gancho {...g} />
      </Stage>

      {between(W(iFace), W(iPuerta) - 2) ? <Tag x={540} y={1400} text="FACEBOOK · VIDEO EN FEED" align="center" opacity={lin(f, W(iFace), W(iFace) + 6)} /> : null}
      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iMuestra)} until={LOOP} />
      <TopCaptions words={T.words} f={f} fps={fps} keys={[idx("ganas"), i65, i10, iPuerta, iFinal, iResult, iCortar, idx("pasaste")]} hide={f >= W(iEscr)} />

      <Audio src={staticFile("audio/voz_tres.wav")} />
      <Snd at={BONK - 1} src={SOUND.impacto} vol={0.9} />
      <Snd at={BONK + 12} src={SOUND.tension} vol={0.7} />
      <Snd at={OPEN} src={SOUND.tiron} vol={0.8} />
      <Snd at={OPEN + 2} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(iPorque)} src={SOUND.impacto} vol={0.3} />
      <Snd at={W(i65) + 5} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iPuerta) + 5} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iFinal) + 8} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iResult) + 5} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iCortar) + 6} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(iVes)} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iMuestra) + 1} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};
