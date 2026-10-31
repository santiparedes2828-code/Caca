"""Música original del reel «Todos empiezan igual» (sintetizada acá, sin licencias de terceros).

Sigue la imagen, no una grilla fija:
- 0–5,5 s (el pulgar descarta celulares grises): Re menor oscuro. Un golpe grave + tic en cada descarte, que se
  aceleran junto con el pulgar; colchón grave que se espesa un poco (sin riser).
- 5,53 s (el pulgar se frena): corte casi a silencio, queda una nota aguda sostenida.
- 6,27 s (corazón): florece un acorde mayor cálido (Re mayor): «el distinto».
- 7,6–9,5 s (la cámara entra al celular, «como vos, con este video»): vuelve un pulso suave de pluck en Re mayor.
- 10 s– (CTA): motivo corto que resuelve; 11,73 s (toque en Seguir): acorde final que se apaga.
Uso: python3 -I musica.py salida.wav <duración_s>
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = float(sys.argv[2])
FPS = 30
FLICKS = [3, 20, 36, 51, 64, 76, 87, 97, 106, 114, 121, 128, 134, 140, 146]
FREEZE, HEART, ZOOM_A, T3, CTA, TAP = (x / FPS for x in (166, 188, 228, 244, 300, 352))

N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)


def poner(sig, t0):
    i = int(t0 * SR)
    if i >= N or i < 0:
        return
    j = min(N, i + len(sig))
    mus[i:j] += sig[: j - i]


def tono(f, dur, amp, decay=6.0, armon=0.3, ataque=0.004):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * decay) * np.minimum(1, t / ataque)
    return amp * env * (np.sin(2 * np.pi * f * t) + armon * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * decay * 2))


def colchon(notas, dur, amp, ataque=0.8, salida=0.4):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / ataque) * np.clip((dur - t) / salida, 0, 1)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + 0.7 * np.sin(2 * np.pi * hz(m) * 1.005 * t + 1.3) for m in notas)
    return amp * env * s / len(notas)


def golpe(amp):
    t = np.arange(int(0.3 * SR)) / SR
    f = 46 + 60 * np.exp(-t * 28)
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)


def tic(amp):
    t = np.arange(int(0.04 * SR)) / SR
    ruido = rng.standard_normal(len(t))
    ruido = np.diff(np.concatenate([[0], ruido]))  # agudo
    return amp * ruido * np.exp(-t * 120)


# 1) frenesí: colchón grave de Re menor que se espesa; golpe + tic por descarte, cada vez más juntos
poner(colchon([38, 45], FREEZE + 0.05, 0.10, ataque=1.2, salida=0.04), 0)
poner(colchon([50, 53, 57], FREEZE - 2.0 + 0.05, 0.05, ataque=1.8, salida=0.04), 2.0)
for i, fl in enumerate(FLICKS):
    t0 = fl / FPS
    k = i / (len(FLICKS) - 1)
    poner(golpe(0.42 + 0.18 * k), t0)
    poner(tic(0.06 + 0.05 * k), t0)
    # nota de bajo que sube de a poco con el descarte (Re, Fa, La, Do…)
    nota = [38, 38, 41, 41, 43, 43, 45, 45, 46, 46, 48, 48, 50, 50, 50][i]
    poner(tono(hz(nota + 12), 0.25, 0.10 + 0.05 * k, decay=10), t0)

# 2) el pulgar se frena: casi silencio, una nota aguda que queda colgada
poner(colchon([81], HEART - FREEZE + 0.6, 0.035, ataque=0.15, salida=0.5), FREEZE)

# 3) corazón: florece Re mayor (cálido, abierto)
poner(colchon([50, 57, 62, 66, 69], CTA - HEART + 0.4, 0.075, ataque=0.5, salida=0.6), HEART)
for k, m in enumerate([62, 66, 69, 74]):
    poner(tono(hz(m), 1.4, 0.10, decay=3.0), HEART + 0.06 * k)

# 4) entra al celular: pulso suave de pluck en Re mayor (corcheas a 120 ppm)
BEAT = 0.5
patron = [62, 69, 66, 69, 62, 69, 67, 69]
t = ZOOM_A + 0.2
k = 0
while t < CTA - 0.1:
    poner(tono(hz(patron[k % len(patron)]), 0.35, 0.07, decay=9), t)
    if k % 2 == 0:
        poner(golpe(0.22), t)
    t += BEAT / 2
    k += 1

# 5) CTA: motivo que resuelve y acorde final al tocar «Seguir»
for k, m in enumerate([69, 71, 73, 74]):
    poner(tono(hz(m), 0.6, 0.09, decay=5), CTA + 0.1 + 0.32 * k)
poner(colchon([50, 57, 62, 66], TAP - CTA + 0.3, 0.06, ataque=0.4, salida=0.3), CTA)
poner(golpe(0.35), TAP)
poner(colchon([38, 50, 57, 62, 66, 69, 74], DUR - TAP, 0.09, ataque=0.03, salida=DUR - TAP - 0.1), TAP)
for k, m in enumerate([74, 78, 81, 86]):
    poner(tono(hz(m), 1.6, 0.06, decay=2.5), TAP + 0.04 * k)

# salida
mus *= np.minimum(1, np.arange(N) / (0.02 * SR))
mus /= max(1e-9, np.abs(mus).max()) / 0.85
estereo = np.stack([mus, np.roll(mus, int(0.011 * SR)) * 0.96], axis=1)
datos = (estereo * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(datos.tobytes())
print("ok", sys.argv[1], round(DUR, 2), "s")
