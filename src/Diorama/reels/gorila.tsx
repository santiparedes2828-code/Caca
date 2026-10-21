import type { Caption } from "@remotion/captions";
import { interpolate } from "remotion";
import caps from "../../data/captions-gorila.json";
import { opt } from "../../HookHouse/text";
import { E } from "../../Reflejo/scene";
import { ctaCam, ctaItems, type Ctx, type Reel } from "../Engine";

// "Ahora mismo hay un gorila en este video… y no lo viste." Ceguera por falta de atención (Simons y Chabris, 1999).
// Gancho: el gorila cruza al fondo desde el frame 0 mientras la cámara sigue la pelota; en "y no lo viste" se rebobina
// con la diana encima del gorila, y en "viste" el gorila saluda a cámara con golpe y destello.

const PLAYERS = [-420, -140, 140, 420];
const gorillaX = (c: Ctx) => interpolate(c.f, [0, c.w(9)], [-760, 760], opt);
const ball = (c: Ctx) => {
  const leg = c.f / 14;
  const k = Math.floor(leg);
  const p = leg - k;
  const a = PLAYERS[k % 4];
  const b = PLAYERS[(k + 1) % 4];
  return { x: a + (b - a) * p, lift: 230 + 160 * Math.sin(Math.PI * p) };
};
const fade = (c: Ctx) => ({ opacity: interpolate(c.f, [c.w(54), c.w(57)], [1, 0.12], opt) });

export const gorila: Reel = {
  id: "Gorila",
  voice: "audio/voz_gorila.wav",
  captions: caps as Caption[],
  key: [11, 25, 30, 41, 53, 57, 74, 85, 87],
  wall: "#EBE7DD",
  floor: "#A8C495",
  titles: [
    { at: 0, title: "jugadores, pasándose la pelota", sub: "nada raro por aquí" },
    { at: 12, title: "gorila, saludando", sub: "estuvo todo el rato" },
    { at: 18, title: "experimento, famoso", sub: "cuenta los pases" },
    { at: 39, title: "cerebro, filtrando", sub: "solo ve lo que busca" },
    { at: 58, title: "tu video, sin dirección", sub: "el mensaje se pierde" },
    { at: 75, title: "hook house", sub: "edición que dirige la mirada" },
  ],
  items: [
    { sprite: "tree", x: -650, z: -420, scale: 0.9 },
    { sprite: "tree", x: 640, z: -430, scale: 0.8 },
    // Gorila que cruza al fondo desde el primer frame (y se repite al rebobinar)
    { sprite: "gorilla", x: 0, z: -330, scale: 0.9, to: 12, exit: "none", fn: (c) => ({ x: gorillaX(c) }) },
    { sprite: "reticle", x: 0, z: -320, lift: 160, shadow: false, from: 9, to: 12, enter: "pop", fn: (c) => ({ x: gorillaX(c) }) },
    // Saludo descarado
    { sprite: "gorilla", x: 230, z: 120, scale: 1.1, from: 12, to: 18, enter: "drop", props: { walk: 0, wave: 1 } },
    ...PLAYERS.map((x, k) => ({
      sprite: "person",
      x,
      z: k % 2 ? 40 : -40,
      scale: 0.85,
      to: 61,
      props: { shirt: k % 2 ? "#3B4A63" : "#F7F4EC", arm: "up" },
      fn: (c: Ctx) => ({ ...fade(c), face: c.f >= c.w(30) && c.f < c.w(39) && k % 2 === 0 ? "blank" : "normal" }),
    })),
    { sprite: "ball", x: 0, z: 0, shadow: true, to: 61, fn: (c) => ({ ...ball(c), opacity: 1 }) },
    { sprite: "counter", x: 0, z: -200, lift: 470, from: 24, to: 30, fn: (c) => ({ value: String(Math.max(0, Math.floor((c.f - c.w(24)) / 14))) }) },
    { sprite: "glyph", x: 0, z: -200, lift: 430, from: 30, to: 32, props: { ch: "½", color: E.red } },
    { sprite: "eye", x: -250, z: 120, lift: 420, from: 32, to: 35, fn: (c) => ({ look: Math.sin(c.t * 6) }) },
    { sprite: "gorilla", x: 0, z: -320, scale: 0.9, from: 35, to: 39, enter: "none", exit: "none", fn: (c) => ({ x: interpolate(c.f, [c.w(35), c.w(39)], [-760, 760], opt) }) },
    { sprite: "reticle", x: 0, z: -310, lift: 160, shadow: false, from: 36, to: 39, fn: (c) => ({ x: interpolate(c.f, [c.w(35), c.w(39)], [-760, 760], opt) }) },
    { sprite: "brain", x: 0, z: 140, lift: 380, scale: 1.3, from: 46, to: 58, fn: (c) => ({ glow: c.sp(49) }) },
    { sprite: "magnifier", x: 0, z: 60, lift: 140, scale: 0.9, from: 49, to: 58, fn: (c) => ({ x: ball(c).x, lift: ball(c).lift - 40 }) },
    // El video sin dirección: tarjetas grises y el mensaje (el gorila) perdido dentro
    { sprite: "phone", x: 0, z: 150, lift: 30, scale: 1.25, from: 61, to: 86, enter: "rise", exit: "none", fn: (c) => ({ screen: "grey", scroll: (c.f - c.w(61)) * 4 }) },
    { sprite: "eye", x: -330, z: 150, lift: 520, from: 66, to: 75, fn: (c) => ({ look: Math.sin(c.t * 9) }) },
    { sprite: "glyph", x: 330, z: 150, lift: 470, from: 68, to: 72, props: { ch: "?", color: E.red } },
    { sprite: "gorilla", x: 250, z: 230, lift: 0, scale: 0.6, from: 73, to: 86, enter: "rise" },
    ...ctaItems(86, 87),
  ],
  camera: [
    { at: 0, x: -140, y: -260, z: 0, zoom: 2.0, ry: 14, rx: -8 },
    { at: 2, x: 200, y: -280, z: 0, zoom: 2.2, ry: -12, dur: 4 },
    { at: 5, x: 0, y: -260, z: -100, zoom: 1.35, ry: 6, dur: 4 },
    { at: 12, x: 230, y: -250, z: 120, zoom: 1.9, ry: -10, dur: 6 },
    { at: 18, x: 0, y: -260, z: 0, zoom: 1.1, ry: 16 },
    { at: 24, x: 0, y: -460, z: -200, zoom: 1.5, ry: 0 },
    { at: 32, x: -150, y: -330, z: 0, zoom: 1.4, ry: -10 },
    { at: 35, x: 0, y: -260, z: -150, zoom: 1.05, ry: 8, dur: 6 },
    { at: 41, x: 0, y: -330, z: 0, zoom: 1.2, ry: -8 },
    { at: 46, x: 0, y: -470, z: 140, zoom: 1.8, ry: 4 },
    { at: 54, x: 0, y: -280, z: 0, zoom: 1.0, ry: 14 },
    { at: 61, x: 0, y: -300, z: 150, zoom: 1.45, ry: -6 },
    { at: 73, x: 120, y: -280, z: 180, zoom: 1.6, ry: 8 },
    ctaCam(86),
  ],
  replays: [{ from: 9, to: 12, start: 0.6, speed: 1.6 }],
  fx: [
    { at: 0, kind: "punch" },
    { at: 11, kind: "flash" },
    { at: 11, kind: "shake" },
    { at: 12, kind: "punch" },
    { at: 35, kind: "shake", amt: 0.5 },
    { at: 54, kind: "dark", len: 40 },
  ],
  sfx: [
    { at: 9, src: "sfx/rebobinar.wav", vol: 0.5 },
    { at: 9, src: "sfx/glitch.wav", vol: 0.35 },
    { at: 12, src: "sfx/boom.wav", vol: 0.5, offset: -2 },
    { at: 12, src: "sfx/pop.wav", vol: 0.3 },
    { at: 24, src: "sfx/click.wav", vol: 0.35 },
    { at: 30, src: "sfx/pop.wav", vol: 0.3 },
    { at: 35, src: "sfx/hit.wav", vol: 0.35 },
    { at: 49, src: "sfx/pop.wav", vol: 0.3 },
    { at: 73, src: "sfx/pop.wav", vol: 0.35 },
    { at: 87, src: "sfx/pop.wav", vol: 0.35 },
  ],
};
