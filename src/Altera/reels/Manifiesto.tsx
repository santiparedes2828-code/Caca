import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-manifiesto.json";
import { A, ClipCard, ContactShadow, FLOOR, FONT, FrameMarks, Headline, Paper, Rope, SAFE, SOUND, Slab, Tag, fall, impact, lin, settle, yank } from "../system";

// Reel 1 del sistema «HOOKHOUSE ALTERA LA REALIDAD» (estilo-altera.md).
// 0–2 s EFECTOS aplasta un clip que intenta escapar · 2–5 s la línea naranja arranca la palabra y libera el clip ·
// 5–11 s qué mostrar / qué ocultar / cuándo cortar sobre un clip real · 11–16 s el resultado, con tiempo ·
// 16–20,6 s los elementos forman HOOKHOUSE + CTA, y el cierre devuelve el plano inicial (loop).
// Material real: reels propios de Hookhouse (Gorila y Puerta). Sin métricas ni resultados inventados.

const caps = captionsJson as Caption[];
const FPS = 30;
// Cada frase de la locución se coloca en su tramo (fuente en ms → inicio en s)
const PHRASES = [
  { from: 0, to: 5, src: [0, 2300], at: 0 },
  { from: 6, to: 10, src: [2300, 4500], at: 2.35 },
  { from: 11, to: 12, src: [4550, 5800], at: 5.4 },
  { from: 13, to: 14, src: [5800, 7050], at: 7.3 },
  { from: 15, to: 16, src: [7050, 8450], at: 9.0 },
  { from: 17, to: 26, src: [8450, 12450], at: 11.2 },
  { from: 27, to: 33, src: [12450, 15760], at: 16.4 },
];
const W = (i: number) => {
  const p = PHRASES.find((q) => i >= q.from && i <= q.to) ?? PHRASES[0];
  return Math.round(((caps[i].startMs - p.src[0]) / 1000 + p.at) * FPS);
};
export const MANIFIESTO_FRAMES = 650;
const LOOP = 628; // aquí empieza la vuelta al plano inicial

// Plano inicial (y final del loop)
const CARD0 = { w: 640, h: 900 };
const EF = { size: 200, text: "EFECTOS" };
const efWidth = EF.text.length * EF.size * 0.6;
const HIT = 8; // golpe de EFECTOS

// Clip de video que empieza a reproducirse en el frame `at` del reel, desde `from` frames del archivo
const Clip: React.FC<{ src: string; at?: number; from?: number; scale?: number; oy?: number }> = ({ src, at = 0, from = 0, scale = 1.55, oy = 0.36 }) => (
  <Sequence from={at} layout="none">
    <OffthreadVideo src={staticFile(src)} muted startFrom={from} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transformOrigin: `50% ${oy * 100}%`, transform: `scale(${scale})` }} />
  </Sequence>
);

export const Manifiesto: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  // ---------- 0–5 s: EFECTOS sobre el clip, y la línea que lo arranca ----------
  const tHook = W(6);
  const tTense = W(8);
  const tYank = W(10);
  const released = f >= tYank;
  const rel = released ? settle(f - tYank, fps) : 0;
  const weight = f < HIT ? 0 : 0.26 * (1 - rel);
  const cardSquash = weight + (f >= HIT && !released ? 0.22 * impact(f - HIT) : 0) - (released ? 0.12 * impact(f - tYank) : 0);
  // El clip intenta escapar: se escurre hacia la derecha hasta que lo aplastan; luego forcejea
  const escape = f < HIT ? lin(f, 0, HIT, 90, 30) : released ? 0 : 26 * Math.sin(f * 0.9) * Math.exp(-(f - HIT) / 40) + 6 * Math.sin(f * 2.3);
  const cardRot = f < HIT ? lin(f, 0, HIT, 7, 2) : released ? 0 : 1.6 * Math.sin(f * 0.9);
  const cardTop = FLOOR - CARD0.h * (1 - 0.4 * cardSquash);

  // EFECTOS: cae, aplasta, se tensa y sale arrancado
  const efLift = f < HIT ? 230 * (1 - (f / HIT) ** 2) : 0;
  const pullP = lin(f, tTense, tTense + 10);
  const yk = released ? yank(f - tYank, 10) : 0;
  const efX = 540 + escape * 0.4 + yk * 1300;
  const efY = cardTop - yk * 40;
  const efSquash = f >= HIT ? 0.55 * impact(f - HIT) + 0.06 : 0;
  // Gancho: entra flojo, engancha la esquina superior derecha, se tensa y tira
  const hookIn = fall(f - tHook, fps);
  const corner = { x: efX + efWidth / 2 - 30, y: efY - EF.size * 0.78 };
  const anchor = { x: 1330, y: 360 };
  const hb = { x: interpolate(hookIn, [0, 1], [anchor.x + 40, corner.x]), y: interpolate(hookIn, [0, 1], [anchor.y + 200, corner.y]) };

  // ---------- 5–11 s: el clip real se transforma ----------
  const flipStart = W(11) - 14;
  const flip = lin(f, flipStart, flipStart + 12);
  const grow = interpolate(flip, [0, 1], [0, 1]);
  const card = { w: 640 + 80 * grow, h: 900 + 120 * grow, bottom: FLOOR + 10 * grow };
  const tShow = W(12);
  const showP = lin(f, tShow, tShow + 9, 0, 1, (x) => 1 - (1 - x) ** 3);
  const focus = { x: 0.5, y: 0.37, s: 1 + 1.0 * showP };
  const tHide = W(14);
  const push = lin(f, tHide - 8, tHide + 2, 0, 1, (x) => 1 - (1 - x) ** 2);
  const tCut = W(16);
  const cutLine = lin(f, tCut, tCut + 5);
  const split = lin(f, tCut + 5, tCut + 22, 0, 1, (x) => x * x);
  const cardLeft = 540 - card.w / 2;
  const cardTopS3 = card.bottom - card.h;
  const panel = { x0: interpolate(push, [0, 1], [-560, cardLeft + 210]), y0: cardTopS3 + 150, w: 420, h: 330 };

  // ---------- 11–16 s: resultado ----------
  const tRes = W(17);
  const resP = lin(f, tRes - 4, tRes + 14, 0, 1, (x) => 1 - (1 - x) ** 3);
  const res = { w: interpolate(resP, [0, 1], [700, 560]), h: interpolate(resP, [0, 1], [1000, 996]), bottom: interpolate(resP, [0, 1], [FLOOR + 10, 1372]) };

  // ---------- 16–20,6 s: HOOKHOUSE + CTA ----------
  const tEnd = W(27);
  const tip = lin(f, tEnd - 6, tEnd + 10, 0, 1, (x) => x * x); // la tarjeta del resultado se tumba y se vuelve plataforma
  const tHookW = W(27) + 4;
  const tHouseW = W(31);
  const tCta = W(32);
  const tHookBox = W(33);
  const loopUp = lin(f, LOOP, LOOP + 10, 0, 1, (x) => x * x * x);
  const loopIn = lin(f, LOOP + 4, MANIFIESTO_FRAMES);

  const scene = f < flipStart ? 1 : f < tRes - 4 ? 3 : f < tEnd - 6 ? 4 : 5;

  return (
    <Paper>
      {/* ===== Plano 1–2 ===== */}
      {scene === 1 ? (
        <>
          <ClipCard x={540 + escape} y={FLOOR} w={CARD0.w} h={CARD0.h} squash={cardSquash} rotate={cardRot}>
            <Clip src="portfolio/gorila_hook.mp4" />
          </ClipCard>
          {yk < 1 ? <Slab text={EF.text} x={efX} y={efY} size={EF.size} squash={efSquash} pull={released ? -0.4 : -0.5 * pullP} rotate={yk * 28} lift={efLift} shadow={!released} /> : null}
          {f >= tHook && yk < 1 ? (
            <Rope ax={anchor.x} ay={anchor.y} bx={released || f >= tHook + 8 ? corner.x : hb.x} by={released || f >= tHook + 8 ? corner.y : hb.y} slack={interpolate(f, [tHook, tTense, tTense + 8], [0.9, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} buzz={f >= tTense + 6 && !released ? 1 : 0} t={t} />
          ) : null}
          <Headline y={226} size={84} f={f} out={tHook - 8} words={[0, 1, 2, 3, 4].map((i) => ({ text: caps[i].text, at: W(i) }))} />
          <Headline y={226} size={84} f={f} words={[6, 7, 8, 9, 10].map((i) => ({ text: caps[i].text.replace(".", ""), at: W(i), key: i === 10 }))} />
        </>
      ) : null}

      {/* ===== Plano 3: qué mostrar / ocultar / cortar ===== */}
      {scene === 3 ? (
        <>
          {/* Lo que aparece detrás del corte */}
          {f >= tCut ? (
            <ClipCard x={540} y={card.bottom} w={card.w} h={card.h} shadow>
              <Clip src="portfolio/puerta_hook.mp4" at={tCut} from={Math.round(2.55 * FPS)} scale={1.6} oy={0.33} />
            </ClipCard>
          ) : null}
          {/* La tarjeta que se gira y luego se corta en dos */}
          {[0, 1].map((half) => {
            if (f < tCut && half === 1) return null;
            const clip = f < tCut + 5 ? undefined : half === 0 ? "polygon(-10% -10%, 110% -10%, 110% 38%, -10% 62%)" : "polygon(-10% 62%, 110% 38%, 110% 110%, -10% 110%)";
            const sgn = half === 0 ? -1 : 1;
            const dx = sgn * split * 380;
            const dy = sgn * split * 260 + split * split * 500;
            const rot = sgn * split * 9;
            const tilt = flip < 0.5 ? 180 * flip : 180 * flip - 180;
            return (
              <AbsoluteFill key={half} style={{ clipPath: clip, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, transformOrigin: "540px 900px", opacity: 1 - lin(f, tCut + 16, tCut + 24) }}>
                <ClipCard x={540} y={card.bottom} w={card.w} h={card.h} tilt={tilt} shadow={half === 1 || f < tCut + 5} focus={focus} src={flip >= 0.5 ? "portfolio/puerta_0.6.jpg" : undefined}>
                  {flip < 0.5 ? <Clip src="portfolio/gorila_hook.mp4" /> : null}
                </ClipCard>
                {/* Tapa de "qué ocultar" (viaja con su mitad) */}
                {f >= tHide - 10 ? (
                  <div style={{ position: "absolute", left: panel.x0, top: panel.y0, width: panel.w, height: panel.h, background: A.ink, borderRadius: 22, boxShadow: "0 24px 40px rgba(14,13,11,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 210, color: A.orange, lineHeight: 1 }}>?</span>
                  </div>
                ) : null}
              </AbsoluteFill>
            );
          })}
          <FrameMarks x={540} y={cardTopS3 + card.h / 2} w={card.w - 60} h={card.h - 60} p={f < tCut ? showP : 0} />
          {/* OCULTAR empuja la tapa */}
          {f >= tHide - 10 && f < tHide + 30 ? (
            <Slab text="OCULTAR" x={panel.x0 - 200 - lin(f, tHide + 16, tHide + 30, 0, 500, (x) => x * x)} y={panel.y0 + panel.h - 30} size={90} pull={0.35 * (1 - lin(f, tHide, tHide + 6))} shadow={false} opacity={1 - lin(f, tHide + 22, tHide + 30)} />
          ) : null}
          {/* Trazo naranja del corte */}
          {cutLine > 0 && cutLine < 1 ? (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <line x1={540 - card.w / 2 - 60} y1={cardTopS3 + card.h * 0.62} x2={540 - card.w / 2 - 60 + (card.w + 120) * cutLine} y2={cardTopS3 + card.h * 0.62 - card.h * 0.24 * cutLine} stroke={A.orange} strokeWidth={12} strokeLinecap="round" />
            </svg>
          ) : null}
          <Headline y={250} f={f} out={W(13) - 6} words={[{ text: "Qué", at: W(11) }, { text: "mostrar", at: W(12), key: true }]} />
          <Headline y={250} f={f} out={W(15) - 6} words={[{ text: "Qué", at: W(13) }, { text: "ocultar", at: W(14), key: true }]} />
          <Headline y={250} f={f} words={[{ text: "Cuándo", at: W(15) }, { text: "cortar", at: W(16), key: true }]} />
        </>
      ) : null}

      {/* ===== Plano 4: el resultado, con tiempo ===== */}
      {scene === 4 ? (
        <>
          <ClipCard x={540} y={res.bottom} w={res.w} h={res.h}>
            <Clip src="portfolio/puerta_hook.mp4" at={tCut} from={Math.round(2.55 * FPS)} scale={interpolate(resP, [0, 1], [1.6, 1.0])} oy={0.33} />
          </ClipCard>
          <Headline
            y={232}
            size={74}
            f={f}
            words={[
              { text: "Tu", at: W(20) },
              { text: "contenido,", at: W(21) },
              { text: "en", at: W(22) },
              { text: "algo", at: W(23) },
              { text: "que", at: W(24) },
              { text: "merece", at: W(25) },
              { text: "verse", at: W(26), key: true },
            ]}
          />
          <Tag x={540} y={1398} text="REEL DE HOOKHOUSE · PROYECTO PROPIO" align="center" opacity={lin(f, tRes + 10, tRes + 20)} />
        </>
      ) : null}

      {/* ===== Plano 5: HOOKHOUSE + CTA + vuelta al inicio ===== */}
      {scene === 5 ? (
        <>
          <AbsoluteFill style={{ transform: `translateY(${-loopUp * 1900}px)` }}>
            {/* La tarjeta del resultado se tumba hacia atrás y se vuelve la plataforma */}
            <div style={{ position: "absolute", inset: 0, perspective: 1400, perspectiveOrigin: "50% 60%" }}>
              <div style={{ position: "absolute", left: 540 - 280, top: 1372 - 996, width: 560, height: 996, transformOrigin: "50% 100%", transform: `translateY(${-128 * tip}px) rotateX(${84 * tip}deg)`, borderRadius: 30, overflow: "hidden", background: A.ink, outline: `6px solid ${A.ink}` }}>
                <Clip src="portfolio/puerta_hook.mp4" at={tCut} from={Math.round(2.55 * FPS)} scale={1} oy={0.33} />
              </div>
            </div>
            <Wordmark f={f} fps={fps} tHook={tHookW} tHouse={tHouseW} baseline={1140} />
            <Headline y={300} f={f} words={[27, 28, 29, 30, 31].map((i) => ({ text: caps[i].text, at: W(i) }))} />
            {/* CTA */}
            <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: 560, display: "flex", alignItems: "center", gap: 26, fontFamily: FONT, fontWeight: 800, fontSize: 96, letterSpacing: "-0.045em", color: A.ink }}>
              <span style={{ opacity: lin(f, tCta, tCta + 6), transform: `translateY(${(1 - lin(f, tCta, tCta + 6)) * 14}px)` }}>Escribinos</span>
              <span
                style={{
                  background: A.orange,
                  color: A.ivory,
                  padding: "4px 26px 10px",
                  borderRadius: 18,
                  transformOrigin: "50% 100%",
                  transform: `scale(${1 + 0.25 * impact(f - tHookBox)}, ${f < tHookBox ? 0 : 1 - 0.3 * impact(f - tHookBox)})`,
                  boxShadow: "0 18px 30px rgba(14,13,11,0.25)",
                }}
              >
                HOOK
              </span>
            </div>
            {f >= tHookBox + 6 ? (
              <Rope ax={1260} ay={-150} bx={862} by={566 - 30 * lin(f, LOOP - 12, LOOP)} slack={interpolate(f, [tHookBox + 6, tHookBox + 16, LOOP - 12], [0.9, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} buzz={f >= LOOP - 10 && f < LOOP ? 1 : 0} t={t} />
            ) : null}
          </AbsoluteFill>
          {/* Vuelta al plano inicial: el clip entra por abajo y EFECTOS ya viene cayendo */}
          {f >= LOOP + 4 ? (
            <>
              <ClipCard x={540 + interpolate(loopIn, [0, 1], [0, 90])} y={interpolate(loopIn, [0, 1], [FLOOR + 900, FLOOR], { easing: (x) => 1 - (1 - x) ** 3 })} w={CARD0.w} h={CARD0.h} rotate={interpolate(loopIn, [0, 1], [0, 7])}>
                <Clip src="portfolio/gorila_hook.mp4" at={LOOP + 4} />
              </ClipCard>
              <Slab text={EF.text} x={540} y={FLOOR - CARD0.h} size={EF.size} lift={interpolate(loopIn, [0, 1], [1200, 330])} />
            </>
          ) : null}
        </>
      ) : null}

      {/* ===== Sonido ===== */}
      {PHRASES.map((p, k) => (
        <Sequence key={k} name={`Voz ${k + 1}`} from={Math.round(p.at * FPS)} durationInFrames={Math.round(((p.src[1] - p.src[0]) / 1000) * FPS) + 2}>
          <Audio src={staticFile("audio/voz_manifiesto.wav")} trimBefore={Math.round((p.src[0] / 1000) * FPS)} trimAfter={Math.round((p.src[1] / 1000) * FPS)} />
        </Sequence>
      ))}
      <Snd at={HIT - 1} src={SOUND.impacto} vol={0.9} />
      <Snd at={tTense - 3} src={SOUND.tension} vol={0.8} />
      <Snd at={tYank} src={SOUND.tiron} vol={0.7} />
      <Snd at={tShow} src={SOUND.impacto} vol={0.35} />
      <Snd at={tHide + 1} src={SOUND.impacto} vol={0.7} />
      <Snd at={tCut} src={SOUND.tiron} vol={0.55} />
      <Snd at={tHookW + 7} src={SOUND.impacto} vol={0.8} />
      <Snd at={tHouseW + 7} src={SOUND.impacto} vol={0.8} />
      <Snd at={tHookBox} src={SOUND.impacto} vol={0.5} />
      <Snd at={LOOP - 14} src={SOUND.tension} vol={0.6} />
      <Snd at={LOOP} src={SOUND.tiron} vol={0.7} />
    </Paper>
  );
};

const Snd: React.FC<{ at: number; src: string; vol: number }> = ({ at, src, vol }) => (
  <Sequence name={src} from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

// HOOKHOUSE con peso: HOOK cae primero, HOUSE después; cada mitad aplasta al aterrizar
const Wordmark: React.FC<{ f: number; fps: number; tHook: number; tHouse: number; baseline: number }> = ({ f, fps, tHook, tHouse, baseline }) => {
  const size = 168;
  const half = (t0: number) => {
    const p = fall(f - t0, fps);
    const land = t0 + 7;
    return { lift: f < t0 ? 2000 : (1 - p) * 900, sq: 0.5 * impact(f - land), on: f >= t0 };
  };
  const a = half(tHook);
  const b = half(tHouse);
  const part = (text: string, s: { lift: number; sq: number; on: boolean }) => (
    <span style={{ display: "inline-block", opacity: s.on ? 1 : 0, transformOrigin: "50% 100%", transform: `translateY(${-s.lift}px) scale(${1 + 0.16 * s.sq}, ${1 - 0.3 * s.sq})` }}>{text}</span>
  );
  return (
    <>
      <ContactShadow x={540 - 190} y={baseline} w={330} h={a.lift} opacity={a.on ? 1 : 0} />
      <ContactShadow x={540 + 210} y={baseline} w={420} h={b.lift} opacity={b.on ? 1 : 0} />
      <div style={{ position: "absolute", left: 0, right: 0, top: baseline - size * 0.86, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.055em", color: A.ink, whiteSpace: "pre" }}>
        {part("HOOK", a)}
        {part("HOUSE", b)}
      </div>
    </>
  );
};
