import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-cosquillas.json";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { E, Reticle } from "../Reflejo/scene";
import { SPOT, Sofa, type Face } from "./scene";

// Reel "¿Por qué no puedes hacerte cosquillas?" — Hook House (guion-cosquillas.md · skill formula-viral).
// Aspecto parecido a Reflejo (escena ilustrada única, diana roja, cámara que se mueve), sin el monitor de líneas,
// y con todo el texto dentro de la zona segura de TikTok (y 230–1400, sin pisar la columna de botones de la derecha).
// Locución: Rodrigo Zabú (eleven_v4, toma 1) en public/audio/voz_cosquillas.wav; tiempos de Scribe.

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const cosquillasDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const SCENE_TOP = 470; // la ilustración ocupa y 470–1190
const VIEW = { x: 520, y: 340 }; // centro del encuadre (un poco a la izquierda: a la derecha están los botones de TikTok)

// Palabras clave enmarcadas (una por frase como mucho)
const KEY = new Set([5, 10, 21, 27, 34, 47, 52, 60, 68, 86]);

const BETWEEN = { x: 510, y: 340 };
const CAMERA: { at: number; s: number; p: { x: number; y: number } }[] = [
  { at: 0, s: 2.1, p: SPOT.hand },
  { at: 3, s: 2.0, p: SPOT.head },
  { at: 5, s: 1.9, p: SPOT.foot },
  { at: 9, s: 1.05, p: SPOT.wide },
  { at: 13, s: 1.5, p: SPOT.foot },
  { at: 18, s: 1.7, p: SPOT.head },
  { at: 22, s: 1.05, p: SPOT.wide },
  { at: 28, s: 1.8, p: SPOT.foot },
  { at: 32, s: 2.0, p: SPOT.head },
  { at: 35, s: 1.25, p: BETWEEN },
  { at: 53, s: 1.0, p: SPOT.wide },
];

const TARGET: { at: number; p: { x: number; y: number } }[] = [
  { at: 0, p: SPOT.hand },
  { at: 5, p: SPOT.foot },
  { at: 28, p: SPOT.foot },
  { at: 32, p: SPOT.head },
  { at: 38, p: SPOT.hand },
  { at: 41, p: SPOT.head },
];

const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "persona, haciéndose cosquillas", sub: "intento número mil" },
  { at: 11, title: "otra persona, el mismo toque", sub: "misma mano, otra historia" },
  { at: 28, title: "piel, inocente", sub: "el problema está más arriba" },
  { at: 35, title: "cerebro, adelantándose", sub: "ya sabía lo que venía" },
  { at: 61, title: "video, predecible", sub: "nadie se ríe de lo que espera" },
  { at: 73, title: "hook house", sub: "edición que no se ve venir" },
];

const LABELS: { from: number; to: number; text: string; color: string }[] = [
  { from: 5, to: 9, text: "COSQUILLAS", color: E.red },
  { from: 10, to: 11, text: "NADA", color: E.gold },
  { from: 15, to: 18, text: "MISMO TOQUE", color: E.red },
  { from: 21, to: 22, text: "RISA", color: E.red },
  { from: 22, to: 24, text: "MISMO TOQUE", color: E.gold },
  { from: 24, to: 26, text: "MISMA FUERZA", color: E.gold },
  { from: 26, to: 28, text: "¿QUÉ CAMBIA?", color: E.red },
  { from: 28, to: 32, text: "NO ES LA PIEL", color: E.gold },
  { from: 32, to: 35, text: "CEREBRO", color: E.red },
  { from: 41, to: 48, text: "PREDICCIÓN", color: E.red },
  { from: 50, to: 53, text: "VOLUMEN 0 %", color: E.gold },
  { from: 58, to: 59, text: "PREDECIBLE", color: E.gold },
  { from: 59, to: 61, text: "IGNORADO", color: E.red },
  { from: 66, to: 73, text: "SE VE VENIR", color: E.gold },
  { from: 74, to: 89, text: "HOOK HOUSE", color: E.gold },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};

// Subtítulos por frase: palabra a palabra, la que suena en negrita blanca, la clave enmarcada en rojo. Sin puntos ni comas.
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
    <div style={{ position: "absolute", top: 1236, left: 80, right: 180, textAlign: "center", fontFamily: SANS, fontSize: 64, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
      {words.map((i) => {
        const local = frame - Math.round(sec(i) * fps);
        const p = interpolate(local, [0, 4], [0, 1], opt);
        const isCur = i === cur;
        const key = KEY.has(i);
        const box = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 } });
        const text = caps[i].text.replace(/[.,…]/g, "");
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>
            {key ? (
              <span style={{ position: "relative", display: "inline-block", padding: "0 10px", margin: "0 2px", border: `3px solid ${E.red}`, borderRadius: 4, fontWeight: 700, color: "#fff", scale: `${0.9 + 0.1 * box}` }}>
                {text}
                <span style={{ position: "absolute", left: -8, top: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
                <span style={{ position: "absolute", right: -8, bottom: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
              </span>
            ) : (
              <span style={{ fontWeight: isCur ? 700 : 500, color: isCur ? "#fff" : "#D8D1C6" }}>{text}</span>
            )}{" "}
          </span>
        );
      })}
    </div>
  );
};

const Clock: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={72} height={72} viewBox="-36 -36 72 72" style={{ position: "absolute", left: 850, top: 250 }}>
    <circle r={31} fill="none" stroke={E.text} strokeWidth={3.5} />
    <line x1={0} y1={0} x2={0} y2={-16} stroke={E.text} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${frame * 0.8})`} />
    <line x1={0} y1={0} x2={0} y2={-24} stroke={E.text} strokeWidth={3} strokeLinecap="round" transform={`rotate(${frame * 9})`} />
  </svg>
);

// Globo de pensamiento con la predicción: un pie con ondas grises y un ✓
const Prediction: React.FC<{ s: number; t: number }> = ({ s, t }) => (
  <svg width={420} height={350} viewBox="0 0 300 250" style={{ position: "absolute", left: 470, top: 440, scale: `${s}`, transformOrigin: "0% 100%", opacity: s }}>
    <path d="M70 170 C15 170 15 90 65 88 C60 35 140 25 155 62 C185 18 270 40 248 100 C290 122 268 178 225 168 Z" fill={E.cream} stroke={E.line} strokeWidth={8} />
    <circle cx={45} cy={205} r={13} fill={E.cream} stroke={E.line} strokeWidth={6} />
    <circle cx={20} cy={235} r={7} fill={E.cream} stroke={E.line} strokeWidth={5} />
    <ellipse cx={120} cy={118} rx={22} ry={34} transform="rotate(-30 120 118)" fill={E.skin} stroke={E.line} strokeWidth={5} />
    {[0, 1].map((k) => (
      <path key={k} d={`M${155 + k * 18 + 3 * Math.sin(t * 8)} 95 l8 -7 l8 7 l8 -7`} stroke={E.dim} strokeWidth={5} fill="none" strokeLinecap="round" />
    ))}
    <path d="M178 130 l14 14 l26 -30" stroke={E.green} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Volumen que baja a cero
const Volume: React.FC<{ s: number; level: number }> = ({ s, level }) => (
  <div style={{ position: "absolute", left: 470, top: 500, display: "flex", transform: "scale(1.4)", transformOrigin: "left top", alignItems: "flex-end", gap: 14, padding: "22px 28px", background: "#2B2622", border: `5px solid ${E.gold}`, borderRadius: 18, opacity: s, scale: `${0.85 + 0.15 * s}` }}>
    <svg width={70} height={70} viewBox="0 0 70 70">
      <path d="M8 26 h14 l18 -16 v50 l-18 -16 h-14 Z" fill={E.text} />
      {level < 0.05 ? <path d="M48 24 l16 22 M64 24 l-16 22" stroke={E.red} strokeWidth={6} strokeLinecap="round" /> : null}
    </svg>
    {[0, 1, 2, 3, 4].map((k) => (
      <div key={k} style={{ width: 34, height: 26 + k * 18, borderRadius: 6, background: k < Math.ceil(level * 5) ? E.gold : "rgba(237,230,218,0.15)" }} />
    ))}
  </div>
);

// Móvil que sube al final: feed predecible (tarjetas grises iguales) → golpe inesperado → DM con "HOOK"
const Phone: React.FC<{ y: number; frame: number; odd: number; dm: number; sent: number }> = ({ y, frame, odd, dm, sent }) => {
  const H = 150;
  return (
    <div style={{ position: "absolute", left: 340, top: y, width: 360, height: 660, borderRadius: 48, background: E.line, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", padding: 18 }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: "#2B2622" }}>
        {dm < 1 ? (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - dm }}>
            {Array.from({ length: 6 }, (_, k) => {
              const top = ((k * H - frame * 3) % (5 * H) + 5 * H) % (5 * H) - H + 20;
              return <div key={k} style={{ position: "absolute", left: 20, right: 20, top, height: H - 20, borderRadius: 16, background: "#5A524B" }} />;
            })}
            {odd > 0 ? (
              <div style={{ position: "absolute", left: 20, right: 20, top: 200, height: 220, borderRadius: 20, background: E.red, scale: `${odd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: E.gold }} />
              </div>
            ) : null}
          </div>
        ) : null}
        {dm > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: dm, fontFamily: SANS }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "26px 22px", borderBottom: "2px solid rgba(237,230,218,0.1)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: E.green }} />
              <div style={{ color: E.text, fontWeight: 700, fontSize: 26 }}>hook house</div>
            </div>
            <div style={{ position: "absolute", right: 22, top: 300, padding: "16px 28px", borderRadius: 26, background: E.green, color: "#fff", fontWeight: 800, fontSize: 40, scale: `${sent}`, transformOrigin: "right center" }}>HOOK</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Cosquillas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);
  const end = endStart(fps);
  const between = (a: number, b: number) => frame >= w(a) && frame < w(b);

  // Cámara: los primeros cambios son casi cortes (4 frames) para enganchar; luego transiciones de 12 frames
  const ck = pick(CAMERA, t);
  const prev = CAMERA[Math.max(0, ck - 1)];
  const curCam = CAMERA[ck];
  const dur = curCam.at <= 5 ? 4 : 12;
  const cp = ck === 0 ? 1 : interpolate(frame, [w(curCam.at) - 2, w(curCam.at) - 2 + dur], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const s = (prev.s + (curCam.s - prev.s) * cp) * (1 + 0.012 * Math.sin(t * 0.9)) * (1 + 0.04 * Math.max(0, 1 - frame / 10));
  const fx = prev.p.x + (curCam.p.x - prev.p.x) * cp;
  const fy = prev.p.y + (curCam.p.y - prev.p.y) * cp;
  const shake = (e: number) => interpolate(frame - w(e), [0, 2, 4, 6, 8], [0, 14, -10, 6, 0], opt);
  const jolt = shake(21) + shake(81);

  const tk = pick(TARGET, t);
  const tPrev = TARGET[Math.max(0, tk - 1)].p;
  const tCur = TARGET[tk].p;
  const tp = tk === 0 ? 1 : interpolate(frame, [w(TARGET[tk].at), w(TARGET[tk].at) + 8], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const rx = tPrev.x + (tCur.x - tPrev.x) * tp;
  const ry = tPrev.y + (tCur.y - tPrev.y) * tp;
  const reticleOn = interpolate(frame, [w(61), w(61) + 6], [1, 0], opt);

  // Estado de la escena
  const laughing = between(18, 26);
  const face: Face = laughing ? "laugh" : between(26, 35) ? "think" : "flat";
  const other = between(11, 28) ? spring({ frame: frame - w(13), fps, config: { damping: 14 } }) * interpolate(frame, [w(26), w(27)], [1, 0], opt) : 0;
  const ownWiggle = between(11, 38) ? 0 : 34;
  const waves = between(15, 26) ? interpolate(frame, [w(15), w(15) + 6], [0, 1], opt) : 0;
  const mute = between(9, 11) ? 0.6 : between(41, 53) ? interpolate(frame, [w(50), w(52)], [0.7, 0], opt) : 0;
  const outline = interpolate(frame, [w(38), w(38) + 5, w(41) - 3, w(41)], [0, 1, 1, 0], opt);
  const grey = interpolate(frame, [w(60), w(60) + 8], [0, 0.85], opt);

  const bubble = between(41, 48) ? spring({ frame: frame - w(41), fps, config: { damping: 13 } }) : 0;
  const vol = between(48, 53) ? spring({ frame: frame - w(48), fps, config: { damping: 14 } }) : 0;
  const level = interpolate(frame, [w(50), w(52)], [1, 0], opt);

  const phoneIn = frame >= w(63) ? spring({ frame: frame - w(63), fps, config: { damping: 15 } }) : 0;
  const phoneY = 1300 - 760 * phoneIn;
  const odd = frame >= w(81) ? spring({ frame: frame - w(81), fps, config: { damping: 9, stiffness: 220 } }) : 0;
  const dm = interpolate(frame, [w(85) - 4, w(85) + 2], [0, 1], opt);
  const sent = spring({ frame: frame - w(86), fps, config: { damping: 12, stiffness: 200 } });

  const ti = pick(TITLES, t);
  const titleIn = interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt);
  const label = LABELS.find((l) => between(l.from, l.to));
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
      <div style={{ position: "absolute", left: 0, top: SCENE_TOP - 90, width: 1080, height: 810, overflow: "hidden", filter: `grayscale(${grey}) brightness(${1 - 0.35 * grey})` }}>
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
          <Sofa t={t} face={face} shake={laughing ? 1 : 0} ownWiggle={ownWiggle} other={other} waves={waves} mute={mute} outline={outline} />
          <Reticle x={rx} y={ry} pulse={Math.sin(t * 6)} opacity={reticleOn} />
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
      <div style={{ position: "absolute", left: 78, top: 250, opacity: titleIn }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: E.text }}>{TITLES[ti].title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: E.dim, marginTop: 4 }}>{TITLES[ti].sub}</div>
      </div>
      <Clock frame={frame} />

      {/* Etiqueta de acción */}
      {label ? (
        <div
          style={{
            position: "absolute",
            top: 390,
            left: 40,
            right: 120,
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 58,
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

      {bubble > 0 ? <Prediction s={bubble} t={t} /> : null}
      {vol > 0 ? <Volume s={vol} level={level} /> : null}
      {phoneIn > 0 ? <Phone y={phoneY} frame={frame} odd={odd} dm={dm} sent={frame >= w(86) ? sent : 0} /> : null}

      <Captions t={t} frame={frame} fps={fps} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_cosquillas.wav")} />
      <Sequence name="Risa" from={w(18)} durationInFrames={70} premountFor={fps}>
        <Audio src={staticFile("sfx/risa.wav")} volume={0.45} />
      </Sequence>
      {[21, 81].map((i) => (
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
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.2} />
        </Sequence>
      ))}
      {[41, 63, 86].map((i) => (
        <Sequence key={`p${i}`} name="Pop" from={w(i)} durationInFrames={12} premountFor={fps}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.32} />
        </Sequence>
      ))}
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
    <AbsoluteFill style={{ background: E.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: sIn, paddingBottom: 200 }}>
      <Wordmark size={150} color={E.text} houseOpacity={house} dot={dot} />
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: E.text, opacity: house }}>edición que retiene</div>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.08em", color: E.dim, opacity: house }}>ESCRÍBEME «HOOK» POR DM</div>
    </AbsoluteFill>
  );
};
