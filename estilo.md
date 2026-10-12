# estilo.md — Guía de estilo de edición

Fuente: `analisis/referencia.mp4` (27,97 s · 720x1280 · 30 fps · AAC 44,1 kHz estéreo).
Análisis: 56 fotogramas a 2 fps + detección de cambios de plano (`scene > 0.25`) + envolvente de audio cada 0,25 s.
Las medidas en px están convertidas a nuestro lienzo **1080x1920** (×1,5 respecto al original).
Lo que no se puede medir directamente está marcado con **[SUPOSICIÓN]**.

---

## 1. Estructura y ritmo de cortes

| Tramo | Tiempo | Función | Contenido en la referencia |
|---|---|---|---|
| 1 | 0,0–2,4 s | Gancho de autoridad | Foto recortada B/N + nombre en script + cifra en rojo ("$100 million hook") |
| 2 | 2,4–4,9 s | Contraste | Whip vertical → "is not / **his hook.**" sobre cuadrícula + anzuelo |
| 3 | 4,9–6,1 s | Prueba visual | Collage de pantallazos + "You see the bold text" |
| 4 | 6,1–8,9 s | Contexto | Fondo negro, foco de luz, "the simple set" → "the billion dollar man" + abanico de billetes |
| 5 | 8,9–11,7 s | Tesis | "He uses motion to create **information density**" + gráfica ascendente + puzzle + diamante |
| 6 | 11,7–14,9 s | Explicación 1 | Ojo 3D sobre cuadrícula: "The visual / hits your eye" |
| 7 | 14,9–15,0 s | Explicación 2 | Oreja: "before the word / hits your ear" |
| 8 | 15,0–17,5 s | Reencuadre | Negro puro: "It's not / decoration" → "**It is a pacing tool**" |
| 9 | 17,5–20,6 s | Explicación 3 | Cerebro + flechas dibujadas: "He forces your brain / to process two signals / at once" |
| 10 | 20,6–22,0 s | Objeción | "You don't need / **his budget**" sobre foto con multitud |
| 11 | 22,0–25,7 s | Solución | "You need his / engineering." + corcho con hojas (MARKET RESEARCH, IDEATION, SCRIPTING, VSL, REVENUE) |
| 12 | 25,7–28,0 s | CTA | "DM 'grow' / **for the blueprint**" + iconos de bocadillo |

- **Duración total:** 28 s → objetivo para nuestros vídeos: **25–35 s**.
- **Escenas:** 12 en 28 s → **1 escena cada 2,3 s de media** (mín. 0,9 s, máx. 3,2 s).
- **Cambios de texto dentro de cada escena:** cada **0,5–1,0 s** (nunca hay más de 1 s con la pantalla quieta).
- **Cortes duros detectados:** 4,90 · 6,13 · 8,87 · 11,70 · 14,93 · 17,47 · 20,57 · 24,07 · 25,00 · 25,73 s. El resto de cambios de escena son movimientos de cámara (whip) y no cortes.
- **Fórmula del guion:** autoridad → "X no es Y" → 3 explicaciones (vista / oído / cerebro) → "no es A, es B" → "no necesitas A, necesitas B" → CTA "DM 'palabra' para el recurso".

## 2. Subtítulos / texto cinético

No hay subtítulos clásicos: **todo el texto es tipografía cinética** que repite la locución [SUPOSICIÓN: el texto en pantalla coincide con la voz; no se ha podido transcribir porque Whisper aún no tiene modelo].

**Dos tipografías combinadas en el mismo bloque:**
| Rol | Fuente | Tamaño (1080 de ancho) | Color |
|---|---|---|---|
| Línea de entrada (palabras de relleno: "He forces your brain", "You need his", "It's not") | Script caligráfica inclinada [SUPOSICIÓN: equivalente libre **Great Vibes / Allura**] | **70–90 px** | Negro #111 sobre claro · blanco #F2F2F2 sobre oscuro |
| Línea de impacto (la idea: "to process two signals", "engineering.") | Sans geométrica muy gruesa, "t" con cola curva [SUPOSICIÓN: **Poppins 800**] | **80–110 px**; las de 1–3 palabras hasta **150 px** | Negro #111 / blanco #F2F2F2 |

- **Posición:** centrado horizontal. Vertical: **38–45 % del alto** (y ≈ 730–860 px) cuando hay objeto debajo; **50 %** cuando el fondo está vacío. Margen lateral mínimo **60 px**.
- **Palabras por bloque:** línea script **2–4 palabras**; línea de impacto **2–4 palabras**; máximo **3 líneas** en pantalla.
- **Animación de entrada:** palabra a palabra; cada palabra entra con **desenfoque 12 px → 0 + opacidad 0 → 1 + escala 1,08 → 1** en **6 frames** (0,2 s), con **4–5 frames** de separación entre palabras.
- **Salida:** la escena entera se va con el whip o el corte; no hay animación de salida por palabra.
- **Palabra destacada (1 por bloque):** tres variantes:
  1. **Rojo con resplandor:** #E3121B, `text-shadow 0 0 18px rgba(227,18,27,.8)` (fondos oscuros: "information density", "his budget", "It is a pacing tool").
  2. **Caja roja:** texto negro en cursiva gruesa sobre rectángulo #E3121B que crece de izquierda a derecha en 6 frames ("his hook.").
  3. **Verde en el CTA:** #2E9B2E ("for the blueprint").
- **Marca de agua:** `@usuario` en sans 600 de **30 px**, gris al 25 % de opacidad, centrada, y ≈ **1540 px** (80 % del alto).

## 3. Textos en pantalla además de la tipografía principal

- Bloques de "letra pequeña" decorativa (párrafo de 3–4 líneas, **14–18 px**, gris al 40 %) bajo la línea de impacto o arriba del todo. Funcionan como textura, no se leen.
- Etiquetas de objetos en mayúsculas manuscritas (las hojas del corcho: "MARKET RESEARCH", "SCRIPTING", "VSL").

## 4. B-roll / imágenes

- **100 % metáforas literales** de la palabra clave: anzuelo → "hook", ojo → "visual", oreja → "ear", cerebro → "brain", billetes → "billion dollar", corcho con hojas → "engineering".
- Tratamiento: **recortes en blanco y negro** (sin fondo), alto contraste, sombra suave debajo.
- Tamaño: el objeto ocupa **55–70 % del ancho**, centrado en el **55–65 % del alto** (debajo del texto).
- Fondo detrás del objeto: **cuadrícula fina** (líneas 1–2 px, gris #888 al 50 %, celdas de ~70 px) o papel con puntos.
- Elementos de apoyo: flechas dibujadas a mano negras (stroke 6 px) que apuntan al objeto; líneas curvas que cruzan la pantalla; formas negras grandes desenfocadas en las esquinas (pétalos, triángulos) como primer plano.
- Fotos de persona: B/N, recorte de medio cuerpo, en la mitad inferior; nunca a pantalla completa salvo en el tramo de "objeción".

## 5. Transiciones

- **Whip pan con desenfoque de movimiento** (vertical u horizontal) en **6–8 frames**: la mayoría de cambios de escena.
- **Corte seco a negro** para los reencuadres ("It's not…"): fondo #000 sin transición.
- **Aparición desde desenfoque:** escenas que empiezan con todo desenfocado (blur 20 px → 0 en 10 frames).
- **Aberración cromática** en cada transición: desplazamiento rojo/cian de **4–6 px** en bordes y formas.

## 6. Zooms y movimiento de cámara

- **Push-in constante:** escala **1,00 → 1,08** durante toda la escena (lineal o ease-out). Nunca hay un plano estático.
- **Deriva:** la cámara se mueve 20–40 px en diagonal mientras dura la escena.
- **Objetos 3D/recortes:** rotación lenta (±5°) y flotación vertical (±10 px, ciclo de 2 s).
- **Golpe de zoom** al aparecer la palabra destacada: escala 1,00 → 1,04 en 4 frames [SUPOSICIÓN: se intuye en "his hook." y "information density"].

## 7. Color

- **Desaturado / B/N:** todas las imágenes en escala de grises.
- **Dos fondos alternos:** claro **#E6E6E6 → #CFCFCF** con viñeta radial (bordes 35 % más oscuros) · oscuro **#000–#111** con foco de luz central (cono blanco al 10–15 %).
- **Únicos colores:** rojo **#E3121B** (énfasis), cian **#3FD0C9** (solo como fleco de aberración cromática), verde **#2E9B2E** (solo en el CTA).
- **Grano** fino en toda la imagen [SUPOSICIÓN: ~4 % de ruido].
- Alternancia claro/oscuro cada **1–2 escenas** para dar ritmo.

## 8. Sonido

- **Voz en off continua** de principio a fin; pausas entre frases de **0,25–0,5 s** (caídas a −26/−35 dB en 1,0 · 2,8–3,0 · 4,5 · 7,0 · 8,5 · 11,5–11,75 s).
- Nivel medio **−17 dB**, picos a **0 dB** (master muy comprimido y alto).
- **Música de fondo** suave por debajo de la voz [SUPOSICIÓN].
- **Whoosh en cada whip** e **impacto/"hit"** cuando aparece la palabra destacada [SUPOSICIÓN].
- Primera palabra en el **frame 0**: sin silencio inicial.

---

## Correcciones aprendidas

_(Aquí se añaden las correcciones que el usuario apruebe. Prevalecen sobre todo lo anterior.)_
