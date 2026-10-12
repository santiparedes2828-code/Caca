import { measureText } from "@remotion/layout-utils";
import React, { useMemo } from "react";
import { Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../design/schema";
import { captionLayout } from "./geometry";
import type { CaptionPage, CaptionToken } from "./props";

// Subtítulos «impacto» para vídeos hablados en redes (estilo-hablado.md): bloques de 1–3 palabras que entran al
// sonar (pop: escala con muelle y subida), la palabra que suena crece un poco, la clave va más grande, en negrita
// pesada y en el color de acento, con su emoji si el plan le puso uno. En las páginas destacadas la clave va enorme
// en su propia línea y, si es una cifra, rueda hasta su valor. El bloque sale en 4 frames si no le sigue otro
// enseguida. Texto blanco con contorno oscuro (se lee sobre cualquier fondo) y siempre dentro de las zonas seguras.
// Las palabras crecen hacia fuera de la línea (la primera hacia la izquierda, la última hacia la derecha) para no
// pisar a la vecina en el rebote del muelle.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FAMILY = '"Inter"';

// featureUnit: la unidad que acompaña a la cifra destacada en su línea («150 millones»)
const SIZE = { word: 1, key: 1.25, featureKey: 1.75, featureWord: 0.62, featureUnit: 0.95 } as const;
const LIFT = 1.06; // la palabra que suena crece un poco

type Sized = { token: CaptionToken; size: number; weight: number; key: boolean; roll: boolean };

const clean = (t: string) => t.replace(/[,;:]+$/, "");

// Dígitos que ruedan dentro de una ventana con los bordes difuminados hasta su valor (8–14 frames, primero los de
// la izquierda). Solo en las cifras de las páginas destacadas: una cifra pequeña que rueda no se lee mientras suena.
const Rolling: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  let d = 0;
  return (
    <>
      {[...text].map((ch, i) => {
        if (ch < "0" || ch > "9") return <span key={i}>{ch}</span>;
        const idx = d++;
        const target = Number(ch);
        const first = Math.floor(random(`rueda-${text}-${i}`) * 10);
        const steps = 10 + ((target - first + 10) % 10);
        const p = interpolate(frame, [at, at + 8 + idx * 2], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
        const fade = "linear-gradient(to bottom, transparent 0%, black 24%, black 76%, transparent 100%)";
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              height: "1.1em",
              verticalAlign: "top",
              ...(p < 1 ? { maskImage: fade, WebkitMaskImage: fade } : {}),
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", transform: `translateY(${-p * steps * 1.1}em)` }}>
              {Array.from({ length: steps + 1 }, (_, k) => (
                <span key={k} style={{ height: "1.1em", lineHeight: 1.1 }}>
                  {(first + k) % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </>
  );
};

const Word: React.FC<{ w: Sized; brand: Brand; icon: string | null; origin: string }> = ({ w, brand, icon, origin }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const at = Math.round((w.token.startMs / 1000) * fps) - 1;
  const local = frame - at;
  const s = spring({ frame: local, fps, config: w.key ? { damping: 10, stiffness: 200, mass: 0.6 } : { damping: 12, stiffness: 230, mass: 0.6 } });
  const shown = interpolate(local, [0, 2], [0, 1], clamp);
  const active = t >= w.token.startMs && t < w.token.endMs;
  const lift = active ? LIFT : 1;
  const si = spring({ frame: local - 1, fps, config: { damping: 8, stiffness: 160, mass: 0.6 } });
  const wobble = Math.sin((local / fps) * Math.PI * 2 * 0.8) * 5 * Math.min(1, si);
  const text = clean(w.token.text);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "pre",
        fontSize: w.size,
        fontWeight: w.weight,
        color: w.key ? brand.colors.accent : brand.colors.white,
        opacity: shown,
        transform: `translateY(${(1 - s) * w.size * 0.28}px) scale(${(0.55 + 0.45 * s) * lift})`,
        transformOrigin: origin,
        // Contorno oscuro por fuera de la letra (paint-order) y una sombra suave: se lee sobre cualquier plano
        WebkitTextStroke: `${Math.max(4, w.size * 0.13)}px rgba(0,0,0,0.88)`,
        paintOrder: "stroke fill",
        textShadow: `0 ${w.size * 0.05}px ${w.size * 0.14}px rgba(0,0,0,0.45)`,
      }}
    >
      {w.roll ? <Rolling text={text} at={at} /> : text}
      {icon ? (
        <Img
          src={icon}
          style={{
            width: w.size * 0.95,
            height: w.size * 0.95,
            marginLeft: w.size * 0.14,
            transform: `scale(${si}) rotate(${(1 - si) * -25 + wobble}deg)`,
            filter: `drop-shadow(0 ${w.size * 0.04}px ${w.size * 0.08}px rgba(0,0,0,0.5))`,
          }}
        />
      ) : null}
    </span>
  );
};

export const ImpactCaptions: React.FC<{ pages: CaptionPage[]; brand: Brand; icons: Record<string, string>; fontsReady: boolean }> = ({ pages, brand, icons, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const cap = brand.captions;
  const lay = captionLayout(brand, width, height);
  const idx = pages.findIndex((p) => t >= p.startMs && t < p.endMs);
  const page = idx >= 0 ? pages[idx] : null;
  const base = cap.fontSize * lay.unit;
  const maxW = width - lay.left - lay.right;

  // Tamaño de cada palabra y reducción del bloque si una línea no cabe (nunca se parte una palabra)
  const lines = useMemo(() => {
    if (!page) return [] as Sized[][];
    const sized = page.lines.map((l) => {
      const keyLine = l.some((t) => t.emphasis);
      return l.map((token): Sized => {
        const key = token.emphasis;
        const k = page.feature ? (key ? SIZE.featureKey : keyLine ? SIZE.featureUnit : SIZE.featureWord) : key ? SIZE.key : SIZE.word;
        const weight = key || (page.feature && keyLine) ? 800 : 700;
        return { token, size: base * k, weight, key, roll: !!page.feature && key && /\d/.test(token.text) };
      });
    });
    if (!fontsReady) return sized;
    const widest = Math.max(
      ...sized.map((l) =>
        l.reduce(
          (n, w, i) =>
            n +
            measureText({ text: clean(w.token.text), fontFamily: FAMILY, fontWeight: w.weight, fontSize: w.size, validateFontIsLoaded: false }).width +
            (w.token.icon ? w.size * 1.1 : 0) +
            (i ? base * 0.26 : 0) +
            w.size * 0.26, // contorno
          0,
        ),
      ),
    );
    const k = widest * LIFT > maxW ? maxW / (widest * LIFT) : 1;
    return k < 1 ? sized.map((l) => l.map((w) => ({ ...w, size: w.size * k }))) : sized;
  }, [page, base, fontsReady, maxW]);

  if (!page) return null;
  const next = pages[idx + 1];
  const endF = (page.endMs / 1000) * fps;
  // Si la siguiente página entra enseguida, cambio directo; si no, el bloque sale en 4 frames
  const swap = !!next && next.startMs - page.endMs < 80;
  const exit = swap ? 0 : interpolate(frame, [endF - 4, endF], [0, 1], clamp);
  const lineH = (l: Sized[]) => Math.max(...l.map((w) => w.size)) * cap.lineHeight;
  const blockH = lines.reduce((n, l) => n + lineH(l), 0);
  const centerY = (page.positionY ?? cap.positionY) * height;
  const top = Math.min(Math.max(centerY - blockH / 2, lay.top), height - lay.bottom - blockH);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: lay.left,
        right: lay.right,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FAMILY,
        lineHeight: cap.lineHeight,
        letterSpacing: "-0.01em",
        textAlign: "center",
        opacity: 1 - exit,
        transform: `translateY(${exit * 12}px) scale(${1 - 0.06 * exit})`,
      }}
    >
      {lines.map((l, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", alignItems: "baseline", columnGap: base * 0.26, height: lineH(l) }}>
          {l.map((w, k) => (
            <Word
              key={`${w.token.startMs}-${k}`}
              w={w}
              brand={brand}
              icon={w.token.icon ? (icons[w.token.icon] ?? null) : null}
              origin={l.length < 2 ? "50% 80%" : k === 0 ? "100% 80%" : k === l.length - 1 ? "0% 80%" : "50% 80%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
