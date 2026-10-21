import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO } from "../HookHouse/brand";
import { opt } from "../HookHouse/text";
import capas from "../../public/anime/logo/capas.json";

// Intro para Anime Industry: el reverso de la carta Pokémon emerge de la oscuridad (nunca se ve el frente),
// después el logo se arma letra a letra con las capas recortadas del original (scripts/capas_logo.py),
// se revelan rayos, eslogan y "DESDE 1990", y un corte con impacto da paso a los clips.

type Layer = { name: string; x: number; y: number; w: number; h: number };
const L = capas as { letters: Layer[]; slogan: Layer; desde: Layer; rays: Layer; circle: { cx: number; cy: number; r: number } };

// Línea de tiempo (frames a 30 fps)
const T = {
  cardEnd: 96, // la carta empieza a irse
  circle: 104, // aparece el círculo blanco
  letters: 116, // primera letra
  stagger: 4, // frames entre letras
  get rays() {
    return this.letters + L.letters.length * this.stagger + 10;
  },
  get slogan() {
    return this.rays + 12;
  },
  get desde() {
    return this.slogan + 12;
  },
  get cut() {
    return this.desde + 48; // logo completo ~1,3 s
  },
};
export const animeIntroDuration = () => T.cut + 36;

// Coordenadas del logo original → lienzo 1080x1920 (círculo centrado en 540, 900)
const CENTER = { x: 540, y: 900 };
const at = (l: Layer) => ({ left: CENTER.x + (l.x - L.circle.cx), top: CENTER.y + (l.y - L.circle.cy), width: l.w, height: l.h });

const Card: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, T.cardEnd], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const light = interpolate(frame, [4, 70], [0, 1], { ...opt, easing: Easing.inOut(Easing.quad) });
  const leave = interpolate(frame, [T.cardEnd, T.cardEnd + 10], [0, 1], { ...opt, easing: Easing.in(Easing.cubic) });
  // Inclinación siempre pequeña: el reverso nunca deja de estar de cara
  const rx = 16 - 12 * p + Math.sin(frame / 22) * 1.5;
  const ry = -20 + 14 * p + Math.cos(frame / 27) * 2;
  const scale = (0.78 + 0.22 * p) * (1 + 1.6 * leave);
  const sweep = interpolate(frame, [10, 90], [-60, 160], opt);
  return (
    <AbsoluteFill style={{ perspective: 1500, alignItems: "center", justifyContent: "center", opacity: 1 - leave }}>
      {/* Halo que crece detrás */}
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(60,110,220,0.35) 0%, transparent 65%)", opacity: light }} />
      <div
        style={{
          position: "relative",
          width: 660,
          height: 922,
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
          filter: `brightness(${0.05 + 0.95 * light}) contrast(${1.1 - 0.1 * light})`,
          boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 ${80 * light}px rgba(80,140,255,${0.35 * light})`,
          borderRadius: 26,
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("anime/carta.png")} style={{ width: "100%", height: "100%" }} />
        {/* Barrido de luz */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${sweep - 30}%, rgba(255,255,255,0.28) ${sweep}%, transparent ${sweep + 30}%)`, mixBlendMode: "screen" }} />
      </div>
    </AbsoluteFill>
  );
};

const Letter: React.FC<{ l: Layer; start: number }> = ({ l, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 9, stiffness: 190, mass: 0.7 } });
  const o = interpolate(frame - start, [0, 4], [0, 1], opt);
  return (
    <Img
      src={staticFile(`anime/logo/${l.name}.png`)}
      style={{
        position: "absolute",
        ...at(l),
        opacity: o,
        transform: `translateY(${(1 - s) * -70}px) scale(${0.35 + 0.65 * s})`,
        transformOrigin: "50% 100%",
      }}
    />
  );
};

const LogoBuild: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = spring({ frame: frame - T.circle, fps, config: { damping: 14, stiffness: 120 } });
  const rays = interpolate(frame, [T.rays, T.rays + 14], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const slogan = interpolate(frame, [T.slogan, T.slogan + 10], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const desde = spring({ frame: frame - T.desde, fps, config: { damping: 12, stiffness: 200 } });
  const hold = interpolate(frame, [T.desde, T.cut], [1, 1.04], opt);
  const r = L.circle.r;
  return (
    <AbsoluteFill style={{ scale: `${hold}`, transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}>
      <div style={{ position: "absolute", left: CENTER.x - r, top: CENTER.y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "#fff", scale: `${c}`, opacity: frame >= T.circle ? 1 : 0 }} />
      {/* Rayos: se abren desde el centro */}
      <Img
        src={staticFile("anime/logo/rayos.png")}
        style={{
          position: "absolute",
          ...at(L.rays),
          opacity: rays,
          transform: `scale(${0.8 + 0.2 * rays})`,
          transformOrigin: `${L.circle.cx}px ${L.circle.cy}px`,
          WebkitMaskImage: `radial-gradient(circle at ${L.circle.cx}px ${L.circle.cy}px, #000 ${rays * 620}px, transparent ${rays * 620 + 60}px)`,
        }}
      />
      {L.letters.map((l, k) => (
        <Letter key={l.name} l={l} start={T.letters + k * T.stagger} />
      ))}
      {/* Eslogan: barrido de izquierda a derecha */}
      <Img src={staticFile("anime/logo/eslogan.png")} style={{ position: "absolute", ...at(L.slogan), clipPath: `inset(0 ${(1 - slogan) * 100}% 0 0)` }} />
      {/* DESDE 1990: sello */}
      <Img
        src={staticFile("anime/logo/desde.png")}
        style={{ position: "absolute", ...at(L.desde), opacity: frame >= T.desde ? Math.min(1, desde * 1.5) : 0, transform: `scale(${1.6 - 0.6 * desde})` }}
      />
    </AbsoluteFill>
  );
};

export const AnimeIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [T.cut, T.cut + 1, T.cut + 4], [0, 1, 0], opt);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {frame < T.cardEnd + 12 ? <Card /> : null}
      {frame >= T.circle && frame < T.cut ? <LogoBuild /> : null}
      {/* Marcador de la prueba: aquí entran los clips de la máquina */}
      {frame >= T.cut ? (
        <AbsoluteFill style={{ background: "#111", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 34, letterSpacing: "0.08em", color: "#777" }}>[ AQUÍ ENTRAN LOS CLIPS ]</span>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      <Audio src={staticFile("sfx/riser.wav")} volume={0.7} />
      <Sequence name="Whoosh carta" from={T.cardEnd - 4} durationInFrames={14}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      {L.letters.map((l, k) => (
        <Sequence key={l.name} name={`Pop ${l.name}`} from={T.letters + k * T.stagger} durationInFrames={10}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence name="Whoosh rayos" from={T.rays - 2} durationInFrames={14}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence name="Sello" from={T.desde} durationInFrames={18}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Impacto" from={T.cut} durationInFrames={18}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
