import subprocess, sys
# (inicio voz, fin voz, aparece en pantalla, siguiente frase en pantalla)
F = [(0.0, 4.72, 0.0, 5.0), (5.12, 7.52, 5.0, 7.2), (8.0, 12.72, 7.2, 12.4), (13.2, 16.8, 12.4, 16.2),
     (17.28, 23.6, 16.2, 22.6), (24.08, 25.04, 22.6, 23.5), (25.12, 26.72, 23.5, 24.8), (26.96, 29.04, 24.8, 27.2),
     (29.44, 31.84, 27.2, 29.4), (32.24, 35.72, 29.4, 33.2), (36.0, 40.4, 33.2, 37.8), (40.8, 43.76, 37.8, 40.2),
     (43.81, 46.8, 40.2, 43.6), (47.04, 52.56, 43.6, 49.4), (52.64, 54.16, 49.4, 51.2)]
ins, fil, lab = [], [], []
for i, (a, b, c, d) in enumerate(F):
    dur = b - a + 0.06
    f = max(1.0, dur / (d - c - 0.04))
    fil.append(f"[0]atrim={max(0,a-0.03):.2f}:{b+0.06:.2f},asetpts=N/SR/TB,atempo={f:.3f},adelay={int(c*1000)}|{int(c*1000)}[p{i}]")
    lab.append(f"[p{i}]")
    print(f"frase {i+1}: aparece {c:.2f}s, dura {dur/f:.2f}s, tempo x{f:.2f}")
fc = ";".join(fil) + ";" + "".join(lab) + f"amix=inputs={len(F)}:normalize=0,apad=whole_dur=51.2[o]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voz.wav", "-filter_complex", fc, "-map", "[o]", "-t", "51.2", "-ar", "48000", "voz_encajada.wav"], check=True)
