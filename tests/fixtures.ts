import { promises as fs } from "node:fs";
import path from "node:path";
import { ROOT } from "../autopilot/config";
import { toSrt } from "../autopilot/captions/load";
import { runOk } from "../autopilot/util/exec";

// Archivos de prueba pequeños, generados con ffmpeg a partir de material del propio repo:
// la locución real de marca (public/audio/voz_viral.wav) y sus tiempos por palabra reales
// (src/data/captions-viral.json, ElevenLabs Scribe). Nada de esto se sube a Git.

type Word = { text: string; startMs: number; endMs: number };

export const makeFixtures = async (dir: string, seconds = 6) => {
  await fs.mkdir(dir, { recursive: true });
  const voice = path.join(ROOT, "public", "audio", "voz_viral.wav");
  const words = (JSON.parse(await fs.readFile(path.join(ROOT, "src", "data", "captions-viral.json"), "utf8")) as Word[]).filter(
    (w) => w.endMs <= seconds * 1000,
  );
  const f = {
    horizontal: path.join(dir, "horizontal_voz.mp4"),
    noAudio: path.join(dir, "sin_audio.mp4"),
    fake: path.join(dir, "falso.mp4"),
    script: path.join(dir, "script.mp4"),
    srt: path.join(dir, "horizontal_voz.srt"),
    words: path.join(dir, "horizontal_voz.json"),
    badSrt: path.join(dir, "roto.srt"),
  };
  // 16:9 con imagen en movimiento (testsrc2) + voz real
  await runOk("ffmpeg", [
    "-v", "error", "-y",
    "-f", "lavfi", "-i", `testsrc2=size=1280x720:rate=30:duration=${seconds}`,
    "-i", voice, "-t", String(seconds),
    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", f.horizontal,
  ]);
  await runOk("ffmpeg", [
    "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=25:duration=3",
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", f.noAudio,
  ]);
  await fs.writeFile(f.fake, "esto no es un video\n".repeat(20));
  await fs.writeFile(f.script, "#!/bin/sh\necho hola\n");
  // SRT por frases (como lo entregaría un cliente): un bloque por frase
  const cues: { startMs: number; endMs: number; lines: string[] }[] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.?!]$/.test(w.text) || cur.length >= 7) {
      cues.push({ startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs, lines: [cur.map((x) => x.text).join(" ")] });
      cur = [];
    }
  }
  if (cur.length) cues.push({ startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs, lines: [cur.map((x) => x.text).join(" ")] });
  await fs.writeFile(f.srt, toSrt(cues));
  await fs.writeFile(f.words, JSON.stringify(words.map((w) => ({ ...w, timestampMs: null, confidence: null }))));
  await fs.writeFile(f.badSrt, "esto\nno es\nun srt");
  return { ...f, words: f.words, cueCount: cues.length, wordCount: words.length };
};

if (require.main === module) {
  makeFixtures(process.argv[2] ?? path.join(ROOT, ".cache", "fixtures")).then((r) => console.log(r));
}

// Vídeo 16:9 con la locución public/audio/voz_a.mp3 (transcrita de verdad por ElevenLabs en
// tests/data/elevenlabs-scribe-voz_a.words.json), sin subtítulos: el caso "necesita transcripción"
export const makeSpeechVideo = async (dir: string, seconds: number) => {
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `voz_a_${seconds}s.mp4`);
  await runOk("ffmpeg", [
    "-v", "error", "-y",
    "-f", "lavfi", "-i", `testsrc2=size=1280x720:rate=30:duration=${seconds}`,
    "-i", path.join(ROOT, "public", "audio", "voz_a.mp3"), "-t", String(seconds),
    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out,
  ]);
  return out;
};

// Vídeo con la locución voz_a y 2,5 s de silencio insertados a los 4,4 s (tras "videos."), más sus
// subtítulos por palabra REALES de ElevenLabs desplazados para ese silencio: caso de prueba de cortes.
export const makeGapVideo = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, "voz_a_con_pausa.mp4");
  const voice = path.join(ROOT, "public", "audio", "voz_a.mp3");
  await runOk("ffmpeg", [
    "-v", "error", "-y",
    "-f", "lavfi", "-i", "testsrc2=size=1280x720:rate=30:duration=11.5",
    "-i", voice,
    "-filter_complex",
    "[1:a]atrim=0:4.4,asetpts=PTS-STARTPTS[a1];anullsrc=r=44100:cl=mono,atrim=0:2.5[s];[1:a]atrim=4.4:9,asetpts=PTS-STARTPTS[a2];[a1][s][a2]concat=n=3:v=0:a=1[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out,
  ]);
  const real = JSON.parse(await fs.readFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), "utf8")) as {
    words: { text: string; start: number; end: number }[];
  };
  const words = real.words
    .filter((w) => w.end <= 9)
    .map((w) => {
      const shift = w.start >= 4.4 ? 2500 : 0;
      return { text: w.text, startMs: Math.round(w.start * 1000) + shift, endMs: Math.round(w.end * 1000) + shift };
    });
  const json = path.join(dir, "voz_a_con_pausa.json");
  await fs.writeFile(json, JSON.stringify(words));
  return { video: out, captions: json, words };
};
