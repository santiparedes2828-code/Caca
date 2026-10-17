import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, speed_lines, save
A = "#FF5A1F"; INK = "#111111"; CREAM = "#F2EFE9"
els = []
# 0–3 · una foto se divide en tres
els += [T("UNA FOTO,\nTRES ANUNCIOS", 540, 330, 0, 3.0, size=104, color=INK, enter="none")]
els += [S(540, 820, 620, 620, 0, 1.0, color="#FFFFFF", r=40, enter="none", shadow=True, mv=[{"t": 0.6, "s": 1}, {"t": 0.95, "s": 0.92}])]
els += [E("running-shoe", 540, 820, 420, 0, 1.0, enter="none", mv=[{"t": 0, "rot": -8}, {"t": 0.9, "rot": 4}])]
for i, (x, c) in enumerate([(210, INK), (540, "#3A3A3E"), (870, "#FFFFFF")]):
    els += [S(x, 860, 300, 440, 1.0 + i * 0.08, 3.1, color=c, r=28, shadow=True)]
    els += [E("running-shoe", x, 880, 220, 1.05 + i * 0.08, 3.1, rot=[-14, 0, 10][i])]
    els += [T(str(i + 1), x, 690, 1.15 + i * 0.08, 3.1, size=70, color=A)]
els += [P("DEMOSTRACIÓN · PRODUCTO GENÉRICO", 540, 1230, 0, 24.2, color="#2A2A2A", size=22, enter="none")]
# 3.1–5.8 · deportiva
els += speed_lines(3.1, 5.8, color="#FFFFFF")
els += [T("1 · DEPORTIVA", 540, 300, 3.1, 5.8, size=96, color=A, enter="left")]
els += [E("running-shoe", 540, 820, 560, 3.15, 5.8, rot=-18, mv=[{"t": 3.5, "x": 540}, {"t": 5.6, "x": 600, "rot": -12}])]
els += [T("MOVIMIENTO", 540, 520, 4.1, 5.0, size=110, color="#FFFFFF", rot=-4)]
els += [T("ENERGÍA", 540, 520, 5.0, 5.8, size=150, color=A, rot=-4)]
els += [E("high-voltage", 860, 600, 150, 5.0, 5.8)]
# 5.9–9.2 · urbana (collage original)
for i, (x, y, r) in enumerate([(220, 640, -8), (860, 700, 6), (300, 1040, 5), (820, 1080, -6)]):
    els += [S(x, y, 300, 220, 5.95 + i * 0.1, 9.2, color=["#57534E", "#78716C", "#44403C", "#A8A29E"][i], r=6, rot=r)]
els += [E("brick", 230, 640, 150, 6.1, 9.2), E("cityscape", 860, 700, 170, 6.2, 9.2)]
els += [E("running-shoe", 540, 860, 480, 6.0, 9.2, rot=10, mv=[{"t": 8.8, "s": 1.08}])]
els += [S(540, 640, 180, 46, 6.3, 9.2, color="#E8D9A8", rot=-20, z=5), S(700, 1060, 180, 46, 6.4, 9.2, color="#E8D9A8", rot=15, z=5)]
els += [T("2 · URBANA", 540, 300, 5.9, 9.2, size=96, color="#FFFFFF", enter="left")]
els += [P("TEXTURA", 250, 470, 6.9, 9.2, color=A, size=40, rot=-6), P("ACTITUD", 790, 470, 7.7, 9.2, color="#FFFFFF", fg=INK, size=40, rot=5), P("CALLE", 540, 1140, 8.4, 9.2, color=INK, size=40, rot=-3)]
# 9.3–13.1 · minimalista (macro y luz suave)
els += [S(540, 860, 900, 900, 9.3, 13.1, color="transparent", r=450, grad="radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)", enter="fade", z=1)]
els += [E("running-shoe", 540, 860, 380, 9.3, 13.1, enter="fade", mv=[{"t": 9.6, "s": 1}, {"t": 13.0, "s": 1.7, "x": 600}])]
els += [T("3 · MINIMALISTA", 540, 300, 9.3, 13.1, size=92, color=INK, enter="up")]
for i, (w, t) in enumerate([("forma", 10.6), ("detalle", 11.4), ("espacio", 12.1)]):
    els += [T(w, 540, 450 + i * 0, t, [11.4, 12.1, 13.1][i], size=80, weight=500, color="#555", enter="up")]
# 13.2–18.3 · mismo producto, otra historia
els += [E("running-shoe", 540, 820, 380, 13.2, 18.3, mv=[{"t": 15.8, "s": 1}, {"t": 16.0, "s": 1.15}, {"t": 16.2, "s": 1}])]
for i, (lab, c, fg) in enumerate([("DEPORTIVA", A, "#fff"), ("URBANA", "#3A3A3E", "#fff"), ("MINIMALISTA", "#FFFFFF", INK)]):
    els += [P(lab, [250, 830, 540][i], [600, 600, 1080][i], 13.4 + i * 0.15, 18.3, color=c, fg=fg, size=32)]
els += [T("MISMO PRODUCTO", 540, 330, 13.3, 15.8, size=100, color="#FFFFFF")]
els += [T("OTRA HISTORIA", 540, 330, 15.9, 18.3, size=116, color=A, enter="zoom")]
# 18.4–24.2 · tres portadas y CTA
for i, (x, c, fg) in enumerate([(210, INK, A), (540, "#3A3A3E", "#FFFFFF"), (870, "#FFFFFF", INK)]):
    els += [S(x, 800, 300, 460, 18.4 + i * 0.12, None, color=c, r=28, shadow=True, enter="up", mv=[{"t": 19.8, "s": 1}, {"t": 20.0 + i * 0.2, "s": 1.06}, {"t": 20.2 + i * 0.2, "s": 1}])]
    els += [T(str(i + 1), x, 690, 18.5 + i * 0.12, None, size=120, color=fg, enter="up")]
    els += [E("running-shoe", x, 870, 200, 18.55 + i * 0.12, None, rot=[-14, 0, 10][i], enter="up")]
els += [T("¿CUÁL VA\nCON TU MARCA?", 540, 330, 18.4, None, size=96, color=INK, enter="up")]
els += [T("ELEGÍ 1, 2 O 3", 540, 1095, 20.6, None, size=110, color=A)]
save("14", {
    "end": 24.3, "accent": A, "capBg": "rgba(10,10,10,0.78)", "capY": 1340,
    "keys": ["tres", "Deportiva:", "Urbana:", "Minimalista:", "historia", "marca?"],
    "scenes": [{"start": 0, "bg": CREAM}, {"start": 3.1, "bg": "#0E0E10"}, {"start": 5.9, "bg": "#2A2826"}, {"start": 9.3, "bg": "#E9E6E0"}, {"start": 13.2, "bg": "#16161A"}, {"start": 18.4, "bg": CREAM}],
    "sfx": [{"t": 1.0, "name": "pop"}, {"t": 4.1, "name": "hit", "v": 0.2}, {"t": 5.0, "name": "hit", "v": 0.25}, {"t": 6.9, "name": "pop"}, {"t": 7.7, "name": "pop"}, {"t": 8.4, "name": "pop"}, {"t": 10.6, "name": "click"}, {"t": 11.4, "name": "click"}, {"t": 12.1, "name": "click"}, {"t": 15.9, "name": "hit", "v": 0.3}, {"t": 20.6, "name": "brillo", "v": 0.3}],
    "els": els,
})
