import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { SANS, MONO } from "../HookHouse/brand";

// Sistema visual «HOOKHOUSE ALTERA LA REALIDAD» (reglas completas en estilo-altera.md).
// La edición tiene fuerza física: las palabras pesan y empujan, la línea naranja engancha y arrastra,
// los cortes abren espacio. Todo lo de este archivo es reutilizable en cualquier reel.

// ---------- Identidad ----------
export const A = {
  ivory: "#F2EDE3", // fondo (evoluciona el blanco roto #F7F7F2 de la marca)
  ivoryDeep: "#E6DFD2", // suelo / planos traseros
  ink: "#0E0D0B", // tinta (el negro de la marca)
  orange: "#FF5A1F", // naranja eléctrico: SOLO la línea-firma y una palabra clave por plano
  orangeDeep: "#C9400F",
  grey: "#8A847A",
  shadow: "rgba(14,13,11,0.30)",
};
export const FONT = SANS; // Inter 800, la tipografía de la marca
export const LABEL = MONO; // JetBrains Mono para etiquetas pequeñas

// Zona segura de TikTok en 1080 × 1920: nada importante fuera de este rectángulo
export const SAFE = { top: 210, bottom: 1480, left: 72, right: 1080 - 150 };
export const FLOOR = 1380; // "suelo" por defecto donde apoyan los objetos

export const SOUND = {
  tension: "sfx/hh/tension.wav",
  tiron: "sfx/hh/tiron.wav",
  impacto: "sfx/hh/impacto.wav",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lin = (f: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) => interpolate(f, [a, b], [from, to], { ...clamp, easing });

// ---------- Física ----------
// Caída con peso: 0 → 1 con un único rebote corto (no gomoso)
// (se corta en 1: el objeto no atraviesa el suelo; el rebote lo da impact() al aterrizar)
export const fall = (local: number, fps: number) => Math.min(1, spring({ frame: local, fps, config: { damping: 14, stiffness: 260, mass: 1.4 } }));
// Respuesta a un impacto: 1 en el golpe y oscilación amortiguada (para aplastar/estirar)
export const impact = (local: number) => (local < 0 ? 0 : Math.exp(-local / 5) * Math.cos(local * 0.75));
// Tirón: arranca lento (tensión) y sale disparado
export const yank = (local: number, dur: number) => {
  const x = Math.max(0, Math.min(1, local / dur));
  return x * x * x;
};
// Muelle de vuelta a la forma (un clip liberado recupera su forma)
export const settle = (local: number, fps: number) => spring({ frame: local, fps, config: { damping: 9, stiffness: 180 } });

// ---------- Fondo marfil con textura sutil ----------
export const Paper: React.FC<{ tone?: string; children?: React.ReactNode }> = ({ tone = A.ivory, children }) => (
  <AbsoluteFill style={{ background: tone }}>
    {/* Grano de papel: una tesela de 512 px repetida (las <Img> garantizan que esté cargada antes de renderizar) */}
    <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "multiply" }}>
      {Array.from({ length: 12 }, (_, k) => (
        <Img key={k} src={staticFile("altera/papel.png")} style={{ position: "absolute", left: (k % 3) * 512, top: Math.floor(k / 3) * 512, width: 512, height: 512 }} />
      ))}
    </AbsoluteFill>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0) 55%, rgba(14,13,11,0.10) 100%)" }} />
    {children}
  </AbsoluteFill>
);

// ---------- Sombra de contacto ----------
// x/y = punto de apoyo en el suelo; h = altura del objeto sobre el suelo (más alto = sombra más grande y suave)
export const ContactShadow: React.FC<{ x: number; y: number; w: number; h?: number; opacity?: number }> = ({ x, y, w, h = 0, opacity = 1 }) => {
  const k = Math.min(1, Math.max(0, h / 600));
  const ww = w * (1 + 0.35 * k);
  return (
    <div
      style={{
        position: "absolute",
        left: x - ww / 2,
        top: y - ww * 0.06,
        width: ww,
        height: ww * 0.12,
        borderRadius: "50%",
        background: `radial-gradient(ellipse, rgba(14,13,11,${0.42 * (1 - 0.7 * k) * opacity}) 0%, rgba(14,13,11,0) 70%)`,
        filter: `blur(${4 + 14 * k}px)`,
      }}
    />
  );
};

// ---------- Palabra con cuerpo ----------
// squash > 0 aplasta (peso), squash < 0 estira; pull = tensión horizontal (-1..1) que la inclina hacia el tirón.
export const Slab: React.FC<{
  text: string;
  x: number; // centro
  y: number; // línea base (apoyo)
  size: number;
  color?: string;
  squash?: number;
  pull?: number;
  rotate?: number;
  opacity?: number;
  tracking?: number;
  shadow?: boolean;
  lift?: number; // altura sobre el apoyo, para la sombra
}> = ({ text, x, y, size, color = A.ink, squash = 0, pull = 0, rotate = 0, opacity = 1, tracking = -0.045, shadow = true, lift = 0 }) => {
  const sy = 1 - 0.32 * squash;
  const sx = 1 + 0.18 * squash + 0.06 * Math.abs(pull);
  const w = text.length * size * 0.62;
  return (
    <>
      {shadow ? <ContactShadow x={x} y={y + lift} w={w * 0.9} h={lift} opacity={opacity} /> : null}
      <div
        style={{
          position: "absolute",
          left: x - 2000,
          width: 4000,
          top: y - size * 0.86,
          height: size,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${tracking}em`,
          color,
          opacity,
          transformOrigin: "50% 100%",
          transform: `translateY(${-lift}px) rotate(${rotate}deg) skewX(${-10 * pull}deg) scale(${sx}, ${sy})`,
          whiteSpace: "pre",
        }}
      >
        {text}
      </div>
    </>
  );
};

// ---------- Línea-firma naranja ----------
// Va de un ancla (normalmente fuera de cuadro) a un gancho. slack = comba (0 tensa, 1 floja);
// buzz = vibración de cuerda tensa; hook = dibuja el gancho en el extremo.
export const Rope: React.FC<{ ax: number; ay: number; bx: number; by: number; slack?: number; buzz?: number; t: number; hook?: boolean; width?: number; opacity?: number; color?: string }> = ({
  ax,
  ay,
  bx,
  by,
  slack = 0,
  buzz = 0,
  t,
  hook = true,
  width = 11,
  opacity = 1,
  color = A.orange,
}) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sag = slack * len * 0.32;
  const vib = buzz * 9 * Math.sin(t * 95);
  const c1x = ax + dx * 0.33 + nx * vib;
  const c1y = ay + dy * 0.33 + sag + ny * vib;
  const c2x = ax + dx * 0.66 - nx * vib;
  const c2y = ay + dy * 0.66 + sag - ny * vib;
  const d = `M${ax} ${ay} C${c1x} ${c1y} ${c2x} ${c2y} ${bx} ${by}`;
  // Dirección de llegada al gancho
  const ang = (Math.atan2(by - c2y, bx - c2x) * 180) / Math.PI;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity, pointerEvents: "none" }}>
      <path d={d} stroke="rgba(14,13,11,0.18)" strokeWidth={width} fill="none" strokeLinecap="round" transform="translate(6 14)" />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
      {hook ? (
        <g transform={`translate(${bx} ${by}) rotate(${ang - 90})`}>
          <path d="M0 -6 L0 26 C0 52 -38 52 -38 26 L-38 16" stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
          <circle r={width * 0.9} fill={color === A.orange ? A.orangeDeep : color} />
        </g>
      ) : null}
    </svg>
  );
};

// ---------- Clip real ----------
// Tarjeta con material del portafolio. frame = recorte (qué mostrar): {x, y, s} en proporción de la imagen.
export const ClipCard: React.FC<{
  src?: string;
  children?: React.ReactNode;
  x: number; // centro
  y: number; // apoyo (borde inferior)
  w: number;
  h: number;
  squash?: number;
  rotate?: number;
  lift?: number;
  focus?: { x: number; y: number; s: number };
  radius?: number;
  shadow?: boolean;
  opacity?: number;
  tilt?: number;
}> = ({ src, children, x, y, w, h, squash = 0, rotate = 0, lift = 0, focus = { x: 0.5, y: 0.5, s: 1 }, radius = 30, shadow = true, opacity = 1, tilt = 0 }) => {
  const sy = 1 - 0.4 * squash;
  const sx = 1 + 0.22 * squash;
  return (
    <>
      {shadow ? <ContactShadow x={x} y={y} w={w * sx} h={lift} opacity={opacity} /> : null}
      <div
        style={{
          position: "absolute",
          left: x - w / 2,
          top: y - h,
          width: w,
          height: h,
          opacity,
          transformOrigin: "50% 100%",
          transform: `translateY(${-lift}px) perspective(1600px) rotateY(${tilt}deg) rotate(${rotate}deg) scale(${sx}, ${sy})`,
          borderRadius: radius,
          overflow: "hidden",
          background: A.ink,
          boxShadow: "0 30px 60px rgba(14,13,11,0.28), 0 4px 10px rgba(14,13,11,0.25)",
          outline: `6px solid ${A.ink}`,
        }}
      >
        {src ? (
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
              transform: `scale(${focus.s})`,
            }}
          />
        ) : null}
        {children}
      </div>
    </>
  );
};

// Esquinas de encuadre ("qué mostrar")
export const FrameMarks: React.FC<{ x: number; y: number; w: number; h: number; p: number; color?: string }> = ({ x, y, w, h, p, color = A.orange }) => {
  if (p <= 0) return null;
  const L = 70;
  const k = 1 + 0.25 * (1 - p);
  const cw = w * k;
  const ch = h * k;
  const corners = [
    [x - cw / 2, y - ch / 2, 1, 1],
    [x + cw / 2, y - ch / 2, -1, 1],
    [x - cw / 2, y + ch / 2, 1, -1],
    [x + cw / 2, y + ch / 2, -1, -1],
  ];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, p * 2), pointerEvents: "none" }}>
      {corners.map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M${cx} ${cy + sy * L} L${cx} ${cy} L${cx + sx * L} ${cy}`} stroke={color} strokeWidth={12} fill="none" strokeLinecap="square" />
      ))}
    </svg>
  );
};

// Etiqueta pequeña honesta (proyecto real, cliente, tipo de pieza)
export const Tag: React.FC<{ x: number; y: number; text: string; dot?: boolean; opacity?: number; align?: "left" | "center" }> = ({ x, y, text, dot = true, opacity = 1, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: align === "center" ? x - 500 : x,
      width: align === "center" ? 1000 : undefined,
      top: y,
      textAlign: align,
      fontFamily: LABEL,
      fontWeight: 500,
      fontSize: 28,
      letterSpacing: "0.08em",
      color: A.ink,
      opacity,
    }}
  >
    {dot ? <span style={{ color: A.orange }}>● </span> : null}
    {text}
  </div>
);

// Titular de lectura: grande, alineado a la izquierda, palabra clave en naranja. Entra palabra a palabra sin
// robar protagonismo a la acción dominante (solo opacidad y 14 px de subida).
export const Headline: React.FC<{
  words: { text: string; at: number; key?: boolean }[];
  f: number;
  x?: number;
  y: number;
  size?: number;
  width?: number;
  out?: number; // frame en que se va
}> = ({ words, f, x = SAFE.left, y, size = 92, width = SAFE.right - SAFE.left, out }) => {
  const gone = out !== undefined ? lin(f, out, out + 6) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, width, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink, opacity: 1 - gone }}>
      {words.map((w, i) => {
        const p = lin(f, w.at, w.at + 6);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, transform: `translateY(${(1 - p) * 14}px)`, color: w.key ? A.orange : A.ink }}>
            {w.text}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Subtítulos con peso (para reels narrados) ----------
// Bloques de hasta 5 palabras (o hasta un signo); la palabra que suena "aterriza" con un pequeño golpe.
// Sin puntos ni comas; como mucho una palabra clave naranja por bloque.
// pill: la palabra que suena va en una píldora naranja (estándar desde 2026-10-30, estilo-altera.md corrección 8).
export const Captions: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number; keys?: number[]; top?: number; size?: number; pill?: boolean }> = ({ words, f, fps, keys = [], top = 1236, size = 66, pill = false }) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?!]$/.test(words[i - 1].text) || n >= 5)) {
      start = i;
      n = 0;
    }
    n++;
  }
  return (
    <div style={{ position: "absolute", top, left: SAFE.left, width: SAFE.right - SAFE.left, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.04em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const local = f - words[i].at;
        const d = spring({ frame: local, fps, config: { damping: 13, stiffness: 320 } });
        const land = impact(local - 3);
        const now = i === cur;
        if (pill) {
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 6px", opacity: Math.min(1, d * 1.6), transformOrigin: "50% 100%", transform: `translateY(${(1 - d) * -26}px) scale(${1 + 0.06 * land}, ${1 - 0.1 * land})` }}>
              <span style={{ display: "inline-block", padding: "0 14px 6px", borderRadius: 16, background: now ? A.orange : "transparent", color: now ? A.ivory : keys.includes(i) ? A.orange : "#3A3732" }}>{words[i].text.replace(/[.,:…]+$/, "").replace(/"/g, "")}</span>
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              color: keys.includes(i) ? A.orange : now ? A.ink : "#3A3732",
              opacity: Math.min(1, d * 1.6),
              transformOrigin: "50% 100%",
              transform: `translateY(${(1 - d) * -26}px) scale(${1 + 0.06 * land}, ${1 - 0.1 * land})`,
            }}
          >
            {words[i].text.replace(/[.,:…]+$/, "")}{" "}
          </span>
        );
      })}
    </div>
  );
};
