# Crecimiento y ventas de Hook House

Objetivo: el primer cliente recurrente en 30 días (13-10 → 11-11-2026), mientras crecen Instagram, TikTok y
YouTube Shorts.

**Reglas:**
- Claude **no envía mensajes, no publica y no gasta dinero** sin tu aprobación.
- Nada inventado: cada dato de prospecto lleva su fuente.

| Archivo | Qué es |
|---|---|
| `datos/prospectos.json` | **Base de datos comercial** (validada con zod, sin duplicados). Se maneja con `npm run crm`. |
| `panel.html` | Página para el teléfono generada desde la base: `npx tsx scripts/panel-crecimiento.ts`. Publicada como artefacto: https://claude.ai/artifact/QPgVgn1YPTER13x7SB42HS |
| `investigacion/prospectos-*.json` | Investigación en bruto por segmento (podcasters, educativos, profesionales). |
| `investigacion/mercado.md` | Competidores, precios publicados, datos de plataformas y dónde buscan editor los clientes, con fuentes. |
| `mensajes/*.txt` | Primeros mensajes en inglés, personalizados (también guardados como borradores en la base). |
| `oferta.md` | Oferta mensual propuesta (Starter 390 USD, Growth 690 USD), texto en inglés y seguimientos. |
| `estrategia.md` | Estrategia, decisiones, calendario de 30 días y cómo medir. |
| `metricas.md` | Línea base real (Windsor) y registro semanal. |
| `contenido/` | Guiones (`*.txt`), vídeos 9:16 (`*.mp4`, fuera de Git) y descripciones (`descripciones.md`). |

## Base de datos (`npm run crm -- …`)

```console
npm run crm -- pendientes                       # qué toca hoy (aprobar, seguimientos vencidos)
npm run crm -- listar --prioridad B             # filtrar
npm run crm -- ver glen-whitten                 # ficha completa con mensajes
npm run crm -- enviado glen-whitten --canal email   # TÚ lo enviaste → programa seguimientos a 3, 7 y 14 días
npm run crm -- respuesta glen-whitten --texto "Sure, send it"   # pasa a «respondio»
npm run crm -- estado glen-whitten llamada --nota "llamada jueves 17 h"
npm run crm -- importar nuevos.json             # añade prospectos investigados (rechaza duplicados y los que no tienen fuentes o evidencia)
npm run crm -- resumen | csv
```

Estados:
- Recorrido normal: `nuevo` → `mensaje-listo` → `contactado` → `respondio` → `llamada` → `prueba` → `propuesta` → `cliente`.
- Cierres: `perdido` o `no-encaja`.

Pruebas: `tests/unit/crm.test.ts`.

## Vídeos

- **`MismoClip`** (`src/Crecimiento/MismoClip.tsx`, composiciones `MismoClipEN` y `MismoClipES`):
  - Capi como invitado de un pódcast, la misma frase sin editar y con la edición de Hook House.
  - Textos, tiempos, claves y emojis por props, para hacer más piezas.
  - Render: `npx remotion render MismoClipEN out.mp4`, luego normalizar a −14 LUFS con ffmpeg `loudnorm`.
- **Consejos con tema:**
  - `npm run autopilot -- crear --guion crecimiento/contenido/v01-podcast-clips-en.txt --sin-voz --efectos --estilo tema`.
  - En inglés el contador dice «STEP 1 OF 3» (`[paso: Título | Step]`) y los iconos se buscan en el índice inglés.

## Integraciones comprobadas el 12-10-2026

| Integración | Qué funciona de verdad | Qué no |
|---|---|---|
| Windsor · Instagram (@hookhouseoficial) | Lectura de métricas. Acciones disponibles: publicar reel (`create_video_post`), imagen, carrusel, historia, comentar y responder comentarios. | Necesita una **URL pública** del vídeo. No envía mensajes privados ni cambia la bio. **No probado** (publicar requiere tu aprobación). |
| Windsor · TikTok («Hook House \| Edición De Video») | Lectura de métricas por vídeo (retención, compartidos, visitas al perfil) y de comentarios. | **Sin acciones de escritura**: no publica. |
| Windsor · YouTube | — | **No conectado**. |
| Windsor · Meta Ads | Cuentas conectadas. | No se ha tocado (gastaría dinero). |
| Higgsfield · TikTok | — | Ninguna cuenta de TikTok conectada. |
| ElevenLabs | Voz de marca disponible (Rodrigo Zabú, `1p905cdbJ1e1JQxhFTGJ`). | Cada generación gasta créditos: requiere aprobación. Solo voces (regla 7). |
| Canva | Conectado (1 kit de marca). | Sin uso todavía. Imágenes solo si hacen falta (regla 7). |
| Web (investigación) | Búsquedas web. | **WebFetch y curl bloqueados** por la política de red del entorno (YouTube, Apple Podcasts y la mayoría de webs dan 403): los prospectos están sin verificar en sus páginas. |
| Envío de emails o DMs | — | No hay ninguna herramienta conectada para enviarlos; los envías tú. |
