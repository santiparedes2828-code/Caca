# Muestra los tiempos de lectura de un guion (mismo cálculo que armar.ts --sin-voz). Uso: python3 piezas/tiempos.py 01
import re, sys
w = open(f"piezas/{sys.argv[1]}/guion.txt").read().split()
t = 0.4; out = []
for x in w:
    d = (0.22 + min(0.25, len(x) * 0.022)) * 1.4
    out.append(f"{x}@{t:.1f}")
    t += d + (0.7 if re.search(r"[.?!]$", x) else 0.25 if re.search(r"[,:]$", x) else 0.05)
print(" ".join(out)); print(f"fin {t:.1f}")
