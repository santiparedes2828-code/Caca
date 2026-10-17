import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
SKY = "#2A1846"; ORANGE = "#FF8A3D"; PINK = "#FF5DA2"; CREAM = "#FFF1DE"; GRAY = "#8E86A3"
els = []
lines = ["EL TIEMPO", "SE ME FUE"]
# letras -> números que caen (y vuelven al final para el bucle)
k = 0
for li, line in enumerate(lines):
    for ci, ch in enumerate(line):
        if ch == " ":
            continue
        WD = {"M": 112, "I": 42, " ": 40, "E": 74, "L": 68, "T": 74, "P": 80, "O": 92, "S": 78, "F": 70, "U": 84}
        ws = [WD.get(c, 80) for c in line]; tot = sum(ws)
        x = 540 - tot / 2 + sum(ws[:ci]) + ws[ci] / 2; y = 760 + li * 150
        t_swap = 4.2 + k * 0.05; t_fall = 5.8 + k * 0.06
        els += [{"type": "text", "text": ch, "size": 128, "weight": 800, "color": GRAY, "z": 5, "kf": [
            {"t": 0, "x": x, "y": y, "o": 0, "w": 100, "s": 1, "blur": 0}, {"t": 1.4 + k * 0.04, "o": 0}, {"t": 1.6 + k * 0.04, "o": 1},
            {"t": t_swap, "o": 1, "blur": 0}, {"t": t_swap + 0.2, "o": 0, "blur": 10},
            {"t": 21.0 + k * 0.04, "o": 0, "blur": 10}, {"t": 21.3 + k * 0.04, "o": 1, "blur": 0}]}]
        d = str((k * 7 + 3) % 10)
        els += [{"type": "text", "text": d, "size": 128, "weight": 800, "color": ORANGE, "z": 5, "kf": [
            {"t": 0, "x": x, "y": y, "o": 0, "w": 100, "rot": 0, "s": 1}, {"t": t_swap, "o": 0, "s": 0.6}, {"t": t_swap + 0.2, "o": 1, "s": 1},
            {"t": t_fall, "y": y, "rot": 0}, {"t": t_fall + 1.4, "y": y + 1300, "rot": (k * 37) % 120 - 60}, {"t": t_fall + 1.41, "o": 0},
            {"t": 20.4 + k * 0.04, "o": 0, "y": y - 900, "rot": 40}, {"t": 20.45 + k * 0.04, "o": 1}, {"t": 21.0 + k * 0.04, "y": y, "rot": 0, "o": 1}, {"t": 21.3 + k * 0.04, "o": 0}]}]
        k += 1
els += [T("podría escribir:", 540, 560, 0.5, 4.2, size=48, weight=500, color=GRAY, enter="fade")]
els += [T("O PODRÍA\nMOSTRARLO ASÍ", 540, 330, 3.5, 5.7, size=90, color=CREAM, letters=True, fixed=True)]
# reloj líquido
CX, CY = 540, 760
els += [S(CX, CY, 420, 420, 5.8, 7.75, color=CREAM, r=210, enter="zoom", z=3, mv=[{"t": 6.6, "h": 420, "y": CY, "r": 210, "rot": 0}, {"t": 7.7, "h": 600, "y": CY + 90, "r": 150, "rot": 8}])]
els += [S(CX, CY, 12, 170, 5.9, 7.75, color=SKY, r=6, enter="fade", z=4, mv=[{"t": 5.9, "rot": 0}, {"t": 9.0, "rot": 1440}])]
els += [S(CX, CY, 12, 120, 5.9, 7.75, color=PINK, r=6, enter="fade", z=4, mv=[{"t": 5.9, "rot": 90}, {"t": 9.0, "rot": 360}])]
for i in range(5):
    t0 = 6.4 + i * 0.25; x = 400 + i * 70
    els += [S(x, CY + 200, 34, 50, t0, 7.75, color=CREAM, r=17, enter="none", z=3, mv=[{"t": t0, "y": CY + 200, "h": 50}, {"t": t0 + 1.0, "y": CY + 430, "h": 90}, {"t": t0 + 1.21, "o": 0}])]
els += [T("LAS HORAS\nSE ESCAPAN", 540, 330, 5.8, 7.5, size=96, color=ORANGE, enter="drop", fixed=True)]
# calendario que se dobla y se esfuma
els += [S(540, 860, 620, 640, 7.6, 10.2, color=CREAM, r=24, enter="up", z=6, mv=[{"t": 8.4, "ry": 0, "rx": 0, "blur": 0, "o": 1}, {"t": 9.3, "ry": 72, "rx": 20, "blur": 0}, {"t": 10.0, "ry": 88, "blur": 16, "o": 0.2}])]
els += [S(540, 600, 620, 110, 7.65, 10.2, color=PINK, r=24, enter="up", z=7, mv=[{"t": 8.3, "ry": 0, "rx": 0}, {"t": 9.3, "ry": 72, "rx": 20, "y": 620}, {"t": 10.0, "ry": 88, "blur": 16, "o": 0.2}])]
for c in range(20):
    x = 330 + (c % 5) * 105; y = 720 + (c // 5) * 105
    els += [S(x, y, 80, 80, 7.7 + c * 0.02, 10.2, color="#E8D9C4", r=12, enter="pop", z=7, mv=[{"t": 8.3, "x": x, "ry": 0, "blur": 0, "o": 1}, {"t": 9.3, "x": 540 + (x - 540) * 0.3, "ry": 72}, {"t": 10.0, "blur": 16, "o": 0}])]
els += [T("EL CALENDARIO\nSE DOBLA", 540, 330, 7.6, 9.2, size=90, color=CREAM, enter="blur", fixed=True)]
# el día desaparece: sol que baja y tarea a medias
els += [S(540, 1040, 1080, 520, 9.2, 12.1, color="#1A0F2E", enter="fade", z=2)]
els += [S(540, 640, 300, 300, 9.2, 12.1, color=ORANGE, r=150, enter="fade", z=1, mv=[{"t": 9.4, "y": 640}, {"t": 12.0, "y": 980, "fill": PINK}])]
els += [S(540, 1130, 760, 60, 10.2, 12.1, color="#3A2A55", r=30, enter="up", z=4)]
els += [S(220, 1130, 40, 60, 10.3, 12.1, color=ORANGE, r=30, enter="none", z=5, mv=[{"t": 10.3, "w": 40, "x": 180}, {"t": 11.2, "w": 420, "x": 370}])]
els += [T("TAREA", 540, 1050, 10.3, 12.1, size=40, color=CREAM, enter="up", z=5)]
els += [T("Y EL DÍA\nDESAPARECE", 540, 330, 9.2, 12.1, size=96, color=CREAM, letters=True, fixed=True)]
# la frase es la misma, pero ahora es una imagen
els += [T("EL TIEMPO\nSE ME FUE", 540, 700, 12.2, 15.8, size=120, color=GRAY, enter="blur")]
els += [S(540, 700, 760, 14, 13.9, 15.8, color=ORANGE, r=7, enter="mask", z=6)]
els += [T("MISMA FRASE", 540, 330, 12.2, 15.8, size=96, color=CREAM, enter="mask", fixed=True)]
els += [T("OTRA IMAGEN", 540, 330, 15.9, 17.6, size=110, color=ORANGE, enter="zoom", fixed=True)]
els += [E("mantelpiece-clock", 300, 760, 170, 15.9, 17.6, enter="spin", rot=-12), E("spiral-calendar", 540, 700, 170, 16.05, 17.6, enter="spin"), E("sunset", 780, 760, 170, 16.2, 17.6, enter="spin", rot=10)]
els += [E("sparkles", 860, 560, 110, 16.8, 17.6, enter="pop")]
# pregunta final (y bucle al primer texto)
els += [T("¿QUÉ FRASE\nANIMAMOS\nDESPUÉS?", 540, 520, 17.7, 20.3, size=110, color=CREAM, letters=True)]
els += [P("COMENTÁ TU FRASE", 540, 860, 18.6, 20.3, color=ORANGE, fg=SKY, size=40, enter="flip")]
save("13", {
    "end": 22.6, "accent": ORANGE, "capStyle": "kinetic", "capColor": "#FFFFFF", "capY": 1330,
    "keys": ["tiempo", "horas", "escapan,", "calendario", "dobla", "desaparece", "imagen", "recordar."],
    "scenes": [{"start": 0, "bg": "#1E1530", "fx": "dots"}, {"start": 5.8, "bg": SKY, "tr": "zoom", "fx": "vignette"}, {"start": 12.2, "bg": "#1E1530", "tr": "circle", "fx": "dots"}, {"start": 17.7, "bg": SKY, "tr": "whip", "fx": "vignette"}],
    "cam": [{"t": 0, "s": 1, "rot": 0, "ry": 0}, {"t": 4.1, "s": 1.06, "rot": -2}, {"t": 5.8, "s": 1, "rot": 0}, {"t": 7.5, "s": 1.12, "rot": 6, "ry": 8}, {"t": 9.1, "s": 1, "rot": -4, "ry": -6}, {"t": 12.1, "s": 1.1, "rot": 3, "ry": 0}, {"t": 12.2, "s": 1, "rot": 0}, {"t": 17.6, "s": 1.05}, {"t": 17.7, "s": 1, "rot": 0}, {"t": 20.3, "s": 1.04, "rot": -2}, {"t": 21.0, "s": 1, "rot": 0}],
    "shakes": [{"t": 5.8, "a": 10}, {"t": 15.9, "a": 12}],
    "sfx": [{"t": 4.2, "name": "brillo", "v": 0.25}, {"t": 5.8, "name": "whoosh", "v": 0.3}, {"t": 7.6, "name": "pop"}, {"t": 8.4, "name": "whoosh", "v": 0.25}, {"t": 9.6, "name": "whoosh", "v": 0.2}, {"t": 13.9, "name": "click"}, {"t": 15.9, "name": "hit", "v": 0.25}, {"t": 18.6, "name": "pop"}, {"t": 20.4, "name": "whoosh", "v": 0.3}],
    "els": els,
})
