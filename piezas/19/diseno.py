import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#FFF4E8"; INK = "#1D1A2F"; PINK = "#FF4F8B"; TEAL = "#1FB6A6"; YEL = "#FFC53D"; GRAY = "#E7E2DA"
P1, P2, P3 = (540, 840), (1740, 840), (2940, 840)
els = []
# 0–3.2 · burbujas que repiten la pregunta
for i in range(7):
    left = i % 2 == 0
    x = 360 if left else 720; y = 460 + i * 120
    els += [S(x, y, 520, 96, 0.1 + i * 0.32, 5.55, color="#FFFFFF" if left else "#DCF8C6", r=40, enter="left" if left else "right", shadow=True, z=3, exit_="shrink")]
    els += [T("¿cómo funciona?", x, y, 0.12 + i * 0.32, 5.55, size=42, weight=700, color=INK, w=500, enter="left" if left else "right", z=4, exit_="shrink")]
els += [T("SIEMPRE\nLO MISMO", 540, 300, 0, 3.25, size=90, color=INK, enter="none", fixed=True, z=30)]
# 3.3–5.6 · el párrafo enorme
els += [S(540, 860, 860, 980, 3.3, 5.65, color="#FFFFFF", r=20, enter="up", shadow=True, z=6, mv=[{"t": 5.5, "s": 1, "rot": 0}, {"t": 5.65, "s": 0.1, "rot": 40}])]
for i in range(16):
    w = 760 - (i * 53) % 200
    els += [S(540 - (760 - w) / 2, 420 + i * 56, w, 22, 3.35 + i * 0.03, 5.6, color=GRAY, r=11, enter="fade", z=7, mv=[{"t": 3.4, "y": 420 + i * 56}, {"t": 5.4, "y": 300 + i * 56}, {"t": 5.6, "o": 0}])]
els += [T("PÁRRAFO\nENORME", 540, 300, 3.3, 5.6, size=90, color="#8C8577", enter="drop", fixed=True, z=30)]
els += [T("MOSTRALO.", 540, 300, 5.6, 6.35, size=120, color=PINK, enter="zoom", fixed=True, z=30)]
# Panel 1 · elegís
x, y = P1
els += [S(x, y, 900, 780, 5.7, None, color="#FFFFFF", r=40, enter="flip", z=1, shadow=True)]
els += [E("t-shirt", x, y - 50, 320, 5.9, None, enter="drop", z=3)]
for i, c in enumerate([PINK, TEAL, YEL, INK]):
    els += [S(x - 240 + i * 160, y + 200, 100, 100, 6.0 + i * 0.06, None, color=c, r=50, enter="pop", z=3)]
els += [S(x - 80, y + 200, 140, 140, 6.6, None, color="transparent", r=70, stroke=INK, sw=6, enter="spin", z=4)]
els += [T("1 · ELEGÍS", x, y - 300, 6.3, None, size=80, color=INK, enter="mask", z=4)]
# Panel 2 · personalizás
x, y = P2
els += [S(x, y, 900, 780, 6.9, None, color="#FFFFFF", r=40, enter="none", z=1, shadow=True)]
els += [E("t-shirt", x, y - 20, 400, 6.9, None, enter="none", z=3)]
els += [T("TU\nDISEÑO", x, y - 10, 7.5, None, size=46, color="#FFFFFF", w=220, z=4, letters=True)]
els += [E("artist-palette", x + 300, y + 230, 130, 7.6, None, enter="drop", z=5), E("pencil", x - 300, y + 230, 110, 7.7, None, enter="drop", z=5)]
els += [T("2 · PERSONALIZÁS", x, y - 300, 7.35, None, size=74, color=INK, enter="mask", z=4)]
# Panel 3 · recibís
x, y = P3
els += [S(x, y, 900, 780, 7.9, None, color="#FFFFFF", r=40, enter="none", z=1, shadow=True)]
els += [E("package", x - 120, y, 300, 8.3, None, enter="drop", z=3, mv=[{"t": 8.8, "x": x - 120}, {"t": 9.3, "x": x + 140}])]
els += [E("house", x + 230, y - 60, 220, 8.2, None, enter="pop", z=2)]
els += [T("3 · RECIBÍS", x, y - 300, 8.3, None, size=80, color=INK, enter="mask", z=4)]
# Barras de historia (fijas)
for i, t0 in enumerate([6.4, 7.4, 8.3]):
    els += [S(220 + i * 320, 230, 280, 10, 6.3, 11.2, color="rgba(29,26,47,0.2)", r=5, enter="fade", fixed=True, z=25)]
    els += [S(80 + i * 320, 230, 0, 10, t0, 11.2, color=INK, r=5, enter="none", fixed=True, z=26, mv=[{"t": t0, "w": 0, "x": 80 + i * 320}, {"t": t0 + 0.9, "w": 280, "x": 220 + i * 320}])]
# 9.4–11.2 · cada paso resuelve una duda (plano general)
for i, (q, p) in enumerate([("¿qué elijo?", P1), ("¿lo puedo cambiar?", P2), ("¿cómo llega?", P3)]):
    els += [P(q.upper(), p[0], p[1] + 330, 9.6 + i * 0.25, 11.25, color=PINK, size=60, enter="flip", z=8)]
els += [T("UNA DUDA\nPOR PASO", 540, 330, 9.4, 11.25, size=96, color=INK, letters=True, fixed=True, z=30)]
# 11.8–15.0 · vive en tu perfil
els += [S(540, 960, 1080, 1920, 11.3, 15.5, color=BG, enter="mask", mask="circle", fixed=True, z=12)]
els += [S(540, 840, 520, 860, 11.5, 15.5, color=INK, r=60, enter="up", fixed=True, z=13)]
for k in range(9):
    xx = 390 + (k % 3) * 150; yy = 640 + (k // 3) * 150
    c = PINK if k == 0 else ["#3B3657", "#4A4468"][k % 2]
    els += [S(xx, yy, 140, 140, 11.7 + k * 0.04, 15.5, color=c, r=10, enter="pop", fixed=True, z=14)]
els += [E("t-shirt", 390, 640, 90, 12.0, 15.5, enter="pop", fixed=True, z=15), E("pushpin", 445, 585, 50, 12.6, 15.5, enter="drop", fixed=True, z=16)]
els += [T("FIJADO EN\nTU PERFIL", 540, 1130, 12.4, 15.5, size=48, color="#FFFFFF", enter="up", fixed=True, z=15)]
els += [T("EXPLICA\nTU OFERTA", 540, 300, 13.6, 15.5, size=90, color=INK, enter="mask", fixed=True, z=30)]
# CTA
els += [S(540, 960, 1080, 1920, 15.6, None, color=PINK, enter="mask", mask="circle", fixed=True, z=35)]
els += [T("¿QUÉ PREGUNTA\nTE HACEN\nTODOS LOS DÍAS?", 540, 560, 15.7, None, size=82, color="#FFFFFF", letters=True, fixed=True, z=36)]
els += [S(540, 900, 760, 150, 17.6, None, color=INK, r=75, enter="pop", fixed=True, z=36)]
els += [T("ESCRIBIME OBJECIÓN", 540, 900, 17.65, None, size=58, color="#FFFFFF", enter="pop", fixed=True, z=37)]
els += [T("para armar tu video", 540, 1020, 18.0, None, size=46, weight=500, color="#FFFFFF", enter="up", fixed=True, z=37)]
els += [P("DEMOSTRACIÓN · TIENDA FICTICIA", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=40)]
def at(p, s, rot=0):
    return {"x": -(p[0] - 540) * s, "y": -(p[1] - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at((540, 900), 1.0)), dict(t=5.6, **at((540, 900), 1.0)), dict(t=6.3, **at((P1[0], 960), 0.95)), dict(t=7.1, **at((P1[0], 960), 0.97)),
       dict(t=7.35, **at((P2[0], 960), 0.95, -3)), dict(t=8.1, **at((P2[0], 960), 0.97, -3)), dict(t=8.3, **at((P3[0], 960), 0.95, 2)), dict(t=9.3, **at((P3[0], 960), 0.97, 2)),
       dict(t=9.7, **at((P2[0], 1040), 0.3, 0)), dict(t=11.2, **at((P2[0], 1040), 0.31, -1))]
save("19", {
    "end": 22.0, "accent": PINK, "capStyle": "karaoke", "capColor": "#FFFFFF", "capY": 1330,
    "keys": [],
    "scenes": [{"start": 0, "bg": BG, "fx": "dots"}],
    "cam": cam, "shakes": [{"t": 5.6, "a": 14}, {"t": 7.4, "a": 8}, {"t": 8.3, "a": 8}],
    "sfx": [{"t": 0.1 + i * 0.32, "name": "pop", "v": 0.25} for i in range(7)] + [{"t": 5.6, "name": "hit", "v": 0.3}, {"t": 7.3, "name": "whoosh", "v": 0.35}, {"t": 8.2, "name": "whoosh", "v": 0.35}, {"t": 9.6, "name": "whoosh", "v": 0.3}, {"t": 12.6, "name": "click"}, {"t": 17.6, "name": "pop"}],
    "els": els,
})
