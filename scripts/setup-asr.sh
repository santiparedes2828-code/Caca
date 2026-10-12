#!/usr/bin/env bash
# Transcripción local (opcional): instala sherpa-onnx y descarga NVIDIA Parakeet TDT 0.6B v3 (int8, ~650 MB) en
# models/asr/. Con esto el pipeline transcribe con tiempos por palabra sin enviar el audio a ningún proveedor.
# Uso: npm run setup:asr
set -euo pipefail
cd "$(dirname "$0")/.."

NAME=sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8
URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$NAME.tar.bz2"
DEST=models/asr

if [ ! -x .venv/bin/python ]; then python3 -m venv .venv; fi
.venv/bin/pip install -q -r requirements-asr.txt

if [ ! -f "$DEST/$NAME/encoder.int8.onnx" ]; then
  mkdir -p "$DEST"
  echo "Descargando $NAME (~650 MB)…"
  curl -fL --retry 3 -o "$DEST/$NAME.tar.bz2.partial" "$URL"
  mv "$DEST/$NAME.tar.bz2.partial" "$DEST/$NAME.tar.bz2"
  tar xjf "$DEST/$NAME.tar.bz2" -C "$DEST"
  rm "$DEST/$NAME.tar.bz2"
fi

# Los archivos tienen que ser exactamente los comprobados (ver models/README.md)
cd "$DEST/$NAME"
sha256sum -c - <<'EOF'
acfc2b4456377e15d04f0243af540b7fe7c992f8d898d751cf134c3a55fd2247  encoder.int8.onnx
179e50c43d1a9de79c8a24149a2f9bac6eb5981823f2a2ed88d655b24248db4e  decoder.int8.onnx
3164c13fc2821009440d20fcb5fdc78bff28b4db2f8d0f0b329101719c0948b3  joiner.int8.onnx
d58544679ea4bc6ac563d1f545eb7d474bd6cfa467f0a6e2c1dc1c7d37e3c35d  tokens.txt
EOF
echo "Transcripción local lista: $DEST/$NAME"
