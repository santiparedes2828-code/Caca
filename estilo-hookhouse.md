# estilo-hookhouse.md — Estilo principal de la marca **Hook House**

> **Estilo por defecto de la marca.** Todo vídeo nuevo de Hook House usa esta guía salvo que se pida otra.

Fuente del estilo: `analisis3/referencia.mp4` (37,19 s · 576x1024 · 30 fps · AAC estéreo; de 33,2 s en adelante es la cortinilla de TikTok y no cuenta).
Motion graphic **editorial minimalista**: tipografía grande alineada a la izquierda, iconos de línea, etiquetas monoespaciadas y pestañas de progreso.
Medidas convertidas a **1080x1920** (×1,875 respecto al original). Lo no medible va marcado con **[SUPOSICIÓN]**.

## 0. Identidad de marca (pedida por el usuario)

| Token | Valor | Uso |
|---|---|---|
| Fondo | **#F7F7F2** (blanco roto) [SUPOSICIÓN: la referencia usa crema #F1EBE1; se pasa a blanco] | Fondo de todo el vídeo |
| Tinta | **#0B0B0B** | Titulares, iconos, pestaña activa, tarjetas |
| Verde | **#12A150** [SUPOSICIÓN: tono exacto por definir con la marca] | Palabra destacada, cajas de CTA, progreso, playhead |
| Verde oscuro | **#0B5E30** | Bloques secundarios (subtítulos en la línea de tiempo) |
| Gris | **#8A8A84** (texto secundario) · **#DCDCD5** (pestaña completada, relleno) | |
| Titular | **Inter ExtraBold (800)**, tracking **−0,055em**, interlineado **0,95** | |
| Palabra destacada | **Garamond Bold Italic** → *EB Garamond 700 italic* (Apple Garamond es propietaria) en **verde** | 1 palabra o grupo por titular |
| Etiquetas | Monoespaciada **JetBrains Mono 500** [SUPOSICIÓN: equivalente], MAYÚSCULAS, tracking +0,08em | |
| **Voz de marca** | **ElevenLabs · Rodrigo Zabú** (`1p905cdbJ1e1JQxhFTGJ`), español latino, modelo `eleven_v4` | **La misma en todos los vídeos** |
| Logotipo | ~~`h.`~~ → logotipo de texto **hook** (Inter 800) + ***house*** (Garamond Bold Italic verde) + punto verde | Cabecera y cierre [provisional hasta tener el logo real] |

## 1. Estructura y ritmo
- 9 secciones en 31 s → **una sección cada ~3,4 s**; dentro de cada sección **algo cambia cada 0,5–1,0 s** (palabra, fila, contador, pestaña).
- **No hay cortes duros**: cada sección se apaga (texto a gris 30 % en 6 frames) y la siguiente se escribe encima.
- **Fórmula de guion:** condición del público ("Si vendes con video,") → dolor en 2 filas con icono (grabar / editar) → "Así trabajo." → proceso en 3 pasos con pestañas (01)(02)(03) y un gráfico por paso → para quién (lista A/B/C) → prueba ("Este video no tiene ni una toma grabada" + contador 0) → beneficio → CTA "Escríbeme PALABRA por DM" → logo.

## 2. Texto
| Elemento | Tamaño (1080) | Posición |
|---|---|---|
| Titular de sección | **120–150 px** (2 líneas) | Alineado a la izquierda, x = **80 px**; primera línea en y ≈ **440 px** (23 %) |
| Titular con pestañas encima | **105–115 px** | y ≈ **500 px** |
| Fila con icono ("Grabar") | **100 px** + etiqueta mono **26 px** debajo | Icono de **150 px** a la izquierda, x = 80 |
| Lista A/B/C | **95 px**; letra "(A)" mono **24 px** verde a la izquierda | x = 80 / 180 |
| CTA | "Escríbeme" **120 px** centrado; caja con la palabra **150 px** | Centrado, y ≈ 560–900 |
| Cabecera | Logo **36 px** · etiqueta mono **24 px** a la derecha: `(01) EDICIÓN AUTOMÁTICA` (número en verde) | y = **175 px**, márgenes 80 px |

- **Animación de palabra:** entra al sonar con opacidad 0 → 1, color gris → tinta y desenfoque 8 → 0 px en **5 frames**. La palabra destacada además sube 10 px.
- **Escritura a máquina** (texto de cierre de sección, p. ej. "Listo para publicar."): 1 carácter cada **1,5 frames** con cursor `|` parpadeando cada 15 frames.
- **Subrayado dibujado** bajo la palabra clave final (8 px, verde, de izquierda a derecha en 8 frames).
- Apagado de sección: todo a opacidad **0,3** en 6 frames antes del cambio.

## 3. Pestañas de progreso
- 3 píldoras de **292 x 82 px**, radio total, borde **3 px** tinta, texto mono **26 px**: `(01) SUBES` `(02) EDITAMOS` `(03) LISTO`.
- Estados: **activa** = fondo tinta + texto blanco · **completada** = fondo #DCDCD5 + texto gris · **pendiente** = solo borde.
- Posición: y ≈ **370 px**, desde x = 80, separación 20 px. Cambio de estado en **4 frames**.

## 4. Gráficos (línea, planos, sin degradados)
- Trazo **8 px** tinta, esquinas redondeadas **28 px**, rellenos planos tinta / verde / #DCDCD5.
- Repertorio: reloj (agujas girando), cronómetro en caja de color con contador, móvil con punto REC parpadeando, carpeta con contador mono "0/1 CLIPS RECIBIDOS", **línea de tiempo** (pistas GANCHO / VIDEO / SUBS / SONIDO que se rellenan bloque a bloque, playhead verde), **tarjetas cuadradas numeradas** (negras que pasan a verde en orden), insignia con contador ("● EDITORES CONTRATADOS 0").
- Entrada: escala 0,92 → 1 + opacidad, spring sin rebote (damping 200) en ~10 frames.
- Zona: debajo del titular, y = **800–1400 px**; nunca por debajo de 1450 (UI de TikTok).

## 5. Transiciones
- Sin barridos ni zooms de cámara: **cámara fija**.
- Cambio de sección = apagado a gris (6 frames) + nueva sección escribiéndose.
- Cierre: logotipo de texto centrado a **170 px** + etiqueta mono "EDICIÓN DE VIDEO AUTOMATIZADA", durante **1,5 s** ("house" entra a los 4 frames y el punto a los 8).

## 6. Zooms
- Ninguno. El movimiento lo dan las palabras, los contadores y los gráficos.

## 7. Color
- Fondo plano blanco roto, **sin grano, sin viñeta, sin sombras**.
- Solo tinta + verde + grises. El verde aparece **una vez por sección** como máximo (palabra destacada o elemento activo).

## 8. Sonido
- Voz en off continua (pausas de 0,25–0,5 s en la referencia) [SUPOSICIÓN: la referencia lleva voz; no se transcribió].
- *Click* suave en cada cambio de pestaña o fila y *pop* en la caja del CTA [SUPOSICIÓN].
- Master: la referencia está a −17,3 LUFS; para la marca, **−14 LUFS**, picos ≤ −1 dBFS.

---

## Correcciones aprendidas

_(Aquí se añaden las correcciones que el usuario apruebe. Prevalecen sobre todo lo anterior.)_

1. **Sin marca de agua tipo @usuario** (2026-10-12). El logotipo de la cabecera forma parte del diseño de marca. [SUPOSICIÓN: confirmar con el usuario]
2. **Objetos y productos del b-roll, siempre como foto realista recortada**, nunca dibujados (2026-10-12, aprendida en el clip "Monster"; los iconos de línea de esta guía son gráficos de interfaz, no productos).
3. **El logo de Hook House NO es una "h".** Hasta tener el logo real se usa el logotipo de texto hook*house*. (2026-10-12)
4. **Los efectos 3D deben representar el trabajo de edición**, no formas abstractas: línea de tiempo de clips que se cortan sola, onda de audio con cuchilla sobre los silencios, fotos generadas en abanico, edición desmontada en capas (video / b-roll / zoom / subtítulos / sonido). Implementación: `src/Viral/three.tsx`. (2026-10-12, reel "Este video no lo editó nadie")
5. **Una sola voz para todos los vídeos de la marca: Rodrigo Zabú (ElevenLabs, `1p905cdbJ1e1JQxhFTGJ`).** Nada de voces de otros proveedores (la voz "Juan" de Higgsfield se descartó por poco profesional). (2026-10-12)

