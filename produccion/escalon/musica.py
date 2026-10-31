"""Música original del reel «Escalón» (sintetizada acá, sin licencias de terceros). Sigue la historia, no una grilla:

- 0–0,8 s: el que corre. Pulso grave rápido que empuja hacia el golpe contra la pared (0,8 s), y corte a casi silencio.
- 2,53 s (primer ladrillo, «día 1»): una sola nota cálida de pluck en Re: el motivo del día 1.
- 3–10 s (time-lapse): tic que se acelera con los ladrillos y una nota de bajo que SUBE un grado de Re menor cada vez
  que se completa un escalón (la escalera también se oye). Colchón grave que acompaña cada escalón.
- 10 s (día 365, llega arriba): florece Re MAYOR (el mismo acorde, ahora luminoso).
- 13,4 s (el que estaba abajo pone su ladrillo): vuelve la misma nota del día 1 (eco). Cierre suave en Re mayor.
Uso: python3 -I musica.py salida.wav
"""
import sys
import wave

import numpy as np

SR = 48000
FPS = 30
TOTAL = 520
DUR = TOTAL / FPS
N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(5)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

NB = 72
BT = [76.0] + [90 + 210 * ((i - 1) / 70) ** 0.6 for i in range(1, NB)]
TC = [BT[(c + 1) * (c + 2) - 1] for c in range(8)]
SLAM1, BRICK1, TOP, TOSS, CATCH, APLACE = 24, 76, 300, 358, 380, 402


def poner(sig, t0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    mus[i:j] += sig[: j - i]


def env_t(dur):
    return np.arange(int(dur * SR)) / SR


def pluck(f, dur, amp, decay=5.0):
    t = env_t(dur)
    env = np.exp(-t * decay) * np.minimum(1, t / 0.003)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 14))


def bajo(f, dur, amp):
    t = env_t(dur)
    env = np.minimum(1, t / 0.02) * np.exp(-t * 1.4) * np.clip((dur - t) / 0.15, 0, 1)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t))


def colchon(notas, dur, amp, ataque=0.6, salida=0.4):
    t = env_t(dur)
    env = np.minimum(1, t / ataque) * np.clip((dur - t) / salida, 0, 1)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + 0.6 * np.sin(2 * np.pi * hz(m) * 1.006 * t + 1.1) for m in notas)
    return amp * env * s / len(notas)


def golpe(amp, f0=44, dur=0.5):
    t = env_t(dur)
    f = f0 + 80 * np.exp(-t * 26)
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def tic(amp, brillo=1.0):
    t = env_t(0.05)
    r = np.diff(np.concatenate([[0], rng.standard_normal(len(t))]))
    return amp * r * np.exp(-t * (90 / brillo))


# 1) el que corre: pulso grave rápido hasta el golpe
for k in range(6):
    poner(golpe(0.20 + 0.04 * k, 50, 0.18), k * 4 / FPS)
    poner(tic(0.05), (k * 4 + 2) / FPS)
poner(golpe(0.6, 38, 1.0), SLAM1 / FPS)
poner(colchon([26, 38], 2.0, 0.07, ataque=0.05, salida=1.2), SLAM1 / FPS)

# 2) día 1: la nota del motivo
MOTIVO = [62, 69]  # Re y La


def motivo(t0, amp=0.18):
    poner(pluck(hz(MOTIVO[0]), 1.6, amp, 3.0), t0)
    poner(pluck(hz(MOTIVO[1]), 1.4, amp * 0.6, 3.5), t0 + 0.18)


motivo(BRICK1 / FPS)

# 3) time-lapse: tic por ladrillo (con tope) + bajo que sube un grado por escalón
ESCALA = [38, 40, 41, 43, 45, 46, 48, 50]  # Re menor ascendente
inicio = [BT[1]] + TC[:-1]
for c in range(8):
    t0 = (TC[c - 1] if c > 0 else BT[1]) / FPS
    t1 = TC[c] / FPS
    poner(bajo(hz(ESCALA[c]), max(0.3, t1 - t0 + 0.05), 0.20), t0)
    poner(colchon([ESCALA[c] + 12, ESCALA[c] + 19], max(0.4, t1 - t0 + 0.2), 0.035, ataque=0.15, salida=0.2), t0)
    poner(pluck(hz(ESCALA[c] + 24), 0.5, 0.10, 6), t1 / 1)  # el escalón terminado suena
last = -99
for i in range(1, NB):
    if BT[i] - last >= 3:
        poner(tic(0.035 + 0.04 * i / NB, 1.3), BT[i] / FPS)
        last = BT[i]

# 4) día 365: Re mayor
t0 = TOP / FPS
poner(golpe(0.5, 40, 1.0), t0)
poner(colchon([38, 50, 57, 62, 66, 69], (CATCH - TOP) / FPS + 0.8, 0.16, ataque=0.25, salida=0.8), t0)
for k, m in enumerate([62, 66, 69, 74, 78]):
    poner(pluck(hz(m), 2.0, 0.12, 2.2), t0 + 0.05 * k)

# 5) el tiro y el atajo
for k, m in enumerate([69, 74, 78, 81]):
    poner(pluck(hz(m), 0.5, 0.09, 7), TOSS / FPS + 0.12 * k)
poner(pluck(hz(74), 0.8, 0.08, 5), CATCH / FPS)

# 6) su día 1: vuelve el motivo y cierra en Re mayor, suave
motivo(APLACE / FPS, 0.2)
t0 = APLACE / FPS
poner(colchon([38, 50, 57, 62, 66], DUR - t0, 0.15, ataque=0.5, salida=1.0), t0)
paso = 0.5
k = 0
t = t0 + 1.0
patron = [62, 66, 69, 66, 62, 69, 74, 69]
while t < DUR - 0.7:
    poner(pluck(hz(patron[k % len(patron)]), 0.6, 0.10, 5), t)
    if k % 2 == 0:
        poner(golpe(0.18, 46, 0.3), t)
    t += paso
    k += 1

mus *= np.minimum(1, np.arange(N) / (0.01 * SR))
mus *= np.clip((DUR - np.arange(N) / SR) / 0.6, 0, 1)
mus /= max(1e-9, np.abs(mus).max()) / 0.85
estereo = np.stack([mus, np.roll(mus, int(0.012 * SR)) * 0.95], axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((estereo * 32767).astype(np.int16).tobytes())
print("ok", sys.argv[1], round(DUR, 2), "s", "columnas", [round(x) for x in TC])
