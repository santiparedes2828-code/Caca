import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { jobDir } from "../../autopilot/jobs/store";
import { submitJob } from "../../autopilot/pipeline/run";
import { probe } from "../../autopilot/media/probe";
import { makeGapVideo } from "../fixtures";

// Etapa 2 de extremo a extremo: cortes de silencio no destructivos con tiempos por palabra reales.
const tmp = path.join(ROOT, ".cache", "test-e2e-s2", String(process.pid));
const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: "", HH_DATA_DIR: path.join(tmp, "data") });
let fx: Awaited<ReturnType<typeof makeGapVideo>>;

before(async () => {
  fx = await makeGapVideo(path.join(tmp, "fx"));
});
after(async () => {
  if (!process.env.KEEP_E2E) await fs.rm(tmp, { recursive: true, force: true });
});

test("silencio largo sin voz → se recorta, subtítulos sincronizados y original intacto", async () => {
  const src = await probe(fx.video);
  const job = await submitJob(cfg, { clientId: "hookhouse", video: fx.video, captions: fx.captions, overrides: { cutSilences: true } });
  assert.ok(["completado", "requiere_revision"].includes(job.status), JSON.stringify(job.errors));
  const dir = jobDir(cfg, job.clientId, job.id);
  const plan = JSON.parse(await fs.readFile(path.join(dir, "work/plan.json"), "utf8"));
  assert.ok(plan.cuts.count >= 1);
  assert.ok(plan.cuts.removedMs >= 2400, `se quitan al menos 2,4 s (quitado ${plan.cuts.removedMs})`);
  const out = await probe(path.join(dir, job.outputs.find((o) => o.kind === "video")!.path));
  assert.ok(src.durationSec - out.durationSec >= 2.3, `dura ${out.durationSec} s frente a ${src.durationSec} s`);
  // "Tú" sonaba en 7,40 s en el original; tras el corte debe sonar ~2,5 s antes
  const caps = JSON.parse(await fs.readFile(path.join(dir, "work/variants/principal/captions.json"), "utf8"));
  const tu = caps.pages.flatMap((p: { lines: { text: string; startMs: number }[][] }) => p.lines.flat()).find((t: { text: string }) => t.text === "Tú");
  const before = fx.words.find((w) => w.text === "Tú")!.startMs;
  assert.ok(before - tu.startMs >= 2300 && before - tu.startMs <= 3100, `Tú: ${before} → ${tu.startMs}`);
  // Las palabras anteriores al corte no se mueven
  const las = caps.pages[0].lines[0][0];
  assert.equal(las.text, "Las");
  assert.equal(las.startMs, 100);
  const md = await fs.readFile(path.join(dir, "output/informe.md"), "utf8");
  assert.match(md, /silencios recortados/);
  // Original intacto
  assert.equal((await probe(path.join(dir, job.inputs[0].path))).durationSec, src.durationSec);
});
