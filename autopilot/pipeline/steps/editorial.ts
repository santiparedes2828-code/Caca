import Anthropic from "@anthropic-ai/sdk";
import { clipSegments, totalMs, type Segment } from "../../edit/timeline";
import { buildSentences, findClaims, keywords, scoreSentences, topicBoundaries, type Sentence } from "../../editorial/analyze";
import { clipCandidates, selectClips, type ClipCandidate, type EditMode } from "../../editorial/candidates";
import { planWithClaude } from "../../editorial/claude";
import { loadLibrary, matchBroll, pickMusic, type LibraryItem } from "../../editorial/library";
import { warn, type Ctx, type PlanArtifact, type SourceCaptions, type Variant } from "../context";

// Planificación editorial (Etapa 3): qué vídeos salen (principal, clips, versiones cortas), con qué B-roll
// y qué música. Todo se decide aquí, antes del render, y queda escrito en work/plan.json y output/plan.md.

const credit = (i: LibraryItem) =>
  `${i.id} · ${i.license.type}${i.license.attribution ? ` · ${i.license.attribution}` : ""} · origen: ${i.license.source}`;

// Pequeño margen al principio y al final del clip, sin invadir la frase vecina
const clipRange = (sentences: Sentence[], c: ClipCandidate, durMs: number) => {
  const prev = sentences[c.startSentence - 1];
  const next = sentences[c.endSentence + 1];
  const a = Math.max(prev ? prev.endMs : 0, c.startMs - 150);
  const b = Math.min(next ? next.startMs : durMs, c.endMs + 300);
  return { a, b };
};

export type EditorialResult = Pick<PlanArtifact, "variants" | "editorial" | "broll" | "music" | "rejectedResources"> & { notes: string[] };

export const planEditorial = async (ctx: Ctx, src: SourceCaptions, base: Segment[], durMs: number): Promise<EditorialResult> => {
  const c = ctx.job.config;
  const prof = ctx.profile.defaults.editorial;
  const notes: string[] = [];
  const principal: Variant = { id: "principal", title: null, segments: base, durationMs: totalMs(base), reason: null, score: null };
  let variants: Variant[] = [principal];
  let editorial: EditorialResult["editorial"] = null;
  const wantsClips = c.editMode !== "talking-head";
  const words = !src.none && src.precision === "word" ? src.items : null;

  let sentences: Sentence[] = [];
  if (words?.length) {
    sentences = scoreSentences(buildSentences(words, src.none ? null : (src.speakers ?? null)));
    const boundaries = topicBoundaries(sentences);
    let kw = keywords(sentences).map((k) => k.word);
    let claims = c.editMode === "anuncio" ? findClaims(sentences).map((x) => ({ startMs: x.startMs, text: x.text, reason: "cifra, superlativo o garantía" })) : [];
    const rejected: string[] = [];
    let planner: "local" | "claude" = "local";
    let clips: ClipCandidate[] = [];

    if (wantsClips) {
      const minMs = c.clips.minSec * 1000;
      const maxMs = c.clips.maxSec * 1000;
      if (c.planner === "claude") {
        try {
          const r = await planWithClaude({
            sentences,
            mode: c.editMode as EditMode,
            count: c.clips.count,
            minMs,
            maxMs,
            model: prof.claude.model,
            effort: prof.claude.effort,
          });
          planner = "claude";
          clips = r.clips;
          rejected.push(...r.rejected);
          if (r.keywords.length) kw = r.keywords;
          claims = [
            ...claims,
            ...r.claims.map((x) => ({ startMs: sentences[x.sentence].startMs, text: sentences[x.sentence].text, reason: `Claude: ${x.reason}` })),
          ];
          ctx.job.costs.real.push({
            provider: "anthropic",
            amount: r.usage.inputTokens + r.usage.outputTokens,
            unit: `tokens (${r.usage.inputTokens} entrada + ${r.usage.outputTokens} salida)`,
            note: `planificación ${r.usage.model}`,
          });
          ctx.job.costs.estimated.push({
            provider: "anthropic",
            amount: Number(((r.usage.inputTokens * ctx.cfg.HH_CLAUDE_USD_PER_MTOK_IN + r.usage.outputTokens * ctx.cfg.HH_CLAUDE_USD_PER_MTOK_OUT) / 1e6).toFixed(4)),
            unit: "USD",
            note: "estimado con HH_CLAUDE_USD_PER_MTOK_IN/OUT (tarifa pública); la factura manda",
          });
          for (const x of r.rejected) warn(ctx, "plan", "plan_claude", `Propuesta de Claude descartada: ${x}`);
        } catch (e) {
          const msg = e instanceof Anthropic.AuthenticationError ? "sin credenciales válidas de Anthropic (ANTHROPIC_API_KEY)" : (e as Error).message;
          warn(ctx, "plan", "plan_claude_fallo", `Planificador Claude no disponible (${msg.slice(0, 200)}): se usa el planificador local`);
        }
      }
      if (!clips.length) {
        planner = "local";
        clips = selectClips(clipCandidates(sentences, { minMs, maxMs, boundaries, mode: c.editMode as EditMode }), c.clips.count);
      }
      if (!clips.length) warn(ctx, "plan", "sin_clips", `No hay fragmentos de ${c.clips.minSec}–${c.clips.maxSec} s que empiecen y terminen en frase completa`);
      const clipVariants = clips.map((k, i): Variant => {
        const { a, b } = clipRange(sentences, k, durMs);
        const segs = clipSegments(base, a, b);
        return { id: `clip-${String(i + 1).padStart(2, "0")}`, title: k.title, segments: segs, durationMs: totalMs(segs), reason: k.reasons.join("; "), score: k.score };
      });
      variants = c.keepPrincipal || !clipVariants.length ? [principal, ...clipVariants] : clipVariants;
      notes.push(`${clipVariants.length} clips propuestos por el planificador ${planner}`);
    }

    // Versiones cortas del vídeo: el mejor fragmento continuo que quepa en cada duración
    for (const target of c.shortVersions) {
      const best = selectClips(clipCandidates(sentences, { minMs: target * 600, maxMs: target * 1000, boundaries, mode: c.editMode as EditMode }), 1)[0];
      if (!best) {
        warn(ctx, "plan", "sin_corto", `No hay un fragmento continuo de ${target} s o menos que empiece y termine en frase completa`);
        continue;
      }
      const { a, b } = clipRange(sentences, best, durMs);
      const segs = clipSegments(base, a, b);
      const same = variants.find((v) => v.segments[0]?.srcStartMs === segs[0]?.srcStartMs && v.durationMs === totalMs(segs));
      if (same) {
        notes.push(`Versión corta de ${target} s: es el mismo fragmento que ${same.id}; no se duplica`);
        continue;
      }
      variants.push({ id: `corto-${target}s`, title: best.title, segments: segs, durationMs: totalMs(segs), reason: best.reasons.join("; "), score: best.score });
      notes.push(`Versión corta de ${target} s: "${best.title}"`);
    }
    for (const cl of claims) warn(ctx, "plan", "afirmacion", `Afirmación a verificar antes de publicar (${(cl.startMs / 1000).toFixed(1)} s): "${cl.text}" — ${cl.reason}`);
    editorial = { mode: c.editMode, planner, sentences: sentences.length, keywords: kw, boundaries, claims, rejected };
    if (kw.length) notes.push(`Conceptos destacados: ${kw.join(", ")}`);
  } else if (wantsClips || c.shortVersions.length) {
    warn(ctx, "plan", "sin_transcripcion", "Sin transcripción por palabras no se pueden proponer clips ni versiones cortas: se entrega solo el vídeo principal");
  }

  // Recursos autorizados: B-roll y música
  const rejectedResources: EditorialResult["rejectedResources"] = [];
  let broll: EditorialResult["broll"] = [];
  if (c.broll && sentences.length) {
    const lib = await loadLibrary({ libraryDir: ctx.cfg.HH_LIBRARY_DIR, clientsDir: ctx.cfg.HH_CLIENTS_DIR, clientId: ctx.job.clientId, kind: "broll" });
    rejectedResources.push(...lib.rejected);
    const picks = matchBroll(sentences, lib.items, durMs);
    broll = picks.map((p) => ({
      id: p.item.id,
      src: p.item.src,
      kind: p.item.kind as "image" | "video",
      presentation: p.item.presentation,
      startMs: p.startMs,
      endMs: p.endMs,
      matched: p.matched,
      credit: credit(p.item),
    }));
    notes.push(
      lib.items.length
        ? `B-roll: ${broll.length} inserciones de la biblioteca (${lib.items.length} recursos con licencia disponibles)`
        : "B-roll: la biblioteca no tiene recursos con licencia; no se añade ninguno",
    );
  }
  let music: EditorialResult["music"] = null;
  if (c.music) {
    const lib = await loadLibrary({ libraryDir: ctx.cfg.HH_LIBRARY_DIR, clientsDir: ctx.cfg.HH_CLIENTS_DIR, clientId: ctx.job.clientId, kind: "music" });
    rejectedResources.push(...lib.rejected);
    const m = pickMusic(lib.items, prof.music.mood, c.musicId);
    if (m) {
      music = { id: m.id, src: m.src, credit: credit(m) };
      notes.push(`Música: ${m.id} (${m.license.type})`);
    } else {
      notes.push(c.musicId ? `Música: no existe "${c.musicId}" con licencia en la biblioteca; sin música` : "Música: no hay pistas con licencia en la biblioteca; sin música");
    }
  }
  for (const r of rejectedResources) warn(ctx, "plan", "recurso_rechazado", `Recurso de biblioteca no usado (${r.where}): ${r.reason}`);
  return { variants, editorial, broll, music, rejectedResources, notes };
};
