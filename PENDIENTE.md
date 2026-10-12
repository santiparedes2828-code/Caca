# Pendiente — voz del reel "Este video no lo editó nadie" (Hook House)

Estado: el reel (`src/Viral/`, composición `Viral`) está terminado **sin voz**. Sus tiempos salen del ritmo de lectura
(`scripts/tiempos_texto.py` → `src/data/captions-viral.json`).

Voz de marca (obligatoria, ver `estilo-hookhouse.md` §0 y corrección 5): **ElevenLabs · Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`, modelo `eleven_v4`**.

Pasos (requieren el conector de ElevenLabs cargado en la sesión):
1. `creative_generate_speech` (primero `estimate_only: true`) con la locución de `guion-viral.md` y esa voz.
2. Descargar la mejor toma (`content_url`, storage.googleapis.com es accesible) a `public/audio/voz_viral.mp3`.
3. Tiempos por palabra con Scribe: `creative_add_flow_asset_node` (generation_id de la toma) → `creative_transcribe_audio` → descargar `words_download_url` a `analisis3/words_viral.json`.
4. `python3 -I .claude/skills/copiar-estilo/scripts/cortar_silencios.py public/audio/voz_viral.mp3 analisis3/words_viral.json public/audio/voz_viral.wav src/data/captions-viral.json`
5. Comprobar que la transcripción tiene **106 palabras en el mismo orden** que `guion-viral.md` (los índices de escena de `src/Viral/Viral.tsx` dependen de ello). En pantalla "tres D" debe leerse **3D**: corregir ese token en `captions-viral.json` (texto "3D.") si Scribe lo separa en dos palabras, y ajustar índices si cambia el recuento.
6. Añadir `<Audio src={staticFile("audio/voz_viral.wav")} />` en `src/Viral/Viral.tsx`, renderizar `npx remotion render Viral out/viral.mp4 --concurrency=4`, revisar fotogramas y loudness (≈ −14 LUFS).
