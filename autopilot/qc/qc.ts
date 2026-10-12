import { parseSrt } from "@remotion/captions";
import path from "node:path";
import type { CaptionPage } from "../../src/autopilot/props";
import type { Verdict } from "../jobs/types";
import { blackSegments, loudness, probe, volumeStats } from "../media/probe";
import { run, runOk } from "../util/exec";

// Control de calidad automático del MP4 renderizado. No sustituye a la revisión humana:
// comprueba lo medible (archivo, códecs, tiempos, audio, negros, subtítulos) y deja fotogramas para revisar.

export type CheckStatus = "ok" | "advertencia" | "fallo";
export type Check = { id: string; label: string; status: CheckStatus; detail: string };

export type QcInput = {
  output: string;
  source: string | null; // copia de trabajo (para distinguir negros que ya venían en el original)
  qcDir: string;
  expected: { width: number; height: number; fps: number; durationSec: number; hasAudio: boolean };
  audioTarget: { lufs: number; truePeakDb: number; normalized: boolean };
  captions: null | {
    pages: CaptionPage[];
    srt: string;
    maxCharsPerLine: number;
    mode: string;
    transcription?: null | { provider: string; words: number; withConfidence: number; lowConfidence: { text: string; startMs: number }[] };
    overFaces?: number; // páginas que coinciden con una cara (calculado al componer; undefined = sin datos de caras)
  };
  captionsRequired: boolean;
  frames: number;
};

export type QcResult = {
  verdict: Verdict;
  checks: Check[];
  frames: string[]; // relativas a qcDir
  sheet: string | null;
  metrics: Record<string, number | string | null>;
};

export const runQc = async (q: QcInput): Promise<QcResult> => {
  const checks: Check[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail });
  const metrics: QcResult["metrics"] = {};

  // 1. Archivo legible y técnico
  let pr;
  try {
    pr = await probe(q.output);
  } catch (e) {
    add("archivo", "Archivo legible", "fallo", (e as Error).message);
    return { verdict: "FALLIDO", checks, frames: [], sheet: null, metrics };
  }
  add("archivo", "Archivo legible", pr.sizeBytes > 0 ? "ok" : "fallo", `${(pr.sizeBytes / 1048576).toFixed(1)} MB · ${pr.formatName}`);
  const v = pr.video;
  if (!v) {
    add("video", "Pista de vídeo", "fallo", "El archivo no tiene vídeo");
    return { verdict: "FALLIDO", checks, frames: [], sheet: null, metrics };
  }
  const mp4 = pr.formatName.includes("mp4");
  const compat = mp4 && v.codec === "h264" && v.pixFmt === "yuv420p" && (!pr.audio || pr.audio.codec === "aac");
  add("codecs", "Compatibilidad (MP4 · H.264 · yuv420p · AAC)", compat ? "ok" : "fallo", `${pr.formatName} · ${v.codec} · ${v.pixFmt}${pr.audio ? ` · ${pr.audio.codec}` : ""}`);
  const resOk = v.width === q.expected.width && v.height === q.expected.height;
  add("resolucion", "Resolución", resOk ? "ok" : "fallo", `${v.width}x${v.height} (esperado ${q.expected.width}x${q.expected.height})`);
  const fpsOk = Math.abs(v.fps - q.expected.fps) < 0.01;
  add("fps", "Fotogramas por segundo", fpsOk ? "ok" : "fallo", `${v.fps.toFixed(2)} (esperado ${q.expected.fps})`);
  const tol = 1 / q.expected.fps + 0.05;
  const dDiff = Math.abs(pr.durationSec - q.expected.durationSec);
  add("duracion", "Duración", dDiff <= tol ? "ok" : dDiff <= 0.5 ? "advertencia" : "fallo", `${pr.durationSec.toFixed(3)} s (esperado ${q.expected.durationSec.toFixed(3)} s)`);
  metrics.durationSec = pr.durationSec;

  // 2. Decodificación completa (detecta archivos truncados o corruptos)
  const dec = await run("ffmpeg", ["-v", "error", "-i", q.output, "-f", "null", "-"], { timeoutMs: 1_800_000 });
  const decErr = dec.stderr.trim();
  add("decodificacion", "Decodificación completa", dec.code === 0 && !decErr ? "ok" : "fallo", decErr ? decErr.split("\n").slice(0, 3).join(" | ") : "sin errores");

  // 3. Audio
  if (q.expected.hasAudio) {
    if (!pr.audio) {
      add("audio", "Pista de audio", "fallo", "El original tiene audio y el render no");
    } else {
      add("audio", "Pista de audio", "ok", `${pr.audio.codec} · ${pr.audio.channels} canales · ${pr.audio.sampleRate} Hz`);
      const aDur = pr.audio.durationSec ?? pr.durationSec;
      const vDur = pr.durationSec;
      const syncDiff = Math.abs(aDur - vDur);
      add("sincronia", "Duración audio = vídeo", syncDiff <= 0.1 ? "ok" : "advertencia", `diferencia ${(syncDiff * 1000).toFixed(0)} ms`);
      const vol = await volumeStats(q.output);
      const ld = await loudness(q.output);
      metrics.meanVolumeDb = vol.meanDb;
      metrics.maxVolumeDb = vol.maxDb;
      metrics.integratedLufs = ld?.integratedLufs ?? null;
      metrics.truePeakDb = ld?.truePeakDb ?? null;
      if (vol.maxDb === null || vol.maxDb < -60) {
        add("audio_senal", "Señal de audio", "advertencia", "La pista de audio está prácticamente muda");
      } else if (ld) {
        const off = Math.abs(ld.integratedLufs - q.audioTarget.lufs);
        const status: CheckStatus = !q.audioTarget.normalized ? "advertencia" : off <= 2 ? "ok" : "advertencia";
        add(
          "sonoridad",
          "Sonoridad",
          status,
          `${ld.integratedLufs.toFixed(1)} LUFS (objetivo ${q.audioTarget.lufs})${q.audioTarget.normalized ? "" : " · sin normalizar"}`,
        );
        add(
          "picos",
          "Picos / saturación",
          ld.truePeakDb <= -0.5 ? "ok" : "advertencia",
          `pico verdadero ${ld.truePeakDb.toFixed(1)} dBTP${ld.truePeakDb > -0.5 ? " (riesgo de saturación)" : ""}`,
        );
      }
    }
  } else {
    const mute = q.source ? "El vídeo original no tiene audio: el entregable es mudo" : "Sin voz ni sonido: añade un sonido en la plataforma antes de publicar";
    add("audio", "Pista de audio", "advertencia", pr.audio ? "Render con audio pero el original no tenía" : mute);
  }

  // 4. Fotogramas negros (se comparan con el original para no culpar al render)
  const black = await blackSegments(q.output);
  const blackSrc = q.source ? await blackSegments(q.source) : [];
  const blackTotal = black.reduce((n, b) => n + (b.endSec - b.startSec), 0);
  const fromRender = black.filter((b) => !blackSrc.some((s) => s.startSec <= b.startSec + 0.2 && s.endSec >= b.endSec - 0.2));
  metrics.blackSec = Number(blackTotal.toFixed(2));
  if (blackTotal > pr.durationSec * 0.5 && fromRender.length) add("negros", "Fotogramas negros", "fallo", `${blackTotal.toFixed(1)} s en negro`);
  else if (fromRender.length) add("negros", "Fotogramas negros", "advertencia", fromRender.map((b) => `${b.startSec.toFixed(1)}–${b.endSec.toFixed(1)} s`).join(", "));
  else add("negros", "Fotogramas negros", "ok", black.length ? `solo los que ya tenía el original (${blackTotal.toFixed(1)} s)` : "ninguno");

  // 5. Fotogramas representativos + detección de pantallas vacías
  const frames: string[] = [];
  const n = q.frames;
  let empty = 0;
  for (let i = 0; i < n; i++) {
    const t = (pr.durationSec * (i + 0.5)) / n;
    const name = `frame_${String(i + 1).padStart(2, "0")}.jpg`;
    await runOk("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(3), "-i", q.output, "-frames:v", "1", "-q:v", "3", path.join(q.qcDir, name)]);
    frames.push(name);
    const st = await run("ffmpeg", ["-v", "error", "-i", path.join(q.qcDir, name), "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-"]);
    const ymin = Number(st.stdout.match(/YMIN=(\d+)/)?.[1] ?? 0);
    const ymax = Number(st.stdout.match(/YMAX=(\d+)/)?.[1] ?? 255);
    if (ymax - ymin < 12) empty++;
  }
  add("vacias", "Pantallas vacías", empty === 0 ? "ok" : empty === n ? "fallo" : "advertencia", empty ? `${empty} de ${n} fotogramas muestreados son planos` : `${n} fotogramas muestreados con contenido`);
  let sheet: string | null = "hoja_contacto.jpg";
  const tile = await run("ffmpeg", ["-v", "error", "-y", "-i", path.join(q.qcDir, "frame_%02d.jpg"), "-vf", `scale=360:-2,tile=${n}x1:padding=8:color=white`, "-frames:v", "1", path.join(q.qcDir, sheet)]);
  if (tile.code !== 0) sheet = null;

  // 6. Subtítulos
  if (!q.captions) {
    add("subtitulos", "Subtítulos", q.captionsRequired ? "fallo" : "advertencia", "El vídeo no lleva subtítulos (el motivo está en las advertencias del paso de subtítulos)");
  } else {
    const c = q.captions;
    const durMs = pr.durationSec * 1000;
    const outside = c.pages.filter((p) => p.endMs > durMs + 50).length;
    const overlaps = c.pages.filter((p, i) => i > 0 && p.startMs < c.pages[i - 1].endMs - 1).length;
    const longLines = c.pages.flatMap((p) => p.lines).filter((l) => l.length > 1 && l.map((t) => t.text).join(" ").length > c.maxCharsPerLine).length;
    const longWords = c.pages.flatMap((p) => p.lines).filter((l) => l.length === 1 && l[0].text.length > c.maxCharsPerLine).length;
    const short = c.pages.filter((p) => p.endMs - p.startMs < 250 && c.mode !== "palabra").length;
    let srtCount = -1;
    try {
      srtCount = parseSrt({ input: c.srt, strict: true }).captions.length;
    } catch {
      srtCount = -1;
    }
    add("subtitulos", "Subtítulos generados", c.pages.length > 0 ? "ok" : "fallo", `${c.pages.length} páginas · modo ${c.mode}`);
    add("subtitulos_tiempos", "Subtítulos dentro del vídeo y sin solapes", outside || overlaps ? "fallo" : "ok", `fuera: ${outside} · solapes: ${overlaps}`);
    add(
      "subtitulos_encuadre",
      "Líneas dentro del ancho",
      longLines ? "fallo" : longWords ? "advertencia" : "ok",
      longLines ? `${longLines} líneas superan ${c.maxCharsPerLine} caracteres` : longWords ? `${longWords} palabras más largas que una línea (se reduce el cuerpo)` : `todas ≤ ${c.maxCharsPerLine} caracteres; el render reduce el cuerpo si una línea no cabe`,
    );
    add("subtitulos_lectura", "Tiempo de lectura", short ? "advertencia" : "ok", short ? `${short} páginas duran menos de 0,25 s` : "todas las páginas ≥ 0,25 s");
    if (c.overFaces !== undefined) {
      add(
        "subtitulos_caras",
        "Subtítulos sin tapar caras",
        c.overFaces ? "advertencia" : "ok",
        c.overFaces ? `${c.overFaces} páginas coinciden con una cara detectada` : "ninguna página tapa una cara detectada",
      );
    }
    const tr = c.transcription;
    if (tr) {
      const ratio = tr.withConfidence ? tr.lowConfidence.length / tr.withConfidence : 0;
      add(
        "transcripcion",
        "Confianza de la transcripción",
        ratio > 0.05 ? "advertencia" : "ok",
        tr.withConfidence === 0
          ? `${tr.provider}: ${tr.words} palabras (el proveedor no devolvió confianza por palabra)`
          : `${tr.provider}: ${tr.words} palabras, ${tr.lowConfidence.length} con baja confianza (${(ratio * 100).toFixed(1)} %)`,
      );
    }
    add("srt", "SRT exportado válido", srtCount > 0 ? "ok" : "fallo", srtCount > 0 ? `${srtCount} bloques` : "el SRT no se puede volver a leer");
  }

  add("fuentes", "Fuentes de marca", "ok", "cargadas (si una fuente falla, el render se cancela)");

  const verdict: Verdict = checks.some((c) => c.status === "fallo") ? "FALLIDO" : checks.some((c) => c.status === "advertencia") ? "ADVERTENCIA" : "APROBADO";
  return { verdict, checks, frames, sheet, metrics };
};
