import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Loop, OffthreadVideo, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Anuncio de Hook House (18-10-2026): fondo negro con brillos verdes, teléfono en perspectiva con un feed que hace
// scroll por videos reales del proyecto (conceptos de portfolio), tarjetas flotantes con otros ejemplos, un video que
// sale del teléfono a pantalla completa y cierre de marca. Música propia a 96 BPM: cada cambio cae en el compás.

loadInter();

const FPS = 30;
export const ANUNCIO_FRAMES = 25 * FPS;
const GREEN = "#12A150";
const GLOW = "#2BE07A";
const io = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const S = (s: number) => Math.round(s * FPS);

// Feed del teléfono: cada video entra en el compás (2,5 s) con 0,5 s de margen para verse en movimiento al llegar
const FEED = [
  { src: "anuncio/f1.mp4", at: 0, lead: 0, filtro: undefined },
  { src: "anuncio/f2.mp4", at: 5, lead: 0.5, filtro: "brightness(1.25) contrast(1.15) saturate(1.1)" },
  { src: "anuncio/f3.mp4", at: 7.5, lead: 0.5, filtro: undefined },
  { src: "anuncio/f4.mp4", at: 10, lead: 0.5, filtro: undefined },
  { src: "anuncio/f5.mp4", at: 12.5, lead: 0.5, filtro: undefined },
];
const SCROLL = 0.55; // duración del scroll (s)
const SW = 480; // pantalla del teléfono
const SH = 1000;
const HERO_OUT = 15; // el video sale del teléfono
const HERO_BACK = 20; // vuelve al teléfono

// Interpolación por tramos con easing
const kf = (t: number, keys: [number, number][], ease = io) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i];
    const [b, vb] = keys[i + 1];
    if (t <= b) return interpolate(t, [a, b], [va, vb], { ...clamp, easing: ease });
  }
  return keys[keys.length - 1][1];
};

const phone = (t: number) => ({
  x: 540,
  y: kf(t, [[0, 1420], [1.0, 1010], [19.9, 1010], [20, 900]], out),
  s: kf(t, [[0, 0.9], [1.1, 1], [5, 1.03], [5.4, 1], [7.5, 1.03], [7.9, 1], [10, 1.04], [10.4, 1], [12.5, 1.03], [14.3, 1], [19.9, 1], [20, 0.62], [25, 0.65]]),
  ry: kf(t, [[0, -42], [1.1, -16], [4.8, -11], [5.4, 13], [7.3, 9], [7.9, -14], [9.8, -10], [10.4, 10], [12.3, 7], [14.3, 0], [20.8, 0], [21.8, -16], [25, -11]]),
  rx: kf(t, [[0, 26], [1.1, 8], [5.4, 6], [10.4, 5], [14.3, 0], [20.8, 0], [21.8, 7]]),
  rz: kf(t, [[0, -12], [1.1, -3], [5.4, 2], [7.9, -2], [10.4, 1], [14.3, 0], [20.8, 0], [21.8, -2]]),
  o: kf(t, [[0, 1], [15.3, 1], [15.6, 0], [19.95, 0], [20, 1]], (x) => x),
});

const Feed: React.FC<{ t: number }> = ({ t }) => {
  // índice de scroll continuo
  const pos = FEED.reduce((acc, it, i) => (i === 0 ? 0 : acc + interpolate(t, [it.at - SCROLL, it.at], [0, 1], { ...clamp, easing: io })), 0);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-pos * SH}px)` }}>
      {FEED.map((it, i) => {
        const from = S(it.at - it.lead - (i === 0 ? 0 : SCROLL));
        return (
          <div key={it.src} style={{ position: "absolute", left: 0, top: i * SH, width: SW, height: SH, overflow: "hidden", background: "#000" }}>
            <Sequence from={from} layout="none">
              <OffthreadVideo src={staticFile(it.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter: it.filtro }} />
            </Sequence>
          </div>
        );
      })}
    </div>
  );
};

const Phone: React.FC<{ t: number }> = ({ t }) => {
  const p = phone(t);
  if (p.o <= 0.001) return null;
  // reflejo que cruza la pantalla en cada cambio
  const sweep = FEED.slice(1).reduce((m, it) => Math.max(m, interpolate(t, [it.at - 0.6, it.at + 0.4], [0, 1], clamp) * (t < it.at + 0.4 ? 1 : 0)), 0);
  return (
    <div style={{ position: "absolute", left: p.x - 260, top: p.y - 520, width: 520, height: 1040, opacity: p.o, transform: `perspective(2200px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg) scale(${p.s})`, zIndex: 10 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 76, background: "linear-gradient(145deg, #2A2D2B 0%, #0E0F0E 40%, #1C1E1C 100%)", boxShadow: `0 0 0 2px #3A3D3A, 0 40px 120px rgba(0,0,0,0.8), 0 0 140px rgba(18,161,80,0.35)` }} />
      <div style={{ position: "absolute", left: 20, top: 20, width: SW, height: SH, borderRadius: 58, overflow: "hidden", background: "#000" }}>
        <Feed t={t} />
        <div style={{ position: "absolute", left: SW / 2 - 70, top: 18, width: 140, height: 36, borderRadius: 18, background: "#000" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)" }} />
        <div style={{ position: "absolute", top: -200, bottom: -200, width: 160, left: interpolate(sweep, [0, 1], [-260, SW + 100]), background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))", transform: "rotate(18deg)", opacity: sweep > 0 && sweep < 1 ? 1 : 0 }} />
      </div>
    </div>
  );
};

// El video que sale del teléfono a pantalla completa y vuelve
const Hero: React.FC<{ t: number }> = ({ t }) => {
  if (t < HERO_OUT - 0.05 || t > HERO_BACK + 0.85) return null;
  const k1 = interpolate(t, [HERO_OUT, HERO_OUT + 0.8], [0, 1], { ...clamp, easing: io });
  const k2 = interpolate(t, [HERO_BACK, HERO_BACK + 0.8], [0, 1], { ...clamp, easing: io });
  const start = { x: 300, y: 510, w: SW, h: SH, r: 58 };
  const full = { x: 0, y: 0, w: 1080, h: 1920, r: 0 };
  const end = { x: 540 - (SW * 0.62) / 2, y: 900 - (SH * 0.62) / 2, w: SW * 0.62, h: SH * 0.62, r: 36 };
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  const from = k2 > 0 ? full : start;
  const to = k2 > 0 ? end : full;
  const k = k2 > 0 ? k2 : k1;
  const r = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), w: lerp(from.w, to.w, k), h: lerp(from.h, to.h, k), rad: lerp(from.r, to.r, k) };
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.rad, overflow: "hidden", zIndex: 20, boxShadow: "0 30px 120px rgba(0,0,0,0.6)" }}>
      <Sequence from={S(12.5 - 0.5 - SCROLL)} layout="none">
        <OffthreadVideo src={staticFile("anuncio/f5.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Sequence>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)", opacity: k1 * (1 - k2) }} />
    </div>
  );
};

// Tarjetas flotantes con otros ejemplos (profundidad: las lejanas, más chicas y desenfocadas)
const CARDS = [
  { src: "anuncio/c1.mp4", x: 150, y: 600, w: 230, depth: 0.9, in: 3.0, rot: -8 },
  { src: "anuncio/c2.mp4", x: 935, y: 520, w: 210, depth: 0.7, in: 3.6, rot: 7 },
  { src: "anuncio/c3.mp4", x: 945, y: 1300, w: 240, depth: 1, in: 4.2, rot: 9 },
  { src: "anuncio/c4.mp4", x: 140, y: 1360, w: 205, depth: 0.65, in: 4.8, rot: -6 },
];
const Card: React.FC<{ c: (typeof CARDS)[number]; t: number; frame: number }> = ({ c, t, frame }) => {
  if (t < c.in - 0.1 || t > HERO_OUT + 0.8) return null;
  const a = interpolate(t, [c.in, c.in + 0.9], [0, 1], { ...clamp, easing: out });
  const e = interpolate(t, [HERO_OUT - 0.6, HERO_OUT + 0.3], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const dx = (c.x < 540 ? -1 : 1) * e * 600;
  const bob = Math.sin(frame / (40 + c.depth * 20) + c.x) * 14;
  const par = -phone(t).ry * 3 * c.depth; // paralaje opuesto al giro del teléfono
  const h = (c.w * 16) / 9;
  return (
    <div style={{ position: "absolute", left: c.x - c.w / 2 + dx + par, top: c.y - h / 2 + bob, width: c.w, height: h, borderRadius: 26, overflow: "hidden", opacity: a * (1 - e), zIndex: c.depth >= 0.9 ? 12 : 4, filter: `blur(${(1 - a) * 18 + (1 - c.depth) * 6}px)`, transform: `perspective(1600px) rotateY(${c.x < 540 ? 18 : -18}deg) rotateZ(${c.rot}deg) scale(${(0.8 + 0.2 * a) * c.depth})`, boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.08), 0 0 50px rgba(18,161,80,${0.25 * c.depth})` }}>
      <Sequence from={S(c.in - 0.3)} layout="none">
        <Loop durationInFrames={S(3.4)}>
          <OffthreadVideo src={staticFile(c.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Loop>
      </Sequence>
    </div>
  );
};

const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const blobs = [
    { x: 240, y: 520, r: 620, sp: 90, o: 0.42 },
    { x: 900, y: 1250, r: 700, sp: 120, o: 0.38 },
    { x: 540, y: 1750, r: 900, sp: 150, o: 0.3 },
  ];
  return (
    <AbsoluteFill style={{ background: "#040504", overflow: "hidden" }}>
      {blobs.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.x - b.r / 2 + Math.sin(frame / b.sp + i) * 60, top: b.y - b.r / 2 + Math.cos(frame / b.sp + i) * 50, width: b.r, height: b.r, borderRadius: "50%", background: `radial-gradient(circle, ${GLOW} 0%, ${GREEN} 25%, rgba(18,161,80,0) 70%)`, opacity: b.o, filter: "blur(40px)" }} />
      ))}
      {/* suelo de rejilla en perspectiva */}
      <div style={{ position: "absolute", left: -540, right: -540, top: 1250, height: 1200, transform: "perspective(900px) rotateX(72deg)", transformOrigin: "top", backgroundImage: "linear-gradient(rgba(43,224,122,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(43,224,122,0.22) 2px, transparent 2px)", backgroundSize: "120px 120px", backgroundPosition: `0 ${frame * 2}px`, maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0))", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0))" }} />
      {/* partículas */}
      {Array.from({ length: 34 }).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const sp = 0.6 + random(`s${i}`) * 1.6;
        const y = (((random(`y${i}`) * 1920 - frame * sp) % 1920) + 1920) % 1920;
        const sz = 2 + random(`z${i}`) * 5;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz, background: i % 3 ? "rgba(255,255,255,0.5)" : GLOW, opacity: 0.25 + random(`o${i}`) * 0.5, boxShadow: i % 3 ? undefined : `0 0 10px ${GLOW}` }} />;
      })}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ text: string; from: number; to: number; y: number; size: number; color?: string; weight?: number }> = ({ text, from, to, y, size, color = "#FFFFFF", weight = 800 }) => {
  const f = useCurrentFrame();
  if (f < S(from) || f > S(to)) return null;
  const a = interpolate(f, [S(from), S(from) + 14], [0, 1], { ...clamp, easing: out });
  const b = interpolate(f, [S(to) - 8, S(to)], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: y, textAlign: "center", fontFamily: INTER, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.045em", color, whiteSpace: "pre-line", opacity: b, zIndex: 30, transform: `translateY(${(1 - a) * 40}px)`, filter: a < 1 ? `blur(${(1 - a) * 10}px)` : undefined, textShadow: "0 8px 40px rgba(0,0,0,0.6)", clipPath: `inset(-20% ${(1 - a) * 100}% -20% -5%)` }}>
      {text}
    </div>
  );
};

const Logo: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  if (f < S(from)) return null;
  const a = interpolate(f, [S(from), S(from) + 14], [0, 1], { ...clamp, easing: out });
  const dot = interpolate(f, [S(from) + 10, S(from) + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 132, letterSpacing: "-0.05em", color: "#FFFFFF", zIndex: 30, clipPath: `inset(-20% ${(1 - a) * 100}% -20% 0)` }}>
      hookhouse<span style={{ color: GREEN, display: "inline-block", transform: `scale(${dot})`, textShadow: `0 0 30px ${GLOW}` }}>.</span>
    </div>
  );
};

export const HHAnuncio: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#040504", overflow: "hidden" }}>
      <Background frame={frame} />
      {CARDS.map((c) => (
        <Card key={c.src} c={c} t={t} frame={frame} />
      ))}
      <Phone t={t} />
      <Hero t={t} />
      <Title text={"Tu contenido\npodría verse así"} from={0} to={3.6} y={240} size={100} />
      <Title text={"Edición que\ndestaca"} from={15.9} to={19.8} y={1170} size={140} />
      <Logo from={20.7} />
      <Title text="¿Creamos el tuyo?" from={21.3} to={25.1} y={1280} size={96} />
      <Title text="Escribinos VIDEO por DM" from={21.8} to={25.1} y={1410} size={62} color={GLOW} />
      <div style={{ position: "absolute", top: 1580, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 40, opacity: t < 20.6 ? 1 : 0 }}>
        <div style={{ padding: "8px 20px", borderRadius: 999, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontFamily: INTER, fontWeight: 700, fontSize: 24, letterSpacing: "0.12em" }}>CONCEPTOS DE PORTFOLIO</div>
      </div>
      {FEED.slice(1).map((it) => (
        <Sequence key={it.src} from={S(it.at - 0.35)} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.18} />
        </Sequence>
      ))}
      <Sequence from={S(HERO_BACK + 0.7)} durationInFrames={30} layout="none">
        <Audio src={staticFile("sfx/brillo.wav")} volume={0.25} />
      </Sequence>
      <Audio src={staticFile("anuncio/musica.wav")} volume={0.9} />
    </AbsoluteFill>
  );
};
