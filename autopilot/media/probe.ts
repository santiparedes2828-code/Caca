import { run, runOk } from "../util/exec";

// Lectura técnica de un archivo multimedia con ffprobe (nunca se ejecuta el archivo).
export type ProbeResult = {
  formatName: string;
  durationSec: number;
  sizeBytes: number;
  bitRate: number | null;
  video: null | {
    codec: string;
    width: number; // ya con la rotación aplicada (lo que se ve)
    height: number;
    rotation: number;
    fps: number;
    avgFps: number;
    variableFrameRate: boolean;
    pixFmt: string;
    frames: number | null;
  };
  audio: null | {
    codec: string;
    channels: number;
    sampleRate: number;
    durationSec: number | null;
  };
  audioStreams: number;
  videoStreams: number;
};

const ratio = (s: string | undefined) => {
  if (!s) return 0;
  const [a, b] = s.split("/").map(Number);
  return b ? a / b : a || 0;
};

type FfStream = {
  codec_type: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  pix_fmt?: string;
  nb_frames?: string;
  channels?: number;
  sample_rate?: string;
  duration?: string;
  disposition?: { attached_pic?: number };
  tags?: Record<string, string>;
  side_data_list?: { rotation?: number }[];
};

export const probe = async (file: string): Promise<ProbeResult> => {
  const r = await run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], {
    timeoutMs: 60_000,
  });
  if (r.code !== 0) throw new Error(`ffprobe no reconoce el archivo: ${r.stderr.trim().split("\n").pop() ?? ""}`);
  const j = JSON.parse(r.stdout) as { format?: Record<string, string>; streams?: FfStream[] };
  const streams = j.streams ?? [];
  const vids = streams.filter((s) => s.codec_type === "video" && !s.disposition?.attached_pic);
  const auds = streams.filter((s) => s.codec_type === "audio");
  const v = vids[0];
  const a = auds[0];
  let video: ProbeResult["video"] = null;
  if (v && v.width && v.height) {
    const rot = Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v.tags?.rotate ?? 0);
    const swap = Math.abs(rot) % 180 === 90;
    const fps = ratio(v.r_frame_rate);
    const avg = ratio(v.avg_frame_rate);
    video = {
      codec: v.codec_name ?? "?",
      width: swap ? v.height : v.width,
      height: swap ? v.width : v.height,
      rotation: rot,
      fps,
      avgFps: avg,
      variableFrameRate: avg > 0 && Math.abs(fps - avg) > 0.05,
      pixFmt: v.pix_fmt ?? "?",
      frames: v.nb_frames ? Number(v.nb_frames) : null,
    };
  }
  return {
    formatName: j.format?.format_name ?? "?",
    durationSec: Number(j.format?.duration ?? 0),
    sizeBytes: Number(j.format?.size ?? 0),
    bitRate: j.format?.bit_rate ? Number(j.format.bit_rate) : null,
    video,
    audio: a
      ? {
          codec: a.codec_name ?? "?",
          channels: a.channels ?? 0,
          sampleRate: Number(a.sample_rate ?? 0),
          durationSec: a.duration ? Number(a.duration) : null,
        }
      : null,
    audioStreams: auds.length,
    videoStreams: vids.length,
  };
};

// Sonoridad EBU R128 (LUFS integrado, rango y pico verdadero) con el filtro ebur128 de ffmpeg
export type Loudness = { integratedLufs: number; lra: number; truePeakDb: number };

export const loudness = async (file: string, startSec = 0, durSec: number | null = null): Promise<Loudness | null> => {
  const args = ["-hide_banner", "-nostats"];
  if (startSec > 0) args.push("-ss", String(startSec));
  if (durSec) args.push("-t", String(durSec));
  args.push("-i", file, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-");
  const r = await run("ffmpeg", args, { timeoutMs: 600_000 });
  const summary = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const i = summary.match(/I:\s+(-?[\d.]+|-inf) LUFS/);
  const lra = summary.match(/LRA:\s+(-?[\d.]+) LU/);
  const tp = summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/);
  if (!i) return null;
  const num = (s: string | undefined) => (s === undefined || s === "-inf" ? -Infinity : Number(s));
  return { integratedLufs: num(i[1]), lra: lra ? Number(lra[1]) : 0, truePeakDb: num(tp?.[1]) };
};

// Silencios (para el informe y, en la Etapa 2, para proponer cortes; aquí no se corta nada)
export type Silence = { startSec: number; endSec: number };

export const silences = async (file: string, noiseDb = -40, minSec = 0.5): Promise<Silence[]> => {
  const r = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", `silencedetect=n=${noiseDb}dB:d=${minSec}`, "-f", "null", "-"], {
    timeoutMs: 600_000,
  });
  const starts = [...r.stderr.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((s, k) => ({ startSec: s, endSec: ends[k] ?? Number.NaN })).filter((x) => !Number.isNaN(x.endSec));
};

// Volumen máximo/medio: detecta pistas de audio mudas o saturadas
export const volumeStats = async (file: string) => {
  const r = await runOk("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "volumedetect", "-f", "null", "-"], {
    timeoutMs: 600_000,
  });
  const mean = r.stderr.match(/mean_volume: (-?[\d.]+|-inf) dB/);
  const max = r.stderr.match(/max_volume: (-?[\d.]+|-inf) dB/);
  const n = (m: RegExpMatchArray | null) => (!m ? null : m[1] === "-inf" ? -Infinity : Number(m[1]));
  return { meanDb: n(mean), maxDb: n(max) };
};

// Tramos negros (frames negros, pantallas vacías)
export const blackSegments = async (file: string, minSec = 0.5) => {
  const r = await run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-an", "-vf", `blackdetect=d=${minSec}:pix_th=0.10`, "-f", "null", "-"], {
    timeoutMs: 900_000,
  });
  return [...r.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => ({
    startSec: Number(m[1]),
    endSec: Number(m[2]),
  }));
};
