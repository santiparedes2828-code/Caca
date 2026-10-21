import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-zeigarnik.json";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { P, Scene3D, Z, type Cam, type SceneState, type ScreenKind } from "./scene3d";

// Reel "Efecto Zeigarnik" — Hook House (guion-zeigarnik.md · skill formula-viral · estilo-explicador.md en 3D).
// Locución: Rodrigo Zabú (ElevenLabs, eleven_v4, toma 2) en public/audio/voz_zeigarnik.wav; tiempos de
// src/data/captions-zeigarnik.json salen de su transcripción con Scribe (analisis7/words_zeigarnik.json).

loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-italic.woff2"), weight: "500", style: "italic" });

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const zeigarnikDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const CANVAS = { top: 300, height: 900 };
const RETICLE = { x: 540, y: CANVAS.top + CANVAS.height / 2 };

// Palabras clave (más grandes y en color en los subtítulos)
const KEY_GOLD = new Set([45, 51, 61, 65, 67, 68, 75]);
const KEY_RED = new Set([7, 12, 19, 29, 36, 41]);

const v = (p: { x: number; y: number; z: number }, dx: number, dy: number, dz: number): [number, number, number] => [p.x + dx, p.y + dy, p.z + dz];
const look = (p: { x: number; y: number; z: number }): [number, number, number] => [p.x, p.y, p.z];

// Cámara: [primera palabra, encuadre]
const CAMERA: { at: number; cam: Cam; reticle: boolean }[] = [
  { at: 0, cam: { pos: v(P.phone, 1.4, 0.9, 6.2), look: look(P.phone) }, reticle: true },
  { at: 13, cam: { pos: v(P.brain, 1.0, 0.8, 6.0), look: look(P.brain) }, reticle: true },
  { at: 30, cam: { pos: v(P.tabs, -1.6, 1.0, 6.4), look: look(P.tabs) }, reticle: true },
  { at: 46, cam: { pos: v(P.phone, 1.8, 0.6, 5.6), look: look(P.phone) }, reticle: false },
  { at: 52, cam: { pos: [0.2, 6.5, 14], look: [0.2, 1.8, 0] }, reticle: false },
  { at: 62, cam: { pos: v(P.brain, 0, 1.2, 6.5), look: look(P.brain) }, reticle: false },
  { at: 66, cam: { pos: v(P.phone, 0.7, 0.1, 4.6), look: look(P.phone) }, reticle: false },
];

const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "capítulo, a medias", sub: "la barra se quedó en la mitad" },
  { at: 13, title: "cerebro, en bucle", sub: "lo que no termina, no se suelta" },
  { at: 30, title: "pestaña, abierta", sub: "tensión acumulándose" },
  { at: 46, title: "siguiente capítulo", sub: "cerrar uno para abrir otro" },
  { at: 52, title: "este video", sub: "por eso sigues aquí" },
  { at: 62, title: "tiene nombre", sub: "psicología de la atención" },
  { at: 66, title: "hook house", sub: "edición que retiene" },
];

const LABELS: { from: number; to: number; text: string; color: string; strike?: boolean; big?: boolean }[] = [
  { from: 1, to: 7, text: "EP. 07", color: Z.gold },
  { from: 7, to: 10, text: "A MEDIAS", color: Z.red },
  { from: 12, to: 13, text: "VOLUNTAD", color: Z.red, strike: true },
  { from: 19, to: 24, text: "BUCLE", color: Z.red },
  { from: 29, to: 32, text: "ABIERTO", color: Z.red },
  { from: 32, to: 39, text: "PESTAÑA ABIERTA", color: Z.red },
  { from: 41, to: 45, text: "TENSIÓN", color: Z.red },
  { from: 45, to: 50, text: "CERRADO", color: Z.gold },
  { from: 50, to: 52, text: "EP. 08", color: Z.gold },
  { from: 59, to: 62, text: "HASTA EL FINAL", color: Z.gold },
  { from: 64, to: 66, text: "EFECTO\nZEIGARNIK", color: Z.gold, big: true },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

// Monitor: tensión (roja) sube mientras la pestaña está abierta y cae al cerrarla; atención (dorada) con picos
const tension = (t: number) => {
  let v2 = 0.08;
  if (t >= sec(20) && t < sec(45)) v2 = interpolate(t, [sec(20), sec(45)], [0.08, 1.0], { ...opt, easing: Easing.in(Easing.quad) });
  if (t >= sec(45)) v2 = 0.08 + 0.92 * Math.exp(-(t - sec(45)) * 4);
  v2 += 0.04 * Math.sin(t * 9) * (v2 > 0.3 ? 1 : 0.3);
  return v2 + 0.6 * gauss(t, sec(65), 0.15);
};
const attention = (t: number) => {
  let v2 = 0.3 + 0.03 * Math.sin(t * 4);
  for (const e of [sec(1), sec(19), sec(45), sec(65)]) v2 += 0.85 * gauss(t, e, 0.12);
  return v2;
};

const Monitor: React.FC<{ t: number }> = ({ t }) => {
  const N = 140;
  const WIN = 4;
  const line = (f: (x: number) => number, base: number) =>
    Array.from({ length: N }, (_, i) => {
      const tt = t - WIN + (WIN * i) / (N - 1);
      return `${70 + (850 * i) / (N - 1)},${base - Math.min(1.25, tt < 0 ? 0.1 : f(tt)) * 70}`;
    }).join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={70} y1={1460} x2={920} y2={1460} stroke="rgba(237,230,218,0.12)" strokeWidth={2} />
      <polyline points={line(attention, 1410)} fill="none" stroke={Z.gold} strokeWidth={4} strokeLinejoin="round" />
      <polyline points={line(tension, 1450)} fill="none" stroke={Z.red} strokeWidth={4} strokeLinejoin="round" />
      <text x={932} y={1414} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={Z.gold}>
        atención
      </text>
      <text x={932} y={1454} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={Z.red}>
        tensión
      </text>
    </svg>
  );
};

// Subtítulos dinámicos: bloques de hasta 3 palabras que saltan con rebote y giro; las clave crecen y se colorean
const DynamicCaptions: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= sec(i)) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?]$/.test(caps[i - 1].text) || n >= 3)) {
      start = i;
      n = 0;
    }
    n++;
  }
  if (t > caps[cur].endMs / 1000 + 0.5 && cur < caps.length - 1) return null;
  const blockIn = spring({ frame: frame - Math.round(sec(start) * fps), fps, config: { damping: 12, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 1225,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: 82,
        lineHeight: 1.08,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        transform: `translateY(${(1 - blockIn) * 40}px)`,
      }}
    >
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const local = frame - Math.round(sec(i) * fps);
        const s = spring({ frame: local, fps, config: { damping: 8, stiffness: 260, mass: 0.6 } });
        const gold = KEY_GOLD.has(i);
        const red = KEY_RED.has(i);
        const key = gold || red;
        const isCur = i === cur;
        const rot = (random(`r${i}`) * 2 - 1) * 10 * (1 - s);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              margin: "0 0.14em",
              color: gold ? Z.gold : red ? "#FF5A4E" : isCur ? "#fff" : "#EDE6DA",
              fontSize: key ? 98 : undefined,
              transform: `scale(${0.65 + 0.35 * s}) rotate(${rot}deg) translateY(${isCur ? -6 : 0}px)`,
              opacity: Math.min(1, s * 2.5),
              WebkitTextStroke: "10px #120F0D",
              paintOrder: "stroke fill",
              textShadow: key ? `0 0 28px ${gold ? "rgba(232,195,90,0.7)" : "rgba(226,72,61,0.7)"}, 0 6px 0 rgba(0,0,0,0.6)` : "0 6px 0 rgba(0,0,0,0.6)",
            }}
          >
            {caps[i].text}
          </span>
        );
      })}
    </div>
  );
};

const Clock: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={72} height={72} viewBox="-36 -36 72 72" style={{ position: "absolute", left: 870, top: 206 }}>
    <circle r={31} fill="none" stroke={Z.text} strokeWidth={3.5} />
    <line x1={0} y1={0} x2={0} y2={-16} stroke={Z.text} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${frame * 0.8})`} />
    <line x1={0} y1={0} x2={0} y2={-24} stroke={Z.text} strokeWidth={3} strokeLinecap="round" transform={`rotate(${frame * 9})`} />
  </svg>
);

const Reticle: React.FC<{ t: number; opacity: number }> = ({ t, opacity }) => (
  <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ position: "absolute", left: RETICLE.x - 150, top: RETICLE.y - 150, opacity }}>
    <g transform={`scale(${1 + 0.05 * Math.sin(t * 6)})`}>
      <circle r={110} fill="none" stroke={Z.red} strokeWidth={5} strokeDasharray="22 14" transform={`rotate(${t * 30})`} />
      <circle r={60} fill="none" stroke={Z.red} strokeWidth={5} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={0} y1={-72} x2={0} y2={-132} stroke={Z.red} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </g>
  </svg>
);

const mix = (a: [number, number, number], b: [number, number, number], p: number): [number, number, number] => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];

export const Zeigarnik: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);
  const end = endStart(fps);

  // Cámara
  const ck = pick(CAMERA, t);
  const prev = CAMERA[Math.max(0, ck - 1)];
  const cur = CAMERA[ck];
  const cp = ck === 0 ? 1 : interpolate(frame, [w(cur.at) - 2, w(cur.at) + 14], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  let pos = mix(prev.cam.pos, cur.cam.pos, cp);
  const lk = mix(prev.cam.look, cur.cam.look, cp);
  // Órbita lenta (3D) y vuelta completa alrededor del cerebro en la revelación
  const drift = Math.sin(t * 0.7) * 0.5;
  pos = [pos[0] + drift, pos[1], pos[2]];
  if (cur.at === 62) {
    const a = (frame - w(62)) * 0.045;
    pos = mix(pos, [P.brain.x + Math.sin(a) * 6.5, P.brain.y + 1.2, P.brain.z + Math.cos(a) * 6.5], cp);
  }
  // Sacudidas
  const hits = [w(1), w(45), w(64)];
  let sx = 0;
  let sy = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < 12) {
      const a = 18 * Math.exp(-d / 3.5);
      sx += (random(`x${h}${frame}`) * 2 - 1) * a;
      sy += (random(`y${h}${frame}`) * 2 - 1) * a;
    }
  }

  // Estado de la escena
  const drop = interpolate(frame, [0, w(1)], [0, 1], { ...opt, easing: Easing.in(Easing.quad) });
  const close = spring({ frame: frame - w(45), fps, config: { damping: 11, stiffness: 160 } });
  let screen: ScreenKind = "ep7";
  if (frame >= w(50)) screen = "ep8";
  if (frame >= w(55)) screen = "video";
  if (frame >= w(66)) screen = "dm";
  let progress = 0.5;
  if (frame >= w(48)) progress = interpolate(frame, [w(48), w(50)], [0.5, 1], opt);
  if (frame >= w(50)) progress = interpolate(frame, [w(50), w(55)], [0, 0.25], opt);
  if (frame >= w(55)) progress = interpolate(frame, [w(55), w(61)], [0.3, 0.96], opt);
  const s: SceneState = {
    cam: { pos, look: lk },
    phoneDrop: drop,
    phoneSpin: (1 - drop) * 7,
    progress,
    screen,
    ring: frame >= w(45) ? close : 0,
    ringGlow: frame >= w(20) && frame < w(45) ? 0.5 + 0.5 * Math.sin(t * 8) : interpolate(frame - w(45), [0, 4, 20], [0, 1, 0], opt),
    brainSpin: t * 0.6,
    tabOpen: frame >= w(45) ? 1 - close : 1,
    tabPulse: 0.5 + 0.5 * Math.sin(t * 7),
  };

  const ti = pick(TITLES, t);
  const titleIn = interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt);
  const label = LABELS.find((l) => frame >= w(l.from) && frame < w(l.to));
  const labelIn = label ? spring({ frame: frame - w(label.from), fps, config: { damping: 11, stiffness: 240 } }) : 0;
  const strike = label?.strike ? interpolate(frame - w(label.from), [4, 10], [0, 1], opt) : 0;
  const reticleOn = cur.reticle && cp > 0.8 ? 1 : 0;
  const flash = interpolate(frame - w(64), [0, 1, 6], [0, 0.8, 0], opt);

  return (
    <AbsoluteFill style={{ background: Z.bg }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <div style={{ position: "absolute", left: 0, top: CANVAS.top, width: 1080, height: CANVAS.height }}>
          <Scene3D s={s} width={1080} height={CANVAS.height} />
          {/* Fundido de la escena hacia el fondo arriba y abajo */}
          <AbsoluteFill style={{ background: `linear-gradient(${Z.bg} 0%, transparent 14%, transparent 86%, ${Z.bg} 100%)` }} />
        </div>
        <Reticle t={t} opacity={reticleOn * interpolate(frame, [end - 10, end], [1, 0], opt)} />
      </AbsoluteFill>

      {/* Pista de película */}
      <div
        style={{
          position: "absolute",
          top: CANVAS.top + CANVAS.height - 12,
          left: 0,
          right: 0,
          height: 22,
          background: Z.text,
          backgroundImage: `repeating-linear-gradient(90deg, ${Z.line} 0 52px, transparent 52px 90px)`,
          backgroundSize: "90px 10px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: `${-frame * 2}px 6px`,
        }}
      />

      <div style={{ position: "absolute", left: 78, top: 206, opacity: titleIn }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: Z.text }}>{TITLES[ti].title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: Z.dim, marginTop: 4 }}>{TITLES[ti].sub}</div>
      </div>
      <Clock frame={frame} />

      {label ? (
        <div
          style={{
            position: "absolute",
            top: label.big ? 380 : 360,
            left: 0,
            right: 0,
            textAlign: "center",
            whiteSpace: "pre-line",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: label.big ? 104 : 56,
            lineHeight: 1.02,
            letterSpacing: "0.1em",
            color: label.color,
            scale: `${(label.big ? 1.5 : 1.15) - (label.big ? 0.5 : 0.15) * labelIn}`,
            opacity: labelIn,
            textShadow: label.big ? "0 0 40px rgba(232,195,90,0.8), 0 6px 0 rgba(0,0,0,0.6)" : "0 4px 18px rgba(0,0,0,0.7)",
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            {label.text}
            {label.strike ? <span style={{ position: "absolute", left: -10, top: "52%", height: 8, width: `calc(${strike * 100}% + 20px)`, background: Z.red, borderRadius: 4 }} /> : null}
          </span>
        </div>
      ) : null}

      <DynamicCaptions t={t} frame={frame} fps={fps} />
      <Monitor t={t} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      <Audio src={staticFile("audio/voz_zeigarnik.wav")} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(f) => interpolate(f, [0, 6, end, end + 30], [0, 0.14, 0.14, 0], opt)} />
      {[1, 64].map((i) => (
        <Sequence key={`s${i}`} name="Golpe" from={w(i)} durationInFrames={24} premountFor={fps}>
          <Audio src={staticFile("sfx/slam.wav")} volume={0.45} />
        </Sequence>
      ))}
      <Sequence name="Cierre pestaña" from={w(45)} durationInFrames={18} premountFor={fps}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.4} />
      </Sequence>
      {LABELS.map((l) => (
        <Sequence key={`c${l.from}`} name="Click" from={w(l.from)} durationInFrames={6} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.35} />
        </Sequence>
      ))}
      {CAMERA.slice(1).map((c) => (
        <Sequence key={`w${c.at}`} name="Whoosh" from={w(c.at) - 3} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} />
        </Sequence>
      ))}
      <Sequence name="Pop HOOK" from={w(75)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Whoosh cierre" from={end - 3} durationInFrames={14} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} />
      </Sequence>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const house = interpolate(frame, [4, 10], [0, 1], opt);
  const dot = interpolate(frame, [8, 14], [0, 1], { ...opt, easing: Easing.out(Easing.back(2.5)) });
  return (
    <AbsoluteFill style={{ background: Z.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: sIn }}>
      <Wordmark size={150} color={Z.text} houseOpacity={house} dot={dot} />
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: Z.text, opacity: house }}>edición que retiene</div>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.08em", color: Z.dim, opacity: house }}>ESCRÍBEME «HOOK» POR DM</div>
    </AbsoluteFill>
  );
};
