import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionPage } from "../autopilot/props";
import { B, SANS } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { Capi2D, mixMouth, mouthAt, type CapiPose } from "./Capi2D";
import data from "./kuleshov.json";

// Vídeo viral de Hook House con Capi en 2D, de frente y en el centro, hablando con la voz de marca: el efecto
// Kuleshov (dato real de la historia del montaje). Arriba, una «pantalla» con los motion graphics; en medio, los
// subtítulos en Inter Bold; abajo, Capi articulando cada palabra. Identidad Hook House, emojis Fluent, efectos
// propios.

export const KULESHOV_FPS = 30;
export const kuleshovDuration = Math.round((data.words[data.words.length - 1].endMs / 1000 + 1.6) * KULESHOV_FPS);

type Word = { text: string; startMs: number; endMs: number };
const W = data.words as Word[];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (ms: number) => Math.round((ms / 1000) * KULESHOV_FPS);
const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const at = (text: string, nth = 0) => {
  const hits = W.filter((w) => norm(w.text) === text);
  return f((hits[nth] ?? hits[0]).startMs);
};
const env = (frame: number) => data.envelope[Math.max(0, Math.min(data.envelope.length - 1, frame))] ?? 0;
const icon = (n: keyof typeof data.icons) => data.icons[n];
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const KEYS = new Set(["experimento", "100", "cerebro", "kuleshov", "sopa", "ataúd", "diván", "hambre", "tristeza", "deseo", "mismo", "grabas", "editas", "graba", "yo"]);
const PAGES: CaptionPage[] = (data.pages as CaptionPage[]).map((p) => ({
  ...p,
  lines: p.lines.map((l) => l.map((t) => ({ ...t, emphasis: KEYS.has(norm(t.text)) }))),
}));

// Tiempos de la historia
const T = {
  cien: at("100"),
  edicion: at("edición"),
  cerebro: at("cerebro"),
  lev: at("lev"),
  actor: at("actor"),
  expresion: at("expresión"),
  imagenes: at("imágenes"),
  sopa: at("sopa"),
  ataud: at("ataúd"),
  divan: at("diván"),
  publico: at("público"),
  hambre: at("hambre"),
  tristeza: at("tristeza"),
  deseo: at("deseo"),
  pero: at("pero"),
  mismo: at("mismo", 1),
  tres: at("tres", 1),
  no: at("no"),
  es: at("es", 1),
  editas: at("editas"),
  tu: at("tú"),
  encargo: at("encargo"),
  yo: at("yo"),
};

// ——— Pantalla de motion graphics ———
const SCREEN = { x: 80, y: 300, w: 860, h: 500 };

// Un «plano» dentro de la pantalla: entra deslizando con desenfoque y sale hacia el otro lado
const Beat: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 8) return null;
  const i = interpolate(frame, [from, from + 10], [0, 1], { ...clamp, easing: ease });
  const o = interpolate(frame, [to, to + 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${(1 - i) * 140 - o * 140}px) scale(${0.94 + 0.06 * i - 0.04 * o})`,
        opacity: Math.min(i * 1.3, 1 - o),
        filter: i < 1 || o > 0 ? `blur(${(1 - i + o) * 10}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const pop = (frame: number, enter: number, fps: number, damping = 11) => spring({ frame: frame - enter, fps, config: { damping, stiffness: 190, mass: 0.6 } });

const Title: React.FC<{ text: string; enter: number; size: number; y: number; color?: string; track?: string }> = ({ text, enter, size, y, color = B.ink, track = "-0.04em" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: y, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: size * 0.25, fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: track, color }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: frame - enter - i * 3, fps, config: { damping: 15, stiffness: 180 } });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.1 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - s) * 105}%)` }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

const Tag: React.FC<{ text: string; x: number; y: number; enter: number; size?: number; bg?: string; rot?: number }> = ({ text, x, y, enter, size = 34, bg = B.green, rot = -3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enter) return null;
  const s = pop(frame, enter, fps, 9);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rot + (1 - s) * 14}deg)`,
        padding: `${size * 0.24}px ${size * 0.6}px`,
        borderRadius: size * 0.4,
        background: bg,
        color: B.white,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
        boxShadow: "0 10px 22px rgba(0,0,0,0.16)",
      }}
    >
      {text}
    </div>
  );
};

const Emoji: React.FC<{ name: keyof typeof data.icons; x: number; y: number; size: number; enter: number }> = ({ name, x, y, size, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enter) return null;
  const s = pop(frame, enter, fps, 8);
  const float = Math.sin((frame - enter) / 14) * 6;
  return <Img src={icon(name)} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + float, width: size, height: size, transform: `scale(${s}) rotate(${(1 - s) * -24}deg)`, filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.16))" }} />;
};

// Cara neutra de Capi (el «actor») dentro de un fotograma
const NEUTRAL: CapiPose = { mouth: { open: 0, width: 0.85, round: 0 }, blink: 0, brow: 0, browTilt: 0, lookX: 0, lookY: 0, tilt: 0, breathe: 0, wink: 0, smile: 0 };
const ActorFace: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: w, overflow: "hidden", position: "relative", background: "#EDEBE2" }}>
    <div style={{ position: "absolute", left: -w * 0.05, top: w * 0.02 }}>
      <Capi2D pose={NEUTRAL} width={w * 1.1} />
    </div>
  </div>
);

// Fotograma de película (borde negro con perforaciones)
const Frame: React.FC<{ w: number; h: number; children: React.ReactNode; glow?: number }> = ({ w, h, children, glow = 0 }) => {
  const holes = Math.max(3, Math.round(w / 40));
  const row = (top: boolean) => (
    <div style={{ position: "absolute", left: 8, right: 8, [top ? "top" : "bottom"]: 7, display: "flex", justifyContent: "space-between" }}>
      {Array.from({ length: holes }, (_, i) => (
        <div key={i} style={{ width: 14, height: 11, borderRadius: 3, background: "#F7F7F2", opacity: 0.9 }} />
      ))}
    </div>
  );
  return (
    <div style={{ position: "relative", width: w, height: h, background: B.ink, borderRadius: 14, boxShadow: `0 14px 28px rgba(0,0,0,0.22), 0 0 0 ${glow * 8}px ${B.green}` }}>
      {row(true)}
      {row(false)}
      <div style={{ position: "absolute", left: 10, right: 10, top: 28, bottom: 28, borderRadius: 6, overflow: "hidden", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

// Contador que rueda hasta +100
const Counter: React.FC<{ enter: number }> = ({ enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [enter, enter + 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = pop(frame, enter, fps, 12);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SANS, transform: `scale(${0.7 + 0.3 * s})` }}>
      <div style={{ fontSize: 230, fontWeight: 800, letterSpacing: "-0.05em", color: B.green, lineHeight: 0.95, fontVariantNumeric: "tabular-nums" }}>+{Math.round(100 * p)}</div>
      <div style={{ fontSize: 46, fontWeight: 800, color: B.ink, letterSpacing: "0.3em", marginTop: 10 }}>AÑOS</div>
    </div>
  );
};

// La tira de película del experimento: [sopa][cara][ataúd][cara][diván][cara]
const Strip: React.FC = () => {
  const frame = useCurrentFrame();
  const fw = 250;
  const gap = 16;
  const cell = fw + gap;
  // Desplazamiento: centra cada imagen cuando se nombra y al final se aleja para ver la tira entera
  const stops: [number, number][] = [
    [T.imagenes - 4, 0.5],
    [T.ataud - 4, 2.5],
    [T.divan - 4, 4.5],
  ];
  const passed = stops.filter(([t]) => frame >= t);
  const last = passed[passed.length - 1];
  const before = passed.length > 1 ? passed[passed.length - 2][1] : 0.5;
  const k = last ? interpolate(frame, [last[0], last[0] + 12], [0, 1], { ...clamp, easing: ease }) : 1;
  const center = last ? before + (last[1] - before) * k : 0.5;
  const zoomOut = interpolate(frame, [T.publico - 6, T.publico + 10], [0, 1], { ...clamp, easing: ease });
  const scale = 1 - zoomOut * 0.47;
  const offset = (SCREEN.w / 2 - (center * cell + fw / 2)) * (1 - zoomOut) + (SCREEN.w / 2 - (2.5 * cell + fw / 2) * scale) * zoomOut;
  const items: [keyof typeof data.icons | "cara", number][] = [
    ["bowl-with-spoon", T.sopa],
    ["cara", T.sopa + 6],
    ["coffin", T.ataud],
    ["cara", T.ataud + 6],
    ["couch-and-lamp", T.divan],
    ["cara", T.divan + 6],
  ];
  const labels = [
    ["HAMBRE", T.hambre],
    ["TRISTEZA", T.tristeza],
    ["DESEO", T.deseo],
  ] as const;
  const top = SCREEN.h / 2 - 150 * scale - 20;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: SCREEN.h }}>
      <div style={{ position: "absolute", top, left: offset, display: "flex", gap, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {items.map(([n, show], i) => {
          const visible = frame >= show - 2;
          const glow = n === "cara" && labels.some(([, e], j) => j === (i - 1) / 2 && frame >= e && frame < e + 14) ? 1 : 0;
          return (
            <div key={i} style={{ opacity: visible ? 1 : 0, transform: `translateY(${visible ? 0 : 30}px)` }}>
            <Frame w={fw} h={300} glow={glow}>
              {n === "cara" ? (
                <div style={{ opacity: visible ? 1 : 0 }}>
                  <ActorFace w={fw - 20} />
                </div>
              ) : (
                <Img src={icon(n)} style={{ width: 160, height: 160, opacity: visible ? 1 : 0 }} />
              )}
            </Frame>
            </div>
          );
        })}
      </div>
      {labels.map(([t, e], j) => (
        <Tag key={t} text={t} x={offset + ((2 * j + 1) * cell + fw / 2) * scale} y={top + 300 * scale + 40} enter={e} size={30} rot={j % 2 ? 3 : -3} />
      ))}
    </div>
  );
};

// Las tres caras se juntan en una
const Merge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = interpolate(frame, [T.mismo - 8, T.mismo + 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const big = pop(frame, T.mismo, fps, 10);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[-1, 1, 0].map((d) => (
        <div key={d} style={{ position: "absolute", left: SCREEN.w / 2 - 110 + d * 250 * (1 - m), top: 60, transform: `scale(${1 + 0.12 * big * (d === 0 ? 1 : 0)}) rotate(${d * 4 * (1 - m)}deg)`, opacity: d === 0 ? 1 : 1 - m }}>
          <Frame w={220} h={270}>
            <ActorFace w={200} />
          </Frame>
        </div>
      ))}
      <Tag text="MISMO PLANO" x={SCREEN.w / 2} y={405} enter={T.mismo} size={56} bg={B.ink} rot={-4} />
      <Tag text="×3" x={SCREEN.w / 2 + 230} y={300} enter={T.tres} size={48} rot={8} />
    </div>
  );
};

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 140 } });
  const strike = interpolate(frame, [T.es - 2, T.es + 8], [0, 1], { ...clamp, easing: ease });
  return (
    <div
      style={{
        position: "absolute",
        left: SCREEN.x,
        top: SCREEN.y,
        width: SCREEN.w,
        height: SCREEN.h,
        borderRadius: 44,
        background: B.white,
        overflow: "hidden",
        boxShadow: "0 30px 60px rgba(0,0,0,0.12), 0 0 0 3px rgba(0,0,0,0.04)",
        transform: `translateY(${(1 - s) * -80}px) scale(${0.9 + 0.1 * s})`,
        opacity: Math.min(1, s * 1.5),
      }}
    >
      {/* 1 · Gancho: experimento, +100 años, la edición engaña al cerebro */}
      <Beat from={0} to={T.cien - 4}>
        <Emoji name="clapper-board" x={SCREEN.w / 2} y={190} size={220} enter={2} />
        <Title text="EXPERIMENTO" enter={6} size={84} y={330} track="0.02em" />
      </Beat>
      <Beat from={T.cien - 4} to={T.edicion - 4}>
        <Counter enter={T.cien - 3} />
      </Beat>
      <Beat from={T.edicion - 4} to={T.lev - 6}>
        <Title text="La edición engaña" enter={T.edicion - 2} size={78} y={60} />
        <Title text="a tu cerebro" enter={T.cerebro - 6} size={78} y={150} color={B.green} />
        <Emoji name="brain" x={SCREEN.w / 2} y={365} size={190} enter={T.cerebro - 1} />
      </Beat>
      {/* 2 · Lev Kuleshov y el actor sin expresión */}
      <Beat from={T.lev - 6} to={T.imagenes - 8}>
        <Title text="Lev Kuleshov" enter={T.lev - 3} size={96} y={40} />
        <Tag text="EL EFECTO KULESHOV" x={SCREEN.w / 2} y={180} enter={T.lev + 8} size={30} />
        {frame >= T.actor - 2 ? (
          <div style={{ position: "absolute", left: SCREEN.w / 2 - 110, top: 225, transform: `scale(${pop(frame, T.actor - 2, fps, 12)})` }}>
            <Frame w={220} h={250}>
              <ActorFace w={200} />
            </Frame>
          </div>
        ) : null}
        <Tag text="SIN EXPRESIÓN" x={SCREEN.w / 2 + 225} y={350} enter={T.expresion} size={28} bg={B.ink} rot={5} />
      </Beat>
      {/* 3 · Tres imágenes y lo que vio el público */}
      <Beat from={T.imagenes - 8} to={T.pero - 6}>
        {frame < T.sopa ? (
          <div style={{ position: "absolute", inset: 0, opacity: interpolate(frame, [T.sopa - 6, T.sopa], [1, 0], clamp) }}>
            <Title text="3 imágenes" enter={T.imagenes - 6} size={120} y={120} />
            <Tag text="1 MISMO ACTOR" x={SCREEN.w / 2} y={320} enter={T.imagenes + 4} size={40} bg={B.ink} rot={-3} />
          </div>
        ) : null}
        <Strip />
      </Beat>
      {/* 4 · Era el mismo plano */}
      <Beat from={T.pero - 6} to={T.no - 6}>
        <Merge />
      </Beat>
      {/* 5 · No es lo que grabas, es cómo lo editas */}
      <Beat from={T.no - 6} to={T.tu - 6}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 60 }}>
          <Title text="No es lo que grabas" enter={T.no} size={64} y={0} color={B.grey} />
          <div style={{ position: "absolute", left: "15%", top: 38, height: 10, width: `${70 * strike}%`, background: "#E5484D", borderRadius: 99 }} />
        </div>
        <Title text="Es cómo" enter={T.es} size={112} y={180} color={B.green} />
        <Title text="lo editas" enter={T.es + 6} size={112} y={295} color={B.green} />
      </Beat>
      {/* 6 · Cierre */}
      <Beat from={T.tu - 6} to={99999}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
          <div style={{ transform: `scale(${pop(frame, T.tu - 2, fps, 12)})` }}>
            <Wordmark size={130} />
          </div>
          <div style={{ opacity: interpolate(frame, [T.encargo - 4, T.encargo + 6], [0, 1], clamp), fontFamily: SANS, fontWeight: 700, fontSize: 40, color: B.grey }}>edición de video automatizada</div>
        </div>
      </Beat>
    </div>
  );
};

// ——— Subtítulos: Inter Bold, 1–3 palabras, la clave en verde, sin contorno ———
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const page = PAGES.find((p) => t >= p.startMs && t < p.endMs);
  if (!page) return null;
  const words = page.lines.flat();
  return (
    <div style={{ position: "absolute", left: 80, right: 140, top: 818, height: 130, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "nowrap", columnGap: 22, fontFamily: SANS, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
      {words.map((w, i) => {
        const e = Math.round((w.startMs / 1000) * fps) - 1;
        const s = spring({ frame: frame - e, fps, config: { damping: 12, stiffness: 240, mass: 0.5 } });
        const on = frame >= e;
        const key = w.emphasis;
        return (
          <span
            key={`${w.startMs}-${i}`}
            style={{
              display: "inline-block",
              fontSize: key ? 88 : 74,
              color: key ? B.green : B.ink,
              opacity: on ? Math.min(1, s * 2) : 0,
              transform: `translateY(${(1 - s) * 26}px) scale(${0.7 + 0.3 * s})`,
            }}
          >
            {w.text.replace(/[,;:.]+$/, "")}
          </span>
        );
      })}
    </div>
  );
};

// ——— Capi: pose a partir de la voz y de la historia ———
const BLINKS = (() => {
  const out: number[] = [];
  for (let b = 20; b < 1200; b += 78 + Math.round(random(`b${b}`) * 40)) out.push(b);
  return out;
})();
const KEY_STARTS = W.filter((w) => KEYS.has(norm(w.text))).map((w) => f(w.startMs));

const capiPose = (frame: number): CapiPose => {
  const t = (frame / KULESHOV_FPS) * 1000;
  const level = (env(frame) + env(frame - 1)) / 2;
  const mouth = mixMouth(mouthAt(W, t, level), mouthAt(W, t - 33, level), 0.35);
  let blink = 0;
  for (const b of BLINKS) {
    const d = frame - b;
    if (d >= 0 && d < 5) blink = [0.5, 1, 1, 0.5, 0][d];
  }
  // Cejas: arriba al decir cada palabra clave; sorpresa al principio y en «mismo plano»; escéptico con el público
  const brow = Math.max(0, ...KEY_STARTS.map((k) => (frame >= k - 1 && frame < k + 14 ? 1 - (frame - k) / 14 : 0)));
  const surprised = frame < 40 || (frame >= T.mismo - 2 && frame < T.mismo + 20) ? 1 : 0;
  const skeptic = frame >= T.publico && frame < T.pero ? 1 : 0;
  // Mira a la pantalla cuando aparece algo nuevo
  const looks = [T.cien, T.cerebro, T.actor, T.sopa, T.ataud, T.divan, T.mismo, T.es];
  const lookUp = Math.max(0, ...looks.map((k) => (frame >= k && frame < k + 22 ? Math.sin(((frame - k) / 22) * Math.PI) : 0)));
  return {
    mouth,
    blink,
    brow: Math.min(1, brow * 0.7 + surprised),
    browTilt: skeptic,
    lookX: Math.sin(frame / 47) * 0.25,
    lookY: -lookUp * 0.9,
    tilt: Math.sin(frame / 38) * 2.2 + level * 2 * Math.sin(frame / 5),
    breathe: (Math.sin(frame / 22) + 1) / 2,
    wink: frame >= T.yo && frame < T.yo + 14 ? 1 : 0,
    smile: frame >= T.tu ? 1 : 0.35,
  };
};

const CapiOnStage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const keyHop = Math.max(0, ...[T.cerebro, T.mismo, T.editas, T.yo].map((k) => (frame >= k && frame < k + 10 ? Math.sin(((frame - k) / 10) * Math.PI) : 0)));
  return (
    <div style={{ position: "absolute", left: 540 - 380, top: 960, transform: `translateY(${(1 - s) * 600 - keyHop * 26}px) scale(${1 + keyHop * 0.03})`, transformOrigin: "50% 100%" }}>
      <Capi2D pose={capiPose(frame)} width={760} />
    </div>
  );
};

// ——— Composición ———
export const CapiKuleshov: React.FC = () => {
  const frame = useCurrentFrame();
  const hits = [T.cerebro, T.mismo, T.editas];
  const punch = Math.max(0, ...hits.map((h) => (frame >= h && frame < h + 12 ? 1 - (frame - h) / 12 : 0)));
  const shake = punch > 0 ? (random(`s${frame}`) - 0.5) * 12 * punch : 0;
  const sfx: [string, number, number][] = [
    ["whoosh", 0, 0.3],
    ["pop", 3, 0.3],
    ["click", T.cien, 0.25],
    ["whoosh", T.edicion - 4, 0.22],
    ["hit", T.cerebro, 0.35],
    ["whoosh", T.lev - 6, 0.25],
    ["pop", T.actor - 2, 0.28],
    ["whoosh", T.imagenes - 8, 0.25],
    ["pop", T.sopa, 0.3],
    ["pop", T.ataud, 0.3],
    ["pop", T.divan, 0.3],
    ["whoosh", T.publico - 6, 0.2],
    ["click", T.hambre, 0.3],
    ["click", T.tristeza, 0.3],
    ["click", T.deseo, 0.3],
    ["whoosh", T.pero - 6, 0.25],
    ["hit", T.mismo, 0.4],
    ["whoosh", T.no - 6, 0.25],
    ["hit", T.editas, 0.35],
    ["whoosh", T.tu - 6, 0.25],
    ["brillo", T.encargo, 0.3],
  ];
  const off = (frame * 0.5) % 56;
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      <Audio src={staticFile("capi/voz-kuleshov.wav")} />
      {sfx.map(([n, a, v], i) => (
        <Sequence key={i} from={Math.max(0, a)} durationInFrames={45} layout="none">
          <Audio src={staticFile(`sfx/${n}.wav`)} volume={v * 0.6} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${B.green}26 2.2px, transparent 2.4px)`, backgroundSize: "56px 56px", backgroundPosition: `${off}px ${off}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${B.green}${Math.round(punch * 50).toString(16).padStart(2, "0")}, transparent 60%)` }} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px) scale(${1 + punch * 0.02})` }}>
        <Screen />
        <CapiOnStage />
      </AbsoluteFill>
      <Captions />
    </AbsoluteFill>
  );
};
