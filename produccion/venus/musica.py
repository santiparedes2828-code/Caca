"""Música original de «Un día en Venus» (sintetizada acá, sin licencias de terceros), por secciones de la voz.

- Gancho: pulso espacial misterioso (en la variante 1 se aquieta durante el reloj de 2 s).
- Día / año (desde «Venus tarda…» hasta «Encima»): groove soñado en Fa lidio a 104 ppm (marimba + campanitas).
- «Encima… Mercurio»: se corta el ritmo; colchón grave que sube de tensión con latido.
- «caliente / 450 grados / plomo»: golpe y pulso pesado en Re menor.
- «Comentá Venus»: groove en Fa mayor y acorde final.
Uso: python3 -I musica.py <variante 1-5> salida.wav
"""
import json
import sys
import wave

import numpy as np

V = int(sys.argv[1])
SR = 48000
caps = json.load(open(f"src/data/captions-venus-{V}.json"))


def norm(w):
    return w.lower().strip("¿?¡!.,:…\"«»").replace(".", "")


def at(word, desde=0.0):
    for c in caps:
        if c["startMs"] / 1000 >= desde and norm(c["text"]).startswith(word):
            return c["startMs"] / 1000
    raise SystemExit(f"no está «{word}»")


CUERPO = at("tarda") - 0.5
OSEA = at("o", at("225", CUERPO))
ENCIMA = at("encima", OSEA) - 0.1
CAL = at("caliente", ENCIMA)
CTA = at("comentá", CAL) - 0.1
DUR = caps[-1]["endMs"] / 1000 + 36 / 30
FINAL = DUR - 1.3
TIMER = (at("2 seg") + 0.5, at("2 seg") + 2.6) if V == 1 else (-1, -1)
N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(13)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
BEAT = 60 / 104


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


def bell(f, d, a):
    t = tt(d)
    e = np.exp(-t * 3.5) * np.minimum(1, t / 0.002)
    return a * e * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9))


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


# gancho
poner(colchon([41, 48, 53], CUERPO + 0.3, 0.10, 0.2), 0)
t, k = 0.0, 0
mot = [77, 81, 83, 84]
while t < CUERPO - 0.05:
    quieto = TIMER[0] <= t < TIMER[1]
    if not quieto:
        poner(bell(hz(mot[k % 4]), 0.6, 0.06), t)
    if k % 2 == 0:
        poner(pluck(hz(29), 0.5, 0.2 if not quieto else 0.08, 5.0), t)
    t += BEAT / 2
    k += 1

# día / año: Fa lidio
LID = [65, 67, 69, 71, 72, 74, 76, 77]
t, c = CUERPO, 0
while t < ENCIMA - 0.05:
    poner(marimba(hz(41 if c % 2 == 0 else 43), BEAT * 2, 0.3, 2.5), t)
    for j in range(8):
        tj = t + j * BEAT / 2
        if tj >= ENCIMA - 0.05:
            break
        m = LID[(j * 3 + c) % 8] + (12 if j % 4 == 3 else 0)
        poner(marimba(hz(m), 0.6, 0.15 if j % 2 else 0.19), tj)
        if j % 4 == 0:
            poner(bell(hz(m + 12), 0.8, 0.04), tj)
    for j in range(16):
        tj = t + j * BEAT / 4
        if tj < ENCIMA - 0.05:
            shaker(tj, 0.04 if j % 2 else 0.06)
    for j in (0, 2):
        if t + j * BEAT < ENCIMA - 0.05:
            poner(bombo(0.3), t + j * BEAT)
    t += BEAT * 4
    c += 1
poner(bombo(0.8), OSEA + 0.9)

# encima: colchón que sube con latido
poner(colchon([38, 45, 50], CAL - ENCIMA + 0.1, 0.16, 0.3, 0.1), ENCIMA)
lat, gap = ENCIMA, 0.6
while lat < CAL - 0.1:
    poner(bombo(0.45), lat)
    lat += gap
    gap = max(0.25, gap * 0.85)

# calor: golpe y pulso pesado en Re menor
poner(bombo(1.0), CAL)
poner(colchon([26, 38, 45, 50, 53], CTA - CAL + 0.2, 0.18, 0.1, 0.2), CAL)
t = CAL + BEAT
while t < CTA - 0.1:
    poner(bombo(0.5), t)
    poner(pluck(hz(38), 0.4, 0.22, 6), t)
    poner(pluck(hz(50), 0.3, 0.1, 8), t + BEAT / 2)
    t += BEAT

# CTA: Fa mayor
AC = [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67]]
BJ = [41, 38, 34, 36]
MEL = [77, 81, 84, 81, 79, 77, 74, 77]
t, c = CTA, 0
while t < FINAL - 0.05:
    poner(marimba(hz(BJ[c % 4]), BEAT * 2, 0.28, 2.5), t)
    for j in range(8):
        tj = t + j * BEAT / 2
        if tj >= FINAL - 0.05:
            break
        m = MEL[(j + c * 3) % 8] if j % 2 == 0 else AC[c % 4][j % 3] + 12
        poner(marimba(hz(m), 0.6, 0.17 if j % 2 == 0 else 0.12), tj)
        shaker(tj, 0.05)
    poner(bombo(0.3), t)
    t += BEAT * 4
    c += 1
poner(marimba(hz(41), 1.6, 0.36, 1.6), FINAL)
for k2, m in enumerate([65, 69, 72, 77, 81]):
    poner(marimba(hz(m), 1.3, 0.16, 2.0), FINAL + k2 * 0.05)

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
print(f"v{V}: {DUR:.2f} s · cuerpo {CUERPO:.2f} · o sea {OSEA:.2f} · encima {ENCIMA:.2f} · caliente {CAL:.2f} · cta {CTA:.2f}")
