import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-500-normal.woff2"), weight: "500" });
loadFont({ family: "Inter", url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });

export const FONT_T = "Poppins, sans-serif";
export const FONT_B = "Inter, sans-serif";

// Paleta escolar clara: hoja cuadriculada + lápices de colores.
export const C = {
  papel: "#FFFBF2",
  cuadricula: "#DCE8F5",
  tinta: "#1F2A44",
  gris: "#5B6478",
  azul: "#3B82F6",
  azulClaro: "#BFDBFE",
  rojo: "#EF4444",
  verde: "#22C55E",
  verdeOsc: "#15803D",
  amarillo: "#FACC15",
  amarilloClaro: "#FEF08A",
  naranja: "#F97316",
  rosa: "#EC4899",
  rosaClaro: "#FBCFE8",
  lila: "#C4B5FD",
  lilaOsc: "#7C3AED",
  celeste: "#A5F3FC",
  celulaFondo: "#ECFDF5",
  nucleo: "#EDE9FE",
};

// Un color por integrante (tarjetas y detalles).
export const COLORES = [C.azul, C.rosa, C.lilaOsc, C.verde, C.naranja, C.rojo];
