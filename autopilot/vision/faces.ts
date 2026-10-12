import { spawn } from "node:child_process";
import path from "node:path";
import type { FocusKey } from "../../src/autopilot/geometry";
import { pythonExecutable, ROOT, type Config } from "../config";
import { exists, sha256File } from "../util/fs";

// Detección de caras con YuNet (models/) a través de autopilot/python/faces.py.
// ffmpeg decodifica a pocos fps y baja resolución; Python solo recibe píxeles por stdin.

export const FACE_MODEL = path.join(ROOT, "models", "face_detection_yunet_2023mar.onnx");
const FACE_MODEL_SHA256 = "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4";

export type FaceBox = { x: number; y: number; w: number; h: number; score: number };
export type FaceSample = { tMs: number; faces: FaceBox[] };
export type FaceDetection = { ok: true; fps: number; samples: FaceSample[] } | { ok: false; reason: string };

export const detectFaces = async (cfg: Config, video: string, srcW: number, srcH: number): Promise<FaceDetection> => {
  if (!exists(FACE_MODEL) || (await sha256File(FACE_MODEL)) !== FACE_MODEL_SHA256) {
    return { ok: false, reason: "Falta el modelo de caras o no coincide su sha256 (models/README.md)" };
  }
  // Lado largo a 640 px: suficiente para caras de plano medio y rápido en CPU
  const scale = 640 / Math.max(srcW, srcH);
  const w = Math.max(2, Math.round((srcW * scale) / 2) * 2);
  const h = Math.max(2, Math.round((srcH * scale) / 2) * 2);
  const fps = cfg.HH_FACE_FPS;
  return new Promise((resolve) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-i", video, "-an", "-vf", `fps=${fps},scale=${w}:${h}`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const py = spawn(pythonExecutable(cfg), ["-I", path.join(ROOT, "autopilot", "python", "faces.py"), "--model", FACE_MODEL, "--width", String(w), "--height", String(h)], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    ff.stdout.pipe(py.stdin);
    py.stdin.on("error", () => undefined); // si Python termina antes (dependencia ausente)
    let out = "";
    let err = "";
    py.stdout.on("data", (d) => (out += d));
    py.stderr.on("data", (d) => (err += d));
    ff.stderr.on("data", (d) => (err += d));
    py.on("error", (e) => resolve({ ok: false, reason: `No se pudo ejecutar Python (${e.message}). Ejecuta npm run setup:python` }));
    py.on("close", (code) => {
      ff.kill();
      const lines = out.split("\n").filter(Boolean).map((l) => JSON.parse(l) as { i?: number; faces?: number[][]; error?: string });
      const e = lines.find((l) => l.error);
      if (e || code === 3) return resolve({ ok: false, reason: `${e?.error ?? "falta OpenCV"}. Ejecuta npm run setup:python` });
      if (code !== 0) return resolve({ ok: false, reason: `La detección de caras falló (código ${code}): ${err.trim().split("\n").pop() ?? ""}` });
      resolve({
        ok: true,
        fps,
        samples: lines.map((l) => ({
          tMs: Math.round(((l.i ?? 0) * 1000) / fps),
          faces: (l.faces ?? []).map(([x, y, fw, fh, score]) => ({ x, y, w: fw, h: fh, score })),
        })),
      });
    });
  });
};

// Descarta caras mucho más pequeñas que la cara principal habitual del vídeo (avatares, fotos de fondo,
// público lejano): por debajo de `ratio` × la mediana del ancho de la cara más grande de cada muestra.
export const significantFaces = (samples: FaceSample[], ratio = 0.35): FaceSample[] => {
  const widths = samples
    .filter((s) => s.faces.length)
    .map((s) => Math.max(...s.faces.map((f) => f.w)))
    .sort((a, b) => a - b);
  if (!widths.length) return samples;
  const median = widths[Math.floor(widths.length / 2)];
  return samples.map((s) => ({ tMs: s.tMs, faces: s.faces.filter((f) => f.w >= median * ratio) }));
};

// Cara principal de cada muestra: la más grande, con preferencia por la que estaba cerca de la anterior
export const primaryFaces = (samples: FaceSample[]) => {
  let prev: FaceBox | null = null;
  return samples.map((s) => {
    if (!s.faces.length) return { tMs: s.tMs, face: null as FaceBox | null };
    const scored = s.faces.map((f) => {
      const near = prev && Math.abs(f.x + f.w / 2 - (prev.x + prev.w / 2)) < 0.15 ? 1.5 : 1;
      return { f, v: f.w * f.h * near };
    });
    const best = scored.sort((a, b) => b.v - a.v)[0].f;
    prev = best;
    return { tMs: s.tMs, face: best };
  });
};

// Trayectoria del foco con histéresis: el encuadre solo se mueve si la cara se aleja más de deadZone
// durante al menos holdMs, y entonces se desplaza suavemente en moveMs. Así no "persigue" cada gesto.
export const buildFocusTrack = (
  samples: FaceSample[],
  opts: { deadZone?: number; holdMs?: number; moveMs?: number; fallback: { x: number; y: number } },
): FocusKey[] => {
  const dead = opts.deadZone ?? 0.08;
  const hold = opts.holdMs ?? 800;
  const move = opts.moveMs ?? 500;
  const prim = primaryFaces(samples).filter((p) => p.face) as { tMs: number; face: FaceBox }[];
  if (!prim.length) return [];
  const center = (f: FaceBox) => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 });
  let cur = center(prim[0].face);
  const keys: FocusKey[] = [{ tMs: 0, ...cur }];
  let pendingSince: number | null = null;
  for (const p of prim) {
    const c = center(p.face);
    const far = Math.abs(c.x - cur.x) > dead || Math.abs(c.y - cur.y) > dead * 1.5;
    if (!far) {
      pendingSince = null;
      continue;
    }
    if (pendingSince === null) pendingSince = p.tMs;
    if (p.tMs - pendingSince >= hold) {
      const t0 = Math.max(keys[keys.length - 1].tMs + 1, p.tMs);
      keys.push({ tMs: t0, ...cur }, { tMs: t0 + move, ...c });
      cur = c;
      pendingSince = null;
    }
  }
  return keys.map((k) => ({ tMs: Math.round(k.tMs), x: Number(k.x.toFixed(4)), y: Number(k.y.toFixed(4)) }));
};
