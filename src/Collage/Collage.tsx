import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Estilo «collage antes/después» (referencia de Klickpin del 14-10-2026, solo para estudio local en analisis11/):
// fondo de estudio gris, un teléfono con el resultado («FINAL OUTPUT») y a su izquierda una tarjeta negra con la onda
// del audio («BEFORE»). Dentro, collage sobre verde menta: recortes en blanco y negro, garabatos azules, bloques rojos
// que tachan palabras, cuadrícula, iconos y textos que se escriben. Todo en Inter (regla de la casa). Escenas
// sincronizadas con el audio de la referencia (borrador local, no publicable: la locución es de otro creador).

loadInter();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const MINT = "#9EDDD2";
const PHONE = { x: 330, y: 300, w: 660, h: 1240 };
// Escenas: inicio en segundos (según la transcripción del audio)
const CUTS = [0, 2.1, 4.6, 5.9, 7.8, 10.2, 12.1, 14.3, 18.1];
export const collageDuration = Math.round(CUTS[CUTS.length - 1] * 30);

const useIn = (delay: number, cfg = { damping: 14, stiffness: 170, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: cfg });
};

// Texto que se escribe letra a letra
const Typed: React.FC<{ text: string; size: number; delay?: number; cps?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({ text, size, delay = 0, cps = 22, color = "#111", weight = 800, style }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - delay) / 30) * cps));
  return (
    <div style={{ fontFamily: INTER, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.03em", color, ...style }}>
      {text.slice(0, n)}
      {n > 0 && n < text.length ? <span style={{ opacity: 0.6 }}>|</span> : null}
    </div>
  );
};

const Strike: React.FC<{ delay: number; w: number; h: number; style?: React.CSSProperties }> = ({ delay, w, h, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 6], [0, 1], clamp);
  return <div style={{ position: "absolute", width: w * p, height: h, background: "#E0261B", ...style }} />;
};

const Squiggle: React.FC<{ top: number; delay?: number }> = ({ top, delay = 0 }) => {
  const frame = useCurrentFrame();
  const len = interpolate(frame, [delay, delay + 18], [1400, 0], clamp);
  return (
    <svg width={PHONE.w} height={240} style={{ position: "absolute", left: 0, top }} viewBox="0 0 660 240">
      <path d="M -20 120 C 80 -20, 160 -20, 240 120 S 400 260, 480 120 S 620 -20, 700 80" fill="none" stroke="#3FC1F0" strokeWidth={16} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={len} />
    </svg>
  );
};

const Icon: React.FC<{ name: string; size: number; delay: number; style?: React.CSSProperties }> = ({ name, size, delay, style }) => {
  const s = useIn(delay, { damping: 10, stiffness: 190, mass: 0.6 });
  return <Img src={staticFile(`collage/${name}.svg`)} style={{ position: "absolute", width: size, height: size, transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`, filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.3))", ...style }} />;
};

const Beast: React.FC<{ bw?: boolean; width: number; style?: React.CSSProperties }> = ({ bw, width, style }) => {
  const frame = useCurrentFrame();
  return (
    <Img
      src={staticFile("collage/mrbeast.png")}
      style={{ position: "absolute", width, transform: `scale(${1 + frame * 0.0015})`, transformOrigin: "50% 100%", filter: `${bw ? "grayscale(1) contrast(1.15)" : ""} drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 -6px 0 #fff)`, ...style }}
    />
  );
};

const Grid: React.FC = () => (
  <AbsoluteFill style={{ background: "#E9E9E9" }}>
    <div style={{ position: "absolute", left: 90, top: 280, width: 480, height: 640, backgroundImage: "linear-gradient(#222 2px, transparent 2px), linear-gradient(90deg, #222 2px, transparent 2px)", backgroundSize: "60px 60px", opacity: 0.55, maskImage: "radial-gradient(closest-side, black 55%, transparent 100%)" }} />
  </AbsoluteFill>
);

// ——— Escenas dentro del teléfono ———
const E1: React.FC = () => {
  const s = useIn(10);
  return (
    <AbsoluteFill style={{ background: MINT }}>
      <Beast bw width={620} style={{ left: 20, bottom: -10 }} />
      <div style={{ position: "absolute", left: 200, bottom: 120, padding: "18px 40px", borderRadius: 999, background: "#111", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 52, transform: `scale(${s}) rotate(-6deg)`, border: "5px solid #9EF0FF", boxShadow: "0 0 30px rgba(120,230,255,0.8)" }}>Mr. Beast</div>
      <div style={{ position: "absolute", left: 40, top: 40, fontFamily: INTER, fontWeight: 500, fontSize: 24, color: "#1a1a1a", opacity: 0.8 }}>Jimmy Donaldson · creador</div>
    </AbsoluteFill>
  );
};
const E2: React.FC = () => (
  <AbsoluteFill style={{ background: MINT }}>
    <Beast bw width={560} style={{ left: -250, bottom: -10, opacity: 0.9 }} />
    <Squiggle top={60} />
    <div style={{ position: "absolute", left: 300, top: 360, width: 340 }}>
      <Typed text="this is how" size={64} delay={0} />
      <Typed text="I built a" size={64} delay={14} />
      <Typed text="BILLION $" size={72} delay={26} color="#E0261B" />
      <Typed text="EMPIRE" size={92} delay={40} />
    </div>
  </AbsoluteFill>
);
const E3: React.FC = () => (
  <AbsoluteFill style={{ background: MINT }}>
    <Squiggle top={40} />
    <div style={{ position: "absolute", left: 50, top: 420, width: 560, borderBottom: "6px solid #111", paddingBottom: 12 }}>
      <Typed text="I failed first" size={92} cps={30} />
    </div>
    <Icon name="chart-decreasing" size={300} delay={8} style={{ left: 180, top: 640 }} />
  </AbsoluteFill>
);
const E4: React.FC = () => (
  <AbsoluteFill style={{ background: MINT }}>
    <Squiggle top={40} />
    <div style={{ position: "absolute", left: 50, top: 420, width: 560, borderBottom: "6px solid #111", paddingBottom: 12, display: "flex", gap: 30 }}>
      <div style={{ position: "relative" }}>
        <Typed text="No views" size={84} cps={30} />
        <Strike delay={14} w={330} h={26} style={{ left: 0, top: 34 }} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 50, top: 560 }}>
      <div style={{ position: "relative" }}>
        <Typed text="No money" size={84} delay={28} cps={30} />
        <Strike delay={42} w={360} h={26} style={{ left: 0, top: 34 }} />
      </div>
    </div>
    <Icon name="eyes" size={170} delay={6} style={{ right: 50, top: 200 }} />
    <Icon name="money-with-wings" size={260} delay={30} style={{ left: 200, top: 760 }} />
  </AbsoluteFill>
);
const E5: React.FC = () => (
  <AbsoluteFill style={{ background: MINT }}>
    <Squiggle top={40} />
    <div style={{ position: "absolute", left: 50, top: 380, width: 560 }}>
      <div style={{ position: "relative" }}>
        <Typed text="Most people" size={84} cps={26} />
        <Typed text="quit here" size={84} delay={12} cps={26} />
        <Strike delay={34} w={380} h={90} style={{ left: 0, top: 92, mixBlendMode: "multiply", opacity: 0.85 }} />
      </div>
      <div style={{ marginTop: 40 }}>
        <Typed text="but I didn't." size={96} delay={40} cps={26} color="#fff" style={{ background: "#111", display: "inline-block", padding: "6px 18px" }} />
      </div>
    </div>
    <Icon name="cross-mark" size={150} delay={36} style={{ right: 50, top: 230 }} />
  </AbsoluteFill>
);
const E6: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Grid />
      <div style={{ position: "absolute", left: 50, right: 50, top: 540, textAlign: "center" }}>
        <Typed text="Tired of failing" size={82} cps={20} />
      </div>
      <div style={{ position: "absolute", left: 110, top: 760, width: 30, height: 30, background: "#111", opacity: Math.floor(frame / 8) % 2 }} />
    </AbsoluteFill>
  );
};
const E7: React.FC = () => {
  const s = useIn(0, { damping: 11, stiffness: 160, mass: 0.7 });
  const b = useIn(16);
  return (
    <AbsoluteFill>
      <Grid />
      <div style={{ position: "absolute", left: 130, top: 360, width: 400, height: 400, borderRadius: "50%", background: "#fff", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", transform: `scale(${s})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 220, height: 156, borderRadius: 44, background: "#FF0033", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 0, height: 0, borderTop: "36px solid transparent", borderBottom: "36px solid transparent", borderLeft: "62px solid #fff", marginLeft: 12 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 840, border: "5px solid #111", padding: "16px 10px", background: "#fff", textAlign: "center", opacity: b, transform: `scale(${0.8 + 0.2 * b})` }}>
        <Typed text="Treated YouTube" size={52} delay={16} cps={30} />
        <Typed text="like a business" size={52} delay={30} cps={30} />
      </div>
      <Icon name="chart-increasing" size={140} delay={24} style={{ right: 60, top: 220 }} />
      <Icon name="dollar-banknote" size={130} delay={30} style={{ left: 50, top: 230 }} />
    </AbsoluteFill>
  );
};
const E8: React.FC = () => {
  const s = useIn(0);
  return (
    <AbsoluteFill style={{ background: "#F2F2F2" }}>
      <div style={{ position: "absolute", left: -60, right: -60, top: -260, height: 620, borderRadius: "0 0 50% 50%", background: "linear-gradient(180deg, #19E3C9, #12BFA8)", transform: `translateY(${(1 - s) * -300}px)` }} />
      <div style={{ position: "absolute", left: 60, top: 70 }}>
        <Typed text="Did it better" size={74} cps={26} />
        <Typed text="BIGGER" size={96} delay={22} cps={20} />
        <Typed text="every single time" size={40} delay={46} cps={30} weight={500} />
      </div>
      <Beast width={620} style={{ left: 20, bottom: -10 }} />
      <Icon name="money-with-wings" size={150} delay={20} style={{ left: 30, top: 520 }} />
      <Icon name="crown" size={140} delay={34} style={{ right: 40, top: 480 }} />
      <Icon name="sparkles" size={110} delay={50} style={{ right: 110, top: 380 }} />
    </AbsoluteFill>
  );
};
const SCENES = [E1, E2, E3, E4, E5, E6, E7, E8];

const Wave: React.FC<{ env: number[] }> = ({ env }) => {
  const frame = useCurrentFrame();
  const n = 15;
  return (
    <div style={{ position: "absolute", left: 40, top: 760, width: 240, height: 240, borderRadius: 40, background: "#0B0B0B", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 24px 50px rgba(0,0,0,0.35)" }}>
      {Array.from({ length: n }, (_, i) => {
        const v = env[Math.min(env.length - 1, Math.max(0, frame - Math.abs(i - 7)))] ?? 0;
        const edge = 1 - Math.abs(i - 7) / 9;
        return <div key={i} style={{ width: 7, height: 12 + 170 * v * edge, borderRadius: 7, background: "#fff" }} />;
      })}
      <div style={{ position: "absolute", bottom: -54, fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#222", letterSpacing: "0.1em" }}>BEFORE</div>
    </div>
  );
};

export const Collage: React.FC<{ env: number[] }> = ({ env }) => {
  const frame = useCurrentFrame();
  const intro = spring({ frame, fps: 30, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(70% 60% at 50% 40%, #FFFFFF 0%, #CFCFCF 70%, #A9A9A9 100%)" }}>
      <div style={{ position: "absolute", left: PHONE.x, top: 200, width: PHONE.w, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 34, color: "#222", letterSpacing: "0.04em" }}>
        ✦ FINAL <b style={{ fontWeight: 800 }}>OUTPUT</b> ✦
      </div>
      <Wave env={env} />
      <svg width={120} height={120} style={{ position: "absolute", left: 140, top: 600 }} viewBox="0 0 120 120">
        <path d="M 20 100 C 30 40, 60 30, 100 25 M 80 15 L 102 24 L 88 44" fill="none" stroke="#222" strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: 54, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 40px 90px rgba(0,0,0,0.35)", transform: `translateY(${(1 - intro) * 80}px)`, background: "#fff" }}>
        {SCENES.map((Sc, i) => {
          const from = Math.round(CUTS[i] * 30);
          const dur = Math.round(CUTS[i + 1] * 30) - from;
          const t = interpolate(frame - from, [0, 6], [1, 0], clamp);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill style={{ transform: `scale(${1 + 0.1 * t})`, filter: `blur(${12 * t}px)` }}>
                <Sc />
              </AbsoluteFill>
              {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} /> : null}
            </Sequence>
          );
        })}
      </div>
      <Audio src={staticFile("collage/audio.wav")} />
    </AbsoluteFill>
  );
};
