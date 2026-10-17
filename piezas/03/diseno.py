import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
CORAL = "#FF6F59"; INK = "#141414"; PAPER = "#F1EFEA"
BAG = "backpack"
els = []
els += [P("DEMOSTRACIÓN · MARCA FICTICIA", 540, 1230, 0, 21.0, color="#222", size=22, enter="none")]
# 0–3.7 · sin estudio de cine
els += [T("SIN ESTUDIO\nDE CINE", 540, 360, 0, 3.7, size=112, color=INK, enter="none", mv=[{"t": 0, "s": 1.08}, {"t": 3.6, "s": 1}])]
els += [E("movie-camera", 380, 820, 200, 2.2, 3.7), E("film-projector", 700, 820, 200, 2.35, 3.7)]
els += [S(540, 820, 760, 18, 2.9, 3.7, color="#E5383B", r=9, rot=-12, enter="left", z=6)]
# 3.8–6.9 · una foto, recorte y profundidad
els += [S(540, 860, 560, 680, 3.8, 6.9, color="#D9D6CF", r=12, mv=[{"t": 5.1, "o": 1}, {"t": 5.9, "o": 0.25}])]
els += [T("1 FOTO", 540, 330, 3.8, 6.9, size=110, color=INK, enter="up")]
els += [S(540, 1040, 300, 40, 5.6, 6.9, color="rgba(0,0,0,0.25)", r=20, enter="fade", z=2, mv=[{"t": 6.3, "w": 300}, {"t": 6.8, "w": 380}])]
for i, (dx, c) in enumerate([(-70, "#F5B7A8"), (70, "#FFD6A5")]):
    els += [S(540 + dx, 860 + dx // 3, 420, 520, 6.3 + i * 0.1, 6.9, color=c, r=20, enter="fade", z=1, mv=[{"t": 6.3, "x": 540}, {"t": 6.7, "x": 540 + dx * 2}])]
els += [E(BAG, 540, 860, 380, 3.9, 6.9, mv=[{"t": 5.6, "s": 1, "y": 860}, {"t": 6.2, "s": 1.18, "y": 820}])]
els += [E("scissors", 260, 520, 110, 5.1, 6.0, z=8, mv=[{"t": 5.2, "x": 260, "y": 520}, {"t": 5.9, "x": 820, "y": 1180, "rot": 90}])]
els += [T("RECORTE", 260, 1150, 5.1, 6.3, size=48, color=CORAL, w=400), T("PROFUNDIDAD", 540, 500, 6.3, 6.9, size=60, color=CORAL)]
# 7.0–10.9 · una idea por pantalla
els += [T("UNA IDEA\nPOR PANTALLA", 540, 350, 7.0, 10.9, size=96, color=INK, enter="up")]
for i, (lab, val, t) in enumerate([("QUÉ ES", "una mochila", 8.6), ("PARA QUIÉN", "quien viaja liviano", 9.3), ("QUÉ HACER", "escribir y pedirla", 10.0)]):
    y = 650 + i * 190
    els += [S(540, y, 820, 160, t, 10.9, color="#FFFFFF", r=26, shadow=True, enter="right")]
    els += [T(lab, 540, y - 30, t + 0.05, 10.9, size=34, color=CORAL, enter="right"), T(val, 540, y + 25, t + 0.1, 10.9, size=52, color=INK, enter="right")]
# 11.0–17 · el anuncio terminado (fondo coral y recortes)
els += [S(540, 860, 640, 640, 11.0, 17.0, color="#FFFFFF", r=320, enter="zoom", mv=[{"t": 11.3, "s": 1}, {"t": 12.2, "s": 1}, {"t": 12.5, "s": 1.25}, {"t": 14.0, "s": 1.25}, {"t": 14.3, "s": 1}])]
els += [E(BAG, 540, 860, 470, 11.05, 17.0, enter="zoom", mv=[{"t": 11.4, "s": 1, "y": 860, "rot": 0}, {"t": 12.2, "s": 1, "y": 860}, {"t": 12.5, "s": 1.7, "y": 700, "rot": -4}, {"t": 14.0, "s": 1.7, "y": 700}, {"t": 14.3, "s": 1, "y": 860, "rot": 6}, {"t": 16.8, "rot": -3}])]
els += [T("NÓMADA", 540, 330, 11.1, 17.0, size=140, color="#FFFFFF", enter="up")]
els += [T("TODO A MANO", 540, 1150, 12.3, 14.2, size=96, color=INK, enter="up", z=8)]
els += [E("pushpin", 790, 640, 100, 12.5, 14.2)]
els += [T("TU PRODUCTO TAMBIÉN", 540, 1145, 14.3, 17.0, size=70, color=INK, enter="up", z=8)]
for i, (x, y, r) in enumerate([(170, 620, -12), (910, 1060, 10)]):
    els += [S(x, y, 200, 200, 11.3 + i * 0.1, 17.0, color="#FFD6A5", r=24, rot=r, z=1)]
# 17–21 · CTA
els += [E(BAG, 540, 700, 300, 17.0, None, mv=[{"t": 17.3, "rot": 0}, {"t": 20.8, "rot": -5}])]
els += [T("ESCRIBIME\nPRODUCTO", 540, 1000, 17.1, None, size=110, color="#FFFFFF", enter="up")]
els += [T("para consultar", 540, 1150, 17.4, None, size=48, weight=500, color=INK, enter="up")]
save("03", {
    "end": 21.0, "accent": CORAL, "capBg": "rgba(15,15,15,0.82)", "capY": 1340,
    "keys": ["cine.", "foto,", "recortarla", "profundidad.", "pantalla:", "resultado.", "así."],
    "scenes": [{"start": 0, "bg": PAPER}, {"start": 3.8, "bg": "#E9E6E0"}, {"start": 7.0, "bg": PAPER}, {"start": 11.0, "bg": CORAL}, {"start": 17.0, "bg": CORAL}],
    "sfx": [{"t": 2.9, "name": "hit", "v": 0.2}, {"t": 5.2, "name": "click"}, {"t": 6.3, "name": "whoosh", "v": 0.2}, {"t": 8.6, "name": "pop"}, {"t": 9.3, "name": "pop"}, {"t": 10.0, "name": "pop"}, {"t": 12.3, "name": "whoosh", "v": 0.2}, {"t": 17.1, "name": "brillo", "v": 0.25}],
    "els": els,
})
