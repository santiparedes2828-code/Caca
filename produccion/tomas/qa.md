# QA · «Cuatro tomas, una frase» — `out/tomas/cuatro_tomas.mp4`
Estado: **listo para probar** (no publicado). 1080×1920, 30 fps, 23,2 s, −14,8 LUFS, pico −2,6 dBFS, sin fotogramas negros.

| Dimensión | Resultado | Evidencia | Acción |
|---|---|---|---|
| Apertura | PASA | f0: claqueta TOMA 1 + «4 TOMAS · ninguna salió bien» + Hookie frente al trípode | — |
| Promesa | PASA | 4 tomas fallidas → frase completa (14,35 s) → desglose 4 trozos / 3 cortes | — |
| Progresión | PASA | Cada toma tiene un error distinto (risa, traba, tos, estornudo que tumba el celular); después la línea saca un trozo de cada una | — |
| Hookie | PASA | Rig aprobado; decide (ve las tomas, lanza la línea), actúa (saca trozos, tensa, junta las filas) y provoca consecuencias | — |
| Continuidad | PASA | El audio de la frase limpia está montado de verdad con un trozo de cada toma (`produccion/tomas/armar_frase.sh`): 4 trozos, 3 uniones = 3 cambios de encuadre | — |
| Lectura móvil | PASA tras arreglo | Subtítulo sobre el cuerpo de Hookie en la versión editada → movido arriba; frase final encima de Hookie → subida; etiquetas TOMA agrandadas | Corregido |
| Audio | PASA parcial | Voces a ≤ 20 ms de lo previsto (correlación); subida bajo la voz al mismo nivel (−12 dB) y sola −18/−24 dB; corte a silencio 14,12–14,33 s (−100 dB). **Escucha humana: NO VERIFICADO** (naturalidad de la frase montada, acento) | Subida reforzada sin tapar la voz |
| Demostración | PASA | Comparación secuencial; ejemplo rotulado como creado en la descripción | — |
| Desenlace | PASA | Frase editada 2,5 s + desglose 3 s; sin CTA que lo interrumpa | — |
| Marca | PASA | Paleta, Inter 800, línea naranja, sonidos propios (la subida está hecha con `tension.wav`) | — |
| Archivo | PASA | ffprobe, blackdetect, hoja de contactos a 2 fps con zona segura | — |
