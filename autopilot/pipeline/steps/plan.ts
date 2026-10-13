import { promises as fs } from "node:fs";
import { planGraficos } from "../../edit/graficos";
import { planSilenceCuts, totalMs, type Interval } from "../../edit/timeline";
import { silences } from "../../media/probe";
import { exists, readJson, writeJsonAtomic, writeTextAtomic } from "../../util/fs";
import { buildFocusTrack, detectFaces, significantFaces, type FaceDetection } from "../../vision/faces";
import { scenesWithFrames, type Scene } from "../../vision/scenes";
import { O, W, warn, type Ctx, type PlanArtifact, type Prepared, type SourceCaptions } from "../context";
import { planEditorial } from "./editorial";

// Planificación (Etapa 2): análisis visual de la copia de trabajo y decisiones de edición seguras.
//   - caras → trayectoria del encuadre y datos para que los subtítulos no las tapen
//   - escenas → cambios de plano y fotogramas representativos (base para la Etapa 3)
//   - silencios sin voz → cortes no destructivos
//   - cortinilla final de redes (p. ej. la de TikTok) → solo se avisa

const faceData = async (ctx: Ctx, prep: Prepared): Promise<FaceDetection | null> => {
  const { followFaces } = ctx.job.config;
  const avoid = ctx.profile.defaults.editing.avoidFaces;
  if (!followFaces && !avoid) return null;
  const file = W(ctx, "faces.json");
  if (exists(file)) return readJson<FaceDetection>(file);
  const v = prep.probe.video!;
  ctx.log.info("Detectando caras…");
  const d = await detectFaces(ctx.cfg, W(ctx, "source.mp4"), v.width, v.height);
  await writeJsonAtomic(file, d);
  return d;
};

export const plan = async (ctx: Ctx) => {
  const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
  const src = await readJson<SourceCaptions>(W(ctx, "source-captions.json"));
  const durMs = Math.round(prep.durationSec * 1000);
  const cfgJob = ctx.job.config;
  const ed = ctx.profile.defaults.editing;
  const notes: string[] = [];

  // Caras
  const faces = await faceData(ctx, prep);
  let facesInfo: PlanArtifact["faces"] = { status: "desactivado", reason: null, samples: 0, withFace: 0 };
  let focusTrack: PlanArtifact["focusTrack"] = [];
  if (faces && !faces.ok) {
    facesInfo = { status: "no_disponible", reason: faces.reason, samples: 0, withFace: 0 };
    warn(ctx, "plan", "caras_no_disponible", `Detección de caras no disponible (${faces.reason}): encuadre fijo y subtítulos en su posición por defecto`);
  } else if (faces?.ok) {
    faces.samples = significantFaces(faces.samples);
    const withFace = faces.samples.filter((s) => s.faces.length).length;
    facesInfo = { status: "ok", reason: null, samples: faces.samples.length, withFace };
    if (cfgJob.followFaces && withFace) {
      focusTrack = buildFocusTrack(faces.samples, { fallback: { x: cfgJob.reframe.focusX, y: cfgJob.reframe.focusY } });
      notes.push(`Encuadre siguiendo la cara principal (${focusTrack.length} puntos de control)`);
    }
    if (!withFace) notes.push("No se detectaron caras: encuadre fijo");
  }

  // Escenas y fotogramas representativos
  const scenesFile = W(ctx, "scenes.json");
  let scenes: Scene[];
  if (exists(scenesFile)) scenes = await readJson<Scene[]>(scenesFile);
  else {
    await fs.mkdir(W(ctx, "escenas"), { recursive: true });
    scenes = await scenesWithFrames(W(ctx, "source.mp4"), durMs, W(ctx, "escenas"), 12);
    await writeJsonAtomic(scenesFile, scenes);
  }

  // Cortinilla final: última escena corta, sin caras, cuando el resto del vídeo sí las tiene
  let tailCard: PlanArtifact["tailCard"] = null;
  const last = scenes[scenes.length - 1];
  if (faces?.ok && scenes.length > 1 && durMs - last.startMs <= 4000) {
    const inLast = faces.samples.filter((s) => s.tMs >= last.startMs);
    const before = faces.samples.filter((s) => s.tMs < last.startMs);
    const ratioBefore = before.length ? before.filter((s) => s.faces.length).length / before.length : 0;
    if (inLast.length && inLast.every((s) => !s.faces.length) && ratioBefore >= 0.6) {
      tailCard = { startMs: last.startMs };
      warn(
        ctx,
        "plan",
        "cortinilla_final",
        `Posible cortinilla final de otra plataforma desde ${(last.startMs / 1000).toFixed(1)} s (escena final sin personas). Si sobra, recórtala con --hasta ${(last.startMs / 1000).toFixed(1)}`,
      );
    }
  }

  // Cortes de silencio (no destructivos)
  let segments = [{ srcStartMs: 0, srcEndMs: durMs }];
  let cuts: Interval[] = [];
  if (cfgJob.cutSilences && prep.probe.audio) {
    const sil = (await silences(W(ctx, "source.mp4"), ed.silenceDb, ed.minSilenceSec)).map((s) => ({
      startMs: Math.round(s.startSec * 1000),
      endMs: Math.round(Math.min(s.endSec * 1000, durMs)),
    }));
    const speech = src.none ? [] : [...src.items, ...src.events];
    const r = planSilenceCuts({ durationMs: durMs, silences: sil, speech, minSilenceMs: ed.minSilenceSec * 1000, keepPauseMs: ed.keepPauseSec * 1000 });
    segments = r.segments;
    cuts = r.cuts;
    if (cuts.length) {
      notes.push(`${cuts.length} silencios recortados (${((durMs - totalMs(segments)) / 1000).toFixed(1)} s); se deja una pausa de ${ed.keepPauseSec} s`);
    }
    if (src.none) notes.push("Cortes de silencio sin transcripción: solo se ha usado el nivel de audio");
  }

  const ed2 = await planEditorial(ctx, src, segments, durMs);
  notes.push(...ed2.notes);
  // Apoyos gráficos (vídeos hablados): solo con tiempos por palabra reales y lejos del B-roll
  let graficos: PlanArtifact["graficos"] = [];
  if (cfgJob.graficos && !src.none && src.precision === "word") {
    const g = planGraficos(src.items, { durationMs: durMs, busy: ed2.broll });
    graficos = g.graphics;
    notes.push(...g.notes);
  }
  const artifact: PlanArtifact = {
    mode: ctx.job.config.editMode,
    variants: ed2.variants,
    cuts: { count: cuts.length, removedMs: durMs - totalMs(segments) },
    faces: facesInfo,
    focusTrack,
    scenes,
    tailCard,
    notes,
    editorial: ed2.editorial,
    broll: ed2.broll,
    graficos,
    music: ed2.music,
    rejectedResources: ed2.rejectedResources,
  };
  for (const n of notes) ctx.log.info(n);
  await writeJsonAtomic(W(ctx, "plan.json"), artifact);
  await writeTextAtomic(O(ctx, "plan.md"), planMarkdown(ctx, artifact));
  // Aprobación humana opcional: el trabajo se detiene aquí hasta `aprobar <id>`
  if (ctx.job.config.approvePlan && !ctx.job.planApproved) {
    ctx.pause = "plan";
    warn(ctx, "plan", "plan_pendiente", "Plan pendiente de aprobación: revisa output/plan.md y ejecuta `npm run autopilot -- aprobar <id>`");
  }
};

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export const planMarkdown = (ctx: Ctx, p: PlanArtifact) => {
  const L = [`# Plan de edición · trabajo ${ctx.job.id}`, "", `Modo: **${p.mode}**${p.editorial ? ` · planificador ${p.editorial.planner}` : ""}`, ""];
  L.push("## Vídeos que se van a generar", "");
  for (const v of p.variants) {
    const first = v.segments[0];
    const last = v.segments[v.segments.length - 1];
    L.push(
      `- **${v.id}**${v.title ? ` — ${v.title}` : ""}: ${(v.durationMs / 1000).toFixed(1)} s (del original ${fmt(first?.srcStartMs ?? 0)}–${fmt(last?.srcEndMs ?? 0)}, ${v.segments.length} tramos)${v.reason ? `. Motivo: ${v.reason}` : ""}`,
    );
  }
  if (p.editorial?.keywords.length) L.push("", `Conceptos destacados: ${p.editorial.keywords.join(", ")}`);
  if (p.editorial?.claims.length) {
    L.push("", "## Afirmaciones a verificar antes de publicar", "");
    for (const c of p.editorial.claims) L.push(`- ${fmt(c.startMs)} "${c.text}" — ${c.reason}`);
  }
  if (p.broll.length) {
    L.push("", "## B-roll", "");
    for (const b of p.broll) L.push(`- ${fmt(b.startMs)}–${fmt(b.endMs)}: ${b.id} (coincide: ${b.matched.join(", ")}) · ${b.credit}`);
  }
  if (p.graficos?.length) {
    L.push("", "## Apoyos gráficos", "");
    for (const g of p.graficos) {
      const what =
        g.kind === "calendario"
          ? `calendario ${g.label} ${g.year}`
          : g.kind === "lista"
            ? `lista: ${g.items.map((i) => i.text).join(" · ")}`
            : g.kind === "cifra"
              ? `cifra: ${g.display} ${g.label}`
              : `comparación: ${g.items.map((i) => `${i.label} ${i.display}`.trim()).join(" → ")}`;
      L.push(`- ${fmt(g.startMs)}–${fmt(g.endMs)}: ${what}`);
    }
    L.push("", "_Para quitar o añadir uno, edita `graficos` en work/plan.json antes de aprobar el plan._");
  }
  if (p.music) L.push("", "## Música", "", `- ${p.music.credit}`);
  if (p.notes.length) L.push("", "## Decisiones", "", ...p.notes.map((n) => `- ${n}`));
  return L.join("\n") + "\n";
};
