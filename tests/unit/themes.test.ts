import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ROOT } from "../../autopilot/config";
import { parseScript } from "../../autopilot/create/script";
import { findIcons, GENERAL_PRESET, hasIcon, pickPreset, planTheme, resolveStyle, THEME_PRESETS } from "../../autopilot/create/theme";
import { THEME_FONTS, themedPropsSchema, themeSchema } from "../../src/create/theme";

test("temas: paletas válidas, iconos que existen y fuentes con su archivo", () => {
  for (const p of [...THEME_PRESETS, GENERAL_PRESET]) {
    themeSchema.parse(p.theme);
    for (const i of p.icons) assert.ok(hasIcon(i), `${p.theme.id}: falta el icono ${i}`);
  }
  for (const f of Object.values(THEME_FONTS)) assert.ok(existsSync(path.join(ROOT, "public/fonts", f.file)), f.file);
});

test("el tema se elige por el contenido de la idea", () => {
  assert.equal(pickPreset("Video viral para tiktok sobre mandarinas").theme.id, "citrico");
  assert.equal(pickPreset("Receta de pizza casera").theme.id, "comida");
  assert.equal(pickPreset("Rutina de gimnasio para principiantes").theme.id, "deporte");
  assert.equal(pickPreset("Cómo usar la inteligencia artificial en tu negocio").theme.id, "tecnologia");
  assert.equal(pickPreset("Mi perro no deja de ladrar").theme.id, "mascotas");
  assert.equal(pickPreset("Algo sin pistas").theme.id, "general");
});

test("iconos por palabra en español: nombre exacto antes que colores o símbolos", () => {
  assert.equal(findIcons("La naranja desciende de la mandarina.", { preferGroups: [4] })[0], "tangerine");
  const s = findIcons("Y el limón también lleva mandarina en su ADN.", { preferGroups: [4] });
  for (const i of ["tangerine", "lemon", "dna"]) assert.ok(s.includes(i), i);
  assert.equal(findIcons("Esos hilos blancos")[0], "thread");
  assert.deepEqual(findIcons("de la que se"), []);
});

test("plan visual: tema, icono por escena sin repetir seguido, lista y llamada a la acción", () => {
  const scenes = parseScript(
    "Llevas toda la vida tirando una parte de la *mandarina* que sí se come.\n\nEsos hilos se llaman *floema*.\n\nSon conductos.\n\n[lista: Fibra | Limón]\nY tienen fibra.\n\nY el *limón* lleva mandarina en su ADN.\n\n[cta: MANDARINA]\nComenta mandarina.",
  );
  const plan = planTheme({ topic: "Video viral sobre mandarinas", scenes });
  assert.equal(plan.theme.id, "citrico");
  assert.equal(plan.scenes[0].icon, "tangerine");
  assert.equal(plan.scenes[4].icon, "lemon", "manda la palabra destacada");
  for (let k = 1; k < plan.scenes.length; k++) assert.notEqual(plan.scenes[k].icon, plan.scenes[k - 1].icon);
  assert.deepEqual(plan.scenes[3].itemIcons, ["check-mark-button", "lemon"]);
  assert.equal(plan.pointerIcon, "backhand-index-pointing-down");
  for (const uri of Object.values(plan.icons)) assert.match(uri, /^data:image\/svg\+xml;base64,/);
  assert.throws(() => planTheme({ topic: "x", scenes, presetId: "inventado" }), /Tema desconocido/);
});

test("props con tema: solo iconos resueltos y en data URI", () => {
  const scenes = parseScript("Una *pizza*.");
  const plan = planTheme({ topic: "pizza", scenes });
  const base = {
    fps: 30,
    durationInFrames: 60,
    audioSrc: null,
    captions: [
      { text: "Una", startMs: 0, endMs: 300, timestampMs: null, confidence: null },
      { text: "pizza.", startMs: 300, endMs: 700, timestampMs: null, confidence: null },
    ],
    scenes: [{ from: 0, to: 1, accent: [1, 1], component: "titular", items: [], label: "", value: "", icon: plan.scenes[0].icon, itemIcons: [] as string[] }],
    headerLabel: "",
    theme: plan.theme,
    icons: plan.icons,
    bgIcons: plan.bgIcons,
    pointerIcon: null,
  };
  themedPropsSchema.parse(base);
  assert.throws(() => themedPropsSchema.parse({ ...base, bgIcons: ["no-resuelto"] }), /Icono sin resolver/);
  assert.throws(() => themedPropsSchema.parse({ ...base, icons: { ...base.icons, pizza: "https://example.com/x.svg" } }));
  assert.throws(() => themedPropsSchema.parse({ ...base, theme: { ...base.theme, palette: { ...base.theme.palette, accent: "red" } } }));
});

test("estilo: la identidad de la marca solo si el contenido la nombra (o si se pide)", () => {
  assert.equal(resolveStyle("auto", "Video sobre mandarinas", "Hook House"), "tema");
  assert.equal(resolveStyle("auto", "En Hook House editamos tus vídeos", "Hook House"), "marca");
  assert.equal(resolveStyle("marca", "mandarinas", "Hook House"), "marca");
  assert.equal(resolveStyle("tema", "Hook House", "Hook House"), "tema");
});
