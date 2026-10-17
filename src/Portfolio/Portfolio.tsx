import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { INTER, loadInter } from "../design/inter";
import reel from "../../portfolio/reel.json";

// Reel de portfolio de Hook House (18-10-2026): fragmentos reales de las piezas del proyecto (conceptos ficticios,
// rotulados como tales), sin voz en off, cortes en el compás de una música propia a 120 BPM y cierre de marca.

loadInter();

const FPS = 30;
const SEG = 4; // segundos por fragmento (2 compases a 120 BPM)
const T = 8; // fotogramas de transición
const GREEN = "#12A150";
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const PORTFOLIO_FRAMES = (reel.fragmentos.length * SEG + 4) * FPS;

const Fragment: React.FC<{ src: string; dur: number; first?: boolean }> = ({ src, dur, first }) => {
  const f = useCurrentFrame();
  // El primer fragmento abre ya visible: el primer fotograma muestra el resultado
  const inK = first ? 1 : interpolate(f, [0, T], [0, 1], { ...clamp, easing: ease });
  const outK = interpolate(f, [dur - T, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: inK, transform: `scale(${1.14 - 0.14 * inK + 0.06 * outK})`, filter: inK < 1 || outK > 0 ? `blur(${(1 - inK) * 14 + outK * 6}px)` : undefined }}>
      <OffthreadVideo src={staticFile(src)} muted />
    </AbsoluteFill>
  );
};

// Línea de texto con entrada por máscara y salida suave
const Line: React.FC<{ text: string; from: number; to: number; y: number; size?: number; color?: string; box?: boolean }> = ({ text, from, to, y, size = 64, color = "#FFFFFF", box = true }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [from, from + 10], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(f, [to - 8, to], [1, 0], clamp);
  if (f < from || f > to) return null;
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: y, display: "flex", justifyContent: "center", opacity: b }}>
      <div style={{ padding: box ? "22px 36px" : 0, borderRadius: 26, background: box ? "rgba(10,10,10,0.78)" : "none", backdropFilter: box ? "blur(8px)" : undefined, clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`, fontFamily: INTER, fontWeight: 800, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1.05, color, textAlign: "center" }}>
        {text}
      </div>
    </div>
  );
};

const Label: React.FC = () => {
  const f = useCurrentFrame();
  const end = reel.fragmentos.length * SEG * FPS;
  // Se oculta mientras están los textos de abajo, para no superponerse
  if (f > end || f < 3.7 * FPS || (f > 12 * FPS && f < 15.7 * FPS)) return null;
  return (
    <div style={{ position: "absolute", top: 1470, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(f, [end - 10, end], [1, 0], clamp) }}>
      <div style={{ padding: "10px 24px", borderRadius: 999, background: "rgba(10,10,10,0.7)", color: "#FFFFFF", fontFamily: INTER, fontWeight: 700, fontSize: 26, letterSpacing: "0.12em" }}>CONCEPTO DE PORTFOLIO</div>
    </div>
  );
};

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: ease });
  const dot = interpolate(f, [14, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  return (
    <AbsoluteFill style={{ background: "#0B0B0B", justifyContent: "center", alignItems: "center", opacity: interpolate(f, [0, 6], [0, 1], clamp) }}>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 168, letterSpacing: "-0.05em", color: "#FFFFFF", clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`, marginTop: -120 }}>
        hookhouse<span style={{ color: GREEN, display: "inline-block", transform: `scale(${dot})` }}>.</span>
      </div>
    </AbsoluteFill>
  );
};

export const Portfolio: React.FC = () => {
  const d = SEG * FPS;
  const end = reel.fragmentos.length * d;
  return (
    <AbsoluteFill style={{ background: "#0B0B0B" }}>
      {reel.fragmentos.map((fr, i) => (
        <Sequence key={fr.pieza} from={Math.max(0, i * d - T / 2)} durationInFrames={d + T}>
          <Fragment src={`portfolio/${fr.pieza}.mp4`} dur={d + T} first={i === 0} />
        </Sequence>
      ))}
      <Sequence from={end} durationInFrames={4 * FPS}>
        <Closing />
      </Sequence>
      <Label />
      <Line text="Tu contenido podría verse así" from={8} to={3.7 * FPS} y={1395} size={52} />
      <Line text="Edición vertical · Motion graphics" from={12 * FPS + 6} to={15.7 * FPS} y={1395} size={50} />
      <Line text="Contame tu idea por DM" from={end + 18} to={PORTFOLIO_FRAMES} y={1060} size={60} color={GREEN} box={false} />
      <Line text="Edición vertical · Motion graphics" from={end + 26} to={PORTFOLIO_FRAMES} y={1160} size={38} color="#9A9A9A" box={false} />
      {reel.fragmentos.slice(1).map((fr, i) => (
        <Sequence key={`w${fr.pieza}`} from={(i + 1) * d - 6} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={end} durationInFrames={30} layout="none">
        <Audio src={staticFile("sfx/brillo.wav")} volume={0.3} />
      </Sequence>
      <Audio src={staticFile("portfolio/musica.wav")} volume={(f) => 0.9 * interpolate(f, [PORTFOLIO_FRAMES - 30, PORTFOLIO_FRAMES], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
