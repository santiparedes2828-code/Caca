import { measureText } from "@remotion/layout-utils";
import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Brand } from "../design/schema";
import { captionLayout } from "./geometry";
import { Rolling } from "./ImpactCaptions";
import type { CaptionPage, CaptionToken } from "./props";

// Subtítulos «apilados» (pedido del usuario el 13-10-2026, con una foto de referencia: «it works / THE / ONLINE /
// ECOSYSTEM»). El contexto va pequeño y en minúscula en su propia línea; cada palabra clave va ENORME, en mayúscula,
// en su propia línea, apiladas casi tocándose y con un ligero desplazamiento alterno. Blanco con un degradado suave
// hacia gris y sombra. Las páginas sin clave van en una sola línea mediana en mayúscula. Sobre un apoyo gráfico de
// fondo claro el texto pasa a tinta. Solo Inter (regla de la casa).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FAMILY = '"Inter"';
const K = { small: 0.52, big: 1.85, feature: 2.2 } as const;
// Palabras que no se ponen grandes en una página sin clave
const FUNCTION = new Set("a an the to of in on at and or but so for with we i you it is are was be like uh um that this then el la los las un una de del en y o que se lo".split(" "));

type Row = { kind: "small" | "big"; tokens: CaptionToken[]; size: number; offset: number };

const clean = (t: string) => t.replace(/[,;:.!?]+$/, "");

const rowsOf = (page: CaptionPage, base: number): Row[] => {
  const flat0 = page.lines.flat();
  // Página sin clave: la palabra con más peso (la más larga que no sea de enlace; ante empate, la última) va grande y
  // el resto pequeño, como «it works / THE ONLINE ECOSYSTEM». Solo cambia el tamaño, no el texto.
  let flat = flat0;
  if (!flat0.some((t) => t.emphasis)) {
    let best = -1;
    flat0.forEach((t, i) => {
      const w = clean(t.text).toLowerCase();
      if (FUNCTION.has(w)) return;
      if (best < 0 || w.length >= clean(flat0[best].text).length) best = i;
    });
    if (best < 0) best = flat0.length - 1;
    flat = flat0.map((t, i) => ({ ...t, emphasis: i === best }));
  }
  const rows: Row[] = [];
  for (const t of flat) {
    if (t.emphasis) rows.push({ kind: "big", tokens: [t], size: base * (page.feature ? K.feature : K.big), offset: 0 });
    else {
      const last = rows[rows.length - 1];
      if (last?.kind === "small") last.tokens.push(t);
      else rows.push({ kind: "small", tokens: [t], size: base * K.small, offset: 0 });
    }
  }
  // Desplazamiento alterno de las líneas grandes (como «THE» a la izquierda y «ONLINE» a la derecha)
  const bigs = rows.filter((r) => r.kind === "big");
  if (bigs.length > 1) bigs.forEach((r, i) => (r.offset = i % 2 === 0 ? -0.06 : 0.07));
  return rows;
};

const Token: React.FC<{ t: CaptionToken; row: Row; light: boolean; feature: boolean }> = ({ t, row, light, feature }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = Math.round((t.startMs / 1000) * fps) - 1;
  const local = frame - at;
  const big = row.kind === "big";
  const s = spring({ frame: local, fps, config: big ? { damping: 13, stiffness: 170, mass: 0.7 } : { damping: 16, stiffness: 240, mass: 0.5 } });
  const shown = interpolate(local, [0, 3], [0, 1], clamp);
  const blur = interpolate(local, [0, big ? 6 : 4], [big ? 14 : 8, 0], clamp);
  const upper = row.kind === "big";
  const text = upper ? clean(t.text).toUpperCase() : clean(t.text).toLowerCase();
  const fill = light
    ? { color: "#141414" }
    : {
        backgroundImage: "linear-gradient(180deg, #FFFFFF 35%, #D4D4D4 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      };
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: shown,
        filter: `blur(${blur}px)`,
        transform: big ? `translateY(${(1 - s) * row.size * 0.22}px) scale(${1.18 - 0.18 * s})` : `translateY(${(1 - s) * row.size * 0.4}px)`,
        transformOrigin: "50% 70%",
      }}
    >
      <span
        style={{
          ...fill,
          filter: light ? "none" : `drop-shadow(0 ${row.size * 0.04}px ${row.size * 0.1}px rgba(0,0,0,0.55))`,
        }}
      >
        {feature && big && /\d/.test(text) ? <Rolling text={text} at={at} /> : text}
      </span>
    </span>
  );
};

export const StackedCaptions: React.FC<{ pages: CaptionPage[]; brand: Brand; fontsReady: boolean; light: { startMs: number; endMs: number }[] }> = ({ pages, brand, fontsReady, light }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const cap = brand.captions;
  const lay = captionLayout(brand, width, height);
  const idx = pages.findIndex((p) => t >= p.startMs && t < p.endMs);
  const page = idx >= 0 ? pages[idx] : null;
  const base = cap.fontSize * lay.unit;
  const maxW = width - lay.left - lay.right;

  // Cada línea se reduce sola si no cabe (nunca se parte una palabra)
  const rows = useMemo(() => {
    if (!page) return [] as Row[];
    const rs = rowsOf(page, base);
    if (!fontsReady) return rs;
    return rs.map((r) => {
      const text = r.tokens.map((x) => (r.kind === "small" ? clean(x.text).toLowerCase() : clean(x.text).toUpperCase())).join(" ");
      const w = measureText({ text, fontFamily: FAMILY, fontWeight: r.kind === "small" ? 700 : 800, fontSize: r.size, letterSpacing: r.kind === "small" ? "0em" : "-0.04em", validateFontIsLoaded: false }).width;
      const room = maxW * (1 - Math.abs(r.offset) * 2) * 0.96;
      return w > room ? { ...r, size: (r.size * room) / w } : r;
    });
  }, [page, base, fontsReady, maxW]);

  if (!page) return null;
  const onLight = light.some((g) => t >= g.startMs && t < g.endMs);
  const next = pages[idx + 1];
  const endF = (page.endMs / 1000) * fps;
  const swap = !!next && next.startMs - page.endMs < 80;
  const exit = swap ? 0 : interpolate(frame, [endF - 4, endF], [0, 1], clamp);
  const lineH = (r: Row) => r.size * (r.kind === "small" ? 1.15 : 0.86);
  const blockH = rows.reduce((n, r) => n + lineH(r), 0);
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
        textAlign: "center",
        opacity: 1 - exit,
        transform: `translateY(${exit * 14}px)`,
      }}
    >
      {rows.map((r, ri) => (
        <div
          key={ri}
          style={{
            display: "flex",
            justifyContent: "center",
            columnGap: r.size * (r.kind === "small" ? 0.25 : 0.2),
            height: lineH(r),
            lineHeight: `${lineH(r)}px`,
            fontSize: r.size,
            fontWeight: r.kind === "small" ? 700 : 800,
            letterSpacing: r.kind === "small" ? "0em" : "-0.04em",
            transform: `translateX(${r.offset * maxW}px)`,
          }}
        >
          {r.tokens.map((tok, k) => (
            <Token key={`${tok.startMs}-${k}`} t={tok} row={r} light={onLight} feature={!!page.feature} />
          ))}
        </div>
      ))}
    </div>
  );
};
