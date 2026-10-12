import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { jobDir } from "../../autopilot/jobs/store";
import { probe } from "../../autopilot/media/probe";
import { approvePlan, submitJob } from "../../autopilot/pipeline/run";
import { makeSpeechVideo, makeTestLibrary } from "../fixtures";
import { startFakeAnthropic } from "../support/fake-anthropic";

// Etapa 3 de extremo a extremo con la locución y la transcripción REALES de ElevenLabs (voz_a, 36 s),
// biblioteca de prueba con licencia y, para Claude, la API simulada en local.
const tmp = path.join(ROOT, ".cache", "test-e2e-s3", String(process.pid));
let video: string;
let words: string;
let lib: string;

before(async () => {
  video = await makeSpeechVideo(path.join(tmp, "fx"), 36);
  words = path.join(tmp, "fx", "voz_a.json");
  await fs.copyFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), words);
  lib = (await makeTestLibrary(path.join(tmp, "lib"))).dir;
});
after(async () => {
  if (!process.env.KEEP_E2E) await fs.rm(tmp, { recursive: true, force: true });
});

const cfgFor = (name: string) =>
  loadConfig({ ...process.env, ELEVENLABS_API_KEY: "", HH_DATA_DIR: path.join(tmp, name), HH_LIBRARY_DIR: lib, HH_QC_FRAMES: "3" });

test("clips con plan aprobado a mano: pausa tras el plan, sin render hasta aprobar", async () => {
  const cfg = cfgFor("d-approve");
  const job = await submitJob(cfg, {
    clientId: "hookhouse",
    video,
    captions: words,
    overrides: { editMode: "clips", clips: { count: 2, minSec: 8, maxSec: 16 }, approvePlan: true, broll: true, music: true, cutSilences: false },
  });
  assert.equal(job.status, "requiere_revision");
  assert.equal(job.steps.compose.status, "pendiente");
  assert.ok(job.warnings.some((w) => w.code === "plan_pendiente"));
  const dir = jobDir(cfg, job.clientId, job.id);
  const md = await fs.readFile(path.join(dir, "output/plan.md"), "utf8");
  assert.match(md, /clip-01/);
  assert.match(md, /No es falta de talento/);
  assert.match(md, /## Música/);
  const done = await approvePlan(cfg, job.clientId, job.id);
  assert.equal(done.status, "completado", JSON.stringify([done.errors, done.warnings]));
  const videos = done.outputs.filter((o) => o.kind === "video");
  assert.deepEqual(videos.map((o) => o.variant), ["clip-01", "clip-02"]);
  for (const v of videos) {
    const p = await probe(path.join(dir, v.path));
    assert.ok(p.durationSec >= 8 && p.durationSec <= 17, `${v.variant}: ${p.durationSec} s`);
    assert.ok(p.audio);
  }
  const report = await fs.readFile(path.join(dir, "output/informe.md"), "utf8");
  assert.match(report, /Recursos de terceros y licencias/);
  assert.match(report, /acorde · generado-en-pruebas/);
});

test("planificador Claude (API simulada) y vuelta al local si falla; anuncio exige revisión", async () => {
  const fake = await startFakeAnthropic([
    {
      kind: "plan",
      plan: {
        clips: [{ start_sentence: 4, end_sentence: 5, title: "Automatizamos tu edición", reason: "propuesta de valor" }],
        keywords: ["sistema"],
        claims_to_verify: [{ sentence: 5, reason: "promesa de resultado" }],
      },
    },
    { kind: "status", status: 529, type: "overloaded_error", message: "simulado" },
    { kind: "status", status: 529, type: "overloaded_error", message: "simulado" },
    { kind: "status", status: 529, type: "overloaded_error", message: "simulado" },
  ]);
  const prev = { key: process.env.ANTHROPIC_API_KEY, url: process.env.ANTHROPIC_BASE_URL };
  process.env.ANTHROPIC_API_KEY = "sk-ant-prueba";
  process.env.ANTHROPIC_BASE_URL = fake.url;
  try {
    const cfg = cfgFor("d-claude");
    const overrides = { editMode: "anuncio" as const, clips: { count: 2, minSec: 8, maxSec: 16 }, planner: "claude" as const, music: false, broll: false };
    const job = await submitJob(cfg, { clientId: "hookhouse", video, captions: words, overrides });
    const dir = jobDir(cfg, job.clientId, job.id);
    const plan = JSON.parse(await fs.readFile(path.join(dir, "work/plan.json"), "utf8"));
    assert.equal(plan.editorial.planner, "claude");
    assert.deepEqual(plan.variants.map((v: { title: string }) => v.title), ["Automatizamos tu edición"]);
    assert.equal(job.status, "requiere_revision", "un anuncio con afirmaciones nunca sale como completado");
    assert.ok(job.costs.real.some((c) => c.provider === "anthropic" && c.amount === 1500));
    assert.ok(job.costs.estimated.some((c) => c.provider === "anthropic" && c.unit === "USD"));
    // Segunda vez la API "falla" (529 tras reintentos): se usa el plan local y se avisa
    const job2 = await submitJob(cfg, { clientId: "hookhouse", video, captions: words, overrides: { ...overrides, editMode: "clips" } });
    const plan2 = JSON.parse(await fs.readFile(path.join(jobDir(cfg, job2.clientId, job2.id), "work/plan.json"), "utf8"));
    assert.equal(plan2.editorial.planner, "local");
    assert.ok(job2.warnings.some((w) => w.code === "plan_claude_fallo"));
    assert.ok(["completado", "requiere_revision"].includes(job2.status), JSON.stringify(job2.errors));
  } finally {
    process.env.ANTHROPIC_API_KEY = prev.key;
    process.env.ANTHROPIC_BASE_URL = prev.url;
    if (prev.key === undefined) delete process.env.ANTHROPIC_API_KEY;
    if (prev.url === undefined) delete process.env.ANTHROPIC_BASE_URL;
    await fake.close();
  }
});
