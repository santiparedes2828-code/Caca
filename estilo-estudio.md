# estilo-estudio.md — ESTUDIO HOOKHOUSE (lo que se entrega a los clientes)

> **Vigente desde 2026-10-22.** Sustituye a `estilo-corte.md` (descartado).
> Código: `src/Studio/kit.tsx` · demo: `src/Studio/PodcastStudio.tsx` (id `PodcastStudio`).
> Referencia analizada: `analisis17/referencia.mp4` (576×1024, 30 fps, 35 s; de 32,1 s en adelante es la cortinilla de TikTok).
> El orden del contenido (qué va primero, cuándo se ve cada cosa) lo sigue decidiendo `formula-viral`.

## 0. Reglas del usuario (2026-10-22, textuales en espíritu)
1. **Dos mundos separados.** Hookie (Gancho) y los efectos de la marca (`src/Altera/`: línea-cuerda, tarjetas colgadas, impactos, tirones, sonidos tensión/tirón/impacto) son **solo para el contenido propio de Hookhouse**. **Nunca** en la edición de un cliente.
2. Lo que se entrega al cliente es **caro y de alto valor**: editorial, limpio, con aire.
3. Tipografía: **Inter Bold** o **Apple Garamond Italic** (aquí EB Garamond 700 italic, el sustituto libre). Nada más.
4. **Motion graphics** de verdad (láminas compuestas, objetos con sombra, líneas que se dibujan) en vez de elementos sueltos (pegatinas, cajas, emojis).
5. **No muchos efectos en el mismo plano**: un efecto por plano.
6. **Adaptarse más al b-roll**: el b-roll ilustra lo que se dice, a pantalla completa o dentro de una lámina.
7. Los subtítulos de podcast son **como los del vídeo de referencia** (línea pequeña Inter + palabra clave grande en Garamond italic).
8. Las animaciones son **siempre, siempre, siempre suaves**.
9. Retoques en **naranja** (no el blanco y negro puro de la referencia).
10. B-roll con **la API de imágenes que conectó el usuario** (ver §7).

## 1. Qué hace la referencia (medido)
- Ritmo: 15 cortes en 32 s → un plano cada ~2,1 s; dentro del plano el texto se construye palabra a palabra.
- Dos mundos visuales alternos: **b-roll cinematográfico oscuro** (sepia, grano, poca saturación) con el texto encima, y **láminas blancas** de motion graphics (objetos 3D con sombra larga, retícula fina, curvas finas, polaroids con cinta).
- Texto: frase en sans negrita pequeña (≈ 40–60 px a 1080) + palabra clave en **serif negrita itálica condensada en MAYÚSCULAS** (≈ 150–220 px), mezclando tamaños en la misma composición ("Apple / ESTABA / al borde").
- Entradas: desenfoque → nítido + opacidad, sin rebote. Sobre vídeo, la palabra clave lleva un halo blanco suave.
- Audio: voz IA + música, −17 LUFS integrados (aquí se entrega a −14).

## 2. Identidad (tokens `S`)
| Token | Valor | Uso |
|---|---|---|
| Papel | `#F4F3EF` (luz radial a `#FFFFFF`, bordes `#E9E7E1`) | Fondo de las láminas |
| Tinta | `#111110` | Texto y objetos de lámina |
| Gris | `#9A978F` | Elementos ya pasados (32 % de opacidad) |
| **Naranja** | `#FF5A1F` (sobre vídeo `#FF7A45`) | **Solo retoques**: subrayado que se dibuja, número de índice, una esfera, una curva o UNA palabra clave cada varios segundos |

## 3. Subtítulos de podcast (`PodcastCaptions`)
- Línea pequeña: **Inter 700, 52 px**, blanca, sombra suave `0 2px 18px rgba(0,0,0,.55)`; se escribe palabra a palabra.
- Palabra clave: sola debajo, **EB Garamond 700 italic, 150 px, MAYÚSCULAS**, tracking −0,03 em, halo blanco suave; subrayado naranja de 5 px que se dibuja de izquierda a derecha (16 frames).
- La frase se corta **después** de la palabra clave, en puntuación, en pausa > 0,45 s o a las 4 palabras.
- Entrada de cada palabra: desenfoque 10 → 0, opacidad 0 → 1 y 14 px de subida en **9 frames** (curva `SMOOTH`). Salida: desenfoque + fundido en 6 frames.
- Posición: bloque centrado desde y = 1060 (zona segura). Sin puntuación final.
- Palabra clave en naranja (`HOT`) solo en los momentos que lo merecen (respuesta, cifra, remate).

## 4. Plano del cliente
- **Un solo efecto**: acercamiento lento 1,00 → 1,04 a lo largo del plano.
- Grado: `contrast(1.05) saturate(0.88) sepia(0.08) brightness(0.98)` + viñeta suave + grano 5 %.
- Cortes suaves: desenfoque 9 px y −18 % de luz durante 10 frames alrededor del corte. **Sin flashes, sin sacudidas, sin zoom de golpe.**

## 5. Láminas de motion graphics (`Plate`)
- Papel blanco con retícula fina (líneas de 2 px al 7 %), objetos con **sombra larga y blanda**, curvas finas que se dibujan.
- Entran y salen con fundido + desenfoque 14 px + escala 1,03 → 1 en 12 frames (`GLIDE`).
- Composición editorial (`Editorial`): línea Inter 60 px + palabra Garamond italic 210 px con subrayado naranja.
- Mientras hay lámina, **los subtítulos se ocultan**: el texto de la lámina ES lo que se dice (sin texto doble).
- Listas/índices: números Inter 700 naranja + palabra Garamond italic; lo ya dicho en gris al 32 %, una línea naranja vertical marca el progreso.

## 6. Sonido
- Voz del cliente a **−14 LUFS** (loudnorm en dos pasadas, TP −1,5). Cama musical muy baja (0,07) con fundidos.
- Solo sonidos suaves: `sfx/studio/soft_whoosh.wav` (whoosh con paso bajo a 2,2 kHz) en entradas/salidas de láminas y `soft_riser.wav` al inicio. **Nunca golpes.**

## 7. B-roll
- Fotos/vídeos **reales y con licencia**, a pantalla completa (`BRoll`): Ken Burns lento 1,06 → 1,14 con deriva de 30 px, mismo grado que el cliente, viñeta y grano. También pueden ir como miniaturas dentro de una lámina.
- Fuente pedida por el usuario: la API de imágenes conectada (Composio). Estado 2026-10-22: **muapi** (generación) devuelve imágenes de muestra (sin créditos) y la red del entorno bloquea `upload.wikimedia.org`, `images.unsplash.com`, `images.pexels.com`, `d3adwkbyhxyrtq.cloudfront.net` y `backend.composio.dev`. Con esos dominios permitidos o con créditos en muapi, las imágenes van a `public/broll/<proyecto>/` y se rellenan en `BROLL`.
- Nunca se inventa b-roll: si no hay imagen real, esa toma se resuelve con una lámina de motion graphics.

## 8. Checklist
- [ ] ¿Cero elementos de Hookie/Altera?
- [ ] ¿Solo Inter Bold y Garamond italic?
- [ ] ¿Un efecto por plano?
- [ ] ¿Todas las animaciones sin rebote ni golpes (curvas `SMOOTH`/`GLIDE`)?
- [ ] ¿Naranja solo como retoque?
- [ ] ¿B-roll real donde la voz nombra algo visual?
- [ ] ¿Sin texto doble ni puntuación final? ¿Zona segura?
- [ ] ¿Voz a −14 LUFS?

## Correcciones aprendidas
_(Se añaden aquí, numeradas y con fecha, cuando el usuario corrija algo y le guste el resultado. Prevalecen sobre lo anterior.)_
