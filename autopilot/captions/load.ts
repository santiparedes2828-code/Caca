import { parseSrt } from "@remotion/captions";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { TimedWord } from "../../src/autopilot/paginate";

// Formato interno de subtítulos: lista de elementos con tiempos en ms y su precisión real.
//   word     tiempos por palabra (JSON de ElevenLabs Scribe, Whisper o Caption[] de Remotion palabra a palabra)
//   segment  tiempos por bloque (SRT, VTT): no se sabe cuándo suena cada palabra
export type Precision = "word" | "segment";
export type LoadedCaptions = { precision: Precision; items: TimedWord[]; warnings: string[]; source: string };

export const cleanText = (t: string) =>
  t
    .replace(/<[^>]*>/g, "") // etiquetas <i>, <b>, <c.color>, <00:00:01.000>
    .replace(/\{\\[^}]*\}/g, "") // etiquetas ASS {\an8}
    .replace(/\s+/g, " ")
    .trim();

const ts = (s: string) => {
  // HH:MM:SS,mmm | HH:MM:SS.mmm | MM:SS.mmm
  const m = s.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  if (!m) throw new Error(`marca de tiempo no válida "${s}"`);
  return Number(m[1] ?? 0) * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000 + Number(m[4].padEnd(3, "0"));
};

export const parseVtt = (text: string): TimedWord[] => {
  const blocks = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split(/\n{2,}/);
  const out: TimedWord[] = [];
  for (const b of blocks) {
    const lines = b.split("\n");
    const ti = lines.findIndex((l) => l.includes("-->"));
    if (ti < 0) continue; // WEBVTT, NOTE, STYLE, REGION
    const [a, rest] = lines[ti].split("-->");
    const startMs = ts(a);
    const endMs = ts(rest.trim().split(/\s+/)[0]);
    out.push({ text: lines.slice(ti + 1).join(" "), startMs, endMs });
  }
  return out;
};

const remotionCaption = z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() }).passthrough());
const scribe = z.object({
  words: z.array(z.object({ text: z.string(), start: z.number(), end: z.number(), type: z.string().optional() }).passthrough()),
});

export const parseCaptionsText = (text: string, ext: string): { precision: Precision; items: TimedWord[]; warnings: string[] } => {
  const warnings: string[] = [];
  if (ext === ".srt") {
    let caps;
    try {
      caps = parseSrt({ input: text, strict: true }).captions;
    } catch (e) {
      warnings.push(`SRT con formato irregular (${(e as Error).message}); se ha leído en modo tolerante`);
      caps = parseSrt({ input: text }).captions;
    }
    return { precision: "segment", items: caps.map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs })), warnings };
  }
  if (ext === ".vtt") return { precision: "segment", items: parseVtt(text), warnings };
  if (ext === ".json") {
    const data: unknown = JSON.parse(text);
    const s = scribe.safeParse(data);
    if (s.success) {
      const items = s.data.words
        .filter((w) => (w.type ?? "word") === "word")
        .map((w) => ({ text: w.text, startMs: Math.round(w.start * 1000), endMs: Math.round(w.end * 1000) }));
      return { precision: "word", items, warnings };
    }
    const r = remotionCaption.safeParse(data);
    if (r.success) {
      const items = r.data.map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs }));
      const perWord = items.every((x) => cleanText(x.text).split(" ").length <= 1);
      return { precision: perWord ? "word" : "segment", items, warnings };
    }
    throw new Error("JSON de subtítulos no reconocido: se espera {words:[{text,start,end}]} (segundos) o [{text,startMs,endMs}]");
  }
  throw new Error(`Formato de subtítulos no admitido: ${ext}`);
};

// Normaliza: limpia texto, ordena, elimina vacíos, corrige solapes y recorta a la duración del vídeo
export const normalize = (items: TimedWord[], durationMs: number, warnings: string[]): TimedWord[] => {
  const sorted = items
    .map((x) => ({ text: cleanText(x.text), startMs: Math.max(0, Math.round(x.startMs)), endMs: Math.round(x.endMs) }))
    .filter((x) => x.text.length > 0)
    .sort((a, b) => a.startMs - b.startMs);
  let overlaps = 0;
  let outside = 0;
  const out: TimedWord[] = [];
  sorted.forEach((x, i) => {
    const next = sorted[i + 1];
    let end = Math.max(x.endMs, x.startMs);
    if (next && end > next.startMs) {
      end = next.startMs;
      overlaps++;
    }
    if (x.startMs >= durationMs) {
      outside++;
      return;
    }
    out.push({ text: x.text, startMs: x.startMs, endMs: Math.min(end, durationMs) });
  });
  if (overlaps) warnings.push(`${overlaps} subtítulos se solapaban con el siguiente; se ha recortado su final`);
  if (outside) warnings.push(`${outside} subtítulos empezaban después del final del vídeo y se han descartado`);
  return out;
};

export const loadCaptionsFile = async (file: string, durationMs: number): Promise<LoadedCaptions> => {
  const text = await fs.readFile(file, "utf8");
  const ext = path.extname(file).toLowerCase();
  const parsed = parseCaptionsText(text, ext);
  const warnings = [...parsed.warnings];
  const items = normalize(parsed.items, durationMs, warnings);
  if (items.length === 0) throw new Error("El archivo de subtítulos no contiene ningún subtítulo válido");
  return { precision: parsed.precision, items, warnings, source: ext.slice(1) };
};

// Exporta páginas a SRT (una página = un bloque; líneas separadas por salto de línea)
const fmt = (ms: number) => {
  const v = Math.max(0, Math.round(ms));
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(v / 3600000))}:${p(Math.floor((v % 3600000) / 60000))}:${p(Math.floor((v % 60000) / 1000))},${p(v % 1000, 3)}`;
};

export const toSrt = (cues: { startMs: number; endMs: number; lines: string[] }[]) =>
  cues.map((c, i) => `${i + 1}\n${fmt(c.startMs)} --> ${fmt(c.endMs)}\n${c.lines.join("\n")}`).join("\n\n") + "\n";
