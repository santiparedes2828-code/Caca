import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-reflejo.json";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { Bedroom, E, Reticle, SPOT, type Screen } from "./scene";

// Reel "El reflejo de orientación" — Hook House (guion-reflejo.md · skill formula-viral · estilo-explicador.md).
// Locución: Rodrigo Zabú (ElevenLabs, eleven_v4, toma 2) en public/audio/voz_reflejo.wav; tiempos de
// src/data/captions-reflejo.json salen de su transcripción con Scribe (analisis5/words_reflejo.json).

loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-italic.woff2"), weight: "500", style: "italic" });

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const reflejoDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const SCENE_TOP = 470; // la ilustración ocupa y 470–1190
const VIEW = { x: 540, y: 330 }; // centro del encuadre en coordenadas de la ilustración

// Palabras clave enmarcadas (una por frase como mucho)
const KEY = new Set([1, 16, 26, 35, 50, 63, 73, 82]);

// Cámara: [primera palabra, escala, punto de interés]
const CAMERA: { at: number; s: number; p: { x: number; y: number } }[] = [
  { at: 0, s: 1.7, p: SPOT.thumb },
  { at: 12, s: 1.75, p: SPOT.head },
  { at: 17, s: 1.0, p: SPOT.wide },
  { at: 38, s: 1.4, p: SPOT.screen },
  { at: 51, s: 1.2, p: { x: 690, y: 300 } },
  { at: 64, s: 1.6, p: SPOT.screen },
  { at: 74, s: 2.1, p: SPOT.screen },
];

// Diana: [primera palabra, objetivo]
const TARGET: { at: number; p: { x: number; y: number } }[] = [
  { at: 0, p: SPOT.thumb },
  { at: 12, p: SPOT.head },
  { at: 38, p: SPOT.screen },
  { at: 53, p: SPOT.thumb },
  { at: 59, p: SPOT.heart },
  { at: 64, p: SPOT.screen },
];

// Etiqueta de escena (arriba a la izquierda)
const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "persona, haciendo scroll", sub: "una noche, mil videos" },
  { at: 17, title: "pulgar, frenando", sub: "el frenazo tiene nombre" },
  { at: 27, title: "atención, apagándose", sub: "siempre lo mismo" },
  { at: 38, title: "cerebro, en alerta", sub: "lo que ve frente a lo que cree" },
  { at: 51, title: "cuerpo, congelado", sub: "primero mirar, después moverse" },
  { at: 64, title: "video, reteniendo", sub: "un cambio por segundo" },
  { at: 74, title: "hook house", sub: "edición que retiene" },
];

// Etiquetas de acción: [desde palabra, hasta palabra (exclusiva), texto, color]
const LABELS: { from: number; to: number; text: string; color: string }[] = [
  { from: 1, to: 12, text: "FRENAZO", color: E.red },
  { from: 16, to: 19, text: "ALERTA", color: E.red },
  { from: 24, to: 27, text: "REFLEJO DE\nORIENTACIÓN", color: E.red },
  { from: 35, to: 37, text: "ATENCIÓN", color: E.gold },
  { from: 37, to: 41, text: "ATENCIÓN 0 %", color: E.gold },
  { from: 55, to: 60, text: "QUIETO", color: E.red },
  { from: 60, to: 64, text: "PULSO LENTO", color: E.red },
  { from: 70, to: 74, text: "CADA SEGUNDO", color: E.gold },
  { from: 75, to: 85, text: "HOOK HOUSE", color: E.gold },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

// Monitor (estilo-explicador.md §3): atención (dorada) y pulso (roja)
const attention = (t: number) => {
  let base = 0.3;
  if (t >= sec(27)) base = interpolate(t, [sec(27), sec(37)], [0.3, 0.02], opt);
  if (t >= sec(41)) base = 0.3;
  let v = base + 0.03 * Math.sin(t * 5);
  for (const e of [sec(1), sec(24), sec(41), sec(50)]) v += 0.9 * gauss(t, e, 0.12);
  if (t >= sec(64) && t < sec(74)) {
    for (let e = sec(64); e < sec(74); e += 1) v += 0.6 * gauss(t, e, 0.1);
  }
  return v;
};
const pulse = (t: number) => {
  const a = sec(60);
  const phase = t < a ? 1.25 * t : 1.25 * a + 0.7 * (t - a);
  const p = phase - Math.floor(phase);
  let v = 0.08 + 0.75 * gauss(p, 0.1, 0.03) - 0.25 * gauss(p, 0.16, 0.03);
  for (const e of [sec(1), sec(50)]) v += 0.7 * gauss(t, e, 0.12);
  return v;
};

const Monitor: React.FC<{ t: number }> = ({ t }) => {
  const N = 140;
  const WIN = 4;
  const line = (f: (x: number) => number, base: number) =>
    Array.from({ length: N }, (_, i) => {
      const tt = t - WIN + (WIN * i) / (N - 1);
      const v = tt < 0 ? 0.1 : f(tt);
      return `${70 + (870 * i) / (N - 1)},${base - Math.min(1.2, v) * 70}`;
    }).join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={70} y1={1440} x2={940} y2={1440} stroke="rgba(237,230,218,0.12)" strokeWidth={2} />
      <polyline points={line(attention, 1390)} fill="none" stroke={E.gold} strokeWidth={4} strokeLinejoin="round" />
      <polyline points={line(pulse, 1428)} fill="none" stroke={E.red2} strokeWidth={4} strokeLinejoin="round" />
      <text x={950} y={1394} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={E.gold}>
        atención
      </text>
      <text x={950} y={1432} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={E.red2}>
        pulso
      </text>
    </svg>
  );
};

// Subtítulos por frase: palabra a palabra, la que suena en negrita blanca, la palabra clave enmarcada en rojo
const Captions: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= sec(i)) cur = i;
  if (cur < 0) return null;
  // Inicio del bloque: tras una palabra con puntuación o cada 5 palabras
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?]$/.test(caps[i - 1].text) || n >= 5)) {
      start = i;
      n = 0;
    }
    n++;
  }
  const words = Array.from({ length: cur - start + 1 }, (_, k) => start + k);
  return (
    <div style={{ position: "absolute", top: 1240, left: 110, right: 110, textAlign: "center", fontFamily: SANS, fontSize: 50, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
      {words.map((i) => {
        const local = frame - Math.round(sec(i) * fps);
        const p = interpolate(local, [0, 4], [0, 1], opt);
        const isCur = i === cur;
        const key = KEY.has(i);
        const box = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 } });
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>
            {key ? (
              <span style={{ position: "relative", display: "inline-block", padding: "0 10px", margin: "0 2px", border: `3px solid ${E.red}`, borderRadius: 4, fontWeight: 700, color: "#fff", scale: `${0.9 + 0.1 * box}` }}>
                {caps[i].text}
                <span style={{ position: "absolute", left: -8, top: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
                <span style={{ position: "absolute", right: -8, bottom: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
              </span>
            ) : (
              <span style={{ fontWeight: isCur ? 700 : 500, color: isCur ? "#fff" : "#D8D1C6" }}>{caps[i].text}</span>
            )}{" "}
          </span>
        );
      })}
    </div>
  );
};

const Clock: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={72} height={72} viewBox="-36 -36 72 72" style={{ position: "absolute", left: 870, top: 286 }}>
    <circle r={31} fill="none" stroke={E.text} strokeWidth={3.5} />
    <line x1={0} y1={0} x2={0} y2={-16} stroke={E.text} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${frame * 0.8})`} />
    <line x1={0} y1={0} x2={0} y2={-24} stroke={E.text} strokeWidth={3} strokeLinecap="round" transform={`rotate(${frame * 9})`} />
  </svg>
);

export const Reflejo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);
  const end = endStart(fps);

  // Cámara: transición de 12 frames entre encuadres + deriva lenta
  const ck = pick(CAMERA, t);
  const prev = CAMERA[Math.max(0, ck - 1)];
  const curCam = CAMERA[ck];
  const cp = ck === 0 ? 1 : interpolate(frame, [w(curCam.at) - 2, w(curCam.at) + 10], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const s = (prev.s + (curCam.s - prev.s) * cp) * (1 + 0.012 * Math.sin(t * 0.9));
  const fx = prev.p.x + (curCam.p.x - prev.p.x) * cp;
  const fy = prev.p.y + (curCam.p.y - prev.p.y) * cp;
  // Sacudida en el frenazo y en la alerta
  const shake = (e: number) => interpolate(frame - w(e), [0, 2, 4, 6, 8], [0, 14, -10, 6, 0], opt);
  const jolt = shake(1) + shake(50);

  // Diana
  const tk = pick(TARGET, t);
  const tPrev = TARGET[Math.max(0, tk - 1)].p;
  const tCur = TARGET[tk].p;
  const tp = tk === 0 ? 1 : interpolate(frame, [w(TARGET[tk].at), w(TARGET[tk].at) + 8], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const rx = tPrev.x + (tCur.x - tPrev.x) * tp;
  const ry = tPrev.y + (tCur.y - tPrev.y) * tp;

  // Pantalla del móvil
  let screen: Screen;
  if (frame >= w(74)) {
    screen = { kind: "dm", sent: spring({ frame: frame - w(82), fps, config: { damping: 12, stiffness: 200 } }) };
  } else {
    const stop = w(1);
    let offset = Math.min(frame, stop) * 34;
    let blur = frame < stop ? 6 : 0;
    const same = frame >= w(27) && frame < w(41);
    if (same) offset += (frame - w(27)) * 1.2;
    if (frame >= w(64)) {
      offset += Math.floor((frame - w(64)) / fps) * 70;
      blur = 0;
    }
    const odd = frame >= w(41) && frame < w(64) ? spring({ frame: frame - w(41), fps, config: { damping: 10, stiffness: 200 } }) : 0;
    screen = { kind: "scroll", offset, blur, same, odd };
  }
  const outline = interpolate(frame, [w(53), w(53) + 5, w(64) - 4, w(64)], [0, 1, 1, 0], opt);
  const heart = frame >= w(59) && frame < w(74) ? spring({ frame: frame - w(59), fps, config: { damping: 12 } }) : 0;
  const ph = pulse(t);
  const heartBeat = 1 + 0.25 * Math.max(0, ph - 0.1);

  // Globo de pensamiento: "¿curiosidad?" tachado
  const bubble = frame >= w(19) && frame < w(24) ? spring({ frame: frame - w(19), fps, config: { damping: 13 } }) : 0;
  const cross = interpolate(frame, [w(21), w(21) + 6], [0, 1], opt);
  // Inserto "lo que cree el cerebro"
  const inset = frame >= w(46) && frame < w(51) ? spring({ frame: frame - w(46), fps, config: { damping: 14 } }) : 0;

  const ti = pick(TITLES, t);
  const titleIn = interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt);
  const label = LABELS.find((l) => frame >= w(l.from) && frame < w(l.to));
  const labelIn = label ? spring({ frame: frame - w(label.from), fps, config: { damping: 12, stiffness: 240 } }) : 0;

  return (
    <AbsoluteFill style={{ background: E.bg }}>
      {/* Cuadrícula + viñeta */}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(237,230,218,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(237,230,218,0.035) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Ilustración con cámara */}
      <div style={{ position: "absolute", left: 0, top: SCENE_TOP - 90, width: 1080, height: 810, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 90,
            width: 1080,
            height: 720,
            transformOrigin: "0 0",
            transform: `translate(${VIEW.x - fx * s + jolt}px, ${VIEW.y - fy * s}px) scale(${s})`,
          }}
        >
          <Bedroom screen={screen} outline={outline} heart={heart} heartBeat={heartBeat} />
          <Reticle x={rx} y={ry} pulse={Math.sin(t * 6)} opacity={interpolate(frame, [w(74), w(74) + 6], [1, 0], opt)} />
        </div>
      </div>

      {/* Pista de película */}
      <div
        style={{
          position: "absolute",
          top: 1190,
          left: 0,
          right: 0,
          height: 22,
          background: E.text,
          backgroundImage: `repeating-linear-gradient(90deg, ${E.line} 0 52px, transparent 52px 90px)`,
          backgroundSize: "90px 10px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: `${-frame * 2}px 6px`,
        }}
      />

      {/* Etiqueta de escena */}
      <div style={{ position: "absolute", left: 78, top: 286, opacity: titleIn }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: E.text }}>{TITLES[ti].title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: E.dim, marginTop: 4 }}>{TITLES[ti].sub}</div>
      </div>
      <Clock frame={frame} />

      {/* Etiqueta de acción */}
      {label ? (
        <div
          style={{
            position: "absolute",
            top: 420,
            left: 0,
            right: 0,
            textAlign: "center",
            whiteSpace: "pre-line",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1.05,
            letterSpacing: "0.1em",
            color: label.color,
            scale: `${1.15 - 0.15 * labelIn}`,
            opacity: labelIn,
            textShadow: "0 4px 18px rgba(0,0,0,0.6)",
          }}
        >
          {label.text}
        </div>
      ) : null}

      {/* Globo de pensamiento */}
      {bubble > 0 ? (
        <svg width={260} height={220} viewBox="0 0 260 220" style={{ position: "absolute", left: 700, top: 500, scale: `${bubble}`, transformOrigin: "20% 100%" }}>
          <path d="M60 150 C10 150 10 80 55 78 C50 30 120 20 135 55 C160 15 235 35 215 90 C255 110 235 160 195 150 Z" fill={E.cream} stroke={E.line} strokeWidth={8} />
          <circle cx={40} cy={185} r={12} fill={E.cream} stroke={E.line} strokeWidth={6} />
          <circle cx={18} cy={210} r={7} fill={E.cream} stroke={E.line} strokeWidth={5} />
          <text x={130} y={130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={72} fill={E.line}>
            ?
          </text>
          <line x1={70} y1={50} x2={70 + 130 * cross} y2={50 + 95 * cross} stroke={E.red} strokeWidth={12} strokeLinecap="round" />
          <line x1={200} y1={50} x2={200 - 130 * cross} y2={50 + 95 * cross} stroke={E.red} strokeWidth={12} strokeLinecap="round" />
        </svg>
      ) : null}

      {/* Inserto "lo que cree el cerebro" */}
      {inset > 0 ? (
        <div style={{ position: "absolute", left: 80, top: 500, display: "flex", gap: 20, alignItems: "flex-start", opacity: inset, scale: `${0.9 + 0.1 * inset}`, transformOrigin: "left top" }}>
          <div style={{ width: 300, height: 190, border: `5px solid ${E.red}`, background: "#2B2622", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={130} height={115} viewBox="0 0 130 115">
              <path d="M65 6 L124 108 L6 108 Z" fill={E.red} stroke={E.line} strokeWidth={6} strokeLinejoin="round" />
              <rect x={59} y={38} width={12} height={40} rx={6} fill={E.cream} />
              <circle cx={65} cy={92} r={7} fill={E.cream} />
            </svg>
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: "0.08em", lineHeight: 1.2, color: E.red }}>
            LO QUE CREE
            <br />
            EL CEREBRO
            {frame >= w(50) ? <div style={{ marginTop: 10, fontSize: 40, color: E.text }}>ALERTA</div> : null}
          </div>
        </div>
      ) : null}

      <Captions t={t} frame={frame} fps={fps} />
      <Monitor t={t} />

      {/* Cierre de marca */}
      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_reflejo.wav")} />
      {[1, 50].map((i) => (
        <Sequence key={`h${i}`} name="Golpe" from={w(i)} durationInFrames={18} premountFor={fps}>
          <Audio src={staticFile("sfx/hit.wav")} volume={0.32} />
        </Sequence>
      ))}
      {LABELS.map((l) => (
        <Sequence key={`c${l.from}`} name="Click" from={w(l.from)} durationInFrames={6} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.35} />
        </Sequence>
      ))}
      {CAMERA.slice(1).map((c) => (
        <Sequence key={`w${c.at}`} name="Whoosh" from={w(c.at) - 3} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence name="Pop corazón" from={w(59)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
      </Sequence>
      <Sequence name="Pop HOOK" from={w(82)} durationInFrames={12} premountFor={fps}>
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
    <AbsoluteFill style={{ background: E.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: sIn }}>
      <Wordmark size={150} color={E.text} houseOpacity={house} dot={dot} />
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: E.text, opacity: house }}>edición que retiene</div>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.08em", color: E.dim, opacity: house }}>ESCRÍBEME «HOOK» POR DM</div>
    </AbsoluteFill>
  );
};
