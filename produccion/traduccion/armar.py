"""Arma los clips del video «La traducción»: recorta silencios de punta, alinea el guion con la voz
(produccion/fabrica/alinear_dp.py) y escribe src/Traduccion/clips.json con la duración y los subtítulos de cada clip.
Uso: python3 -I produccion/traduccion/armar.py"""
import json
import re
import subprocess
import tempfile
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = json.load(open(os.path.join(RAIZ, "produccion/traduccion/clips.json"), encoding="utf-8"))
DATOS = open(os.path.join(RAIZ, "src/Traduccion/datos.ts"), encoding="utf-8").read()


def guion(nombre):
    bloque = re.search(r'nombre: "' + nombre + r'".*?guion: \[(.*?)\],', DATOS, re.S).group(1)
    return re.findall(r'"((?:[^"\\]|\\.)*)"', bloque)


def duracion(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True).stdout)


def voz(p):
    log = subprocess.run(["ffmpeg", "-i", p, "-af", "silencedetect=n=-35dB:d=0.3", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    total = duracion(p)
    ini = en[0] if st and st[0] <= 0.3 else 0.0
    fin = st[-1] if st and (len(en) < len(st) or en[-1] >= total - 0.05) else total
    return ini, fin, total


def trozos(palabras, frase):
    """Subtítulos de hasta 8 palabras, cortando preferentemente en signos de puntuación."""
    out, cur = [], []
    for w in palabras:
        cur.append(w)
        corte = re.search(r"[,.;:?!]$", w["text"]) and len(cur) >= 3
        if len(cur) >= 8 or corte:
            out.append(cur)
            cur = []
    if cur:
        if out and len(cur) <= 2:
            out[-1] += cur
        else:
            out.append(cur)
    return [{"texto": " ".join(w["text"] for w in c), "desde": c[0]["start"], "hasta": c[-1]["end"] + 0.15, "frase": frase} for c in out]


salida = {}
for nombre, clips in CFG.items():
    if nombre.startswith("_"):
        continue
    frases = guion(nombre)
    salida[nombre] = []
    for c in clips:
        # el análisis se hace sobre el original (sin normalizar: el ruido de fondo queda bajo y las pausas se ven)
        base = os.path.splitext(os.path.basename(c["archivo"]))[0]
        orig = [os.path.join(RAIZ, "produccion/traduccion/originales", base + e) for e in (".mov", ".mp4", ".MOV", ".MP4")]
        ruta = next((o for o in orig if os.path.exists(o)), os.path.join(RAIZ, "public", c["archivo"]))
        ini, fin, total = voz(ruta)
        desde = max(0.0, ini - 0.35)
        hasta = min(total, fin + 0.5)
        with tempfile.TemporaryDirectory() as tmp:
            wav, txt, js = (os.path.join(tmp, x) for x in ("a.wav", "t.txt", "w.json"))
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(desde), "-to", str(hasta), "-i", ruta, "-ac", "1", wav], check=True)
            subs = []
            # alinear todo el texto del clip junto y después repartir por frase
            texto = " ".join(frases[i] for i in c["frases"])
            open(txt, "w", encoding="utf-8").write(texto)
            subprocess.run(["python3", "-I", os.path.join(RAIZ, "produccion/fabrica/alinear_dp.py"), wav, txt, js], check=True)
            words = json.load(open(js, encoding="utf-8"))["words"]
            k = 0
            for i in c["frases"]:
                n = len(frases[i].split())
                subs += trozos(words[k : k + n], i)
                k += n
        salida[nombre].append({"archivo": c["archivo"], "frases": c["frases"], "recorteInicio": round(desde, 3), "segundos": round(hasta - desde, 3), "subtitulos": subs})
        print(f"{nombre}: {c['archivo']} · {desde:.2f}–{hasta:.2f}s · {len(subs)} subtítulos")

json.dump(salida, open(os.path.join(RAIZ, "src/Traduccion/clips.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
