import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

// Configuración desde variables de entorno (.env opcional, nunca en Git). Ver .env.example.
export const ROOT = path.resolve(__dirname, "..");

const envFile = path.join(ROOT, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const num = (def: number) => z.coerce.number().positive().default(def);

const schema = z.object({
  HH_DATA_DIR: z.string().default(path.join(ROOT, "data")),
  HH_INBOX_DIR: z.string().default(path.join(ROOT, "inbox")),
  HH_CLIENTS_DIR: z.string().default(path.join(ROOT, "clients")),
  HH_MAX_UPLOAD_MB: num(4096),
  HH_MAX_DURATION_SEC: num(3 * 3600),
  HH_RENDER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(Math.max(1, Math.min(4, os.cpus().length))),
  HH_RENDER_TIMEOUT_MS: num(120_000),
  HH_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  HH_QC_FRAMES: z.coerce.number().int().min(1).max(30).default(6),
  // ElevenLabs (transcripción). Sin clave, el pipeline sigue sin transcribir y lo avisa.
  ELEVENLABS_API_KEY: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  ELEVENLABS_BASE_URL: z.string().url().default("https://api.elevenlabs.io"),
  HH_STT_MAX_SECONDS_PER_JOB: num(3600),
  HH_STT_MAX_SECONDS_PER_DAY: num(4 * 3600),
  HH_STT_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  HH_STT_TIMEOUT_MS: num(15 * 60_000),
  // Precio por hora de audio de TU plan, solo para estimar (no se inventa: si no se define, no hay estimación)
  HH_ELEVENLABS_STT_USD_PER_HOUR: z.coerce.number().positive().optional(),
  REMOTION_BROWSER_EXECUTABLE: z.string().optional(),
  REMOTION_LICENSE_KEY: z.string().optional(),
});

export type Config = z.infer<typeof schema>;

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => schema.parse(env);

// En el contenedor cloud no se puede descargar Chrome Headless Shell: se usa el Chromium preinstalado
const CLOUD_CHROMIUM = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
export const browserExecutable = (cfg: Config) =>
  cfg.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(CLOUD_CHROMIUM) ? CLOUD_CHROMIUM : null);

// Nombres de variables cuyo valor nunca debe aparecer en logs ni informes
export const SECRET_ENV = /KEY|TOKEN|SECRET|PASSWORD/i;
