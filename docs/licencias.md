# Recursos de terceros y licencias

Todo lo que entra en un vídeo tiene licencia comprobada. El informe de cada trabajo (`output/informe.md`) lista
los recursos usados en su sección de créditos.

| Recurso | Dónde | Licencia | Notas |
|---|---|---|---|
| Fuentes Inter, EB Garamond, JetBrains Mono, Poppins, Great Vibes | `public/fonts/` | SIL Open Font License 1.1 | Identidad de Hook House y componentes previos |
| Fuentes Fredoka, Bebas Neue, DM Serif Display, Space Grotesk, Archivo Black | `public/fonts/` (de Fontsource 5.3.0) | SIL Open Font License 1.1 | Temas de motion graphics; textos de licencia en `public/fonts/licencias/` |
| Iconos Fluent Emoji Flat (Microsoft) | dependencia `@iconify-json/fluent-emoji-flat@1.2.6` | MIT | Iconos animados de los temas; se insertan como SVG en el vídeo |
| Nombres y etiquetas en español de los emoji | `autopilot/create/data/motivos-es.json` (de `emojibase-data@17.0.0`) | MIT · datos de Unicode CLDR (licencia Unicode) | Solo se usan para buscar iconos por palabra; no aparecen en el vídeo |
| Modelo de detección de caras YuNet | `models/` | MIT | Encuadre que sigue la cara |
| Remotion | dependencia | Licencia de Remotion | Gratis para particulares y empresas pequeñas; a partir de cierto tamaño exige licencia de empresa (`REMOTION_LICENSE_KEY`) |

B-roll y música: solo desde `library/` y `clients/<id>/library/` con licencia declarada (ver `library/README.md`).
Voces y transcripciones: ElevenLabs, con las condiciones del plan de la cuenta del usuario.

Para regenerar el índice de iconos en español:

```console
npm i --no-save emojibase-data@17.0.0 && npx tsx scripts/motivos.ts
```
