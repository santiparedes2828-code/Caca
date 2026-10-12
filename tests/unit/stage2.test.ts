import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { pagesOverFaces, placeCaptions } from "../../autopilot/edit/placement";
import { planSilenceCuts, remapClamped, remapItems, remapTime, remapTrack, toFrameSegments, totalMs } from "../../autopilot/edit/timeline";
import { buildFocusTrack, detectFaces, significantFaces, type FaceSample } from "../../autopilot/vision/faces";
import { scenesWithFrames } from "../../autopilot/vision/scenes";
import { runOk } from "../../autopilot/util/exec";
import type { CaptionPage } from "../../src/autopilot/props";
import { HOOKHOUSE } from "../../src/design/tokens";

const tmp = path.join(ROOT, ".cache", "test-s2", String(process.pid));
const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: "" });
before(async () => fs.mkdir(tmp, { recursive: true }));
after(async () => fs.rm(tmp, { recursive: true, force: true }));

test("cortes de silencio: nunca sobre palabras, dejan pausa y respetan inicio y final", () => {
  const r = planSilenceCuts({
    durationMs: 10000,
    silences: [
      { startMs: 0, endMs: 1200 }, // silencio inicial: se quita entero
      { startMs: 3000, endMs: 5000 }, // pausa larga con una palabra en medio (4000-4300)
      { startMs: 7000, endMs: 7500 }, // demasiado corta
      { startMs: 9000, endMs: 10000 }, // silencio final
    ],
    speech: [
      { startMs: 1300, endMs: 2900 },
      { startMs: 4000, endMs: 4300 },
      { startMs: 5100, endMs: 8900 },
    ],
    minSilenceMs: 600,
    keepPauseMs: 300,
  });
  // 0-1200: se quita salvo 150 ms antes de la voz; 3000-3940 (hasta la guarda de 60 ms) deja 150 ms a cada lado;
  // 4360-5000 (640 ms) también; 7000-7500 cae dentro de voz → no; 9000-10000 final: se quita tras 150 ms
  assert.deepEqual(r.cuts, [
    { startMs: 0, endMs: 1050 }, // deja 150 ms antes de la primera palabra
    { startMs: 3150, endMs: 3790 },
    { startMs: 4510, endMs: 4850 },
    { startMs: 9150, endMs: 10000 },
  ]);
  for (const c of r.cuts) {
    for (const w of [{ startMs: 1300, endMs: 2900 }, { startMs: 4000, endMs: 4300 }, { startMs: 5100, endMs: 8900 }]) {
      assert.ok(c.endMs <= w.startMs || c.startMs >= w.endMs, "un corte no puede tocar una palabra");
    }
  }
  assert.equal(totalMs(r.segments), 10000 - r.cuts.reduce((n, c) => n + c.endMs - c.startMs, 0));
});

test("sin silencios no hay cortes y el vídeo queda entero", () => {
  const r = planSilenceCuts({ durationMs: 5000, silences: [], speech: [], minSilenceMs: 600, keepPauseMs: 300 });
  assert.deepEqual(r.segments, [{ srcStartMs: 0, srcEndMs: 5000 }]);
});

test("remapeo de tiempos, palabras y trayectoria a través de los cortes", () => {
  const segs = [
    { srcStartMs: 0, srcEndMs: 1000 },
    { srcStartMs: 3000, srcEndMs: 5000 },
  ];
  assert.equal(remapTime(segs, 500), 500);
  assert.equal(remapTime(segs, 2000), null);
  assert.equal(remapTime(segs, 3500), 1500);
  assert.equal(remapClamped(segs, 2000), 1000);
  assert.deepEqual(remapItems(segs, [{ text: "a", startMs: 3100, endMs: 3400 }]), [{ text: "a", startMs: 1100, endMs: 1400 }]);
  const tr = remapTrack(segs, [
    { tMs: 0, x: 0.1, y: 0.5 },
    { tMs: 1500, x: 0.2, y: 0.5 },
    { tMs: 2500, x: 0.3, y: 0.5 },
    { tMs: 4000, x: 0.4, y: 0.5 },
  ]);
  assert.deepEqual(tr.map((k) => k.tMs), [0, 1000, 2000]);
  assert.deepEqual(toFrameSegments(segs, 30), [
    { srcStartFrame: 0, durationInFrames: 30 },
    { srcStartFrame: 90, durationInFrames: 60 },
  ]);
});

const face = (x: number, w = 0.2) => ({ x, y: 0.2, w, h: 0.25, score: 0.9 });

test("trayectoria del encuadre con histéresis: ignora gestos breves y sigue cambios sostenidos", () => {
  const samples: FaceSample[] = [];
  for (let t = 0; t <= 6000; t += 500) {
    // 0-2 s centro; 2,5 s un gesto breve a la derecha; 3,5-6 s se mueve a la izquierda y se queda
    const x = t === 2500 ? 0.6 : t >= 3500 ? 0.1 : 0.4;
    samples.push({ tMs: t, faces: [face(x)] });
  }
  const track = buildFocusTrack(samples, { fallback: { x: 0.5, y: 0.4 } });
  assert.equal(track[0].x, 0.5);
  assert.equal(track.length, 3, JSON.stringify(track));
  assert.ok(Math.abs(track[2].x - 0.2) < 1e-6);
  assert.ok(track[1].tMs >= 4500, "solo se mueve tras 0,8 s sostenidos");
  assert.deepEqual(buildFocusTrack([{ tMs: 0, faces: [] }], { fallback: { x: 0.5, y: 0.4 } }), []);
});

test("caras pequeñas (avatares, fondo) se descartan frente a la cara principal", () => {
  const r = significantFaces([
    { tMs: 0, faces: [face(0.3, 0.3)] },
    { tMs: 500, faces: [face(0.3, 0.3), face(0.8, 0.04)] },
    { tMs: 1000, faces: [face(0.8, 0.04)] },
  ]);
  assert.deepEqual(r.map((s) => s.faces.length), [1, 1, 0]);
});

test("los subtítulos se apartan de una cara que ocupa su posición por defecto", () => {
  const page: CaptionPage = { startMs: 0, endMs: 2000, lines: [[{ text: "Hola mundo", startMs: 0, endMs: 2000, emphasis: false }]] };
  // Vídeo vertical (sin recorte) con una cara grande a la altura de los subtítulos (y ≈ 0,66)
  const inp = {
    pages: [page],
    brand: HOOKHOUSE,
    mode: "frases" as const,
    W: 1080,
    H: 1920,
    srcW: 1080,
    srcH: 1920,
    reframe: { mode: "cover" as const, focusX: 0.5, focusY: 0.5 },
    focusTrack: [],
    faces: [{ tMs: 500, faces: [{ x: 0.3, y: 0.55, w: 0.4, h: 0.2, score: 0.9 }] }],
  };
  assert.equal(pagesOverFaces(inp), 1);
  const r = placeCaptions(inp);
  assert.equal(r.moved, 1);
  assert.notEqual(r.pages[0].positionY, undefined);
  assert.equal(pagesOverFaces({ ...inp, pages: r.pages }), 0);
  // Sin caras, nada cambia
  assert.equal(placeCaptions({ ...inp, faces: [] }).moved, 0);
});

test("detector de caras: vídeo sin personas y Python ausente", async () => {
  const video = path.join(tmp, "patron.mp4");
  await runOk("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=2", "-pix_fmt", "yuv420p", video]);
  const d = await detectFaces(cfg, video, 640, 360);
  if (d.ok) {
    assert.equal(d.samples.length, 4);
    assert.ok(d.samples.every((s) => s.faces.length === 0));
  } else {
    assert.match(d.reason, /setup:python/); // entorno sin OpenCV: se informa, no se rompe
  }
  const none = await detectFaces({ ...cfg, HH_PYTHON: path.join(tmp, "no-existe-python") }, video, 640, 360);
  assert.equal(none.ok, false);
});

test("escenas: detecta el cambio de plano y guarda un fotograma por escena", async () => {
  const a = path.join(tmp, "a.mp4");
  await runOk("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=red:size=320x240:rate=30:duration=2", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=2", "-filter_complex", "[0][1]concat=n=2:v=1[v]", "-map", "[v]", "-pix_fmt", "yuv420p", a]);
  const scenes = await scenesWithFrames(a, 4000, tmp, 5);
  assert.equal(scenes.length, 2);
  assert.ok(Math.abs(scenes[1].startMs - 2000) < 100);
  await fs.access(path.join(tmp, scenes[0].frame!));
});

test("reducción de ruido básica: baja el ruido de fondo sin quitar el audio", async () => {
  const { prepareWorkingCopy } = await import("../../autopilot/media/prepare");
  const { probe, volumeStats } = await import("../../autopilot/media/probe");
  const noisy = path.join(tmp, "ruido.mp4");
  await runOk("ffmpeg", [
    "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=30:duration=3",
    "-f", "lavfi", "-i", "anoisesrc=color=white:amplitude=0.05:duration=3",
    "-shortest", "-pix_fmt", "yuv420p", "-c:a", "aac", noisy,
  ]);
  const pr = await probe(noisy);
  const base = { input: noisy, probe: pr, fps: 30, startSec: 0, durationSec: 3, normalize: false, targetLufs: -14, truePeakDb: -1.5 };
  await prepareWorkingCopy({ ...base, output: path.join(tmp, "sin.mp4"), denoise: "no" });
  const r = await prepareWorkingCopy({ ...base, output: path.join(tmp, "con.mp4"), denoise: "suave" });
  assert.ok(r.notes.some((n) => n.includes("ruido")));
  const a = await volumeStats(path.join(tmp, "sin.mp4"));
  const b = await volumeStats(path.join(tmp, "con.mp4"));
  assert.ok(b.meanDb! < a.meanDb! - 3, `ruido medio ${a.meanDb} → ${b.meanDb} dB`);
});
