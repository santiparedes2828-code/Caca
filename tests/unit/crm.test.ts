import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { addMessage, emptyDb, findDuplicate, importProspects, loadDb, pendientes, resumen, saveDb, setEstado, toCsv } from "../../autopilot/crm/store";

const base = {
  nombre: "The Example Show (Jane Doe)",
  segmento: "podcaster",
  nicho: "B2B marketing",
  perfiles: { youtube: "https://www.youtube.com/@exampleshow", web: "https://exampleshow.com" },
  contacto_publico: "hello@exampleshow.com",
  contacto_fuente: "https://exampleshow.com/contact",
  evidencia_necesidad: ["No Shorts on the channel (https://www.youtube.com/@exampleshow/shorts)"],
  prioridad: "A",
  fuentes: ["https://exampleshow.com"],
  verificado: "2026-10-12",
};

test("importa prospectos válidos y descarta duplicados por URL, email o nombre", () => {
  const db = emptyDb();
  const r1 = importProspects(db, [base], "2026-10-12");
  assert.deepEqual(r1.added, ["the-example-show"]);
  const r2 = importProspects(
    db,
    [
      { ...base, nombre: "Otro nombre", perfiles: { youtube: "https://youtube.com/@ExampleShow/videos" }, contacto_publico: null },
      { ...base, nombre: "Distinto", perfiles: {}, contacto_publico: "HELLO@exampleshow.com" },
      { ...base, nombre: "The Example Show", perfiles: {}, contacto_publico: null },
    ],
    "2026-10-12",
  );
  assert.equal(r2.added.length, 0);
  assert.equal(r2.duplicates.length, 3);
  assert.ok(findDuplicate(db, { nombre: "x", perfiles: { web: "http://exampleshow.com/" }, contacto_publico: null }));
});

test("rechaza prospectos sin fuentes o sin evidencia de necesidad (no se inventan datos)", () => {
  const db = emptyDb();
  const r = importProspects(db, [{ ...base, fuentes: [] }, { ...base, nombre: "B", perfiles: {}, contacto_publico: null, evidencia_necesidad: [] }], "2026-10-12");
  assert.equal(r.added.length, 0);
  assert.equal(r.invalid.length, 2);
});

test("borrador → enviado → seguimientos a 3, 7 y 14 días → respuesta", () => {
  const db = emptyDb();
  importProspects(db, [base], "2026-10-12");
  const id = "the-example-show";
  addMessage(db, id, { canal: "email", tipo: "borrador", paso: "primer-contacto", asunto: "Hi", texto: "Hello" }, "2026-10-12");
  assert.equal(db.prospectos[0].estado, "mensaje-listo");
  assert.equal(pendientes(db, "2026-10-12")[0].accion, "revisar y aprobar el primer mensaje");
  addMessage(db, id, { canal: "email", tipo: "enviado", paso: "primer-contacto", asunto: "Hi", texto: "Hello", fecha: "2026-10-13" }, "2026-10-13");
  assert.equal(db.prospectos[0].estado, "contactado");
  assert.equal(db.prospectos[0].proximo_seguimiento, "2026-10-16");
  assert.equal(pendientes(db, "2026-10-15")[0].vencido, false);
  assert.equal(pendientes(db, "2026-10-16")[0].vencido, true);
  addMessage(db, id, { canal: "email", tipo: "enviado", paso: "seguimiento-1", asunto: null, texto: "Bump", fecha: "2026-10-16" }, "2026-10-16");
  assert.equal(db.prospectos[0].proximo_seguimiento, "2026-10-20");
  addMessage(db, id, { canal: "email", tipo: "recibido", paso: "respuesta", asunto: null, texto: "Interested" }, "2026-10-17");
  assert.equal(db.prospectos[0].estado, "respondio");
  assert.equal(db.prospectos[0].proximo_seguimiento, null);
  const s = resumen(db);
  assert.equal(s.contactados, 1);
  assert.equal(s.tasaRespuesta, 1);
  setEstado(db, id, "cliente", "300 USD/mes", "2026-10-20");
  assert.equal(db.prospectos[0].estado, "cliente");
});

test("guarda y vuelve a cargar la base validada; exporta CSV", async () => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "crm-")), "db.json");
  const db = emptyDb();
  importProspects(db, [{ ...base, notas: 'dice "hola", y más' }], "2026-10-12");
  await saveDb(db, file);
  const again = await loadDb(file);
  assert.equal(again.prospectos.length, 1);
  const csv = toCsv(again);
  assert.match(csv.split("\n")[0], /^id,nombre,segmento/);
  assert.match(csv, /"The Example Show \(Jane Doe\)"|The Example Show \(Jane Doe\)/);
});

test("un borrador sin aprobar no se puede marcar como enviado; aprobado sí", async () => {
  const { approveDraft, markSent } = await import("../../autopilot/crm/store");
  const db = emptyDb();
  importProspects(db, [base], "2026-10-12");
  const id = "the-example-show";
  addMessage(db, id, { canal: "email", tipo: "borrador", paso: "primer-contacto", asunto: "Hi", texto: "Hello" }, "2026-10-12");
  addMessage(db, id, { canal: "email", tipo: "borrador", paso: "seguimiento-1", asunto: null, texto: "Bump" }, "2026-10-12");
  assert.equal(pendientes(db, "2026-10-12")[0].accion, "revisar y aprobar el primer mensaje");
  assert.throws(() => markSent(db, id, "primer-contacto", undefined, "2026-10-13"), /no está aprobado/);
  approveDraft(db, id, "primer-contacto", "2026-10-12");
  assert.equal(pendientes(db, "2026-10-12")[0].accion, "aprobado: enviar el primer mensaje");
  markSent(db, id, "primer-contacto", undefined, "2026-10-13");
  assert.equal(db.prospectos[0].estado, "contactado");
  const t = pendientes(db, "2026-10-16")[0];
  assert.equal(t.accion, "seguimiento-1 (borrador listo)");
  assert.equal(t.vencido, true);
});
