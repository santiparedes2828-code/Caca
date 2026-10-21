import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-serial.json";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { Z } from "../Zeigarnik/scene3d";
import { BLOCK_Y, SerialScene, U, blockX, type Cam, type SerialState } from "./blocks3d";

// Reel "Efecto de posición serial" — Hook House (guion-serial.md · skill formula-viral · estilo-explicador.md en 3D).
// Locución: Rodrigo Zabú (ElevenLabs, eleven_v4, toma 2) en public/audio/voz_serial.wav; tiempos de
// src/data/captions-serial.json salen de su transcripción con Scribe (analisis8/words_serial.json).

loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-italic.woff2"), weight: "500", style: "italic" });

const caps = captionsJson as Caption[];
const sec = (i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
const END_SECONDS = 1.8;
const endStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const serialDuration = (fps: number) => endStart(fps) + Math.round(END_SECONDS * fps);

const CANVAS = { top: 300, height: 900 };
const RETICLE = { x: 540, y: CANVAS.top + CANVAS.height / 2 };

const KEY_GOLD = new Set([19, 31, 54, 57, 59, 65, 67, 68, 83]);
const KEY_RED = new Set([8, 11, 17, 44]);

const B0: [number, number, number] = [blockX(0), BLOCK_Y, 0];
const B9: [number, number, number] = [blockX(9), BLOCK_Y, 0];
const CENTER: [number, number, number] = [0, 1.2, 0];

const CAMERA: { at: number; cam: Cam; reticle: boolean }[] = [
  { at: 0, cam: { pos: [0, 3.0, 12.5], look: [0, 1.8, 0] }, reticle: false },
  { at: 8, cam: { pos: [0, 2.3, 8.2], look: CENTER }, reticle: true },
  { at: 18, cam: { pos: [B0[0] + 1.6, 2.2, 5.2], look: B0 }, reticle: true },
  { at: 30, cam: { pos: [B9[0] - 1.6, 2.2, 5.2], look: B9 }, reticle: true },
  { at: 39, cam: { pos: [0, 3.0, 9.5], look: CENTER }, reticle: false },
  { at: 48, cam: { pos: [0, 6, 13.5], look: [0, 2.4, 0] }, reticle: false },
  { at: 60, cam: { pos: [0, 5, 15], look: [0, 2.4, 0] }, reticle: false },
  { at: 66, cam: { pos: [0, 4.2, 15.5], look: [0, 2.4, 0] }, reticle: false },
];

const TITLES: { at: number; title: string; sub: string }[] = [
  { at: 0, title: "diez palabras, seguidas", sub: "una detrás de otra" },
  { at: 8, title: "memoria, filtrando", sub: "no todas se quedan" },
  { at: 18, title: "la primera", sub: "tiempo para repasarla" },
  { at: 30, title: "la última", sub: "todavía resuena" },
  { at: 39, title: "las del medio", sub: "aplastadas entre las dos" },
  { at: 48, title: "un video", sub: "principio y final" },
  { at: 60, title: "tiene nombre", sub: "psicología de la memoria" },
  { at: 66, title: "hook house", sub: "edición que retiene" },
];

const LABELS: { from: number; to: number; text: string; color: string; strike?: boolean; big?: boolean }[] = [
  { from: 3, to: 8, text: "10 PALABRAS", color: Z.gold },
  { from: 8, to: 13, text: "OLVIDADAS", color: Z.red },
  { from: 16, to: 18, text: "MALA MEMORIA", color: Z.red, strike: true },
  { from: 19, to: 26, text: "PRIMERA", color: Z.gold },
  { from: 26, to: 30, text: "REPASO", color: Z.gold },
  { from: 31, to: 34, text: "ÚLTIMA", color: Z.gold },
  { from: 34, to: 39, text: "SIGUE SONANDO", color: Z.gold },
  { from: 42, to: 48, text: "EL MEDIO SE PIERDE", color: Z.red },
  { from: 54, to: 60, text: "PRINCIPIO Y FINAL", color: Z.gold },
  { from: 62, to: 66, text: "EFECTO DE\nPOSICIÓN SERIAL", color: Z.gold, big: true },
];

const pick = <T extends { at: number }>(list: T[], t: number) => {
  let k = 0;
  for (let i = 0; i < list.length; i++) if (t >= sec(list[i].at)) k = i;
  return k;
};
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const attention = (t: number) => {
  let v = 0.3 + 0.03 * Math.sin(t * 4);
  for (const e of [sec(0) + 0.2, sec(19), sec(31), sec(44), sec(64)]) v += 0.85 * gauss(t, e, 0.12);
  return v;
};

// Monitor: atención (dorada, se desplaza) y curva de recuerdo por posición (roja, se dibuja al explicar el medio)
const Monitor: React.FC<{ t: number; curve: number }> = ({ t, curve }) => {
  const N = 140;
  const WIN = 4;
  const att = Array.from({ length: N }, (_, i) => {
    const tt = t - WIN + (WIN * i) / (N - 1);
    return `${70 + (850 * i) / (N - 1)},${1410 - Math.min(1.25, tt < 0 ? 0.1 : attention(tt)) * 70}`;
  }).join(" ");
  const pts = U.map((u, i) => `${70 + (850 * i) / 9},${1455 - u * 55}`);
  const shown = Math.max(1, Math.round(curve * 10));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={70} y1={1460} x2={920} y2={1460} stroke="rgba(237,230,218,0.12)" strokeWidth={2} />
      <polyline points={att} fill="none" stroke={Z.gold} strokeWidth={4} strokeLinejoin="round" />
      {curve > 0 ? (
        <>
          <polyline points={pts.slice(0, shown).join(" ")} fill="none" stroke={Z.red} strokeWidth={4} strokeLinejoin="round" />
          {pts.slice(0, shown).map((p, i) => {
            const [x, y] = p.split(",").map(Number);
            return <circle key={i} cx={x} cy={y} r={6} fill={Z.red} />;
          })}
        </>
      ) : (
        <line x1={70} y1={1452} x2={920} y2={1452} stroke={Z.red} strokeWidth={4} opacity={0.35} />
      )}
      <text x={932} y={1414} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={Z.gold}>
        atención
      </text>
      <text x={932} y={1454} fontFamily={SERIF} fontStyle="italic" fontSize={22} fill={Z.red}>
        recuerdo
      </text>
    </svg>
  );
};

// Subtítulos dinámicos (igual que en el reel Zeigarnik)
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
    <div style={{ position: "absolute", top: 1225, left: 60, right: 60, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 82, lineHeight: 1.08, letterSpacing: "-0.02em", textTransform: "uppercase", transform: `translateY(${(1 - blockIn) * 40}px)` }}>
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
              margin: "0 0.2em",
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

// DM con "HOOK" que aparece en la llamada a la acción
const DmBubble: React.FC<{ start: number; send: number }> = ({ start, send }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - start, fps, config: { damping: 14 } });
  const s = spring({ frame: frame - send, fps, config: { damping: 10, stiffness: 200 } });
  if (frame < start) return null;
  return (
    <div style={{ position: "absolute", top: 560, left: 150, right: 150, height: 380, borderRadius: 40, background: "rgba(22,18,16,0.92)", border: "3px solid #3A322C", opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 32px", borderBottom: "2px solid #3A322C" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: Z.green, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>h</div>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, color: Z.text }}>hookhouse</span>
      </div>
      <div style={{ position: "absolute", right: 32, bottom: 36, transformOrigin: "right bottom", transform: `scale(${s})`, opacity: frame >= send ? 1 : 0 }}>
        <div style={{ padding: "10px 40px 18px", borderRadius: "34px 34px 8px 34px", background: Z.green, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 120, lineHeight: 1, letterSpacing: "-0.05em" }}>HOOK</div>
      </div>
    </div>
  );
};

const mix = (a: [number, number, number], b: [number, number, number], p: number): [number, number, number] => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];

export const Serial: React.FC = () => {
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
  pos = [pos[0] + Math.sin(t * 0.7) * 0.5, pos[1], pos[2]];
  if (cur.at === 60) {
    const a = (frame - w(60)) * 0.04;
    pos = mix(pos, [Math.sin(a) * 13, 5, Math.cos(a) * 13], cp);
  }
  // Sacudidas: aterrizaje del primer bloque, el medio que se hunde y la revelación
  let sx = 0;
  let sy = 0;
  for (const h of [2, w(44), w(64)]) {
    const d = frame - h;
    if (d >= 0 && d < 12) {
      const a = 16 * Math.exp(-d / 3.5);
      sx += (random(`x${h}${frame}`) * 2 - 1) * a;
      sy += (random(`y${h}${frame}`) * 2 - 1) * a;
    }
  }

  // Estado de los bloques
  const forget1 = interpolate(frame, [w(8), w(8) + 12], [0, 0.45], opt); // "olvidar": empiezan a apagarse
  const forget2 = interpolate(frame, [w(42), w(44) + 8], [0, 1], opt); // "se pierden": del todo
  const goldAll = interpolate(frame, [w(57), w(59)], [0, 1], opt); // "valen oro"
  const blocks = U.map((u, i) => {
    const drop = interpolate(frame, [i * 1.5, i * 1.5 + 7], [0, 1], { ...opt, easing: Easing.in(Easing.quad) });
    const loss = 1 - u;
    const memory = 1 - loss * Math.max(forget1, forget2);
    let g = 0;
    if (i === 0) g = interpolate(frame, [w(19), w(19) + 6], [0, 0.6], opt);
    if (i === 9) g = interpolate(frame, [w(31), w(31) + 6], [0, 0.6], opt);
    if (i === 0 || i === 9) g = Math.max(g, goldAll);
    return { drop, memory, gold: g };
  });
  const curve = interpolate(frame, [w(39), w(47)], [0, 1], opt);
  const s: SerialState = {
    cam: { pos, look: lk },
    blocks,
    loop: interpolate(frame, [w(26), w(26) + 6, w(30) - 2, w(30) + 4], [0, 1, 1, 0], opt),
    loopSpin: -t * 4,
    rings: interpolate(frame, [w(34), w(34) + 6, w(39) - 2, w(39) + 4], [0, 1, 1, 0], opt),
    ringsT: t,
    curve,
    curveGlow: 0.6 * gauss(frame, w(64), 6) + 0.4 * goldAll,
  };

  const ti = pick(TITLES, t);
  const titleIn = interpolate(frame, [w(TITLES[ti].at), w(TITLES[ti].at) + 6], [0, 1], opt);
  const label = LABELS.find((l) => frame >= w(l.from) && frame < w(l.to));
  const labelIn = label ? spring({ frame: frame - w(label.from), fps, config: { damping: 11, stiffness: 240 } }) : 0;
  const strike = label?.strike ? interpolate(frame - w(label.from), [4, 10], [0, 1], opt) : 0;
  const reticleOn = cur.reticle && cp > 0.8 ? 1 : 0;
  const flash = interpolate(frame - w(64), [0, 1, 6], [0, 0.8, 0], opt);
  const dim = interpolate(frame, [w(69), w(69) + 8], [0, 0.45], opt);

  return (
    <AbsoluteFill style={{ background: Z.bg }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <div style={{ position: "absolute", left: 0, top: CANVAS.top, width: 1080, height: CANVAS.height }}>
          <SerialScene s={s} width={1080} height={CANVAS.height} />
          <AbsoluteFill style={{ background: `linear-gradient(${Z.bg} 0%, transparent 14%, transparent 86%, ${Z.bg} 100%)` }} />
          <AbsoluteFill style={{ background: "#000", opacity: dim }} />
        </div>
        <Reticle t={t} opacity={reticleOn} />
      </AbsoluteFill>

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
            fontSize: label.big ? 92 : 56,
            lineHeight: 1.04,
            letterSpacing: "0.08em",
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

      <DmBubble start={w(69)} send={w(83)} />
      <DynamicCaptions t={t} frame={frame} fps={fps} />
      <Monitor t={t} curve={curve} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      <Audio src={staticFile("audio/voz_serial.wav")} />
      <Audio src={staticFile("sfx/cama.wav")} volume={(f) => interpolate(f, [0, 6, end, end + 30], [0, 0.14, 0.14, 0], opt)} />
      {Array.from({ length: 10 }, (_, i) => (
        <Sequence key={`b${i}`} name="Bloque" from={Math.round(i * 1.5) + 7} durationInFrames={6} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.4} />
        </Sequence>
      ))}
      {[44, 64].map((i) => (
        <Sequence key={`s${i}`} name="Golpe" from={w(i)} durationInFrames={24} premountFor={fps}>
          <Audio src={staticFile("sfx/slam.wav")} volume={0.45} />
        </Sequence>
      ))}
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
      <Sequence name="Pop HOOK" from={w(83)} durationInFrames={12} premountFor={fps}>
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
