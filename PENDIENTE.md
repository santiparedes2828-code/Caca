# Pendiente

Nada pendiente.

## Hecho — voz del reel "Este video no lo editó nadie" (2026-10-12)

- Voz de marca: ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, `eleven_v4`. 4 tomas generadas en el flow
  "Hook House · Voz reel viral"; elegida la toma 3 (generation `pHLGFICQNtqesk55Jxoe`, la de menos pausas). Las
  otras tres siguen en el flow por si se prefiere otra.
- `public/audio/voz_viral.mp3` (toma original) → silencios recortados → `public/audio/voz_viral.wav` (39,0 s).
- Tiempos por palabra de Scribe en `analisis3/words_viral.json` ("tres" + "D." unidos en "3D."): 106 palabras,
  mismo texto y orden que antes, así que los índices de escena de `src/Viral/Viral.tsx` no cambian.
- Render `out/viral.mp4`: 41,2 s · 1080x1920 · 30 fps · −14,7 LUFS · pico −2,8 dBFS.

Para cambiar de toma: descargar la otra a `public/audio/voz_viral.mp3`, repetir la transcripción y los pasos de
`cortar_silencios.py`, y comprobar de nuevo las 106 palabras.
