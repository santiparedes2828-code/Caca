import { parseSrt } from "@remotion/captions";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { processInbox } from "../../autopilot/inbox";
import { createJob, jobDir, loadJob, requestCancel, saveJob } from "../../autopilot/jobs/store";
import { loadProfile } from "../../autopilot/clients/profile";
import { probe } from "../../autopilot/media/probe";
import { retryJob, runJob, submitJob } from "../../autopilot/pipeline";
import { sha256File } from "../../autopilot/util/fs";
import { makeFixtures } from "../fixtures";

// Pruebas de extremo a extremo: ffmpeg + Remotion reales, sin mocks. Tardan ~3-4 min en total.
const tmp = path.join(ROOT, ".cache", "test-e2e", String(process.pid));
// Sin clave de ElevenLabs: estas pruebas nunca deben llamar a la API real
const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: "", HH_DATA_DIR: path.join(tmp, "data"), HH_INBOX_DIR: path.join(tmp, "inbox") });
let fx: Awaited<ReturnType<typeof makeFixtures>>;

before(async () => {
  fx = await makeFixtures(path.join(tmp, "fx"), 4);
});
after(async () => {
  if (!process.env.KEEP_E2E) await fs.rm(tmp, { recursive: true, force: true });
});

const out = (job: { clientId: string; id: string }, rel: string) => path.join(jobDir(cfg, job.clientId, job.id), rel);

test("1+4+6+14. vídeo 16:9 con audio y SRT → vertical 1080x1920 con subtítulos, MP4, SRT e informe", async () => {
  const before = await sha256File(fx.horizontal);
  const job = await submitJob(cfg, { clientId: "hookhouse", video: fx.horizontal, captions: fx.srt });
  assert.equal(job.status, "completado", JSON.stringify(job.errors));
  assert.equal(job.verdict, "APROBADO");
  const video = job.outputs.find((o) => o.kind === "video")!;
  const p = await probe(out(job, video.path));
  assert.equal(p.video?.width, 1080);
  assert.equal(p.video?.height, 1920);
  assert.equal(p.video?.codec, "h264");
  assert.equal(p.video?.pixFmt, "yuv420p");
  assert.equal(p.audio?.codec, "aac");
  assert.ok(Math.abs(p.durationSec - 4) < 0.1);
  // SRT exportado
  const srt = await fs.readFile(out(job, job.outputs.find((o) => o.kind === "subtitulos_srt")!.path), "utf8");
  assert.ok(parseSrt({ input: srt, strict: true }).captions.length >= 2);
  // SRT solo tiene tiempos por bloque: el modo por defecto (palabra-activa) cae a frases y se avisa
  assert.ok(job.warnings.some((w) => w.message.includes("no se inventa precisión")));
  // Original intacto, copiado como solo lectura
  const orig = job.inputs.find((i) => i.role === "video")!;
  assert.equal(orig.sha256, before);
  assert.equal(await sha256File(fx.horizontal), before);
  assert.equal((await fs.stat(out(job, orig.path))).mode & 0o222, 0);
  // Informe y fotogramas de control
  const md = await fs.readFile(out(job, "output/informe.md"), "utf8");
  assert.match(md, /Control de calidad: APROBADO/);
  assert.match(md, /Reencuadre 1280x720/);
  assert.ok(!md.includes(ROOT), "el informe no debe contener rutas de la máquina");
  await fs.access(out(job, "output/qc/hoja_contacto.jpg"));
  const log = await fs.readFile(out(job, "logs/job.log"), "utf8");
  assert.ok(!log.includes(ROOT), "el log no debe contener rutas de la máquina");
});

test("subtítulos por palabra (JSON) en modo dinámico, alto impacto y formato cuadrado", async () => {
  const job = await submitJob(cfg, {
    clientId: "hookhouse",
    video: fx.horizontal,
    captions: fx.words,
    overrides: { captionMode: "dinamico", intensity: "alto-impacto", format: "cuadrado", reframe: { mode: "blur-fill" } },
  });
  assert.equal(job.status, "completado", JSON.stringify(job.errors));
  const caps = JSON.parse(await fs.readFile(out(job, "work/captions.json"), "utf8"));
  assert.equal(caps.precision, "word");
  assert.equal(caps.mode, "dinamico");
  const p = await probe(out(job, job.outputs.find((o) => o.kind === "video")!.path));
  assert.equal(p.video?.width, 1080);
  assert.equal(p.video?.height, 1080);
});

test("2. vídeo sin audio → entregable mudo marcado como requiere revisión", async () => {
  const job = await submitJob(cfg, { clientId: "hookhouse", video: fx.noAudio });
  assert.equal(job.status, "requiere_revision", JSON.stringify(job.errors));
  assert.equal(job.verdict, "ADVERTENCIA");
  const p = await probe(out(job, job.outputs.find((o) => o.kind === "video")!.path));
  assert.equal(p.audio, null);
  assert.ok(job.warnings.some((w) => w.code === "sin_audio"));
  assert.ok(job.warnings.some((w) => w.code === "sin_subtitulos"));
});

test("3. archivo incompatible → falla en la ingesta, sin render", async () => {
  const job = await submitJob(cfg, { clientId: "hookhouse", video: fx.fake });
  assert.equal(job.status, "fallido");
  assert.equal(job.errors[0].code, "formato");
  assert.equal(job.outputs.length, 0);
  await assert.rejects(retryJob(cfg, job.clientId, job.id), /ingesta falló/);
  const bad = await submitJob(cfg, { clientId: "hookhouse", video: fx.horizontal, captions: fx.badSrt });
  assert.equal(bad.status, "fallido");
  assert.equal(bad.errors[0].step, "captions");
});

test("7. recurso faltante (fuente de marca) → fallo claro antes del render", async () => {
  const clientsDir = path.join(tmp, "clients");
  const hh = JSON.parse(await fs.readFile(path.join(ROOT, "clients/hookhouse/profile.json"), "utf8"));
  hh.id = "sin-fuente";
  hh.brand.fonts[0].src = "static:fonts/no-existe.woff2";
  await fs.mkdir(path.join(clientsDir, "sin-fuente"), { recursive: true });
  await fs.writeFile(path.join(clientsDir, "sin-fuente", "profile.json"), JSON.stringify(hh));
  const c = { ...cfg, HH_CLIENTS_DIR: clientsDir };
  const job = await submitJob(c, { clientId: "sin-fuente", video: fx.horizontal, captions: fx.srt });
  assert.equal(job.status, "fallido");
  assert.equal(job.errors.at(-1)!.code, "recurso_faltante");
  assert.equal(job.steps.render.status, "pendiente");
});

test("9+10. fallo de render y reanudación sin repetir los pasos ya hechos", async () => {
  const broken = { ...cfg, HH_RENDER_TIMEOUT_MS: 1 }; // el navegador no puede cargar nada en 1 ms
  const job = await submitJob(broken, { clientId: "hookhouse", video: fx.horizontal, captions: fx.srt });
  assert.equal(job.status, "fallido");
  assert.equal(job.errors.at(-1)!.step, "render");
  const prepared = job.steps.prepare.finishedAt;
  const resumed = await retryJob(cfg, job.clientId, job.id);
  assert.equal(resumed.status, "completado", JSON.stringify(resumed.errors));
  assert.equal(resumed.steps.prepare.finishedAt, prepared, "prepare no debe repetirse");
  assert.equal(resumed.attempts, 2);
  // Volver a ejecutar un trabajo terminado no repite nada
  const again = await runJob(cfg, job.clientId, job.id);
  assert.equal(again.attempts, 2);
  // Si se borra la copia de trabajo, se regenera solo lo necesario y no se re-renderiza si la clave no cambia
  const j = await loadJob(cfg, job.clientId, job.id);
  j.status = "fallido";
  await saveJob(cfg, j);
  await fs.rm(out(job, "work/qc.json"));
  const fixed = await retryJob(cfg, job.clientId, job.id);
  assert.equal(fixed.status, "completado");
  assert.equal(fixed.steps.render.finishedAt !== undefined, true);
});

test("cancelación antes de empezar", async () => {
  const profile = await loadProfile(cfg.HH_CLIENTS_DIR, "hookhouse");
  const job = await submitJob(cfg, { clientId: profile.id, video: fx.horizontal }, { run: false });
  await requestCancel(cfg, job);
  const r = await runJob(cfg, job.clientId, job.id);
  assert.equal(r.status, "cancelado");
  const empty = await createJob(cfg, profile);
  assert.equal(empty.status, "recibido");
});

test("12. trabajos consecutivos desde la bandeja de entrada y sin duplicados", async () => {
  const inbox = path.join(cfg.HH_INBOX_DIR, "hookhouse");
  await fs.mkdir(inbox, { recursive: true });
  await fs.copyFile(fx.horizontal, path.join(inbox, "uno.mp4"));
  await fs.copyFile(fx.srt, path.join(inbox, "uno.srt"));
  await fs.copyFile(fx.noAudio, path.join(inbox, "dos.mp4"));
  const jobs = await processInbox(cfg, "hookhouse", () => undefined, 50);
  assert.deepEqual(jobs.map((j) => j.status), ["requiere_revision", "completado"]); // orden alfabético: dos, uno
  assert.deepEqual((await fs.readdir(inbox)).filter((f) => !f.startsWith("_")), []);
  // El mismo vídeo con la misma configuración no se vuelve a renderizar
  await fs.copyFile(fx.horizontal, path.join(inbox, "uno-otra-vez.mp4"));
  await fs.copyFile(fx.srt, path.join(inbox, "uno-otra-vez.srt"));
  const [dup] = await processInbox(cfg, "hookhouse", () => undefined, 50);
  assert.equal(dup.id, jobs[1].id);
});
