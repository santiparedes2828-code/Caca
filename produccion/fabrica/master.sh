set -e
IN=$1; OUT=$2
J=$(ffmpeg -hide_banner -i "$IN" -af "alimiter=limit=0.5:level=false,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
read a b c d e <<< "$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")"
ffmpeg -y -hide_banner -loglevel error -i "$IN" -c:v copy -af "alimiter=limit=0.5:level=false,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$a:measured_TP=$b:measured_LRA=$c:measured_thresh=$d:offset=$e:linear=true" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$OUT"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E " I:|Peak:"
