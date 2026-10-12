import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { TimedWord } from "../../src/autopilot/paginate";
import { MODELS, SCENE_COMPONENTS } from "../../src/create/props";

// Guion de un vídeo creado desde cero. Formato de texto (editable a mano):
//
//   [lista: Agencias | Coaches | Creadores]
//   Para *agencias*, coaches y creadores.
//
//   [cifra: clips | 3]
//   Te entregamos tres clips cada semana.
//
//   [cta: AUTO]
//   Escríbeme auto y te muestro cómo funciona.
//
//   [modelo: formula | E=mc²]
//   La ecuación más famosa de la historia.
//
// Bloques separados por una línea en blanco. La primera línea entre corchetes (opcional) elige el
// componente; *palabras entre asteriscos* van destacadas. Sin corchetes: titular. [modelo: atomo|luz|formula|espaciotiempo]
// pone un modelo animado en vez del icono (formula admite el texto: [modelo: formula | E=mc²]).

export type ScriptScene = {
  text: string; // texto que se narra (sin asteriscos)
  accentWords: number[]; // índices (dentro de la escena) de las palabras destacadas
  component: (typeof SCENE_COMPONENTS)[number];
  items: string[];
  label: string;
  value: string;
};

const MAX_WORDS = 14; // más palabras no caben en el titular a buen tamaño

export const parseScript = (src: string): ScriptScene[] => {
  const blocks = src
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#"));
  const scenes: ScriptScene[] = [];
  for (const b of blocks) {
    const lines = b.split("\n");
    let component: ScriptScene["component"] = "titular";
    let items: string[] = [];
    let label = "";
    let value = "";
    const m = lines[0].match(/^\[(\w+)\s*(?::\s*(.*))?\]$/);
    if (m) {
      lines.shift();
      const kind = m[1].toLowerCase();
      if (!(SCENE_COMPONENTS as readonly string[]).includes(kind)) throw new Error(`Componente desconocido en el guion: [${m[1]}] (válidos: ${SCENE_COMPONENTS.join(", ")})`);
      component = kind as ScriptScene["component"];
      const args = (m[2] ?? "").split("|").map((x) => x.trim()).filter(Boolean);
      if (component === "lista") items = args.slice(0, 4);
      if (component === "cifra") [label = "", value = ""] = args;
      if (component === "cta") value = args[0] ?? "";
      if (component === "modelo") {
        [label = "", value = ""] = args;
        if (!(MODELS as readonly string[]).includes(label)) throw new Error(`Modelo desconocido en el guion: [modelo: ${label}] (válidos: ${MODELS.join(", ")})`);
      }
    }
    const raw = lines.join(" ").replace(/\s+/g, " ").trim();
    if (!raw) throw new Error("Hay un bloque del guion sin texto que narrar");
    const tokens = raw.split(" ");
    // Escenas demasiado largas se parten en frases (los componentes van en la última parte)
    const chunks: string[][] = [];
    let cur: string[] = [];
    for (const t of tokens) {
      cur.push(t);
      if ((/[.?!;:,]["»”)*]*$/.test(t) && cur.length >= 4) || cur.length >= MAX_WORDS) {
        chunks.push(cur);
        cur = [];
      }
    }
    if (cur.length) chunks.push(cur);
    // Unir trozos pequeños mientras quepan
    const merged: string[][] = [];
    for (const c of chunks) {
      const last = merged[merged.length - 1];
      if (last && last.length + c.length <= MAX_WORDS) last.push(...c);
      else merged.push([...c]);
    }
    merged.forEach((c, k) => {
      const lastPart = k === merged.length - 1;
      scenes.push({
        text: c.map((t) => t.replace(/\*/g, "")).join(" "),
        accentWords: c.flatMap((t, i) => (t.includes("*") ? [i] : [])),
        component: lastPart ? component : "titular",
        items: lastPart ? items : [],
        label: lastPart ? label : "",
        value: lastPart ? value : "",
      });
    });
  }
  if (!scenes.length) throw new Error("El guion está vacío");
  return scenes;
};

export const scriptText = (scenes: ScriptScene[]) => scenes.map((s) => s.text).join(" ");

// Sin narración: cada palabra aparece a ritmo de lectura (más tiempo cuanto más larga) y cada escena se
// mantiene un poco tras su última palabra. Devuelve los tiempos por palabra y el final de la última escena.
export const readingTimings = (scenes: ScriptScene[], o = { leadMs: 300, holdMs: 900, minSceneMs: 2000 }) => {
  const words: { text: string; startMs: number; endMs: number }[] = [];
  let t = o.leadMs;
  for (const s of scenes) {
    const start = t;
    for (const w of s.text.split(" ")) {
      const letters = w.replace(/[^\p{L}\p{N}]/gu, "").length;
      const dur = Math.min(620, Math.max(260, 180 + 28 * letters));
      words.push({ text: w, startMs: t, endMs: t + dur });
      t += dur;
    }
    t = Math.max(start + o.minSceneMs, t + o.holdMs);
  }
  return { words, endMs: t };
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

// Empareja cada palabra del guion con su palabra narrada (en orden, tolerando pequeñas diferencias de
// la transcripción: números escritos, signos). Devuelve el índice narrado de cada palabra del guion.
export const alignScript = (scenes: ScriptScene[], spoken: TimedWord[]) => {
  const scriptWords = scenes.flatMap((s) => s.text.split(" "));
  const map: number[] = [];
  let j = 0;
  for (const w of scriptWords) {
    const n = norm(w);
    let found = -1;
    for (let k = j; k < Math.min(spoken.length, j + 40); k++) {
      if (norm(spoken[k].text) === n) {
        found = k;
        break;
      }
    }
    if (found < 0) found = Math.min(j, spoken.length - 1);
    map.push(found);
    j = Math.min(found + 1, spoken.length - 1);
  }
  const unmatched = scriptWords.filter((w, i) => norm(spoken[map[i]].text) !== norm(w)).length;
  return { map, unmatched, total: scriptWords.length };
};

// Guion desde un brief con Claude (opcional). Solo genera DATOS del esquema; nunca código.
const genSchema = z.object({
  scenes: z.array(
    z.object({
      text: z.string(),
      component: z.enum(SCENE_COMPONENTS),
      accent: z.string(),
      items: z.array(z.string()),
      label: z.string(),
      value: z.string(),
    }),
  ),
  claims_to_verify: z.array(z.string()),
});

export const scriptFromBrief = async (opts: {
  brief: string;
  type: string;
  seconds: number;
  model: string;
  effort: "low" | "medium" | "high";
  client?: Anthropic;
}) => {
  const client = opts.client ?? new Anthropic({ maxRetries: 2, timeout: 5 * 60_000 });
  const r = await client.beta.messages.parse({
    model: opts.model,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: opts.effort, format: betaZodOutputFormat(genSchema) },
    system:
      "Eres guionista de vídeos cortos verticales de Hook House (TikTok, Reels, Shorts), en español. Estilo: frases cortas, " +
      "directas, una idea por escena, gancho en la primera escena y llamada a la acción al final. No inventes datos, cifras " +
      "ni testimonios que no estén en el brief: si hace falta una cifra que no tienes, no la pongas. " +
      `Componentes por escena: titular (solo texto), lista (2-3 items de 1-2 palabras en items), cifra (label + value cortos), cta (value = una palabra), ` +
      `modelo (label = ${MODELS.join("|")}; value = la fórmula si label es formula). ` +
      "accent es una palabra de text que irá destacada.",
    messages: [
      { role: "user", content: `Tipo: ${opts.type}. Duración aproximada: ${opts.seconds} s (unas ${Math.round(opts.seconds * 2.4)} palabras).\nBrief:\n${opts.brief}` },
    ],
  });
  if (r.stop_reason === "refusal") throw new Error("Claude rechazó generar el guion");
  const p = r.parsed_output;
  if (!p || !p.scenes.length) throw new Error("Claude no devolvió un guion válido");
  // Se convierte al formato de texto: así el guion queda guardado, revisable y editable
  const text = p.scenes
    .map((s) => {
      const head =
        s.component === "lista" && s.items.length
          ? `[lista: ${s.items.slice(0, 4).join(" | ")}]\n`
          : s.component === "cifra"
            ? `[cifra: ${s.label} | ${s.value}]\n`
            : s.component === "cta" && s.value
              ? `[cta: ${s.value}]\n`
              : s.component === "modelo" && (MODELS as readonly string[]).includes(s.label)
                ? `[modelo: ${s.label}${s.value ? ` | ${s.value}` : ""}]\n`
                : "";
      const body = s.accent ? s.text.replace(new RegExp(`\\b(${s.accent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`), "*$1*") : s.text;
      return head + body;
    })
    .join("\n\n");
  return { script: text + "\n", claims: p.claims_to_verify, usage: { input: r.usage.input_tokens, output: r.usage.output_tokens, model: r.model } };
};
