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

- **Cuenta de ElevenLabs**: el 12-10-2026 ElevenLabs rechazó la narración del vídeo de mandarinas porque
  desactivó el plan gratuito de la cuenta por «actividad inusual». Mientras siga así, la narración y la
  transcripción fallan (el sistema lo informa); se arregla en la cuenta (plan de pago o soporte de ElevenLabs).

## Por pulir

- Creación con tema: la elección es por palabras clave (15 temas). Con Claude configurado podría elegir mejor
  (tema, iconos) entre las mismas opciones validadas. Faltan ilustraciones y B-roll temático además de iconos,
  más tipos de escena (gráficos de barras, comparativas, antes/después) y que los clientes guarden su tema propio.
- Animaciones de `estilo-animaciones.md`: ya en la base para los vídeos creados. Faltan, de la referencia, la onda
  de la voz con cabezal (sincronía visible), las anotaciones con flecha dibujada y el cierre «Guarda» con chips de
  repaso; y en la edición (motor A), el aro y el visor «REC» que siguen la cara (el encuadre ya la sigue).
  La cámara que sigue usa un cálculo aproximado de la posición de cada bloque: con escenas muy cargadas puede
  quedarse corta.
- Edición: título/gancho animado al inicio de los clips; B-roll en formato tarjeta (no solo pantalla completa);
  hablante activo en podcasts (diarización ya disponible) para elegir a quién encuadrar.
- Rendimiento: el modo `blur-fill` dobla el coste de render (dos capas de vídeo); un render de 36 s tarda ~1–3 min con 4 núcleos.
- Web: sesiones en memoria (se pierden al reiniciar), sin gestión de usuarios desde la propia web, sin HTTPS propio
  (usar un proxy HTTPS si se expone a internet; `HH_WEB_SECURE_COOKIE=1`). Presets guardables por cliente.
  Acceso desde el teléfono: `web --red` en la misma Wi-Fi o Tailscale; falta alojarla en un servidor propio con
  HTTPS para usarla sin el ordenador encendido.
- Biblioteca de B-roll y música vacía: hay que añadir recursos con licencia (`library/README.md`).
- Legibilidad de subtítulos sobre fondos difíciles (variante `shadow`) no se mide.

## Hecho antes — voz del reel "Este video no lo editó nadie" (2026-10-12)

- Voz de marca: ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, `eleven_v4`. 4 tomas generadas en el flow
  "Hook House · Voz reel viral"; elegida la toma 3 (generation `pHLGFICQNtqesk55Jxoe`, la de menos pausas).
- `public/audio/voz_viral.mp3` (toma original) → silencios recortados → `public/audio/voz_viral.wav` (39,0 s).
- Tiempos por palabra de Scribe en `analisis3/words_viral.json`: 106 palabras.
