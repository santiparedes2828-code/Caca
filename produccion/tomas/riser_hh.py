# Riser propio de Hook House: barrido de tono (90 → 1020 Hz) + ruido filtrado que sube (400 → 6400 Hz) + trémolo
# que se acelera, con una capa de nuestro sonido de tensión al inicio y a mitad (identidad). Termina seco, sin cola.
import sys, wave, numpy as np, subprocess
T = float(sys.argv[1]) if len(sys.argv) > 1 else 5.75
out = sys.argv[2] if len(sys.argv) > 2 else "public/sfx/hh/riser_hh.wav"
sr = 48000; n = int(T * sr); t = np.arange(n) / sr; p = t / T
rng = np.random.default_rng(7)
# tono: diente de sierra suave que sube 3,5 octavas
f = 90 * 2 ** (3.5 * p); ph = 2 * np.pi * np.cumsum(f) / sr
tone = sum(np.sin(k * ph) / k for k in range(1, 7)) * (0.12 + 0.88 * p ** 2)
# ruido con banda que sube
noise = rng.standard_normal(n); N = 2048; H = 512; win = np.hanning(N); acc = np.zeros(n + N); wsum = np.zeros(n + N)
freqs = np.fft.rfftfreq(N, 1 / sr)
for s in range(0, n, H):
    seg = noise[s:s + N]
    if len(seg) < N: seg = np.pad(seg, (0, N - len(seg)))
    pc = min(1, s / n); fc = 400 * 2 ** (4 * pc)
    g = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / fc) / 0.6) ** 2)
    acc[s:s + N] += np.fft.irfft(np.fft.rfft(seg * win) * g) * win; wsum[s:s + N] += win ** 2
nz = acc[:n] / np.maximum(wsum[:n], 1e-6); nz /= np.max(np.abs(nz)) + 1e-9
nz *= 0.08 + 0.92 * p ** 2.5
# trémolo que se acelera (4 → 18 Hz)
rate = 4 + 14 * p; trem = 1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / sr))
mix = (0.55 * tone / np.max(np.abs(tone)) + 0.6 * nz) * trem
# capa de identidad: tensión.wav al inicio y una octava y media más aguda a mitad
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "public/sfx/hh/tension.wav", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
tens = np.frombuffer(raw, dtype=np.float32).astype(float)
if "--sin-tension" not in sys.argv: mix[: len(tens)] += 0.5 * tens[: n]
raw2 = subprocess.run(["ffmpeg", "-v", "error", "-i", "public/sfx/hh/tension.wav", "-af", f"asetrate={int(sr*1.5)},aresample={sr}", "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
t2 = np.frombuffer(raw2, dtype=np.float32).astype(float); a = int(n * 0.55)
if "--sin-tension" not in sys.argv: mix[a:a + len(t2)] += 0.6 * t2[: max(0, n - a)]
mix *= 10 ** (-3 / 20) / np.max(np.abs(mix))
fade = int(0.008 * sr); mix[-fade:] *= np.linspace(1, 0, fade)
st = np.stack([mix, mix], axis=1)
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print("ok", out, T)
