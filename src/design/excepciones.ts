// Excepciones a la regla de la casa «todo el texto en Inter» (CLAUDE.md). Solo se usan cuando un pedido las pide
// expresamente; por defecto todo sigue en Inter.
//
// 12-10-2026 · reel de Einstein: el usuario pidió las palabras clave en «Apple Garamond Bold Italic». Apple
// Garamond es de Apple y no tiene licencia libre; se usa su equivalente libre EB Garamond Bold Italic (OFL,
// public/fonts/excepciones/). Se activa por trabajo con --claves-garamond.
export const ACCENT_FONTS = {
  garamond: { family: "EB Garamond", weight: 700, style: "italic", file: "excepciones/eb-garamond-latin-700-italic.woff2" },
} as const;
export type AccentFontKey = "inter" | keyof typeof ACCENT_FONTS;
