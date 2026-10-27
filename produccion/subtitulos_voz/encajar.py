import subprocess, sys
# (inicio voz, fin voz, aparece en pantalla, siguiente frase en pantalla)
F = [(0.0, 2.72, 0.0, 3.0), (3.28, 5.08, 3.0, 4.8), (5.36, 7.52, 4.8, 7.2), (7.92, 10.4, 7.2, 10.0),
     (10.56, 12.72, 10.0, 12.0), (12.76, 16.28, 12.0, 15.8), (16.56, 18.64, 15.8, 17.6), (19.04, 21.12, 17.6, 20.0),
     (21.28, 25.04, 20.0, 23.6), (25.36, 29.16, 23.6, 27.4), (29.36, 32.16, 27.4, 30.4), (32.56, 35.6, 30.4, 33.4)]
ins, fil, lab = [], [], []
for i, (a, b, c, d) in enumerate(F):
    dur = b - a + 0.06
    f = max(1.0, dur / (d - c - 0.04))
    fil.append(f"[0]atrim={max(0,a-0.03):.2f}:{b+0.06:.2f},asetpts=N/SR/TB,atempo={f:.3f},adelay={int(c*1000)}|{int(c*1000)}[p{i}]")
    lab.append(f"[p{i}]")
    print(f"frase {i+1}: aparece {c:.2f}s, dura {dur/f:.2f}s, tempo x{f:.2f}")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(F)}:normalize=0,apad=whole_dur=35[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "35", "-ar", "48000", "voz_encajada.wav"], check=True)
