import { measureText } from "@remotion/layout-utils";
import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { INTENSITY } from "../design/intensity";
import type { Brand, CaptionMode, Intensity } from "../design/schema";
import { captionBlock, captionLayout } from "./geometry";
import { ImpactCaptions } from "./ImpactCaptions";
import { StackedCaptions } from "./StackedCaptions";
import type { CaptionPage, CaptionToken } from "./props";

// Subtítulos Hook House. Las páginas (qué palabras van juntas y en qué líneas) las calcula el backend
// (autopilot/captions/paginate.ts); aquí solo se dibujan con los tokens de la marca.
//
// Modos:
//   palabra         una sola palabra en pantalla, la que suena
//   palabra-activa  la página entera visible; la palabra que suena se resalta
//   grupos          las palabras aparecen al sonar (entrada de marca: opacidad + desenfoque + subida)
//   frases          la página entera aparece de una vez (único modo válido con tiempos por segmento)
//   dinamico        grupos + resaltado activo + énfasis (Inter, color de acento) + pop según intensidad
//   impacto         vídeos hablados para redes: 1–3 palabras con pop, clave grande y en color, emoji y cifras
//                   que ruedan, salida corta (ImpactCaptions, estilo-hablado.md)

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Style = {
  family: string;
  weight: number;
  emphasisFamily: string;
  emphasisWeight: string;
  emphasisStyle: string;
  fontSize: number;
};

const roleFont = (
  brand: Brand,
  role: "sans" | "serif" | "mono",
  weight?: number,
) => {
  const all = brand.fonts.filter((f) => f.role === role);
  const exact = all.find(
    (f) => weight === undefined || Number(f.weight) === weight,
  );
  const f = exact ?? all[0];
  if (!f) throw new Error(`La marca no define fuente con rol "${role}"`);
  return f;
};

const tokenEnd = (page: CaptionPage, flat: CaptionToken[], i: number) =>
  i + 1 < flat.length ? flat[i + 1].startMs : page.endMs;

const Token: React.FC<{
  token: CaptionToken;
  index: number;
  flat: CaptionToken[];
  page: CaptionPage;
  mode: CaptionMode;
  brand: Brand;
  intensity: Intensity;
  style: Style;
  last: boolean;
}> = ({ token, index, flat, page, mode, brand, intensity, style, last }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const mo = brand.motion;
  const card = brand.captions.variant === "card";
  const spokenFrame = (token.startMs / 1000) * fps;
  const local = frame - spokenFrame;
  const active = t >= token.startMs && t < tokenEnd(page, flat, index);

  const reveal = mode === "grupos" || mode === "dinamico";
  const p = reveal
    ? interpolate(local, [0, mo.wordInFrames], [0, 1], clamp)
    : 1;
  const highlight =
    (mode === "palabra-activa" || mode === "dinamico") && active;
  const emphasis = mode === "dinamico" && token.emphasis;
  const pop = mode === "dinamico" ? INTENSITY[intensity].captions.popScale : 1;
  const popS =
    pop > 1
      ? 1 +
        (pop - 1) *
          (1 -
            spring({
              frame: local,
              fps,
              config: { damping: 14, stiffness: 180 },
              durationInFrames: 8,
            }))
      : 1;

  const baseColor = card ? brand.colors.ink : brand.colors.white;
  const color =
    highlight && brand.captions.highlight === "box"
      ? brand.colors.white
      : highlight || emphasis
        ? brand.colors.accent
        : baseColor;

  return (
    <>
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          position: "relative",
          opacity: p,
          filter:
            reveal && p < 1 ? `blur(${(1 - p) * mo.wordBlurPx}px)` : undefined,
          translate: reveal ? `0px ${(1 - p) * mo.wordRisePx}px` : undefined,
          scale: popS !== 1 ? `${popS}` : undefined,
          color,
          ...(emphasis
            ? {
                fontFamily: style.emphasisFamily,
                fontWeight: style.emphasisWeight,
                fontStyle: style.emphasisStyle,
                letterSpacing: "-0.01em",
              }
            : {}),
        }}
      >
        {highlight && brand.captions.highlight === "box" ? (
          <span
            style={{
              position: "absolute",
              inset: "0.04em -0.1em 0em -0.1em",
              background: brand.colors.accent,
              borderRadius: style.fontSize * 0.16,
              zIndex: -1,
            }}
          />
        ) : null}
        {token.text.replace(/[,;:]+$/, "")}
      </span>
      {last ? null : " "}
    </>
  );
};

export const Captions: React.FC<{
  pages: CaptionPage[];
  mode: CaptionMode;
  brand: Brand;
  intensity: Intensity;
  fontsReady: boolean;
  icons?: Record<string, string>;
  // Intervalos con un apoyo gráfico a pantalla completa (fondo claro): los subtítulos apilados pasan a tinta
  light?: { startMs: number; endMs: number }[];
}> = (props) =>
  props.mode === "impacto" ? (
    props.brand.captions.impactStyle === "pop" ? (
      <ImpactCaptions pages={props.pages} brand={props.brand} icons={props.icons ?? {}} fontsReady={props.fontsReady} />
    ) : (
      <StackedCaptions pages={props.pages} brand={props.brand} fontsReady={props.fontsReady} light={props.light ?? []} />
    )
  ) : (
    <ClassicCaptions {...props} />
  );

const ClassicCaptions: React.FC<{
  pages: CaptionPage[];
  mode: CaptionMode;
  brand: Brand;
  intensity: Intensity;
  fontsReady: boolean;
}> = ({ pages, mode, brand, intensity, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const cap = brand.captions;
  const lay = captionLayout(brand, width, height);
  const page = pages.find((p) => t >= p.startMs && t < p.endMs);

  const base = roleFont(brand, cap.fontRole, cap.fontWeight);
  const emph = roleFont(brand, cap.emphasisRole);
  const card = cap.variant === "card";
  const padX = card ? 30 * lay.unit : 0;
  const padY = card ? 16 * lay.unit : 0;
  const maxWidth = width - lay.left - lay.right - padX * 2;

  // palabra: solo el token que suena (el último ya dicho si estamos entre palabras)
  const lines = useMemo(() => {
    if (!page) return [];
    if (mode !== "palabra") return page.lines;
    const flat = page.lines.flat();
    const current =
      [...flat].reverse().find((tk) => tk.startMs <= t) ?? flat[0];
    return [[current]];
  }, [page, mode, t]);

  // Tamaño: el del token, reducido solo si una línea no cabe (nunca se parte una palabra)
  const fontSize = useMemo(() => {
    const target = cap.fontSize * lay.unit * (mode === "palabra" ? 1.3 : 1);
    if (!fontsReady || lines.length === 0) return target;
    let size = target;
    for (const line of lines) {
      const text = line.map((x) => x.text).join(" ");
      const w = measureText({
        text,
        fontFamily: base.family,
        fontWeight: base.weight,
        fontSize: target,
        letterSpacing: cap.tracking,
        validateFontIsLoaded: false,
      }).width;
      if (w > maxWidth) size = Math.min(size, (target * maxWidth) / w);
    }
    return Math.max(cap.minFontSize * lay.unit, size);
  }, [lines, fontsReady, cap, lay.unit, mode, base, maxWidth]);

  if (!page || lines.length === 0) return null;

  const flat = page.lines.flat();
  const pageFrame = (page.startMs / 1000) * fps;
  const appear =
    mode === "frases" || mode === "palabra-activa"
      ? interpolate(frame - pageFrame, [0, 3], [0, 1], clamp)
      : 1;
  // El bloque se coloca con la altura de la página completa (posición estable); en los modos que
  // revelan palabras, cada línea aparece cuando empieza su primera palabra y la tarjeta crece hacia abajo.
  const reveal = mode === "grupos" || mode === "dinamico";
  const visibleLines = reveal
    ? lines.filter((l, i) => i === 0 || l[0].startMs <= t)
    : lines;
  const { top } = captionBlock(
    brand,
    width,
    height,
    lines.length,
    fontSize,
    page.positionY ?? cap.positionY,
  );
  const style: Style = {
    family: base.family,
    weight: Number(base.weight),
    emphasisFamily: emph.family,
    emphasisWeight: emph.weight,
    emphasisStyle: emph.style,
    fontSize,
  };

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: lay.left,
        right: lay.right,
        display: "flex",
        justifyContent: "center",
        opacity: appear,
      }}
    >
      <div
        style={{
          fontFamily: base.family,
          fontWeight: Number(base.weight),
          fontSize,
          lineHeight: cap.lineHeight,
          letterSpacing: cap.tracking,
          textAlign: "center",
          padding: `${padY}px ${padX}px`,
          background: card ? brand.colors.bg : undefined,
          borderRadius: card ? brand.layout.radius * lay.unit * 0.7 : undefined,
          boxShadow: card ? "0 10px 30px rgba(0,0,0,0.18)" : undefined,
          textShadow: card
            ? undefined
            : "0 0 3px rgba(0,0,0,0.85), 0 4px 18px rgba(0,0,0,0.55)",
          isolation: "isolate",
        }}
      >
        {visibleLines.map((line, li) => (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {line.map((tk, k) => (
              <Token
                key={`${tk.startMs}-${k}`}
                token={tk}
                index={flat.indexOf(tk)}
                flat={flat}
                page={page}
                mode={mode === "palabra" ? "frases" : mode}
                brand={brand}
                intensity={intensity}
                style={style}
                last={k === line.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
