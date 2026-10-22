# estilo-altera.md — «HOOKHOUSE ALTERA LA REALIDAD»

> **Sistema visual vigente para TODO el contenido de Hookhouse** (desde 2026-10-22). Sustituye la identidad verde de `estilo-hookhouse.md`; de esa guía se mantienen la voz de marca, la tipografía Inter y el CTA "HOOK".
> El contenido (qué se dice y cuándo) lo sigue decidiendo la skill `formula-viral`. Este archivo decide cómo se ve, cómo se mueve y cómo suena.
> Código: `src/Altera/system.tsx` (piezas reutilizables) · primer reel: `src/Altera/reels/Manifiesto.tsx` (id `Manifiesto`).

## 1. Idea
La edición tiene **fuerza física**: las palabras pesan, aplastan y empujan; la **línea naranja** engancha, se tensa y arrastra; los cortes **abren espacio**; los clips se transforman **dentro del plano**. Cada efecto comunica una idea; si un efecto no dice nada, no va.

## 2. Identidad (tokens en `A`)
| Token | Valor | Uso |
|---|---|---|
| Marfil | `#F2EDE3` | Fondo de todo. Evoluciona el blanco roto `#F7F7F2` |
| Marfil profundo | `#E6DFD2` | Suelos y planos traseros |
| Tinta | `#0E0D0B` | Texto, bordes, tapas |
| **Naranja eléctrico** | `#FF5A1F` (sombra `#C9400F`) | **Solo**: la línea-firma, una palabra clave por plano, la caja del CTA |
| Gris | `#8A847A` | Texto secundario |
- El verde `#12A150` deja de usarse.
- Textura: grano de papel (`public/altera/papel.png`, 9 %, multiplicar) + luz suave arriba. Sin viñeta fuerte.
- Profundidad: todo objeto apoyado lleva **sombra de contacto** (`ContactShadow`); al elevarse, la sombra crece y se suaviza. Tarjetas con borde tinta de 6 px y radio 30.

## 3. Tipografía con cuerpo
- **Inter 800**, tracking −0,045 em, interlineado 1,0. Es el peso máximo disponible; no meter otra familia.
- Titular de lectura (`Headline`): 84–96 px, alineado a la izquierda en x = 72, arriba (y ≈ 226–300). Entra palabra a palabra con la voz (opacidad + 14 px). **Una palabra clave en naranja como máximo.**
- Palabra-objeto (`Slab`): 90–220 px, centrada, apoyada en algo. Tiene peso:
  - **Aplastar** (`squash` 0..1): escala Y −32 %, X +18 %, siempre desde la base.
  - **Tensión** (`pull` −1..1): se inclina hacia el tirón (skew de hasta 10°).
  - **Impacto**: oscilación amortiguada corta (`impact()`), nunca un rebote gomoso.
  - La deformación nunca pasa del punto en que deja de leerse.
- Etiquetas (`Tag`): JetBrains Mono 28 px, mayúsculas, punto naranja. Para decir qué es el material ("REEL DE HOOKHOUSE · PROYECTO PROPIO").

## 4. Firma: la línea naranja (`Rope`)
- Entra **floja** (`slack` ≈ 0,9) desde fuera de cuadro, **engancha** (gancho en J al final), **se tensa** (`slack` → 0, vibra con `buzz`) y **arrastra** (`yank()`: lento-lento-rápido).
- Siempre transforma la escena: arranca una palabra, destapa un clip, se lleva un plano para que entre el siguiente.
- **No en cada transición.** Máximo 2 tirones por reel; el resto de transiciones nacen de otros objetos.
- Sonido obligatorio cuando aparece: **tensión** mientras se tensa, **tirón** al arrastrar.

## 5. Sonido propio (`SOUND`)
| Sonido | Archivo | Cuándo |
|---|---|---|
| Tensión | `public/sfx/hh/tension.wav` | La línea se tensa; algo está a punto de pasar |
| Tirón | `public/sfx/hh/tiron.wav` | La línea arrastra; un corte separa un plano |
| Impacto | `public/sfx/hh/impacto.wav` | Una palabra u objeto aterriza o aplasta (más bajo, 0,35, para golpes pequeños) |
- No hay más efectos de sonido: sin whooshes, sin glitches, sin risers. La voz de marca es Rodrigo Zabú (`eleven_v4`).
- Master: −14 LUFS integrado, pico ≤ −1,5 dBTP (loudnorm en **dos pasadas**).

## 6. Ritmo
- **Una acción dominante por plano.** Si cae una palabra, nada más se mueve fuerte.
- Contraste: la acción dura 6–12 frames; después, **pausa para leer** de 0,8–1,5 s con la imagen asentada.
- Cada frase de la voz provoca su acción en el mismo instante (formula-viral). Se puede partir la locución por frases y colocarlas en el tiempo que pida la imagen (`PHRASES` en `Manifiesto.tsx`).
- El resultado / la prueba se muestra **quieto y con tiempo**: mínimo 4 s sin trucos encima.

## 7. Transiciones (nacen de los objetos)
Repertorio, elegir según la idea y **no repetir la misma secuencia** de un reel a otro:
1. **Aplastar** — una palabra cae sobre un clip (peso = "esto sobra").
2. **Arrancar** — la línea engancha y se lleva algo (revelar).
3. **Girar la tarjeta** — el clip da la vuelta y por detrás está el siguiente (antes/después).
4. **Empujar** — una palabra empuja una tapa o un clip dentro del plano (ocultar, ordenar).
5. **Cortar** — trazo naranja + la tarjeta se parte en dos y las mitades caen; detrás está lo nuevo (cuándo cortar).
6. **Encuadrar** — esquinas naranjas (`FrameMarks`) que se cierran y recortan el clip (qué mostrar). Es un recorte con intención, no un zoom.
7. **Tumbar** — una tarjeta cae hacia atrás y se convierte en el suelo/plataforma del siguiente plano.
- Prohibido: glitches, partículas, neón, destellos, zooms y whooshes sin propósito, sacudidas de cámara.
- Variar: composiciones (centrado, izquierda, apilado), qué objeto lleva la acción, dirección de entrada.

## 8. Material y honestidad
- Usar **material real del portafolio** (`public/portfolio/`): reels hechos por Hookhouse, o material de clientes **solo con permiso** (Anime Industry: NO usar).
- Rotular qué es con `Tag`. **Nunca** inventar resultados, métricas, vistas ni clientes. No prometer viralidad.

## 9. Formato y zona segura
- 1080 × 1920, 30 fps, 18–22 s para piezas de marca.
- Zona segura (`SAFE`): x 72–930, y 210–1480. Fuera solo puede haber movimiento de paso (una palabra que entra o sale).
- El mensaje se entiende **sin audio**: el titular lleva la frase y el objeto la ilustra.
- Primer fotograma: ya está pasando la acción principal (algo cae, algo forcejea), sin logo ni introducción.
- Cierre en loop: el último plano devuelve los elementos a la posición del frame 0.

## 10. Cierre de marca
- Wordmark **HOOKHOUSE** (Inter 800, −0,055 em) que **se forma con peso**: HOOK cae y luego HOUSE, cada mitad aplasta al aterrizar sobre un objeto del reel.
- CTA: "Escribinos" + caja naranja **HOOK** (marfil sobre naranja). La línea puede engancharla para el loop.

## 11. Checklist antes de entregar
- [ ] Frame 0 intrigante y comprensible, sin logo · [ ] una acción dominante por plano · [ ] pausas de lectura después de cada acción
- [ ] naranja solo en la línea, una palabra y el CTA · [ ] ≤ 2 tirones · [ ] transiciones nacidas de objetos, sin efectos prohibidos
- [ ] material real rotulado, sin métricas inventadas · [ ] todo dentro de `SAFE` · [ ] se entiende sin audio
- [ ] loop: el último frame enlaza con el primero · [ ] −14 LUFS / ≤ −1,5 dBTP · [ ] revisado sobre el render (hoja de contactos a 5 fps)

---

## Correcciones aprendidas
_(Las correcciones aprobadas por el usuario se añaden aquí con fecha y prevalecen sobre lo anterior.)_
1. **No usar material de Anime Industry** en el contenido de Hookhouse (2026-10-22).
