#!/usr/bin/env bash
# Descarga la voz de una pieza y prepara las dos copias (48 kHz para el vídeo, 16 kHz para transcribir). Uso: bash piezas/voz.sh 08 "<url>"
set -euo pipefail
id="$1"; mkdir -p "analisis-piezas/$id" public/piezas
curl -sS -o "analisis-piezas/$id/voz.mp3" "$2"
ffmpeg -y -v error -i "analisis-piezas/$id/voz.mp3" -ar 48000 "public/piezas/$id.wav"
ffmpeg -y -v error -i "analisis-piezas/$id/voz.mp3" -ac 1 -ar 16000 "analisis-piezas/$id/voz16.wav"
echo "voz $id ok"
