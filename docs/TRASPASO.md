# Traspaso entre sesiones — Hook House Autopilot

> Si abres una sesión nueva: lee este archivo, luego `PENDIENTE.md` y `docs/arquitectura.md`.
> Rama de trabajo: `claude/hook-house-autopilot-s2jogh`. Comprueba siempre `npm run lint && npm test && npm run test:e2e`.

## Encargo del usuario

Construir todas las etapas (1–7) del sistema descrito en el primer mensaje de la sesión original
("HOOK HOUSE AUTOPILOT"): edición automática + creación con IA, con identidad Hook House, ElevenLabs,
cola, interfaz web y multicliente. El usuario pidió seguir hasta tener todas las etapas y, si se acaban
los tokens, dejar este archivo para continuar.

## Estado por etapa

| Etapa | Estado | Notas |
|---|---|---|
| 1 Base | ✅ hecha | Pipeline, subtítulos SRT, vertical, QC, informe |
| 2 Material del cliente | ✅ hecha | Transcripción ElevenLabs, caras, cortes de silencio, escenas, ruido básico |
| 3 Edición inteligente | 🟡 siguiente | Usar variantes del paso plan; ver PENDIENTE.md |
| 4 ElevenLabs narración | ⏳ | |
| 5 Creación desde cero | ⏳ | |
| 6 Automatización | ⏳ | |
| 7 Interfaz y clientes | ⏳ | |

## Restricciones del entorno cloud (conocidas)

- Bloqueados: `api.elevenlabs.io`, `elevenlabs.io`, `huggingface.co`. Accesibles: npm, PyPI, storage.googleapis.com.
- El conector MCP de ElevenLabs sí funciona desde la sesión (no desde el código del pipeline).
- Chromium en `/opt/pw-browsers/...` (ver `autopilot/config.ts`).

## Material de prueba

- `tests/data/elevenlabs-scribe-voz_a.words.json`: transcripción real de ElevenLabs de `public/audio/voz_a.mp3`.
- Vídeo subido por el usuario (TikTok de un tercero, @eugenio.esquivel23, con música): solo para pruebas locales;
  NO subir a Git ni a proveedores externos. Ruta en la sesión original:
  `/root/.claude/uploads/c892ae03-04bd-5098-be1f-897ddb43dfb6/c041153d-v09044g40000cnh24lfog65pm4j8q750.mp4`.

## Registro (lo último arriba)

- 2026-10-12: Etapa 2 terminada y subida. Siguiente: Etapa 3 (planificador editorial en `autopilot/pipeline/steps/plan.ts`,
  que ya produce `variants`; cada variante se compone, renderiza, verifica y entrega por separado).

- 2026-10-12: inicio de la Etapa 2 (resto).
