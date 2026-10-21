import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO } from "../HookHouse/brand";
import { opt } from "../HookHouse/text";
import { CharizardPop, POP, POP_TOTAL, PortalGlow } from "./CharizardPop";
import capas from "../../public/anime/logo/capas.json";

// Intro para Anime Industry: el reverso de la carta Pokémon emerge de la oscuridad, gira (rápido y luego lento)
// brillando y enseña el frente; después las letras del logo (capas recortadas del original con scripts/capas_logo.py)
// caen del cielo y se estrellan contra el concreto, se revelan rayos, eslogan y "DESDE 1990",
// y un corte con impacto da paso a los clips.

export type Layer = { name: string; x: number; y: number; w: number; h: number };
const L = capas as { letters: Layer[]; slogan: Layer; desde: Layer; rays: Layer; circle: { cx: number; cy: number; r: number } };

// Línea de tiempo (frames a 30 fps)
export const T = {
  flip: 96, // la carta empieza a girar (la aparición 0–96 no cambia)
  flipDur: 32,
  get reveal() {
    return this.flip + 7; // con ease-out el frente ya queda de cara hacia el frame 7
  },
  get pop() {
    return this.flip + 22; // Charizard empieza a salir de la carta
  },
  get exit() {
    return this.pop + POP_TOTAL; // la carta se va cuando Charizard ya salió volando
  },
  circle: 208,
  letters: 220,
  stagger: 5,
  fall: 8, // frames de caída de cada letra
  get rays() {
    return this.letters + L.letters.length * this.stagger + this.fall + 10;
  },
  get slogan() {
    return this.rays + 12;
  },
  get desde() {
    return this.slogan + 12;
  },
  get cut() {
    return this.desde + 48;
  },
};
export const animeIntroDuration = () => T.cut + 36;
const impactOf = (k: number) => T.letters + k * T.stagger + T.fall;

const CENTER = { x: 540, y: 900 };
const at = (l: Layer) => ({ left: CENTER.x + (l.x - L.circle.cx), top: CENTER.y + (l.y - L.circle.cy), width: l.w, height: l.h });

// Sacudida de cámara: suma de golpes que decaen
const useShake = () => {
  const frame = useCurrentFrame();
  const hits: { at: number; amp: number }[] = [...L.letters.map((_, k) => ({ at: impactOf(k), amp: 14 })), { at: T.desde, amp: 10 }, { at: T.cut, amp: 30 }];
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const d = frame - h.at;
    if (d < 0 || d > 10) continue;
    const a = h.amp * Math.exp(-d / 3);
    x += (random(`sx${h.at}-${frame}`) * 2 - 1) * a;
    y += (random(`sy${h.at}-${frame}`) * 2 - 1) * a;
  }
  return { x, y };
};

const Card: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, T.flip], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const light = interpolate(frame, [4, 70], [0, 1], { ...opt, easing: Easing.inOut(Easing.quad) });
  const flip = interpolate(frame, [T.flip, T.flip + T.flipDur], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const leave = interpolate(frame, [T.exit, T.exit + 10], [0, 1], { ...opt, easing: Easing.in(Easing.cubic) });
  const rx = 16 - 12 * p + Math.sin(frame / 22) * 1.5;
  const ry = -20 + 14 * p + Math.cos(frame / 27) * 2 + 180 * flip;
  const scale = (0.78 + 0.22 * p) * (1 + 1.6 * leave);
  const sweep = interpolate(frame, [10, 90], [-60, 160], opt);
  const holo = interpolate(frame, [T.flip + 4, T.flip + 40], [-40, 140], { ...opt, easing: Easing.out(Easing.quad) });
  const shine = interpolate(frame, [T.flip, T.flip + 8, T.flip + 30], [0, 1, 0.35], opt);
  // Charizard sale de la carta (CharizardPop): fotogramas desde que empieza a salir
  const pd = frame - T.pop;
  const face: React.CSSProperties = { position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 26, overflow: "hidden" };
  return (
    <AbsoluteFill style={{ perspective: 1500, alignItems: "center", justifyContent: "center", opacity: 1 - leave }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(60,110,220,0.35) 0%, transparent 65%)", opacity: light }} />
      <div
        style={{
          position: "relative",
          width: 660,
          height: 922,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
        }}
      >
        {/* Reverso */}
        <div style={{ ...face, filter: `brightness(${0.05 + 0.95 * light}) contrast(${1.1 - 0.1 * light})`, boxShadow: `0 40px 120px rgba(0,0,0,0.8)` }}>
          <Img src={staticFile("anime/carta.png")} style={{ width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${sweep - 30}%, rgba(255,255,255,0.28) ${sweep}%, transparent ${sweep + 30}%)`, mixBlendMode: "screen" }} />
        </div>
        {/* Frente */}
        <div style={{ ...face, transform: "rotateY(180deg)", boxShadow: `0 0 ${40 + 80 * shine}px rgba(150,215,255,${0.35 + 0.5 * shine})`, filter: `brightness(${1 + 0.35 * shine})` }}>
          <Img src={staticFile(pd >= 0 ? "anime/charizard/carta_vacia.png" : "anime/carta_charizard.png")} style={{ width: "100%", height: "100%" }} />
          {pd >= -2 ? <PortalGlow d={pd} /> : null}
          {/* Brillo holográfico que cruza la carta */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(120deg, transparent ${holo - 25}%, rgba(160,230,255,0.45) ${holo - 8}%, rgba(255,255,255,0.6) ${holo}%, rgba(255,180,240,0.35) ${holo + 8}%, transparent ${holo + 25}%)`,
              mixBlendMode: "screen",
            }}
          />
        </div>
        <CharizardPop d={pd} fps={30} />
      </div>
    </AbsoluteFill>
  );
};

// Grietas en el concreto bajo cada letra
const Cracks: React.FC<{ x: number; y: number; start: number; seed: string; fade: number }> = ({ x, y, start, seed, fade }) => {
  const frame = useCurrentFrame();
  const d = frame - start;
  if (d < 0) return null;
  const grow = interpolate(d, [0, 4], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const paths = Array.from({ length: 6 }, (_, k) => {
    let a = (k / 6) * Math.PI * 2 + random(`${seed}a${k}`) * 0.8;
    let px = x;
    let py = y;
    let d2 = `M${px},${py}`;
    const len = 45 + random(`${seed}l${k}`) * 85;
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      a += (random(`${seed}t${k}-${s}`) - 0.5) * 0.9;
      const seg = (len / steps) * grow;
      px += Math.cos(a) * seg;
      py += Math.sin(a) * seg * 0.55;
      d2 += ` L${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return d2;
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fade }}>
      {paths.map((p, k) => (
        <path key={k} d={p} stroke="#3B3B3B" strokeWidth={k % 2 ? 2.5 : 4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <ellipse cx={x} cy={y} rx={34 * grow} ry={9 * grow} fill="rgba(40,40,40,0.35)" />
    </svg>
  );
};

// Polvo y escombros del golpe
const Dust: React.FC<{ x: number; y: number; start: number; seed: string }> = ({ x, y, start, seed }) => {
  const frame = useCurrentFrame();
  const d = frame - start;
  if (d < 0 || d > 26) return null;
  const puffs = Array.from({ length: 9 }, (_, k) => {
    const dir = (random(`${seed}p${k}`) - 0.5) * 2;
    return { cx: x + dir * (30 + d * 6), cy: y + 6 - d * (0.3 + random(`${seed}q${k}`) * 0.6), r: 10 + d * 1.6, o: Math.max(0, 0.38 * (1 - d / 22)) };
  });
  const chips = Array.from({ length: 8 }, (_, k) => {
    const vx = (random(`${seed}c${k}`) - 0.5) * 22;
    const vy = -10 - random(`${seed}v${k}`) * 12;
    return { cx: x + vx * d, cy: y + vy * d + 1.1 * d * d, s: 5 + random(`${seed}s${k}`) * 6 };
  });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {puffs.map((p, k) => (
        <circle key={k} cx={p.cx} cy={p.cy} r={p.r} fill="#B9B4AA" opacity={p.o} />
      ))}
      {chips.map((c, k) => (
        <rect key={k} x={c.cx} y={c.cy} width={c.s} height={c.s * 0.8} fill="#6E6A63" transform={`rotate(${d * 25 + k * 40} ${c.cx} ${c.cy})`} opacity={d < 20 ? 1 : 0} />
      ))}
    </svg>
  );
};

// Letra que cae del cielo y se estrella
const Letter: React.FC<{ l: Layer; k: number }> = ({ l, k }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = T.letters + k * T.stagger;
  const hit = impactOf(k);
  if (frame < start) return null;
  const pos = at(l);
  let ty: number;
  let sx = 1;
  let sy = 1;
  let blur = 0;
  if (frame < hit) {
    const p = interpolate(frame, [start, hit], [0, 1], { ...opt, easing: Easing.in(Easing.quad) });
    ty = -(pos.top + pos.height + 300) * (1 - p);
    sy = 1.35;
    sx = 0.85;
    blur = 10;
  } else {
    const d = frame - hit;
    const s = spring({ frame: d, fps, config: { damping: 8, stiffness: 320, mass: 0.6 } });
    sy = d < 2 ? 0.72 : 1 + (1 - s) * 0.12;
    sx = d < 2 ? 1.22 : 1 - (1 - s) * 0.06;
    ty = 0;
  }
  return (
    <Img
      src={staticFile(`anime/logo/${l.name}.png`)}
      style={{
        position: "absolute",
        ...pos,
        transform: `translateY(${ty}px) scale(${sx}, ${sy})`,
        transformOrigin: "50% 100%",
        filter: blur ? `blur(${blur * 0.4}px)` : undefined,
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
  const concrete = interpolate(frame, [T.rays - 4, T.rays + 10], [1, 0], opt);
  const r = L.circle.r;
  return (
    <AbsoluteFill style={{ scale: `${hold}`, transformOrigin: `${CENTER.x}px ${CENTER.y}px` }}>
      <div style={{ position: "absolute", left: CENTER.x - r, top: CENTER.y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: "#fff", scale: `${c}`, opacity: frame >= T.circle ? 1 : 0, overflow: "hidden" }}>
        {/* Textura de concreto mientras caen las letras; desaparece con los rayos */}
        <svg width={2 * r} height={2 * r} style={{ position: "absolute", inset: 0, opacity: 0.55 * concrete }}>
          <filter id="concreto">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} seed={7} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.55" />
            </feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" fill="#CFCAC2" />
          <rect width="100%" height="100%" filter="url(#concreto)" />
        </svg>
      </div>
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
      {L.letters.map((l, k) => {
        const p = at(l);
        return <Cracks key={`c${l.name}`} x={p.left + p.width / 2} y={p.top + p.height - 4} start={impactOf(k)} seed={l.name} fade={concrete} />;
      })}
      {L.letters.map((l, k) => (
        <Letter key={l.name} l={l} k={k} />
      ))}
      {L.letters.map((l, k) => {
        const p = at(l);
        return <Dust key={`d${l.name}`} x={p.left + p.width / 2} y={p.top + p.height - 4} start={impactOf(k)} seed={l.name} />;
      })}
      <Img src={staticFile("anime/logo/eslogan.png")} style={{ position: "absolute", ...at(L.slogan), clipPath: `inset(0 ${(1 - slogan) * 100}% 0 0)` }} />
      <Img
        src={staticFile("anime/logo/desde.png")}
        style={{ position: "absolute", ...at(L.desde), opacity: frame >= T.desde ? Math.min(1, desde * 1.5) : 0, transform: `scale(${1.6 - 0.6 * desde})` }}
      />
    </AbsoluteFill>
  );
};

export const AnimeIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = useShake();
  const flash = interpolate(frame, [T.cut, T.cut + 1, T.cut + 4], [0, 1, 0], opt);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        {frame < T.exit + 12 ? <Card /> : null}
        {frame >= T.circle && frame < T.cut ? <LogoBuild /> : null}
        {frame >= T.cut ? (
          <AbsoluteFill style={{ background: "#111", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: 34, letterSpacing: "0.08em", color: "#777" }}>[ AQUÍ ENTRAN LOS CLIPS ]</span>
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      <Audio src={staticFile("sfx/riser.wav")} volume={0.7} />
      <Sequence name="Whoosh giro" from={T.flip} durationInFrames={14}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} />
      </Sequence>
      <Sequence name="Charizard sale" from={T.pop - 2} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.6} />
      </Sequence>
      <Sequence name="Llamarada" from={T.pop + POP.fireStart} durationInFrames={50}>
        <Audio src={staticFile("sfx/fuego.wav")} volume={0.8} />
      </Sequence>
      {[0, 10, 20, 30, 40, 52, 58, 64, 70, 76].map((f) => (
        <Sequence key={`a${f}`} name="Aleteo" from={T.pop + f} durationInFrames={12}>
          <Audio src={staticFile("sfx/aleteo.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence name="Charizard vuela" from={T.pop + POP.flyStart - 2} durationInFrames={20}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} />
      </Sequence>
      <Sequence name="Whoosh salida" from={T.exit - 2} durationInFrames={14}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
      </Sequence>
      {L.letters.map((l, k) => (
        <React.Fragment key={l.name}>
          <Sequence name={`Caída ${l.name}`} from={T.letters + k * T.stagger} durationInFrames={10}>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
          </Sequence>
          <Sequence name={`Golpe ${l.name}`} from={impactOf(k)} durationInFrames={24}>
            <Audio src={staticFile("sfx/slam.wav")} volume={0.42} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence name="Whoosh rayos" from={T.rays - 2} durationInFrames={14}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence name="Sello" from={T.desde} durationInFrames={18}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Impacto corte" from={T.cut} durationInFrames={24}>
        <Audio src={staticFile("sfx/slam.wav")} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
