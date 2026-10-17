// Arma una pieza de las «30 piezas»: transcribe la voz en local, alinea los tiempos con la locución exacta
// (piezas/NN/guion.txt, el texto manda), une el diseño (piezas/NN/diseno.json) y escribe piezas/NN/props.json y el SRT.
// Uso: npx tsx piezas/armar.ts 01
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadConfig, ROOT } from "../autopilot/config";
import { transcribeLocal } from "../autopilot/transcription/local";

const id = process.argv[2];
const dir = path.join(ROOT, "piezas", id);
const work = path.join(ROOT, "analisis-piezas", id);
mkdirSync(work, { recursive: true });
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const srtTime = (s: number) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};

// Sin voz: tiempos a ritmo de lectura (≈2,6 palabras/s, pausas en la puntuación) a partir de 0,4 s
const readingTimes = (script: string[]) => {
  let t = 0.4;
  return script.map((w) => {
    const d = (0.22 + Math.min(0.25, w.length * 0.022)) * 1.4;
    const word = { n: norm(w), start: t, end: t + d };
    t += d + (/[.?!]$/.test(w) ? 0.7 : /[,:]$/.test(w) ? 0.25 : 0.05);
    return word;
  });
};

(async () => {
  const sinVoz = process.argv.includes("--sin-voz");
  const script = readFileSync(path.join(dir, "guion.txt"), "utf8").trim().split(/\s+/);
  const asr = sinVoz
    ? readingTimes(script)
    : (await transcribeLocal({ cfg: loadConfig(), audioWav: path.join(work, "voz16.wav"), workDir: work })).words.map((w) => ({ n: norm(w.text), start: w.startMs / 1000, end: w.endMs / 1000 }));
  // Alineación voraz: cada palabra del guion busca su igual en las 4 siguientes del ASR; si no, reparte el hueco
  const out: { text: string; start: number; end: number }[] = [];
  let j = 0;
  const same = (a: string, b: string) => a === b || (b.length > 3 && a.startsWith(b.slice(0, 4)));
  script.forEach((w, si) => {
    const n = norm(w);
    let k = -1;
    // Las palabras cortas («se», «la») solo se buscan en la posición actual: si el ASR las omitió, no deben saltar adelante
    const win = n.length <= 2 ? 1 : 4;
    for (let d = 0; d < win && j + d < asr.length; d++) if (same(asr[j + d].n, n)) { k = j + d; break; }
    if (k >= 0) {
      out.push({ text: w, start: asr[k].start, end: asr[k].end });
      j = k + 1;
    } else {
      const prev = out[out.length - 1];
      const st = prev ? prev.end : 0;
      const a = asr[j];
      out.push({ text: w, start: a ? Math.max(st, Math.min(a.start, st + 0.4)) : st, end: a ? Math.max(st + 0.15, a.end) : st + 0.3 });
      // No consumir la palabra del ASR si corresponde a la siguiente del guion (la actual fue omitida)
      const next = script[si + 1] ? norm(script[si + 1]) : "";
      if (a && norm(w).length > 0 && !(next && same(a.n, next))) j++;
    }
  });
  const diseno = JSON.parse(readFileSync(path.join(dir, "diseno.json"), "utf8"));
  const props = { id, ...(sinVoz ? {} : { voice: `piezas/${id}.wav` }), music: "piezas/musica.wav", ...diseno, words: out };
  writeFileSync(path.join(dir, "props.json"), JSON.stringify(props));
  // SRT por frases
  const blocks: string[] = [];
  let cur: typeof out = [];
  out.forEach((w, i) => {
    cur.push(w);
    if (/[.?!]$/.test(w.text) || cur.length >= 9 || i === out.length - 1) {
      blocks.push(`${blocks.length + 1}\n${srtTime(cur[0].start)} --> ${srtTime(cur[cur.length - 1].end)}\n${cur.map((x) => x.text).join(" ")}\n`);
      cur = [];
    }
  });
  writeFileSync(path.join(dir, `video_${id}.srt`), blocks.join("\n"));
  console.log(out.map((w) => `${w.text}@${w.start.toFixed(1)}`).join(" "));
})();
