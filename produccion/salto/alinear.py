"""Tiempos por palabra sin transcriptor: el texto es conocido y la toma se parte en frases por sus silencios.

Uso: python3 -I alinear.py <audio> <salida_words.json> [<texto.txt>]  (frases separadas por «|»)
Cada frase del guion (separada por la puntuación que la voz respeta) se asigna, en orden, a un tramo de voz entre
silencios (silencedetect −35 dB, ≥ 0,15 s). Dentro del tramo, cada palabra dura en proporción a sus sílabas
(grupos de vocales) + una base fija. Si el número de tramos no coincide con el de frases, se aborta.
Salida en el formato de Scribe ({"words": [{text, start, end, type}]}) para cortar_silencios.py.
"""

import json
import re
import subprocess
import sys

TEXT = (
    "Ese salto que das justo cuando te estás durmiendo… | es tu cerebro intentando salvarte. | Y no, | "
    "no es una pesadilla: | se llama mioclonía hípnica. | Al dormirte, tus músculos se aflojan de golpe. | "
    "Pero tu cerebro sigue medio despierto, | y lee esa flojera como una caída. | "
    "Así que tensa todo el cuerpo para agarrarte, | y el corazón se te acelera. | "
    "Es la explicación más conocida… | aunque todavía no está probada. | Pero esta noche, | lo vas a notar."
)

audio, out = sys.argv[1], sys.argv[2]
if len(sys.argv) > 3:
    TEXT = open(sys.argv[3], encoding="utf-8").read()
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio],
                             capture_output=True, text=True).stdout)
log = subprocess.run(["ffmpeg", "-i", audio, "-af", "silencedetect=n=-35dB:d=0.15", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]

# Tramos de voz = huecos entre silencios (el silencio final, si lo hay, cierra el último tramo)
spans, t = [], 0.03
for s, e in zip(starts, ends):
    if s > t + 0.05:
        spans.append((t, s))
    t = e
if t < total - 0.05:
    spans.append((t, total))

phrases = [p.strip().split() for p in TEXT.split("|")]
if len(spans) != len(phrases):
    sys.exit(f"{len(spans)} tramos de voz para {len(phrases)} frases: revisar umbrales")


def weight(w):
    if "M&M" in w:
        return 0.6 + 3  # se dice «emendems»
    return 0.6 + len(re.findall(r"[aeiouáéíóúü]+", w.lower()))


words = []
for (a, b), ws in zip(spans, phrases):
    tot = sum(weight(w) for w in ws)
    x = a
    for w in ws:
        d = (b - a) * weight(w) / tot
        words.append({"text": w, "start": round(x, 3), "end": round(x + d - 0.02, 3), "type": "word"})
        x += d

json.dump({"words": words}, open(out, "w"), ensure_ascii=False, indent=1)
print(f"{len(words)} palabras en {len(spans)} tramos · {total:.2f} s")
