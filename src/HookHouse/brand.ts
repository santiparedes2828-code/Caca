import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// estilo-hookhouse.md §0 — identidad de marca Hook House
export const SANS = "Inter";
export const SERIF = "EB Garamond"; // sustituto libre de Apple Garamond Bold Italic
export const MONO = "JetBrains Mono";

loadFont({ family: SANS, url: staticFile("fonts/inter-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: SANS, url: staticFile("fonts/inter-latin-500-normal.woff2"), weight: "500" });
loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-700-italic.woff2"), weight: "700", style: "italic" });
loadFont({ family: MONO, url: staticFile("fonts/jetbrains-mono-latin-500-normal.woff2"), weight: "500" });

export const B = {
  bg: "#F7F7F2",
  ink: "#0B0B0B",
  green: "#12A150",
  greenDark: "#0B5E30",
  grey: "#8A8A84",
  fill: "#DCDCD5",
  white: "#FFFFFF",
};

export const MARGIN = 80;
export const STROKE = 8;
