import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { loadJob, saveJob } from "../../autopilot/jobs/store";
import { submitJob } from "../../autopilot/pipeline/run";
import { costSummary, enqueue, nextJobs, pauseQueue, queueStatus, resumeQueue, work } from "../../autopilot/queue/queue";
import { makeFixtures } from "../fixtures";

// Etapa 6: cola con lote, concurrencia, recuperación tras un corte y reintentos de fallos temporales.
const tmp = path.join(ROOT, ".cache", "test-queue", String(process.pid));
const cfg = loadConfig({ ...process.env, ELEVENLABS_API_KEY: "", HH_DATA_DIR: path.join(tmp, "data"), HH_QC_FRAMES: "2", HH_QUEUE_POLL_SEC: "0.2" });
let fx: Awaited<ReturnType<typeof makeFixtures>>;

before(async () => {
  fx = await makeFixtures(path.join(tmp, "fx"), 3);
});
after(async () => fs.rm(tmp, { recursive: true, force: true }));

test("lote en cola, pausa, trabajador con concurrencia 2, recuperación y reintentos", async () => {
  const sub = (video: string, captions: string | null = null) => submitJob(cfg, { clientId: "hookhouse", video, captions, overrides: { cutSilences: false } }, { run: false });
  const a = await enqueue(cfg, await sub(fx.horizontal, fx.srt));
  const b = await enqueue(cfg, await sub(fx.noAudio));
  const bad = await enqueue(cfg, await sub(fx.fake));
  assert.equal(bad.status, "fallido");
  assert.equal(bad.queuedAt, null, "un archivo rechazado no entra en la cola");

  // Pausa: el trabajador no toma nada
  await pauseQueue(cfg);
  assert.equal(await work(cfg, { once: true }), 0);
  await resumeQueue(cfg);
  assert.equal((await queueStatus(cfg)).pending, 2);

  // Un trabajo "a medias" cuyo proceso murió (estado intermedio sin bloqueo vivo) se recupera
  const c = await enqueue(cfg, await sub(fx.horizontal, fx.srt));
  const cj = await loadJob(cfg, c.clientId, c.id);
  cj.status = "renderizando";
  await saveJob(cfg, cj);

  // Un fallo temporal (503 del proveedor) con reintento ya vencido vuelve a la cola; uno permanente no
  const d = await enqueue(cfg, await sub(fx.horizontal, fx.srt));
  const dj = await loadJob(cfg, d.clientId, d.id);
  dj.status = "fallido";
  dj.errors.push({ step: "captions", code: "elevenlabs_503", message: "simulado" });
  dj.nextRetryAt = new Date(Date.now() - 1000).toISOString();
  await saveJob(cfg, dj);
  const reasons = (await nextJobs(cfg, new Set())).map((e) => `${e.job.id === c.id ? "c" : e.job.id === d.id ? "d" : "x"}:${e.reason}`);
  assert.ok(reasons.includes("c:recuperado") && reasons.includes("d:reintento"), reasons.join(","));

  const t0 = Date.now();
  const n = await work(cfg, { once: true, concurrency: 2, log: () => undefined });
  assert.equal(n, 4);
  for (const id of [a.id, b.id, c.id, d.id]) {
    const j = await loadJob(cfg, "hookhouse", id);
    assert.ok(["completado", "requiere_revision"].includes(j.status), `${id}: ${j.status} ${JSON.stringify(j.errors)}`);
    assert.equal(j.queuedAt, null);
  }
  assert.equal((await queueStatus(cfg)).pending, 0);
  const costs = await costSummary(cfg, 1);
  assert.equal(costs.byClient.hookhouse.jobs, 5);
  assert.ok(Date.now() - t0 < 600_000);
});
