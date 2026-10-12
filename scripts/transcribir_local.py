"""Transcripción local con tiempos por token (sin enviar el audio a ningún proveedor).

Usa sherpa-onnx con NVIDIA Parakeet TDT 0.6B v3 (25 idiomas europeos, detecta el idioma solo).
Uso: python3 -I scripts/transcribir_local.py <audio.wav 16 kHz mono> <carpeta del modelo> <salida.json>

Escribe los tokens con su inicio, duración y probabilidad; el pipeline (autopilot/transcription/local.ts) los
une en palabras. Solo lee el audio y el modelo indicados; no descarga nada.
"""

import json
import os
import sys
import wave


def main() -> int:
    if len(sys.argv) != 4:
        print("uso: transcribir_local.py <audio.wav> <modelo> <salida.json>", file=sys.stderr)
        return 2
    audio, model, out = sys.argv[1:]
    try:
        import numpy as np
        import sherpa_onnx
    except ImportError as e:  # pragma: no cover - depende de la instalación
        print(f"falta una dependencia ({e.name}): ejecuta npm run setup:asr", file=sys.stderr)
        return 3
    need = ["encoder.int8.onnx", "decoder.int8.onnx", "joiner.int8.onnx", "tokens.txt"]
    missing = [f for f in need if not os.path.isfile(os.path.join(model, f))]
    if missing:
        print(f"faltan archivos del modelo en {model}: {', '.join(missing)} (npm run setup:asr)", file=sys.stderr)
        return 4
    with wave.open(audio) as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            print("el audio debe ser WAV mono de 16 bits", file=sys.stderr)
            return 5
        rate = w.getframerate()
        samples = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=os.path.join(model, "encoder.int8.onnx"),
        decoder=os.path.join(model, "decoder.int8.onnx"),
        joiner=os.path.join(model, "joiner.int8.onnx"),
        tokens=os.path.join(model, "tokens.txt"),
        num_threads=max(1, min(4, os.cpu_count() or 1)),
        model_type="nemo_transducer",
        feature_dim=128,
    )
    stream = rec.create_stream()
    stream.accept_waveform(rate, samples)
    rec.decode_stream(stream)
    r = stream.result
    result = {
        "text": r.text,
        "tokens": list(r.tokens),
        "timestamps": [float(x) for x in r.timestamps],
        "durations": [float(x) for x in getattr(r, "durations", [])],
        "logprobs": [float(x) for x in getattr(r, "ys_log_probs", [])],
        "lang": getattr(r, "lang", "") or None,
        "audioDurationSec": len(samples) / rate,
    }
    tmp = out + ".partial"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)
    os.replace(tmp, out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
