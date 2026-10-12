import { bundle } from "@remotion/bundler";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ROOT } from "../config";
import { exists, sha256 } from "../util/fs";

// Empaqueta el proyecto Remotion una vez y lo reutiliza mientras no cambie el código fuente,
// los perfiles de cliente ni las dependencias (la clave es un hash de todo eso).

const walk = async (dir: string): Promise<string[]> => {
  const out: string[] = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
};

export const sourceHash = async () => {
  const files = [
    ...(await walk(path.join(ROOT, "src"))),
    ...(await walk(path.join(ROOT, "clients"))).filter((f) => f.endsWith("profile.json")),
    path.join(ROOT, "package-lock.json"),
    path.join(ROOT, "remotion.config.ts"),
  ].sort();
  const parts: string[] = [];
  for (const f of files) {
    const st = await fs.stat(f);
    parts.push(`${path.relative(ROOT, f)}:${st.size}:${sha256(await fs.readFile(f))}`);
  }
  // public/ entra por nombre y tamaño (los audios pesan; basta para invalidar si cambian)
  for (const f of (await walk(path.join(ROOT, "public"))).sort()) {
    parts.push(`${path.relative(ROOT, f)}:${(await fs.stat(f)).size}`);
  }
  return sha256(parts.join("\n")).slice(0, 16);
};

export const getBundle = async (onLog?: (m: string) => void): Promise<{ serveUrl: string; hash: string }> => {
  const hash = await sourceHash();
  const outDir = path.join(ROOT, ".cache", "remotion-bundle", hash);
  if (exists(path.join(outDir, "index.html"))) return { serveUrl: outDir, hash };
  onLog?.(`Empaquetando el proyecto Remotion (${hash})…`);
  const tmp = `${outDir}.tmp-${process.pid}`;
  await fs.rm(tmp, { recursive: true, force: true });
  await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    outDir: tmp,
    rspack: true,
    publicDir: path.join(ROOT, "public"),
  });
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.rename(tmp, outDir);
  return { serveUrl: outDir, hash };
};
