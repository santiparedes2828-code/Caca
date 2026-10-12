// Genera autopilot/create/data/motivos-es.json y motivos-en.json: índices en español e inglés de los iconos con
// licencia que pueden usar los motion graphics y los apoyos de la edición (Fluent Emoji en color de Microsoft, MIT:
// el set con licencia más parecido a los emojis de iOS). Une cada icono con su nombre y sus etiquetas de emojibase
// (MIT, datos de Unicode CLDR). El emoji → nombre de icono sale del set plano, que comparte los nombres.
//
//   npm i --no-save emojibase-data@17.0.0 @iconify-json/fluent-emoji-flat@1.2.6 && npx tsx scripts/motivos.ts
//
// El índice se guarda en el repositorio para no depender de emojibase-data (50 MB) en producción.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../autopilot/config";

const root = ROOT;
const req = (p: string) => JSON.parse(readFileSync(path.join(root, "node_modules", p), "utf8"));

type Emoji = { label: string; hexcode: string; tags?: string[]; group?: number; skins?: unknown[] };
const dataVersion: string = req("emojibase-data/package.json").version;
const chars: Record<string, string> = req("@iconify-json/fluent-emoji-flat/chars.json");
const icons: { icons: Record<string, unknown> } = req("@iconify-json/fluent-emoji/icons.json");
const iconsVersion: string = req("@iconify-json/fluent-emoji/package.json").version;

// Fuera: componentes (tonos de piel, pelo) y banderas
const SKIP_GROUPS = new Set([2, 9]);
for (const lang of ["es", "en"]) {
  const data: Emoji[] = req(`emojibase-data/${lang}/data.json`);
  const entries = data
    .filter((e) => e.group !== undefined && !SKIP_GROUPS.has(e.group))
    .map((e) => ({ icon: chars[e.hexcode.toLowerCase()], label: e.label, tags: e.tags ?? [], group: e.group! }))
    .filter((e) => e.icon && icons.icons[e.icon]);
  writeFileSync(
    path.join(root, `autopilot/create/data/motivos-${lang}.json`),
    JSON.stringify(
      {
        fuente: {
          iconos: `@iconify-json/fluent-emoji@${iconsVersion} · Fluent Emoji en color (Microsoft) · MIT`,
          nombres: `emojibase-data@${dataVersion} (${lang}) · MIT · datos de Unicode CLDR (licencia Unicode)`,
        },
        entradas: entries,
      },
      null,
      0,
    ) + "\n",
  );
  console.log(`${lang}: ${entries.length} iconos indexados`);
}
