# Reel 3D «aceite en la pasta» (2026-10-27)
- `src/`: código recibido (shader WebGL2 + línea de tiempo + subtítulos con `words.json` + `sfx.py`). Render con `render.js` (Playwright + SwiftShader).
- Voz: Agustina (`LZj1dIzYRl9rc9TIXnMt`, eleven_v4, voz del recetario), flow `tmZyUVpKgH4mOB7QYFo7`; tiempos con Scribe (`voz_words.json`).
- `alinear.py`: corta la voz en 17 tramos (hasta cada signo de puntuación) y los encaja en los tiempos de `src/words.json`
  (de ×0,86 a ×1,30; el más rápido es «y ni lo toca.»), así subtítulos, cámara y voz coinciden sin tocar el código.
- Mezcla: voz alineada + `sfx.wav`, −14 LUFS → `out/ebook/aceite_pasta_3d.mp4`.
