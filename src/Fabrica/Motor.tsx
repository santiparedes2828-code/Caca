import React from "react";
import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import type { Caption } from "@remotion/captions";
import { Snd, timing } from "../Altera/reelkit";
import { C, Grain, Vignette, decay, eio, eo, ln } from "../Altera/reels/Servilleta";

// Fábrica viral · motor de video. Cada video es una especificación (src/Fabrica/videos/<slug>.tsx) con su gancho por
// variante, sus escenas y sus colores; el motor pone todo lo que se repite en cada pieza del estilo animado:
// cámara viva (flota, empuja por escena, tiembla en los impactos, sin zoom por palabra) · transiciones alternadas
// (barrido, zoom, destello) · subtítulos con golpe y palabras de color, legibles desde el cuadro 0 · voz y música de
// la variante · barrido en cada transición y pop en cada pastilla · viñeta y grano · subtítulos ocultos en el CTA.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
export const PF = "Poppins";

export type Ctx = {
  f: number;
  fps: number;
  t: number;
  v: number;
  /** cuadro en que empieza la palabra i */
  W: (i: number) => number;
  /** cuadro en que termina la palabra i */
  E: (i: number) => number;
  /** índice de la primera palabra que empieza con `palabra` (sin tildes de puntuación), desde el índice `desde` */
  i: (palabra: string, desde?: number) => number;
  /** atajo: cuadro de la palabra (= W(i(palabra, desde))) */
  w: (palabra: string, desde?: number) => number;
  /** inicio y fin de la escena actual (cuadros) */
  inicio: number;
  fin: number;
  /** fin de cualquier escena por id */
  finDe: (id: string) => number;
  /** cuadros totales de la variante */
  total: number;
};
export type Sfx = { at: number; src: string; vol: number };
export type Escena = {
  id: string;
  /** cuadro en que entra (se suele anclar a una palabra: c => c.w("tarda") - 2) */
  desde: (c: Ctx) => number;
  dibujar: (c: Ctx) => React.ReactNode;
  /** false = oculta los subtítulos desde esta escena (CTA) */
  subtitulos?: boolean;
};
export type Video = {
  slug: string;
  titulo: string;
  captions: Caption[][];
  colores: [RegExp, string][];
  gancho: (c: Ctx) => React.ReactNode;
  escenas: Escena[];
  /** cuadros con sacudón de cámara */
  impactos?: (c: Ctx) => number[];
  /** cuadros con «pop» (pastillas que aparecen) */
  pops?: (c: Ctx) => number[];
  /** efectos de sonido puntuales */
  sfx?: (c: Ctx) => Sfx[];
  /** temblor extra por escena (calor, despegue…) */
  temblor?: (c: Ctx, escena: string) => number;
  /** capa sobre la escena (bruma, color) */
  capa?: (c: Ctx, escena: string) => React.ReactNode;
  musicaVol?: number;
  fondo?: string;
  portada: (v: number) => React.ReactNode;
};

export const duracion = (video: Video, v: number) => timing(video.captions[v - 1]).frames;

// ---------- subtítulos: la palabra que suena entra con golpe; cifras en pastilla crema; palabras clave con color ----------
export const Subtitulos: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number; colores: [RegExp, string][] }> = ({ words, f, fps, colores }) => {
  const keyColor = (w: string) => {
    const clean = w.toLowerCase().replace(/[¿?¡!.,:…"«»]/g, "");
    for (const [re, col] of colores) if (re.test(clean)) return col;
    return null;
  };
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at || i === 0) cur = i;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?!]$/.test(words[i - 1].text) || n >= 4)) {
      start = i;
      n = 0;
    }
    n++;
  }
  return (
    <div style={{ position: "absolute", top: 270, left: 50, width: 980, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 78, lineHeight: 1.22, letterSpacing: "-0.01em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const d = spring({ frame: f - words[i].at + (i === 0 ? 8 : 0), fps, config: { damping: 9, stiffness: 300 } });
        const now = i === cur;
        const txt = words[i].text.replace(/[,:…]+$/, "").replace(/\.$/, "").replace(/"/g, "");
        const num = /\d/.test(txt);
        const wob = now ? 1 + 0.04 * Math.sin(f * 0.5) : 1;
        const kc = keyColor(txt);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 9px", opacity: Math.min(1, d * 1.5), transform: `translateY(${(1 - d) * 40}px) scale(${(0.7 + 0.3 * d) * wob}) rotate(${(1 - d) * (i % 2 ? 8 : -8)}deg)` }}>
            {num && now ? (
              <span style={{ display: "inline-block", padding: "0 22px 6px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 8px 0 rgba(0,0,0,0.45)" }}>{txt}</span>
            ) : kc ? (
              <span style={{ color: kc, opacity: now ? 1 : 0.85, textShadow: now ? `0 0 30px ${kc}, 0 4px 14px rgba(0,0,0,0.6)` : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            ) : (
              <span style={{ color: now ? C.white : C.grey, textShadow: now ? "0 0 26px rgba(255,255,255,0.45), 0 4px 14px rgba(0,0,0,0.6)" : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export const Motor: React.FC<{ video: Video; v: number }> = ({ video, v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const T = timing(video.captions[v - 1]);
  const END = T.frames;
  const iFn = (palabra: string, desde = 0) => T.idx(palabra.toLowerCase(), desde);
  const base: Omit<Ctx, "inicio" | "fin" | "finDe"> = { f, fps, t, v, W: T.W, E: T.E, i: iFn, w: (p, d = 0) => T.W(iFn(p, d)), total: END };

  // escenas ordenadas: el gancho (0) y las del cuerpo; se descartan las que no avanzan
  const tmp = { ...base, inicio: 0, fin: END, finDe: () => END } as Ctx;
  const raw: { id: string; s: number; e?: Escena }[] = [{ id: "gancho", s: 0 }, ...video.escenas.map((e) => ({ id: e.id, s: e.desde(tmp), e }))];
  const scenes = raw.filter((x, k) => k === 0 || x.s > raw[k - 1].s);
  let si = 0;
  while (si < scenes.length - 1 && f >= scenes[si + 1].s) si++;
  const finDe = (id: string) => {
    const k = scenes.findIndex((x) => x.id === id);
    return k >= 0 && k + 1 < scenes.length ? scenes[k + 1].s : END;
  };
  const ctxDe = (k: number): Ctx => ({ ...base, inicio: scenes[k].s, fin: k + 1 < scenes.length ? scenes[k + 1].s : END, finDe });
  const c = ctxDe(si);
  const dibujar = (k: number) => (k === 0 ? video.gancho(ctxDe(0)) : scenes[k].e!.dibujar(ctxDe(k)));

  // cámara
  const imp = video.impactos ? video.impactos(c) : [];
  const shake = imp.reduce((a, at) => a + decay(f, at, 3), 0);
  const prog = ln(f, c.inicio, c.fin, 0, 1, eio);
  const extra = video.temblor ? video.temblor(c, scenes[si].id) : 0;
  const camX = 9 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.1) + shake * 10 * Math.sin(f * 2.7) + extra * Math.sin(f * 1.9);
  const camY = 7 * Math.sin(t * 1.05 + 1) + shake * 8 * Math.cos(f * 3.3) + extra * 0.8 * Math.cos(f * 2.3);
  const camR = 0.6 * Math.sin(t * 0.9) + shake * 0.6 * Math.sin(f * 2.1);
  const camS = 1 + 0.1 * prog;

  // transición
  const TR = 9;
  const local = f - c.inicio;
  const inTr = si > 0 && local < TR;
  const kind = si % 3;
  const p = inTr ? eo(local / TR) : 1;
  const dir = si % 2 ? 1 : -1;
  const trNow: React.CSSProperties = !inTr ? {} : kind === 0 ? { transform: `translateX(${dir * 1100 * (1 - p)}px)`, filter: `blur(${18 * (1 - p)}px)` } : kind === 1 ? { transform: `scale(${1.6 - 0.6 * p})`, opacity: p, filter: `blur(${14 * (1 - p)}px)` } : { opacity: p };
  const trPrev: React.CSSProperties = kind === 0 ? { transform: `translateX(${-dir * 1100 * p}px)`, filter: `blur(${18 * p}px)` } : kind === 1 ? { transform: `scale(${1 + 0.4 * p})`, opacity: 1 - p } : { opacity: 1 - p };
  const flash = inTr && kind === 2 ? 1 - p : 0;

  // subtítulos ocultos desde la primera escena con subtitulos: false
  const sinSubs = scenes.find((x) => x.e && x.e.subtitulos === false);
  const hideCaps = sinSubs ? f >= sinSubs.s : false;
  const pops = video.pops ? video.pops(c) : [];
  const sfx = video.sfx ? video.sfx(c) : [];

  return (
    <AbsoluteFill style={{ background: video.fondo ?? "#0E0B12", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "540px 1000px", transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${camS})` }}>
        {inTr ? <AbsoluteFill style={trPrev}>{dibujar(si - 1)}</AbsoluteFill> : null}
        <AbsoluteFill style={trNow}>{dibujar(si)}</AbsoluteFill>
      </AbsoluteFill>
      {video.capa ? video.capa(c, scenes[si].id) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFF6E6", opacity: flash * 0.85 }} /> : null}
      <Vignette />
      <Grain f={f} />
      {hideCaps ? null : <Subtitulos words={T.words} f={f} fps={fps} colores={video.colores} />}

      <Audio src={staticFile(`audio/voz_${video.slug}_${v}.wav`)} />
      <Audio src={staticFile(`audio/musica_${video.slug}_${v}.wav`)} volume={video.musicaVol ?? 0.22} />
      {scenes.slice(1).map((x) => (
        <Snd key={`w${x.id}`} at={x.s - 3} src="sfx/whoosh.wav" vol={0.35} />
      ))}
      {pops.map((at, k) => (
        <Snd key={`p${k}`} at={at} src="sfx/pop.wav" vol={0.4} />
      ))}
      {sfx.map((s, k) => (
        <Snd key={`s${k}`} at={s.at} src={s.src} vol={s.vol} />
      ))}
    </AbsoluteFill>
  );
};

export const Portada: React.FC<{ video: Video; v: number }> = ({ video, v }) => <>{video.portada(v)}</>;
