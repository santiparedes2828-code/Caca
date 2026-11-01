"""Fábrica viral · control de calidad automático de un video terminado.

Mide y resume (y guarda <video>.qa.json + <video>.cuadro0.png + <video>.hoja.png):
- movimiento: diferencia media entre cuadros separados 0,3 s (regla: ninguna ventana < 1,5);
- cuadros congelados (freezedetect, −60 dB, 0,3 s);
- sonoridad integrada (objetivo −14 LUFS ± 1) y pico verdadero (≤ −1 dBTP);
- nivel por tramos de 3 s (ningún tramo con voz por debajo de −24 dB RMS ni por encima de −10);
- duración (objetivo 25–35 s para datos curiosos);
- cuadro 0 y hoja de contactos para revisar a ojo (texto legible en el cuadro 0, nada tapado por la interfaz).
Uso: python3 -I produccion/fabrica/qa.py out/<slug>/<slug>.mp4
"""
import json
import re
import subprocess
import sys

import numpy as np

V = sys.argv[1]
base = V.rsplit(".", 1)[0]
here = __file__.rsplit("/", 1)[0]


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


dur = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", V).stdout.strip())
mov = run("python3", "-I", f"{here}/movimiento.py", V, "1.5").stdout
m = re.search(r"mín ([\d.]+) · p5 ([\d.]+) · mediana ([\d.]+)", mov)
bajo = re.search(r"tramos por debajo de 1.5: (\d+)", mov)
frz = run("ffmpeg", "-hide_banner", "-i", V, "-vf", "freezedetect=n=-60dB:d=0.3", "-map", "0:v", "-f", "null", "-").stderr.count("freeze_start")
eb = run("ffmpeg", "-hide_banner", "-i", V, "-af", "ebur128=peak=true", "-f", "null", "-").stderr
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)[-1])
peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", eb)[-1])
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", V, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(float) / 32768
tramos = []
for a in range(0, int(dur - 1.5), 3):
    seg = x[a * 8000 : (a + 3) * 8000]
    tramos.append(round(20 * np.log10(np.sqrt((seg**2).mean()) + 1e-9), 1))
run("ffmpeg", "-y", "-loglevel", "error", "-i", V, "-frames:v", "1", "-vf", "scale=540:-1", f"{base}.cuadro0.png")
run("ffmpeg", "-y", "-loglevel", "error", "-i", V, "-vf", "fps=1,scale=180:-1,tile=12x3", "-frames:v", "1", f"{base}.hoja.png")

checks = {
    "movimiento (mín ≥ 1,5 cada 0,3 s)": (m is not None and float(m.group(1)) >= 1.5 and bajo is not None and bajo.group(1) == "0", f"mín {m.group(1) if m else '?'} · mediana {m.group(3) if m else '?'}"),
    "sin cuadros congelados": (frz == 0, f"{frz} congelados"),
    "sonoridad −14 LUFS ± 1": (abs(lufs + 14) <= 1, f"{lufs} LUFS"),
    "pico ≤ −1 dBTP": (peak <= -1.0, f"{peak} dBTP"),
    "tramos entre −24 y −10 dB": (all(-24 <= t <= -10 for t in tramos[:-1]), " ".join(str(t) for t in tramos)),
    "duración 20–40 s": (20 <= dur <= 40, f"{dur:.1f} s"),
}
ok = all(v[0] for v in checks.values())
for k, (passed, det) in checks.items():
    print(f"{'✔' if passed else '✘'} {k}: {det}")
print("REVISAR A OJO:", f"{base}.cuadro0.png (texto legible en el cuadro 0) y {base}.hoja.png (nada tapado, una idea por escena)")
print("RESULTADO:", "PASA" if ok else "NO PASA")
json.dump({"ok": ok, "duracion": dur, "lufs": lufs, "pico": peak, "congelados": frz, "tramos": tramos, "movimiento": mov.strip().splitlines()[-2:] if mov else []}, open(f"{base}.qa.json", "w"), ensure_ascii=False, indent=1)
sys.exit(0 if ok else 1)
