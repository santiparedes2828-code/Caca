import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
W = "#F2F2F2"; RED = "#E5383B"; WIN = "#24252B"; TAB = "#3A3C44"
els = []
els += [S(540, 60, 1080, 160, 0, None, color="#000", enter="none", z=9), S(540, 1860, 1080, 160, 0, None, color="#000", enter="none", z=9)]
els += [P("PARODIA · TRÁILER FICTICIO", 540, 1230, 0, 24.2, color="#1A1B20", size=22, enter="none")]
# 0–3.5 · escritorio y una ventana
els += [T("ESTE VERANO", 540, 420, 0, 3.5, size=110, color=W, enter="none", mv=[{"t": 0, "s": 1.15}, {"t": 3.4, "s": 1}])]
els += [S(540, 880, 760, 500, 0.15, 5.2, color=WIN, r=24, shadow=True, mv=[{"t": 2.6, "s": 1}, {"t": 3.4, "s": 1.12}])]
els += [S(540, 655, 760, 50, 0.2, 5.2, color="#1A1B20", r=12, z=3, mv=[{"t": 2.6, "s": 1}, {"t": 3.4, "s": 1.12}])]
els += [T("una amenaza llega\na tu escritorio", 540, 880, 1.6, 3.5, size=50, weight=500, color="#9EA0A8", z=4)]
# 3.6–5.2 · crece en silencio: pestañas una a una
for i in range(5):
    els += [S(260 + i * 120, 650, 110, 40, 3.7 + i * 0.3, 5.2, color=TAB, r=10, z=4)]
els += [T("CRECE EN SILENCIO", 540, 420, 3.6, 5.2, size=90, color=W, enter="up")]
# 5.3–7.6 · se multiplica: pestañas como criaturas
k = 0
for r in range(6):
    for c in range(4):
        x, y = 200 + c * 230 + (r % 2) * 40, 600 + r * 110
        els += [S(x, y, 190, 70, 5.4 + k * 0.06, 7.6, color=[TAB, "#4A4D57", RED if k % 7 == 3 else TAB][k % 3], r=14, z=3,
                  mv=[{"t": 6.5, "rot": 0}, {"t": 7.0, "rot": (-6 if k % 2 else 6)}, {"t": 7.5, "rot": 0}])]
        if k % 5 == 2: els += [E("eyes", x, y, 60, 5.6 + k * 0.06, 7.6, z=5)]
        k += 1
els += [T("SE MULTIPLICA", 540, 420, 5.3, 7.6, size=110, color=RED, enter="zoom")]
els += [E("alien-monster", 880, 330, 110, 6.7, 7.6)]
# 7.7–10.9 · laberinto de ventanas (cámara que atraviesa)
for i in range(6):
    t0 = 7.7 + i * 0.5
    els += [S(540, 880, 760, 500, t0, 10.9, color="transparent", r=24, stroke="#5A5D68", sw=6, enter="fade", z=2,
              mv=[{"t": t0, "s": 0.25}, {"t": t0 + 2.4, "s": 3.2}])]
els += [T("SIEMPRE VUELVE", 540, 420, 7.9, 10.9, size=104, color=W, enter="up")]
els += [T("cuando pensás\nque terminaste", 540, 880, 9.0, 10.9, size=64, weight=500, color="#C9CBD2", z=5)]
# 11–15.3 · título
els += [T("PRÓXIMAMENTE", 540, 520, 11.0, 15.3, size=48, weight=500, color="#9EA0A8", enter="fade")]
els += [T("LAS PESTAÑAS\nQUE NUNCA\nCERRASTE", 540, 800, 12.5, 15.3, size=118, color=W, enter="zoom", mv=[{"t": 12.9, "s": 1}, {"t": 15.2, "s": 1.08}])]
els += [S(540, 1030, 420, 10, 14.0, 15.3, color=RED, r=5, enter="left", z=6)]
# 15.4–19.9 · sí, hice un tráiler
els += [T("SÍ, HICE UN TRÁILER\nDE TU NAVEGADOR", 540, 430, 15.4, 19.9, size=84, color=W, enter="up")]
els += [S(540, 900, 760, 500, 15.5, 19.9, color=WIN, r=24, shadow=True)]
for i in range(6):
    els += [S(210 + i * 132, 680, 122, 40, 15.6 + i * 0.05, 19.9, color=TAB if i != 5 else RED, r=10, z=4)]
els += [E("popcorn", 400, 930, 170, 16.2, 19.9), E("clapper-board", 680, 930, 170, 16.9, 19.9)]
# 19.9–24.2 · el último tab se abre con el CTA
els += [S(870, 680, 122, 40, 19.9, None, color=RED, r=10, enter="none", z=5,
          mv=[{"t": 19.9, "x": 870, "y": 680, "w": 122, "h": 40}, {"t": 20.4, "x": 540, "y": 820, "w": 860, "h": 560, "r": 36}])]
els += [T("¿A QUIÉN\nLE PASA?", 540, 800, 20.4, None, size=130, color=W, z=6)]
els += [E("face-with-rolling-eyes", 540, 1010, 110, 20.8, None, z=6)]
save("24", {
    "end": 24.3, "accent": RED, "capBg": "rgba(0,0,0,0.72)", "capY": 1340,
    "keys": ["amenaza", "multiplica", "vuelve", "pestañas", "cerraste.", "tráiler", "historia."],
    "scenes": [{"start": 0, "bg": "#0B0B0F"}, {"start": 5.3, "bg": "#120D10"}, {"start": 7.7, "bg": "#0B0B0F"}, {"start": 11.0, "bg": "#050506"}, {"start": 15.4, "bg": "#0E0F14"}],
    "sfx": [{"t": 1.4, "name": "hit", "v": 0.2}, {"t": 3.7, "name": "click"}, {"t": 4.0, "name": "click"}, {"t": 4.3, "name": "click"}, {"t": 4.6, "name": "click"}, {"t": 5.4, "name": "pop"}, {"t": 6.0, "name": "pop"}, {"t": 6.6, "name": "pop"}, {"t": 12.5, "name": "hit", "v": 0.35}, {"t": 16.2, "name": "pop"}, {"t": 20.0, "name": "whoosh", "v": 0.25}, {"t": 20.4, "name": "brillo", "v": 0.3}],
    "els": els,
})
