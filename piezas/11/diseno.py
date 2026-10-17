import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#E9E4DC"; BROWN = "#3B2418"; TERRA = "#C8643B"; CREAM = "#F7EFE3"; INK = "#141414"
PX, PY = 540, 860
els = []
def phone(t0, t1, enter="none"):
    return [S(PX, PY, 580, 1120, t0, t1, color="#111", r=74, enter=enter, shadow=True, z=1), S(PX, PY, 540, 1080, t0, t1, color="#FAF7F2", r=56, enter=enter, z=2)]
# 0–3 · perfil lleno de tarjetas ambiguas
els += phone(0, 9.0)
els += [S(PX - 180, PY - 430, 120, 120, 0, 3.05, color="#D6D0C7", r=60, enter="none", z=3), S(PX + 40, PY - 450, 220, 26, 0, 3.05, color="#CFC8BE", r=13, enter="none", z=3), S(PX + 10, PY - 405, 160, 20, 0, 3.05, color="#E0DAD1", r=10, enter="none", z=3)]
cols = ["#B8C4D6", "#E8C9A0", "#C9D8B6", "#D9B8C8", "#BFD9D6", "#E3D3A8", "#C4BEDB", "#DCC2B0", "#B9CFE0"]
for k in range(9):
    x = PX - 170 + (k % 3) * 170; y = PY - 180 + (k // 3) * 170
    els += [S(x, y, 160, 160, 0.1 + k * 0.05, 3.05, color=cols[k], r=8, enter="pop", z=3)]
    els += [T("?", x, y, 0.1 + k * 0.05, 3.05, size=70, color="#FFFFFF", enter="pop", z=4)]
els += [E("red-question-mark", 860, 520, 170, 2.2, 3.05, enter="spin", z=8)]
els += [T("¿SE ENTIENDE\nQUÉ VENDÉS?", 540, 290, 0, 3.05, size=84, color=INK, enter="none", fixed=True)]
# 3.1–8.9 · microanuncio dentro del teléfono
els += [S(PX, PY, 540, 1080, 3.1, 9.0, color=BROWN, r=56, enter="mask", mask="circle", z=5)]
els += [E("hot-beverage", PX, PY - 250, 240, 3.3, 9.0, enter="blur", z=6, mv=[{"t": 3.6, "s": 1}, {"t": 8.8, "s": 1.12}])]
for i in range(3):
    t0 = 3.6 + i * 0.4
    els += [S(PX - 40 + i * 40, PY - 330, 30, 90, t0, 9.0, color="rgba(255,255,255,0.35)", r=15, enter="fade", z=6, mv=[{"t": t0, "y": PY - 320}, {"t": 9.0, "y": PY - 470}])]
els += [T("pausa.", PX, PY - 440, 4.1, 9.0, size=80, color=CREAM, enter="mask", z=7)]
els += [T("CAFÉ\nRECIÉN HECHO", PX, PY - 40, 5.0, 9.0, size=60, color=CREAM, enter="up", z=7)]
els += [E("couch-and-lamp", PX - 160, PY + 130, 110, 6.3, 9.0, enter="drop", z=7)]
els += [T("para bajar\nun cambio", PX + 60, PY + 130, 6.4, 9.0, size=42, weight=500, color="#E2C9A6", w=300, enter="right", z=7)]
els += [P("UBICACIÓN EN EL PERFIL", PX + 30, PY + 250, 8.0, 9.0, color=TERRA, size=24, enter="flip", z=7)]
els += [E("round-pushpin", PX - 200, PY + 250, 70, 8.1, 9.0, enter="drop", z=8)]
# 9.0–11.1 · vista explotada: tres ideas, una presentación
for i, (lab, emo, c) in enumerate([("PRODUCTO", "hot-beverage", BROWN), ("AMBIENTE", "couch-and-lamp", TERRA), ("UBICACIÓN", "round-pushpin", "#7A8B6F")]):
    y0 = 560 + i * 300; t0 = 9.0 + i * 0.2
    mv = [{"t": 9.9, "y": y0}, {"t": 10.6, "y": 860}]
    els += [S(540, y0, 640, 260, t0, 11.15, color=c, r=30, enter="flip", shadow=True, z=3 + i, mv=mv)]
    els += [E(emo, 330, y0, 120, t0 + 0.05, 11.15, enter="flip", z=4 + i, mv=[{"t": 9.9, "y": y0}, {"t": 10.6, "y": 860}])]
    els += [T(f"{i + 1} · {lab}", 600, y0, t0 + 0.05, 11.15, size=50, color=CREAM, w=440, enter="flip", z=4 + i, mv=[{"t": 9.9, "y": y0}, {"t": 10.6, "y": 860, "o": 1}, {"t": 10.65, "o": 0 if i < 2 else 1}])]
els += [T("TRES IDEAS", 540, 300, 9.0, 9.85, size=100, color=INK, enter="mask", fixed=True)]
els += [T("UNA PRESENTACIÓN", 540, 300, 9.9, 11.15, size=86, color=TERRA, enter="blur", fixed=True)]
# 11.2–15.8 · con tu negocio
els += phone(11.2, 15.85, enter="up")
for i, (lab, y) in enumerate([("TU PRODUCTO", PY - 260), ("TU AMBIENTE", PY), ("DÓNDE ENCONTRARTE", PY + 260)]):
    els += [S(PX, y, 460, 200, 11.6 + i * 0.25, 15.85, color="transparent", r=24, stroke="#B9B2A8", sw=5, enter="mask", z=3)]
    els += [T(lab, PX, y, 11.7 + i * 0.25, 15.85, size=44, color="#8A837A", w=440, enter="up", z=4)]
els += [T("¿QUÉ TENDRÍA\nQUE ENTENDER?", 540, 290, 13.6, 15.85, size=84, color=INK, letters=True, fixed=True)]
els += [E("face-with-monocle", 890, 470, 120, 14.4, 15.85, enter="drop", fixed=True)]
# 15.9–21 · microanuncio completo + CTA
els += [S(540, 960, 1080, 1920, 15.9, None, color=BROWN, enter="mask", mask="circle", z=1)]
els += [E("hot-beverage", 540, 640, 260, 16.0, None, enter="blur", z=3)]
els += [T("pausa.", 540, 420, 16.1, None, size=110, color=CREAM, enter="mask", z=3)]
els += [T("ESCRIBIME\nNEGOCIO", 540, 900, 17.4, None, size=120, color=CREAM, letters=True, z=4)]
els += [T("para consultar", 540, 1070, 17.9, None, size=48, weight=500, color="#E2C9A6", enter="up", z=4)]
els += [P("DEMOSTRACIÓN · CAFETERÍA FICTICIA", 540, 1240, 0, None, color="#2A2622", size=20, enter="none", fixed=True)]
save("11", {
    "end": 21.0, "accent": TERRA, "capStyle": "box", "capBg": "rgba(20,14,10,0.85)", "capY": 1330,
    "keys": ["vendés?", "café", "lugar", "dirección", "ideas,", "presentación.", "negocio.", "llega?"],
    "scenes": [{"start": 0, "bg": BG, "fx": "dots"}, {"start": 9.0, "bg": "#EFE8DD", "tr": "zoom", "fx": "grid"}, {"start": 11.2, "bg": BG, "tr": "whip", "fx": "dots"}],
    "cam": [{"t": 0, "s": 0.8, "ry": -24, "rx": 8, "rot": -3, "y": 80}, {"t": 2.2, "s": 0.82, "ry": -10, "rx": 4, "rot": -1, "y": 80}, {"t": 2.6, "s": 0.82, "ry": 0, "rx": 0, "rot": 0, "y": 80},
            {"t": 3.1, "s": 0.82, "y": 80}, {"t": 3.6, "s": 1.22, "y": 0}, {"t": 8.8, "s": 1.28, "y": 0}, {"t": 9.0, "s": 1, "y": 0, "rx": 0}, {"t": 9.4, "rx": 22, "s": 0.95}, {"t": 10.6, "rx": 0, "s": 1},
            {"t": 11.2, "s": 0.82, "ry": 22, "rx": 0, "y": 80}, {"t": 13.5, "ry": -18, "s": 0.82, "y": 80}, {"t": 15.8, "ry": -24, "s": 0.8, "y": 80}, {"t": 15.9, "ry": 0, "s": 1, "y": 0}, {"t": 21, "s": 1.06}],
    "shakes": [{"t": 2.3, "a": 10}, {"t": 10.6, "a": 14}, {"t": 17.4, "a": 8}],
    "sfx": [{"t": 2.3, "name": "pop"}, {"t": 3.1, "name": "whoosh", "v": 0.3}, {"t": 5.0, "name": "click"}, {"t": 6.3, "name": "click"}, {"t": 8.0, "name": "click"}, {"t": 9.0, "name": "pop"}, {"t": 9.2, "name": "pop"}, {"t": 9.4, "name": "pop"}, {"t": 10.6, "name": "hit", "v": 0.25}, {"t": 15.9, "name": "whoosh", "v": 0.3}, {"t": 17.4, "name": "brillo", "v": 0.25}],
    "els": els,
})
