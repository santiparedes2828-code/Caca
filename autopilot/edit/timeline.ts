import type { FocusKey } from "../../src/autopilot/geometry";
import type { TimedWord } from "../../src/autopilot/paginate";

// Línea de tiempo de edición: qué tramos de la copia de trabajo se conservan y en qué orden.
// Los cortes son no destructivos: el archivo no se toca, la composición encadena los tramos.

export type Segment = { srcStartMs: number; srcEndMs: number };
export type Interval = { startMs: number; endMs: number };

export const totalMs = (segs: Segment[]) => segs.reduce((n, s) => n + (s.srcEndMs - s.srcStartMs), 0);

// Corta solo donde hay silencio medido Y no hay ninguna palabra ni evento de audio (risas, etc.).
// Cada pausa se deja en keepPauseMs (mitad a cada lado) para que el ritmo siga siendo natural.
export const planSilenceCuts = (opts: {
  durationMs: number;
  silences: Interval[];
  speech: Interval[]; // palabras y eventos de audio, si hay transcripción
  minSilenceMs: number;
  keepPauseMs: number;
  guardMs?: number;
}): { segments: Segment[]; cuts: Interval[] } => {
  const guard = opts.guardMs ?? 60;
  const speech = [...opts.speech].sort((a, b) => a.startMs - b.startMs);
  const cuts: Interval[] = [];
  for (const s of opts.silences) {
    // Partir el silencio en los huecos que no tocan ninguna palabra
    let pieces: Interval[] = [{ startMs: s.startMs, endMs: s.endMs }];
    for (const w of speech) {
      const ws = w.startMs - guard;
      const we = w.endMs + guard;
      pieces = pieces.flatMap((p) =>
        we <= p.startMs || ws >= p.endMs
          ? [p]
          : [
              { startMs: p.startMs, endMs: Math.min(p.endMs, ws) },
              { startMs: Math.max(p.startMs, we), endMs: p.endMs },
            ].filter((x) => x.endMs > x.startMs),
      );
    }
    for (const p of pieces) {
      if (p.endMs - p.startMs < opts.minSilenceMs) continue;
      const atStart = p.startMs <= 1;
      const atEnd = p.endMs >= opts.durationMs - 1;
      // Al principio y al final no hace falta dejar pausa entera
      const a = atStart ? 0 : p.startMs + opts.keepPauseMs / 2;
      const b = atEnd ? opts.durationMs : p.endMs - opts.keepPauseMs / 2;
      if (b - a >= 100) cuts.push({ startMs: Math.round(a), endMs: Math.round(b) });
    }
  }
  cuts.sort((x, y) => x.startMs - y.startMs);
  const segments: Segment[] = [];
  let t = 0;
  for (const c of cuts) {
    if (c.startMs > t) segments.push({ srcStartMs: t, srcEndMs: c.startMs });
    t = Math.max(t, c.endMs);
  }
  if (t < opts.durationMs) segments.push({ srcStartMs: t, srcEndMs: opts.durationMs });
  if (!segments.length) return { segments: [{ srcStartMs: 0, srcEndMs: opts.durationMs }], cuts: [] };
  return { segments, cuts };
};

// Tiempo fuente → tiempo del vídeo final (null si cae en una parte eliminada)
export const remapTime = (segs: Segment[], tMs: number): number | null => {
  let out = 0;
  for (const s of segs) {
    if (tMs < s.srcStartMs) return null;
    if (tMs <= s.srcEndMs) return out + (tMs - s.srcStartMs);
    out += s.srcEndMs - s.srcStartMs;
  }
  return null;
};

// Igual, pero un instante dentro de un corte se lleva al borde más cercano (para inicios/finales)
export const remapClamped = (segs: Segment[], tMs: number): number => {
  let out = 0;
  for (const s of segs) {
    if (tMs < s.srcStartMs) return out;
    if (tMs <= s.srcEndMs) return out + (tMs - s.srcStartMs);
    out += s.srcEndMs - s.srcStartMs;
  }
  return out;
};

export const remapItems = (segs: Segment[], items: TimedWord[]): TimedWord[] =>
  items
    .map((w) => ({ text: w.text, startMs: remapClamped(segs, w.startMs), endMs: remapClamped(segs, w.endMs) }))
    .filter((w) => w.endMs > w.startMs);

export const remapTrack = (segs: Segment[], keys: FocusKey[]): FocusKey[] => {
  const out: FocusKey[] = [];
  for (const k of keys) {
    const t = remapClamped(segs, k.tMs);
    if (out.length && t <= out[out.length - 1].tMs) {
      out[out.length - 1] = { tMs: out[out.length - 1].tMs, x: k.x, y: k.y };
    } else out.push({ tMs: t, x: k.x, y: k.y });
  }
  return out;
};

export const toFrameSegments = (segs: Segment[], fps: number) =>
  segs
    .map((s) => {
      const a = Math.round((s.srcStartMs / 1000) * fps);
      const b = Math.round((s.srcEndMs / 1000) * fps);
      return { srcStartFrame: a, durationInFrames: b - a };
    })
    .filter((s) => s.durationInFrames > 0);

// Parte de los tramos que cae dentro de [startMs, endMs] (un clip hereda los cortes de silencio internos)
export const clipSegments = (segs: Segment[], startMs: number, endMs: number): Segment[] =>
  segs
    .map((s) => ({ srcStartMs: Math.max(s.srcStartMs, startMs), srcEndMs: Math.min(s.srcEndMs, endMs) }))
    .filter((s) => s.srcEndMs - s.srcStartMs >= 40);
