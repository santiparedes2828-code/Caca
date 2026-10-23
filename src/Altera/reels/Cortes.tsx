import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../../data/captions-cortes.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { PhoneFeed, Stopwatch } from "../props";
import { BigStat, FilmStrip } from "../props2";
import { Cta, FLOOR, M, ScreenRope, Snd, Stage, TopCaptions, ctaRope, timing, type RopeSpec } from "../reelkit";
import { A, FONT, Paper, SOUND, Tag, fall, impact, lin } from "../system";

// "¿Cuántos cortes tiene este vídeo?" — Gancho · 16,9 s (formula-viral + metricas.md, 2026-10-23).
// Reto en tiempo real (el formato que más retuvo: 73 % a los 3 s): el espectador cuenta los cortes mientras mira.
// El vídeo tiene EXACTAMENTE 16 cortes duros (17 planos; cada uno suena con un clic). La respuesta llega al final
// y el cierre invita a volver a contar (bucle). Dato honesto: la curva de retención media de los 4 últimos reels.

const caps = captionsJson as Caption[];
const T = timing(caps);
export const CORTES_FRAMES = T.frames;

// Retención media real de los 4 reels de Gancho del 22-10 (Sonido, Elefante, Tres, Segundos)
const CURVE: [number, number][] = [[0, 1], [1, 0.85], [2, 0.71], [3, 0.64], [4, 0.56], [5, 0.52], [6, 0.48], [7, 0.45], [8, 0.42], [9, 0.38], [10, 0.35], [12, 0.29], [15, 0.23]];

const Chart: React.FC<{ x: number; y: number; w: number; h: number; draw: number; band: number }> = ({ x, y, w, h, draw, band }) => {
  const px = (s: number) => 60 + (s / 15) * (w - 90);
  const py = (v: number) => 30 + (1 - v) * (h - 90);
  const d = CURVE.map(([s, v], i) => `${i ? "L" : "M"}${px(s)} ${py(v)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x - w / 2, top: y - h / 2, overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} rx={30} fill="#FBF8F2" stroke={A.ink} strokeWidth={8} />
      <rect x={px(3)} y={22} width={(px(10) - px(3)) * band} height={h - 74} fill={A.orange} opacity={0.16} />
      <path d={d} fill="none" stroke={A.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - draw)} />
      {band > 0.6 ? (
        <>
          <circle cx={px(3)} cy={py(0.64)} r={14} fill={A.orange} />
          <circle cx={px(10)} cy={py(0.35)} r={14} fill={A.orange} />
          <text x={px(3)} y={py(0.64) - 28} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={A.ink}>64 %</text>
          <text x={px(10)} y={py(0.35) - 28} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={A.ink}>35 %</text>
        </>
      ) : null}
      {[0, 3, 10, 15].map((s) => (
        <text key={s} x={px(s)} y={h - 22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={s === 3 || s === 10 ? A.orange : A.grey}>{s} s</text>
      ))}
    </svg>
  );
};

const camAt = (s: number, x: number, y: number) => {
  const p = M(x, y);
  return { s, ox: p.x, oy: p.y };
};

// Cámara: escala la escena alrededor de un punto de pantalla (para planos cerrados)
const Cam: React.FC<{ s?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ s = 1, ox = 540, oy = 960, children }) => (
  <AbsoluteFill style={{ transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s})` }}>{children}</AbsoluteFill>
);

export const Cortes: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { W, idx } = T;

  const iTiene = idx("tiene");
  const iVideo = idx("video");
  const iCuent = idx("cuéntalos");
  const iMis = idx("mis");
  const iMitad = idx("mitad");
  const iSe = idx("se", iMitad);
  const iSeg = idx("segundo");
  const iDiez = idx("diez");
  const iPor = idx("por");
  const iCambio = idx("cambio");
  const iCada = idx("cada");
  const iSin = idx("sin");
  const iCuantos2 = idx("cuántos", iSin);
  const iEran = idx("eran");
  const iEscr = idx("escríbeme");
  const iHook = idx("hook", iEscr);
  const iMuestra = idx("muestra");

  // 17 planos → 16 cortes duros
  const CUTS = [W(iTiene), W(iVideo), W(iCuent), W(iMis), W(iMitad), W(iSe), W(iSeg), W(iDiez), W(iPor), W(iCambio), W(iCada), W(iCada) + 15, W(iSin), W(iCuantos2), W(iEran), W(iEscr)];
  const shot = CUTS.filter((c) => f >= c).length; // 0..16
  const since = shot === 0 ? f : f - CUTS[shot - 1];

  let g: GanchoPose = { x: 540, y: FLOOR, scale: 0.7, t, talk: T.talkAt(f), expr: "normal" };
  let rope: RopeSpec = null;
  let scene: React.ReactNode = null;
  let cam = { s: 1, ox: 540, oy: 960 };
  let tone: string = A.ivory;

  switch (shot) {
    case 0: // tijeras cortando una tira de película
      g = { ...g, x: 700, expr: "focused", item: "scissors", armR: 80, look: { x: -1, y: 0 }, squash: 0.3 * impact(f - 8) };
      scene = <FilmStrip x={330} y={FLOOR - 60} scale={1.0} n={5} t={t} cut={lin(f, 6, 16)} />;
      break;
    case 1: // primerísimo plano
      g = { ...g, expr: "surprised", look: { x: 0, y: 0 } };
      cam = camAt(2.3, 540, FLOOR - 330);
      break;
    case 2: // el vídeo
      g = { ...g, x: 820, scale: 0.5, expr: "normal", look: { x: -1, y: -0.2 }, armL: 120 };
      scene = <PhoneFeed x={380} y={FLOOR} scale={1.25} scroll={since * 3} />;
      tone = A.ivoryDeep;
      break;
    case 3: // cuéntalos: señala a cámara
      g = { ...g, x: 600, scale: 0.8, expr: "smug", armR: 95, bendR: 0.2, lean: 6, flip: true };
      cam = camAt(1.35, 560, FLOOR - 300);
      break;
    case 4: // mis datos: la curva real
      g = { ...g, x: 880, scale: 0.42, expr: "focused", look: { x: -1, y: -0.4 } };
      scene = <Chart x={480} y={FLOOR - 330} w={720} h={520} draw={lin(since, 0, 22)} band={0} />;
      break;
    case 5: // la mitad de la gente
    case 6: {
      // se va: la mitad derecha se marcha andando
      const going = shot === 6;
      scene = (
        <>
          {Array.from({ length: 10 }, (_, k) => {
            const leave = going && k >= 5;
            return <Gancho key={k} x={110 + k * 92 + (leave ? since * 26 : 0)} y={FLOOR} scale={0.22} t={t + k} expr={leave ? "normal" : "surprised"} walk={leave ? t * 22 + k : undefined} flip={false} look={{ x: going && k < 5 ? 1 : 0, y: 0 }} />;
          })}
        </>
      );
      g = { ...g, scale: 0 };
      cam = going ? camAt(1.5, 700, FLOOR - 80) : camAt(1, 540, FLOOR - 470);
      tone = going ? A.ivoryDeep : A.ivory;
      break;
    }
    case 7: // entre el 3 y el 10
      g = { ...g, scale: 0 };
      scene = <Chart x={540} y={FLOOR - 330} w={700} h={560} draw={1} band={lin(since, 2, 14)} />;
      cam = camAt(1.12, 540, FLOOR - 330);
      break;
    case 8: // diez: se desploma
      g = { ...g, x: 540, scale: 0.75, expr: "squashed", squash: 0.6, armL: 150, armR: 150 };
      tone = A.ivoryDeep;
      break;
    case 9: // por eso aquí: contrapicado con tijeras
      g = { ...g, x: 540, scale: 0.85, expr: "focused", item: "scissors", armR: 75, lean: -4 };
      cam = camAt(1.25, 540, FLOOR);
      break;
    case 10: // cambio de plano: cruza el encuadre
      g = { ...g, x: 160 + since * 30, scale: 0.55, expr: "happy", walk: t * 22, flip: false };
      tone = A.ivoryDeep;
      break;
    case 11: // cada segundo: cronómetro
      g = { ...g, scale: 0 };
      scene = <Stopwatch x={540} y={FLOOR - 40} value={((f - CUTS[10]) / 30).toFixed(1).replace(".", ",")} ring={(f % 30) / 30} scale={1.15} t={t} />;
      break;
    case 12: // …segundo: perfil cortando
      g = { ...g, x: 470, scale: 0.9, expr: "focused", item: "scissors", armR: 85, flip: true };
      cam = camAt(1.9, 460, FLOOR - 300);
      tone = A.ivoryDeep;
      break;
    case 13: // sin que lo notes: silbando
      g = { ...g, x: 540, scale: 0.7, expr: "smug", look: { x: 0.6, y: -1 }, armL: 10, armR: 10, lean: 4 * Math.sin(t * 4) };
      break;
    case 14: // ¿cuántos contaste?
      g = { ...g, x: 540, scale: 0.9, expr: "surprised", lean: 10, look: { x: 0, y: 0 } };
      cam = camAt(2.0, 540, FLOOR - 380);
      tone = A.ivoryDeep;
      break;
    case 15: // eran dieciséis
      g = { ...g, x: 840, scale: 0.55, expr: "happy", armL: 150, armR: 40 };
      scene = <BigStat x={420} y={FLOOR} scale={1.2} value="16" label="CORTES" fill={1} lift={(1 - fall(since, fps)) * 900} squash={0.4 * impact(since - 6)} />;
      break;
    default: // CTA
      g = { ...g, x: 760, scale: 0.6, expr: f >= W(iMuestra) ? "happy" : "focused", armL: 30, armR: 40 };
      if (f >= W(iHook) + 4) {
        g = { ...g, hookOut: true, lean: 6 };
        rope = ctaRope(f, W(iHook));
      }
  }

  return (
    <Paper tone={tone}>
      <Cam {...cam}>
        <Stage>
          {scene}
          {g.scale ? <Gancho {...g} /> : null}
        </Stage>
      </Cam>
      {shot === 4 || shot === 7 ? <Tag x={540} y={1490} text="MIS 4 ÚLTIMOS REELS · TIKTOK" align="center" /> : null}
      {shot === 14 ? <div style={{ position: "absolute", right: 110, top: 520, fontFamily: FONT, fontWeight: 800, fontSize: 260, color: A.orange, transform: `rotate(10deg) scale(${0.8 + 0.2 * Math.min(1, since / 5)})` }}>?</div> : null}
      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
      <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={W(iHook)} tMuestra={W(iMuestra)} until={CORTES_FRAMES + 10} />
      {f >= W(iMuestra) + 20 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1420, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: "-0.02em", color: A.ink, opacity: lin(f, W(iMuestra) + 20, W(iMuestra) + 28) }}>
          ¿Seguro que eran 16? <span style={{ color: A.orange }}>Vuelve a contar ↺</span>
        </div>
      ) : null}
      <TopCaptions words={T.words} f={f} fps={fps} keys={[idx("cortes"), iMitad, idx("tres"), iDiez, idx("notes"), idx("contaste")]} hide={shot >= 15} />

      <Audio src={staticFile("audio/voz_cortes.wav")} />
      {CUTS.map((c) => (
        <Snd key={c} at={c} src="sfx/click.wav" vol={0.45} />
      ))}
      <Snd at={4} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(iEran) + 6} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(iHook)} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iMuestra) + 1} src={SOUND.impacto} vol={0.7} />
    </Paper>
  );
};
