import assert from "node:assert/strict";
import { test } from "node:test";
import { parseScript } from "../../autopilot/create/script";
import { describeDynamics, firstNumberWord, GENERAL_PRESET, pickPreset, planCues, planDynamics, planSfx, planTheme, presetById, THEME_PRESETS } from "../../autopilot/create/theme";
import { themedPropsSchema } from "../../src/create/theme";
import { chainOffset, chainTimeline, followCamera, itemFrames, typingSchedule } from "../../src/create/timeline";

// Animaciones de estilo-animaciones.md: máscara, movimientos encadenados, cámara que sigue, transformación,
// sincronía con la voz, odómetro, número de paso y tarjeta que escribe.

test("guion: [paso], [prompt] y [cadena]; el paso y la tarjeta abren su bloque", () => {
  const s = parseScript(
    "[paso: Máscara de texto | Instrucción]\nPrimero, las palabras aparecen detrás de una línea. Así se ven más profesionales y nadie piensa en una presentación.\n\n" +
      "[prompt: Revela el texto desde una *máscara*. | Claude]\nPídeselo así.\n\n[cadena: Guion | Voz | Vídeo]\nEl guion empuja a la voz.",
  );
  const paso = s.filter((x) => x.component === "paso");
  assert.equal(paso.length, 1);
  assert.equal(s[0].component, "paso", "el número va con la primera parte del bloque");
  assert.equal(paso[0].label, "Máscara de texto");
  assert.equal(paso[0].body, "Instrucción");
  const prompt = s.find((x) => x.component === "prompt")!;
  assert.equal(prompt.body, "Revela el texto desde una *máscara*.");
  assert.equal(prompt.label, "Claude");
  assert.deepEqual(s.find((x) => x.component === "cadena")!.items, ["Guion", "Voz", "Vídeo"]);
  assert.throws(() => parseScript("[cadena: Solo]\nHola"), /de 2 a 4 bloques/);
  assert.throws(() => parseScript("[paso:]\nHola"), /título del paso/);
  assert.throws(() => parseScript("[prompt:]\nHola"), /texto de la tarjeta/);
});

test("cadena: el primero entra y golpea al nombrar el segundo; cada golpe llega al siguiente y acaba en la acción", () => {
  const tl = chainTimeline(100, [110, 140, 155], 3);
  assert.equal(tl.tIn, 104);
  assert.equal(tl.hits[1], 140, "golpea cuando se nombra el segundo bloque");
  assert.equal(tl.hits[2], 155, "y el empujado llega al tercero cuando se nombra");
  assert.ok(tl.action > tl.hits[2]);
  const g = { gap: 64, approach: 110, offscreen: 400, recoil: 14 };
  assert.equal(chainOffset(tl.tIn - 1, 0, 3, tl, g), -400, "antes de entrar está fuera de la pantalla");
  assert.ok(chainOffset(tl.hits[1], 0, 3, tl, g) === 0, "en el golpe toca al segundo");
  assert.equal(chainOffset(tl.hits[1], 1, 3, tl, g), -64, "el segundo aún no se ha movido");
  assert.ok(chainOffset(tl.hits[2], 1, 3, tl, g) === 0, "llega a su sitio justo al tocar al tercero");
  assert.ok(Math.abs(chainOffset(tl.action + 30, 2, 3, tl, g)) < 1e-9, "el último termina en su sitio");
  // Sin nombres en la voz: ritmo propio, en orden
  const t2 = chainTimeline(0, [], 4);
  assert.ok(t2.hits[1] < t2.hits[2] && t2.hits[2] < t2.hits[3] && t2.hits[3] < t2.action);
});

test("sincronía: los elementos entran al nombrarlos y nunca desordenados; la tarjeta termina antes del final", () => {
  assert.deepEqual(itemFrames(100, [130, null, 120], 3), [127, 130, 133]);
  assert.deepEqual(itemFrames(100, [], 3), [110, 117, 124]);
  const t = typingSchedule(0, 120, 40);
  assert.ok(t.t1 <= 120 - 13 && t.speed >= 0.5 && t.send > t.t1);
});

test("cámara que sigue: sin saltos al cambiar de objetivo y llega al objetivo", () => {
  const keys = [
    { at: 10, x: 30, y: 0 },
    { at: 16, x: -30, y: 40 },
  ];
  assert.deepEqual(followCamera(9, keys), { x: 0, y: 0 });
  for (let f = 10; f < 60; f++) {
    const a = followCamera(f, keys);
    const b = followCamera(f + 1, keys);
    assert.ok(Math.abs(a.x - b.x) < 8 && Math.abs(a.y - b.y) < 8, `salto en ${f}`);
  }
  const end = followCamera(90, keys);
  assert.ok(Math.abs(end.x + 30) < 0.1 && Math.abs(end.y - 40) < 0.1, JSON.stringify(end));
});

test("sincronía con la voz: cada pieza apunta a la palabra que la nombra", () => {
  const words = "Como estas mil vistas en el guion y la voz Escríbeme AUTO".split(" ");
  const caps = words.map((text) => ({ text }));
  const cues = planCues(
    caps,
    [
      { from: 0, to: 3, accent: null, component: "cifra", items: [], label: "vistas", value: "1.000" },
      { from: 4, to: 9, accent: null, component: "cadena", items: ["Guion", "Voz"], label: "", value: "" },
      { from: 10, to: 11, accent: null, component: "cta", items: [], label: "", value: "AUTO" },
    ],
    ["eyes", null, null],
  );
  assert.equal(cues[0].value, 2, "1.000 se dice «mil»");
  assert.equal(cues[0].icon, 3, "el icono de los ojos sale de «vistas»");
  assert.deepEqual(cues[1].items, [6, 9]);
  assert.equal(cues[2].value, 11);
  assert.equal(firstNumberWord(3), "tres");
  assert.equal(firstNumberWord(35), "treinta");
  assert.equal(firstNumberWord(100), "cien");
  assert.equal(firstNumberWord(1000), "mil");
  assert.equal(firstNumberWord(2500), "dos");
});

// Escenas de prueba: componente y número de palabras (cada palabra dura 300 ms)
const build = (spec: [string, number, boolean?][]) => {
  let w = 0;
  const scenes = spec.map(([component, words, icon = true]) => {
    const s = { component, from: w, to: w + words - 1, icon: icon ? "sparkles" : null };
    w += words;
    return s;
  });
  const caps = Array.from({ length: w }, (_, i) => ({ startMs: i * 300, endMs: i * 300 + 280 }));
  return { scenes, caps };
};

test("dinamismo: las animaciones se reparten, nunca todas juntas (corrección del usuario, 12-10-2026)", () => {
  const { scenes, caps } = build([
    ["titular", 6],
    ["titular", 8],
    ["lista", 5],
    ["titular", 7],
    ["titular", 6],
    ["cifra", 4],
    ["titular", 9],
    ["titular", 5],
    ["cta", 6],
  ]);
  const fx = planDynamics(scenes, caps, GENERAL_PRESET.theme);
  const specials = fx.map((f) => [f.reveal === "mascara", f.camera === "sigue", f.sceneTransition === "transforma"].filter(Boolean).length);
  assert.ok(specials.every((n) => n <= 1), `una especial por escena como mucho: ${JSON.stringify(fx)}`);
  assert.equal(fx[0].reveal, "mascara", "el gancho abre con la máscara");
  for (let k = 1; k < fx.length; k++) {
    assert.ok(!(fx[k].reveal === "mascara" && fx[k - 1].reveal === "mascara"), "máscara seguida");
    assert.ok(!(fx[k].camera === "sigue" && fx[k - 1].camera === "sigue"), "cámara seguida");
  }
  // Las escenas con gráfico propio no llevan más
  for (const k of [2, 5, 8]) assert.ok(fx[k].reveal === null && fx[k].camera === null, `escena ${k + 1}`);
  // Una o dos transformaciones, no seguidas, y la llamada a la acción llega transformándose
  const morphs = fx.flatMap((f, k) => (f.sceneTransition === "transforma" ? [k] : []));
  assert.ok(morphs.length >= 1 && morphs.length <= 2);
  assert.equal(fx[8].sceneTransition, "transforma");
  assert.ok(morphs.every((m, i) => i === 0 || m - morphs[i - 1] > 1));
  // Hay de todo pero menos de la mitad de las escenas llevan algo especial
  assert.ok(fx.some((f) => f.reveal === "mascara") && fx.some((f) => f.camera === "sigue"));
  assert.ok(specials.filter(Boolean).length <= Math.ceil(fx.length / 2));
  assert.equal(JSON.stringify(planDynamics(scenes, caps, GENERAL_PRESET.theme)), JSON.stringify(fx), "determinista");
  assert.match(describeDynamics(fx), /máscara en la escena 1/);
});

test("dinamismo: vídeos cortos con poco, cortes secos solo en temas enérgicos y entre escenas cortas", () => {
  const two = build([
    ["titular", 5],
    ["cta", 4],
  ]);
  const fx2 = planDynamics(two.scenes, two.caps, GENERAL_PRESET.theme);
  assert.ok(fx2.every((f) => f.sceneTransition !== "transforma"), "con dos escenas no hay transformación");
  const quick = build([
    ["titular", 3],
    ["titular", 3],
    ["titular", 3],
    ["titular", 3],
  ]);
  const energetic = planDynamics(quick.scenes, quick.caps, GENERAL_PRESET.theme);
  assert.ok(energetic.some((f) => f.sceneTransition === "corte"));
  for (let k = 1; k < energetic.length; k++) assert.ok(!(energetic[k].sceneTransition === "corte" && energetic[k - 1].sceneTransition === "corte"), "dos cortes seguidos");
  const calm = planDynamics(quick.scenes, quick.caps, presetById("salud")!.theme);
  assert.ok(calm.every((f) => f.sceneTransition !== "corte"), "sin cortes secos en los temas suaves");
});

test("los temas no traen las animaciones de serie: las reparte el planificador", () => {
  for (const p of [...THEME_PRESETS, GENERAL_PRESET]) {
    assert.equal(p.theme.reveal, "salto", p.theme.id);
    assert.equal(p.theme.camera, "empuje", p.theme.id);
    assert.notEqual(p.theme.sceneTransition, "transforma", p.theme.id);
  }
  assert.equal(presetById("editorial"), null);
  assert.notEqual(pickPreset("Reel con animaciones sobre recetas de pizza").theme.id, "editorial");
});

test("props: sincronías dentro de su escena, cadenas de 2 a 4 y pasos con título", () => {
  const plan = planTheme({ topic: "edición", scenes: parseScript("[paso: Una idea]\nUna idea por escena.\n\n[cadena: Guion | Voz]\nEl guion empuja a la voz.") });
  const caps = "Una idea por escena. El guion empuja a la voz.".split(" ").map((text, i) => ({ text, startMs: 200 + i * 300, endMs: 480 + i * 300, timestampMs: null, confidence: null }));
  const base = {
    fps: 30,
    durationInFrames: 120,
    audioSrc: null,
    captions: caps,
    headerLabel: "",
    theme: plan.theme,
    icons: plan.icons,
    bgIcons: plan.bgIcons,
    pointerIcon: null,
  };
  const scenes = [
    { from: 0, to: 3, accent: null, component: "paso", items: [], label: "Una idea", value: "", body: "", icon: null, itemIcons: [], cues: { icon: null, value: null, items: [] }, fx: { reveal: null, camera: null, sceneTransition: null } },
    { from: 4, to: 8, accent: null, component: "cadena", items: ["Guion", "Voz"], label: "", value: "", body: "", icon: null, itemIcons: plan.scenes[1].itemIcons, cues: { icon: null, value: null, items: [5, 8] }, fx: { reveal: null, camera: null, sceneTransition: "corte" as const } },
  ];
  assert.ok(themedPropsSchema.safeParse({ ...base, scenes }).success);
  assert.ok(!themedPropsSchema.safeParse({ ...base, scenes: [scenes[0], { ...scenes[1], cues: { icon: null, value: null, items: [2, 8] } }] }).success, "sincronía fuera de la escena");
  assert.ok(!themedPropsSchema.safeParse({ ...base, scenes: [scenes[0], { ...scenes[1], items: ["Guion"] }] }).success, "cadena de un bloque");
  assert.ok(!themedPropsSchema.safeParse({ ...base, scenes: [{ ...scenes[0], label: "" }, scenes[1]] }).success, "paso sin título");
  // Los efectos caen en los golpes de la cadena
  const ev = planSfx(scenes, caps, 30, plan.theme, 120);
  const hits = ev.filter((e) => e.name === "hit").map((e) => e.frame);
  // El corte seco no lleva el whoosh de la transición (0,3); solo queda el de la entrada del primer bloque (0,16)
  assert.ok(ev.filter((e) => e.name === "whoosh").every((e) => e.volume < 0.2), "el corte seco no lleva whoosh");
  const f = (i: number) => Math.round((caps[i].startMs / 1000) * 30);
  const tl = chainTimeline(Math.max(0, f(4) - 4) + 8, [f(5), f(8)], 2);
  assert.deepEqual(hits, [tl.hits[1]]);
});
