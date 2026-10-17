import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#0C0B10"; Y = "#FFD60A"; R = "#FF3B30"; W = "#F5F5F7"; GR = "#8E8E93"
els = []
# Pasillo interminable: marcos que avanzan hacia la cámara en bucle
for i in range(7):
    mv = []
    t = -i * 0.45
    while t < 5.3:
        a = max(t, 0)
        s0 = 0.15 + (a - t) / 3.15 * 2.4
        mv += [{"t": a, "s": s0, "o": min(1, s0)}, {"t": t + 3.15 - 0.01, "s": 2.55, "o": 0}, {"t": t + 3.15, "s": 0.15, "o": 0.2}]
        t += 3.15
    els += [S(540, 860, 600, 900, 0, 5.3, color="transparent", r=30, stroke="#3A3A44", sw=8, enter="none", mv=[m for m in mv if m["t"] <= 5.3 and m["t"] >= 0], z=1)]
els += [S(540, 900, 300, 470, 0, 8.7, color="#1C1B22", r=14, stroke="#55555F", sw=4, enter="none", z=2)]
els += [S(540, 900, 300, 470, 5.6, 8.7, color=Y, r=14, enter="none", z=2, mv=[{"t": 5.6, "w": 0}, {"t": 6.3, "w": 300}, {"t": 8.6, "w": 900, "h": 1200, "r": 0}])]
els += [E("door", 540, 900, 230, 0, 8.7, enter="none", z=3, mv=[{"t": 5.6, "x": 540, "ry": 0}, {"t": 6.3, "x": 380, "ry": -70}])]
# saludos que bloquean la puerta
greet = [("HOLA,", 0.0, 420, 780, -8), ("QUÉ TAL,", 0.4, 680, 880, 6), ("BIENVENIDOS,", 0.9, 520, 1000, -3), ("HOY VAMOS A\nHABLAR DE…", 1.4, 560, 760, 4)]
for i, (txt, t, x, y, r) in enumerate(greet):
    out_x = -380 if i % 2 == 0 else 1460
    els += [S(x, y, 520, 150 if "\n" not in txt else 220, t, 8.7, color=W, r=20, enter="drop", rot=r, shadow=True, z=5 + 2 * i,
              mv=[{"t": 2.6, "fill": W}, {"t": 2.65, "fill": "#B9B9C0"}, {"t": 5.2, "x": x, "rot": r}, {"t": 5.9 + i * 0.08, "x": out_x, "rot": r * 4}])]
    els += [T(txt, x, y, t, 8.7, size=64 if "\n" not in txt else 54, color=BG, w=500, enter="drop", rot=r, z=6 + 2 * i,
              mv=[{"t": 5.2, "x": x, "rot": r}, {"t": 5.9 + i * 0.08, "x": out_x, "rot": r * 4}])]
# PARÁ
els += [E("stop-sign", 540, 560, 220, 2.6, 3.25, enter="spin", z=14)]
els += [T("PARÁ.", 540, 330, 2.6, 3.25, size=200, color=R, glitch=True, fixed=True, z=9)]
els += [S(540, 960, 1080, 1920, 2.6, 3.25, color="rgba(0,0,0,0.55)", enter="none", z=13)]
els += [T("TODAVÍA NO ME DIJISTE\nPOR QUÉ MIRAR", 540, 340, 3.3, 5.15, size=74, color=W, letters=True, fixed=True, z=9)]
els += [E("face-with-monocle", 860, 520, 120, 4.3, 5.15, enter="drop", fixed=True, z=9)]
# el gancho detrás de la puerta
els += [T("PROBEMOS ASÍ:", 540, 330, 5.2, 6.15, size=80, color=W, enter="mask", fixed=True, z=9)]
els += [T("ESTE ERROR\nESTÁ ESCONDIENDO\nLO MEJOR\nDE TU VIDEO", 540, 860, 6.2, 8.7, size=82, color=BG, letters=True, z=8)]
els += [E("key", 860, 1130, 110, 7.7, 8.7, enter="spin", z=9)]
# ahora sí hay una pregunta
els += [E("red-question-mark", 540, 780, 300, 8.8, 10.1, enter="spin")]
els += [T("AHORA SÍ\nHAY UNA PREGUNTA", 540, 380, 8.8, 10.1, size=90, color=W, enter="blur", fixed=True)]
# la presentación puede esperar
els += [E("hourglass-not-done", 540, 760, 220, 10.2, 11.7, enter="drop", mv=[{"t": 10.7, "rot": 0}, {"t": 11.4, "rot": 180}])]
els += [T("LA PRESENTACIÓN\nPUEDE ESPERAR", 540, 380, 10.2, 11.7, size=88, color=GR, enter="mask", fixed=True)]
els += [T("MOSTRÁ\nPRIMERO", 540, 560, 11.8, 13.6, size=170, color=Y, letters=True)]
els += [T("qué vale la pena descubrir", 540, 840, 12.6, 13.6, size=52, weight=500, color=W, enter="up")]
els += [E("light-bulb", 540, 1030, 150, 13.0, 13.6, enter="drop")]
# comparación de inicios
for i, (lab, txt, emo, c, fg, x, t0) in enumerate([("CONTEXTO", "«Hola, bienvenidos,\nhoy vamos a hablar de…»", "sleeping-face", "#2C2C33", GR, 280, 13.7), ("MOTIVO PARA MIRAR", "«Este error esconde\nlo mejor de tu video»", "eyes", Y, BG, 800, 14.4)]):
    els += [S(x, 820, 470, 640, t0, 17.2, color=c, r=30, enter="flip", shadow=True)]
    els += [P(lab, x, 560, t0 + 0.15, 17.2, color=BG if i else R, fg=W, size=24, enter="flip")]
    els += [T(txt, x, 820, t0 + 0.2, 17.2, size=40, color=fg if i else W, w=420, enter="flip")]
    els += [E(emo, x, 1040, 110, t0 + 0.35, 17.2, enter="drop")]
els += [S(280, 820, 420, 14, 15.6, 17.2, color=R, r=7, rot=-25, enter="mask", z=7)]
els += [T("¿CON CUÁL TE QUEDÁS?", 540, 330, 13.7, 17.2, size=72, color=W, enter="up", fixed=True)]
# CTA
els += [T("PROBALO", 540, 640, 17.3, None, size=170, color=Y, letters=True)]
els += [T("EN TU PRÓXIMO REEL", 540, 800, 17.8, None, size=72, color=W, enter="mask")]
els += [E("bullseye", 540, 1000, 150, 18.2, None, enter="spin")]
save("07", {
    "end": 20.6, "accent": Y, "capBg": "rgba(0,0,0,0.8)", "capY": 1340,
    "keys": ["Pará.", "mirar.", "error", "mejor", "pregunta.", "esperar.", "primero", "descubrir."],
    "scenes": [{"start": 0, "bg": BG}, {"start": 2.6, "bg": "#1A0907", "tr": "cut"}, {"start": 3.3, "bg": BG, "tr": "cut"}, {"start": 8.8, "bg": "#15131C", "tr": "zoom"},
               {"start": 10.2, "bg": BG, "tr": "whip"}, {"start": 11.8, "bg": "#16140A", "tr": "circle"}, {"start": 13.7, "bg": "#101015", "tr": "wipe"}, {"start": 17.3, "bg": BG, "tr": "zoom"}],
    "cam": [{"t": 0, "s": 1}, {"t": 2.55, "s": 1.18, "rot": -1}, {"t": 2.6, "s": 1.3, "rot": 0}, {"t": 3.25, "s": 1.3}, {"t": 3.3, "s": 1}, {"t": 5.2, "s": 1.05}, {"t": 6.3, "s": 1.05}, {"t": 8.7, "s": 1.25},
            {"t": 8.8, "s": 1}, {"t": 13.6, "s": 1.05}, {"t": 13.7, "s": 1, "ry": 0}, {"t": 14.4, "ry": 0}, {"t": 15.4, "ry": -10}, {"t": 17.2, "ry": 6}, {"t": 17.3, "ry": 0}],
    "shakes": [{"t": 2.6, "a": 26}, {"t": 5.9, "a": 10}, {"t": 11.8, "a": 12}],
    "sfx": [{"t": 0.0, "name": "pop"}, {"t": 0.4, "name": "pop"}, {"t": 0.9, "name": "pop"}, {"t": 1.4, "name": "pop"}, {"t": 2.6, "name": "hit", "v": 0.4}, {"t": 5.9, "name": "whoosh", "v": 0.3}, {"t": 6.2, "name": "brillo", "v": 0.25}, {"t": 8.8, "name": "pop"}, {"t": 11.8, "name": "hit", "v": 0.25}, {"t": 13.7, "name": "click"}, {"t": 14.4, "name": "click"}, {"t": 17.3, "name": "brillo", "v": 0.25}],
    "els": els,
})
