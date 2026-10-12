"""Quita un fondo liso (blanco o casi) de una foto de producto y guarda un PNG con transparencia.

Uso: python3 -I recortar_fondo.py <entrada.(png|jpg|webp)> <salida.png> [--tolerancia 28] [--sin-sombra]

Rellena desde los bordes los píxeles parecidos al color de las esquinas (flood fill), así no
borra zonas claras dentro del objeto. Suaviza el borde 1 px y recorta al contenido.
Para fondos complejos usa un modelo de recorte (ElevenLabs birefnet-v2-bg-removal o Higgsfield remove_background).
"""

import argparse
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

p = argparse.ArgumentParser()
p.add_argument("entrada")
p.add_argument("salida")
p.add_argument("--tolerancia", type=float, default=28)
p.add_argument("--sin-sombra", action="store_true", help="quita la sombra clara bajo objetos verticales (latas, botellas)")
a = p.parse_args()

img = Image.open(a.entrada).convert("RGB")
arr = np.asarray(img).astype(np.int16)
h, w, _ = arr.shape
fondo = np.median(np.array([arr[0, 0], arr[0, -1], arr[-1, 0], arr[-1, -1]]), axis=0)
parecido = np.sqrt(((arr - fondo) ** 2).sum(axis=2)) < a.tolerancia

vis = np.zeros((h, w), bool)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if parecido[y, x] and not vis[y, x]:
            vis[y, x] = True
            q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if parecido[y, x] and not vis[y, x]:
            vis[y, x] = True
            q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and parecido[ny, nx]:
            vis[ny, nx] = True
            q.append((ny, nx))

mask = ~vis
if a.sin_sombra:
    # Columnas del objeto medidas a media altura; debajo del objeto solo se conserva lo oscuro (el borde)
    cols = np.where(mask[h // 2])[0]
    x0, x1 = cols.min(), cols.max()
    mask[:, : max(0, x0 - 2)] = False
    mask[:, x1 + 3 :] = False
    oscuro = arr.mean(axis=2) < 215
    filas = np.where(oscuro[:, x0 + (x1 - x0) // 5 : x1 - (x1 - x0) // 5].any(axis=1))[0]
    mask[filas.max() + 2 :, :] = False
    mask[: max(0, filas.min() - 2), :] = False
alpha = Image.fromarray(np.where(mask, 255, 0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))
out = img.convert("RGBA")
out.putalpha(alpha)
# Encuadre al objeto: ignora píxeles casi transparentes del suavizado
ys, xs = np.where(np.asarray(alpha) > 128)
m = 12
out = out.crop((max(0, xs.min() - m), max(0, ys.min() - m), min(w, xs.max() + m), min(h, ys.max() + m)))
out.save(a.salida)
print(f"{a.salida}: {out.size[0]}x{out.size[1]}")
