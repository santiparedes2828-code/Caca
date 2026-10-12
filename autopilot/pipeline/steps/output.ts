import { promises as fs } from "node:fs";
import path from "node:path";
import type { EditProps } from "../../../src/autopilot/props";
import { FORMATS } from "../../../src/design/schema";
import { buildCaptions } from "../../captions/build";
import { ROOT } from "../../config";
import { pagesOverFaces, placeCaptions } from "../../edit/placement";
import { remapItems, remapTime, remapTrack, toFrameSegments } from "../../edit/timeline";
import { cancelRequested, saveJob } from "../../jobs/store";
import { runQc, type QcResult } from "../../qc/qc";
import { reportMarkdown } from "../../qc/report";
import { startAssetServer } from "../../render/assetServer";
import { getBundle } from "../../render/bundle";
import { renderEdit } from "../../render/render";
import { runOk } from "../../util/exec";
import { exists, readJson, sha256, writeJsonAtomic, writeTextAtomic } from "../../util/fs";
import { significantFaces, type FaceDetection, type FaceSample } from "../../vision/faces";
import {
  O,
  StepError,
  variantDir,
  W,
  warn,
  type Analysis,
  type ComposeIndex,
  type Ctx,
  type PlanArtifact,
  type Prepared,
  type RenderIndex,
  type SourceCaptions,
  type Variant,
  type VariantCaptions,
} from "../context";

// Pasos de salida, uno por variante (vídeo principal y, desde la Etapa 3, clips):
// composición de props → render → control de calidad → entrega e informe.

const facesFor = async (ctx: Ctx, v: Variant): Promise<FaceSample[]> => {
  if (!exists(W(ctx, "faces.json"))) return [];
  const d = await readJson<FaceDetection>(W(ctx, "faces.json"));
  if (!d.ok) return [];
  return significantFaces(d.samples).flatMap((s) => {
    const t = remapTime(v.segments, s.tMs);
    return t === null ? [] : [{ tMs: t, faces: s.faces }];
  });
};

export const compose = async (ctx: Ctx) => {
  const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
  const src = await readJson<SourceCaptions>(W(ctx, "source-captions.json"));
  const plan = await readJson<PlanArtifact>(W(ctx, "plan.json"));
  const { config } = ctx.job;
  for (const f of ctx.profile.brand.fonts) {
    if (f.src.startsWith("static:") && !exists(path.join(ROOT, "public", f.src.slice(7)))) {
      throw new StepError("recurso_faltante", `Falta la fuente de marca ${f.family} ${f.weight}: public/${f.src.slice(7)}`);
    }
  }
  const v = prep.probe.video;
  if (!v) throw new StepError("sin_video", "La copia de trabajo no tiene vídeo");
  const size = FORMATS[config.format];

  // Ampliar el vídeo más de 1,5× (p. ej. 576 px → 1080 px) se nota borroso en pantalla
  const fit = config.reframe.mode === "cover" ? Math.max : Math.min;
  const scale = fit(size.width / v.width, size.height / v.height);
  if (scale > 1.5) {
    warn(
      ctx,
      "compose",
      "baja_resolucion",
      `El original (${v.width}x${v.height}) se amplía ×${scale.toFixed(2)} para ${size.width}x${size.height}: perderá nitidez. Pide al cliente el archivo original en mayor resolución si lo tiene`,
    );
  }
  const srcRatio = v.width / v.height;
  const outRatio = size.width / size.height;
  if (Math.abs(srcRatio - outRatio) > 0.02 && config.reframe.mode === "cover") {
    const kept = srcRatio > outRatio ? outRatio / srcRatio : srcRatio / outRatio;
    const how = plan.focusTrack.length ? "el encuadre sigue a la cara principal" : `foco fijo x=${config.reframe.focusX}, y=${config.reframe.focusY}`;
    warn(
      ctx,
      "compose",
      "reencuadre",
      `Reencuadre ${v.width}x${v.height} → ${size.width}x${size.height} recortando (se conserva el ${(kept * 100).toFixed(0)} % del ${srcRatio > outRatio ? "ancho" : "alto"}; ${how})`,
    );
  }

  const index: ComposeIndex = { variants: [] };
  for (const variant of plan.variants) {
    const dir = variantDir(ctx, variant.id);
    await fs.mkdir(dir, { recursive: true });
    const segments = toFrameSegments(variant.segments, config.fps);
    const durationInFrames = segments.reduce((n, s) => n + s.durationInFrames, 0);
    const durationMs = (durationInFrames / config.fps) * 1000;
    const faces = await facesFor(ctx, variant);
    const focusTrack = config.followFaces ? remapTrack(variant.segments, plan.focusTrack).filter((k) => k.tMs <= durationMs) : [];

    let caps: VariantCaptions = { none: true };
    if (!src.none) {
      const items = remapItems(variant.segments, src.items).filter((w) => w.startMs < durationMs);
      const built = buildCaptions({
        loaded: { precision: src.precision, items, warnings: src.warnings, source: src.source },
        mode: config.captionMode,
        intensity: config.intensity,
        brand: ctx.profile.brand,
        allowEstimatedWordTiming: config.allowEstimatedWordTiming,
        trimStartMs: 0,
        durationMs,
        keywords: plan.editorial?.keywords,
      });
      for (const w of built.warnings) warn(ctx, "compose", "subtitulos", w);
      const placementInput = {
        pages: built.pages,
        brand: ctx.profile.brand,
        mode: built.mode,
        W: size.width,
        H: size.height,
        srcW: v.width,
        srcH: v.height,
        reframe: config.reframe,
        focusTrack,
        faces,
      };
      const placed = ctx.profile.defaults.editing.avoidFaces && faces.length ? placeCaptions(placementInput) : { pages: built.pages, moved: 0, blocked: 0 };
      const overFaces = faces.length ? pagesOverFaces({ ...placementInput, pages: placed.pages }) : 0;
      if (placed.moved) ctx.log.info(`${placed.moved} páginas de subtítulos movidas para no tapar caras`);
      caps = { none: false, ...built, pages: placed.pages, transcription: src.transcription, placement: { moved: placed.moved, blocked: placed.blocked, overFaces } };
    }
    // B-roll y música de esta variante (sus tiempos pasan al eje del vídeo final)
    const overlays = (plan.broll ?? []).flatMap((b) => {
      const a = remapTime(variant.segments, b.startMs);
      const e = remapTime(variant.segments, b.endMs);
      // Nunca en los 2,5 primeros segundos: el gancho se dice mirando a cámara
      return a === null || e === null || e - a < 800 || a < 2500 ? [] : [{ startMs: a, endMs: e, src: b.src, kind: b.kind }];
    });
    const speech = src.none ? [] : remapItems(variant.segments, [...src.items, ...src.events.map((e) => ({ text: "·", ...e }))]).map((w) => ({ startMs: w.startMs, endMs: w.endMs }));
    const mus = ctx.profile.defaults.editorial.music;
    const db = (d: number) => Number((10 ** (d / 20)).toFixed(4));
    const music = plan.music
      ? { src: plan.music.src, gain: db(mus.volumeDb), duckGain: db(mus.volumeDb + mus.duckDb), fadeInMs: 800, fadeOutMs: 1200, speech }
      : null;
    const props: EditProps = {
      fps: config.fps,
      width: size.width,
      height: size.height,
      durationInFrames,
      video: { src: "job:source.mp4", width: v.width, height: v.height, hasAudio: !!prep.probe.audio, volume: 1, segments },
      reframe: config.reframe,
      focusTrack,
      overlays,
      music,
      intensity: config.intensity,
      brand: ctx.profile.brand,
      captions: caps.none ? { mode: config.captionMode, pages: [] } : { mode: caps.mode, pages: caps.pages },
    };
    await writeJsonAtomic(path.join(dir, "captions.json"), caps);
    await writeJsonAtomic(path.join(dir, "props.json"), props);
    index.variants.push(variant.id);
  }
  await writeJsonAtomic(W(ctx, "compose.json"), index);
};

export const render = async (ctx: Ctx) => {
  const index = await readJson<ComposeIndex>(W(ctx, "compose.json"));
  const prev: RenderIndex = exists(W(ctx, "render.json")) ? await readJson<RenderIndex>(W(ctx, "render.json")) : { variants: {} };
  const bundle = await getBundle((m) => ctx.log.info(m));
  const sourceSize = (await fs.stat(W(ctx, "source.mp4"))).size;
  const out: RenderIndex = { variants: {} };
  const server = await startAssetServer({
    job: W(ctx),
    client: path.join(ctx.cfg.HH_CLIENTS_DIR, ctx.job.clientId, "assets"),
    library: ctx.cfg.HH_LIBRARY_DIR,
    clientlib: path.join(ctx.cfg.HH_CLIENTS_DIR, ctx.job.clientId, "library"),
  });
  // "library:broll/x.jpg" → URL del servidor local (solo esas carpetas están montadas)
  const live = (ref: string) => {
    const i = ref.indexOf(":");
    return server.url(ref.slice(0, i), ref.slice(i + 1));
  };
  try {
    for (const [k, id] of index.variants.entries()) {
      const dir = variantDir(ctx, id);
      const props = await readJson<EditProps>(path.join(dir, "props.json"));
      const key = sha256(JSON.stringify(props) + bundle.hash + sourceSize);
      const file = path.join("variants", id, "render.mp4");
      if (prev.variants[id]?.key === key && exists(W(ctx, file))) {
        ctx.log.info(`[${id}] render ya hecho con las mismas entradas: no se repite`);
        out.variants[id] = prev.variants[id];
        continue;
      }
      const liveProps: EditProps = {
        ...props,
        video: { ...props.video, src: live(props.video.src) },
        overlays: props.overlays.map((o) => ({ ...o, src: live(o.src) })),
        music: props.music ? { ...props.music, src: live(props.music.src) } : null,
        brand: {
          ...props.brand,
          fonts: props.brand.fonts.map((f) => (f.src.startsWith("client:") ? { ...f, src: `url:${server.url("client", f.src.slice(7))}` } : f)),
        },
      };
      const partial = path.join(dir, "render.partial.mp4");
      const t0 = Date.now();
      let last = 0;
      await renderEdit({
        cfg: ctx.cfg,
        serveUrl: bundle.serveUrl,
        props: liveProps,
        output: partial,
        shouldCancel: () => cancelRequested(ctx.cfg, ctx.job),
        onBrowserError: (m) => ctx.log.warn(`Navegador: ${m}`),
        onProgress: (p) => {
          if (p - last >= 0.1 || p === 1) {
            last = p;
            ctx.log.info(`[${id}] render ${(p * 100).toFixed(0)} %`);
            ctx.job.progress = 0.4 + 0.45 * ((k + p) / index.variants.length);
            void saveJob(ctx.cfg, ctx.job).catch(() => undefined);
          }
        },
      });
      // moov al principio: reproducción inmediata en web/móvil
      await runOk("ffmpeg", ["-v", "error", "-y", "-i", partial, "-c", "copy", "-movflags", "+faststart", path.join(dir, "render.faststart.mp4")]);
      await fs.rename(path.join(dir, "render.faststart.mp4"), W(ctx, file));
      await fs.rm(partial, { force: true });
      ctx.log.info(`[${id}] render terminado en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      out.variants[id] = { key, file };
      await writeJsonAtomic(W(ctx, "render.json"), { variants: { ...prev.variants, ...out.variants } });
    }
  } finally {
    await server.close();
  }
  await writeJsonAtomic(W(ctx, "render.json"), out);
  ctx.job.renderKey = sha256(JSON.stringify(out));
};

type QcIndex = { verdict: QcResult["verdict"]; variants: Record<string, QcResult> };
const worst = (vs: QcResult["verdict"][]) => (vs.includes("FALLIDO") ? "FALLIDO" : vs.includes("ADVERTENCIA") ? "ADVERTENCIA" : "APROBADO");

export const qc = async (ctx: Ctx) => {
  const index = await readJson<ComposeIndex>(W(ctx, "compose.json"));
  const rendered = await readJson<RenderIndex>(W(ctx, "render.json"));
  const prep = await readJson<Prepared>(W(ctx, "prepare.json"));
  const res: QcIndex = { verdict: "APROBADO", variants: {} };
  for (const id of index.variants) {
    const dir = variantDir(ctx, id);
    const props = await readJson<EditProps>(path.join(dir, "props.json"));
    const caps = await readJson<VariantCaptions>(path.join(dir, "captions.json"));
    const qcDir = O(ctx, "qc", id);
    await fs.mkdir(qcDir, { recursive: true });
    const r = await runQc({
      output: W(ctx, rendered.variants[id].file),
      source: W(ctx, "source.mp4"),
      qcDir,
      expected: {
        width: props.width,
        height: props.height,
        fps: props.fps,
        durationSec: props.durationInFrames / props.fps,
        hasAudio: props.video.hasAudio || !!props.music,
      },
      audioTarget: { lufs: ctx.job.config.audio.targetLufs, truePeakDb: ctx.job.config.audio.truePeakDb, normalized: prep.normalized },
      captions: caps.none
        ? null
        : {
            pages: caps.pages,
            srt: caps.srt,
            maxCharsPerLine: ctx.profile.brand.captions.maxCharsPerLine,
            mode: caps.mode,
            transcription: caps.transcription,
            overFaces: caps.placement.overFaces,
          },
      captionsRequired: ctx.job.config.captionsRequired,
      frames: ctx.cfg.HH_QC_FRAMES,
    });
    res.variants[id] = r;
    for (const c of r.checks) ctx.log[c.status === "ok" ? "info" : "warn"](`[${id}] QC ${c.status}: ${c.label} — ${c.detail}`);
  }
  res.verdict = worst(Object.values(res.variants).map((r) => r.verdict));
  ctx.job.verdict = res.verdict;
  await writeJsonAtomic(W(ctx, "qc.json"), res);
};

// Entrega: MP4 + SRT por variante + informe. Una variante FALLIDA no se entrega (queda en work/).
export const deliver = async (ctx: Ctx) => {
  const qcIdx = await readJson<QcIndex>(W(ctx, "qc.json"));
  const plan = await readJson<PlanArtifact>(W(ctx, "plan.json"));
  const rendered = await readJson<RenderIndex>(W(ctx, "render.json"));
  const analysis = await readJson<Analysis>(W(ctx, "analysis.json"));
  const src = await readJson<SourceCaptions>(W(ctx, "source-captions.json"));
  // Una entrega nueva sustituye a la anterior: se retiran los vídeos y SRT de variantes que ya no existen
  for (const o of ctx.job.outputs) {
    if (o.kind === "video" || o.kind === "subtitulos_srt") await fs.rm(path.join(ctx.dir, o.path), { force: true });
  }
  ctx.job.outputs = [];
  const failed: string[] = [];
  const sections = [];
  for (const variant of plan.variants) {
    const r = qcIdx.variants[variant.id];
    const caps = await readJson<VariantCaptions>(path.join(variantDir(ctx, variant.id), "captions.json"));
    const base = variant.id === "principal" ? `${ctx.job.id}_${ctx.job.config.format}` : `${ctx.job.id}_${variant.id}_${ctx.job.config.format}`;
    if (r.verdict !== "FALLIDO") {
      await fs.copyFile(W(ctx, rendered.variants[variant.id].file), O(ctx, `${base}.mp4`));
      ctx.job.outputs.push({ kind: "video", path: `output/${base}.mp4`, variant: variant.id });
      if (!caps.none) {
        await writeTextAtomic(O(ctx, `${base}.srt`), caps.srt);
        ctx.job.outputs.push({ kind: "subtitulos_srt", path: `output/${base}.srt`, variant: variant.id });
      }
    } else {
      failed.push(`${variant.id}: ${r.checks.filter((c) => c.status === "fallo").map((c) => `${c.label}: ${c.detail}`).join(" · ")}`);
    }
    if (r.sheet) ctx.job.outputs.push({ kind: "fotogramas_qc", path: `output/qc/${variant.id}/${r.sheet}`, variant: variant.id });
    sections.push({ variant, qc: r, captions: caps });
  }
  ctx.job.outputs.push({ kind: "informe", path: "output/informe.md" }, { kind: "informe_json", path: "output/informe.json" });
  const delivered = plan.variants.length - failed.length;
  // Afirmaciones sin verificar (anuncios) o recursos de terceros con atribución: siempre revisión humana
  const mustReview = (plan.editorial?.claims.length ?? 0) > 0;
  ctx.job.status = delivered === 0 ? "fallido" : qcIdx.verdict === "APROBADO" && !mustReview ? "completado" : "requiere_revision";
  if (failed.length) ctx.job.errors.push({ step: "qc", code: "qc_fallido", message: `No entregable. ${failed.join(" | ")}` });

  const o = analysis.original;
  const caps0 = sections[0]?.captions;
  const summary = {
    duración: `${o.durationSec.toFixed(2)} s`,
    vídeo: o.video ? `${o.video.width}x${o.video.height} · ${o.video.fps.toFixed(2)} fps · ${o.video.codec}${o.video.variableFrameRate ? " · VFR" : ""}` : "—",
    audio: o.audio ? `${o.audio.codec} · ${o.audio.channels} canales · ${o.audio.sampleRate} Hz` : "sin audio",
    sonoridad: analysis.loudness ? `${analysis.loudness.integratedLufs.toFixed(1)} LUFS · pico ${analysis.loudness.truePeakDb.toFixed(1)} dBTP` : "—",
    silencios: `${analysis.silences.count} (≥ 0,5 s) · ${analysis.silences.totalSec} s en total`,
    escenas: `${plan.scenes.length} (fotogramas representativos en work/escenas/)`,
    caras: plan.faces.status === "ok" ? `${plan.faces.withFace} de ${plan.faces.samples} muestras con cara` : plan.faces.status === "desactivado" ? "no analizadas" : `no disponible: ${plan.faces.reason}`,
    cortes: plan.cuts.count ? `${plan.cuts.count} silencios recortados (${(plan.cuts.removedMs / 1000).toFixed(1)} s)` : "ninguno",
    subtítulos:
      !caps0 || caps0.none
        ? "ninguno"
        : `${caps0.precision === "word" ? "por palabra" : caps0.precision === "segment" ? "por bloque" : "por palabra ESTIMADOS"} · modo ${caps0.mode}${caps0.mode !== caps0.requestedMode ? ` (pedido ${caps0.requestedMode})` : ""}`,
    transcripción:
      src.none || !src.transcription
        ? "no (subtítulos aportados por el cliente o sin subtítulos)"
        : `${src.transcription.provider} ${src.transcription.model} · ${src.transcription.source === "cache" ? "reutilizada de caché, sin coste" : "llamada a la API"} · ${src.transcription.words} palabras`,
  };
  const variants = sections.map((s) => ({ id: s.variant.id, title: s.variant.title, durationMs: s.variant.durationMs, reason: s.variant.reason, qc: s.qc }));
  const credits = [...new Set([...(plan.broll ?? []).map((b) => b.credit), ...(plan.music ? [plan.music.credit] : [])])];
  await writeJsonAtomic(O(ctx, "informe.json"), {
    job: ctx.job,
    analysis: summary,
    plan: { notes: plan.notes, cuts: plan.cuts, editorial: plan.editorial, credits },
    variants,
  });
  await writeTextAtomic(O(ctx, "informe.md"), reportMarkdown(ctx.job, variants, { analysis: summary, notes: plan.notes, credits }));
};
