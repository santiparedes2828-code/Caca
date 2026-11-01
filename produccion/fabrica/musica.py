"""Fábrica viral · música original por secciones de la voz (sintetizada, sin licencias de terceros).

Lee produccion/<slug>/config.json → "musica": {
  "bpm": 104,
  "secciones": [ {"desde": "inicio" | "<palabra>", "modo": "<modo>", "escala": "<escala>", "tonica": <midi>}, ... ],
  "golpes": ["<palabra>" | "<palabra>@<palabra anterior>", ...]   # bombo + acorde corto en esa palabra
}
Las palabras se buscan en orden en los subtítulos de la variante (src/data/captions-<slug>-<v>.json), cada una después
de la anterior; «2 seg» sirve para el reto. Si config.reloj.variante == v, la música se aquieta durante el reloj.

Modos: misterio (pulso grave + campanita que pregunta) · groove (marimba + shaker + bombo en la escala) ·
tension (colchón grave y latido que se acelera) · pesado (pulso grave fuerte) · espacial (colchón + arpegio que sube) ·
brillo (florece un acorde mayor, para revelaciones) · cierre (groove mayor con melodía y acorde final).
Escalas: menor, mayor, lidio, dorico, frigio_dom.
Uso: python3 -I produccion/fabrica/musica.py <slug> <variante>   → public/audio/musica_<slug>_<v>.wav
"""
import json
import sys
import wave

import numpy as np

SLUG, V = sys.argv[1], int(sys.argv[2])
CFG = json.load(open(f"produccion/{SLUG}/config.json", encoding="utf-8"))
M = CFG["musica"]
caps = json.load(open(f"src/data/captions-{SLUG}-{V}.json"))
SR = 48000
BEAT = 60 / float(M.get("bpm", 104))
DUR = caps[-1]["endMs"] / 1000 + 36 / 30
FINAL = DUR - 1.3
N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
ESCALAS = {"menor": [0, 2, 3, 5, 7, 8, 10, 12], "mayor": [0, 2, 4, 5, 7, 9, 11, 12], "lidio": [0, 2, 4, 6, 7, 9, 11, 12], "dorico": [0, 2, 3, 5, 7, 9, 10, 12], "frigio_dom": [0, 1, 4, 5, 7, 8, 10, 12]}


def norm(w):
    return w.lower().strip("¿?¡!.,:…\"«»").replace(".", "")


def at(word, desde=0.0):
    for c in caps:
        if c["startMs"] / 1000 >= desde - 1e-6 and norm(c["text"]).startswith(word):
            return c["startMs"] / 1000
    raise SystemExit(f"no está «{word}» después de {desde:.2f}s en la variante {V}")


def poner(sig, t0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    mus[i:j] += sig[: j - i]


def tt(d):
    return np.arange(int(max(0.01, d) * SR)) / SR


def marimba(f, d, a, dec=7.0):
    t = tt(d)
    e = np.exp(-t * dec) * np.minimum(1, t / 0.004)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * dec * 3) + 0.15 * np.sin(2 * np.pi * f * 2 * t))


def bell(f, d, a):
    t = tt(d)
    e = np.exp(-t * 3.5) * np.minimum(1, t / 0.002)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6))


def pluck(f, d, a, dec=9.0):
    t = tt(d)
    e = np.exp(-t * dec) * np.minimum(1, t / 0.002)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 20))


def colchon(notas, d, a, ataque=0.6, salida=0.3):
    t = tt(d)
    e = np.minimum(1, t / ataque) * np.clip((d - t) / salida, 0, 1)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + 0.6 * np.sin(2 * np.pi * hz(m) * 1.005 * t + 1.2) for m in notas)
    return a * e * s / len(notas)


def bombo(a):
    t = tt(0.3)
    f = 48 + 75 * np.exp(-t * 30)
    return a * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)


def shaker(t0, a):
    n = int(0.03 * SR)
    r = np.diff(rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 160), prepend=0)
    poner(r * a, t0)


# secciones → tiempos
secs = []
cursor = 0.0
for s in M["secciones"]:
    t0 = 0.0 if s["desde"] == "inicio" else at(s["desde"], cursor) - 0.15
    cursor = max(cursor, t0 + 0.2)
    secs.append({**s, "t0": max(0.0, t0)})
for k, s in enumerate(secs):
    s["t1"] = secs[k + 1]["t0"] if k + 1 < len(secs) else DUR
reloj = (-1, -1)
if int(CFG.get("reloj", {}).get("variante", 0)) == V:
    r0 = at("2 seg")
    reloj = (r0 + 0.5, r0 + 0.5 + float(CFG["reloj"].get("segundos", 2.0)) + 0.1)


def escala(s):
    base = int(s.get("tonica", 57))
    return [base + 12 + x for x in ESCALAS.get(s.get("escala", "menor"), ESCALAS["menor"])], base


for s in secs:
    a, b = s["t0"], s["t1"]
    sc, base = escala(s)
    modo = s["modo"]
    if modo == "misterio":
        poner(colchon([base - 12, base - 5, base], b - a + 0.2, 0.10, 0.2), a)
        t, k = a, 0
        while t < b - 0.05:
            quieto = reloj[0] <= t < reloj[1]
            if not quieto:
                poner(bell(hz(sc[[0, 2, 4, 5][k % 4]] + 12), 0.6, 0.06), t)
            if k % 2 == 0:
                poner(pluck(hz(base - 12), 0.5, 0.08 if quieto else 0.2, 5.0), t)
            t += BEAT / 2
            k += 1
    elif modo in ("groove", "cierre"):
        mayor = modo == "cierre"
        if mayor:
            sc = [base + 12 + x for x in ESCALAS["mayor"]]
        t, c = a, 0
        fin = FINAL if modo == "cierre" else b
        while t < fin - 0.05:
            raiz = base - 12 + [0, 5, 7, 3][c % 4] if not mayor else base - 12 + [0, 9, 5, 7][c % 4]
            poner(marimba(hz(raiz), BEAT * 2, 0.3, 2.5), t)
            for j in range(8):
                tj = t + j * BEAT / 2
                if tj >= fin - 0.05:
                    break
                m = sc[(j * 3 + c) % 8] + (12 if j % 4 == 3 else 0)
                poner(marimba(hz(m), 0.6, 0.15 if j % 2 else 0.19), tj)
                if j % 4 == 0 and s.get("campana", True):
                    poner(bell(hz(m + 12), 0.8, 0.035), tj)
            for j in range(16):
                tj = t + j * BEAT / 4
                if tj < fin - 0.05:
                    shaker(tj, 0.04 if j % 2 else 0.06)
            for j in (0, 2):
                if t + j * BEAT < fin - 0.05:
                    poner(bombo(0.3), t + j * BEAT)
            t += BEAT * 4
            c += 1
        if modo == "cierre":
            poner(marimba(hz(base - 12), 1.6, 0.36, 1.6), FINAL)
            for k2, x in enumerate([0, 4, 7, 12, 16]):
                poner(marimba(hz(base + 12 + x), 1.3, 0.16, 2.0), FINAL + k2 * 0.05)
    elif modo == "tension":
        poner(colchon([base - 24, base - 17, base - 12], b - a + 0.1, 0.16, 0.3, 0.1), a)
        lat, gap = a, 0.6
        while lat < b - 0.1:
            poner(bombo(0.45), lat)
            lat += gap
            gap = max(0.25, gap * 0.86)
    elif modo == "pesado":
        poner(bombo(1.0), a)
        poner(colchon([base - 24, base - 12, base - 5, base], b - a + 0.2, 0.18, 0.1, 0.2), a)
        t = a + BEAT
        while t < b - 0.1:
            poner(bombo(0.5), t)
            poner(pluck(hz(base - 12), 0.4, 0.22, 6), t)
            poner(pluck(hz(base), 0.3, 0.1, 8), t + BEAT / 2)
            t += BEAT
    elif modo == "espacial":
        poner(colchon([base - 12, base, base + 7, base + 12, base + 19], b - a + 0.3, 0.14, 0.4, 0.3), a)
        n = max(6, int((b - a) / 0.14))
        for j in range(n):
            poner(pluck(hz(sc[[0, 2, 4, 7][j % 4]] + 12 * (j // 8 % 2)), 0.3, 0.06 + 0.06 * j / n), a + j * (b - a) / n)
    elif modo == "brillo":
        poner(bombo(0.9), a)
        poner(colchon([base - 12, base, base + 4, base + 7, base + 12], b - a + 0.4, 0.16, 0.2, 0.4), a)
        for k2, x in enumerate([0, 4, 7, 12, 16]):
            poner(marimba(hz(base + 12 + x), 1.2, 0.15, 2.5), a + 0.05 * k2)

cursor = 0.0
for g in M.get("golpes", []):
    w, _, ref = g.partition("@")  # «o@225» = el primer «o» después de «225»
    tg = at(w, at(ref, cursor) + 0.01) if ref else at(w, cursor)
    cursor = tg + 0.1
    poner(bombo(0.8), tg)
    for x in (0, 7, 12):
        poner(marimba(hz(int(M["secciones"][0].get("tonica", 57)) + x), 0.6, 0.18, 5.0), tg)

ts = np.arange(N) / SR
mus *= np.clip(ts / 0.01, 0, 1) * np.clip((DUR - ts) / 0.6, 0, 1)
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
st = np.stack([mus, np.roll(mus, int(0.01 * SR)) * 0.96], axis=1)
with wave.open(f"public/audio/musica_{SLUG}_{V}.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print(f"v{V}: {DUR:.2f} s · " + " · ".join(f"{s['modo']} {s['t0']:.1f}" for s in secs))
