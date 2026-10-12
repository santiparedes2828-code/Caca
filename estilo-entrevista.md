# estilo-entrevista.md — Guía de estilo de edición (entrevista / talking head)

Fuente: `analisis2/referencia.mp4` (29,12 s · 1024x576 · 30 fps · AAC 44,1 kHz estéreo).
Es un **portafolio**: 3 vídeos verticales de entrevista en paralelo (paneles de ~290x515 px con esquinas redondeadas) y la cortinilla de TikTok de 25,0 s a 29,1 s, que no forma parte del estilo.
Análisis: 58 fotogramas a 2 fps + cortes de plano + audio. Medidas convertidas a **1080x1920** (×3,72 respecto a un panel).
Textos originales en árabe con palabras clave en inglés. Lo no medible va marcado con **[SUPOSICIÓN]**.

## 1. Estructura y ritmo
- Plano único de entrevista (persona sentada o de pie, plano medio) durante todo el vídeo; **no hay cortes duros** dentro de cada panel (único corte detectado: 25,03 s, la cortinilla).
- El ritmo lo dan los **cambios de encuadre** (punch-in) y los **gráficos encima**: algo cambia en pantalla cada **1,0–1,5 s**.
- Cada frase = un bloque de subtítulo nuevo; cada concepto técnico = una palabra clave con caja o un objeto recortado.

## 2. Subtítulos
| Rol | Fuente (pedida por el usuario) | Tamaño (1080) | Color |
|---|---|---|---|
| Texto principal | **Inter Bold (700)** | **74–90 px** | Blanco #FFFFFF, sombra `0 4px 14px rgba(0,0,0,0.55)` |
| Palabra clave | **Garamond Italic** → *EB Garamond Italic 500* (Apple Garamond es propietaria) [SUPOSICIÓN: equivalente] | **96–120 px** | Ver variantes |

- **Posición:** en el pecho/al lado de la cabeza, **y = 48–58 %** del alto (≈ 920–1110 px). Centrado horizontal en nuestro encuadre.
- **Palabras por línea:** 1–3; **líneas por bloque:** 1–3, apiladas. Interlineado 1,05.
- **Animación:** palabra a palabra al sonar; cada palabra sube 14 px → 0, opacidad 0 → 1, desenfoque 6 px → 0 en **5 frames**. El bloque entero se sustituye por el siguiente (sin salida animada).
- **Palabra clave — 3 variantes:**
  1. **Caja dorada:** fondo #B67928, texto blanco en serif itálica ("Vitamin C").
  2. **Caja blanca:** fondo #F4F2EC, texto verde #0E3C32 en serif itálica ("Elastin"), con un cuadrado verde pequeño debajo.
  3. **Serif sola, grande** sobre fondo de color (tarjetas a pantalla completa).
  La caja crece de izquierda a derecha en **6 frames**.

## 3. Textos extra
- Etiqueta de objeto: texto pequeño (**40 px**, Inter) con línea fina horizontal de **3 px × 120 px** apuntando al objeto ("— واقي الشمس").
- Números grandes de lista ("1", "2", "4") en serif **260 px** blanco con desenfoque de movimiento al entrar.

## 4. B-roll / gráficos
- **Objetos recortados** (producto, cubitos de hielo, dientes, sección de muela, jeringa) sobre la persona, ocupando **35–50 % del ancho**, en un lateral o abajo, con sombra suave `0 20px 40px rgba(0,0,0,0.35)`.
- **Círculo de detalle:** imagen en círculo de **~45 % del ancho** arriba (aguja en la piel).
- **Layout dividido:** la persona dentro de un marco redondeado (radio 40 px, **78 % del ancho**, mitad superior) sobre una tarjeta de color liso, y el texto grande debajo.
- **Tarjeta a pantalla completa** de color liso con texto centrado.

## 5. Transiciones
- Entre layouts: **zoom/escala rápida en 6–8 frames** (el marco crece o encoge) [SUPOSICIÓN].
- Los objetos entran con **escala 0,6 → 1 + rotación 8° → 0** en ~8 frames (spring) y salen con corte seco.

## 6. Zooms
- **Punch-in** al empezar frase: escala **1,00 ↔ 1,12–1,18** alternando, transición de **4 frames** (casi corte).
- Durante la frase, deriva lenta +2 % de escala.

## 7. Color
- Cada vídeo tiene **una gradación dominante**: dorado cálido (fondos ≈ #C68F41), verde azulado (≈ #B6D4CB) o desaturado gris con piel natural.
- Tarjetas de color: verde oscuro **#0E3C32**; acento dorado **#B67928**.
- Viñeta suave (bordes −20 %).

## 8. Sonido
- Voz continua, master alto: **−13,1 LUFS**, picos a 0 dBFS.
- Música de fondo baja por debajo de la voz [SUPOSICIÓN].
- *Pop/whoosh* suave al entrar cada objeto [SUPOSICIÓN].

---

## Correcciones aprendidas

_(Aquí se añaden las correcciones que el usuario apruebe. Prevalecen sobre todo lo anterior.)_

1. **Sin marca de agua** (heredada de `estilo.md`, 2026-10-12).
2. **Subtítulos con Inter Bold + Garamond Italic** (petición del usuario, 2026-10-12, clip "Monster").
3. **Los productos y objetos del b-roll deben verse reales**: foto realista recortada (sin fondo, con sombra), nunca un dibujo o icono. Si no hay foto disponible, se genera con IA en estilo foto de estudio y se recorta (2026-10-12, clip "Monster").
