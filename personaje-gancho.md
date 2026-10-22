# personaje-gancho.md — GANCHO, el personaje de Hookhouse

> Biblia del personaje. Va junto con `estilo-altera.md` (mundo, colores, sonido) y la skill `formula-viral` (contenido).
> Código: `src/Altera/Gancho.tsx` (rig) · `src/Altera/props.tsx` (utilería) · hoja de modelo: composición `GanchoSheet` (`out/gancho_hoja.png`) · primer reel: `src/Altera/reels/Elefante.tsx` (id `Elefante`).

## 1. Quién es
- **Gancho** es un frijol de tinta con ojos enormes y un **anzuelo naranja que le nace de la cabeza**. El anzuelo es la línea-firma de la marca: lo lanza, engancha cosas, las tensa y las arrastra.
- Es el **narrador** de los reels explicativos: la voz de marca (Rodrigo Zabú) es su voz y mueve la boca con cada palabra.
- Personalidad: curioso, pícaro, físico. Explica haciendo: no señala una idea, la **agarra**. Le pasan cosas (lo aplastan, se cae de culo con un tirón) y se levanta con cara de "lo tenía controlado".
- Lo que nunca hace: hablar a cámara sin hacer nada, bailar sin motivo, salir solo de adorno.

## 2. Diseño (no cambiar)
| Parte | Regla |
|---|---|
| Cuerpo | Frijol de tinta `#0E0D0B`, 2/3 de su altura total. Un brillo suave arriba a la izquierda. Sin contorno extra |
| Ojos | Dos óvalos marfil `#FBF8F2` grandes, pupila tinta con brillo. Los párpados son de tinta (bajan sobre el ojo) |
| Cejas y boca | Trazos marfil sobre el cuerpo |
| Brazos y piernas | Manguera de tinta (17–18 px), manos = guantes redondos marfil con contorno de tinta, pies = óvalos de tinta |
| Anzuelo | Naranja `#FF5A1F`, tallo recto + J con lengüeta. Es lo único naranja del personaje. Se balancea un poco al moverse |
| Proporción | 400 × 520 en el rig; en reels 0,5–0,65 de escala (260–340 px de alto en la maqueta) |
| Sombra | Siempre con sombra de contacto debajo |

## 3. Expresiones (`expr`)
`normal` · `happy` (ojos ^ ^) · `surprised` (ojos grandes, cejas arriba) · `focused` (párpados a media altura, cejas en V) · `smug` (pícaro: un ojo entornado, media sonrisa) · `strain` (esfuerzo: dientes) · `squashed` (aplastado: boca en zigzag) · `love` (ojos de corazón naranja, solo para el remate).
- `talk` (0..1) abre la boca al hablar; en el reel se calcula a partir de los tiempos de cada palabra (`talkAt`).
- Parpadea solo cada ~3,2 s. Respira (escala ±1,2 %) cuando está quieto.

## 4. Poses y acciones del rig
- `armL` / `armR`: ángulo del brazo (0 abajo · 90 horizontal · 180 arriba) y `bendL` / `bendR` para la curva.
- `walk`: fase del paso. `lean`: inclinarse (tirar hacia atrás = positivo si lo que arrastra está a la izquierda). `squash`: aplastar / estirar desde los pies. `flip`: mirar a la izquierda. `look`: hacia dónde miran las pupilas.
- `item`: `scissors` (cortar), `frame` (encuadrar), `popcorn` (ver el resultado), `none`.
- **Lanzar el anzuelo**: `hookOut: true` esconde el anzuelo de la cabeza y se dibuja una `<Rope>` desde `antennaWorld(pose)` hasta lo que engancha. Siempre con los sonidos de tensión y tirón.

## 5. Cómo actúa (reglas de animación)
1. **Una acción dominante por plano**, y la hace Gancho o la provoca él (arrastra, tira, corta, salta encima).
2. Antes de un tirón: tensión (se inclina hacia atrás, la línea vibra). Después: consecuencia física (se cae sentado, el objeto sale volando).
3. Reacciones de 6–12 frames y después una pausa para leer; nunca reacciona a todo.
4. Interactúa con las palabras: puede subirse a un título que cae, empujar un objeto, quedarse aplastado debajo.
5. El chiste sale de la física, no de muecas: peso, tirón, rebote corto, aplastado.
6. Escala estable dentro de un reel; si cambia es porque se aleja o se acerca dentro de la maqueta.
7. Fuera de la zona segura nunca: en los reels su borde derecho queda en x ≤ 930 de pantalla (la columna de botones de TikTok).

## 6. Formato del reel explicativo con Gancho
- Escenario: suelo marfil, sin fondo dibujado (el mundo es la utilería). Se compone en coordenadas de maqueta (suelo y = 1150) y se escala 1,25× con el suelo en y = 1330 de pantalla.
- **Subtítulos arriba** (`Captions`, y = 250, 74 px, Inter 800): palabra que "aterriza", una palabra clave naranja por bloque, sin puntos ni comas.
- **Sin texto doble:** cuando la palabra ya está en escena como objeto (un título que cae, el CTA), el subtítulo calla.
- Utilería plana de `props.tsx` (sábana, cajón, tarjetas, letras sueltas, globos). Un color fuera de paleta solo si el guion lo nombra (el elefante **rosa**).
- Material real del portafolio dentro de una tarjeta (`OffthreadVideo`) con `Tag` "REEL DE HOOKHOUSE".
- Cierre: HOOK y HOUSE caen con peso, Gancho salta encima, CTA "Escríbeme HOOK" y Gancho engancha la caja naranja. Loop: el último plano vuelve al primero.

## 7. Checklist del personaje
- [ ] Gancho hace la acción principal de cada tramo · [ ] tensión antes de cada tirón y consecuencia después · [ ] boca sincronizada con la voz
- [ ] anzuelo naranja como único naranja del personaje · [ ] sombra de contacto siempre · [ ] dentro de la zona segura
- [ ] sin texto doble · [ ] frame 0 ya en acción · [ ] loop al final
