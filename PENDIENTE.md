# Pendiente

## Etapa 1 — Base: HECHA (2026-10-12)

Operativo y probado: ingesta validada, análisis FFprobe/FFmpeg, copia de trabajo normalizada, subtítulos desde
SRT/VTT/JSON con 5 modos, reencuadre a vertical/cuadrado/horizontal, render Remotion, QC con veredicto, informe,
reanudación, cancelación, bandeja de entrada y perfiles de cliente. Ver README.md.

Limitaciones conocidas de la Etapa 1:
- **Sin transcripción automática**: sin SRT/JSON el vídeo sale sin subtítulos y en `requiere_revision`.
- **Reencuadre sin detección de rostro**: el foco es fijo (`focusX`/`focusY`); revisar que no se corten caras.
- El énfasis del modo `dinamico` es una heurística (número o palabra de contenido más larga), no editorial.
- El color de pantalla vacía y los tramos negros se miden; la legibilidad sobre fondos complicados no.
- Probado con material compuesto a partir de recursos reales del repo (locución de marca + tiempos de Scribe +
  foto de B-roll). **Falta probar con una grabación real de cliente (talking head).**

## Etapa 2 — Material del cliente (siguiente)

1. Transcripción con tiempos por palabra, proveedores intercambiables:
   - local: faster-whisper (`.claude/skills/copiar-estilo/scripts/transcribir.py`); necesita acceso a huggingface.co
     para descargar el modelo (bloqueado en el contenedor cloud actual);
   - ElevenLabs Scribe por API (necesita `ELEVENLABS_API_KEY` y acceso a api.elevenlabs.io, bloqueado en el
     contenedor cloud actual).
2. Corrección manual opcional de la transcripción antes del render.
3. Detección de rostro para el foco del reencuadre y para mover los subtítulos si tapan la cara.
4. Recorte de silencios no destructivo (reutilizar la lógica de `cortar_silencios.py`).
5. Fotogramas representativos y detección de escenas del original.

## Etapas 3–7

Planificador editorial y clips candidatos · ElevenLabs (narración) · creación desde guion · cola con concurrencia,
lotes y costes · interfaz web y entregas por cliente con autenticación.

## Hecho antes — voz del reel "Este video no lo editó nadie" (2026-10-12)

- Voz de marca: ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, `eleven_v4`. 4 tomas generadas en el flow
  "Hook House · Voz reel viral"; elegida la toma 3 (generation `pHLGFICQNtqesk55Jxoe`, la de menos pausas).
- `public/audio/voz_viral.mp3` (toma original) → silencios recortados → `public/audio/voz_viral.wav` (39,0 s).
- Tiempos por palabra de Scribe en `analisis3/words_viral.json`: 106 palabras.
- Render `out/viral.mp4`: 41,2 s · 1080x1920 · 30 fps · −14,7 LUFS · pico −2,8 dBFS.
