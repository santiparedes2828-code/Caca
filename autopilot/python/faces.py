"""Detección de caras para el reencuadre (Hook House Autopilot).

Lee fotogramas RGB crudos por stdin (los decodifica ffmpeg desde Node) y escribe una línea JSON por
fotograma: {"i": n, "faces": [[x, y, w, h, score], ...]} con coordenadas normalizadas 0..1.
Detector: YuNet (OpenCV FaceDetectorYN, modelo ONNX local en models/). Sin red, sin acceso a otros archivos.

Uso: python3 -I faces.py --model face_detection_yunet_2023mar.onnx --width 480 --height 854 [--min-score 0.6]
Requisito: pip install -r requirements.txt  (opencv-python-headless, numpy)
"""

import argparse
import json
import sys

p = argparse.ArgumentParser()
p.add_argument("--model", required=True)
p.add_argument("--width", type=int, required=True)
p.add_argument("--height", type=int, required=True)
p.add_argument("--min-score", type=float, default=0.6)
a = p.parse_args()

try:
    import cv2
    import numpy as np
except ImportError as e:
    print(json.dumps({"error": f"falta dependencia: {e}"}), flush=True)
    sys.exit(3)

detector = cv2.FaceDetectorYN.create(a.model, "", (a.width, a.height), a.min_score, 0.3, 50)
size = a.width * a.height * 3
stream = sys.stdin.buffer
i = 0
while True:
    buf = stream.read(size)
    if len(buf) < size:
        break
    rgb = np.frombuffer(buf, dtype=np.uint8).reshape((a.height, a.width, 3))
    _, dets = detector.detect(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    faces = []
    for d in dets if dets is not None else []:
        x, y, w, h = (float(v) for v in d[:4])
        faces.append([round(x / a.width, 4), round(y / a.height, 4), round(w / a.width, 4), round(h / a.height, 4), round(float(d[-1]), 3)])
    print(json.dumps({"i": i, "faces": faces}), flush=True)
    i += 1
