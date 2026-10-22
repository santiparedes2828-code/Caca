---
name: hookhouse-altera
description: Sistema visual obligatorio de Hookhouse «ALTERA LA REALIDAD» (marfil, tinta y naranja eléctrico; tipografía con peso; línea naranja que engancha y arrastra; sonidos propios de tensión, tirón e impacto; transiciones nacidas de los objetos). Usar SIEMPRE que se haga cualquier reel, TikTok, video, motion o pieza de marca de Hookhouse, junto con la skill formula-viral, y cuando el usuario pida "el estilo de Hookhouse", "nuestro estilo" o un video nuevo para la marca.
---

# Hookhouse · ALTERA LA REALIDAD

1. Lee `estilo-altera.md` y `personaje-gancho.md` (Gancho, el personaje de la marca, protagoniza y narra los reels explicativos animados) (reglas completas: identidad, tipografía, firma, sonidos, ritmo, transiciones, honestidad, zona segura, checklist). Prevalece su sección "Correcciones aprendidas".
2. El contenido (gancho, orden, sincronía voz-imagen, respuesta al final, CTA) lo decide la skill `formula-viral`.
3. Construye con las piezas de `src/Altera/system.tsx`; no reinventes:
   - `A`, `SAFE`, `FLOOR`, `SOUND`, `FONT`, `LABEL`: identidad, zona segura y sonidos.
   - `Paper`: fondo marfil con grano · `ContactShadow`: sombra de apoyo.
   - `Slab`: palabra-objeto con peso (`squash`, `pull`, `lift`) · `Headline`: titular de lectura palabra a palabra.
   - `Rope`: la línea-firma (`slack`, `buzz`, gancho) · `ClipCard`: clip real con recorte (`focus`), giro (`tilt`) y aplastado.
   - `FrameMarks`: encuadre · `Tag`: rótulo honesto del material.
   - Física: `fall`, `impact`, `yank`, `settle`, `lin`.
4. Para un reel explicativo animado usa `src/Altera/Gancho.tsx` (rig: expresiones, brazos, paso, `talk`, `hookOut` + `antennaWorld` para lanzar el anzuelo), `src/Altera/props.tsx` (utilería) y `Captions`; referencia: `src/Altera/reels/Elefante.tsx` (escenario en coordenadas de maqueta escalado 1,25×, subtítulos arriba, sin texto doble). Para una pieza tipográfica usa `src/Altera/reels/Manifiesto.tsx` como referencia de estructura: locución partida por frases (`PHRASES`) para colocar cada frase cuando lo pide la imagen, una escena por tramo y los sonidos con `Snd`.
5. Varía: no repitas la secuencia del Manifiesto. Elige 3–4 transiciones del repertorio (§7) según la idea, como máximo 2 tirones de la línea, y composiciones distintas.
6. Material: solo real del portafolio (`public/portfolio/`), rotulado con `Tag`. Nada de métricas inventadas. No usar material de Anime Industry.
7. Renderiza, revisa una hoja de contactos a 5 fps (lectura, ritmo, transiciones, cierre/loop), corrige y entrega a −14 LUFS (loudnorm en dos pasadas).
8. Cuando el usuario apruebe una corrección del estilo, añádela con fecha a "Correcciones aprendidas" en `estilo-altera.md`.
