import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Sentence } from "./analyze";
import type { ClipCandidate, EditMode } from "./candidates";

// Planificador editorial con Claude (opcional). Claude SOLO elige rangos de frases existentes por su id y
// propone títulos; no escribe ni reordena contenido. Todo lo que devuelve se valida aquí y lo inválido se
// descarta. Recibe únicamente el texto de las frases con sus tiempos (nunca audio ni vídeo).

const planSchema = z.object({
  clips: z.array(
    z.object({
      start_sentence: z.number().int(),
      end_sentence: z.number().int(),
      title: z.string(),
      reason: z.string(),
    }),
  ),
  keywords: z.array(z.string()),
  claims_to_verify: z.array(z.object({ sentence: z.number().int(), reason: z.string() })),
});
export type ClaudePlan = z.infer<typeof planSchema>;

const MODE_BRIEF: Record<EditMode, string> = {
  "talking-head": "Persona hablando a cámara. Prioriza claridad: fragmentos que se entiendan solos.",
  podcast: "Podcast o entrevista. Cada clip debe entenderse sin el resto: si una respuesta necesita la pregunta, incluye la pregunta.",
  clips: "Vídeo largo para redes. Busca momentos autónomos con inicio fuerte y final cerrado.",
  anuncio: "Anuncio. Busca producto, público, problema, propuesta y llamada a la acción. Señala toda afirmación que haya que poder demostrar (cifras, superlativos, garantías).",
  educativo: "Contenido educativo. Mantén el orden lógico; prioriza fragmentos que expliquen un concepto completo.",
};

export type ClaudeResult = {
  clips: ClipCandidate[];
  keywords: string[];
  claims: { sentence: number; reason: string }[];
  rejected: string[];
  usage: { inputTokens: number; outputTokens: number; model: string };
};

export const planWithClaude = async (opts: {
  sentences: Sentence[];
  mode: EditMode;
  count: number;
  minMs: number;
  maxMs: number;
  model: string;
  effort: "low" | "medium" | "high";
  client?: Anthropic; // inyectable (las pruebas usan un servidor local con baseURL)
}): Promise<ClaudeResult> => {
  const client = opts.client ?? new Anthropic({ maxRetries: 2, timeout: 5 * 60_000 });
  const listing = opts.sentences.map((s) => `[${s.id}] ${(s.startMs / 1000).toFixed(1)}–${(s.endMs / 1000).toFixed(1)} s${s.speaker ? ` (${s.speaker})` : ""}: ${s.text}`).join("\n");
  const response = await client.beta.messages.parse({
    model: opts.model,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort, format: betaZodOutputFormat(planSchema) },
    system:
      "Eres el editor de vídeo de Hook House. Recibes la transcripción numerada de un vídeo y eliges fragmentos para redes sociales. " +
      "Reglas: cada clip es un rango continuo de frases (start_sentence..end_sentence, ids existentes), empieza al inicio de una idea y termina en frase completa; " +
      "nunca cambies el significado ni recortes una frase importante por una pausa; no inventes datos. " +
      "El título resume el fragmento con palabras del propio vídeo. Responde en español.",
    messages: [
      {
        role: "user",
        content:
          `Tipo de vídeo: ${MODE_BRIEF[opts.mode]}\n` +
          `Elige hasta ${opts.count} clips de ${Math.round(opts.minMs / 1000)} a ${Math.round(opts.maxMs / 1000)} segundos, sin solaparse, ordenados por interés.\n` +
          "Añade hasta 8 palabras clave (conceptos del vídeo, tal como aparecen) y las afirmaciones que habría que verificar.\n\n" +
          `Transcripción:\n${listing}`,
      },
    ],
  });
  const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, model: response.model };
  if (response.stop_reason === "refusal") throw new Error("Claude rechazó la petición (stop_reason refusal)");
  const plan = response.parsed_output;
  if (!plan) throw new Error(`Respuesta de Claude sin plan válido (stop_reason ${response.stop_reason})`);

  // Validación semántica: ids existentes, rango ordenado, duración dentro de margen, sin solapes
  const rejected: string[] = [];
  const clips: ClipCandidate[] = [];
  for (const c of plan.clips) {
    const a = opts.sentences[c.start_sentence];
    const b = opts.sentences[c.end_sentence];
    if (!a || !b || c.end_sentence < c.start_sentence) {
      rejected.push(`clip con frases inexistentes (${c.start_sentence}–${c.end_sentence})`);
      continue;
    }
    const dur = b.endMs - a.startMs;
    if (dur < opts.minMs * 0.8 || dur > opts.maxMs * 1.15) {
      rejected.push(`"${c.title}" dura ${(dur / 1000).toFixed(0)} s, fuera de ${Math.round(opts.minMs / 1000)}–${Math.round(opts.maxMs / 1000)} s`);
      continue;
    }
    if (clips.some((k) => Math.min(k.endMs, b.endMs) - Math.max(k.startMs, a.startMs) > 0)) {
      rejected.push(`"${c.title}" se solapa con otro clip`);
      continue;
    }
    clips.push({
      startSentence: a.id,
      endSentence: b.id,
      startMs: a.startMs,
      endMs: b.endMs,
      durationMs: dur,
      score: clips.length ? -clips.length : 0,
      title: c.title.slice(0, 80),
      reasons: [`Claude: ${c.reason.slice(0, 200)}`, `${(dur / 1000).toFixed(0)} s`],
    });
    if (clips.length >= opts.count) break;
  }
  const claims = plan.claims_to_verify.filter((x) => opts.sentences[x.sentence]);
  return { clips: clips.sort((x, y) => x.startMs - y.startMs), keywords: plan.keywords.slice(0, 8), claims, rejected, usage };
};
