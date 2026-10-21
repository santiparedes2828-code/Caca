import type { Caption } from "@remotion/captions";
import caps from "../../data/captions-pez.json";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Reel } from "../Engine";

// "Te dijeron que tienes la atención de un pez dorado… y es mentira." El dato de los 8 segundos no tiene fuente
// (lo buscaron la BBC y varios investigadores sin encontrarla). Gancho: pecera gigante con el cartel "8 s";
// en "mentira" la pecera estalla y el cartel se tacha.

export const pez: Reel = {
  id: "Pez",
  voice: "audio/voz_pez.wav",
  captions: caps as Caption[],
  key: [9, 12, 18, 23, 30, 41, 51, 59, 64, 76, 78],
  wall: "#8FC6E8",
  floor: "#D9D2C4",
  titles: [
    { at: 0, title: "pez dorado, 8 segundos", sub: "eso te dijeron" },
    { at: 13, title: "dato, sin fuente", sub: "nadie sabe de dónde salió" },
    { at: 31, title: "tú, en el sofá", sub: "una serie entera" },
    { at: 45, title: "atención, exigente", sub: "no corta" },
    { at: 52, title: "video, aburrido", sub: "por eso te vas" },
    { at: 65, title: "hook house", sub: "cada segundo se gana" },
  ],
  items: [
    { sprite: "plant", x: -600, z: -380 },
    { sprite: "bowl", x: 0, z: 100, scale: 1.5, to: 12, exit: "shatter" },
    { sprite: "sign", x: 0, z: 40, lift: 500, scale: 0.9, to: 12, exit: "pop", props: { text: "8 s" }, fn: (c) => ({ tilt: 6 * Math.sin(c.t * 3) }) },
    { sprite: "burst", x: 0, z: 120, lift: 160, shadow: false, from: 12, to: 14, fn: (c) => ({ k: c.lin(c.w(12), c.w(12) + 14) }) },
    { sprite: "sign", x: 0, z: 60, lift: 330, from: 14, to: 25, props: { text: "8 s" }, fn: (c) => ({ crossed: c.lin(c.w(22), c.w(22) + 6) }) },
    { sprite: "magnifier", x: 0, z: 120, lift: 250, from: 25, to: 31, fn: (c) => ({ x: 260 * Math.sin(c.t * 3), tilt: 10 * Math.sin(c.t * 4) }) },
    { sprite: "glyph", x: 0, z: 120, lift: 420, from: 29, to: 31, props: { ch: "?", color: E.red } },
    // Sofá y series de una sentada
    { sprite: "sofa", x: -120, z: -120, from: 31, to: 45, enter: "drop" },
    { sprite: "person", x: -120, z: -40, scale: 0.9, from: 33, to: 45, enter: "rise", props: { arm: "phone" }, fn: (c) => ({ face: c.f >= c.w(39) ? "love" : "normal" }) },
    { sprite: "tv", x: 330, z: -60, lift: 120, from: 39, to: 45, enter: "pop", fn: (c) => ({ text: `EP ${1 + Math.floor(Math.max(0, c.f - c.w(39)) / 5)}` }) },
    { sprite: "brain", x: 0, z: 120, lift: 480, from: 45, to: 52 },
    { sprite: "sign", x: -230, z: 120, lift: 220, scale: 0.8, from: 47, to: 52, props: { text: "CORTA", size: 60 }, fn: (c) => ({ crossed: c.lin(c.w(49), c.w(49) + 6) }) },
    { sprite: "sign", x: 230, z: 120, lift: 220, scale: 0.8, from: 51, to: 52, props: { text: "EXIGENTE", size: 46, fill: E.red } },
    // Largo no, aburrido sí
    { sprite: "phone", x: -60, z: 120, lift: 20, scale: 1.15, from: 54, to: 77, enter: "rise", exit: "none", fn: (c) => ({ screen: c.f < c.w(65) ? "grey" : "color", scroll: c.f < c.w(65) ? (c.f - c.w(54)) * 1.5 : Math.floor((c.f - c.w(65)) / 10) * 120 }) },
    { sprite: "sign", x: 300, z: 160, lift: 380, scale: 0.7, from: 57, to: 62, props: { text: "LARGO", size: 64 }, fn: (c) => ({ crossed: c.lin(c.w(59), c.w(59) + 6) }) },
    { sprite: "person", x: 320, z: 220, scale: 0.85, from: 61, to: 65, enter: "right", exit: "fall", props: { face: "sleep" } },
    { sprite: "clock", x: 300, z: 200, lift: 420, from: 74, to: 77, props: { speed: 5 } },
    { sprite: "mark", x: -60, z: 140, lift: 560, shadow: false, from: 74, to: 77, props: { ok: true } },
    ...ctaItems(77, 78),
  ],
  camera: [
    { at: 0, x: 0, y: -230, z: 100, zoom: 2.6, ry: 10, rx: -4 },
    { at: 3, x: 0, y: -560, z: 40, zoom: 2.2, ry: -10, dur: 4 },
    { at: 8, x: 0, y: -240, z: 100, zoom: 2.8, ry: 0, dur: 4 },
    { at: 12, x: 0, y: -300, z: 80, zoom: 1.5, ry: -8, dur: 3 },
    { at: 14, x: 0, y: -420, z: 60, zoom: 1.6, ry: 8 },
    { at: 25, x: 0, y: -330, z: 120, zoom: 1.4, ry: -8 },
    { at: 31, x: 60, y: -260, z: -60, zoom: 1.2, ry: 12 },
    { at: 39, x: 250, y: -260, z: -60, zoom: 1.6, ry: -8 },
    { at: 45, x: 0, y: -430, z: 120, zoom: 1.45, ry: 4 },
    { at: 53, x: 60, y: -320, z: 140, zoom: 1.3, ry: -8 },
    { at: 65, x: -60, y: -330, z: 120, zoom: 1.6, ry: 6 },
    ctaCam(77),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 12, kind: "flash" },
    { at: 12, kind: "shake" },
    { at: 12, kind: "punch", amt: 1.4 },
    { at: 22, kind: "glitch", len: 6 },
    { at: 64, kind: "dark", len: 20 },
  ],
  sfx: [
    { at: 12, src: "sfx/cristal.wav", vol: 0.6, offset: -1 },
    { at: 12, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 22, src: "sfx/click.wav", vol: 0.4 },
    { at: 30, src: "sfx/pop.wav", vol: 0.3 },
    { at: 49, src: "sfx/click.wav", vol: 0.35 },
    { at: 51, src: "sfx/pop.wav", vol: 0.3 },
    { at: 59, src: "sfx/click.wav", vol: 0.35 },
    { at: 64, src: "sfx/hit.wav", vol: 0.3 },
    { at: 78, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
