import React from "react";
import { Easing, Img, interpolate, random, spring, staticFile } from "remotion";
import { opt } from "../HookHouse/text";
import capas from "../../public/anime/charizard/capas.json";

// Charizard sale de la carta: capas recortadas de la ilustración (scripts/capas_charizard.py) colocadas sobre el frente
// dentro del mismo espacio 3D de la carta. Se despega hacia la cámara, echa una llamarada de partículas y se va volando.

const C = capas as { box: [number, number, number, number]; rootL: [number, number]; rootR: [number, number]; mouth: [number, number]; card: [number, number] };
const SX = 660 / C.card[0];
const SY = 922 / C.card[1];
const BOX = { left: C.box[0] * SX, top: C.box[1] * SY, w: C.box[2] * SX, h: C.box[3] * SY };
const local = (p: [number, number]) => ({ x: (p[0] - C.box[0]) * SX, y: (p[1] - C.box[1]) * SY });
const ROOT_L = local(C.rootL);
const ROOT_R = local(C.rootR);
const MOUTH = local(C.mouth);

// Fases (frames desde que empieza a salir)
export const POP = { emerge: 12, fireStart: 10, fireEnd: 50, flyStart: 50, flyEnd: 80 };
export const POP_TOTAL = 82;

const Fire: React.FC<{ d: number; fps: number }> = ({ d, fps }) => {
  const t = d / fps;
  const start = POP.fireStart / fps;
  const end = POP.fireEnd / fps;
  const ANG = 0.42; // hacia la izquierda y hacia abajo
  const N = 300;
  const parts = Array.from({ length: N }, (_, i) => {
    const birth = start + (i / N) * (end - start - 0.08);
    const life = 0.32 + random(`l${i}`) * 0.28;
    const age = t - birth;
    if (age < 0 || age > life) return null;
    const a = age / life;
    const spread = (random(`d${i}`) - 0.5) * (0.25 + 0.5 * a);
    const ang = ANG + spread;
    const speed = 1300 + random(`s${i}`) * 700;
    const dist = speed * age * (1 - 0.3 * a);
    const curl = Math.sin(age * 26 + i * 1.7) * 26 * a;
    const x = MOUTH.x - Math.cos(ang) * dist;
    const y = MOUTH.y + Math.sin(ang) * dist + curl - 120 * a * a;
    const len = 18 + 120 * a + random(`r${i}`) * 20; // elongadas en la dirección del chorro
    const wid = 7 + 46 * a;
    const col = a < 0.1 ? "255,252,235" : a < 0.25 ? "255,226,120" : a < 0.45 ? "255,160,40" : a < 0.7 ? "240,80,15" : "60,40,32";
    const o = a < 0.7 ? 0.95 * (1 - a * 0.5) : 0.4 * (1 - (a - 0.7) / 0.3);
    return { x, y, len, wid, rot: (-ang * 180) / Math.PI + 180, col, o, smoke: a >= 0.7 };
  }).filter(Boolean) as { x: number; y: number; len: number; wid: number; rot: number; col: string; o: number; smoke: boolean }[];
  const on = interpolate(d, [POP.fireStart, POP.fireStart + 3, POP.fireEnd - 5, POP.fireEnd], [0, 1, 1, 0], opt);
  const flick = 0.85 + 0.15 * Math.sin(d * 3.7) * Math.sin(d * 1.3);
  const cone = 520 * on;
  const tipX = MOUTH.x - Math.cos(ANG) * cone;
  const tipY = MOUTH.y + Math.sin(ANG) * cone;
  return (
    <svg width={2400} height={1600} viewBox="-1600 -800 2400 1600" style={{ position: "absolute", left: -1600, top: -800, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <filter id="humo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="llama" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="cono" x1={MOUTH.x} y1={MOUTH.y} x2={tipX} y2={tipY} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,240,1)" />
          <stop offset="25%" stopColor="rgba(255,230,140,0.95)" />
          <stop offset="60%" stopColor="rgba(255,140,30,0.6)" />
          <stop offset="100%" stopColor="rgba(255,60,0,0)" />
        </linearGradient>
        <radialGradient id="boca">
          <stop offset="0%" stopColor="rgba(255,245,215,1)" />
          <stop offset="45%" stopColor="rgba(255,160,50,0.7)" />
          <stop offset="100%" stopColor="rgba(255,80,0,0)" />
        </radialGradient>
      </defs>
      <g filter="url(#humo)">
        {parts.filter((p) => p.smoke).map((p, i) => (
          <ellipse key={`h${i}`} cx={p.x} cy={p.y} rx={p.len * 0.6} ry={p.wid} fill={`rgba(${p.col},${p.o})`} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ))}
      </g>
      <g style={{ mixBlendMode: "screen" }} opacity={flick}>
        {/* Cono intenso pegado a la boca */}
        <path
          d={`M ${MOUTH.x} ${MOUTH.y - 14} L ${tipX} ${tipY - 70 * on} Q ${tipX - 40} ${tipY} ${tipX} ${tipY + 70 * on} L ${MOUTH.x} ${MOUTH.y + 14} Z`}
          fill="url(#cono)"
          filter="url(#llama)"
        />
        <g filter="url(#llama)">
          {parts.filter((p) => !p.smoke).map((p, i) => (
            <ellipse key={`f${i}`} cx={p.x} cy={p.y} rx={p.len} ry={p.wid} fill={`rgba(${p.col},${p.o})`} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
          ))}
        </g>
        <circle cx={MOUTH.x} cy={MOUTH.y} r={110} fill="url(#boca)" opacity={on} />
      </g>
    </svg>
  );
};

// Capa de Charizard: va dentro del contenedor 3D de la carta (preserve-3d), girada como el frente
export const CharizardPop: React.FC<{ d: number; fps: number }> = ({ d, fps }) => {
  if (d < -1 || d > POP_TOTAL) return null;
  const e = spring({ frame: d, fps, config: { damping: 13, stiffness: 120 } });
  const fly = interpolate(d, [POP.flyStart, POP.flyEnd], [0, 1], { ...opt, easing: Easing.in(Easing.quad) });
  const firing = d >= POP.fireStart && d < POP.fireEnd;
  // Aleteo: lento mientras echa fuego, rápido al volar
  const flapT = d / fps;
  const flap = fly > 0 ? 32 * Math.sin(flapT * Math.PI * 2 * 3.2) : 14 * Math.sin(flapT * Math.PI * 2 * 1.6);
  const shake = firing ? Math.sin(d * 2.3) * 2.5 : 0;
  const z = 320 * e + 900 * fly;
  const tx = 760 * fly * fly + 120 * fly;
  const ty = -40 * e - 1100 * fly;
  const sc = 1 + 0.22 * e + 0.6 * fly;
  const rot = -6 * e - 22 * fly + shake;
  // El frente está girado 180º en Y: para quedar sobre la ilustración se coloca en x espejada
  const left = 660 - BOX.left - BOX.w;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: BOX.top,
        width: BOX.w,
        height: BOX.h,
        transformStyle: "preserve-3d",
        transform: `rotateY(180deg) translate3d(${tx}px, ${ty}px, ${z}px) rotate(${rot}deg) scale(${sc})`,
        filter: `drop-shadow(0 ${30 * e}px ${40 * e}px rgba(0,0,0,0.55))`,
      }}
    >
      <Img src={staticFile("anime/charizard/ala_izq.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transformOrigin: `${ROOT_L.x}px ${ROOT_L.y}px`, transform: `rotate(${-flap}deg)` }} />
      <Img src={staticFile("anime/charizard/ala_der.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transformOrigin: `${ROOT_R.x}px ${ROOT_R.y}px`, transform: `rotate(${flap}deg)` }} />
      <Img src={staticFile("anime/charizard/cuerpo.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {firing ? <Fire d={d} fps={fps} /> : null}
    </div>
  );
};

// Brillo de "portal" en la ventana de la ilustración mientras Charizard sale (tapa el hueco rellenado)
export const PortalGlow: React.FC<{ d: number }> = ({ d }) => {
  const o = interpolate(d, [-2, 4, POP.flyEnd, POP_TOTAL + 20], [0, 1, 0.75, 0.55], opt);
  const pulse = 0.85 + 0.15 * Math.sin(d * 0.6);
  return (
    <div
      style={{
        position: "absolute",
        left: 92 * SX,
        top: 125 * SY,
        width: (672 - 92) * SX,
        height: (548 - 125) * SY,
        background: `radial-gradient(ellipse at 55% 55%, rgba(255,245,210,${0.95 * pulse}) 0%, rgba(255,170,60,${0.75 * pulse}) 35%, rgba(255,90,20,0.35) 70%, rgba(255,60,0,0) 100%)`,
        mixBlendMode: "screen",
        opacity: o,
      }}
    />
  );
};
