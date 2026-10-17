# Re-renderiza los fragmentos del reel de portfolio desde las piezas originales, sin voz, sin música y sin
# subtítulos (el reel no lleva voz en off). Uso: python3 portfolio/fragmentos.py
import json, subprocess, sys
ARGS = sys.argv[1:]
CFG = ARGS.pop(ARGS.index("--reel") + 1) if "--reel" in ARGS else "portfolio/reel.json"
ARGS = [a for a in ARGS if a != "--reel"]
SOLO = ARGS  # opcional: ids a re-renderizar
DATA = json.load(open(CFG))
SEL = DATA["fragmentos"]
OUT = DATA.get("salida", "public/portfolio")
for f in SEL:
    if SOLO and f.get("id", f["pieza"]) not in SOLO:
        continue
    p = json.load(open(f"piezas/{f['pieza']}/props.json"))
    p.pop("voice", None); p.pop("music", None)
    p["capStyle"] = "none"; p["sfx"] = []
    tmp = f"analisis-piezas/portfolio_{f.get('id', f['pieza'])}.json"
    json.dump(p, open(tmp, "w"))
    a, b = round(f["desde"] * 30), round(f["desde"] * 30) + round(f["dur"] * 30) + 12  # 12 fotogramas de margen para la transición
    out = f"{OUT}/{f.get('id', f['pieza'])}.mp4"
    subprocess.run(["npx", "remotion", "render", "Pieza", out, f"--props={tmp}", f"--frames={a}-{b - 1}", "--concurrency=4", "--log=error", "--muted"], check=True)
    print("ok", out)
