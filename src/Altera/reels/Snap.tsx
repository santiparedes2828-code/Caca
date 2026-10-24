import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-snap.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { PhoneFeed } from "../props";
import { FilmStrip } from "../props2";
import { Cta, FLOOR, M, ScreenRope, Snd, Stage, Thumb, TopCaptions, ctaRope, timing, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, fall, impact, lin } from "../system";

// "Snap" — Hookie · ~15 s (formula-viral + metricas.md, 2026-10-24).
// Frame 0: texto estilo Snapchat ("qué hace este tío") sobre Hookie DE ESPALDAS haciendo algo raro; se gira y se ve
// (sorbe una tira de película como si fueran espaguetis, temblando, de noche). Se congela, nota la cámara, se acerca y
// habla. Cada cosa que nombra aparece cuando la nombra. CTA: "Escríbenos HOOK al DM y te pasamos presupuesto".

const caps = captionsJson as Caption[];
const T = timing(caps);
export const SNAP_FRAMES = T.frames;
const TURN = 26; // de espaldas hasta aquí; se gira en 6 frames y se ve lo que hace
const FREEZE = 50; // se congela: ha visto la cámara
const WALK = 60; // empieza a acercarse

const camAt = (s: number, x: number, y: number) => {
  const p = M(x, y);
  return { s, ox: p.x, oy: p.y };
};

// Barra de texto de Snapchat
const SnapBar: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 700, padding: "18px 40px", background: "rgba(0,0,0,0.55)", textAlign: "center", opacity }}>
    <span style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500, fontSize: 50, color: "#FFFFFF", letterSpacing: "-0.01em" }}>{text}</span>
  </div>
);

// Tarjetas-icono (sin texto: el subtítulo ya dice la palabra)
const IconCard: React.FC<{ x: number; y: number; p: number; kind: "hook" | "subs" | "beat"; t: number }> = ({ x, y, p, kind, t }) => (
  <div style={{ position: "absolute", left: x - 110, top: y - 110 - (1 - p) * 80, width: 220, height: 220, borderRadius: 34, background: "#FBF8F2", border: `8px solid ${A.ink}`, boxShadow: "0 24px 36px rgba(14,13,11,0.3)", opacity: Math.min(1, p * 2), transform: `scale(${0.8 + 0.2 * p}) rotate(${(1 - p) * -8}deg)` }}>
    <svg width={204} height={204} viewBox="0 0 204 204">
      {kind === "hook" ? <path d="M102 30 V120 C102 168 46 168 46 120 V104" stroke={A.orange} strokeWidth={18} fill="none" strokeLinecap="round" /> : null}
      {kind === "subs" ? (
        <>
          <rect x={30} y={70} width={144} height={22} rx={11} fill={A.ink} />
          <rect x={52} y={110} width={100} height={22} rx={11} fill={A.orange} />
        </>
      ) : null}
      {kind === "beat"
        ? [0, 1, 2, 3, 4].map((k) => {
            const h = 30 + 70 * Math.abs(Math.sin(t * 9 + k * 1.3));
            return <rect key={k} x={34 + k * 30} y={102 - h / 2} width={18} height={h} rx={9} fill={k === 2 ? A.orange : A.ink} />;
          })
        : null}
    </svg>
  </div>
);

export const Snap: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;

  const iUltima = idx("última");
  const iPara = idx("para");
  const iNota = idx("nota");
  const iVideo = idx("video");
  const iManda = idx("mándanos");
  const iBruto = idx("bruto");
  const iEditamos = idx("editamos");
  const iGancho = idx("gancho");
  const iSubs = idx("subtítulos");
  const iRitmo = idx("ritmo");
  const iEscr = idx("escríbenos");
  const iHook = idx("hook", iEscr);
  const iPres = idx("presupuesto");

  // ---------- Hookie ----------
  const night = 1 - lin(f, WALK, WALK + 16);
  const approach = lin(f, WALK, WALK + 22, 0, 1, (x) => 1 - (1 - x) ** 3);
  let g: GanchoPose = { x: 540, y: FLOOR, scale: 0.78 + 0.22 * approach, t, talk: T.talkAt(f), expr: "strain" };
  let rope: RopeSpec = null;
  let cam = camAt(1 + 0.25 * approach, 540, FLOOR - 250);
  if (f < FREEZE) {
    // sorbe la tira de película, temblando
    const tw = lin(f, TURN, TURN + 3) - lin(f, TURN + 3, TURN + 6);
    g = { ...g, back: f < TURN + 3, turn: tw, lean: 7 * Math.sin(f * 2.1), squash: 0.08 * Math.sin(f * 1.7), armL: 120 + 15 * Math.sin(f * 1.3), armR: 110 + 15 * Math.cos(f * 1.1), blink: 0 };
  } else if (f < WALK) {
    g = { ...g, expr: "surprised", look: { x: 0, y: 0 }, armL: 120, armR: 110 };
  } else if (f < W(iPara)) {
    g = { ...g, expr: "surprised", walk: f < WALK + 22 ? t * 20 : undefined, look: { x: 0, y: 0 }, armL: 40, armR: 40 };
  } else if (f < W(iManda)) {
    const stop = f < W(iNota);
    g = { ...g, x: f < W(iNota) ? 540 : 760, scale: f < W(iNota) ? 0.95 : 0.6, expr: stop ? "focused" : "smug", armR: stop ? 170 : 100, bendR: stop ? 0.3 : 0, squash: 0.25 * impact(f - W(iPara)), look: stop ? { x: 0, y: 0 } : { x: -1, y: 0 } };
    cam = stop ? camAt(1.35, 540, FLOOR - 300) : camAt(1, 540, FLOOR - 250);
  } else if (f < W(iGancho)) {
    const cutting = f >= W(iEditamos) - 2;
    g = { ...g, x: 780, scale: 0.6, expr: cutting ? "focused" : "normal", item: cutting ? "scissors" : "none", armR: cutting ? 80 : 100, look: { x: -1, y: 0.2 } };
    cam = camAt(1, 540, FLOOR - 250);
  } else if (f < W(iEscr)) {
    g = { ...g, x: 540, scale: 0.6, expr: "happy", armL: 150, armR: 150, hookOut: f < W(iSubs) };
    cam = camAt(1, 540, FLOOR - 250);
    if (f < W(iSubs)) rope = { bx: 300, by: 330, slack: lin(f, W(iGancho), W(iGancho) + 8, 0.8, 0.1), buzz: 0 };
  } else {
    g = { ...g, x: 760, scale: 0.6, expr: f >= W(iPres) ? "happy" : "focused", armL: 30, armR: 40 };
    cam = camAt(1, 540, FLOOR - 250);
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, W(iHook), 760);
    }
  }

  // Tira de película que sorbe (sale de la boca y cuelga hasta el suelo)
  const mouth = M(540, FLOOR - 225 * g.scale!);
  const pile = M(800, FLOOR - 10);
  const slurp = f < WALK ? (f * 14) % 60 : 0;

  const strand = f < W(iPara) ? (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - lin(f, WALK + 10, WALK + 18) }}>
            <path d={`M${pile.x} ${pile.y} C ${pile.x + 40} ${pile.y - 300}, ${mouth.x + 260} ${mouth.y - 120}, ${mouth.x} ${mouth.y}`} stroke={A.ink} strokeWidth={46} fill="none" strokeLinecap="round" />
            <path d={`M${pile.x} ${pile.y} C ${pile.x + 40} ${pile.y - 300}, ${mouth.x + 260} ${mouth.y - 120}, ${mouth.x} ${mouth.y}`} stroke="#D9D3C7" strokeWidth={22} fill="none" strokeDasharray="26 34" strokeDashoffset={-slurp} />
          </svg>
  ) : null;

  return (
    <Paper tone={f < WALK + 16 ? A.ivoryDeep : A.ivory}>
      <AbsoluteFill style={{ transformOrigin: `${cam.ox}px ${cam.oy}px`, transform: `scale(${cam.s})` }}>
        {f < TURN + 3 ? strand : null}
        <Stage>
          {f < WALK + 18 ? (
            <>
              <FilmStrip x={800} y={FLOOR} scale={0.55} n={4} t={t} rotate={-12} />
              <FilmStrip x={830} y={FLOOR - 30} scale={0.5} n={4} t={t} rotate={18} />
            </>
          ) : null}
          {f >= W(iManda) - 4 && f < W(iGancho) ? <FilmStrip x={360} y={FLOOR - 40} scale={1.0} n={5} t={t} cut={lin(f, W(iEditamos) + 4, W(iEditamos) + 18)} lift={(1 - fall(f - W(iManda) + 4, fps)) * 900} /> : null}
          {f >= W(iNota) - 3 && f < W(iManda) ? <PhoneFeed x={330} y={FLOOR} scale={1.15} scroll={f * 4} lift={(1 - fall(f - W(iNota) + 3, fps)) * 900} /> : null}
          <Gancho {...g} />
        </Stage>
        {f >= TURN + 3 ? strand : null}
      </AbsoluteFill>

      {/* noche: luz baja hasta que se acerca */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(14,13,11,0) 30%, rgba(14,13,11,0.55) 100%)", opacity: night }} />
      {/* sorpresa al verte */}
      {f >= FREEZE && f < WALK + 6 ? <div style={{ position: "absolute", left: 660, top: 900, fontFamily: FONT, fontWeight: 800, fontSize: 150, color: A.orange, transform: `scale(${0.6 + 0.4 * Math.min(1, (f - FREEZE) / 4)})` }}>!</div> : null}

      {/* "se nota": el pulgar pasa tu vídeo */}
      {f >= W(iVideo) && f < W(iManda) ? <Thumb x={300} y={1180 - lin(f, W(iVideo), W(iVideo) + 10) * 260} rot={-20 + lin(f, W(iVideo) + 6, W(iVideo) + 14) * 25} /> : null}
      {/* gancho, subtítulos y ritmo */}
      {f >= W(iGancho) && f < W(iEscr) ? (
        <>
          <IconCard x={260} y={520} p={fall(f - W(iGancho), fps)} kind="hook" t={t} />
          {f >= W(iSubs) ? <IconCard x={540} y={520} p={fall(f - W(iSubs), fps)} kind="subs" t={t} /> : null}
          {f >= W(iRitmo) ? <IconCard x={820} y={520} p={fall(f - W(iRitmo), fps)} kind="beat" t={t} /> : null}
        </>
      ) : null}

      <SnapBar text="qué hace este tío" opacity={1 - lin(f, WALK + 4, WALK + 12)} />
      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iPres)} until={SNAP_FRAMES + 10} verb="Escríbenos" lines={["TE PASAMOS", "PRESUPUESTO"]} />
      <TopCaptions words={T.words} f={f} fps={fps} keys={[iUltima, iPara, iBruto, iPres]} hide={f < W(0) - 2 || f >= W(iEscr)} />

      <Audio src={staticFile("audio/voz_snap.wav")} />
      {/* sorbido nervioso: golpecitos rápidos */}
      {[2, 9, 16, 23, 30].map((a) => (
        <Snd key={a} at={a} src="sfx/click.wav" vol={0.35} />
      ))}
      <Snd at={FREEZE} src="sfx/rebobinar.wav" vol={0.6} />
      <Snd at={WALK} src={SOUND.tension} vol={0.4} />
      <Snd at={W(iPara)} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iVideo)} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iManda)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iGancho)} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iSubs)} src={SOUND.impacto} vol={0.4} />
      <Snd at={W(iRitmo)} src={SOUND.impacto} vol={0.4} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iPres) + 1} src={SOUND.impacto} vol={0.7} />
    </Paper>
  );
};
