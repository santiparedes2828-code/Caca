"""Tiempos por palabra sin transcriptor, más robusto que alinear.py: corta el texto en todos los signos de puntuación y
reparte esos trozos entre los tramos de voz (silencios de ≥ 0,15 s) con programación dinámica, para que la duración de
cada tramo se parezca a la de sus sílabas. Dentro de cada tramo, cada palabra dura en proporción a sus sílabas.
Uso: python3 -I alinear_dp.py <audio> <texto.txt> <salida_words.json>
"""
import json
import re
import subprocess
import sys

audio, txt, out = sys.argv[1:4]
text = open(txt, encoding="utf-8").read().strip()
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio], capture_output=True, text=True).stdout)
log = subprocess.run(["ffmpeg", "-i", audio, "-af", "silencedetect=n=-35dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
spans, t = [], 0.03
for s, e in zip(starts, ends):
    if s > t + 0.05:
        spans.append((t, s))
    t = e
if t < total - 0.1:
    spans.append((t, total))
# trozos = palabras; cortar entre palabras sin signo se penaliza (la voz a veces respira donde no hay coma)
words = text.split()
chunks = [[w] for w in words]
syl = lambda w: 0.6 + max(1, len(re.findall(r"[aeiouáéíóúü]+", w.lower())))
cs = [syl(w) for w in words]
punct = [bool(re.search(r"[.,:;…?!]$", w)) for w in words]
n, m = len(chunks), len(spans)
if n < m:
    sys.exit(f"{m} tramos para {n} palabras")
rate = sum(b - a for a, b in spans) / sum(cs)
INF = float("inf")
dp = [[INF] * (m + 1) for _ in range(n + 1)]
back = [[0] * (m + 1) for _ in range(n + 1)]
dp[0][0] = 0
pre = [0]
for c in cs:
    pre.append(pre[-1] + c)
for j in range(1, m + 1):
    d = spans[j - 1][1] - spans[j - 1][0]
    for i in range(j, n - (m - j) + 1):
        pen = 0 if (i == n or punct[i - 1]) else 0.6
        for k in range(j - 1, i):
            if dp[k][j - 1] == INF:
                continue
            c = dp[k][j - 1] + ((d - rate * (pre[i] - pre[k])) / max(d, 0.3)) ** 2 + pen
            if c < dp[i][j]:
                dp[i][j] = c
                back[i][j] = k
groups, i = [], n
for j in range(m, 0, -1):
    k = back[i][j]
    groups.append((k, i))
    i = k
groups.reverse()
res = []
for (a, b), (k, i) in zip(spans, groups):
    ws = [w for c in chunks[k:i] for w in c]
    tot = sum(syl(w) for w in ws)
    x = a
    for w in ws:
        d = (b - a) * syl(w) / tot
        res.append({"text": w, "start": round(x, 3), "end": round(x + d - 0.02, 3), "type": "word"})
        x += d
    print(f"{a:6.2f}-{b:6.2f}  {' '.join(ws)}")
json.dump({"words": res}, open(out, "w"), ensure_ascii=False, indent=1)
print(f"{len(res)} palabras · {m} tramos · {n} trozos · error {dp[n][m]:.2f}")
