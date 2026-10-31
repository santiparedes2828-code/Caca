"""Música original de «El contrato de 800 dólares» (sintetizada acá, sin licencias de terceros), por secciones de la voz.

- Gancho: pulso grave en La menor con un motivo agudo que pregunta (en la variante 2, más quieto: el reloj manda).
- Historia (1976 → «miedo»): marimba en La menor a 100 ppm con shaker suave.
- «miedo a las deudas» → «800»: se corta el ritmo; queda un colchón grave con latido; golpe en «800».
- «Años más tarde…» → «Apple»: vuelve el ritmo y crece.
- «Apple»: florece Do mayor (luz) y sigue el groove en mayor.
- Subasta: arpegio que sube hasta el golpe en «dólares».
- «Wayne se fue…»: colchón triste (La menor, Fa).
- «Con los videos de tu negocio…» y CTA: groove en Do mayor con melodía; acorde final.
Uso: python3 -I musica.py <variante 1-5> salida.wav
"""
import json
import sys
import wave

import numpy as np

V = int(sys.argv[1])
SR = 48000
caps = json.load(open(f"src/data/captions-contrato-{V}.json"))


def norm(w):
    return w.lower().strip("¿?¡!.,:…\"")


def at(word, desde=0.0):
    for c in caps:
        if c["startMs"] / 1000 >= desde and norm(c["text"]).startswith(word):
            return c["startMs"] / 1000
    raise SystemExit(f"no está «{word}»")


CUERPO = at("1976") - 0.25
MIEDO = at("miedo", CUERPO)
OCHO = at("800", MIEDO)
ANOS = at("años", OCHO)
APPLE = at("apple", ANOS)
SUB = at("2011", APPLE) - 0.25
DOL = at("dólares", SUB)
FUE = at("wayne", DOL) - 0.1
CON = at("con", FUE) - 0.1
DUR = caps[-1]["endMs"] / 1000 + 36 / 30
FINAL = DUR - 1.3
N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(3)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
BEAT = 60 / 100


def poner(sig, t0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    mus[i:j] += sig[: j - i]


def tt(d):
    return np.arange(int(d * SR)) / SR


def marimba(f, d, a, dec=7.0):
    t = tt(d)
    e = np.exp(-t * dec) * np.minimum(1, t / 0.004)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * dec * 3) + 0.15 * np.sin(2 * np.pi * f * 2 * t))


def pluck(f, d, a, dec=9.0):
    t = tt(d)
    e = np.exp(-t * dec) * np.minimum(1, t / 0.002)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 20))


def colchon(notas, d, a, ataque=0.8, salida=0.4):
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


# --- gancho: pulso grave y motivo que pregunta ---
poner(colchon([45, 52, 57], CUERPO + 0.2, 0.10, 0.2), 0)
t, k = 0.0, 0
mot = [69, 72, 76, 74]
while t < CUERPO - 0.05:
    if V != 2 or t < 2.2:
        poner(pluck(hz(mot[k % 4] + 12 * (k // 8 % 2)), 0.35, 0.09), t)
    if k % 2 == 0:
        poner(pluck(hz(33), 0.5, 0.2, 5.0), t)
    t += BEAT / 2
    k += 1

# --- grooves ---
MENOR = ([[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], [33, 29, 36, 31])
MAYOR = ([[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], [36, 33, 29, 31])
MEL = [72, 76, 79, 76, 74, 72, 69, 72]


def groove(a, b, modo, mel=False, fuerza=1.0):
    acordes, bajos = modo
    t, c = a, 0
    while t < b - 0.05:
        ac = acordes[c % 4]
        poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.3 * fuerza, 2.5), t)
        if t + BEAT * 2 < b - 0.05:
            poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.2 * fuerza, 3.0), t + BEAT * 2)
        for j in range(8):
            tj = t + j * BEAT / 2
            if tj >= b - 0.05:
                break
            m = (MEL[(j + c * 3) % 8] if mel and j % 2 == 0 else ac[j % 3] + 12)
            poner(marimba(hz(m), 0.6, (0.14 if j % 2 else 0.19) * fuerza), tj)
        for j in range(16):
            tj = t + j * BEAT / 4
            if tj < b - 0.05:
                shaker(tj, (0.04 if j % 2 else 0.065) * fuerza)
        for j in (0, 2):
            if t + j * BEAT < b - 0.05:
                poner(bombo(0.33 * fuerza), t + j * BEAT)
        t += BEAT * 4
        c += 1


groove(CUERPO, MIEDO, MENOR, fuerza=0.85)
# miedo: colchón grave con latido
poner(colchon([33, 45, 48], OCHO - MIEDO + 0.1, 0.16, 0.2, 0.1), MIEDO)
lat = MIEDO
while lat < OCHO - 0.1:
    poner(bombo(0.45), lat)
    poner(bombo(0.3), lat + 0.22)
    lat += 0.75
poner(bombo(0.9), OCHO)
for m in [33, 45, 52, 57]:
    poner(marimba(hz(m), 0.6, 0.22, 5.0), OCHO)
# vuelve el ritmo y crece hasta Apple
groove(OCHO + 0.5, APPLE, MENOR, fuerza=1.0)
# Apple: florece Do mayor
poner(bombo(0.8), APPLE)
poner(colchon([48, 60, 64, 67, 72], SUB - APPLE + 0.3, 0.16, 0.3, 0.3), APPLE)
for k2, m in enumerate([72, 76, 79, 84]):
    poner(marimba(hz(m), 1.2, 0.16, 2.5), APPLE + 0.05 * k2)
# subasta: arpegio que sube hasta el golpe
n_arp = max(4, int((DOL - SUB) / 0.12))
for j in range(n_arp):
    tj = SUB + j * (DOL - SUB) / n_arp
    poner(pluck(hz([60, 64, 67, 72][j % 4] + 12 * (j // 4 % 2)), 0.25, 0.08 + 0.08 * j / n_arp), tj)
poner(bombo(1.0), DOL)
for m in [36, 48, 60, 64, 67]:
    poner(marimba(hz(m), 1.0, 0.22, 3.0), DOL)
# se fue: colchón triste
poner(colchon([57, 60, 64], (CON - FUE) / 2 + 0.3, 0.13, 0.3, 0.3), FUE)
poner(colchon([53, 57, 60], (CON - FUE) / 2 + 0.2, 0.13, 0.3, 0.3), FUE + (CON - FUE) / 2)
# negocio y CTA: Do mayor con melodía
groove(CON, FINAL, MAYOR, mel=True, fuerza=0.9)
for k2, m in enumerate([67, 71, 74, 79]):
    poner(marimba(hz(m), 0.5, 0.15), FINAL - 0.45 + k2 * 0.08)
poner(marimba(hz(36), 1.6, 0.38, 1.6), FINAL)
for k2, m in enumerate([60, 64, 67, 72, 76]):
    poner(marimba(hz(m), 1.3, 0.17, 2.0), FINAL + k2 * 0.05)

ts = np.arange(N) / SR
mus *= np.clip(ts / 0.01, 0, 1) * np.clip((DUR - ts) / 0.6, 0, 1)
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8
st = np.stack([mus, np.roll(mus, int(0.01 * SR)) * 0.96], axis=1)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print(f"v{V}: {DUR:.2f} s · cuerpo {CUERPO:.2f} · miedo {MIEDO:.2f} · 800 {OCHO:.2f} · apple {APPLE:.2f} · subasta {SUB:.2f}→{DOL:.2f} · fue {FUE:.2f} · con {CON:.2f}")
