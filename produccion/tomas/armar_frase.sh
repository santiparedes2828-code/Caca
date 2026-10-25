#!/bin/sh
# Monta la frase limpia «Hola. Les presento mi nuevo podcast.» con un trozo de cada toma (voz_full.wav, tiempos medidos).
V=produccion/tomas/voz_full.wav; D=public/audio/tomas; T=$(mktemp -d)
c(){ ffmpeg -v error -y -ss $2 -to $3 -i $V -af "afade=t=in:d=0.008,afade=t=out:st=$(python3 -c "print($3-$2-0.012)"):d=0.012" -ar 48000 -ac 1 $T/$1.wav; }
c p1 0.00 0.42      # toma 1: «Hola.»
c p2 3.785 4.375    # toma 2: «les presento»
c p3 8.355 8.90     # toma 3: «mi nuevo»
c p4 13.21 13.92    # toma 4: «podcast.»
ffmpeg -v error -y -f lavfi -t 0.15 -i anullsrc=r=48000:cl=mono -f lavfi -t 0.04 -i anullsrc=r=48000:cl=mono -f lavfi -t 0.06 -i anullsrc=r=48000:cl=mono \
  -i $T/p1.wav -i $T/p2.wav -i $T/p3.wav -i $T/p4.wav -filter_complex "[3][0][4][1][5][2][6]concat=n=7:v=0:a=1" $D/limpia.wav
