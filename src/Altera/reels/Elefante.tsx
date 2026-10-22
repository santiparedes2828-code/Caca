import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-imagen.json";
import { Gancho, antennaWorld, type Expr, type GanchoPose } from "../Gancho";
import { Card, Cover, Elephant, Letters, MemoryBox, Speech, Thought } from "../props";
import { A, Captions, FONT, Paper, Rope, SOUND, Slab, Tag, fall, impact, lin, yank } from "../system";

// "El elefante rosa" — primer reel narrado por GANCHO (personaje-gancho.md · estilo-altera.md · formula-viral).
// Dato: efecto de superioridad de la imagen (las imágenes se recuerdan mejor que las palabras).
// Gancho narra: la voz es suya y mueve la boca con cada palabra.

const caps = captionsJson as Caption[];
const W = (i: number) => Math.round((caps[i].startMs / 1000) * 30);
const E = (i: number) => Math.round((caps[i].endMs / 1000) * 30);
export const ELEFANTE_FRAMES = 1020;
const LOOP = 996;
const FLOOR = 1150;
// El escenario se dibuja en coordenadas de "maqueta" y se escala 1,25× con el suelo en y = 1330 (los subtítulos van arriba)
const S = 1.25;
const FLOOR_SCREEN = 1330;
const M = (x: number, y: number) => ({ x: 540 + (x - 540) * S, y: FLOOR_SCREEN + (y - FLOOR) * S });

// Boca: abierta mientras suena una palabra
const talkAt = (f: number) => {
  for (let i = 0; i < caps.length; i++) {
    const a = W(i);
    const b = Math.max(a + 3, E(i));
    if (f >= a && f < b) return 0.35 + 0.65 * Math.abs(Math.sin((f - a) * 0.9));
  }
  return 0;
};

const ORIGIN = { cover: 320, gancho: 720 }; // plano inicial (y final del loop)

export const Elefante: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talk = talkAt(f);
  const between = (a: number, b: number) => f >= a && f < b;

  // ---------- Gancho: posición y pose por tramos ----------
  let g: GanchoPose = { x: ORIGIN.gancho, y: FLOOR, scale: 0.62, t, talk, expr: "normal" as Expr };
  let rope: { bx: number; by: number; slack: number; buzz: number; screen?: boolean } | null = null;

  // B1 · arrastra la sábana (0 → "esto")
  const tYank = W(12);
  const jerkPhase = f / 26;
  const jerk = Math.floor(jerkPhase) + Math.min(1, (jerkPhase % 1) * 3) ** 2;
  const coverX = ORIGIN.cover + 34 * Math.min(jerk, 4.6);
  const coverHook = { x: coverX + 150, y: FLOOR - 330 };
  const yk = f >= tYank ? yank(f - tYank, 9) : 0;
  if (f < tYank + 10) {
    const pulse = (jerkPhase % 1) < 0.3 ? 1 : 0;
    g = { ...g, expr: "focused", lean: 12 + 5 * pulse, armL: 105, armR: 70, bendL: -0.4, bendR: 0.5, hookOut: true, squash: 0.08 * pulse };
    rope = { bx: coverHook.x + yk * 700, by: coverHook.y - yk * 300, slack: 0, buzz: pulse };
    if (f >= tYank) g = { ...g, lean: 12 + 18 * yk, expr: "surprised" };
  }
  // Se cae sentado por el tirón y se levanta
  const fallT = tYank + 10;
  if (between(fallT, W(16))) {
    const k = f - fallT;
    g = { ...g, hookOut: false, expr: f < W(14) ? "squashed" : f < W(15) + 6 ? "surprised" : "smug", squash: 0.55 * Math.max(0, 1 - k / 14) + 0.35 * impact(k) * 0.4, lean: 0, armL: 40, armR: f >= W(15) + 6 ? 150 : 40, look: { x: -0.8, y: 0 } };
  }

  // B2 · el elefante
  const pinkP = lin(f, W(15), W(15) + 8);
  const eleOut = lin(f, W(27) - 12, W(27) + 4, 0, 1, (x) => x * x);
  const eleX = coverX - eleOut * 900;
  const eleSquash = f >= tYank + 2 ? 0.25 * impact(f - tYank - 2) + 0.3 * impact(f - W(15)) : 0;

  // B3 · "no te lo vas a sacar de la cabeza"
  const thoughtS = between(W(17), W(27)) ? spring({ frame: f - W(17), fps, config: { damping: 12 } }) : 0;
  const pullOut = between(W(23), W(26)) ? lin(f, W(23), W(26) - 2) : 0;
  const snap = f >= W(26) ? impact(f - W(26)) : 0;
  if (between(W(16), W(27))) {
    g = { ...g, expr: f >= W(23) && f < W(26) ? "strain" : f >= W(26) ? "squashed" : "smug", armL: f >= W(23) && f < W(26) ? 170 : 60, armR: f >= W(23) && f < W(26) ? 160 : 120, bendR: -0.3, squash: f >= W(26) ? 0.4 * impact(f - W(26)) : 0, look: { x: -0.4, y: -0.7 } };
  }

  // B4 · la memoria guarda imágenes, no palabras
  const boxRise = lin(f, W(28), W(28) + 12, 0, 1, (x) => 1 - (1 - x) ** 3) * (1 - lin(f, W(37), W(37) + 12));
  const imgFall = fall(f - W(31), fps);
  const wordFall = lin(f, W(36) - 2, W(36) + 8, 0, 1, (x) => x * x);
  const wordBreak = lin(f, W(36) + 8, W(36) + 22);
  if (between(W(27), W(37))) {
    g = { ...g, x: 720, expr: f >= W(36) + 8 ? "surprised" : "normal", armR: 95, armL: 30, look: { x: -1, y: 0.2 } };
  }

  // B5 · el nombre cae con peso
  const supT = W(41);
  const imgT = W(44) - 2;
  if (between(W(37), W(45))) {
    const jump = f >= supT + 6 ? fall(f - supT - 6, fps) : 0;
    const up = lin(f, supT + 4, supT + 14);
    g = { ...g, x: 700, expr: f >= supT ? "happy" : "normal", armL: f >= supT ? 150 : 30, armR: f >= supT ? 150 : 30, squash: f >= supT + 14 ? 0.35 * impact(f - supT - 14) : f >= supT ? -0.2 : 0, y: FLOOR - 196 * up - 120 * Math.sin(Math.PI * up) - 30 * Math.sin(Math.PI * Math.min(1, jump)) * (f > supT + 20 ? 1 : 0) };
  }

  // B6 · se escucha y se va / se ve y se queda
  const speechIn = between(W(49), W(52)) ? spring({ frame: f - W(49), fps, config: { damping: 12 } }) : 0;
  const speechGo = lin(f, W(50), W(51) + 8, 0, 1, (x) => x * x);
  const cardDrop = fall(f - W(54), fps);
  const cardHooked = f >= W(57) - 4;
  if (between(W(45), W(60))) {
    const missing = between(W(51), W(51) + 16);
    g = { ...g, x: 700, expr: missing ? "surprised" : f >= W(58) ? "happy" : "normal", armL: 40, armR: f >= W(57) - 4 ? 120 : 40 };
    if (missing) {
      g = { ...g, hookOut: true, lean: -8 };
      rope = { bx: 520, by: 640 - 200 * speechGo, slack: 0.4, buzz: 0 };
    }
    if (cardHooked) {
      g = { ...g, hookOut: true, lean: 8, expr: f >= W(59) ? "happy" : "focused" };
      rope = { bx: 400, by: FLOOR - 200 - (f < W(59) ? 40 * (1 - lin(f, W(58), W(59))) : 0), slack: f < W(58) ? 0.5 : 0, buzz: between(W(58), W(59) + 6) ? 1 : 0 };
    }
  }

  // B7 · un buen video: lo que se dice, se ve (reel real de Hookhouse)
  const clipIn = lin(f, W(63), W(63) + 14, 0, 1, (x) => 1 - (1 - x) ** 3);
  const peek = lin(f, W(76) - 4, W(76) + 10, 0, 1, (x) => 1 - (1 - x) ** 2);
  if (between(W(60), W(77))) {
    g = { ...g, x: 720, y: FLOOR, scale: 0.5, expr: "normal", armL: 30, armR: 100, bendR: 0.2, look: { x: -1, y: -0.3 } };
  }
  if (between(W(76) - 4, W(77) + 20)) g = { ...g, x: 720, scale: 0.5, expr: "love", armL: 150, armR: 150 };

  // B8 · HOOKHOUSE con peso + B9 · CTA
  const tip = lin(f, W(77) - 4, W(77) + 10, 0, 1, (x) => x * x);
  const tHook = W(78);
  const tHouse = W(79);
  const tCta = W(86);
  const tBox = W(87);
  if (f >= W(77) + 20) {
    const hop = lin(f, W(79) + 8, W(79) + 18);
    g = { ...g, x: 660, y: FLOOR - 186 * hop - 90 * Math.sin(Math.PI * hop), scale: 0.5, expr: f >= W(85) ? "happy" : "smug", armL: 30, armR: 40, squash: f >= W(79) + 18 ? 0.3 * impact(f - W(79) - 18) : 0 };
    if (f >= tBox + 4) {
      g = { ...g, hookOut: true, expr: "focused", lean: 6 };
      rope = { screen: true, bx: 712, by: 476, slack: interpolate(f, [tBox + 4, tBox + 14], [0.8, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), buzz: f >= tBox + 14 ? 0.4 : 0 };
    }
  }
  // Loop: vuelve la sábana y Gancho la engancha como en el frame 0
  const loopP = lin(f, LOOP, ELEFANTE_FRAMES - 4, 0, 1, (x) => 1 - (1 - x) ** 2);
  if (f >= LOOP) {
    g = { x: ORIGIN.gancho, y: FLOOR, scale: 0.62, t, expr: "focused", lean: 12 * loopP, armL: 105, armR: 70, bendL: -0.4, bendR: 0.5, hookOut: loopP > 0.4 };
    rope = loopP > 0.4 ? { bx: ORIGIN.cover + 150, by: FLOOR - 330, slack: 0.6 * (1 - loopP), buzz: 0 } : null;
  }

  const ant = antennaWorld(g);
  const words = caps.map((c, i) => ({ text: c.text, at: W(i) }));

  return (
    <Paper>
      <AbsoluteFill style={{ transformOrigin: `540px ${FLOOR}px`, transform: `translateY(${FLOOR_SCREEN - FLOOR}px) scale(${S})` }}>
      {/* Suelo: línea de apoyo muy sutil */}
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR + 6, height: 2, background: "rgba(14,13,11,0.10)" }} />

      {/* B1–B2 */}
      {f < W(27) + 6 ? (
        <>
          {f >= tYank - 1 ? <Elephant x={eleX} y={FLOOR} scale={0.8} pink={pinkP} squash={eleSquash} t={t} trunk={between(W(14), W(15) + 10) ? 1 : 0} /> : null}
          {yk < 1 ? <Cover x={coverX + yk * 700} y={FLOOR} lift={yk * 500} rotate={yk * 30} opacity={1 - yk * 0.3} t={t} /> : null}
        </>
      ) : null}
      {thoughtS > 0 ? (
        <Thought x={g.x - 150} y={FLOOR - 330} s={thoughtS * (1 + 0.08 * snap)}>
          <div style={{ position: "relative", width: 200, height: 140, transform: `translate(${pullOut * 120}px, ${-pullOut * 160}px) scale(${1 + 0.4 * pullOut}, ${1 - 0.3 * pullOut})` }}>
            <Elephant x={100} y={140} scale={0.42} t={t} />
          </div>
        </Thought>
      ) : null}

      {/* B4 */}
      {between(W(28), W(37) + 12) ? (
        <>
          <MemoryBox x={380} y={FLOOR} rise={boxRise} squash={f >= W(31) + 8 ? 0.2 * impact(f - W(31) - 8) : 0} />
          {f >= W(31) && f < W(37) ? <Card x={380} y={FLOOR - 250} kind="image" lift={(1 - imgFall) * 900} rotate={-6 * (1 - imgFall)} shadow={false} /> : null}
          {f >= W(36) - 2 && wordBreak < 0.05 ? <Card x={380 + wordFall * 40} y={FLOOR - 250} kind="word" lift={(1 - wordFall) * 900} rotate={8 * wordFall} shadow={false} /> : null}
          {wordBreak > 0 && f < W(45) ? <Letters text="ELEFANTE" x={600} y={FLOOR} p={wordBreak} /> : null}
        </>
      ) : null}

      {/* B5 */}
      {between(W(37), W(45) + 8) ? (
        <>
          {f >= supT - 7 ? <Slab text="SUPERIORIDAD" x={470} y={FLOOR - 120} size={96} squash={0.5 * impact(f - supT)} lift={f < supT ? 900 * (1 - lin(f, supT - 7, supT, 0, 1, (x) => x * x)) : 0} opacity={1 - lin(f, W(45), W(45) + 8)} /> : null}
          {f >= imgT - 7 ? <Slab text="DE LA IMAGEN" x={470} y={FLOOR} size={84} color={A.orange} squash={0.5 * impact(f - imgT)} lift={f < imgT ? 900 * (1 - lin(f, imgT - 7, imgT, 0, 1, (x) => x * x)) : 0} opacity={1 - lin(f, W(45), W(45) + 8)} /> : null}
        </>
      ) : null}

      {/* B6 */}
      {speechIn > 0 ? <Speech x={520} y={760} text="bla bla" lift={speechGo * 900} opacity={1 - speechGo} rotate={-10 * speechGo} /> : null}
      {between(W(54) - 2, W(60) + 8) ? <Card x={400} y={FLOOR} kind="image" lift={(1 - cardDrop) * 900} squash={f >= W(59) ? 0.35 * impact(f - W(59)) : 0} opacity={1 - lin(f, W(60), W(60) + 8)} /> : null}

      {/* B7: el elefante asoma por detrás del reel */}
      {peek > 0 && f < W(77) + 4 ? <Elephant x={400} y={FLOOR - 711 + 300 - 170 * peek} scale={0.66} t={t} trunk={1} /> : null}
      {/* B7–B8: reel real que se vuelve plataforma */}
      {f >= W(63) && f < LOOP ? (
        <div style={{ position: "absolute", inset: 0, perspective: 1400, perspectiveOrigin: "50% 62%" }}>
          <div
            style={{
              position: "absolute",
              left: 400 - 200,
              top: FLOOR - 711,
              width: 400,
              height: 711,
              transformOrigin: "50% 100%",
              transform: `translateY(${(1 - clipIn) * 1000 - 100 * tip}px) rotateX(${84 * tip}deg)`,
              borderRadius: 26,
              overflow: "hidden",
              background: A.ink,
              outline: `6px solid ${A.ink}`,
              boxShadow: tip < 0.5 ? "0 30px 60px rgba(14,13,11,0.3)" : "none",
            }}
          >
            <Sequence from={W(63)} layout="none">
              <OffthreadVideo src={staticFile("portfolio/puerta_hook.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Sequence>
          </div>
        </div>
      ) : null}
      {between(W(64), W(77)) ? <Tag x={400} y={FLOOR + 22} text="REEL DE HOOKHOUSE" align="center" opacity={lin(f, W(64), W(64) + 8)} /> : null}
      

      {f >= W(77) && f < LOOP + 8 ? (
        <AbsoluteFill style={{ opacity: 1 - lin(f, LOOP, LOOP + 8) }}>
          <Wordmark f={f} fps={fps} tHook={tHook} tHouse={tHouse} baseline={FLOOR - 104} />
        </AbsoluteFill>
      ) : null}

      {/* Loop: la sábana vuelve a caer en su sitio */}
      {f >= LOOP ? <Cover x={ORIGIN.cover} y={FLOOR} lift={(1 - fall(f - LOOP, fps)) * 1100} t={t} /> : null}

      <Gancho {...g} />
      </AbsoluteFill>
      {/* Líneas en coordenadas de pantalla (por encima de todo) */}
      {rope
        ? (() => {
            const a = M(ant.x, ant.y);
            const b = rope.screen ? { x: rope.bx, y: rope.by } : M(rope.bx, rope.by);
            return <Rope ax={a.x} ay={a.y} bx={b.x} by={b.y} slack={rope.slack} buzz={rope.buzz} t={t} />;
          })()
        : null}

      {between(W(23), W(26))
        ? (() => {
            const a = M(ant.x, ant.y);
            const b = M(g.x - 150 + pullOut * 120, FLOOR - 470 - pullOut * 160);
            return <Rope ax={a.x} ay={a.y} bx={b.x} by={b.y} slack={0.2} buzz={1} t={t} />;
          })()
        : null}
      {f >= W(77) && f < LOOP + 8 ? (
        <AbsoluteFill style={{ opacity: 1 - lin(f, LOOP, LOOP + 8) }}>
          <div style={{ position: "absolute", left: 72, width: 858, top: 470, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: A.ink }}>
            <span style={{ opacity: lin(f, tCta, tCta + 6) }}>Escríbeme</span>
            <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 8px", borderRadius: 18, transformOrigin: "50% 100%", transform: `scale(${1 + 0.25 * impact(f - tBox)}, ${f < tBox ? 0 : 1 - 0.3 * impact(f - tBox)})`, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>HOOK</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {/* Sin texto doble: cuando la palabra ya es un objeto en escena (el nombre del efecto, el CTA), el subtítulo calla */}
      {between(W(39), W(45)) || f >= W(86) ? null : <Captions words={words} f={f} fps={fps} top={250} size={74} keys={[2, 12, 15, 26, 31, 44, 51, 59, 72, 76, 85, 87]} />}

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_imagen.wav")} />
      <Snd at={4} src={SOUND.tension} vol={0.6} />
      <Snd at={56} src={SOUND.tension} vol={0.45} />
      <Snd at={tYank} src={SOUND.tiron} vol={0.7} />
      <Snd at={fallT} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(15)} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(23)} src={SOUND.tension} vol={0.6} />
      <Snd at={W(26)} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(31) + 8} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(36) + 8} src={SOUND.impacto} vol={0.4} />
      <Snd at={supT} src={SOUND.impacto} vol={0.9} />
      <Snd at={imgT} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(51)} src={SOUND.tiron} vol={0.4} />
      <Snd at={W(58)} src={SOUND.tension} vol={0.5} />
      <Snd at={W(59)} src={SOUND.impacto} vol={0.7} />
      <Snd at={tHook + 6} src={SOUND.impacto} vol={0.8} />
      <Snd at={tHouse + 6} src={SOUND.impacto} vol={0.8} />
      <Snd at={tBox} src={SOUND.impacto} vol={0.5} />
      <Snd at={LOOP + 8} src={SOUND.impacto} vol={0.6} />
    </Paper>
  );
};

const Snd: React.FC<{ at: number; src: string; vol: number }> = ({ at, src, vol }) => (
  <Sequence name={src} from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

const Wordmark: React.FC<{ f: number; fps: number; tHook: number; tHouse: number; baseline: number }> = ({ f, fps, tHook, tHouse, baseline }) => {
  const size = 112;
  const half = (t0: number) => {
    const p = fall(f - t0, fps);
    return { lift: f < t0 ? 2000 : (1 - p) * 900, sq: 0.5 * impact(f - t0 - 7), on: f >= t0 };
  };
  const a = half(tHook);
  const b = half(tHouse);
  const part = (text: string, s: { lift: number; sq: number; on: boolean }) => (
    <span style={{ display: "inline-block", opacity: s.on ? 1 : 0, transformOrigin: "50% 100%", transform: `translateY(${-s.lift}px) scale(${1 + 0.16 * s.sq}, ${1 - 0.3 * s.sq})` }}>{text}</span>
  );
  return (
    <div style={{ position: "absolute", left: 470 - 430, width: 860, top: baseline - size * 0.86, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.055em", color: A.ink, whiteSpace: "pre" }}>
      {part("HOOK", a)}
      {part("HOUSE", b)}
    </div>
  );
};
