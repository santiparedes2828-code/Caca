# estilo-hablado.md — Edición de vídeos hablados a cámara (TikTok, Reels, Shorts)

> **Regla de la casa (ver `CLAUDE.md`):** todo el texto en **Inter** (Bold por defecto; Medium y ExtraBold
> permitidos) y emojis estilo iOS con el set con licencia más parecido (Fluent Emoji en color). Las referencias usan
> serif, manuscritas y cursivas: aquí se traducen a contrastes de peso y tamaño de Inter.
> **Correcciones aprendidas** (al final) prevalecen. Las animaciones se usan para dar ritmo, **nunca todas juntas**
> (corrección del 12-10-2026 en `estilo-animaciones.md`).

Fuentes (vídeos de terceros, **solo estudio local** en `analisis5/`, ignorado por Git; nunca a proveedores externos):

| | Referencia 1 | Referencia 2 |
|---|---|---|
| Qué es | Comparativa «Raw / Edited» de un editor (@andre.visualz) sobre un clip de entrevista | Recorrido inmobiliario hablado a cámara (@raw.to.reel) |
| Archivo | `analisis5/ref1.mp4` · 26,0 s · 576x1024 · 30 fps | `analisis5/ref2.mp4` · 55,0 s · 576x1024 · 30 fps |
| Cortes | 1 duro (21,97 s: cierre) | 23 en 55 s → **un plano cada 2,4 s** (0,4–7 s) |

Medidas convertidas a **1080x1920**. Lo no medible va marcado con **[SUPOSICIÓN]**.

## 1. Ritmo

- Ref. 2: plano nuevo cada **0,4–2,5 s** en la parte de B-roll y **3–7 s** cuando habla a cámara; entre medias,
  barridos con desenfoque de movimiento (6–8 frames) y planos inclinados. Algo cambia **cada 0,5–1 s** (palabra,
  plano, gráfico).
- Ref. 1: el plano del hablante apenas cambia; el ritmo lo ponen los **apoyos** que entran cada **1,5–3 s**
  (mensajes, calendario, notas, reloj, tarjeta de foto, lista con check).
- Silencios: ninguno audible > 0,3 s en las dos (cortes de silencio agresivos). [SUPOSICIÓN: grabación original
  con pausas recortadas.]

## 2. Subtítulos

| | Ref. 1 | Ref. 2 |
|---|---|---|
| Palabras por bloque | 2–5 (frase corta) | **1–3** |
| Posición (centro) | 70–75 % del alto (tercio inferior) | **40–55 %** (a la altura del pecho, junto a la persona) |
| Tamaño (1080) | ≈ 48–56 px (pequeño) | **función 55–65 px · clave 90–110 px** (×1,6) |
| Peso | regular + clave en color | **contraste de peso**: palabras de función finas, clave en negrita pesada |
| Color | blanco; clave en **verde #4CD964**, **rojo #FF453A**, **amarillo #FFD60A** según el sentido | blanco con sombra suave; cifra final en **verde agua neón** |
| Entrada | aparición rápida (3–4 frames) | palabra a palabra al sonar, **subiendo y escalando** (5–6 frames) |
| Salida | corte | **desvanecer 3–4 frames** o la siguiente la sustituye |
| Extras | emoji en línea tras la palabra («without alcohol 🍺»), caja de color tras la frase, lista con rombos ◇ | texto **detrás** de la persona en algún plano [SUPOSICIÓN: segmentación], mapa animado al nombrar ciudades |

**Lo que piden aquí** («grandes y fáciles de leer»): bloques de **1–3 palabras**, **Inter Bold 88–96 px**, clave
**×1,3 en color de acento y ExtraBold**, palabra que suena resaltada, entrada «pop» (escala 0,7 → 1 con muelle, subida
14 px, 4–5 frames) y **salida de 4 frames**, contorno/sombra oscura para leer sobre cualquier fondo.

## 3. Apoyos visuales

- Ref. 1: capturas de interfaces (mensajes, calendario, notas), tarjeta de foto, icono de reloj, signos «?»
  dibujados alrededor de la cabeza, lista de beneficios con check. **Cada uno aparece al nombrarlo**.
- Ref. 2: B-roll de la propiedad a pantalla completa con la palabra encima, mapa al nombrar la ciudad, precio en
  grande. Las imágenes son **de la propia propiedad**.
- Para nosotros: solo recursos con licencia (biblioteca del cliente o de Hook House) o gráficos hechos con código
  (emoji con licencia, cifras, títulos). **Nada de imágenes genéricas sin sentido.** En inmobiliaria, las fotos de la
  propiedad las entrega el cliente (licencia `cliente`).

## 4. Zoom y transiciones

- Ref. 2: empujes lentos (1 → 1,05 en 2–3 s), golpes de zoom en las palabras clave (≈ 1,08 en 4 frames) y
  barridos con desenfoque entre planos de B-roll.
- Ref. 1: **zoom alterno en los cortes** (≈ 1,0 ↔ 1,1) para que el salto no se note; viñeta oscura abajo para leer
  el texto.
- Aquí: zoom alterno 1,0 ↔ 1,08 en cada corte (o en cada frase si no hay cortes), deriva lenta +3 % y un golpe
  suave (+4 %) en las palabras clave, como mucho uno cada 2,5 s. Sin barridos ni destellos sobre la persona.

## 5. Formato y zonas seguras

- 9:16, 1080x1920. Texto entre **y = 300 y y = 1450**; margen derecho **≥ 140 px** (botones de TikTok/Reels) y
  izquierdo ≥ 80 px; nada importante en los **470 px de abajo** (descripción del post).

## 6. Color

- Ref. 1: imagen oscurecida con degradado inferior; acentos verde, rojo y amarillo saturados.
- Ref. 2: tonos cálidos naturales, contraste alto; texto blanco.

## 7. Sonido

- Voz al frente, sin música audible en la ref. 1 [SUPOSICIÓN]; música suave en la ref. 2 [SUPOSICIÓN].
- Para nosotros: voz normalizada a −14 LUFS; música solo de la biblioteca con licencia.

## 8. En la base

| Qué | Dónde |
|---|---|
| Subtítulos «impacto» (1–3 palabras, pop, clave grande y en color, salida) | modo de subtítulos `impacto` (`src/autopilot/ImpactCaptions.tsx`, `autopilot/captions/build.ts`) |
| Una clave por frase corta (cifra › concepto › lo último que se dice) y páginas que no acaban en «de/in» ni separan cifra y unidad | `phraseEmphasis` y `phrasing` en `src/autopilot/paginate.ts` |
| Página destacada (gancho y cifras; la cifra rueda) · emoji en línea tras la palabra clave | apoyos del plan (`autopilot/edit/apoyos.ts`) |
| Apoyos a pantalla completa de la ref. 1 (calendario al decir una fecha, lista con checks al enumerar) | `--graficos`: `autopilot/edit/graficos.ts` + `src/autopilot/Graphics.tsx`; editables en el plan |
| Zoom alterno en cortes/frases + golpe en la clave | intensidad `redes` (`src/design/intensity.ts`, `src/autopilot/AutopilotEdit.tsx`) |
| Efectos de sonido en los apoyos (whoosh, golpe, pop, tic), 10–20 dB bajo la voz | `--efectos`: `autopilot/edit/sonido.ts` |
| Cortes de silencio agresivos | perfil del cliente (`editing.minSilenceSec`) |
| B-roll en tarjeta o a pantalla completa; fotos de la propiedad | biblioteca del cliente con licencia; sinónimos inmobiliarios en `autopilot/editorial/library.ts` |
| Transcripción por palabra sin enviar el audio fuera | proveedor `local` (sherpa-onnx + Parakeet TDT 0.6B v3) |

---

## Correcciones aprendidas

_(Aquí se añaden las correcciones que el usuario apruebe. Prevalecen sobre todo lo anterior.)_
