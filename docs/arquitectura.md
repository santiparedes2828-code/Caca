# Arquitectura de Hook House Autopilot

## Módulos

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Sistema de diseño | `src/design/` | Esquemas zod de marca (`schema.ts`), tokens Hook House (`tokens.ts`, leídos de `clients/hookhouse/profile.json`), presets de intensidad, carga de fuentes |
| Composiciones | `src/autopilot/` | `AutopilotEdit` (reencuadre + zoom + subtítulos), `Captions` (5 modos), `paginate.ts` (agrupación de palabras, compartida con el backend), `props.ts` (contrato backend ↔ Remotion) |
| Clientes | `clients/<id>/profile.json`, `autopilot/clients/` | Identidad y valores por defecto por cliente; añadir uno no requiere código |
| Trabajos | `autopilot/jobs/` | Modelo y estados, almacén en disco aislado por cliente, bloqueo por trabajo, cancelación |
| Ingesta | `autopilot/ingest/` | Extensión, tamaño, firma binaria real, ffprobe, copia de solo lectura, nombre seguro |
| Análisis | `autopilot/media/probe.ts` | Duración, resolución con rotación, fps/VFR, códecs, sonoridad EBU R128, silencios, volumen, negros |
| Preparación | `autopilot/media/prepare.ts` | Copia de trabajo CFR H.264 y normalización de sonoridad en dos pasadas (no restauración) |
| Subtítulos | `autopilot/captions/` | SRT/VTT/JSON → formato interno con precisión real; normalización; páginas; SRT final |
| Transcripción | `autopilot/transcription/` | Cliente REST de ElevenLabs (STT + suscripción), caché por cliente, presupuesto, registro de uso, transcripción editable |
| Render | `autopilot/render/` | Bundle con caché por hash, servidor local de recursos, `renderMedia` con cancelación |
| Calidad | `autopilot/qc/` | Controles automáticos, fotogramas de control, informe Markdown/JSON |
| Orquestación | `autopilot/pipeline.ts`, `autopilot/inbox.ts`, `autopilot/cli.ts` | Pasos reanudables, reintentos, bandeja de entrada, CLI |

## Flujo de un trabajo de edición

```
bandeja / procesar
  └─ ingest     validando     valida y copia a input/original/ (solo lectura)
  └─ analyze    analizando    work/analysis.json
  └─ prepare    analizando    work/source.mp4 (CFR, rotación, recorte, −14 LUFS) + prepare.json
  └─ captions   transcribiendo SRT/VTT/JSON del cliente, o work/transcript.json, o ElevenLabs (audio mono 16 kHz)
                              → work/captions.json (páginas + SRT)
  └─ compose    componiendo   work/props.json (valida recursos de marca)
  └─ render     renderizando  work/render.mp4 (+faststart). Clave = hash(props + bundle): no se repite
  └─ qc         verificando   work/qc.json + output/qc/*.jpg
  └─ deliver    → completado | requiere_revision | fallido   output/*.mp4, *.srt, informe.*
```

Cada paso escribe sus artefactos en `work/` y se marca `hecho` en `job.json` (escritura atómica). Al reanudar
(`reintentar`, o un proceso que se cortó) se empieza en el primer paso pendiente, fallido o cuyo artefacto falte.
Un QC FALLIDO recalcula subtítulos/composición y fuerza un render nuevo; los pasos caros anteriores se conservan.
Máximo `HH_MAX_ATTEMPTS` intentos.

## Decisiones

- **Local primero.** Todo funciona con FFmpeg + Remotion en la máquina; sin servicios externos en la Etapa 1.
- **Copia de trabajo normalizada.** El material de móvil (VFR, HEVC, rotación) se convierte una vez a H.264 CFR; el
  original nunca se modifica. Se conserva la resolución hasta 4K para que el recorte vertical no pierda calidad.
- **`OffthreadVideo`** (decodificación con FFmpeg en el compositor de Remotion): admite cualquier códec y es
  determinista en render. El vídeo se sirve por un servidor HTTP efímero en `127.0.0.1` con token aleatorio,
  limitado a `work/` del trabajo y `assets/` de su cliente.
- **Precisión de subtítulos honesta.** El formato interno guarda si los tiempos son por palabra, por bloque o
  estimados; los modos por palabra no se aplican sobre tiempos por bloque salvo petición explícita.
- **Paginación en código puro compartido** (`src/autopilot/paginate.ts`): el backend decide qué se ve y el QC puede
  comprobarlo; la composición solo dibuja. Si una línea no cabe, el render reduce el cuerpo (nunca parte palabras).
- **Marca como datos.** Los tokens viven en `clients/<id>/profile.json` validados por zod; `src/HookHouse/brand.ts`
  deriva de ellos, así que las composiciones existentes y las nuevas comparten una única fuente (verificado: el
  still de `HookHouse` es idéntico píxel a píxel tras el cambio).
- **La IA no ejecuta código.** Las composiciones reciben props validadas; nunca se evalúa código generado.

## Seguridad, datos y retención

- Secretos solo por variables de entorno (`.env`, ignorado por Git). Los logs tachan cualquier variable `*KEY*`,
  `*TOKEN*`, `*SECRET*`, `*PASSWORD*` y las rutas absolutas de la máquina.
- Archivos del cliente: lista blanca de extensiones, límite de tamaño y duración, firma binaria real (se rechazan
  ejecutables, scripts y zip), sin enlaces simbólicos, nombres saneados, nada se ejecuta.
- Aislamiento: `data/clients/<cliente>/jobs/<id>/`; ids validados por expresión regular y rutas resueltas con
  `resolveInside`. `findJob` busca en todos los clientes y es solo para la CLI local: una interfaz web debe usar
  `loadJob` con el cliente autenticado (Etapa 7).
- Proveedores externos: solo ElevenLabs, y solo si hay `ELEVENLABS_API_KEY` y el vídeo no trae subtítulos. Recibe
  la pista de audio del tramo editado (mono, 16 kHz, sin metadatos). La respuesta se guarda en la caché del cliente
  (`data/clients/<cliente>/cache/stt/`) y el uso en `data/usage/elevenlabs-stt.jsonl`. ElevenLabs conserva los datos
  según su política y tu plan (el modo de retención cero es solo para empresas, según su SDK).
- Retención: los trabajos se guardan hasta que se borren. Para eliminar un trabajo, borra su carpeta
  `data/clients/<cliente>/jobs/<id>/`; `work/` se puede borrar en cualquier momento para liberar espacio (se
  regenera al reintentar, salvo que el trabajo ya esté entregado).
