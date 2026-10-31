"""Música original de «Cleopatra y la Luna» (sintetizada acá, sin licencias de terceros), por secciones de la voz.

- Gancho: pulso grave misterioso (en la variante 1 se aquieta durante el reloj de 2 s).
- Egipto (la pirámide → Julio César): marimba en escala frigia dominante (Mi–Fa–Sol#–La–Si–Do–Re) a 100 ppm.
- 1969 → la Luna: colchón espacial y arpegio que sube (sin riser de ruido).
- «este video»: golpe y florece Mi mayor.
- CTA: groove en Mi mayor y acorde final.
Uso: python3 -I musica.py <variante 1-5> salida.wav
"""
import json
import sys
import wave

import numpy as np

V = int(sys.argv[1])
SR = 48000
caps = json.load(open(f"src/data/captions-cleopatra-{V}.json"))


def norm(w):
    return w.lower().strip("¿?¡!.,:…\"").replace(".", "")


def at(word, desde=0.0):
    for c in caps:
        if c["startMs"] / 1000 >= desde and norm(c["text"]).startswith(word):
            return c["startMs"] / 1000
    raise SystemExit(f"no está «{word}»")


CUERPO = at("gran") - 0.3
A1969 = at("1969", CUERPO) - 0.6
LUNA = at("luna", A1969)
OSEA = at("o", at("2000", LUNA)) - 0.1
VIDEO = at("video", OSEA)
CTA = at("seguime", VIDEO)
DUR = caps[-1]["endMs"] / 1000 + 36 / 30
FINAL = DUR - 1.3
TIMER = (at("2 seg") + 0.5, at("2 seg") + 2.6) if V == 1 else (-1, -1)
N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(9)
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


# gancho
poner(colchon([40, 47, 52], CUERPO + 0.2, 0.10, 0.2), 0)
t, k = 0.0, 0
mot = [64, 65, 68, 69]
while t < CUERPO - 0.05:
    quieto = TIMER[0] <= t < TIMER[1]
    if not quieto:
        poner(pluck(hz(mot[k % 4] + 12 * (k // 8 % 2)), 0.35, 0.09), t)
    if k % 2 == 0:
        poner(pluck(hz(28), 0.5, 0.2 if not quieto else 0.08, 5.0), t)
    t += BEAT / 2
    k += 1

# Egipto: frigia dominante sobre Mi
ESC = [64, 65, 68, 69, 71, 72, 74, 76]
t, c = CUERPO, 0
while t < A1969 - 0.05:
    poner(marimba(hz(40), BEAT * 2, 0.3, 2.5), t)
    if t + BEAT * 2 < A1969 - 0.05:
        poner(marimba(hz(41 if c % 2 else 40), BEAT * 2, 0.22, 3.0), t + BEAT * 2)
    for j in range(8):
        tj = t + j * BEAT / 2
        if tj >= A1969 - 0.05:
            break
        m = ESC[(j * 3 + c * 2) % 8] if j % 2 == 0 else ESC[(j + c) % 4]
        poner(marimba(hz(m), 0.6, 0.18 if j % 2 == 0 else 0.13), tj)
    for j in range(16):
        tj = t + j * BEAT / 4
        if tj < A1969 - 0.05:
            shaker(tj, 0.04 if j % 2 else 0.065)
    for j in (0, 2):
        if t + j * BEAT < A1969 - 0.05:
            poner(bombo(0.32), t + j * BEAT)
    t += BEAT * 4
    c += 1

# 1969 → Luna: colchón espacial y arpegio que sube
poner(bombo(0.7), A1969 + 0.6)
poner(colchon([40, 52, 59, 64, 71], OSEA - A1969 + 0.3, 0.14, 0.4, 0.3), A1969)
n_arp = max(6, int((OSEA - A1969) / 0.14))
for j in range(n_arp):
    tj = A1969 + j * (OSEA - A1969) / n_arp
    poner(pluck(hz([64, 68, 71, 76][j % 4] + 12 * (j // 8 % 2)), 0.3, 0.06 + 0.06 * j / n_arp), tj)
poner(bombo(0.6), LUNA)

# «este video»: golpe y Mi mayor
poner(bombo(0.9), VIDEO)
poner(colchon([40, 52, 56, 59, 64], CTA - VIDEO + 0.4, 0.16, 0.2, 0.4), VIDEO)
for k2, m in enumerate([64, 68, 71, 76, 80]):
    poner(marimba(hz(m), 1.2, 0.15, 2.5), VIDEO + 0.05 * k2)

# CTA: groove en Mi mayor
AC = [[64, 68, 71], [61, 64, 68], [57, 61, 64], [59, 63, 66]]
BJ = [40, 37, 33, 35]
MEL = [76, 80, 83, 80, 78, 76, 73, 76]
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
poner(marimba(hz(40), 1.6, 0.36, 1.6), FINAL)
for k2, m in enumerate([64, 68, 71, 76, 80]):
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
print(f"v{V}: {DUR:.2f} s · cuerpo {CUERPO:.2f} · 1969 {A1969:.2f} · luna {LUNA:.2f} · o sea {OSEA:.2f} · video {VIDEO:.2f} · cta {CTA:.2f}")
