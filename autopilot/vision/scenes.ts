import path from "node:path";
import { run, runOk } from "../util/exec";

// Cambios de plano con el filtro "scene" de ffmpeg (a baja resolución) y un fotograma representativo
// por escena (el del centro), con un máximo configurable para no generar cientos de imágenes.

export type Scene = { startMs: number; endMs: number; frame: string | null };

export const detectScenes = async (video: string, durationMs: number, threshold = 0.3): Promise<number[]> => {
  const r = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", video, "-an", "-vf", `scale=320:-2,select='gt(scene,${threshold})',metadata=print:file=-`, "-f", "null", "-"], {
    timeoutMs: 1_800_000,
  });
  const times = [...r.stdout.matchAll(/pts_time:([\d.]+)/g)].map((m) => Math.round(Number(m[1]) * 1000));
  return times.filter((t) => t > 200 && t < durationMs - 200);
};

export const scenesWithFrames = async (video: string, durationMs: number, outDir: string, maxFrames: number): Promise<Scene[]> => {
  const cuts = await detectScenes(video, durationMs);
  const bounds = [0, ...cuts, durationMs];
  const scenes: Scene[] = bounds.slice(0, -1).map((s, i) => ({ startMs: s, endMs: bounds[i + 1], frame: null }));
  // Fotogramas de las escenas más largas, hasta maxFrames
  const chosen = [...scenes].sort((a, b) => b.endMs - b.startMs - (a.endMs - a.startMs)).slice(0, maxFrames);
  for (const sc of chosen) {
    const i = scenes.indexOf(sc);
    const name = `escena_${String(i + 1).padStart(3, "0")}.jpg`;
    const t = (sc.startMs + sc.endMs) / 2000;
    await runOk("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(3), "-i", video, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", path.join(outDir, name)]);
    sc.frame = name;
  }
  return scenes;
};
