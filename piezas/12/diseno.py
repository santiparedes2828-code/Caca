import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BLUE = "#2B4C7E"; CREAM = "#F1E7D6"; RED = "#E63946"; INK = "#14213D"; DESK = "#E6D5BA"
els = []
# 0–1.8 · la cara desaparece y queda la alarma
els += [E("bust-in-silhouette", 540, 800, 420, 0, 1.85, enter="none", mv=[{"t": 1.1, "s": 1, "blur": 0, "o": 1}, {"t": 1.8, "s": 0.6, "blur": 30, "o": 0}])]
els += [E("camera-with-flash", 800, 520, 140, 0.3, 1.85, enter="spin")]
els += [S(800, 520, 200, 16, 0.9, 1.85, color=RED, r=8, rot=-40, enter="mask", z=6)]
els += [T("SIN CARA", 540, 330, 0, 1.85, size=130, color=INK, enter="none", fixed=True)]
# Escritorio en plano cenital (flat lay): todo vive sobre el plano
els += [S(540, 900, 1500, 1500, 1.9, None, color=DESK, r=40, enter="fade", z=0)]
els += [S(560, 900, 1000, 760, 2.0, None, color=BLUE, r=30, enter="fade", z=1)]
els += [T("UNA HISTORIA\nCON OBJETOS", 540, 330, 1.9, 4.6, size=96, color=INK, letters=True, fixed=True)]
# alarma
els += [E("alarm-clock", 330, 720, 230, 4.7, None, enter="drop", z=4, mv=[{"t": 5.1 + k * 0.08, "rot": (8 if k % 2 else -8)} for k in range(10)] + [{"t": 6.0, "rot": -6}])]
for k in range(2):
    els += [S(330, 720, 260, 260, 5.0 + k * 0.35, 6.6, color="transparent", r=130, stroke=RED, sw=6, enter="none", z=3, mv=[{"t": 5.0 + k * 0.35, "s": 1, "o": 1}, {"t": 5.9 + k * 0.35, "s": 1.9, "o": 0}])]
els += [P("7:00", 330, 880, 5.0, None, color=RED, size=34, z=5, rot=-6)]
# café frío
els += [E("hot-beverage", 770, 700, 210, 5.9, None, enter="drop", z=4)]
els += [E("snowflake", 870, 600, 90, 6.6, None, enter="spin", z=5)]
els += [P("FRÍO", 770, 850, 6.6, None, color=BLUE, fg="#fff", size=34, z=5, rot=5)]
# veinte pestañas abiertas
els += [E("laptop", 560, 1080, 300, 7.2, None, enter="up", z=4)]
for k in range(20):
    x = 300 + (k * 97) % 520; y = 960 + ((k * 53) % 260)
    els += [S(x, y, 170, 110, 7.4 + k * 0.045, 9.4 + (k % 5) * 0.06 if k != 7 else None, color="#FFFFFF", r=10, stroke="#9AA6BF", sw=3, rot=(k * 17) % 24 - 12, enter="pop", z=6, exit_="shrink")]
    els += [S(x, y - 40, 170, 22, 7.42 + k * 0.045, 9.4 + (k % 5) * 0.06 if k != 7 else None, color=[RED, BLUE, "#F4A261"][k % 3], r=6, rot=(k * 17) % 24 - 12, enter="pop", z=6, exit_="shrink")]
els += [T("20", 920, 1200, 8.2, 9.5, size=150, color=RED, enter="zoom", z=7)]
els += [T("PESTAÑAS", 920, 1290, 8.3, 9.5, size=40, color=INK, w=300, z=7)]
# una sola tarea terminada (la pestaña 7 queda)
x7 = 300 + (7 * 97) % 520; y7 = 960 + ((7 * 53) % 260)
els += [E("check-mark-button", x7, y7 + 10, 90, 9.8, None, enter="spin", z=8)]
els += [S(x7, y7, 240, 180, 10.1, None, color="transparent", r=20, stroke=RED, sw=6, enter="mask", mask="circle", z=8)]
els += [S(540, 330, 860, 240, 9.0, 10.95, color=CREAM, r=30, enter="drop", fixed=True, z=4, shadow=True)]
els += [T("1 TAREA\nTERMINADA", 540, 330, 9.0, 10.95, size=96, color=INK, enter="drop", fixed=True)]
# sin ver una cara
els += [T("SIN VER\nUNA CARA", 540, 330, 11.0, 13.35, size=110, color=RED, letters=True, fixed=True)]
# qué mostrás y en qué orden: tira de 4 fotogramas
for i, (emo, lab) in enumerate([("alarm-clock", "1"), ("hot-beverage", "2"), ("laptop", "3"), ("check-mark-button", "4")]):
    x = 195 + i * 230
    els += [S(x, 900, 210, 300, 13.4 + i * 0.18, 16.1, color=CREAM, r=18, enter="flip", shadow=True, z=10, fixed=True)]
    els += [E(emo, x, 880, 130, 13.45 + i * 0.18, 16.1, enter="flip", z=11, fixed=True)]
    els += [T(lab, x, 1010, 13.5 + i * 0.18, 16.1, size=48, color=RED, w=200, enter="flip", z=11, fixed=True)]
els += [S(540, 900, 1080, 520, 13.35, 16.1, color="rgba(20,33,61,0.85)", enter="fade", z=9, fixed=True)]
els += [T("QUÉ MOSTRÁS\nY EN QUÉ ORDEN", 540, 330, 13.4, 16.1, size=90, color=INK, enter="mask", fixed=True)]
els += [T("¿HARÍAS CONTENIDO ASÍ?", 540, 330, 16.2, 17.9, size=72, color=INK, enter="up", fixed=True)]
# CTA
els += [S(540, 960, 1080, 1920, 18.0, None, color=INK, enter="mask", mask="circle", z=20, fixed=True)]
els += [T("SI QUERÉS\nESTE ESTILO", 540, 640, 18.1, None, size=80, color=CREAM, enter="up", z=21, fixed=True)]
els += [T("ESCRIBIME\nFACELESS", 540, 900, 18.5, None, size=130, color=RED, letters=True, z=21, fixed=True)]
els += [P("DEMOSTRACIÓN · HISTORIA ORIGINAL", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=22)]
save("12", {
    "end": 21.5, "accent": RED, "capStyle": "box", "capBg": "rgba(20,33,61,0.9)", "capY": 1330,
    "keys": ["cámara.", "objetos.", "alarma.", "frío.", "pestañas", "terminada.", "cara.", "orden."],
    "scenes": [{"start": 0, "bg": CREAM, "fx": "paper"}, {"start": 1.9, "bg": "#D9C6A6", "tr": "circle", "fx": "none"}],
    "cam": [{"t": 0, "s": 1, "rx": 0, "rot": 0, "x": 0, "y": 0}, {"t": 1.9, "s": 1.1, "rx": 0, "rot": 0}, {"t": 3.0, "s": 0.9, "rx": 32, "rot": -14, "y": 40},
            {"t": 4.7, "s": 1.25, "rx": 30, "rot": -10, "x": 300, "y": 220}, {"t": 5.8, "s": 1.25, "x": 300, "y": 230}, {"t": 6.1, "s": 1.3, "x": -260, "y": 260, "rot": -16},
            {"t": 7.0, "x": -250}, {"t": 7.4, "s": 1.05, "x": 0, "y": -40, "rot": -12, "rx": 34}, {"t": 9.0, "s": 1.0, "y": -40}, {"t": 9.8, "s": 1.5, "x": -60, "y": -250, "rot": -6, "rx": 20},
            {"t": 10.9, "s": 1.5, "x": -70, "y": -260}, {"t": 11.2, "s": 0.8, "x": 0, "y": 40, "rot": -20, "rx": 40}, {"t": 13.3, "s": 0.78, "rot": -24}],
    "shakes": [{"t": 4.9, "a": 12}, {"t": 5.3, "a": 12}, {"t": 8.2, "a": 10}, {"t": 9.8, "a": 8}],
    "sfx": [{"t": 1.2, "name": "whoosh", "v": 0.25}, {"t": 4.8, "name": "hit", "v": 0.25}, {"t": 5.0, "name": "click"}, {"t": 5.95, "name": "pop"}, {"t": 7.4, "name": "pop"}, {"t": 7.8, "name": "pop"}, {"t": 8.2, "name": "pop"}, {"t": 9.4, "name": "whoosh", "v": 0.3}, {"t": 9.8, "name": "brillo", "v": 0.25}, {"t": 13.4, "name": "click"}, {"t": 18.5, "name": "pop"}],
    "els": els,
})
