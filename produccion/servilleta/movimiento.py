"""Mide si la imagen se mueve: compara cada cuadro con el de 0,3 s después (a 10 cuadros/s, en gris y a 1/10 de tamaño).
Imprime la diferencia media (0–255) mínima, los percentiles y los tramos donde casi no cambia nada.
Uso: python3 -I movimiento.py video.mp4 [umbral=1.5]
"""
import subprocess
import sys

import numpy as np

path = sys.argv[1]
umbral = float(sys.argv[2]) if len(sys.argv) > 2 else 1.5
w, h = 108, 192
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps=10,scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(fr[3:] - fr[:-3]).mean(axis=(1, 2))
print(f"{len(fr)} cuadros · diferencia a 0,3 s: mín {d.min():.2f} · p5 {np.percentile(d, 5):.2f} · mediana {np.median(d):.2f}")
bajos = [(i / 10, v) for i, v in enumerate(d) if v < umbral]
print(f"tramos por debajo de {umbral}: {len(bajos)}" + ("" if not bajos else " → " + ", ".join(f"{t:.1f}s ({v:.2f})" for t, v in bajos[:20])))
