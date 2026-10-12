import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// estilo.md §2 — sans geométrica gruesa + script caligráfica.
// Fuentes locales (OFL, de @fontsource) en public/fonts: no dependen de la red al renderizar.
export const bold = "Poppins";
export const script = "Great Vibes";

loadFont({ family: bold, url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: bold, url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: script, url: staticFile("fonts/great-vibes-latin-400-normal.woff2"), weight: "400" });

// estilo.md §7 — únicos colores
export const C = {
  ink: "#111111",
  paper: "#F2F2F2",
  red: "#E3121B",
  cyan: "#3FD0C9",
  green: "#2E9B2E",
  grid: "rgba(110,110,110,0.45)",
  note: "#E9E4D8",
};

// Aberración cromática rojo/cian (estilo.md §5)
export const aberration = (px: number) =>
  `drop-shadow(${px}px 0 0 rgba(227,18,27,0.55)) drop-shadow(${-px}px 0 0 rgba(63,208,201,0.55))`;

// Marca de agua (estilo.md §2). Cambiar por el usuario real de TikTok.
export const HANDLE = "@tu.marca";

// Transiciones (estilo.md §5): whip de 6 frames
export const WHIP = 6;
