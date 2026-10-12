import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { ROOT } from "../../autopilot/config";
import { EMOJI_SET, GENERAL_PRESET, hasIcon, THEME_PRESETS } from "../../autopilot/create/theme";
import { THEME_FONTS } from "../../src/create/theme";
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
  const profile = JSON.parse(readFileSync(path.join(ROOT, "clients/hookhouse/profile.json"), "utf8"));
  for (const f of profile.brand.fonts) assert.equal(f.family, "Inter");
  assert.throws(() => fontSchema.parse({ role: "serif", family: "EB Garamond", weight: "700", style: "italic", src: "static:fonts/x.woff2" }), /Inter/);
  assert.deepEqual(Object.values(THEME_FONTS).map((f) => f.family), ["Inter"]);
  for (const p of [...THEME_PRESETS, GENERAL_PRESET]) assert.equal(p.theme.font, "inter");
  for (const f of [...files(path.join(ROOT, "src"), /\.tsx?$/), ...files(path.join(ROOT, "web"), /\.(css|html|js)$/)]) {
    const m = readFileSync(f, "utf8").match(OTHER_FONTS);
    assert.equal(m, null, `${path.relative(ROOT, f)} usa otra tipografía: ${m?.[0]}`);
  }
  const fonts = readdirSync(path.join(ROOT, "public/fonts")).filter((f) => f.endsWith(".woff2"));
  assert.ok(fonts.length && fonts.every((f) => /^inter-latin-\d00-normal\.woff2$/.test(f)), fonts.join(", "));
});

test("regla: emojis estilo iOS con el set con licencia más parecido (Fluent Emoji en color)", () => {
  assert.equal(EMOJI_SET, "fluent-emoji");
  for (const i of ["tangerine", "lemon", "dna", "backhand-index-pointing-down", "check-mark-button"]) assert.ok(hasIcon(i), i);
});
