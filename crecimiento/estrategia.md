# Estrategia de 30 días: primer cliente recurrente (13-10-2026 → 11-11-2026)

**Meta:** conversaciones comerciales y un cliente recurrente (Starter, 390 USD/mes, ver `oferta.md`). Las redes
sirven para que, cuando un prospecto mire el perfil, vea pruebas del trabajo. No se persiguen solo visualizaciones.

**Sin promesas:**
- No se promete viralidad.
- Las cifras de este documento son las reales del 12-10-2026 o están marcadas como objetivo.

## Punto de partida (datos reales vía Windsor, 12-10-2026)

| Cuenta | Seguidores | Publicaciones | Lo medido |
|---|---|---|---|
| TikTok «Hook House \| Edición De Video» | 26 | 5 | **Único vídeo con datos** («Subiendo mis Trabajos…», 23 s): 511 vistas, 5,2 s de media vista, 5 % lo vio entero, 0 compartidos, 0 visitas al perfil, 0 seguidores nuevos. |
| Instagram @hookhouseoficial | 12 | 6 | 2 carruseles del 04-10: 19 y 10 vistas, 1 compartido. Bio en español para coaches, CTA «Escribime EDICIÓN». |
| YouTube Shorts | — | — | **No conectado** a Windsor: no se puede medir. |

**Lectura del vídeo de TikTok:** se pierde a casi todos antes de los 6 segundos. El primer segundo tiene que decir
qué gana quien mira; una frase como «subiendo mis trabajos» no lo hace. Por eso todas las piezas nuevas abren con
un contraste visible desde el primer fotograma («Same clip. Two edits.»).

## Decisiones

1. **Idioma: inglés primero.**
   - Los prospectos son angloparlantes, y lo primero que hacen al recibir un mensaje es mirar el perfil.
   - Mezcla propuesta: 4 de cada 5 piezas en inglés y 1 en español (para no perder lo que ya hay).
   - Bio sugerida (la cambias tú, Windsor no edita la bio): «Short clips for podcasters & creators 🎙️ Hook first ·
     animated captions · weekly · Comment CLIP for a free edit».
2. **Formatos.** Ninguna fuente aportó datos independientes de qué formato gana clientes (ver `mercado.md` §2), así
   que se tratan como hipótesis y se miden:
   - **A · Antes/después** (40 %): la prueba directa del servicio. Plantilla `MismoClip`.
   - **B · Desglose de una edición** (25 %): «3 fixes for your podcast clip» (plantilla de creación con tema).
   - **C · Dato curioso de edición** (20 %): el efecto Kuleshov con Capi; atrae a gente del sector y se comparte.
   - **D · Caso real** (15 %): solo con permiso del cliente (el primero, `cliente-1`, aún no ha dado permiso público).
3. **Señales que importan:**
   - Según las fuentes oficiales y la prensa citadas en `mercado.md` §3: TikTok premia terminar el vídeo e Instagram
     da peso a los envíos por alcance para llegar a no seguidores.
   - Por eso las piezas duran 13–25 s, cierran con una pregunta o una palabra para comentar, y llevan palabras
     clave del nicho en el texto («podcast clips», «shorts editing»).
   - Instagram: usar **reels de prueba** para probar 2 ganchos de la misma pieza.
4. **Llamada a la acción única:** «Comment CLIP» (o «Escribe CLIP»).
   - Quien comenta entra en la base de datos como prospecto entrante (`npm run crm -- importar`, con la evidencia
     «comentó CLIP en <post>»).
   - Se le responde por mensaje privado. **Lo envías tú:** Windsor solo puede responder comentarios en Instagram y
     no envía mensajes privados.

## Calendario (publicación lunes a viernes; prospección todos los días laborables)

Prospección diaria:
- Verificar y enviar 5–10 mensajes nuevos.
- Hacer los seguimientos que marque `npm run crm -- pendientes`.
- Investigar 5 prospectos nuevos para mantener la cola llena.

| Día | Fecha | Pieza (formato) | Plataformas | Estado |
|---|---|---|---|---|
| 1 | mar 13-10 | **Same clip. Two edits.** (A, EN) | TikTok, Reels, Shorts | ✅ hecha: `contenido/v00-mismo-clip-en.mp4` |
| 2 | mié 14-10 | **3 fixes for your podcast clip** (B, EN) | TikTok, Reels, Shorts | ✅ hecha: `contenido/v01-podcast-clips-en.mp4` (añadir sonido en la app) |
| 3 | jue 15-10 | **Mismo clip, dos ediciones** (A, ES) | TikTok, Reels | ✅ hecha: `contenido/v00-mismo-clip-es.mp4` |
| 4 | vie 16-10 | **One episode = a week of shorts** (B, EN) | TikTok, Reels, Shorts | ✅ hecha: `contenido/v02-un-episodio-en.mp4` |
| 5 | lun 19-10 | **El efecto Kuleshov** con Capi (C, ES) | TikTok, Reels | ✅ hecha: `pruebas/capi/capi_efecto-kuleshov_9x16.mp4` |
| 6 | mar 20-10 | Antes/después n.º 2: subtítulos planos vs. animados (A, EN) | todas | guion abajo |
| 7 | mié 21-10 | «Your intro is killing your clip» (B, EN) | todas | guion abajo |
| 8 | jue 22-10 | Tu clip de pódcast pierde gente (B, ES) | TikTok, Reels | ✅ hecha: `contenido/v03-clip-podcast-es.mp4` |
| 9 | vie 23-10 | Antes/después n.º 3: plano fijo vs. zooms (A, EN) | todas | guion abajo |
| 10 | lun 26-10 | Kuleshov en inglés con Capi (C, EN), **necesita voz** | todas | requiere aprobar créditos de ElevenLabs |
| 11–15 | 27-10 → 02-11 | Repetir los 2 formatos con mejor resultado de la semana 1–2, con ganchos nuevos | todas | según métricas |
| 16–20 | 03-11 → 09-11 | Caso real si un cliente da permiso; si no, más A/B con lo que mejor funcione | todas | según métricas |
| 21–22 | 10/11-11 | Revisión del mes y plan siguiente | — | — |

### Guiones pendientes (listos para producir)

**6 · Captions: before/after** (MismoClip con otra frase):
- Gancho: «Same words. Different captions.»
- Frase de Capi: «Captions are not decoration. They are the edit.»
- Claves: *decoration*, *edit*.
- CTA: «Comment CLIP».

**7 · Your intro is killing your clip** (tema, sin voz):
1. «Your clip starts with "So, today we're talking about…"»
2. «People scroll before you get to the *point*.»
3. [paso] «Find the *answer* in the episode.»
4. [paso] «Put it in the first *second*.»
5. [paso] «Then give the *context*.»
6. [cta: CLIP] «Comment *CLIP* and I'll find your hook for free.»

**9 · Static shot vs. zooms** (MismoClip):
- Gancho: «Same camera. More energy.»
- Frase: «A small zoom on every key word keeps eyes on you.»
- Claves: *zoom*, *key*.

## Medición (cada lunes, con Windsor; se anota en `metricas.md`)

| Métrica | TikTok (Windsor) | Instagram (Windsor) | Para qué |
|---|---|---|---|
| Retención | `video_average_time_watched`, `video_full_watched_rate`, retención por segundo | `media_reel_avg_watch_time`, `media_reel_skip_rate` | ¿funciona el gancho? |
| Compartidos | `video_shares` | `media_shares` | alcance a no seguidores |
| Visitas al perfil | `video_profile_views`, `profile_views` | `profile_links_taps` (las visitas por reel no están disponibles) | ¿interesa el servicio? |
| Consultas | comentarios «CLIP» (`comment_text`) + DMs (a mano) | comentarios (`comment_text`) + DMs (a mano) | conversaciones comerciales |

Regla de decisión, a partir de la semana 2:
- Un formato con media vista por debajo del 40 % de su duración o con 0 visitas al perfil en 2 publicaciones se cambia.
- El de más visitas al perfil o consultas se repite.

**Objetivos comerciales del mes** (son objetivos, no previsiones):
- 60 prospectos verificados y 40 contactados.
- 6 conversaciones.
- 3 clips de muestra entregados.
- 1 cliente Starter.
