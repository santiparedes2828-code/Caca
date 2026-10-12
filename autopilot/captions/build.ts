import { INTENSITY, MODE_MAX_WORDS, WORD_TIMING_MODES } from "../../src/design/intensity";
import type { Brand, CaptionMode, Intensity } from "../../src/design/schema";
import { paginateSegments, paginateWords, type TimedWord } from "../../src/autopilot/paginate";
import type { CaptionPage } from "../../src/autopilot/props";
import { toSrt, type LoadedCaptions } from "./load";

export type BuiltCaptions = {
  requestedMode: CaptionMode;
  mode: CaptionMode;
  precision: "word" | "segment" | "estimated";
  pages: CaptionPage[];
  srt: string;
  warnings: string[];
  stats: { items: number; pages: number; estimatedSplits: number };
};

// Reparte las palabras de un segmento según su número de caracteres. Solo si el usuario lo permite
// (allowEstimatedWordTiming) y siempre marcado como "estimated" en el informe.
export const estimateWordTiming = (segments: TimedWord[]): TimedWord[] =>
  segments.flatMap((s) => {
    const words = s.text.split(/\s+/).filter(Boolean);
    const total = words.reduce((n, w) => n + w.length + 1, 0);
    let t = s.startMs;
    return words.map((w) => {
      const d = ((s.endMs - s.startMs) * (w.length + 1)) / total;
      const out = { text: w, startMs: Math.round(t), endMs: Math.round(t + d) };
      t += d;
      return out;
    });
  });

// Pasa los tiempos al eje del vídeo de salida (recorte inicial) y descarta lo que queda fuera
export const shiftItems = (items: TimedWord[], trimStartMs: number, durationMs: number) =>
  items
    .map((x) => ({ text: x.text, startMs: x.startMs - trimStartMs, endMs: Math.min(x.endMs - trimStartMs, durationMs) }))
    .filter((x) => x.endMs > 0 && x.startMs < durationMs)
    .map((x) => ({ ...x, startMs: Math.max(0, x.startMs) }));

export const buildCaptions = (opts: {
  loaded: LoadedCaptions;
  mode: CaptionMode;
  intensity: Intensity;
  brand: Brand;
  allowEstimatedWordTiming: boolean;
  trimStartMs: number;
  durationMs: number;
  keywords?: string[];
}): BuiltCaptions => {
  const { loaded, brand, intensity } = opts;
  const warnings: string[] = [...loaded.warnings];
  const items = shiftItems(loaded.items, opts.trimStartMs, opts.durationMs);
  let precision: BuiltCaptions["precision"] = loaded.precision;
  let words = items;
  let mode = opts.mode;

  if (loaded.precision === "segment" && WORD_TIMING_MODES.includes(mode)) {
    if (opts.allowEstimatedWordTiming) {
      words = estimateWordTiming(items);
      precision = "estimated";
      warnings.push(`El modo "${mode}" usa tiempos por palabra ESTIMADOS a partir de los bloques del ${loaded.source.toUpperCase()}; la sincronía palabra a palabra no es exacta`);
    } else {
      warnings.push(`El modo "${mode}" necesita tiempos por palabra y el ${loaded.source.toUpperCase()} solo los tiene por bloque: se usa el modo "frases" (no se inventa precisión)`);
      mode = "frases";
    }
  }

  const cap = brand.captions;
  const preset = INTENSITY[intensity].captions;
  let pages: CaptionPage[];
  let estimatedSplits = 0;
  if (precision === "segment") {
    const r = paginateSegments(items, cap);
    pages = r.pages;
    estimatedSplits = r.estimatedSplits;
  } else {
    pages = paginateWords(words, {
      maxWordsPerPage: Math.min(MODE_MAX_WORDS[mode], mode === "frases" ? MODE_MAX_WORDS.frases : preset.maxWordsPerPage),
      maxCharsPerLine: cap.maxCharsPerLine,
      maxLines: cap.maxLines,
      pauseBreakMs: preset.pauseBreakMs,
      emphasis: mode === "dinamico",
      keywords: opts.keywords,
    });
  }
  // Ninguna página puede pasar del final del vídeo (la última se mantiene holdMs tras su palabra)
  const fit = (ps: CaptionPage[]) =>
    ps.filter((p) => p.startMs < opts.durationMs).map((p) => ({ ...p, endMs: Math.min(p.endMs, opts.durationMs) }));
  pages = fit(pages);
  if (estimatedSplits) {
    warnings.push(`${estimatedSplits} bloques del subtítulo no cabían en ${cap.maxLines} líneas y se han dividido con tiempos estimados`);
  }

  // El SRT exportado se agrupa siempre por frases legibles, sea cual sea el modo de pantalla
  const srtPages =
    precision === "segment"
      ? pages
      : fit(
          paginateWords(words, {
            maxWordsPerPage: MODE_MAX_WORDS.frases,
            maxCharsPerLine: Math.max(cap.maxCharsPerLine, 32),
            maxLines: 2,
            pauseBreakMs: 700,
          }),
        );
  const srt = toSrt(srtPages.map((p) => ({ startMs: p.startMs, endMs: p.endMs, lines: p.lines.map((l) => l.map((t) => t.text).join(" ")) })));

  return {
    requestedMode: opts.mode,
    mode,
    precision,
    pages,
    srt,
    warnings,
    stats: { items: items.length, pages: pages.length, estimatedSplits },
  };
};
