import { randomBytes } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { resolveInside } from "../util/fs";

// Servidor HTTP efímero para que el navegador de render lea los archivos de UN trabajo.
// - Solo escucha en 127.0.0.1 y vive lo que dura el render.
// - Cada ruta lleva un token aleatorio; sin él responde 404.
// - Solo sirve las carpetas montadas (work/ del trabajo y assets/ de su cliente): ../ y rutas absolutas se rechazan.
// - Soporta Range (lo necesitan los decodificadores de vídeo).

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

export type AssetServer = { url: (mount: string, rel: string) => string; close: () => Promise<void> };

export const startAssetServer = async (mounts: Record<string, string>): Promise<AssetServer> => {
  const token = randomBytes(16).toString("hex");
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
    if (req.method === "OPTIONS") return void res.writeHead(204).end();
    if (req.method !== "GET" && req.method !== "HEAD") return void res.writeHead(405).end();
    try {
      const u = new URL(req.url ?? "/", "http://127.0.0.1");
      const parts = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (parts[0] !== token || !parts[1] || !(parts[1] in mounts)) return void res.writeHead(404).end();
      const file = resolveInside(mounts[parts[1]], parts.slice(2).join("/"));
      const st = await fs.stat(file);
      if (!st.isFile()) return void res.writeHead(404).end();
      const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
      if (range) {
        const start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
        const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
        if (start > end || start < 0) return void res.writeHead(416, { "Content-Range": `bytes */${st.size}` }).end();
        res.writeHead(206, {
          "Content-Type": type,
          "Content-Length": end - start + 1,
          "Content-Range": `bytes ${start}-${end}/${st.size}`,
          "Accept-Ranges": "bytes",
        });
        if (req.method === "HEAD") return void res.end();
        createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes" });
      if (req.method === "HEAD") return void res.end();
      createReadStream(file).pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: (mount, rel) => `http://127.0.0.1:${port}/${token}/${mount}/${rel.split(path.sep).map(encodeURIComponent).join("/")}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
};
