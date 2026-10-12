// Tiempos de las animaciones compartidos por la composición (src/create) y el backend (efectos de sonido en
// autopilot/create/theme.ts): así un golpe suena justo cuando se ve. Funciones puras, sin React.
// Valores medidos en la referencia (estilo-animaciones.md), a 30 fps.

export const msToFrame = (ms: number, fps: number) => Math.max(0, Math.round((ms / 1000) * fps));

// Cada escena empieza 4 frames antes de su primera palabra
export const sceneStartFrame = (firstWordMs: number, fps: number) => Math.max(0, msToFrame(firstWordMs, fps) - 4);

// Fotograma en que suena la palabra `idx` (sincronía con la voz); null si no hay
export const cueFrame = (caps: { startMs: number }[], idx: number | null | undefined, fps: number) =>
  idx === null || idx === undefined || !caps[idx] ? null : msToFrame(caps[idx].startMs, fps);

// Los gráficos de la escena (lista, cifra, CTA…) entran 10 frames después del comienzo si no se nombran
export const graphicsFrame = (start: number) => start + 10;

// Icono de la escena: salta cuando se dice la palabra que lo eligió
export const iconFrame = (start: number, cue: number | null) => (cue === null ? start + 2 : Math.max(start + 2, cue - 2));

// Cifra o CTA: entran al decirse
export const valueFrame = (start: number, cue: number | null) => (cue === null ? graphicsFrame(start) : Math.max(start + 6, cue - 3));

// Elementos de una lista: cada uno al nombrarlo (o escalonados), siempre en orden
export const itemFrames = (start: number, cues: (number | null)[], n: number, step = 7) => {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const c = cues[k] ?? null;
    const t = c === null ? graphicsFrame(start) + k * step : Math.max(start + 6, c - 3);
    out.push(k ? Math.max(t, out[k - 1] + 3) : t);
  }
  return out;
};

// ——— Movimientos encadenados ———
// El primer bloque entra, espera y acelera contra el siguiente; cada golpe pasa el movimiento al siguiente
// y el último provoca la acción.
export const CHAIN = { entry: 10, attack: 5, travel: 9, minTravel: 7, maxTravel: 16, lastTravel: 12, recoil: 8 } as const;
export type ChainTimeline = {
  appear: number; // aparecen los bloques que esperan
  tIn: number; // empieza a entrar el primero
  hits: number[]; // hits[k] (k ≥ 1): el bloque k-1 toca al k
  travel: number[]; // frames que se mueve el bloque k tras el golpe
  action: number; // el último se activa
};

export const chainTimeline = (enter: number, cues: (number | null)[], n: number): ChainTimeline => {
  const c = (k: number) => cues[k] ?? null;
  const appear = enter;
  const c0 = c(0);
  const tIn = c0 === null ? appear + 6 : Math.max(appear + 2, c0 - 6);
  const hits = [tIn];
  const travel: number[] = [CHAIN.entry];
  const c1 = c(1);
  hits[1] = Math.max(tIn + CHAIN.entry + 8, c1 === null ? tIn + CHAIN.entry + 12 : c1);
  for (let k = 1; k < n - 1; k++) {
    const next = c(k + 1);
    const d = next === null ? CHAIN.travel : Math.min(CHAIN.maxTravel, Math.max(CHAIN.minTravel, next - hits[k]));
    travel[k] = d;
    hits[k + 1] = hits[k] + d;
  }
  travel[n - 1] = CHAIN.lastTravel;
  return { appear, tIn, hits, travel, action: hits[n - 1] + 6 };
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeOutBack = (t: number, c = 1.5) => 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;

export type ChainGeo = { gap: number; approach: number; offscreen: number; recoil: number };

// Desplazamiento horizontal (px) de cada bloque respecto a su sitio final en el fotograma f
export const chainOffset = (f: number, k: number, n: number, tl: ChainTimeline, g: ChainGeo) => {
  if (k === 0) {
    if (f < tl.tIn) return -g.offscreen;
    if (f < tl.tIn + CHAIN.entry) return -g.offscreen + (g.offscreen - g.approach) * easeOutCubic((f - tl.tIn) / CHAIN.entry);
    const attack = tl.hits[1] - CHAIN.attack;
    if (f < attack) return -g.approach;
    if (f < tl.hits[1]) return -g.approach * (1 - ((f - attack) / CHAIN.attack) ** 2); // acelera
    const p = (f - tl.hits[1]) / CHAIN.recoil;
    return p < 1 ? -g.recoil * Math.sin(Math.PI * p) : 0; // rebota un poco tras el golpe
  }
  const hit = tl.hits[k];
  if (f < hit) return -g.gap;
  const p = clamp01((f - hit) / tl.travel[k]);
  if (k === n - 1) return -g.gap * (1 - easeOutBack(p)); // el último frena y se pasa un poco
  if (p < 1) return -g.gap * (1 - p * (1.6 - 0.6 * p)); // frena pero llega con velocidad: empuja al siguiente
  const q = (f - tl.hits[k + 1]) / 6;
  return q < 1 ? -g.recoil * 0.45 * Math.sin(Math.PI * q) : 0;
};

// ——— Tarjeta que escribe ———
// Escribe a ≥ 0,5 caracteres por frame (la referencia: ~16 por segundo) y termina antes del final de la escena
export const typingSchedule = (start: number, end: number, len: number) => {
  const t0 = start + 10;
  const avail = Math.max(10, end - 18 - t0);
  const speed = Math.min(2.2, Math.max(0.5, len / avail));
  const t1 = t0 + Math.ceil(len / speed);
  return { t0, t1, speed, send: t1 + 5 };
};

// ——— Odómetro ———
// Cada dígito rueda y se asienta; primero los de la izquierda (14 frames + 3 por posición)
export const ODOMETER = { base: 14, step: 3 } as const;
export const odometerDuration = (index: number) => ODOMETER.base + ODOMETER.step * index;

// ——— Número + etiqueta (paso) ———
export const STEP = { number: 0, box: 6, title: 12 } as const;

// ——— Transformación entre escenas ———
// El icono crece hasta cubrir la pantalla (out) y la cubierta se recoge en el icono de la escena siguiente (in)
export const MORPH = { out: 10, in: 8 } as const;

// ——— Cámara que sigue ———
// Persigue el objetivo vigente (cambia en el fotograma de cada uno) con un muelle de amortiguación crítica:
// sin saltos ni rebotes, y sin frenazos al cambiar de objetivo (x/y en px)
export type CameraKey = { at: number; x: number; y: number };
export const followCamera = (frame: number, keys: CameraKey[], omega = 0.3) => {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let i = -1;
  for (let f = sorted.length ? sorted[0].at : frame; f < frame; f++) {
    while (i + 1 < sorted.length && sorted[i + 1].at <= f) i++;
    const t = sorted[i];
    vx += omega * omega * (t.x - x) - 2 * omega * vx;
    vy += omega * omega * (t.y - y) - 2 * omega * vy;
    x += vx;
    y += vy;
  }
  return { x, y };
};

// Sacudida breve de la cámara en cada golpe
export const impactShake = (frame: number, hits: number[], amp = 7) => {
  let v = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d >= 0 && d < 12) v += amp * Math.exp(-d / 3) * Math.sin(d * 2.4);
  }
  return v;
};
