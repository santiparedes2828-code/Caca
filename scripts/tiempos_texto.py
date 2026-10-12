"""Genera tiempos por palabra para un vídeo SIN locución (ritmo de lectura) en formato Caption.

Uso: python3 -I scripts/tiempos_texto.py "<texto>" src/data/captions-X.json
Cada palabra dura 0,13 s + 0,036 s por letra; pausa extra tras coma (0,14 s), punto o
interrogación (0,36 s) y puntos suspensivos (0,5 s). Si luego hay voz, sustituir por su transcripción.
"""
import json
import re
import sys

texto, salida = sys.argv[1], sys.argv[2]
t = 0.25
caps = []
for w in texto.split():
    dur = 0.13 + 0.036 * len(re.sub(r"[^\wáéíóúñü]", "", w, flags=re.I))
    caps.append({"text": w, "startMs": round(t * 1000), "endMs": round((t + dur) * 1000),
                 "timestampMs": round((t + dur / 2) * 1000), "confidence": None})
    t += dur + 0.03
    if w.endswith("…"):
        t += 0.5
    elif w[-1] in ".?!":
        t += 0.36
    elif w[-1] in ",:":
        t += 0.14
json.dump(caps, open(salida, "w"), ensure_ascii=False, indent=1)
print(f"{len(caps)} palabras · {t:.2f} s")
