import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { createUser } from "../../autopilot/web/auth";
import { createWebServer } from "../../autopilot/web/server";
import { makeFixtures } from "../fixtures";

// Etapa 7: interfaz web real por HTTP (servidor + trabajador de cola en el mismo proceso).
const tmp = path.join(ROOT, ".cache", "test-web", String(process.pid));
let fx: Awaited<ReturnType<typeof makeFixtures>>;
let base = "";
let web: ReturnType<typeof createWebServer>;
const clientsDir = path.join(tmp, "clients");

before(async () => {
  fx = await makeFixtures(path.join(tmp, "fx"), 3);
  // Dos clientes: hookhouse (copia del real) y otro-cliente
  const hh = JSON.parse(await fs.readFile(path.join(ROOT, "clients/hookhouse/profile.json"), "utf8"));
  for (const id of ["hookhouse", "otro-cliente"]) {
    await fs.mkdir(path.join(clientsDir, id), { recursive: true });
    await fs.writeFile(path.join(clientsDir, id, "profile.json"), JSON.stringify({ ...hh, id, name: id }));
  }
  const cfg = loadConfig({
    ...process.env,
    ELEVENLABS_API_KEY: "",
    HH_DATA_DIR: path.join(tmp, "data"),
    HH_CLIENTS_DIR: clientsDir,
    HH_QC_FRAMES: "2",
    HH_QUEUE_POLL_SEC: "0.3",
  });
  await createUser(cfg, { username: "ana", password: "contraseña-segura-1", role: "cliente", clientId: "hookhouse" });
  await createUser(cfg, { username: "beto", password: "contraseña-segura-2", role: "cliente", clientId: "otro-cliente" });
  web = createWebServer(cfg);
  base = `http://127.0.0.1:${await web.listen(0, "127.0.0.1")}`;
});
after(async () => {
  await web?.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

const login = async (username: string, password: string) => {
  const r = await fetch(`${base}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
  const body = await r.json();
  return { status: r.status, cookie: (r.headers.get("set-cookie") ?? "").split(";")[0], csrf: body.csrf as string, set: r.headers.get("set-cookie") ?? "" };
};

test("acceso, CSRF, subida, cola, descarga y aislamiento entre clientes", async () => {
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.match((await fetch(`${base}/`)).headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.equal((await fetch(`${base}/api/jobs`)).status, 401);
  assert.equal((await login("ana", "mal")).status, 401);
  const ana = await login("ana", "contraseña-segura-1");
  assert.equal(ana.status, 200);
  assert.match(ana.set, /HttpOnly; SameSite=Strict/);

  const form = new FormData();
  form.set("video", new Blob([await fs.readFile(fx.horizontal)]), "mi video.mp4");
  form.set("captions", new Blob([await fs.readFile(fx.srt)]), "mi video.srt");
  form.set("cutSilences", "false");
  form.set("broll", "false");
  form.set("music", "false");
  // Sin la cabecera CSRF no se acepta
  assert.equal((await fetch(`${base}/api/jobs`, { method: "POST", headers: { Cookie: ana.cookie }, body: form })).status, 403);
  // Ana no puede subir a otro cliente
  const other = new FormData();
  other.set("clientId", "otro-cliente");
  other.set("video", new Blob([await fs.readFile(fx.horizontal)]), "x.mp4");
  assert.equal((await fetch(`${base}/api/jobs`, { method: "POST", headers: { Cookie: ana.cookie, "X-HH-CSRF": ana.csrf }, body: other })).status, 403);

  const created = await fetch(`${base}/api/jobs`, { method: "POST", headers: { Cookie: ana.cookie, "X-HH-CSRF": ana.csrf }, body: form });
  assert.equal(created.status, 201);
  const job = await created.json();
  assert.equal(job.clientId, "hookhouse");
  assert.ok(!JSON.stringify(job).includes(tmp), "sin rutas de la máquina");

  // Un archivo falso se rechaza con 422
  const bad = new FormData();
  bad.set("video", new Blob([await fs.readFile(fx.fake)]), "falso.mp4");
  assert.equal((await fetch(`${base}/api/jobs`, { method: "POST", headers: { Cookie: ana.cookie, "X-HH-CSRF": ana.csrf }, body: bad })).status, 422);

  // El trabajador de la cola lo procesa
  let d: { job: { status: string; outputs: { kind: string; path: string }[] }; report: string | null } | null = null;
  for (let i = 0; i < 300; i++) {
    d = await (await fetch(`${base}/api/jobs/hookhouse/${job.id}`, { headers: { Cookie: ana.cookie } })).json();
    if (["completado", "requiere_revision", "fallido"].includes(d!.job.status)) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.ok(["completado", "requiere_revision"].includes(d!.job.status), JSON.stringify(d!.job));
  assert.match(d!.report ?? "", /Vídeo principal/);
  const mp4 = d!.job.outputs.find((o) => o.kind === "video")!;
  const dl = await fetch(`${base}/api/jobs/hookhouse/${job.id}/file?path=${encodeURIComponent(mp4.path)}`, { headers: { Cookie: ana.cookie, Range: "bytes=0-99" } });
  assert.equal(dl.status, 206);
  assert.equal((await dl.arrayBuffer()).byteLength, 100);
  // Solo salidas, sin salir de la carpeta del trabajo
  assert.equal((await fetch(`${base}/api/jobs/hookhouse/${job.id}/file?path=job.json`, { headers: { Cookie: ana.cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/jobs/hookhouse/${job.id}/file?path=output/../job.json`, { headers: { Cookie: ana.cookie } })).status, 403);

  // Beto (otro cliente) no ve ni descarga nada de hookhouse
  const beto = await login("beto", "contraseña-segura-2");
  const list = await (await fetch(`${base}/api/jobs`, { headers: { Cookie: beto.cookie } })).json();
  assert.deepEqual(list, []);
  assert.equal((await fetch(`${base}/api/jobs/hookhouse/${job.id}`, { headers: { Cookie: beto.cookie } })).status, 403);
  assert.equal((await fetch(`${base}/api/costs`, { headers: { Cookie: beto.cookie } })).status, 403);

  // Cerrar sesión invalida la cookie
  await fetch(`${base}/api/logout`, { method: "POST", headers: { Cookie: ana.cookie, "X-HH-CSRF": ana.csrf } });
  assert.equal((await fetch(`${base}/api/jobs`, { headers: { Cookie: ana.cookie } })).status, 401);
});
