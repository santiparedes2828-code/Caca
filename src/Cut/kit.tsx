import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile } from "remotion";
import { A, FONT, LABEL, Rope, SOUND, fall, impact, yank } from "../Altera/system";

// CORTE HOOKHOUSE — estilo de edición para vídeos de clientes (cabeza parlante, podcast, entrevista).
// Reglas completas en estilo-corte.md. La marca se nota en tres cosas y nada más:
//   1. la línea naranja (subraya la palabra que suena, cuelga las tarjetas y tira de los cortes),
//   2. tarjetas marfil con borde tinta que caen con peso,
//   3. los tres sonidos propios (tensión, tirón, impacto).
// El protagonista es el cliente: nada tapa su cara (tarjetas arriba, subtítulos abajo).

export type CutWord = { text: string; os: number; oe: number; seg: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const clean = (s: string) => s.replace(/[.,:;!?…"]+$/g, "").replace(/^["¿¡]+/, "");

// Encuadres: A = plano base, B = plano cerrado. Se alterna por frase; en la palabra clave, empuje de 6 %.
export const FRAMING = { A: 1.0, B: 1.18, punch: 0.06, drift: 0.02 };
export const CAPTION_Y = 1150; // zona segura: por encima de la descripción de TikTok
export const CARD_Y = 290; // titular colgado: encima de la cabeza, nunca sobre los ojos
export const SIDE = { x: 872, y: 660 }; // pila de tarjetas: al lado de la cara, dentro de la zona segura

// Índice de frase de cada palabra (para alternar encuadre)
export const sentenceIndex = (words: CutWord[]) => {
  let s = 0;
  return words.map((w, i) => {
    const idx = s;
    if (/[.?!]$/.test(w.text) || (i < words.length - 1 && words[i + 1].seg !== w.seg)) s++;
    return idx;
  });
};

// Empuje en palabra clave: 0 → 1 en 3 frames y se queda en 0,6
export const punchAt = (t: number, words: CutWord[], keys: Set<string>) => {
  let p = 0;
  for (const w of words) {
    if (!keys.has(clean(w.text).toLowerCase())) continue;
    const d = t - w.os;
    if (d >= 0 && d < 0.9) p = Math.max(p, interpolate(d, [0, 0.1, 0.9], [0, 1, 0.6], clamp));
  }
  return p;
};

// ---------- Subtítulos «línea» ----------
// Inter 800 marfil, 2–3 palabras, sin puntuación final. Debajo de la palabra que suena corre la línea naranja:
// crece desde la izquierda al empezar la palabra y se recoge hacia la derecha al pasar a la siguiente.
export const LineCaptions: React.FC<{ words: CutWord[]; t: number; f: number; fps: number; keys: Set<string>; hide?: boolean; size?: number }> = ({ words, t, f, fps, keys, hide, size = 82 }) => {
  if (hide) return null;
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (t >= words[i].os - 0.03) cur = i;
  if (cur < 0 || t > words[cur].oe + 0.45) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (n >= 3 || /[.,?!]$/.test(words[i - 1].text) || words[i].seg !== words[i - 1].seg)) {
      start = i;
      n = 0;
    }
    n++;
  }
  let end = start;
  while (end + 1 < words.length && end - start < 2 && !/[.,?!]$/.test(words[end].text) && words[end + 1].seg === words[end].seg) end++;
  const chunk = words.slice(start, end + 1);
  const inF = Math.round(words[start].os * fps);
  const chunkIn = spring({ frame: f - inF, fps, config: { damping: 14, stiffness: 240 } });
  return (
    <div style={{ position: "absolute", top: CAPTION_Y, left: 72, right: 150, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", transform: `translateY(${(1 - chunkIn) * 22}px)`, opacity: Math.min(1, chunkIn * 1.5) }}>
      {chunk.map((w, k) => {
        const i = start + k;
        const said = i <= cur;
        const isCur = i === cur;
        const key = keys.has(clean(w.text).toLowerCase());
        const local = t - w.os;
        const grow = interpolate(local, [0, 0.12], [0, 1], clamp);
        const next = i + 1 < words.length ? words[i + 1].os : w.oe + 0.3;
        const leave = interpolate(t, [next, next + 0.1], [0, 1], clamp);
        const pop = spring({ frame: f - Math.round(w.os * fps), fps, config: { damping: 11, stiffness: 320 } });
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", fontFamily: FONT, fontWeight: 800, fontSize: key ? size * 1.12 : size, lineHeight: 1.12, letterSpacing: "-0.035em", color: key && said ? A.orange : "#FBF8F2", opacity: said ? 1 : 0.55, textShadow: "0 5px 0 rgba(14,13,11,0.9), 0 0 28px rgba(14,13,11,0.55)", transform: `scale(${isCur ? 1 + 0.08 * (1 - Math.min(1, pop)) : 1})` }}>
            {clean(w.text)}
            {isCur || (said && leave < 1) ? (
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -4, height: 11, borderRadius: 6, background: A.orange, boxShadow: "0 4px 0 rgba(14,13,11,0.85)", transformOrigin: leave > 0 ? "100% 50%" : "0% 50%", transform: `scaleX(${leave > 0 ? 1 - leave : grow})` }} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Tarjeta colgada ----------
// Tarjeta marfil con borde tinta, colgada de la línea naranja que baja del borde superior.
// Cae con peso en `at`, se balancea al aterrizar y sale de un tirón hacia arriba en `out`.
export const HangCard: React.FC<{ f: number; fps: number; at: number; out: number; x?: number; y?: number; label?: string; rot?: number; children: React.ReactNode }> = ({ f, fps, at, out, x = 540, y = CARD_Y, label, rot = -3, children }) => {
  if (f < at - 1 || f > out + 12) return null;
  const drop = fall(f - at, fps);
  const pull = yank(f - out, 9);
  const cy = y - (1 - drop) * 700 - pull * 1300;
  const swing = rot + 5 * impact(f - at - 6) * (pull > 0 ? 0 : 1);
  const sq = 0.06 * impact(f - at - 6);
  return (
    <AbsoluteFill>
      <Rope ax={x} ay={-40} bx={x} by={cy - 92} slack={0.02 + 0.06 * impact(f - at - 6)} t={f / fps} width={10} hook={false} />
      <div style={{ position: "absolute", left: x, top: cy, transform: `translate(-50%, -50%) rotate(${swing}deg) scale(${1 + sq}, ${1 - sq})`, transformOrigin: "50% 0%" }}>
        <div style={{ position: "absolute", left: "50%", top: -26, width: 30, height: 30, marginLeft: -15, borderRadius: 15, background: A.orange, border: `5px solid ${A.ink}` }} />
        <div style={{ background: "#FBF8F2", border: `6px solid ${A.ink}`, borderRadius: 30, padding: "24px 44px 30px", boxShadow: "0 34px 50px rgba(14,13,11,0.45), 0 7px 0 rgba(14,13,11,0.95)", textAlign: "center", whiteSpace: "nowrap" }}>
          {label ? <div style={{ fontFamily: LABEL, fontSize: 28, letterSpacing: "0.1em", color: A.orange, marginBottom: 8 }}>{label}</div> : null}
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1, letterSpacing: "-0.045em", color: A.ink }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Tarjetas apiladas: cada nueva cae encima de la anterior (una lista que se acumula: 01, 02, 03…)
export const StackCard: React.FC<{ f: number; fps: number; at: number; until: number; k: number; label: string; text: string; hot?: boolean }> = ({ f, fps, at, until, k, label, text, hot }) => {
  if (f < at - 1 || f > until + 8) return null;
  const drop = fall(f - at, fps);
  const out = interpolate(f, [until, until + 8], [0, 1], clamp);
  const sq = 0.08 * impact(f - at - 5);
  const x = SIDE.x + [-8, 10, -6, 8][k % 4];
  const y = SIDE.y + k * 34 - (1 - drop) * 1100 - out * 40;
  const rot = [-5, 4, -3, 6][k % 4];
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: 1 - out, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${1 + sq}, ${1 - sq})`, transformOrigin: "50% 100%" }}>
      <div style={{ background: "#FBF8F2", border: `6px solid ${A.ink}`, borderRadius: 28, padding: "14px 30px 18px", boxShadow: "0 30px 46px rgba(14,13,11,0.45), 0 7px 0 rgba(14,13,11,0.95)", whiteSpace: "nowrap" }}>
        <div style={{ fontFamily: LABEL, fontSize: 26, letterSpacing: "0.1em", color: A.orange }}>{label}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, lineHeight: 1.02, letterSpacing: "-0.045em", color: hot ? A.orange : A.ink }}>{text}</div>
      </div>
    </div>
  );
};

// ---------- Transición firma: el tirón ----------
// En los últimos `dur` frames del plano saliente, la línea naranja lo engancha por el borde y lo arrastra
// fuera de cuadro; el plano entrante ya está debajo. Máximo 2 por vídeo.
export const yankOffset = (f: number, cut: number, dur = 8) => {
  const p = yank(f - (cut - dur), dur);
  return { x: -1180 * p, rot: -4 * p, p };
};
export const YankRope: React.FC<{ f: number; cut: number; fps: number; dur?: number }> = ({ f, cut, fps, dur = 8 }) => {
  if (f < cut - dur - 4 || f >= cut) return null;
  const { x } = yankOffset(f, cut, dur);
  const tense = interpolate(f, [cut - dur - 4, cut - dur], [0.35, 0.02], clamp);
  return <Rope ax={-80} ay={760} bx={1080 + x - 40} by={760} slack={tense} buzz={f >= cut - dur ? 0.6 : 0} t={f / fps} width={14} />;
};

// ---------- Acabado ----------
// Grado cálido suave + grano de papel muy bajo + luz arriba / sombra abajo para leer los subtítulos.
export const GRADE = "contrast(1.07) saturate(1.06) sepia(0.06) brightness(1.02)";
export const Finish: React.FC = () => (
  <>
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "multiply" }}>
      {Array.from({ length: 12 }, (_, k) => (
        <Img key={k} src={staticFile("altera/papel.png")} style={{ position: "absolute", left: (k % 3) * 512, top: Math.floor(k / 3) * 512, width: 512, height: 512 }} />
      ))}
    </AbsoluteFill>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,13,11,0.28) 0%, rgba(14,13,11,0) 20%, rgba(14,13,11,0) 50%, rgba(14,13,11,0.5) 76%, rgba(14,13,11,0.25) 100%)" }} />
  </>
);

// Sonidos de marca (sin whooshes genéricos)
export const Sfx: React.FC<{ at: number; kind: keyof typeof SOUND; vol?: number }> = ({ at, kind, vol = 0.6 }) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40}>
    <Audio src={staticFile(SOUND[kind])} volume={vol} />
  </Sequence>
);
