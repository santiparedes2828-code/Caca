"""Recorta los silencios largos de un audio o vídeo y reajusta los tiempos de cada palabra.

Uso:
  python3 -I cortar_silencios.py <entrada> <words.json> <salida_media> [<salida_captions.json>]
         [--max 0.3] [--pausa 0.24] [--umbral -40] [--lufs -14.5]

- <entrada>: .mp3/.wav (locución) o .mp4/.mov (tu grabación). Si tiene vídeo, se corta imagen y sonido a la vez.
- <words.json>: {"words": [{"text", "start", "end", "type"?}]} (ElevenLabs Scribe o transcribir.py).
- Silencios de más de --max segundos se dejan en --pausa (la mitad a cada lado del corte).
  El silencio inicial se elimina entero: la primera palabra cae en el frame 0.
- El audio se comprime y normaliza para que el render final quede en --lufs (TikTok: ~-14 LUFS).
  Si la entrada es mono, se normaliza 3 dB por debajo porque Remotion la duplica en estéreo.
- <salida_captions.json> (por defecto src/data/captions.json): array del tipo Caption de @remotion/captions.
"""

import argparse
import json
import re
import subprocess

p = argparse.ArgumentParser()
p.add_argument("entrada")
p.add_argument("words")
p.add_argument("salida")
p.add_argument("captions", nargs="?", default="src/data/captions.json")
p.add_argument("--max", type=float, default=0.3)
p.add_argument("--pausa", type=float, default=0.24)
p.add_argument("--umbral", type=float, default=-40)
p.add_argument("--lufs", type=float, default=-14.5)
a = p.parse_args()


def probe(entries):
    return subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", entries, "-of", "default=nw=1:nk=1", a.entrada],
        capture_output=True, text=True,
    ).stdout.split()


total = float(probe("format=duration")[0])
has_video = "video" in probe("stream=codec_type")
channels = int((subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels",
     "-of", "default=nw=1:nk=1", a.entrada], capture_output=True, text=True).stdout.strip() or "1"))

log = subprocess.run(
    ["ffmpeg", "-i", a.entrada, "-af", f"silencedetect=n={a.umbral}dB:d={a.max}", "-f", "null", "-"],
    capture_output=True, text=True,
).stderr
starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]

cortes = []
for s, e in zip(starts, ends):
    if s <= 0.01:
        cortes.append((0.0, max(0.0, e - 0.03)))
    else:
        cortes.append((s + a.pausa / 2, e - a.pausa / 2))

keep, t = [], 0.0
for x, y in cortes:
    if x > t:
        keep.append((t, x))
    t = y
if total > t:
    keep.append((t, total))


def remap(x):
    """Tiempo original -> tiempo en el medio recortado."""
    out = 0.0
    for k0, k1 in keep:
        if x <= k0:
            return out
        if x <= k1:
            return out + (x - k0)
        out += k1 - k0
    return out


lufs = a.lufs - 3 if channels == 1 else a.lufs
n = len(keep)
filtro = "".join(f"[0:a]atrim={x:.3f}:{y:.3f},asetpts=PTS-STARTPTS[a{i}];" for i, (x, y) in enumerate(keep))
if has_video:
    filtro += "".join(f"[0:v]trim={x:.3f}:{y:.3f},setpts=PTS-STARTPTS[v{i}];" for i, (x, y) in enumerate(keep))
    filtro += "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[vout][acat];"
else:
    filtro += "".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[acat];"
# Volumen alto y comprimido (estilo de los vídeos virales)
filtro += f"[acat]acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I={lufs}:TP=-2.0:LRA=7[aout]"

cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.entrada, "-filter_complex", filtro]
if has_video:
    cmd += ["-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "aac", "-b:a", "256k"]
else:
    cmd += ["-map", "[aout]"]
cmd += ["-ar", "48000", a.salida]
subprocess.run(cmd, check=True)

words = [w for w in json.load(open(a.words))["words"] if w.get("type", "word") == "word"]
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
json.dump(captions, open(a.captions, "w"), ensure_ascii=False, indent=1)

nuevo = sum(y - x for x, y in keep)
print(f"Silencios recortados: {len(cortes)} · {total:.2f}s -> {nuevo:.2f}s · {len(captions)} palabras · "
      f"{'vídeo' if has_video else 'audio'} -> {a.salida} · captions -> {a.captions}")
