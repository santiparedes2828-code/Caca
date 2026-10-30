"""Música original del reel «La medialuna» (sintetizada acá, sin licencias de terceros), por secciones de la voz:

- 0–4,9 s (gancho y mito): pulso en La menor que sube y queda colgado.
- 4,9 s («falso»): golpe y corte seco a silencio hasta 5,75 s.
- 5,75–21,4 s (los tres cambios): marimba en Do mayor a 104 ppm con shaker y bombo suave.
- 21,4–23,6 s («Mismo video. Misma cámara.»): solo colchón que crece (la tensión antes del resultado).
- 23,6 s– (resultado y CTA): vuelve la marimba con melodía; acorde final de Do.
Uso: python3 musica.py salida.wav <duración_s>
"""
import sys
import wave

import numpy as np

SR = 48000
DUR = float(sys.argv[2])
BPM = 104
BEAT = 60 / BPM
FALSO, VUELTA, PAUSA, PAGO, FINAL = 4.9, 5.75, 21.4, 23.6, DUR - 1.4

N = int(DUR * SR)
mus = np.zeros(N)
rng = np.random.default_rng(11)
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


def pluck(f, dur, amp, decay=9.0):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * decay) * np.minimum(1, t / 0.002)
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 20))


def colchon(notas, dur, amp, ataque=0.8):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / ataque) * np.minimum(1, (dur - t) / 0.3)
    s = sum(np.sin(2 * np.pi * hz(m) * t) + np.sin(2 * np.pi * hz(m) * 1.004 * t) for m in notas)
    return amp * env * s / len(notas)


def bombo(amp):
    t = np.arange(int(0.25 * SR)) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


def shaker(t0, amp):
    n = int(0.03 * SR)
    r = np.diff(rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 160), prepend=0)
    poner(r * amp, t0)


# --- gancho y mito (0–4,9): pulso que sube ---
poner(colchon([57, 60, 64], FALSO + 0.1, 0.10, 0.3), 0)
t, k = 0.0, 0
motivo = [69, 72, 76, 72, 69, 72, 76, 79]
while t < FALSO - 0.05:
    prog = t / FALSO
    poner(pluck(hz(motivo[k % 8] + (12 if prog > 0.6 and k % 2 else 0)), 0.4, 0.10 + 0.08 * prog), t)
    if k % 2 == 0:
        poner(pluck(hz(45), 0.5, 0.18, 5.0), t)
    if prog > 0.45:
        shaker(t + BEAT / 4, 0.04 + 0.05 * prog)
    t += BEAT / 2
    k += 1
# «falso»: golpe
poner(bombo(0.9), FALSO)
for m in [45, 57, 60, 64]:
    poner(marimba(hz(m), 0.5, 0.22, 6.0), FALSO)


# --- los tres cambios (5,75–21,4) y el pago (23,6–): marimba en Do ---
acordes = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
bajos = [36, 33, 29, 31]
melodia = [72, 76, 79, 76, 74, 72, 69, 72]


def groove(a, b, mel):
    t, c = a, 0
    while t < b - 0.05:
        ac = acordes[c % 4]
        poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.32, 2.5), t)
        poner(marimba(hz(bajos[c % 4]), BEAT * 2, 0.22, 3.0), t + BEAT * 2)
        for k in range(8):
            tk = t + k * BEAT / 2
            if tk >= b - 0.05:
                break
            m = ac[k % 3] + 12 if k % 2 else ac[0] + 12
            if mel:
                m = melodia[(k + c * 3) % 8] if k % 2 == 0 else ac[k % 3] + 12
            poner(marimba(hz(m), 0.6, 0.15 if k % 2 else 0.2), tk)
        for k in range(16):
            tk = t + k * BEAT / 4
            if tk < b - 0.05:
                shaker(tk, 0.045 if k % 2 else 0.07)
        for k in range(0, 4, 2):
            if t + k * BEAT < b - 0.05:
                poner(bombo(0.35), t + k * BEAT)
        t += BEAT * 4
        c += 1


groove(VUELTA, PAUSA, False)
# pausa: colchón que crece
poner(colchon([60, 64, 67, 71], PAGO - PAUSA + 0.05, 0.16, PAGO - PAUSA), PAUSA)
groove(PAGO, FINAL, True)
# cierre: Sol → Do
for k, m in enumerate([67, 71, 74, 79]):
    poner(marimba(hz(m), 0.5, 0.16), FINAL - 0.45 + k * 0.08)
poner(marimba(hz(36), 1.6, 0.4, 1.6), FINAL)
for k, m in enumerate([60, 64, 67, 72, 76]):
    poner(marimba(hz(m), 1.4, 0.18, 2.0), FINAL + k * 0.05)

# silencio después del golpe de «falso» y fundidos
tt = np.arange(N) / SR
g = np.ones(N)
hueco = (tt >= FALSO + 0.32) & (tt < VUELTA)
g[hueco] = 0
caida = (tt >= FALSO + 0.12) & (tt < FALSO + 0.32)
g[caida] = np.linspace(1, 0, int(np.sum(caida)))
g *= np.clip(tt / 0.01, 0, 1) * np.clip((DUR - tt) / 0.6, 0, 1)
mus *= g
mus /= np.max(np.abs(mus)) + 1e-9
mus *= 0.8

st = np.stack([mus, mus], axis=1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print(f"{DUR:.2f} s")
