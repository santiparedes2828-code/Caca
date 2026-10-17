import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#16131F"; GRAY = "#9A98A8"; VIO = "#7B5CFF"; W = "#F4F2FA"; LIME = "#C6FF3D"
els = []
def anim(t0, t1, x=540, y=800, sc=1.0, z=3):
    """Caja de auriculares ficticia: entra con roce (t0..+0.8), se abre con clic (+1.3), el producto aterriza (+2.0)."""
    k = sc
    body = S(x - 700, y + 60 * k, 420 * k, 280 * k, t0, t1, color=GRAY, r=30 * k, enter="none", z=z, shadow=True,
             mv=[{"t": t0, "x": x - 700 * k}, {"t": t0 + 0.8, "x": x}])
    lid = S(x - 700, y - 100 * k, 440 * k, 70 * k, t0, t1, color=VIO, r=20 * k, enter="none", z=z + 1,
            mv=[{"t": t0, "x": x - 700 * k, "rot": 0, "y": y - 100 * k}, {"t": t0 + 0.8, "x": x}, {"t": t0 + 1.25, "rot": 0, "y": y - 100 * k, "x": x}, {"t": t0 + 1.4, "rot": -28, "y": y - 170 * k, "x": x - 60 * k}])
    lab = T("sonora.", x - 700, y + 70 * k, t0, t1, size=56 * k, color=BG, w=380 * k, enter="none", z=z + 1, mv=[{"t": t0, "x": x - 700 * k}, {"t": t0 + 0.8, "x": x}])
    prod = E("headphone", x, y - 700 * k, 230 * k, t0 + 1.5, t1, enter="none", z=z + 2,
             mv=[{"t": t0 + 1.5, "y": y - 700 * k, "s": 1}, {"t": t0 + 1.95, "y": y - 120 * k, "s": 1}, {"t": t0 + 2.02, "s": 1.12}, {"t": t0 + 2.2, "s": 1}])
    shadow = S(x, y + 215 * k, 360 * k, 30 * k, t0 + 0.6, t1, color="rgba(0,0,0,0.35)", r=15 * k, enter="fade", z=z - 1)
    return [shadow, body, lid, lab, prod]
els += [P("DEMOSTRACIÓN · PRODUCTO FICTICIO", 540, 1240, 0, None, color="#2A2638", size=20, enter="none", fixed=True)]
# A · sin efectos
els += [T("A", 160, 320, 0, 4.75, size=200, color=GRAY, enter="none", fixed=True)]
els += [T("SIN\nEFECTOS", 600, 320, 0, 4.75, size=84, color=W, enter="none", fixed=True)]
els += [E("muted-speaker", 900, 520, 110, 0.4, 4.75, enter="pop", fixed=True)]
els += anim(1.9, 4.75)
els += [T("escuchá…", 540, 1120, 2.0, 4.75, size=44, weight=500, color=GRAY, enter="fade")]
# B · con sonido (misma animación)
els += [T("B", 160, 320, 4.8, 9.5, size=200, color=LIME, enter="drop", fixed=True)]
els += [T("CON\nSONIDO", 600, 320, 4.8, 9.5, size=84, color=W, enter="drop", fixed=True)]
els += [E("speaker-high-volume", 900, 520, 110, 5.2, 9.5, enter="pop", fixed=True)]
els += anim(6.5, 9.5)
els += [T("escuchá…", 540, 1120, 6.6, 9.5, size=44, weight=500, color=GRAY, enter="fade")]
# Las tres capas
els += anim(11.6, 15.5, x=540, y=620, sc=0.7)
for i, (lab, t, c) in enumerate([("ROCE", 11.8, GRAY), ("CLIC", 12.9, VIO), ("GOLPE SUAVE", 13.6, LIME)]):
    y = 920 + i * 110
    els += [S(540, y, 820, 80, 11.4 + i * 0.1, 15.5, color="#221E30", r=16, enter="left", z=3)]
    els += [T(lab, 270, y, 11.45 + i * 0.1, 15.5, size=34, color=W, w=280, enter="left", z=4)]
    for j in range(12):
        h = 10 + ((j * 37 + i * 11) % 50) if abs(j - 6) < 3 else 8
        els += [S(470 + j * 36, y, 14, 8, t, 15.5, color=c, r=7, enter="none", z=4, mv=[{"t": t, "h": 8}, {"t": t + 0.15, "h": h + 20}, {"t": t + 0.5, "h": h}])]
els += [T("3 CAPAS", 540, 320, 9.6, 15.5, size=110, color=W, letters=True, fixed=True)]
# selector A/B
els += [S(300, 760, 380, 460, 15.6, None, color="#221E30", r=30, enter="flip", z=2), S(780, 760, 380, 460, 15.75, None, color="#221E30", r=30, enter="flip", z=2)]
els += [T("A", 300, 640, 15.65, None, size=120, color=GRAY, enter="flip", z=3), T("B", 780, 640, 15.8, None, size=120, color=LIME, enter="flip", z=3)]
els += [E("muted-speaker", 300, 820, 120, 15.7, None, enter="flip", z=3), E("speaker-high-volume", 780, 820, 120, 15.85, None, enter="flip", z=3)]
els += [S(540, 1080, 260, 110, 18.9, None, color="#2A2638", r=55, enter="pop", z=3)]
els += [S(480, 1080, 90, 90, 18.95, None, color=GRAY, r=45, enter="pop", z=4, mv=[{"t": 19.6, "x": 480, "fill": GRAY}, {"t": 20.0, "x": 600, "fill": LIME}, {"t": 21.0, "x": 600}, {"t": 21.4, "x": 480, "fill": GRAY}, {"t": 22.4, "x": 480}, {"t": 22.8, "x": 600, "fill": LIME}])]
els += [S(300, 760, 400, 480, 19.0, None, color="transparent", r=34, stroke=W, sw=5, enter="pop", z=5, mv=[{"t": 19.6, "x": 300}, {"t": 20.0, "x": 780}, {"t": 21.0, "x": 780}, {"t": 21.4, "x": 300}, {"t": 22.4, "x": 300}, {"t": 22.8, "x": 780}])]
els += [T("¿CON CUÁL\nTE QUEDÁS?", 540, 330, 15.6, None, size=96, color=W, letters=True, fixed=True)]
save("16", {
    "end": 24.5, "accent": LIME, "capStyle": "karaoke", "capColor": "#FFFFFF", "capY": 1330,
    "keys": [],
    "scenes": [{"start": 0, "bg": BG, "fx": "grid"}, {"start": 4.8, "bg": "#1B1530", "tr": "wipe", "fx": "grid"}, {"start": 9.6, "bg": BG, "tr": "circle", "fx": "lines"}, {"start": 15.6, "bg": "#1B1530", "tr": "whip", "fx": "dots"}],
    "cam": [{"t": 0, "s": 1, "rot": 0}, {"t": 1.9, "s": 1}, {"t": 4.7, "s": 1.06}, {"t": 4.8, "s": 1}, {"t": 6.5, "s": 1}, {"t": 9.4, "s": 1.06}, {"t": 9.6, "s": 1}, {"t": 15.5, "s": 1.03}, {"t": 15.6, "s": 1}],
    "shakes": [{"t": 8.5, "a": 8}, {"t": 13.6, "a": 6}],
    "sfx": [{"t": 6.55, "name": "whoosh", "v": 0.35}, {"t": 7.8, "name": "click", "v": 0.45}, {"t": 8.5, "name": "hit", "v": 0.3},
            {"t": 11.65, "name": "whoosh", "v": 0.3}, {"t": 12.9, "name": "click", "v": 0.4}, {"t": 13.6, "name": "hit", "v": 0.25},
            {"t": 20.0, "name": "click", "v": 0.3}, {"t": 22.8, "name": "click", "v": 0.3}],
    "els": els,
})
