# Re-temporiza un diseño hecho a ritmo de lectura (armar.ts --sin-voz) a los tiempos reales de la voz.
# Uso: python3 piezas/retemporizar.py 08   (lee piezas/NN/props.json ya armado con voz)
import json, re, sys
from bisect import bisect_right
i = sys.argv[1]
w = open(f"piezas/{i}/guion.txt").read().split()
t, old = 0.4, []
for x in w:
    d = (0.22 + min(0.25, len(x) * 0.022)) * 1.4
    old.append(t)
    t += d + (0.7 if re.search(r"[.?!]$", x) else 0.25 if re.search(r"[,:]$", x) else 0.05)
new = [x["start"] for x in json.load(open(f"piezas/{i}/props.json"))["words"]]
oe, ne = old[-1] + 0.6, new[-1] + 0.6
def m(v):
    if v >= oe: return round(ne + (v - oe), 2)
    k = bisect_right(old, v) - 1
    if k < 0: return round(v * new[0] / old[0] if old[0] else v, 2)
    a, b = old[k], old[k + 1] if k + 1 < len(old) else oe
    na, nb = new[k], new[k + 1] if k + 1 < len(new) else ne
    return round(na + (v - a) / (b - a) * (nb - na), 2)
p = f"piezas/{i}/diseno.json"
d = json.load(open(p))
for e in d["els"]:
    for k in e["kf"]:
        if k["t"] > 0: k["t"] = m(k["t"])
for s in d["scenes"]: s["start"] = m(s["start"]) if s["start"] > 0 else 0
for s in d.get("sfx", []): s["t"] = m(s["t"])
d["end"] = m(d["end"])
json.dump(d, open(p, "w"), ensure_ascii=False)
print("end", d["end"], "escenas", [s["start"] for s in d["scenes"]])
