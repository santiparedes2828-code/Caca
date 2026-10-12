# Recursos de terceros y licencias

Todo lo que entra en un vídeo tiene licencia comprobada. El informe de cada trabajo (`output/informe.md`) lista
los recursos usados en su sección de créditos.

**Reglas de la casa** (ver `CLAUDE.md`): todo el texto en **Inter** (preferiblemente Bold) y emojis estilo iOS
con el set con licencia más parecido.

| Recurso | Dónde | Licencia | Notas |
|---|---|---|---|
| Fuente Inter (500, 700, 800) | `public/fonts/` (de Fontsource) | SIL Open Font License 1.1 | Única tipografía del proyecto: vídeos, subtítulos, web y panel. Licencia en `public/fonts/licencias/inter-OFL.txt` |
| Fuente EB Garamond Bold Italic | `public/fonts/excepciones/` (de Fontsource) | SIL Open Font License 1.1 | Solo como excepción pedida expresamente (palabras clave, `--claves-garamond`); equivalente libre de Apple Garamond |
| Efectos de sonido (whoosh, pop, hit, click, brillo) | `public/sfx/` | Propios | Sintetizados con ffmpeg para el proyecto (`scripts/sfx.sh`) |
| Iconos Fluent Emoji en color (Microsoft) | dependencia `@iconify-json/fluent-emoji@1.2.7` | MIT | Emojis animados de los temas; el set con licencia más parecido a los de iOS |
| Nombres y etiquetas en español de los emoji | `autopilot/create/data/motivos-es.json` (de `emojibase-data@17.0.0`) | MIT · datos de Unicode CLDR (licencia Unicode) | Solo se usan para buscar iconos por palabra; no aparecen en el vídeo |
| Nombres y etiquetas en inglés de los emoji | `autopilot/create/data/motivos-en.json` (de `emojibase-data@17.0.0`) | MIT · datos de Unicode CLDR (licencia Unicode) | Emojis de apoyo en vídeos hablados en inglés; no aparecen en el vídeo |
| Modelo de detección de caras YuNet | `models/` | MIT | Encuadre que sigue la cara |
| sherpa-onnx | dependencia de Python (`requirements-asr.txt`, `.venv/`) | Apache-2.0 | Motor de la transcripción local |
| NVIDIA Parakeet TDT 0.6B v3 (int8, exportado por sherpa-onnx) | `models/asr/` (se descarga con `npm run setup:asr` desde las releases de sherpa-onnx en GitHub; ignorado por Git) | CC-BY-4.0 según la ficha del modelo de NVIDIA | Transcripción local con tiempos por palabra (25 idiomas europeos). La licencia no se pudo comprobar desde este contenedor (huggingface.co está bloqueado): revisa la ficha del modelo antes de un uso comercial y cita a NVIDIA si lo pide |
| Remotion | dependencia | Licencia de Remotion | Gratis para particulares y empresas pequeñas; a partir de cierto tamaño exige licencia de empresa (`REMOTION_LICENSE_KEY`) |

**Emojis de Apple (iOS):** sus diseños son propiedad de Apple y solo tienen licencia para mostrarse en
dispositivos Apple; no se pueden incrustar en los vídeos que renderiza el sistema. Si se quieren exactamente los
de iOS, hay que añadirlos desde el iPhone en el editor de TikTok o Instagram (ahí los dibuja iOS).

B-roll y música: solo desde `library/` y `clients/<id>/library/` con licencia declarada (ver `library/README.md`).
Voces y transcripciones: ElevenLabs, con las condiciones del plan de la cuenta del usuario.

Para regenerar los índices de iconos (español e inglés):

```console
npm i --no-save emojibase-data@17.0.0 @iconify-json/fluent-emoji-flat@1.2.6 && npx tsx scripts/motivos.ts
```
