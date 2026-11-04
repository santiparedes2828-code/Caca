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
    """Subtítulos de hasta 8 palabras: nunca cruzan una oración; dentro de ella cortan en comas."""
    oraciones, cur = [], []
    for w in palabras:
        cur.append(w)
        if re.search(r"[.?!]$", w["text"]):
            oraciones.append(cur)
            cur = []
    if cur:
        oraciones.append(cur)
    out = []
    for o in oraciones:
        partes, cur = [], []
        for w in o:
            cur.append(w)
            if len(cur) >= 8 or (re.search(r"[,;:]$", w["text"]) and len(cur) >= 3):
                partes.append(cur)
                cur = []
        if cur:
            if partes and len(cur) <= 2:
                partes[-1] += cur
            else:
                partes.append(cur)
        out += partes
    return [{"texto": " ".join(w["text"] for w in c), "desde": c[0]["start"], "hasta": c[-1]["end"] + 0.15, "frase": frase} for c in out]


def norm(w):
    return re.sub(r"[^a-záéíóúñü]", "", w.lower())


def con_transcripcion(texto, trans, desde, hasta):
    """Tiempos por palabra tomados de la transcripción (Whisper): empareja el texto corregido con lo transcripto
    y a las palabras sin pareja les reparte el hueco entre vecinas."""
    import difflib
    ws = texto.split()
    tr = [dict(t) for t in trans if t["s"] < hasta - 0.05]
    # palabra dudosa seguida de un silencio largo (típico al arrancar): pegarla a la siguiente
    for a, b in zip(tr, tr[1:]):
        if a.get("p", 1) < 0.3 and b["s"] - a["s"] > 0.6:
            a["s"] = b["s"] - 0.25
            a["e"] = b["s"] - 0.02
    sm = difflib.SequenceMatcher(a=[norm(w) for w in ws], b=[norm(t["w"]) for t in tr], autojunk=False)
    t0 = [None] * len(ws)
    t1 = [None] * len(ws)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            t0[a + k] = tr[b + k]["s"]
            t1[a + k] = tr[b + k]["e"]
    # anclas en los bordes
    if t0[0] is None:
        t0[0] = tr[0]["s"] if tr else desde
    if t1[-1] is None:
        t1[-1] = min(hasta, tr[-1]["e"]) if tr else hasta
    i = 0
    while i < len(ws):
        if t0[i] is not None and t1[i] is not None:
            i += 1
            continue
        j = i
        while j < len(ws) and (t0[j] is None or t1[j] is None):
            j += 1
        ini = t1[i - 1] if i > 0 and t1[i - 1] is not None else t0[i]
        fin = t0[j] if j < len(ws) else t1[-1]
        if ini is None:
            ini = desde
        paso = (fin - ini) / max(1, j - i)
        for k in range(i, j):
            if t0[k] is None:
                t0[k] = ini + paso * (k - i)
            if t1[k] is None:
                t1[k] = ini + paso * (k - i + 1)
        i = j
    return [{"text": w, "start": round(a - desde, 3), "end": round(min(b, hasta) - desde, 3)} for w, a, b in zip(ws, t0, t1)]


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
        if "hasta" in c:
            fin = min(fin, c["hasta"])
        hasta = min(total, c.get("hasta", fin + 0.5))
        with tempfile.TemporaryDirectory() as tmp:
            wav, txt, js = (os.path.join(tmp, x) for x in ("a.wav", "t.txt", "w.json"))
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(desde), "-to", str(hasta), "-i", ruta, "-ac", "1", wav], check=True)
            subs = []
            # alinear todo el texto del clip junto y después repartir por frase
            dichas = c.get("texto") or [frases[i] for i in c["frases"]]
            texto = " ".join(dichas)
            tjson = os.path.join(RAIZ, "produccion/traduccion/transcripciones", base + ".json")
            if os.path.exists(tjson):
                words = con_transcripcion(texto, json.load(open(tjson, encoding="utf-8")), desde, hasta)
            else:
                open(txt, "w", encoding="utf-8").write(texto)
                subprocess.run(["python3", "-I", os.path.join(RAIZ, "produccion/fabrica/alinear_dp.py"), wav, txt, js], check=True)
                words = json.load(open(js, encoding="utf-8"))["words"]
            k = 0
            for i, dicha in zip(c["frases"], dichas):
                n = len(dicha.split())
                subs += trozos(words[k : k + n], i)
                k += n
        for a, b in zip(subs, subs[1:]):
            a["hasta"] = round(min(a["hasta"], b["desde"]), 3)
        salida[nombre].append({"archivo": c["archivo"], "frases": c["frases"], "recorteInicio": round(desde, 3), "segundos": round(hasta - desde, 3), "subtitulos": subs})
        print(f"{nombre}: {c['archivo']} · {desde:.2f}–{hasta:.2f}s · {len(subs)} subtítulos")

json.dump(salida, open(os.path.join(RAIZ, "src/Traduccion/clips.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
