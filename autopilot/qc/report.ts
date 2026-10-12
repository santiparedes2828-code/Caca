import type { Job } from "../jobs/types";
import type { QcResult } from "./qc";

const ICON = { ok: "✅", advertencia: "⚠️", fallo: "❌" } as const;

export type ReportVariant = { id: string; title: string | null; durationMs: number; reason: string | null; qc: QcResult };

// Informe legible del trabajo (output/informe.md). Solo rutas relativas al trabajo, nunca rutas de la máquina.
export const reportMarkdown = (
  job: Job,
  variants: ReportVariant[] | null,
  extra: { analysis?: Record<string, unknown>; notes?: string[] } = {},
) => {
  const L: string[] = [];
  L.push(`# Informe · trabajo ${job.id}`);
  L.push("");
  L.push(`- **Cliente:** ${job.clientId}`);
  L.push(`- **Tipo:** ${job.type}`);
  L.push(`- **Estado:** ${job.status}${job.verdict ? ` · control de calidad **${job.verdict}**` : ""}`);
  L.push(`- **Creado:** ${job.createdAt} · **Actualizado:** ${job.updatedAt} · **Intentos:** ${job.attempts}`);
  L.push(
    `- **Configuración:** ${job.config.format} · ${job.config.fps} fps · subtítulos ${job.config.captionMode} · intensidad ${job.config.intensity} · reencuadre ${job.config.reframe.mode}${job.config.followFaces ? " siguiendo caras" : ""}${job.config.cutSilences ? " · cortes de silencio" : ""}`,
  );
  if (job.inputs.length) {
    L.push("");
    L.push("## Entradas (originales conservados en `input/original/`, solo lectura)");
    for (const i of job.inputs) L.push(`- ${i.role}: \`${i.originalName}\` · ${i.detected} · ${(i.bytes / 1048576).toFixed(2)} MB · sha256 \`${i.sha256.slice(0, 16)}…\``);
  }
  if (extra.analysis) {
    L.push("");
    L.push("## Análisis");
    for (const [k, v] of Object.entries(extra.analysis)) L.push(`- ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  }
  if (extra.notes?.length) {
    L.push("");
    L.push("## Decisiones de edición");
    for (const n of extra.notes) L.push(`- ${n}`);
  }
  for (const v of variants ?? []) {
    L.push("");
    L.push(`## ${v.id === "principal" ? "Vídeo principal" : `Clip ${v.id}`}${v.title ? `: ${v.title}` : ""} — ${v.qc.verdict}`);
    L.push("");
    L.push(`Duración: ${(v.durationMs / 1000).toFixed(1)} s${v.reason ? ` · Motivo: ${v.reason}` : ""}`);
    L.push("");
    L.push("| | Control | Resultado |");
    L.push("|---|---|---|");
    for (const c of v.qc.checks) L.push(`| ${ICON[c.status]} | ${c.label} | ${c.detail.replace(/\|/g, "/")} |`);
    if (v.qc.sheet) {
      L.push("");
      L.push(`![fotogramas de control](qc/${v.id}/${v.qc.sheet})`);
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
      ? [
          ...job.costs.real.map((c) => `- REAL ${c.provider}: ${c.amount} ${c.unit} (${c.note})`),
          ...job.costs.estimated.map((c) => `- ESTIMADO ${c.provider}: ${c.amount} ${c.unit} (${c.note})`),
        ].join("\n")
      : "- Ninguno: este trabajo no ha usado proveedores externos de pago (todo local).",
  );
  const providers = new Set(job.costs.real.map((c) => c.provider));
  if (providers.size) {
    L.push("");
    L.push("## Datos enviados a proveedores externos");
    if (job.costs.real.some((c) => c.note.startsWith("speech-to-text"))) {
      L.push("- ElevenLabs (speech-to-text): solo la pista de audio del tramo editado (mono, 16 kHz, sin metadatos). Ni vídeo ni nombres de archivo del cliente.");
    }
    if (job.costs.real.some((c) => c.note.startsWith("text-to-speech"))) {
      L.push("- ElevenLabs (text-to-speech): el texto de la narración.");
    }
    if (providers.has("anthropic")) L.push("- Anthropic (Claude): el texto de la transcripción o del brief, para planificar.");
  }
  L.push("");
  L.push("## Salidas");
  for (const o of job.outputs) L.push(`- ${o.kind}${o.variant ? ` (${o.variant})` : ""}: \`${o.path}\``);
  L.push("");
  L.push("> El control automático no sustituye la revisión humana: mira el vídeo completo antes de publicarlo (encuadre de caras, sentido de los cortes, erratas de la transcripción).");
  return L.join("\n") + "\n";
};
