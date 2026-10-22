---
name: estudio-hookhouse
description: Estilo ESTUDIO HOOKHOUSE para todo lo que se entrega a clientes (podcast, cabeza parlante, entrevista, coach a cámara, muestras gratis de HOOK) - editorial y caro, Inter Bold + Garamond italic, subtítulos de podcast con palabra clave grande en serif, láminas de motion graphics sobre papel blanco, b-roll real a pantalla completa, retoques en naranja y animaciones siempre suaves. Sin Hookie ni efectos de la marca. Usar SIEMPRE que se edite material de un cliente ("edita este vídeo", "edítame este reel", "la muestra de HOOK"), junto con formula-viral.
---

# Estudio Hookhouse (entregas a clientes)

1. Lee `estilo-estudio.md`: sección 0 (reglas del usuario) y "Correcciones aprendidas" prevalecen.
2. **Nunca** uses `src/Altera/` ni a Hookie en la edición de un cliente: eso es solo para el contenido propio de Hookhouse.
3. El orden lo decide `formula-viral`: abre con la frase más fuerte del clip.
4. Transcribe palabra a palabra, elige tramos (`SEGS`) y recorta silencios > 0,4 s.
5. Construye con `src/Studio/kit.tsx` (referencia completa: `src/Studio/PodcastStudio.tsx`):
   - `PodcastCaptions` + `phrases`: subtítulos de podcast · `GRADE`, `Grain`, `Vignette`, `softCut`: plano del cliente.
   - `Plate`, `Editorial`, `Orb`: láminas de motion graphics · `BRoll`: b-roll real a pantalla completa · `Soft`: sonidos suaves.
6. Un efecto por plano, naranja solo de retoque, animaciones con `SMOOTH`/`GLIDE` (sin rebotes ni golpes).
7. B-roll: imágenes reales con licencia desde la API conectada; si no se pueden traer, dilo y resuelve la toma con una lámina (nunca inventes).
8. Renderiza, revisa una hoja de contactos a 2 fps y fotogramas clave a resolución completa, corrige y entrega a −14 LUFS.
