import { parseSrt } from "@remotion/captions";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { jobDir } from "../../autopilot/jobs/store";
import { redoCaptions, retryJob, submitJob } from "../../autopilot/pipeline/run";
import { localAsrAvailable } from "../../autopilot/transcription/local";
import { makeSpeechVideo } from "../fixtures";
import { startFakeElevenLabs } from "../support/fake-elevenlabs";

// Pipeline completo (ffmpeg + Remotion reales) con la API de ElevenLabs SIMULADA en local.
// Demuestra el flujo y el manejo de errores; la integración real se verifica aparte (ver PENDIENTE.md).
const tmp = path.join(ROOT, ".cache", "test-e2e-stt", String(process.pid));
const KEY = "sk_prueba_no_real_123456";
let video: string;
let srv: Awaited<ReturnType<typeof startFakeElevenLabs>>;

before(async () => {
  video = await makeSpeechVideo(path.join(tmp, "fx"), 7);
  srv = await startFakeElevenLabs([]);
});
after(async () => {
  await srv.close();
  if (!process.env.KEEP_E2E) await fs.rm(tmp, { recursive: true, force: true });
});

const cfgFor = (dataDir: string, extra: Record<string, string> = {}) =>
  loadConfig({ ...process.env, ELEVENLABS_API_KEY: KEY, ELEVENLABS_BASE_URL: srv.url, HH_DATA_DIR: path.join(tmp, dataDir), ...extra });
const file = (cfg: ReturnType<typeof loadConfig>, job: { clientId: string; id: string }, rel: string) => path.join(jobDir(cfg, job.clientId, job.id), rel);

test("5. vídeo sin SRT → transcripción ElevenLabs → subtítulos palabra-activa, coste registrado", async () => {
  const cfg = cfgFor("d5");
  srv.script.push({ kind: "ok", maxSec: 7 });
  const before = srv.requests.length;
  const job = await submitJob(cfg, { clientId: "hookhouse", video });
  assert.equal(job.status, "completado", JSON.stringify([job.errors, job.warnings]));
  assert.equal(srv.requests.length - before, 1);
  const q = srv.requests.at(-1)!;
  assert.equal(q.fields.model_id, "scribe_v2");
  assert.equal(q.fields.language_code, "es");
  const caps = JSON.parse(await fs.readFile(file(cfg, job, "work/variants/principal/captions.json"), "utf8"));
  assert.equal(caps.precision, "word");
  assert.equal(caps.mode, "palabra-activa");
  assert.equal(caps.pages[0].lines[0][0].text, "Las");
  assert.equal(caps.transcription.provider, "elevenlabs");
  const srt = await fs.readFile(file(cfg, job, job.outputs.find((o) => o.kind === "subtitulos_srt")!.path), "utf8");
  assert.match(parseSrt({ input: srt, strict: true }).captions[0].text, /agencias/);
  assert.equal(job.costs.real[0].provider, "elevenlabs");
  assert.ok(job.costs.real[0].amount > 0);
  assert.equal(job.costs.estimated.length, 0, "sin precio configurado no se estima dinero");
  const md = await fs.readFile(file(cfg, job, "output/informe.md"), "utf8");
  assert.match(md, /Datos enviados a proveedores externos/);
  assert.match(md, /Confianza de la transcripción/);
  assert.ok(!md.includes(KEY) && !(await fs.readFile(file(cfg, job, "logs/job.log"), "utf8")).includes(KEY));

  // Corrección manual: se edita una palabra en work/transcript.json y se rehacen los subtítulos sin llamar a la API
  const tf = file(cfg, job, "work/transcript.json");
  const t = JSON.parse(await fs.readFile(tf, "utf8"));
  t.words[1].text = "AGENCIAS";
  await fs.writeFile(tf, JSON.stringify(t));
  const calls = srv.requests.length;
  const redo = await redoCaptions(cfg, job.clientId, job.id);
  assert.equal(redo.status, "completado");
  assert.equal(srv.requests.length, calls, "rehacer subtítulos no vuelve a llamar a ElevenLabs");
  const caps2 = JSON.parse(await fs.readFile(file(cfg, job, "work/variants/principal/captions.json"), "utf8"));
  assert.equal(caps2.pages[0].lines.flat()[1].text, "AGENCIAS");
});

test("palabras de baja confianza → entregado pero requiere revisión", async () => {
  const cfg = cfgFor("dlow");
  srv.script.push({ kind: "ok", maxSec: 7, lowLogprobWords: ["TikTok", "editan"] });
  const job = await submitJob(cfg, { clientId: "hookhouse", video, overrides: { captionMode: "frases" } });
  assert.equal(job.status, "requiere_revision", JSON.stringify(job.errors));
  assert.ok(job.warnings.some((w) => w.code === "baja_confianza" && w.message.includes('"TikTok"')));
});

test("8. error del proveedor (401) → trabajo fallido; tras arreglarlo, reintento sin repetir lo hecho", async () => {
  const cfg = cfgFor("d8");
  srv.script.push({ kind: "status", status: 401, body: { detail: { status: "invalid_api_key", message: "Invalid API key" } } });
  const job = await submitJob(cfg, { clientId: "hookhouse", video });
  assert.equal(job.status, "fallido");
  assert.equal(job.errors.at(-1)!.code, "elevenlabs_401");
  assert.match(job.errors.at(-1)!.message, /clave no válida/);
  const prepared = job.steps.prepare.finishedAt;
  srv.script.push({ kind: "ok", maxSec: 7 });
  const ok = await retryJob(cfg, job.clientId, job.id);
  assert.equal(ok.status, "completado", JSON.stringify(ok.errors));
  assert.equal(ok.steps.prepare.finishedAt, prepared);
});

test("límite de presupuesto → fallo antes de llamar a la API", async () => {
  const cfg = cfgFor("dbudget", { HH_STT_MAX_SECONDS_PER_JOB: "3" });
  const calls = srv.requests.length;
  const job = await submitJob(cfg, { clientId: "hookhouse", video });
  assert.equal(job.status, "fallido");
  assert.equal(job.errors.at(-1)!.code, "presupuesto");
  assert.equal(srv.requests.length, calls);
});

test("sin clave configurada (ni transcripción local) → continúa sin subtítulos y lo explica", async () => {
  const cfg = cfgFor("dnokey", { ELEVENLABS_API_KEY: "", HH_ASR_MODEL_DIR: path.join(tmp, "sin-modelo") });
  const calls = srv.requests.length;
  const job = await submitJob(cfg, { clientId: "hookhouse", video, overrides: { format: "cuadrado" } });
  assert.equal(job.status, "requiere_revision");
  assert.ok(job.warnings.some((w) => w.message.includes("ELEVENLABS_API_KEY")));
  assert.equal(srv.requests.length, calls);
});

// Transcripción local REAL (sherpa-onnx + Parakeet, sin simulación): solo si el modelo está instalado (npm run setup:asr)
const localReady = localAsrAvailable(loadConfig(process.env));
test("sin clave y con la transcripción local instalada → transcribe en este equipo sin llamar a la API", { skip: localReady ? false : "modelo local no instalado (npm run setup:asr)" }, async () => {
  const cfg = cfgFor("dlocal", { ELEVENLABS_API_KEY: "" });
  const calls = srv.requests.length;
  const job = await submitJob(cfg, { clientId: "hookhouse", video, overrides: { format: "cuadrado" } });
  assert.ok(["completado", "requiere_revision"].includes(job.status), JSON.stringify(job.errors));
  assert.equal(srv.requests.length, calls, "no se llama a ElevenLabs");
  const tr = JSON.parse(await fs.readFile(file(cfg, job, "work/transcript.json"), "utf8"));
  assert.equal(tr.provider, "local");
  assert.equal(tr.source, "local");
  assert.ok(tr.words.length >= 12, `${tr.words.length} palabras`);
  const text = tr.words.map((w: { text: string }) => w.text.toLowerCase()).join(" ");
  for (const w of ["agencias", "tiktok", "videos"]) assert.ok(text.includes(w), `falta «${w}» en: ${text}`);
  for (let i = 1; i < tr.words.length; i++) assert.ok(tr.words[i].startMs >= tr.words[i - 1].startMs);
  const report = await fs.readFile(file(cfg, job, "output/informe.md"), "utf8");
  assert.match(report, /el audio no salió de él/);
});
