import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-cristal.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { BigStat } from "../props2";
import { Cta, FLOOR, ScreenRope, Snd, Stage, Thumb, TopCaptions, ctaRope, fmt1, timing, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, fall, impact, lin } from "../system";

// "Cristal" — Hookie rompe tu vídeo desde dentro · ~20 s (formula-viral + metricas.md, 2026-10-24).
// Frame 0: un vídeo aburrido ("hoy les voy a hablar de…") en el feed; a los 0,15 s se agrieta desde dentro y a los
// 0,67 s estalla en pedazos que vuelan hacia la cámara: Hookie sale de un puñetazo. Pregunta: "¿Por qué acabo de
// romper tu vídeo?". Respuesta al final con prueba en el propio vídeo ("¿Ves? Sigues aquí" + segundos reales).

const caps = captionsJson as Caption[];
const T = timing(caps);
export const CRISTAL_FRAMES = T.frames;
const CRACK1 = 4;
const CRACK2 = 12;
const SHATTER = 20;
const C = { x: 560, y: 860 }; // punto de impacto (pantalla)

// Pedazos: abanico de polígonos desde el punto de impacto hasta los bordes
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const edge = (a: number) => {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const tx = dx > 0 ? (1080 - C.x) / dx : dx < 0 ? -C.x / dx : Infinity;
  const ty = dy > 0 ? (1920 - C.y) / dy : dy < 0 ? -C.y / dy : Infinity;
  const tt = Math.min(tx, ty) * 1.05;
  return { x: C.x + dx * tt, y: C.y + dy * tt };
};
const N = 13;
const ANG = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2 + (rand(i) - 0.5) * 0.35);
const SHARDS = ANG.map((a, i) => {
  const b = ANG[(i + 1) % N] + (i === N - 1 ? Math.PI * 2 : 0);
  const mid = (a + b) / 2;
  const pts = [C, edge(a), edge(mid), edge(b)];
  const inner = { x: C.x + Math.cos(mid) * 60 * rand(i + 40), y: C.y + Math.sin(mid) * 60 * rand(i + 40) };
  return { pts: [inner, ...pts.slice(1)], dir: mid, spin: (rand(i + 9) - 0.5) * 80, speed: 0.7 + rand(i + 20) * 0.6 };
});

// El vídeo aburrido (lo que hay detrás del cristal)
const BoringVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #9C9A96 0%, #7E7C78 100%)" }}>
    <div style={{ position: "absolute", left: 340, top: 520, width: 400, height: 400, borderRadius: "50%", background: "#6B6965" }} />
    <div style={{ position: "absolute", left: 220, top: 900, width: 640, height: 900, borderRadius: "320px 320px 0 0", background: "#6B6965" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1150, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 58, color: "#FFFFFF", textShadow: "0 3px 10px rgba(0,0,0,0.5)" }}>hoy les voy a hablar de…</div>
    {[0, 1, 2, 3].map((k) => (
      <div key={k} style={{ position: "absolute", right: 36, top: 1000 + k * 150, width: 86, height: 86, borderRadius: 43, background: "rgba(255,255,255,0.85)" }} />
    ))}
    <div style={{ position: "absolute", left: 40, top: 1560, fontFamily: FONT, fontWeight: 700, fontSize: 38, color: "#FFFFFF" }}>@tu_cuenta</div>
    <div style={{ position: "absolute", left: 40, top: 1612, width: 520, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.6)" }} />
  </AbsoluteFill>
);

const Cracks: React.FC<{ p: number }> = ({ p }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {SHARDS.map((s, i) => {
      const e = s.pts[1];
      const len = Math.min(1, p * (0.6 + rand(i) * 0.6));
      return <line key={i} x1={C.x} y1={C.y} x2={C.x + (e.x - C.x) * len} y2={C.y + (e.y - C.y) * len} stroke="#FFFFFF" strokeWidth={5} opacity={0.9} />;
    })}
    <circle cx={C.x} cy={C.y} r={40 * Math.min(1, p * 2)} fill="none" stroke="#FFFFFF" strokeWidth={6} />
  </svg>
);

export const Cristal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;

  const iPor = 0;
  const iHoy = idx("«hoy");
  const iDe = idx("de»", iHoy);
  const iScroll = idx("scroll");
  const iTu = idx("tu", iScroll);
  const iRomper2 = idx("romper", iTu);
  const iNo = idx("no", iRomper2);
  const iPregunta = idx("pregunta");
  const iGolpe = idx("golpe");
  const iRaro = idx("raro");
  const iVes = idx("ves");
  const iEscr = idx("escríbenos");
  const iHook = idx("hook", iEscr);
  const iPres = idx("presupuesto");

  // ---------- Hookie ----------
  const out = lin(f, SHATTER - 4, SHATTER + 10, 0, 1, (x) => 1 - (1 - x) ** 3); // sale del cristal hacia el papel
  let g: GanchoPose = { x: 540, y: FLOOR, scale: 1.7 - 0.9 * out, t, talk: T.talkAt(f), expr: "strain", armR: 90, armL: 40, lean: -10 * (1 - out) };
  let rope: RopeSpec = null;
  if (f >= SHATTER + 10 && f < W(iHoy)) g = { ...g, scale: 0.8, expr: "smug", armR: 70 + 45 * Math.sin(f * 0.9), armL: 70 + 45 * Math.cos(f * 0.9), bendR: 0.5, bendL: 0.5, lean: 3 * Math.sin(f * 0.5), squash: 0.35 * impact(f - SHATTER - 10) };
  else if (f >= W(iHoy) && f < W(iTu)) g = { ...g, x: 800, scale: 0.6, expr: f < W(iScroll) - 6 ? "normal" : "surprised", blink: f < W(iScroll) - 6 ? 0.6 : 0, look: { x: -1, y: -0.3 } };
  else if (f >= W(iTu) && f < W(iNo)) g = { ...g, x: 760, scale: 0.65, expr: "focused", armR: f >= W(iRomper2) ? 170 : 100, squash: 0.4 * impact(f - W(iRomper2) - 4), look: { x: -1, y: 0 } };
  else if (f >= W(iNo) && f < W(iVes)) {
    const raro = f >= W(iRaro);
    g = { ...g, x: 540, scale: raro ? 1.45 : 0.75, expr: raro ? "love" : f >= W(iGolpe) ? "strain" : "smug", armR: f >= W(iGolpe) && !raro ? 90 : 30, armL: 30, lean: raro ? 18 * Math.sin(t * 9) : 0, squash: 0.3 * impact(f - W(iGolpe) - 3) };
  } else if (f >= W(iVes) && f < W(iEscr)) g = { ...g, x: 780, scale: 0.65, expr: "smug", armR: 95, look: { x: -1, y: 0 } };
  else if (f >= W(iEscr)) {
    g = { ...g, x: 760, scale: 0.6, expr: f >= W(iPres) ? "happy" : "focused", armL: 30, armR: 40, lean: 0 };
    if (f >= W(iHook) + 4) {
      g = { ...g, hookOut: true, lean: 6 };
      rope = ctaRope(f, W(iHook), 760);
    }
  }
  const showStage = f >= SHATTER - 2;
  const bump = impact(f - SHATTER) + 0.6 * impact(f - W(iRomper2) - 4) + 0.8 * impact(f - W(iGolpe) - 3);
  const oneP = fall(f - W(iTu) + 2, fps);
  const broken = lin(f, W(iRomper2) + 4, W(iRomper2) + 14);

  return (
    <Paper>
      {showStage ? (
        <AbsoluteFill style={{ transform: `translate(${Math.sin(f * 2.3) * 14 * bump}px, ${Math.cos(f * 1.9) * 10 * bump}px)` }}>
          <Stage bump={bump * 0.4}>
            {/* "hoy les voy a hablar de…": el trozo de cristal con el comienzo aburrido */}
            {f >= W(iHoy) - 4 && f < W(iTu) ? (
              <div style={{ position: "absolute", left: 120, top: FLOOR - 480 - (1 - fall(f - W(iHoy) + 4, fps)) * 900 - lin(f, W(iScroll) - 4, W(iScroll) + 8, 0, 1, (x) => x * x) * 1600, width: 520, height: 420, transform: "rotate(-6deg)", clipPath: "polygon(4% 8%, 96% 0%, 100% 70%, 62% 100%, 0% 88%)", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #9C9A96 0%, #7E7C78 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, top: 170, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 46, color: "#FFFFFF", textShadow: "0 3px 10px rgba(0,0,0,0.5)" }}>hoy les voy a hablar de…</div>
              </div>
            ) : null}
            {/* el primer segundo: un bloque que se rompe */}
            {f >= W(iTu) - 2 && f < W(iNo) ? (
              <>
                {[0, 1].map((h) => (
                  <div key={h} style={{ position: "absolute", left: 230 + h * 170 + (h ? 1 : -1) * broken * 120, top: FLOOR - 330 - (1 - oneP) * 900 + broken * broken * 260, width: 170, height: 330, overflow: "hidden", transform: `rotate(${(h ? 1 : -1) * broken * 24}deg)`, opacity: 1 - broken * 0.5 }}>
                    <div style={{ position: "absolute", left: -h * 170, top: 0, width: 340, height: 330 }}>
                      <BigStat x={170} y={330} value="1 s" fill={1} shadow={false} />
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {/* cristales por el suelo */}
            {f >= SHATTER + 8 && f < W(iTu)
              ? [0, 1, 2, 3, 4, 5].map((k) => {
                  const x = 140 + k * 150 + rand(k + 70) * 60;
                  const land = fall(f - SHATTER - 8 - k * 2, fps);
                  return (
                    <svg key={k} width={120} height={70} style={{ position: "absolute", left: x - 60, top: FLOOR - 60 - (1 - land) * 500, overflow: "visible", transform: `rotate(${(rand(k + 3) - 0.5) * 40}deg)` }}>
                      <polygon points={`0,60 ${40 + rand(k) * 50},${10 + rand(k + 1) * 20} 120,60`} fill="#B9B6B0" stroke="#FFFFFF" strokeWidth={4} opacity={0.9} />
                    </svg>
                  );
                })
              : null}
            <Gancho {...g} />
          </Stage>
        </AbsoluteFill>
      ) : null}

      {/* el vídeo aburrido y su cristal */}
      {f < SHATTER ? (
        <AbsoluteFill style={{ transform: `scale(${1 + 0.02 * impact(f - CRACK1) + 0.03 * impact(f - CRACK2)})` }}>
          <BoringVideo />
          {f >= CRACK1 ? <Cracks p={f < CRACK2 ? 0.35 : 0.35 + lin(f, CRACK2, SHATTER) * 0.65} /> : null}
          {/* el puño de Hookie empuja desde dentro */}
          {f >= CRACK1 - 2 ? <div style={{ position: "absolute", left: C.x - 70, top: C.y - 70, width: 140, height: 140, borderRadius: 70, background: A.ink, opacity: 0.25 + 0.2 * Math.sin(f) }} /> : null}
        </AbsoluteFill>
      ) : f < SHATTER + 22 ? (
        <AbsoluteFill>
          {SHARDS.map((s, i) => {
            const k = (f - SHATTER) / 22;
            const d = 900 * k * s.speed;
            const dx = Math.cos(s.dir) * d;
            const dy = Math.sin(s.dir) * d + 600 * k * k;
            return (
              <AbsoluteFill key={i} style={{ clipPath: `polygon(${s.pts.map((p) => `${p.x}px ${p.y}px`).join(",")})`, transformOrigin: `${C.x}px ${C.y}px`, transform: `translate(${dx}px, ${dy}px) rotate(${s.spin * k}deg) scale(${1 + 0.5 * k})`, opacity: 1 - k * 0.6 }}>
                <BoringVideo />
              </AbsoluteFill>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* pregunta, golpe, algo raro */}
      {f >= W(iPregunta) && f < W(iGolpe) ? <div style={{ position: "absolute", left: 300, top: 480 - (1 - fall(f - W(iPregunta), fps)) * 600, fontFamily: FONT, fontWeight: 800, fontSize: 300, color: A.orange, transform: "rotate(-8deg)" }}>?</div> : null}
      {/* ¿ves? sigues aquí: los segundos reales que llevas */}
      {f >= W(iVes) - 2 && f < W(iEscr) ? (
        <AbsoluteFill>
          <Stage>
            <BigStat x={380} y={FLOOR} scale={1.05} value={fmt1(t)} label="SEGUNDOS AQUÍ" fill={Math.min(1, t / 20)} lift={(1 - fall(f - W(iVes) + 2, fps)) * 900} squash={0.4 * impact(f - W(iVes) - 4)} />
          </Stage>
        </AbsoluteFill>
      ) : null}
      {/* scroll: el pulgar se lleva el comienzo aburrido */}
      {f >= W(iScroll) - 8 && f < W(iTu) ? <Thumb x={260} y={1240 - lin(f, W(iScroll) - 8, W(iScroll) + 4) * 300} rot={-18} /> : null}

      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iPres)} until={CRISTAL_FRAMES + 10} verb="Escríbenos" lines={["TE PASAMOS", "PRESUPUESTO"]} />
      <TopCaptions words={T.words} f={f} fps={fps} keys={[idx("romper"), idx("scroll"), iRomper2, iRaro, idx("aquí")]} hide={f < W(iPor) - 1 || (f >= W(iHoy) && f < W(iDe) + 12) || f >= W(iEscr)} />

      <Audio src={staticFile("audio/voz_cristal.wav")} />
      <Snd at={CRACK1} src={SOUND.impacto} vol={0.9} />
      <Snd at={CRACK2} src={SOUND.impacto} vol={1} />
      <Snd at={SHATTER - 1} src="sfx/cristal.wav" vol={0.9} />
      <Snd at={W(iHoy)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iScroll) - 4} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(iTu)} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iRomper2) + 4} src="sfx/cristal.wav" vol={0.6} />
      <Snd at={W(iPregunta)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iGolpe) + 3} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(iVes)} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iPres) + 1} src={SOUND.impacto} vol={0.7} />
    </Paper>
  );
};

