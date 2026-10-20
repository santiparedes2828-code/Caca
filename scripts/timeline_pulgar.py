"""Línea de tiempo de lectura (sin voz) para el reel "¿Por qué se detuvo tu pulgar?" (guion-pulgar.md).

Escribe src/data/captions-pulgar.json con el mismo formato que las transcripciones (Caption de @remotion/captions)
e imprime el índice de la primera palabra de cada escena.
"""
import json

ESCENAS = [
    "Tu pulgar estaba a punto de pasar este video…",
    "¿por qué se detuvo?",
    "No fue suerte. Fue la edición.",
    "¿Y qué tiene esta edición que no tenga la tuya?",
    "Tres cosas.",
    "Uno: en el primer segundo pasa algo raro.",
    "Dos: lo que lees, lo ves. Si lees «fuego», arde.",
    "Y tres: la respuesta la guardo para el final. Por eso sigues aquí.",
    "Hacer esto en cada video te come horas.",
    "Así que tu pulgar no se detuvo por suerte: este video está editado para eso.",
    "Y en Hook House lo hacemos con los tuyos. Escríbeme HOOK por DM.",
]
# Pausa extra al final de algunas escenas: congelación del pulgar (2) y fuego (7)
EXTRA = {1: 0.35, 6: 0.5}
PAUSA = {",": 0.18, ":": 0.28, ".": 0.42, "?": 0.48, "…": 0.55, "»": 0.12}

caps, t = [], 0.25
for k, frase in enumerate(ESCENAS):
    print(k + 1, len(caps), frase)
    for palabra in frase.split():
        dur = 0.2 + 0.025 * len(palabra)
        caps.append({"text": palabra, "startMs": round(t * 1000), "endMs": round((t + dur) * 1000), "timestampMs": round((t + dur / 2) * 1000), "confidence": None})
        t += dur + 0.04 + PAUSA.get(palabra[-1], 0)
    t += 0.15 + EXTRA.get(k, 0)  # respiro entre escenas
json.dump(caps, open("src/data/captions-pulgar.json", "w"), ensure_ascii=False, indent=1)
print("palabras", len(caps), "fin", round(t, 2), "s")
