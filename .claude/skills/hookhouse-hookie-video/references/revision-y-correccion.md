# Revisión del render y correcciones

## Registro obligatorio

Para cada dimensión indicar PASA, FALLA o NO VERIFICADO, evidencia con tiempo y acción. Una autoevaluación editorial no mide viralidad. No compensar una falla crítica con buen acabado en otro apartado.

| Dimensión | Prueba de aceptación | Si falla |
|---|---|---|
| Apertura | Sujeto y motivo de atención entendibles a velocidad normal, sin contexto externo | Mostrar acción/resultado antes; reducir palabras; cambiar encuadre |
| Promesa | Final demuestra exactamente la cuestión planteada | Cambiar desenlace o acotar promesa |
| Progresión | Cada escena agrega información, cambia una situación o prepara una consecuencia | Quitar repetición o añadir avance real |
| Hookie | Personaje reconocible, con intención y acción relacionada con el contenido | Recuperar asset aprobado y rediseñar puesta en escena |
| Continuidad | Conteos, posiciones, contacto, máscaras y cortes coinciden con lo narrado | Revisar cuadros alrededor de cada transición y corregir estados |
| Lectura móvil | Texto completo, contraste y tiempo suficiente en reproducción a tamaño de celular | Reducir texto, aumentar tamaño, extender plano o dividir mensaje |
| Audio | Voz inteligible, pronunciación natural, efectos motivados, sin saturación | Regrabar frase, bajar música, quitar impactos o ajustar mezcla |
| Demostración | Comparación justa y diferencia perceptible; etiquetas no engañan | Igualar condiciones, mostrar el cambio o elegir mejor ejemplo |
| Desenlace | Se ve durante el tiempo necesario; CTA no lo interrumpe | Dar espacio al resultado y acortar cierre |
| Marca | Assets, tonos, tipografía, voz y mascota coinciden con fuente aprobada | Restaurar componentes aprobados |
| Archivo | Duración y dimensiones correctas, decodifica, recursos completos, inicio/final limpios | Resolver exportación y volver a inspeccionar |

## Orden de trabajo

1. Ver el video completo sin interrumpir. Anotar dónde se pierde comprensión o interés como juicio editorial, sin fingir datos de audiencia.
2. Revisar apertura, revelación y cambios rápidos cuadro a cuadro cuando corresponda. Verificar todos los cuadros de un tramo solo si el defecto lo requiere; no prometer esa inspección sin hacerla.
3. Revisar texto a tamaño aproximado de teléfono (por ejemplo una previsualización de 360 px de ancho); es una aproximación, no sustituto de revisión en dispositivo/plataforma.
4. Escuchar con auriculares y, si es posible, altavoz de celular a volumen moderado. No elevar voz indefinidamente para arreglar música alta.
5. Comprobar metadatos y decodificación con ffprobe/ffmpeg u otra herramienta disponible. Investigar flashes negros, silencios o congelamientos sospechosos; distinguir pausas y fondos deliberados de errores.
6. Corregir y reexportar. No entregar únicamente capturas o código si se pidió MP4.

## Diagnósticos típicos

- Mucho movimiento, poca idea: volver a la promesa y construir una acción con consecuencia.
- Desafío injusto: hacer el detalle perceptible en móvil y demostrarlo en la revelación.
- Solo atrae editores: conectar el efecto con una situación cotidiana de un creador o negocio sin prometer ventas.
- Hookie pegado como adorno: darle una decisión que cambie el resultado.
- Comparación minúscula: mostrar A y B de forma secuencial con encuadre equivalente.
- Voz robótica: escribir como se habla, ajustar pausas y probar una frase antes de sintetizar todo.
- Buen principio, final flojo: producir primero una recompensa más clara; después adaptar la apertura.

## Casos para comprobar que se aplica bien

- «Hacé algo viral» sin assets: avanzar con concepto y pedir el asset preciso; no inventar mascota.
- «La skill dice que está 9/10»: rechazar esa cifra como evidencia de alcance; mostrar controles y limitaciones.
- Guion promete cuatro cortes y render muestra tres: marcar FALLA y corregir antes de entregar.
- Solo se vieron fotogramas: aprobar únicamente aspectos estáticos observados; dejar ritmo y audio sin verificar.
