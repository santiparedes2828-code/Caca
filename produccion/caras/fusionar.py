"""Une las cifras dichas en palabras en un solo subtítulo («treinta y ocho por ciento» → «38 %»)."""
import json
import sys

REEMPLAZOS = [(["treinta", "y", "ocho", "por", "ciento"], "38 %"), (["un", "millón", "cien", "mil"], "1,1 millones")]
p = sys.argv[1]
d = json.load(open(p))
w = d["words"]
out, i = [], 0
while i < len(w):
    hit = None
    for seq, txt in REEMPLAZOS:
        if [x["text"].lower().strip(".,") for x in w[i : i + len(seq)]] == seq:
            hit = (len(seq), txt)
            break
    if hit:
        n, txt = hit
        out.append({"text": txt + ("." if w[i + n - 1]["text"].endswith(".") else ""), "start": w[i]["start"], "end": w[i + n - 1]["end"], "type": "word"})
        i += n
    else:
        out.append(w[i])
        i += 1
d["words"] = out
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
print(len(w), "->", len(out), "palabras")
