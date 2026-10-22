---
name: corte-hookhouse
description: Estilo de edición CORTE HOOKHOUSE para vídeos de clientes (cabeza parlante, podcast, entrevista, coach a cámara) - subtítulos con la línea naranja bajo la palabra que suena, titular colgado de la línea, tarjetas que se apilan, el tirón como transición y los 3 sonidos de marca. Usar SIEMPRE que se edite material grabado de un cliente o una muestra gratis ("edita este vídeo", "edítame este reel", "la muestra de HOOK"), junto con formula-viral.
---

# Corte Hookhouse

1. Lee `estilo-corte.md` (reglas, medidas y checklist). Prevalece su sección "Correcciones aprendidas".
2. El orden y la apertura los decide `formula-viral`: empieza por la frase más fuerte del clip.
3. Transcribe el clip palabra a palabra (Scribe), elige los tramos (`SEGS`) y recorta silencios > 0,4 s.
4. Construye con `src/Cut/kit.tsx`; no reinventes:
   - `LineCaptions`: subtítulos con la línea naranja · `FRAMING` + `sentenceIndex` + `punchAt`: encuadre A/B y empuje.
   - `HangCard`: titular colgado (apertura y pregunta final) · `StackCard`: listas que se apilan al lado de la cara.
   - `yankOffset` + `YankRope`: el tirón (máx. 2) · `GRADE` + `Finish`: acabado · `Sfx`: sonidos de marca.
   - Referencia completa: `src/Cut/PodcastCut.tsx`.
5. Nada sobre los ojos del cliente; sin texto doble; sin puntuación final; el CTA es del cliente.
6. Renderiza, revisa una hoja de contactos a 2–6 fps (apertura, cortes, tarjetas, subtítulos), corrige y entrega a −14 LUFS.
