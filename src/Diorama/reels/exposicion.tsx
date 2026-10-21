import type { Caption } from "@remotion/captions";
import { interpolate } from "remotion";
import caps from "../../data/captions-exposicion.json";
import { opt } from "../../HookHouse/text";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Ctx, type Reel } from "../Engine";

// "Te pueden hacer amar algo que odias… solo repitiéndotelo." Efecto de mera exposición (Zajonc, 1968).
// Gancho: un altavoz que no para; el contador de repeticiones sube a 99 a toda velocidad y en "repitiéndotelo"
// la cara de asco se vuelve de amor, con golpe y corazones.

const reps = (c: Ctx) => Math.round(interpolate(c.f, [c.w(1), c.w(8) + 4], [1, 99], { ...opt, easing: (x) => x * x }));
const love = (c: Ctx) => c.f >= c.w(8);
const TILES = [-420, -140, 140, 420];

export const exposicion: Reel = {
  id: "Exposicion",
  voice: "audio/voz_exposicion.wav",
  captions: caps as Caption[],
  key: [3, 8, 18, 25, 31, 43, 49, 60, 67, 80, 85],
  wall: "#BFD9E6",
  floor: "#D9D2C4",
  titles: [
    { at: 0, title: "canción, repitiéndose", sub: "otra vez" },
    { at: 9, title: "tú, cantándola", sub: "de memoria" },
    { at: 26, title: "cerebro, acostumbrándose", sub: "lo fácil se siente bonito" },
    { at: 50, title: "marcas, siempre iguales", sub: "y por eso gustan" },
    { at: 68, title: "hook house", sub: "un estilo que se reconoce" },
  ],
  items: [
    { sprite: "lamp", x: -600, z: -380 },
    { sprite: "speaker", x: 200, z: -40, to: 50, exit: "pop" },
    ...[0, 1, 2].map((k) => ({ sprite: "note", x: 120 + k * 90, z: 0, lift: 300, shadow: false, to: 50, exit: "pop" as const, fn: (c: Ctx) => ({ lift: 280 + ((c.t * 120 + k * 80) % 240), x: 120 + k * 90 + 20 * Math.sin(c.t * 3 + k), props: {} }) })),
    { sprite: "person", x: -220, z: 60, to: 50, exit: "pop", fn: (c) => ({ face: love(c) ? (c.f >= c.w(9) && c.f < c.w(19) ? "talk" : "love") : "bored", shake: c.f < c.w(8) ? 0.6 : 0 }) },
    { sprite: "counter", x: 60, z: 160, lift: 330, to: 50, exit: "pop", props: { label: "REPETICIONES" }, fn: (c) => ({ value: `x${reps(c)}` }) },
    { sprite: "meter", x: -470, z: 40, from: 3, to: 50, props: { label: "GUSTO", color: E.red }, fn: (c) => ({ value: c.f < c.w(8) ? 0.08 : interpolate(c.f, [c.w(8), c.w(8) + 6, c.w(26), c.w(43)], [0.08, 0.7, 0.7, 1], opt) }) },
    { sprite: "burst", x: -220, z: 80, lift: 280, shadow: false, from: 8, to: 12, fn: (c) => ({ k: c.lin(c.w(8), c.w(8) + 16) }) },
    { sprite: "heart", x: -220, z: 90, lift: 420, from: 8, to: 14, enter: "pop" },
    { sprite: "arrow", x: -380, z: 120, lift: 260, from: 24, to: 26, props: { color: E.red } },
    { sprite: "brain", x: 0, z: 150, lift: 560, from: 32, to: 50, fn: (c) => ({ glow: c.lin(c.w(33), c.w(43)) }) },
    // Marcas con el mismo estilo
    ...TILES.map((x, k) => ({ sprite: "tile", x, z: -150, from: 55 + k, to: 68, enter: "drop" as const, exit: "pop" as const })),
    { sprite: "person", x: 0, z: 220, scale: 0.85, from: 60, to: 68, enter: "rise", fn: (c) => ({ face: c.f >= c.w(62) ? "love" : "normal" }) },
    { sprite: "mark", x: -200, z: 260, lift: 420, shadow: false, from: 63, to: 66, props: { ok: false } },
    { sprite: "counter", x: 200, z: 260, lift: 420, from: 66, to: 68, props: { label: "REPETICIÓN", value: "x99" } },
    { sprite: "phone", x: 0, z: 120, lift: 20, scale: 1.15, from: 69, to: 84, enter: "rise", exit: "none", props: { screen: "brand" } },
    { sprite: "clock", x: 300, z: 180, lift: 420, from: 80, to: 84, props: { speed: 4 } },
    { sprite: "mark", x: 0, z: 140, lift: 560, shadow: false, from: 80, to: 84, props: { ok: true } },
    ...ctaItems(84, 85),
  ],
  camera: [
    { at: 0, x: -220, y: -290, z: 60, zoom: 2.4, ry: 14, rx: -6 },
    { at: 2, x: 100, y: -460, z: 100, zoom: 2.0, ry: -10, dur: 4 },
    { at: 5, x: 200, y: -200, z: -40, zoom: 2.2, ry: -16, dur: 4 },
    { at: 8, x: -200, y: -320, z: 60, zoom: 2.0, ry: 6, dur: 3 },
    { at: 14, x: 0, y: -300, z: 40, zoom: 1.2, ry: -8 },
    { at: 24, x: -220, y: -290, z: 60, zoom: 1.9, ry: 10 },
    { at: 26, x: 0, y: -460, z: 120, zoom: 1.35, ry: 0 },
    { at: 50, x: 0, y: -240, z: -60, zoom: 1.15, ry: 12 },
    { at: 63, x: 0, y: -430, z: 260, zoom: 1.6, ry: -6 },
    { at: 68, x: 0, y: -330, z: 120, zoom: 1.4, ry: 6 },
    ctaCam(84),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 8, kind: "flash" },
    { at: 8, kind: "shake" },
    { at: 8, kind: "punch", amt: 1.3 },
    { at: 63, kind: "glitch", len: 6 },
  ],
  sfx: [
    { at: 1, src: "sfx/riser.wav", vol: 0.35, len: 95 },
    { at: 8, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 8, src: "sfx/pop.wav", vol: 0.3 },
    { at: 24, src: "sfx/click.wav", vol: 0.35 },
    ...[55, 56, 57, 58].map((at) => ({ at, src: "sfx/pop.wav", vol: 0.25 })),
    { at: 63, src: "sfx/glitch.wav", vol: 0.3 },
    { at: 80, src: "sfx/pop.wav", vol: 0.3 },
    { at: 85, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
