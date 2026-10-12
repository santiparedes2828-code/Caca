import { measureText } from "@remotion/layout-utils";
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, CONTENT_W, displayFont, rgba, SAFE, SPRINGS } from "./motion";
import { CHAIN, chainOffset, type ChainTimeline, MORPH, odometerDuration, STEP, typingSchedule } from "./timeline";
import { LABEL_FONT, type Theme } from "./theme";

// Animaciones de estilo-animaciones.md (las «5 instrucciones»): odómetro, movimientos encadenados, número de paso,
// tarjeta que escribe y la cubierta de la transformación entre escenas. Todo el texto en Inter; formas hechas con
// código (sin logotipos ni imágenes de terceros).

const INTER = '"Inter"';
const easeOut = Easing.out(Easing.cubic);

// Texto que sube desde detrás de un borde (la máscara)
const MaskUp: React.FC<{ at: number; children: React.ReactNode; from?: "abajo" | "arriba"; style?: React.CSSProperties }> = ({ at, children, from = "abajo", style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * (from === "abajo" ? 110 : -110)}%)` }}>{children}</div>
    </div>
  );
};

// ——— Odómetro ———

const isDigit = (c: string) => c >= "0" && c <= "9";

// Cifra cuyos dígitos ruedan dentro de una máscara y se asientan, primero los de la izquierda
export const OdometerNumber: React.FC<{ theme: Theme; value: string; label: string; enter: number; ready: boolean }> = ({ theme, value, label, enter, ready }) => {
  const frame = useCurrentFrame();
  const f = displayFont(theme);
  let size = 300 * f.scale;
  if (ready) {
    const w = measureText({ text: value, fontFamily: f.fontFamily, fontWeight: 800, fontSize: size, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }).width;
    if (w > CONTENT_W * 0.92) size *= (CONTENT_W * 0.92) / w;
  }
  let digit = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, alignSelf: "center" }}>
      <div
        style={{
          display: "flex",
          fontFamily: f.fontFamily,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          color: theme.palette.accent,
        }}
      >
        {[...value].map((ch, i) => {
          if (!isDigit(ch)) {
            const p = interpolate(frame, [enter + 2, enter + 9], [0, 1], { ...clamp, easing: easeOut });
            return (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", height: "1.05em" }}>
                <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 110}%)` }}>{ch}</span>
              </span>
            );
          }
          const idx = digit++;
          const target = Number(ch);
          const first = Math.floor(random(`odometro-${value}-${i}`) * 10);
          const steps = 10 + ((target - first + 10) % 10); // al menos una vuelta entera
          const p = interpolate(frame, [enter, enter + odometerDuration(idx)], [0, 1], { ...clamp, easing: easeOut });
          // De -1 (escondido bajo la máscara) a la última posición de la tira
          const pos = -1 + (steps + 1) * p;
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", height: "1.05em" }}>
              <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-pos * 1.05}em)` }}>
                {Array.from({ length: steps + 1 }, (_, k) => (
                  <span key={k} style={{ height: "1.05em", lineHeight: 1.05 }}>
                    {(first + k) % 10}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </div>
      {label ? (
        <MaskUp at={enter + 8}>
          <div style={{ fontFamily: `"${LABEL_FONT.family}"`, fontWeight: LABEL_FONT.weight, fontSize: 44, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.palette.ink, opacity: 0.75 }}>
            {label}
          </div>
        </MaskUp>
      ) : null}
    </div>
  );
};

// ——— Movimientos encadenados ———

const BLOCK = 170;
const PILL_H = 124;
const PILL_FS = 50;
const GAP = 64;

export type ChainGeometry = {
  scale: number;
  widths: number[]; // ya escalados
  xs: number[]; // borde izquierdo de cada bloque en su sitio final
  total: number;
  gap: number;
  approach: number;
  offscreen: number;
  recoil: number;
  labelSizes: number[];
  top: number; // hueco sobre los bloques (burbuja de la acción)
  height: number;
};

// Medidas de la fila: bloques cuadrados y el último, una píldora con su texto (la acción)
export const chainGeometry = (theme: Theme, items: string[], ready: boolean): ChainGeometry => {
  const f = displayFont(theme);
  const n = items.length;
  const width = (t: string, fs: number, weight: number) =>
    ready ? measureText({ text: t, fontFamily: f.fontFamily, fontWeight: weight, fontSize: fs, letterSpacing: "-0.01em" }).width : t.length * fs * 0.6;
  const raw = items.map((it, k) => (k === n - 1 ? Math.max(230, width(it, PILL_FS, 800) + 92) : BLOCK));
  const rawTotal = raw.reduce((a, b) => a + b, 0) + GAP * (n - 1);
  const scale = Math.min(1, (CONTENT_W - 30) / rawTotal);
  const widths = raw.map((w) => w * scale);
  const xs: number[] = [];
  let x = 0;
  for (const w of widths) {
    xs.push(x);
    x += w + GAP * scale;
  }
  const total = rawTotal * scale;
  // Etiquetas bajo la línea: caben en su bloque más el hueco
  const labelSizes = items.map((it, k) => (k === n - 1 ? 0 : Math.min(36, (36 * (BLOCK + GAP - 18)) / Math.max(1, width(it, 36, 500))) * scale));
  const rowLeft = SAFE.left + (CONTENT_W - total) / 2;
  return {
    scale,
    widths,
    xs,
    total,
    gap: GAP * scale,
    approach: 110 * scale,
    offscreen: rowLeft + widths[0] + 80,
    recoil: 14 * scale,
    labelSizes,
    top: 210 * scale,
    height: (210 + BLOCK + 80) * scale,
  };
};

// Bloque que lleva la acción en cada momento (para la cámara que sigue), respecto al centro de la fila
export const chainFocusX = (frame: number, tl: ChainTimeline, g: ChainGeometry) => {
  const n = g.widths.length;
  let k = 0;
  for (let i = 1; i < n; i++) if (frame >= tl.hits[i]) k = i;
  const dx = chainOffset(frame, k, n, tl, g);
  return g.xs[k] + dx + g.widths[k] / 2 - g.total / 2;
};

const Sparks: React.FC<{ x: number; y: number; at: number; color: string; size: number; count?: number; ring?: boolean }> = ({ x, y, at, color, size, count = 4, ring = false }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  const len = ring ? 14 : 9;
  if (d < 0 || d > len) return null;
  const p = d / len;
  const r0 = size * (ring ? 0.55 + 0.45 * p : 0.12 + 0.3 * p);
  const r1 = r0 + size * (ring ? 0.22 : 0.3) * (1 - p * 0.6);
  const angles = ring ? Array.from({ length: count }, (_, i) => (i * 360) / count + 22) : [-35, 35, 145, 215];
  return (
    <svg style={{ position: "absolute", left: x - size * 2, top: y - size * 2, width: size * 4, height: size * 4, overflow: "visible", pointerEvents: "none" }} viewBox={`${-size * 2} ${-size * 2} ${size * 4} ${size * 4}`}>
      {angles.map((a, i) => {
        const r = (a * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={Math.cos(r) * r0}
            y1={Math.sin(r) * r0}
            x2={Math.cos(r) * r1}
            y2={Math.sin(r) * r1}
            stroke={color}
            strokeWidth={Math.max(3, size * 0.07)}
            strokeLinecap="round"
            opacity={1 - p}
          />
        );
      })}
    </svg>
  );
};

// Fila de bloques: el primero entra y empuja al siguiente, que empuja al siguiente… y el último provoca la acción
export const ChainRow: React.FC<{ theme: Theme; items: string[]; icons: (string | null)[]; tl: ChainTimeline; g: ChainGeometry }> = ({ theme, items, icons, tl, g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = theme.palette;
  const f = displayFont(theme);
  const n = items.length;
  const s = g.scale;
  const base = g.top + BLOCK * s; // la línea de apoyo
  const line = interpolate(frame, [tl.appear - 4, tl.appear + 4], [0, 1], { ...clamp, easing: easeOut });
  const act = interpolate(frame, [tl.action, tl.action + 4], [0, 1], clamp);
  const pop = frame >= tl.action ? 1 + 0.12 * Math.sin(Math.PI * Math.min(1, (frame - tl.action) / 8)) : 1;
  const bubble = spring({ frame: frame - tl.action - 2, fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
  const check = interpolate(frame, [tl.action + 5, tl.action + 13], [0, 1], { ...clamp, easing: easeOut });
  const lastX = g.xs[n - 1] + chainOffset(frame, n - 1, n, tl, g) + g.widths[n - 1] / 2;
  const bubbleD = 120 * s;
  const bubbleY = base - PILL_H * s - 34 * s - bubbleD / 2;
  return (
    <div style={{ position: "relative", width: g.total, height: g.height, alignSelf: "center", flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          left: -40 * s,
          width: g.total + 80 * s,
          top: base - 2,
          height: 4,
          borderRadius: 4,
          background: rgba(p.ink, 0.3),
          transformOrigin: "left center",
          transform: `scaleX(${line})`,
        }}
      />
      {items.map((it, k) => {
        const dx = chainOffset(frame, k, n, tl, g);
        const shown = k === 0 ? (frame >= tl.tIn ? 1 : 0) : spring({ frame: frame - tl.appear - 3 * (k - 1), fps, config: SPRINGS[theme.motion] });
        const last = k === n - 1;
        const h = last ? PILL_H * s : BLOCK * s;
        const left = g.xs[k] + dx;
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: "absolute",
                left,
                top: base - h,
                width: g.widths[k],
                height: h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: last ? 999 : BLOCK * s * 0.2,
                boxSizing: "border-box",
                background: last ? (act > 0 ? p.accent : p.card) : k === 0 ? p.accent : p.ink,
                border: last ? `${5 * s}px solid ${p.ink}` : undefined,
                opacity: shown,
                transformOrigin: "bottom center",
                transform: `scale(${(k === 0 ? 1 : 0.6 + 0.4 * shown) * (last ? pop : 1)})`,
                fontFamily: f.fontFamily,
                fontWeight: 800,
                color: last ? (act > 0.5 ? p.onAccent : p.ink) : k === 0 ? p.onAccent : p.bg,
              }}
            >
              {last ? (
                <span style={{ fontSize: PILL_FS * s, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{it}</span>
              ) : icons[k] ? (
                <Img src={icons[k]!} style={{ width: BLOCK * s * 0.62, height: BLOCK * s * 0.62 }} />
              ) : (
                // Sin icono: las iniciales, como el bloque «Aa» de la referencia
                <span style={{ fontSize: BLOCK * s * 0.36, letterSpacing: "-0.02em" }}>{it.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2)}</span>
              )}
            </div>
            {last ? null : (
              // Etiqueta bajo la línea: cae desde detrás de ella (la línea es el borde de la máscara)
              <div style={{ position: "absolute", left: left + g.widths[k] / 2 - 160 * s, width: 320 * s, top: base + 2, textAlign: "center" }}>
                <MaskUp at={k === 0 ? tl.tIn + CHAIN.entry - 2 : tl.appear + 6 + 3 * k} from="arriba" style={{ paddingTop: 8 * s }}>
                  <span style={{ fontFamily: INTER, fontWeight: 500, fontSize: g.labelSizes[k], color: p.ink, opacity: 0.8, whiteSpace: "nowrap" }}>{it}</span>
                </MaskUp>
              </div>
            )}
            {k > 0 ? <Sparks x={g.xs[k] - g.gap} y={base - Math.min(h, BLOCK * s) / 2} at={tl.hits[k]} color={p.accent} size={70 * s} /> : null}
          </React.Fragment>
        );
      })}
      {frame >= tl.action ? (
        <>
          <Sparks x={lastX} y={bubbleY} at={tl.action + 2} color={p.accent} size={bubbleD} count={8} ring />
          <svg
            viewBox="-60 -60 120 120"
            style={{ position: "absolute", left: lastX - bubbleD / 2, top: bubbleY - bubbleD / 2, width: bubbleD, height: bubbleD, transform: `scale(${bubble})`, overflow: "visible" }}
          >
            <circle r="56" fill={p.accent2} />
            <path d="M -24 2 L -7 19 L 26 -16" fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - check} />
          </svg>
        </>
      ) : null}
    </div>
  );
};

// ——— Número de paso ———
// En inglés («[paso: Título | Step]») el contador dice «STEP 2 OF 5»
const EN_STEP = /^(step|tip|fix|rule|part|mistake|lesson)$/i;

// «PASO 2 DE 5» con puntos de progreso, el número grande que sube desde una máscara y su etiqueta en una caja que crece
export const StepHeader: React.FC<{ theme: Theme; n: number; total: number; title: string; word: string; enter: number; ready: boolean }> = ({ theme, n, total, title, word, enter, ready }) => {
  const frame = useCurrentFrame();
  const p = theme.palette;
  const NUM = 340;
  const numW = ready ? measureText({ text: String(n), fontFamily: INTER, fontWeight: 800, fontSize: NUM, letterSpacing: "-0.04em" }).width : NUM * 0.62 * String(n).length;
  const head = interpolate(frame, [enter, enter + 8], [0, 1], { ...clamp, easing: easeOut });
  const num = interpolate(frame, [enter + STEP.number, enter + STEP.number + 9], [0, 1], { ...clamp, easing: theme.motion === "suave" ? easeOut : Easing.out(Easing.back(1.2)) });
  const box = interpolate(frame, [enter + STEP.box, enter + STEP.box + 8], [0, 1], { ...clamp, easing: easeOut });
  const dots = Math.min(12, Math.max(1, total));
  return (
    <div style={{ width: CONTENT_W, alignSelf: "center", display: "flex", flexDirection: "column", gap: 30, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: head, transform: `translateY(${(1 - head) * -16}px)` }}>
        <span style={{ fontFamily: INTER, fontWeight: 700, fontSize: 26, letterSpacing: "0.22em", textTransform: "uppercase", color: p.ink, opacity: 0.55 }}>
          {`${word || "Paso"} ${n} ${EN_STEP.test(word) ? "of" : "de"} ${total}`}
        </span>
        <span style={{ display: "flex", gap: 9 }}>
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              style={{
                width: 17,
                height: 17,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: i + 1 === n ? "none" : `2.5px solid ${rgba(p.ink, i + 1 < n ? 0.85 : 0.35)}`,
                background: i + 1 === n ? p.accent : i + 1 < n ? rgba(p.ink, 0.85) : "transparent",
              }}
            />
          ))}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ overflow: "hidden", flexShrink: 0, padding: "0 0.06em", height: NUM * 0.86 }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: NUM, lineHeight: 0.86, letterSpacing: "-0.04em", color: p.ink, transform: `translateY(${(1 - num) * 110}%)` }}>{n}</div>
        </div>
        <div style={{ position: "relative", maxWidth: CONTENT_W - numW - 60, padding: "16px 30px 20px", transform: "rotate(-1.5deg)" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: p.accent, transformOrigin: "left center", transform: `scaleX(${box})` }} />
          <MaskUp at={enter + STEP.title} style={{ position: "relative" }}>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 58, lineHeight: 1.08, letterSpacing: "-0.01em", color: p.onAccent }}>{title}</div>
          </MaskUp>
        </div>
      </div>
    </div>
  );
};

// ——— Tarjeta que escribe ———

// Destello de 8 rayos dibujado con código (genérico: no es el logotipo de ninguna marca)
const Spark: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg viewBox="-12 -12 24 24" style={{ width: size, height: size, flexShrink: 0 }}>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <line key={i} x1={Math.cos(a) * 3.5} y1={Math.sin(a) * 3.5} x2={Math.cos(a) * 11} y2={Math.sin(a) * 11} stroke={color} strokeWidth="3" strokeLinecap="round" />;
    })}
  </svg>
);

const parseMarked = (text: string) => {
  const out: { t: string; hl: boolean }[] = [];
  text.split(/(\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    const hl = part.startsWith("*") && part.endsWith("*") && part.length > 2;
    out.push({ t: hl ? part.slice(1, -1) : part, hl });
  });
  return out;
};

// Tarjeta de chat que escribe una instrucción (las *palabras* marcadas se resaltan) y la envía
export const PromptCard: React.FC<{ theme: Theme; text: string; name: string; start: number; end: number }> = ({ theme, text, name, start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = theme.palette;
  const segs = parseMarked(text);
  const plain = segs.map((x) => x.t).join("");
  const sch = typingSchedule(start, end, plain.length);
  const typed = Math.max(0, Math.min(plain.length, Math.floor((frame - sch.t0) * sch.speed)));
  const sent = frame >= sch.send;
  const fs = plain.length > 110 ? 38 : plain.length > 70 ? 44 : 52;
  const s = spring({ frame: frame - start - 2, fps, config: SPRINGS[theme.motion] });
  const press = sent ? 1 - 0.12 * Math.sin(Math.PI * Math.min(1, (frame - sch.send) / 6)) : 1;
  const glow = interpolate(frame, [sch.send + 2, sch.send + 8], [0, 1], clamp);
  const cursorOn = !sent && (frame < sch.t1 + 2 || Math.floor((frame - sch.t1) / 15) % 2 === 0);
  let left = typed;
  return (
    <div
      style={{
        width: CONTENT_W,
        alignSelf: "center",
        flexShrink: 0,
        boxSizing: "border-box",
        padding: "30px 36px 26px",
        borderRadius: 30,
        background: p.card,
        border: `${2 + 2 * glow}px solid ${glow > 0 ? rgba(p.accent, 0.4 + 0.6 * glow) : rgba(p.ink, 0.1)}`,
        boxShadow: `0 24px 60px ${rgba(p.ink, 0.12)}`,
        opacity: s,
        transform: `translateY(${(1 - s) * 40}px) scale(${0.94 + 0.06 * s})`,
        fontFamily: INTER,
        color: p.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 700, fontSize: 34 }}>
        <Spark color={p.accent} size={36} />
        {name}
      </div>
      <div style={{ marginTop: 22, minHeight: fs * 1.3 * 2, fontWeight: 700, fontSize: fs, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
        {typed === 0 ? <span style={{ opacity: 0.35 }}>{name ? `Escribe a ${name}…` : "Escribe…"}</span> : null}
        {segs.map((seg, i) => {
          if (left <= 0) return null;
          const t = seg.t.slice(0, left);
          left -= seg.t.length;
          return seg.hl ? (
            <span key={i} style={{ background: rgba(p.accent, 0.35), borderRadius: 6, boxShadow: `0 0 0 3px ${rgba(p.accent, 0.35)}` }}>
              {t}
            </span>
          ) : (
            <span key={i}>{t}</span>
          );
        })}
        {cursorOn ? <span style={{ display: "inline-block", width: 4, height: "1.1em", marginLeft: 3, verticalAlign: "text-bottom", background: p.accent }} /> : null}
      </div>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <svg viewBox="-32 -32 64 64" style={{ width: 64, height: 64 }}>
          <circle r="29" fill="none" stroke={rgba(p.ink, 0.3)} strokeWidth="2.5" />
          <path d="M -9 0 H 9 M 0 -9 V 9" stroke={rgba(p.ink, 0.6)} strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ width: 78, height: 78, borderRadius: 18, background: sent ? p.ink : p.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})` }}>
          <svg viewBox="-20 -20 40 40" style={{ width: 40, height: 40 }}>
            <path d="M 0 13 V -12 M -10 -2 L 0 -12 L 10 -2" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ——— Transformación entre escenas sin icono ———

// Si una escena no tiene icono (modelo, cadena, paso, tarjeta), la cubierta nace o se recoge en el centro
export const MorphCover: React.FC<{ theme: Theme; at: number; grow: boolean; shrink: boolean }> = ({ theme, at, grow, shrink }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height * 0.45;
  const R = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) * 1.03;
  let r = 0;
  let o = 1;
  if (grow && frame >= at - MORPH.out && frame < at) r = R * interpolate(frame, [at - MORPH.out, at], [0, 1], { ...clamp, easing: Easing.in(Easing.poly(5)) });
  if (shrink && frame >= at && frame < at + MORPH.in) {
    const k = interpolate(frame, [at, at + MORPH.in], [0, 1], { ...clamp, easing: Easing.out(Easing.poly(5)) });
    r = R * (1 - k);
    o = 1 - 0.5 * k;
  }
  if (r <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", background: theme.palette.card, opacity: o }} />
    </AbsoluteFill>
  );
};
