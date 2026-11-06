# sacudida — entrega (2026-11-06)

**Video:** `out/sacudida/sacudida.mp4` (1080×1920, 30,6 s, −14 LUFS, voz «Tony» de ElevenLabs) · **Portada:** `out/sacudida/portada.png` — «¿Por qué te despertás cuando soñás que te caés?»
**Estructura y público:** pregunta directa con la cama cayendo al vacío en el cuadro 0 → nombre (sacudida hípnica) →
casi 7 de cada 10 personas → los músculos se aflojan → la teoría más conocida: el cerebro lo confunde con una caída →
tensa el cuerpo y te despierta → microsueño (el escalón que no estaba) → hipótesis de los antepasados en los árboles →
estrés, café y poco sueño → no es peligroso → Seguime. Público general.

## Dato verificado
| Afirmación del guion | Fuente |
|---|---|
| Se llama sacudida hípnica (*hypnic jerk*) | Sleep Foundation · Wikipedia · El Tiempo |
| Les pasa a casi 7 de cada 10 personas | Sleep Foundation (hasta 70 %) · The Sleep Charity y Medical News Today (60–70 %) |
| Pasa al dormirte, cuando los músculos se aflojan | Cleveland Clinic (Dra. Reena Mehra, vía ABC4) · revisión en PubMed (vigilia tranquila y etapa N1) |
| La teoría más conocida: el cerebro lo confunde con una caída y tensa el cuerpo | Live Science · RNZ · El Tiempo (la causa no está confirmada; revisión de 2018 en *Current Sleep Medicine Reports*) |
| A veces viene con un microsueño | Sleep Foundation (puede venir con un sueño breve) · Ubie Health |
| Hipótesis: reflejo de antepasados que dormían en árboles | Coolidge y Wynn (UCCS), *Before Farming*, 2006 · Live Science (lo llama especulativo) |
| Pasa más con estrés, café o poco sueño | Cleveland Clinic (vía ABC4) · Sleep Foundation |
| No es peligroso | Sleep Foundation · AASM y NINDS (citados por ScienceABC) |

## ¿Ya se publicó? · vistas medias
**Saturado**: médicos con millones de seguidores lo explicaron en TikTok (Dr Amir Khan, Dr Joe Whittington, Dr Kunal
Sood, Doctor Youn) y decenas de medios lo levantaron. **No se encontraron cifras de vistas** de videos cortos: sin datos
para estimar. Ángulo propio: animado, en primera persona (la cama que cae), con el escalón que no estaba y la hipótesis de
los árboles, sin médico a cámara.

## Los 3 ganchos y el elegido
Ver `ganchos.md` (panel simulado, orientativo): gana **V1** «¿Por qué te despertás de golpe cuando soñás que te caés?»
(5/5 pasan los 3 s, 4/5 llegan al final); 2.ª guardada: V2 «Estás por dormirte… y de golpe, sentís que te caés».
V3 (primates): 3/5 a los 3 s. Predictor de Higgsfield: no se usó (red bloqueada y sin créditos).

## Descripción (lista para pegar)
¿Por qué te despertás de golpe cuando soñás que te caés? 😵‍💫🛏️

Se llama sacudida hípnica y le pasa a casi 7 de cada 10 personas. La teoría más conocida: tu cerebro, medio dormido, confunde la relajación de los músculos con una caída. Y hay una hipótesis todavía más rara: los árboles 🌳

Si te pasa muy seguido o no te deja dormir, consultá con un médico.

Seguime para más cosas raras de tu cuerpo 🧠

#datoscuriosos #sueño #cerebro #sabiasque #ciencia

## Afirmaciones a verificar antes de publicar
- La causa **no está confirmada**: el guion dice «la teoría más conocida» y en pantalla dice «TEORÍA: LA CAUSA EXACTA NO ESTÁ CONFIRMADA».
- Lo de los árboles es **una hipótesis** (Coolidge y Wynn, 2006): el guion lo dice y en pantalla va el sello «HIPÓTESIS» y «NO ESTÁ PROBADA».
- «Casi 7 de cada 10» resume el rango 60–70 % (en pantalla: «60–70 % de las personas»).
- La voz es de España («Tony») con voseo en el guion; escuchá que suene natural.

## Control de calidad (qa.py + revisión a ojo)
| Punto | Resultado |
|---|---|
| Fotograma 0 raro, en movimiento y con texto | Sí: cama cayendo al vacío entre estelas, «?» enorme, «¿Por» escrito |
| Pregunta que no se responde sola | Sí: el «por qué» se responde a los ~10–13 s (el cerebro lo confunde con una caída) |
| Cada frase se ve cuando se oye | Sí: cartel en «sacudida», 7 camas que saltan en «7 de cada 10», barra de tensión que baja en «aflojan», cerebro medio dormido y burbuja de caída en «confunde», «¡!» y golpe en «despierta», escalón que desaparece en «escalón», sello en «hipótesis», primate que resbala en «reflejo», tarjetas en «estrés / café / poco sueño», escudo en «peligroso» |
| Movimiento (mín ≥ 1,5 cada 0,3 s) | mín 2,15 · mediana 6,92 · 0 congelados (se agregó movimiento a la escena del árbol, que daba 1,24) |
| Audio (−14 LUFS, tramos parejos) | −14,0 LUFS, pico −1,9 dBTP, tramos entre −15,9 y −18,0 dB |
| CTA único al final (rotación) | «Seguime» (lotería cerró con «Comentá «suerte»») |

## Costos
ElevenLabs: 180 × 2 (ganchos) + 497 × 2 (cuerpo) = 1.354 créditos · Higgsfield: 0.
