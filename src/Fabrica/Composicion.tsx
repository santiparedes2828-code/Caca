import { Motor, Portada } from "./Motor";
import { VIDEOS } from "./registro";

// Las props de una composición se serializan a JSON (se pierden las funciones), así que Root solo pasa el slug
// y la especificación se busca acá en el registro.
const buscar = (slug: string) => {
  const v = VIDEOS.find((x) => x.slug === slug);
  if (!v) throw new Error(`Fábrica: no hay un video «${slug}» en src/Fabrica/registro.ts`);
  return v;
};
export const FabricaVideo: React.FC<{ slug: string; v: number }> = ({ slug, v }) => <Motor video={buscar(slug)} v={v} />;
export const FabricaPortada: React.FC<{ slug: string; v: number }> = ({ slug, v }) => <Portada video={buscar(slug)} v={v} />;
