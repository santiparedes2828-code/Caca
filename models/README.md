# Modelos locales

| Archivo | Uso | Origen | Licencia | sha256 |
|---|---|---|---|---|
| `face_detection_yunet_2023mar.onnx` | Detección de caras (reencuadre y subtítulos que no tapen caras) | [opencv_zoo / face_detection_yunet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) | MIT (ver ese repositorio) | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` |

| `asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/` (`encoder.int8.onnx`, `decoder.int8.onnx`, `joiner.int8.onnx`, `tokens.txt`) | Transcripción local con tiempos por palabra | [sherpa-onnx, release `asr-models`](https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models) (NVIDIA Parakeet TDT 0.6B v3) | CC-BY-4.0 según NVIDIA (ver `docs/licencias.md`) | encoder `acfc2b4456377e15d04f0243af540b7fe7c992f8d898d751cf134c3a55fd2247` · decoder `179e50c43d1a9de79c8a24149a2f9bac6eb5981823f2a2ed88d655b24248db4e` · joiner `3164c13fc2821009440d20fcb5fdc78bff28b4db2f8d0f0b329101719c0948b3` · tokens `d58544679ea4bc6ac563d1f545eb7d474bd6cfa467f0a6e2c1dc1c7d37e3c35d` |

El pipeline comprueba el sha256 del modelo de caras antes de usarlo. El de transcripción (650 MB, ignorado por Git) lo
descarga y verifica `npm run setup:asr` una sola vez; en tiempo de ejecución no se descarga nada.
