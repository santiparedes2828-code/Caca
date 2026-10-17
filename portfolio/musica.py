# Música propia del reel de portfolio, sintetizada aquí (sin muestras de terceros): 120 BPM, 28 s,
# bombo en cada tiempo, charles a contratiempo, bajo y acordes suaves (Am · F · C · G), final que se apaga.
import numpy as np, wave
SR, BPM, DUR = 48000, 120, 28.0
beat = 60 / BPM
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)
def env(n, a=0.005, d=0.25):
    x = np.arange(n) / SR
    return np.minimum(1, x / a) * np.exp(-x / d)
def add(sig, start):
    i = int(start * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[: j - i]
nb = int(DUR / beat)
for b in range(nb):
    s = b * beat
    if b >= 2:  # bombo desde el segundo compás medio
        n = int(0.35 * SR); x = np.arange(n) / SR
        f = 50 + 70 * np.exp(-x * 35)
        add(0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12), s)
    n = int(0.06 * SR)
    add(0.12 * np.random.default_rng(b).standard_normal(n) * env(n, 0.001, 0.02), s + beat / 2)  # charles
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (130.81, 196.0, 261.63), (196.0, 246.94, 293.66)]
bar = 4 * beat
for k in range(int(DUR / bar) + 1):
    root = chords[k % 4]
    n = int(bar * SR); x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2 * f * x) for f in root)
    add(0.07 * pad * np.minimum(1, x / 0.3) * np.minimum(1, (bar - x) / 0.3), k * bar)
    for q in range(4):  # bajo en negras
        m = int(beat * SR); y = np.arange(m) / SR
        add(0.22 * np.sin(2 * np.pi * root[0] / 2 * y) * env(m, 0.01, 0.3), k * bar + q * beat)
fade = np.ones_like(t); tail = t > DUR - 2.0
fade[tail] = np.linspace(1, 0, tail.sum())
fade[t < 0.05] = t[t < 0.05] / 0.05
out = out * fade
out = out / np.max(np.abs(out)) * 0.8
pcm = (out * 32767).astype(np.int16)
w = wave.open("public/portfolio/musica.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print("ok", DUR, "s")
