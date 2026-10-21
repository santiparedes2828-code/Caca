"""Perfil superior de cada letra del logo (fila del primer píxel opaco por columna), para que los rayos
rojos terminen siguiendo la silueta de "ANIME INDUSTRY". Escribe public/anime/logo/siluetas.json.

Uso: python3 -I scripts/silueta_logo.py public/anime/logo
"""
import json
import sys

import numpy as np
from PIL import Image

d = sys.argv[1]
capas = json.load(open(f"{d}/capas.json"))
STEP = 3
out = {}
for l in capas["letters"]:
    a = np.asarray(Image.open(f"{d}/{l['name']}.png"))[..., 3]
    tops = []
    for x in range(0, a.shape[1], STEP):
        col = np.where(a[:, x] > 40)[0]
        tops.append(int(col[0]) if len(col) else -1)
    out[l["name"]] = {"step": STEP, "tops": tops}
json.dump(out, open(f"{d}/siluetas.json", "w"))
print(len(out), "letras")
