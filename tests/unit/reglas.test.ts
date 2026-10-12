import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ROOT } from "../../autopilot/config";
import { EMOJI_SET, GENERAL_PRESET, hasIcon, ICON_SYNONYMS, THEME_PRESETS } from "../../autopilot/create/theme";
import { THEME_FONTS } from "../../src/create/theme";
import { ACCENT_FONTS } from "../../src/design/excepciones";
import { fontSchema } from "../../src/design/schema";

// Reglas de la casa pedidas por el usuario (ver CLAUDE.md): todo el texto en Inter y emojis estilo iOS
// con el set con licencia más parecido. Estas pruebas evitan que se cuele otra tipografía o otro set.

const files = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p, ext) : ext.test(e.name) ? [p] : [];
  });

const OTHER_FONTS = /Garamond|JetBrains|Poppins|Great Vibes|Fredoka|Bebas|Serif Display|Space Grotesk|Archivo Black|SF Pro|Helvetica|Arial|Georgia|monospace/;

test("regla: todo el texto en Inter (perfiles, temas, composiciones, web y fuentes instaladas)", () => {
  for (const c of readdirSync(path.join(ROOT, "clients"), { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const profile = JSON.parse(readFileSync(path.join(ROOT, "clients", c.name, "profile.json"), "utf8"));
    for (const f of profile.brand.fonts) assert.equal(f.family, "Inter", `${c.name}: ${f.family}`);
  }
  assert.throws(() => fontSchema.parse({ role: "serif", family: "EB Garamond", weight: "700", style: "italic", src: "static:fonts/x.woff2" }), /Inter/);
  assert.deepEqual(Object.values(THEME_FONTS).map((f) => f.family), ["Inter"]);
  for (const p of [...THEME_PRESETS, GENERAL_PRESET]) assert.equal(p.theme.font, "inter");
  // Las excepciones pedidas expresamente viven solo en src/design/excepciones.ts
  const allowed = path.join(ROOT, "src/design/excepciones.ts");
  for (const f of [...files(path.join(ROOT, "src"), /\.tsx?$/).filter((x) => x !== allowed), ...files(path.join(ROOT, "web"), /\.(css|html|js)$/)]) {
    const m = readFileSync(f, "utf8").match(OTHER_FONTS);
    assert.equal(m, null, `${path.relative(ROOT, f)} usa otra tipografía: ${m?.[0]}`);
  }
  const fonts = readdirSync(path.join(ROOT, "public/fonts")).filter((f) => f.endsWith(".woff2"));
  assert.ok(fonts.length && fonts.every((f) => /^inter-latin-\d00-normal\.woff2$/.test(f)), fonts.join(", "));
  // Fuentes de excepción: solo las declaradas, y solo para palabras clave cuando el pedido lo pide
  const extra = readdirSync(path.join(ROOT, "public/fonts/excepciones")).filter((f) => f.endsWith(".woff2"));
  assert.deepEqual(extra.sort(), Object.values(ACCENT_FONTS).map((a) => path.basename(a.file)).sort());
});

test("regla: emojis estilo iOS con el set con licencia más parecido (Fluent Emoji en color)", () => {
  assert.equal(EMOJI_SET, "fluent-emoji");
  for (const i of ["tangerine", "lemon", "dna", "backhand-index-pointing-down", "check-mark-button"]) assert.ok(hasIcon(i), i);
  // Cada sinónimo (es/en) apunta a un emoji que existe en el set (si no, el vídeo saldría sin él)
  for (const [lang, table] of Object.entries(ICON_SYNONYMS)) {
    for (const [word, icon] of Object.entries(table)) assert.ok(hasIcon(icon), `${lang}: ${word} → ${icon}`);
  }
});
