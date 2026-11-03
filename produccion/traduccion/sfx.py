"""Efectos de sonido sintetizados (originales) para «La traducción».
Uso: python3 -I produccion/traduccion/sfx.py → public/traduccion/sfx/*.wav"""
import os
import wave
import numpy as np

SR = 48000
OUT = "public/traduccion/sfx"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(3)


def tt(d):
    return np.arange(int(d * SR)) / SR


def guardar(nombre, x, pico=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * pico
    pcm = (np.stack([x, x], 1) * 32767).astype(np.int16)
    with wave.open(f"{OUT}/{nombre}.wav", "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def lowpass(x, a):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def banda(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def barrido(x, f0, f1):
    """filtro pasabanda que se mueve de f0 a f1 (por bloques)"""
    n = len(x)
    out = np.zeros(n)
    B = 1024
    for i in range(0, n, B):
        seg = x[i : i + B]
        if len(seg) < 8:
            break
        fc = f0 * (f1 / f0) ** (i / n)
        out[i : i + B] = banda(seg, fc * 0.6, fc * 1.6)
    return out


# whoosh: ruido que barre hacia arriba
d = 0.45
t = tt(d)
env = np.sin(np.pi * t / d) ** 2
guardar("whoosh", barrido(rng.standard_normal(len(t)), 400, 4000) * env, 0.7)

# whoosh corto y suave (cambio de esquema)
d = 0.28
t = tt(d)
env = np.sin(np.pi * t / d) ** 2
guardar("swish", barrido(rng.standard_normal(len(t)), 900, 5000) * env, 0.5)

# pop: burbuja con caída de tono
d = 0.12
t = tt(d)
f = 900 * np.exp(-t * 18) + 300
guardar("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * np.minimum(1, t * 3000), 0.8)

# ding: campanita
d = 1.2
t = tt(d)
s = sum(a * np.sin(2 * np.pi * 1318.5 * k * t) * np.exp(-t * (3 + 2 * k)) for k, a in [(1, 1), (2.76, 0.4), (5.4, 0.2)])
guardar("ding", s * np.minimum(1, t * 2000), 0.6)

# tick: máquina de escribir
d = 0.04
t = tt(d)
guardar("tick", banda(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t * 180), 0.5)

# scratch de disco
d = 0.5
t = tt(d)
fase = np.cumsum(220 + 900 * np.sin(2 * np.pi * 2.2 * t) ** 2) / SR
s = np.sign(np.sin(2 * np.pi * fase)) * 0.4 + rng.standard_normal(len(t)) * 0.6
s = banda(s, 300, 5000) * np.sin(np.pi * t / d) ** 0.5
guardar("scratch", s, 0.7)

# claqueta: dos golpes secos
d = 0.25
t = tt(d)
golpe = lambda: banda(rng.standard_normal(len(t)), 800, 9000) * np.exp(-t * 90) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60) * 0.6
s = golpe()
guardar("claqueta", s, 0.9)

# boing
d = 0.6
t = tt(d)
f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3) + 160 * t
guardar("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * np.minimum(1, t * 800), 0.7)

# obturador de cámara
d = 0.22
t = tt(d)
a = banda(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 120)
b = np.roll(a, int(0.07 * SR)) * 0.7
guardar("obturador", a + b, 0.8)

# ta-da: acorde mayor brillante
d = 1.6
t = tt(d)
s = np.zeros(len(t))
for k, n in enumerate([60, 64, 67, 72]):
    f = 440 * 2 ** ((n + 12 - 69) / 12)
    tk = np.maximum(0, t - 0.03 * k)
    s += (np.sin(2 * np.pi * f * tk) + 0.3 * np.sin(4 * np.pi * f * tk)) * np.exp(-tk * 2.2) * (t >= 0.03 * k)
guardar("tada", s * np.minimum(1, t * 400), 0.7)

# stop: zumbido grave tipo "error" de juego
d = 0.45
t = tt(d)
s = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 + np.sin(2 * np.pi * 116 * t)
guardar("stop", lowpass(s, 0.08) * np.minimum(1, (d - t) * 20) * np.minimum(1, t * 300), 0.6)

# brillo: arpegio ascendente rápido (plegado / revelación)
d = 0.9
t = tt(d)
s = np.zeros(len(t))
for k, n in enumerate([72, 76, 79, 84, 88]):
    f = 440 * 2 ** ((n - 69) / 12)
    t0 = 0.06 * k
    tk = np.maximum(0, t - t0)
    s += np.sin(2 * np.pi * f * tk) * np.exp(-tk * 6) * (t >= t0)
guardar("brillo", s, 0.5)

print("efectos:", sorted(os.listdir(OUT)))
