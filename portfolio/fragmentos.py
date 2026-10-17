# Re-renderiza los fragmentos del reel de portfolio desde las piezas originales, sin voz, sin música y sin
# subtítulos (el reel no lleva voz en off). Uso: python3 portfolio/fragmentos.py
import json, subprocess
SEL = json.load(open("portfolio/reel.json"))["fragmentos"]
for f in SEL:
    p = json.load(open(f"piezas/{f['pieza']}/props.json"))
    p.pop("voice", None); p.pop("music", None)
    p["capStyle"] = "none"; p["sfx"] = []
    tmp = f"analisis-piezas/portfolio_{f['pieza']}.json"
    json.dump(p, open(tmp, "w"))
    a, b = round(f["desde"] * 30), round(f["desde"] * 30) + round(f["dur"] * 30) + 12  # 12 fotogramas de margen para la transición
    out = f"public/portfolio/{f['pieza']}.mp4"
    subprocess.run(["npx", "remotion", "render", "Pieza", out, f"--props={tmp}", f"--frames={a}-{b - 1}", "--concurrency=4", "--log=error", "--muted"], check=True)
    print("ok", out)
