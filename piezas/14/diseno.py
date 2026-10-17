import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
# Pieza 14 como «mundo»: cada versión es un set en un lienzo grande y la cámara viaja entre ellos.
A = "#FF5A1F"; INK = "#111111"; CREAM = "#F2EFE9"; SHOE = "running-shoe"
HUB, SPORT, URBAN, MINI = (540, 900), (1900, 900), (540, 3000), (-820, 900)
els = []
def panel(c, color, z=0, stroke=None):
    return S(c[0], c[1], 1240, 1760, 0, None, color=color, r=40, enter="none", z=z, stroke=stroke, sw=4)
els += [panel(HUB, CREAM), panel(SPORT, "#0E0E10"), panel(URBAN, "#3B3835"), panel(MINI, "#ECE9E3")]
# HUB · la foto original
hx, hy = HUB
els += [S(hx, hy, 600, 680, 0, None, color="#FFFFFF", r=24, enter="none", shadow=True, z=2)]
els += [E(SHOE, hx, hy - 20, 420, 0, None, enter="none", z=3, mv=[{"t": 0, "rot": -10}, {"t": 2.8, "rot": 3}])]
els += [P("FOTO ORIGINAL", hx, hy + 290, 0.6, None, color=INK, size=26, z=4)]
for i, (dest, rot) in enumerate([(SPORT, -14), (URBAN, 8), (MINI, 4)]):
    t0 = 1.0 + i * 0.12
    els += [S(hx, hy, 300, 340, t0, None, color="#FFFFFF", r=16, enter="pop", shadow=True, z=5,
              mv=[{"t": 2.2, "x": hx, "y": hy, "rot": 0}, {"t": 2.9, "x": (hx + dest[0]) / 2, "y": (hy + dest[1]) / 2 - 200, "rot": rot * 3}, {"t": 3.6 + i * 2.5, "x": dest[0] - 480, "y": dest[1] - 790, "rot": rot}])]
    els += [T(str(i + 1), hx, hy, t0 + 0.05, None, size=150, color=A, z=6,
              mv=[{"t": 2.2, "x": hx, "y": hy}, {"t": 2.9, "x": (hx + dest[0]) / 2, "y": (hy + dest[1]) / 2 - 200}, {"t": 3.6 + i * 2.5, "x": dest[0] - 480, "y": dest[1] - 790}])]
# SET 1 · deportiva (ángulo holandés, líneas de velocidad)
sx, sy = SPORT
els += [T("1", sx - 160, sy - 80, 3.0, None, size=1100, color="#1C1C20", enter="none", z=1)]
for i in range(10):
    y = sy - 420 + i * 95; w = 160 + (i * 137) % 300; d = 0.45 + (i * 0.11) % 0.3
    mv, t = [], 3.0 + (i * 0.07) % 0.4
    while t < 24:
        mv += [{"t": t, "x": sx + 650}, {"t": t + d - 0.01, "x": sx - 650}, {"t": t + d, "x": sx + 650}]
        t += d
    els += [S(sx + 650, y, w, 7, 3.0, None, color="#FFFFFF", r=4, enter="none", mv=mv, z=2)]
els += [E(SHOE, sx, sy + 40, 640, 3.2, None, enter="right", rot=-18, z=4, mv=[{"t": 3.6, "x": sx}, {"t": 5.8, "x": sx + 40}])]
els += [T("DEPORTIVA", sx, sy - 560, 3.15, None, size=130, color=A, enter="mask", z=5)]
els += [T("MOVIMIENTO", sx - 120, sy + 470, 4.1, None, size=96, color="#FFFFFF", rot=-6, enter="blur", z=5)]
els += [T("ENERGÍA", sx + 160, sy + 590, 5.0, None, size=120, color=A, rot=-6, enter="pop", z=5)]
els += [E("high-voltage", sx + 470, sy + 330, 170, 5.0, None, enter="spin", z=6)]
# SET 2 · urbana (collage original en la pared)
ux, uy = URBAN
for i, (dx, dy, r, c) in enumerate([(-330, -330, -8, "#57534E"), (330, -260, 6, "#78716C"), (-280, 300, 5, "#44403C"), (320, 360, -6, "#A8A29E"), (0, -620, 3, "#2E2B29")]):
    els += [S(ux + dx, uy + dy, 360, 280, 5.9 + i * 0.08, None, color=c, r=6, rot=r, enter="drop", z=2)]
els += [E("brick", ux - 330, uy - 330, 170, 6.0, None, z=3), E("cityscape", ux + 330, uy - 260, 190, 6.1, None, z=3)]
els += [E(SHOE, ux, uy + 20, 560, 6.0, None, rot=10, enter="zoom", z=4)]
els += [S(ux - 150, uy - 160, 220, 54, 6.3, None, color="#E8D9A8", rot=-24, z=5), S(ux + 170, uy + 220, 220, 54, 6.4, None, color="#E8D9A8", rot=18, z=5)]
els += [T("URBANA", ux, uy - 640, 5.95, None, size=130, color="#FFFFFF", enter="mask", z=6)]
els += [P("TEXTURA", ux - 280, uy + 560, 6.9, None, color=A, size=50, rot=-7, z=6), P("ACTITUD", ux + 250, uy + 520, 7.7, None, color="#FFFFFF", fg=INK, size=50, rot=6, z=6), P("CALLE", ux, uy + 700, 8.4, None, color=INK, size=50, rot=-3, z=6)]
# SET 3 · minimalista (macro, luz suave, mucho espacio)
mx, my = MINI
els += [S(mx, my, 1000, 1000, 9.2, None, color="transparent", r=500, grad="radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)", enter="fade", z=1)]
els += [E(SHOE, mx, my, 360, 9.3, None, enter="blur", z=3)]
els += [T("minimalista", mx, my - 560, 9.3, None, size=96, weight=500, color=INK, letters=True, z=4)]
for i, (w, t) in enumerate([("forma", 10.6), ("detalle", 11.4), ("espacio", 12.1)]):
    els += [T(w, mx - 300 + i * 300, my + 420, t, None, size=56, weight=500, color="#666", enter="up", w=300, z=4)]
# Plano general: mismo producto, otra historia (títulos fijos)
els += [T("UNA FOTO,\nTRES ANUNCIOS", 540, 330, 0, 2.95, size=104, color=INK, enter="none", fixed=True)]
els += [T("MISMO PRODUCTO", 540, 300, 13.3, 15.8, size=100, color="#FFFFFF", letters=True, fixed=True)]
els += [T("OTRA HISTORIA", 540, 300, 15.9, 18.3, size=116, color=A, enter="blur", fixed=True)]
els += [T("¿CUÁL VA CON TU MARCA?", 540, 290, 18.4, None, size=74, color="#FFFFFF", enter="mask", fixed=True)]
els += [S(540, 990, 760, 130, 20.6, None, color=A, r=65, enter="pop", fixed=True, z=8)]
els += [T("ELEGÍ 1, 2 O 3", 540, 990, 20.65, None, size=86, color="#FFFFFF", enter="pop", fixed=True, z=9)]
els += [P("DEMOSTRACIÓN · PRODUCTO GENÉRICO", 540, 1245, 0, 20.5, color="#2A2A2A", size=20, enter="none", fixed=True)]
def at(c, s):  # desplazamiento de cámara que centra el punto c del mundo con zoom s
    return {"x": -(c[0] - 540) * s, "y": -(c[1] - 960) * s, "s": s}
W0 = (540, 1900)
cam = [dict(t=0, rot=0, **at((540, 880), 2.6)), dict(t=0.9, rot=0, **at((540, 880), 2.4)), dict(t=1.4, rot=0, **at(HUB, 1.0)), dict(t=2.6, rot=0, **at(HUB, 0.9)),
       dict(t=3.0, rot=-2, **at(((HUB[0] + SPORT[0]) / 2, 820), 0.7)), dict(t=3.45, rot=-7, **at(SPORT, 1.0)), dict(t=5.7, rot=-9, **at((SPORT[0] + 40, 960), 1.08)),
       dict(t=6.05, rot=-14, **at(((SPORT[0] + URBAN[0]) / 2, 2100), 0.6)), dict(t=6.5, rot=5, **at((URBAN[0], URBAN[1] + 40), 0.95)), dict(t=9.0, rot=7, **at(URBAN, 1.0)),
       dict(t=9.45, rot=0, **at((-200, 1900), 0.55)), dict(t=9.9, rot=0, **at(MINI, 0.9)), dict(t=13.0, rot=0, **at((MINI[0], MINI[1] + 60), 1.45)),
       dict(t=13.6, rot=0, **at(W0, 0.26)), dict(t=15.8, rot=0, **at(W0, 0.25)), dict(t=16.2, rot=-4, **at(W0, 0.28)), dict(t=18.3, rot=-4, **at(W0, 0.28)), dict(t=18.8, rot=0, **at((540, 1900), 0.26))]
save("14", {
    "end": 24.3, "accent": A, "capStyle": "kinetic", "capColor": "#FFFFFF", "capY": 1360,
    "keys": ["tres", "Deportiva:", "energía.", "Urbana:", "calle.", "Minimalista:", "espacio.", "historia", "marca?"],
    "scenes": [{"start": 0, "bg": "#141414", "fx": "grid"}],
    "cam": cam, "shakes": [{"t": 3.45, "a": 16}, {"t": 6.5, "a": 14}, {"t": 15.9, "a": 12}],
    "sfx": [{"t": 1.0, "name": "pop"}, {"t": 2.9, "name": "whoosh", "v": 0.35}, {"t": 5.95, "name": "whoosh", "v": 0.35}, {"t": 9.35, "name": "whoosh", "v": 0.3}, {"t": 13.3, "name": "whoosh", "v": 0.3}, {"t": 4.1, "name": "hit", "v": 0.2}, {"t": 5.0, "name": "hit", "v": 0.25}, {"t": 6.9, "name": "pop"}, {"t": 7.7, "name": "pop"}, {"t": 8.4, "name": "pop"}, {"t": 10.6, "name": "click"}, {"t": 11.4, "name": "click"}, {"t": 12.1, "name": "click"}, {"t": 15.9, "name": "hit", "v": 0.3}, {"t": 20.6, "name": "brillo", "v": 0.3}],
    "els": els,
})
