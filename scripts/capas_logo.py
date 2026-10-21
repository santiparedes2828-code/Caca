"""Separa el logo de Anime Industry en capas PNG con transparencia (sin redibujar nada).

Uso: python3 -I scripts/capas_logo.py analisis6/logo.jpg public/anime/logo
Escribe una PNG por letra (en orden de animación), rayos.png, eslogan.png, desde.png y capas.json
(posición de cada capa en la imagen original; el círculo blanco tiene centro (602,5; 425) y radio 506).
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as nd

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(int)
H, W, _ = im.shape
R, G, B = im[..., 0], im[..., 1], im[..., 2]
yy, xx = np.mgrid[:H, :W]
CX, CY = 602.5, 425
circle = ((xx - CX) ** 2 + (yy - CY) ** 2) < 500**2
white = im.min(2) > 200
ray = (R > 140) & (R - G > 35) & (np.abs(G - B) < 45) & (R > G)

# 1) Primer plano: lo que no está conectado con el borde del círculo a través de blanco o rayos
lab, _ = nd.label((white | ray) & circle)
ring = circle & ~(((xx - CX) ** 2 + (yy - CY) ** 2) < 480**2)
seeds = np.unique(lab[ring & (white | ray)])
fg = nd.binary_opening(circle & ~np.isin(lab, seeds[seeds > 0]), iterations=1)
lab2, _ = nd.label(fg)


def comp_at(x0, y0, x1, y1):
    """Componentes del primer plano cuyo recuadro cae dentro de (x0, y0, x1, y1) y tienen tamaño de letra."""
    m = np.zeros_like(fg)
    for i, sl in enumerate(nd.find_objects(lab2)):
        if sl is None:
            continue
        ys, xs = sl
        if ys.start >= y0 and ys.stop <= y1 and xs.start >= x0 and xs.stop <= x1 and (lab2[sl] == i + 1).sum() > 800:
            m |= lab2 == i + 1
    return m


def nonwhite_at(x0, y0, x1, y1):
    """Piezas rojas que se confunden con los rayos: mayor componente no blanco dentro del recuadro."""
    box = np.zeros_like(fg)
    box[y0:y1, x0:x1] = True
    lab3, n = nd.label(box & ~white)
    sizes = nd.sum(np.ones_like(lab3), lab3, range(1, n + 1))
    return nd.binary_fill_holes(lab3 == int(np.argmax(sizes)) + 1)


# Orden de animación: fila 1 y fila 2, de izquierda a derecha
LETTERS = [
    ("a", comp_at(340, 175, 448, 345)),
    ("n1", comp_at(436, 175, 600, 345)),
    ("figura", nonwhite_at(585, 170, 652, 338)),
    ("m", comp_at(640, 175, 790, 345)),
    ("e", comp_at(786, 175, 880, 345)),
    ("i", nonwhite_at(216, 335, 296, 466)),
    ("n2", comp_at(280, 335, 380, 470)),
    ("d", comp_at(376, 335, 492, 470)),
    ("u", nonwhite_at(492, 338, 598, 468)),
    ("s", comp_at(592, 335, 675, 470)),
    ("simbolo", comp_at(668, 325, 790, 470)),
    ("r", comp_at(782, 335, 898, 470)),
    ("y", comp_at(878, 335, 1015, 470)),
]
SLOGAN = comp_at(100, 425, 1100, 520)
DESDE = comp_at(395, 575, 835, 670)


def save(name, mask, soften=True):
    m = nd.binary_dilation(mask, iterations=1) if soften else mask
    alpha = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(__import__("PIL.ImageFilter").ImageFilter.GaussianBlur(0.7)))
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([im, alpha]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(rgba).save(f"{out}/{name}.png")
    return {"name": name, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}


layers = {"letters": [save(n, m) for n, m in LETTERS]}
used = np.zeros_like(fg)
for _, m in LETTERS:
    used |= nd.binary_dilation(m, iterations=2)
layers["slogan"] = save("eslogan", SLOGAN)
layers["desde"] = save("desde", DESDE)
used |= nd.binary_dilation(SLOGAN | DESDE, iterations=2)

# 2) Rayos: rojo sobre transparente (el blanco del círculo se dibuja aparte), fundidos en el borde cortado de la imagen
red = np.clip((R - (G + B) / 2 - 10) / 80, 0, 1)
edge = np.clip(yy / 140, 0, 1) * np.clip((H - 1 - yy) / 140, 0, 1)
a = (red * edge * circle * ~used * 255).astype(np.uint8)
Image.fromarray(np.dstack([im, a]).astype(np.uint8)).save(f"{out}/rayos.png")
layers["rays"] = {"name": "rayos", "x": 0, "y": 0, "w": W, "h": H}
layers["circle"] = {"cx": CX, "cy": CY, "r": 506}
json.dump(layers, open(f"{out}/capas.json", "w"), indent=1)
print(json.dumps(layers["letters"]))
