# estilo-animado.md — «animación» para Hook House (desde 2026-10-31)

> Pedido del usuario: cuando pide un video **animado**, se refiere a este estilo (referencias de reels de datos curiosos:
> rookstudio.mx, unminutodeporques y similares), **no** al sistema ALTERA de papel marfil y **sin Hookie/Gancho** salvo
> que lo pida explícitamente. Primera pieza: `src/Altera/reels/Servilleta.tsx` (3 variantes).

## Cómo se ve
- **Escenas ilustradas a pantalla completa**, una por idea: fondos con degradés (noche violeta/azul, atardecer naranja,
  interiores cálidos), luz (focos, conos, soles, brillos), profundidad por capas (fondo, medio, frente) y viñeta.
- **Personajes planos o siluetas**: formas geométricas simples, sin caras de personas reales (si el dato es de un famoso,
  silueta genérica o personaje plano genérico, nunca su cara).
- **Textura**: grano fino en overlay + bokeh o estrellas que se mueven lento.
- **Subtítulos** arriba, centrados, tipografía redondeada (Poppins 800, ~78 px): las palabras ya dichas en gris
  translúcido y la que suena en **blanco** con brillo; las cifras, cuando suenan, en **pastilla crema** con sombra dura.
- **Pastillas** (crema con texto oscuro y sombra dura hacia abajo) para datos cortos («13 años», «14 dic 2000»).
- **Tarjetas oscuras** con etiqueta en versalitas espaciadas y número grande (contadores de precio, «EN EL PRÓXIMO VIDEO»).
- **Celulares oscuros** (marco grafito, isla, hora) cuando hay que mostrar un video o una app.

## Cómo se mueve (corrección del usuario, 2026-10-31: «que se mueva todo, animaciones y efectos en prácticamente todo»)
- **Cámara viva siempre**: flota (x/y/rotación con senos), empuja en cada escena (hasta +10 %) y **tiembla** en los
  impactos (cifras, sellos, cortes). **Sin zoom en cada palabra** (corrección del usuario, 2026-10-31: se sentía brusco).
- **Colores en las palabras clave** de los subtítulos (pedido del usuario): plata y lo que sí importa en **verde**
  (#4ADE80: «millón», «dólares», «mostrás»…), protagonistas en **dorado** («servilleta», «Messi»), lo negativo en
  **rojo** («nada», «cámara»). Los precios, en verde con brillo verde.
- **Siluetas de personas: revisar la anatomía** (corrección del usuario: el chico parecía tener tres piernas). Una pierna
  por lado; si patea, la pierna gira desde la cadera.
- **Transiciones** entre escenas alternando **barrido** lateral con desenfoque, **zoom** a través y **destello**.
- **Partículas en todas las escenas**: polvo en la luz, bokeh que se desplaza, estrellas que titilan y fugaces,
  chispas en cada aparición, monedas en el precio, rayos que giran, pájaros, pasto que se mueve.
- **Cada objeto tiene su animación**: la luz se balancea, el papel flota en 3D con un reflejo que lo recorre, los
  personajes parpadean y mueven la cabeza, las pastillas se mecen, los nombres entran letra por letra con brillo,
  el botón late y una mano lo toca.
- **Subtítulos** con golpe: cada palabra entra con rebote y giro; la que suena late.
- **Control**: `python3 -I produccion/servilleta/movimiento.py video.mp4` compara cada cuadro con el de 0,3 s después;
  ningún tramo puede quedar por debajo de 1,5 (en «La servilleta» v2 de movimiento: mínimo 3,1, mediana 8,7).
- **Sonido**: barrido en cada transición, pop en cada pastilla, golpe en los impactos, clic en el botón + los sonidos
  de la marca (impacto, tensión, tirón) y música original por secciones.

## Honestidad
- Si se recrea un objeto real (un documento, una servilleta), rotular «RECREACIÓN ILUSTRADA».
- Datos con fuente verificada y cifras exactas; nada inventado.
