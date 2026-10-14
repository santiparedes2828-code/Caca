import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Motion graphic en blanco y negro (referencia del 14-10-2026, solo para estudio local en analisis12/): fondo negro
// con un halo gris, siluetas blancas que brillan, papeles que vuelan, cifras enormes con brillo y rótulos de dos
// tamaños (contexto pequeño, palabra clave grande en cursiva). Leonardo da Vinci cuenta su historia en primera persona
// con la voz de marca. Todo en Inter (regla de la casa). Tiempos tomados de la transcripción de la narración.

loadInter();

const F = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CUTS = [0, 5.3, 9.4, 14.6, 18.6, 22.6, 28.6];
export const leonardoDuration = F(CUTS[CUTS.length - 1]);

const useAt = (s: number, cfg = { damping: 14, stiffness: 160, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - F(s), fps, config: cfg });
};

// Contexto pequeño y palabra clave grande en cursiva, con brillo (aparecen al decirse)
const Rotulo: React.FC<{ small?: string; big: string; at: number; bigAt?: number; top: number; size?: number }> = ({ small, big, at, bigAt, top, size = 150 }) => {
  const a = useAt(at);
  const b = useAt(bigAt ?? at + 0.25);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, textAlign: "center", fontFamily: INTER, color: "#fff" }}>
      {small ? (
        <div style={{ fontWeight: 500, fontSize: 54, opacity: a, transform: `translateY(${(1 - a) * 20}px)`, textShadow: "0 0 18px rgba(255,255,255,0.5)" }}>{small}</div>
      ) : null}
      <div
        style={{
          fontWeight: 800,
          fontStyle: "italic",
          fontSize: size,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginTop: 6,
          opacity: b,
          transform: `scale(${1.25 - 0.25 * b})`,
          filter: `blur(${(1 - b) * 14}px)`,
          textShadow: `0 0 ${size * 0.15}px rgba(255,255,255,0.8), 0 0 ${size * 0.4}px rgba(255,255,255,0.35)`,
        }}
      >
        {big}
      </div>
    </div>
  );
};

const Halo: React.FC<{ y?: number }> = ({ y = 42 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 50% ${y}%, #3a3a3a 0%, #121212 55%, #000 100%)` }} />
);

// Grano de película
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.09,
        backgroundImage: `radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.5px)`,
        backgroundSize: "5px 5px",
        backgroundPosition: `${(frame * 7) % 5}px ${(frame * 3) % 5}px`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const Silhouette: React.FC<{ x: number; y: number; h: number; at: number; flip?: boolean }> = ({ x, y, h, at, flip }) => {
  const s = useAt(at, { damping: 200, stiffness: 100, mass: 1 });
  return (
    <svg width={h * 0.45} height={h} viewBox="0 0 45 100" style={{ position: "absolute", left: x, top: y, opacity: s, transform: `scaleX(${flip ? -1 : 1})`, filter: "drop-shadow(0 0 14px rgba(255,255,255,0.9)) drop-shadow(0 0 40px rgba(255,255,255,0.4))" }}>
      <circle cx="22.5" cy="10" r="8" fill="#fff" />
      <path d="M8 24 Q22.5 18 37 24 L40 58 L33 58 L32 98 L24 98 L22.5 66 L21 98 L13 98 L12 58 L5 58 Z" fill="#fff" />
    </svg>
  );
};

// Papeles que vuelan hacia arriba
const Papers: React.FC<{ from: number; n?: number }> = ({ from, n = 16 }) => {
  const frame = useCurrentFrame() - F(from);
  if (frame < 0) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = 120 + random(`x${i}`) * 840;
        const sp = 6 + random(`s${i}`) * 9;
        const y = 1500 - frame * sp - random(`y${i}`) * 400;
        const r = random(`r${i}`) * 360 + frame * (random(`w${i}`) * 8 - 4);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 70, height: 92, background: "#f4f4f4", border: "2px solid #bbb", transform: `rotate(${r}deg) skewX(${Math.sin((frame + i * 9) / 6) * 14}deg)`, boxShadow: "0 0 18px rgba(255,255,255,0.5)", opacity: 0.4, filter: "blur(1.5px)" }}>
            {[0, 1, 2, 3].map((l) => (
              <div key={l} style={{ margin: "12px 10px 0", height: 3, background: "#999" }} />
            ))}
          </div>
        );
      })}
    </>
  );
};

const Portrait: React.FC<{ width: number; top: number; at?: number; glow?: boolean }> = ({ width, top, at = 0, glow }) => {
  const frame = useCurrentFrame();
  const s = useAt(at, { damping: 200, stiffness: 80, mass: 1 });
  return (
    <Img
      src={staticFile("davinci/davinci.png")}
      style={{
        position: "absolute",
        left: (1080 - width) / 2,
        top,
        width,
        opacity: s,
        transform: `scale(${1.04 + frame * 0.0009})`,
        filter: `grayscale(1) contrast(1.2) brightness(1.05) ${glow ? "drop-shadow(0 0 30px rgba(255,255,255,0.35))" : ""}`,
        maskImage: "linear-gradient(180deg, black 70%, transparent 100%)",
      }}
    />
  );
};

// 1 · Nací en 1452, en Vinci
const S1: React.FC = () => (
  <AbsoluteFill>
    <Halo y={35} />
    <Portrait width={760} top={260} glow />
    <Rotulo small="nací en" big="1452" at={0.1} bigAt={0.6} top={1120} size={210} />
    <Rotulo small="en un pueblo de Italia:" big="Vinci" at={2.6} bigAt={2.9} top={1440} size={130} />
  </AbsoluteFill>
);

// 2 · A los 14 años, aprendiz en Florencia
const S2: React.FC = () => (
  <AbsoluteFill>
    <Halo y={55} />
    <Silhouette x={430} y={760} h={480} at={0} />
    <Silhouette x={650} y={700} h={540} at={1.2} flip />
    <div style={{ position: "absolute", left: 0, right: 0, top: 1300, height: 4, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }} />
    <Rotulo small="a los" big="14 años" at={0.1} bigAt={0.4} top={300} size={190} />
    <Rotulo small="aprendiz en un taller de" big="Florencia" at={1.8} bigAt={3.1} top={1380} size={120} />
  </AbsoluteFill>
);

// 3 · Escribía al revés, en espejo; miles de páginas
const S3: React.FC = () => {
  const m = useAt(1.4);
  return (
    <AbsoluteFill>
      <Halo />
      <Papers from={2.4} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center", fontFamily: INTER, color: "#fff" }}>
        <div style={{ fontWeight: 500, fontSize: 54, textShadow: "0 0 18px rgba(255,255,255,0.5)" }}>escribía al revés,</div>
        <div style={{ fontWeight: 800, fontStyle: "italic", fontSize: 170, lineHeight: 1.05, marginTop: 10, transform: `scaleX(${1 - 2 * m})`, textShadow: "0 0 30px rgba(255,255,255,0.8)" }}>espejo</div>
        <div style={{ fontWeight: 800, fontStyle: "italic", fontSize: 170, lineHeight: 1.05, transform: "scaleY(-1)", opacity: 0.18, maskImage: "linear-gradient(0deg, black, transparent 70%)" }}>espejo</div>
      </div>
      <Rotulo small="y llené" big="miles de páginas" at={2.4} bigAt={3.2} top={1300} size={110} />
    </AbsoluteFill>
  );
};

// 4 · Máquinas para volar, cuatro siglos antes del avión
const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 40], [1, 0], clamp);
  const flap = Math.sin(frame / 7) * 6;
  const ribs = [0, 1, 2, 3, 4, 5];
  return (
    <AbsoluteFill>
      <Halo y={40} />
      <svg width={1080} height={900} viewBox="0 0 1080 900" style={{ position: "absolute", top: 220, filter: "drop-shadow(0 0 10px rgba(255,255,255,0.9))" }}>
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(540 420) scale(${side} 1) rotate(${flap})`}>
            <path d="M0 0 C 120 -160, 320 -230, 470 -150 C 380 -90, 300 -40, 0 0" fill="none" stroke="#fff" strokeWidth={6} strokeDasharray={1400} strokeDashoffset={1400 * draw} />
            {ribs.map((r) => (
              <line key={r} x1={0} y1={0} x2={120 + r * 65} y2={-150 - r * 10 + r * r * 4} stroke="#fff" strokeWidth={3} opacity={0.75} strokeDasharray={500} strokeDashoffset={500 * draw} />
            ))}
          </g>
        ))}
        <circle cx={540} cy={420} r={22} fill="none" stroke="#fff" strokeWidth={5} />
      </svg>
      <Rotulo small="diseñé máquinas para" big="volar" at={0.6} bigAt={1.2} top={180} size={170} />
      <Rotulo small="antes del primer avión:" big="4 siglos" at={1.5} bigAt={1.8} top={1250} size={190} />
    </AbsoluteFill>
  );
};

// 5 · La Mona Lisa, retocada durante años
const S5: React.FC = () => {
  const f = useAt(0, { damping: 200, stiffness: 90, mass: 1 });
  return (
    <AbsoluteFill>
      <Halo y={45} />
      <div style={{ position: "absolute", left: 300, top: 360, width: 480, height: 650, border: "14px solid #fff", boxShadow: "0 0 40px rgba(255,255,255,0.7), inset 0 0 40px rgba(255,255,255,0.25)", opacity: f, transform: `scale(${0.85 + 0.15 * f})` }}>
        <svg viewBox="0 0 45 100" width={300} height={560} style={{ position: "absolute", left: 76, top: 70, filter: "blur(1px) drop-shadow(0 0 16px rgba(255,255,255,0.8))" }}>
          <ellipse cx="22.5" cy="20" rx="10" ry="13" fill="#fff" />
          <path d="M3 100 C 4 58, 12 40, 22.5 38 C 33 40, 41 58, 42 100 Z" fill="#fff" />
        </svg>
      </div>
      <Rotulo small="y a la" big="Mona Lisa" at={0} bigAt={0.5} top={1110} size={150} />
      <Rotulo small="la seguí retocando durante" big="años" at={1.6} bigAt={3.2} top={1380} size={120} />
    </AbsoluteFill>
  );
};

// 6 · Soy Leonardo da Vinci. Nunca dejé de preguntar por qué.
const S6: React.FC = () => (
  <AbsoluteFill>
    <Halo y={38} />
    <Portrait width={860} top={180} glow />
    <Rotulo small="soy" big="Leonardo da Vinci" at={0} bigAt={0.4} top={1060} size={104} />
    <Rotulo small="nunca dejé de preguntar" big="¿por qué?" at={2.3} bigAt={4.0} top={1370} size={170} />
  </AbsoluteFill>
);

const SCENES = [S1, S2, S3, S4, S5, S6];

export const Leonardo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((Sc, i) => {
        const from = F(CUTS[i]);
        const dur = F(CUTS[i + 1]) - from;
        const t = interpolate(frame - from, [0, 8], [1, 0], clamp);
        const out = interpolate(frame - from, [dur - 4, dur], [0, 1], clamp);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill style={{ transform: `scale(${1 + 0.08 * t + 0.03 * out})`, filter: `blur(${14 * t + 8 * out}px)`, opacity: 1 - 0.6 * out }}>
              <Sc />
            </AbsoluteFill>
            {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} /> : null}
          </Sequence>
        );
      })}
      <Grain />
      <AbsoluteFill style={{ background: "radial-gradient(80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)" }} />
      <Audio src={staticFile("davinci/voz.wav")} />
    </AbsoluteFill>
  );
};
