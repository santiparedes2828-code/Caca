import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { INTER } from "../design/inter";
import { clamp, Grid, MINT, Squiggle, Typed, useIn } from "./Collage";

// Emojis de Apple en PNG (los que dio el usuario; solo en local, fuera de Git), con un salto corto de entrada
const Icon: React.FC<{ name: string; size: number; delay: number; style?: React.CSSProperties }> = ({ name, size, delay, style }) => {
  const s = useIn(delay, { damping: 10, stiffness: 190, mass: 0.6 });
  return <Img src={staticFile(`collage/apple/${name}.png`)} style={{ position: "absolute", width: size, height: size, transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`, filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.3))", ...style }} />;
};
const Strike: React.FC<{ delay: number; w: number; h: number; style?: React.CSSProperties }> = ({ delay, w, h, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 6], [0, 1], clamp);
  return <div style={{ position: "absolute", width: w * p, height: h, background: "#111", ...style }} />;
};
// Palabra destacada: blanca sobre un bloque negro (los textos van solo en blanco y negro, pedido del usuario)
const HL: React.CSSProperties = { background: "#111", padding: "4px 16px 8px", display: "inline-block", marginTop: 6 };

// Correcciones del 15-10-2026: emojis de Apple y textos solo en blanco y negro.
// Reel v09 «¿Cuál es la diferencia?» (15-10-2026) con el estilo collage del vídeo de MrBeast: estudio gris, teléfonos
// con collage verde menta, textos que se escriben, garabatos azules y tachones rojos. Dos teléfonos lado a lado,
// «ANTES» y «DESPUÉS»: el que nombra la voz se ilumina y el otro se apaga. Tiempos de la transcripción de la voz de
// marca. Todo en Inter; el logotipo «hookhouse.» en verde porque es contenido de la propia marca.

const F = (s: number) => Math.round(s * 30);
export const diferenciaDuration = F(25.4);

const Pill: React.FC<{ text: string; dark?: boolean; at: number }> = ({ text, dark, at }) => {
  const s = useIn(F(at));
  return (
    <div style={{ padding: "10px 26px", borderRadius: 999, background: dark ? "#111" : "#fff", color: dark ? "#fff" : "#111", border: "3px solid #111", fontFamily: INTER, fontWeight: 800, fontSize: 30, letterSpacing: "0.08em", transform: `scale(${s})`, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
      {text}
    </div>
  );
};

// Teléfono; «on» es el instante (en segundos, relativo a la escena) en que pasa a ser el protagonista
const Phone: React.FC<{ x: number; on: number; off?: number; mint?: boolean; children: React.ReactNode }> = ({ x, on, off = 99, mint, children }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [F(on), F(on) + 6, F(off), F(off) + 6], [0, 1, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: 520,
        width: 450,
        height: 800,
        borderRadius: 44,
        overflow: "hidden",
        border: "7px solid #fff",
        background: mint ? MINT : "#D9D9D9",
        boxShadow: `0 30px 70px rgba(0,0,0,${0.18 + 0.2 * a})`,
        transform: `scale(${0.94 + 0.08 * a}) rotate(${(x < 500 ? -2 : 2) * a}deg)`,
        filter: `grayscale(${1 - a}) brightness(${0.75 + 0.25 * a})`,
      }}
    >
      {children}
    </div>
  );
};

const Mic: React.FC<{ at?: number }> = ({ at = 0 }) => <Icon name="studio-microphone" size={170} delay={F(at)} style={{ left: 140, top: 120 }} />;

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 60, right: 60, top: 130, textAlign: "center" }}>{children}</div>
);

// ——— Escenas (tiempos relativos al inicio de cada una) ———
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useIn(0);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, top: 300, width: 800, height: 1240, borderRadius: 54, overflow: "hidden", border: "8px solid #fff", background: MINT, boxShadow: "0 40px 90px rgba(0,0,0,0.3)", transform: `translateY(${(1 - s) * 120}px) rotate(${Math.sin(frame / 20) * 0.8}deg)` }}>
        <Squiggle top={30} />
        <div style={{ position: "absolute", left: 60, right: 40, top: 300 }}>
          <Typed text="¿Cuál es la" size={84} cps={30} />
          <div style={{ position: "relative", display: "inline-block" }}>
            <Typed text="DIFERENCIA?" size={100} delay={8} cps={30} color="#fff" style={HL} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 60, right: 40, top: 700 }}>
          <div style={{ position: "relative" }}>
            <Typed text="un clip que nadie ve" size={58} delay={F(1.4)} cps={34} weight={700} />
            <Strike delay={F(2.5)} w={600} h={20} style={{ left: 0, top: 26 }} />
          </div>
          <Typed text="vs. uno que se comparte" size={58} delay={F(3.0)} cps={34} />
        </div>
        <Icon name="sleeping-face" size={130} delay={F(2.0)} style={{ right: 60, top: 860 }} />
        <Icon name="fire" size={150} delay={F(3.4)} style={{ left: 80, top: 980 }} />
      </div>
    </AbsoluteFill>
  );
};

const Mismo: React.FC = () => (
  <AbsoluteFill>
    <Title>
      <Typed text="Mismo podcast." size={80} cps={30} />
      <Typed text="Misma frase." size={80} delay={F(1.3)} cps={30} color="#fff" style={HL} />
    </Title>
    <Phone x={80} on={0}>
      <Mic />
    </Phone>
    <Phone x={550} on={0} mint>
      <Mic />
    </Phone>
  </AbsoluteFill>
);

const Pair: React.FC<{ title: string; second: number; left: React.ReactNode; right: React.ReactNode }> = ({ title, second, left, right }) => (
  <AbsoluteFill>
    <Title>
      <Typed text={title} size={70} cps={34} />
    </Title>
    <div style={{ position: "absolute", left: 80, top: 440, width: 450, display: "flex", justifyContent: "center" }}>
      <Pill text="ANTES" dark at={0} />
    </div>
    <div style={{ position: "absolute", left: 550, top: 440, width: 450, display: "flex", justifyContent: "center" }}>
      <Pill text="DESPUÉS" at={second} />
    </div>
    <Phone x={80} on={0} off={second}>
      {left}
    </Phone>
    <Phone x={550} on={second} mint>
      {right}
    </Phone>
  </AbsoluteFill>
);

const PlainSubs: React.FC = () => (
  <div style={{ position: "absolute", left: 30, right: 30, bottom: 120, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 32, color: "#fff", background: "rgba(0,0,0,0.75)", padding: "8px 10px" }}>esta es la parte en la que te cuento</div>
);

const MovingSubs: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: 360, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: INTER, fontWeight: 800 }}>
      {["esta es la", "PARTE", "QUE TE CAMBIA"].map((w, i) => {
        const s = spring({ frame: frame - F(at) - i * 5, fps: 30, config: { damping: 9, stiffness: 220 } });
        return (
          <div key={w} style={{ fontSize: i ? 74 : 40, color: i === 1 ? "#fff" : "#111", ...(i === 1 ? HL : {}), transform: `scale(${s}) rotate(${i === 1 ? -3 : 0}deg)`, lineHeight: 1.05 }}>
            {w}
          </div>
        );
      })}
    </div>
  );
};

const Bars: React.FC<{ gaps: boolean; at: number }> = ({ gaps, at }) => {
  const frame = useCurrentFrame();
  const cut = gaps ? 0 : interpolate(frame, [F(at), F(at) + 12], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 24, right: 24, top: 330, height: 180, display: "flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: 30 }, (_, i) => {
        const silent = (i >= 7 && i < 12) || (i >= 19 && i < 24);
        const v = silent ? 0.05 : 0.3 + 0.7 * Math.abs(Math.sin(i * 1.4 + frame / 5));
        const k = silent ? 1 - cut : 1;
        return <div key={i} style={{ flex: k, height: 170 * v, background: "#111", borderRadius: 3, opacity: k }} />;
      })}
    </div>
  );
};

const Edicion: React.FC = () => {
  const s = useIn(F(1.6));
  return (
    <AbsoluteFill>
      <Grid />
      <div style={{ position: "absolute", left: 60, right: 60, top: 560, textAlign: "center" }}>
        <Typed text="La diferencia es la" size={74} cps={30} />
        <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
          <Typed text="EDICIÓN" size={170} delay={F(1.2)} cps={20} color="#fff" style={HL} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 96, letterSpacing: "-0.05em", color: "#111", opacity: s, transform: `scale(${1.4 - 0.4 * s})` }}>
        hookhouse<span style={{ color: "#111" }}>.</span>
      </div>
      <Icon name="sparkles" size={120} delay={F(1.6)} style={{ right: 120, top: 460 }} />
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #19E3C9, #12BFA8)" }}>
    <div style={{ position: "absolute", left: 60, right: 60, top: 360, textAlign: "center" }}>
      <Typed text="Comentá" size={96} cps={30} />
      <Typed text="CLIP" size={230} delay={F(0.6)} cps={14} color="#fff" style={{ textShadow: "0 8px 0 #111" }} />
      <Typed text="y te edito uno gratis" size={60} delay={F(1.2)} cps={34} weight={700} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {[0, 1, 2].map((i) => (
        <CommentCard key={i} i={i} />
      ))}
    </div>
  </AbsoluteFill>
);

const CommentCard: React.FC<{ i: number }> = ({ i }) => {
  const s = useIn(F(1.0) + i * 7);
  return (
    <div style={{ width: 640 - i * 80, display: "flex", alignItems: "center", gap: 20, padding: "18px 28px", borderRadius: 28, background: "#fff", border: "4px solid #111", boxShadow: "8px 8px 0 #111", opacity: s, transform: `translateY(${(1 - s) * 60}px)`, fontFamily: INTER }}>
      <div style={{ width: 54, height: 54, borderRadius: 54, background: ["#111", "#fff", "#111"][i], border: "3px solid #111" }} />
      <div style={{ fontWeight: 800, fontSize: 50 - i * 6, color: "#111" }}>CLIP</div>
    </div>
  );
};

// Escenas: inicio absoluto (s) y componente
const SCENES: [number, React.FC][] = [
  [0, Hook],
  [4.5, Mismo],
  [
    7.0,
    () => (
      <Pair
        title="cómo arranca"
        second={2.9}
        left={
          <div style={{ position: "absolute", left: 30, right: 30, top: 300 }}>
            <Typed text="«hola, bienvenidos a un nuevo episodio...»" size={44} delay={F(1.0)} cps={30} weight={700} />
            <Icon name="sleeping-face" size={120} delay={F(1.8)} style={{ left: 150, top: 320 }} />
          </div>
        }
        right={
          <div style={{ position: "absolute", left: 30, right: 30, top: 280 }}>
            <Typed text="LA FRASE" size={78} delay={F(3.4)} cps={26} />
            <Typed text="MÁS FUERTE" size={78} delay={F(3.8)} cps={26} color="#fff" style={HL} />
            <Icon name="fire" size={130} delay={F(4.2)} style={{ left: 140, top: 260 }} />
          </div>
        }
      />
    ),
  ],
  [
    12.3,
    () => (
      <Pair
        title="los subtítulos"
        second={2.1}
        left={
          <>
            <Mic />
            <PlainSubs />
          </>
        }
        right={
          <>
            <Mic />
            <MovingSubs at={2.7} />
          </>
        }
      />
    ),
  ],
  [
    16.8,
    () => (
      <Pair
        title="los silencios"
        second={1.9}
        left={<Bars gaps at={0} />}
        right={
          <>
            <Bars gaps={false} at={2.4} />
            <Icon name="check-mark-button" size={120} delay={F(2.6)} style={{ left: 160, top: 560 }} />
          </>
        }
      />
    ),
  ],
  [20.0, Edicion],
  [22.1, Cta],
];

export const Diferencia: React.FC = () => {
  const frame = useCurrentFrame();
  const end = diferenciaDuration;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(70% 60% at 50% 40%, #FFFFFF 0%, #D2D2D2 70%, #ABABAB 100%)", overflow: "hidden" }}>
      {SCENES.map(([start, Sc], i) => {
        const from = F(start);
        const dur = (SCENES[i + 1] ? F(SCENES[i + 1][0]) : end) - from;
        const t = interpolate(frame - from, [0, 7], [1, 0], clamp);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <AbsoluteFill style={{ transform: `scale(${1 + 0.12 * t}) translateY(${t * 40}px)`, filter: `blur(${12 * t}px)` }}>
              <Sc />
            </AbsoluteFill>
            {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} /> : null}
          </Sequence>
        );
      })}
      {/* el «DESPUÉS» de cada par suena con un pop */}
      {[9.9, 14.4, 18.7].map((s) => (
        <Sequence key={s} from={F(s)} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.4} />
        </Sequence>
      ))}
      <Audio src={staticFile("collage/dif.wav")} />
      <Audio src={staticFile("collage/musica.wav")} volume={(f) => 0.22 * interpolate(f, [end - 20, end], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
