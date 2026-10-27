# Reel 3D "aceite en la pasta": código completo

Archivos:
- shader.js: escena 3D (raymarching WebGL2): olla en corte, agua, aceite, pasta, almidón, burbujas, cuchara y primer plano del fideo.
- scene3.html: línea de tiempo, cámara, subtítulos palabra por palabra, etiquetas, DM y cierre con el ebook.
- words.json: tiempos de cada palabra de la voz (toma 2 de ElevenLabs).
- render.js: renderiza con Playwright + Chromium y codifica con ffmpeg.
- sfx.py: genera los efectos de sonido (sfx.wav).

Requisitos: Node + Playwright (Chromium), ffmpeg, Python 3 + numpy, fuente Inter instalada.

Pasos:
1. npm i playwright && npx playwright install chromium
2. Fotogramas de prueba: mkdir stills && node render.js stills 30 1.2,9.0,21.6,34.0
3. Video completo: node render.js silent.mp4 30
4. Efectos: python3 sfx.py
5. Unir: ffmpeg -i silent.mp4 -i sfx.wav -c:v copy -c:a aac -b:a 192k -shortest Recetas_aceite_pasta_3D_SIN_VOZ.mp4
6. (Opcional) con la voz descargada como voz.mp3:
   ffmpeg -i silent.mp4 -i voz.mp3 -i sfx.wav -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest final.mp4

Si el render es lento con GPU por software (SwiftShader), en una computadora con GPU suele ir mucho más rápido.
