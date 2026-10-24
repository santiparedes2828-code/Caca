import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-piedra.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, FLOOR, ScreenRope, Snd, Stage, Thumb, TopCaptions, ctaRope, timing, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, fall, impact, lin } from "../system";
import { IconCard, SnapBar } from "./Snap";

// "Piedra" — la piedra se congela justo antes de romperse · ~20 s (formula-viral, 2026-10-24).
// Frame 0: unas manos empujan una roca por un acantilado ("se rompe o no??? 🤔"). A 3 cm del suelo el vídeo se
// congela con un rayado de disco y Hookie aparece encima: "Espera…". El vídeo congelado se encoge a tarjeta: es TU
// vídeo, y la gente se va justo antes de lo mejor (el pulgar lo pasa); Hookie lo engancha y lo trae de vuelta
// (gancho, ritmo y golpe) → CTA al DM con presupuesto. Respuesta al final: "¿Y la piedra? Mira." y revienta.

const caps = captionsJson as Caption[];
const T = timing(caps);
const SRC = "broll/piedra.mp4"; // 1080 × 2124 a 30 fps; se recorta por arriba y por abajo (102 px)
const TRIM = 15; // empieza en 0,5 s: las manos ya empujan
const STOP = 105; // frame del original congelado: la piedra a punto de tocar el suelo (impacto en el 108)
const FREEZE = STOP - TRIM;
const ROCK = { x: 680, y: 1222 }; // la piedra en pantalla en el frame congelado
const PAYOFF_D = 30;
const PUNCH = 1.4; // el final se ve acercado a la piedra (es pequeña en el plano original)

const { W, idx } = T;
const iEsto = idx("esto");
const iGente = idx("gente");
const iMejor = idx("mejor");
const iEditamos = idx("editamos");
const iFinal = idx("final");
const iGancho = idx("gancho");
const iRitmo = idx("ritmo");
const iGolpe = idx("golpe");
const iEscr = idx("escríbenos");
const iHook = idx("hook", iEscr);
const iPres = idx("presupuesto");
const iY = idx("y", iPres);
const iPiedra = idx("piedra");
const iMira = idx("mira");

const SHRINK = W(iEsto) - 8;
const CTA_END = W(iY) - 2; // el CTA dura hasta "¿Y la piedra?"
const EXIT = W(iEscr) - 8;
const RET = W(iPiedra) - 6;
const EXP = W(iMira) - 6;
const RESUME = W(iMira) + 2;
export const PIEDRA_FRAMES = RESUME + PAYOFF_D + 14;

const out3 = (x: number) => 1 - (1 - x) ** 3;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const FULL = { x: 540, y: 960, w: 1080, h: 1920 };
const CARD = { x: 370, y: 910, w: 430, h: 764 };
const BIG = { x: 540, y: 900, w: 560, h: 996 };

// Dónde está el vídeo congelado en cada frame (pantalla completa → tarjeta → fuera → vuelve → pantalla completa)
const cardAt = (f: number) => {
  let r = { ...FULL, rot: 0, zoom: 1 };
  if (f < SHRINK) return { ...r, zoom: mix(1, 1.3, lin(f, FREEZE, SHRINK, 0, 1, out3)) };
  const k = lin(f, SHRINK, SHRINK + 10, 0, 1, out3);
  r = { x: mix(FULL.x, CARD.x, k), y: mix(FULL.y, CARD.y, k), w: mix(FULL.w, CARD.w, k), h: mix(FULL.h, CARD.h, k), rot: 0, zoom: mix(1.3, 1, k) };
  // el pulgar lo pasa… y Hookie lo trae de vuelta
  const swipe = lin(f, W(iGente) - 2, W(iGente) + 12, 0, 1, out3) * (1 - lin(f, W(iEditamos) + 2, W(iEditamos) + 10, 0, 1, out3));
  r.y -= 80 * swipe;
  r.rot = -5 * swipe;
  // golpe
  r.rot += 3 * impact(f - W(iGolpe) - 3) * Math.sin(f * 2.1);
  // sale para el CTA
  r.x -= 900 * lin(f, EXIT, EXIT + 10, 0, 1, (x) => x * x);
  if (f >= RET) {
    const b = lin(f, RET, RET + 10, 0, 1, out3);
    const e = lin(f, EXP, RESUME, 0, 1, (x) => x * x * (3 - 2 * x));
    r = { x: mix(mix(-500, BIG.x, b), FULL.x, e), y: mix(BIG.y, FULL.y, e), w: mix(BIG.w, FULL.w, e), h: mix(BIG.h, FULL.h, e), rot: -10 * (1 - b) * (1 - e), zoom: mix(1, PUNCH, e) };
  }
  return r;
};

const FrozenCard: React.FC<{ f: number }> = ({ f }) => {
  const c = cardAt(f);
  const s = c.w / 1080;
  const card = 1 - (c.w - CARD.w) / (FULL.w - CARD.w); // 1 = tarjeta, 0 = pantalla completa
  const fill = f < W(iFinal) ? 0.78 : mix(0.78, 1, lin(f, W(iFinal), W(iFinal) + 10, 0, 1, out3));
  const ring = 1 + 0.35 * impact(f - W(iMejor)) + 0.25 * impact(f - FREEZE - 3);
  return (
    <div style={{ position: "absolute", left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, borderRadius: 30 * card, overflow: "hidden", border: card > 0.02 ? `${Math.round(8 * card)}px solid ${A.ink}` : undefined, boxShadow: `0 40px 60px rgba(14,13,11,${0.35 * card})`, transform: `rotate(${c.rot}deg)`, background: A.ink }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${s})` }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${ROCK.x}px ${ROCK.y}px`, transform: `scale(${c.zoom})`, filter: `saturate(${0.75 + 0.25 * lin(f, EXP, RESUME)})` }}>
          <Img src={staticFile("broll/piedra_freeze.jpg")} style={{ position: "absolute", left: 0, top: -102, width: 1080, height: 2124 }} />
          {f >= FREEZE + 2 ? (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - lin(f, EXP, EXP + 6) }}>
              <circle cx={ROCK.x} cy={ROCK.y - 6} r={95 * ring * Math.min(1, fall(f - FREEZE - 2, 30))} fill="none" stroke={A.orange} strokeWidth={14} />
            </svg>
          ) : null}
        </div>
        {/* barra de progreso: el vídeo está casi acabado… y la gente se va aquí */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: "rgba(255,255,255,0.3)", opacity: card }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", background: f >= W(iFinal) ? A.orange : "#FFFFFF" }} />
        </div>
      </div>
    </div>
  );
};

export const Piedra: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  // ---------- Hookie ----------
  // aparece a la izquierda de la piedra congelada (la derecha la tapan los botones de TikTok) y pasa a la derecha con la tarjeta
  let g: GanchoPose = { x: 300, y: FLOOR + (1 - fall(f - FREEZE, fps)) * 700, scale: 0.95, t, talk: T.talkAt(f), expr: "focused", armR: 150, armL: 30, bendR: 0.3, look: { x: 1, y: 0.2 }, squash: 0.35 * impact(f - FREEZE - 6) };
  let rope: RopeSpec = null;
  if (f >= SHRINK) {
    const k = lin(f, SHRINK, SHRINK + 10, 0, 1, out3);
    g = { ...g, x: mix(300, 820, k), y: FLOOR - 120 * Math.sin(Math.PI * k), scale: mix(0.95, 0.62, k), expr: "normal", armR: 40, armL: 30, bendR: 0, look: { x: -1, y: -0.2 }, squash: 0 };
    if (f >= W(iGente) && f < W(iEditamos) - 4) g = { ...g, expr: f >= W(iMejor) ? "strain" : "surprised", armL: 110, look: { x: -1, y: -0.6 } };
    if (f >= W(iEditamos) - 4 && f < W(iGancho)) {
      const c = cardAt(f);
      g = { ...g, expr: f < W(iFinal) ? "strain" : "smug", hookOut: f < W(iFinal) + 8, lean: f < W(iFinal) ? -12 : 0, armL: 90, armR: 100 };
      if (f < W(iFinal) + 8) rope = { screen: true, bx: c.x + c.w / 2 - 40, by: c.y - c.h / 2 + 40, slack: lin(f, W(iEditamos) - 4, W(iEditamos) + 4, 0.7, 0.05), buzz: f >= W(iEditamos) ? 0.6 : 0 };
    }
    if (f >= W(iGancho) && f < EXIT) g = { ...g, expr: "happy", armR: f >= W(iGolpe) ? 160 : 60 + 40 * Math.sin(f * 0.5), armL: f >= W(iRitmo) ? 120 : 30, squash: 0.35 * impact(f - W(iGolpe) - 3) };
    if (f >= EXIT) {
      g = { ...g, x: 760, scale: 0.6, expr: f >= W(iPres) ? "happy" : "focused", armL: 30, armR: 40, lean: 0, look: { x: 0, y: 0 } };
      if (f >= W(iHook) + 4 && f < CTA_END) {
        g = { ...g, hookOut: true, lean: 6 };
        rope = ctaRope(f, W(iHook), 760);
      }
    }
    if (f >= RET) g = { ...g, x: 820, scale: 0.62, expr: f >= W(iMira) - 4 ? "love" : "surprised", hookOut: false, look: { x: -1, y: -0.4 }, armL: 150, armR: 150, lean: 0 };
  }
  const showG = f >= FREEZE && f < RESUME;
  const gOpacity = 1 - lin(f, EXP, EXP + 6);

  const iconsOut = lin(f, EXIT, EXIT + 8);
  const boom = impact(f - RESUME - 3);

  return (
    <Paper>
      {/* 1 · el vídeo de la piedra, tal cual, hasta 3 frames antes del impacto */}
      <Sequence durationInFrames={FREEZE}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(SRC)} trimBefore={TRIM} volume={0.9} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </AbsoluteFill>
      </Sequence>
      {f < FREEZE ? <SnapBar text="se rompe o no???" emoji opacity={1} /> : null}

      {/* 2 · congelado → tarjeta */}
      {f >= FREEZE && f < RESUME ? <FrozenCard f={f} /> : null}

      {/* gancho · ritmo · golpe */}
      {f >= W(iGancho) - 2 && f < EXIT + 8 ? (
        <AbsoluteFill style={{ opacity: 1 - iconsOut, transform: `translateY(${iconsOut * 200}px)` }}>
          <IconCard x={250} y={1500} p={fall(f - W(iGancho) + 2, fps)} kind="hook" t={t} />
          {f >= W(iRitmo) - 2 ? <IconCard x={540} y={1500} p={fall(f - W(iRitmo) + 2, fps)} kind="beat" t={t} /> : null}
          {f >= W(iGolpe) - 2 ? <IconCard x={830} y={1500} p={fall(f - W(iGolpe) + 2, fps)} kind="hit" t={t} /> : null}
        </AbsoluteFill>
      ) : null}

      {/* el pulgar pasa tu vídeo */}
      {f >= W(iGente) - 8 && f < W(iEditamos) + 8 ? <Thumb x={300} y={1420 - lin(f, W(iGente) - 8, W(iGente) + 12, 0, 1, out3) * 340 + lin(f, W(iEditamos), W(iEditamos) + 8, 0, 1) * 700} rot={-14} /> : null}

      {showG ? (
        <AbsoluteFill style={{ opacity: gOpacity, filter: f < SHRINK + 6 ? "drop-shadow(0 0 12px rgba(251,248,242,0.95))" : undefined }}>
          <Stage>
            <Gancho {...g} />
          </Stage>
          <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
        </AbsoluteFill>
      ) : null}

      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iPres)} until={CTA_END} verb="Escríbenos" lines={["TE PASAMOS", "PRESUPUESTO"]} />

      {/* "Espera…" susurrado sobre el vídeo congelado */}
      {f >= W(0) && f < SHRINK + 4 ? (
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 82, letterSpacing: "-0.04em", color: A.ivory, textShadow: "0 4px 18px rgba(0,0,0,0.6)", opacity: lin(f, W(0), W(0) + 4) * (1 - lin(f, SHRINK, SHRINK + 4)) }}>
          Espera…
        </div>
      ) : null}
      <TopCaptions words={T.words} f={f} fps={fps} keys={[iMejor, iFinal, iGolpe, iPiedra]} hide={f < W(iEsto) || (f >= W(iEscr) && f < CTA_END) || f >= EXP} />

      {/* 3 · la respuesta: sigue el vídeo y revienta */}
      <Sequence from={RESUME} durationInFrames={PAYOFF_D}>
        <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.3) * 22 * boom}px, ${Math.cos(f * 1.9) * 16 * boom}px)` }}>
          <AbsoluteFill style={{ transformOrigin: `${ROCK.x}px ${ROCK.y}px`, transform: `scale(${PUNCH * (1 + 0.06 * boom)})` }}>
            <OffthreadVideo src={staticFile(SRC)} trimBefore={STOP} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
      {f >= RESUME + PAYOFF_D ? (
        <AbsoluteFill style={{ transformOrigin: `${ROCK.x}px ${ROCK.y}px`, transform: `scale(${PUNCH})`, overflow: "hidden" }}>
          <Img src={staticFile("broll/piedra_end.jpg")} style={{ position: "absolute", left: 0, top: -102, width: 1080, height: 2124 }} />
        </AbsoluteFill>
      ) : null}

      <Audio src={staticFile("audio/voz_piedra.wav")} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(fr) => (fr >= FREEZE && fr < EXP ? 0.06 : 0)} />
      <Snd at={36} src={SOUND.tension} vol={0.45} />
      <Snd at={FREEZE - 1} src="sfx/rebobinar.wav" vol={0.7} />
      <Snd at={FREEZE + 6} src={SOUND.impacto} vol={0.5} />
      <Snd at={SHRINK} src="sfx/whoosh.wav" vol={0.4} />
      <Snd at={W(iGente) - 2} src="sfx/whoosh.wav" vol={0.5} />
      <Snd at={W(iMejor)} src="sfx/pop.wav" vol={0.6} />
      <Snd at={W(iEditamos) - 2} src={SOUND.tiron} vol={0.9} />
      <Snd at={W(iFinal)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iGancho)} src="sfx/pop.wav" vol={0.5} />
      <Snd at={W(iRitmo)} src="sfx/pop.wav" vol={0.5} />
      <Snd at={W(iGolpe) + 3} src={SOUND.impacto} vol={0.9} />
      <Snd at={EXIT} src="sfx/whoosh.wav" vol={0.4} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iPres) + 1} src={SOUND.impacto} vol={0.7} />
      <Snd at={RET} src="sfx/whoosh.wav" vol={0.5} />
      <Snd at={EXP} src="sfx/riser.wav" vol={0.35} />
      <Snd at={RESUME + 3} src="sfx/boom.wav" vol={0.9} />
      <Snd at={RESUME + 3} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};
