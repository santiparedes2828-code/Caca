import type { z } from "zod";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { CADENCIA, dbSchema, mensajeSchema, prospectoSchema, type Db, type Estado, type Mensaje, type Prospecto } from "./schema";

export const DB_PATH = path.resolve("crecimiento/datos/prospectos.json");

export const hoy = () => new Date().toISOString().slice(0, 10);

export const addDays = (d: string, n: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

// Claves para detectar duplicados: URLs de perfiles normalizadas, contacto y nombre.
const normUrl = (u: string) =>
  u
    .toLowerCase()
    .replace(/^https?:\/\/(www\.|m\.)?/, "")
    .replace(/#.*$/, "")
    // la consulta identifica la página en algunos sitios (?list= de YouTube, ?v=…): solo se quitan los parámetros de campaña
    .replace(/([?&])(utm_[^=&]*|fbclid|gclid|si)=[^&]*/g, "$1")
    .replace(/[?&]+$/, "")
    .replace(/\/(featured|videos|about|shorts|streams)$/, "")
    .replace(/\/+$/, "");

export const dedupeKeys = (p: Pick<Prospecto, "nombre" | "perfiles" | "contacto_publico">): string[] => {
  const keys = new Set<string>();
  for (const v of Object.values(p.perfiles ?? {})) if (v) keys.add(`url:${normUrl(v)}`);
  if (p.contacto_publico && p.contacto_publico.includes("@") && !p.contacto_publico.startsWith("http")) keys.add(`mail:${p.contacto_publico.toLowerCase().trim()}`);
  keys.add(`nombre:${slug(p.nombre.replace(/\(.*\)/, ""))}`);
  return [...keys];
};

export const findDuplicate = (db: Db, p: Pick<Prospecto, "nombre" | "perfiles" | "contacto_publico">): Prospecto | undefined => {
  const keys = new Set(dedupeKeys(p));
  return db.prospectos.find((q) => dedupeKeys(q).some((k) => keys.has(k)));
};

export const emptyDb = (): Db => ({ version: 1, prospectos: [] });

export const loadDb = async (file = DB_PATH): Promise<Db> => {
  if (!existsSync(file)) return emptyDb();
  return dbSchema.parse(JSON.parse(await fs.readFile(file, "utf8")));
};

export const saveDb = async (db: Db, file = DB_PATH) => {
  const valid = dbSchema.parse(db);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(valid, null, 2)}\n`);
  await fs.rename(tmp, file);
};

export type ImportResult = { added: string[]; duplicates: { nombre: string; existente: string }[]; invalid: { nombre: string; error: string }[] };

// Importa prospectos investigados (formato de crecimiento/investigacion/*.json). Nunca sobrescribe uno existente.
export const importProspects = (db: Db, raw: unknown[], today = hoy()): ImportResult => {
  const res: ImportResult = { added: [], duplicates: [], invalid: [] };
  for (const r of raw) {
    const o = (r ?? {}) as Record<string, unknown>;
    const nombre = String(o.nombre ?? "?");
    const parsed = prospectoSchema.safeParse({
      ...o,
      id: slug(nombre.replace(/\(.*\)/, "")) || "prospecto",
      estado: "nuevo",
      mensajes: [],
      creado: today,
      actualizado: today,
    });
    if (!parsed.success) {
      res.invalid.push({ nombre, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
      continue;
    }
    const dup = findDuplicate(db, parsed.data);
    if (dup) {
      res.duplicates.push({ nombre, existente: dup.id });
      continue;
    }
    let id = parsed.data.id;
    for (let n = 2; db.prospectos.some((q) => q.id === id); n++) id = `${parsed.data.id}-${n}`;
    db.prospectos.push({ ...parsed.data, id });
    res.added.push(id);
  }
  return res;
};

export const getProspect = (db: Db, id: string): Prospecto => {
  const p = db.prospectos.find((q) => q.id === id);
  if (!p) throw new Error(`No existe el prospecto «${id}»`);
  return p;
};

export const setEstado = (db: Db, id: string, estado: Estado, nota?: string, today = hoy()) => {
  const p = getProspect(db, id);
  p.estado = estado;
  p.actualizado = today;
  if (nota) p.mensajes.push(mensajeSchema.parse({ fecha: today, canal: "otro", tipo: "nota", paso: "otro", asunto: null, texto: nota }));
  if (["respondio", "llamada", "prueba", "propuesta", "cliente", "perdido", "no-encaja"].includes(estado)) p.proximo_seguimiento = null;
  return p;
};

// Registra un mensaje. Un «enviado» lo marca el usuario después de enviarlo él (Claude no envía nada).
export type MensajeIn = Omit<z.input<typeof mensajeSchema>, "fecha"> & { fecha?: string };

export const addMessage = (db: Db, id: string, m: MensajeIn, today = hoy()) => {
  const p = getProspect(db, id);
  const msg: Mensaje = mensajeSchema.parse({ ...m, fecha: m.fecha ?? today });
  p.mensajes.push(msg);
  p.actualizado = today;
  if (msg.tipo === "borrador" && p.estado === "nuevo") p.estado = "mensaje-listo";
  if (msg.tipo === "enviado") {
    if (["nuevo", "mensaje-listo"].includes(p.estado)) p.estado = "contactado";
    const enviados = p.mensajes.filter((x) => x.tipo === "enviado").length;
    const first = p.mensajes.find((x) => x.tipo === "enviado")!.fecha;
    p.proximo_seguimiento = p.estado === "contactado" && enviados <= CADENCIA.length ? addDays(first, CADENCIA[enviados - 1]) : null;
  }
  if (msg.tipo === "recibido") {
    if (["contactado", "mensaje-listo", "nuevo"].includes(p.estado)) p.estado = "respondio";
    p.proximo_seguimiento = null;
  }
  return p;
};

export type Pendiente = { id: string; nombre: string; accion: string; fecha: string; vencido: boolean };

// El usuario aprueba el borrador de un paso (destinatario y texto). Solo los aprobados pueden marcarse como enviados.
export const approveDraft = (db: Db, id: string, paso: Mensaje["paso"], today = hoy()) => {
  const p = getProspect(db, id);
  const draft = [...p.mensajes].reverse().find((m) => m.tipo === "borrador" && m.paso === paso);
  if (!draft) throw new Error(`No hay borrador del paso «${paso}» para ${id}`);
  draft.aprobado = true;
  p.actualizado = today;
  return draft;
};

export const markSent = (db: Db, id: string, paso: Mensaje["paso"], canal?: Mensaje["canal"], fecha = hoy()) => {
  const p = getProspect(db, id);
  const draft = [...p.mensajes].reverse().find((m) => m.tipo === "borrador" && m.paso === paso);
  if (!draft) throw new Error(`No hay borrador del paso «${paso}» para ${id}`);
  if (!draft.aprobado) throw new Error(`El borrador «${paso}» de ${id} no está aprobado: revísalo y ejecuta «aprobar» primero`);
  return addMessage(db, id, { ...draft, canal: canal ?? draft.canal, tipo: "enviado", fecha }, fecha);
};

// Qué toca hoy: seguimientos vencidos, borradores por aprobar y contactados que agotaron la cadencia.
export const pendientes = (db: Db, today = hoy()): Pendiente[] => {
  const out: Pendiente[] = [];
  for (const p of db.prospectos) {
    if (p.estado === "mensaje-listo") {
      const first = [...p.mensajes].reverse().find((m) => m.tipo === "borrador" && m.paso === "primer-contacto");
      out.push({ id: p.id, nombre: p.nombre, accion: first?.aprobado ? "aprobado: enviar el primer mensaje" : "revisar y aprobar el primer mensaje", fecha: p.actualizado, vencido: true });
    }
    if (p.estado === "contactado") {
      const enviados = p.mensajes.filter((x) => x.tipo === "enviado").length;
      const paso = `seguimiento-${enviados}` as Mensaje["paso"];
      const ready = p.mensajes.some((m) => m.tipo === "borrador" && m.paso === paso);
      if (p.proximo_seguimiento) out.push({ id: p.id, nombre: p.nombre, accion: `${paso}${ready ? " (borrador listo)" : " (falta borrador)"}`, fecha: p.proximo_seguimiento, vencido: p.proximo_seguimiento <= today });
      else out.push({ id: p.id, nombre: p.nombre, accion: "cadencia agotada sin respuesta: marcar «perdido»", fecha: p.actualizado, vencido: true });
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
};

export const resumen = (db: Db) => {
  const porEstado: Record<string, number> = {};
  const porPrioridad: Record<string, number> = {};
  const porSegmento: Record<string, number> = {};
  for (const p of db.prospectos) {
    porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;
    porPrioridad[p.prioridad] = (porPrioridad[p.prioridad] ?? 0) + 1;
    porSegmento[p.segmento] = (porSegmento[p.segmento] ?? 0) + 1;
  }
  const contactados = db.prospectos.filter((p) => p.mensajes.some((m) => m.tipo === "enviado")).length;
  const respondieron = db.prospectos.filter((p) => p.mensajes.some((m) => m.tipo === "recibido")).length;
  return { total: db.prospectos.length, porEstado, porPrioridad, porSegmento, contactados, respondieron, tasaRespuesta: contactados ? respondieron / contactados : null };
};

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (db: Db) => {
  const cols = ["id", "nombre", "segmento", "nicho", "prioridad", "estado", "contacto_publico", "youtube", "instagram", "tiktok", "web", "tamano", "frecuencia", "evidencia", "proximo_seguimiento", "resultado", "fuentes"];
  const rows = db.prospectos.map((p) =>
    [p.id, p.nombre, p.segmento, p.nicho, p.prioridad, p.estado, p.contacto_publico, p.perfiles.youtube, p.perfiles.instagram, p.perfiles.tiktok, p.perfiles.web, p.tamano, p.frecuencia, p.evidencia_necesidad.join(" | "), p.proximo_seguimiento, p.resultado, p.fuentes.join(" ")].map(csvCell).join(","),
  );
  return [cols.join(","), ...rows].join("\n") + "\n";
};
