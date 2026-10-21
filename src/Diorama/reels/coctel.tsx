import type { Caption } from "@remotion/captions";
import caps from "../../data/captions-coctel.json";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Ctx, type Reel } from "../Engine";

// "Con una sola palabra puedo encontrarte entre cien personas gritando." Efecto cóctel (Cherry, 1953; Moray, 1959).
// Gancho: fiesta a todo volumen desde el frame 0; la diana te encuentra entre la gente y en "nombre" todo se calla,
// el resto se apaga y te cae la etiqueta con tu nombre.

const FRONT = [-470, -250, 250, 470];
const silent = (c: Ctx) => c.f >= c.w(11) && c.f < c.w(35);

export const coctel: Reel = {
  id: "Coctel",
  voice: "audio/voz_coctel.wav",
  captions: caps as Caption[],
  key: [5, 11, 16, 20, 30, 34, 43, 50, 64, 74, 76],
  wall: "#3B4A63",
  floor: "#8A6A55",
  titles: [
    { at: 0, title: "fiesta, a todo volumen", sub: "cien personas, cien voces" },
    { at: 10, title: "tú, escuchando tu nombre", sub: "entre todo el ruido" },
    { at: 17, title: "cerebro, filtrando", sub: "efecto cóctel" },
    { at: 35, title: "feed, lleno de ruido", sub: "solo pasa lo que es para ti" },
    { at: 65, title: "hook house", sub: "hooks que suenan a tu nombre" },
  ],
  items: [
    { sprite: "crowd", x: 0, z: -330, to: 35, exit: "none", fn: (c) => ({ dim: silent(c) ? 1 : 0, t: silent(c) ? 0 : c.t }) },
    ...FRONT.map((x, k) => ({
      sprite: "person",
      x,
      z: k % 2 ? -40 : 40,
      scale: 0.9,
      to: 35,
      exit: "none" as const,
      props: { shirt: ["#4E6B45", E.gold, "#F7F4EC", E.wood][k], arm: k % 2 ? "wave" : "down" },
      fn: (c: Ctx) => ({ face: silent(c) ? "bored" : "talk", opacity: silent(c) ? 0.35 : 1 }),
    })),
    ...FRONT.map((x, k) => ({ sprite: "waves", x: x + 90, z: 60, lift: 300, shadow: false, to: 11, exit: "none" as const, props: { color: k % 2 ? E.red : E.gold } })),
    { sprite: "person", x: 0, z: 200, to: 35, exit: "none", props: { shirt: E.red }, fn: (c) => ({ face: c.f >= c.w(11) ? "shock" : "normal", shake: c.f >= c.w(11) && c.f < c.w(12) ? 1 : 0 }) },
    { sprite: "reticle", x: 0, z: 220, lift: 270, shadow: false, from: 5, to: 11 },
    { sprite: "nametag", x: 0, z: 230, lift: 420, scale: 0.8, from: 11, to: 17, enter: "drop", props: { name: "TÚ" } },
    { sprite: "ear", x: 150, z: 230, lift: 280, scale: 0.6, from: 14, to: 17 },
    { sprite: "glyph", x: 0, z: 230, lift: 420, from: 17, to: 19, props: { ch: "?" } },
    { sprite: "brain", x: -180, z: 260, lift: 430, from: 19, to: 31 },
    { sprite: "funnel", x: 170, z: 260, lift: 380, scale: 0.8, from: 20, to: 31 },
    { sprite: "waves", x: 170, z: 270, lift: 600, shadow: false, from: 20, to: 24, props: { color: E.dim } },
    { sprite: "nametag", x: 170, z: 270, lift: 250, scale: 0.55, from: 24, to: 31, enter: "drop", props: { name: "TÚ" } },
    { sprite: "mark", x: -180, z: 280, lift: 650, shadow: false, from: 28, to: 31, props: { ok: true } },
    { sprite: "juice", x: 0, z: 260, lift: 380, scale: 1.3, from: 33, to: 35, enter: "drop" },
    // El feed: un video que te habla a ti atraviesa el ruido; el que habla para todos no lo oye nadie
    { sprite: "phone", x: -230, z: 120, lift: 20, scale: 1.05, from: 37, to: 75, enter: "rise", exit: "none", props: { screen: "face" } },
    { sprite: "waves", x: -60, z: 140, lift: 330, shadow: false, from: 41, to: 55, props: { color: E.red } },
    { sprite: "person", x: 0, z: 300, scale: 0.8, from: 43, to: 75, enter: "left", exit: "none", props: { shirt: E.red }, fn: (c) => ({ face: c.f < c.w(55) ? "happy" : "bored" }) },
    { sprite: "phone", x: 230, z: 120, lift: 20, scale: 1.05, from: 55, to: 75, enter: "rise", exit: "none", props: { screen: "logo" } },
    { sprite: "mark", x: 230, z: 140, lift: 460, shadow: false, from: 63, to: 75, props: { ok: false } },
    { sprite: "nametag", x: 0, z: 330, lift: 380, scale: 0.65, from: 73, to: 75, enter: "drop", props: { name: "TÚ" } },
    ...ctaItems(75, 76),
  ],
  camera: [
    { at: 0, x: -250, y: -300, z: 40, zoom: 2.2, ry: 18, rx: -6 },
    { at: 3, x: 250, y: -300, z: -40, zoom: 2.4, ry: -16, dur: 4 },
    { at: 5, x: 0, y: -270, z: 200, zoom: 2.0, ry: 0, dur: 4 },
    { at: 7, x: 0, y: -280, z: 0, zoom: 1.1, ry: 10, dur: 5 },
    { at: 11, x: 0, y: -330, z: 200, zoom: 2.3, ry: 0, dur: 3 },
    { at: 17, x: 0, y: -430, z: 230, zoom: 1.9, ry: -6 },
    { at: 19, x: 0, y: -480, z: 260, zoom: 1.5, ry: 6 },
    { at: 31, x: 0, y: -460, z: 260, zoom: 1.9, ry: 0 },
    { at: 36, x: 0, y: -300, z: 160, zoom: 1.25, ry: -10 },
    { at: 55, x: 120, y: -300, z: 160, zoom: 1.4, ry: 10 },
    { at: 65, x: 0, y: -330, z: 160, zoom: 1.3, ry: 0 },
    ctaCam(75),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 11, kind: "flash" },
    { at: 11, kind: "shake" },
    { at: 11, kind: "punch", amt: 1.3 },
    { at: 63, kind: "glitch", len: 8 },
  ],
  sfx: [
    { at: 0, src: "sfx/multitud.wav", vol: 0.55, len: 140, offset: 18 },
    { at: 11, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 20, src: "sfx/click.wav", vol: 0.35 },
    { at: 28, src: "sfx/pop.wav", vol: 0.3 },
    { at: 33, src: "sfx/pop.wav", vol: 0.3 },
    { at: 63, src: "sfx/glitch.wav", vol: 0.3 },
    { at: 76, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
