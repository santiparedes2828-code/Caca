# «La medialuna» v2 — pruebas de gancho, voz, guion y efectos (2026-10-30)

> El panel es una **simulación orientativa** (método de la skill `analisis-reels-virales`): 5 espectadores ficticios
> recorren cada versión segundo a segundo con las hojas de fotogramas y los tiempos de la voz. No reemplaza las
> métricas reales de Instagram. Claude no escucha el audio: lo que se dice del sonido sale de mediciones.

## Panel (el mismo para todas las pruebas)

| # | Persona | Situación | Relación con el tema | Paciencia | Se queda si… / se va si… |
|---|---|---|---|---|---|
| 1 | **Laura**, 41 | Dueña de una panadería en Rosario. Mira Instagram de noche, después de cerrar. Graba sus productos con el celular. | Público ideal, muy interesada | Media-alta si es sobre su negocio | Se queda si ve su rubro o su problema; se va con promesas vagas |
| 2 | **Martín**, 33 | Dueño de una hamburguesería. Scrollea entre pedidos, con el celular en una mano. | Público ideal, apurado | 1–2 s | Se queda si entiende el beneficio de inmediato o si es un juego corto; se va con introducciones |
| 3 | **Sofía**, 28 | Community manager freelance. Ve decenas de reels de «tips» por día. | Escéptica, cree que ya sabe | 2 s | Se queda con una demostración concreta o un reto; se va con «3 tips» genéricos |
| 4 | **Diego**, 19 | Estudiante. Llega por casualidad desde Explorar. | Fuera del público | 1 s | Se queda con juegos, personajes, humor; se va si huele a marketing |
| 5 | **Carmen**, 55 | Dueña de una mercería. Mira en el colectivo **sin sonido**. | Público ideal amplio | Media | Se queda si el texto en pantalla se entiende solo; se va si depende del audio |

## Ronda 1 · 5 ganchos (aperturas renderizadas en `out/medialuna_v2/ganchos/`)

Todos con la misma panadería de ejemplo, Gancho a la izquierda, celular que cae en el fotograma 0 y la voz de marca.

| # | Mecanismo | Voz (duración) | Escalera | Primeros 3 s en pantalla |
|---|---|---|---|---|
| 1 | Pregunta con conflicto | «¿Se puede mejorar el video de una panadería… sin comprar una cámara?» (4,6 s) | nicho, acción, historia, experiencia (texto) | Celular + subtítulos; la cámara cae recién a los 3,75 s |
| 2 | **Reto en tiempo real** | «Encontrá la medialuna en este video. Tenés dos segundos.» (4,0 s) | nicho (visual), acción, temporalidad, meta | Cronómetro «2,0» visible desde el fotograma 0 + local lleno de cosas |
| 3 | Promesa con número | «Tres cambios para que tu producto se vea en el primer segundo.» (3,9 s) | acción, temporalidad, meta, nicho (texto) | Caen las insignias 1·2·3; aro en el producto; chip «0:01» |
| 4 | Nicho + conflicto | «Si tenés una panadería, tu medialuna está en el video… pero no se ve.» (4,7 s) | nicho, historia | Celular + subtítulos; el zoom llega a los 4,75 s |
| 5 | Resultado primero | «Mismo video, misma cámara. Solo cambió la edición.» (3,8 s) | acción, meta, experiencia (texto) | Comparación ANTES/DESPUÉS desde el fotograma 0 |

### Resultados por gancho

| Gancho | Laura | Martín | Sofía | Diego | Carmen (sin sonido) | Pasan 3 s | Salida media* |
|---|---|---|---|---|---|---|---|
| 1 Pregunta | sigue («panadería» a los 2 s) | 2,0 s: tarda en llegar al punto y no pasa nada | 3,0 s: la respuesta es obviamente «sí» | 1,0 s | 4,0 s: entiende la pregunta pero la imagen no cambia | 2/5 | 2,5 s |
| **2 Reto** | sigue: busca su producto | sigue: juego de 2 s | sigue: quiere comprobar si la encontró | sigue: es un juego | sigue: «Encontrá la medialuna» + reloj se entienden sin audio | **5/5** | — |
| 3 Promesa | sigue | sigue (beneficio claro) | 1,5 s: «otro reel de 3 tips» | 1,0 s | sigue (insignias + texto) | 3/5 | 1,3 s |
| 4 Nicho | sigue (le habla a ella) | 1,5 s: «no tengo panadería» | 2,5 s | 1,0 s | 3,0 s: mercería, no panadería | 1/5 | 2,0 s |
| 5 Resultado | sigue | sigue hasta 4 s y se va: ya vio el final | 4,0 s: antes/después visto mil veces | 2,0 s | sigue (chips ANTES/DESPUÉS) | 4/5 | 3,3 s |

*Salida media de quienes se van en la apertura.

**Ganador: gancho 2 (reto en tiempo real).** Es el único que pasan los 5, incluido quien mira sin sonido, y deja el
bucle abierto (¿la encontré?). Coincide con el dato real de la cuenta: el reto en tiempo real fue lo que más retuvo a
los 3 s en TikTok (73 %). El 5 retiene bien al principio pero cierra el bucle a los 4 s (el antes/después de la cuenta
murió en el segundo 2–5).

**Defectos del 2 que se corrigen en la versión final:**
- El reloj arranca recién cuando termina la frase (3,75 s): Martín espera demasiado → arranca en «Tenés» y la cuenta de 2 s termina a los ~4,6 s.
- La escalera queda corta: le faltan experiencia y meta → texto en el fotograma 0 «EDITO REELS PARA NEGOCIOS» y la meta en el cuerpo («que se vea en el primer segundo»).

## Ronda 2 · 3 voces (misma frase de prueba con voseo y el CTA)

Frase: «Encontrá la medialuna en este video. Tenés dos segundos. Si tenés un negocio, mandame "VIDEO", y te muestro cómo
mejoraría uno de tus clips.» (25 palabras). Archivos: `vozA_rodrigo.mp3`, `vozB_mateo.mp3`, `vozC_estrella.mp3`.

| Voz | Ficha de ElevenLabs | Palabras bien transcritas (Scribe) | Voz hablada | Ritmo | Pausa más larga |
|---|---|---|---|---|---|
| A · Rodrigo Zabú (marca) | latinoamericana, cálida | 25/25 (voseo «encontrá / tenés / mandame» correcto) | 9,52 s | 2,63 pal/s | 0,50 s (antes de «Si tenés») |
| B · Mateo | uruguaya, calmada y cercana | 25/25 | 9,16 s | 2,73 pal/s | 0,54 s |
| C · Estrella Rosso | femenina latinoamericana | 25/25 | 9,78 s | 2,56 pal/s | 0,48 s |

- Inteligibilidad: **empate** (las tres al 100 %). Tras recortar silencios la diferencia de ritmo es de ±4 %.
- El panel no puede «oír» las voces y Claude tampoco: timbre, naturalidad y acento no se pueden validar acá.
- **Decisión: se queda la voz de marca (A)**, para que la v1 y la v2 se diferencien solo en gancho y guion (si también
  cambiara la voz, no se sabría qué produjo la diferencia). **Retadora para la próxima prueba: B (Mateo)**, por acento
  rioplatense nativo según su ficha y el ritmo más rápido. Escuchar los tres archivos antes de decidir un cambio de voz de marca.

## Ronda 3 · 3 guiones (con el gancho 2 ganador), panel sobre guion cronometrado y storyboard

| Guion | Estructura | Duración estimada |
|---|---|---|
| A · Mito | reto → «está ahí» → mito de la cámara cara → FALSO → 3 cambios → antes/después → CTA (cuerpo de la v1) | ~36 s |
| **B · Escalera** | reto → «está acá… y en el primer segundo tu cliente ve: un logo» → 3 cambios, y después de cada uno se repite el primer segundo con un indicador «EN EL SEGUNDO 1 SE VE:» (UN LOGO → EL LOCAL → LA MEDIALUNA → + POR QUÉ COMPRARLA) → «mismo video, misma cámara: ahora se ve en el primer segundo» → CTA | ~27 s |
| C · Corto | reto → «está acá» → montaje rápido de los 3 cambios con rótulos, sin explicarlos → «solo cambió la edición» → CTA | ~20 s |

| Guion | Laura | Martín | Sofía | Diego | Carmen (sin sonido) | Llegan al final | Guardan / comparten |
|---|---|---|---|---|---|---|---|
| A | final | 8 s (el mito frena después del reto) | 25 s (ya entendió) | 6 s | 20 s | 1/5 | guarda Laura |
| **B** | final | 13 s (vio 2 cambios: suficiente para él) | final (demostración concreta, quiere ver el último escalón) | 7 s | final (el indicador se lee sin audio) | **3/5** | guardan Laura y Sofía; Laura comparte (se lo manda a su socia) |
| C | final, pero sin entender por qué cada cambio | final (es corto) | 14 s (sin explicación le parece superficial) | 6 s | final | 3/5 | guarda Carmen |

**Ganador: guion B (escalera).** Empata en finales con el C pero tiene más guardados y el único compartido: cada
cambio reabre la pregunta «¿qué ve ahora en el primer segundo?» (el mismo mecanismo de la referencia: la misma pieza
mejorada por escalones), y cierra con la meta de la escalera del gancho («se ve en el primer segundo»).

## Ronda 4 · efectos (sobre la v2 producida)

| Prueba | Variante A | Variante B | Medición | Elegida |
|---|---|---|---|---|
| Subtítulos | palabra actual en tinta, palabra clave en naranja (estilo de la v1) | **palabra actual en píldora naranja** (composición `MedialunaV2`; A = `MedialunaV2SinPildora`) | En las capturas a tamaño celular, la píldora marca dónde va la lectura; sin ella la palabra actual casi no se distingue de las anteriores. Carmen (sin sonido) y Martín (apurado) siguen mejor la B | **B** (choca con la regla de marca de usar el naranja solo en una palabra por plano: decisión de prueba, ver «Pendiente») |
| Música | **cama a 0,22** | cama a 0,12 (`MedialunaV2MusicaBaja`) | Voz −17,7 LUFS; música −21,1 LUFS × ganancia → A queda 16,6 dB debajo de la voz, B 21,8 dB. Una cama de 12–18 dB debajo se oye sin tapar la voz; a 22 dB se pierde en el parlante del celular | **A** |
| Movimiento | — | — | Detección de cuadros congelados (−60 dB, 0,3 s): **0 tramos quietos** en todo el video | — |

## Ronda 5 · panel sobre el render final (`out/medialuna_v2/medialuna_v2.mp4`, 28,1 s)

| Persona | Se va en el segundo | Motivo | Acciones |
|---|---|---|---|
| Laura | hasta el final | Es su rubro; el marcador «EN EL SEGUNDO 1 SE VE» le muestra el error de su propio video | guarda, comparte (a su socia), probable DM «VIDEO» |
| Martín | 14 | Jugó el reto y vio dos cambios: ya tiene la idea | like |
| Sofía | 21 | Se queda por la escalera; en el CTA («si tenés un negocio») ya no es para ella | guarda |
| Diego | 7 | El reto le gustó; cuando aparece «un logo» se vuelve tema de negocios | like |
| Carmen (sin sonido) | hasta el final | Reto, marcador y ANTES/DESPUÉS se leen sin audio | guarda, posible DM |

- **Pasan los 3 s: 5/5** · salida media de los que se van: 14 s · llegan al final: 2/5 · comparten: 1 · guardan: 3.
- No se cumple ninguna condición de mejora obligatoria (nadie se va en el mismo tramo, 5/5 pasan los 3 s, hay un compartido).
- Mejora aplicada igual en el tramo más flojo (6–9 s, la intro del logo, donde se va Diego): el logo ahora «carga» lento con zoom y respiración, para que se note que hace esperar sin dejar la imagen quieta.

## Comparación con la v1 (mismo panel, recorriendo la hoja de fotogramas de la v1)

| | v1 «Si en tu video el producto se ve así…» | v2 reto + escalera |
|---|---|---|
| Pasan los 3 s | ≈3/5 (Diego se va al segundo; Martín duda hasta el zoom de los 2 s) | 5/5 |
| Llegan al final | 1–2/5 (el desvío del mito frena después del gancho) | 2/5 |
| Duración | 31,7 s | 28,1 s |

## Pendiente (decisiones del usuario)
- **Voz:** escuchar `vozA_rodrigo.mp3`, `vozB_mateo.mp3` y `vozC_estrella.mp3`. Si la B suena mejor, se regenera la v2 con Mateo (≈380 créditos).
- **Píldora naranja en los subtítulos:** ganó en legibilidad, pero usa más naranja del que permite `estilo-altera.md`. Si se aprueba, pasa a «Correcciones aprendidas».
- **Validación real:** publicar v1 y v2 en días distintos a la misma hora y comparar retención a 3 s, % completo, guardados, compartidos y DMs «VIDEO» (ver `notas-experimentales.md`).
