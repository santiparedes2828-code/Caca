# loteria — entrega (2026-11-02)

**Video:** `out/loteria/loteria.mp4` (1080×1920, 35,5 s, −14 LUFS) · **Portada:** `out/loteria/portada.png` — «1 boleto por semana: ganás en 5 millones de años»
**Estructura y público:** escala absurda en el cuadro 0 (contador de años) → reglas del Powerball (bombo + boleto) →
292 millones de combinaciones → más de 6 Argentinas → 5,5 millones de años → giro: «y aun así alguien gana» (pozo récord)
→ por qué (millones de boletos) → Comentá «suerte». Público general.

## Dato verificado
| Afirmación del guion | Fuente |
|---|---|
| 5 números de 69 y 1 de 26 | Powerball (matriz desde 2015) |
| 292 millones de combinaciones (1 en 292.201.338) | Multi-State Lottery Association vía IBTimes, El Nuevo Día; C(69,5) × 26 |
| Más de 6 Argentinas enteras | INDEC, Censo 2022: 46.044.703 (provisorio) / ≈ 46,2 M (definitivo) → 6,3 veces |
| Un boleto por semana: unos 5,5 millones de años | 292.201.338 ÷ 52 = 5.619.256 años (promedio) |
| 2022: un solo boleto ganó un pozo de 2.040 millones de dólares | Yahoo/NBC/Today (8/11/2022, Altadena, California) |

## ¿Ya se publicó? · vistas medias
Tema muy cubierto por medios (CNN, CBS, CNBC, Telemundo…). **No se encontraron cifras de vistas de videos cortos**:
sin datos para estimar. Ángulo propio: comparaciones verificables con cuentas (Argentinas, años) en vez de rayos o tiburones.

## Los 3 ganchos y el elegido
Ver `ganchos.md`: gana V2 «Si jugás un boleto por semana, ganás la lotería en cinco millones de años»; 2.ª V1 (cifra).

## Descripción (lista para pegar)
Si jugás un boleto por semana, ganás la lotería en 5 millones de años 🎟️⏳

En el Powerball hay 292 millones de combinaciones: es como adivinar a una persona entre más de 6 Argentinas enteras. Y aun así, alguien gana.

Comentá «suerte» si igual vas a jugar 🍀

#datoscuriosos #loteria #probabilidad #sabiasque

## Afirmaciones a verificar antes de publicar
- Los 5,5 millones de años son un **promedio** (valor esperado): alguien podría ganar antes o nunca.
- El pozo de 2.040 millones era el **anunciado** (pagado en cuotas); en efectivo eran ≈ 997,6 millones antes de impuestos (rotulado en pantalla).
- El hook dice «5 millones» (redondeo hacia abajo del 5,6): el cuerpo da la cifra precisa (≈ 5,5).
- No se muestran logos de la lotería; se rotula «LOTERÍA · EE. UU.».

## Control de calidad (qa.py + revisión a ojo)
| Punto | Resultado |
|---|---|
| Fotograma 0 raro, en movimiento y con texto | Sí: contador «1.000 años» que ya corre, reloj de arena, lluvia de boletos, «Si» escrito |
| Pregunta que no se responde sola | Sí: «¿cómo puede ser?» → se explica después, y el giro («alguien gana») llega a los ~25 s |
| Cada frase se ve cuando se oye | Sí: bolillas que salen en «5» y la roja en «26», contador en «292 millones», banderas en «6 Argentinas», contador de años en «5,5 millones», cheque en «2.040 millones», lluvia de boletos en «juegan millones» |
| Movimiento | mín 5,62 · mediana 13,96, 0 congelados |
| Audio | −14 LUFS, pico −2,0 dBTP, tramos entre −16,1 y −19,4 dB |
| CTA único al final (rotación) | «Comentá «suerte»» (huevo cerró con «Seguime») |

## Costos
ElevenLabs: 225 × 2 + 504 × 2 = 1.458 créditos · Higgsfield: 0.
