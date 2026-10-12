"""Nivel (dB) y tasa de cruces por cero cada 0,25 s de un WAV mono de 16 bits.

Uso: python3 -I envolvente_audio.py audio.wav
Las caídas por debajo de ~-26 dB entre tramos altos son pausas de la voz;
los saltos bruscos de nivel suelen ser golpes o transiciones.
"""

import math
import struct
import sys
import wave

w = wave.open(sys.argv[1])
sr, n = w.getframerate(), w.getnframes()
data = struct.unpack("<%dh" % n, w.readframes(n))
win = int(sr * 0.25)
for i in range(0, n - win, win):
    seg = data[i : i + win]
    rms = math.sqrt(sum(x * x for x in seg) / win)
    db = 20 * math.log10(rms / 32768 + 1e-9)
    zcr = sum(1 for a, b in zip(seg, seg[1:]) if (a < 0) != (b < 0)) / (win / sr)
    print(f"{i / sr:6.2f}s {db:6.1f}dB zcr={zcr:6.0f} " + "#" * max(0, int((db + 50) / 2)))
