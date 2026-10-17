import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
CREAM = "#F5EFE6"; TERRA = "#D9653B"; INK = "#161310"; R = "#FF2D55"; Y = "#FFE600"
els = []
# El «resultado limpio»: taza sobre círculo, todo ordenado (queda de fondo todo el video)
els += [S(540, 820, 560, 560, 0, 20.5, color=TERRA, r=280, enter="none", mv=[{"t": 12.8, "s": 1}, {"t": 15.6, "s": 1.08}])]
els += [E("hot-beverage", 540, 800, 340, 0, 20.5, enter="none", mv=[{"t": 0, "rot": -4}, {"t": 2.0, "rot": 3}, {"t": 12.8, "s": 1}, {"t": 15.6, "s": 1.12}])]
els += [T("un café, sin apuro", 540, 1150, 0, 15.7, size=46, weight=500, color=INK, enter="none")]
els += [P("DEMOSTRACIÓN", 540, 1235, 0, 20.5, color="#2A2622", size=20, enter="none", fixed=True)]
els += [T("LO VOY A\nARRUINAR", 540, 330, 0.3, 2.15, size=110, color=R, enter="drop", rot=-3, fixed=True)]
els += [P("EN 3 PASOS", 860, 470, 1.4, 2.15, color=INK, size=34, rot=6, fixed=True, enter="spin")]
# Error 1 · subtítulos que tapan lo importante
for i, (txt, y, r) in enumerate([("TAPO LO", 700, -3), ("IMPORTANTE", 830, 2), ("CON SUBTÍTULOS", 960, -2)]):
    t0 = 2.8 + i * 0.4
    els += [S(540, y, 900, 130, t0, 11.6 + i * 0.15, color=Y, r=8, rot=r, enter="drop", z=6, exit_="shrink")]
    els += [T(txt, 540, y, t0 + 0.03, 11.6 + i * 0.15, size=92, color=INK, rot=r, enter="drop", z=7, exit_="shrink")]
els += [P("ERROR 1", 540, 300, 2.2, 5.0, color=R, size=40, fixed=True, enter="flip")]
# Error 2 · un efecto en cada palabra
junk = [("¡¡WOW!!", 230, 470, -14, "drop"), ("BOOM", 840, 560, 12, "spin"), ("!!!", 160, 1090, 8, "blur"), ("EPIC", 900, 1080, -10, "flip"), ("OMG", 560, 420, 4, "zoom")]
for i, (txt, x, y, r, en) in enumerate(junk):
    t0 = 5.6 + i * 0.28
    els += [T(txt, x, y, t0, 11.8 + i * 0.1, size=96, color=[R, "#00C2FF", Y, "#7CFF4F", "#FF7A00"][i], rot=r, enter=en, glitch=True, z=8, w=420, exit_="shrink",
              mv=[{"t": t0 + 0.4, "rot": r}, {"t": t0 + 0.7, "rot": -r}, {"t": t0 + 1.0, "rot": r}, {"t": t0 + 1.3, "rot": -r}])]
for i, (emo, x, y) in enumerate([("fire", 120, 700), ("star-struck", 960, 760), ("collision", 330, 1000), ("sparkles", 760, 380), ("dizzy", 950, 1200)]):
    els += [E(emo, x, y, 130, 5.7 + i * 0.25, 11.9, enter="spin", z=9, exit_="shrink")]
els += [P("ERROR 2", 540, 300, 5.0, 7.45, color=R, size=40, fixed=True, enter="flip")]
# Error 3 · música más fuerte que la voz (medidores, sin ensordecer)
for i, (lab, x, c, hi) in enumerate([("MÚSICA", 120, R, 760), ("VOZ", 960, "#3DDC97", 160)]):
    mv = [{"t": 8.5 + j * 0.12, "h": hi * (0.75 + 0.25 * ((j * 7 + i * 3) % 5) / 4), "y": 1180 - hi * (0.75 + 0.25 * ((j * 7 + i * 3) % 5) / 4) / 2} for j in range(26)]
    els += [S(x, 1180, 80, 40, 8.4, 11.9, color=c, r=10, enter="up", z=9, mv=mv, exit_="shrink")]
    els += [T(lab, x, 1250, 8.4, 11.9, size=30, color=INK, w=200, z=9, exit_="shrink")]
for i in range(4):
    els += [E("musical-note", 250 + i * 190, 560 + (i % 2) * 90, 110, 8.6 + i * 0.12, 11.9, enter="drop", z=9, exit_="shrink",
              mv=[{"t": 9.0 + k * 0.25, "y": 560 + (i % 2) * 90 + (30 if k % 2 else -30)} for k in range(10)])]
els += [P("ERROR 3", 540, 300, 7.5, 10.55, color=R, size=40, fixed=True, enter="flip")]
els += [T("LISTO.", 540, 330, 10.6, 11.25, size=150, color=INK, rot=-6, enter="zoom", fixed=True)]
# Deshacer: todo sale en reversa
els += [T("DESHACER", 540, 320, 11.3, 12.75, size=120, color=R, glitch=True, fixed=True, enter="blur")]
els += [E("broom", 860, 470, 130, 11.5, 12.75, enter="drop", fixed=True, mv=[{"t": 11.8, "x": 860, "rot": 0}, {"t": 12.5, "x": 220, "rot": -30}])]
# Versión limpia
els += [T("MÁS ≠ MEJOR", 540, 330, 13.3, 15.75, size=120, color=INK, letters=True, fixed=True)]
# CTA
els += [S(540, 960, 1080, 1920, 15.8, None, color=INK, enter="mask", mask="circle", z=12)]
els += [E("bookmark", 540, 620, 180, 16.0, None, enter="drop", z=13)]
els += [T("GUARDALO", 540, 820, 16.1, None, size=150, color=CREAM, letters=True, z=13)]
els += [T("antes de agregar\notro efecto", 540, 1010, 16.6, None, size=64, weight=700, color=Y, enter="mask", z=13)]
save("09", {
    "end": 20.5, "accent": Y, "capStyle": "karaoke", "capColor": "#FFFFFF", "capY": 1330,
    "keys": [],
    "scenes": [{"start": 0, "bg": CREAM, "fx": "paper"}, {"start": 5.0, "bg": "#F2E6D6", "tr": "cut", "fx": "dots"}, {"start": 7.5, "bg": "#EDE0CC", "tr": "cut", "fx": "lines"}, {"start": 11.3, "bg": CREAM, "tr": "circle", "fx": "paper"}],
    "cam": [{"t": 0, "s": 1.25, "rot": 0}, {"t": 2.0, "s": 1.0}, {"t": 5.4, "rot": 0, "s": 1}] + [{"t": 5.6 + k * 0.3, "rot": (3 if k % 2 else -3), "s": 1.04} for k in range(6)] +
           [{"t": 7.5, "rot": 0, "s": 1.06}, {"t": 10.5, "s": 1.14, "rot": 2}, {"t": 10.6, "s": 0.9, "rot": -4}, {"t": 11.3, "s": 0.9, "rot": -4}, {"t": 11.8, "s": 1.1, "rot": 6}, {"t": 12.6, "s": 1, "rot": 0}, {"t": 15.6, "s": 1.06}],
    "shakes": [{"t": 2.8, "a": 10}, {"t": 3.2, "a": 10}, {"t": 3.6, "a": 10}, {"t": 5.6, "a": 14}, {"t": 6.2, "a": 14}, {"t": 6.8, "a": 14}, {"t": 8.5, "a": 18}, {"t": 9.2, "a": 18}, {"t": 9.9, "a": 18}],
    "sfx": [{"t": 0.3, "name": "hit", "v": 0.25}, {"t": 2.8, "name": "pop"}, {"t": 3.2, "name": "pop"}, {"t": 3.6, "name": "pop"}, {"t": 5.6, "name": "pop"}, {"t": 5.9, "name": "pop"}, {"t": 6.2, "name": "pop"}, {"t": 6.5, "name": "pop"}, {"t": 6.8, "name": "pop"},
            {"t": 10.6, "name": "hit", "v": 0.3}, {"t": 11.4, "name": "whoosh", "v": 0.35}, {"t": 13.3, "name": "brillo", "v": 0.25}, {"t": 16.0, "name": "pop"}],
    "els": els,
})
