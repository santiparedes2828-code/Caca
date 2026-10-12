# Pendiente

Las 7 etapas funcionan en versión básica (2026-10-12). El usuario pidió priorizar tenerlas todas antes que pulirlas.

## Verificación real pendiente (no se pudo hacer desde el contenedor cloud)

- **ElevenLabs por API desde el propio código** (transcripción y narración): `api.elevenlabs.io` está bloqueado en el
  contenedor. Lo verificado de verdad: una transcripción real hecha desde la sesión con el conector de ElevenLabs
  (`tests/data/elevenlabs-scribe-voz_a.words.json`, 502 créditos ≈ 0,05 USD; la estimación previa decía 40) y su
  procesado completo. Para verificarlo: `.env` con la clave y `npm run autopilot -- elevenlabs` en tu máquina.
- **Claude** (planificador y guiones desde brief): sin `ANTHROPIC_API_KEY` en el contenedor; probado con la API
  simulada. Comprobar con una clave real.
- **Grabación real de una persona hablando a cámara**: los vídeos de prueba usan imagen sintética. Falta pasar una
  grabación real de cliente (talking head) por todo el pipeline.

## Por pulir

- Creación: los componentes vienen de `src/HookHouse` (identidad Hook House fija); hacerlos genéricos por cliente.
  Más tipos de escena (gráficos de barras, comparativas, B-roll en escenas). E2E automatizado de creación.
- Edición: título/gancho animado al inicio de los clips; B-roll en formato tarjeta (no solo pantalla completa);
  hablante activo en podcasts (diarización ya disponible) para elegir a quién encuadrar.
- Rendimiento: el modo `blur-fill` dobla el coste de render (dos capas de vídeo); un render de 36 s tarda ~1–3 min con 4 núcleos.
- Web: sesiones en memoria (se pierden al reiniciar), sin gestión de usuarios desde la propia web, sin HTTPS propio
  (usar un proxy HTTPS si se expone a internet; `HH_WEB_SECURE_COOKIE=1`). Presets guardables por cliente.
- Biblioteca de B-roll y música vacía: hay que añadir recursos con licencia (`library/README.md`).
- Legibilidad de subtítulos sobre fondos difíciles (variante `shadow`) no se mide.

## Hecho antes — voz del reel "Este video no lo editó nadie" (2026-10-12)

- Voz de marca: ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, `eleven_v4`. 4 tomas generadas en el flow
  "Hook House · Voz reel viral"; elegida la toma 3 (generation `pHLGFICQNtqesk55Jxoe`, la de menos pausas).
- `public/audio/voz_viral.mp3` (toma original) → silencios recortados → `public/audio/voz_viral.wav` (39,0 s).
- Tiempos por palabra de Scribe en `analisis3/words_viral.json`: 106 palabras.
