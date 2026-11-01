"""Fábrica viral · crea la carpeta de trabajo de una idea nueva con todas las plantillas.

Uso: python3 -I produccion/fabrica/nuevo.py <slug> "<idea tal como la escribió el usuario>"
Crea produccion/<slug>/ con: idea.md, investigacion.md, ganchos.md, guion.md, config.json, ganchos.txt, cuerpo.txt,
entrega.md (copias de .claude/skills/fabrica-viral/plantillas/) y una fila nueva en produccion/fabrica/historial.csv.
"""
import datetime
import os
import shutil
import sys

slug, idea = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""
D = f"produccion/{slug}"
P = ".claude/skills/fabrica-viral/plantillas"
os.makedirs(D, exist_ok=True)
hoy = datetime.date.today().isoformat()
for nombre in sorted(os.listdir(P)):
    dst = f"{D}/{nombre}"
    if os.path.exists(dst):
        continue
    txt = open(f"{P}/{nombre}", encoding="utf-8").read().replace("{{slug}}", slug).replace("{{fecha}}", hoy).replace("{{idea}}", idea)
    open(dst, "w", encoding="utf-8").write(txt)
for vacio in ("ganchos.txt", "cuerpo.txt"):
    open(f"{D}/{vacio}", "a").close()
h = "produccion/fabrica/historial.csv"
if not os.path.exists(h):
    shutil.copy(f"{P}/../historial.csv", h)
with open(h, "a", encoding="utf-8") as f:
    f.write(f"{hoy},{slug},,,,,,,,,\n")
print(f"listo: {D}/ (seguí el paso 1 de la skill fabrica-viral: investigacion.md)")
