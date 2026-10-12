"""Recorta los silencios largos de la locución y genera los subtítulos palabra a palabra.

Uso: python3 scripts/procesar_voz.py public/audio/voz_b.mp3 analisis/words_b.json

- Detecta silencios con ffmpeg (silencedetect, -40 dB).
- Todo silencio de más de MAX_SILENCIO se reduce a PAUSA (se conserva la mitad a cada lado).
- Comprime y normaliza la voz a -17,5 LUFS (mono: al pasar a estéreo suma +3 dB → ~-14,5 LUFS).
- Escribe public/audio/voz.wav y src/data/captions.json (tipo Caption de @remotion/captions)
  con los tiempos de cada palabra ya reajustados al audio recortado.
"""

import json
import re
import subprocess
import sys

MAX_SILENCIO = 0.3  # s — silencios más largos que esto se recortan (paso 3)
PAUSA = 0.24  # s — duración con la que se quedan
UMBRAL_DB = -40

audio, words_path = sys.argv[1], sys.argv[2]

log = subprocess.run(
    ["ffmpeg", "-i", audio, "-af", f"silencedetect=n={UMBRAL_DB}dB:d={MAX_SILENCIO}", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
total = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", log).group(3)) + 60 * int(
    re.search(r"Duration: (\d+):(\d+)", log).group(2)
)

# Tramos a eliminar: el centro de cada silencio, dejando PAUSA/2 a cada lado.
# El silencio inicial se elimina entero (primera palabra en el frame 0, estilo.md §8).
cortes = []
for s, e in zip(starts, ends):
    if s <= 0.01:
        cortes.append((0.0, max(0.0, e - 0.03)))
    else:
        cortes.append((s + PAUSA / 2, e - PAUSA / 2))

keep, t = [], 0.0
for a, b in cortes:
    if a > t:
        keep.append((t, a))
    t = b
keep.append((t, total))


def remap(x):
    """Tiempo original -> tiempo en el audio recortado."""
    out = 0.0
    for a, b in keep:
        if x <= a:
            return out
        if x <= b:
            return out + (x - a)
        out += b - a
    return out


filtro = "".join(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS[s{i}];" for i, (a, b) in enumerate(keep))
filtro += "".join(f"[s{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1,"
# Volumen alto y comprimido como la referencia (estilo.md §8); en el render estéreo queda en ~-14 LUFS
filtro += "acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-17.5:TP=-2.0:LRA=7[out]"
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-i", audio, "-filter_complex", filtro, "-map", "[out]",
     "-ar", "48000", "public/audio/voz.wav"],
    check=True,
)

words = [w for w in json.load(open(words_path))["words"] if w.get("type", "word") == "word"]
captions = [
    {
        "text": w["text"],
        "startMs": round(remap(w["start"]) * 1000),
        "endMs": round(remap(w["end"]) * 1000),
        "timestampMs": round(remap((w["start"] + w["end"]) / 2) * 1000),
        "confidence": None,
    }
    for w in words
]
json.dump(captions, open("src/data/captions.json", "w"), ensure_ascii=False, indent=1)

nuevo = sum(b - a for a, b in keep)
print(f"Silencios recortados: {len(cortes)} · {total:.2f}s -> {nuevo:.2f}s · {len(captions)} palabras")
