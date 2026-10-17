import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BLUE = "#0B1A3A"; CREAM = "#F3EBDD"; GOLD = "#B8925A"; YEL = "#FFD23F"; INK = "#111"
CUP = "teacup-without-handle"
els = []
els += [P("DEMOSTRACIÓN · OBJETO GENÉRICO", 540, 1230, 0, 21.0, color="#222", size=22, enter="none")]
# 0–4.1 · tres tazas idénticas
els += [T("EL MISMO OBJETO", 540, 330, 0, 4.1, size=100, color=INK, enter="none")]
for i, (x, word, c, t) in enumerate([(210, "MIEDO", "#3B6FD8", 1.4), (540, "LUJO", GOLD, 2.3), (870, "RISA", "#E0A800", 3.0)]):
    els += [S(x, 820, 300, 400, 0, 4.1, color="#FFFFFF", r=30, enter="none", shadow=True, mv=[{"t": t, "s": 1}, {"t": t + 0.12, "s": 1.07}, {"t": t + 0.3, "s": 1}])]
    els += [E(CUP, x, 840, 190, 0, 4.1, enter="none")]
    els += [T(str(i + 1), x, 680, 0, 4.1, size=64, color="#BBB", enter="none")]
    els += [T(word, x, 1090, t, 4.1, size=62, color=c, w=320)]
els += [T("MIRÁ.", 540, 820, 4.2, 4.8, size=200, color=INK, enter="zoom", z=8)]
els += [S(540, 820, 1080, 700, 4.2, 4.8, color="rgba(244,241,234,0.92)", enter="fade", z=7)]
# 4.8–8.1 · terror
els += [T("1 · TERROR", 540, 300, 4.8, 8.1, size=96, color="#8FB0FF", enter="fade")]
els += [E(CUP, 540, 840, 300, 4.8, 8.1, enter="fade", mv=[{"t": 7.55, "x": 540, "rot": 0}, {"t": 7.6, "x": 528, "rot": -3}, {"t": 7.68, "x": 552, "rot": 3}, {"t": 7.78, "x": 540, "rot": 0}])]
els += [S(-200, 840, 900, 1400, 4.9, 8.1, color="transparent", grad="linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0))", enter="none", z=5, mv=[{"t": 4.9, "x": -300}, {"t": 7.5, "x": 300}])]
els += [T("casi no se mueve", 540, 470, 5.4, 6.6, size=50, weight=500, color="#6E7FA8")]
for i in range(9):
    els += [S(300 + i * 60, 1110, 14, 30 + (i * 37) % 60, 6.6 + i * 0.04, 8.1, color="#3B6FD8", r=7, z=4)]
els += [T("…", 540, 470, 7.4, 8.1, size=120, color="#8FB0FF")]
# 8.2–10.8 · lujo
els += [S(540, 860, 760, 760, 8.2, 10.8, color="transparent", r=380, grad="radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)", enter="fade", z=1)]
els += [E(CUP, 540, 880, 420, 8.2, 10.8, enter="fade", mv=[{"t": 8.5, "s": 1}, {"t": 10.7, "s": 1.25}])]
els += [S(200, 700, 120, 1300, 8.3, 10.8, color="transparent", grad="linear-gradient(90deg, rgba(255,240,210,0), rgba(255,240,210,0.7), rgba(255,240,210,0))", enter="none", rot=25, z=5, mv=[{"t": 8.3, "x": 100}, {"t": 10.6, "x": 980}])]
els += [T("2 · LUJO", 540, 300, 8.2, 10.8, size=96, color=GOLD, enter="up")]
els += [T("cada detalle\ntiene espacio", 540, 470, 9.0, 10.8, size=50, weight=500, color="#8A7A63")]
els += [E("gem-stone", 820, 640, 90, 9.4, 10.8)]
# 10.9–13.3 · comedia
els += [T("3 · COMEDIA", 540, 300, 10.9, 13.3, size=96, color=INK, enter="left")]
els += [E(CUP, 540, 860, 320, 10.9, 13.3, mv=[{"t": 11.4, "x": 540, "rot": 0, "y": 860}, {"t": 12.1, "x": 1250, "rot": 70, "y": 900}, {"t": 12.45, "x": 1250}, {"t": 12.75, "x": 540, "rot": -10, "s": 1.25}, {"t": 12.95, "rot": 4, "s": 0.95}, {"t": 13.1, "rot": 0, "s": 1}])]
els += [T("¡PUM!", 540, 520, 12.8, 13.3, size=150, color="#E5383B", rot=-6)]
els += [E("face-with-tears-of-joy", 840, 1080, 130, 12.9, 13.3)]
# 13.4–15.3 · la edición cambia lo que sentís
els += [S(540, 860, 520, 520, 13.4, 15.3, color=BLUE, r=40, shadow=True, mv=[{"t": 13.4, "fill": BLUE}, {"t": 13.9, "fill": CREAM}, {"t": 14.4, "fill": YEL}, {"t": 14.9, "fill": BLUE}])]
els += [E(CUP, 540, 870, 260, 13.45, 15.3)]
els += [T("LA EDICIÓN\nCAMBIA LO QUE SENTÍS", 540, 380, 13.4, 15.3, size=84, color="#FFFFFF", enter="up")]
# 15.4–21 · mosaico y elección
for i, (x, c, fg, t) in enumerate([(210, BLUE, "#8FB0FF", 15.4), (540, CREAM, GOLD, 15.8), (870, YEL, INK, 16.6)]):
    els += [S(x, 800, 300, 460, 15.4 + i * 0.08, None, color=c, r=28, shadow=True, enter="up", mv=[{"t": t, "s": 1}, {"t": t + 0.12, "s": 1.1}, {"t": t + 0.35, "s": 1}])]
    els += [T(str(i + 1), x, 680, 15.45 + i * 0.08, None, size=110, color=fg, enter="up")]
    els += [E(CUP, x, 860, 170, 15.5 + i * 0.08, None, enter="up")]
els += [T("¿CUÁL\nTE GUSTA MÁS?", 540, 360, 15.4, None, size=92, color=INK, enter="up")]
els += [T("ELEGÍ 1, 2 O 3", 540, 1110, 17.2, None, size=104, color="#E5383B")]
save("02", {
    "end": 21.0, "accent": "#E5383B", "capBg": "rgba(10,10,10,0.8)", "capY": 1340,
    "keys": ["miedo,", "lujo", "reír.", "terror,", "lujo,", "comedia,", "golpe.", "sentís."],
    "scenes": [{"start": 0, "bg": "#F4F1EA"}, {"start": 4.8, "bg": BLUE}, {"start": 8.2, "bg": CREAM}, {"start": 10.9, "bg": YEL}, {"start": 13.4, "bg": "#1A1A1E"}, {"start": 15.4, "bg": "#F4F1EA"}],
    "sfx": [{"t": 1.4, "name": "pop"}, {"t": 2.3, "name": "pop"}, {"t": 3.0, "name": "pop"}, {"t": 4.2, "name": "hit", "v": 0.25}, {"t": 7.6, "name": "hit", "v": 0.3}, {"t": 9.4, "name": "brillo", "v": 0.25}, {"t": 11.5, "name": "whoosh", "v": 0.3}, {"t": 12.75, "name": "pop", "v": 0.4}, {"t": 15.4, "name": "click"}, {"t": 15.8, "name": "click"}, {"t": 16.6, "name": "click"}],
    "els": els,
})
