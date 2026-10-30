import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho } from "../Altera/Gancho";
import captionsJson from "../data/captions-salto.json";
import { SANS, SERIF } from "../HookHouse/brand";
import { opt } from "../HookHouse/text";
import { E, Reticle } from "../Reflejo/scene";
import { Bed, SPOT } from "./scene";

// Reel «El salto al dormirte» — dato curioso con Hookie (2026-10-30). Copia la estructura de la referencia de
// estilo-explicador.md (clon-hookie/references/ref2): escena única, cámara que se acerca, diana, monitor de dos líneas,
// etiquetas de escena en serif y de acción en mayúsculas, globo tachado, inserto «lo que cree el cerebro».
// Dato: la mioclonía hípnica existe; la explicación de la «caída» es una hipótesis y la voz lo dice.
// Voz: Rodrigo Zabú (eleven_v4, toma 1, flow «Hook House · Voz reel «Falso: 15 segundos»») → public/audio/voz_salto.wav;
// tiempos alineados con produccion/salto/alinear.py (texto conocido + silencios) → src/data/captions-salto.json.

loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-italic.woff2"), weight: "500", style: "italic" });

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const LAST = caps.length - 1; // «notar.»
const JOLT_END = () => caps[LAST].startMs / 1000 + 0.25; // el último salto cae en «notar»
export const saltoDuration = (fps: number) => Math.round((caps[LAST].endMs / 1000 + 0.75) * fps);

const SCENE_TOP = 470;
const VIEW = { x: 540, y: 330 };

// Palabras clave enmarcadas (una por frase como mucho)
const KEY = new Set([1, 13, 22, 29, 37, 44, 52, 55, 68, 75]);

const CAMERA: { at: number; s: number; p: { x: number; y: number } }[] = [
  { at: 0, s: 1.45, p: SPOT.head },
  { at: 12, s: 1.85, p: SPOT.head },
  { at: 14, s: 1.0, p: SPOT.wide },
  { at: 32, s: 1.8, p: SPOT.head },
  { at: 41, s: 1.15, p: SPOT.wide },
  { at: 45, s: 1.0, p: SPOT.wide },
  { at: 53, s: 1.6, p: SPOT.heart },
  { at: 59, s: 1.0, p: SPOT.wide },
  { at: 69, s: 1.65, p: SPOT.head },
];

const TARGET: { at: number; p: { x: number; y: number } }[] = [
  { at: 0, p: SPOT.crown },
  { at: 24, p: SPOT.body },
  { at: 32, p: SPOT.crown },
  { at: 53, p: SPOT.heart },
  { at: 69, p: SPOT.crown },
];

const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "hookie, durmiéndose", sub: "una noche, un salto" },
  { at: 14, title: "hookie, durmiéndose", sub: "el salto tiene nombre" },
  { at: 24, title: "músculos, aflojándose", sub: "la tensión, de golpe a cero" },
  { at: 32, title: "cerebro, medio despierto", sub: "lo que siente frente a lo que cree" },
  { at: 45, title: "hookie, el salto", sub: "agarrarse a nada" },
  { at: 59, title: "la explicación", sub: "la más conocida, no probada" },
  { at: 69, title: "vos, esta noche", sub: "ahora lo vas a notar" },
];

const LABELS: { from: number; to: number; text: string; color: string }[] = [
  { from: 12, to: 14, text: "ALERTA", color: E.red },
  { from: 22, to: 24, text: "MIOCLONÍA\nHÍPNICA", color: E.red },
  { from: 24, to: 29, text: "TENSIÓN", color: E.gold },
  { from: 29, to: 32, text: "TENSIÓN 0 %", color: E.gold },
  { from: 47, to: 53, text: "¡AGARRATE!", color: E.red },
  { from: 55, to: 59, text: "PULSO ↑", color: E.red },
  { from: 64, to: 69, text: "HIPÓTESIS", color: E.gold },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

// Momentos del salto: al principio (fotograma 0 ya en acción), al tensarse y en «notar»
const JOLTS = () => [0.12, sec(52), JOLT_END()];

// Monitor: tensión (dorada) y pulso (roja)
const tension = (t: number) => {
  let base = 0.35;
  if (t >= sec(29)) base = interpolate(t, [sec(29), sec(29) + 0.25], [0.35, 0.02], opt);
  if (t >= sec(47)) base = interpolate(t, [sec(47), sec(47) + 0.3], [0.02, 0.85], opt);
  if (t >= sec(59)) base = interpolate(t, [sec(59), sec(64)], [0.85, 0.3], opt);
  let v = base + 0.03 * Math.sin(t * 5);
  for (const e of JOLTS()) v += 0.9 * gauss(t, e, 0.12);
  return v;
};
const pulse = (t: number) => {
  const a = sec(55);
  const b = sec(64);
  const rate = (x: number) => (x < a ? 1.1 : x < b ? 2.2 : 1.1);
  const phase = t < a ? 1.1 * t : t < b ? 1.1 * a + 2.2 * (t - a) : 1.1 * a + 2.2 * (b - a) + 1.1 * (t - b);
  const p = phase - Math.floor(phase);
  let v = 0.08 + 0.75 * gauss(p, 0.1, 0.03) - 0.25 * gauss(p, 0.16, 0.03);
  for (const e of JOLTS()) v += 0.6 * gauss(t, e, 0.12);
  return v * (rate(t) > 2 ? 1.15 : 1);
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
      <polyline points={line(tension, 1390)} fill="none" stroke={E.gold} strokeWidth={4} strokeLinejoin="round" />
      <polyline points={line(pulse, 1428)} fill="none" stroke={E.red2} strokeWidth={4} strokeLinejoin="round" />
      <text x={950} y={1394} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={E.gold}>
        tensión
      </text>
      <text x={950} y={1432} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={E.red2}>
        pulso
      </text>
    </svg>
  );
};

// Subtítulos por frase: palabra a palabra, la que suena en negrita blanca, la clave enmarcada en rojo
const Captions: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= sec(i)) cur = i;
  if (cur < 0) return null;
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
        const box = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 } });
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>
            {KEY.has(i) ? (
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

export const Salto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);

  // Cámara: transición de 12 frames + deriva lenta
  const ck = pick(CAMERA, t);
  const prev = CAMERA[Math.max(0, ck - 1)];
  const curCam = CAMERA[ck];
  const cp = ck === 0 ? 1 : interpolate(frame, [w(curCam.at) - 2, w(curCam.at) + 10], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const s = (prev.s + (curCam.s - prev.s) * cp) * (1 + 0.012 * Math.sin(t * 0.9));
  const fx = prev.p.x + (curCam.p.x - prev.p.x) * cp;
  const fy = prev.p.y + (curCam.p.y - prev.p.y) * cp;

  // Saltos: el cuerpo se despega del colchón y la cámara tiembla
  const joltFrames = JOLTS().map((x) => Math.round(x * fps));
  const jump = Math.max(...joltFrames.map((j) => interpolate(frame - j, [-2, 2, 7, 14], [0, 1, 0.25, 0], opt)));
  const shake = joltFrames.reduce((acc, j) => acc + interpolate(frame - j, [0, 2, 4, 6, 8], [0, 16, -11, 6, 0], opt), 0);
  const awake = joltFrames.some((j) => frame >= j - 1 && frame < j + 22);

  // Estado de Hookie
  const tense = frame >= w(47) && frame < w(59);
  const half = frame >= w(32) && frame < w(41);
  const expr = awake ? "surprised" : tense ? "strain" : "normal";
  const blink = awake || tense ? 0 : half ? 0.55 : 1;
  // brazo de arriba: apoyado en la manta; se afloja (cae) en «aflojan»; se agarra (sube y tiembla) al tensarse; vuela en cada salto
  const arm = awake ? 70 : tense ? 40 + 8 * Math.sin(t * 20) : frame >= w(29) && frame < w(47) ? -14 : -4;
  const outline = interpolate(frame, [w(47), w(47) + 5, w(59) - 4, w(59)], [0, 1, 1, 0], opt);
  const heart = frame >= w(53) && frame < w(64) ? spring({ frame: frame - w(53), fps, config: { damping: 12 } }) : 0;
  const heartBeat = 1 + 0.25 * Math.max(0, pulse(t) - 0.1);

  // Diana
  const tk = pick(TARGET, t);
  const tPrev = TARGET[Math.max(0, tk - 1)].p;
  const tCur = TARGET[tk].p;
  const tp = tk === 0 ? 1 : interpolate(frame, [w(TARGET[tk].at), w(TARGET[tk].at) + 8], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const rx = tPrev.x + (tCur.x - tPrev.x) * tp;
  const ry = tPrev.y + (tCur.y - tPrev.y) * tp;

  // Globo: una pesadilla (Hookie cayendo de un precipicio) que se tacha en «no»
  const bubble = frame >= w(14) && frame < w(22) ? spring({ frame: frame - w(14), fps, config: { damping: 13 } }) : 0;
  const cross = interpolate(frame, [w(16), w(16) + 6], [0, 1], opt);
  // Inserto: lo que cree el cerebro → CAÍDA
  const inset = frame >= w(39) && frame < w(45) ? spring({ frame: frame - w(39), fps, config: { damping: 14 } }) : 0;
  const fallY = interpolate(frame, [w(41), w(44)], [0, 1], opt);

  const ti = pick(TITLES, t);
  const titleIn = ti === 0 ? 1 : interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt); // legible ya en el fotograma 0
  const label = LABELS.find((l) => frame >= w(l.from) && frame < w(l.to));
  const labelIn = label ? spring({ frame: frame - w(label.from), fps, config: { damping: 12, stiffness: 240 } }) : 0;

  return (
    <AbsoluteFill style={{ background: E.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(237,230,218,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(237,230,218,0.035) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

      {/* Ilustración con cámara */}
      <div style={{ position: "absolute", left: 0, top: SCENE_TOP - 90, width: 1080, height: 810, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 90, width: 1080, height: 720, transformOrigin: "0 0", transform: `translate(${VIEW.x - fx * s + shake}px, ${VIEW.y - fy * s}px) scale(${s})` }}>
          <Bed t={t} expr={expr} blink={blink} arm={arm} jump={jump} outline={outline} heart={heart} heartBeat={heartBeat} />
          <Reticle x={rx} y={ry - 38 * jump} pulse={Math.sin(t * 6)} opacity={1} />
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
        <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", whiteSpace: "pre-line", fontFamily: SANS, fontWeight: 800, fontSize: 54, lineHeight: 1.05, letterSpacing: "0.1em", color: label.color, scale: `${1.15 - 0.15 * labelIn}`, opacity: labelIn, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>
          {label.text}
        </div>
      ) : null}

      {/* Globo de pensamiento: la pesadilla que no es */}
      {bubble > 0 ? (
        <div style={{ position: "absolute", left: 600, top: 470, width: 300, height: 250, scale: `${bubble}`, transformOrigin: "20% 100%" }}>
          <svg width={300} height={250} viewBox="0 0 300 250" style={{ position: "absolute", inset: 0 }}>
            <path d="M70 170 C12 170 12 92 64 90 C58 36 138 24 156 64 C184 18 270 40 248 102 C294 124 270 182 224 170 Z" fill={E.cream} stroke={E.line} strokeWidth={8} />
            <circle cx={46} cy={210} r={13} fill={E.cream} stroke={E.line} strokeWidth={6} />
            <circle cx={22} cy={238} r={8} fill={E.cream} stroke={E.line} strokeWidth={5} />
            <path d="M84 150 L84 92 L150 92" stroke={E.line} strokeWidth={8} fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 250, overflow: "hidden", clipPath: "inset(30px 40px 70px 70px round 30px)" }}>
            <Gancho x={175} y={175 + ((frame * 3) % 60)} scale={0.2} t={t} expr="surprised" armL={160} armR={160} />
          </div>
          <svg width={300} height={250} viewBox="0 0 300 250" style={{ position: "absolute", inset: 0 }}>
            <line x1={80} y1={56} x2={80 + 150 * cross} y2={56 + 110 * cross} stroke={E.red} strokeWidth={12} strokeLinecap="round" />
            <line x1={230} y1={56} x2={230 - 150 * cross} y2={56 + 110 * cross} stroke={E.red} strokeWidth={12} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}

      {/* Inserto «lo que cree el cerebro» */}
      {inset > 0 ? (
        <div style={{ position: "absolute", left: 80, top: 500, display: "flex", gap: 20, alignItems: "flex-start", opacity: inset, scale: `${0.9 + 0.1 * inset}`, transformOrigin: "left top" }}>
          <div style={{ position: "relative", width: 300, height: 190, border: `5px solid ${E.red}`, background: "#2B2622", overflow: "hidden" }}>
            <svg width={300} height={190} style={{ position: "absolute", inset: 0 }}>
              {[0, 1, 2, 3].map((k) => {
                const y = ((k * 60 - fallY * 400) % 240 + 240) % 240 - 30;
                return <line key={k} x1={40 + k * 70} y1={y} x2={40 + k * 70} y2={y + 40} stroke={E.dim} strokeWidth={4} strokeLinecap="round" />;
              })}
            </svg>
            <Gancho x={150} y={150 + 20 * Math.sin(t * 8)} scale={0.24} t={t} expr="surprised" armL={165} armR={165} />
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: "0.08em", lineHeight: 1.2, color: E.red }}>
            LO QUE CREE
            <br />
            EL CEREBRO
            {frame >= w(44) ? <div style={{ marginTop: 10, fontSize: 40, color: E.text }}>CAÍDA</div> : null}
          </div>
        </div>
      ) : null}

      <Captions t={t} frame={frame} fps={fps} />
      <Monitor t={t} />

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_salto.wav")} />
      {joltFrames.map((j) => (
        <Sequence key={`h${j}`} name="Golpe" from={Math.max(0, j)} durationInFrames={18} premountFor={fps}>
          <Audio src={staticFile("sfx/hit.wav")} volume={0.4} />
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
      <Sequence name="Pop corazón" from={w(53)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- portada (1080 × 1920): el salto, sin revelar el nombre ni la explicación ----------
export const SaltoPortada: React.FC = () => (
  <AbsoluteFill style={{ background: E.bg }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
    <div style={{ position: "absolute", left: 0, top: 580, width: 1080, height: 820, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 720, transformOrigin: "0 0", transform: `translate(${540 - SPOT.head.x * 1.35}px, ${420 - SPOT.head.y * 1.35}px) scale(1.35)` }}>
        <Bed t={1.2} expr="surprised" blink={0} arm={70} jump={1} outline={0} heart={0} heartBeat={1} />
        <Reticle x={SPOT.crown.x} y={SPOT.crown.y - 38} pulse={0} opacity={1} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 78, top: 300, width: 860 }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 44, color: E.dim }}>hookie, durmiéndose</div>
      <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1.02, letterSpacing: "-0.02em", color: E.text }}>
        ¿Por qué <span style={{ color: E.red }}>saltás</span>
        <br />
        al dormirte?
      </div>
    </div>
  </AbsoluteFill>
);
