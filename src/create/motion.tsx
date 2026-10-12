import { loadFont } from "@remotion/fonts";
import { fitText, measureText } from "@remotion/layout-utils";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT_FONTS, type AccentFontKey } from "../design/excepciones";
import { loadInter } from "../design/inter";
import { LABEL_FONT, THEME_FONTS, type Theme, type ThemeFont, type ThemedScene } from "./theme";
import { MORPH } from "./timeline";

// Motion graphics reutilizables para los vídeos con tema. Cada pieza recibe solo datos validados
// (tema, iconos ya resueltos, tiempos por palabra); nada se genera como código.

export type Cap = { text: string; startMs: number; endMs: number };
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Zona segura de TikTok/Reels: arriba la barra de pestañas, a la derecha los botones, abajo el texto del post
export const SAFE = { top: 300, left: 90, right: 170, bottom: 430 };
export const CONTENT_W = 1080 - SAFE.left - SAFE.right;

export const SPRINGS = {
  suave: { damping: 200 },
  rebote: { damping: 9, stiffness: 140, mass: 0.7 },
  energico: { damping: 14, stiffness: 260, mass: 0.6 },
} as const;

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ——— Fuentes ———

const fontCache = new Map<string, Promise<void>>();
const load = (family: string, file: string, weight: number, style = "normal") => {
  const key = `${family}|${weight}|${style}`;
  let p = fontCache.get(key);
  if (!p) {
    // loadFont bloquea el render hasta que la fuente está cargada y lo cancela si el archivo falta
    p = loadFont({ family, url: staticFile(`fonts/${file}`), weight: String(weight), style });
    fontCache.set(key, p);
  }
  return p;
};

export const useThemeFonts = (font: ThemeFont, accentFont: AccentFontKey = "inter") => {
  const [ready, setReady] = useState(false);
  // El fotograma no se captura hasta que las fuentes están listas: el titular se maqueta midiendo el texto
  const [handle] = useState(() => delayRender("Fuentes del tema"));
  useEffect(() => {
    let alive = true;
    const f = THEME_FONTS[font];
    // Inter en sus tres pesos (500, 700, 800); otra familia solo si el tema la trae
    const base = f.family === "Inter" ? [loadInter()] : [load(f.family, f.file, f.weight), loadInter()];
    const extra = accentFont === "inter" ? [] : [ACCENT_FONTS[accentFont]].map((a) => load(a.family, a.file, a.weight, a.style));
    Promise.all([...base, ...extra])
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [font, accentFont]);
  // Se libera después de pintar con las fuentes ya listas
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

// Fuente de las palabras clave: la del tema (Inter) salvo excepción pedida (src/design/excepciones.ts)
export const accentFontStyle = (theme: Theme, accentFont: AccentFontKey) => {
  if (accentFont === "inter") {
    const f = displayFont(theme);
    return { fontFamily: f.fontFamily, fontWeight: 800, fontStyle: "normal" as const };
  }
  const a = ACCENT_FONTS[accentFont];
  return { fontFamily: `"${a.family}"`, fontWeight: a.weight, fontStyle: a.style };
};

export const displayFont = (theme: Theme) => {
  const f = THEME_FONTS[theme.font];
  return { fontFamily: `"${f.family}"`, fontWeight: f.weight, textTransform: f.upper ? ("uppercase" as const) : ("none" as const), scale: f.scale };
};

// ——— Fondo ———

const BLOBS = [
  { x: 0.12, y: 0.16, r: 560, key: "accent", a: 0.2, sp: 0.06 },
  { x: 0.92, y: 0.52, r: 620, key: "accent2", a: 0.16, sp: 0.045 },
  { x: 0.35, y: 0.95, r: 600, key: "card", a: 0.55, sp: 0.05 },
] as const;

export const Background: React.FC<{ theme: Theme; icons: Record<string, string>; bgIcons: string[] }> = ({ theme, icons, bgIcons }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const p = theme.palette;
  // Liso: papel con viñeta suave, sin manchas ni iconos (estilo editorial)
  if (theme.background === "liso") return <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 70% at 50% 42%, ${p.bg} 0%, ${p.bg} 50%, ${p.bg2} 100%)` }} />;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${p.bg} 0%, ${p.bg2} 100%)`, overflow: "hidden" }}>
      {BLOBS.map((b, i) => {
        const cx = b.x * width + Math.sin(t * Math.PI * 2 * b.sp + i) * 70;
        const cy = b.y * height + Math.cos(t * Math.PI * 2 * b.sp + i * 2) * 90;
        const c = p[b.key];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - b.r,
              top: cy - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rgba(c, b.a)} 0%, ${rgba(c, 0)} 70%)`,
            }}
          />
        );
      })}
      {theme.background === "estrellas" ? (
        <Stars theme={theme} />
      ) : theme.background === "patron" ? (
        <Pattern icons={icons} names={bgIcons} />
      ) : (
        <Floaters icons={icons} names={bgIcons} soft={theme.background === "degradado"} />
      )}
    </AbsoluteFill>
  );
};

// Cielo de estrellas que titilan y suben despacio, con una estrella fugaz de vez en cuando
const Stars: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const shoot = (t % 4.6) / 0.7;
  const sx = 120 + (Math.floor(t / 4.6) % 3) * 260;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, width, height }}>
      {Array.from({ length: 150 }, (_, i) => {
        const r = 1.2 + random(`sr${i}`) * 2.8;
        const x = random(`sx${i}`) * width;
        const y = (((random(`sy${i}`) * height - t * (3 + r * 5)) % height) + height) % height;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + random(`st${i}`) * 1.6) + i));
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 7 ? "#FFFFFF" : theme.palette.accent2} opacity={tw} />;
      })}
      {shoot < 1 ? (
        <line
          x1={sx + shoot * 520}
          y1={260 + shoot * 260}
          x2={sx + shoot * 520 - 160}
          y2={260 + shoot * 260 - 80}
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          opacity={Math.sin(shoot * Math.PI)}
        />
      ) : null}
    </svg>
  );
};

// Iconos que flotan despacio (burbujas / degradado)
const Floaters: React.FC<{ icons: Record<string, string>; names: string[]; soft: boolean }> = ({ icons, names, soft }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (!names.length) return null;
  const n = soft ? 5 : 8;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const size = 110 + random(`fs${i}`) * 70;
        const x = random(`fx${i}`) * (width - size);
        const speed = 14 + random(`fv${i}`) * 18;
        const span = height + size * 2;
        const y = ((random(`fy${i}`) * span - (frame / fps) * speed) % span + span) % span - size;
        const rot = Math.sin((frame / fps) * 0.6 + i) * 14;
        return (
          <Img
            key={i}
            src={icons[names[i % names.length]]}
            style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity: soft ? 0.12 : 0.2, transform: `rotate(${rot}deg)` }}
          />
        );
      })}
    </>
  );
};

// Patrón de iconos pequeños en diagonal
const Pattern: React.FC<{ icons: Record<string, string>; names: string[] }> = ({ icons, names }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!names.length) return null;
  const step = 170;
  const shift = ((frame / fps) * 22) % step;
  return (
    <AbsoluteFill style={{ transform: `translate(${shift - step}px, ${shift - step}px)` }}>
      {Array.from({ length: 13 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => (
          <Img
            key={`${r}-${c}`}
            src={icons[names[(r + c) % names.length]]}
            style={{ position: "absolute", left: c * step + (r % 2) * (step / 2), top: r * step, width: 70, height: 70, opacity: 0.1, transform: `rotate(${((r * 7 + c * 13) % 30) - 15}deg)` }}
          />
        )),
      )}
    </AbsoluteFill>
  );
};

// ——— Cabecera y progreso ———

export const ProgressBar: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = interpolate(frame, [0, durationInFrames - 1], [0, 100], clamp);
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: rgba(theme.palette.ink, 0.08) }}>
      <div style={{ width: `${w}%`, height: "100%", background: theme.palette.accent, borderRadius: "0 6px 6px 0" }} />
    </div>
  );
};

export const HeaderChip: React.FC<{ theme: Theme; text: string }> = ({ theme, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text) return null;
  const s = spring({ frame: frame - 4, fps, config: SPRINGS[theme.motion] });
  return (
    <div style={{ position: "absolute", top: 210, left: SAFE.left, transform: `translateY(${(1 - s) * -40}px)`, opacity: s }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 26px",
          borderRadius: 999,
          background: theme.palette.card,
          color: theme.palette.ink,
          fontFamily: `"${LABEL_FONT.family}"`,
          fontWeight: LABEL_FONT.weight,
          fontSize: 30,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: theme.palette.accent }} />
        {text}
      </div>
    </div>
  );
};

// ——— Icono grande de la escena ———

export const Sticker: React.FC<{
  theme: Theme;
  src: string;
  size: number;
  enter: number;
  iconAt?: number; // el icono salta cuando se dice su palabra (sincronía con la voz)
  morphIn?: number | null; // transforma: fotograma en que la cubierta de la escena anterior se recoge en este icono
  morphOut?: number | null; // transforma: fotograma en que este icono termina de crecer hasta cubrir la pantalla
}> = ({ theme, src, size, enter, iconAt = enter, morphIn = null, morphOut = null }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Sin transformación, el halo aparece con su icono (cuando se nombra); con ella, el halo ya está (la cubierta se
  // recoge en él) y el icono salta al nombrarse
  const s = spring({ frame: frame - Math.max(enter, iconAt - 1), fps, config: SPRINGS[theme.motion] });
  const si = spring({ frame: frame - iconAt, fps, config: SPRINGS[theme.motion] });
  const t = frame / fps;
  const bob = Math.sin(t * Math.PI * 1.1) * 14;
  const rot = (1 - si) * -20 + Math.sin(t * Math.PI * 0.9) * 4;
  const ring = (frame * 0.6) % 360;
  // Objeto que se transforma: el halo crece hasta cubrir la pantalla (desde cualquier posición) o se recoge desde ella
  const cover = (2 * Math.hypot(width, height) * 1.05) / size;
  let halo = morphIn === null ? s : 1;
  let haloOpacity = 0.85;
  let morphing = false;
  if (morphIn !== null && frame < morphIn + MORPH.in) {
    const k = interpolate(frame, [morphIn, morphIn + MORPH.in], [0, 1], { ...clamp, easing: Easing.out(Easing.poly(5)) });
    halo = cover + (1 - cover) * k;
    haloOpacity = 1 - 0.15 * k;
    morphing = true;
  }
  let iconOut = 1;
  if (morphOut !== null && frame >= morphOut - MORPH.out) {
    const lin = interpolate(frame, [morphOut - MORPH.out, morphOut], [0, 1], clamp);
    const k = Easing.in(Easing.poly(5))(lin);
    halo += (cover - halo) * k;
    // Opaco enseguida: al cubrir la pantalla no se transparenta lo de debajo
    haloOpacity += (1 - haloOpacity) * Math.min(1, lin * 2.5);
    iconOut = interpolate(frame, [morphOut - MORPH.out, morphOut - 3], [1, 0], clamp);
    morphing = true;
  }
  const ringIn = morphIn === null ? s : spring({ frame: frame - morphIn - MORPH.in, fps, config: SPRINGS[theme.motion] });
  return (
    <div style={{ position: "relative", width: size, height: size, alignSelf: "center", flexShrink: 0, zIndex: morphing ? 20 : undefined }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: theme.palette.card, opacity: haloOpacity, transform: `scale(${halo})` }} />
      {morphing ? null : (
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: -size * 0.06, width: size * 1.12, height: size * 1.12, transform: `rotate(${ring}deg) scale(${ringIn})` }}>
          <circle cx="50" cy="50" r="48" fill="none" stroke={theme.palette.accent} strokeWidth="1.6" strokeDasharray="4 7" strokeLinecap="round" opacity="0.7" />
        </svg>
      )}
      <Img
        src={src}
        style={{
          position: "absolute",
          left: size * 0.12,
          top: size * 0.12,
          width: size * 0.76,
          height: size * 0.76,
          opacity: iconOut,
          transform: `translateY(${bob}px) rotate(${rot}deg) scale(${si * (2 - iconOut)})`,
        }}
      />
    </div>
  );
};

// ——— Titular con subtítulos a juego ———

const clean = (t: string) => t.replace(/[…:,;]+$/g, "");

export const headlineSize = (
  theme: Theme,
  words: Cap[],
  ready: boolean,
  accent?: { isAccent: (k: number) => boolean; font: AccentFontKey; scale: number },
) => {
  const n = words.length;
  const f = displayFont(theme);
  let size = (n <= 3 ? 150 : n <= 5 ? 128 : n <= 8 ? 110 : n <= 11 ? 96 : 86) * f.scale;
  if (ready) {
    // Cada palabra (las clave con su fuente y su tamaño) tiene que caber en el ancho útil
    const widest = Math.max(
      ...words.map((w, k) => {
        const big = accent?.isAccent(k);
        const af = big ? accentFontStyle(theme, accent!.font) : null;
        return measureText({
          text: clean(w.text),
          fontFamily: af?.fontFamily ?? f.fontFamily,
          fontWeight: af?.fontWeight ?? f.fontWeight,
          fontSize: size * (big ? accent!.scale : 1),
          textTransform: f.textTransform,
          additionalStyles: af?.fontStyle === "italic" ? { fontStyle: "italic" } : undefined,
        }).width;
      }),
    );
    if (widest > CONTENT_W * 0.94) size *= (CONTENT_W * 0.94) / widest;
  }
  return Math.round(size);
};

// Maquetación del titular en líneas (con las fuentes ya cargadas): permite la máscara por línea y que la cámara
// sepa dónde está cada palabra
export type HeadlineLayout = {
  lines: number[][]; // índices (dentro de la escena) de las palabras de cada línea
  widths: number[]; // ancho de cada palabra, con su relleno
  lineW: number[];
  gapX: number;
  gapY: number;
  lineH: number; // alto de cada línea (con el hueco de la máscara)
  mask: boolean;
};

// Máscara: hueco bajo cada línea (descendentes) y margen para que la palabra activa suba sin cortarse
const MASK = { top: 0.45, side: 0.3, bottom: 0.2, rule: 0.032 } as const;

export const headlineLayout = (
  theme: Theme,
  words: Cap[],
  size: number,
  ready: boolean,
  accent?: { isAccent: (k: number) => boolean; font: AccentFontKey; scale: number },
): HeadlineLayout | null => {
  if (!ready || !words.length) return null;
  const f = displayFont(theme);
  const widths = words.map((w, k) => {
    const big = !!accent?.isAccent(k);
    const af = big ? accentFontStyle(theme, accent!.font) : null;
    const fs = size * (big ? accent!.scale : 1);
    const width = measureText({
      text: clean(w.text),
      fontFamily: af?.fontFamily ?? f.fontFamily,
      fontWeight: af?.fontWeight ?? f.fontWeight,
      fontSize: fs,
      letterSpacing: big ? "-0.01em" : f.textTransform === "uppercase" ? "0.01em" : "-0.02em",
      textTransform: f.textTransform,
      additionalStyles: af?.fontStyle === "italic" ? { fontStyle: "italic" } : undefined,
    }).width;
    const pad = big && theme.captionStyle === "caja" ? 0.32 * fs : big && theme.captionStyle === "brillo" ? 0.12 * fs : 0;
    return width + pad;
  });
  const gapX = size * 0.27;
  const lines: number[][] = [];
  const lineW: number[] = [];
  let cur: number[] = [];
  let w = 0;
  widths.forEach((ww, k) => {
    if (cur.length && w + gapX + ww > CONTENT_W) {
      lines.push(cur);
      lineW.push(w);
      cur = [];
      w = 0;
    }
    w += (cur.length ? gapX : 0) + ww;
    cur.push(k);
  });
  lines.push(cur);
  lineW.push(w);
  const mask = theme.reveal === "mascara";
  return { lines, widths, lineW, gapX, gapY: size * (mask ? 0.16 : 0.1), lineH: size * (1.08 + (mask ? MASK.bottom : 0)), mask };
};

// Centro de cada palabra respecto al centro del titular (para la cámara que sigue)
export const wordCenters = (l: HeadlineLayout) => {
  const out: { x: number; y: number }[] = [];
  const n = l.lines.length;
  l.lines.forEach((line, j) => {
    let x = -l.lineW[j] / 2;
    const y = (j - (n - 1) / 2) * (l.lineH + l.gapY);
    for (const k of line) {
      out[k] = { x: x + l.widths[k] / 2, y };
      x += l.widths[k] + l.gapX;
    }
  });
  return out;
};

export const headlineHeight = (l: HeadlineLayout) => l.lines.length * l.lineH + (l.lines.length - 1) * l.gapY;

export const ThemedHeadline: React.FC<{
  theme: Theme;
  caps: Cap[];
  from: number;
  to: number;
  accent: [number, number] | null;
  size: number;
  accentFont?: AccentFontKey;
  accentScale?: number;
  layout?: HeadlineLayout | null;
  start?: number; // comienzo de la escena (la primera regla de la máscara se dibuja desde aquí)
}> = ({ theme, caps, from, to, accent, size, accentFont = "inter", accentScale = 1, layout = null, start = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  const p = theme.palette;
  const words = caps.slice(from, to + 1);
  const wordFrame = (k: number) => Math.round((words[k].startMs / 1000) * fps);
  const mask = !!layout?.mask;
  // Máscara: la palabra sube desde detrás de la regla de su línea en ~7 frames (sin fundido)
  const riseEasing = theme.motion === "suave" ? Easing.out(Easing.cubic) : Easing.out(Easing.back(1.3));

  const renderWord = (w: Cap, k: number) => {
    const i = from + k;
    const at = wordFrame(k);
    const end = Math.round((w.endMs / 1000) * fps);
    const s = spring({ frame: frame - at, fps, config: SPRINGS[theme.motion] });
    const shown = interpolate(frame - at, [0, 3], [0, 1], clamp);
    const rise = interpolate(frame, [at - 2, at + 5], [0, 1], { ...clamp, easing: riseEasing });
    const isAccent = !!accent && i >= accent[0] && i <= accent[1];
    const active = frame >= at && frame < end;
    const box = theme.captionStyle === "caja" && isAccent;
    const glow = theme.captionStyle === "brillo" && isAccent;
    const grow = spring({ frame: frame - at - 1, fps, config: { damping: 26, stiffness: 260 } });
    const af = isAccent ? accentFontStyle(theme, accentFont) : null;
    // Resplandor que late y un brillo que cruza la palabra cada 2,4 s
    const pulse = 0.75 + 0.25 * Math.sin(((frame - at) / fps) * Math.PI * 2 * 0.8);
    const shine = interpolate(((frame - at) / fps) % 2.4, [0, 0.9], [120, -20], clamp);
    const lift = active ? size * 0.04 : 0;
    return (
      <span
        key={i}
        style={{
          position: "relative",
          display: "inline-block",
          whiteSpace: "pre",
          opacity: mask ? 1 : shown,
          // La palabra que suena sube un poco (sin crecer a lo ancho, para no pegarse a sus vecinas)
          transform: mask
            ? `translateY(calc(${(1 - rise) * 140}% - ${lift}px))`
            : `translateY(${(1 - s) * size * 0.35 - lift}px) scale(${Math.min(1, 0.75 + 0.25 * s)})`,
          // En la caja el texto pasa a su color cuando la caja ya lo cubre (antes se perdería sobre el fondo)
          color: glow ? "transparent" : box ? (grow > 0.92 ? p.onAccent : p.ink) : isAccent && theme.captionStyle === "color" ? p.accent : p.ink,
          ...(af ? { fontFamily: af.fontFamily, fontWeight: af.fontWeight, fontStyle: af.fontStyle, fontSize: size * accentScale, letterSpacing: "-0.01em" } : {}),
          ...(glow
            ? {
                backgroundImage: `linear-gradient(100deg, ${p.accent} 30%, #FFFFFF 50%, ${p.accent} 70%)`,
                backgroundSize: "300% 100%",
                backgroundPosition: `${shine}% 0`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                filter: `drop-shadow(0 0 ${size * 0.12 * pulse}px ${rgba(p.accent, 0.95)}) drop-shadow(0 0 ${size * 0.32 * pulse}px ${rgba(p.accent, 0.5)})`,
                padding: "0 0.06em",
              }
            : {}),
          padding: box ? "0 0.16em" : undefined,
          zIndex: box ? 1 : undefined,
        }}
      >
        {box ? (
          <span
            style={{
              position: "absolute",
              inset: `${size * 0.04}px 0 ${size * 0.02}px`,
              borderRadius: size * 0.18,
              background: p.accent,
              transform: `scaleX(${grow}) rotate(-1.5deg)`,
              zIndex: -1,
            }}
          />
        ) : null}
        {isAccent && theme.captionStyle === "subrayado" ? (
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: mask ? 0 : -size * 0.06,
              height: size * (mask ? 0.1 : 0.13),
              borderRadius: size,
              background: p.accent,
              transformOrigin: "left",
              transform: `scaleX(${grow})`,
            }}
          />
        ) : null}
        {clean(w.text)}
      </span>
    );
  };

  const base: React.CSSProperties = {
    fontFamily: f.fontFamily,
    fontWeight: f.fontWeight,
    textTransform: f.textTransform,
    fontSize: size,
    lineHeight: 1.08,
    letterSpacing: f.textTransform === "uppercase" ? "0.01em" : "-0.02em",
    color: p.ink,
    textAlign: "center",
  };
  // Sin maquetar (fuentes aún sin cargar): el navegador reparte las líneas
  if (!layout) {
    return (
      <div style={{ ...base, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: `${size * 0.1}px ${size * 0.27}px` }}>
        {words.map(renderWord)}
      </div>
    );
  }
  const ruleH = Math.max(4, Math.round(size * MASK.rule));
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", rowGap: layout.gapY }}>
      {layout.lines.map((line, j) => {
        const row = (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", columnGap: layout.gapX }}>{line.map((k) => renderWord(words[k], k))}</div>
        );
        if (!mask) return <React.Fragment key={j}>{row}</React.Fragment>;
        // La regla (el borde de la máscara) se dibuja de izquierda a derecha justo antes de su primera palabra
        const ruleAt = Math.max(start, wordFrame(line[0]) - 8);
        const draw = interpolate(frame, [ruleAt, ruleAt + 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const rw = layout.lineW[j] + size * 0.2;
        return (
          <div key={j} style={{ position: "relative" }}>
            <div
              style={{
                overflow: "hidden",
                padding: `${size * MASK.top}px ${size * MASK.side}px ${size * MASK.bottom}px`,
                margin: `${-size * MASK.top}px ${-size * MASK.side}px 0`,
              }}
            >
              {row}
            </div>
            <div
              style={{
                position: "absolute",
                left: `calc(50% - ${rw / 2}px)`,
                width: rw,
                bottom: -ruleH / 2,
                height: ruleH,
                borderRadius: ruleH,
                background: p.accent,
                opacity: 0.85,
                transformOrigin: "left center",
                transform: `scaleX(${draw})`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ——— Gráficos por tipo de escena ———

export const ListCards: React.FC<{ theme: Theme; items: string[]; icons: (string | null)[]; enters: number[] }> = ({ theme, items, icons, enters }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "stretch", width: CONTENT_W * 0.86, alignSelf: "center" }}>
      {items.map((it, k) => {
        // Cada tarjeta entra cuando se nombra su elemento (o escalonada si no se nombra)
        const s = spring({ frame: frame - enters[k], fps, config: SPRINGS[theme.motion] });
        return (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "20px 34px",
              borderRadius: 30,
              background: theme.palette.card,
              color: theme.palette.ink,
              fontFamily: f.fontFamily,
              fontWeight: f.fontWeight,
              textTransform: f.textTransform,
              fontSize: 64 * f.scale,
              lineHeight: 1.1,
              opacity: s,
              transform: `translateX(${(1 - s) * 140}px)`,
              borderLeft: `14px solid ${theme.palette.accent}`,
            }}
          >
            {icons[k] ? <Img src={icons[k]!} style={{ width: 76, height: 76, flexShrink: 0 }} /> : null}
            <span>{it}</span>
          </div>
        );
      })}
    </div>
  );
};

// Alto de la lista (para la cámara que sigue)
export const LIST_PITCH = 138;

export const BigNumber: React.FC<{ theme: Theme; value: string; label: string; enter: number }> = ({ theme, value, label, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  const s = spring({ frame: frame - enter, fps, config: SPRINGS[theme.motion] });
  const num = Number(value.replace(",", "."));
  const count = Number.isFinite(num) ? interpolate(frame - enter, [0, 24], [0, num], clamp) : null;
  const shown = count === null ? value : Number.isInteger(num) ? Math.round(count).toString() : count.toFixed(1).replace(".", ",");
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `scale(${0.6 + 0.4 * s})`, opacity: s }}>
      <div style={{ fontFamily: f.fontFamily, fontWeight: f.fontWeight, fontSize: 300 * f.scale, lineHeight: 0.95, color: theme.palette.accent }}>{shown}</div>
      {label ? (
        <div style={{ fontFamily: `"${LABEL_FONT.family}"`, fontWeight: LABEL_FONT.weight, fontSize: 44, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.palette.ink, opacity: 0.75 }}>{label}</div>
      ) : null}
    </div>
  );
};

export const CtaPill: React.FC<{ theme: Theme; text: string; enter: number; pointer: string | null; ready: boolean }> = ({ theme, text, enter, pointer, ready }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  const s = spring({ frame: frame - enter, fps, config: SPRINGS[theme.motion] });
  const pulse = 1 + Math.sin(((frame - enter) / fps) * Math.PI * 2 * 0.9) * 0.03 * Math.min(1, s);
  const padX = 56;
  const maxW = CONTENT_W * 0.9 - padX * 2;
  // El texto siempre cabe: la fuente se reduce hasta el ancho disponible (máximo 150 px)
  const size = ready ? Math.min(150 * f.scale, fitText({ text, withinWidth: maxW, fontFamily: f.fontFamily, fontWeight: f.fontWeight, textTransform: f.textTransform }).fontSize) : 120;
  const bounce = Math.abs(Math.sin(((frame - enter) / fps) * Math.PI * 1.6)) * 26;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: s }}>
      {pointer ? <Img src={pointer} style={{ width: 130, height: 130, transform: `translateY(${-bounce}px) scale(${s})` }} /> : null}
      <div
        style={{
          padding: `14px ${padX}px 20px`,
          borderRadius: 999,
          background: theme.palette.accent,
          color: theme.palette.onAccent,
          fontFamily: f.fontFamily,
          fontWeight: f.fontWeight,
          textTransform: f.textTransform,
          fontSize: size,
          lineHeight: 1.05,
          whiteSpace: "nowrap",
          transform: `scale(${(0.5 + 0.5 * s) * pulse})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ——— Transición entre escenas ———

export const Wipe: React.FC<{ theme: Theme; at: number }> = ({ theme, at }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  if (theme.motion === "suave") return null;
  const p = interpolate(frame, [at - 6, at + 6], [0, 1], clamp);
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-1.6 * width, 1.6 * width]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -200, bottom: -200, left: x, width: width * 1.1, background: theme.palette.accent2, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: -200, bottom: -200, left: x - 90, width: 60, background: theme.palette.accent, transform: "skewX(-14deg)" }} />
    </AbsoluteFill>
  );
};

// Destello entre escenas: un fogonazo de luz del color del tema
export const Flash: React.FC<{ theme: Theme; at: number }> = ({ theme, at }) => {
  const frame = useCurrentFrame();
  if (theme.motion === "suave") return null;
  const p = interpolate(frame, [at - 3, at, at + 7], [0, 1, 0], clamp);
  if (p <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(circle at 50% 42%, ${rgba("#FFFFFF", 0.7 * p)} 0%, ${rgba(theme.palette.accent, 0.35 * p)} 30%, ${rgba(theme.palette.bg, 0)} 65%)`,
      }}
    />
  );
};

export type SceneRender = { scene: ThemedScene; start: number; end: number };
