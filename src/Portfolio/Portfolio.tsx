import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { INTER, loadInter } from "../design/inter";
import reel from "../../portfolio/reel.json";

// Reel de portfolio de Hook House (versión 2, 18-10-2026): piezas terminadas de conceptos propios (rotuladas como
// tales), sin voz en off, cortes en el compás de una música propia a 120 BPM y cierre de marca de 3 s.

loadInter();

const FPS = 30;
const T = 8; // fotogramas de transición
const GREEN = "#12A150";
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
type Frag = { id: string; pieza: string; desde: number; dur: number; titulo: string; filtro?: string };
const FRAGS = reel.fragmentos as Frag[];
const STARTS = FRAGS.reduce<number[]>((acc, f, i) => [...acc, i === 0 ? 0 : acc[i - 1] + Math.round(FRAGS[i - 1].dur * FPS)], []);
const END = STARTS[STARTS.length - 1] + Math.round(FRAGS[FRAGS.length - 1].dur * FPS);
export const PORTFOLIO_FRAMES = END + Math.round(reel.cierre * FPS);

const Fragment: React.FC<{ src: string; dur: number; first: boolean; filtro?: string }> = ({ src, dur, first, filtro }) => {
  const f = useCurrentFrame();
  // El primer fragmento abre ya visible: el primer fotograma muestra el resultado
  const inK = first ? 1 : interpolate(f, [0, T], [0, 1], { ...clamp, easing: ease });
  const outK = interpolate(f, [dur - T, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const blur = (1 - inK) * 14 + outK * 6;
  return (
    <AbsoluteFill style={{ opacity: inK, transform: `scale(${1.12 - 0.12 * inK + 0.05 * outK})`, filter: [filtro, blur > 0.2 ? `blur(${blur}px)` : ""].filter(Boolean).join(" ") || undefined }}>
      <OffthreadVideo src={staticFile(src)} muted />
    </AbsoluteFill>
  );
};

// Texto comercial grande, con caja oscura para leerse en el celular
const Line: React.FC<{ text: string; from: number; to: number; y: number; size: number; color?: string; box?: boolean; weight?: number }> = ({ text, from, to, y, size, color = "#FFFFFF", box = true, weight = 800 }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = interpolate(f, [from, from + 10], [0, 1], { ...clamp, easing: ease });
  const b = interpolate(f, [to - 6, to], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: y, display: "flex", justifyContent: "center", opacity: b, transform: `translateY(${(1 - a) * 24}px)` }}>
      <div style={{ padding: box ? "20px 34px" : 0, borderRadius: 28, background: box ? "rgba(8,8,8,0.82)" : "none", opacity: a, fontFamily: INTER, fontWeight: weight, fontSize: size, letterSpacing: "-0.03em", lineHeight: 1.08, color, textAlign: "center", whiteSpace: "pre-line" }}>
        {text}
      </div>
    </div>
  );
};

// Etiqueta discreta y legible de concepto ficticio
const Label: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= END) return null;
  return (
    <div style={{ position: "absolute", top: 1480, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(f, [END - 8, END], [1, 0], clamp) }}>
      <div style={{ padding: "9px 22px", borderRadius: 999, background: "rgba(8,8,8,0.72)", color: "rgba(255,255,255,0.92)", fontFamily: INTER, fontWeight: 700, fontSize: 28, letterSpacing: "0.1em" }}>CONCEPTO DE PORTFOLIO</div>
    </div>
  );
};

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 12], [0, 1], { ...clamp, easing: ease });
  const dot = interpolate(f, [10, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  return (
    <AbsoluteFill style={{ background: "#0B0B0B", alignItems: "center", opacity: interpolate(f, [0, 5], [0, 1], clamp) }}>
      <div style={{ position: "absolute", top: 560, fontFamily: INTER, fontWeight: 800, fontSize: 170, letterSpacing: "-0.05em", color: "#FFFFFF", clipPath: `inset(-10% ${(1 - a) * 100}% -10% 0)` }}>
        hookhouse<span style={{ color: GREEN, display: "inline-block", transform: `scale(${dot})` }}>.</span>
      </div>
    </AbsoluteFill>
  );
};

export const Portfolio: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B0B0B" }}>
    {FRAGS.map((fr, i) => {
      const dur = Math.round(fr.dur * FPS);
      return (
        <Sequence key={fr.id} from={Math.max(0, STARTS[i] - T / 2)} durationInFrames={dur + T}>
          <Fragment src={`portfolio/${fr.id}.mp4`} dur={dur + T} first={i === 0} filtro={fr.filtro} />
        </Sequence>
      );
    })}
    <Sequence from={END} durationInFrames={PORTFOLIO_FRAMES - END}>
      <Closing />
    </Sequence>
    <Label />
    <Line text={"Tu contenido\npodría verse así"} from={STARTS[1] + 2} to={STARTS[2] - 4} y={1010} size={84} />
    <Line text={"Edición vertical\nMotion graphics"} from={STARTS[4] + 4} to={STARTS[5] - 4} y={1080} size={72} />
    <Line text={"¿Querés un video así\npara tu marca?"} from={END + 14} to={PORTFOLIO_FRAMES} y={830} size={76} box={false} />
    <Line text="Escribime VIDEO por DM" from={END + 26} to={PORTFOLIO_FRAMES} y={1090} size={66} color={GREEN} box={false} />
    {STARTS.slice(1).map((s) => (
      <Sequence key={`w${s}`} from={s - 6} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.2} />
      </Sequence>
    ))}
    <Audio src={staticFile("portfolio/musica.wav")} volume={(f) => 0.9 * interpolate(f, [PORTFOLIO_FRAMES - 24, PORTFOLIO_FRAMES], [1, 0], clamp)} />
  </AbsoluteFill>
);
