import { INTER, loadInter } from "../design/inter";

// Regla de la casa: todo en Inter. El contraste que antes daba la script caligráfica ahora es de peso:
// "script" = Inter Medium, "bold" = Inter ExtraBold.
export const bold = INTER;
export const script = INTER;

loadInter();

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

// Transiciones (estilo.md §5): whip de 6 frames
export const WHIP = 6;
