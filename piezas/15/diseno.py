import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
PAPER = "#FFFFFF"; INK = "#111111"; RED = "#FF2E2E"; Y = "#FFD400"; BLUE = "#2F6BFF"; BG = "#DCDCDC"
els = []
# El cartel (ficticio)
els += [S(540, 840, 780, 1040, 0, None, color=PAPER, r=8, enter="none", shadow=True, z=1)]
els += [P("DEMOSTRACIÓN · CURSO FICTICIO", 540, 1240, 0, None, color=INK, size=20, enter="none", fixed=True, z=30)]
# Bloques: posición caótica -> posición ordenada (t=9.9..14.6)
def block(kind, chaos, order, t_order, z=4):
    (cx, cy, cs, cr), (ox, oy, os_, orr) = chaos, order
    return [{"t": 0, "x": cx, "y": cy, "s": cs, "rot": cr, "o": 1}, {"t": t_order, "x": cx, "y": cy, "s": cs, "rot": cr}, {"t": t_order + 0.5, "x": ox, "y": oy, "s": os_, "rot": orr}]
pulse = [{"t": 5.4 + k * 0.2, "s": (1.12 if k % 2 else 1.0)} for k in range(6)]
def withpulse(kf, base_s):
    out = list(kf)
    out += [{"t": p["t"], "s": base_s * p["s"]} for p in pulse]
    out.sort(key=lambda k: k["t"]); return out
els += [{"type": "emoji", "name": "camera", "z": 3, "kf": withpulse(block("p", (700, 520, 0.8, 18), (540, 560, 1.5, 0), 9.9), 0.8) + [{"t": 0, "w": 200}]}]
els += [{"type": "text", "text": "CURSO DE\nFOTOGRAFÍA", "size": 92, "weight": 800, "color": INK, "z": 4, "kf": withpulse(block("t", (520, 800, 1.0, -6), (540, 840, 0.95, 0), 11.3), 1.0) + [{"t": 0, "w": 700}]}]
els += [{"type": "shape", "color": RED, "r": 20, "z": 5, "kf": withpulse(block("pr", (360, 600, 1.0, -12), (380, 1170, 0.55, 0), 14.2), 1.0) + [{"t": 0, "w": 340, "h": 150}]}]
els += [{"type": "text", "text": "$ PRECIO", "size": 70, "weight": 800, "color": "#FFFFFF", "z": 6, "kf": withpulse(block("pr", (360, 600, 1.0, -12), (380, 1170, 0.55, 0), 14.2), 1.0) + [{"t": 0, "w": 340}]}]
els += [{"type": "shape", "color": Y, "r": 160, "z": 5, "kf": withpulse(block("d", (760, 1090, 1.0, 14), (700, 1170, 0.5, 0), 14.4), 1.0) + [{"t": 0, "w": 320, "h": 320}]}]
els += [{"type": "text", "text": "%\nDESCUENTO", "size": 54, "weight": 800, "color": INK, "z": 6, "kf": withpulse(block("d", (760, 1090, 1.0, 14), (700, 1170, 0.55, 0), 14.4), 1.0) + [{"t": 0, "w": 300}]}]
els += [S(540, 1010, 420, 110, 12.9, None, color=BLUE, r=55, enter="pop", z=6)]
els += [T("QUIERO SABER MÁS", 540, 1010, 13.0, None, size=40, color="#FFFFFF", enter="pop", z=7)]
# flechas que compiten
for i, (x, y, r) in enumerate([(220, 420, 135), (880, 650, -120), (220, 1080, 45), (880, 960, -60)]):
    els += [S(x, y, 90, 90, 0.2 + i * 0.15, 8.4, color=[RED, BLUE, Y, RED][i], tri=True, rot=r, enter="pop", z=7, mv=[{"t": 0.5 + k * 0.25, "s": 1.25 if k % 2 else 1} for k in range(30)])]
# ¿Qué miro?
els += [S(540, 960, 1080, 1920, 6.4, 8.45, color="rgba(10,10,10,0.6)", enter="fade", z=8)]
els += [T("¿QUÉ\nMIRO?", 540, 820, 6.5, 8.45, size=220, color=Y, letters=True, z=9)]
# orden de lectura
for i, (y, lab) in enumerate([(560, "1"), (840, "2"), (1010, "3")]):
    els += [S(200, y, 70, 70, 16.4 + i * 0.3, None, color=INK, r=35, enter="spin", z=9), T(lab, 200, y, 16.45 + i * 0.3, None, size=40, color="#FFFFFF", w=70, enter="spin", z=10)]
els += [S(200, 785, 6, 450, 16.5, None, color=INK, r=3, enter="mask", mask="up", z=8)]
# títulos fijos
els += [T("MIRÁ EL PRECIO", 540, 300, 0.1, 1.25, size=84, color=RED, enter="none", fixed=True, z=20)]
els += [T("NO, EL TÍTULO", 540, 300, 1.3, 2.95, size=84, color=INK, enter="drop", fixed=True, z=20)]
els += [T("¡EL DESCUENTO!", 540, 300, 3.0, 5.15, size=84, color="#B38F00", enter="drop", fixed=True, z=20)]
els += [T("SI TODO GRITA…", 540, 300, 5.2, 6.4, size=84, color=INK, glitch=True, fixed=True, z=20)]
els += [T("HAGAMOS ESPACIO", 540, 300, 8.5, 13.9, size=84, color=INK, enter="mask", fixed=True, z=20)]
els += [T("NADA SE ELIMINA", 540, 300, 14.0, 16.3, size=84, color=INK, letters=True, fixed=True, z=20)]
els += [T("SE ORDENA", 540, 300, 16.4, 18.3, size=110, color=BLUE, enter="blur", fixed=True, z=20)]
els += [S(540, 300, 1080, 280, 18.4, None, color=INK, enter="up", fixed=True, z=19)]
els += [T("¿TU ANUNCIO TIENE\nUN FOCO CLARO?", 540, 300, 18.5, None, size=72, color=Y, letters=True, fixed=True, z=20)]
def at(x, y, s, rot=0):
    return {"x": -(x - 540) * s, "y": -(y - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at(360, 640, 1.7, -4)), dict(t=1.2, **at(360, 640, 1.75, -4)), dict(t=1.45, **at(520, 820, 1.5, 3)), dict(t=2.9, **at(520, 820, 1.55, 3)),
       dict(t=3.15, **at(760, 1060, 1.6, -5)), dict(t=5.0, **at(760, 1060, 1.65, -5)), dict(t=5.4, **at(540, 960, 0.86, 0)), dict(t=8.4, **at(540, 960, 0.88, 0)),
       dict(t=9.0, **at(540, 960, 0.88, 0)), dict(t=13.9, **at(540, 980, 0.9, 0)), dict(t=18.3, **at(540, 980, 0.88, 0)), {"t": 18.4, "x": 0, "y": 40, "s": 0.8, "rot": 0, "ry": 0}, {"t": 22.4, "x": 0, "y": 40, "s": 0.8, "ry": -18, "rot": -2}]
save("15", {
    "end": 22.5, "accent": BLUE, "capStyle": "side", "capColor": "#111111", "capY": 1330,
    "keys": ["grita,", "espacio:", "producto,", "idea", "acción.", "orden"],
    "scenes": [{"start": 0, "bg": BG, "fx": "grid"}],
    "cam": cam, "shakes": [{"t": 1.3, "a": 16}, {"t": 3.0, "a": 16}, {"t": 5.4, "a": 10}, {"t": 6.4, "a": 14}],
    "sfx": [{"t": 1.3, "name": "whoosh", "v": 0.35}, {"t": 3.0, "name": "whoosh", "v": 0.35}, {"t": 5.4, "name": "pop"}, {"t": 5.8, "name": "pop"}, {"t": 6.4, "name": "hit", "v": 0.3}, {"t": 9.9, "name": "click"}, {"t": 11.3, "name": "click"}, {"t": 12.9, "name": "click"}, {"t": 14.2, "name": "click"}, {"t": 16.4, "name": "pop"}, {"t": 18.4, "name": "brillo", "v": 0.25}],
    "els": els,
})
