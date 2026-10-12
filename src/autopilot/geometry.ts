import type { Brand, Reframe } from "../design/schema";
import type { CaptionPage } from "./props";

// Geometría pura compartida por la composición (navegador) y el backend (planificación, control de calidad).
// Si cambia aquí, cambia igual en lo que se dibuja y en lo que se comprueba.

export type Rect = { x: number; y: number; w: number; h: number };
export type FocusKey = { tMs: number; x: number; y: number };

// Posición y escala del vídeo fuente dentro del lienzo según el modo de reencuadre
export const fitVideo = (
  vw: number,
  vh: number,
  W: number,
  H: number,
  r: Pick<Reframe, "focusX" | "focusY">,
  contain: boolean,
): Rect => {
  const s = contain ? Math.min(W / vw, H / vh) : Math.max(W / vw, H / vh);
  const w = vw * s;
  const h = vh * s;
  const x = contain
    ? (W - w) / 2
    : Math.min(0, Math.max(W - w, W / 2 - r.focusX * w));
  const y = contain
    ? (H - h) / 2
    : Math.min(0, Math.max(H - h, H / 2 - r.focusY * h));
  return { x, y, w, h };
};

// Tramos de zoom: empiezan con una página de subtítulos y duran al menos minSecondsBetween
export const zoomSegments = (
  pages: CaptionPage[],
  minSeconds: number,
  totalMs: number,
) => {
  const starts: number[] = [0];
  for (const p of pages) {
    if (p.startMs - starts[starts.length - 1] >= minSeconds * 1000)
      starts.push(p.startMs);
  }
  return starts.map((s, i) => ({
    startMs: s,
    endMs: i + 1 < starts.length ? starts[i + 1] : totalMs,
  }));
};

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Foco del encuadre en el instante t (interpolación suave entre fotogramas clave de la trayectoria)
export const focusAt = (
  track: FocusKey[] | undefined,
  tMs: number,
  fallback: { x: number; y: number },
) => {
  if (!track || track.length === 0) return fallback;
  if (tMs <= track[0].tMs) return { x: track[0].x, y: track[0].y };
  const last = track[track.length - 1];
  if (tMs >= last.tMs) return { x: last.x, y: last.y };
  const i = track.findIndex((k) => k.tMs > tMs);
  const a = track[i - 1];
  const b = track[i];
  const p = easeInOut((tMs - a.tMs) / (b.tMs - a.tMs));
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
};

export const captionLayout = (brand: Brand, width: number, height: number) => {
  const unit = Math.min(width, height) / 1080;
  const vertical = height > width;
  const sz = brand.layout.safeZone;
  const m = brand.layout.margin * unit;
  return {
    unit,
    left: vertical ? Math.max(m, sz.left * unit) : m,
    right: vertical ? Math.max(m, sz.right * unit) : m,
    top: vertical ? sz.top * unit : m,
    bottom: vertical ? sz.bottom * unit : m,
  };
};

// Caja que ocupa un bloque de subtítulos (la misma cuenta que hace <Captions>)
export const captionBlock = (
  brand: Brand,
  W: number,
  H: number,
  lineCount: number,
  fontSize: number,
  positionY: number,
) => {
  const cap = brand.captions;
  const lay = captionLayout(brand, W, H);
  const padY = cap.variant === "card" ? 16 * lay.unit : 0;
  const height = lineCount * fontSize * cap.lineHeight + padY * 2;
  const top = Math.min(
    Math.max(positionY * H - height / 2, lay.top),
    H - lay.bottom - height,
  );
  return { top, height, left: lay.left, right: W - lay.right };
};

export const overlaps = (a: Rect, b: Rect, margin = 0) =>
  a.x < b.x + b.w + margin &&
  b.x < a.x + a.w + margin &&
  a.y < b.y + b.h + margin &&
  b.y < a.y + a.h + margin;
