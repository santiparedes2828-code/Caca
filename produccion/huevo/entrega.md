# huevo — entrega (2026-11-01)

**Video:** `out/huevo/huevo.mp4` (1080×1920, 34,8 s, −13,9 LUFS) · **Portada:** `out/huevo/portada.png` — «¿Qué vino primero? ¿Huevo o gallina?»
**Estructura y público:** reto de 2 s con pantalla dividida → «depende de qué huevo» → escala (300 millones de años vs 3.500)
→ el día entero (la gallina llega en el último segundo) → giro: el primer huevo de gallina → «ganó el huevo» → Seguime. Público general.

## Dato verificado
| Afirmación del guion | Fuente |
|---|---|
| Hace más de 300 millones de años ya había huevos | Live Science (≈ 325 M), Curious / Australian Academy of Science (≈ 340 M) |
| Los dinosaurios ponían huevos | huevos fósiles de dinosaurio (hecho establecido) |
| Las gallinas domésticas aparecen hace unos 3.500 años | Peters et al., PNAS 2022: Ban Non Wat (Tailandia), 1650–1250 a. C. |
| La gallina llega en el último segundo del «día» | 3.500 / 300 M × 86.400 s ≈ 1 s |
| La primera gallina salió de un huevo que puso un ave que todavía no era gallina; el cambio pasó adentro del huevo | PopSci, Live Science |

## ¿Ya se publicó? · vistas medias
Saturado: TED-Ed/AsapSCIENCE 23,6 M (página de TED-Ed), TikTok 2,3 M · 2 M · 152,5 K. Mediana de cortos ≈ 2 M (rango
150 K – 2,3 M), confianza **baja**. Ángulo nuevo: «depende de qué huevo» + el reloj de 24 h + el primer huevo de gallina.

## Los 3 ganchos y el elegido
Ver `ganchos.md`: gana V1 (reto 2 s + pantalla dividida); 2.ª V2 (cifra de 300 millones de años), guardada.

## Descripción (lista para pegar)
¿Qué vino primero: el huevo o la gallina? 🥚🐔 Tenías 2 segundos.

Si la historia del huevo fuera un día entero, la gallina llega en el último segundo. Y el primer huevo de gallina lo puso un ave que todavía no era gallina.

Seguime para más preguntas imposibles.

#datoscuriosos #ciencia #huevoogallina #sabiasque

## Afirmaciones a verificar antes de publicar
- «Gallinas domésticas, hace unos 3.500 años»: los primeros huesos inequívocos (PNAS 2022). La separación genética del gallo bankiva podría ser más antigua (hasta ~58.000 años); por eso el guion dice «domésticas».
- «Hace más de 300 millones de años ya había huevos»: se evitó «con cáscara» porque hay debate sobre si los primeros amniotas ponían huevos de cáscara dura.
- Si alguien comenta el estudio de 2010 («la gallina fue primero» por la proteína OC-17): los propios autores aclararon que solo explica cómo se forma la cáscara, no qué vino primero.
- El panel es una simulación orientativa; el predictor de Higgsfield no se pudo usar.

## Control de calidad (qa.py + revisión a ojo)
| Punto | Resultado |
|---|---|
| Fotograma 0 raro, en movimiento y con texto | Sí: pantalla dividida huevo prehistórico / gallina en el arrozal, «¿Qué» ya escrito |
| Pregunta que no se responde sola | Sí, con reloj real de 2 s; «ganó el huevo» recién a los ~28 s |
| Cada frase se ve cuando se oye | Sí: 3 huevos en «qué huevo», nido en «300 millones», dinosaurio en «dinosaurios», gallina en «gallinas», reloj que llega a 23:59:59 en «último segundo», el pollito sale en «salió», «CASI GALLINA» en «ave», el ADN cambia en «cambio», podio y sello en «ganó» |
| Movimiento | mín 1,54 · mediana 6,15 (ninguna ventana < 1,5), 0 congelados |
| Audio | −13,9 LUFS, pico −1,1 dBTP, tramos entre −15,8 y −20,7 dB |
| CTA único al final (rotación) | «Seguime» (Venus cerró con «Comentá») |

## Costos
ElevenLabs: 199 × 2 + 464 × 2 = 1.326 créditos · Higgsfield: 0.
