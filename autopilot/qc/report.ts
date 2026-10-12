import type { Job } from "../jobs/types";
import type { QcResult } from "./qc";

const ICON = { ok: "✅", advertencia: "⚠️", fallo: "❌" } as const;

// Informe legible del trabajo (output/informe.md). Solo rutas relativas al trabajo, nunca rutas de la máquina.
export const reportMarkdown = (job: Job, qc: QcResult | null, extra: { analysis?: Record<string, unknown> } = {}) => {
  const L: string[] = [];
  L.push(`# Informe · trabajo ${job.id}`);
  L.push("");
  L.push(`- **Cliente:** ${job.clientId}`);
  L.push(`- **Tipo:** ${job.type}`);
  L.push(`- **Estado:** ${job.status}${job.verdict ? ` · control de calidad **${job.verdict}**` : ""}`);
  L.push(`- **Creado:** ${job.createdAt} · **Actualizado:** ${job.updatedAt} · **Intentos:** ${job.attempts}`);
  L.push(
    `- **Configuración:** ${job.config.format} · ${job.config.fps} fps · subtítulos ${job.config.captionMode} · intensidad ${job.config.intensity} · reencuadre ${job.config.reframe.mode}`,
  );
  L.push("");
  L.push("## Entradas (originales conservados en `input/original/`, solo lectura)");
  for (const i of job.inputs) L.push(`- ${i.role}: \`${i.originalName}\` · ${i.detected} · ${(i.bytes / 1048576).toFixed(2)} MB · sha256 \`${i.sha256.slice(0, 16)}…\``);
  if (extra.analysis) {
    L.push("");
    L.push("## Análisis del original");
    for (const [k, v] of Object.entries(extra.analysis)) L.push(`- ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  }
  if (qc) {
    L.push("");
    L.push(`## Control de calidad: ${qc.verdict}`);
    L.push("");
    L.push("| | Control | Resultado |");
    L.push("|---|---|---|");
    for (const c of qc.checks) L.push(`| ${ICON[c.status]} | ${c.label} | ${c.detail.replace(/\|/g, "/")} |`);
    if (qc.sheet) {
      L.push("");
      L.push(`Fotogramas de control: \`qc/${qc.sheet}\``);
      L.push("");
      L.push(`![hoja de contacto](qc/${qc.sheet})`);
    }
  }
  if (job.warnings.length) {
    L.push("");
    L.push("## Advertencias");
    for (const w of job.warnings) L.push(`- [${w.step}] ${w.message}`);
  }
  if (job.errors.length) {
    L.push("");
    L.push(job.status === "fallido" || job.status === "cancelado" ? "## Errores" : "## Errores de intentos anteriores (ya resueltos)");
    for (const e of job.errors) L.push(`- [${e.step}] ${e.code}: ${e.message}`);
  }
  L.push("");
  L.push("## Costes");
  L.push(
    job.costs.real.length || job.costs.estimated.length
      ? [...job.costs.real.map((c) => `- REAL ${c.provider}: ${c.amount} ${c.unit} (${c.note})`), ...job.costs.estimated.map((c) => `- ESTIMADO ${c.provider}: ${c.amount} ${c.unit} (${c.note})`)].join("\n")
      : "- Ninguno: este trabajo no ha usado proveedores externos de pago (todo local).",
  );
  L.push("");
  L.push("## Salidas");
  for (const o of job.outputs) L.push(`- ${o.kind}: \`${o.path}\``);
  L.push("");
  L.push("> El control automático no sustituye la revisión humana: mira el vídeo completo antes de publicarlo (encuadre de caras, sentido de los cortes, erratas de la transcripción).");
  return L.join("\n") + "\n";
};
