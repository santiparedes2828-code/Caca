import type { Caption } from "@remotion/captions";
import { interpolate } from "remotion";
import caps from "../../data/captions-cambio.json";
import { opt } from "../../HookHouse/text";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Ctx, type Reel } from "../Engine";

// "Te pueden cambiar a la persona con la que estás hablando… y no te das cuenta." Ceguera al cambio
// (Simons y Levin, 1998: la mitad no notó el cambio). Gancho: mientras hablas, tu interlocutor cambia de golpe tres
// veces (la última por un gorila) con glitch, y tú sigues hablando tan tranquilo.

const LOOKS = [
  { shirt: "#3B4A63", hair: "#1A1613" },
  { shirt: "#4E6B45", hair: "#C9A88C" },
  { shirt: "#F7F4EC", hair: "#8A6A55" },
];
const swapIdx = (c: Ctx) => (c.f < c.w(2) ? 0 : c.f < c.w(5) ? 1 : c.f < c.w(10) ? 2 : -1);
const plankX = (c: Ctx) => interpolate(c.f, [c.w(26), c.w(41)], [-900, 900], opt);

export const cambio: Reel = {
  id: "Cambio",
  voice: "audio/voz_cambio.wav",
  captions: caps as Caption[],
  key: [2, 15, 22, 31, 38, 42, 55, 60, 64, 76, 82, 88],
  wall: "#D9D2C4",
  floor: "#9C958C",
  titles: [
    { at: 0, title: "tú, hablando", sub: "con la misma persona… ¿no?" },
    { at: 16, title: "experimento, en la calle", sub: "un desconocido pide direcciones" },
    { at: 26, title: "puerta, pasando", sub: "dos segundos tapado" },
    { at: 41, title: "gente, sin enterarse", sub: "la mitad" },
    { at: 51, title: "cerebro, suponiendo", sub: "ceguera al cambio" },
    { at: 61, title: "cortes, sin cambio", sub: "nadie los nota" },
    { at: 77, title: "hook house", sub: "cada corte cambia algo" },
  ],
  items: [
    { sprite: "tree", x: -600, z: -400 },
    { sprite: "lamp", x: 600, z: -380 },
    // Tú
    { sprite: "person", x: -190, z: 60, to: 61, exit: "none", props: { shirt: E.red, arm: "point" }, fn: (c) => ({ face: c.f < c.w(16) || (c.f >= c.w(44) && c.f < c.w(51)) ? "talk" : "normal" }) },
    // El otro: cambia en el gancho
    ...LOOKS.map((l, k) => ({ sprite: "person", x: 190, z: 60, to: 16, exit: "none" as const, props: { ...l }, fn: (c: Ctx) => ({ opacity: swapIdx(c) === k ? 1 : 0, face: "talk" }) })),
    { sprite: "gorilla", x: 190, z: 60, from: 10, to: 16, enter: "none", exit: "none", props: { walk: 0 } },
    // Experimento: el desconocido con el mapa y la puerta que pasa entre los dos
    { sprite: "person", x: 190, z: 60, from: 16, to: 61, enter: "none", exit: "none", fn: (c) => ({ ...LOOKS[c.f < c.w(38) ? 0 : 1], face: "talk", arm: "point" }) },
    { sprite: "map", x: 120, z: 80, lift: 190, scale: 0.8, from: 21, to: 26 },
    { sprite: "plank", x: 0, z: 150, lift: 20, from: 26, to: 41, enter: "none", exit: "none", fn: (c) => ({ x: plankX(c) }) },
    { sprite: "person", x: 0, z: 200, scale: 0.9, from: 26, to: 41, enter: "none", exit: "none", props: { walk: 1, shirt: E.gold }, fn: (c) => ({ x: plankX(c) - 210 }) },
    { sprite: "person", x: 0, z: 200, scale: 0.9, from: 26, to: 41, enter: "none", exit: "none", props: { walk: 1, shirt: E.gold }, fn: (c) => ({ x: plankX(c) + 210 }) },
    { sprite: "arrow", x: 0, z: 100, lift: 470, from: 38, to: 41, props: { color: E.red }, fn: (c) => ({ tilt: 0, scale: 0.8 + 0.1 * Math.sin(c.t * 10) }) },
    { sprite: "glyph", x: 0, z: 100, lift: 420, from: 42, to: 46, props: { ch: "½", color: E.red } },
    { sprite: "reticle", x: 190, z: 80, lift: 300, shadow: false, from: 53, to: 56 },
    { sprite: "brain", x: 0, z: 150, lift: 420, from: 57, to: 61 },
    { sprite: "bubble", x: 0, z: 150, lift: 620, scale: 0.8, from: 60, to: 61, inner: { sprite: "glyph", props: { ch: "?" }, scale: 0.6 } },
    // Cortes que no cambian nada (gris) contra cortes que cambian algo (color)
    { sprite: "phone", x: -60, z: 120, lift: 20, scale: 1.15, from: 62, to: 87, enter: "rise", exit: "none", fn: (c) => ({ screen: c.f < c.w(77) ? "grey" : "color", scroll: c.f < c.w(77) ? (c.f - c.w(62)) * 2 : Math.floor((c.f - c.w(77)) / 12) * 120 }) },
    { sprite: "person", x: 300, z: 220, scale: 0.85, from: 63, to: 74, enter: "right", exit: "fall", props: { shirt: "#3B4A63" }, fn: (c) => ({ face: c.f >= c.w(70) ? "sleep" : "bored" }) },
    { sprite: "mark", x: -60, z: 140, lift: 560, shadow: false, from: 70, to: 77, props: { ok: false } },
    { sprite: "mark", x: -60, z: 140, lift: 560, shadow: false, from: 82, to: 87, props: { ok: true } },
    ...ctaItems(87, 88),
  ],
  camera: [
    { at: 0, x: 120, y: -270, z: 60, zoom: 2.3, ry: -14, rx: -6 },
    { at: 2, x: 190, y: -280, z: 60, zoom: 2.6, ry: -6, dur: 3 },
    { at: 5, x: 150, y: -270, z: 60, zoom: 2.2, ry: -18, dur: 3 },
    { at: 10, x: 0, y: -260, z: 60, zoom: 1.6, ry: 10, dur: 3 },
    { at: 12, x: -190, y: -300, z: 60, zoom: 2.2, ry: 8, dur: 5 },
    { at: 16, x: 0, y: -260, z: 0, zoom: 1.15, ry: -12 },
    { at: 26, x: 0, y: -250, z: 100, zoom: 1.2, ry: 16 },
    { at: 38, x: 190, y: -280, z: 60, zoom: 2.1, ry: -8, dur: 5 },
    { at: 41, x: 0, y: -330, z: 60, zoom: 1.3, ry: 0 },
    { at: 51, x: 0, y: -330, z: 60, zoom: 1.1, ry: -14 },
    { at: 57, x: 0, y: -520, z: 150, zoom: 1.7, ry: 4 },
    { at: 62, x: 60, y: -320, z: 140, zoom: 1.4, ry: -8 },
    { at: 77, x: -60, y: -330, z: 120, zoom: 1.6, ry: 6 },
    ctaCam(87),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 2, kind: "glitch", len: 6 },
    { at: 5, kind: "glitch", len: 6 },
    { at: 10, kind: "glitch", len: 8 },
    { at: 10, kind: "punch" },
    { at: 15, kind: "flash" },
    { at: 15, kind: "shake" },
    { at: 38, kind: "glitch", len: 6 },
    { at: 70, kind: "dark", len: 25 },
  ],
  sfx: [
    { at: 2, src: "sfx/glitch.wav", vol: 0.35 },
    { at: 5, src: "sfx/glitch.wav", vol: 0.35 },
    { at: 10, src: "sfx/glitch.wav", vol: 0.45 },
    { at: 15, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 26, src: "sfx/whoosh.wav", vol: 0.3 },
    { at: 38, src: "sfx/glitch.wav", vol: 0.3 },
    { at: 42, src: "sfx/pop.wav", vol: 0.3 },
    { at: 70, src: "sfx/hit.wav", vol: 0.3 },
    { at: 82, src: "sfx/pop.wav", vol: 0.3 },
    { at: 88, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
