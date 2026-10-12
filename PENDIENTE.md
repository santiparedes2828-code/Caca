# Pendiente

## Etapa 1 — Base: HECHA (2026-10-12)

Operativo y probado: ingesta validada, análisis FFprobe/FFmpeg, copia de trabajo normalizada, subtítulos desde
SRT/VTT/JSON con 5 modos, reencuadre a vertical/cuadrado/horizontal, render Remotion, QC con veredicto, informe,
reanudación, cancelación, bandeja de entrada y perfiles de cliente. Ver README.md.

Limitaciones conocidas de la Etapa 1:
- **Reencuadre sin detección de rostro**: el foco es fijo (`focusX`/`focusY`); revisar que no se corten caras.
- El énfasis del modo `dinamico` es una heurística (número o palabra de contenido más larga), no editorial.
- El color de pantalla vacía y los tramos negros se miden; la legibilidad sobre fondos complicados no.
- Probado con material compuesto a partir de recursos reales del repo (locución de marca + tiempos de Scribe +
  foto de B-roll). **Falta probar con una grabación real de cliente (talking head).**

## Etapa 2 — Material del cliente

### Hecho: transcripción con ElevenLabs (2026-10-12)

- Proveedor REST `autopilot/transcription/`: `POST /v1/speech-to-text` (`scribe_v2`, tiempos por palabra, diarización,
  eventos de audio) y `GET /v1/user/subscription`. Contrato verificado con el SDK oficial `@elevenlabs/elevenlabs-js`
  2.71.0. Caché por cliente, presupuesto por trabajo y diario, reintentos sin riesgo de doble cobro, clave tachada
  en errores y logs, palabras de baja confianza, corrección manual (`rehacer-subtitulos`), coste real registrado.
- **Verificación real**: ElevenLabs Scribe transcribió `public/audio/voz_a.mp3` (36 s, 79 palabras, español 94,6 %)
  desde esta sesión mediante el conector de ElevenLabs (flow "Hook House · Autopilot · prueba de transcripción").
  Resultado guardado en `tests/data/elevenlabs-scribe-voz_a.words.json`; procesado por el pipeline con subtítulos
  sincronizados y QC APROBADO. **Coste real: 502 créditos (≈ 0,05 USD); la estimación previa del conector era 40.**
- **No verificado aún**: la llamada REST del propio pipeline contra la API real. El contenedor cloud bloquea
  `api.elevenlabs.io`; las pruebas usan una simulación local de la API (`tests/support/fake-elevenlabs.ts`).
  Para verificarlo: en tu máquina (o con el dominio permitido), `.env` con la clave, `npm run autopilot -- elevenlabs`
  y un vídeo sin SRT en la bandeja.

### Siguiente

1. Detección de rostro para el foco del reencuadre y para mover los subtítulos si tapan la cara.
2. Recorte de silencios no destructivo (reutilizar la lógica de `cortar_silencios.py`).
3. Fotogramas representativos y detección de escenas del original.
4. Hablantes (diarización ya pedida a ElevenLabs) para podcasts y entrevistas.

## Etapas 3–7

Planificador editorial y clips candidatos · ElevenLabs (narración) · creación desde guion · cola con concurrencia,
lotes y costes · interfaz web y entregas por cliente con autenticación.

## Hecho antes — voz del reel "Este video no lo editó nadie" (2026-10-12)

- Voz de marca: ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, `eleven_v4`. 4 tomas generadas en el flow
  "Hook House · Voz reel viral"; elegida la toma 3 (generation `pHLGFICQNtqesk55Jxoe`, la de menos pausas).
- `public/audio/voz_viral.mp3` (toma original) → silencios recortados → `public/audio/voz_viral.wav` (39,0 s).
- Tiempos por palabra de Scribe en `analisis3/words_viral.json`: 106 palabras.
- Render `out/viral.mp4`: 41,2 s · 1080x1920 · 30 fps · −14,7 LUFS · pico −2,8 dBFS.
