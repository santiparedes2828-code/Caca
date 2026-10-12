import { run, runOk } from "../util/exec";
import type { ProbeResult } from "./probe";

// Copia de trabajo del vídeo del cliente (el original queda intacto en input/original/):
// - recorte opcional (trim), rotación aplicada, fps constante, H.264 yuv420p con un fotograma clave por segundo
// - audio AAC 48 kHz estéreo; si se pide, NORMALIZACIÓN de sonoridad EBU R128 en dos pasadas (loudnorm lineal).
//   Es una normalización de nivel, no una restauración: no reduce ruido ni corrige la voz.

export type PrepareResult = { normalized: boolean; measured: null | { inputI: number; inputTp: number }; notes: string[] };

type LoudnormMeasure = { input_i: string; input_tp: string; input_lra: string; input_thresh: string; target_offset: string };

const measureLoudnorm = async (args: string[], target: { i: number; tp: number }): Promise<LoudnormMeasure | null> => {
  const r = await run("ffmpeg", [...args, "-vn", "-af", `loudnorm=I=${target.i}:TP=${target.tp}:LRA=11:print_format=json`, "-f", "null", "-"], {
    timeoutMs: 1_800_000,
  });
  const j = r.stderr.slice(r.stderr.lastIndexOf("{"), r.stderr.lastIndexOf("}") + 1);
  try {
    return JSON.parse(j) as LoudnormMeasure;
  } catch {
    return null;
  }
};

export const prepareWorkingCopy = async (opts: {
  input: string;
  output: string;
  probe: ProbeResult;
  fps: number;
  startSec: number;
  durationSec: number;
  normalize: boolean;
  targetLufs: number;
  truePeakDb: number;
  signal?: AbortSignal;
}): Promise<PrepareResult> => {
  const notes: string[] = [];
  const inArgs = ["-hide_banner", "-nostats", "-y"];
  if (opts.startSec > 0) inArgs.push("-ss", opts.startSec.toFixed(3));
  inArgs.push("-i", opts.input, "-t", opts.durationSec.toFixed(3));

  const v = opts.probe.video!;
  const scale = Math.max(v.width, v.height) > 3840 ? "scale='if(gt(iw,ih),3840,-2)':'if(gt(iw,ih),-2,3840)'," : "";
  const vf = `${scale}fps=${opts.fps},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`;
  const args = [...inArgs, "-map", "0:v:0", "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-g", String(opts.fps)];

  let normalized = false;
  let measured: PrepareResult["measured"] = null;
  if (opts.probe.audio) {
    args.push("-map", "0:a:0");
    let af = "aresample=48000";
    if (opts.normalize) {
      const m = await measureLoudnorm(inArgs.slice(3), { i: opts.targetLufs, tp: opts.truePeakDb });
      const inputI = m ? Number(m.input_i) : Number.NaN;
      if (!m || !Number.isFinite(inputI) || inputI < -70) {
        notes.push("Audio sin señal medible: no se normaliza");
      } else {
        measured = { inputI, inputTp: Number(m.input_tp) };
        af =
          `loudnorm=I=${opts.targetLufs}:TP=${opts.truePeakDb}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
          `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
        normalized = true;
      }
    }
    args.push("-af", af, "-ac", "2", "-c:a", "aac", "-b:a", "192k");
  }
  args.push("-movflags", "+faststart", opts.output);
  await runOk("ffmpeg", args, { timeoutMs: 3_600_000, signal: opts.signal });
  return { normalized, measured, notes };
};
