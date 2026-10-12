import hookhouseProfile from "../../clients/hookhouse/profile.json";
import { brandSchema, type Brand, type BrandFont } from "./schema";

// Fuente única de la identidad Hook House: clients/hookhouse/profile.json (estilo-hookhouse.md §0).
// Si el JSON no cumple el esquema, falla al cargar en vez de renderizar con valores rotos.
export const HOOKHOUSE: Brand = brandSchema.parse(hookhouseProfile.brand);

export const fontFamily = (brand: Brand, role: BrandFont["role"]) => {
  const f = brand.fonts.find((x) => x.role === role);
  if (!f) throw new Error(`La marca no define fuente con rol "${role}"`);
  return f.family;
};
