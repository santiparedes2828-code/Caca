import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
G = "#1F8A5B"; G2 = "#0E5C3A"; W = "#FFFFFF"; INK = "#0F1A14"; SKY = "#CDEBF5"; SUN = "#FFC93C"
els = []
def bottle(t0, t1, path, enter="blur", z=3):
    """Botella ficticia (forma original) que sigue una trayectoria [(t, x, y, s)]."""
    parts = [(0, 0, 220, 520, 70, G, "BODY"), (0, -300, 120, 80, 18, W, "CAP"), (0, -250, 150, 30, 8, "#E6F4EC", "NECK"), (0, 20, 220, 120, 0, W, "LABEL")]
    out = []
    for dx, dy, w, h, r, c, tag in parts:
        mv = [{"t": t, "x": x + dx * s, "y": y + dy * s, "w": w * s, "h": h * s, "r": r * s} for t, x, y, s in path]
        t_, x0, y0, s0 = path[0]
        out.append(S(x0 + dx * s0, y0 + dy * s0, w * s0, h * s0, t0, t1, color=c, r=r * s0, enter=enter, mv=mv, z=z + (1 if tag in ("CAP", "LABEL") else 0), shadow=tag == "BODY"))
    mv = [{"t": t, "x": x, "y": y + 20 * s, "s": s} for t, x, y, s in path]
    t_, x0, y0, s0 = path[0]
    out.append(T("brisa.", x0, y0 + 20 * s0, t0, t1, size=56, color=G2, w=220, enter=enter, mv=mv, z=z + 2))
    return out
els += [P("DEMOSTRACIÓN · MARCA FICTICIA", 540, 1230, 0, 22.0, color="#1A1A1A", size=22, enter="none", fixed=True)]
# 0–3.1 · sin sonido
els += [E("muted-speaker", 300, 760, 260, 0, 3.1, enter="none", mv=[{"t": 0, "rot": -6}, {"t": 3.0, "rot": 4}])]
els += [S(300, 760, 330, 22, 0, 3.1, color="#E5383B", r=11, rot=-40, enter="none", z=6)]
els += bottle(0, 3.1, [(0, 790, 820, 0.85), (3.0, 760, 800, 0.9)], enter="none")
els += [T("SIN SONIDO", 540, 360, 0, 1.6, size=124, color=INK, enter="none", fixed=True)]
els += [T("¿IGUAL\nENTENDÉS?", 540, 380, 1.7, 3.1, size=110, color=G, letters=True, fixed=True)]
# 3.2–4.3 · una botella
els += bottle(3.2, 4.35, [(3.2, 540, 820, 1.0), (4.3, 540, 820, 1.15)])
els += [T("UNA BOTELLA", 540, 330, 3.3, 4.35, size=100, color=INK, enter="mask", fixed=True)]
# 4.4–5.7 · un día afuera (match cut: el sol se vuelve la tapa)
els += [S(540, 520, 260, 260, 4.4, 5.75, color=SUN, r=130, enter="pop", mv=[{"t": 5.0, "x": 540, "y": 520, "w": 260, "h": 260, "r": 130}, {"t": 5.6, "x": 760, "y": 600, "w": 80, "h": 60, "r": 14, "fill": W}])]
els += [E("deciduous-tree", 200, 880, 240, 4.5, 5.75, enter="drop"), E("backpack", 420, 960, 220, 4.7, 5.75, enter="drop")]
els += bottle(4.6, 5.75, [(4.6, 760, 900, 0.75), (5.6, 760, 900, 0.75)], enter="up")
els += [T("UN DÍA AFUERA", 540, 330, 4.4, 5.75, size=96, color=INK, enter="mask", fixed=True)]
# 5.8–7.1 · agua a mano (macro)
els += bottle(5.8, 7.15, [(5.8, 540, 1110, 1.55), (7.1, 530, 1090, 1.65)], enter="zoom")
for i, (x, y) in enumerate([(220, 600), (860, 700), (300, 1000)]):
    els += [E("droplet", x, y, 90, 5.9 + i * 0.12, 7.15, enter="drop")]
els += [T("AGUA\nA MANO", 540, 350, 5.8, 7.15, size=150, color=W, letters=True, fixed=True, z=8)]
# 7.2–10.1 · imagen + texto (pantalla dividida)
els += [S(270, 860, 540, 1100, 7.2, 10.15, color=SKY, enter="left", z=1)]
els += [S(810, 860, 540, 1100, 7.35, 10.15, color=G, enter="right", z=1)]
els += bottle(7.4, 10.15, [(7.4, 270, 860, 0.8), (10.0, 270, 840, 0.85)], enter="flip")
els += [T("IMAGEN", 270, 360, 7.4, 10.15, size=64, color=INK, w=480, fixed=True), T("TEXTO", 810, 360, 8.9, 10.15, size=64, color=W, w=480, fixed=True)]
els += [T("agua\na mano", 810, 820, 9.0, 10.15, size=96, color=W, w=480, letters=True)]
els += [S(540, 860, 10, 1100, 7.3, 10.15, color=W, enter="mask", mask="up", z=6)]
# 10.2–13.4 · activá el audio: el sonido suma otra capa
els += [E("speaker-high-volume", 540, 640, 230, 10.2, 13.45, enter="spin")]
for i in range(3):
    t0 = 10.6 + i * 0.45
    els += [S(540, 640, 260, 260, t0, 13.45, color="transparent", r=200, stroke=G, sw=6, enter="none", mv=[{"t": t0, "s": 1, "o": 1}, {"t": t0 + 1.3, "s": 2.6, "o": 0}, {"t": t0 + 1.31, "s": 1, "o": 1}, {"t": t0 + 2.6, "s": 2.6, "o": 0}])]
for i in range(11):
    mv = [{"t": 10.6 + j * 0.15, "h": 40 + ((i * 7 + j * 13) % 9) * 22} for j in range(19)]
    els += [S(240 + i * 60, 1060, 30, 60, 10.6 + i * 0.02, 12.1, color=G, r=15, enter="up", mv=mv)]
for i, (lab, c, fg) in enumerate([("IMAGEN", SKY, INK), ("TEXTO", W, INK), ("SONIDO", G, W)]):
    t0 = 12.2 + i * 0.25
    els += [S(540, 1100 - i * 130, 640, 120, t0, 13.45, color=c, r=20, enter="flip", shadow=True, z=3 + i)]
    els += [T(lab, 540, 1100 - i * 130, t0 + 0.05, 13.45, size=50, color=fg, w=600, enter="flip", z=3 + i)]
els += [T("ACTIVÁ EL AUDIO", 540, 330, 10.2, 13.45, size=96, color=INK, glitch=True, fixed=True)]
# 13.5–17.5 · antes de escuchar
els += [T("TU MENSAJE", 540, 520, 13.5, 17.6, size=80, color=G, enter="mask")]
els += [T("ANTES DE\nESCUCHAR", 540, 760, 15.6, 17.6, size=150, color=W, letters=True)]
els += [E("muted-speaker", 540, 1050, 150, 16.6, 17.6, enter="drop")]
# 17.6–22 · CTA
els += bottle(17.6, None, [(17.6, 260, 860, 0.85), (21.8, 260, 840, 0.9)], enter="left")
els += [T("MANDÁSELO\nA QUIEN HACE\nTUS ANUNCIOS", 700, 780, 17.7, None, size=60, color=INK, w=560, letters=True)]
els += [E("incoming-envelope", 690, 1030, 140, 18.4, None, enter="drop")]
save("06", {
    "end": 22.0, "accent": G, "capBg": "rgba(10,20,15,0.82)", "capY": 1340,
    "keys": ["sonido,", "botella.", "afuera.", "Agua", "mano.", "imagen", "texto", "audio:", "capa.", "antes"],
    "scenes": [{"start": 0, "bg": "#F2F5F2"}, {"start": 3.2, "bg": "#E8F2EC", "tr": "zoom"}, {"start": 4.4, "bg": SKY, "tr": "wipe"}, {"start": 5.8, "bg": G2, "tr": "zoom"},
               {"start": 7.2, "bg": "#F2F5F2", "tr": "cut"}, {"start": 10.2, "bg": "#F2F5F2", "tr": "circle"}, {"start": 13.5, "bg": INK, "tr": "whip"}, {"start": 17.6, "bg": "#F2F5F2", "tr": "wipe"}],
    "cam": [{"t": 0, "s": 1}, {"t": 3.1, "s": 1.05}, {"t": 3.2, "s": 1, "rot": 0}, {"t": 4.3, "s": 1.08, "rot": 1.5}, {"t": 4.4, "s": 1, "rot": 0}, {"t": 5.7, "s": 1.04},
            {"t": 5.8, "s": 1, "x": 0}, {"t": 7.1, "s": 1.1, "x": -20}, {"t": 7.2, "s": 1, "x": 0}, {"t": 12.1, "s": 1, "rx": 0}, {"t": 12.4, "s": 1.05, "rx": 18}, {"t": 13.4, "rx": 18}, {"t": 13.5, "rx": 0, "s": 1}, {"t": 17.5, "s": 1.08}, {"t": 17.6, "s": 1}],
    "shakes": [{"t": 3.2, "a": 8}, {"t": 5.8, "a": 12}, {"t": 10.6, "a": 10}],
    "sfx": [{"t": 3.2, "name": "pop"}, {"t": 5.0, "name": "whoosh", "v": 0.2}, {"t": 5.8, "name": "hit", "v": 0.25}, {"t": 7.4, "name": "click"}, {"t": 8.9, "name": "click"}, {"t": 10.6, "name": "brillo", "v": 0.3}, {"t": 12.2, "name": "pop"}, {"t": 12.45, "name": "pop"}, {"t": 12.7, "name": "pop"}, {"t": 15.6, "name": "hit", "v": 0.2}, {"t": 18.4, "name": "pop"}],
    "els": els,
})
