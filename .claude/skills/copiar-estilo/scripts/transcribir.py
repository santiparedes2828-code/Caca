"""Transcribe con Whisper (faster-whisper) y guarda los tiempos por palabra.

Uso: python3 -I transcribir.py <audio_o_video> <salida_words.json> [--modelo small] [--idioma es]

Salida con el mismo formato que ElevenLabs Scribe, para que cortar_silencios.py acepte ambos:
  {"words": [{"text": "Hola", "type": "word", "start": 0.12, "end": 0.40}, ...]}

Necesita descargar el modelo de huggingface.co la primera vez. Si la red lo bloquea,
el script lo dice y sale con código 2: entonces usa la transcripción de ElevenLabs
(creative_transcribe_audio, ver SKILL.md) o pide al usuario que permita huggingface.co.
"""

import argparse
import json
import sys

p = argparse.ArgumentParser()
p.add_argument("entrada")
p.add_argument("salida")
p.add_argument("--modelo", default="small")
p.add_argument("--idioma", default="es")
args = p.parse_args()

try:
    from faster_whisper import WhisperModel
except ImportError:
    sys.exit("Falta faster-whisper: pip install --break-system-packages faster-whisper")

try:
    model = WhisperModel(args.modelo, device="cpu", compute_type="int8")
except Exception as e:  # sin red hacia huggingface.co
    print(f"No se pudo cargar el modelo '{args.modelo}': {e}", file=sys.stderr)
    sys.exit(2)

segments, _ = model.transcribe(args.entrada, language=args.idioma, word_timestamps=True, vad_filter=False)
words = [
    {"text": w.word.strip(), "type": "word", "start": round(w.start, 3), "end": round(w.end, 3)}
    for s in segments
    for w in (s.words or [])
    if w.word.strip()
]
json.dump({"words": words}, open(args.salida, "w"), ensure_ascii=False, indent=1)
print(f"{len(words)} palabras -> {args.salida}")
