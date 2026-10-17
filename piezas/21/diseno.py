import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#1B2033"; CREAM = "#F3E9D2"; RED = "#FF3B3B"; W = "#FFFFFF"; DIM = "#7C849C"
BX, BY, FLOOR = 300, 620, 940  # posición inicial de la pelota y altura de apoyo
els = []
ball = "radial-gradient(circle at 35% 30%, #FF8A8A 0%, #FF3B3B 45%, #C21818 100%)"
# Plataforma fija + borde (bisagra) que se dobla en el final dos
els += [S(440, 1000, 640, 40, 0, None, color=CREAM, r=20, enter="none", z=2)]
els += [S(840, 1000, 180, 40, 0, None, color=CREAM, r=20, enter="none", z=2, mv=[{"t": 8.4, "rot": 0, "x": 840, "y": 1000}, {"t": 9.1, "rot": -38, "x": 830, "y": 948}, {"t": 10.6, "rot": -38}, {"t": 11.0, "rot": 0, "x": 840, "y": 1000}])]
# Pelota: caída, rebote, rodar al borde | final 1 | rebobinado | final 2 | vuelve al inicio
mv = [{"t": 0, "x": BX, "y": BY, "rot": 0}, {"t": 1.8, "x": BX, "y": BY}, {"t": 2.35, "y": FLOOR}, {"t": 2.75, "y": 780}, {"t": 3.1, "y": FLOOR},
      {"t": 4.6, "x": 740, "y": FLOOR, "rot": 300}, {"t": 5.6, "x": 880, "y": FLOOR, "rot": 420}, {"t": 6.7, "x": 980, "y": 2300, "rot": 640},
      {"t": 7.3, "x": BX, "y": BY, "rot": 0}, {"t": 7.6, "y": FLOOR}, {"t": 7.8, "y": 820}, {"t": 7.95, "y": FLOOR}, {"t": 8.5, "x": 760, "y": FLOOR, "rot": 300},
      {"t": 9.1, "x": 790, "y": 900, "rot": 330}, {"t": 10.3, "x": BX, "y": FLOOR, "rot": 0}, {"t": 10.75, "x": BX, "y": BY}]
els += [{"type": "shape", "color": RED, "grad": ball, "z": 5, "kf": [dict(mv[0], w=120, h=120, r=60, o=1)] + mv[1:]}]
els += [{"type": "shape", "color": "rgba(0,0,0,0.35)", "z": 1, "kf": [{"t": 0, "x": BX, "y": 1030, "w": 120, "h": 18, "r": 9, "o": 0.6}, {"t": 1.8, "x": BX, "o": 0.3, "w": 60}, {"t": 2.35, "o": 0.7, "w": 130}, {"t": 2.75, "o": 0.4, "w": 80}, {"t": 3.1, "o": 0.7, "w": 130}, {"t": 4.6, "x": 740}, {"t": 5.6, "x": 900, "o": 0}, {"t": 7.3, "x": BX, "o": 0.3}, {"t": 7.6, "o": 0.7}, {"t": 8.5, "x": 760}, {"t": 10.3, "x": BX}, {"t": 10.75, "o": 0.6, "w": 120}]}]
# Fijos: promesa, finales y comparación
els += [T("ESTE REEL TIENE\nDOS FINALES", 540, 330, 0, 1.75, size=88, color=W, enter="none", fixed=True)]
els += [T("MISMO COMIENZO", 540, 330, 1.8, 5.25, size=80, color=DIM, enter="mask", fixed=True)]
els += [S(540, 330, 520, 130, 5.3, 7.2, color=RED, r=65, enter="pop", fixed=True), T("FINAL 1", 540, 330, 5.35, 7.2, size=80, color=W, enter="pop", fixed=True)]
els += [T("se cae.", 540, 470, 6.3, 7.2, size=60, weight=500, color=W, enter="up", fixed=True)]
els += [S(540, 330, 520, 130, 7.3, 11.3, color=CREAM, r=65, enter="pop", fixed=True), T("FINAL 2", 540, 330, 7.35, 11.3, size=80, color=BG, enter="pop", fixed=True)]
els += [T("vuelve al inicio", 540, 470, 9.7, 11.3, size=60, weight=500, color=CREAM, enter="up", fixed=True)]
els += [S(540, 960, 1080, 1920, 11.35, 15.25, color="rgba(27,32,51,0.94)", enter="fade", fixed=True, z=10)]
for i, (lab, sub, c, emo) in enumerate([("1", "SE CAE", RED, "down-arrow"), ("2", "VUELVE", CREAM, "counterclockwise-arrows-button")]):
    x = 300 + i * 480
    els += [S(x, 840, 400, 520, 11.5 + i * 0.3, 15.25, color="#262C44", r=30, enter="flip", fixed=True, z=11)]
    els += [T(lab, x, 680, 11.55 + i * 0.3, 15.25, size=150, color=c, w=360, enter="flip", fixed=True, z=12)]
    els += [E(emo, x, 860, 140, 11.7 + i * 0.3, 15.25, enter="spin", fixed=True, z=12)]
    els += [T(sub, x, 1010, 11.6 + i * 0.3, 15.25, size=54, color=W, w=360, enter="flip", fixed=True, z=12)]
els += [T("UNA DECISIÓN\nCAMBIA TODO", 540, 330, 11.4, 15.25, size=80, color=W, letters=True, fixed=True, z=12)]
els += [T("¿QUÉ FINAL\nPUBLICARÍAS VOS?", 540, 330, 15.3, None, size=86, color=W, letters=True, fixed=True)]
els += [P("1 O 2", 540, 520, 16.7, None, color=RED, size=44, enter="spin", fixed=True)]
cam = [{"t": 0, "x": 0, "y": 0, "s": 1, "rot": 0}, {"t": 1.8, "s": 1.0}, {"t": 2.4, "s": 1.06, "y": -20}, {"t": 4.6, "s": 1.15, "x": -150, "y": -40, "rot": -2}, {"t": 5.6, "s": 1.15, "x": -170},
       {"t": 6.6, "s": 1.0, "x": -120, "y": -520, "rot": 4}, {"t": 7.2, "s": 1.0, "x": -120, "y": -560}, {"t": 7.3, "x": 0, "y": 0, "s": 1, "rot": 0}, {"t": 8.5, "s": 1.15, "x": -150, "y": -40, "rot": 2},
       {"t": 9.2, "s": 1.2, "x": -180, "y": -40, "rot": -3}, {"t": 10.8, "s": 1, "x": 0, "y": 0, "rot": 0}]
save("21", {
    "end": 21.0, "accent": RED, "capStyle": "kinetic", "capColor": "#FFFFFF", "capY": 1330,
    "keys": ["cae,", "rebota", "borde.", "uno:", "dos:", "dobla", "inicio.", "decisión", "vos?"],
    "scenes": [{"start": 0, "bg": BG, "fx": "grid"}, {"start": 7.3, "bg": "#20263D", "tr": "zoom", "fx": "grid"}, {"start": 15.3, "bg": BG, "tr": "cut", "fx": "grid"}],
    "cam": cam, "shakes": [{"t": 2.35, "a": 10}, {"t": 3.1, "a": 6}, {"t": 7.6, "a": 8}, {"t": 9.1, "a": 8}],
    "sfx": [{"t": 2.35, "name": "hit", "v": 0.25}, {"t": 3.1, "name": "pop", "v": 0.2}, {"t": 5.6, "name": "whoosh", "v": 0.3}, {"t": 7.3, "name": "whoosh", "v": 0.35}, {"t": 7.6, "name": "hit", "v": 0.2}, {"t": 8.5, "name": "click"}, {"t": 9.1, "name": "pop"}, {"t": 10.75, "name": "brillo", "v": 0.25}, {"t": 11.5, "name": "pop"}, {"t": 11.8, "name": "pop"}],
    "els": els,
})
