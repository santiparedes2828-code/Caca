---
name: copiar-estilo
description: Editor de vídeo con Remotion que copia el estilo de un vídeo de referencia. Analiza la referencia (fotogramas, cortes, audio), escribe estilo.md con valores concretos, y edita el vídeo del usuario o crea uno nuevo desde un guion (voz IA + texto cinético palabra a palabra) siguiendo ese estilo; las correcciones aprobadas se guardan en estilo.md. Usar cuando el usuario pase un vídeo de referencia o pida "copia este estilo", "edita mi vídeo como este", "hazme un vídeo viral / TikTok / Reel / Short como este", "analiza este vídeo", o mencione estilo.md.
---

# Copiar estilo (editor de vídeo con Remotion)

Actúa como editor de vídeo. **Trabaja paso a paso y no avances sin terminar el anterior.**
Proyecto vertical **1080x1920 a 30 fps**. Las rutas de scripts son relativas a la raíz del repo.

## Paso 1 · Preparar

1. Comprueba Node, ffmpeg y Whisper (`python3 -c "import faster_whisper"`); instala lo que falte (`pip install --break-system-packages faster-whisper`).
2. Proyecto Remotion con composiciones 1080x1920 / 30 fps y skills oficiales (`npx skills add remotion-dev/skills -a claude-code -s '*' -y --copy`). En este repo ya está todo.
3. Pide al usuario lo que falte: el vídeo de referencia y, si va a editar su grabación, ese vídeo. Si no hay grabación, el vídeo se crea desde un guion (modo B del paso 3).
4. Los vídeos se adjuntan en el chat (llegan a `/root/.claude/uploads/...`): cópialos a `analisis/referencia.mp4` y `analisis/mi-video.mp4`. Los `.mp4` están en `.gitignore`.

## Paso 2 · Analizar la referencia → `estilo.md`

```bash
bash .claude/skills/copiar-estilo/scripts/analizar_referencia.sh analisis/referencia.mp4 analisis
```

- Mira **todas** las hojas de contacto (`analisis/hojas/hoja_*.jpg`; el número n de cada miniatura = n/2 segundos) y extrae 3–4 fotogramas a resolución completa para medir texto (`ffmpeg -ss T -i ... -frames:v 1`).
- Usa `escenas/tiempos.txt` (cortes duros), `audio.txt` y `envolvente.txt` (pausas de voz, golpes, loudness).
- Escribe `estilo.md` siguiendo [referencia/plantilla-estilo.md](referencia/plantilla-estilo.md): **valores concretos, no adjetivos** (s, px en lienzo 1080, frames, hex, dB). Convierte px del original a 1080 de ancho.
- Marca con **[SUPOSICIÓN]** todo lo que no se pueda medir (fuentes exactas, música, SFX, lo que dice la voz si no se transcribió).
- Si ya existe `estilo.md` de otra referencia, pregunta si se reemplaza o se crea `estilo-<nombre>.md`. **Nunca borres la sección "Correcciones aprendidas"**: se conserva y prevalece.
- **Enseña un resumen de 5 líneas y espera la respuesta antes de seguir.**

## Paso 3 · Editar / crear el vídeo

### Modo A · Editar la grabación del usuario (`mi-video.mp4`)

1. Transcribe con tiempos por palabra:
   `python3 -I .claude/skills/copiar-estilo/scripts/transcribir.py analisis/mi-video.mp4 analisis/words.json`
   Si sale con código 2 (no puede descargar el modelo de huggingface.co), usa ElevenLabs Scribe (ver *Transcribir con ElevenLabs*) o pide al usuario que permita `huggingface.co` en la red del entorno.
2. Corta silencios > 0,3 s y genera los subtítulos:
   `python3 -I .claude/skills/copiar-estilo/scripts/cortar_silencios.py analisis/mi-video.mp4 analisis/words.json public/video/mi-video-cortado.mp4`
   (corta imagen y sonido a la vez, normaliza a ~-14 LUFS y escribe `src/data/captions.json`).
3. Monta la composición: `<Video>` de `@remotion/media` a pantalla completa + texto cinético + zooms/b-roll/transiciones de `estilo.md`.

### Modo B · Crear desde guion (sin grabación)

1. Pregunta (AskUserQuestion) lo que cambie el resultado: voz (IA / sin voz / la graba el usuario), imágenes (gráficos en código / IA), palabra del CTA, idioma.
2. Escribe `guion.md` con la fórmula de guion de `estilo.md`: tabla escena · locución · línea script · línea de impacto (palabra destacada) · gráfico. **No inventes cifras, plazos ni promesas del negocio**: deja huecos o pregúntalos.
3. Voz IA (ElevenLabs): `creative_list_voices` → `creative_generate_speech` con `estimate_only: true` primero y di el coste → generar → `creative_get_flow_run_status` → descargar `content_url` con curl (storage.googleapis.com es accesible) a `public/audio/`.
4. Tiempos por palabra de la toma elegida (Scribe, ver abajo) → `cortar_silencios.py public/audio/voz_X.mp3 analisis/words_X.json public/audio/voz.wav`.

### Montaje (ambos modos)

Reutiliza `src/Promo/` como base (copia la carpeta con otro nombre para un vídeo nuevo):

| Archivo | Qué hay |
|---|---|
| `theme.ts` | fuentes locales, colores, aberración cromática, duración del whip |
| `Kinetic.tsx` | `<Words from to font size color hl>`: palabra a palabra desde `captions.json` (blur 12→0, opacidad, escala 1,08→1 en 6 frames) y palabra destacada `box` / `glow` / `green` |
| `Scene.tsx` | `<Scene>`: fondo claro/oscuro/negro, push-in 1→1,08, whip con desenfoque, grano, `TextZone`, `GraphicZone`, `Petals`, `SmallPrint` |
| `graphics.tsx` | gráficos B/N en SVG animados con `useWordFrame(i)` (sincronizados a la palabra i) |
| `Promo.tsx` | lista de escenas (índice de su primera palabra + entrada `whip`/`cut`), golpes en palabras destacadas, voz y SFX |

- Cambia valores para que coincidan con el `estilo.md` actual; no copies el estilo de la referencia anterior.
- Registra la composición en `src/Root.tsx` (1080x1920, 30 fps, duración = última palabra + ~1,2 s).
- SFX: `public/sfx/whoosh.wav` y `hit.wav` (sintetizados con ffmpeg; `remotion.media` no es accesible aquí).
- B-roll de objetos/productos: si se piden "reales", genera una foto de estudio sobre fondo blanco (ElevenLabs `creative_generate_image`, modelo `bytedance-seedream-5-pro`; Higgsfield exige plan de pago) y quita el fondo en local:
  `python3 -I .claude/skills/copiar-estilo/scripts/recortar_fondo.py foto.png public/broll/objeto.png` → `<Img src={staticFile("broll/objeto.png")}>` con sombra.
- Varios proyectos en el mismo repo: cada uno con su `analisis-N/`, `estilo-<nombre>.md`, `src/data/captions-<nombre>.json` y carpeta `src/<Nombre>/` (ejemplos: `src/Promo/` creado desde guion, `src/Clip/` editando una grabación).

### Verificar antes de enseñar

1. `npm run lint` (eslint + tsc).
2. `npx remotion still <Id> out/p.png --frame=N` en un frame con texto.
3. `npx remotion render <Id> out/borrador.mp4 --concurrency=4`.
4. Extrae fotogramas **por número** (`select=eq(n\,N)`) en momentos clave (palabras destacadas, mitad de cada escena) y revísalos en una hoja de contacto: texto legible, nada cortado, sin cuadros vacíos (glifos fuera del subconjunto latino como ✓ no se ven).
5. Loudness: `ffmpeg -i out/borrador.mp4 -af ebur128=peak=true -f null -` → **I ≈ -14 LUFS, pico ≤ -1 dBFS**.
6. Envía el vídeo con `SendUserFile` y explica **qué decisiones has tomado** (guion, voz, toma, cortes, estilo, gráficos, sonido) y qué queda pendiente.

## Paso 4 · Aprender de las correcciones

Cuando el usuario corrija algo y le guste el resultado:
1. Aplica el cambio, vuelve a renderizar y envía el nuevo borrador.
2. Añádelo a `estilo.md` → **Correcciones aprendidas** (numerado, con fecha y vídeo) y tacha/anota la regla que contradice en su sección (`~~regla~~ → Anulado: ver Correcciones aprendidas`).
3. Las correcciones aprendidas **prevalecen** sobre todo lo demás en vídeos futuros.

## Transcribir con ElevenLabs (alternativa a Whisper)

Para una generación de voz ya existente: `creative_add_flow_asset_node` (modality `audio`, `generation_id` de la toma) → `creative_transcribe_audio` con `connect_from: [node_id]`, modelo `eleven_scribe_v1` → `creative_get_flow_run_status` → descarga `words_download_url` a `analisis/words_X.json` (formato `{"words": [...]}`, compatible con `cortar_silencios.py`).
Para un archivo local hay que subirlo primero (`creative_create_asset_upload` → PUT → `creative_finalize_asset_upload`).

## Entorno cloud: problemas conocidos

Ver [referencia/entorno-cloud.md](referencia/entorno-cloud.md) antes de renderizar o descargar nada.
