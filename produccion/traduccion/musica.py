"""Música de fondo para «Biología — La traducción»: suave, mayor, tipo presentación escolar.
Bucle de 16 compases que empalma sin corte. Uso: python3 -I produccion/traduccion/musica.py
→ public/traduccion/musica.wav"""
import wave
import numpy as np

SR = 44100
BPM = 92
BEAT = 60 / BPM
COMPASES = 16
DUR = COMPASES * 4 * BEAT
N = int(DUR * SR)
mus = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def poner(sig, t0):
    i = int(t0 * SR) % N
    j = i + len(sig)
    if j <= N:
        mus[i:j] += sig
    else:  # da la vuelta: el bucle empalma
        k = N - i
        mus[i:] += sig[:k]
        mus[: j - N] += sig[k:]


def tt(d):
    return np.arange(int(d * SR)) / SR


def marimba(f, d, a):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 20)
    return a * s * np.exp(-t * 5.5) * np.minimum(1, t * 400)


def pad(notas, d, a):
    t = tt(d)
    s = sum(np.sin(2 * np.pi * hz(n) * t) + 0.3 * np.sin(2 * np.pi * hz(n) * 2.003 * t) for n in notas)
    env = np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.5)
    return a * s * env / len(notas)


def bajo(f, d, a):
    t = tt(d)
    return a * np.sin(2 * np.pi * f * t) * np.exp(-t * 2.5) * np.minimum(1, t * 200)


# I – vi – IV – V en Do mayor, 2 compases por acorde
ACORDES = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]] * 2
for c, acorde in enumerate(ACORDES):
    t0 = c * 8 * BEAT
    poner(pad([n + 12 for n in acorde], 8 * BEAT, 0.10), t0)
    for b in range(8):
        poner(bajo(hz(acorde[0] - 12), BEAT * 0.9, 0.22 if b % 4 == 0 else 0.12), t0 + b * BEAT)
    # arpegio de marimba en corcheas
    patron = [0, 1, 2, 1, 2, 3, 2, 1] * 2
    for k, p in enumerate(patron):
        nota = (acorde + [acorde[0] + 12])[p] + 12
        poner(marimba(hz(nota), 0.6, 0.16 if k % 2 == 0 else 0.10), t0 + k * BEAT / 2)

mus = mus / np.max(np.abs(mus)) * 0.8
pcm = (np.stack([mus, mus], 1) * 32767).astype(np.int16)
with wave.open("public/traduccion/musica.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"musica.wav · {DUR:.1f}s en bucle")
