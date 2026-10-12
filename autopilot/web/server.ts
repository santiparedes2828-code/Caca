import Busboy from "busboy";
import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { listClients, loadProfile } from "../clients/profile";
import { ROOT, type Config } from "../config";
import { submitCreation } from "../create/run";
import { parseAnimaciones } from "../create/theme";
import { jobDir, listJobs, loadJob, requestCancel, saveJob } from "../jobs/store";
import { jobOverridesSchema, type Job, type JobOverrides } from "../jobs/types";
import { submitJob } from "../pipeline/run";
import { costSummary, enqueue, queueStatus, work } from "../queue/queue";
import { resolveInside, safeName } from "../util/fs";
import { canAccess, dropSession, getSession, loginAllowed, loginFailed, newSession, verifyUser, type PublicUser } from "./auth";

// Interfaz web (Etapa 7). Pensada para uso local o detrás de un proxy HTTPS: escucha en 127.0.0.1 por defecto.
// - Toda la API exige sesión; las peticiones que cambian algo exigen además la cabecera X-HH-CSRF.
// - Cada usuario de cliente solo ve y toca los trabajos de su cliente (comprobado en cada ruta).
// - Las subidas se escriben en streaming con límite de tamaño y se validan con la misma ingesta que la CLI.
// - Nunca se envían claves ni rutas de la máquina al navegador.

const WEB = path.join(ROOT, "web");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".srt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
};

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const security = (res: http.ServerResponse) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'");
};

const json = (res: http.ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
};

const cookies = (req: http.IncomingMessage) =>
  Object.fromEntries((req.headers.cookie ?? "").split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2)) as Record<string, string>;

const readJsonBody = async (req: http.IncomingMessage) => {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 64 * 1024) throw new HttpError(413, "Petición demasiado grande");
    chunks.push(c as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}") as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "JSON no válido");
  }
};

// Subida multipart en streaming a data/uploads/<aleatorio>/ con límites
const readMultipart = (cfg: Config, req: http.IncomingMessage) =>
  new Promise<{ fields: Record<string, string>; files: Record<string, string>; dir: string }>((resolve, reject) => {
    const dir = path.join(cfg.HH_DATA_DIR, "uploads", randomBytes(12).toString("hex"));
    const fields: Record<string, string> = {};
    const files: Record<string, string> = {};
    const writes: Promise<void>[] = [];
    let bb: ReturnType<typeof Busboy>;
    try {
      bb = Busboy({ headers: req.headers, limits: { fileSize: cfg.HH_MAX_UPLOAD_MB * 1024 * 1024, files: 4, fields: 40, fieldSize: 8 * 1024 } });
    } catch {
      return reject(new HttpError(400, "Se esperaba un formulario multipart"));
    }
    bb.on("field", (name, value) => (fields[name] = value));
    bb.on("file", (name, stream, info) => {
      if (!["video", "captions", "guion", "audio", "tiempos"].includes(name) || !info.filename) {
        stream.resume();
        return;
      }
      const target = path.join(dir, `${name}-${safeName(info.filename)}`);
      files[name] = target;
      writes.push(
        (async () => {
          await fs.mkdir(dir, { recursive: true });
          await pipeline(stream, createWriteStream(target));
          if ((stream as unknown as { truncated?: boolean }).truncated) throw new HttpError(413, `${info.filename} supera el tamaño máximo`);
        })(),
      );
    });
    // Si la subida falla a mitad (tamaño, conexión cortada), no quedan restos en data/uploads/
    const fail = (e: unknown) => fs.rm(dir, { recursive: true, force: true }).finally(() => reject(e));
    bb.on("error", fail);
    bb.on("close", () => {
      Promise.all(writes).then(() => resolve({ fields, files, dir }), fail);
    });
    req.pipe(bb);
  });

const bool = (v: string | undefined) => (v === undefined ? undefined : v === "on" || v === "true" || v === "1");
const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));

// Campos del formulario → ajustes del trabajo (validados con el mismo esquema que la CLI)
const overridesFromForm = (f: Record<string, string>): JobOverrides => {
  const o: Record<string, unknown> = {
    format: f.format || undefined,
    captionMode: f.captionMode || undefined,
    intensity: f.intensity || undefined,
    editMode: f.editMode || undefined,
    cutSilences: bool(f.cutSilences),
    followFaces: bool(f.followFaces),
    transcribe: bool(f.transcribe),
    broll: bool(f.broll),
    music: bool(f.music),
    keepPrincipal: bool(f.keepPrincipal),
    approvePlan: bool(f.approvePlan),
    planner: f.planner || undefined,
  };
  if (f.clipCount || f.clipMin || f.clipMax) o.clips = { count: num(f.clipCount), minSec: num(f.clipMin), maxSec: num(f.clipMax) };
  if (f.shortVersions) o.shortVersions = f.shortVersions.split(",").map(Number).filter((x) => x > 0);
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  const p = jobOverridesSchema.safeParse(o);
  if (!p.success) throw new HttpError(400, `Ajustes no válidos: ${p.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  return p.data;
};

// Vista pública de un trabajo (sin rutas de la máquina)
const publicJob = (j: Job) => ({
  id: j.id,
  clientId: j.clientId,
  type: j.type,
  status: j.status,
  progress: j.progress,
  verdict: j.verdict,
  createdAt: j.createdAt,
  updatedAt: j.updatedAt,
  config: j.config,
  inputs: j.inputs.map((i) => ({ role: i.role, name: i.originalName, bytes: i.bytes })),
  outputs: j.outputs,
  warnings: j.warnings,
  errors: j.errors,
  costs: j.costs,
  queued: !!j.queuedAt,
  nextRetryAt: j.nextRetryAt,
});

const sendFile = async (req: http.IncomingMessage, res: http.ServerResponse, file: string, download: boolean) => {
  const st = await fs.stat(file).catch(() => null);
  if (!st?.isFile()) throw new HttpError(404, "No existe");
  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string | number> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, no-store" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${path.basename(file).replace(/[^\w.-]/g, "_")}"`;
  const m = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m) {
    const start = m[1] ? Number(m[1]) : st.size - Number(m[2]);
    const end = m[1] && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
    if (start > end || start < 0) throw new HttpError(416, "Rango no válido");
    res.writeHead(206, { ...headers, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${st.size}` });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, "Content-Length": st.size });
  createReadStream(file).pipe(res);
};

export const createWebServer = (cfg: Config, opts: { worker?: boolean } = {}) => {
  let stopWorker = false;
  const workerDone = opts.worker === false ? Promise.resolve(0) : work(cfg, { stop: () => stopWorker, log: (m) => console.log(`[cola] ${m}`) });

  const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    security(res);
    const url = new URL(req.url ?? "/", "http://localhost");
    const p = url.pathname;
    const method = req.method ?? "GET";

    // Archivos estáticos de la interfaz
    if (method === "GET" && !p.startsWith("/api/")) {
      // La tipografía de la casa (Inter, OFL) se sirve desde public/fonts
      const font = p.match(/^\/fonts\/(inter-latin-[0-9]{3}-normal\.woff2)$/);
      if (font) return sendFile(req, res, resolveInside(path.join(ROOT, "public", "fonts"), font[1]), false);
      const rel = p === "/" ? "index.html" : p.slice(1);
      if (!/^[a-z0-9-]+\.(html|js|css)$/.test(rel)) throw new HttpError(404, "No existe");
      return sendFile(req, res, resolveInside(WEB, rel), false);
    }

    const token = cookies(req).hh_sesion;
    if (p === "/api/login" && method === "POST") {
      const ip = req.socket.remoteAddress ?? "?";
      if (!loginAllowed(ip)) throw new HttpError(429, "Demasiados intentos; espera unos minutos");
      const b = await readJsonBody(req);
      const user = await verifyUser(cfg, String(b.username ?? ""), String(b.password ?? ""));
      if (!user) {
        loginFailed(ip);
        throw new HttpError(401, "Usuario o contraseña incorrectos");
      }
      const s = newSession(user);
      const secure = cfg.HH_WEB_SECURE_COOKIE ? "; Secure" : "";
      res.setHeader("Set-Cookie", `hh_sesion=${s.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`);
      return json(res, 200, { user, csrf: s.csrf });
    }

    const session = getSession(token);
    if (!session) throw new HttpError(401, "Inicia sesión");
    const user: PublicUser = session.user;
    if (method !== "GET" && req.headers["x-hh-csrf"] !== session.csrf) throw new HttpError(403, "Falta la protección CSRF");

    if (p === "/api/logout" && method === "POST") {
      dropSession(token);
      res.setHeader("Set-Cookie", "hh_sesion=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
      return json(res, 200, { ok: true });
    }
    if (p === "/api/me") return json(res, 200, { user, csrf: session.csrf });

    if (p === "/api/clients" && method === "GET") {
      const ids = user.role === "admin" ? await listClients(cfg.HH_CLIENTS_DIR) : [user.clientId!];
      const out = [];
      for (const id of ids) {
        const pr = await loadProfile(cfg.HH_CLIENTS_DIR, id);
        out.push({ id, name: pr.name, defaults: { format: pr.defaults.format, captionMode: pr.defaults.captionMode, intensity: pr.defaults.intensity, editMode: pr.defaults.editorial.mode } });
      }
      return json(res, 200, out);
    }

    const clientParam = (c: string | null) => {
      const id = c ?? user.clientId;
      if (!id || !canAccess(user, id)) throw new HttpError(403, "Sin acceso a ese cliente");
      return id;
    };

    if (p === "/api/jobs" && method === "GET") {
      const ids = url.searchParams.get("client") ? [clientParam(url.searchParams.get("client"))] : user.role === "admin" ? await listClients(cfg.HH_CLIENTS_DIR) : [user.clientId!];
      const all: Job[] = [];
      for (const id of ids) all.push(...(await listJobs(cfg, id)));
      return json(res, 200, all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 200).map(publicJob));
    }

    if (p === "/api/jobs" && method === "POST") {
      const up = await readMultipart(cfg, req);
      try {
        const clientId = clientParam(up.fields.clientId || null);
        if (!up.files.video) throw new HttpError(400, "Falta el vídeo");
        const job = await submitJob(cfg, { clientId, video: up.files.video, captions: up.files.captions ?? null, overrides: overridesFromForm(up.fields) }, { run: false });
        return json(res, job.status === "fallido" ? 422 : 201, publicJob(await enqueue(cfg, job)));
      } finally {
        await fs.rm(up.dir, { recursive: true, force: true }); // los originales ya están copiados en el trabajo
      }
    }

    if (p === "/api/create" && method === "POST") {
      const up = await readMultipart(cfg, req);
      try {
        const clientId = clientParam(up.fields.clientId || null);
        let script = up.files.guion ?? null;
        if (!script && up.fields.scriptText) {
          script = path.join(up.dir, "guion.txt");
          await fs.mkdir(up.dir, { recursive: true });
          await fs.writeFile(script, up.fields.scriptText);
        }
        const job = await submitCreation(
          cfg,
          {
            clientId,
            script,
            brief: up.fields.brief || null,
            type: up.fields.type || "redes",
            seconds: num(up.fields.seconds) ?? 30,
            audio: up.files.audio ?? null,
            timings: up.files.tiempos ?? null,
            label: up.fields.label ?? "",
            silent: up.fields.silent === "true",
            style: up.fields.style === "tema" || up.fields.style === "marca" ? up.fields.style : "auto",
            animations: up.fields.animations === "todas" || up.fields.animations === "ninguna" ? parseAnimaciones(up.fields.animations) : null,
          },
          { run: false },
        );
        return json(res, job.status === "fallido" ? 422 : 201, publicJob(await enqueue(cfg, job)));
      } finally {
        await fs.rm(up.dir, { recursive: true, force: true });
      }
    }

    const m = p.match(/^\/api\/jobs\/([a-z0-9-]+)\/(\d{8}-\d{6}-[0-9a-f]{6})(\/[a-z]+)?$/);
    if (m) {
      const clientId = clientParam(m[1]);
      const job = await loadJob(cfg, clientId, m[2]).catch(() => {
        throw new HttpError(404, "No existe el trabajo");
      });
      const dir = jobDir(cfg, clientId, job.id);
      const action = m[3];
      if (!action && method === "GET") {
        const read = (rel: string) => fs.readFile(path.join(dir, rel), "utf8").catch(() => null);
        return json(res, 200, { job: publicJob(job), report: await read("output/informe.md"), plan: await read("output/plan.md") });
      }
      if (action === "/file" && method === "GET") {
        const rel = url.searchParams.get("path") ?? "";
        if (!rel.startsWith("output/")) throw new HttpError(403, "Solo se pueden descargar salidas");
        // Se resuelve DENTRO de output/: "output/../job.json" no sale de ahí
        return sendFile(req, res, resolveInside(path.join(dir, "output"), rel.slice("output/".length)), url.searchParams.get("download") === "1");
      }
      if (action === "/cancel" && method === "POST") {
        await requestCancel(cfg, job);
        if (job.status === "recibido") {
          job.status = "cancelado";
          job.queuedAt = null;
          await saveJob(cfg, job);
        }
        return json(res, 200, { ok: true });
      }
      if (action === "/retry" && method === "POST") {
        if (job.status !== "fallido" && job.status !== "cancelado") throw new HttpError(409, "Solo se reintenta un trabajo fallido o cancelado");
        await fs.rm(path.join(dir, "cancel.request"), { force: true });
        job.status = "recibido";
        job.queuedAt = new Date().toISOString();
        job.nextRetryAt = null;
        await saveJob(cfg, job);
        return json(res, 200, publicJob(job));
      }
      if (action === "/approve" && method === "POST") {
        if (!job.warnings.some((w) => w.code === "plan_pendiente") || job.planApproved) throw new HttpError(409, "No hay un plan pendiente de aprobar");
        job.planApproved = true;
        job.warnings = job.warnings.filter((w) => w.code !== "plan_pendiente");
        job.status = "recibido";
        job.queuedAt = new Date().toISOString();
        await saveJob(cfg, job);
        return json(res, 200, publicJob(job));
      }
    }

    if (p === "/api/queue" && method === "GET") {
      const q = await queueStatus(cfg);
      return json(res, 200, { paused: q.paused, pending: q.pending, running: q.running, retrying: q.retrying });
    }
    if (p === "/api/costs" && method === "GET") {
      if (user.role !== "admin") throw new HttpError(403, "Solo administradores");
      return json(res, 200, await costSummary(cfg, 30));
    }
    throw new HttpError(404, "No existe");
  };

  const server = http.createServer((req, res) => {
    handler(req, res).catch((e: unknown) => {
      const status = e instanceof HttpError ? e.status : (e as Error).message === "Ruta fuera de la carpeta permitida" ? 403 : 500;
      if (status === 500) console.error("[web]", (e as Error).message);
      if (!res.headersSent) json(res, status, { error: status === 500 ? "Error interno" : (e as Error).message });
      else res.end();
    });
  });
  return {
    server,
    listen: (port: number, host: string) =>
      new Promise<number>((resolve) => server.listen(port, host, () => resolve((server.address() as AddressInfo).port))),
    close: async () => {
      stopWorker = true;
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
      await workerDone;
    },
  };
};
