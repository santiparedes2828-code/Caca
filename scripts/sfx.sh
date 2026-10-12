#!/usr/bin/env bash
# Efectos de sonido propios del proyecto (public/sfx/), sintetizados con ffmpeg: no dependen de bancos de
# sonidos de terceros ni de licencias externas. whoosh, pop, hit y click se hicieron igual en una sesión
# anterior (ruido filtrado y senos con envolvente); este script regenera «brillo».
set -euo pipefail
cd "$(dirname "$0")/.."

# brillo: campanitas agudas (do, mi, sol, do) con caída exponencial y trémolo, para las palabras que brillan
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.30*sin(2*PI*2093*t)*exp(-4.5*t)+0.24*sin(2*PI*2637*t)*exp(-5.5*t)+0.18*sin(2*PI*3136*t)*exp(-6.5*t)+0.12*sin(2*PI*4186*t)*exp(-8*t)':s=48000:d=0.9" \
  -af "afade=t=in:d=0.006,tremolo=f=11:d=0.35,aecho=0.8:0.6:60:0.25,alimiter=limit=0.6,aformat=channel_layouts=stereo" \
  -c:a pcm_s16le public/sfx/brillo.wav
echo "public/sfx/brillo.wav"
