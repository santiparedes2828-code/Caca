import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
NAVY = "#0A1430"; LIME = "#C6FF3D"; W = "#FFFFFF"; Y = "#FFE600"; DIM = "#5B6788"
els = []
LINES = [[("NO", 330, 560), ("DIJE", 660, 560)], [("QUE", 375, 740), ("VOS", 700, 740)], [("LO", 235, 920), ("HICISTE", 690, 920)]]
FOCUS = [(6.15, 7.35, {"NO", "DIJE"}), (7.35, 8.25, {"VOS"}), (8.25, 9.6, {"LO", "HICISTE"})]
starts = {"NO": 1.4, "DIJE": 1.7, "QUE": 2.0, "VOS": 2.2, "LO": 2.5, "HICISTE": 2.6}
for line in LINES:
    for w, x, y in line:
        kf = [{"t": 0, "x": x, "y": y + 80, "o": 0, "s": 1, "blur": 14, "w": 700, "fill": W}, {"t": starts[w], "o": 0, "y": y + 80, "blur": 14}, {"t": starts[w] + 0.25, "o": 1, "y": y, "blur": 0}]
        for a, b, fw in FOCUS:
            on = w in fw
            kf += [{"t": a, "s": 1, "blur": 0, "o": 1}, {"t": a + 0.25, "s": 1.15 if on else 0.9, "blur": 0 if on else 12, "o": 1 if on else 0.35, "fill": LIME if on else W}, {"t": b - 0.05, "s": 1.15 if on else 0.9, "blur": 0 if on else 12, "o": 1 if on else 0.35, "fill": LIME if on else W}]
        kf += [{"t": 9.6, "s": 1, "blur": 0, "o": 1, "fill": W}, {"t": 9.75, "s": 1, "blur": 0, "o": 1}, {"t": 10.2, "o": 0, "blur": 20, "s": 1.4}]
        kf.sort(key=lambda k: k["t"])
        els += [{"type": "text", "text": w, "size": 140, "weight": 800, "color": W, "z": 5, "kf": kf}]
els += [T("LEÉ ESTA FRASE", 540, 330, 0, 3.4, size=56, weight=500, color=DIM, enter="mask", fixed=True)]
els += [T("AHORA CAMBIAMOS\nEL FOCO", 540, 330, 3.5, 6.1, size=70, color=W, letters=True, fixed=True)]
els += [S(540, 740, 900, 6, 4.5, 6.1, color=LIME, r=3, enter="mask", z=3, mv=[{"t": 4.9, "y": 740}, {"t": 5.4, "y": 560}, {"t": 5.8, "y": 920}])]
# las palabras son las mismas: tres versiones
for i, (hi, y) in enumerate([("NO DIJE", 560), ("VOS", 800), ("LO HICISTE", 1040)]):
    t0 = 9.8 + i * 0.25
    els += [S(540, y, 860, 170, t0, 13.6, color="#13224D", r=26, enter="flip", z=4)]
    parts = "NO DIJE QUE VOS LO HICISTE".split()
    for j, pw in enumerate(parts):
        on = pw in hi.split()
        px = 150 + sum(len(q) * 34 + 26 for q in parts[:j]) + len(pw) * 17
        els += [T(pw, px, y, t0 + 0.05, 13.6, size=50, color=LIME if on else "#8C97B8", w=300, enter="flip", z=5)]
els += [T("LAS MISMAS PALABRAS", 540, 330, 9.7, 11.6, size=70, color=W, enter="mask", fixed=True)]
els += [T("OTRO SENTIDO", 540, 330, 11.7, 13.6, size=90, color=LIME, enter="blur", fixed=True)]
els += [S(540, 560, 900, 200, 11.7, 13.6, color="transparent", r=30, stroke=LIME, sw=6, enter="pop", z=6, mv=[{"t": 12.1, "y": 560}, {"t": 12.5, "y": 800}, {"t": 12.9, "y": 800}, {"t": 13.3, "y": 1040}])]
# los subtítulos también se editan
els += [S(540, 760, 900, 150, 13.7, 16.05, color="rgba(0,0,0,0.6)", r=24, enter="up", z=4)]
els += [T("no dije que vos lo hiciste", 540, 760, 13.75, 16.05, size=58, weight=700, color=W, w=880, enter="up", z=5)]
els += [S(575, 812, 130, 10, 14.6, 16.05, color=LIME, r=5, enter="mask", z=6)]
els += [E("pencil", 800, 640, 120, 14.2, 16.05, enter="drop", z=7, mv=[{"t": 14.6, "x": 800}, {"t": 15.2, "x": 640, "rot": -10}])]
els += [T("SUBTÍTULOS\nTAMBIÉN SE EDITAN", 540, 360, 13.7, 16.05, size=74, color=W, letters=True, fixed=True)]
# no alcanza con pintarlos todos de amarillo
els += [T("NO DIJE QUE VOS\nLO HICISTE", 540, 760, 16.1, 18.6, size=100, color=Y, enter="zoom", z=5)]
els += [S(540, 760, 960, 18, 17.6, 18.6, color="#FF3B30", r=9, rot=-8, enter="mask", z=6)]
els += [T("TODO RESALTADO\n= NADA RESALTADO", 540, 360, 16.3, 18.6, size=70, color=W, enter="up", fixed=True)]
# CTA
els += [T("¿CUÁL CAMBIÓ MÁS\nEL SENTIDO?", 540, 380, 18.7, None, size=86, color=W, letters=True, fixed=True)]
for i, (lab, y) in enumerate([("1 · NO DIJE", 640), ("2 · VOS", 800), ("3 · LO HICISTE", 960)]):
    els += [S(540, y, 720, 130, 19.3 + i * 0.2, None, color=LIME if i == 1 else "#13224D", r=65, enter="right", z=4)]
    els += [T(lab, 540, y, 19.35 + i * 0.2, None, size=60, color=NAVY if i == 1 else W, enter="right", z=5)]
save("10", {
    "end": 22.4, "accent": LIME, "capStyle": "side", "capColor": "#FFFFFF", "capY": 1250,
    "keys": ["foco", "subtítulos", "amarillo."],
    "scenes": [{"start": 0, "bg": NAVY, "fx": "dots"}, {"start": 9.7, "bg": "#0C1838", "tr": "zoom", "fx": "dots"}, {"start": 13.7, "bg": NAVY, "tr": "wipe", "fx": "grid"}, {"start": 16.1, "bg": "#1A1A1A", "tr": "cut", "fx": "lines"}, {"start": 18.7, "bg": NAVY, "tr": "circle", "fx": "dots"}],
    "cam": [{"t": 0, "s": 1, "x": 0, "y": 0, "rot": 0, "rx": 0, "ry": 0}, {"t": 6.0, "s": 1.02, "y": 0}, {"t": 6.4, "s": 1.12, "y": 420, "rot": -3, "rx": -10, "ry": 0},
            {"t": 7.25, "s": 1.12, "y": 410}, {"t": 7.55, "s": 1.2, "y": 260, "x": -120, "rot": 2, "rx": 0, "ry": 14}, {"t": 8.15, "s": 1.2, "x": -125},
            {"t": 8.45, "s": 1.08, "y": 20, "x": 0, "rot": -2, "ry": -10, "rx": 10}, {"t": 9.5, "s": 1.08}, {"t": 9.8, "s": 1, "x": 0, "y": 0, "rot": 0, "rx": 0, "ry": 0}, {"t": 16.1, "s": 1.15, "rot": 3}, {"t": 18.6, "s": 1, "rot": 0}],
    "shakes": [{"t": 6.2, "a": 10}, {"t": 7.4, "a": 12}, {"t": 8.3, "a": 10}, {"t": 17.6, "a": 10}],
    "sfx": [{"t": 1.4, "name": "click"}, {"t": 6.2, "name": "whoosh", "v": 0.3}, {"t": 7.4, "name": "whoosh", "v": 0.3}, {"t": 8.3, "name": "whoosh", "v": 0.3}, {"t": 9.8, "name": "pop"}, {"t": 10.05, "name": "pop"}, {"t": 10.3, "name": "pop"}, {"t": 14.6, "name": "click"}, {"t": 17.6, "name": "hit", "v": 0.25}, {"t": 19.3, "name": "pop"}],
    "els": els,
})
