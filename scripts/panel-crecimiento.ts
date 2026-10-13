// Genera crecimiento/panel.html (página para el teléfono) desde la base de datos comercial.
// Uso: npx tsx scripts/panel-crecimiento.ts   → luego se publica como artefacto.
import { writeFileSync } from "node:fs";
import { loadDb, pendientes, resumen } from "../autopilot/crm/store";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const link = (u: string | null | undefined, label: string) => (u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label)}</a>` : "");

const main = async () => {
  const db = await loadDb();
  const r = resumen(db);
  const todo = pendientes(db);
  const order = { A: 0, B: 1, C: 2 } as const;
  const list = [...db.prospectos].sort((a, b) => order[a.prioridad] - order[b.prioridad] || a.nombre.localeCompare(b.nombre));
  const drafts = list.filter((p) => p.estado === "mensaje-listo");

  const latest = (p: (typeof list)[number], paso: string) => [...p.mensajes].reverse().find((m) => m.tipo === "borrador" && m.paso === paso);
  const NIVEL = { propio: "en su propia web o canal", tercero: "solo en directorios", ninguno: "no encontrado", "sin-verificar": "sin verificar" } as const;
  const draftCards = drafts
    .map((p, i) => {
      const steps = (["primer-contacto", "seguimiento-1", "seguimiento-2", "seguimiento-3"] as const).map((k) => [k, latest(p, k)] as const).filter(([, m]) => m);
      const d = steps[0]?.[1];
      if (!d) return "";
      const last = p.contenido_reciente[0];
      const msgs = steps
        .map(([k, m], j) => {
          const key = `m${i}-${j}`;
          const label = k === "primer-contacto" ? "Primer mensaje" : k === "seguimiento-1" ? "Seguimiento 1 · día 3" : k === "seguimiento-2" ? "Seguimiento 2 · día 7" : "Seguimiento 3 · día 14";
          const body = `<p class="lbl">${label}${m!.aprobado ? " · aprobado" : ""}</p>${m!.asunto ? `<p class="contact"><span class="lbl">Asunto</span> <span class="sel">${esc(m!.asunto)}</span></p>` : ""}<pre class="msg" id="${key}">${esc(m!.texto)}</pre><div class="row"><button type="button" data-copy="${key}">Copiar</button><span class="hint" data-hint="${key}"></span></div>`;
          return j === 0 ? body : `<details><summary>${label}</summary>${body}</details>`;
        })
        .join("");
      return `<article class="draft" id="p${i + 1}">
  <header><span class="num">${i + 1}</span><h3>${esc(p.nombre)}</h3></header>
  <p class="meta">${esc(p.nicho)}${p.tamano ? ` · ${esc(p.tamano)}` : ""}</p>
  <p class="contact"><span class="lbl">Enviar a</span> <span class="sel">${esc(p.contacto_publico ?? "—")}</span> ${p.contacto_fuente ? `· ${link(p.contacto_fuente, NIVEL[p.contacto_nivel])}` : ""}</p>
  ${last ? `<p class="contact"><span class="lbl">Último episodio</span> ${esc(last.titulo)}${last.fecha ? ` (${esc(last.fecha)})` : ""} ${link(last.url, "fuente")}</p>` : ""}
  <details><summary>Por qué lo elegí</summary><ul>${p.evidencia_necesidad.map((e) => `<li>${esc(e)}</li>`).join("")}</ul><p class="note">${esc(p.notas)}</p></details>
  ${msgs}
  <details><summary>Comprobar antes de enviar (2 minutos)</summary><ul>
    <li>Abre el enlace del contacto: ¿sigue ahí?</li>
    <li>Abre su YouTube y su Instagram: si ya publican clips verticales a menudo, quita la frase «I couldn't find clips…» o descártalo.</li>
    <li>Confirma el título del episodio que cita el mensaje.</li>
    <li>Cambia «[Your name]» por tu nombre.</li>
  </ul></details>
</article>`;
    })
    .join("\n");

  const rows = list
    .map(
      (p) => `<details class="pros">
  <summary><span class="prio p${p.prioridad}">${p.prioridad}</span><span class="name">${esc(p.nombre)}</span><span class="state">${esc(p.estado)}</span></summary>
  <div class="body">
    <p class="meta">${esc(p.nicho)} · ${esc(p.segmento)}${p.tamano ? ` · ${esc(p.tamano)}` : ""}</p>
    <p><span class="lbl">Frecuencia</span> ${esc(p.frecuencia ?? "sin verificar")}</p>
    <p><span class="lbl">Contacto</span> <span class="sel">${esc(p.contacto_publico ?? "—")}</span></p>
    <p class="lbl">Evidencia de necesidad</p><ul>${p.evidencia_necesidad.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
    <p class="lbl">Perfiles</p><p class="links">${Object.entries(p.perfiles).filter(([, u]) => u).map(([k, u]) => link(u, k)).join(" · ") || "—"}</p>
    <p class="note">${esc(p.notas)}</p>
    <p class="links">Fuentes: ${p.fuentes.map((u, k) => link(u, String(k + 1))).join(" ")}</p>
  </div>
</details>`,
    )
    .join("\n");

  const html = `<title>Hook House Prospectos</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap">
<style>
/* Panel de trabajo comercial: resumen arriba, luego lo que toca hoy (borradores), luego la base completa. Solo Inter (regla de la casa). */
:root { --bg:#F4F6F3; --surface:#FFFFFF; --ink:#141714; --muted:#5E6A61; --line:#DCE3DD; --accent:#12A150; --accent-ink:#FFFFFF; --warn:#B7791F; --mono:#EEF2EE;
  --font: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0F1311; --surface:#171D19; --ink:#E9EFEA; --muted:#93A197; --line:#2A332D; --accent:#2BC06A; --accent-ink:#06210F; --warn:#E0A84A; --mono:#1E2621; color-scheme: dark } }
:root[data-theme="dark"] { --bg:#0F1311; --surface:#171D19; --ink:#E9EFEA; --muted:#93A197; --line:#2A332D; --accent:#2BC06A; --accent-ink:#06210F; --warn:#E0A84A; --mono:#1E2621; color-scheme: dark }
body { background:var(--bg); color:var(--ink); font-family:var(--font); font-weight:500; line-height:1.45; }
.wrap { max-width: 760px; margin: 0 auto; padding-inline: 16px; padding-block: 20px 48px; display:flex; flex-direction:column; gap:28px; }
h1 { font-weight:800; font-size:1.7rem; letter-spacing:-0.03em; margin:0; text-wrap:balance }
h1 b { color:var(--accent) }
h2 { font-weight:800; font-size:1.15rem; margin:0 0 10px; letter-spacing:-0.01em }
h3 { font-weight:700; font-size:1rem; margin:0; min-width:0 }
.sub { color:var(--muted); margin:6px 0 0; max-width:62ch }
.stats { display:grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap:10px; }
.stat { background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:12px 14px; }
.stat .n { font-weight:800; font-size:1.6rem; font-variant-numeric: tabular-nums }
.stat .t { color:var(--muted); font-size:.82rem }
.warnbox { border-left:4px solid var(--warn); background:var(--surface); padding:12px 14px; border-radius:0 10px 10px 0; font-size:.92rem }
.draft { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:16px; display:flex; flex-direction:column; gap:8px; min-width:0 }
.draft header, summary { display:flex; align-items:center; gap:10px; }
.num { display:inline-grid; place-items:center; min-width:30px; height:30px; border-radius:9px; background:var(--accent); color:var(--accent-ink); font-weight:800; flex:none }
.prio { display:inline-grid; place-items:center; width:26px; height:26px; border-radius:8px; font-weight:800; font-size:.8rem; flex:none; border:1px solid var(--line) }
.pA, .pB { background:var(--accent); color:var(--accent-ink); border-color:transparent }
.pC { background:var(--mono); color:var(--muted) }
.meta { color:var(--muted); font-size:.85rem; margin:0 }
.contact { margin:0; font-size:.9rem; overflow-wrap:anywhere }
.lbl { color:var(--muted); font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; font-weight:700; margin:0 }
.sel { user-select:all; font-weight:700 }
.msg { white-space:pre-wrap; font-family:var(--font); font-size:.95rem; background:var(--mono); border-radius:10px; padding:12px; margin:0; overflow-wrap:anywhere }
.row { display:flex; gap:10px; align-items:center; flex-wrap:wrap }
button { font:inherit; font-weight:700; background:var(--accent); color:var(--accent-ink); border:0; border-radius:10px; padding:10px 16px; cursor:pointer }
button:focus-visible, summary:focus-visible, a:focus-visible { outline:3px solid var(--accent); outline-offset:2px }
.hint { color:var(--muted); font-size:.85rem }
details ul { margin:6px 0 0; padding-left:20px; font-size:.9rem }
code { font-size:.82rem; background:var(--mono); padding:1px 5px; border-radius:5px; overflow-wrap:anywhere }
summary { cursor:pointer; font-weight:700; list-style:none }
.pros { background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:10px 14px }
.pros .name { flex:1; min-width:0; overflow-wrap:anywhere }
.pros .state { font-size:.75rem; color:var(--muted); font-weight:700 }
.pros .body { padding-top:8px; display:flex; flex-direction:column; gap:6px; font-size:.9rem }
.pros .body p { margin:0 } .note { color:var(--muted); font-size:.82rem }
.links a { color:var(--accent); font-weight:700; overflow-wrap:anywhere }
a { color:var(--accent) }
.list { display:flex; flex-direction:column; gap:8px }
.offer { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap:10px }
.offer div { background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:14px }
.offer .price { font-weight:800; font-size:1.4rem; font-variant-numeric: tabular-nums }
</style>
<div class="wrap">
  <section>
    <h1>hook<b>house.</b> · primer cliente en 30 días</h1>
    <p class="sub">Prospectos reales, mensajes listos para que los apruebes y envíes tú, y lo que toca hoy. Actualizado ${esc(new Date().toISOString().slice(0, 10))} desde <code>crecimiento/datos/prospectos.json</code>.</p>
  </section>
  <section class="stats" aria-label="Resumen">
    <div class="stat"><div class="n">${r.total}</div><div class="t">prospectos en la base</div></div>
    <div class="stat"><div class="n">${(r.porPrioridad.A ?? 0) + (r.porPrioridad.B ?? 0)}</div><div class="t">prioridad A o B</div></div>
    <div class="stat"><div class="n">${drafts.length}</div><div class="t">prospectos por aprobar</div></div>
    <div class="stat"><div class="n">${r.contactados}</div><div class="t">contactados</div></div>
    <div class="stat"><div class="n">${r.respondieron}</div><div class="t">respondieron</div></div>
    <div class="stat"><div class="n">${todo.filter((t) => t.vencido).length}</div><div class="t">tareas para hoy</div></div>
  </section>
  <p class="warnbox"><b>Datos sin abrir las páginas.</b> El entorno bloquea YouTube y la mayoría de webs, así que todo sale de resultados de búsqueda (cada ficha dice qué falta comprobar). Revisa el canal antes de enviar cada mensaje.</p>
  <section>
    <h2>Top ${drafts.length}: para aprobar</h2>
    <p class="sub">Revisa cada uno y dime en el chat cuáles apruebas (por ejemplo «apruebo 1, 3 y 7» o «apruebo 2 cambiando…»). Nada se envía hasta entonces, y lo envías tú.</p>
    <div class="list">${draftCards || "<p class='sub'>No hay borradores pendientes.</p>"}</div>
  </section>
  <section>
    <h2>Oferta</h2>
    <div class="offer">
      <div><p class="lbl">Básico</p><p class="price">175 USD/mes</p><p class="meta">6 clips al mes, 48 h, 2 rondas de cambios, mes a mes</p></div>
      <div><p class="lbl">Medio</p><p class="price">374,99 USD/mes</p><p class="meta">12 clips (3/semana)</p></div>
      <div><p class="lbl">Max</p><p class="price">679,99 USD/mes</p><p class="meta">24 clips (6/semana) + nota mensual de retención</p></div>
      <div><p class="lbl">Muestra</p><p class="price">Gratis</p><p class="meta">1 clip de un episodio suyo, sin compromiso</p></div>
    </div>
    <p class="sub">Margen estimado por mes, descontando la comisión de cobro y antes de tus suscripciones:</p>
    <ul class="sub">
      <li>Básico: 165–170 USD, por 3–4 h de tu tiempo.</li>
      <li>Medio: 354–364 USD, por 5–7 h.</li>
      <li>Max: 643–660 USD, por 9–13 h.</li>
    </ul>
    <p class="sub">Transcripción y render: 0 USD, en tu equipo. Detalle en <code>crecimiento/oferta.md</code>.</p>
  </section>
  <section>
    <h2>Todos los prospectos (${r.total})</h2>
    <div class="list">${rows}</div>
  </section>
</div>
<script>
document.querySelectorAll("button[data-copy]").forEach((b) => {
  b.addEventListener("click", () => {
    const el = document.getElementById(b.dataset.copy);
    const hint = document.querySelector('[data-hint="' + b.dataset.copy + '"]');
    const done = (t) => { if (hint) hint.textContent = t; };
    const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done("Seleccionado: cópialo con el menú del teléfono"); };
    try { navigator.clipboard.writeText(el.textContent).then(() => done("Copiado"), select); } catch (e) { select(); }
  });
});
</script>
`;
  writeFileSync("crecimiento/panel.html", html);
  console.log(`crecimiento/panel.html: ${r.total} prospectos, ${drafts.length} borradores`);
};

main();
