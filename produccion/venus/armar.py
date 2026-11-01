"""Arma la voz y los subtítulos de las 5 variantes de «Un día en Venus».

Cada variante = su gancho (de ganchos_a.mp3) + pausa corta [+ 2 s de reloj en la variante 2] + el cuerpo (cuerpo_a.mp3).
Los silencios largos se recortan por separado (cortar_silencios.py) y las cifras dichas pasan a números en los subtítulos.
Uso (desde la raíz del repo): python3 -I produccion/contrato/armar.py
"""
import json
import subprocess
import wave

D = "produccion/venus"
CORTAR = ".claude/skills/copiar-estilo/scripts/cortar_silencios.py"
GANCHOS = [l.split() for l in open(f"{D}/ganchos.txt", encoding="utf-8").read().strip().split("\n")]
PAUSA = 0.24
RELOJ = 2.16  # variante 1: «Tenés dos segundos» + 2 s reales (después de acelerar)
TEMPO = 1.08  # voz un 8 % más rápida, mismo tono

NUM = [
    (["doscientos", "cuarenta", "y", "tres"], "243"),
    (["doscientos", "veinticinco"], "225"),
    (["cuatrocientos", "cincuenta"], "450"),
    (["dos", "segundos"], "2 segundos"),
]


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
            got = [c["text"].lower().strip(".,:…¿?") for c in caps[i : i + len(seq)]]
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


# 1) cortar cada gancho del audio de los ganchos
gw = json.load(open(f"{D}/words_ganchos_a.json"))["words"]
k = 0
hooks = []
for h, palabras in enumerate(GANCHOS):
    ws = gw[k : k + len(palabras)]
    k += len(palabras)
    t0 = max(0, ws[0]["start"] - 0.05)
    t1 = ws[-1]["end"] + 0.12
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/ganchos_a.mp3", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-ac", "1", "-ar", "44100", f"{D}/tmp_g{h + 1}_src.wav")
    rel = [{**w, "start": w["start"] - t0, "end": w["end"] - t0} for w in ws]
    hooks.append(recortar(f"{D}/tmp_g{h + 1}_src.wav", rel, f"g{h + 1}"))
    print("gancho", h + 1, " ".join(palabras), f"→ {hooks[-1][1]:.2f}s")

# 2) el cuerpo
body = recortar(f"{D}/cuerpo_a.mp3", json.load(open(f"{D}/words_cuerpo_a.json"))["words"], "cuerpo")
print(f"cuerpo → {body[1]:.2f}s")

# 3) unir por variante
for v in range(1, 6):
    hcaps, hdur = hooks[v - 1]
    gap = PAUSA + (RELOJ if v == 1 else 0)
    off = hdur + gap
    caps = hcaps + [{**c, "startMs": c["startMs"] + off * 1000, "endMs": c["endMs"] + off * 1000, "timestampMs": c["timestampMs"] + off * 1000} for c in body[0]]
    caps = fusionar(caps)
    for c in caps:
        for key in ("startMs", "endMs", "timestampMs"):
            c[key] = round(c[key] / TEMPO)
    json.dump(caps, open(f"src/data/captions-venus-{v}.json", "w"), ensure_ascii=False, indent=1)
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/tmp_g{v}.wav", "-f", "lavfi", "-t", f"{gap:.3f}", "-i", "anullsrc=r=44100:cl=mono", "-i", f"{D}/tmp_cuerpo.wav",
       "-filter_complex", f"[0:a]aformat=sample_rates=44100:channel_layouts=mono[a];[1:a]aformat=sample_rates=44100:channel_layouts=mono[b];[2:a]aformat=sample_rates=44100:channel_layouts=mono[c];[a][b][c]concat=n=3:v=0:a=1,atempo={TEMPO}", f"public/audio/voz_venus_{v}.wav")
    print(f"variante {v}: {(off + body[1]) / TEMPO:.2f}s · {len(caps)} palabras · gancho {hdur:.2f}s · el cuerpo empieza en {off:.2f}s")
