import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { probe } from "../media/probe";
import { resolveInside } from "../util/fs";
import type { Sentence } from "./analyze";

// Biblioteca de recursos autorizados: B-roll (imágenes y vídeos) y música.
//   library/<tipo>/catalog.json                 recursos internos de Hook House
//   clients/<cliente>/library/<tipo>/catalog.json  recursos del cliente (tienen prioridad)
// Cada elemento DEBE declarar su licencia y procedencia; sin ellas no se usa (nunca se supone una licencia).

export const LICENSES = ["propia", "cliente", "cc0", "cc-by", "licencia-comercial", "generada-ia", "generado-en-pruebas"] as const;

const licenseSchema = z
  .object({
    type: z.enum(LICENSES),
    source: z.string().min(1), // de dónde sale (proveedor, autor, URL, herramienta)
    attribution: z.string().optional(), // obligatoria para cc-by
    notes: z.string().optional(),
  })
  .refine((l) => l.type !== "cc-by" || !!l.attribution, { message: "cc-by requiere atribución" });

const itemSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-_]{0,63}$/),
  file: z.string().min(1),
  kind: z.enum(["image", "video", "audio"]),
  tags: z.array(z.string().min(2)).default([]),
  description: z.string().default(""),
  mood: z.string().optional(), // música: "energica", "tranquila", "corporativa"…
  license: licenseSchema,
});
export type LibraryItem = z.infer<typeof itemSchema> & { scope: "cliente" | "hookhouse"; src: string; durationSec: number | null };

const catalogSchema = z.object({ items: z.array(z.unknown()) });

export type LoadedLibrary = { items: LibraryItem[]; rejected: { where: string; reason: string }[] };

// Carga y valida los catálogos; los elementos inválidos se rechazan con su motivo (no rompen el trabajo)
export const loadLibrary = async (opts: { libraryDir: string; clientsDir: string; clientId: string; kind: "broll" | "music" }): Promise<LoadedLibrary> => {
  const sources: { scope: LibraryItem["scope"]; dir: string; prefix: string }[] = [
    { scope: "cliente", dir: path.join(opts.clientsDir, opts.clientId, "library", opts.kind), prefix: "clientlib" },
    { scope: "hookhouse", dir: path.join(opts.libraryDir, opts.kind), prefix: "library" },
  ];
  const items: LibraryItem[] = [];
  const rejected: LoadedLibrary["rejected"] = [];
  for (const s of sources) {
    const file = path.join(s.dir, "catalog.json");
    let raw: unknown;
    try {
      raw = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      continue; // sin catálogo
    }
    const cat = catalogSchema.safeParse(raw);
    if (!cat.success) {
      rejected.push({ where: `${s.scope}/${opts.kind}/catalog.json`, reason: "formato no válido" });
      continue;
    }
    for (const [i, r] of cat.data.items.entries()) {
      const p = itemSchema.safeParse(r);
      const where = `${s.scope}/${opts.kind} #${i + 1}`;
      if (!p.success) {
        rejected.push({ where, reason: p.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") });
        continue;
      }
      if (opts.kind === "music" && p.data.kind !== "audio") {
        rejected.push({ where, reason: "la música debe ser audio" });
        continue;
      }
      let full: string;
      try {
        full = resolveInside(s.dir, p.data.file);
        await fs.access(full);
      } catch {
        rejected.push({ where: `${where} (${p.data.id})`, reason: `no existe el archivo ${p.data.file}` });
        continue;
      }
      let durationSec: number | null = null;
      if (p.data.kind !== "image") {
        try {
          durationSec = (await probe(full)).durationSec;
        } catch {
          rejected.push({ where: `${where} (${p.data.id})`, reason: "archivo multimedia ilegible" });
          continue;
        }
      }
      items.push({ ...p.data, scope: s.scope, src: `${s.prefix}:${opts.kind}/${p.data.file}`, durationSec });
    }
  }
  return { items, rejected };
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
const stem = (w: string) => (w.length > 5 && w.endsWith("es") ? w.slice(0, -2) : w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w);
const words = (s: string) => new Set(norm(s).split(/\s+/).filter((w) => w.length > 2).map(stem));

export type BrollPick = { item: LibraryItem; sentence: number; startMs: number; endMs: number; matched: string[] };

// Empareja frases con recursos por etiquetas. Reglas: como mucho un 30 % del tiempo con B-roll, al menos 4 s
// entre inserciones, el mismo recurso no se repite, 1,5–3 s por inserción. Sin coincidencia, no se pone nada.
export const matchBroll = (sentences: Sentence[], items: LibraryItem[], totalMs: number, o: { maxShare?: number; gapMs?: number } = {}): BrollPick[] => {
  const maxShare = o.maxShare ?? 0.3;
  const gap = o.gapMs ?? 4000;
  const visual = items.filter((i) => i.kind !== "audio");
  const used = new Set<string>();
  const picks: BrollPick[] = [];
  let covered = 0;
  for (const s of sentences) {
    const ws = words(s.text);
    let best: { item: LibraryItem; matched: string[] } | null = null;
    for (const it of visual) {
      if (used.has(it.id)) continue;
      const matched = it.tags.filter((t) => [...words(t)].every((w) => ws.has(w)));
      if (matched.length && (!best || matched.length > best.matched.length || (matched.length === best.matched.length && it.scope === "cliente"))) {
        best = { item: it, matched };
      }
    }
    if (!best) continue;
    const startMs = s.startMs + 200;
    const dur = Math.min(3000, Math.max(1500, s.endMs - s.startMs - 300));
    if (startMs + dur > s.endMs + 400) continue;
    const last = picks[picks.length - 1];
    if (last && startMs - last.endMs < gap) continue;
    if (covered + dur > maxShare * totalMs) break;
    picks.push({ item: best.item, sentence: s.id, startMs, endMs: startMs + dur, matched: best.matched });
    used.add(best.item.id);
    covered += dur;
  }
  return picks;
};

// Música: la del cliente con el estado de ánimo pedido, si no la interna; null si no hay ninguna autorizada
export const pickMusic = (items: LibraryItem[], mood: string | null, id: string | null) => {
  const audio = items.filter((i) => i.kind === "audio");
  if (id) return audio.find((i) => i.id === id) ?? null;
  const byMood = mood ? audio.filter((i) => i.mood === mood) : audio;
  return byMood.find((i) => i.scope === "cliente") ?? byMood[0] ?? null;
};
