// Interfaz de Hook House Autopilot. Sin dependencias; habla solo con /api (misma origen, cookie de sesión).
"use strict";
const $ = (s) => document.querySelector(s);
let csrf = "";
let me = null;
let current = null;

const api = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  if (opts.method && opts.method !== "GET") headers["X-HH-CSRF"] = csrf;
  const r = await fetch(path, { ...opts, headers, credentials: "same-origin" });
  const body = r.headers.get("content-type")?.includes("json") ? await r.json() : null;
  if (r.status === 401 && path !== "/api/login") return showLogin();
  if (!r.ok) throw new Error(body?.error || `Error ${r.status}`);
  return body;
};

const text = (el, t) => ((el.textContent = t), el);
const make = (tag, props = {}, kids = []) => {
  const el = document.createElement(tag);
  Object.assign(el, props);
  for (const k of kids) el.append(k);
  return el;
};

const STATUS = { completado: "ok", requiere_revision: "warn", fallido: "bad", cancelado: "bad" };
const pill = (s) => make("span", { className: `pill ${STATUS[s] || ""}`, textContent: s.replace("_", " ") });

function showLogin() {
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#who").textContent = "";
}

async function start() {
  try {
    const r = await api("/api/me");
    if (!r) return;
    csrf = r.csrf;
    me = r.user;
    $("#login").hidden = true;
    $("#app").hidden = false;
    text($("#who"), `${me.username} · ${me.role === "admin" ? "admin" : me.clientId}`).append(" ", make("button", { className: "secondary", textContent: "Salir", onclick: logout }));
    const clients = await api("/api/clients");
    for (const sel of document.querySelectorAll("select.clients")) {
      sel.replaceChildren(...clients.map((c) => make("option", { value: c.id, textContent: c.name })));
    }
    refresh();
    setInterval(refresh, 3000);
  } catch {
    showLogin();
  }
}

async function logout() {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  location.reload();
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    const r = await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: f.get("username"), password: f.get("password") }) });
    csrf = r.csrf;
    start();
  } catch (err) {
    text($("#login-error"), err.message);
  }
});

for (const b of document.querySelectorAll(".tab")) {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
    $("#edit-form").hidden = b.dataset.tab !== "edit";
    $("#create-form").hidden = b.dataset.tab !== "create";
  });
}

const sendForm = (formSel, url, errSel) =>
  $(formSel).addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button");
    const fd = new FormData(form);
    // Las casillas sin marcar no viajan: se envían explícitamente como false
    for (const cb of form.querySelectorAll("input[type=checkbox]")) fd.set(cb.name, cb.checked ? "true" : "false");
    btn.disabled = true;
    text($(errSel), "");
    try {
      const job = await api(url, { method: "POST", body: fd });
      form.reset();
      openJob(job.clientId, job.id);
      refresh();
    } catch (err) {
      text($(errSel), err.message);
    } finally {
      btn.disabled = false;
    }
  });
sendForm("#edit-form", "/api/jobs", "#edit-error");
sendForm("#create-form", "/api/create", "#create-error");

async function refresh() {
  const [jobs, q] = await Promise.all([api("/api/jobs"), api("/api/queue")]);
  if (!jobs) return;
  text($("#queue"), `cola ${q.paused ? "en pausa" : "activa"} · ${q.pending} pendientes · ${q.running} en curso`);
  $("#jobs tbody").replaceChildren(
    ...jobs.map((j) =>
      make("tr", { onclick: () => openJob(j.clientId, j.id) }, [
        make("td", { textContent: j.id }),
        make("td", { textContent: j.clientId }),
        make("td", { textContent: j.type }),
        make("td", {}, [pill(j.status)]),
        make("td", { textContent: `${Math.round(j.progress * 100)} %` }),
        make("td", { textContent: j.verdict || "" }),
      ]),
    ),
  );
  if (current) openJob(current.clientId, current.id, true);
}

async function openJob(clientId, id, silent) {
  const d = await api(`/api/jobs/${clientId}/${id}`);
  if (!d) return;
  const j = d.job;
  const changed = !current || current.id !== id || current.updatedAt !== j.updatedAt;
  current = j;
  $("#detail").hidden = false;
  text($("#d-title"), `Trabajo ${j.id}`);
  text($("#d-status"), `${j.status.replace("_", " ")}${j.verdict ? ` · ${j.verdict}` : ""}${j.queued ? " · en cola" : ""}${j.nextRetryAt ? ` · reintento ${new Date(j.nextRetryAt).toLocaleTimeString()}` : ""}`);
  $("#d-bar").style.width = `${Math.round(j.progress * 100)}%`;
  $("#d-cancel").hidden = ["completado", "requiere_revision", "fallido", "cancelado"].includes(j.status);
  $("#d-retry").hidden = !["fallido", "cancelado"].includes(j.status);
  $("#d-approve").hidden = !j.warnings.some((w) => w.code === "plan_pendiente");
  if (!changed && silent) return;
  const file = (p, dl) => `/api/jobs/${j.clientId}/${j.id}/file?path=${encodeURIComponent(p)}${dl ? "&download=1" : ""}`;
  $("#d-outputs").replaceChildren(
    ...j.outputs
      .filter((o) => o.kind === "video")
      .map((o) =>
        make("div", {}, [
          make("video", { src: file(o.path), controls: true, preload: "metadata" }),
          make("div", {}, [make("strong", { textContent: o.variant || "vídeo" }), " · ", make("a", { href: file(o.path, true), textContent: "descargar MP4" })]),
          ...j.outputs.filter((s) => s.kind === "subtitulos_srt" && s.variant === o.variant).map((s) => make("a", { href: file(s.path, true), textContent: "descargar SRT" })),
        ]),
      ),
  );
  $("#d-issues").replaceChildren(
    ...j.errors.map((e) => make("div", { className: "issue bad", textContent: `[${e.step}] ${e.message}` })),
    ...j.warnings.map((w) => make("div", { className: "issue", textContent: `[${w.step}] ${w.message}` })),
  );
  text($("#d-plan"), d.plan || "Sin plan todavía.");
  text($("#d-report"), d.report || "Sin informe todavía.");
}

const act = (sel, action) =>
  $(sel).addEventListener("click", async () => {
    if (!current) return;
    try {
      await api(`/api/jobs/${current.clientId}/${current.id}/${action}`, { method: "POST" });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  });
act("#d-cancel", "cancel");
act("#d-retry", "retry");
act("#d-approve", "approve");
$("#d-close").addEventListener("click", () => {
  current = null;
  $("#detail").hidden = true;
});

start();
