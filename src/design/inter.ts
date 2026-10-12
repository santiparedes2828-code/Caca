import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Regla de la casa (pedida por el usuario el 12-10-2026): TODO el texto va en Inter, preferiblemente
// Inter Bold. Es la única tipografía del proyecto; public/fonts solo contiene sus pesos.
export const INTER = "Inter";
export const INTER_WEIGHTS = ["500", "700", "800"] as const;
export const INTER_BOLD = 700;

let loading: Promise<void[]> | null = null;
// loadFont bloquea el render hasta que la fuente está lista y lo cancela si falta el archivo
export const loadInter = () =>
  (loading ??= Promise.all(INTER_WEIGHTS.map((weight) => loadFont({ family: INTER, url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight }))));
