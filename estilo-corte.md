# estilo-corte.md — CORTE HOOKHOUSE (estilo de edición para clientes)

> Cómo edita Hookhouse los vídeos de sus clientes (cabeza parlante, podcast, entrevista, coach a cámara).
> Es la versión «de servicio» de `estilo-altera.md`: misma identidad (marfil, tinta, naranja, Inter 800, 3 sonidos),
> pero **el protagonista es el cliente**. La marca se nota en tres firmas y nada más.
> Código: `src/Cut/kit.tsx` · demo: `src/Cut/PodcastCut.tsx` (id `PodcastCut`).
> El contenido (qué va primero, cuándo se ve cada cosa) lo decide `formula-viral`.

## 0. La idea en una frase
**La línea naranja engancha la atención y la lleva a donde importa**: subraya la palabra que suena, cuelga los titulares y tira de los cortes.

## 1. Las tres firmas (siempre)
| Firma | Qué es | Dónde |
|---|---|---|
| **La línea** | Subrayado naranja de 11 px bajo la palabra que suena: crece desde la izquierda en 4 frames y se recoge hacia la derecha al pasar a la siguiente | Subtítulos (`LineCaptions`) |
| **La tarjeta colgada** | Tarjeta marfil `#FBF8F2`, borde tinta 6 px, radio 30, colgada de la línea naranja que baja del borde superior. Cae con peso, se balancea y sale de un tirón hacia arriba | Titular de apertura y pregunta final (`HangCard`) |
| **El tirón** | La línea engancha el plano por el borde y lo arrastra fuera de cuadro; debajo aparece el papel marfil y entra el plano siguiente | Máximo **2 por vídeo**, solo en cambios de bloque (`yankOffset` + `YankRope`) |

## 2. Subtítulos «línea»
- Inter 800, **82 px** (palabra clave ×1,12), tracking −0,035 em, color marfil `#FBF8F2`, sombra tinta dura de 5 px + halo suave. **Sin contorno grueso tipo Hormozi.**
- **2–3 palabras** por bloque; se corta en coma, punto o cambio de plano. Sin puntuación final.
- Las palabras ya dichas al 100 %, las que faltan al 55 %. La que suena hace un pop de 8 %.
- **Una palabra clave por frase** en naranja (la que lleva el sentido: cifra, verbo fuerte, resultado).
- Posición: y = **1150** (zona segura TikTok/Reels), centrados entre x = 72 y x = 930.

## 3. Encuadre y ritmo
- Dos encuadres: **A = 1,00** y **B = 1,18**. Se alterna en cada frase → cada frase es un corte visual aunque el plano sea el mismo.
- **Empuje** en la palabra clave: +6 % en 3 frames, se queda en +3,6 %.
- Deriva lenta: +2 % cada 10 s (el plano nunca está quieto).
- **Silencios**: ninguno de más de 0,4 s (se recortan a ~0,2 s). Muletillas y repeticiones fuera.
- Apertura en frío: el vídeo empieza por la **frase más fuerte** del clip, aunque esté al final (formula-viral).

## 4. Tarjetas
- **Titular colgado** (`HangCard`): y = **290** (encima de la cabeza, **nunca sobre los ojos**), Inter 800 70 px tinta, una palabra en naranja. En el frame 0 ya está aterrizando.
- **Pila** (`StackCard`): para listas y enumeraciones. Tarjetas pequeñas que caen **al lado de la cara** (x ≈ 872, y ≈ 660) y se apilan: 01, 02, 03… La última en naranja.
- **Sin texto doble**: la tarjeta no repite lo que dice el subtítulo. Si él dice «fighter», la tarjeta dice «LIFE 01».
- Etiqueta en JetBrains Mono 26–28 px naranja, MAYÚSCULAS, tracking +0,1 em.

## 5. Acabado
- Grado cálido suave: `contrast(1.07) saturate(1.06) sepia(0.06) brightness(1.02)`.
- Grano de papel al 6 % (multiplicar) y degradado tinta abajo (50 %) para leer los subtítulos. Sin viñeta fuerte.

## 6. Sonido
- Voz a **−14 LUFS** (loudnorm en dos pasadas, TP −1,5). Cama musical a volumen 0,05 (casi no se nota).
- Solo los 3 sonidos de marca: **impacto** (tarjeta que aterriza), **tirón** (transición), **tensión** (apertura). Nada de whooshes ni pops genéricos.

## 7. Cierre
- Pregunta para comentarios en tarjeta colgada (en el idioma del vídeo), los últimos ~2,3 s.
- El CTA es **del cliente**, no de Hookhouse. Sin marca de agua.

## 8. Checklist
- [ ] ¿Frame 0 con el titular colgado ya visible y la frase más fuerte sonando?
- [ ] ¿La línea naranja corre bajo la palabra que suena?
- [ ] ¿Nada tapa los ojos del cliente?
- [ ] ¿Cada frase cambia de encuadre (A/B)?
- [ ] ¿Como mucho 2 tirones y solo en cambios de bloque?
- [ ] ¿Ningún silencio > 0,4 s?
- [ ] ¿Sin texto doble ni puntuación final?
- [ ] ¿Solo los 3 sonidos de marca y voz a −14 LUFS?

## Correcciones aprendidas
_(Se añaden aquí, numeradas y con fecha, cuando el usuario corrija algo del estilo y le guste el resultado.)_
