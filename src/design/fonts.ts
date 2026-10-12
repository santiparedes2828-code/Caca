import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { staticFile } from "remotion";
import type { Brand, BrandFont } from "./schema";

// Carga las fuentes de la marca recibida por props. loadFont() ya bloquea el render (delayRender)
// hasta que la fuente está lista y lo cancela si el archivo falta: un render nunca sale con
// una fuente de sustitución sin avisar.
const cache = new Map<string, Promise<void>>();

const fontUrl = (f: BrandFont) => {
  if (f.src.startsWith("static:"))
    return staticFile(f.src.slice("static:".length));
  if (f.src.startsWith("url:")) return f.src.slice("url:".length);
  throw new Error(
    `Fuente "${f.family}" con origen no resuelto: ${f.src} (el backend debe traducir "client:")`,
  );
};

const load = (f: BrandFont) => {
  const key = `${f.family}|${f.weight}|${f.style}|${f.src}`;
  let p = cache.get(key);
  if (!p) {
    p = loadFont({
      family: f.family,
      url: fontUrl(f),
      weight: f.weight,
      style: f.style,
    });
    cache.set(key, p);
  }
  return p;
};

export const useBrandFonts = (brand: Brand) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all(brand.fonts.map(load)).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [brand.fonts]);
  return ready;
};
