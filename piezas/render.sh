#!/usr/bin/env bash
# Renderiza una pieza: MP4 (H.264 + AAC, −14 LUFS), portada PNG y hoja de control. Uso: bash piezas/render.sh 01
set -euo pipefail
id="$1"; out="crecimiento/contenido/30piezas"; work="analisis-piezas/$id"
mkdir -p "$out" "$work"
npx remotion render Pieza "$work/raw.mp4" --props="piezas/$id/props.json" --concurrency=4 --log=error
ffmpeg -y -v error -i "$work/raw.mp4" -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:v libx264 -crf 21 -preset medium -c:a aac -b:a 192k -movflags +faststart "$out/video_$id.mp4"
cp "piezas/$id/video_$id.srt" "$out/"
npx remotion still Pieza "$out/portada_$id.png" --props="piezas/$id/props.json" --frame="${2:-45}" --log=error
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/video_$id.mp4")
ffmpeg -y -v error -i "$out/video_$id.mp4" -vf "fps=10/$d,scale=180:-1,tile=10x1" -frames:v 1 "$work/hoja.jpg"
ffmpeg -i "$out/video_$id.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
echo "$d s"
