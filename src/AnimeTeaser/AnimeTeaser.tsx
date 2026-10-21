import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-teaser.json";
import capas from "../../public/anime/logo/capas.json";
import { AnimeIntro, T, type Layer } from "../AnimeIntro/AnimeIntro";
import { SANS } from "../HookHouse/brand";
import { opt } from "../HookHouse/text";

// Teaser "Algo se acerca" para Anime Industry: la intro aprobada (AnimeIntro) y, desde su corte con impacto,
// las fotos de la máquina con efectos, voz de tráiler (Rodrigo Zabú, eleven_v4) y subtítulos palabra a palabra.
// Música épica (ElevenLabs Sound Effects v2, en bucle) desde el frame 0.

const caps = captionsJson as Caption[];
const L = capas as { letters: Layer[]; slogan: Layer; desde: Layer; circle: { cx: number; cy: number; r: number } };
const START = T.cut + 2; // primer frame del teaser
const VOICE = START + 4; // la voz entra justo tras el golpe
const END_HOLD = 60;
export const animeTeaserDuration = (fps: number) => VOICE + Math.round((caps[caps.length - 1].endMs / 1000) * fps) + END_HOLD;

// Palabras destacadas en amarillo
const KEY = new Set([2, 5, 6, 7, 11, 14, 17, 28, 30, 33, 34]);

type Shot = { at: number; img?: string; from: number; to: number; x?: number; y?: number; rot?: number; dark?: number };
// Plano que empieza en la palabra `at` (índice del subtítulo)
const SHOTS: Shot[] = [
  { at: 0, img: "camion", from: 1.5, to: 1.25, y: 120, dark: 0.55 },
  { at: 3, img: "camion", from: 1.15, to: 1.32, y: 40 },
  { at: 6, img: "bajando", from: 1.4, to: 1.5, y: -60 },
  { at: 7, img: "abierta2", from: 1.35, to: 1.2, dark: 0.45 },
  { at: 8, img: "bajando", from: 1.1, to: 1.22, x: 40, rot: -1.5 },
  { at: 12, img: "abierta1", from: 1.3, to: 1.12, rot: 1 },
  { at: 15, img: "espirales", from: 1.1, to: 1.45, y: -80 },
  { at: 21, img: "espirales", from: 1.6, to: 2.1, y: -160, dark: 0.35 },
  { at: 29, from: 1, to: 1 },
];

const Photo: React.FC<{ s: Shot; start: number; end: number }> = ({ s, start, end }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, end], [0, 1], opt);
  const scale = s.from + (s.to - s.from) * p;
  const punch = interpolate(frame - start, [0, 6], [1.08, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const blur = interpolate(frame - start, [0, 4], [14, 0], opt);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(`anime/fotos/${s.img}.jpg`)}
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          objectFit: "cover",
          transform: `translate(${(s.x ?? 0) * p}px, ${(s.y ?? 0) * p}px) scale(${scale * punch}) rotate(${(s.rot ?? 0) * p}deg)`,
          filter: `contrast(1.18) saturate(1.15) brightness(${1 - (s.dark ?? 0)}) blur(${blur}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Logo completo (capas originales), para el cierre
const LogoStatic: React.FC<{ scale: number }> = ({ scale }) => {
  const r = L.circle.r;
  const at = (l: Layer) => ({ position: "absolute" as const, left: 540 + (l.x - L.circle.cx), top: 860 + (l.y - L.circle.cy), width: l.w, height: l.h });
  return (
    <AbsoluteFill style={{ scale: `${scale}`, transformOrigin: "540px 860px" }}>
      <div style={{ position: "absolute", left: 540 - r, top: 860 - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "#fff" }} />
      <Img src={staticFile("anime/logo/rayos.png")} style={at({ name: "rayos", x: 0, y: 0, w: 1206, h: 788 })} />
      {L.letters.map((l) => (
        <Img key={l.name} src={staticFile(`anime/logo/${l.name}.png`)} style={at(l)} />
      ))}
      <Img src={staticFile("anime/logo/eslogan.png")} style={at(L.slogan)} />
      <Img src={staticFile("anime/logo/desde.png")} style={at(L.desde)} />
    </AbsoluteFill>
  );
};

// Grano de película animado
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "overlay" }}>
      <filter id="grano">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grano)" />
    </svg>
  );
};

const Captions: React.FC<{ t: number; frame: number; fps: number }> = ({ t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= caps[i].startMs / 1000) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,…?]$/.test(caps[i - 1].text) || n >= 5)) {
      start = i;
      n = 0;
    }
    n++;
  }
  // El bloque desaparece si la voz calla un rato
  if (t > caps[cur].endMs / 1000 + 0.6 && cur < caps.length - 1) return null;
  return (
    <div style={{ position: "absolute", top: 1360, left: 70, right: 70, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1.05, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const local = frame - Math.round((caps[i].startMs / 1000) * fps);
        const s = spring({ frame: local, fps, config: { damping: 11, stiffness: 260 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              color: KEY.has(i) ? "#FFD23F" : "#fff",
              transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 30}px)`,
              opacity: Math.min(1, s * 2),
              WebkitTextStroke: "3px #000",
              paintOrder: "stroke fill",
              textShadow: "0 6px 0 rgba(0,0,0,0.55), 0 0 30px rgba(0,0,0,0.6)",
            }}
          >
            {caps[i].text}{" "}
          </span>
        );
      })}
    </div>
  );
};

const Teaser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - VOICE) / fps;
  const w = (i: number) => VOICE + Math.round((caps[i].startMs / 1000) * fps);
  const end = animeTeaserDuration(fps);
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (frame >= (i === 0 ? START : w(SHOTS[i].at))) k = i;
  const shot = SHOTS[k];
  const shotStart = k === 0 ? START : w(shot.at);
  const shotEnd = k + 1 < SHOTS.length ? w(SHOTS[k + 1].at) : end;
  // Destello blanco + aberración cromática en cada corte
  const flash = interpolate(frame - shotStart, [0, 1, 4], [0.85, 0.5, 0], opt);
  const ab = interpolate(frame - shotStart, [0, 5], [18, 0], opt);
  // Sacudida en "Pesada" y en "aquí?"
  const shakeAt = [w(6), w(28)];
  let sx = 0;
  let sy = 0;
  for (const h of shakeAt) {
    const d = frame - h;
    if (d >= 0 && d < 12) {
      const a = 22 * Math.exp(-d / 3.5);
      sx += (random(`x${h}${frame}`) * 2 - 1) * a;
      sy += (random(`y${h}${frame}`) * 2 - 1) * a;
    }
  }
  // Destello de la carta en "aquí?" (pista, sin revelar nada)
  const hint = frame >= w(28) && frame < w(28) + 7;
  const logoIn = spring({ frame: frame - w(29), fps, config: { damping: 14, stiffness: 120 } });
  const leak = (Math.sin(frame / 17) + 1) / 2;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        {shot.img ? (
          <>
            <Photo s={shot} start={shotStart} end={shotEnd} />
            {ab > 0.5 ? (
              <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.45 }}>
                <AbsoluteFill style={{ transform: `translateX(${ab}px)`, filter: "sepia(1) saturate(6) hue-rotate(-50deg)" }}>
                  <Photo s={shot} start={shotStart} end={shotEnd} />
                </AbsoluteFill>
              </AbsoluteFill>
            ) : null}
          </>
        ) : (
          <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #2a0a0a 0%, #000 70%)" }}>
            <AbsoluteFill style={{ background: "repeating-conic-gradient(from 0deg at 50% 45%, rgba(230,50,40,0.28) 0deg 6deg, transparent 6deg 15deg)", transform: `rotate(${frame * 0.4}deg) scale(1.8)`, opacity: logoIn }} />
            <LogoStatic scale={0.82 * logoIn} />
          </AbsoluteFill>
        )}
        {hint ? (
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
            <Img src={staticFile("anime/carta.png")} style={{ width: 520, filter: "brightness(0.5) blur(2px)", transform: `scale(${1 + (frame - w(28)) * 0.04})` }} />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      {/* Luz cálida que respira + viñeta + grano */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${20 + 60 * leak}% 15%, rgba(255,140,40,0.22), transparent 45%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      {frame >= w(29) ? (
        <div style={{ position: "absolute", top: 260, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: "0.3em", color: "#FFD23F", opacity: logoIn, textShadow: "0 0 30px rgba(255,180,0,0.6)" }}>
          MUY PRONTO
        </div>
      ) : null}
      <Captions t={t} frame={frame} fps={fps} />

      <Sequence name="Voz" from={VOICE}>
        <Audio src={staticFile("audio/voz_teaser.wav")} />
      </Sequence>
      {SHOTS.slice(1).map((s) => (
        <Sequence key={`w${s.at}`} name="Whoosh" from={w(s.at) - 3} durationInFrames={14}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
        </Sequence>
      ))}
      {[6, 28, 29].map((i) => (
        <Sequence key={`s${i}`} name="Golpe" from={w(i)} durationInFrames={24}>
          <Audio src={staticFile("sfx/slam.wav")} volume={0.55} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const AnimeTeaser: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = animeTeaserDuration(fps);
  // Música: plena en la intro, debajo de la voz, sube al final
  const music = (f: number) =>
    f < VOICE ? 0.75 : interpolate(f, [VOICE, VOICE + 8, end - END_HOLD + 10, end - 20, end], [0.75, 0.32, 0.32, 0.6, 0], opt);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AnimeIntro />
      {frame >= START ? <Teaser /> : null}
      <Audio src={staticFile("audio/musica_teaser.wav")} volume={music} />
    </AbsoluteFill>
  );
};
