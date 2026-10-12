# Guion — "Edición automática" (TikTok, español latino, ~30 s)

Estructura según `estilo.md` §1: autoridad/gancho → contraste → 3 explicaciones → "no es A, es B" → "no necesitas A, necesitas B" → CTA.

| # | Locución | Línea script | Línea de impacto (palabra destacada en **negrita**) | Gráfico |
|---|---|---|---|---|
| 1 | Las agencias que más crecen en TikTok… no editan sus videos. | Las agencias que más crecen | **no editan** sus videos. | Gráfica ascendente + logo de play |
| 2 | Tú grabas diez minutos… y pierdes una tarde entera editando. | Tú grabas 10 minutos | y pierdes **una tarde entera** | Reloj con agujas girando |
| 3 | Cortes. Subtítulos. Zooms. Música. | — | Cortes · Subtítulos · Zooms · Música | Timeline de edición |
| 4 | No es falta de talento. Es falta de sistema. | No es falta de talento | **Es falta de sistema.** | Negro puro |
| 5 | Nosotros automatizamos tu edición: | Nosotros automatizamos | tu **edición** | Engranajes |
| 6 | subes el video en bruto… y te lo devolvemos listo para publicar. | subes el video en bruto | y te lo devolvemos **listo para publicar** | Nube de subida → móvil |
| 7 | Con el ritmo que retiene… y hace que te sigan. | Con el ritmo que retiene | y hace que **te sigan** | Ojo + contador de seguidores |
| 8 | Para agencias, coaches y creadores. | Para | agencias · coaches · creadores | 3 tarjetas |
| 9 | No necesitas otro editor. Necesitas un sistema. | No necesitas otro editor | Necesitas **un sistema.** | Corcho con hojas (GRABAR → EDITAR → PUBLICAR) |
| 10 | Escríbeme AUTO y te muestro cómo funciona. | Escríbeme | **'AUTO'** / y te muestro cómo funciona | Bocadillos de mensaje |

Locución completa (la que se envía a ElevenLabs):

> Las agencias que más crecen en TikTok… no editan sus videos. Tú grabas diez minutos… y pierdes una tarde entera editando. Cortes. Subtítulos. Zooms. Música. No es falta de talento. Es falta de sistema. Nosotros automatizamos tu edición: subes el video en bruto… y te lo devolvemos listo para publicar. Con el ritmo que retiene… y hace que te sigan. Para agencias, coaches y creadores. No necesitas otro editor. Necesitas un sistema. Escríbeme AUTO y te muestro cómo funciona.

Voz: ElevenLabs · Rodrigo Zabú (`1p905cdbJ1e1JQxhFTGJ`) · español latinoamericano · modelo eleven_v4.
Toma usada: B (`public/audio/voz_b.mp3`, 35,4 s). Tiempos por palabra: ElevenLabs Scribe (`analisis/words_b.json`).
Procesado: `python3 -I .claude/skills/copiar-estilo/scripts/cortar_silencios.py public/audio/voz_b.mp3 analisis/words_b.json public/audio/voz.wav` → `public/audio/voz.wav` (33,8 s) + `src/data/captions.json`.
