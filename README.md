# Hook House · Autopilot

Producción automatizada de vídeos de Hook House para TikTok, Reels y Shorts, con Remotion + FFmpeg.

**Estado: Etapa 1 (base) operativa + transcripción automática con ElevenLabs (Etapa 2, parte 1).** Pon un vídeo (y opcionalmente su SRT) en una carpeta, ejecuta un comando y
obtienes un MP4 vertical 1080x1920 con subtítulos de marca, el SRT del vídeo final, un informe de calidad y el
original intacto. Lo que aún no existe está en [PENDIENTE.md](PENDIENTE.md); la arquitectura, en
[docs/arquitectura.md](docs/arquitectura.md).

## Requisitos

- Node 22 y npm (`npm ci`)
- FFmpeg y FFprobe en el PATH (probado con 6.1)
- Remotion descarga Chrome Headless Shell la primera vez; si no puede, define `REMOTION_BROWSER_EXECUTABLE` (ver `.env.example`)

## Generar tu primer vídeo

```console
npm ci
mkdir -p inbox/hookhouse
cp /ruta/mi-video.mp4 inbox/hookhouse/
cp /ruta/mi-video.srt inbox/hookhouse/        # opcional: mismo nombre que el vídeo (.srt, .vtt o .json)
npm run autopilot -- bandeja
```

El resultado queda en `data/clients/hookhouse/jobs/<id>/output/`:

| Archivo | Qué es |
|---|---|
| `<id>_vertical.mp4` | Vídeo final (H.264 + AAC, yuv420p, 30 fps) |
| `<id>_vertical.srt` | Subtítulos en el tiempo del vídeo final |
| `informe.md` / `informe.json` | Análisis, controles de calidad, advertencias, costes y salidas |
| `qc/hoja_contacto.jpg` | Fotogramas de control para revisar a ojo |

El original y los subtítulos recibidos se copian a `input/original/` en solo lectura y se mueven de la bandeja a
`inbox/hookhouse/_procesados/<id>/`. Para vigilar la carpeta de forma continua: `npm run autopilot -- bandeja --vigilar`.

### Subtítulos automáticos con ElevenLabs

Si el vídeo llega **sin** SRT/VTT/JSON, se transcribe con ElevenLabs Scribe (`scribe_v2`, tiempos por palabra):

1. Copia `.env.example` a `.env` y pon tu `ELEVENLABS_API_KEY` (nunca la pegues en un chat ni la subas a Git).
2. Comprueba la clave y tu plan: `npm run autopilot -- elevenlabs`
3. Procesa como siempre: `npm run autopilot -- bandeja`

- Solo se envía el **audio** del tramo editado (mono, 16 kHz, sin metadatos).
- **Caché por cliente**: el mismo audio no se paga dos veces. **Límites** por trabajo y diarios (`HH_STT_MAX_SECONDS_*`),
  comprobados antes de llamar. Reintentos solo ante 429/5xx/red; un timeout no se reintenta (podría cobrarse dos veces).
- El informe registra los segundos procesados según ElevenLabs (coste **real**) y, si defines
  `HH_ELEVENLABS_STT_USD_PER_HOUR`, una estimación en USD marcada como **estimada**. Uso diario en `data/usage/`.
- Palabras con baja confianza → aviso y `requiere_revision`. Para corregirlas, edita el texto en
  `data/clients/<cliente>/jobs/<id>/work/transcript.json` y ejecuta `npm run autopilot -- rehacer-subtitulos <id>`
  (no vuelve a llamar a ElevenLabs).
- Sin clave, el vídeo sale sin subtítulos y el informe lo explica. `--sin-transcripcion` lo desactiva por vídeo;
  `--idioma en` cambia el idioma (por defecto `es`, en `clients/hookhouse/profile.json`).

### Ajustes por vídeo

Un `mi-video.job.json` junto al vídeo, o las opciones de `procesar`:

```console
npm run autopilot -- procesar video.mp4 --srt video.srt --modo frases --intensidad dinamica --reencuadre blur-fill
```

```json
{ "captionMode": "dinamico", "intensity": "alto-impacto", "format": "cuadrado", "reframe": { "focusX": 0.4 }, "trim": { "startSec": 2, "endSec": 40 } }
```

| Opción | Valores |
|---|---|
| Formato | `vertical` (1080x1920, defecto) · `horizontal` (1920x1080) · `cuadrado` (1080x1080) |
| Subtítulos | `palabra` · `palabra-activa` (defecto) · `grupos` · `frases` · `dinamico` |
| Intensidad | `sutil` (defecto, cámara fija) · `dinamica` (zoom lento) · `alto-impacto` (punch-in cada ≥ 2,5 s) |
| Reencuadre | `cover` (recorte con foco x/y) · `blur-fill` (vídeo entero sobre fondo desenfocado) · `contain` |

Los modos por palabra necesitan tiempos por palabra reales (JSON de ElevenLabs Scribe/Whisper o `Caption[]` de
Remotion). Con un SRT/VTT —que solo tiene tiempos por bloque— el sistema usa `frases` y lo avisa; con
`--estimar-palabras` reparte las palabras por caracteres y lo marca como **estimado** en el informe.

### Otros comandos

```console
npm run autopilot -- estado                 # lista de trabajos del cliente
npm run autopilot -- estado <id>            # detalle (job.json)
npm run autopilot -- reintentar <id>        # continúa desde el paso que falló
npm run autopilot -- cancelar <id>
```

## Calidad: qué significa cada veredicto

- **APROBADO** → estado `completado`: todos los controles automáticos pasan.
- **ADVERTENCIA** → estado `requiere_revision`: se entrega, con los problemas listados (p. ej. vídeo sin audio o sin subtítulos).
- **FALLIDO** → estado `fallido`: no se entrega el MP4; el informe dice por qué y se puede `reintentar`.

Controles: archivo legible, MP4/H.264/yuv420p/AAC, resolución, fps, duración, decodificación completa, pista de
audio, duración audio = vídeo, sonoridad (−14 LUFS) y picos, tramos negros (comparados con el original),
pantallas vacías, subtítulos dentro del vídeo y sin solapes, líneas dentro del ancho, tiempo de lectura y SRT
válido. **La revisión humana sigue siendo necesaria** (caras cortadas por el reencuadre, erratas del texto, sentido).

## Pruebas

```console
npm run lint         # eslint + tsc
npm test             # 31 pruebas unitarias (segundos)
npm run test:e2e     # 13 pruebas de extremo a extremo con render real (~3 min)
```

## Remotion Studio

`npm run dev` abre las composiciones: las de marca existentes (`HookHouse`, `Viral`, `Clip`, `Promo`) y las del
pipeline en la carpeta *Autopilot* (`AutopilotEdit` y `CaptionModesDemo`, demo de los 5 modos de subtítulo con la
locución real de marca).

## Licencias

Remotion exige una licencia de empresa a partir de cierto tamaño de organización
([condiciones](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)); la clave se pasa con
`REMOTION_LICENSE_KEY`. Las fuentes de `public/fonts/` son OFL. El sistema no añade música ni recursos de terceros.
El uso de ElevenLabs se rige por los términos y el plan de tu cuenta.
