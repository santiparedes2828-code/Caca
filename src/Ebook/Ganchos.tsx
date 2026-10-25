import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { C, Defs, Ingredientes, Revelacion, pop } from "./Huevos";
import { EscenaEstirado, Frase, Quesadilla } from "./Quesadilla";
import { RecetaVideo } from "./RecetaVideo";

// Prueba de ganchos: 3 aperturas por video. Cada gancho reemplaza el arranque y empalma con el resto del video.
// Tipos (de la búsqueda; evidencia de blogs/vendedores, no de estudios controlados):
//  1 · nombre del plato + plato terminado en el fotograma 0 («dish name» fue el gancho de comida con más vistas
//      en un análisis de 3600 videos; mostrar el plato antes de cocinar).
//  2 · brecha de curiosidad (afirmación/pregunta que el video responde).
//  3 · negativo / «dejá de…» (uno de los tres tipos que nombra el paper sobre los primeros 3 s en TikTok).
// Voz: public/ebook/ganchos.wav (las 6 frases en un archivo; tramos abajo, en s).

const fps = 30;
const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

type Gancho = { largo: number; voz: [number, number]; golpe?: number; riser?: number };
export const GANCHOS_HUEVOS: Record<1 | 2 | 3, Gancho> = {
  1: { largo: 2.0, voz: [0, 1.66] },
  2: { largo: 3.1, voz: [2.11, 5.04], golpe: 2.25, riser: 2.25 - 1.66 },
  3: { largo: 3.3, voz: [5.46, 8.13], golpe: 2.75 },
};
export const GANCHOS_QUESA: Record<1 | 2 | 3, Gancho> = {
  1: { largo: 1.9, voz: [8.55, 10.06] },
  2: { largo: 3.0, voz: [10.43, 13.2] },
  3: { largo: 2.3, voz: [13.58, 15.3], golpe: 1.3 },
};
const SIGUE_HUEVOS = 5.8; // desde dónde sigue el video 1 (paso 1)
const SIGUE_QUESA = 2.62; // desde dónde sigue el video 2 (ingredientes)
export const framesHuevos = (n: 1 | 2 | 3) => Math.round((GANCHOS_HUEVOS[n].largo + 27 - SIGUE_HUEVOS) * fps);
export const framesQuesa = (n: 1 | 2 | 3) => Math.round((GANCHOS_QUESA[n].largo + 20.5 - SIGUE_QUESA) * fps);

const AudioGancho: React.FC<{ g: Gancho }> = ({ g }) => (
  <>
    <Sequence from={3} durationInFrames={Math.round((g.voz[1] - g.voz[0]) * fps) + 2}>
      <Audio src={staticFile("ebook/ganchos.wav")} startFrom={Math.round(g.voz[0] * fps)} />
    </Sequence>
    {g.riser !== undefined && (
      <Sequence from={Math.round(g.riser * fps)} durationInFrames={50}>
        <Audio src={staticFile("ebook/riser_n.wav")} />
      </Sequence>
    )}
    {g.golpe !== undefined && (
      <Sequence from={Math.round(g.golpe * fps)} durationInFrames={60}>
        <Audio src={staticFile("ebook/impacto_n.wav")} volume={0.8} />
      </Sequence>
    )}
  </>
);

const Flash: React.FC<{ s: number; at?: number }> = ({ s, at }) =>
  at !== undefined && s >= at && s < at + 0.15 ? <AbsoluteFill style={{ background: "#FFFDF6", opacity: lin(s, at, at + 0.15, 0.9, 0) }} /> : null;

// plato con un huevo frito solitario (para «dejá de comer huevos fritos»)
const HuevoFritoTriste: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
    <Defs />
    <rect width={1080} height={1920} fill="url(#madera)" />
    <rect width={1080} height={1920} fill="#fff" filter="url(#grano)" />
    <g filter="url(#sombra)">
      <ellipse cx={540} cy={1080} rx={420} ry={360} fill="#F4F1EC" />
      <ellipse cx={540} cy={1080} rx={330} ry={280} fill="#FFFFFF" stroke="#E2DDD4" strokeWidth={6} />
    </g>
    <path d="M 400 1060 C 380 960 520 930 600 960 C 700 990 720 1100 650 1160 C 570 1220 420 1170 400 1060 Z" fill="#FFFFFF" stroke="#E8D9BF" strokeWidth={5} />
    <path d="M 410 1080 C 420 1150 520 1190 610 1170" stroke="#C98A3A" strokeWidth={10} fill="none" opacity={0.5} strokeLinecap="round" />
    <ellipse cx={545} cy={1060} rx={62} ry={56} fill="url(#yema)" />
    <ellipse cx={528} cy={1042} rx={16} ry={10} fill="#FFFFFF" opacity={0.85} />
  </svg>
);

const Tachado: React.FC<{ s: number; at: number }> = ({ s, at }) => {
  const k = pop(s, at);
  if (k <= 0) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <g transform={`translate(540 1080) scale(${k}) rotate(-6)`}>
        <path d="M -300 -260 L 300 260 M 300 -260 L -300 260" stroke={C.tomato} strokeWidth={64} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// celular genérico con una app de pedidos inventada (sin marcas)
const Celular: React.FC = () => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
    <Defs />
    <rect width={1080} height={1920} fill="url(#madera)" />
    <rect width={1080} height={1920} fill="#fff" filter="url(#grano)" />
    <g transform="rotate(-6 540 1100)" filter="url(#sombra)">
      <rect x={290} y={640} width={500} height={960} rx={60} fill="#1E1A18" />
      <rect x={312} y={662} width={456} height={916} rx={44} fill="#FFF6EA" />
      <rect x={312} y={662} width={456} height={150} rx={44} fill="#6C5CE7" />
      <text x={540} y={760} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={42} fill="#FFF">Pedidos</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={344} y={850 + i * 190} width={392} height={160} rx={24} fill="#FFFFFF" stroke="#E6DCCB" strokeWidth={3} />
          <rect x={364} y={870 + i * 190} width={120} height={120} rx={18} fill={["#F2B134", "#E4572E", "#3C8D5A"][i]} opacity={0.8} />
          <rect x={504} y={890 + i * 190} width={190} height={22} rx={11} fill="#D9CCB8" />
          <rect x={504} y={930 + i * 190} width={130} height={18} rx={9} fill="#E9DFCF" />
        </g>
      ))}
      <rect x={364} y={1440} width={352} height={90} rx={45} fill="#6C5CE7" />
      <text x={540} y={1498} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={40} fill="#FFF">Pedir</text>
    </g>
  </svg>
);

const HookHuevos: React.FC<{ n: 1 | 2 | 3; s: number }> = ({ n, s }) => {
  const kIn = spring({ frame: s * fps, fps, config: { damping: 14, stiffness: 120 } });
  if (n === 1) {
    return (
      <AbsoluteFill style={{ transform: `scale(${1.18 - 0.18 * kIn + s * 0.02})` }}>
        <Revelacion t={s - 0.05} />
      </AbsoluteFill>
    );
  }
  if (n === 2) {
    const g = GANCHOS_HUEVOS[2].golpe!;
    if (s < g) {
      const temblor = lin(s, 0.6, g, 0, 10, Easing.in(Easing.quad));
      return (
        <AbsoluteFill style={{ transform: `translate(${Math.sin(s * 90) * temblor}px, ${Math.cos(s * 77) * temblor}px) scale(${1 + lin(s, 0, g, 0, 0.12)})` }}>
          <Ingredientes t={s + 0.2} sinTitulo />
          <Frase s={s} palabras={[{ txt: "Con huevos", t: 0.1 }]} top={250} size={100} />
          <Frase s={s} palabras={[{ txt: "y una lata de", t: 0.85 }, { txt: "tomate…", t: 1.45, marca: true }]} top={390} size={88} />
        </AbsoluteFill>
      );
    }
    const k = spring({ frame: (s - g) * fps, fps, config: { damping: 12, stiffness: 120 } });
    return (
      <AbsoluteFill style={{ transform: `scale(${1.3 - 0.3 * k}) rotate(${(1 - k) * -6}deg)` }}>
        <Revelacion t={s - g + 2} />
        <Frase s={s} palabras={[{ txt: "hacés", t: g }, { txt: "ESTO", t: g + 0.2, marca: true }]} top={1300} size={110} />
      </AbsoluteFill>
    );
  }
  const g = GANCHOS_HUEVOS[3].golpe!;
  if (s < g) {
    return (
      <AbsoluteFill style={{ transform: `scale(${1.1 - 0.1 * kIn + s * 0.02})` }}>
        <HuevoFritoTriste />
        <Tachado s={s} at={1.0} />
        <Frase s={s} palabras={[{ txt: "Dejá de comer", t: 0.1 }]} top={250} size={96} />
        <Frase s={s} palabras={[{ txt: "huevos fritos", t: 0.6, marca: true }]} top={380} size={96} />
        <Frase s={s} palabras={[{ txt: "todas las noches", t: 1.75 }]} top={1500} size={80} />
      </AbsoluteFill>
    );
  }
  const k = spring({ frame: (s - g) * fps, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ transform: `scale(${1.3 - 0.3 * k}) rotate(${(1 - k) * -6}deg)` }}>
      <Revelacion t={s - g + 2} />
      <Frase s={s} palabras={[{ txt: "Probá", t: g }, { txt: "ESTO", t: g + 0.12, marca: true }]} top={1300} size={110} />
    </AbsoluteFill>
  );
};

const HookQuesa: React.FC<{ n: 1 | 2 | 3; s: number }> = ({ n, s }) => {
  if (n === 1) {
    return (
      <>
        <AbsoluteFill style={{ transform: `scale(${1.25 - lin(s, 0, 1.9) * 0.12})`, transformOrigin: "50% 60%" }}>
          <EscenaEstirado s={s} desde={0} />
        </AbsoluteFill>
        <Frase s={s} palabras={[{ txt: "QUESADILLA", t: 0.1 }]} top={250} size={112} />
        <Frase s={s} palabras={[{ txt: "de jamón y", t: 0.75 }, { txt: "queso", t: 1.1, marca: true }]} top={400} size={84} />
      </>
    );
  }
  if (n === 2) {
    return (
      <>
        <AbsoluteFill style={{ transform: `scale(${1.25 - lin(s, 0, 3.0) * 0.15})`, transformOrigin: "50% 60%" }}>
          <EscenaEstirado s={s} desde={0} />
        </AbsoluteFill>
        <Frase s={s} palabras={[{ txt: "No puede ser", t: 0.1 }]} top={250} size={104} />
        <Frase s={s} palabras={[{ txt: "que esto lleve", t: 0.85 }]} top={385} size={84} />
        <Frase s={s} palabras={[{ txt: "3", t: 1.65, marca: true }, { txt: "ingredientes", t: 1.8 }]} top={500} size={96} />
      </>
    );
  }
  const g = GANCHOS_QUESA[3].golpe!;
  if (s < g) {
    return (
      <AbsoluteFill style={{ transform: `scale(${1.05 + s * 0.06})` }}>
        <Celular />
        <Tachado s={s} at={0.8} />
        <Frase s={s} palabras={[{ txt: "No pidas", t: 0.1 }, { txt: "delivery", t: 0.55, marca: true }]} top={250} size={100} />
        <Frase s={s} palabras={[{ txt: "esta noche", t: 1.05 }]} top={400} size={88} />
      </AbsoluteFill>
    );
  }
  const k = spring({ frame: (s - g) * fps, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ transform: `scale(${1.3 - 0.3 * k}) rotate(${(1 - k) * -5}deg)` }}>
      <EscenaEstirado s={s} desde={g - 0.3} />
      <Frase s={s} palabras={[{ txt: "Hacé", t: g }, { txt: "ESTO", t: g + 0.12, marca: true }]} top={250} size={110} />
    </AbsoluteFill>
  );
};

export const GanchoHuevos: React.FC<{ n: 1 | 2 | 3 }> = ({ n }) => {
  const frame = useCurrentFrame();
  const s = frame / fps;
  const g = GANCHOS_HUEVOS[n];
  const L = Math.round(g.largo * fps);
  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      {frame < L && <HookHuevos n={n} s={s} />}
      {frame < L && <Flash s={s} at={g.golpe} />}
      <AudioGancho g={g} />
      <Sequence from={L}>
        <Sequence from={-Math.round(SIGUE_HUEVOS * fps)}>
          <RecetaVideo />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
};

export const GanchoQuesa: React.FC<{ n: 1 | 2 | 3 }> = ({ n }) => {
  const frame = useCurrentFrame();
  const s = frame / fps;
  const g = GANCHOS_QUESA[n];
  const L = Math.round(g.largo * fps);
  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      {frame < L && <HookQuesa n={n} s={s} />}
      {frame < L && <Flash s={s} at={g.golpe} />}
      <AudioGancho g={g} />
      <Sequence from={L}>
        <Sequence from={-Math.round(SIGUE_QUESA * fps)}>
          <Quesadilla />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
};
