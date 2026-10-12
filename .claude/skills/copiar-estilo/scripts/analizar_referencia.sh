#!/usr/bin/env bash
# Extrae todo lo necesario para estudiar un vídeo de referencia.
# Uso: bash .claude/skills/copiar-estilo/scripts/analizar_referencia.sh <video> [carpeta_salida]
#
# Genera en la carpeta de salida (por defecto analisis/):
#   info.txt          duración, resolución, fps, códecs
#   frames/           2 fotogramas por segundo (f_001.jpg = 0,0 s; f_N = (N-1)/2 s)
#   escenas/          un fotograma por cada cambio de plano + tiempos.txt
#   hojas/            hojas de contacto de 14 fotogramas (7x2) numeradas: número n = n/2 segundos
#   audio.wav         audio mono 16 kHz
#   audio.txt         volumen medio/pico, loudness integrada y silencios (> 0,25 s)
#   envolvente.txt    nivel cada 0,25 s (para ver voz, pausas y golpes)
set -euo pipefail

VIDEO="$1"
OUT="${2:-analisis}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$OUT/frames" "$OUT/escenas" "$OUT/hojas"

ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels \
  -of default=nw=1 "$VIDEO" > "$OUT/info.txt"

ffmpeg -v error -y -i "$VIDEO" -vf "fps=2,scale=360:-1" "$OUT/frames/f_%03d.jpg"

ffmpeg -i "$VIDEO" -vf "select='gt(scene,0.25)',showinfo,scale=360:-1" -vsync vfr "$OUT/escenas/s_%03d.jpg" 2>&1 \
  | grep -oE "pts_time:[0-9.]+" | cut -d: -f2 > "$OUT/escenas/tiempos.txt" || true

ffmpeg -v error -y -pattern_type glob -i "$OUT/frames/f_*.jpg" \
  -vf "scale=240:-1,drawtext=text='%{n}':x=5:y=5:fontsize=28:fontcolor=yellow:box=1:boxcolor=black,tile=7x2" \
  "$OUT/hojas/hoja_%d.jpg"

if ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$VIDEO" | grep -q audio; then
  ffmpeg -v error -y -i "$VIDEO" -vn -ac 1 -ar 16000 "$OUT/audio.wav"
  {
    ffmpeg -i "$VIDEO" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"
    ffmpeg -i "$VIDEO" -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary | grep -E "I:|LRA:|Peak:"
    echo "Silencios (> 0,25 s, -35 dB):"
    ffmpeg -i "$VIDEO" -af "silencedetect=n=-35dB:d=0.25" -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+" | paste - - || true
  } > "$OUT/audio.txt"
  python3 -I "$DIR/envolvente_audio.py" "$OUT/audio.wav" > "$OUT/envolvente.txt"
else
  echo "Sin pista de audio" > "$OUT/audio.txt"
fi

echo "Análisis en $OUT/:"
cat "$OUT/info.txt"
echo "Cortes de plano: $(tr '\n' ' ' < "$OUT/escenas/tiempos.txt")"
echo "Fotogramas: $(ls "$OUT/frames" | wc -l) · Hojas de contacto: $(ls "$OUT/hojas" | wc -l)"
