import { spawn } from "node:child_process";

// Ejecuta binarios conocidos (ffmpeg, ffprobe, python3) con argumentos en array: nunca a través de una shell,
// así que un nombre de archivo del cliente no puede inyectar comandos.
export type ExecResult = { code: number; stdout: string; stderr: string };

export const run = (
  cmd: string,
  args: string[],
  opts: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ExecResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], signal: opts.signal });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => {
      stderr += d;
      if (stderr.length > 4_000_000) stderr = stderr.slice(-2_000_000);
    });
    const timer = opts.timeoutMs ? setTimeout(() => child.kill("SIGKILL"), opts.timeoutMs) : undefined;
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });

export const runOk = async (cmd: string, args: string[], opts: { timeoutMs?: number; signal?: AbortSignal } = {}) => {
  const r = await run(cmd, args, opts);
  if (r.code !== 0) {
    const tail = r.stderr.trim().split("\n").slice(-6).join("\n");
    throw new Error(`${cmd} terminó con código ${r.code}: ${tail}`);
  }
  return r;
};
