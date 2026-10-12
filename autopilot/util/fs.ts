import { createHash } from "node:crypto";
import { createReadStream, existsSync, promises as fs } from "node:fs";
import path from "node:path";

// Escritura atómica: un corte a mitad nunca deja un job.json o informe a medias
export const writeJsonAtomic = async (file: string, data: unknown) => {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
};

export const writeTextAtomic = async (file: string, text: string) => {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, text);
  await fs.rename(tmp, file);
};

export const readJson = async <T>(file: string): Promise<T> => JSON.parse(await fs.readFile(file, "utf8")) as T;

// Resuelve una ruta relativa y garantiza que queda dentro de base (sin ../ ni enlaces que escapen)
export const resolveInside = (base: string, rel: string) => {
  const root = path.resolve(base);
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Ruta fuera de la carpeta permitida");
  }
  return full;
};

export const sha256File = (file: string) =>
  new Promise<string>((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(file)
      .on("data", (d) => h.update(d))
      .on("error", reject)
      .on("end", () => resolve(h.digest("hex")));
  });

export const sha256 = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");

// Nombre de archivo seguro: sin rutas, sin caracteres de control, longitud limitada
export const safeName = (name: string) => {
  const base = path.basename(name).normalize("NFC");
  const ext = path.extname(base).toLowerCase();
  const stem = base
    .slice(0, base.length - ext.length)
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .replace(/^[._]+/, "")
    .slice(0, 80);
  return `${stem || "archivo"}${ext.replace(/[^a-z0-9.]/g, "")}`;
};

export const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

export const exists = (p: string) => existsSync(p);
