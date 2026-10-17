import sys, math; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
MAP = "#F3EDE2"; NAVY = "#0F2A44"; RED = "#D7263D"; BLUE = "#3E7CB1"; LIME = "#9BE564"
A, B, C = (330, 760), (760, 1560), (330, 2360)
els = []
# Caos inicial: flechas y cajas sin sentido
for i in range(14):
    x = 160 + (i * 173) % 780; y = 520 + (i * 211) % 820; r = (i * 67) % 180 - 90
    els += [S(x, y, 260, 8, 0.1 + i * 0.06, 4.9, color=[NAVY, RED, BLUE][i % 3], r=4, rot=r, enter="mask", z=3, exit_="shrink")]
    els += [S(x + 120 * math.cos(math.radians(r)), y + 120 * math.sin(math.radians(r)), 36, 36, 0.15 + i * 0.06, 4.9, color=[NAVY, RED, BLUE][i % 3], tri=True, rot=r + 90, enter="pop", z=3, exit_="shrink")]
for i in range(6):
    els += [S(200 + (i * 241) % 700, 560 + (i * 157) % 700, 150, 90, 0.3 + i * 0.1, 4.9, color="#FFFFFF", r=14, stroke=NAVY, sw=3, enter="pop", z=4, exit_="shrink")]
    els += [T("?", 200 + (i * 241) % 700, 560 + (i * 157) % 700, 0.35 + i * 0.1, 4.9, size=60, color=RED, enter="pop", z=5, exit_="shrink")]
els += [T("DIFÍCIL DE\nEXPLICAR", 540, 320, 0, 4.9, size=100, color=NAVY, enter="none", fixed=True, z=20)]
# Mapa: camino punteado A -> B -> C
def curve(p0, p1, n):
    pts = []
    for k in range(n + 1):
        u = k / n
        x = p0[0] + (p1[0] - p0[0]) * u + math.sin(u * math.pi) * 260
        y = p0[1] + (p1[1] - p0[1]) * u
        pts.append((x, y))
    return pts
path = curve(A, B, 14)[:-1] + curve(B, C, 14)
for k, (x, y) in enumerate(path):
    els += [S(x, y, 18, 18, 4.9 + k * 0.03, None, color=NAVY, r=9, enter="pop", z=1)]
def follow(t0, t1, seg):
    pts = path[seg[0]:seg[1] + 1]
    return [{"t": t0 + (t1 - t0) * i / (len(pts) - 1), "x": x, "y": y} for i, (x, y) in enumerate(pts)]
dot_mv = [{"t": 5.0, "x": A[0], "y": A[1]}] + follow(7.0, 7.9, (0, 14)) + follow(8.6, 9.4, (14, 28))
els += [S(A[0], A[1], 46, 46, 5.0, None, color=RED, r=23, enter="pop", z=8, shadow=True, mv=dot_mv)]
# Estación 1: reserva (teléfono con turnos)
ax, ay = A
els += [S(ax, ay, 300, 520, 5.2, None, color=NAVY, r=40, enter="flip", z=3, shadow=True)]
for i, h in enumerate(["10:00", "11:30", "13:00", "16:30"]):
    els += [S(ax, ay - 150 + i * 100, 230, 70, 5.4 + i * 0.08, None, color="#1E4166", r=14, enter="right", z=4, mv=[{"t": 6.5, "fill": "#1E4166"}, {"t": 6.6, "fill": LIME if i == 2 else "#1E4166"}])]
    els += [T(h, ax, ay - 150 + i * 100, 5.45 + i * 0.08, None, size=34, color="#FFFFFF", w=220, enter="right", z=5)]
els += [P("1 · RESERVA", ax, ay - 330, 6.1, None, color=RED, size=30, z=6, enter="drop")]
# Estación 2: confirmación + reloj
bx, by = B
els += [S(bx, by, 360, 300, 7.4, None, color="#FFFFFF", r=30, enter="flip", z=3, shadow=True)]
els += [E("check-mark-button", bx, by - 40, 120, 7.6, None, enter="spin", z=4)]
els += [T("TURNO\nCONFIRMADO", bx, by + 80, 7.7, None, size=36, color=NAVY, w=320, enter="up", z=4)]
els += [E("mantelpiece-clock", bx - 230, by - 150, 110, 8.0, None, enter="drop", z=5)]
els += [P("2 · CONFIRMACIÓN", bx, by - 210, 7.4, None, color=BLUE, size=30, z=6, enter="drop")]
# Estación 3: llega a su turno
cx, cy = C
els += [S(cx, cy, 380, 380, 9.0, None, color=NAVY, r=190, enter="zoom", z=3)]
els += [E("barber-pole", cx - 90, cy, 150, 9.2, None, enter="drop", z=4), E("chair", cx + 70, cy + 20, 170, 9.3, None, enter="drop", z=4)]
els += [P("3 · LLEGA", cx, cy - 250, 9.0, None, color=NAVY, size=30, z=6, enter="drop")]
# Compactar: los tres pasos en una pieza (capa fija)
els += [S(540, 960, 1080, 1920, 12.6, 16.6, color="rgba(15,42,68,0.94)", enter="fade", fixed=True, z=15)]
for i, (emo, lab) in enumerate([("mobile-phone", "RESERVA"), ("check-mark-button", "CONFIRMA"), ("barber-pole", "LLEGA")]):
    x = 220 + i * 320
    els += [S(x, 860, 270, 330, 12.7 + i * 0.15, 16.6, color="#FFFFFF", r=26, enter="flip", fixed=True, z=16)]
    els += [E(emo, x, 820, 120, 12.75 + i * 0.15, 16.6, enter="flip", fixed=True, z=17)]
    els += [T(lab, x, 950, 12.8 + i * 0.15, 16.6, size=38, color=NAVY, w=260, enter="flip", fixed=True, z=17)]
    if i < 2:
        els += [S(x + 160, 860, 50, 8, 13.2 + i * 0.15, 16.6, color=LIME, r=4, enter="mask", fixed=True, z=17)]
els += [T("UNA DUDA MENOS", 540, 1150, 15.0, 16.6, size=70, color=LIME, letters=True, fixed=True, z=17)]
els += [T("TRES PASOS,\nTRES ESCENAS", 540, 320, 10.4, 12.6, size=96, color=NAVY, letters=True, fixed=True, z=20)]
els += [T("¿QUÉ PASA\nDESPUÉS?", 540, 320, 12.7, 16.6, size=96, color="#FFFFFF", enter="mask", fixed=True, z=20)]
# CTA
els += [S(540, 960, 1080, 1920, 16.7, None, color=NAVY, enter="mask", mask="circle", fixed=True, z=25)]
els += [T("¿CÓMO MOSTRARÍAS\nTU PROCESO?", 540, 560, 16.8, None, size=78, color="#FFFFFF", letters=True, fixed=True, z=26)]
els += [S(540, 880, 760, 150, 18.7, None, color=RED, r=75, enter="pop", fixed=True, z=26)]
els += [T("ESCRIBIME SERVICIO", 540, 880, 18.75, None, size=64, color="#FFFFFF", enter="pop", fixed=True, z=27)]
els += [P("DEMOSTRACIÓN · BARBERÍA FICTICIA", 540, 1240, 0, None, color=NAVY, size=20, enter="none", fixed=True, z=30)]
def at(p, s, rot=0):
    return {"x": -(p[0] - 540) * s, "y": -(p[1] - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at((540, 900), 1.0, -4)), dict(t=4.6, **at((540, 900), 1.08, 2)), dict(t=5.2, **at((A[0] + 60, A[1] + 120), 1.2, 0)), dict(t=6.9, **at((A[0] + 60, A[1] + 120), 1.25, -2)),
       dict(t=7.9, **at((B[0] - 40, B[1] + 80), 1.25, 4)), dict(t=8.6, **at((B[0] - 40, B[1] + 80), 1.28, 4)), dict(t=9.4, **at((C[0] + 60, C[1] + 100), 1.3, -3)), dict(t=10.3, **at((C[0] + 60, C[1] + 100), 1.32, -3)),
       dict(t=10.9, **at((540, 1750), 0.35, 0)), dict(t=12.6, **at((540, 1750), 0.34, -2))]
save("17", {
    "end": 23.0, "accent": RED, "capStyle": "kinetic", "capColor": "#FFFFFF", "capY": 1330,
    "keys": ["buenísimo", "explicar.", "reserva,", "confirmación", "turno.", "pasos,", "escenas.", "duda.", "negocio?"],
    "scenes": [{"start": 0, "bg": MAP, "fx": "grid"}],
    "cam": cam, "shakes": [{"t": 4.9, "a": 12}, {"t": 7.6, "a": 8}, {"t": 9.2, "a": 10}],
    "sfx": [{"t": 4.9, "name": "whoosh", "v": 0.35}, {"t": 6.6, "name": "click"}, {"t": 7.0, "name": "whoosh", "v": 0.25}, {"t": 7.6, "name": "pop"}, {"t": 8.6, "name": "whoosh", "v": 0.25}, {"t": 9.2, "name": "pop"}, {"t": 10.9, "name": "whoosh", "v": 0.3}, {"t": 12.7, "name": "click"}, {"t": 15.0, "name": "brillo", "v": 0.25}, {"t": 18.7, "name": "pop"}],
    "els": els,
})
