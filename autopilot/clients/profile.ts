import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { brandSchema, captionModeSchema, formatSchema, intensitySchema, reframeSchema } from "../../src/design/schema";
import { resolveInside } from "../util/fs";

// Perfil de cliente: clients/<id>/profile.json. Añadir un cliente = crear su carpeta, sin tocar código.
// Sus fuentes/logos van en clients/<id>/assets/ y se referencian como "client:<ruta>".
export const CLIENT_ID = /^[a-z0-9][a-z0-9-]{1,39}$/;

export const profileSchema = z.object({
  id: z.string().regex(CLIENT_ID),
  name: z.string().min(1),
  brand: brandSchema,
  defaults: z.object({
    format: formatSchema,
    fps: z.number().int().min(12).max(60),
    captionMode: captionModeSchema,
    intensity: intensitySchema,
    reframe: reframeSchema,
    captionsRequired: z.boolean(),
    audio: z.object({
      normalize: z.boolean(),
      targetLufs: z.number().min(-30).max(-8),
      truePeakDb: z.number().min(-6).max(0),
      denoise: z.enum(["no", "suave"]).default("no"),
    }),
    editing: z
      .object({
        cutSilences: z.boolean(), // quitar silencios sin voz (nunca palabras ni risas)
        minSilenceSec: z.number().min(0.3).max(5),
        keepPauseSec: z.number().min(0).max(1),
        silenceDb: z.number().min(-70).max(-20),
        followFaces: z.boolean(), // el encuadre sigue a la cara principal
        avoidFaces: z.boolean(), // los subtítulos se apartan de las caras
      })
      .default({ cutSilences: false, minSilenceSec: 0.8, keepPauseSec: 0.3, silenceDb: -38, followFaces: true, avoidFaces: true }),
    editorial: z
      .object({
        mode: z.enum(["talking-head", "podcast", "clips", "anuncio", "educativo"]),
        clips: z.object({ count: z.number().int().min(1).max(20), minSec: z.number().min(5), maxSec: z.number().max(600) }),
        shortVersions: z.array(z.number().min(5).max(600)), // versiones cortas del vídeo principal (s)
        keepPrincipal: z.boolean(), // en modos de clips, entregar también el vídeo completo
        broll: z.boolean(),
        // Apoyos gráficos hechos con código en vídeos hablados: calendario al decir una fecha, lista al enumerar
        graficos: z.boolean().default(false),
        music: z.object({ enabled: z.boolean(), mood: z.string().nullable(), id: z.string().nullable(), volumeDb: z.number().min(-40).max(0), duckDb: z.number().min(-40).max(0) }),
        planner: z.enum(["local", "claude"]),
        claude: z.object({ model: z.string(), effort: z.enum(["low", "medium", "high"]) }),
        approvePlan: z.boolean(), // parar tras el plan hasta que alguien lo apruebe
      })
      .default({
        mode: "talking-head",
        clips: { count: 3, minSec: 15, maxSec: 60 },
        shortVersions: [],
        keepPrincipal: true,
        broll: false,
        graficos: false,
        music: { enabled: false, mood: null, id: null, volumeDb: -22, duckDb: -10 },
        planner: "local",
        claude: { model: "claude-opus-5-5", effort: "medium" },
        approvePlan: false,
      }),
    transcription: z
      .object({
        // local: sherpa-onnx en este equipo, sin enviar el audio fuera (npm run setup:asr). Con elevenlabs y sin
        // clave configurada, se usa la local si está instalada.
        provider: z.enum(["elevenlabs", "local", "ninguno"]),
        model: z.string().min(1),
        language: z.string().regex(/^[a-z]{2,3}$/).nullable(), // ISO-639-1/3; null = detección automática
        diarize: z.boolean(),
        tagAudioEvents: z.boolean(),
        lowConfidenceLogprob: z.number().max(0), // palabras por debajo se marcan para revisar
      })
      .default({ provider: "ninguno", model: "scribe_v2", language: null, diarize: false, tagAudioEvents: false, lowConfidenceLogprob: -1 }),
    voice: z
      .object({
        provider: z.literal("elevenlabs"),
        voiceId: z.string().min(1),
        name: z.string(),
        model: z.string(),
        language: z.string(),
      })
      .optional(),
  }),
});
export type ClientProfile = z.infer<typeof profileSchema>;

export const assertClientId = (id: string) => {
  if (!CLIENT_ID.test(id)) throw new Error(`Identificador de cliente no válido: "${id}" (minúsculas, números y guiones)`);
  return id;
};

export const loadProfile = async (clientsDir: string, id: string): Promise<ClientProfile> => {
  assertClientId(id);
  const file = resolveInside(clientsDir, path.join(id, "profile.json"));
  let raw: unknown;
  try {
    raw = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    throw new Error(`No existe o no se puede leer el perfil del cliente "${id}": ${(e as Error).message}`);
  }
  const p = profileSchema.parse(raw);
  if (p.id !== id) throw new Error(`El perfil de "${id}" declara id "${p.id}"`);
  // Comprobar que las fuentes del cliente existen antes de gastar tiempo en un render
  for (const f of p.brand.fonts) {
    if (f.src.startsWith("client:")) {
      const fp = resolveInside(path.join(clientsDir, id, "assets"), f.src.slice("client:".length));
      await fs.access(fp).catch(() => {
        throw new Error(`Falta la fuente ${f.family} ${f.weight} del cliente "${id}": ${f.src}`);
      });
    }
  }
  return p;
};

export const listClients = async (clientsDir: string) => {
  const entries = await fs.readdir(clientsDir, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory() && CLIENT_ID.test(e.name)).map((e) => e.name);
};
