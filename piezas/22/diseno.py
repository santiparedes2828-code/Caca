import sys, math; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#F4EFE6"; INK = "#22223B"; ORANGE = "#F2994A"; GREEN = "#27AE60"; RED = "#EB5757"; WOOD = "#C9A27A"
els = []
def ramp(x1, y1, x2, y2, t0=0):
    L = math.hypot(x2 - x1, y2 - y1); a = math.degrees(math.atan2(y2 - y1, x2 - x1))
    return S((x1 + x2) / 2, (y1 + y2) / 2, L, 26, t0, None, color=WOOD, r=13, rot=a, enter="none", z=2)
els += [ramp(160, 700, 880, 1010), ramp(900, 1330, 220, 1640)]
# Módulos
els += [S(230, 560, 240, 170, 0, None, color=INK, r=24, enter="none", z=3), E("megaphone", 230, 545, 120, 0, None, enter="none", z=4, mv=[{"t": 2.0, "rot": 0, "s": 1}, {"t": 2.15, "rot": -15, "s": 1.2}, {"t": 2.4, "rot": 0, "s": 1}])]
els += [P("ANUNCIO", 230, 440, 0, None, color=ORANGE, size=28, enter="none", z=5)]
els += [S(900, 1170, 300, 260, 0, None, color=INK, r=26, enter="none", z=3)]
for i, (dx, dy, w) in enumerate([(-60, -20, 110), (60, 30, 90)]):
    spin = [{"t": 0, "rot": 0}, {"t": 7.7, "rot": 720 * (1 if i else -1)}, {"t": 7.9, "rot": 735 * (1 if i else -1)}, {"t": 8.1, "rot": 720 * (1 if i else -1)}, {"t": 11.6, "rot": 720 * (1 if i else -1)}, {"t": 20.5, "rot": 3000 * (1 if i else -1)}]
    els += [E("gear", 900 + dx, 1170 + dy, w, 0, None, enter="none", z=4, mv=spin)]
els += [P("PRODUCTO", 900, 1020, 0, None, color="#56CCF2", fg=INK, size=28, enter="none", z=5)]
els += [S(220, 1830, 300, 220, 0, None, color=INK, r=26, enter="none", z=3), E("credit-card", 180, 1830, 120, 0, None, enter="none", z=4), E("shopping-cart", 280, 1840, 100, 0, None, enter="none", z=4)]
els += [P("PAGO", 220, 1700, 0, None, color=GREEN, size=28, enter="none", z=5)]
# Pelota VISITA
path = [{"t": 0, "x": 200, "y": 640}, {"t": 2.15, "x": 200, "y": 640}, {"t": 3.6, "x": 820, "y": 950}, {"t": 4.2, "x": 900, "y": 1110}, {"t": 7.8, "x": 900, "y": 1110}]
path += [{"t": 7.85 + k * 0.1, "x": 900 + (8 if k % 2 else -8), "y": 1110} for k in range(10)] + [{"t": 9.0, "x": 900}]
path += [{"t": 9.4 + k * 0.12, "x": 900 + (6 if k % 2 else -6), "y": 1110} for k in range(10)] + [{"t": 11.6, "x": 900, "y": 1110}, {"t": 12.2, "x": 860, "y": 1330}, {"t": 13.6, "x": 260, "y": 1610}, {"t": 14.1, "x": 220, "y": 1800}]
els += [{"type": "shape", "color": ORANGE, "z": 6, "grad": "radial-gradient(circle at 35% 30%, #FFD3A8, #F2994A 55%, #C46A1B)", "kf": [dict(path[0], w=80, h=80, r=40, o=1)] + path[1:]}]
els += [{"type": "pill", "text": "VISITA", "size": 22, "color": INK, "stroke": "#FFFFFF", "z": 7, "kf": [{"t": 0, "x": 200, "y": 575, "o": 1}] + [dict({"t": p["t"], "x": p["x"]}, **({"y": p["y"] - 65} if "y" in p else {})) for p in path[1:]] + [{"t": 14.1, "o": 1}, {"t": 14.3, "o": 0}]}]
# Se traba / video más lindo / explicación
els += [P("SE TRABA", 660, 1060, 7.8, 11.4, color=RED, size=34, enter="spin", z=8)]
els += [S(1180, 1170, 200, 140, 9.2, 11.4, color="transparent", r=16, stroke=ORANGE, sw=6, enter="drop", z=6, rot=6), E("sparkles", 1180, 1170, 90, 9.3, 11.4, enter="spin", z=7)]
els += [T("+ video lindo", 1180, 1270, 9.4, 11.4, size=30, color=INK, w=260, enter="up", z=7)]
els += [S(900, 1170, 300, 260, 11.3, 11.9, color="rgba(39,174,96,0.0)", r=26, stroke=GREEN, sw=8, enter="pop", z=6)]
els += [S(1180, 1100, 220, 120, 11.3, None, color=GREEN, r=16, enter="right", z=6, mv=[{"t": 11.8, "x": 1180}, {"t": 12.1, "x": 1100}])]
els += [T("+ EXPLICACIÓN", 1180, 1100, 11.35, None, size=26, color="#FFFFFF", w=220, enter="right", z=7, mv=[{"t": 11.8, "x": 1180}, {"t": 12.1, "x": 1100}])]
els += [E("check-mark-button", 220, 1830, 150, 14.1, None, enter="spin", z=8)]
# Fijos
els += [T("TU TIENDA,\nUNA MÁQUINA", 540, 300, 0, 2.05, size=96, color=INK, enter="none", fixed=True)]
els += [T("UN VIDEO MÁS LINDO\nNO ARREGLA TODO", 540, 300, 9.2, 11.25, size=72, color=RED, letters=True, fixed=True)]
els += [T("LA EXPERIENCIA\nCOMPLETA IMPORTA", 540, 300, 13.4, 15.9, size=78, color=INK, letters=True, fixed=True)]
els += [S(540, 960, 1080, 1920, 16.0, None, color=INK, enter="mask", mask="circle", fixed=True, z=30)]
els += [T("¿EN QUÉ PARTE\nSE TRABA TU\nRECORRIDO?", 540, 760, 16.1, None, size=100, color="#FFFFFF", letters=True, fixed=True, z=31)]
els += [P("DEMOSTRACIÓN · TIENDA FICTICIA", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=40)]
def at(x, y, s, rot=0):
    return {"x": -(x - 540) * s, "y": -(y - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at(420, 760, 1.25, -3)), dict(t=2.0, **at(420, 760, 1.25, -3)), dict(t=3.6, **at(700, 920, 1.15, 4)), dict(t=4.4, **at(900, 1120, 1.4, 0)), dict(t=5.5, **at(900, 1120, 1.42, 0)),
       dict(t=6.0, **at(260, 1760, 1.3, -4)), dict(t=7.2, **at(260, 1760, 1.32, -4)), dict(t=7.7, **at(900, 1130, 1.5, 6)), dict(t=9.0, **at(900, 1130, 1.5, 6)),
       dict(t=9.4, **at(1000, 1150, 1.15, -2)), dict(t=11.2, **at(1000, 1150, 1.18, -2)), dict(t=11.6, **at(950, 1150, 1.3, 0)), dict(t=13.6, **at(300, 1600, 1.1, -3)), dict(t=14.3, **at(260, 1780, 1.4, 0)),
       dict(t=15.0, **at(560, 1350, 0.53, 0)), dict(t=15.9, **at(560, 1350, 0.52, 0))]
save("22", {
    "end": 20.5, "accent": ORANGE, "capStyle": "karaoke", "capColor": "#FFFFFF", "capY": 1330,
    "keys": [],
    "scenes": [{"start": 0, "bg": BG, "fx": "paper"}],
    "cam": cam, "shakes": [{"t": 2.15, "a": 12}, {"t": 7.8, "a": 20}, {"t": 9.4, "a": 10}, {"t": 14.1, "a": 12}],
    "sfx": [{"t": 2.15, "name": "hit", "v": 0.25}, {"t": 2.3, "name": "whoosh", "v": 0.25}, {"t": 4.2, "name": "click"}, {"t": 6.0, "name": "whoosh", "v": 0.25}, {"t": 7.8, "name": "hit", "v": 0.3}, {"t": 9.3, "name": "brillo", "v": 0.2}, {"t": 11.4, "name": "pop"}, {"t": 12.2, "name": "whoosh", "v": 0.25}, {"t": 14.1, "name": "brillo", "v": 0.3}, {"t": 16.1, "name": "pop"}],
    "els": els,
})
