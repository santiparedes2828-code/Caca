import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile } from "remotion";

// ESTUDIO HOOKHOUSE — lo que se entrega al cliente (reglas en estilo-estudio.md).
// Editorial, caro y tranquilo: Inter Bold pequeña + EB Garamond Bold Italic grande (sustituto de Apple Garamond
// Italic), motion graphics sobre papel blanco con sombras suaves, b-roll a pantalla completa y retoques naranjas.
// NUNCA lleva nada de Hookie / Altera (línea-cuerda, tarjetas colgadas, impactos, tirones, sonidos de marca).
// Todas las animaciones son suaves: curvas de salida largas, sin rebotes, sin sacudidas, sin flashes.

export const SANS = "Inter";
export const SERIF = "EB Garamond";
loadFont({ family: SANS, url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-700-italic.woff2"), weight: "700", style: "italic" });

export const S = {
  paper: "#F4F3EF",
  ink: "#111110",
  grey: "#9A978F",
  white: "#FFFFFF",
  orange: "#FF5A1F", // retoque: un subrayado, un número o una palabra por pantalla
  orangeSoft: "#FF7A45",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SMOOTH = Easing.bezier(0.16, 1, 0.3, 1); // entrada: rápida al principio, se posa despacio
export const GLIDE = Easing.bezier(0.65, 0, 0.35, 1); // movimientos de un punto a otro
export const ease = (f: number, a: number, b: number, from = 0, to = 1, e = SMOOTH) => interpolate(f, [a, b], [from, to], { ...clamp, easing: e });
const clean = (s: string) => s.replace(/[.,:;!?…"]+$/g, "").replace(/^["¿¡]+/, "");

export type SWord = { text: string; os: number; oe: number; seg: number };
export type Phrase = { words: SWord[]; key: number; start: number; end: number };

// Frases para subtítulos de podcast: la frase se corta DESPUÉS de la palabra clave (que va sola, grande, en serif),
// en puntuación, en cambio de plano o a las 4 palabras.
export const phrases = (words: SWord[], keys: Set<string>): Phrase[] => {
  const out: Phrase[] = [];
  let cur: SWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    const ki = cur.findIndex((w) => keys.has(clean(w.text).toLowerCase()));
    out.push({ words: cur, key: ki, start: cur[0].os, end: cur[cur.length - 1].oe });
    cur = [];
  };
  words.forEach((w, i) => {
    if (cur.length && cur[cur.length - 1].seg !== w.seg) flush();
    cur.push(w);
    const isKey = keys.has(clean(w.text).toLowerCase());
    const next = words[i + 1];
    if (isKey || /[.,?!]$/.test(w.text) || cur.length >= 4 || (next && next.os - w.oe > 0.45)) flush();
  });
  flush();
  return out;
};

// Palabra que entra suave: desenfoque 10 → 0, opacidad y 14 px de subida en 9 frames
const Enter: React.FC<{ f: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, children, style }) => {
  const p = ease(f, at, at + 9);
  return <span style={{ display: "inline-block", opacity: p, filter: `blur(${(1 - p) * 10}px)`, transform: `translateY(${(1 - p) * 14}px)`, ...style }}>{children}</span>;
};

// ---------- Subtítulos de podcast (como la referencia) ----------
// Línea pequeña en Inter Bold blanca que se escribe palabra a palabra; la palabra clave debajo, sola y grande en
// Garamond Bold Italic, con halo suave y un subrayado naranja que se dibuja de izquierda a derecha.
export const PodcastCaptions: React.FC<{ list: Phrase[]; f: number; fps: number; hide?: (f: number) => boolean; y?: number; hot?: Set<string> }> = ({ list, f, fps, hide, y = 1060, hot }) => {
  if (hide && hide(f)) return null;
  const t = f / fps;
  let idx = -1;
  for (let i = 0; i < list.length; i++) if (t >= list[i].start - 0.05) idx = i;
  if (idx < 0) return null;
  const ph = list[idx];
  const nextStart = idx + 1 < list.length ? list[idx + 1].start : ph.end + 0.8;
  const outAt = Math.min(nextStart, ph.end + 0.7) * fps;
  const out = ease(f, outAt - 5, outAt + 1, 0, 1, GLIDE);
  if (out >= 1) return null;
  const small = ph.words.filter((_, k) => k !== ph.key);
  const key = ph.key >= 0 ? ph.words[ph.key] : null;
  const keyAt = key ? Math.round(key.os * fps) : 0;
  const isHot = key && hot ? hot.has(clean(key.text).toLowerCase()) : false;
  return (
    <div style={{ position: "absolute", left: 72, right: 150, top: y, textAlign: "center", opacity: 1 - out, filter: `blur(${out * 8}px)` }}>
      {small.length ? (
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 52, letterSpacing: "-0.02em", lineHeight: 1.1, color: S.white, textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}>
          {small.map((w, k) => (
            <Enter key={k} f={f} at={Math.round(w.os * fps) - 2} style={{ margin: "0 9px" }}>
              {clean(w.text)}
            </Enter>
          ))}
        </div>
      ) : null}
      {key ? (
        <div style={{ position: "relative", display: "inline-block", marginTop: 4 }}>
          <Enter f={f} at={keyAt - 2} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 150, lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase", color: isHot ? S.orangeSoft : S.white, textShadow: "0 0 34px rgba(255,255,255,0.28), 0 6px 26px rgba(0,0,0,0.45)" }}>
            {clean(key.text)}
          </Enter>
          <div style={{ position: "absolute", left: "8%", right: "8%", bottom: -6, height: 5, borderRadius: 3, background: S.orange, transformOrigin: "0% 50%", transform: `scaleX(${ease(f, keyAt + 4, keyAt + 20, 0, 1, GLIDE)})` }} />
        </div>
      ) : null}
    </div>
  );
};

// ---------- Plano del cliente ----------
// Un solo efecto por plano: acercamiento lento 1,00 → 1,04. Grado cinematográfico suave + grano + viñeta.
export const GRADE = "contrast(1.05) saturate(0.88) sepia(0.08) brightness(0.98)";
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill style={{ opacity, mixBlendMode: "overlay" }}>
    {Array.from({ length: 12 }, (_, k) => (
      <Img key={k} src={staticFile("altera/papel.png")} style={{ position: "absolute", left: (k % 3) * 512, top: Math.floor(k / 3) * 512, width: 512, height: 512 }} />
    ))}
  </AbsoluteFill>
);
export const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)" }} />;

// Corte suave entre planos: desenfoque y ligera bajada de luz durante 10 frames alrededor del corte
export const softCut = (f: number, cuts: number[]) => {
  let b = 0;
  for (const c of cuts) b = Math.max(b, interpolate(f - c, [-5, 0, 5], [0, 1, 0], clamp));
  return { blur: b * 9, dim: 1 - 0.18 * b };
};

// ---------- Lámina de motion graphics ----------
// Papel blanco con luz suave, retícula fina y sombras largas. Entra y sale con fundido + desenfoque (12 frames).
export const Plate: React.FC<{ f: number; from: number; to: number; children: React.ReactNode }> = ({ f, from, to, children }) => {
  if (f < from - 12 || f > to + 12) return null;
  const pin = ease(f, from - 12, from, 0, 1, GLIDE);
  const pout = ease(f, to, to + 12, 0, 1, GLIDE);
  const p = pin * (1 - pout);
  return (
    <AbsoluteFill style={{ opacity: p, filter: `blur(${(1 - p) * 14}px)`, transform: `scale(${1.03 - 0.03 * pin + 0.02 * pout})` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, ${S.paper} 60%, #E9E7E1 100%)` }} />
      <Grid />
      {children}
      <Grain opacity={0.035} />
    </AbsoluteFill>
  );
};
const Grid: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    {Array.from({ length: 9 }, (_, k) => (
      <line key={`v${k}`} x1={140 + k * 100} y1={560} x2={140 + k * 100} y2={1460} stroke="rgba(17,17,16,0.07)" strokeWidth={2} />
    ))}
    {Array.from({ length: 10 }, (_, k) => (
      <line key={`h${k}`} x1={90} y1={560 + k * 100} x2={990} y2={560 + k * 100} stroke="rgba(17,17,16,0.07)" strokeWidth={2} />
    ))}
  </svg>
);

// Esfera con sombra larga (objeto de las láminas)
export const Orb: React.FC<{ x: number; y: number; r: number; p: number; color?: string }> = ({ x, y, r, p, color = S.ink }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`, background: `radial-gradient(circle at 35% 30%, ${color === S.ink ? "#3a3936" : "#ffa070"} 0%, ${color} 60%)`, boxShadow: `${r * 0.5}px ${r * 0.7}px ${r * 1.2}px rgba(17,17,16,0.28)` }} />
);

// Titular editorial de lámina: línea pequeña Inter + palabra grande Garamond italic, con entrada palabra a palabra
export const Editorial: React.FC<{ f: number; y: number; small: { text: string; at: number }[]; big: string; bigAt: number; color?: string; size?: number; underline?: boolean }> = ({ f, y, small, big, bigAt, color = S.ink, size = 210, underline = true }) => (
  <div style={{ position: "absolute", left: 72, right: 72, top: y, textAlign: "center" }}>
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, letterSpacing: "-0.03em", color: S.ink }}>
      {small.map((w, k) => (
        <Enter key={k} f={f} at={w.at} style={{ margin: "0 10px" }}>
          {w.text}
        </Enter>
      ))}
    </div>
    <div style={{ position: "relative", display: "inline-block" }}>
      <Enter f={f} at={bigAt} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: size, lineHeight: 0.92, letterSpacing: "-0.035em", textTransform: "uppercase", color }}>
        {big}
      </Enter>
      {underline ? <div style={{ position: "absolute", left: "6%", right: "6%", bottom: 4, height: 7, borderRadius: 4, background: S.orange, transformOrigin: "0% 50%", transform: `scaleX(${ease(f, bigAt + 6, bigAt + 26, 0, 1, GLIDE)})` }} /> : null}
    </div>
  </div>
);

// B-roll a pantalla completa: Ken Burns lento (1,06 → 1,14) con el mismo grado que el plano del cliente.
// `src` = imagen en public/ (real, con licencia). Si no hay imagen, no se dibuja nada (nunca se inventa).
export const BRoll: React.FC<{ f: number; from: number; to: number; src: string; dir?: 1 | -1 }> = ({ f, from, to, src, dir = 1 }) => {
  if (f < from - 10 || f > to + 10) return null;
  const p = ease(f, from - 10, from, 0, 1, GLIDE) * (1 - ease(f, to, to + 10, 0, 1, GLIDE));
  const k = interpolate(f, [from - 10, to + 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: p, filter: `blur(${(1 - p) * 10}px)`, overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.06 + 0.08 * k}) translateX(${dir * (k - 0.5) * 30}px)`, filter: GRADE }} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

// Sonido suave (nunca golpes)
export const Soft: React.FC<{ at: number; src?: string; vol?: number }> = ({ at, src = "sfx/studio/soft_whoosh.wav", vol = 0.35 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={30}>
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);
