import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
CHAT = "#0B141A"; BUB = "#005C4B"; W = "#E9EDEF"; LIME = "#25D366"; RED = "#FF5C5C"; PAPER = "#FDFBF6"; INK = "#1C1C1C"
els = []
# 0–3.3 · burbuja de audio interminable (la cámara la recorre)
els += [S(2200, 900, 4100, 150, 0, 3.35, color=BUB, r=75, enter="none", z=2)]
els += [S(250, 900, 90, 90, 0, 3.35, color=W, r=45, enter="none", z=3), S(258, 900, 34, 40, 0, 3.35, color=BUB, tri=True, rot=90, enter="none", z=4)]
for k in range(110):
    h = 16 + ((k * 37) % 9) * 9
    els += [S(340 + k * 35, 900, 14, h, 0, 3.35, color="#7FD3B6" if k > 6 else W, r=7, enter="none", z=3)]
els += [E("studio-microphone", 4150, 900, 110, 0, 3.35, enter="none", z=4)]
els += [T("UN AUDIO\nLARGUÍSIMO", 540, 330, 0, 3.35, size=104, color=W, enter="none", fixed=True, z=30)]
els += [T("para UNA idea", 540, 520, 1.7, 3.35, size=56, weight=500, color=LIME, enter="up", fixed=True, z=30)]
# 3.4–9.0 · la transcripción (ejemplo ficticio)
lines = [("bueno, te cuento, eh, básicamente,", True), ("lo que hacemos es ordenar tu casa,", False), ("o sea, ordenamos, viste, ordenamos,", True),
         ("primero vemos qué te sobra,", False), ("después armamos un plan, eh,", False), ("y bueno, eso, un plan, y después lo hacemos.", False)]
els += [S(540, 820, 940, 760, 3.4, 9.05, color=PAPER, r=22, enter="flip", shadow=True, z=5)]
els += [P("TRANSCRIPCIÓN DE EJEMPLO", 540, 470, 3.5, 9.05, color=INK, size=22, enter="fade", z=6)]
for i, (txt, cut) in enumerate(lines):
    y = 560 + i * 100
    els += [T(txt, 540, y, 3.6 + i * 0.12, 9.05, size=36, weight=500, color=INK, w=880, enter="up", z=6, mv=[{"t": 8.0 + i * 0.05, "o": 1}, {"t": 8.4 + i * 0.05, "o": 0.25 if cut else 1}])]
    if cut:
        els += [S(540, y, 820, 6, 8.0 + i * 0.1, 9.05, color=RED, r=3, enter="mask", z=7)]
els += [S(560, 660, 600, 56, 5.6, 9.05, color="rgba(37,211,102,0.35)", r=10, enter="mask", z=5)]
for (y, w, x) in [(860, 420, 400), (960, 400, 420), (1060, 330, 640)]:
    els += [S(x, y, w, 50, 6.7, 9.05, color="rgba(255,197,61,0.35)", r=10, enter="mask", z=5)]
els += [T("ENCONTRAR LA IDEA", 540, 330, 5.6, 6.65, size=80, color=LIME, enter="mask", fixed=True, z=30)]
els += [T("ORDENAR", 540, 330, 6.7, 7.95, size=100, color="#FFC53D", enter="mask", fixed=True, z=30)]
els += [T("SACAR LAS VUELTAS", 540, 330, 8.0, 9.05, size=80, color=RED, glitch=True, fixed=True, z=30)]
els += [T("ANTES DE ANIMAR", 540, 330, 3.4, 5.55, size=86, color=W, enter="drop", fixed=True, z=30)]
# 9.1–11.3 · tres tarjetas
for i, (lab, txt, c) in enumerate([("QUÉ HACEMOS", "ordenar tu casa", LIME), ("CÓMO", "vemos qué sobra\ny armamos un plan", "#FFC53D"), ("SIGUIENTE PASO", "lo hacemos", "#53BDEB")]):
    y = 560 + i * 250
    els += [S(540, y, 860, 210, 9.2 + i * 0.25, 11.35, color="#1F2C34", r=28, enter="flip", z=8, shadow=True)]
    els += [S(140, y, 14, 150, 9.25 + i * 0.25, 11.35, color=c, r=7, enter="flip", z=9)]
    els += [T(lab, 560, y - 50, 9.3 + i * 0.25, 11.35, size=34, color=c, w=760, enter="flip", z=9), T(txt, 560, y + 25, 9.35 + i * 0.25, 11.35, size=46, color=W, w=760, enter="flip", z=9)]
# 11.4–15.5 · mini explicación (recorrido vertical de principio a fin)
for i, (emo, lab, bg) in enumerate([("package", "1 · LO QUE SOBRA", "#2A3942"), ("clipboard", "2 · UN PLAN", "#1F2C34"), ("sparkles", "3 · EN ORDEN", "#103D33")]):
    y = 2000 + i * 1000
    els += [S(540, y, 900, 720, 11.3, 15.6, color=bg, r=40, enter="fade", z=2)]
    els += [E(emo, 540, y + 60, 280, 11.4 + i * 1.3, 15.6, enter="drop", z=3)]
    els += [T(lab, 540, y - 250, 11.5 + i * 1.3, 15.6, size=64, color=W, enter="mask", z=3)]
els += [P("ORDEN · SERVICIO FICTICIO", 540, 1240, 0, None, color="#1F2C34", fg=W, size=20, enter="none", fixed=True, z=40)]
# CTA
els += [S(540, 960, 1080, 1920, 15.6, None, color=LIME, enter="mask", mask="circle", fixed=True, z=35)]
els += [T("ESCRIBIME\nCLARO", 540, 720, 15.7, None, size=150, color=CHAT, letters=True, fixed=True, z=36)]
els += [T("si querés explicar\ntu oferta así", 540, 980, 16.4, None, size=56, weight=700, color=CHAT, enter="up", fixed=True, z=36)]
def at(x, y, s, rot=0):
    return {"x": -(x - 540) * s, "y": -(y - 960) * s, "s": s, "rot": rot}
cam = [dict(t=0, **at(500, 900, 1.6)), dict(t=0.6, **at(700, 900, 1.6)), dict(t=2.3, **at(3400, 900, 1.5, -3)), dict(t=2.8, **at(2200, 900, 0.24, 0)), dict(t=3.35, **at(2200, 900, 0.24)),
       dict(t=3.4, **at(540, 900, 1.0)), dict(t=9.0, **at(540, 900, 1.04)), dict(t=9.1, **at(540, 860, 1.0)), dict(t=11.3, **at(540, 860, 1.0)),
       dict(t=11.4, **at(540, 2090, 1.0)), dict(t=12.6, **at(540, 2090, 1.02)), dict(t=12.9, **at(540, 3090, 1.0, 2)), dict(t=13.9, **at(540, 3090, 1.02, 2)), dict(t=14.2, **at(540, 4090, 1.0, -2)), dict(t=15.5, **at(540, 4090, 1.04))]
save("20", {
    "end": 21.0, "accent": LIME, "capStyle": "side", "capColor": "#E9EDEF", "capY": 1330,
    "keys": ["larguísimo", "idea.", "idea,", "importante", "vueltas.", "imágenes", "texto.", "fin."],
    "scenes": [{"start": 0, "bg": CHAT, "fx": "dots"}, {"start": 3.4, "bg": "#111B21", "tr": "zoom", "fx": "lines"}, {"start": 9.1, "bg": CHAT, "tr": "whip", "fx": "grid"}, {"start": 11.4, "bg": CHAT, "tr": "cut", "fx": "dots"}],
    "cam": cam, "shakes": [{"t": 2.8, "a": 12}, {"t": 8.0, "a": 10}],
    "sfx": [{"t": 0.2, "name": "click"}, {"t": 2.3, "name": "whoosh", "v": 0.3}, {"t": 3.4, "name": "whoosh", "v": 0.3}, {"t": 5.6, "name": "click"}, {"t": 6.7, "name": "click"}, {"t": 8.0, "name": "hit", "v": 0.2}, {"t": 9.2, "name": "pop"}, {"t": 9.45, "name": "pop"}, {"t": 9.7, "name": "pop"}, {"t": 11.4, "name": "whoosh", "v": 0.3}, {"t": 12.7, "name": "whoosh", "v": 0.25}, {"t": 14.0, "name": "whoosh", "v": 0.25}, {"t": 15.7, "name": "brillo", "v": 0.25}],
    "els": els,
})
