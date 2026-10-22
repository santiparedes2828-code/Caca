import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-segundos.json";
import { Gancho, antennaWorld, type Expr, type GanchoPose } from "../Gancho";
import { Card, Cover, Elephant, PhoneFeed, Speech, Stopwatch, Ticket } from "../props";
import { A, Captions, FONT, Paper, Rope, SOUND, Tag, fall, impact, lin, yank } from "../system";

// "Tienes 1,7 segundos" — reel de Gancho pensado para RETENCIÓN (formula-viral + estilo-altera + personaje-gancho).
// Dato real: en el celular, una persona mira un contenido 1,7 s de media (Facebook IQ, 2016).
// Gancho del primer segundo: el cronómetro ya corre de 1,7 a 0 EN TIEMPO REAL y un pulgar gigante intenta pasar el video.
// Remate: "¿Ves? Tú sigues aquí" con el cronómetro marcando los segundos que de verdad lleva viendo.

const caps = captionsJson as Caption[];
const W = (i: number) => Math.round((caps[i].startMs / 1000) * 30);
const E = (i: number) => Math.round((caps[i].endMs / 1000) * 30);
const LAST = caps.length - 1;
export const SEGUNDOS_FRAMES = E(LAST) + 36;
const LOOP = SEGUNDOS_FRAMES - 16;
const FLOOR = 1150;
const S = 1.25;
const FLOOR_SCREEN = 1330;
const M = (x: number, y: number) => ({ x: 540 + (x - 540) * S, y: FLOOR_SCREEN + (y - FLOOR) * S });
const fmt = (v: number) => v.toFixed(1).replace(".", ",");

// Índice de la primera palabra que empieza por `w` a partir de `from` (robusto a la puntuación de Scribe)
const idx = (w: string, from = 0) => {
  for (let i = from; i < caps.length; i++) if (caps[i].text.toLowerCase().replace(/[¿?¡!.,:…]/g, "").startsWith(w)) return i;
  return from;
};

const talkAt = (f: number) => {
  for (let i = 0; i < caps.length; i++) {
    const a = W(i);
    const b = Math.max(a + 3, E(i));
    if (f >= a && f < b) return 0.35 + 0.65 * Math.abs(Math.sin((f - a) * 0.9));
  }
  return 0;
};

// Pulgar gigante (marfil, contorno de tinta) que barre la pantalla para "pasar" el video
const Thumb: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <svg width={520} height={760} viewBox="0 0 520 760" style={{ position: "absolute", left: x - 140, top: y - 120, transform: `rotate(${rot}deg)`, transformOrigin: "260px 700px", overflow: "visible" }}>
    <path d="M180 40 C120 40 100 90 100 140 L100 420 C70 400 30 410 30 460 C30 520 120 560 160 640 L180 760 L470 760 L470 380 C470 330 430 310 400 320 C400 280 360 260 330 280 C330 250 290 230 260 250 L260 140 C260 90 240 40 180 40 Z" fill="#FBF8F2" stroke={A.ink} strokeWidth={12} strokeLinejoin="round" />
    <path d="M128 92 C128 70 150 60 176 62 C210 64 228 84 228 108 L228 150 C200 160 150 160 128 150 Z" fill="#E6DFD2" stroke={A.ink} strokeWidth={8} />
  </svg>
);

export const Segundos: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talk = talkAt(f);
  const between = (a: number, b: number) => f >= a && f < b;

  // Palabras clave del guion
  const iPasan = idx("pasan");
  const iPorque = idx("porque");
  const iSeg = idx("segundos", iPorque);
  const iGast = idx("gastaste");
  const iUno = idx("uno", iGast);
  const iContenido = idx("contenido");
  const iCelular = idx("celular");
  const iFacebook = idx("facebook");
  const iTitulo = idx("título");
  const iIntro = idx("intro");
  const iSolo = idx("solo");
  const iTres = idx("tres");
  const iRaro = idx("raro");
  const iMueva = idx("mueva");
  const iPromesa = idx("promesa");
  const iSi = idx("si", iPromesa);
  const iPasan2 = idx("pasan", iSi);
  const iVes = idx("ves");
  const iAqui = idx("aquí");
  const iEscr = idx("escríbeme");
  const iHook = idx("hook", iEscr);
  const iMuestra = idx("muestra");

  // ---------- Cronómetro ----------
  let value = fmt(Math.max(0, 1.7 - t));
  let ring = Math.max(0, 1 - t / 1.7);
  if (f >= W(iSeg) - 4) {
    value = "1,7";
    ring = 1;
  }
  if (f >= W(iUno)) {
    value = "0,7";
    ring = 0.41;
  }
  const chunk = lin(f, W(iUno), W(iUno) + 22);
  // Al final: los segundos que de verdad lleva viendo
  const proof = f >= W(iVes) - 2 && f < LOOP;
  if (proof) {
    value = fmt(t);
    ring = 1;
  }
  const zeroHit = Math.round(1.7 * fps);
  // A 0,0 suena la alarma: el cronómetro tiembla y salta y los dígitos parpadean hasta "1,7 segundos"
  const alarm = f >= zeroHit && f < W(iSeg) - 4;
  const swSquash = 0.35 * impact(f - zeroHit) + 0.3 * impact(f - W(iSeg) + 4) + 0.5 * impact(f - W(iUno));
  // Posición del cronómetro por tramos
  const swOut = lin(f, W(iContenido) - 10, W(iContenido) + 6, 0, 1, (x) => x * x);
  const swBack = lin(f, W(iVes) - 6, W(iVes) + 6, 0, 1, (x) => 1 - (1 - x) ** 3);
  const swOn = f < W(iContenido) + 6 || f >= W(iVes) - 6;
  // En el CTA el ticket cae encima del cronómetro y lo aplasta
  const tLand = W(iMuestra) + 1;
  const crush = f >= tLand && f < LOOP ? 0.95 * lin(f, tLand, tLand + 6) : 0;
  const crushed = f >= tLand + 6 && f < LOOP;
  const swX = f < W(iVes) - 6 ? 470 - swOut * 900 : 470 + (1 - swBack) * 900;

  // ---------- Pulgar ----------
  const swipe1 = lin(f, W(iPasan) - 2, W(iPasan) + 16);
  const swipe2 = lin(f, W(iPasan2) - 4, W(iPasan2) + 10);
  const thumbOn = (swipe1 > 0 && swipe1 < 1) || (swipe2 > 0 && f < W(iVes));
  const thumbX = swipe1 > 0 && swipe1 < 1 ? interpolate(swipe1, [0, 0.5, 1], [1100, 520, 1300]) : interpolate(swipe2, [0, 1], [1100, 300]);
  const thumbY = swipe1 > 0 && swipe1 < 1 ? interpolate(swipe1, [0, 0.5, 1], [1500, 1050, 700]) : interpolate(swipe2, [0, 1], [1500, 900]);
  // El escenario se arrastra con el pulgar al final ("te pasan") y vuelve con "¿Ves?"
  const stageDrag = f >= W(iPasan2) && f < W(iVes) + 6 ? -1300 * lin(f, W(iPasan2) + 2, W(iPasan2) + 12, 0, 1, (x) => x * x) * (1 - lin(f, W(iVes) - 4, W(iVes) + 6, 0, 1, (x) => 1 - (1 - x) ** 3)) : 0;

  // ---------- Gancho ----------
  let g: GanchoPose = { x: 470, y: FLOOR, scale: 0.55, t, talk, expr: "normal" as Expr };
  let rope: { bx: number; by: number; slack: number; buzz: number; screen?: boolean } | null = null;
  const swTop = FLOOR - 500 * 1.1 * (1 - 0.3 * swSquash) + 12;
  if (f < W(iUno) + 4) {
    // Corre encima del cronómetro como en una rueda de hámster; con el pulgar se agarra
    const hold = swipe1 > 0 && swipe1 < 1;
    const panic = f >= zeroHit && f < W(iSeg) - 4;
    g = { ...g, x: 470 + (panic ? 30 * Math.sin(f * 0.9) : 0), y: swTop - (panic ? 60 * Math.abs(Math.sin(f * 0.45)) : 0), walk: hold ? undefined : t * 16, expr: hold ? "strain" : f < zeroHit || panic ? "surprised" : "focused", lean: hold ? -24 * Math.sin(Math.PI * swipe1) : panic ? 14 * Math.sin(f * 0.9) : 6, armL: hold || panic ? 170 : 60, armR: hold || panic ? 160 : 60, squash: 0.3 * impact(f - zeroHit) };
  } else if (f < W(iContenido)) {
    // El trozo que cae lo arrastra: cae al suelo y se levanta
    const drop = fall(f - W(iUno) - 4, fps);
    g = { ...g, x: 640, y: swTop + (FLOOR - swTop) * drop, expr: drop < 1 ? "surprised" : "squashed", squash: drop >= 1 ? 0.4 * impact(f - W(iUno) - 14) : -0.2, lean: 20 * (1 - drop), armL: 160, armR: 160 };
    if (f > W(iUno) + 30) g = { ...g, expr: "smug", squash: 0, lean: 0, armL: 30, armR: 30 };
  } else if (f < W(iTitulo) - 6) {
    g = { ...g, x: 720, expr: "normal", armR: 100, look: { x: -1, y: -0.2 } };
  } else if (f < W(iSolo)) {
    const kick = between(W(iTitulo) + 12, W(iTitulo) + 20);
    g = { ...g, x: 700, expr: kick ? "focused" : "smug", lean: kick ? -18 : 0, armL: 40, armR: 60 };
    if (f >= W(iIntro) + 2) {
      g = { ...g, hookOut: true, expr: "strain", lean: 14 };
      const yk = yank(f - W(iIntro) - 10, 10);
      rope = { bx: 420 - yk * 200, by: FLOOR - 470 - yk * 600, slack: f < W(iIntro) + 10 ? 0.5 : 0, buzz: f >= W(iIntro) + 6 && f < W(iIntro) + 10 ? 1 : 0 };
    }
  } else if (f < W(iTres)) {
    // "solo mira": se acerca a cámara con los ojos enormes
    const near = lin(f, W(iSolo), W(iSolo) + 10, 0, 1, (x) => 1 - (1 - x) ** 3);
    g = { ...g, x: 540, scale: 0.55 + 0.5 * near, y: FLOOR + 60 * near, expr: "surprised", look: { x: 0, y: -0.2 }, armL: 20, armR: 20 };
  } else if (f < W(iSi)) {
    const runP = lin(f, W(iMueva) - 4, W(iMueva) + 14);
    g = { ...g, x: runP > 0 && runP < 1 ? interpolate(runP, [0, 1], [820, 470]) : f >= W(iMueva) + 14 ? 470 : 820, scale: 0.6, walk: runP > 0 && runP < 1 ? t * 22 : undefined, expr: f >= W(iPromesa) ? "happy" : "normal", armL: 40, armR: 90 };
    if (f >= W(iMueva) + 14) g = { ...g, y: FLOOR - 20 - 30 * Math.abs(Math.sin(t * 8)), expr: "happy" };
  } else if (f < W(iVes) - 6) {
    g = { ...g, x: 700, expr: "surprised", armL: 160, armR: 160 };
  } else if (f < W(iEscr)) {
    // "¿Ves? Tú sigues aquí": vuelve, señala a cámara
    g = { ...g, x: 760, y: FLOOR, expr: f >= W(iAqui) ? "smug" : "happy", armR: 95, armL: 30, look: { x: -0.2, y: 0 } };
  } else {
    g = { ...g, x: 760, y: FLOOR, scale: 0.55, expr: f >= W(iMuestra) ? "happy" : "focused", armL: 30, armR: 40 };
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = { screen: true, bx: 712, by: 476, slack: interpolate(f, [W(iHook) + 4, W(iHook) + 14], [0.8, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), buzz: f >= W(iHook) + 14 ? 0.4 : 0 };
    }
  }
  // Loop: vuelve al plano inicial (Gancho encima del cronómetro, que marca 1,7)
  if (f >= LOOP) {
    g = { x: 470, y: swTop, scale: 0.55, t, expr: "surprised", walk: t * 16, lean: 6, armL: 60, armR: 60 };
    rope = null;
    value = "1,7";
    ring = 1;
  }
  const loopIn = f >= LOOP;

  // ---------- Los tres requisitos ----------
  const slots = [210, 470, 730];
  const slotsOn = between(W(iTres), W(iSi) + 4);
  const eleDrop = fall(f - W(iRaro) + 2, fps);
  const promiseDrop = fall(f - W(iPromesa) + 2, fps);

  const ant = antennaWorld(g);
  const words = caps.map((c, i) => ({ text: c.text, at: W(i) }));
  const ctaOn = f >= W(iEscr) && f < LOOP + 6;

  return (
    <Paper>
      <AbsoluteFill style={{ transformOrigin: `540px ${FLOOR}px`, transform: `translate(${stageDrag}px, ${FLOOR_SCREEN - FLOOR + 30 * impact(f - W(iUno))}px) scale(${S * (1 + 0.04 * impact(f - W(iUno)))})` }}>
        <div style={{ position: "absolute", left: -400, right: -400, top: FLOOR + 6, height: 2, background: "rgba(14,13,11,0.10)" }} />

        {/* Cronómetro */}
        {(swOn && !crushed) || loopIn ? <Stopwatch x={loopIn ? 470 : swX} y={FLOOR} value={alarm && Math.sin(f * 1.6) < -0.3 ? "" : value} ring={ring} scale={1.1} squash={swSquash + crush} chunk={chunk} t={t} rotate={alarm ? 7 * Math.sin(f * 2.6) : 0} lift={alarm ? 14 * Math.abs(Math.sin(f * 1.3)) : 0} /> : null}

        {/* Feed del celular + fuente */}
        {between(W(iContenido) - 4, W(iTitulo) - 4) ? (
          <PhoneFeed x={430} y={FLOOR} scale={1.15} scroll={f * (f < W(iCelular) + 10 ? 60 : 4)} lift={(1 - fall(f - W(iContenido) + 4, fps)) * 900} />
        ) : null}

        {/* Lo que no hace: título que patea, intro que arranca */}
        {between(W(iTitulo) - 6, W(iSolo)) ? (
          <Card x={420 - lin(f, W(iTitulo) + 16, W(iTitulo) + 28, 0, 900)} y={FLOOR} kind="word" text="TU TÍTULO" lift={(1 - fall(f - W(iTitulo) + 6, fps)) * 900 + 300 * Math.sin(Math.PI * lin(f, W(iTitulo) + 16, W(iTitulo) + 28))} rotate={-60 * lin(f, W(iTitulo) + 16, W(iTitulo) + 28)} />
        ) : null}
        {between(W(iIntro) - 4, W(iSolo)) ? <Speech x={420 - 200 * yank(f - W(iIntro) - 10, 10)} y={FLOOR - 300} text="Hola a todos…" lift={600 * yank(f - W(iIntro) - 10, 10)} rotate={-20 * yank(f - W(iIntro) - 10, 10)} /> : null}

        {/* Uno, dos, tres */}
        {slotsOn ? (
          <>
            {slots.map((x, k) => (
              <svg key={k} width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: lin(f, W(iTres) + k * 3, W(iTres) + k * 3 + 6) }}>
                <ellipse cx={x} cy={FLOOR} rx={130} ry={24} fill="none" stroke={A.ink} strokeWidth={6} strokeDasharray="14 12" />
                <text x={x} y={FLOOR + 70} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill={A.orange}>
                  {k + 1}
                </text>
              </svg>
            ))}
            {f >= W(iRaro) - 2 ? <Elephant x={slots[0]} y={FLOOR} scale={0.62} lift={(1 - eleDrop) * 900} squash={0.4 * impact(f - W(iRaro) - 6)} t={t} /> : null}
            {f >= W(iPromesa) - 2 ? <Cover x={slots[2]} y={FLOOR} w={300} h={260} lift={(1 - promiseDrop) * 900} t={t} /> : null}
          </>
        ) : null}

        {/* Loop / plano inicial no necesita más: Gancho */}
        <Gancho {...g} />
      </AbsoluteFill>

      {/* Fuente honesta del dato */}
      {between(W(iFacebook), W(iTitulo) - 4) ? <Tag x={540} y={1400} text="FACEBOOK IQ · 2016 · MEDIA EN CELULAR" align="center" opacity={lin(f, W(iFacebook), W(iFacebook) + 6)} /> : null}

      {/* Línea del anzuelo (pantalla) */}
      {rope
        ? (() => {
            const a = M(ant.x, ant.y);
            const b = rope.screen ? { x: rope.bx, y: rope.by } : M(rope.bx, rope.by);
            return <Rope ax={a.x} ay={a.y} bx={b.x} by={b.y} slack={rope.slack} buzz={rope.buzz} t={t} />;
          })()
        : null}

      {/* Pulgar gigante */}
      {thumbOn ? <Thumb x={thumbX} y={thumbY} rot={swipe1 > 0 && swipe1 < 1 ? -20 + 30 * swipe1 : -10} /> : null}

      {/* CTA con beneficio */}
      {ctaOn ? (
        <AbsoluteFill style={{ opacity: 1 - lin(f, LOOP, LOOP + 6) }}>
          <div style={{ position: "absolute", left: 72, width: 858, top: 470, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: A.ink }}>
            <span style={{ opacity: lin(f, W(iEscr), W(iEscr) + 6) }}>Escríbeme</span>
            <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 8px", borderRadius: 18, transformOrigin: "50% 100%", transform: `scale(${1 + 0.25 * impact(f - W(iHook))}, ${f < W(iHook) ? 0 : 1 - 0.3 * impact(f - W(iHook))})`, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>HOOK</span>
          </div>
          {f >= W(iMuestra) - 6 && f < LOOP ? <Ticket x={540} y={f >= W(iMuestra) + 1 ? 1330 - 687 * (1 - lin(f, W(iMuestra) + 1, W(iMuestra) + 7)) : 643} lift={(1 - fall(f - (W(iMuestra) - 6), fps)) * 1200} squash={0.4 * impact(f - W(iMuestra) - 1)} /> : null}
        </AbsoluteFill>
      ) : null}

      {/* Subtítulos arriba; en el CTA callan (no hay texto doble) */}
      {ctaOn ? null : <Captions words={words} f={f} fps={fps} top={250} size={82} keys={[iPasan, iSeg, iUno, iCelular, iTitulo, iIntro, iSolo, iTres, iRaro, iMueva, iPromesa, iPasan2, iAqui]} />}

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_segundos_tight.wav")} />
      <Snd at={0} src={SOUND.tension} vol={0.7} />
      <Snd at={W(iPasan) - 2} src={SOUND.tiron} vol={0.6} />
      <Snd at={zeroHit} src={SOUND.impacto} vol={0.9} />
      <Snd at={zeroHit + 4} src={SOUND.tension} vol={0.7} />
      <Snd at={W(iSeg) - 4} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iUno)} src={SOUND.impacto} vol={1} />
      <Snd at={W(iUno) + 14} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iContenido) + 4} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iTitulo) + 16} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iIntro) + 6} src={SOUND.tension} vol={0.5} />
      <Snd at={W(iIntro) + 10} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(iRaro) + 6} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iPromesa) + 6} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iPasan2) + 2} src={SOUND.tiron} vol={0.7} />
      <Snd at={W(iVes)} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iMuestra) + 1} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};

const Snd: React.FC<{ at: number; src: string; vol: number }> = ({ at, src, vol }) => (
  <Sequence name={src} from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
