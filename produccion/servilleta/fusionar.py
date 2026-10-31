"""Cifras dichas en palabras → números en los subtítulos («catorce» → «14», «dos mil veinticuatro» → «2024»)."""
import json
import sys

REEMPLAZOS = [(["dos", "mil", "veinticuatro"], "2024"), (["dos", "mil"], "2000"), (["catorce"], "14"), (["trece"], "13")]
p = sys.argv[1]
d = json.load(open(p))
w = d["words"]
out, i = [], 0
while i < len(w):
    hit = None
    for seq, txt in REEMPLAZOS:
        if [x["text"].lower().strip(".,:") for x in w[i : i + len(seq)]] == seq:
            hit = (len(seq), txt)
            break
    if hit:
        n, txt = hit
        last = w[i + n - 1]["text"]
        out.append({"text": txt + (last[-1] if last[-1] in ".,:" else ""), "start": w[i]["start"], "end": w[i + n - 1]["end"], "type": "word"})
        i += n
    else:
        out.append(w[i])
        i += 1
d["words"] = out
json.dump(d, open(p, "w"), ensure_ascii=False, indent=1)
print(len(w), "->", len(out))
