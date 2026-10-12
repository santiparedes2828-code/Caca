import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { fitVideo, focusAt, zoomSegments } from "../../src/autopilot/geometry";
import { loadProfile } from "../../autopilot/clients/profile";
import { loadConfig, ROOT } from "../../autopilot/config";
import { IngestError, sniff, validateFile } from "../../autopilot/ingest/ingest";
import { acquireLock, createJob, findJob, jobDir, listJobs, resolveConfig } from "../../autopilot/jobs/store";
import { jobOverridesSchema } from "../../autopilot/jobs/types";
import { startAssetServer } from "../../autopilot/render/assetServer";
import { redact } from "../../autopilot/util/log";
import { resolveInside, safeName } from "../../autopilot/util/fs";
import { makeFixtures } from "../fixtures";

const tmp = path.join(ROOT, ".cache", "test-unit", String(process.pid));
const cfg = loadConfig({ ...process.env, HH_DATA_DIR: path.join(tmp, "data"), HH_INBOX_DIR: path.join(tmp, "inbox") });
let fx: Awaited<ReturnType<typeof makeFixtures>>;

before(async () => {
  fx = await makeFixtures(path.join(tmp, "fx"), 3);
});
after(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

test("1. vídeo válido con audio: se acepta y se detecta audio", async () => {
  const v = await validateFile(cfg, fx.horizontal, "video");
  assert.equal(v.probe?.video?.width, 1280);
  assert.ok(v.probe?.audio);
  assert.equal(v.warnings.length, 0);
});

test("2. vídeo sin audio: se acepta con advertencia", async () => {
  const v = await validateFile(cfg, fx.noAudio, "video");
  assert.equal(v.probe?.audio, null);
  assert.ok(v.warnings.some((w) => w.includes("audio")));
});

test("3. archivo incompatible: texto con extensión .mp4 y script se rechazan", async () => {
  await assert.rejects(validateFile(cfg, fx.fake, "video"), (e: IngestError) => e.code === "formato");
  await assert.rejects(validateFile(cfg, fx.script, "video"), (e: IngestError) => e.code === "formato_peligroso");
  await assert.rejects(validateFile(cfg, fx.srt, "video"), (e: IngestError) => e.code === "extension");
  const link = path.join(tmp, "enlace.mp4");
  await fs.symlink(fx.horizontal, link);
  await assert.rejects(validateFile(cfg, link, "video"), (e: IngestError) => e.code === "enlace");
  await assert.rejects(validateFile(cfg, path.join(tmp, "no-existe.mp4"), "video"), (e: IngestError) => e.code === "no_existe");
});

test("sniff reconoce firmas binarias", () => {
  assert.equal(sniff(Buffer.from([0x7f, 0x45, 0x4c, 0x46])), "executable");
  assert.equal(sniff(Buffer.from("MZ......")), "executable");
  assert.equal(sniff(Buffer.from("\0\0\0\x18ftypisom")), "mp4");
});

test("nombres y rutas seguras", () => {
  assert.equal(safeName("../../etc/passwd"), "passwd");
  assert.equal(safeName("mi vídeo (final).MP4"), "mi_vídeo_final_.mp4");
  assert.throws(() => resolveInside("/a/b", "../c"));
  assert.throws(() => resolveInside("/a/b", "/etc/passwd"));
  assert.equal(resolveInside("/a/b", "c/d"), "/a/b/c/d");
});

test("13. aislamiento entre clientes: carpetas, listados e ids", async () => {
  const clientsDir = path.join(tmp, "clients");
  const hh = JSON.parse(await fs.readFile(path.join(ROOT, "clients/hookhouse/profile.json"), "utf8"));
  for (const id of ["cliente-a", "cliente-b"]) {
    await fs.mkdir(path.join(clientsDir, id), { recursive: true });
    await fs.writeFile(path.join(clientsDir, id, "profile.json"), JSON.stringify({ ...hh, id, name: id }));
  }
  const c = { ...cfg, HH_CLIENTS_DIR: clientsDir };
  const a = await createJob(c, await loadProfile(clientsDir, "cliente-a"));
  const b = await createJob(c, await loadProfile(clientsDir, "cliente-b"));
  assert.deepEqual((await listJobs(c, "cliente-a")).map((j) => j.id), [a.id]);
  assert.deepEqual((await listJobs(c, "cliente-b")).map((j) => j.id), [b.id]);
  assert.ok(jobDir(c, "cliente-a", a.id).includes(path.join("clients", "cliente-a", "jobs")));
  assert.throws(() => jobDir(c, "../cliente-b", a.id));
  assert.throws(() => jobDir(c, "cliente-a", "../../cliente-b"));
  assert.equal((await findJob(c, b.id)).clientId, "cliente-b");
  await assert.rejects(loadProfile(clientsDir, "Cliente_Malo"));
  await assert.rejects(loadProfile(clientsDir, "no-existe"));
  // El perfil de B no puede hacerse pasar por A
  await fs.writeFile(path.join(clientsDir, "cliente-b", "profile.json"), JSON.stringify({ ...hh, id: "cliente-a" }));
  await assert.rejects(loadProfile(clientsDir, "cliente-b"));
});

test("7. recurso faltante: fuente de cliente inexistente se detecta al cargar el perfil", async () => {
  const clientsDir = path.join(tmp, "clients2");
  const hh = JSON.parse(await fs.readFile(path.join(ROOT, "clients/hookhouse/profile.json"), "utf8"));
  hh.id = "con-fuente";
  // Regla de la casa: solo Inter; aquí el cliente aporta su propio archivo de Inter, que no existe
  hh.brand.fonts.push({ role: "sans", family: "Inter", weight: "400", style: "normal", src: "client:fonts/no-existe.woff2" });
  await fs.mkdir(path.join(clientsDir, "con-fuente"), { recursive: true });
  await fs.writeFile(path.join(clientsDir, "con-fuente", "profile.json"), JSON.stringify(hh));
  await assert.rejects(loadProfile(clientsDir, "con-fuente"), /Falta la fuente Inter/);
});

test("servidor de recursos: solo con token, sin salir de la carpeta montada, con Range", async () => {
  const dir = path.join(tmp, "srv");
  await fs.mkdir(path.join(dir, "job"), { recursive: true });
  await fs.writeFile(path.join(dir, "job", "a.mp4"), "0123456789");
  await fs.writeFile(path.join(dir, "secreto.txt"), "no");
  const s = await startAssetServer({ job: path.join(dir, "job") });
  try {
    const url = s.url("job", "a.mp4");
    assert.equal(await (await fetch(url)).text(), "0123456789");
    const r = await fetch(url, { headers: { Range: "bytes=2-4" } });
    assert.equal(r.status, 206);
    assert.equal(await r.text(), "234");
    const noToken = url.replace(/\/[0-9a-f]{32}\//, "/deadbeef/");
    assert.equal((await fetch(noToken)).status, 404);
    assert.equal((await fetch(url.replace("a.mp4", "..%2Fsecreto.txt"))).status, 404);
    assert.equal((await fetch(url.replace("/job/", "/otro/"))).status, 404);
  } finally {
    await s.close();
  }
});

test("bloqueo: un trabajo no se procesa dos veces a la vez", async () => {
  const dir = path.join(tmp, "lock");
  await fs.mkdir(dir, { recursive: true });
  const release = acquireLock(dir);
  assert.throws(() => acquireLock(dir), /otro proceso/);
  release();
  const again = acquireLock(dir);
  again();
  // bloqueo huérfano (pid inexistente) se recupera
  await fs.writeFile(path.join(dir, "job.lock"), "999999");
  acquireLock(dir)();
});

test("los logs no contienen secretos", () => {
  process.env.TEST_FAKE_API_KEY = "sk_esto_es_secreto_123";
  assert.equal(redact("clave sk_esto_es_secreto_123 en /home/x/data/y", ["/home/x"]), "clave *** en …/data/y");
  delete process.env.TEST_FAKE_API_KEY;
});

test("reencuadre cover con foco y zoom por tramos", () => {
  const b = fitVideo(1920, 1080, 1080, 1920, { focusX: 0.5, focusY: 0.5 }, false);
  assert.equal(Math.round(b.h), 1920);
  assert.equal(Math.round(b.x), Math.round((1080 - b.w) / 2));
  const left = fitVideo(1920, 1080, 1080, 1920, { focusX: 0, focusY: 0.5 }, false);
  assert.equal(left.x, 0);
  const c = fitVideo(1920, 1080, 1080, 1920, { focusX: 0.5, focusY: 0.5 }, true);
  assert.equal(Math.round(c.w), 1080);
  const segs = zoomSegments(
    [0, 500, 1000, 3000, 3500, 6000].map((s) => ({ startMs: s, endMs: s + 400, lines: [[{ text: "x", startMs: s, endMs: s + 1, emphasis: false }]] })),
    2,
    8000,
  );
  assert.deepEqual(segs.map((s) => s.startMs), [0, 3000, 6000]);
  const track = [{ tMs: 0, x: 0.2, y: 0.4 }, { tMs: 1000, x: 0.2, y: 0.4 }, { tMs: 1400, x: 0.6, y: 0.4 }];
  assert.deepEqual(focusAt(track, 500, { x: 0.5, y: 0.5 }), { x: 0.2, y: 0.4 });
  assert.equal(focusAt(track, 1200, { x: 0.5, y: 0.5 }).x, 0.4);
  assert.deepEqual(focusAt(track, 9000, { x: 0.5, y: 0.5 }), { x: 0.6, y: 0.4 });
  assert.deepEqual(focusAt([], 9000, { x: 0.5, y: 0.5 }), { x: 0.5, y: 0.5 });
});

test("trabajos creados antes de la Etapa 2 (sin campos de transcripción) siguen cargando", async () => {
  const profile = await loadProfile(cfg.HH_CLIENTS_DIR, "hookhouse");
  const job = await createJob(cfg, profile);
  const file = path.join(jobDir(cfg, "hookhouse", job.id), "job.json");
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  delete raw.config.transcribe;
  delete raw.config.language;
  await fs.writeFile(file, JSON.stringify(raw));
  const loaded = (await listJobs(cfg, "hookhouse")).find((j) => j.id === job.id)!;
  assert.equal(loaded.config.transcribe, false);
  assert.equal(loaded.config.language, null);
});

test("los ajustes por vídeo vacíos no pisan los valores del perfil", async () => {
  const profile = await loadProfile(cfg.HH_CLIENTS_DIR, "hookhouse");
  assert.deepEqual(jobOverridesSchema.parse({}), {});
  const c = resolveConfig(profile, jobOverridesSchema.parse({}));
  assert.equal(c.transcribe, profile.defaults.transcription.provider !== "ninguno");
  assert.equal(c.followFaces, profile.defaults.editing.followFaces);
  assert.equal(c.cutSilences, profile.defaults.editing.cutSilences);
  assert.equal(c.language, profile.defaults.transcription.language);
  const o = resolveConfig(profile, jobOverridesSchema.parse({ transcribe: false, reframe: { focusX: 0.2 } }));
  assert.equal(o.transcribe, false);
  assert.equal(o.reframe.focusX, 0.2);
  assert.equal(o.reframe.mode, profile.defaults.reframe.mode);
  assert.throws(() => jobOverridesSchema.parse({ desconocido: 1 }));
});
