import { appendFileSync } from "node:fs";
import { SECRET_ENV } from "../config";

// Log en JSON por líneas. Antes de escribir se tachan los valores de cualquier variable de entorno secreta
// y las rutas absolutas de la máquina (los informes solo muestran rutas relativas al trabajo).
const secrets = () =>
  Object.entries(process.env)
    .filter(([k, v]) => SECRET_ENV.test(k) && v && v.length >= 6)
    .map(([, v]) => v as string);

export const redact = (s: string, roots: string[] = []) => {
  let out = s;
  for (const v of secrets()) out = out.split(v).join("***");
  for (const r of roots) if (r) out = out.split(r).join("…");
  return out;
};

export type Logger = {
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
};

export const createLogger = (file: string | null, roots: string[], echo = true): Logger => {
  const write = (level: string, msg: string, data?: Record<string, unknown>) => {
    const line = redact(JSON.stringify({ t: new Date().toISOString(), level, msg, ...data }), roots);
    if (file) appendFileSync(file, line + "\n");
    if (echo) {
      const tag = level === "error" ? "✖" : level === "warn" ? "!" : "·";
      process.stdout.write(`${tag} ${redact(msg, roots)}\n`);
    }
  };
  return {
    info: (m, d) => write("info", m, d),
    warn: (m, d) => write("warn", m, d),
    error: (m, d) => write("error", m, d),
  };
};
