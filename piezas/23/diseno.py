import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
CREAM = "#F6F1E9"; INK = "#1E1B18"; RED = "#D64545"; BLUE = "#2D6A8F"; GOLD = "#C49A3A"; GRAY = "#C9C2B6"
els = []
els += [P("DEMOSTRACIÓN DE FORMATO", 540, 1240, 0, None, color=INK, fg=CREAM, size=22, enter="none", fixed=True, z=40)]
# 0–3 · captura genérica difícil de leer
els += [S(540, 820, 720, 900, 0, 3.05, color="#FFFFFF", r=10, enter="none", rot=-4, shadow=True, z=2, mv=[{"t": 0, "blur": 0}, {"t": 2.4, "blur": 3}, {"t": 3.0, "blur": 8, "s": 0.9}])]
for i in range(22):
    w = 600 - (i * 61) % 260
    els += [S(540 - (600 - w) / 2, 420 + i * 36, w, 12, 0, 3.05, color=GRAY, r=6, enter="none", rot=-4, z=3, mv=[{"t": 2.4, "blur": 0}, {"t": 3.0, "blur": 8}])]
els += [P("CAPTURA", 300, 480, 0.3, 3.05, color=RED, size=28, rot=-8, enter="spin", z=5)]
els += [T("UNA RESEÑA REAL\nCUENTA UNA HISTORIA", 540, 300, 0, 3.05, size=76, color=INK, enter="none", fixed=True, z=30)]
# Página editorial larga (la cámara baja por ella)
def block(y, tag, color, t0):
    o = [S(540, y, 860, 420, t0, None, color="#FFFFFF", r=24, enter="up", shadow=True, z=2)]
    o += [P(tag, 300, y - 150, t0 + 0.1, None, color=color, size=30, enter="flip", z=4)]
    for i, w in enumerate([700, 640, 520]):
        o += [S(540 - (700 - w) / 2, y - 50 + i * 60, w, 22, t0 + 0.2 + i * 0.08, None, color="#E7E1D7", r=11, enter="mask", z=3)]
    o += [T("[en sus palabras]", 540, y + 150, t0 + 0.4, None, size=34, weight=500, color="#8A8275", w=760, enter="fade", z=3)]
    return o
els += block(900, "1 · PROBLEMA", RED, 3.1)
els += block(1500, "2 · QUÉ PROBÓ", BLUE, 5.5)
for k in range(3):
    els += [S(160, 1440 + k * 60, 22, 22, 6.0 + k * 0.2, None, color=BLUE, r=11, enter="pop", z=4)]
els += [S(160, 1500, 6, 160, 5.9, None, color=BLUE, r=3, enter="mask", mask="up", z=3)]
els += block(2100, "3 · OPINIÓN", GOLD, 7.3)
els += [T("“", 870, 1950, 7.6, None, size=260, color=GOLD, w=200, enter="drop", z=5)]
# permiso
els += [S(540, 2700, 860, 420, 10.6, None, color=INK, r=24, enter="up", z=2)]
for i, lab in enumerate(["SUS PALABRAS", "SU PERMISO"]):
    els += [E("check-mark-button", 260, 2620 + i * 160, 90, 11.2 + i * 0.9, None, enter="spin", z=4)]
    els += [T(lab, 600, 2620 + i * 160, 11.2 + i * 0.9, None, size=60, color=CREAM, w=600, enter="right", z=4)]
# destacar, no inventar
els += [S(540, 3300, 860, 460, 12.8, None, color="#FFFFFF", r=24, enter="up", shadow=True, z=2)]
els += [S(540, 3220, 700, 70, 13.6, None, color="rgba(196,154,58,0.4)", r=10, enter="mask", z=3)]
els += [T("DESTACAR ✔", 540, 3220, 13.3, None, size=56, color=INK, w=760, enter="fade", z=4)]
for k in range(5):
    els += [E("star", 300 + k * 120, 3380, 90, 14.4 + k * 0.05, None, enter="pop", z=4)]
els += [S(540, 3380, 660, 14, 15.2, None, color=RED, r=7, rot=-6, enter="mask", z=6)]
els += [T("NO INVENTAR", 540, 3480, 15.3, None, size=48, color=RED, w=600, enter="up", z=5)]
# títulos fijos (sobre una banda que tapa la página que pasa por detrás)
els += [S(540, 290, 1080, 280, 3.1, 16.65, color=CREAM, enter="fade", fixed=True, z=29, grad="linear-gradient(180deg, #F6F1E9 0%, #F6F1E9 78%, rgba(246,241,233,0) 100%)")]
els += [T("1 · EL PROBLEMA", 540, 300, 3.1, 5.45, size=86, color=RED, enter="mask", fixed=True, z=30)]
els += [T("2 · QUÉ PROBÓ", 540, 300, 5.5, 7.25, size=86, color=BLUE, enter="mask", fixed=True, z=30)]
els += [T("3 · SU OPINIÓN", 540, 300, 7.3, 10.6, size=86, color=GOLD, enter="mask", fixed=True, z=30)]
els += [T("CON PERMISO", 540, 300, 10.7, 12.8, size=96, color=INK, enter="blur", fixed=True, z=30)]
els += [T("EDITAR ≠ INVENTAR", 540, 300, 12.9, 16.6, size=86, color=INK, letters=True, fixed=True, z=30)]
# plantilla final + CTA
els += [S(540, 960, 1080, 1920, 16.7, None, color=CREAM, enter="mask", mask="circle", fixed=True, z=31)]
for i, (tag, c) in enumerate([("PROBLEMA", RED), ("EXPERIENCIA", BLUE), ("OPINIÓN", GOLD)]):
    y = 600 + i * 150
    els += [S(540, y, 760, 120, 16.9 + i * 0.15, None, color="#FFFFFF", r=20, enter="flip", shadow=True, fixed=True, z=32)]
    els += [S(200, y, 12, 80, 16.95 + i * 0.15, None, color=c, r=6, enter="flip", fixed=True, z=33)]
    els += [T(tag, 560, y, 17.0 + i * 0.15, None, size=46, color=INK, w=600, enter="flip", fixed=True, z=33)]
els += [T("¿TENÉS TESTIMONIOS\nREALES?", 540, 330, 18.2, None, size=74, color=INK, letters=True, fixed=True, z=33)]
els += [S(540, 1080, 700, 120, 19.0, None, color=INK, r=60, enter="pop", fixed=True, z=33)]
els += [T("PODEMOS EDITARLOS", 540, 1080, 19.05, None, size=52, color=CREAM, enter="pop", fixed=True, z=34)]
def at(y, s=1.0, rot=0):
    return {"x": 0, "y": -(y - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at(820, 1.0, 2)), dict(t=2.4, **at(820, 1.25, -2)), dict(t=3.0, **at(820, 1.3, 0)), dict(t=3.2, **at(960, 1.0)), dict(t=5.3, **at(960, 1.04)),
       dict(t=5.7, **at(1500, 1.0, 1)), dict(t=7.1, **at(1500, 1.04, 1)), dict(t=7.5, **at(2100, 1.0, -1)), dict(t=10.4, **at(2100, 1.06, -1)),
       dict(t=10.8, **at(2700, 1.0, 0)), dict(t=12.7, **at(2700, 1.03)), dict(t=13.1, **at(3300, 1.0, 1)), dict(t=16.6, **at(3300, 1.06, 1))]
save("23", {
    "end": 23.0, "accent": RED, "capStyle": "box", "capColor": "#FFFFFF", "capBg": "rgba(30,27,24,0.88)", "capY": 1330,
    "keys": ["historia.", "problema", "probó.", "experiencia.", "permiso.", "destacar", "inventarlo."],
    "scenes": [{"start": 0, "bg": "#E8E2D8", "fx": "paper"}, {"start": 3.1, "bg": CREAM, "tr": "wipe", "fx": "paper"}],
    "cam": cam, "shakes": [{"t": 15.2, "a": 10}],
    "sfx": [{"t": 3.1, "name": "whoosh", "v": 0.3}, {"t": 5.6, "name": "whoosh", "v": 0.25}, {"t": 7.4, "name": "whoosh", "v": 0.25}, {"t": 7.6, "name": "pop"}, {"t": 10.8, "name": "whoosh", "v": 0.25}, {"t": 11.2, "name": "click"}, {"t": 12.1, "name": "click"}, {"t": 13.1, "name": "whoosh", "v": 0.25}, {"t": 15.2, "name": "hit", "v": 0.25}, {"t": 16.8, "name": "brillo", "v": 0.25}, {"t": 19.0, "name": "pop"}],
    "els": els,
})
