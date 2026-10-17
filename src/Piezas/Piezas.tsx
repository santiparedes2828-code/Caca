import React from "react";
import { z } from "zod";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Motor de las «30 piezas» (17-10-2026): cada vídeo es solo datos (piezas/NN.json). Elementos con fotogramas
// clave (formas, textos, emojis de Apple en PNG, rótulos), escenas con fondo propio, subtítulos sincronizados con la
// voz (máx. dos líneas, palabras decisivas resaltadas), textura sutil y cámara que respira. Todo en Inter.

loadInter();

const F = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const kf = z.object({
  t: z.number(),
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
  r: z.number().optional(), // radio de esquina
  rot: z.number().optional(),
  o: z.number().optional(),
  s: z.number().optional(), // escala
  fill: z.string().optional(),
  rx: z.number().optional(), // giro 3D en X (grados)
  ry: z.number().optional(), // giro 3D en Y (grados)
  blur: z.number().optional(), // desenfoque (px)
  rev: z.number().optional(), // máscara: 0 oculto, 1 revelado
});
type KF = z.infer<typeof kf>;
const el = z.object({
  type: z.enum(["shape", "text", "emoji", "pill"]),
  kf: z.array(kf).min(1),
  text: z.string().optional(),
  size: z.number().optional(),
  weight: z.number().optional(),
  color: z.string().optional(),
  stroke: z.string().optional(),
  sw: z.number().optional(),
  name: z.string().optional(), // emoji
  tri: z.boolean().optional(), // triángulo
  grad: z.string().optional(), // degradado CSS en vez de color plano
  shadow: z.boolean().optional(),
  z: z.number().optional(),
  mask: z.enum(["left", "up", "circle"]).optional(), // revelado con máscara según «rev»
  letters: z.number().optional(), // texto que entra letra a letra desde este segundo
  glitch: z.boolean().optional(), // separación RGB sutil
  fixed: z.boolean().optional(), // fuera de la cámara (títulos que no deben moverse con ella)
});
// Transiciones de escena: corte, fundido, barrido con desenfoque, zoom a través, cortina o círculo
const scene = z.object({ start: z.number(), bg: z.string(), tr: z.enum(["cut", "fade", "whip", "zoom", "wipe", "circle"]).default("fade") });
const word = z.object({ text: z.string(), start: z.number(), end: z.number() });
export const piezaSchema = z.object({
  id: z.string(),
  end: z.number(),
  voice: z.string().optional(),
  music: z.string().optional(),
  accent: z.string(),
  capColor: z.string().default("#FFFFFF"),
  capBg: z.string().default("rgba(10,10,10,0.72)"),
  capY: z.number().default(1340),
  keys: z.array(z.string()).default([]),
  words: z.array(word),
  scenes: z.array(scene).min(1),
  els: z.array(el),
  sfx: z.array(z.object({ t: z.number(), name: z.string(), v: z.number().optional() })).default([]),
  cam: z.array(kf).default([]), // cámara virtual (x/y desplazamiento, s zoom, rot, rx, ry) en tiempos absolutos
  shakes: z.array(z.object({ t: z.number(), a: z.number().default(14) })).default([]),
});
type Pieza = z.infer<typeof piezaSchema>;
type El = z.infer<typeof el>;

export const calculatePiezaMetadata: CalculateMetadataFunction<Pieza> = ({ props }) => ({ durationInFrames: F(props.end), fps: 30 });

// Valor interpolado de una propiedad entre fotogramas clave (mantiene el último valor conocido)
const val = (k: KF[], prop: keyof KF, t: number, def: number): number => {
  const pts = k.filter((p) => p[prop] !== undefined) as (KF & Record<string, number>)[];
  if (!pts.length) return def;
  if (t <= pts[0].t) return pts[0][prop] as number;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (t >= a.t && t <= b.t) return interpolate(t, [a.t, b.t], [a[prop] as number, b[prop] as number], { ...clamp, easing: ease });
  }
  return pts[pts.length - 1][prop] as number;
};
const colorAt = (k: KF[], t: number, def: string) => {
  let c = def;
  for (const p of k) if (p.fill && t >= p.t) c = p.fill;
  return c;
};

const Element: React.FC<{ e: El; t: number }> = ({ e, t }) => {
  const x = val(e.kf, "x", t, 540);
  const y = val(e.kf, "y", t, 960);
  const w = val(e.kf, "w", t, 100);
  const h = val(e.kf, "h", t, 100);
  const o = val(e.kf, "o", t, 1);
  const s = val(e.kf, "s", t, 1);
  const rot = val(e.kf, "rot", t, 0);
  const rx = val(e.kf, "rx", t, 0);
  const ry = val(e.kf, "ry", t, 0);
  const blur = val(e.kf, "blur", t, 0);
  const rev = val(e.kf, "rev", t, 1);
  if (o <= 0.001 || rev <= 0.001) return null;
  const clip = !e.mask || rev >= 0.999 ? undefined : e.mask === "left" ? `inset(-20% ${(1 - rev) * 100}% -20% -20%)` : e.mask === "up" ? `inset(${(1 - rev) * 100}% -20% -20% -20%)` : `circle(${rev * 75}% at 50% 50%)`;
  const base: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    opacity: o,
    transform: `translate(-50%, -50%) perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg) scale(${s})`,
    filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
    clipPath: clip,
    zIndex: e.z ?? 1,
  };
  if (e.type === "shape") {
    const r = val(e.kf, "r", t, 0);
    const fill = colorAt(e.kf, t, e.color ?? "#000");
    return (
      <div
        style={{
          ...base,
          width: w,
          height: h,
          borderRadius: r,
          background: e.grad ?? fill,
          border: e.stroke ? `${e.sw ?? 6}px solid ${e.stroke}` : undefined,
          clipPath: e.tri ? "polygon(50% 0, 100% 100%, 0 100%)" : undefined,
          boxShadow: e.shadow ? "0 30px 60px rgba(0,0,0,0.28)" : undefined,
        }}
      />
    );
  }
  if (e.type === "emoji") return <Img src={staticFile(`piezas/apple/${e.name}.png`)} style={{ ...base, width: w, height: w }} />;
  if (e.type === "pill")
    return (
      <div style={{ ...base, padding: "12px 30px", borderRadius: 999, background: e.color ?? "#111", color: e.stroke ?? "#fff", fontFamily: INTER, fontWeight: 800, fontSize: e.size ?? 30, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
        {e.text}
      </div>
    );
  const g = e.glitch ? 3 + Math.abs(Math.sin(t * 23)) * 4 : 0;
  const textStyle: React.CSSProperties = {
    ...base,
    width: w,
    textAlign: "center",
    fontFamily: INTER,
    fontWeight: e.weight ?? 800,
    fontSize: e.size ?? 80,
    lineHeight: 1.02,
    letterSpacing: (e.weight ?? 800) >= 800 ? "-0.04em" : "-0.01em",
    color: colorAt(e.kf, t, e.color ?? "#111"),
    whiteSpace: "pre-line",
    textShadow: g ? `${g}px 0 rgba(255,40,90,0.75), ${-g}px 0 rgba(0,210,255,0.75)` : undefined,
  };
  if (e.letters === undefined) return <div style={textStyle}>{e.text}</div>;
  // Letra a letra: cada carácter sube, se enfoca y aparece con un pequeño desfase
  return (
    <div style={textStyle}>
      {[...(e.text ?? "")].map((ch, i) => {
        const p = interpolate(t, [e.letters! + i * 0.035, e.letters! + i * 0.035 + 0.28], [0, 1], { ...clamp, easing: ease });
        return ch === "\n" ? (
          <br key={i} />
        ) : (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * 8}deg)`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// Subtítulos: grupos de hasta ~7 palabras (dos líneas), cortes en las pausas; palabras clave en el color de acento
const groups = (words: Pieza["words"]) => {
  const out: Pieza["words"][] = [];
  let cur: Pieza["words"] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const pause = next ? next.start - w.end : 1;
    if (cur.length >= 7 || /[.?!]$/.test(w.text) || (pause > 0.35 && cur.length >= 3) || !next) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

const Captions: React.FC<{ p: Pieza; t: number }> = ({ p, t }) => {
  const gs = React.useMemo(() => groups(p.words), [p.words]);
  const keys = React.useMemo(() => new Set(p.keys.map(norm)), [p.keys]);
  const g = gs.find((x, i) => t >= x[0].start - 0.05 && t < (gs[i + 1]?.[0].start ?? x[x.length - 1].end + 0.6));
  if (!g) return null;
  const inT = interpolate(t, [g[0].start - 0.05, g[0].start + 0.12], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 100, right: 180, top: p.capY, display: "flex", justifyContent: "center", zIndex: 50 }}>
      <div style={{ maxWidth: 820, padding: "18px 30px", borderRadius: 22, background: p.capBg, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 54, lineHeight: 1.18, color: p.capColor, opacity: inT, transform: `translateY(${(1 - inT) * 14}px)` }}>
        {g.map((w, i) => {
          const on = t >= w.start;
          const key = keys.has(norm(w.text));
          return (
            <span key={i} style={{ color: key ? p.accent : p.capColor, fontWeight: key ? 800 : 700, opacity: on ? 1 : 0.45 }}>
              {w.text}
              {i < g.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Pieza: React.FC<Pieza> = (p) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const si = Math.max(0, p.scenes.findIndex((s, i) => t >= s.start && t < (p.scenes[i + 1]?.start ?? 1e9)));
  const sc = p.scenes[si];
  const since = t - sc.start;
  const tr = si === 0 ? "cut" : sc.tr;
  const k = interpolate(since, [0, tr === "zoom" ? 0.35 : 0.28], [0, 1], { ...clamp, easing: ease });
  const fade = si === 0 || tr === "cut" || tr === "whip" || tr === "zoom" ? 1 : tr === "fade" ? k : 1;
  const bgClip = tr === "wipe" && k < 1 ? `inset(0 ${(1 - k) * 100}% 0 0)` : tr === "circle" && k < 1 ? `circle(${k * 120}% at 50% 50%)` : undefined;
  const prevBg = si > 0 ? p.scenes[si - 1].bg : sc.bg;
  const total = F(p.end);
  // Cámara virtual + movimiento de la transición + temblor en los golpes
  const cx = val(p.cam, "x", t, 0);
  const cy = val(p.cam, "y", t, 0);
  const cs = val(p.cam, "s", t, 1);
  const cr = val(p.cam, "rot", t, 0);
  const crx = val(p.cam, "rx", t, 0);
  const cry = val(p.cam, "ry", t, 0);
  let sx = 0;
  let sy = 0;
  for (const sh of p.shakes) {
    const d = t - sh.t;
    if (d >= 0 && d < 0.5) {
      const a = sh.a * Math.exp(-d * 9);
      sx += Math.sin(d * 90) * a;
      sy += Math.cos(d * 70) * a * 0.7;
    }
  }
  const trX = tr === "whip" ? (1 - k) * 700 : 0;
  const trS = tr === "zoom" ? 1 + (1 - k) * 0.6 : 1;
  const trBlur = tr === "whip" || tr === "zoom" ? (1 - k) * 24 : 0;
  return (
    <AbsoluteFill style={{ background: prevBg, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: sc.bg, opacity: fade, clipPath: bgClip }} />
      <AbsoluteFill
        style={{
          transform: `perspective(1800px) translate(${cx + sx + trX + Math.sin(frame / 90) * 4}px, ${cy + sy + Math.cos(frame / 110) * 4}px) scale(${cs * trS * (1.01 + Math.sin(frame / 70) * 0.006)}) rotate(${cr}deg) rotateX(${crx}deg) rotateY(${cry}deg)`,
          filter: trBlur > 0.3 ? `blur(${trBlur}px)` : undefined,
        }}
      >
        {[...p.els]
          .filter((e) => !e.fixed)
          .sort((a, b) => (a.z ?? 1) - (b.z ?? 1))
          .map((e, i) => (
            <Element key={i} e={e} t={t} />
          ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${sx * 0.5}px, ${sy * 0.5}px)` }}>
        {[...p.els]
          .filter((e) => e.fixed)
          .sort((a, b) => (a.z ?? 1) - (b.z ?? 1))
          .map((e, i) => (
            <Element key={i} e={e} t={t} />
          ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: "radial-gradient(rgba(0,0,0,0.9) 1px, transparent 1.4px)", backgroundSize: "5px 5px", backgroundPosition: `${random(`a${frame}`) * 5}px ${random(`b${frame}`) * 5}px`, pointerEvents: "none" }} />
      <Captions p={p} t={t} />
      {p.scenes.slice(1).map((s) => (
        <Sequence key={s.start} from={F(s.start)} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {p.sfx.map((s, i) => (
        <Sequence key={i} from={F(s.t)} durationInFrames={30} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.v ?? 0.3} />
        </Sequence>
      ))}
      {p.voice ? <Audio src={staticFile(p.voice)} /> : null}
      {p.music ? <Audio src={staticFile(p.music)} volume={(f) => (p.voice ? 0.16 : 0.5) * interpolate(f, [total - 24, total], [1, 0], clamp)} /> : null}
    </AbsoluteFill>
  );
};
