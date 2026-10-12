import { loadFont } from "@remotion/fonts";
import { fitText, measureText } from "@remotion/layout-utils";
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LABEL_FONT, THEME_FONTS, type Theme, type ThemeFont, type ThemedScene } from "./theme";

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

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ——— Fuentes ———

const fontCache = new Map<string, Promise<void>>();
const load = (family: string, file: string, weight: number) => {
  const key = `${family}|${weight}`;
  let p = fontCache.get(key);
  if (!p) {
    // loadFont bloquea el render hasta que la fuente está cargada y lo cancela si el archivo falta
    p = loadFont({ family, url: staticFile(`fonts/${file}`), weight: String(weight) });
    fontCache.set(key, p);
  }
  return p;
};

export const useThemeFonts = (font: ThemeFont) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const f = THEME_FONTS[font];
    Promise.all([load(f.family, f.file, f.weight), load(LABEL_FONT.family, LABEL_FONT.file, LABEL_FONT.weight)]).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [font]);
  return ready;
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
      {theme.background === "patron" ? <Pattern icons={icons} names={bgIcons} /> : <Floaters icons={icons} names={bgIcons} soft={theme.background === "degradado"} />}
    </AbsoluteFill>
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

export const Sticker: React.FC<{ theme: Theme; src: string; size: number; enter: number }> = ({ theme, src, size, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter, fps, config: SPRINGS[theme.motion] });
  const t = frame / fps;
  const bob = Math.sin(t * Math.PI * 1.1) * 14;
  const rot = (1 - s) * -20 + Math.sin(t * Math.PI * 0.9) * 4;
  const ring = (frame * 0.6) % 360;
  return (
    <div style={{ position: "relative", width: size, height: size, alignSelf: "center", flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: theme.palette.card, opacity: 0.85, transform: `scale(${s})` }} />
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: -size * 0.06, width: size * 1.12, height: size * 1.12, transform: `rotate(${ring}deg) scale(${s})` }}>
        <circle cx="50" cy="50" r="48" fill="none" stroke={theme.palette.accent} strokeWidth="1.6" strokeDasharray="4 7" strokeLinecap="round" opacity="0.7" />
      </svg>
      <Img
        src={src}
        style={{
          position: "absolute",
          left: size * 0.12,
          top: size * 0.12,
          width: size * 0.76,
          height: size * 0.76,
          transform: `translateY(${bob}px) rotate(${rot}deg) scale(${s})`,
        }}
      />
    </div>
  );
};

// ——— Titular con subtítulos a juego ———

const clean = (t: string) => t.replace(/[…:,;]+$/g, "");

export const headlineSize = (theme: Theme, words: Cap[], ready: boolean) => {
  const n = words.length;
  const f = displayFont(theme);
  let size = (n <= 3 ? 150 : n <= 5 ? 128 : n <= 8 ? 110 : n <= 11 ? 96 : 86) * f.scale;
  if (ready) {
    // La palabra más larga tiene que caber en el ancho útil
    const longest = words.map((w) => clean(w.text)).sort((a, b) => b.length - a.length)[0] ?? "";
    const w = measureText({ text: longest, fontFamily: f.fontFamily, fontWeight: f.fontWeight, fontSize: size, textTransform: f.textTransform }).width;
    if (w > CONTENT_W * 0.94) size *= (CONTENT_W * 0.94) / w;
  }
  return Math.round(size);
};

export const ThemedHeadline: React.FC<{ theme: Theme; caps: Cap[]; from: number; to: number; accent: [number, number] | null; size: number }> = ({
  theme,
  caps,
  from,
  to,
  accent,
  size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  const p = theme.palette;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        gap: `${size * 0.1}px ${size * 0.24}px`,
        fontFamily: f.fontFamily,
        fontWeight: f.fontWeight,
        textTransform: f.textTransform,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: f.textTransform === "uppercase" ? "0.01em" : "-0.02em",
        color: p.ink,
        textAlign: "center",
      }}
    >
      {caps.slice(from, to + 1).map((w, k) => {
        const i = from + k;
        const at = Math.round((w.startMs / 1000) * fps);
        const end = Math.round((w.endMs / 1000) * fps);
        const s = spring({ frame: frame - at, fps, config: SPRINGS[theme.motion] });
        const shown = interpolate(frame - at, [0, 3], [0, 1], clamp);
        const isAccent = !!accent && i >= accent[0] && i <= accent[1];
        const active = frame >= at && frame < end;
        const box = theme.captionStyle === "caja" && isAccent;
        const grow = spring({ frame: frame - at - 2, fps, config: { damping: 200 } });
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "pre",
              opacity: shown,
              transform: `translateY(${(1 - s) * size * 0.35}px) scale(${(0.75 + 0.25 * s) * (active ? 1.05 : 1)})`,
              // En la caja el texto pasa a su color cuando la caja ya lo cubre (antes se perdería sobre el fondo)
              color: box ? (grow > 0.55 ? p.onAccent : p.ink) : isAccent && theme.captionStyle === "color" ? p.accent : p.ink,
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
                  bottom: -size * 0.06,
                  height: size * 0.13,
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
      })}
    </div>
  );
};

// ——— Gráficos por tipo de escena ———

export const ListCards: React.FC<{ theme: Theme; items: string[]; icons: (string | null)[]; enter: number }> = ({ theme, items, icons, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = displayFont(theme);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "stretch", width: CONTENT_W * 0.86, alignSelf: "center" }}>
      {items.map((it, k) => {
        const s = spring({ frame: frame - enter - k * 7, fps, config: SPRINGS[theme.motion] });
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

export type SceneRender = { scene: ThemedScene; start: number; end: number };
