import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
BG = "#0D0F14"; PANEL = "#171A22"; LINE = "#2A2F3B"; A = "#FF4D6D"; MINT = "#3DDC97"; W = "#EEF0F5"; GRAY = "#7D8597"
els = []
# Interfaz editorial (original, sin software real)
els += [P("DEMOSTRACIÓN · INTERFAZ ORIGINAL", 540, 250, 0, 17.3, color="#1C2029", fg=GRAY, size=20, enter="none")]
els += [S(540, 600, 840, 470, 0, 17.3, color=PANEL, r=26, stroke=LINE, sw=3, enter="none")]
els += [S(540, 600, 800, 430, 0, 17.3, color="transparent", r=18, grad="linear-gradient(160deg,#2B3140,#151821)", enter="none")]
els += [E("speaking-head", 540, 580, 220, 0, 17.3, enter="none", mv=[{"t": 4.2, "s": 1}, {"t": 4.5, "s": 1.45, "y": 600}, {"t": 6.4, "s": 1.45}, {"t": 6.7, "s": 1, "y": 580}, {"t": 15.0, "s": 1}, {"t": 15.4, "s": 1.3}])]
els += [T("«Lo importante llega primero.»", 540, 770, 0, 17.3, size=40, weight=700, color=W, w=760, enter="none", mv=[{"t": 8.1, "o": 1}])]
# pistas
els += [S(540, 1010, 860, 330, 0, 17.3, color=PANEL, r=20, stroke=LINE, sw=3, enter="none", z=1)]
for i, lab in enumerate(["V1", "A1", "T1"]):
    els += [T(lab, 150, 920 + i * 95, 0, 17.3, size=24, color=GRAY, w=60, enter="none")]
els += [S(300, 920, 220, 60, 0, 17.3, color="#3A6EA5", r=10, enter="none", z=2)]
els += [S(520, 920, 190, 60, 0, 17.3, color="#3A6EA5", r=10, enter="none", z=2, mv=[{"t": 2.6, "fill": A}, {"t": 3.2, "w": 190, "o": 1}, {"t": 3.6, "w": 0, "o": 0}])]
els += [S(760, 920, 260, 60, 0, 17.3, color="#3A6EA5", r=10, enter="none", z=2, mv=[{"t": 3.5, "x": 760}, {"t": 3.9, "x": 650}])]
for i in range(26):
    x = 200 + i * 28; h = 14 + (i * 53) % 40
    spike = i == 18
    els += [S(x, 1015, 12, 80 if spike else h, 0, 17.3, color=A if spike else MINT, r=6, enter="none", z=2,
              mv=[{"t": 6.9, "h": 80 if spike else h, "fill": A if spike else MINT}, {"t": 7.4, "h": h if not spike else 18, "fill": MINT}])]
els += [S(540, 1110, 620, 54, 0, 17.3, color="#6C4AB6", r=10, enter="none", z=2, mv=[{"t": 8.1, "w": 620}, {"t": 8.6, "w": 300}])]
els += [T("texto largo con demasiadas palabras", 540, 1110, 0, 8.4, size=24, weight=500, color=W, w=600, enter="none", z=3)]
els += [T("texto claro", 540, 1110, 8.5, 17.3, size=26, color=W, w=300, enter="fade", z=3)]
els += [S(870, 1110, 120, 54, 9.5, 17.3, color="transparent", r=10, stroke=MINT, sw=3, enter="mask", z=2, mv=[{"t": 10.0, "w": 120}, {"t": 10.6, "w": 200, "x": 900}])]
els += [S(150, 1015, 4, 320, 0, 17.3, color=A, enter="none", z=6, mv=[{"t": 0, "x": 160}, {"t": 17.2, "x": 950}])]
# la interfaz se esconde durante «no todo necesita una explosión»
for e in els:
    if any(k["t"] == 17.3 for k in e["kf"]) and not any(k.get("w") == 0 for k in e["kf"]):
        e["kf"] += [{"t": 11.1, "o": 1}, {"t": 11.3, "o": 0}, {"t": 13.35, "o": 0}, {"t": 13.6, "o": 1}]
        e["kf"].sort(key=lambda k: k["t"])
# encabezado y contador de cambios (fijos, sobre una banda oscura)
els += [S(540, 330, 1080, 300, 2.55, 11.3, color="transparent", grad="linear-gradient(180deg, rgba(13,15,20,0) 0%, rgba(13,15,20,0.96) 25%, rgba(13,15,20,0.96) 75%, rgba(13,15,20,0) 100%)", enter="fade", z=7, fixed=True)]
els += [T("5 CAMBIOS", 540, 330, 0, 1.55, size=104, color=W, enter="none", z=8, fixed=True)]
els += [T("¿LOS VISTE?", 540, 330, 1.6, 2.55, size=104, color=A, glitch=True, z=8, fixed=True)]
marks = [("1 · REPETICIÓN", 2.6, 520, 860, "scissors"), ("2 · ACERCAR", 4.2, 540, 380, "magnifying-glass-tilted-left"), ("3 · RUIDO", 6.9, 704, 1015, "broom"), ("4 · TEXTO", 8.1, 540, 1110, "memo"), ("5 · AIRE", 9.5, 880, 1110, "wind-face")]
for i, (lab, t, x, y, emo) in enumerate(marks):
    t1 = marks[i + 1][1] if i < 4 else 11.25
    els += [T(lab, 540, 330, t, t1, size=84, color=W, letters=True, z=8, fixed=True)]
    els += [S(x, y, 120, 120, t, t1, color="transparent", r=60, stroke=A, sw=6, enter="spin", z=7)]
    els += [E(emo, x + 90, y - 80, 90, t + 0.1, t1, enter="drop", z=8)]
    els += [T(f"{i + 1}/5", 900, 430, t, t1, size=40, color=A, w=160, enter="flip", z=8, fixed=True)]
# 11.3–13.3 · no todo necesita una explosión
els += [T("NO TODO NECESITA\nUNA EXPLOSIÓN", 540, 520, 11.3, 13.3, size=92, color=W, letters=True)]
els += [E("collision", 540, 880, 300, 11.6, 13.3, enter="blur", mv=[{"t": 12.5, "s": 1, "rot": 0}, {"t": 13.1, "s": 0.1, "rot": 180}])]
els += [S(540, 880, 420, 16, 12.6, 13.3, color=MINT, r=8, rot=-30, enter="left", z=6)]
# 13.4–17.3 · resultado limpio
els += [T("EDITAR BIEN", 540, 330, 13.45, 17.3, size=100, color=MINT, enter="mask", fixed=True)]
els += [T("es que mirar sea más fácil", 540, 430, 15.7, 17.3, size=48, weight=500, color=W, enter="up", fixed=True)]
# 17.4–22 · CTA
els += [E("bookmark", 540, 640, 200, 17.5, None, enter="drop")]
els += [T("GUARDALO", 540, 860, 17.6, None, size=150, color=W, letters=True)]
els += [T("PARA TU PRÓXIMO VIDEO", 540, 1000, 18.2, None, size=60, color=MINT, enter="mask")]
cam = [{"t": 0, "s": 1, "y": 0, "rx": 0}, {"t": 2.4, "s": 1, "y": 0, "rx": 0}, {"t": 3.0, "s": 1.18, "y": -180, "rx": 22},
       {"t": 4.0, "s": 1.18, "y": -180, "rx": 22}, {"t": 4.4, "s": 1.25, "y": 120, "rx": 0}, {"t": 6.5, "s": 1.25, "y": 120, "rx": 0},
       {"t": 6.9, "s": 1.22, "y": -200, "rx": 20, "x": -60}, {"t": 7.9, "x": -60}, {"t": 8.3, "x": 40, "y": -260}, {"t": 9.3, "x": 40}, {"t": 9.7, "x": -160, "y": -260},
       {"t": 11.0, "s": 1.22, "x": -160, "rx": 20}, {"t": 11.3, "s": 1, "x": 0, "y": 0, "rx": 0}, {"t": 13.4, "s": 0.9, "ry": -8}, {"t": 17.3, "s": 1.05, "ry": 0}]
save("05", {
    "end": 22.0, "accent": A, "capBg": "rgba(0,0,0,0.78)", "capY": 1340,
    "keys": ["cinco", "viste?", "repetición,", "acerqué", "ruido,", "simplifiqué", "respirar", "explosión.", "fácil."],
    "scenes": [{"start": 0, "bg": BG}, {"start": 11.3, "bg": "#141019", "tr": "circle"}, {"start": 13.4, "bg": BG, "tr": "whip"}, {"start": 17.4, "bg": "#0F1A16", "tr": "zoom"}],
    "cam": cam, "shakes": [{"t": 1.6, "a": 10}, {"t": 3.6, "a": 8}, {"t": 11.7, "a": 16}],
    "sfx": [{"t": 1.6, "name": "hit", "v": 0.25}, {"t": 2.6, "name": "click"}, {"t": 3.5, "name": "whoosh", "v": 0.2}, {"t": 4.2, "name": "click"}, {"t": 6.9, "name": "click"}, {"t": 8.1, "name": "click"}, {"t": 9.5, "name": "click"}, {"t": 11.7, "name": "hit", "v": 0.2}, {"t": 17.6, "name": "pop"}, {"t": 18.2, "name": "brillo", "v": 0.25}],
    "els": els,
})
