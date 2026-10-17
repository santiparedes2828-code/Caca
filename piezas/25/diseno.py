import sys; sys.path.insert(0, "piezas")
from kit import T, S, E, P, save
CREAM = "#F5EBDD"; TERRA = "#C8643B"; COFFEE = "#3B2418"; SAND = "#E2C9A6"
els = []
els += [P("CONCEPTO PERSONAL · MARCA FICTICIA", 540, 250, 0, None, color=COFFEE, fg=CREAM, size=24, enter="none")]
# 0–4.6 · la marca no existe
els += [T("ESTA MARCA\nNO EXISTE", 540, 450, 0, 4.6, size=118, color=COFFEE, enter="none", mv=[{"t": 0.9, "s": 1}, {"t": 1.05, "s": 1.08}, {"t": 1.25, "s": 1}])]
for i in range(6):  # cuadrícula de boceto
    els += [S(540, 640 + i * 90, 640, 3, 1.7 + i * 0.05, 4.6, color="#CDBBA3", enter="fade", z=1)]
els += [S(540, 860, 380, 520, 1.8, 4.6, color="transparent", r=30, stroke=COFFEE, sw=5, enter="fade", mv=[{"t": 2.4, "rot": 0}, {"t": 4.0, "rot": -3}])]
els += [T("?", 540, 860, 2.0, 4.6, size=200, color=TERRA)]
els += [T("su anuncio", 540, 1180, 4.0, 4.6, size=56, weight=500, color=COFFEE, enter="up")]
# 4.7–6.7 · Pausa: bolsa de café
bag = dict(t1=None)
els += [S(540, 880, 400, 540, 4.7, 10.0, color=COFFEE, r=34, shadow=True, mv=[{"t": 9.8, "s": 1}])]
els += [S(540, 640, 400, 40, 4.75, 10.0, color="#2A190F", r=10)]
els += [T("pausa.", 540, 820, 5.1, 10.0, size=96, color=CREAM)]
els += [T("café de especialidad", 540, 920, 5.4, 10.0, size=30, weight=500, color=SAND)]
els += [E("hot-beverage", 540, 1060, 120, 6.2, 10.0)]
els += [T("SE LLAMA PAUSA", 540, 430, 4.7, 6.7, size=92, color=COFFEE, enter="up")]
# 6.8–10 · tablero de diseño: paleta, movimiento, tipografía
for i, c in enumerate([TERRA, COFFEE, SAND, "#F0D9B5"]):
    els += [S(170 + i * 110, 430, 90, 90, 7.3 + i * 0.12, 10.0, color=c, r=45, shadow=True, z=3)]
els += [T("colores cálidos", 400, 520, 7.7, 10.0, size=36, weight=500, color=COFFEE, w=500)]
els += [T("Aa", 870, 440, 6.9, 10.0, size=130, color=COFFEE)]
els += [S(540, 1210, 700, 6, 8.4, 10.0, color="#CDBBA3", r=3, z=3)]
els += [S(200, 1210, 40, 40, 8.4, 10.0, color=TERRA, r=20, z=4, mv=[{"t": 8.8, "x": 200}, {"t": 9.9, "x": 860}])]
# 10–12.6 · el anuncio terminado: vapor y frase
els += [S(540, 960, 440, 520, 10.0, 12.6, color=TERRA, r=40, shadow=True, enter="zoom", mv=[{"t": 10.3, "s": 1}, {"t": 12.5, "s": 1.06}])]
els += [T("pausa.", 540, 930, 10.1, 12.6, size=110, color=CREAM)]
els += [E("hot-beverage", 540, 1090, 130, 10.2, 12.6)]
for i in range(4):
    x = 470 + i * 45
    els += [S(x, 690, 40, 100, 10.3 + i * 0.35, 12.6, color="rgba(255,255,255,0.35)", r=23, enter="fade", z=6,
              mv=[{"t": 10.3 + i * 0.35, "y": 690}, {"t": 12.6, "y": 590, "x": x + (20 if i % 2 else -20)}])]
els += [T("TU MOMENTO", 540, 370, 10.7, 12.6, size=104, color=CREAM, enter="up")]
els += [T("ANTES DEL RUIDO", 540, 470, 11.4, 12.6, size=80, color=SAND, enter="up")]
# 12.7–16.9 · transparencia
els += [T("NO ES UN\nTRABAJO DE CLIENTE", 540, 560, 12.7, 14.2, size=92, color=COFFEE)]
els += [S(540, 560, 900, 10, 13.7, 14.2, color=TERRA, r=5, enter="left", rot=-4, z=6)]
els += [T("ES UNA\nMUESTRA", 540, 560, 14.3, 17.0, size=140, color=TERRA, enter="zoom")]
els += [E("sparkles", 860, 420, 120, 14.7, 17.0)]
# 17–22 · bolsa + CTA
els += [S(300, 850, 330, 450, 17.0, None, color=COFFEE, r=30, shadow=True, enter="left", mv=[{"t": 17.4, "rot": 0}, {"t": 21.8, "rot": -4}])]
els += [T("pausa.", 300, 830, 17.1, None, size=74, color=CREAM, enter="left")]
els += [E("hot-beverage", 300, 970, 90, 17.2, None, enter="left")]
els += [T("ESCRIBIME\nMARCA", 690, 790, 17.3, None, size=80, color=TERRA, w=440, enter="right")]
els += [T("para consultar\npor un concepto", 690, 960, 17.6, None, size=40, weight=500, color=COFFEE, w=440, enter="right")]
save("25", {
    "end": 22.0, "accent": TERRA, "capColor": "#FFFFFF", "capBg": "rgba(40,24,15,0.82)", "capY": 1340,
    "keys": ["no", "existe.", "Pausa", "cálidos,", "tranquilos", "momento", "muestra"],
    "scenes": [{"start": 0, "bg": CREAM}, {"start": 4.7, "bg": "#EFE1CC"}, {"start": 10.0, "bg": "#2B1A11"}, {"start": 12.7, "bg": CREAM}, {"start": 17.0, "bg": "#EFE1CC"}],
    "sfx": [{"t": 0.9, "name": "hit", "v": 0.2}, {"t": 5.1, "name": "pop"}, {"t": 7.3, "name": "click"}, {"t": 7.42, "name": "click"}, {"t": 7.54, "name": "click"}, {"t": 7.66, "name": "click"}, {"t": 10.7, "name": "brillo", "v": 0.25}, {"t": 13.7, "name": "hit", "v": 0.2}, {"t": 14.3, "name": "pop"}, {"t": 17.3, "name": "pop"}],
    "els": els,
})
