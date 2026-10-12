# estilo-animaciones.md — Animaciones de motion graphics («5 instrucciones»)

> **Regla de la casa (ver `CLAUDE.md`):** todo el texto en **Inter** (preferiblemente Bold) y emojis estilo iOS con el set con
> licencia más parecido (Fluent Emoji en color). La referencia usa una serif itálica para los números y una manuscrita
> para las anotaciones: aquí pasan a **Inter ExtraBold** y **Inter Medium**. Tampoco se usa el logotipo de Claude: la
> tarjeta de instrucciones lleva un destello dibujado con código y el nombre que diga el guion.

Fuente: `analisis4/referencia.mp4` (70,2 s · 576x1024 · 30 fps · AAC estéreo). TikTok de un tercero (@samunoz.ia):
**solo para estudio local, nunca a Git ni a proveedores externos** (la carpeta `analisis4/` está en `.gitignore`).
Análisis: 140 fotogramas a 2 fps, cortes `scene > 0.25`, envolvente de audio y tiras densas a 15–30 fps de cada animación
(`analisis4/medidas/`). Medidas convertidas a **1080x1920** (×1,875). Lo no medible va marcado con **[SUPOSICIÓN]**.

**Objetivo:** no copiar el vídeo, sino llevar a la base (`AutopilotTheme`) las cinco técnicas que enseña para que los
motion graphics «no parezcan PowerPoint», más las piezas que las acompañan.

## 1. Estructura y ritmo de cortes

| Tramo | Tiempo (s) | Función | Contenido |
|---|---|---|---|
| Gancho | 0–4,5 | Pregunta | Persona a cámara, título grande con contorno y pegatinas |
| Instrucción 1 | 4,5–12,5 | Técnica | Cabecera «1 · Máscara de texto» → tarjeta que escribe la instrucción → demostración → antes/después |
| Instrucción 2 | 12,5–20 | Técnica | «2 · Movimientos encadenados» → bloques que entran y se empujan → acción |
| Instrucción 3 | 20–32 | Técnica | «3 · Una cámara que sigue» → visor «REC · SIGUE LA MANO» y anillo que sigue la cara |
| Instrucción 4 | 32–45,4 | Técnica | «4 · Un objeto que se transforma» → la tarjeta crece y se convierte en la ventana del editor → el vídeo de dentro crece a pantalla completa |
| Instrucción 5 | 45,4–58 | Técnica | «5 · Sincronía con tu voz» → onda de la voz con cabezal; cada cosa entra al nombrarla (cifra, carro, botón, destello) |
| Cierre | 58–66,2 | CTA | «GUARDA» + 5 chips de repaso + «Sígueme» |

- Cada instrucción sigue la misma fórmula: **número + etiqueta → la instrucción se escribe en una tarjeta → demostración**.
- Algo cambia cada **0,3–0,6 s** (palabra, bloque, golpe). Cortes duros solo al pasar de cámara a gráficos.

## 2. Texto

| Rol | Referencia | Aquí (Inter) | Tamaño (1080) | Color |
|---|---|---|---|---|
| Contador «INSTRUCCIÓN 1 DE 5» | Sans Bold, versalitas, tracking ≈ 0,2em | Inter Bold, MAYÚSCULAS, tracking 0,22em | **26 px**, y ≈ 304 | #6F665B (tinta al 55 %) |
| Número de la instrucción | Serif itálica | **Inter ExtraBold** | **≈ 330 px** de alto (x 75–255) | #1A1712 |
| Etiqueta del número | Sans Black en caja naranja, giro −1,5° | Inter ExtraBold | **49 px**; caja 588x122 | texto #1A1712 sobre **#E79747** |
| Texto de la tarjeta | Sans Semibold | Inter Bold | **52 px**, interlineado 1,3 | #1A1712; palabra clave con marcador naranja al 35 % |
| Anotaciones («este es el borde») | Manuscrita itálica | Inter Medium | 36–40 px | **#A87237** |
| Subtítulos | Sans Black, palabra activa en caja naranja | (los de la base) | — | caja #E2974D |

**Máscara de texto** (instrucción 1, medida a 30 fps):
1. Una regla fina naranja (**4–5 px**, #E79747 al 85 %) se dibuja de izquierda a derecha en **6 frames** (ease-out) justo
   antes de su línea. Ocupa el ancho final de la línea.
2. Cada palabra **sube desde detrás de la regla** (el borde de la máscara) en **5–6 frames** (ease-out, sin rebote) en el
   momento en que se dice. Antes no se ve nada: no hay fundido.
3. La regla se queda (como un cuaderno). Palabras de la misma línea separadas por su tiempo de voz (≈ 3 frames mín.).

## 3. Piezas en pantalla

- **Contador + puntos de progreso**: 5 puntos de **17 px** (borde 2,5 px); hechos = tinta, actual = naranja, por hacer = vacíos.
- **Tarjeta de instrucciones**: 990x553 en el original (aquí cabe en el ancho útil de 820 px), radio **26 px**, fondo
  **#F7F2E6**, sombra suave. Cabecera con destello + nombre (34 px). Marcador de posición «Escribe…» al 35 %.
  Escribe a **≈ 16 caracteres/s** (0,53 por frame) con cursor naranja de 4 px. Botón de enviar naranja de **79 px** que
  pasa a **tinta** al enviar; después el borde de la tarjeta se ilumina en naranja.
- **Cifra con odómetro**: los dígitos ruedan dentro de una máscara y se asientan en **14–16 frames**, primero los de la
  izquierda («1,0» antes que «00»).

## 4. Gráficos

- Formas planas: cuadrados de radio 18 % (bloque «Aa» naranja, bloque tinta con punto verde salvia), píldora con borde de
  tinta de 5 px («Publicar»), círculo verde salvia **#8DA387** con check blanco.
- Iconos planos de color (el carro) que entran al nombrarlos, con líneas de velocidad.
- Nada de fotos genéricas: todo son formas hechas con código o capturas propias.

## 5. Transiciones

- **Movimientos encadenados** (instrucción 2): el primer bloque **entra** desde la izquierda (8 frames, ease-out), espera, y
  **acelera** contra el siguiente (5 frames, ease-in). Al tocarse: chispas en el punto de contacto, el que empuja rebota
  un poco hacia atrás y el empujado sale con la velocidad (8–12 frames, frenando). El último **provoca una acción**: se
  rellena de naranja, salta (1 → 1,12 → 1) y aparece encima un círculo con check y 8 chispas en anillo.
- **Objeto que se transforma** (instrucción 4): lo demás se desvanece (4 frames) y la tarjeta crece y se mueve hasta ser
  la ventana de la escena siguiente (**≈ 12 frames**, ease-in-out); el contenido cambia dentro mientras crece; luego
  entran los elementos de la nueva escena escalonados (14 frames) y el vídeo de dentro crece a pantalla completa.
- Entre cámara y gráficos: corte duro.

## 6. Cámara

- **Cámara que sigue** (instrucción 3): el encuadre acompaña al elemento importante (la mano, la cara) con un visor
  «REC · SIGUE LA MANO», esquinas que lo enmarcan y un anillo naranja de **≈ 240 px** alrededor de la cara en las
  palabras de énfasis.
- En los gráficos la cámara está quieta salvo el golpe del empujón. [SUPOSICIÓN: no hay zoom continuo medible.]

## 7. Color

| Token | Hex | Uso |
|---|---|---|
| Fondo | **#E8DFD0** → **#E4DBCC** (abajo) | Crema cálido con viñeta suave |
| Tarjeta | **#F7F2E6** / píldoras **#F8F2E9** | Tarjetas, ventana del editor |
| Tinta | **#1A1712** (texto #13110D, bloques #27251F) | Texto, bloques, botón enviado |
| Acento | **#E79747** | Cajas, reglas, cursor, botón, palabra activa |
| Acento 2 | **#8DA387** (verde salvia) | Check de «acción», detalles |
| Anotación | **#A87237** | Etiquetas pequeñas |

## 8. Sonido

- Voz continua; loudness integrada **−17,5 LUFS**, pico **0,0 dBFS** (sin limitar). Silencios > 0,25 s solo en 36,0,
  49,9 y 60,1 s (≈ 0,3 s cada uno).
- [SUPOSICIÓN] Hay música de fondo muy baja y golpes suaves en los empujones y al enviar; no se pueden aislar.
- Para nuestros vídeos: los efectos propios (`--efectos`): golpe en cada empujón, pop en la acción, clic al enviar y
  tic-tac del odómetro.

## 9. En la base (cómo usarlo)

| Técnica | En el código | Cómo se pide |
|---|---|---|
| Máscara de texto | `reveal: "mascara"` del tema (`ThemedHeadline`) | `--animaciones mascara` o tema `editorial` |
| Movimientos encadenados | escena `[cadena: A \| B \| C]` (`ChainRow`) | en el guion |
| Cámara que sigue | `camera: "sigue"` (la cámara acompaña la palabra que suena, el bloque que empujan o la tarjeta que entra) | `--animaciones camara` |
| Objeto que se transforma | `sceneTransition: "transforma"` (el icono de la escena crece hasta ser la pantalla y se recoge en el de la siguiente) | `--animaciones transforma` |
| Sincronía con la voz | iconos, tarjetas de lista, cifras, CTA y empujones entran en la palabra en que se nombran (`cues`) | siempre |
| Odómetro | `counter: "odometro"` (`Odometer`) | `--animaciones odometro` |
| Número + etiqueta | escena `[paso: Título]` (numeración automática «PASO 1 DE 5») | en el guion |
| Tarjeta que escribe | escena `[prompt: texto con *clave* \| Nombre]` | en el guion |

---

## Correcciones aprendidas

_(Aquí se añaden las correcciones que el usuario apruebe. Prevalecen sobre todo lo anterior.)_
