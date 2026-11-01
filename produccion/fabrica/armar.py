"""Fábrica viral · arma la voz y los subtítulos de cada variante a partir de produccion/<slug>/config.json.

Entrada (en produccion/<slug>/): ganchos.txt (un gancho por línea), cuerpo.txt, ganchos_<toma>.mp3, cuerpo_<toma>.mp3,
words_ganchos_<toma>.json y words_cuerpo_<toma>.json (salen de alinear_dp.py), config.json.
Salida: public/audio/voz_<slug>_<v>.wav y src/data/captions-<slug>-<v>.json (formato Caption de @remotion/captions).

Cada variante = su gancho + pausa corta [+ reloj real si es la variante de reto] + el cuerpo. Los silencios largos se
recortan por separado (cortar_silencios.py), la voz se acelera un poco (tempo) y las cifras dichas pasan a números.
Uso (desde la raíz del repo): python3 -I produccion/fabrica/armar.py <slug>
"""
import json
import subprocess
import sys
import wave

SLUG = sys.argv[1]
D = f"produccion/{SLUG}"
CFG = json.load(open(f"{D}/config.json", encoding="utf-8"))
TOMA = CFG.get("toma", "a")
TEMPO = float(CFG.get("tempo", 1.08))
PAUSA = float(CFG.get("pausa", 0.24))
RELOJ_V = int(CFG.get("reloj", {}).get("variante", 0))
RELOJ_S = float(CFG.get("reloj", {}).get("segundos", 2.0)) * TEMPO  # tras acelerar quedan los segundos pedidos
NUM = [(seq, txt) for seq, txt in CFG.get("numeros", [])]
CORTAR = ".claude/skills/copiar-estilo/scripts/cortar_silencios.py"
GANCHOS = [l.split() for l in open(f"{D}/ganchos.txt", encoding="utf-8").read().strip().split("\n") if l.strip()]


def sh(*a):
    subprocess.run(a, check=True, capture_output=True)


def recortar(src, words, base):
    json.dump({"words": words}, open(f"{D}/tmp_{base}.json", "w"), ensure_ascii=False)
    sh("python3", "-I", CORTAR, src, f"{D}/tmp_{base}.json", f"{D}/tmp_{base}.wav", f"{D}/tmp_{base}_caps.json", "--max", "0.26", "--pausa", "0.2")
    caps = json.load(open(f"{D}/tmp_{base}_caps.json"))
    with wave.open(f"{D}/tmp_{base}.wav") as w:
        dur = w.getnframes() / w.getframerate()
    return caps, dur


def fusionar(caps):
    out, i = [], 0
    while i < len(caps):
        hit = None
        for seq, txt in NUM:
            got = [c["text"].lower().strip(".,:…¿?¡!«»") for c in caps[i : i + len(seq)]]
            if got == seq:
                hit = (len(seq), txt)
                break
        if hit:
            n, txt = hit
            last = caps[i + n - 1]["text"]
            tail = last[-1] if last[-1] in ".,:…?" else ""
            out.append({**caps[i], "text": txt + tail, "endMs": caps[i + n - 1]["endMs"]})
            i += n
        else:
            out.append(caps[i])
            i += 1
    return out


gw = json.load(open(f"{D}/words_ganchos_{TOMA}.json"))["words"]
k = 0
hooks = []
QUITAR = {int(v): int(n) for v, n in CFG.get("quitar_final", {}).items()}  # {"1": 3} = sacar 3 palabras del final del gancho 1
for h, palabras in enumerate(GANCHOS):
    ws = gw[k : k + len(palabras)]
    k += len(palabras)
    if QUITAR.get(h + 1):
        ws = ws[: -QUITAR[h + 1]]  # se recorta sin regenerar la voz
    t0 = max(0, ws[0]["start"] - 0.05)
    t1 = ws[-1]["end"] + 0.12
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/ganchos_{TOMA}.mp3", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-ac", "1", "-ar", "44100", f"{D}/tmp_g{h + 1}_src.wav")
    rel = [{**w, "start": w["start"] - t0, "end": w["end"] - t0} for w in ws]
    hooks.append(recortar(f"{D}/tmp_g{h + 1}_src.wav", rel, f"g{h + 1}"))
    print("gancho", h + 1, " ".join(palabras), f"→ {hooks[-1][1]:.2f}s")

body = recortar(f"{D}/cuerpo_{TOMA}.mp3", json.load(open(f"{D}/words_cuerpo_{TOMA}.json"))["words"], "cuerpo")
print(f"cuerpo → {body[1]:.2f}s")

for v in range(1, len(GANCHOS) + 1):
    hcaps, hdur = hooks[v - 1]
    gap = PAUSA + (RELOJ_S if v == RELOJ_V else 0)
    off = hdur + gap
    caps = hcaps + [{**c, "startMs": c["startMs"] + off * 1000, "endMs": c["endMs"] + off * 1000, "timestampMs": c["timestampMs"] + off * 1000} for c in body[0]]
    caps = fusionar(caps)
    for c in caps:
        for key in ("startMs", "endMs", "timestampMs"):
            c[key] = round(c[key] / TEMPO)
    json.dump(caps, open(f"src/data/captions-{SLUG}-{v}.json", "w"), ensure_ascii=False, indent=1)
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/tmp_g{v}.wav", "-f", "lavfi", "-t", f"{gap:.3f}", "-i", "anullsrc=r=44100:cl=mono", "-i", f"{D}/tmp_cuerpo.wav",
       "-filter_complex", f"[0:a]aformat=sample_rates=44100:channel_layouts=mono[a];[1:a]aformat=sample_rates=44100:channel_layouts=mono[b];[2:a]aformat=sample_rates=44100:channel_layouts=mono[c];[a][b][c]concat=n=3:v=0:a=1,atempo={TEMPO}", f"public/audio/voz_{SLUG}_{v}.wav")
    print(f"variante {v}: {(off + body[1]) / TEMPO:.2f}s · {len(caps)} palabras · el cuerpo empieza en {off / TEMPO:.2f}s")

subprocess.run(f"rm -f {D}/tmp_*", shell=True)
