"""Alinea la voz nueva con los tiempos de words.json del reel (los subtítulos y la cámara dependen de ellos).
Corta la voz en tramos que terminan en signo de puntuación y estira/comprime cada tramo para que ocupe
el mismo lugar que en words.json. Uso: python3 alinear.py"""
import json, subprocess
src = [w for w in json.load(open("voz_words.json"))["words"] if w["type"] == "word"]
tgt = json.load(open("src/words.json"))
assert len(src) == len(tgt), (len(src), len(tgt))
tramos, ini = [], 0
for i, w in enumerate(tgt):
    if w["w"][-1] in ".?:,…" or i == len(tgt) - 1:
        tramos.append((ini, i)); ini = i + 1
fil, lab, peor = [], [], 1.0
for k, (a, b) in enumerate(tramos):
    s0, s1 = src[a]["start"], src[b]["end"]
    t0, t1 = tgt[a]["s"], tgt[b]["e"]
    f = min(1.3, max(0.8, (s1 - s0) / max(0.05, t1 - t0)))
    peor = max(peor, f, 1 / f)
    fil.append(f"[0]atrim={max(0, s0 - 0.02):.3f}:{s1 + 0.04:.3f},asetpts=N/SR/TB,atempo={f:.3f},afade=t=out:st={(s1 - s0) / f:.3f}:d=0.03,adelay={int(t0 * 1000)}|{int(t0 * 1000)}[p{k}]")
    lab.append(f"[p{k}]")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(tramos)}:normalize=0,apad=whole_dur=35[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "35", "-ar", "48000", "voz_alineada.wav"], check=True)
print(len(tramos), "tramos; mayor cambio de velocidad: x%.2f" % peor)
