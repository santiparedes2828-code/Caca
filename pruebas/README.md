# Pruebas con material real

Cada carpeta es una prueba hecha con material de un cliente. **Los vídeos, fotogramas, subtítulos e informes de
cliente se quedan en local** (ignorados por Git, como `analisis*/` y `data/`): son material del cliente y no se suben
a terceros sin su autorización. Solo este README va al repositorio.

## `subtitulos-cliente-1/` · prueba obligatoria de vídeos hablados (12-10-2026)

Primer cliente real: chico hablando a cámara en un pódcast (inglés, 17,1 s, 1080x1920, sin cortes de plano salvo un
plano general breve). Estilo de `estilo-hablado.md`; perfil `clients/cliente-1/profile.json`.

| Archivo (local) | Qué es |
|---|---|
| `cliente-1_subtitulos-impacto_9x16.mp4` | Versión 1: subtítulos `impacto`, zoom `redes`, páginas destacadas y emoji |
| `cliente-1_con-apoyos-graficos_9x16.mp4` | Versión 2 (tras «añade lo demás»): + calendario y lista a pantalla completa |
| `cliente-1_final_con-sonido_9x16.mp4` | **Versión final** (tras «ponle el sonido»): + efectos de sonido propios en los apoyos (pico −1,1 dBTP) |
| `telefono_1.jpg`, `telefono_2.jpg` | Hoja de contacto a 5 fps y tamaño de teléfono (180x320) de la versión 2 |
| `qc_hoja_contacto.jpg`, `informe-del-trabajo.md`, `plan-del-trabajo.md`, `subtitulos.srt` | Control de calidad, informe, plan y SRT del trabajo |

Cómo se hizo (reproducible):

```console
npm run setup:asr                                          # una vez: modelo de transcripción local
npm run autopilot -- procesar analisis5/cliente.mp4 --cliente cliente-1 --aprobar-plan
# revisión del plan: se añadió en work/plan.json → graficos la enumeración que la transcripción dejó sin comas
npm run autopilot -- aprobar <id>
```

Comprobado:

- **Transcripción sincronizada**: local (sherpa-onnx + Parakeet TDT 0.6B v3) en 1,5 s, 62 palabras, 0 de baja
  confianza; el audio no salió del equipo. Sincronía medida contra la envolvente del audio en 6 inicios de palabra:
  los subtítulos aparecen entre 0 y 120 ms antes de la voz (los tiempos del modelo van en pasos de 80 ms), nunca tarde.
- **Resaltado**: una clave por frase corta en amarillo, más grande y en ExtraBold; el gancho y la cifra principal
  como página destacada (la cifra rueda hasta su valor, con su unidad al lado); emoji solo donde se ve ≥ 0,6 s.
- **Entrada y salida**: pop con muelle al sonar cada palabra, la que suena crece un 6 %, salida de 4 frames; las
  palabras crecen hacia fuera de la línea para no pisarse (corregido tras ver los fotogramas: la clave tapaba la
  palabra anterior en el rebote).
- **Apoyos gráficos** (versión 2): calendario (detectado solo) y lista con checks (añadida en la revisión del plan),
  cortes de 2,4 y 3,2 s con el vídeo desenfocado detrás; legibles a tamaño de teléfono (corregido: el primer
  calendario era demasiado pequeño y la lista empezaba con huecos en blanco).
- **9:16 y zonas seguras**: 1080x1920, texto entre y = 300 y y = 1450 y fuera de los 140 px de la derecha; ningún
  subtítulo sobre la cara (34/34 muestras con cara).
- **QC**: APROBADO en las dos versiones; −14,0 LUFS, pico −1,4 dBTP, sin fotogramas negros, SRT válido.

No funcionó o no aplica en esta grabación:

- **Cortes de silencio**: activados, pero no hay pausas de silencio real (la pausa más larga, 0,35 s, está a −26 dB
  por el ruido de sala; el clip ya venía editado). No se cortó nada, que es lo correcto aquí.
- **B-roll**: el cliente no ha entregado imágenes con licencia; no se usa ninguna imagen genérica.
- **Afirmación a verificar**: el cliente promete una cifra de visualizaciones garantizada; el planificador local no
  marca afirmaciones (solo el de Claude). Revisarla antes de publicar.
- Posible error de transcripción en la última frase («And we do so and fully specialize…»): revisarla en el SRT.
