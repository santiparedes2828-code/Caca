import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#0E0F13"; FILE = "#F2F2F2"; ACC = "#FF6B35"; W = "#FFFFFF"; DIM = "#6B7080"; NOTE = "#FFE066"
els = []
# Archivo MP4
fk = [{"t": 0, "s": 1}, {"t": 1.8, "s": 1}, {"t": 2.4, "s": 0.8, "y": 520}, {"t": 9.0, "y": 520, "s": 0.8}, {"t": 9.6, "y": 880, "s": 1.05}, {"t": 10.4, "s": 1}, {"t": 10.8, "s": 0.55, "y": 620, "o": 1}, {"t": 11.1, "o": 0, "s": 0.3}]
els += [S(540, 880, 360, 460, 0, 11.1, color=FILE, r=24, enter="none", shadow=True, z=10, mv=[dict(k) for k in fk])]
els += [S(540, 880, 360, 460, 9.5, 10.6, color="transparent", r=24, stroke=ACC, sw=10, enter="none", z=11, mv=[dict(k) for k in fk] + [{"t": 9.5, "o": 1}, {"t": 10.5, "o": 0}])]
els += [T("MP4", 540, 880, 0, 11.1, size=110, color=BG, enter="none", z=11, mv=[dict(k) for k in fk])]
els += [T("archivo final", 540, 1170, 0, 1.75, size=44, weight=500, color=DIM, enter="none", z=11)]
# Capas que salen del archivo (vista explotada con la cámara inclinada)
layers = [("IDEA", "light-bulb", "#3A86FF", 3.9), ("QUÉ MOSTRAR", "film-frames", "#8338EC", 6.3), ("SONIDO", "speaker-high-volume", "#06D6A0", 7.0)]
for i, (lab, emo, c, t0) in enumerate(layers):
    y = 760 + i * 230
    mv = [{"t": t0, "y": 520, "s": 0.6}, {"t": t0 + 0.5, "y": y, "s": 1}, {"t": 9.0, "y": y, "s": 1}, {"t": 9.5, "y": 880, "s": 0.5, "o": 1}, {"t": 9.6, "o": 0}]
    els += [S(540, y, 760, 190, t0, 9.6, color=c, r=26, enter="none", z=5 - i, shadow=True, mv=[{"t": t0 - 0.01, "o": 0}, {"t": t0, "o": 1}] + mv)]
    els += [E(emo, 260, y, 110, t0, 9.6, enter="none", z=6, mv=[{"t": t0 - 0.01, "o": 0}, {"t": t0, "o": 1}] + [dict(m, x=260) for m in mv])]
    els += [T(lab, 600, y, t0, 9.6, size=58, color=W, w=560, enter="none", z=6, mv=[{"t": t0 - 0.01, "o": 0}, {"t": t0, "o": 1}] + [dict(m, x=600) for m in mv])]
# Notas de revisión: entran desordenadas y se ordenan
for k in range(5):
    sx, sy, r = [(120, 600, -18), (980, 700, 14), (90, 1200, 10), (1000, 1150, -12), (540, 1420, 20)][k]
    tx, ty = 900, 700 + k * 110
    mv = [{"t": 7.6 + k * 0.1, "x": sx, "y": sy, "rot": r}, {"t": 8.4 + k * 0.08, "x": sx, "y": sy, "rot": r}, {"t": 8.9 + k * 0.08, "x": tx, "y": ty, "rot": 0}, {"t": 9.2, "x": tx, "y": ty, "s": 1}, {"t": 9.55, "x": 540, "y": 880, "s": 0.2, "o": 0}]
    els += [S(sx, sy, 170, 90, 7.6 + k * 0.1, 9.6, color=NOTE, r=8, enter="pop", z=8, shadow=True, mv=mv)]
    els += [T("corrección", sx, sy, 7.62 + k * 0.1, 9.6, size=26, color=BG, w=160, enter="pop", z=9, mv=mv)]
# Pregunta central
els += [T("?", 540, 640, 10.7, 13.0, size=420, color=ACC, enter="spin", z=12)]
els += [T("¿QUÉ QUERÉS\nQUE ENTIENDA\nLA PERSONA\nQUE LO VEA?", 540, 800, 13.1, 15.55, size=104, color=W, letters=True, z=12)]
# Fijos
els += [T("EL ARCHIVO ES\nSOLO UNA PARTE", 540, 300, 1.8, 3.85, size=84, color=W, letters=True, fixed=True, z=30)]
els += [T("ORDENAR LA IDEA", 540, 300, 3.9, 6.25, size=84, color="#3A86FF", enter="mask", fixed=True, z=30)]
els += [T("ELEGIR QUÉ MOSTRAR", 540, 300, 6.3, 7.55, size=78, color="#B388FF", enter="mask", fixed=True, z=30)]
els += [T("TUS CORRECCIONES,\nEN ORDEN", 540, 300, 7.6, 9.0, size=78, color=NOTE, enter="drop", fixed=True, z=30)]
els += [T("UNA PIEZA COHERENTE", 540, 300, 9.0, 10.55, size=76, color=ACC, enter="blur", fixed=True, z=30)]
els += [T("UN BUEN ENCARGO\nEMPIEZA CON UNA PREGUNTA", 540, 300, 10.6, 13.0, size=64, color=W, enter="mask", fixed=True, z=30)]
els += [S(540, 960, 1080, 1920, 15.6, None, color=ACC, enter="mask", mask="circle", fixed=True, z=35)]
els += [T("SI TENÉS UNA IDEA", 540, 700, 15.7, None, size=80, color=BG, letters=True, fixed=True, z=36)]
els += [S(540, 900, 700, 150, 16.5, None, color=BG, r=75, enter="pop", fixed=True, z=36)]
els += [T("ESCRIBIME VIDEO", 540, 900, 16.55, None, size=70, color=W, enter="pop", fixed=True, z=37)]
cam = [{"t": 0, "s": 1.15, "rx": 0, "rot": 0, "y": 0}, {"t": 1.8, "s": 1.0, "rx": 0}, {"t": 3.9, "s": 0.95, "rx": 0, "y": 0}, {"t": 4.5, "s": 0.92, "rx": 38, "y": -40, "rot": -6},
       {"t": 7.4, "s": 0.92, "rx": 34, "rot": -3}, {"t": 7.6, "rx": 0, "rot": 0, "s": 0.95, "y": 0}, {"t": 10.5, "s": 1}, {"t": 13.0, "s": 1.06}, {"t": 13.1, "s": 1}, {"t": 15.5, "s": 1.05}]
save("26", {
    "end": 21.0, "accent": ACC, "capStyle": "side", "capColor": "#FFFFFF", "capY": 1330,
    "keys": ["parte.", "idea,", "mostrar", "correcciones", "coherente.", "pregunta:", "vea?"],
    "scenes": [{"start": 0, "bg": BG, "fx": "vignette"}, {"start": 3.9, "bg": "#12131A", "tr": "zoom", "fx": "grid"}, {"start": 10.6, "bg": BG, "tr": "circle", "fx": "vignette"}],
    "cam": cam, "shakes": [{"t": 9.5, "a": 14}, {"t": 10.7, "a": 10}],
    "sfx": [{"t": 2.0, "name": "whoosh", "v": 0.25}, {"t": 3.9, "name": "pop"}, {"t": 6.3, "name": "pop"}, {"t": 7.0, "name": "pop"}, {"t": 7.6, "name": "click"}, {"t": 8.9, "name": "whoosh", "v": 0.25}, {"t": 9.5, "name": "hit", "v": 0.3}, {"t": 10.7, "name": "brillo", "v": 0.25}, {"t": 16.5, "name": "pop"}],
    "els": els,
})
