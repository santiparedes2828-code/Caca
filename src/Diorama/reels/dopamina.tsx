import type { Caption } from "@remotion/captions";
import { interpolate } from "remotion";
import caps from "../../data/captions-dopamina.json";
import { opt } from "../../HookHouse/text";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Ctx, type Reel } from "../Engine";

// "Tu cerebro es adicto a esperar." La dopamina sube con la señal que anuncia la recompensa (Schultz, 1997).
// Gancho: un regalo que tiembla y un medidor de dopamina que revienta en "esperar"; al abrirlo, el medidor se desploma.

const level = (c: Ctx) => {
  const w = c.w;
  const f = c.f;
  if (f < w(14)) return interpolate(f, [0, w(5), w(5) + 6], [0.35, 1.0, 0.92], opt) + 0.05 * Math.sin(c.t * 14);
  if (f < w(16)) return interpolate(f, [w(14), w(14) + 8], [0.92, 0.2], opt);
  if (f < w(45)) return interpolate(f, [w(25), w(25) + 5, w(29), w(29) + 10], [0.25, 0.95, 0.9, 0.3], opt);
  if (f < w(58)) return interpolate(f, [w(52), w(52) + 6, w(56), w(57)], [0.5, 0.9, 0.5, 0.05], opt);
  return interpolate(f, [w(58), w(62), w(71)], [0.3, 0.8, 1], opt) + 0.04 * Math.sin(c.t * 12);
};
const shakeGift = (c: Ctx) => ({ tilt: 8 * Math.sin(c.t * 40) });

export const dopamina: Reel = {
  id: "Dopamina",
  voice: "audio/voz_dopamina.wav",
  captions: caps as Caption[],
  key: [3, 9, 14, 20, 25, 33, 44, 57, 66, 71, 81, 83],
  wall: "#E8C35A",
  floor: "#D9D2C4",
  titles: [
    { at: 0, title: "regalo, sin abrir", sub: "dopamina al máximo" },
    { at: 14, title: "regalo, abierto", sub: "y se acabó la magia" },
    { at: 15, title: "mono, esperando jugo", sub: "experimento clásico" },
    { at: 34, title: "lo que engancha", sub: "la promesa, no el premio" },
    { at: 45, title: "video, todo al principio", sub: "se acaba ahí" },
    { at: 58, title: "video, con promesa", sub: "se ve hasta el final" },
    { at: 72, title: "hook house", sub: "videos que se esperan" },
  ],
  items: [
    { sprite: "plant", x: -600, z: -380 },
    { sprite: "meter", x: 260, z: 40, scale: 1.2, to: 45, exit: "none", props: { label: "DOPAMINA", color: E.red }, fn: (c) => ({ value: level(c) }) },
    { sprite: "gift", x: -120, z: 80, scale: 1.3, to: 16, exit: "pop", fn: (c) => ({ ...(c.f < c.w(14) ? shakeGift(c) : {}), open: c.lin(c.w(14) - 2, c.w(14) + 6) }) },
    { sprite: "burst", x: 260, z: 60, lift: 300, shadow: false, from: 5, to: 9, fn: (c) => ({ k: c.lin(c.w(5), c.w(5) + 16) }) },
    { sprite: "person", x: -420, z: 0, scale: 0.85, to: 16, exit: "pop", fn: (c) => ({ face: c.f < c.w(14) ? "love" : "bored", shake: c.f < c.w(5) + 10 ? 1 : 0 }) },
    // Mono, señal y jugo
    { sprite: "monkey", x: -200, z: 60, from: 16, to: 34, enter: "drop", fn: (c) => ({ face: c.f >= c.w(25) && c.f < c.w(30) ? "love" : "normal" }) },
    { sprite: "bulb", x: -480, z: -60, lift: 200, from: 21, to: 34, fn: (c) => ({ on: c.lin(c.w(25), c.w(25) + 3) }) },
    { sprite: "juice", x: 0, z: 100, from: 29, to: 34, enter: "drop" },
    { sprite: "reticle", x: -480, z: -40, lift: 300, shadow: false, from: 25, to: 29 },
    { sprite: "mark", x: 0, z: 120, lift: 260, shadow: false, from: 30, to: 34, props: { ok: false } },
    // Promesa contra recompensa
    { sprite: "gift", x: -250, z: 80, from: 34, to: 45, enter: "pop", props: { open: 1 } },
    { sprite: "gift", x: 250, z: 80, from: 42, to: 45, enter: "pop", fn: shakeGift },
    { sprite: "mark", x: -250, z: 100, lift: 300, shadow: false, from: 40, to: 45, props: { ok: false } },
    { sprite: "mark", x: 250, z: 100, lift: 300, shadow: false, from: 44, to: 45, props: { ok: true } },
    // Video que da todo / video que promete
    { sprite: "phone", x: -60, z: 120, lift: 20, scale: 1.15, from: 47, to: 82, enter: "rise", exit: "none", fn: (c) => ({ screen: c.f < c.w(58) ? "color" : "brand", scroll: c.f < c.w(58) ? (c.f - c.w(47)) * 3 : 0 }) },
    { sprite: "gift", x: -60, z: 200, lift: 160, scale: 0.6, from: 49, to: 82, enter: "pop", exit: "none", fn: (c) => ({ open: c.f < c.w(58) ? c.lin(c.w(52), c.w(52) + 6) : 0, ...(c.f >= c.w(58) ? shakeGift(c) : {}) }) },
    { sprite: "meter", x: 280, z: 120, scale: 1.1, from: 47, to: 82, enter: "pop", exit: "none", props: { label: "GANAS", color: E.gold }, fn: (c) => ({ value: level(c) }) },
    { sprite: "person", x: -420, z: 220, scale: 0.85, from: 48, to: 57, enter: "left", exit: "fall", fn: (c) => ({ face: c.f >= c.w(52) ? "bored" : "normal" }) },
    { sprite: "person", x: -420, z: 220, scale: 0.85, from: 59, to: 82, enter: "left", exit: "none", fn: (c) => ({ face: c.f >= c.w(62) ? "love" : "normal" }) },
    { sprite: "flag", x: 450, z: -60, from: 71, to: 82 },
    ...ctaItems(82, 83),
  ],
  camera: [
    { at: 0, x: -120, y: -230, z: 80, zoom: 2.3, ry: 12, rx: -8 },
    { at: 3, x: 260, y: -330, z: 40, zoom: 2.0, ry: -14, dur: 4 },
    { at: 5, x: 80, y: -280, z: 60, zoom: 1.6, ry: 0, dur: 3 },
    { at: 14, x: -120, y: -230, z: 80, zoom: 2.2, ry: 10, dur: 4 },
    { at: 16, x: -100, y: -260, z: 40, zoom: 1.25, ry: -12 },
    { at: 25, x: -400, y: -320, z: 0, zoom: 1.8, ry: 10 },
    { at: 29, x: 0, y: -220, z: 80, zoom: 1.6, ry: -6 },
    { at: 34, x: 0, y: -230, z: 80, zoom: 1.35, ry: 8 },
    { at: 46, x: 0, y: -300, z: 130, zoom: 1.2, ry: -10 },
    { at: 58, x: 0, y: -300, z: 130, zoom: 1.4, ry: 10 },
    { at: 71, x: 100, y: -300, z: 80, zoom: 1.15, ry: -6 },
    ctaCam(82),
  ],
  fx: [
    { at: 0, kind: "punch" },
    { at: 5, kind: "flash" },
    { at: 5, kind: "shake" },
    { at: 5, kind: "punch", amt: 1.3 },
    { at: 14, kind: "dark", len: 30 },
    { at: 25, kind: "flash", amt: 0.5 },
    { at: 57, kind: "dark", len: 20 },
  ],
  sfx: [
    { at: 5, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 14, src: "sfx/pop.wav", vol: 0.35 },
    { at: 25, src: "sfx/click.wav", vol: 0.4 },
    { at: 29, src: "sfx/pop.wav", vol: 0.3 },
    { at: 44, src: "sfx/pop.wav", vol: 0.3 },
    { at: 57, src: "sfx/hit.wav", vol: 0.3 },
    { at: 71, src: "sfx/pop.wav", vol: 0.3 },
    { at: 83, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
