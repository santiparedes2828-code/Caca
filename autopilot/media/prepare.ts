import { run, runOk } from "../util/exec";
import type { ProbeResult } from "./probe";

// Copia de trabajo del vídeo del cliente (el original queda intacto en input/original/):
// - recorte opcional (trim), rotación aplicada, fps constante, H.264 yuv420p con un fotograma clave por segundo
// - audio AAC 48 kHz estéreo; si se pide, NORMALIZACIÓN de sonoridad EBU R128 en dos pasadas (loudnorm lineal).
//   Es una normalización de nivel, no una restauración. Opcional: reducción de ruido básica (afftdn).

export type PrepareResult = { normalized: boolean; measured: null | { inputI: number; inputTp: number }; notes: string[] };

type LoudnormMeasure = { input_i: string; input_tp: string; input_lra: string; input_thresh: string; target_offset: string };

const measureLoudnorm = async (args: string[], target: { i: number; tp: number }, pre = ""): Promise<LoudnormMeasure | null> => {
  const r = await run("ffmpeg", [...args, "-vn", "-af", `${pre}loudnorm=I=${target.i}:TP=${target.tp}:LRA=11:print_format=json`, "-f", "null", "-"], {
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
  denoise?: "no" | "suave";
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
    // Reducción de ruido BÁSICA (filtro FFT de ffmpeg + paso alto 80 Hz). No es una restauración profesional.
    const pre = opts.denoise === "suave" ? "highpass=f=80,afftdn=nr=12:nf=-30," : "";
    if (pre) notes.push("Reducción de ruido básica aplicada (afftdn de ffmpeg); revisa que la voz no suene metálica");
    let af = `${pre}aresample=48000`;
    if (opts.normalize) {
      const m = await measureLoudnorm(inArgs.slice(3), { i: opts.targetLufs, tp: opts.truePeakDb }, pre);
      const inputI = m ? Number(m.input_i) : Number.NaN;
      if (!m || !Number.isFinite(inputI) || inputI < -70) {
        notes.push("Audio sin señal medible: no se normaliza");
      } else {
        measured = { inputI, inputTp: Number(m.input_tp) };
        af =
          `${pre}loudnorm=I=${opts.targetLufs}:TP=${opts.truePeakDb}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
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

// Normaliza un audio suelto (narración) a la sonoridad objetivo, en dos pasadas y de forma lineal
export const normalizeAudio = async (input: string, output: string, targetLufs: number, truePeakDb: number) => {
  const m = await measureLoudnorm(["-i", input], { i: targetLufs, tp: truePeakDb });
  const inputI = m ? Number(m.input_i) : Number.NaN;
  const af =
    m && Number.isFinite(inputI) && inputI > -70
      ? `loudnorm=I=${targetLufs}:TP=${truePeakDb}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`
      : "anull";
  await runOk("ffmpeg", ["-v", "error", "-y", "-i", input, "-af", `${af},aresample=48000`, "-ac", "2", "-c:a", "aac", "-b:a", "192k", output]);
  return af !== "anull";
};
