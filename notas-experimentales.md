# notas-experimentales.md — hipótesis a probar (no son reglas de marca)

> Todo lo de este archivo es una **hipótesis**. Se mueve a la guía de marca o a las skills solo si los datos de la cuenta (Windsor + conteo manual de DMs) lo confirman y el usuario lo aprueba.

## Tanda 1 (calendario de 30 días, 2026-10-25)

### Video 1 · «Encontrá el error» (producido en `out/error1/`)
- **H1.** Un desafío con una tarea concreta y una revelación en secuencia retiene hasta el segundo 10 mejor que los reels explicativos anteriores. Referencia propia (pocos videos): Tres 44 % a 10 s, Cortes 32 %, Piedra 28 %.
- **H2 (A/B de gancho).** Se compara el gancho A «Este video tiene un error. Uno solo.» + «HAY 1 ERROR» con el B «¿Qué está mal acá? Tenés nueve segundos.» + «¿QUÉ ESTÁ MAL?». Ambas versiones son idénticas desde los 3,4 s. Métrica: retención a 1, 3 y 5 s. Para que la comparación sea limpia hay que subir cada versión en una cuenta o ventana distinta, o a la misma hora en días distintos; con una sola cuenta el resultado es orientativo, no concluyente.
- **H3.** El cambio de 3 a 4 cajas es detectable en celular sin ser obvio al principio. Métrica indirecta: comentarios con el número de cajas o con «lo vi» / «no lo vi» (señal secundaria, no objetivo).
- **Métricas a mirar a las 24 y 48 h:** vistas, retención 1/3/5/10 s, % que lo ve entero, compartidos + guardados, visitas al perfil, seguidores nuevos, DMs (conteo manual).
- **Pendiente de validar:** el horario de publicación (19:00 UTC era una propuesta), la voz (se conservó la de marca tras comprobar que transcribe «encontrás» y «fijate»; el acento rioplatense no se ha podido verificar a oído por parte de Claude).

### Video 2 · «Un clip, cuatro capas» (producido en `out/capas/`)
- **Función (ventas.md):** confianza — muestra proceso y criterio, sin CTA.
- **H1.** Enseñar el proceso en secuencia, sin texto técnico, genera más guardados y compartidos por 1000 vistas que los reels explicativos. Comparar con la mediana de piezas comparables de la cuenta cuando haya 5 o más.
- **Métricas a 24 y 72 h:** compartidos + guardados por 1000 vistas, retención a 5 y 10 s, % que lo ve entero.

### «Cuatro tomas, una frase» (mecanismo adaptado de @altumapp; producido en `out/tomas/`)
- **Función:** alcance con el servicio dentro de la historia (edición a cámara).
- **H1.** Una situación de grabación reconocible + subida de tensión que termina en corte a silencio y revelación da más compartidos y guardados por 1000 vistas que nuestros reels explicativos.
- **Métricas:** compartidos + guardados / 1000 vistas, retención a 3 y 10 s, visitas al perfil atribuidas al video, DMs (conteo manual).

## Escalera del gancho (2026-10-30, referencia @plantandofloress)
- **Origen:** reel de otra cuenta que muestra 6 versiones de la misma apertura con vistas de 1.940 a 2,7 M (cifras suyas, no verificables). Análisis en `.claude/skills/formula-viral/referencia/escalera-gancho.md`. Se suma a la fórmula por pedido del usuario (corrección 5 de `formula-viral`).
- **H1.** Un gancho con nicho + acción + temporalidad + historia + meta retiene más a los 3 s que nuestros ganchos actuales sin esas piezas. Métrica: retención a 1, 3 y 5 s frente a la mediana de los reels de Gancho (≈ 64 % a 3 s en TikTok).
- **H2.** El formato escalera (la misma pieza mejorada paso a paso con un indicador medible) tiene más % de visualización completa que un antes/después directo (que en la cuenta murió a los 2 s). Métrica: % que lo ve entero y retención a 10 s.
- **Ojo con la duración:** su gancho completo dura ~9 s de voz y nuestros datos dicen que la gente se va entre el segundo 3 y el 10. Probar la escalera completa en el texto del fotograma 0 + voz corta, y medir.

## «La medialuna» v1 vs v2 (2026-10-30)
- **v1** (`out/hookhouse/medialuna.mp4`): gancho «Si en tu video el producto se ve así…» + mito → falso → 3 cambios. **v2** (`out/medialuna_v2/medialuna_v2.mp4`): gancho reto en tiempo real + guion escalera «EN EL SEGUNDO 1 SE VE». Misma voz, misma demo, mismo CTA «VIDEO».
- **H1.** La v2 retiene más a los 3 s (panel simulado: 5/5 contra 3/5). **H2.** La v2 tiene más guardados por 1000 vistas (la escalera es útil para guardar).
- Publicar en días distintos a la misma hora; medir retención 1/3/10 s, % completo, guardados, compartidos y DMs «VIDEO». Pruebas y panel en `produccion/medialuna_v2/pruebas.md`.

## «La servilleta de Messi» — 3 variantes (2026-10-31)
- Primera pieza en el estilo de `estilo-animado.md` (sin Hookie). Variantes y panel en `produccion/servilleta/pruebas.md`.
- **H1.** El gancho de precio (V1) retiene más a los 3 s que el reto (V2) y que el nicho (V3).
- **H2.** El reto (V2) tiene más comentarios y compartidos por 1000 vistas.
- **H3.** El nicho (V3) tiene menos vistas pero más seguidores nuevos que sean negocios (revisar perfiles de los nuevos).
- Publicar en días distintos a la misma hora; medir retención 1/3/10 s, % completo, compartidos, guardados y seguidores.
