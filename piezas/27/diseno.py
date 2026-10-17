import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#EDE6DB"; INK = "#1F2933"; BLUE = "#3E64FF"; RED = "#E4572E"; KRAFT = "#C8A27A"; W = "#FFFFFF"
els = []
X4 = [165, 415, 665, 915]
def frame(xs, t0, t1, z=3):
    # xs: lista de (t, x, extra) para mover el cuadro
    return S(xs[0][1], 860, 220, 380, t0, t1, color=W, r=18, enter="none", z=z, shadow=True, mv=[dict({"t": t, "x": x}, **e) for t, x, e in xs])
def mvx(xs, dy=0):
    return [dict({"t": t, "x": x}, **{k: v for k, v in e.items() if k in ("o", "s")}) for t, x, e in xs]
# Cuadro A (intro)
A = [(0, 165, {}), (3.9, 165, {}), (4.5, 415, {}), (8.7, 415, {}), (9.2, 540, {})]
els += [frame(A, 0, 10.35)]
els += [T("hola, somos\nuna empresa\nde mudanzas…", 165, 860, 0, 10.35, size=26, weight=500, color="#7B8794", w=200, enter="none", z=4, mv=mvx(A))]
# Cuadro B (párrafo -> imagen)
Bm = [(0, 415, {}), (3.9, 415, {}), (4.5, 665, {}), (8.7, 665, {}), (9.2, 790, {})]
els += [frame(Bm, 0, 10.35)]
for i in range(7):
    els += [S(415, 740 + i * 40, 170, 12, 0, 10.35, color="#CBD2D9", r=6, enter="none", z=4, mv=[dict(m, x=m["x"]) for m in mvx(Bm)] + [{"t": 5.4, "o": 1}, {"t": 5.9, "o": 0}])]
for i in range(3):
    els += [E("package", 415, 760 + i * 100, 80, 6.2 + i * 0.25, 10.35, enter="drop", z=5, mv=mvx(Bm))]
    els += [T(str(i + 1), 415 + 70, 760 + i * 100, 6.25 + i * 0.25, 10.35, size=34, color=BLUE, w=40, enter="pop", z=6, mv=[{"t": m["t"], "x": m["x"] + 70} for m in mvx(Bm)])]
# Cuadro C (la pregunta) que pasa al principio
Cm = [(0, 665, {}), (3.9, 665, {"s": 1}), (4.2, 540, {"s": 1.15}), (4.5, 165, {"s": 1}), (8.7, 165, {}), (9.2, 290, {})]
els += [S(665, 860, 220, 380, 0, 10.35, color=BLUE, r=18, enter="none", z=7, shadow=True, mv=[dict({"t": t, "x": x}, **e) for t, x, e in Cm] + [{"t": 4.2, "y": 700}, {"t": 4.5, "y": 860}])]
els += [T("¿POR DÓNDE\nEMPIEZO?", 665, 860, 0, 10.35, size=34, color=W, w=200, enter="none", z=8, mv=mvx(Cm) + [{"t": 4.2, "y": 700}, {"t": 4.5, "y": 860}])]
# Cuadro D (repetición) que se borra
els += [S(915, 860, 220, 380, 0, 8.75, color=W, r=18, enter="none", z=3, shadow=True, mv=[{"t": 8.2, "s": 1, "rot": 0}, {"t": 8.7, "s": 0.2, "rot": 25}])]
for i in range(7):
    els += [S(915, 740 + i * 40, 170, 12, 0, 8.75, color="#CBD2D9", r=6, enter="none", z=4, mv=[{"t": 8.2, "s": 1}, {"t": 8.7, "s": 0.2, "o": 0}])]
els += [P("REPETIDO", 915, 640, 8.0, 8.75, color=RED, size=24, enter="pop", z=8)]
els += [E("cross-mark", 915, 860, 160, 8.1, 8.75, enter="spin", z=9)]
# Rótulos de cambios
for i, (lab, t0, t1) in enumerate([("1 · LA PREGUNTA PRIMERO", 3.9, 5.35), ("2 · IMAGEN EN VEZ DE PÁRRAFO", 5.4, 7.95), ("3 · SIN REPETICIÓN", 8.0, 9.5)]):
    els += [S(540, 1120, 900, 100, t0, t1, color=INK, r=50, enter="up", z=10, fixed=True), T(lab, 540, 1120, t0 + 0.05, t1, size=44, color=W, w=880, enter="up", z=11, fixed=True)]
els += [T("UNA BUENA IDEA,\nESCONDIDA", 540, 330, 0, 2.35, size=90, color=INK, enter="none", fixed=True)]
els += [T("3 CAMBIOS", 540, 330, 2.4, 9.5, size=120, color=BLUE, letters=True, fixed=True)]
els += [T("NADA MÁS.", 540, 330, 9.6, 10.35, size=120, color=INK, enter="zoom", fixed=True)]
# Resultado (reproducción a pantalla completa, con cortes)
els += [T("¿POR DÓNDE\nEMPIEZO?", 540, 760, 10.4, 12.2, size=120, color=BLUE, letters=True, z=20)]
els += [E("delivery-truck", 540, 1050, 200, 10.6, 12.2, enter="right", z=20, mv=[{"t": 10.9, "x": 540}, {"t": 12.1, "x": 640}])]
for i in range(3):
    els += [S(260 + i * 280, 860, 230, 230, 12.2 + i * 0.15, 13.9, color=KRAFT, r=16, enter="drop", z=20)]
    els += [T(str(i + 1), 260 + i * 280, 860, 12.25 + i * 0.15, 13.9, size=110, color=INK, w=200, enter="drop", z=21)]
els += [T("embalamos · cargamos · llevamos", 540, 1060, 12.6, 13.9, size=40, weight=500, color=INK, enter="up", z=21)]
els += [E("house", 230, 860, 170, 13.9, 15.65, enter="pop", z=20), E("house", 850, 860, 170, 14.0, 15.65, enter="pop", z=20)]
els += [S(540, 860, 480, 10, 14.1, 15.65, color=BLUE, r=5, enter="mask", z=19)]
els += [E("delivery-truck", 300, 800, 120, 14.2, 15.65, enter="pop", z=21, mv=[{"t": 14.3, "x": 300}, {"t": 15.5, "x": 780}])]
els += [T("LA HISTORIA AVANZA", 540, 330, 13.1, 15.65, size=84, color=INK, enter="mask", fixed=True)]
# CTA
els += [S(540, 960, 1080, 1920, 15.7, None, color=BLUE, enter="mask", mask="circle", fixed=True, z=30)]
els += [T("¿QUERÉS QUE\nREVISE UNA IDEA?", 540, 700, 15.8, None, size=92, color=W, letters=True, fixed=True, z=31)]
els += [S(540, 940, 520, 140, 16.8, None, color=W, r=70, enter="pop", fixed=True, z=31), T("ESCRIBIME", 540, 940, 16.85, None, size=70, color=BLUE, enter="pop", fixed=True, z=32)]
els += [P("DEMOSTRACIÓN · NEGOCIO FICTICIO", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=40)]
cam = [{"t": 0, "s": 1, "ry": -22, "rx": 6, "x": 40}, {"t": 2.3, "s": 1, "ry": -18, "rx": 6, "x": 40}, {"t": 3.9, "s": 1.1, "ry": -10, "rx": 0, "x": 0},
       {"t": 5.3, "s": 1.1, "ry": -6}, {"t": 5.6, "s": 1.5, "ry": 0, "x": (540 - 665) * 1.5, "y": -60}, {"t": 7.8, "s": 1.5, "x": (540 - 665) * 1.5}, {"t": 8.1, "s": 1.4, "x": (540 - 915) * 1.4, "ry": 8},
       {"t": 8.9, "s": 1.4, "x": (540 - 915) * 1.4, "ry": 8, "y": -60}, {"t": 9.4, "s": 1.05, "x": 0, "y": 0, "ry": 0}, {"t": 10.35, "s": 1.08}, {"t": 10.4, "s": 1, "ry": 0, "x": 0, "y": 0}]
save("27", {
    "end": 21.0, "accent": BLUE, "capStyle": "kinetic", "capColor": "#FFFFFF", "capY": 1330,
    "keys": ["escondida.", "cambios:", "pregunta,", "imagen", "repetición.", "diferencia.", "avanza."],
    "scenes": [{"start": 0, "bg": BG, "fx": "grid"}, {"start": 10.4, "bg": "#F4EFE6", "tr": "zoom", "fx": "dots"}],
    "cam": cam, "shakes": [{"t": 4.5, "a": 10}, {"t": 8.7, "a": 12}],
    "sfx": [{"t": 3.9, "name": "whoosh", "v": 0.3}, {"t": 5.4, "name": "click"}, {"t": 6.2, "name": "pop"}, {"t": 6.45, "name": "pop"}, {"t": 6.7, "name": "pop"}, {"t": 8.1, "name": "hit", "v": 0.25}, {"t": 9.6, "name": "pop"}, {"t": 10.4, "name": "whoosh", "v": 0.3}, {"t": 12.2, "name": "click"}, {"t": 13.9, "name": "click"}, {"t": 15.8, "name": "brillo", "v": 0.25}],
    "els": els,
})
