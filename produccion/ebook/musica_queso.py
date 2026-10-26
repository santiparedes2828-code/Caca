"""Música de fondo original para el dato del queso (sintetizada acá, sin licencias de terceros), por secciones:

- 0–4,45 s (pregunta): misterio en La menor; colchón suave y un motivo que sube y queda sin resolver.
- 4,45–12,39 s (microscopio: bacterias y gas): arpegio burbujeante que se acelera y se llena; «pops» de burbuja.
- 12,39–14,05 s: silencio de música (solo suena el riser).
- 14,05–18,85 s (el queso): marimba alegre en Do mayor con shaker.
- 18,85–20,6 s («¿Lo sabías?»): cadencia Sol → Do y cierre.
Uso: python3 musica_queso.py salida.wav
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = 20.6
BPM = 110
BEAT = 60 / BPM
A_FIN, CORTE, VUELTA, FINAL = 4.45, 12.39, 14.05, 18.85

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


def marimba(f, dur, amp, decay=7.0):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * decay) * np.minimum(1, t / 0.004)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * decay * 3) + 0.15 * np.sin(2 * np.pi * f * 2 * t))


def pluck(f, dur, amp, decay=9.0):  # pizzicato suave
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * decay) * np.minimum(1, t / 0.002)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 20))


def colchon(notas, dur, amp):  # pad: senos levemente desafinados, ataque lento
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.6)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + np.sin(2 * np.pi * hz(m) * 1.004 * t) for m in notas)
    return amp * env * s / len(notas)


def pop_burbuja(amp):  # barrido corto hacia arriba
    t = np.arange(int(0.07 * SR)) / SR
    f = 500 + 2500 * t / 0.07
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40)


def shaker(t0, amp):
    n = int(0.03 * SR)
    r = np.diff(rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 160), prepend=0)
    poner(r * amp, t0)


# --- A1 · la pregunta (0–4,45): misterio ---
poner(colchon([57, 60, 64], A_FIN + 0.6, 0.12), 0)  # La m
poner(colchon([45], A_FIN + 0.6, 0.10), 0)
for k, m in enumerate([76, 81, 84, 83, 76, 81, 84, 86]):  # sube y queda colgado (Re, sin resolver)
    poner(pluck(hz(m), 0.8, 0.20 if k % 4 == 3 else 0.14), 0.05 + k * BEAT)

# --- A2 · bacterias y gas (4,45–12,39): arpegio que se acelera y se llena ---
arpegio = [69, 72, 76, 79, 76, 72]
t, k = A_FIN, 0
while t < CORTE:
    prog = (t - A_FIN) / (CORTE - A_FIN)
    paso = BEAT / 2 if prog < 0.45 else BEAT / 3 if prog < 0.8 else BEAT / 4
    m = arpegio[k % len(arpegio)] + (12 if prog > 0.6 and k % 3 == 0 else 0)
    poner(pluck(hz(m), 0.5, 0.10 + 0.08 * prog), t)
    if k % 4 == 0:
        poner(pluck(hz(45 if prog < 0.5 else 41), 0.6, 0.22, 4.0), t)  # bajo La → Fa
    if rng.random() < 0.25 + 0.5 * prog:
        poner(pop_burbuja(0.08 + 0.08 * prog), t + rng.random() * paso)
    t += paso
    k += 1
poner(colchon([57, 60, 64, 69], CORTE - A_FIN, 0.06), A_FIN)

# --- B · el queso (14,05–18,85): marimba alegre en Do mayor ---
acordes = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
bajos = [36, 33, 29, 31]
melodia = [72, 76, 79, 76, 74, 72, 69, 72]
t, c = VUELTA, 0
while t < FINAL:
    a = acordes[c % 4]
    poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.35, 2.5), t)
    poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.25, 3.0), t + BEAT * 2)
    for k in range(8):
        m = melodia[(k + c * 3) % 8]
        if k % 2:
            m = a[k % 3] + 12
        if t + k * BEAT / 2 < FINAL:
            poner(marimba(hz(m), 0.6, 0.16 if k % 2 else 0.22), t + k * BEAT / 2)
    for k in range(16):
        if t + k * BEAT / 4 < FINAL:
            shaker(t + k * BEAT / 4, 0.05 if k % 2 else 0.08)
    t += BEAT * 4
    c += 1

# --- C · «¿Lo sabías?» (18,85–): Sol → Do y cierre ---
for k, m in enumerate([67, 71, 74, 79]):
    poner(marimba(hz(m), 0.5, 0.18), FINAL - 0.6 + k * 0.08)
poner(marimba(hz(36), 1.8, 0.4, 1.6), FINAL)
for k, m in enumerate([60, 64, 67, 72, 76]):
    poner(marimba(hz(m), 1.6, 0.2, 2.0), FINAL + k * 0.06)

# --- silencio durante el riser y fundidos ---
tt = np.arange(N) / SR
g = np.ones(N)
g[(tt >= CORTE) & (tt < VUELTA)] = 0
g[(tt >= CORTE - 0.03) & (tt < CORTE)] = np.linspace(1, 0, int(np.sum((tt >= CORTE - 0.03) & (tt < CORTE))))
g *= np.clip(tt / 0.02, 0, 1) * np.clip((DUR - tt) / 0.8, 0, 1)
mus *= g
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8

st = np.stack([mus, mus], axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
