# Kit para escribir diseños de piezas (piezas/NN/diseno.json) con entradas rápidas y movimiento continuo,
# pensado para retención: cada elemento entra con impulso (pop/slide), puede moverse y sale limpio.
import json

def _anim(base, t0, t1, enter="pop", mv=(), exit_="fade"):
    k = [dict(base, t=0, o=0)]
    s0 = {"pop": 0.4, "up": 1, "left": 1, "right": 1, "fade": 1, "zoom": 1.6, "none": 1}[enter]
    dx = {"left": -260, "right": 260}.get(enter, 0)
    dy = 120 if enter == "up" else 0
    if enter == "none":
        k = [dict(base, t=0, o=0), {"t": max(t0 - 0.01, 0), "o": 0}, {"t": t0, "o": 1}]
    else:
        k[0].update(s=s0, x=base.get("x", 540) + dx, y=base.get("y", 960) + dy)
        k.append({"t": max(t0, 0.001), "o": 0, "s": s0, "x": base.get("x", 540) + dx, "y": base.get("y", 960) + dy})
        k.append({"t": t0 + 0.14, "o": 1})
        if enter == "pop":
            k.append({"t": t0 + 0.18, "s": 1.1, "x": base.get("x", 540), "y": base.get("y", 960)})
            k.append({"t": t0 + 0.32, "s": base.get("s", 1)})
        else:
            k.append({"t": t0 + 0.3, "s": base.get("s", 1), "x": base.get("x", 540), "y": base.get("y", 960)})
    k += [dict(m) for m in mv]
    if t1 is not None:
        k.append({"t": t1 - 0.15, "o": 1})
        k.append({"t": t1, "o": 0, **({"s": 0.85} if exit_ == "shrink" else {})})
    k.sort(key=lambda p: p["t"])
    return k

def T(text, x, y, t0, t1=None, size=90, color="#111", w=960, weight=800, enter="pop", mv=(), z=5, rot=0, exit_="fade"):
    b = {"x": x, "y": y, "w": w, "rot": rot}
    return {"type": "text", "text": text, "size": size, "weight": weight, "color": color, "z": z, "kf": _anim(b, t0, t1, enter, mv, exit_)}

def S(x, y, w, h, t0, t1=None, color="#000", r=0, enter="pop", mv=(), z=2, rot=0, stroke=None, sw=6, grad=None, shadow=False, exit_="fade"):
    b = {"x": x, "y": y, "w": w, "h": h, "r": r, "rot": rot}
    e = {"type": "shape", "color": color, "z": z, "kf": _anim(b, t0, t1, enter, mv, exit_)}
    if stroke: e.update(stroke=stroke, sw=sw)
    if grad: e["grad"] = grad
    if shadow: e["shadow"] = True
    return e

def E(name, x, y, w, t0, t1=None, enter="pop", mv=(), z=4, rot=0, exit_="fade"):
    return {"type": "emoji", "name": name, "z": z, "kf": _anim({"x": x, "y": y, "w": w, "rot": rot}, t0, t1, enter, mv, exit_)}

def P(text, x, y, t0, t1=None, color="#111", fg="#fff", size=26, enter="pop", mv=(), z=6, rot=0):
    return {"type": "pill", "text": text, "size": size, "color": color, "stroke": fg, "z": z, "kf": _anim({"x": x, "y": y, "rot": rot}, t0, t1, enter, mv)}

def speed_lines(t0, t1, color="#FFFFFF", n=9, y0=520, y1=1180, z=1):
    out = []
    for i in range(n):
        y = y0 + (y1 - y0) * i / max(n - 1, 1)
        w = 180 + (i * 137) % 260
        d = 0.5 + (i * 0.13) % 0.35
        mv, t = [], t0 + (i * 0.07) % 0.4
        while t < t1:
            mv += [{"t": t, "x": 1300}, {"t": t + d - 0.01, "x": -250}, {"t": t + d, "x": 1300}]
            t += d
        out.append(S(1300, y, w, 8, t0, t1, color=color, r=4, enter="none", mv=mv, z=z))
    return out

def save(nn, d):
    json.dump(d, open(f"piezas/{nn}/diseno.json", "w"), ensure_ascii=False)
    print(nn, len(d["els"]), "elementos, fin", d["end"])
