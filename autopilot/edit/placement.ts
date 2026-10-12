import { captionBlock, captionLayout, fitVideo, focusAt, overlaps, type FocusKey, type Rect } from "../../src/autopilot/geometry";
import type { CaptionPage } from "../../src/autopilot/props";
import type { Brand, CaptionMode, Reframe } from "../../src/design/schema";
import type { FaceSample } from "../vision/faces";

// Coloca cada página de subtítulos donde no tape una cara (sin salir de las zonas seguras de la marca).

export type PlacementInput = {
  pages: CaptionPage[];
  brand: Brand;
  mode: CaptionMode;
  W: number;
  H: number;
  srcW: number;
  srcH: number;
  reframe: Reframe;
  focusTrack: FocusKey[];
  faces: FaceSample[]; // en el tiempo del vídeo final
};

// Rectángulos de las caras en píxeles del lienzo de salida en el instante t
export const faceRectsAt = (inp: Omit<PlacementInput, "pages" | "brand" | "mode">, s: FaceSample): Rect[] => {
  const focus = focusAt(inp.focusTrack, s.tMs, { x: inp.reframe.focusX, y: inp.reframe.focusY });
  const box = fitVideo(inp.srcW, inp.srcH, inp.W, inp.H, { focusX: focus.x, focusY: focus.y }, inp.reframe.mode !== "cover");
  return s.faces.map((f) => ({ x: box.x + f.x * box.w, y: box.y + f.y * box.h, w: f.w * box.w, h: f.h * box.h }));
};

export const pageRect = (brand: Brand, mode: CaptionMode, W: number, H: number, page: CaptionPage, positionY: number): Rect => {
  const lay = captionLayout(brand, W, H);
  const fontSize = brand.captions.fontSize * lay.unit * (mode === "palabra" ? 1.3 : 1);
  const lines = mode === "palabra" ? 1 : page.lines.length;
  const chars = mode === "palabra" ? Math.max(...page.lines.flat().map((t) => t.text.length)) : Math.max(...page.lines.map((l) => l.map((t) => t.text).join(" ").length));
  const b = captionBlock(brand, W, H, lines, fontSize, positionY);
  const padX = brand.captions.variant === "card" ? 30 * lay.unit : 0;
  const width = Math.min(b.right - b.left, chars * fontSize * 0.58 + padX * 2);
  return { x: (W - width) / 2, y: b.top, w: width, h: b.height };
};

export const placeCaptions = (inp: PlacementInput) => {
  const def = inp.brand.captions.positionY;
  const candidates = [def, 0.74, 0.26, 0.5].filter((v, i, a) => a.indexOf(v) === i);
  const margin = inp.H * 0.02;
  let moved = 0;
  let blocked = 0;
  const pages = inp.pages.map((p) => {
    const during = inp.faces.filter((s) => s.tMs >= p.startMs - 250 && s.tMs <= p.endMs + 250 && s.faces.length);
    if (!during.length) return p;
    const rects = during.flatMap((s) => faceRectsAt(inp, s));
    const free = candidates.find((y) => !rects.some((r) => overlaps(pageRect(inp.brand, inp.mode, inp.W, inp.H, p, y), r, margin)));
    if (free === undefined) {
      blocked++;
      return p;
    }
    if (free !== def) moved++;
    return free === def ? p : { ...p, positionY: free };
  });
  return { pages, moved, blocked };
};

// Para el control de calidad: páginas que, en su posición final, coinciden con una cara
export const pagesOverFaces = (inp: PlacementInput) =>
  inp.pages.filter((p) => {
    const y = p.positionY ?? inp.brand.captions.positionY;
    const r = pageRect(inp.brand, inp.mode, inp.W, inp.H, p, y);
    return inp.faces.some((s) => s.tMs >= p.startMs && s.tMs <= p.endMs && faceRectsAt(inp, s).some((f) => overlaps(r, f)));
  }).length;
