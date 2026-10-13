# Traspaso entre sesiones — Hook House Autopilot

> Si abres una sesión nueva: lee `CLAUDE.md` (reglas permanentes del usuario), este archivo, `PENDIENTE.md` y
> `docs/arquitectura.md`.
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
| 3 Edición inteligente | ✅ hecha (básica) | Análisis editorial local, clips, versiones cortas, B-roll y música con licencia, Claude opcional, aprobación del plan |
| 4 ElevenLabs narración | ✅ hecha (básica) | `autopilot/narration/tts.ts`; probada con API simulada (la real está bloqueada aquí) |
| 5 Creación desde cero | ✅ hecha (básica) | `autopilot/create/`; `AutopilotTheme` (tema según el contenido, motion graphics, animaciones de `estilo-animaciones.md`) y `AutopilotCreate` (identidad de marca); e2e en `tests/e2e/create.test.ts` |
| 6 Automatización | ✅ hecha (básica) | `autopilot/queue/queue.ts`: cola en disco, trabajador, reintentos, recuperación, pausa, lotes, costes |
| 7 Interfaz y clientes | ✅ hecha (básica) | `autopilot/web/` (servidor, auth scrypt, CSRF, aislamiento) + `web/` (HTML/CSS/JS) |

## Panel en Claude para el teléfono

Artefacto anclado en la barra lateral del usuario: https://claude.ai/artifact/Q3AGHeC2bgSV7h3xBTi19T
(privado, solo el usuario). El usuario deja pedidos desde el teléfono; Claude los procesa cuando le dicen
«revisa el panel» (no hay proceso automático). Base de datos del artefacto (herramienta ArtifactData):

- `pedidos/<id>`: `tipo` (editar | guion | idea), `texto`, `formato`, `subtitulos`, `video` ({id, nombre, bytes}
  o null: el vídeo llega por el chat), `estado` (pendiente | en-proceso | entregado | no-se-pudo), `respuesta`
  (texto para el usuario), `entregas` (ids), `creado`, `actualizado`. Leer, procesar con el pipeline y actualizar
  `estado`/`respuesta`/`entregas` con `if_version`.
- `entregas/<id>`: `titulo`, `origen`, `veredicto`, `videoId`, `posterId`, `archivo`, `bytes`, `duracionSeg`,
  `formato`, `controles` (líneas del informe), `nota`, `pedidoId`, `creado`.
- Vídeos: descargar el del pedido con Artifact `read` + `path: <video.id>`; subir las salidas con Artifact
  publish `asset: true` (máx. 20 MB por archivo; recomprimir si hace falta) y escribir la fila en `entregas`.
- Solo contenido propio del usuario o de sus clientes con permiso; nunca el vídeo de TikTok de un tercero.

## Restricciones del entorno cloud (conocidas)

- Bloqueados: `api.elevenlabs.io`, `elevenlabs.io`, `huggingface.co`, `openaipublic.azureedge.net` (Whisper),
  `alphacephei.com` (Vosk). Accesibles: npm, PyPI, storage.googleapis.com y las releases de GitHub (de ahí sale el
  modelo de transcripción local, `npm run setup:asr`).
- El conector MCP de ElevenLabs sí funciona desde la sesión (no desde el código del pipeline).
- Chromium en `/opt/pw-browsers/...` (ver `autopilot/config.ts`).

## Material de prueba

- `tests/data/elevenlabs-scribe-voz_a.words.json`: transcripción real de ElevenLabs de `public/audio/voz_a.mp3`.
- Vídeo subido por el usuario (TikTok de un tercero, @eugenio.esquivel23, con música): solo para pruebas locales;
  NO subir a Git ni a proveedores externos. Ruta en la sesión original:
  `/root/.claude/uploads/c892ae03-04bd-5098-be1f-897ddb43dfb6/c041153d-v09044g40000cnh24lfog65pm4j8q750.mp4`.
- Primer cliente real (`cliente-1`, chico hablando a cámara en un pódcast, inglés, 17 s): `analisis5/cliente.mp4`;
  referencias de vídeos hablados de terceros (@andre.visualz, @raw.to.reel): `analisis5/ref1.mp4`, `ref2.mp4`. Todo
  ignorado por Git y solo local (material de clientes y de terceros: nunca a Git ni a proveedores externos). Los
  resultados de la prueba están en `pruebas/subtitulos-cliente-1/` (los vídeos, también fuera de Git).

## Registro (lo último arriba)

- 2026-10-12: el usuario pidió actuar como responsable de crecimiento y ventas (primer cliente recurrente en 30 días).
  Todo en `crecimiento/` (ver su README). Hecho:
  - base de datos comercial `npm run crm` (`autopilot/crm/`, pruebas en `tests/unit/crm.test.ts`) con 22 prospectos
    investigados y 7 borradores en inglés;
  - oferta (175 / 374,99 / 679,99 USD, precios del usuario del 13-10) y estrategia con calendario de 30 días;
  - vídeos: `MismoClip` EN/ES (`src/Crecimiento/`) y 3 consejos con tema; contador «STEP 1 OF 3» en inglés;
    iconos por palabras desactivados en inglés y homónimos bloqueados («clip», «shorts»);
  - panel en el teléfono: https://claude.ai/artifact/QPgVgn1YPTER13x7SB42HS.
  Bloqueos:
  - la política de red del entorno da 403 a YouTube, Apple Podcasts y la mayoría de webs, así que los prospectos
    salen de resultados de búsqueda y faltan por verificar;
  - las búsquedas web tienen un tope de 200 por turno.
  Claude no envía mensajes ni publica: el usuario aprueba y envía.

- 2026-10-12: «ponle el sonido»: efectos de sonido propios en el motor de edición (`--efectos`, `editorial.efectos` en
  el perfil; activado en `cliente-1`). Vídeo final del cliente: `pruebas/subtitulos-cliente-1/cliente-1_final_con-sonido_9x16.mp4`
  (APROBADO, −14 LUFS, pico −1,1 dBTP). Comando nuevo `rehacer-video <id>`.

- 2026-10-12: vídeos hablados para redes (pedido del usuario con 2 referencias; análisis en `estilo-hablado.md`).
  Hecho en el motor de edición: subtítulos `impacto` (1–3 palabras con pop, clave por frase más grande y en color,
  fraseo sin «de/in» al final de página, cifras con su unidad), intensidad `redes` (zoom alterno en cortes o frases,
  deriva y golpe en las claves), apoyos (página destacada en el gancho y las cifras, emojis en español e inglés),
  gráficos a pantalla completa (`--graficos`: calendario y lista; editables en el plan; `rehacer-video`), B-roll en
  tarjeta y sinónimos inmobiliarios, y transcripción local (sherpa-onnx + Parakeet; huggingface y Whisper bloqueados
  aquí). Prueba obligatoria con el primer cliente real (`cliente-1`): APROBADO, sincronía medida contra el audio
  (0–120 ms antes de la voz, nunca tarde). El usuario vio la primera versión y pidió «añade lo demás» → gráficos.
  La lista de esa prueba se añadió en la revisión del plan (la transcripción no puso la coma). Ver `pruebas/README.md`.

- 2026-10-12: corrección del usuario tras la demo: las animaciones eran para aprenderlas, no para usarlas todas
  juntas, sino para dar dinamismo. Ahora `planDynamics` las reparte por escena (`fx` de cada escena: máscara,
  cámara que sigue, transformación o corte seco; como mucho una especial por escena, alternadas). Quitados el tema
  «editorial» y `--animaciones`; los temas vuelven a no traerlas de serie. Anotado en `estilo-animaciones.md` →
  Correcciones aprendidas.

- 2026-10-12: el usuario pidió llevar a la base las animaciones de un TikTok de referencia (@samunoz.ia, «5
  instrucciones»; solo estudio local en `analisis4/`, ignorado por Git). Análisis en `estilo-animaciones.md`. Hecho:
  máscara de texto (`reveal`), cámara que sigue (`camera`), objeto que se transforma (`sceneTransition:
  "transforma"`), odómetro (`counter`), sincronía con la voz (`cues` por escena, siempre), escenas `[paso]`,
  `[prompt]` y `[cadena]`, tema «editorial» y `--animaciones` (ambos quitados después). Código: `src/create/animaciones.tsx`,
  `src/create/timeline.ts` (tiempos compartidos con los efectos de sonido). Demo sin voz revisada fotograma a
  fotograma. Pendiente: aro/visor que sigue la cara en la edición (motor A) si el usuario lo quiere.

- 2026-10-12: reel de Einstein desde el panel (25 s, APROBADO): base ampliada con modelos animados
  (`[modelo: …]`), tema «ciencia» (estrellas, brillo, destellos, zoom), efectos de sonido (`--efectos`) y
  excepción de fuente por pedido (`--claves-garamond`; el usuario eligió «Garamond solo aquí»). Sin música, por
  elección del usuario. Voz: 4 tomas, 1.312 créditos.

- 2026-10-12: reglas permanentes del usuario (guardadas en `CLAUDE.md`): todo el texto en Inter (preferiblemente
  Bold) y emojis estilo iOS con el set con licencia más parecido (Fluent Emoji en color, MIT). Quitadas las demás
  fuentes; `tests/unit/reglas.test.ts` lo vigila.

- 2026-10-12: vídeos creados con tema según el contenido (motion graphics: `AutopilotTheme`, 13 temas, iconos
  Fluent Emoji por escena, subtítulos a juego); la identidad Hook House queda para contenido de la marca
  (`--estilo marca`). Modo `--sin-voz`. El usuario pidió esto tras ver el vídeo de mandarinas en verde Hook House.

- 2026-10-12: panel anclado en Claude para el teléfono (sección «Panel en Claude»); `web --red` y diseño
  adaptado al teléfono en la web.

- 2026-10-12: las 7 etapas en versión básica, subidas. Lo pendiente está en PENDIENTE.md (verificación real de
  ElevenLabs/Claude desde el código, grabación real de cliente, componentes de creación genéricos, pulido web).

- 2026-10-12: el usuario pidió ir rápido ("no hace falta que sea perfecto"). Etapas 4 y 5 hechas en versión básica.
  Siguiente: Etapa 6 (cola) y 7 (web). Pendiente de pulir después: componentes de creación genéricos multicliente
  (hoy usan los de Hook House), más tipos de escena, e2e de creación.

- 2026-10-12: Etapa 3 a medias, subida a petición del usuario. Probado a mano con voz_a (36 s): 2 clips, versión
  corta deduplicada, B-roll y música de una biblioteca de prueba (`tests/fixtures.ts` → makeTestLibrary). Siguiente:
  pruebas (tests/unit/stage3.test.ts con un servidor falso de la API de Anthropic vía baseURL, e2e de clips) y docs.

- 2026-10-12: Etapa 2 terminada y subida. Siguiente: Etapa 3 (planificador editorial en `autopilot/pipeline/steps/plan.ts`,
  que ya produce `variants`; cada variante se compone, renderiza, verifica y entrega por separado).

- 2026-10-12: inicio de la Etapa 2 (resto).
