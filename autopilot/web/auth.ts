import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CLIENT_ID } from "../clients/profile";
import type { Config } from "../config";
import { writeJsonAtomic } from "../util/fs";

// Usuarios de la interfaz web: data/users.json con contraseñas derivadas con scrypt (nunca en claro).
//   admin   → ve y gestiona todos los clientes
//   cliente → solo su cliente (clientId)

const userSchema = z.object({
  username: z.string().regex(/^[a-z0-9._-]{3,40}$/),
  role: z.enum(["admin", "cliente"]),
  clientId: z.string().regex(CLIENT_ID).nullable(),
  salt: z.string(),
  hash: z.string(),
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;
export type PublicUser = Pick<User, "username" | "role" | "clientId">;

const file = (cfg: Config) => path.join(cfg.HH_DATA_DIR, "users.json");

export const loadUsers = async (cfg: Config): Promise<User[]> => {
  const raw = await fs.readFile(file(cfg), "utf8").catch(() => "[]");
  return z.array(userSchema).parse(JSON.parse(raw));
};

const derive = (password: string, salt: string) => scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");

export const createUser = async (cfg: Config, u: { username: string; password: string; role: User["role"]; clientId: string | null }) => {
  if (u.password.length < 10) throw new Error("La contraseña debe tener al menos 10 caracteres");
  if (u.role === "cliente" && !u.clientId) throw new Error("Un usuario de cliente necesita --cliente");
  const users = await loadUsers(cfg);
  if (users.some((x) => x.username === u.username)) throw new Error(`Ya existe el usuario ${u.username}`);
  const salt = randomBytes(16).toString("hex");
  const user = userSchema.parse({ username: u.username, role: u.role, clientId: u.role === "admin" ? null : u.clientId, salt, hash: derive(u.password, salt), createdAt: new Date().toISOString() });
  await fs.mkdir(path.dirname(file(cfg)), { recursive: true });
  await writeJsonAtomic(file(cfg), [...users, user]);
  await fs.chmod(file(cfg), 0o600);
  return { username: user.username, role: user.role, clientId: user.clientId } as PublicUser;
};

export const verifyUser = async (cfg: Config, username: string, password: string): Promise<PublicUser | null> => {
  const users = await loadUsers(cfg);
  const u = users.find((x) => x.username === username);
  // Se deriva igualmente si no existe, para no revelar qué usuarios existen por el tiempo de respuesta
  const candidate = Buffer.from(derive(password, u?.salt ?? "0".repeat(32)), "hex");
  if (!u) return null;
  const ok = timingSafeEqual(candidate, Buffer.from(u.hash, "hex"));
  return ok ? { username: u.username, role: u.role, clientId: u.clientId } : null;
};

export const canAccess = (u: PublicUser, clientId: string) => u.role === "admin" || u.clientId === clientId;

// Sesiones en memoria (se pierden al reiniciar el servidor; basta con volver a entrar)
type Session = { user: PublicUser; csrf: string; expires: number };
const sessions = new Map<string, Session>();
const TTL = 8 * 3600_000;

export const newSession = (user: PublicUser) => {
  const token = randomBytes(32).toString("hex");
  const s = { user, csrf: randomBytes(16).toString("hex"), expires: Date.now() + TTL };
  sessions.set(token, s);
  return { token, ...s };
};
export const getSession = (token: string | undefined) => {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s || s.expires < Date.now()) {
    sessions.delete(token ?? "");
    return null;
  }
  return s;
};
export const dropSession = (token: string | undefined) => token && sessions.delete(token);

// Límite de intentos de acceso por IP: 10 cada 15 minutos
const attempts = new Map<string, number[]>();
export const loginAllowed = (ip: string) => {
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  attempts.set(ip, list);
  return list.length < 10;
};
export const loginFailed = (ip: string) => attempts.set(ip, [...(attempts.get(ip) ?? []), Date.now()]);
