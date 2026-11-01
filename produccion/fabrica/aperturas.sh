#!/usr/bin/env bash
# Fábrica viral · renderiza la apertura (primeros segundos) de cada variante de gancho y arma una hoja para comparar.
# Uso: bash produccion/fabrica/aperturas.sh <slug> <cantidad de variantes> [cuadros=239]
# Composiciones esperadas: Fabrica-<slug>-<v>. Salida: out/<slug>/apertura_<v>.mp4 y out/<slug>/aperturas.png
set -e
SLUG=$1
N=$2
FR=${3:-239}
mkdir -p out/$SLUG
FILAS=""
for v in $(seq 1 $N); do
  npx remotion render Fabrica-$SLUG-$v out/$SLUG/apertura_$v.mp4 --frames=0-$FR --scale=0.5 --concurrency=4 2>&1 | tail -1
  ffmpeg -y -loglevel error -i out/$SLUG/apertura_$v.mp4 -vf "fps=2,scale=150:-1,tile=16x1" -frames:v 1 out/$SLUG/apertura_$v.png
  FILAS="$FILAS -i out/$SLUG/apertura_$v.png"
done
ffmpeg -y -loglevel error $FILAS -filter_complex vstack=$N out/$SLUG/aperturas.png
echo "hoja: out/$SLUG/aperturas.png"
