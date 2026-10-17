import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#E8ECF2"; WIN = "#FFFFFF"; SIDE = "#F2F4F8"; BAR = "#D5DBE5"; INK = "#1B1F2A"; BLUE = "#3B6CF6"; RED = "#FF4757"
els = []
def ui(t0, t1, ox=0, oy=0, sc=1.0, z=1, fixed=False):
    o = []
    X = lambda x: 540 + (x - 540) * sc + ox
    Y = lambda y: 820 + (y - 820) * sc + oy
    kw = dict(enter="none", fixed=fixed)
    o += [S(X(540), Y(820), 900 * sc, 700 * sc, t0, t1, color=WIN, r=20 * sc, shadow=True, z=z, **kw)]
    o += [S(X(540), Y(495), 900 * sc, 50 * sc, t0, t1, color="#E3E7EE", r=20 * sc, z=z + 1, **kw)]
    for i, c in enumerate(["#FF5F57", "#FEBC2E", "#28C840"]):
        o += [S(X(120 + i * 34), Y(495), 18 * sc, 18 * sc, t0, t1, color=c, r=9 * sc, z=z + 2, **kw)]
    o += [S(X(205), Y(845), 230 * sc, 650 * sc, t0, t1, color=SIDE, r=0, z=z + 1, **kw)]
    for i in range(6):
        o += [S(X(205), Y(580 + i * 80), 180 * sc, 46 * sc, t0, t1, color=BLUE if i == 1 else BAR, r=10 * sc, z=z + 2, **kw)]
    for i, w in enumerate([520, 460, 540, 380, 500, 300]):
        o += [S(X(390 + w / 2), Y(600 + i * 70), w * sc, 24 * sc, t0, t1, color=BAR, r=12 * sc, z=z + 2, **kw)]
    o += [S(X(840), Y(1095), 230 * sc, 66 * sc, t0, t1, color=BLUE, r=33 * sc, z=z + 2, **kw)]
    o += [T("ANCLAR NOTA", X(840), Y(1095), t0, t1, size=28 * sc, color="#FFFFFF", w=230 * sc, z=z + 3, **kw)]
    return o
els += ui(0, 14.15)
els += [P("DEMOSTRACIÓN · APP FICTICIA", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=40)]
# cursor
cur = [{"t": 0, "x": 700, "y": 700}, {"t": 7.8, "x": 700, "y": 700}, {"t": 9.6, "x": 820, "y": 1060}, {"t": 10.5, "x": 840, "y": 1090}]
els += [S(700, 700, 40, 50, 0, 14.15, color=INK, tri=True, rot=-25, enter="none", z=20, mv=cur)]
# tooltip del detalle
els += [S(840, 1010, 330, 60, 10.6, 14.15, color=INK, r=14, enter="up", z=18), T("fija la nota arriba", 840, 1010, 10.65, 14.15, size=28, color="#FFFFFF", w=320, enter="up", z=19)]
els += [S(840, 1095, 280, 110, 10.9, 14.15, color="transparent", r=55, stroke=RED, sw=6, enter="spin", z=18)]
# Fijos
els += [T("ZOOM EN TODO", 540, 300, 0, 6.85, size=96, color=INK, enter="none", fixed=True, z=30, mv=[{"t": 0.6 + k * 0.6, "rot": (2 if k % 2 else -2)} for k in range(10)])]
els += [S(540, 960, 1080, 1920, 6.9, 7.75, color="rgba(20,22,30,0.72)", enter="fade", fixed=True, z=28)]
els += [T("¿QUÉ\nIMPORTA?", 540, 860, 6.9, 7.75, size=200, color="#FFFFFF", enter="zoom", fixed=True, z=30)]
els += [T("PLANO QUIETO", 540, 300, 7.8, 10.85, size=96, color=INK, enter="mask", fixed=True, z=30)]
els += [T("UN ZOOM\nCON RAZÓN", 540, 320, 10.9, 14.15, size=96, color=BLUE, letters=True, fixed=True, z=30)]
# comparación final
els += [S(270, 860, 520, 1100, 14.2, 17.85, color="#D9DEE7", enter="left", fixed=True, z=5), S(810, 860, 520, 1100, 14.35, 17.85, color="#DCE6FF", enter="right", fixed=True, z=5)]
els += ui(14.3, 17.85, ox=-270, oy=60, sc=0.5, z=6, fixed=True)
els += ui(14.45, 17.85, ox=270, oy=60, sc=0.5, z=6, fixed=True)
els += [S(810 + (840 - 540) * 0.5, 820 + (1095 - 820) * 0.5 + 60, 150, 60, 14.9, 17.85, color="transparent", r=30, stroke=RED, sw=5, enter="spin", fixed=True, z=12)]
els += [T("MOVER\nCOSAS", 270, 420, 15.4, 17.85, size=62, color=INK, w=480, enter="drop", fixed=True, z=12)]
els += [T("DIRIGIR\nLA MIRADA", 810, 420, 16.5, 17.85, size=62, color=BLUE, w=480, enter="drop", fixed=True, z=12)]
# CTA
els += [S(540, 960, 1080, 1920, 17.9, None, color=INK, enter="mask", mask="circle", fixed=True, z=35)]
els += [E("bookmark", 540, 600, 170, 18.0, None, enter="drop", fixed=True, z=36)]
els += [T("GUARDÁ ESTA\nCOMPARACIÓN", 540, 850, 18.1, None, size=100, color="#FFFFFF", letters=True, fixed=True, z=36)]
# Cámara: zooms sin foco (moderados), quieta, y un único zoom intencional
def at(x, y, s):
    return {"x": -(x - 540) * s, "y": -(y - 960) * s, "s": s}
rnd = [(300, 600), (780, 900), (420, 1050), (700, 560), (250, 900), (820, 700), (500, 800), (300, 1000), (760, 1050), (600, 650), (400, 700)]
cam = []
for k, (x, y) in enumerate(rnd):
    t = k * 0.62
    cam += [dict(t=t, **at(x, y, 1.35 + (k % 3) * 0.12)), dict(t=t + 0.5, **at(x, y, 1.4 + (k % 3) * 0.12))]
cam += [dict(t=6.85, **at(540, 820, 1.3)), dict(t=7.8, **at(540, 900, 1.0)), dict(t=10.85, **at(540, 900, 1.0)), dict(t=11.6, **at(840, 1060, 2.0)), dict(t=14.1, **at(840, 1060, 2.05)), dict(t=14.2, **at(540, 960, 1.0))]
save("18", {
    "end": 22.0, "accent": BLUE, "capStyle": "box", "capBg": "rgba(27,31,42,0.9)", "capY": 1330,
    "keys": ["confusa.", "zoom,", "importa.", "quieto", "detalle.", "razón.", "mirada."],
    "scenes": [{"start": 0, "bg": BG, "fx": "dots"}, {"start": 14.2, "bg": "#F4F6FA", "tr": "whip", "fx": "none"}],
    "cam": cam, "shakes": [{"t": 6.9, "a": 12}],
    "sfx": [{"t": 0.62 * k, "name": "whoosh", "v": 0.12} for k in range(1, 11)] + [{"t": 6.9, "name": "hit", "v": 0.3}, {"t": 10.6, "name": "pop"}, {"t": 10.9, "name": "brillo", "v": 0.25}, {"t": 14.2, "name": "whoosh", "v": 0.3}, {"t": 18.1, "name": "pop"}],
    "els": els,
})
