import { z } from "zod";
import { captionModeSchema, formatSchema, intensitySchema, reframeSchema } from "../../src/design/schema";

// Estados de un trabajo (orden del pipeline). "cancelado" se añade a la lista pedida para la cancelación.
export const JOB_STATUS = [
  "recibido",
  "validando",
  "analizando",
  "transcribiendo",
  "planificando",
  "generando_recursos",
  "componiendo",
  "renderizando",
  "verificando",
  "completado",
  "requiere_revision",
  "fallido",
  "cancelado",
] as const;
export const jobStatusSchema = z.enum(JOB_STATUS);
export type JobStatus = z.infer<typeof jobStatusSchema>;

export const STEPS = ["ingest", "analyze", "prepare", "captions", "compose", "render", "qc", "deliver"] as const;
export type StepName = (typeof STEPS)[number];

export const STEP_STATUS: Record<StepName, JobStatus> = {
  ingest: "validando",
  analyze: "analizando",
  prepare: "analizando",
  captions: "transcribiendo",
  compose: "componiendo",
  render: "renderizando",
  qc: "verificando",
  deliver: "verificando",
};

export const verdictSchema = z.enum(["APROBADO", "ADVERTENCIA", "FALLIDO"]);
export type Verdict = z.infer<typeof verdictSchema>;

export const jobConfigSchema = z.object({
  format: formatSchema,
  fps: z.number().int().min(12).max(60),
  captionMode: captionModeSchema,
  intensity: intensitySchema,
  reframe: reframeSchema,
  captionsRequired: z.boolean(),
  allowEstimatedWordTiming: z.boolean(),
  trim: z.object({ startSec: z.number().min(0), endSec: z.number().positive().nullable() }),
  audio: z.object({ normalize: z.boolean(), targetLufs: z.number(), truePeakDb: z.number() }),
});
export type JobConfig = z.infer<typeof jobConfigSchema>;

// Ajustes que se pueden pasar por CLI o por un <video>.job.json en la bandeja de entrada
export const jobOverridesSchema = jobConfigSchema
  .omit({ reframe: true, audio: true, trim: true })
  .partial()
  .extend({
    reframe: reframeSchema.partial().optional(),
    trim: z.object({ startSec: z.number().min(0).optional(), endSec: z.number().positive().nullable().optional() }).optional(),
    audio: z.object({ normalize: z.boolean().optional() }).optional(),
  })
  .strict();
export type JobOverrides = z.infer<typeof jobOverridesSchema>;

export const inputRoleSchema = z.enum(["video", "captions"]);

const inputSchema = z.object({
  role: inputRoleSchema,
  originalName: z.string(),
  path: z.string(), // relativa a la carpeta del trabajo
  sha256: z.string(),
  bytes: z.number(),
  detected: z.string(),
});
export type JobInput = z.infer<typeof inputSchema>;

const stepStateSchema = z.object({
  status: z.enum(["pendiente", "en_curso", "hecho", "fallido", "omitido"]),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  error: z.string().optional(),
});

const issueSchema = z.object({ step: z.string(), code: z.string(), message: z.string() });
export type Issue = z.infer<typeof issueSchema>;

export const jobSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  type: z.enum(["edicion", "creacion"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: jobStatusSchema,
  progress: z.number().min(0).max(1),
  attempts: z.number().int().min(0),
  config: jobConfigSchema,
  inputs: z.array(inputSchema),
  steps: z.record(z.string(), stepStateSchema),
  warnings: z.array(issueSchema),
  errors: z.array(issueSchema),
  outputs: z.array(z.object({ kind: z.string(), path: z.string() })),
  renderKey: z.string().nullable(),
  verdict: verdictSchema.nullable(),
  // Costes: separados en reales (facturados por un proveedor) y estimados. Etapa 1 no usa proveedores de pago.
  costs: z.object({
    real: z.array(z.object({ provider: z.string(), amount: z.number(), unit: z.string(), note: z.string() })),
    estimated: z.array(z.object({ provider: z.string(), amount: z.number(), unit: z.string(), note: z.string() })),
  }),
});
export type Job = z.infer<typeof jobSchema>;
