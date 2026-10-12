import { Audio } from "@remotion/media";
import React from "react";
import { z } from "zod";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Capi2D, mixMouth, mouthAt, type CapiPose } from "../Capi/Capi2D";
import { B, SANS } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import iconos from "./iconos.json";

// «Mismo clip, dos ediciones»: pieza de captación de Hook House. Capi, de invitado en un pódcast, dice la misma
// frase en dos teléfonos: a la izquierda sin editar (plano fijo, subtítulo plano), a la derecha con la edición de
// Hook House (encuadre cerrado, zooms en las claves, subtítulos palabra a palabra, emoji). Luego, ¿cuál terminarías?
// y la llamada a la acción. Sin voz: el sonido son efectos propios (public/sfx); la música se añade en la app.
// Reutilizable: textos, palabras con sus tiempos, claves y emojis llegan por props (inglés o español).

const iconSchema = z.enum(["light-bulb", "scissors", "check-mark-button", "backhand-index-pointing-down", "studio-microphone"]);

export const mismoClipSchema = z.object({
  hook: z.tuple([z.string(), z.string()]), // «Same clip.» / «Two edits.»
  labels: z.tuple([z.string(), z.string()]), // «Before» / «After»
  words: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number(), key: z.boolean().default(false), icon: iconSchema.nullable().default(null) })).min(3),
  chunks: z.array(z.number().int().min(1)), // palabras por página del subtítulo animado (suman words.length)
  plainSplit: z.number().int().min(1), // el subtítulo plano cambia de línea en esta palabra
  question: z.string(), // «Which one would you finish?»
  scrolled: z.string(), // etiqueta del teléfono que se desliza
  ctaTop: z.string(), // «Comment»
  ctaWord: z.string(), // «CLIP»
  ctaBottom: z.string(), // «and I'll edit one of your podcast clips for free»
});
export type MismoClipProps = z.infer<typeof mismoClipSchema>;

export const MISMO_CLIP_FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const fr = (ms: number) => Math.round((ms / 1000) * MISMO_CLIP_FPS);

// Momentos de la pieza (frames), a partir de los tiempos de la frase
const timing = (p: MismoClipProps) => {
  const lineStart = fr(p.words[0].startMs);
  const lineEnd = fr(p.words[p.words.length - 1].endMs);
  const verdict = lineEnd + 12;
  const cta = verdict + 66;
  return { lineStart, lineEnd, verdict, cta, end: cta + 105 };
};
export const mismoClipDuration = (p: MismoClipProps) => timing(p).end;

const PHONE = { w: 496, h: 1000, top: 470, gap: 32 };
const phoneX = (side: 0 | 1) => 540 + (side === 0 ? -1 : 1) * (PHONE.gap / 2) - (side === 0 ? PHONE.w : 0);

const pop = (frame: number, enter: number, fps: number, damping = 12) => spring({ frame: frame - enter, fps, config: { damping, stiffness: 200, mass: 0.6 } });

// Pose de Capi hablando la frase (la misma en los dos teléfonos)
const poseAt = (p: MismoClipProps, frame: number): CapiPose => {
  const tMs = (frame / MISMO_CLIP_FPS) * 1000;
  const speaking = p.words.some((w) => tMs >= w.startMs && tMs < w.endMs);
  const mouth = mixMouth(mouthAt(p.words, tMs, 0.75), mouthAt(p.words, tMs - 40, 0.75), 0.35);
  const keyNow = p.words.find((w) => w.key && tMs >= w.startMs - 60 && tMs < w.endMs + 200);
  const blinkPhase = frame % 97;
  return {
    mouth,
    blink: blinkPhase < 3 ? [0.6, 1, 0.5][blinkPhase] : 0,
    brow: keyNow ? 0.8 : speaking ? 0.15 : 0,
    browTilt: 0,
    lookX: Math.sin(frame / 45) * 0.15,
    lookY: 0.05,
    tilt: Math.sin(frame / 38) * 2.2 + (keyNow ? 2 : 0),
    breathe: (Math.sin(frame / 22) + 1) / 2,
    wink: 0,
    smile: speaking ? 0.4 : 0.7,
  };
};

// El plató del pódcast: fondo oscuro, Capi y el micrófono
const Studio: React.FC<{ p: MismoClipProps; frame: number; zoom: number; originY: number }> = ({ p, frame, zoom, originY }) => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 30%, #2E3440 0%, #15171C 70%)", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `50% ${originY}px` }}>
      {/* luz de estudio detrás */}
      <div style={{ position: "absolute", left: 70, top: 90, width: 360, height: 360, borderRadius: 999, background: "radial-gradient(circle, rgba(18,161,80,0.35), rgba(18,161,80,0) 70%)" }} />
      <div style={{ position: "absolute", left: 28, top: 190 }}>
        <Capi2D pose={poseAt(p, frame)} width={440} />
      </div>
      {/* micrófono de pódcast delante */}
      <div style={{ position: "absolute", left: 318, top: 500 }}>
        <div style={{ width: 74, height: 120, borderRadius: 37, background: "#0E0F12", border: "5px solid #3A3F49" }} />
        <div style={{ position: "absolute", left: 30, top: 118, width: 14, height: 200, background: "#0E0F12" }} />
      </div>
    </div>
  </div>
);

const Pill: React.FC<{ text: string; bg: string; x: number; y: number; s: number }> = ({ text, bg, x, y, s }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, padding: "12px 30px", borderRadius: 999, background: bg, color: B.white, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: "0.08em", whiteSpace: "nowrap", boxShadow: "0 10px 26px rgba(0,0,0,0.18)" }}>
    {text.toUpperCase()}
  </div>
);

const Icon: React.FC<{ name: z.infer<typeof iconSchema>; size: number; style?: React.CSSProperties }> = ({ name, size, style }) => (
  <Img src={iconos[name]} style={{ width: size, height: size, ...style }} />
);

// Teléfono «antes»: plano fijo y subtítulo plano en dos líneas
const PhoneBefore: React.FC<{ p: MismoClipProps; frame: number }> = ({ p, frame }) => {
  const tMs = (frame / MISMO_CLIP_FPS) * 1000;
  const first = p.words.slice(0, p.plainSplit);
  const second = p.words.slice(p.plainSplit);
  const line = tMs < (second[0]?.startMs ?? Infinity) ? first : second;
  const show = tMs >= p.words[0].startMs - 100 && tMs < p.words[p.words.length - 1].endMs + 600;
  return (
    <>
      <Studio p={p} frame={frame} zoom={1} originY={340} />
      {show ? (
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 150, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 26, color: "#FFFFFF", background: "rgba(0,0,0,0.55)", padding: "6px 10px" }}>
          {line.map((w) => w.text).join(" ")}
        </div>
      ) : null}
    </>
  );
};

// Teléfono «después»: encuadre cerrado que empuja en cada clave, subtítulo palabra a palabra y emoji
const PhoneAfter: React.FC<{ p: MismoClipProps; frame: number; fps: number }> = ({ p, frame, fps }) => {
  const tMs = (frame / MISMO_CLIP_FPS) * 1000;
  // Páginas de 1–3 palabras
  const pages: { from: number; to: number }[] = [];
  let i = 0;
  for (const n of p.chunks) {
    pages.push({ from: i, to: Math.min(p.words.length, i + n) });
    i += n;
  }
  const pageIdx = pages.findIndex((pg, k) => tMs >= p.words[pg.from].startMs - 80 && (k === pages.length - 1 ? tMs < p.words[pg.to - 1].endMs + 600 : tMs < p.words[pages[k + 1].from].startMs - 80));
  // Zoom: cerrado, alterna por página y empuja en las claves
  const base = 1.42 + (pageIdx >= 0 && pageIdx % 2 ? 0.12 : 0);
  const punch = Math.max(0, ...p.words.filter((w) => w.key).map((w) => {
    const k = frame - fr(w.startMs);
    return k >= 0 && k < 14 ? Math.sin((k / 14) * Math.PI) * 0.1 : 0;
  }));
  const keyIcon = p.words.find((w) => w.icon && tMs >= w.startMs && tMs < w.endMs + 700);
  return (
    <>
      <Studio p={p} frame={frame} zoom={base + punch} originY={250} />
      {pageIdx >= 0 ? (
        <div style={{ position: "absolute", left: 16, right: 16, top: 770, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, fontFamily: SANS, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
          {p.words.slice(pages[pageIdx].from, pages[pageIdx].to).map((w, k) => {
            const s = pop(frame, fr(w.startMs) - 1, fps, 11);
            const live = tMs >= w.startMs;
            return (
              <span
                key={k}
                style={{
                  display: "inline-block",
                  fontSize: w.key ? 66 : 54,
                  color: "#FFFFFF",
                  background: w.key ? B.green : "transparent",
                  borderRadius: 14,
                  padding: w.key ? "0 14px 4px" : 0,
                  opacity: live ? 1 : 0,
                  transform: `scale(${live ? 0.6 + 0.4 * s : 0.6})`,
                  transformOrigin: "50% 100%",
                  textShadow: "0 4px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.5)",
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ) : null}
      {keyIcon?.icon ? (
        <div style={{ position: "absolute", left: 350, top: 90, transform: `scale(${pop(frame, fr(keyIcon.startMs), fps, 9)}) rotate(${Math.sin(frame / 6) * 6}deg)` }}>
          <Icon name={keyIcon.icon} size={110} />
        </div>
      ) : null}
    </>
  );
};

const Phone: React.FC<{ side: 0 | 1; enter: number; children: React.ReactNode; dim?: number; ring?: number; dy?: number }> = ({ side, enter, children, dim = 0, ring = 0, dy = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter - side * 4, fps, config: { damping: 15, stiffness: 120 } });
  return (
    <div
      style={{
        position: "absolute",
        left: phoneX(side),
        top: PHONE.top + (1 - s) * 900 + dy,
        width: PHONE.w,
        height: PHONE.h,
        borderRadius: 54,
        overflow: "hidden",
        background: "#000",
        border: `10px solid ${B.ink}`,
        boxShadow: ring > 0 ? `0 0 0 ${8 * ring}px ${B.green}, 0 30px 70px rgba(0,0,0,0.25)` : "0 30px 70px rgba(0,0,0,0.25)",
        filter: dim > 0 ? `grayscale(${dim}) brightness(${1 - dim * 0.35})` : undefined,
      }}
    >
      {children}
      {/* barra de vídeo corto: botones laterales para que se lea como Reels/TikTok */}
      <div style={{ position: "absolute", right: 16, bottom: 150, display: "flex", flexDirection: "column", gap: 26 }}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.85)" }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 24, bottom: 56, width: 180, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.7)" }} />
      <div style={{ position: "absolute", left: 24, bottom: 30, width: 260, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.45)" }} />
    </div>
  );
};

export const MismoClip: React.FC<MismoClipProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = timing(p);
  // Gancho: grande en el centro, luego sube y se hace cabecera
  const h1 = pop(frame, 3, fps, 10);
  const h2 = pop(frame, 20, fps, 10);
  const up = interpolate(frame, [52, 70], [0, 1], { ...clamp, easing: ease });
  const hookOut = interpolate(frame, [t.verdict - 6, t.verdict + 4], [1, 0], clamp);
  const qIn = pop(frame, t.verdict, fps, 13);
  const verdictK = interpolate(frame, [t.verdict + 26, t.verdict + 40], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [t.cta - 10, t.cta + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const ctaIn = pop(frame, t.cta + 4, fps, 11);
  const sfx: [string, number, number][] = [
    ["pop", 3, 0.45],
    ["pop", 20, 0.45],
    ["whoosh", 52, 0.35],
    ["click", t.lineStart - 12, 0.35],
    ...p.words.filter((w) => w.key).map((w): [string, number, number] => ["hit", fr(w.startMs), 0.4]),
    ["whoosh", t.verdict - 4, 0.35],
    ["click", t.verdict + 26, 0.45],
    ["whoosh", t.cta - 8, 0.35],
    ["brillo", t.cta + 8, 0.45],
  ];
  const hookSize = 150 - 70 * up;
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      {/* rejilla de puntos */}
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(20,20,20,0.10) 2px, transparent 2px)", backgroundSize: "36px 36px", backgroundPosition: `${(frame * 0.4) % 36}px 0px` }} />
      {sfx.map(([name, at, vol], k) => (
        <Sequence key={k} from={Math.max(0, at)} durationInFrames={45} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}
      {/* Gancho */}
      <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(up, [0, 1], [700, 150]), opacity: hookOut, display: "flex", flexDirection: up > 0.5 ? "row" : "column", justifyContent: "center", alignItems: "center", gap: up > 0.5 ? 26 : 0, fontFamily: SANS, fontWeight: 800, fontSize: hookSize, letterSpacing: "-0.05em", lineHeight: 1 }}>
        <span style={{ transform: `scale(${h1})`, color: B.ink }}>{p.hook[0]}</span>
        <span style={{ transform: `scale(${h2})`, color: B.green }}>{p.hook[1]}</span>
      </div>
      {/* Pregunta */}
      {frame >= t.verdict - 2 && frame < t.cta + 2 ? (
        <div style={{ position: "absolute", left: 40, right: 40, top: 160, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 78, letterSpacing: "-0.04em", lineHeight: 1.05, color: B.ink, transform: `scale(${qIn})`, opacity: 1 - out }}>
          {p.question}
        </div>
      ) : null}
      {/* Teléfonos */}
      {frame >= 60 && frame < t.cta + 8 ? (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${out * 200}px)` }}>
          <Phone side={0} enter={62} dim={verdictK} dy={verdictK * 30}>
            <PhoneBefore p={p} frame={frame} />
          </Phone>
          <Phone side={1} enter={62} ring={verdictK}>
            <PhoneAfter p={p} frame={frame} fps={fps} />
          </Phone>
          <Pill text={p.labels[0]} bg={B.grey} x={phoneX(0) + PHONE.w / 2} y={PHONE.top - 6} s={pop(frame, 74, fps)} />
          <Pill text={p.labels[1]} bg={B.green} x={phoneX(1) + PHONE.w / 2} y={PHONE.top - 6} s={pop(frame, 80, fps)} />
          {verdictK > 0 ? (
            <>
              <div style={{ position: "absolute", left: phoneX(0) + PHONE.w / 2, top: PHONE.top + PHONE.h / 2 + 30, transform: `translate(-50%, -50%) rotate(-8deg) scale(${verdictK})`, padding: "14px 30px", background: B.ink, color: B.white, fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: "0.06em", borderRadius: 14 }}>
                {p.scrolled.toUpperCase()}
              </div>
              <div style={{ position: "absolute", left: phoneX(1) + PHONE.w - 70, top: PHONE.top - 50, transform: `scale(${pop(frame, t.verdict + 30, fps, 8)})` }}>
                <Icon name="check-mark-button" size={120} />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {/* Llamada a la acción */}
      {frame >= t.cta ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, fontFamily: SANS }}>
          <div style={{ fontWeight: 800, fontSize: 96, letterSpacing: "-0.04em", color: B.ink, transform: `translateY(${(1 - ctaIn) * 40}px)`, opacity: ctaIn }}>{p.ctaTop}</div>
          <div style={{ transform: `scale(${pop(frame, t.cta + 10, fps, 8)}) rotate(-3deg)`, padding: "18px 64px", borderRadius: 30, background: B.green, color: B.white, fontWeight: 800, fontSize: 170, letterSpacing: "-0.03em", boxShadow: "0 24px 60px rgba(18,161,80,0.35)" }}>
            {p.ctaWord}
          </div>
          <Icon name="backhand-index-pointing-down" size={110} style={{ transform: `translateY(${Math.sin(frame / 5) * 10}px)`, opacity: interpolate(frame, [t.cta + 16, t.cta + 22], [0, 1], clamp) }} />
          <div style={{ maxWidth: 860, textAlign: "center", fontWeight: 700, fontSize: 54, lineHeight: 1.15, color: B.grey, opacity: interpolate(frame, [t.cta + 20, t.cta + 30], [0, 1], clamp) }}>{p.ctaBottom}</div>
          <div style={{ marginTop: 40, opacity: interpolate(frame, [t.cta + 34, t.cta + 46], [0, 1], clamp) }}>
            <Wordmark size={84} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Versión en inglés (la de captación de clientes angloparlantes). Frase de Capi: consejo, no una cifra.
const w = (text: string, startMs: number, endMs: number, key = false, icon: z.infer<typeof iconSchema> | null = null) => ({ text, startMs, endMs, key, icon });
export const MISMO_CLIP_EN: MismoClipProps = {
  hook: ["Same clip.", "Two edits."],
  labels: ["Before", "After"],
  words: [
    w("Start", 3300, 3580),
    w("every", 3580, 3860),
    w("clip", 3860, 4200),
    w("with", 4300, 4500),
    w("the", 4500, 4650),
    w("answer.", 4650, 5400, true, "light-bulb"),
    w("Then", 5800, 6080),
    w("cut", 6080, 6380),
    w("every", 6380, 6660),
    w("pause.", 6660, 7400, true, "scissors"),
  ],
  chunks: [3, 3, 2, 2],
  plainSplit: 6,
  question: "Which one would you finish?",
  scrolled: "Scrolled",
  ctaTop: "Comment",
  ctaWord: "CLIP",
  ctaBottom: "and I'll edit one of your podcast clips for free",
};

export const MISMO_CLIP_ES: MismoClipProps = {
  hook: ["Mismo clip.", "Dos ediciones."],
  labels: ["Antes", "Después"],
  words: [
    w("Empieza", 3300, 3700),
    w("cada", 3700, 3950),
    w("clip", 3950, 4250),
    w("con", 4350, 4500),
    w("la", 4500, 4620),
    w("respuesta.", 4620, 5400, true, "light-bulb"),
    w("Después", 5800, 6200),
    w("corta", 6200, 6500),
    w("cada", 6500, 6750),
    w("pausa.", 6750, 7400, true, "scissors"),
  ],
  chunks: [3, 3, 2, 2],
  plainSplit: 6,
  question: "¿Cuál terminarías de ver?",
  scrolled: "Deslizado",
  ctaTop: "Escribe",
  ctaWord: "CLIP",
  ctaBottom: "y te edito un clip de tu pódcast gratis",
};
