#!/usr/bin/env bash
# Hoja de control por tiempos: bash piezas/hoja.sh NN 0.2 2 4.5 ...  → analisis-piezas/NN/tiempos.jpg
set -euo pipefail
id="$1"; shift; v="crecimiento/contenido/30piezas/video_$id.mp4"; w="analisis-piezas/$id"; ins=()
for t in "$@"; do ffmpeg -y -v error -ss "$t" -i "$v" -frames:v 1 -vf scale=270:-1 "$w/t_$t.png"; ins+=("$w/t_$t.png"); done
ffmpeg -y -v error $(printf -- "-i %s " "${ins[@]}") -filter_complex "hstack=inputs=$#" "$w/tiempos.jpg"
