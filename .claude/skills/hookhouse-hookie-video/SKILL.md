---
name: hookhouse-hookie-video
description: Crear, producir, revisar y corregir videos verticales de Hook House con Hookie, preservando su identidad; mejorar guiones, renders y captación de clientes mediante contenido, oferta, perfil y respuestas comerciales para TikTok, Reels y Shorts. Integra la fórmula viral (formula-viral). Usar en Claude o agentes con acceso al proyecto, siempre que se haga, guione, revise o corrija un video de la marca con Hookie/Gancho.
---

# Videos con Hookie (incluye la fórmula viral)

Esta skill **integra** `../formula-viral/SKILL.md` (qué se dice y cuándo se ve) y se apoya en `estilo-altera.md` + `personaje-gancho.md` (cómo se ve). Para material de clientes (sin Hookie) sigue mandando `estudio-hookhouse`, que también usa la fórmula.

## 0. Fórmula viral integrada

Las 3 reglas de `formula-viral` siguen vigentes como criterio de contenido:
1. **Apertura**: lo más intrigante y comprensible ya en el primer fotograma, en movimiento, sin presentación previa.
2. **Sincronía**: cada sustantivo/cifra importante se ve en el instante en que se dice; la pantalla no se queda quieta sin motivo.
3. **Recompensa al final**: el bucle del inicio se cierra exactamente como se prometió, con la prueba a la vista el tiempo necesario.

**Precedencia cuando hay conflicto** (lo más reciente del usuario manda; los números antiguos de `formula-viral` quedan superados):
| Tema | Antes (`formula-viral`) | Vale ahora |
|---|---|---|
| Duración | 35–55 s → 25–35 s → 15–22 s | 15–35 s orienta, no obliga |
| Misterio | no resolver antes de 2 s | sin mínimo: prima claridad y progresión desde el inicio |
| CTA | DM «Escríbenos HOOK…» en cada video | máximo uno, pertinente y opcional; la conexión comercial se evalúa por tanda (`references/ventas.md`) |
| Resultados | retención/viralidad esperadas | solo hipótesis con métrica; nada se garantiza |
| Reglas nuevas | corregir en la skill tras cada pieza | los experimentos van a `notas-experimentales.md`, no a la guía de marca |
Se mantienen: no inventar cifras ni referencias, sin pausas > 0,4 s, texto legible en el fotograma 0 y sin texto doble, voz de marca (Rodrigo Zabú) probada en voseo antes de sintetizar todo, cantidades dichas = cantidades mostradas.

## Contrato

Crear contenido claro, entretenido y compartible que muestre capacidad de edición y conecte con potenciales clientes. Separar calidad editorial, hipótesis de alcance y resultados comerciales. No garantizar viralidad ni inventar cifras, referencias o conexiones. Ejecutar hasta el entregable solicitado; publicar o gastar créditos adicionales solo con autorización aplicable.

## Economía de contexto y ejecución

- Leer esta guía una vez por sesión; releer únicamente si cambia. Cargar referencias solo al entrar en la etapa correspondiente.
- Buscar rutas concretas; leer solo fragmentos necesarios. Conservar un mapa breve de assets, componentes, comandos y decisiones con rutas/versiones. Reutilizarlo mientras siga vigente; invalidarlo ante cambios relevantes.
  Mapa vigente (2026-10-25): rig `src/Altera/Gancho.tsx`; sistema `src/Altera/system.tsx`; base de reels `src/Altera/reelkit.tsx`; utilería `props.tsx`/`props2.tsx`; reels `src/Altera/reels/*` (referencia reciente: `Error1.tsx`); registro `src/Root.tsx`; sonidos `public/sfx/hh/`; voces y tiempos `public/audio/`, `src/data/captions-*.json`; renders en `out/`; plan y guiones `calendario-30-dias.md`; hipótesis `notas-experimentales.md`; métricas `metricas.md`.
- Reutilizar guiones aprobados, componentes y renders vigentes. No reinvestigar, regenerar calendarios, pedir datos ya disponibles ni producir variantes no solicitadas.
- Planificar brevemente; mantener ficha y QA en archivos del proyecto. Mostrar decisiones y resultados, no repetir toda la guía ni logs completos. Agrupar lecturas independientes y limitar salidas de herramientas sin ocultar fallos.
- Revisar barato antes de exportar; tras un arreglo revisar el tramo afectado y sus vecinos, luego una pasada final completa. Evitar renders y pruebas idénticas sin cambios ni problemas pendientes.
- No ahorrar eliminando evidencia, controles, revisión audiovisual ni correcciones necesarias. No imponer recortes de duración o complejidad solo para consumir menos tokens.

## 1. Contexto e identidad

Leer instrucciones locales y fuentes actuales: guía, videos aprobados, assets, voz, sonidos, componentes y render. Consultar `formula-viral` y `estilo-altera.md` si existen. Derivar paleta, tipografía, proporciones, silueta, rasgos, expresiones, personalidad y movimientos desde recursos aprobados, no de recuerdos incompletos.
Conservar Hookie; comprobar si «Gancho» identifica al mismo personaje (en este proyecto, `personaje-gancho.md`: Gancho = Hookie). No rediseñar ni fabricar sustitutos sin pedido. Si falta un asset, pedir solo el indispensable y avanzar con guion/timing. Separar experimentos de reglas permanentes de marca.

## 2. Concepto

Asignar objetivo principal: alcance, confianza o consulta. Consultar [references/ventas.md](references/ventas.md) al planificar contenido comercial, oferta, perfil o respuestas; aplicarlo sin convertir cada pieza en anuncio.
Ficha breve: público/situación, promesa, tensión, demostración, desenlace, función de Hookie, vínculo con edición e hipótesis medible. Proponer tres conceptos solo si no hay uno aprobado.
Elegir por claridad, interés y viabilidad: ¿se entiende sin conocer la cuenta?, ¿por qué seguir?, ¿el final cumple?, ¿Hookie cambia algo?, ¿por qué compartir/recordar/visitar el perfil?, ¿hay recursos suficientes? Corregir respuestas débiles antes de animar.
Variar humor con consecuencia, desafíos justos, transformaciones, historias y demostraciones. Evitar convertir toda la cuenta en publicidad o tutoriales para editores.

## 3. Hookie

Dar deseo, obstáculo, acción y reacción cuando corresponda; en demostraciones, provocar, descubrir, probar o resolver. Si solo señala texto, darle una acción que afecte el resultado.
Conservar diseño; revisar poses legibles, anticipación, contacto, apoyos, trayectorias, oclusiones y continuidad. Evitar deslizamientos, penetraciones, deformaciones no autorizadas y gestos ajenos al audio. Una acción dominante por momento; permitir pausas expresivas y prescindir de diálogo si la imagen comunica mejor.

## 4. Guion

Comparar tres aperturas breves con mecanismos distintos y elegir una; conservar una aprobada salvo defecto justificado. Primer fotograma con sujeto y acción/pregunta entendible, sin presentación corporativa previa.
Usar voz aprobada y español rioplatense natural; probar voseo y nombres. Tabla de escenas: inicio/fin, función, voz/texto, acción de Hookie, cámara, sonido y recurso. Ajustar tiempos a voz y lectura reales; 15–35 s orienta, no obliga.
Quitar preámbulos, redundancias y espera artificial sin sacrificar comprensión. Entregar la recompensa prometida; comprobar números, objetos, capas, palabras, tiempos y afirmaciones. Diferenciar versiones completas y fragmentos cuando importe. Máximo un CTA pertinente, opcional; loop natural sin esconder el desenlace. No generar variantes completas salvo pedido o prueba justificada.

## 5. Previsualización

Crear animática/baja resolución antes de pulir; identificar recursos provisionales. Revisar apertura, transición compleja y desenlace.
Pasadas: sin sonido (acción/jerarquía/progresión), solo audio (naturalidad/inteligibilidad/repeticiones/mezcla), completa a velocidad normal y tamaño móvil (lectura/foco/ritmo/recompensa).
Inicio confuso → rehacer; cuerpo estancado → condensar/sustituir; final débil → mejorar demostración o acotar promesa. Declarar exactamente qué se vio/oyó: código y capturas no prueban ritmo ni audio.

## 6. Producción

Reutilizar editor, componentes, fuentes, transiciones y sonidos; evitar dependencias innecesarias. Separar tiempos/contenido/assets. Mantener jerarquía, contraste, subtítulos sincronizados y zonas seguras según interfaz objetivo; preferir comparación secuencial si dividir dificulta leer.
Motivar cortes/zooms/sonidos; evitar impactos constantes, saturación visual, clipping y música que tape voz. Exportar según proyecto/plataforma; defecto: MP4 compatible 1080×1920 y fps coherentes. Verificar requisitos actuales solo si se necesita una restricción específica.

## 7. QA y corrección

Leer [references/revision-y-correccion.md](references/revision-y-correccion.md). Inspeccionar MP4 real con reproducción y herramientas disponibles (metadatos, decodificación, cuadros y audio); automatización no sustituye percepción.
Registrar tiempo/evidencia/severidad/arreglo. Prioridad: promesa y claridad → continuidad, lectura y audio → acabado. Corregir, reexportar, revisar cambios/vecinos y pasar completo al final. Tras dos intentos fallidos de resolver un defecto conceptual, simplificar o replantear.
No aprobar con recursos ausentes, identidad alterada, texto ilegible, audio roto, conteos falsos o promesa incumplida. Lo no comprobado queda pendiente.

## 8. Entrega

Entregar MP4 y elementos pedidos (portada, descripción, fuentes). **Portada siempre** (pedido del usuario, 2026-10-25): PNG 1080×1920 como composición `<Id>Portada`, con el gancho legible también en el recorte 3:4 de la cuadrícula del perfil (y 240–1680), dentro de la zona segura, sin revelar el desenlace ni prometer algo que el video no cumple; revisarla a tamaño miniatura antes de entregar. Reporte máximo cinco puntos salvo necesidad: estado, controles/evidencia, arreglos, limitaciones y siguiente prueba. No repetir guion/calendario ya entregados.
Estados: listo para probar / pendiente de revisión / rendimiento observado. No afirmar instalación, reproducción, render, conexión o publicación sin evidencia; no convertir una nota editorial en probabilidad de viralidad.

## 9. Aprendizaje

Leer [references/medicion.md](references/medicion.md) solo con estadísticas. Pedir únicamente datos faltantes relevantes, sin bloquear producción; comprobar conexiones. Comparar piezas equivalentes y registrar hipótesis/cambio/evidencia. Conservar identidad; no fijar fórmulas u horarios mágicos ni rehacer estrategia por una sola publicación.

## 10. Conexión comercial

Conectar público → problema → demostración → oferta confirmada → siguiente paso sencillo. Leer [references/ventas.md](references/ventas.md) para planificar esta ruta o diagnosticar falta de consultas. Antes de producir una tanda, revisar si el perfil y las muestras permiten entender qué se vende. Preparar borradores y recursos dentro del alcance solicitado; no enviar mensajes, publicar ni modificar cuentas sin autorización explícita. Medir consultas cualificadas, presupuestos y ventas además de vistas; no asumir que alcance implica demanda.
