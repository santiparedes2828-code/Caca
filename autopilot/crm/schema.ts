import { z } from "zod";

// Base de datos comercial de Hook House: prospectos reales, mensajes, seguimientos y resultados.
// Regla: nada inventado. Cada prospecto lleva sus fuentes (URL) y lo no verificado va a `notas`.

export const ESTADOS = [
  "nuevo", // investigado, sin mensaje todavía
  "mensaje-listo", // borrador personalizado esperando aprobación del usuario
  "contactado", // primer mensaje enviado (por el usuario)
  "respondio",
  "llamada", // llamada o conversación comercial agendada
  "prueba", // edición de muestra entregada
  "propuesta", // oferta mensual enviada
  "cliente", // pagando de forma recurrente
  "perdido", // dijo que no o dejó de responder tras los seguimientos
  "no-encaja", // descartado tras revisar (no publica, ya tiene equipo, etc.)
] as const;
export type Estado = (typeof ESTADOS)[number];

export const SEGMENTOS = ["podcaster", "educativo", "profesional", "otro"] as const;

const url = z.string().url();
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "fecha AAAA-MM-DD");

export const perfilesSchema = z
  .object({
    youtube: url.nullable().default(null),
    instagram: url.nullable().default(null),
    tiktok: url.nullable().default(null),
    web: url.nullable().default(null),
    podcast: url.nullable().default(null),
    linkedin: url.nullable().default(null),
    x: url.nullable().default(null),
  })
  .partial()
  .default({});

export const mensajeSchema = z.object({
  fecha: fecha,
  canal: z.enum(["email", "formulario", "instagram", "tiktok", "linkedin", "x", "youtube", "otro"]),
  tipo: z.enum(["borrador", "enviado", "recibido", "nota"]),
  paso: z.enum(["primer-contacto", "seguimiento-1", "seguimiento-2", "seguimiento-3", "respuesta", "propuesta", "otro"]).default("otro"),
  asunto: z.string().nullable().default(null),
  texto: z.string().min(1),
  aprobado: z.boolean().default(false), // el usuario revisó destinatario y texto; sin esto no se marca como enviado
});
export type Mensaje = z.infer<typeof mensajeSchema>;

export const prospectoSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombre: z.string().min(2),
  segmento: z.enum(SEGMENTOS),
  nicho: z.string().min(2),
  idioma: z.string().default("en"),
  pais: z.string().nullable().default(null),
  perfiles: perfilesSchema,
  contacto_publico: z.string().nullable().default(null),
  contacto_fuente: url.nullable().default(null),
  // propio: visto en su web o canal · tercero: solo en directorios · sin-verificar: aún no comprobado
  contacto_nivel: z.enum(["propio", "tercero", "ninguno", "sin-verificar"]).default("sin-verificar"),
  tamano: z.string().nullable().default(null),
  frecuencia: z.string().nullable().default(null),
  evidencia_necesidad: z.array(z.string().min(5)).min(1, "sin evidencia de necesidad no entra"),
  contenido_reciente: z.array(z.object({ titulo: z.string(), url: url.nullable().default(null), fecha: z.string().nullable().default(null) })).default([]),
  prioridad: z.enum(["A", "B", "C"]),
  motivo_prioridad: z.string().default(""),
  fuentes: z.array(url).min(1, "cada prospecto necesita al menos una fuente"),
  notas: z.string().default(""),
  verificado: fecha,
  estado: z.enum(ESTADOS).default("nuevo"),
  mensajes: z.array(mensajeSchema).default([]),
  proximo_seguimiento: fecha.nullable().default(null),
  resultado: z.string().nullable().default(null), // p. ej. «cliente 300 USD/mes desde 2026-11-01»
  valor_mensual: z.number().nullable().default(null), // USD/mes si es cliente o hay propuesta
  creado: fecha,
  actualizado: fecha,
});
export type Prospecto = z.infer<typeof prospectoSchema>;

export const dbSchema = z.object({ version: z.literal(1), prospectos: z.array(prospectoSchema) });
export type Db = z.infer<typeof dbSchema>;

// Cadencia de seguimientos desde el primer contacto (días). Tras el último sin respuesta → «perdido».
export const CADENCIA = [3, 7, 14] as const;
