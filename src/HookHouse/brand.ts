import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { fontFamily, HOOKHOUSE } from "../design/tokens";

// estilo-hookhouse.md §0 — identidad de marca Hook House.
// Los valores viven en clients/hookhouse/profile.json (src/design/tokens.ts); aquí solo se exponen
// con los nombres que ya usan HookHouse y Viral.
export const SANS = fontFamily(HOOKHOUSE, "sans");
export const SERIF = fontFamily(HOOKHOUSE, "serif"); // sustituto libre de Apple Garamond Bold Italic
export const MONO = fontFamily(HOOKHOUSE, "mono");

for (const f of HOOKHOUSE.fonts) {
  if (f.src.startsWith("static:")) {
    loadFont({ family: f.family, url: staticFile(f.src.slice("static:".length)), weight: f.weight, style: f.style });
  }
}

const c = HOOKHOUSE.colors;
export const B = {
  bg: c.bg,
  ink: c.ink,
  green: c.accent,
  greenDark: c.accentDark,
  grey: c.muted,
  fill: c.fill,
  white: c.white,
};

export const MARGIN = HOOKHOUSE.layout.margin;
export const STROKE = HOOKHOUSE.layout.stroke;
