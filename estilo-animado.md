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

## Cómo se mueve
- La cámara siempre avanza (empuje lento por escena) y cada escena entra con un fundido corto con escala.
- Cada sustantivo o cifra importante aparece cuando se dice (fórmula viral); nunca queda quieto más de 0,3 s
  (comprobar con `freezedetect=n=-60dB:d=0.3`).
- Sonidos: los propios de Hook House (impacto, tensión, tirón) + música original por secciones.

## Honestidad
- Si se recrea un objeto real (un documento, una servilleta), rotular «RECREACIÓN ILUSTRADA».
- Datos con fuente verificada y cifras exactas; nada inventado.
