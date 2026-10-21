"""Recorta a Charizard de la carta en capas (cuerpo y alas) y genera la carta sin Charizard (hueco rellenado).

Uso: python3 -I scripts/capas_charizard.py analisis6/charizard.jpg public/anime/charizard
Contorno trazado a mano sobre la carta original (747x1052) y afinado con GrabCut. Las alas se separan con su raíz
en el hombro; el cuerpo conserva un disco en cada raíz para tapar la unión al girar. Escribe capas.json con la caja
de las capas en píxeles de la carta original y los pivotes de las alas y la boca.
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
img = cv2.imread(src)
H, W = img.shape[:2]
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))

POLY = [(267,168),(296,170),(340,212),(395,262),(425,282),(470,280),(497,285),(495,140),(560,195),(615,255),(655,300),(655,338),
        (600,325),(540,300),(512,305),(530,330),(545,350),(520,360),(515,380),(560,410),(585,450),(590,475),(575,500),(555,520),
        (520,522),(500,505),(470,500),(445,515),(410,512),(400,480),(392,450),(360,447),(305,440),(275,430),(262,410),(272,398),
        (250,365),(238,340),(250,328),(270,302),(296,290),(282,240),(270,195)]
WING_L = [(262,160),(300,163),(345,208),(400,258),(432,280),(425,300),(395,298),(300,298),(276,240),(262,195)]
WING_R = [(490,130),(565,188),(622,252),(665,298),(665,345),(600,333),(540,308),(512,312),(498,300),(488,250)]
ROOT_L, ROOT_R, MOUTH = (405, 283), (500, 292), (262, 372)

poly = np.zeros((H, W), np.uint8)
cv2.fillPoly(poly, [np.array(POLY, np.int32)], 1)
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
mask[cv2.dilate(poly, k(14)) == 1] = cv2.GC_PR_BGD
mask[poly == 1] = cv2.GC_PR_FGD
mask[cv2.erode(poly, k(16)) == 1] = cv2.GC_FGD
bgd = np.zeros((1, 65)); fgd = np.zeros((1, 65))
cv2.grabCut(img, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(m)
m = np.where(lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
ff = m.copy(); cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 255); m |= cv2.bitwise_not(ff)
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k(2))

def poly_mask(pts):
    pm = np.zeros((H, W), np.uint8); cv2.fillPoly(pm, [np.array(pts, np.int32)], 255); return pm

wl = cv2.bitwise_and(m, poly_mask(WING_L)); wr = cv2.bitwise_and(m, poly_mask(WING_R))
disc = np.zeros((H, W), np.uint8); cv2.circle(disc, ROOT_L, 26, 255, -1); cv2.circle(disc, ROOT_R, 26, 255, -1)
body = cv2.bitwise_and(m, cv2.bitwise_not(cv2.bitwise_and(cv2.bitwise_or(wl, wr), cv2.bitwise_not(disc))))

x, y, w, h = cv2.boundingRect((m > 0).astype(np.uint8))
pad = 4; x, y = x - pad, y - pad; w, h = w + 2 * pad, h + 2 * pad
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
for name, layer in (("cuerpo", body), ("ala_izq", wl), ("ala_der", wr)):
    a = cv2.GaussianBlur(layer, (5, 5), 1.1)
    Image.fromarray(np.dstack([rgb, a])[y:y + h, x:x + w]).save(f"{out}/{name}.png")

# Carta sin Charizard: rellenar el hueco y suavizar
hole = cv2.dilate(m, k(7))
fill = cv2.inpaint(img, hole, 9, cv2.INPAINT_TELEA)
soft = cv2.GaussianBlur(fill, (0, 0), 3)
hm = (cv2.GaussianBlur(hole, (0, 0), 4) / 255.0)[..., None]
empty = (fill * (1 - hm) + soft * hm).astype(np.uint8)
Image.fromarray(cv2.cvtColor(empty, cv2.COLOR_BGR2RGB)).resize((660, 922), Image.LANCZOS).save(f"{out}/carta_vacia.png")

json.dump({"box": [x, y, w, h], "rootL": ROOT_L, "rootR": ROOT_R, "mouth": MOUTH, "card": [W, H]}, open(f"{out}/capas.json", "w"), indent=1)
print({"box": [x, y, w, h]})
