import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-puerta.json";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { E, Reticle } from "../Reflejo/scene";
import { DOOR, FLOOR, Rooms, SPOT, headOf, type Bubble, type Face } from "./scene";

// Reel "El efecto puerta" — Hook House (guion-puerta.md · skill formula-viral).
// Mismo lenguaje que Cosquillas: escena ilustrada única, diana roja, cámara que se mueve, subtítulos solo abajo
// y todo dentro de la zona segura de TikTok. Gancho: en el primer segundo la persona va directa a la puerta con
// un vaso en la cabeza y, al decir "borra", el globo estalla en pedazos (golpe + destello + sacudida).

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const puertaDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const SCENE_TOP = 470;
const VIEW = { x: 520, y: 340 };

// Palabras clave enmarcadas (una por frase como mucho)
const KEY = new Set([7, 15, 19, 24, 29, 36, 57, 62, 70, 80, 91, 93]);

type P = { x: number; y: number } | "person";
const CAMERA: { at: number; s: number; p: P }[] = [
  { at: 0, s: 1.95, p: "person" },
  { at: 2, s: 1.9, p: { x: 540, y: 300 } },
  { at: 5, s: 1.35, p: SPOT.door },
  { at: 7, s: 1.9, p: "person" },
  { at: 10, s: 1.3, p: SPOT.kitchen },
  { at: 16, s: 2.1, p: "person" },
  { at: 20, s: 1.6, p: "person" },
  { at: 26, s: 1.6, p: SPOT.door },
  { at: 30, s: 1.0, p: SPOT.wide },
  { at: 43, s: 1.25, p: SPOT.hall },
  { at: 52, s: 1.6, p: SPOT.door },
  { at: 58, s: 1.0, p: SPOT.wide },
];

const TARGET: { at: number; p: { x: number; y: number } }[] = [
  { at: 0, p: SPOT.door },
  { at: 26, p: SPOT.door },
  { at: 43, p: SPOT.hall },
  { at: 52, p: SPOT.door },
];

const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "persona, yendo a la cocina", sub: "con una misión clarísima" },
  { at: 10, title: "persona, en la cocina", sub: "la misión, desaparecida" },
  { at: 26, title: "puerta, culpable", sub: "tiene nombre" },
  { at: 30, title: "cerebro, cerrando capítulo", sub: "lo de antes, al archivo" },
  { at: 43, title: "pasillo, inocente", sub: "pasa en el umbral" },
  { at: 58, title: "video, lleno de puertas", sub: "cada corte, un umbral" },
  { at: 81, title: "hook house", sub: "edición que deja algo pendiente" },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};

// Posición de la persona: camina hacia la puerta, la cruza al decir "cruzas" y se para frente a la nevera
const personAt = (t: number) => {
  const keys: [number, number][] = [
    [0, 330],
    [sec(5), 470],
    [sec(8), 650],
    [sec(13), 740],
  ];
  return interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), opt);
};

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
    <div style={{ position: "absolute", top: 1236, left: 80, right: 180, textAlign: "center", fontFamily: SANS, fontSize: 74, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
      {words.map((i) => {
        const local = frame - Math.round(sec(i) * fps);
        const p = interpolate(local, [0, 4], [0, 1], opt);
        const isCur = i === cur;
        const key = KEY.has(i);
        const box = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 } });
        const text = caps[i].text.replace(/[.,:…]/g, "");
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

// Libro que se cierra ("cierra un capítulo") y cae en una caja de archivo ("archiva")
const Book: React.FC<{ s: number; close: number; file: number }> = ({ s, close, file }) => (
  <svg width={420} height={380} viewBox="0 0 420 380" style={{ position: "absolute", left: 60, top: 470, opacity: s, scale: `${0.8 + 0.2 * s}` }}>
    {/* Caja de archivo */}
    <g opacity={Math.min(1, file * 3)}>
      <path d="M90 250 L330 250 L310 370 L110 370 Z" fill={E.wood} stroke={E.line} strokeWidth={8} strokeLinejoin="round" />
      <rect x={180} y={290} width={60} height={22} rx={6} fill={E.cream} stroke={E.line} strokeWidth={5} />
    </g>
    <g transform={`translate(0 ${200 * Easing.in(Easing.quad)(file)}) scale(${1 - 0.45 * file})`} style={{ transformOrigin: "210px 140px" }}>
      {/* Página izquierda */}
      <path d="M210 60 L70 50 L70 220 L210 232 Z" fill="#F7F4EC" stroke={E.line} strokeWidth={8} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={92} y1={90 + k * 30} x2={190} y2={96 + k * 30} stroke={E.dim} strokeWidth={5} />
      ))}
      {/* Página derecha que se cierra sobre la izquierda */}
      <g transform={`translate(210 0) scale(${1 - 2 * close} 1) translate(-210 0)`}>
        <path d="M210 60 L350 50 L350 220 L210 232 Z" fill={close > 0.5 ? E.red : "#F7F4EC"} stroke={E.line} strokeWidth={8} strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

// Marca ✗ / ✓ sobre el pasillo y la puerta (coordenadas de escena)
const Mark: React.FC<{ x: number; y: number; ok: boolean; s: number }> = ({ x, y, ok, s }) =>
  s > 0 ? (
    <g transform={`translate(${x} ${y - 190}) scale(${s})`}>
      <circle r={50} fill={ok ? E.green : E.red} stroke={E.line} strokeWidth={7} />
      {ok ? (
        <path d="M-22 2 L-6 18 L24 -16" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M-20 -20 L20 20 M20 -20 L-20 20" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
      )}
    </g>
  ) : null;

const Clip: React.FC<{ color: string; dot: string }> = ({ color, dot }) => (
  <div style={{ width: 92, height: 150, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: dot }} />
  </div>
);

const DoorIcon: React.FC<{ s: number }> = ({ s }) => (
  <svg width={34} height={64} viewBox="0 0 34 64" style={{ scale: `${s}` }}>
    <rect x={3} y={3} width={28} height={58} rx={3} fill={E.wood} stroke={E.text} strokeWidth={4} />
    <circle cx={23} cy={34} r={3} fill={E.gold} />
  </svg>
);

const Loop: React.FC<{ s: number; shatter?: number }> = ({ s, shatter = 0 }) =>
  s > 0 ? (
    <div style={{ position: "relative", width: 64, height: 56, scale: `${s}` }}>
      {shatter > 0 ? (
        Array.from({ length: 6 }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: 26 + Math.cos(k) * 50 * shatter, top: 20 + Math.sin(k) * 40 * shatter + 40 * shatter * shatter, width: 12, height: 12, background: E.cream, opacity: 1 - shatter, rotate: `${k * 60 + 300 * shatter}deg` }} />
        ))
      ) : (
        <div style={{ width: 64, height: 56, borderRadius: "50%", background: E.cream, border: `4px solid ${E.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 36, color: E.line }}>?</div>
      )}
    </div>
  ) : null;

// Móvil del tramo final: cortes = puertas → la pregunta se rompe y el espectador se va → cada corte con algo pendiente → DM
const Phone: React.FC<{ y: number; frame: number; w: (i: number) => number; fps: number }> = ({ y, frame, w, fps }) => {
  const sp = (i: number, damping = 12) => (frame >= w(i) ? spring({ frame: frame - w(i), fps, config: { damping, stiffness: 220 } }) : 0);
  const doors = sp(62);
  const loop1 = frame < w(81) ? sp(66) : 0;
  const shatter = interpolate(frame, [w(74), w(74) + 14], [0, 1], opt);
  const swipe = interpolate(frame, [w(78), w(80)], [0, 1], { ...opt, easing: Easing.in(Easing.cubic) });
  const good = frame >= w(81) && frame < w(92);
  const loops = sp(89);
  const dm = interpolate(frame, [w(92) - 4, w(92) + 2], [0, 1], opt);
  const sent = sp(93);
  const clips = [
    [E.red, E.gold],
    ["#3B4A63", E.cream],
    [E.gold, E.red],
  ];
  return (
    <div style={{ position: "absolute", left: 300, top: y, width: 420, height: 680, borderRadius: 52, background: E.line, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", padding: 18 }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "#2B2622" }}>
        {dm < 1 ? (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - dm, transform: `translateY(${-110 * (good ? 0 : swipe)}%)` }}>
            <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 18, letterSpacing: "0.1em", color: E.dim }}>
              {good ? "EDITADO POR HOOK HOUSE" : "TU VIDEO"}
            </div>
            <div style={{ position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
              {clips.map(([c, d], k) => (
                <React.Fragment key={k}>
                  {k > 0 ? (
                    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                      <DoorIcon s={doors} />
                      <div style={{ position: "absolute", top: -78 }}>{good ? <Loop s={loops} /> : k === 1 ? <Loop s={loop1} shatter={shatter} /> : null}</div>
                    </div>
                  ) : null}
                  <Clip color={c} dot={d} />
                </React.Fragment>
              ))}
            </div>
            {/* Espectador */}
            <div style={{ position: "absolute", bottom: 90, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 70, height: 70, borderRadius: "50%", background: E.skin, border: `5px solid ${E.text}` }} />
            </div>
          </div>
        ) : null}
        {dm > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: dm, fontFamily: SANS }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "28px 24px", borderBottom: "2px solid rgba(237,230,218,0.1)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: E.green }} />
              <div style={{ color: E.text, fontWeight: 700, fontSize: 28 }}>hook house</div>
            </div>
            <div style={{ position: "absolute", right: 24, top: 320, padding: "18px 32px", borderRadius: 28, background: E.green, color: "#fff", fontWeight: 800, fontSize: 46, scale: `${sent}`, transformOrigin: "right center" }}>HOOK</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Puerta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (i: number) => Math.round(sec(i) * fps);
  const end = endStart(fps);
  const between = (a: number, b: number) => frame >= w(a) && frame < w(b);

  const px = personAt(t);
  const moving = t < sec(13);
  const walk = moving ? t * 9 : 0;
  const personFocus = { x: px + 70, y: headOf(px).y - 95 };
  const resolve = (p: P) => (p === "person" ? personFocus : p);

  // Cámara: casi cortes en el gancho (4 frames), luego transiciones de 12 frames
  const ck = pick(CAMERA, t);
  const prev = CAMERA[Math.max(0, ck - 1)];
  const curCam = CAMERA[ck];
  const dur = curCam.at <= 10 ? 4 : 12;
  const cp = ck === 0 ? 1 : interpolate(frame, [w(curCam.at) - 2, w(curCam.at) - 2 + dur], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const pa = resolve(prev.p);
  const pb = resolve(curCam.p);
  // Empuje de entrada: el primer frame ya está en movimiento
  const push = 1 + 0.18 * interpolate(frame, [0, 14], [1, 0], { ...opt, easing: Easing.out(Easing.cubic) });
  const shatterF = w(7);
  const punch = 1 + 0.12 * interpolate(frame - shatterF, [0, 3, 12], [0, 1, 0], opt);
  const s = (prev.s + (curCam.s - prev.s) * cp) * (1 + 0.012 * Math.sin(t * 0.9)) * push * punch;
  const fx = pa.x + (pb.x - pa.x) * cp;
  const fy = pa.y + (pb.y - pa.y) * cp;
  const shake = (e: number, a = 1) => a * interpolate(frame - e, [0, 2, 4, 6, 8, 10], [0, 18, -14, 9, -4, 0], opt);
  const jolt = shake(shatterF) + shake(w(74), 0.6);

  const tk = pick(TARGET, t);
  const tPrev = TARGET[Math.max(0, tk - 1)].p;
  const tCur = TARGET[tk].p;
  const tp = tk === 0 ? 1 : interpolate(frame, [w(TARGET[tk].at), w(TARGET[tk].at) + 8], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const rx = tPrev.x + (tCur.x - tPrev.x) * tp;
  const ry = tPrev.y + (tCur.y - tPrev.y) * tp;
  // La diana solo aparece cuando se habla de la puerta o del pasillo
  const reticleOn = between(3, 7) || between(26, 30) || between(43, 58) ? 1 : 0;

  // Globo de pensamiento
  let bubble: Bubble = { kind: "glass", s: 0, shatter: 0 };
  if (frame < shatterF) bubble = { kind: "glass", s: 1 + 0.05 * Math.sin(t * 10), shatter: 0 };
  else if (frame < shatterF + 20) bubble = { kind: "glass", s: 1, shatter: interpolate(frame, [shatterF, shatterF + 20], [0.01, 1], opt) };
  else if (between(15, 16)) bubble = { kind: "question", s: spring({ frame: frame - w(15), fps, config: { damping: 11 } }), shatter: 0 };
  else if (between(16, 21)) bubble = { kind: "blank", s: spring({ frame: frame - w(16), fps, config: { damping: 14 } }), shatter: 0 };
  else if (between(21, 26)) bubble = { kind: "brain", s: spring({ frame: frame - w(21), fps, config: { damping: 12 } }), shatter: 0 };
  const face: Face = between(16, 26) ? "blank" : "normal";
  const flash = interpolate(frame - shatterF, [0, 1, 7], [0, 0.85, 0], opt) + interpolate(frame - w(19), [0, 2, 12], [0, 0.6, 0], opt);

  const doorGlow = Math.max(interpolate(frame, [w(3), w(3) + 3, w(5), w(5) + 4], [0, 1, 1, 0], opt), between(28, 30) ? 1 : 0, between(54, 58) ? 1 : 0);
  const leftGrey = interpolate(frame, [w(38), w(38) + 10], [0, 1], opt) * interpolate(frame, [w(58), w(58) + 8], [1, 0], opt);

  const book = between(34, 43) ? spring({ frame: frame - w(34), fps, config: { damping: 14 } }) : 0;
  const close = interpolate(frame, [w(36) - 4, w(36) + 6], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const file = interpolate(frame, [w(38), w(38) + 14], [0, 1], opt);

  const markHall = between(49, 52) ? spring({ frame: frame - w(49), fps, config: { damping: 10 } }) : 0;
  const markDoor = between(55, 58) ? spring({ frame: frame - w(55), fps, config: { damping: 10 } }) : 0;

  const phoneIn = frame >= w(59) ? spring({ frame: frame - w(59), fps, config: { damping: 15 } }) : 0;
  const phoneY = 1300 - 790 * phoneIn;

  const ti = pick(TITLES, t);
  const titleIn = interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt);

  return (
    <AbsoluteFill style={{ background: E.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(237,230,218,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(237,230,218,0.035) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />

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
          <Rooms t={t} personX={px} walk={walk} face={face} bubble={bubble} leftGrey={leftGrey} doorGlow={doorGlow} />
          <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Mark x={SPOT.hall.x} y={FLOOR - 120} ok={false} s={markHall} />
            <Mark x={(DOOR.x0 + DOOR.x1) / 2} y={FLOOR - 120} ok s={markDoor} />
          </svg>
          <Reticle x={rx} y={ry} pulse={Math.sin(t * 6)} opacity={reticleOn} />
        </div>
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      </div>

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

      <div style={{ position: "absolute", left: 78, top: 250, opacity: titleIn }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: E.text }}>{TITLES[ti].title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: E.dim, marginTop: 4 }}>{TITLES[ti].sub}</div>
      </div>
      <Clock frame={frame} />

      {book > 0 ? <Book s={book} close={close} file={file} /> : null}
      {phoneIn > 0 ? <Phone y={phoneY} frame={frame} w={w} fps={fps} /> : null}

      <Captions t={t} frame={frame} fps={fps} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      {/* Sonido */}
      <Audio src={staticFile("audio/voz_puerta.wav")} />
      <Sequence name="Cristal" from={shatterF - 1} durationInFrames={45} premountFor={fps}>
        <Audio src={staticFile("sfx/cristal.wav")} volume={0.6} />
      </Sequence>
      <Sequence name="Golpe" from={shatterF} durationInFrames={18} premountFor={fps}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.4} />
      </Sequence>
      <Sequence name="Cristal 2" from={w(74)} durationInFrames={45} premountFor={fps}>
        <Audio src={staticFile("sfx/cristal.wav")} volume={0.35} />
      </Sequence>
      {CAMERA.slice(1).map((c) => (
        <Sequence key={`w${c.at}`} name="Whoosh" from={w(c.at) - 3} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.2} />
        </Sequence>
      ))}
      <Sequence name="Whoosh swipe" from={w(78)} durationInFrames={14} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
      </Sequence>
      {[15, 21, 34, 49, 55, 62, 66, 89, 93].map((i) => (
        <Sequence key={`p${i}`} name="Pop" from={w(i)} durationInFrames={12} premountFor={fps}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
        </Sequence>
      ))}
      {[36, 38].map((i) => (
        <Sequence key={`c${i}`} name="Click" from={w(i)} durationInFrames={6} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.4} />
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
