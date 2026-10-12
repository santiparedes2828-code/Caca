import { constants, promises as fs } from "node:fs";
import path from "node:path";
import type { Config } from "../config";
import type { JobInput } from "../jobs/types";
import { probe, type ProbeResult } from "../media/probe";
import { safeName, sha256File } from "../util/fs";

// Validación de archivos recibidos. Nunca se ejecuta ni se interpreta como código un archivo del cliente:
// se comprueban extensión, tamaño, firma binaria real y, para multimedia, que ffprobe lo lea.

export const EXT = {
  video: [".mp4", ".mov", ".m4v", ".mkv", ".webm"],
  captions: [".srt", ".vtt", ".json"],
  guion: [".txt", ".md"],
  audio: [".mp3", ".wav", ".m4a"],
} as const;

export class IngestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Firma de los primeros bytes → tipo real
export const sniff = (b: Buffer): string => {
  if (b.length >= 12 && b.toString("latin1", 4, 8) === "ftyp") {
    const brand = b.toString("latin1", 8, 12);
    return brand === "qt  " ? "mov" : "mp4";
  }
  if (b.length >= 4 && b.readUInt32BE(0) === 0x1a45dfa3) return "matroska";
  if (b.length >= 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WAVE") return "wav";
  if (b.length >= 3 && b.toString("latin1", 0, 3) === "ID3") return "mp3";
  if (b.length >= 4 && b.toString("latin1", 0, 4) === "fLaC") return "flac";
  if (b.length >= 8 && b.readUInt32BE(0) === 0x89504e47) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a) return "executable"; // MZ (Windows)
  if (b.length >= 4 && b.readUInt32BE(0) === 0x7f454c46) return "executable"; // ELF
  if (b.length >= 2 && b.toString("latin1", 0, 2) === "#!") return "script";
  if (b.length >= 4 && b.readUInt32BE(0) === 0x504b0304) return "zip";
  return "unknown";
};

const isUtf8Text = (b: Buffer) => {
  if (b.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(b);
    return true;
  } catch {
    return false;
  }
};

export type Role = keyof typeof EXT;
export type Validated = { role: Role; detected: string; probe: ProbeResult | null; warnings: string[] };

export const validateFile = async (cfg: Config, file: string, role: Role): Promise<Validated> => {
  const lst = await fs.lstat(file).catch(() => null);
  if (!lst) throw new IngestError("no_existe", `No existe el archivo ${path.basename(file)}`);
  if (lst.isSymbolicLink()) throw new IngestError("enlace", "No se aceptan enlaces simbólicos");
  if (!lst.isFile()) throw new IngestError("no_es_archivo", `${path.basename(file)} no es un archivo normal`);
  await fs.access(file, constants.R_OK);

  const ext = path.extname(file).toLowerCase();
  const allowed: readonly string[] = EXT[role];
  if (!allowed.includes(ext)) {
    throw new IngestError("extension", `Extensión ${ext || "(ninguna)"} no admitida para ${role}. Admitidas: ${allowed.join(" ")}`);
  }
  const maxBytes = role === "video" || role === "audio" ? cfg.HH_MAX_UPLOAD_MB * 1024 * 1024 : 5 * 1024 * 1024;
  if (lst.size === 0) throw new IngestError("vacio", `${path.basename(file)} está vacío`);
  if (lst.size > maxBytes) throw new IngestError("tamano", `${path.basename(file)} supera el tamaño máximo (${Math.round(maxBytes / 1048576)} MB)`);

  const fh = await fs.open(file, "r");
  const text = role === "captions" || role === "guion";
  const head = Buffer.alloc(Math.min(lst.size, text ? lst.size : 64));
  await fh.read(head, 0, head.length, 0);
  await fh.close();
  const kind = sniff(head);
  if (kind === "executable" || kind === "script" || kind === "zip") {
    throw new IngestError("formato_peligroso", `${path.basename(file)} es un ${kind}, no un ${role}`);
  }

  if (text) {
    if (!isUtf8Text(head)) throw new IngestError("formato", `${path.basename(file)} no es texto UTF-8`);
    return { role, detected: ext.slice(1), probe: null, warnings: [] };
  }

  if (role === "audio") {
    if (!["mp3", "wav"].includes(kind) && !(ext === ".m4a" && kind === "mp4") && !(ext === ".mp3" && head[0] === 0xff)) {
      throw new IngestError("formato", `${path.basename(file)} no es un audio válido (${kind})`);
    }
    const pa = await probe(file).catch((e: Error) => {
      throw new IngestError("ilegible", `${path.basename(file)}: ${e.message}`);
    });
    if (!pa.audio) throw new IngestError("sin_audio", `${path.basename(file)} no contiene audio`);
    return { role, detected: `${kind}/${pa.audio.codec}`, probe: pa, warnings: [] };
  }
  if (!["mp4", "mov", "matroska"].includes(kind)) {
    throw new IngestError("formato", `${path.basename(file)} tiene extensión ${ext} pero su contenido no es un vídeo (${kind})`);
  }
  let pr: ProbeResult;
  try {
    pr = await probe(file);
  } catch (e) {
    throw new IngestError("ilegible", `${path.basename(file)}: ${(e as Error).message}`);
  }
  if (!pr.video) throw new IngestError("sin_video", `${path.basename(file)} no contiene pista de vídeo`);
  if (!(pr.durationSec > 0)) throw new IngestError("duracion", `${path.basename(file)} no tiene duración válida`);
  if (pr.durationSec > cfg.HH_MAX_DURATION_SEC) {
    throw new IngestError("duracion", `${path.basename(file)} dura ${Math.round(pr.durationSec)} s; máximo ${cfg.HH_MAX_DURATION_SEC} s`);
  }
  const warnings: string[] = [];
  if (!pr.audio) warnings.push("El vídeo no tiene pista de audio");
  if (pr.video.variableFrameRate) warnings.push(`Frecuencia de fotogramas variable (${pr.video.avgFps.toFixed(2)} fps de media): se convierte a constante`);
  if (pr.video.rotation) warnings.push(`Vídeo con rotación de ${pr.video.rotation}°: se aplica en la copia de trabajo`);
  return { role, detected: `${kind}/${pr.video.codec}`, probe: pr, warnings };
};

// Copia el archivo validado a input/original/ (solo lectura). El archivo de origen no se toca.
export const storeOriginal = async (jobDirPath: string, file: string, v: Validated): Promise<JobInput> => {
  const name = safeName(path.basename(file));
  const rel = path.join("input", "original", `${v.role}-${name}`);
  const dest = path.join(jobDirPath, rel);
  await fs.copyFile(file, dest, constants.COPYFILE_EXCL);
  await fs.chmod(dest, 0o444);
  const st = await fs.stat(dest);
  return {
    role: v.role,
    originalName: path.basename(file).slice(0, 200),
    path: rel,
    sha256: await sha256File(dest),
    bytes: st.size,
    detected: v.detected,
  };
};
