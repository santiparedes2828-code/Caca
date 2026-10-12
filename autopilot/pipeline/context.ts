import path from "node:path";
import type { FocusKey } from "../../src/autopilot/geometry";
import type { Graphic } from "../../src/autopilot/props";
import type { BuiltCaptions } from "../captions/build";
import type { LoadedCaptions } from "../captions/load";
import type { ClientProfile } from "../clients/profile";
import type { Config } from "../config";
import type { Segment } from "../edit/timeline";
import type { Job, StepName } from "../jobs/types";
import type { PrepareResult } from "../media/prepare";
import type { loudness, ProbeResult, volumeStats } from "../media/probe";
import type { Logger } from "../util/log";
import type { Scene } from "../vision/scenes";

// Contexto y artefactos compartidos por los pasos del pipeline.

export type Ctx = { cfg: Config; job: Job; dir: string; profile: ClientProfile; log: Logger; pause?: "plan" };

export const W = (ctx: Ctx, ...p: string[]) => path.join(ctx.dir, "work", ...p);
export const O = (ctx: Ctx, ...p: string[]) => path.join(ctx.dir, "output", ...p);

export class StepError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const warn = (ctx: Ctx, step: StepName, code: string, message: string) => {
  if (!ctx.job.warnings.some((w) => w.step === step && w.message === message)) ctx.job.warnings.push({ step, code, message });
  ctx.log.warn(message, { step, code });
};

export const videoInput = (job: Job) => {
  const v = job.inputs.find((i) => i.role === "video");
  if (!v) throw new StepError("sin_video", "El trabajo no tiene vídeo de entrada");
  return v;
};

// work/analysis.json
export type Analysis = {
  original: ProbeResult;
  loudness: Awaited<ReturnType<typeof loudness>>;
  volume: Awaited<ReturnType<typeof volumeStats>> | null;
  silences: { count: number; totalSec: number; longestSec: number };
};

// work/prepare.json
export type Prepared = PrepareResult & { probe: ProbeResult; startSec: number; durationSec: number };

export type TranscriptionInfo = {
  provider: string;
  model: string;
  source: "api" | "cache" | "local";
  words: number;
  withConfidence: number;
  lowConfidence: { text: string; startMs: number }[];
};

// work/source-captions.json: subtítulos en el tiempo de la copia de trabajo (antes de cortes)
export type SourceCaptions =
  | { none: true }
  | ({
      none: false;
      transcription: TranscriptionInfo | null;
      events: { startMs: number; endMs: number }[];
      speakers?: (string | null)[]; // hablante de cada elemento (diarización), si se conoce
    } & LoadedCaptions);

// Una variante es un vídeo de salida: el principal o un clip. Sus tramos están en el tiempo de la copia de trabajo.
export type Variant = {
  id: string;
  title: string | null;
  segments: Segment[];
  durationMs: number;
  reason: string | null;
  score: number | null;
};

// work/plan.json
export type PlanArtifact = {
  mode: string;
  variants: Variant[];
  cuts: { count: number; removedMs: number };
  faces: { status: "ok" | "no_disponible" | "desactivado"; reason: string | null; samples: number; withFace: number };
  focusTrack: FocusKey[];
  scenes: Scene[];
  tailCard: { startMs: number } | null;
  notes: string[];
  editorial: null | {
    mode: string;
    planner: "local" | "claude";
    sentences: number;
    keywords: string[];
    boundaries: number[];
    claims: { startMs: number; text: string; reason: string }[];
    rejected: string[];
  };
  // En el tiempo de la copia de trabajo; cada variante toma los que caen en sus tramos
  broll: { id: string; src: string; kind: "image" | "video"; presentation?: "pantalla" | "tarjeta"; startMs: number; endMs: number; matched: string[]; credit: string }[];
  // Apoyos gráficos (calendario, lista) en el tiempo de la copia de trabajo; se pueden editar antes de aprobar el plan
  graficos?: Graphic[];
  music: null | { id: string; src: string; credit: string };
  rejectedResources: { where: string; reason: string }[];
};

// work/variants/<id>/captions.json
export type VariantCaptions =
  | { none: true }
  | ({
      none: false;
      transcription: TranscriptionInfo | null;
      placement: { moved: number; blocked: number; overFaces: number };
      apoyos?: string[]; // apoyos visuales del modo impacto (emojis, páginas destacadas)
    } & BuiltCaptions);

export const variantDir = (ctx: Ctx, id: string) => W(ctx, "variants", id);

// work/compose.json, work/render.json
export type ComposeIndex = { variants: string[] };
export type RenderIndex = { variants: Record<string, { key: string; file: string }> };
