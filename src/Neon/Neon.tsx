import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Estilo «neón» (referencia de Klickpin del 14-10-2026, solo para estudio local en analisis10/): cada escena con su
// fondo (cuadrícula clara tipo collage, degradado oscuro, rojo profundo, azul con haces de colores, oscuro con
// círculos naranjas, crema con manchas amarillas, azul violeta), texto grande con brillo, pastillas de cristal e
// iconos 3D que saltan. Todo en Inter (regla de la casa; la referencia usa una serif que aquí no se permite).
// Vídeo v04 «MrBeast tarda 5 meses», con la foto de MrBeast en viñeta de cómic.

loadInter();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const S = [105, 75, 90, 90, 90, 120, 105]; // duración de cada escena (frames a 30 fps)
export const neonDuration = S.reduce((a, b) => a + b, 0);

const useIn = (delay: number, cfg = { damping: 14, stiffness: 170, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: cfg });
};

const Glow: React.FC<{ children: React.ReactNode; size: number; color?: string; glow?: string; delay?: number; weight?: number; style?: React.CSSProperties }> = ({
  children,
  size,
  color = "#fff",
  glow = "rgba(255,255,255,0.75)",
  delay = 0,
  weight = 800,
  style,
}) => {
  const s = useIn(delay);
  return (
    <div
      style={{
        fontFamily: INTER,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color,
        textAlign: "center",
        opacity: s,
        transform: `translateY(${(1 - s) * 40}px) scale(${1.15 - 0.15 * s})`,
        filter: `blur(${(1 - s) * 12}px)`,
        textShadow: `0 0 ${size * 0.18}px ${glow}, 0 0 ${size * 0.45}px ${glow}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Icon: React.FC<{ name: string; size: number; delay: number; tile?: boolean; style?: React.CSSProperties }> = ({ name, size, delay, tile, style }) => {
  const s = useIn(delay, { damping: 10, stiffness: 190, mass: 0.6 });
  const frame = useCurrentFrame();
  const bob = Math.sin((frame - delay) / 9) * 6;
  const img = <Img src={staticFile(`neon/${name}.svg`)} style={{ width: size, height: size, filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.35))" }} />;
  return (
    <div style={{ transform: `translateY(${bob}px) scale(${s}) rotate(${(1 - s) * -25}deg)`, opacity: s > 0.01 ? 1 : 0, ...style }}>
      {tile ? (
        <div
          style={{
            padding: size * 0.22,
            borderRadius: size * 0.36,
            background: "linear-gradient(160deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
            border: "3px solid rgba(255,255,255,0.55)",
            boxShadow: "0 0 40px rgba(255,80,80,0.6), inset 0 0 20px rgba(255,255,255,0.25)",
          }}
        >
          {img}
        </div>
      ) : (
        img
      )}
    </div>
  );
};

const Pill: React.FC<{ text: string; delay: number; dark?: boolean; size?: number; glowColor?: string }> = ({ text, delay, dark, size = 64, glowColor }) => {
  const s = useIn(delay);
  return (
    <div
      style={{
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: size,
        padding: `${size * 0.4}px ${size * 0.9}px`,
        borderRadius: 999,
        color: dark ? "#141414" : glowColor ?? "#fff",
        background: dark ? "rgba(255,255,255,0.55)" : "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))",
        border: `3px solid ${dark ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"}`,
        boxShadow: dark ? "0 18px 40px rgba(180,120,0,0.18)" : `0 0 40px rgba(0,0,0,0.4), inset 0 0 18px rgba(255,255,255,0.12)`,
        textShadow: !dark && glowColor ? `0 0 20px ${glowColor}` : "none",
        backdropFilter: "blur(10px)",
        opacity: s,
        transform: `scale(${0.7 + 0.3 * s})`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// 1 · Collage claro con cuadrícula y MrBeast en viñeta de cómic
const Escena1: React.FC = () => {
  const frame = useCurrentFrame();
  const p = useIn(0, { damping: 12, stiffness: 120, mass: 0.8 });
  return (
    <AbsoluteFill style={{ background: "#ECECEC" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,0.12) 2px, transparent 2px)", backgroundSize: "90px 90px", backgroundPosition: "45px 45px", maskImage: "radial-gradient(70% 60% at 45% 50%, black 40%, transparent 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: 250,
          top: 150,
          width: 640,
          height: 800,
          background: "#FFD43B",
          border: "12px solid #111",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "18px 18px 0 #111",
          transform: `translateY(${(1 - p) * 500}px) rotate(${-4 + (1 - p) * 10}deg)`,
        }}
      >
        <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.18) 3px, transparent 3.5px)", backgroundSize: "26px 26px" }} />
        <Img
          src={staticFile("neon/mrbeast.png")}
          style={{ position: "absolute", left: -10, bottom: -10, width: 660, transform: `scale(${1 + frame * 0.0012})`, transformOrigin: "50% 100%", filter: "drop-shadow(0 0 0 #fff) drop-shadow(8px 0 0 #fff) drop-shadow(-8px 0 0 #fff) drop-shadow(0 -8px 0 #fff)" }}
        />
      </div>
      <div style={{ position: "absolute", left: 90, top: 120 }}>
        <Icon name="alarm-clock" size={200} delay={10} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <Glow size={78} color="#141414" glow="rgba(255,255,255,0)" delay={14} weight={700}>
          MrBeast tarda
        </Glow>
        <Glow size={230} color="#E8341C" glow="rgba(232,52,28,0.35)" delay={22}>
          5 MESES
        </Glow>
        <Glow size={78} color="#141414" glow="rgba(255,255,255,0)" delay={32} weight={700}>
          en hacer UN video
        </Glow>
      </div>
    </AbsoluteFill>
  );
};

// 2 · Degradado oscuro, texto blanco con brillo
const Escena2: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(90% 70% at 30% 30%, #6B6660 0%, #2A2725 55%, #141312 100%)", justifyContent: "center", paddingLeft: 110, gap: 20 }}>
    <Glow size={80} weight={700} style={{ textAlign: "left" }} delay={2}>
      lo dijo él:
    </Glow>
    <Glow size={150} style={{ textAlign: "left" }} delay={10}>
      meses de idea,
    </Glow>
    <Glow size={110} style={{ textAlign: "left" }} delay={22}>
      semanas grabando
    </Glow>
  </AbsoluteFill>
);

// 3 · Rojo profundo, palabra gigante con brillo rojo e iconos en baldosas de cristal
const Escena3: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #180203 0%, #5A0408 45%, #B8101A 100%)", alignItems: "center", justifyContent: "center" }}>
    <Glow size={120} color="#fff" glow="rgba(255,60,60,0.9)" delay={2} weight={700}>
      y 3 semanas de
    </Glow>
    <Glow size={230} color="#FF2D3A" glow="rgba(255,30,40,0.95)" delay={10} style={{ marginTop: 10 }}>
      EDICIÓN
    </Glow>
    <div style={{ display: "flex", gap: 40, marginTop: 70 }}>
      <Icon name="light-bulb" size={130} delay={22} tile />
      <Icon name="movie-camera" size={130} delay={30} tile />
      <Icon name="clapper-board" size={130} delay={38} tile />
    </div>
  </AbsoluteFill>
);

// 4 · Azul con haces de colores que salen de una carpeta
const Escena4: React.FC = () => {
  const frame = useCurrentFrame();
  const beam = interpolate(frame, [8, 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0A0E3A 0%, #1B2A8C 55%, #0A0E3A 100%)", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 160, left: 0, right: 0 }}>
        <Glow size={92} weight={700} delay={2}>
          y vos querés subir
        </Glow>
      </div>
      {[
        ["#FFE600", -34],
        ["#FF3DA5", 0],
        ["#36C2FF", 30],
      ].map(([c, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 - 140,
            top: 1240 - 1000 * beam,
            width: 280,
            height: 1000 * beam,
            transformOrigin: "50% 100%",
            transform: `rotate(${r as number}deg)`,
            background: `linear-gradient(0deg, ${c} 0%, transparent 100%)`,
            clipPath: "polygon(35% 100%, 65% 100%, 100% 0, 0 0)",
            opacity: 0.85,
            mixBlendMode: "screen",
          }}
        />
      ))}
      <div style={{ position: "absolute", top: 560, left: 0, right: 0 }}>
        <Glow size={190} delay={16} glow="rgba(120,200,255,0.9)">
          UNO POR DÍA
        </Glow>
      </div>
      <div style={{ position: "absolute", top: 1180 }}>
        <Icon name="file-folder" size={200} delay={0} />
      </div>
    </AbsoluteFill>
  );
};

// 5 · Oscuro con círculos naranjas y pastilla de cristal
const Escena5: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#120806", alignItems: "center", justifyContent: "center", gap: 50 }}>
      <div style={{ position: "absolute", left: -260, top: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle at 70% 70%, #A3401A, #3A1208)", transform: `translateY(${frame * 0.8}px)` }} />
      <div style={{ position: "absolute", right: -300, bottom: -260, width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #B3471C, #3A1208)", transform: `translateY(${-frame * 0.8}px)` }} />
      <Glow size={74} weight={700} delay={2}>
        el truco no es grabar más,
      </Glow>
      <Glow size={74} weight={700} delay={10}>
        es
      </Glow>
      <Pill text="RECORTAR MEJOR" delay={18} size={84} glowColor="#FFE14D" />
    </AbsoluteFill>
  );
};

// 6 · Crema con manchas amarillas: pasos en pastillas de cristal con iconos
const Escena6: React.FC = () => {
  const steps: [string, string][] = [
    ["GRABÁ LARGO", "movie-camera"],
    ["CORTÁ CLIPS", "scissors"],
    ["PUBLICÁ TODO", "rocket"],
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #FFF6EA, #FFE7C4)", alignItems: "center", justifyContent: "center", gap: 70 }}>
      <div style={{ position: "absolute", right: -220, top: 140, width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #FFF15A, #FFC300)", filter: "blur(4px)" }} />
      <div style={{ position: "absolute", left: -300, bottom: 120, width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle at 60% 40%, #FFD43B, #F28C00)", filter: "blur(4px)" }} />
      {steps.map(([t, ic], i) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <Icon name={ic} size={150} delay={8 + i * 26} />
          <Pill text={t} delay={4 + i * 26} dark size={66} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

// 7 · Azul violeta con texto amarillo neón y comentarios apilados
const Escena7: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #2A1BB8 0%, #3B2BE0 50%, #1A1270 100%)", alignItems: "center" }}>
    <div style={{ position: "absolute", top: 380, display: "flex", gap: 26, alignItems: "baseline" }}>
      <Glow size={110} weight={700} delay={2}>
        escribí
      </Glow>
      <Glow size={150} color="#F4FF3A" glow="rgba(244,255,58,0.9)" delay={10}>
        CLIP
      </Glow>
    </div>
    <div style={{ position: "absolute", top: 560 }}>
      <Glow size={70} weight={700} delay={18}>
        y te edito uno gratis
      </Glow>
    </div>
    <div style={{ position: "absolute", top: 820, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {[0, 1, 2, 3].map((i) => (
        <Comment key={i} i={i} />
      ))}
    </div>
  </AbsoluteFill>
);

const Comment: React.FC<{ i: number }> = ({ i }) => {
  const s = useIn(26 + i * 8, { damping: 13, stiffness: 180, mass: 0.6 });
  const w = 620 - i * 70;
  return (
    <div
      style={{
        width: w,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "20px 30px",
        borderRadius: 30,
        background: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
        border: "3px solid rgba(255,255,255,0.4)",
        boxShadow: "0 0 30px rgba(140,120,255,0.6)",
        opacity: s * (1 - i * 0.15),
        transform: `translateY(${(1 - s) * 60}px) scale(${1 - i * 0.05})`,
        fontFamily: INTER,
      }}
    >
      <Img src={staticFile(`neon/${i % 2 ? "star-struck" : "fire"}.svg`)} style={{ width: 64 - i * 6, height: 64 - i * 6 }} />
      <div>
        <div style={{ fontWeight: 500, fontSize: 22, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em" }}>COMENTARIO</div>
        <div style={{ fontWeight: 800, fontSize: 52 - i * 6, color: "#fff", textShadow: "0 0 16px rgba(255,255,255,0.7)" }}>CLIP</div>
      </div>
    </div>
  );
};

const SCENES = [Escena1, Escena2, Escena3, Escena4, Escena5, Escena6, Escena7];

export const Neon: React.FC = () => {
  const frame = useCurrentFrame();
  let from = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENES.map((Sc, i) => {
        const start = from;
        from += S[i];
        const local = frame - start;
        // Entrada con zoom y desenfoque cortos entre escenas
        const t = interpolate(local, [0, 7], [1, 0], clamp);
        return (
          <Sequence key={i} from={start} durationInFrames={S[i]} layout="none">
            <AbsoluteFill style={{ transform: `scale(${1 + 0.12 * t})`, filter: `blur(${16 * t}px)` }}>
              <Sc />
            </AbsoluteFill>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={i ? 0.5 : 0} />
            <Sequence from={14} layout="none">
              <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
            </Sequence>
          </Sequence>
        );
      })}
      <Audio src={staticFile("neon/musica.wav")} volume={(f) => 0.5 * interpolate(f, [neonDuration - 20, neonDuration], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
