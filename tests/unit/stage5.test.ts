import Anthropic from "@anthropic-ai/sdk";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ROOT } from "../../autopilot/config";
import { alignScript, parseScript, scriptFromBrief, scriptText } from "../../autopilot/create/script";
import { startFakeAnthropic } from "../support/fake-anthropic";

test("guion: componentes, palabras destacadas y escenas largas partidas", () => {
  const s = parseScript("[cifra: clips | 3]\nTe damos *tres* clips.\n\n# comentario\n\nUna frase muy larga que no cabe en un solo titular porque tiene muchísimas palabras seguidas sin parar nunca jamás.\n\n[cta: AUTO]\nEscríbeme auto.");
  assert.equal(s[0].component, "cifra");
  assert.deepEqual([s[0].label, s[0].value], ["clips", "3"]);
  assert.deepEqual(s[0].accentWords, [2]);
  assert.equal(s[0].text, "Te damos tres clips.");
  assert.ok(s.filter((x) => x.component === "titular").length >= 2, "la frase larga se parte");
  assert.ok(s.every((x) => x.text.split(" ").length <= 14));
  assert.equal(s.at(-1)!.component, "cta");
  assert.throws(() => parseScript("[video: x]\nHola"), /Componente desconocido/);
  assert.throws(() => parseScript("   "), /vacío/);
});

test("alineación del guion con la narración real (voz_a, tiempos de ElevenLabs)", async () => {
  const j = JSON.parse(await fs.readFile(path.join(ROOT, "tests/data/elevenlabs-scribe-voz_a.words.json"), "utf8"));
  const words = j.words.map((w: { text: string; start: number; end: number }) => ({ text: w.text, startMs: w.start * 1000, endMs: w.end * 1000 }));
  const s = parseScript("Las agencias que más crecen en *TikTok* no editan sus videos.\n\n[cifra: minutos | 10]\nTú grabas diez minutos y pierdes una tarde entera editando.");
  const a = alignScript(s, words);
  assert.equal(a.unmatched, 0);
  assert.equal(a.map[0], 0);
  assert.equal(words[a.map[a.map.length - 1]].text, "editando.");
  assert.equal(scriptText(s).split(" ").length, a.total);
});

test("guion desde brief con Claude (API simulada) → formato de texto revisable", async () => {
  const fake = await startFakeAnthropic([
    {
      kind: "plan",
      plan: {
        scenes: [
          { text: "Tu tienda vende más con vídeo.", component: "titular", accent: "vídeo", items: [], label: "", value: "" },
          { text: "Escríbeme TIENDA.", component: "cta", accent: "", items: [], label: "", value: "TIENDA" },
        ],
        claims_to_verify: ["vende más"],
      },
    },
  ]);
  try {
    const r = await scriptFromBrief({ brief: "Tienda online", type: "anuncio", seconds: 15, model: "claude-opus-5-5", effort: "medium", client: new Anthropic({ apiKey: "x", baseURL: fake.url, maxRetries: 0 }) });
    assert.equal(r.script, "Tu tienda vende más con *vídeo*.\n\n[cta: TIENDA]\nEscríbeme TIENDA.\n");
    assert.deepEqual(r.claims, ["vende más"]);
    assert.equal(parseScript(r.script).length, 2);
  } finally {
    await fake.close();
  }
});
