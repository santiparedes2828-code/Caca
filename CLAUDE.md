# Hook House Autopilot: instrucciones para Claude

Antes de trabajar, lee `docs/TRASPASO.md` (estado y registro), `PENDIENTE.md` y `docs/arquitectura.md`.
Rama de trabajo: `claude/hook-house-autopilot-s2jogh`. Comprueba siempre `npm run lint && npm test` (y
`npm run test:e2e` si tocas el pipeline o las composiciones).

## Reglas permanentes del usuario

No las cambies salvo que el usuario lo pida expresamente.

1. **Tipografía: solo Inter, en todo.** Todo texto de vídeos, subtítulos, motion graphics, web, panel y
   cualquier pieza visual va en **Inter**, preferiblemente **Inter Bold** (700). También se permiten Inter
   ExtraBold (800) y Medium (500). Ninguna otra fuente. En el código: `src/design/inter.ts`;
   `public/fonts/` solo contiene Inter, y el esquema de marca rechaza otras familias. La prueba
   `tests/unit/reglas.test.ts` lo vigila.
   **Excepción solo si un pedido la pide expresamente** (el 12-10-2026 el usuario eligió «Garamond solo aquí»
   para el reel de Einstein): palabras clave en EB Garamond Bold Italic, el equivalente libre de Apple
   Garamond, que es de Apple. Se activa por trabajo con `--claves-garamond`. Las fuentes de excepción viven en
   `public/fonts/excepciones/` y `src/design/excepciones.ts`. Si un pedido choca con esta regla, pregunta.
2. **Emojis: estilo iOS cuando hagan falta.** Los emojis de Apple son propiedad de Apple y solo tienen licencia
   para mostrarse en sus dispositivos, así que no se incrustan en los vídeos. Se usa el set con licencia más
   parecido: **Fluent Emoji en color** (Microsoft, MIT), definido en `EMOJI_SET` de
   `autopilot/create/theme.ts`. Si el usuario quiere exactamente los de iOS, se añaden desde el iPhone en el
   editor de TikTok o Instagram.
3. **Identidad Hook House** (verde #12A150, logotipo «hookhouse.»): solo para contenido de la propia marca.
   Los vídeos desde una idea usan motion graphics según el tema (`--estilo auto|tema|marca`).
4. **Voz de marca**: ElevenLabs · Rodrigo Zabú (`1p905cdbJ1e1JQxhFTGJ`), modelo `eleven_v4`. Se generan 4
   tomas y se elige la de menos pausas; los tiempos por palabra salen de la transcripción de Scribe.
5. **Del encargo original**:
   - No guardes secretos en Git ni en logs.
   - No subas archivos a terceros sin autorización.
   - Conserva siempre los originales.
   - No ejecutes código generado por IA.
   - Respeta las licencias de recursos, música, voces y servicios.
   - Usa música solo autorizada.
   - No alteres ni inventes contenido hablado.
   - No inventes funciones, recursos, URLs, licencias, tarifas ni resultados.
   - No des por funcionales integraciones probadas solo con simulaciones.
7. **Proveedores (12-10-2026):** ElevenLabs **solo para voces** (narración y transcripción). Las imágenes se
   generan con **Canva** (más barato). No generar imágenes ni vídeos con ElevenLabs.
8. **Vídeos hablados y pódcast (13-10-2026):**
   - **Subtítulos «apilados»** (por defecto en modo impacto): el contexto va pequeño y en minúscula, y la palabra
     clave va enorme, en mayúscula y apilada, en blanco con degradado y sombra (foto de referencia «it works / THE
     ONLINE ECOSYSTEM»). Código en `src/autopilot/StackedCaptions.tsx`; `impactStyle: "pop"` recupera el estilo
     anterior.
   - **Motion graphics en vez de B-roll** cada vez que haga falta, siempre en estilo «estudio»: gris claro con
     cuadrícula, estrellas moradas, arco gris, cifras naranjas que cuentan, barras en degradado y listas numeradas.
     Referencia: un vídeo de motion graphics de Pinterest, solo para estudio local en `analisis8/`. Código en
     `src/autopilot/Graphics.tsx`; detección de cifras, comparaciones, listas y fechas en `autopilot/edit/graficos.ts`.
6. El vídeo de TikTok de un tercero (@eugenio.esquivel23) que subió el usuario es solo para pruebas locales:
   nunca a Git ni a proveedores externos.

## Panel del teléfono

Artefacto anclado: https://claude.ai/artifact/Q3AGHeC2bgSV7h3xBTi19T. Cuando el usuario diga «revisa el
panel», lee la colección `pedidos` con ArtifactData, procésalos con el pipeline y entrega el resultado en
`entregas`. El formato está en `docs/TRASPASO.md`, sección «Panel en Claude».
