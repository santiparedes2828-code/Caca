import type { Caption } from "@remotion/captions";
import caps from "../../data/captions-pareidolia.json";
import { ctaCam, ctaItems, type Reel } from "../Engine";

// "Este enchufe te está mirando…" Pareidolia: el cerebro detecta caras antes que cualquier otra cosa.
// Gancho: primerísimo plano de un enchufe con cara cuyos ojos siguen a la cámara; en "mirando" te mira de golpe.

const WALL_Z = -470;

export const pareidolia: Reel = {
  id: "Pareidolia",
  voice: "audio/voz_pareidolia.wav",
  captions: caps as Caption[],
  key: [4, 13, 21, 24, 28, 47, 56, 69, 79, 81],
  wall: "#EBE7DD",
  floor: "#C9A88C",
  titles: [
    { at: 0, title: "enchufe, mirándote", sub: "desde hace rato" },
    { at: 11, title: "dos agujeros y una línea", sub: "suficiente para tu cerebro" },
    { at: 24, title: "caras, en todas partes", sub: "pareidolia" },
    { at: 34, title: "antepasado, sobreviviendo", sub: "ver la cara a tiempo" },
    { at: 48, title: "feed, primer segundo", sub: "cara contra logo" },
    { at: 70, title: "hook house", sub: "edición que frena el pulgar" },
  ],
  items: [
    { sprite: "plug", x: 0, z: WALL_Z + 6, lift: 260, shadow: false, to: 34, exit: "pop", fn: (c) => ({ alive: c.f < c.w(11) ? 1 : c.f < c.w(21) ? 0 : 1 }) },
    { sprite: "reticle", x: -32, z: WALL_Z + 20, lift: 360, shadow: false, from: 13, to: 15, scale: 0.6 },
    { sprite: "reticle", x: 32, z: WALL_Z + 20, lift: 360, shadow: false, from: 14, to: 15, scale: 0.6 },
    { sprite: "reticle", x: 0, z: WALL_Z + 20, lift: 300, shadow: false, from: 16, to: 21, scale: 0.7 },
    { sprite: "burst", x: 0, z: WALL_Z + 30, lift: 240, shadow: false, from: 21, to: 24, fn: (c) => ({ k: c.lin(c.w(21), c.w(21) + 14) }) },
    { sprite: "lamp", x: -560, z: -300 },
    { sprite: "plant", x: 560, z: -320 },
    { sprite: "house", x: -430, z: -200, from: 25, to: 34, enter: "drop" },
    { sprite: "car", x: 420, z: -150, from: 27, to: 34, enter: "right", props: { color: "#BFD9E6" } },
    { sprite: "brain", x: 0, z: 120, lift: 360, scale: 1.1, from: 26, to: 34, fn: (c) => ({ glow: c.sp(28) }) },
    { sprite: "magnifier", x: 160, z: 160, lift: 300, scale: 0.8, from: 27, to: 34 },
    // Hace miles de años
    { sprite: "caveman", x: -220, z: 40, from: 34, to: 48, enter: "left", fn: (c) => ({ face: c.f >= c.w(41) ? "shock" : "normal" }) },
    { sprite: "bush", x: 260, z: -120, from: 34, to: 48, enter: "rise", fn: (c) => ({ eyes: c.lin(c.w(39), c.w(41)) }) },
    { sprite: "reticle", x: 260, z: -100, lift: 120, shadow: false, from: 41, to: 48 },
    { sprite: "mark", x: -220, z: 60, lift: 420, shadow: false, from: 45, to: 48, props: { ok: true } },
    // Cara contra logo
    { sprite: "phone", x: -230, z: 120, lift: 20, scale: 1.05, from: 51, to: 80, enter: "rise", exit: "none", props: { screen: "face" } },
    { sprite: "phone", x: 230, z: 120, lift: 20, scale: 1.05, from: 64, to: 80, enter: "rise", exit: "none", props: { screen: "logo" } },
    { sprite: "mark", x: -230, z: 140, lift: 470, shadow: false, from: 58, to: 80, props: { ok: true } },
    { sprite: "mark", x: 230, z: 140, lift: 470, shadow: false, from: 69, to: 80, props: { ok: false } },
    { sprite: "clock", x: 0, z: 260, lift: 480, from: 77, to: 80, props: { speed: 6 } },
    ...ctaItems(80, 81),
  ],
  camera: [
    { at: 0, x: 0, y: -390, z: WALL_Z, zoom: 3.4, ry: 0, rx: -2 },
    { at: 3, x: 0, y: -390, z: WALL_Z, zoom: 4.2, ry: 6, dur: 4 },
    { at: 6, x: 0, y: -380, z: WALL_Z, zoom: 2.6, ry: -10, dur: 4 },
    { at: 11, x: 0, y: -390, z: WALL_Z, zoom: 3.0, ry: 0 },
    { at: 22, x: 0, y: -320, z: -150, zoom: 1.05, ry: 14 },
    { at: 26, x: 0, y: -430, z: 100, zoom: 1.4, ry: -6 },
    { at: 34, x: 0, y: -250, z: -40, zoom: 1.35, ry: 10 },
    { at: 41, x: 200, y: -200, z: -100, zoom: 1.9, ry: -8, dur: 5 },
    { at: 45, x: -200, y: -300, z: 40, zoom: 1.6, ry: 8 },
    { at: 50, x: 0, y: -330, z: 120, zoom: 1.35, ry: 0 },
    { at: 56, x: -230, y: -320, z: 120, zoom: 1.9, ry: 6 },
    { at: 67, x: 230, y: -320, z: 120, zoom: 1.9, ry: -6 },
    { at: 70, x: 0, y: -360, z: 120, zoom: 1.3, ry: 0 },
    ctaCam(80),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 4, kind: "flash" },
    { at: 4, kind: "shake" },
    { at: 4, kind: "punch", amt: 1.4 },
    { at: 21, kind: "punch" },
    { at: 41, kind: "shake" },
    { at: 41, kind: "dark", len: 30 },
    { at: 69, kind: "glitch", len: 8 },
  ],
  sfx: [
    { at: 4, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 13, src: "sfx/click.wav", vol: 0.35 },
    { at: 16, src: "sfx/click.wav", vol: 0.35 },
    { at: 21, src: "sfx/pop.wav", vol: 0.35 },
    { at: 41, src: "sfx/hit.wav", vol: 0.45 },
    { at: 45, src: "sfx/pop.wav", vol: 0.3 },
    { at: 58, src: "sfx/pop.wav", vol: 0.3 },
    { at: 69, src: "sfx/glitch.wav", vol: 0.3 },
    { at: 81, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
