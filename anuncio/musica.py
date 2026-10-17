# Música propia del anuncio de Hook House, sintetizada aquí (sin muestras de terceros): 96 BPM (compás = 2,5 s),
# bombo, charles, bajo, acordes, arpegio suave y una subida corta antes del momento en que el video sale del teléfono.
import numpy as np, wave
SR, BPM, DUR, RISE = 48000, 96, 25.0, 15.0
beat = 60 / BPM; bar = 4 * beat
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)
def env(n, a=0.005, d=0.25):
    x = np.arange(n) / SR
    return np.minimum(1, x / a) * np.exp(-x / d)
def add(sig, start, g=1.0):
    i = int(start * SR); j = min(len(out), i + len(sig))
    if i < len(out): out[i:j] += g * sig[: j - i]
rng = np.random.default_rng(7)
for b in range(int(DUR / beat)):
    s = b * beat
    if s >= bar:  # bombo desde el segundo compás
        n = int(0.4 * SR); x = np.arange(n) / SR
        add(np.sin(2 * np.pi * np.cumsum(48 + 80 * np.exp(-x * 30)) / SR) * env(n, 0.002, 0.14), s, 0.95)
    n = int(0.05 * SR)
    add(rng.standard_normal(n) * env(n, 0.001, 0.015), s + beat / 2, 0.1)
chords = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 246.94, 293.66), (164.81, 207.65, 246.94)]  # Am F G E
for k in range(int(DUR / bar) + 1):
    root = chords[k % 4]
    n = int(bar * SR); x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2.003 * f * x) for f in root)
    add(pad * np.minimum(1, x / 0.4) * np.minimum(1, (bar - x) / 0.4), k * bar, 0.06)
    for q in range(4):
        m = int(beat * SR); y = np.arange(m) / SR
        add(np.sin(2 * np.pi * root[0] / 2 * y) * env(m, 0.01, 0.35), k * bar + q * beat, 0.22)
    if bar <= k * bar < 20:  # arpegio en corcheas mientras corre el feed
        for e in range(8):
            f = root[e % 3] * (2 if e % 2 else 1)
            m = int(beat / 2 * SR); y = np.arange(m) / SR
            add(np.sin(2 * np.pi * f * y) * env(m, 0.003, 0.09), k * bar + e * beat / 2, 0.06)
# subida (ruido filtrado que crece) y golpe en el momento en que el video sale del teléfono
n = int(1.2 * SR); x = np.arange(n) / SR
noise = np.convolve(rng.standard_normal(n), np.ones(12) / 12, mode="same")
add(noise * (x / x[-1]) ** 2, RISE - 1.2, 0.25)
n = int(0.8 * SR); x = np.arange(n) / SR
add(np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-x * 20)) / SR) * env(n, 0.002, 0.3), RISE, 1.0)
fade = np.ones_like(t); tail = t > DUR - 1.5
fade[tail] = np.linspace(1, 0, tail.sum()); fade[t < 0.05] = t[t < 0.05] / 0.05
out = out * fade; out = out / np.max(np.abs(out)) * 0.8
w = wave.open("public/anuncio/musica.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes()); w.close()
print("ok", DUR, "s,", BPM, "BPM")
