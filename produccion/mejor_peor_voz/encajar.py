import subprocess, sys
# (inicio voz, fin voz, aparece en pantalla, siguiente frase en pantalla)
F = [(0.0, 3.12, 0.0, 3.2), (3.6, 4.56, 3.2, 4.4), (4.8, 7.2, 4.4, 7.0), (7.6, 11.44, 7.0, 10.6),
     (11.48, 14.16, 10.6, 13.8), (14.56, 18.2, 13.8, 17.4), (18.4, 20.68, 17.4, 19.8), (20.88, 22.76, 19.8, 21.6),
     (22.96, 27.76, 21.6, 26.6), (28.0, 29.56, 26.6, 28.0), (29.76, 31.84, 28.0, 30.4), (32.24, 36.16, 30.4, 34.45)]
ins, fil, lab = [], [], []
for i, (a, b, c, d) in enumerate(F):
    dur = b - a + 0.06
    f = max(1.0, dur / (d - c - 0.04))
    fil.append(f"[0]atrim={max(0,a-0.03):.2f}:{b+0.06:.2f},asetpts=N/SR/TB,atempo={f:.3f},adelay={int(c*1000)}|{int(c*1000)}[p{i}]")
    lab.append(f"[p{i}]")
    print(f"frase {i+1}: aparece {c:.2f}s, dura {dur/f:.2f}s, tempo x{f:.2f}")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(F)}:normalize=0,apad=whole_dur=36[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "36", "-ar", "48000", "voz_encajada.wav"], check=True)
