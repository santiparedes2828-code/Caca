# huevo — ganchos (2026-11-01)

Último video: «Un día en Venus» → tipo **absurdo cotidiano** (no repetir).

## Candidatos (rúbrica 0–2 por criterio, máx. 12)
A fotograma 0 raro y en movimiento · B pregunta que no se responde sola · C específico · D se entiende sin sonido ·
E no revela la respuesta antes de ~10 s · F tipo distinto al último video.

| # | Tipo | Gancho | Fotograma 0 | A | B | C | D | E | F | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Reto 2 s + dividida | «¿Qué vino primero: el huevo o la gallina? Tenés dos segundos.» | huevo gigante que tiembla / gallina que cacarea, reloj | 2 | 2 | 1 | 2 | 2 | 2 | **11** |
| 2 | Cifra en el cuadro 0 | «Esta pregunta tiene una respuesta de trescientos millones de años.» | contador de años que corre + huevo que brilla | 2 | 2 | 2 | 2 | 2 | 2 | **12** |
| 3 | Mito + sello | «¿El huevo o la gallina? Dicen que no tiene respuesta… pero la tiene.» | huevo y gallina girando en círculo infinito → sello «TIENE RESPUESTA» | 2 | 2 | 1 | 2 | 2 | 2 | **11** |
| 4 | Afirmación | «La gallina llegó tarde. Muy tarde.» | gallina corriendo con un reloj | 2 | 1 | 1 | 1 | 1 | 2 | 8 |
| 5 | Escala | «Si la historia del huevo fuera un día, la gallina llega en el último segundo.» | reloj de 24 h | 1 | 1 | 2 | 2 | 0 | 2 | 8 |
| 6 | Vos | «Seguro respondiste mal: ¿huevo o gallina?» | — | 1 | 2 | 0 | 1 | 2 | 2 | 8 |
| 7 | Depende | «¿El huevo o la gallina? Depende de una sola palabra.» | — | 1 | 2 | 1 | 1 | 2 | 2 | 9 |
| 8 | Absurdo cotidiano | «Tu desayuno es más viejo que los dinosaurios.» | huevo frito en un plato | 2 | 2 | 1 | 1 | 1 | 0 | 7 |

## Los 3 finalistas (→ ganchos.txt), de tipos distintos
1. Reto 2 s: «¿Qué vino primero: el huevo o la gallina? Tenés dos segundos.»
2. Cifra: «Esta pregunta tiene una respuesta de trescientos millones de años.»
3. Mito + sello: «¿El huevo o la gallina? Dicen que no tiene respuesta… pero la tiene.»

## Validación con las aperturas (`out/huevo/aperturas.png`)
### Panel de 5 espectadores (simulación orientativa)
| Persona | V1 reto 2 s + dividida | V2 cifra 300 millones | V3 mito + sello |
|---|---|---|---|
| Laura, interesada | final · comenta «¡el huevo!» | final | final |
| Martín, apurado | 11 s (cree que ya sabe: «huevo») | 8 s | 3 s |
| Sofía, escéptica | final (espera el «huevo de gallina») | final · guarda | 15 s |
| Diego, 19, fuera del público | final · comparte (es «la» pregunta) | 5 s | 2 s (fondo oscuro, nada pasa) |
| Carmen, sin sonido | final (pantalla dividida + reloj) | final (contador) | final |
| **Pasan los 3 s** | **5/5** | 5/5 | 3/5 |
| **Llegan al final** | **4/5** | 3/5 | 2/5 |

### Predictor externo (Higgsfield)
No se usó: la red de la sesión bloquea `upload.higgsfield.ai` y la cuenta tiene 0,05 créditos (ver conversación).

### Elegido y por qué
- **Gana V1**: la pregunta más conocida del mundo + el reto en tiempo real (dato real de la cuenta: 73 % a los 3 s) +
  pantalla dividida (huevo prehistórico / gallina en el arrozal) en el fotograma 0. Invita a comentar la apuesta.
  No repite el tipo del último video (Venus: absurdo cotidiano).
- **Segundo (guardado)**: V2 «Esta pregunta tiene una respuesta de trescientos millones de años».


### Corrección del usuario (2026-11-01)
«Quitá el tenés 2 segundos» → el gancho final es «¿Qué vino primero: el huevo o la gallina?» con pantalla dividida y un «VS» en el centro (sin reloj). Recortado con `quitar_final` en config.json, sin regenerar la voz.
