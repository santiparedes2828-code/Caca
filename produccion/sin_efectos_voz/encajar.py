import subprocess, sys
# (inicio voz, fin voz, aparece en pantalla, siguiente frase en pantalla)
F = [(0.0, 3.52, 0.0, 3.4), (4.0, 6.24, 3.4, 5.4), (6.72, 8.64, 5.4, 7.2), (9.04, 13.6, 7.2, 11.6),
     (14.0, 17.2, 11.6, 14.8), (17.44, 21.68, 14.8, 18.8), (22.08, 25.12, 18.8, 22.2), (25.6, 27.92, 22.2, 24.4),
     (28.24, 29.84, 24.4, 26.2), (30.24, 33.28, 26.2, 29.9)]
ins, fil, lab = [], [], []
for i, (a, b, c, d) in enumerate(F):
    dur = b - a + 0.06
    f = max(1.0, dur / (d - c - 0.04))
    fil.append(f"[0]atrim={max(0,a-0.03):.2f}:{b+0.06:.2f},asetpts=N/SR/TB,atempo={f:.3f},adelay={int(c*1000)}|{int(c*1000)}[p{i}]")
    lab.append(f"[p{i}]")
    print(f"frase {i+1}: aparece {c:.2f}s, dura {dur/f:.2f}s, tempo x{f:.2f}")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(F)}:normalize=0,apad=whole_dur=31.5[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "31.5", "-ar", "48000", "voz_encajada.wav"], check=True)
