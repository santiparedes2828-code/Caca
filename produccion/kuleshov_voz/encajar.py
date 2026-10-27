import subprocess, sys
# (inicio voz, fin voz, aparece en pantalla, siguiente frase en pantalla)
F = [(0.0, 1.68, 0.0, 1.8), (1.92, 3.6, 1.8, 3.4), (3.92, 7.52, 3.4, 7.0), (7.92, 9.08, 7.0, 8.2),
     (9.36, 15.2, 8.2, 14.0), (15.24, 17.4, 14.0, 16.0), (17.6, 20.32, 16.0, 18.4), (20.36, 21.84, 18.4, 20.2),
     (22.32, 25.72, 20.2, 23.8), (26.0, 28.88, 23.8, 26.6), (29.12, 32.64, 26.6, 30.2), (32.88, 34.8, 30.2, 32.2),
     (35.2, 38.36, 32.2, 35.4), (38.56, 43.36, 35.4, 40.0), (43.6, 46.12, 40.0, 42.4), (46.4, 48.8, 42.4, 44.8),
     (49.04, 53.36, 44.8, 49.7)]
ins, fil, lab = [], [], []
for i, (a, b, c, d) in enumerate(F):
    dur = b - a + 0.06
    f = max(1.0, dur / (d - c - 0.04))
    fil.append(f"[0]atrim={max(0,a-0.03):.2f}:{b+0.06:.2f},asetpts=N/SR/TB,atempo={f:.3f},adelay={int(c*1000)}|{int(c*1000)}[p{i}]")
    lab.append(f"[p{i}]")
    print(f"frase {i+1}: aparece {c:.2f}s, dura {dur/f:.2f}s, tempo x{f:.2f}")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(F)}:normalize=0,apad=whole_dur=50[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "50", "-ar", "48000", "voz_encajada.wav"], check=True)
