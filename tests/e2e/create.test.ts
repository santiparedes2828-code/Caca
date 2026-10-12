import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { loadConfig, ROOT } from "../../autopilot/config";
import { submitCreation } from "../../autopilot/create/run";
import { jobDir } from "../../autopilot/jobs/store";
import { probe } from "../../autopilot/media/probe";

// Creación de extremo a extremo con render real: con tema según la idea (sin voz) y con la identidad de
// la marca (narración real de ElevenLabs, voz_a, con sus tiempos por palabra).
const tmp = path.join(ROOT, ".cache", "test-e2e-create", String(process.pid));
before(async () => {
  await fs.mkdir(tmp, { recursive: true });
});
after(async () => {
  if (!process.env.KEEP_E2E) await fs.rm(tmp, { recursive: true, force: true });
});

const cfgFor = (name: string) => loadConfig({ ...process.env, ELEVENLABS_API_KEY: "", ANTHROPIC_API_KEY: "", HH_DATA_DIR: path.join(tmp, name), HH_QC_FRAMES: "3" });

test("idea → tema según el contenido con iconos con licencia, sin voz (el sonido se pone en la plataforma)", async () => {
  const cfg = cfgFor("tema");
  const script = path.join(tmp, "pizza.txt");
  await fs.writeFile(script, "La *pizza* nació en Nápoles.\n\n[lista: Tomate | Queso]\nTomate y queso, nada más.\n\n[cta: PIZZA]\nComenta pizza si la quieres.\n");
  const job = await submitCreation(cfg, { clientId: "hookhouse", script, brief: "Receta de pizza casera", silent: true, label: "Receta" });
  assert.equal(job.status, "requiere_revision", JSON.stringify(job.errors));
  assert.equal(job.verdict, "ADVERTENCIA");
  assert.ok(job.warnings.some((w) => w.code === "sin_voz"));
  const dir = jobDir(cfg, "hookhouse", job.id);
  const pr = await probe(path.join(dir, job.outputs.find((o) => o.kind === "video")!.path));
  assert.deepEqual([pr.video?.width, pr.video?.height], [1080, 1920]);
  assert.equal(pr.audio, null);
  const props = JSON.parse(await fs.readFile(path.join(dir, "work", "create-props.json"), "utf8"));
  assert.equal(props.theme.id, "comida");
  assert.equal(props.scenes[0].icon, "pizza");
  const report = await fs.readFile(path.join(dir, "output", "informe.md"), "utf8");
  assert.match(report, /tema Comida/);
  assert.match(report, /Fluent Emoji en color \(Microsoft\) · MIT/);
});

test("anuncio de la propia marca → identidad de Hook House con narración real y sus tiempos", async () => {
  const cfg = cfgFor("marca");
  const script = path.join(tmp, "guion.txt");
  await fs.writeFile(
    script,
    "Las agencias que más crecen en *TikTok* no editan sus videos.\n\nTú grabas diez minutos y pierdes una tarde entera editando.\n\n[lista: Cortes | Subtítulos | Zooms]\nCortes, subtítulos, zooms, música.\n\nNo es falta de talento, es falta de *sistema*.\n\nNosotros automatizamos tu edición.\n\nSubes el video en bruto y te lo devolvemos listo para publicar, con el ritmo que retiene y hace que te sigan.\n\n[lista: Agencias | Coaches | Creadores]\nPara agencias, coaches y creadores.\n\nNo necesitas otro editor, necesitas un *sistema*.\n\n[cta: AUTO]\nEscríbeme auto y te muestro cómo funciona.\n",
  );
  const job = await submitCreation(cfg, {
    clientId: "hookhouse",
    script,
    audio: path.join(ROOT, "public/audio/voz_a.mp3"),
    timings: path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"),
    style: "marca",
    type: "anuncio",
  });
  assert.equal(job.verdict, "APROBADO", JSON.stringify(job.errors));
  const dir = jobDir(cfg, "hookhouse", job.id);
  const props = JSON.parse(await fs.readFile(path.join(dir, "work", "create-props.json"), "utf8"));
  assert.equal(props.theme, undefined);
  assert.match(await fs.readFile(path.join(dir, "output", "informe.md"), "utf8"), /identidad de Hook House/);
});

test("ciencia con modelos animados, palabras que brillan, efectos de sonido y claves en Garamond (excepción)", async () => {
  const cfg = cfgFor("modelos");
  const script = path.join(tmp, "ciencia.txt");
  await fs.writeFile(script, "Ganó el *Nobel* de física.\n\n[modelo: atomo]\nPublicó cuatro artículos.\n\n[modelo: formula | E=mc²]\nLa *ecuación* más famosa.\n");
  const job = await submitCreation(cfg, { clientId: "hookhouse", script, brief: "Reel sobre Albert Einstein", silent: true, sfx: true, accentFont: "garamond", accentScale: 1.25 });
  assert.ok(["completado", "requiere_revision"].includes(job.status), JSON.stringify(job.errors));
  const dir = jobDir(cfg, "hookhouse", job.id);
  const props = JSON.parse(await fs.readFile(path.join(dir, "work", "create-props.json"), "utf8"));
  assert.equal(props.theme.id, "ciencia");
  assert.deepEqual(props.scenes.map((s: { component: string; label: string }) => `${s.component}:${s.label}`), ["titular:", "modelo:atomo", "modelo:formula"]);
  assert.ok(props.sfx.some((e: { name: string }) => e.name === "brillo") && props.sfx.some((e: { name: string }) => e.name === "whoosh"));
  const pr = await probe(path.join(dir, job.outputs.find((o) => o.kind === "video")!.path));
  assert.ok(pr.audio, "los efectos de sonido van en la pista de audio");
  assert.match(await fs.readFile(path.join(dir, "output", "informe.md"), "utf8"), /EB Garamond Bold Italic/);
});
