---
name: fabrica-viral
description: Fábrica de videos virales de Hook House - el usuario escribe una idea y se entrega un Reel/TikTok/Short terminado - investiga si la idea ya se publicó y cuántas vistas tuvo, verifica el dato, escribe 3 ganchos finalistas y los valida (aperturas renderizadas + panel + predictor), escribe el guion, genera la voz, la música original, la animación con el motor de Remotion, controla la calidad y entrega video, portada, descripción e informe. Usar SIEMPRE que el usuario pase una idea para un video ("tengo una idea", "hacé un video de...", "dato curioso de...", "armá un viral sobre...") o pida usar la fábrica / el sistema.
---

# Fábrica viral (Hook House)

Sistema armado con lo que funcionó en «La servilleta de Messi», «Cleopatra y la Luna» y «Un día en Venus».
Se combina con: `formula-viral` (qué se dice y cuándo se ve), `estilo-animado.md` (cómo se ve) y las reglas
permanentes del usuario (abajo). Todo lo que se produce queda en `produccion/<slug>/` y `out/<slug>/`.

## Reglas permanentes (del usuario, no se negocian)
- **Nada inventado**: cada dato con 2 fuentes (preferí la primaria: NASA, museos, Britannica, organismos oficiales).
  Si hay un matiz (p. ej. «día» sideral vs. solar), el guion lo dice bien y el matiz va a la entrega.
- **Nunca prometer viralidad ni vistas.** Las vistas de la investigación son estimaciones públicas, con su confianza.
- **Sin Hookie** salvo pedido explícito. **Estilo animado** (`estilo-animado.md`), no ALTERA marfil.
- **Nunca quieto más de 0,3 s** (qa.py lo mide). **Sin zoom por palabra**; golpes solo en impactos.
- **Siluetas sin caras reales**, anatomía correcta (2 piernas, 2 brazos). Rotular ILUSTRACIÓN / RECREACIÓN / NO A ESCALA.
- **Mismo estilo, tema distinto** al video anterior, y **no repetir el tipo de gancho** del último video publicado.
- **CTA único al final y alternado**: Seguime → Comentá «palabra» → (Mandame VIDEO si el objetivo es clientes).
- **Comparaciones en vertical** (9:16): barras y líneas de tiempo de arriba hacia abajo.
- **Original**: de las referencias se toman principios, nunca frases, personajes ni escenas.
- **Sin «Tenés dos segundos» por defecto** (corrección del usuario, 2026-11-01, video del huevo): la pregunta va sola,
  con pantalla dividida y un «VS» en el centro. El reto con reloj solo si el usuario lo pide.

## Pipeline (en orden; cada paso deja un archivo)

### 0 · Arranque
`python3 -I produccion/fabrica/nuevo.py <slug> "<idea tal cual la escribió el usuario>"` → crea `produccion/<slug>/` con
todas las plantillas y una fila en `produccion/fabrica/historial.csv`. Si falta algo que cambia el video (objetivo,
público, CTA), preguntá **máximo 3 cosas juntas** con AskUserQuestion; si no, decidí con los valores por defecto
(objetivo: vistas y seguidores · público general · CTA que toca en la rotación).

### 1 · Investigación → `investigacion.md`
1. **Verificar** el dato con WebSearch (`standard`; `extended` si es de nicho o reciente). Tabla: afirmación · fuente 1 ·
   fuente 2 · veredicto · matiz. Si es falso o no se puede verificar: **NO** (proponé el dato correcto o 2 alternativas).
2. **¿Ya se publicó?** Buscá en español e inglés, mandá varias búsquedas en el mismo turno:
   `"<frase clave>" shorts`, `"<frase clave>" tiktok`, `"<dato en inglés>" youtube shorts views`,
   `"<dato>" reels`, `<dato> viral`. Anotá cada versión encontrada: plataforma · título · enlace · vistas · fecha ·
   de dónde sale la cifra (oficial / página espejo / medio) · confianza.
   - WebFetch está bloqueado para muchos dominios en esta sesión: usá lo que muestran los resultados de búsqueda.
   - Opcional: `mcp__Higgsfield__video_analysis_create` con un `youtube_url` de la versión más vista para tener su
     análisis escena por escena (qué gancho usó, ritmo).
3. **Vistas medias**: mediana y rango de las cifras encontradas, con confianza **alta** (≥ 3 cifras oficiales),
   **media** (cifras mixtas) o **baja** (1 cifra o solo espejos). Decilo así, sin redondear para arriba.
4. **Saturación**: fresco (0–2 versiones) · visto (3–10) · saturado (muchas, incluso medios). Saturado no es malo:
   la demanda está probada; obliga a un **ángulo nuevo** (otro gancho, un giro extra, conectar con el espectador).
5. **Decisión**: SÍ · SÍ con ángulo nuevo · NO. Con 2–3 líneas de por qué.

### 2 · Ganchos → `ganchos.md` y `ganchos.txt` (3 líneas = 3 variantes)
1. Escribí **8–10 candidatos** usando el catálogo de tipos (abajo) y la escalera de `formula-viral` (específico,
   ≤ 3,5 s de voz, una pregunta que el espectador no puede responder solo).
2. Puntuá cada uno con la **rúbrica** (0–2 cada criterio, máx. 12): fotograma 0 raro y en movimiento · pregunta abierta
   que no se responde sola · específico (escalera) · se entiende sin sonido · no revela la respuesta antes de ~10 s ·
   novedad contra el último video (tipo de gancho distinto).
3. Pasan **3 finalistas** de tipos distintos → `ganchos.txt` (uno por línea, como se van a decir).
4. Validación (paso 5) con las aperturas renderizadas.

**Catálogo de tipos (con lo que dio en esta cuenta):**
| Tipo | Ejemplo | Resultado |
|---|---|---|
| Cifra/precio en el cuadro 0 + «¿Por qué?» | «Esta servilleta se vendió por casi un millón de dólares. ¿Por qué?» | Servilleta V1: 5/5 pasan 3 s; elegido por el usuario |
| Reto en tiempo real (2 s con reloj) | «¿…más cerca de las pirámides o de la Luna? Tenés dos segundos.» | Cleopatra: ganador; dato real de la cuenta: 73 % a los 3 s (`metricas.md`). **El usuario pidió sacarlo en el huevo: no usar por defecto** |
| Pregunta + pantalla dividida «VS» | «¿Qué vino primero: el huevo o la gallina?» | Huevo: elegido (versión del usuario, sin reloj) |
| Absurdo cotidiano | «En Venus cumplirías años antes de que termine el día.» | Venus: ganador (5/5 a 3 s, 4/5 al final) |
| Mito + sello | «¿Cleopatra vio construir las pirámides? Ni cerca.» | Cleopatra: 2.º |
| Pantalla dividida A vs B | desierto / espacio en el mismo cuadro | gran fotograma 0; combina con el reto |
| «Más cerca de vos» | «Cleopatra está más cerca de vos que de las pirámides.» | 4/5; mejor como giro final que como gancho |
| Nicho (negocios) | «Si tenés un negocio y…» | filtra: 3/5 a 3 s; solo si el objetivo es clientes |
| Afirmación directa | «En Venus un día dura más que un año.» | revela la respuesta: 4/5, poco final |

### 3 · Guion → `guion.md` y `cuerpo.txt`
Estructura del **dato curioso** (25–33 s en total, 65–85 palabras en el cuerpo):
| Tramo | Función | Ejemplo (Venus) |
|---|---|---|
| Gancho (≤ 3,5 s) | variante 1/2/3 | «En Venus cumplirías años… antes de que termine el día.» |
| Dato 1 + cifra | lo que lo explica, con número | «Venus tarda 243 días en dar una vuelta sobre sí misma.» |
| Contraste | el otro número | «Pero da la vuelta al Sol en 225.» |
| Respuesta (~10–14 s) | cierra el bucle del gancho | «O sea: su día dura más que su año.» |
| Escalón 1 | algo más raro | «Y gira al revés: allá el Sol sale por el oeste.» |
| Escalón 2 | lo más fuerte | «Encima… es el planeta más caliente: más de 450 grados. Alcanza para derretir plomo.» |
| Giro opcional | toca al espectador | «Cleopatra vivió más cerca de este video que de las pirámides.» |
| CTA | uno, alternado | «Comentá «Venus» si no lo sabías.» |
- Frases de 4–9 palabras; conectores que empujan: «Pero», «O sea», «Y», «Encima»; nada de relleno.
- **Números en palabras** para la voz («doscientos cuarenta y tres»); `config.json` → `numeros` los pasa a cifras.
- Cada sustantivo importante tiene una imagen en el mismo instante (lo planificás en `guion.md`: columna «qué se ve»).

### 4 · Voz y música
- **ElevenLabs** (ToolSearch → `mcp__ElevenLabs__creative_generate_speech`): voz **«Tony»** `851ejYcv2BoNPjrkw93G`
  (la elige el usuario el 2026-11-02: «expresiva, rápida y espontánea»; en el buscador figura como «Tony Your Casual
  Voice»; antes era Rodrigo Zabú `1p905cdbJ1e1JQxhFTGJ`), modelo `eleven_v4`, flow `z1ZelNAoO6lYeCynWizl`. **2 llamadas**: los 3 ganchos (separados por línea en blanco) y el
  cuerpo. Cada llamada da 2 tomas (≈ 250–550 créditos cada una). Esperá con `creative_get_flow_run_status`, bajá la
  toma «a» con curl a `produccion/<slug>/ganchos_a.mp3` y `cuerpo_a.mp3`. No repitas llamadas para «reintentar».
- Alineación y armado:
  ```
  python3 -I produccion/fabrica/alinear_dp.py produccion/<slug>/ganchos_a.mp3 produccion/<slug>/ganchos.txt produccion/<slug>/words_ganchos_a.json
  python3 -I produccion/fabrica/alinear_dp.py produccion/<slug>/cuerpo_a.mp3 produccion/<slug>/cuerpo.txt produccion/<slug>/words_cuerpo_a.json
  python3 -I produccion/fabrica/armar.py <slug>          # voz_<slug>_<v>.wav + captions-<slug>-<v>.json
  for v in 1 2 3; do python3 -I produccion/fabrica/musica.py <slug> $v; done
  ```
  Si el error de alineación pasa de ~1,5, revisá que `ganchos.txt`/`cuerpo.txt` digan exactamente lo mismo que el audio.
- `config.json`: `tempo` (1,08 por defecto), `reloj` (variante con reto y segundos), `numeros`, `quitar_final`
  (`{"1": 3}` = sacar las últimas 3 palabras del gancho 1 sin regenerar la voz), y `musica.secciones`
  ancladas a palabras (modos: misterio, groove, tension, pesado, espacial, brillo, cierre; escalas: menor, mayor,
  lidio, dorico, frigio_dom). La música acompaña la historia: misterio en el gancho, groove en la explicación,
  tensión antes del dato más fuerte, golpe/pesado en el dato fuerte, cierre en el CTA. Sin riser de ruido.

### 5 · Animación (motor `src/Fabrica/`) y validación de ganchos
1. Escribí `src/Fabrica/videos/<slug>.tsx` copiando la forma de `videos/venusf.tsx`: `captions` de las 3 variantes,
   `colores` (familias de palabras clave), `gancho` (una escena por variante, `c.v`), `escenas` (una por frase, ancladas
   a palabras con `c.w("palabra", c.i("anterior"))`), `impactos`, `pops`, `sfx`, `portada`. Agregalo a
   `src/Fabrica/registro.ts`. El motor pone cámara, transiciones, subtítulos, voz, música, barridos y CTA sin subtítulos.
2. Piezas listas en `src/Fabrica/kit.tsx`: Reto, Barras, Estampa, Dividida, CTASeguir, CTAComentar, PortadaTexto,
   PriceCard, Pill, BigName, Sparks, Coins, Dust, Bokeh, Stars, Studio, DarkPhone, Tap, Auction, Planeta, Sun,
   Surface, Thermo, Ingot, Cake, Snail, Space, Pyramid, Desert, CleoBust, CaesarBust, Rocket, MoonScene, NearFar,
   Shop, Hero. Si el tema pide algo nuevo (un animal, un objeto), dibujalo como componente SVG plano en el archivo del
   video y, si sirve para otros, pasalo al kit.
3. `npx tsc --noEmit -p .` y `bash produccion/fabrica/aperturas.sh <slug> 3` → `out/<slug>/aperturas.png`.
4. **Validación de los 3 ganchos** (en `ganchos.md`):
   - Panel simulado de 5 (Laura interesada, Martín apurado, Sofía escéptica, Diego 19 fuera del público, Carmen sin
     sonido): segundo en que se va cada uno, pasan 3 s, llegan al final, comparten/guardan. Siempre rotulado
     «simulación orientativa».
   - **Predictor externo** (gasta créditos de Higgsfield; usalo si el usuario lo aprobó para este video): subí cada
     apertura con `mcp__Higgsfield__media_upload` → PUT con curl → `media_confirm` → `virality_predictor` (action
     create, model virality_predictor). Anotá fuerza del gancho y riesgo de retención de cada una.
   - Datos propios: `metricas.md` y `produccion/fabrica/historial.csv` (qué tipo de gancho rindió de verdad).
   - Gana el que mejor pasa los 3 s **y** llega al final, sin repetir el tipo del último video. El 2.º queda guardado.

### 6 · Render, control y entrega
```
npx remotion render Fabrica-<slug>-<v> out/<slug>/<slug>_raw.mp4 --concurrency=4 --crf=18
bash produccion/fabrica/master.sh out/<slug>/<slug>_raw.mp4 out/<slug>/<slug>.mp4      # −14 LUFS, AAC 192k
python3 -I produccion/fabrica/qa.py out/<slug>/<slug>.mp4                              # tiene que decir PASA
npx remotion still Fabrica-<slug>-portada-<v> out/<slug>/portada.png
```
- Mirá `out/<slug>/<slug>.cuadro0.png` (texto y lo raro visibles en el cuadro 0) y `<slug>.hoja.png` (nada tapado por la
  interfaz: subtítulos arriba 270–470 px, nada importante por debajo de 1.650 px ni pegado al borde derecho).
- Completá `entrega.md` (plantilla) y la fila de `historial.csv`. Commit + push a la rama de trabajo.
- Mandá `out/<slug>/<slug>.mp4` y la portada con SendUserFile. En el mensaje: el dato y sus fuentes, si ya se publicó
  y las vistas medias (con confianza), los 3 ganchos y por qué ganó uno, descripción lista para pegar (3–5 hashtags),
  lo que hay que verificar, el QA y los créditos gastados.

### 7 · Aprendizaje (después de publicar)
- A las 48 h, pedí las métricas (o leelas con Windsor.ai si está conectado: TikTok/Instagram orgánico) y completá
  `historial.csv`: vistas, retención a 3 s, comentarios, seguidores. Ajustá el catálogo de ganchos de arriba con
  datos reales (los del panel son orientativos) y anotá la lección en `notas-experimentales.md`.

## Tiempos y costos de referencia
Voz ≈ 1.200–1.900 créditos de ElevenLabs por video (2 llamadas × 2 tomas). Render de 3 aperturas ≈ 3 min, render
final ≈ 4 min, QA + master ≈ 1 min. Predictor de Higgsfield: créditos aparte (consultá `mcp__Higgsfield__balance`).
