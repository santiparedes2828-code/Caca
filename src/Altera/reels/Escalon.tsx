import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Snd } from "../reelkit";

// «Escalón» — Hook House (2026-10-31). Objetivo: alcance y seguidores. Sin voz.
// Tema general de desarrollo personal: constancia contra el atajo («día 1 o algún día»).
// Principios tomados de la referencia (sin copiar personajes, escenas ni textos): stickmans blancos sobre negro, UN color
// de acento que es el símbolo (acá el ladrillo naranja = un día de constancia), una metáfora que se entiende en 1 s,
// repetición con una sola diferencia, texto corto que llega cuando la imagen ya planteó la pregunta, giro final.
// Historia propia: uno se estrella una y otra vez queriendo subir de un salto; el otro pone un ladrillo por día y arma
// una escalera. Llega arriba el día 365, le tira un ladrillo al que estaba abajo y ese pone el suyo: su día 1.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";
const OR = "#FF5A1F";
const WH = "#F4F1EC";

export const ESCALON_FRAMES = 520;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ln = (f: number, a: number, b: number, from = 0, to = 1, ease?: (x: number) => number) => (b <= a ? (f >= b ? to : from) : interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
const eio = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.quad);
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const decay = (f: number, at: number, len: number) => (f < at || f > at + len ? 0 : 1 - (f - at) / len);

// ---------- mundo ----------
const GROUND = 1560;
const PLAT = { x0: 400, x1: 700, top: 920 }; // la meta
const ST = { x0: 112, w: 36, h: 80, n: 8 }; // escalera: 8 escalones de 80 = altura de la meta (640)
const NB = ST.n * (ST.n + 1); // 72 ladrillos (2 por nivel)
const BRICK_H = ST.h / 2;

// Cuándo aparece cada ladrillo: el primero a mano, después un time-lapse que se acelera hasta el día 365
export const BT: number[] = Array.from({ length: NB }, (_, i) => (i === 0 ? 76 : 90 + 210 * Math.pow((i - 1) / 70, 0.6)));
const KC = Array.from({ length: ST.n }, (_, c) => (c + 1) * (c + 2) - 1); // último ladrillo de cada columna
export const TC = KC.map((k) => BT[k]); // columna terminada
const dayOf = (i: number) => (i <= 0 ? 1 : Math.round(1 + (i * 364) / (NB - 1)));
const placedCount = (f: number) => {
  let n = 0;
  for (const t of BT) if (t <= f) n++;
  return n;
};
const brickPos = (i: number) => {
  let c = 0;
  while ((c + 1) * (c + 2) <= i) c++;
  const j = i - c * (c + 1);
  return { x: ST.x0 + ST.w * c, y: GROUND - BRICK_H * (j + 1) };
};

// Ritmo del que pone ladrillos: fase que avanza con la velocidad de colocación (con tope para que no tiemble)
const PSI: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (let g = 0; g <= ESCALON_FRAMES; g++) {
    let rate = 0;
    if (g >= 90 && g < 300) {
      const q = (g - 90) / 210;
      const didt = q <= 0 ? 0 : (70 / 0.6) * Math.pow(q, 1 / 0.6 - 1) / 210;
      rate = Math.max(1 / 16, Math.min(1 / 7, didt));
    }
    acc += 2 * Math.PI * rate;
    out.push(acc);
  }
  return out;
})();

// ---------- esqueleto del stickman ----------
// Ángulos en grados. Tronco: desde la vertical hacia arriba (+ = adelante). Miembros: absolutos desde la vertical hacia
// abajo (+ = adelante). rot: giro de todo el cuerpo alrededor de la cadera (− = hacia atrás).
type Pose = { lean: number; head: number; tl: number; sl: number; tr: number; sr: number; al: number; fl: number; ar: number; fr: number; rot: number };
const P = (lean: number, head: number, tl: number, sl: number, tr: number, sr: number, al: number, fl: number, ar: number, fr: number, rot = 0): Pose => ({ lean, head, tl, sl, tr, sr, al, fl, ar, fr, rot });
const KEYS: (keyof Pose)[] = ["lean", "head", "tl", "sl", "tr", "sr", "al", "fl", "ar", "fr", "rot"];
const mix = (a: Pose, b: Pose, t: number): Pose => {
  const o = { ...a };
  for (const k of KEYS) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
};
const R = 20;
const T = 80;
const L1 = 52;
const L2 = 50;
const A1 = 42;
const A2 = 40;

const STAND = P(2, 0, 4, 0, -4, -2, -6, 4, 6, 14);
const HOLD = P(0, 10, 4, 0, -4, -2, 25, 100, 35, 105);
const CROUCH = P(30, 0, 80, -20, 70, -30, -40, -10, -30, 0);
const PLACE = P(55, 10, 75, -15, 65, -25, 40, 60, 50, 70);
const TUCK = P(15, -10, 110, 20, 95, 0, 130, 160, 120, 150);
const REACH = P(20, -15, 35, 5, -15, -35, 160, 165, 145, 155);
const SPLAT = P(0, 22, 15, 8, -10, -5, 168, 172, 150, 160);
const SLIDE = P(4, 14, 10, 4, -6, -2, 172, 176, 160, 168);
const LIE = P(0, 0, 6, 0, -4, -2, 12, 14, -8, -6, -90);
const SITLEGS = P(-6, 0, 88, 90, 92, 92, -30, -20, -20, -10);
const SITPHONE = P(5, 32, 110, 59, 100, 55, 50, 130, 60, 125);
const SITUP = P(-14, -38, 110, 59, 100, 55, -35, -30, -25, -20);
const CATCH = P(-6, -35, 6, 0, -6, -4, 165, 172, 158, 168);
const LOOKUP = P(-4, -32, 4, 0, -4, -2, -6, 4, 6, 14);
const LOOKDOWN = P(4, 30, 4, 0, -4, -2, -6, 4, 6, 14);
const THROW_BACK = P(-8, -10, 10, 0, -12, -6, 20, 40, -130, -100);
const THROW_REL = P(15, 5, 6, 0, -14, -8, 30, 60, 110, 120);
const FIST = P(-4, -10, 4, 0, -4, -2, -6, 4, 165, 178);

const run = (ph: number): Pose => {
  const s1 = Math.sin(ph);
  const s2 = Math.sin(ph + Math.PI);
  const b1 = 15 + 70 * Math.max(0, Math.cos(ph));
  const b2 = 15 + 70 * Math.max(0, Math.cos(ph + Math.PI));
  const tl = 42 * s1;
  const tr = 42 * s2;
  return P(16, -6, tl, tl - b1, tr, tr - b2, -38 * s1, -38 * s1 + 80, -38 * s2, -38 * s2 + 80);
};
const walk = (ph: number): Pose => {
  const s1 = Math.sin(ph);
  const s2 = Math.sin(ph + Math.PI);
  const b1 = 5 + 38 * Math.max(0, Math.cos(ph));
  const b2 = 5 + 38 * Math.max(0, Math.cos(ph + Math.PI));
  const tl = 24 * s1;
  const tr = 24 * s2;
  return P(4, 0, tl, tl - b1, tr, tr - b2, -20 * s1, -20 * s1 + 25, -20 * s2, -20 * s2 + 25);
};
const breathe = (p: Pose, f: number, k = 1): Pose => ({ ...p, lean: p.lean + 1.5 * k * Math.sin(f * 0.12), al: p.al + 3 * k * Math.sin(f * 0.12 + 1), ar: p.ar + 3 * k * Math.sin(f * 0.12 + 2), head: p.head + 2 * k * Math.sin(f * 0.09) });
const withArms = (legs: Pose, arms: Pose): Pose => ({ ...legs, al: arms.al, fl: arms.fl, ar: arms.ar, fr: arms.fr, head: arms.head, lean: (legs.lean + arms.lean) / 2 });

type Pt = { x: number; y: number };
type Body = { H: Pt; N: Pt; S: Pt; C: Pt; KL: Pt; FL: Pt; KR: Pt; FR: Pt; EL: Pt; HL: Pt; ER: Pt; HR: Pt };
type St = { p: Pose; x: number; air: number; d: number; sx: number; ground: number; squashY?: number };

const rad = Math.PI / 180;
const add = (a: Pt, len: number, ang: number, up: boolean): Pt => ({ x: a.x + len * Math.sin(ang * rad), y: a.y + (up ? -1 : 1) * len * Math.cos(ang * rad) });
const solve = (s: St): Body => {
  const p = s.p;
  const H = { x: 0, y: 0 };
  const N = add(H, T, p.lean, true);
  const S = add(H, T - 10, p.lean, true);
  const C = add(N, 6 + R, p.lean + p.head, true);
  const KL = add(H, L1, p.tl, false);
  const FL = add(KL, L2, p.sl, false);
  const KR = add(H, L1, p.tr, false);
  const FR = add(KR, L2, p.sr, false);
  const EL = add(S, A1, p.al, false);
  const HL = add(EL, A2, p.fl, false);
  const ER = add(S, A1, p.ar, false);
  const HR = add(ER, A2, p.fr, false);
  const loc: Body = { H, N, S, C, KL, FL, KR, FR, EL, HL, ER, HR };
  const cr = Math.cos(p.rot * rad);
  const sr = Math.sin(p.rot * rad);
  const sy = s.squashY ?? 1;
  const out = {} as Body;
  let low = -1e9;
  for (const k of Object.keys(loc) as (keyof Body)[]) {
    const q = loc[k];
    const rx = q.x * cr - q.y * sr;
    const ry = (q.x * sr + q.y * cr) * sy;
    out[k] = { x: rx, y: ry };
    low = Math.max(low, ry + (k === "C" ? R : 0));
  }
  low += 5;
  const Y = s.ground - s.air - low;
  for (const k of Object.keys(out) as (keyof Body)[]) out[k] = { x: s.x + s.d * s.sx * out[k].x, y: Y + out[k].y };
  return out;
};

const Stick: React.FC<{ b: Body; glow?: number }> = ({ b, glow = 0 }) => {
  const seg = (a: Pt, m: Pt, c: Pt) => `M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${m.x.toFixed(1)} ${m.y.toFixed(1)} L${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  const st = { fill: "none", stroke: WH, strokeWidth: 10, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g style={{ filter: glow > 0 ? `drop-shadow(0 0 ${8 + 10 * glow}px rgba(255,140,80,${0.5 * glow}))` : "drop-shadow(0 0 6px rgba(255,255,255,0.25))" }}>
      <path d={seg(b.H, b.KL, b.FL)} {...st} opacity={0.62} />
      <path d={seg(b.S, b.EL, b.HL)} {...st} opacity={0.62} />
      <path d={`M${b.H.x} ${b.H.y} L${b.N.x} ${b.N.y}`} {...st} />
      <path d={seg(b.H, b.KR, b.FR)} {...st} />
      <path d={seg(b.S, b.ER, b.HR)} {...st} />
      <circle cx={b.C.x} cy={b.C.y} r={R} fill={WH} />
    </g>
  );
};

// ---------- el que quiere llegar de un salto (A, a la derecha, mira hacia la izquierda) ----------
const XT = 815; // donde salta
const XW = 732; // contra la pared
const XF = 815; // donde cae
const attempt = (k: number, x0: number): St => {
  const base = { d: -1, sx: 1, ground: GROUND };
  if (k < 14) {
    const ph = k * 0.62;
    return { ...base, p: run(ph), x: x0 + (XT - x0) * (k / 14), air: 8 * Math.abs(Math.sin(ph)) };
  }
  if (k < 17) {
    const q = (k - 14) / 3;
    return { ...base, p: mix(run(14 * 0.62), CROUCH, eio(q)), x: XT - 12 * q, air: 0 };
  }
  if (k < 24) {
    const q = (k - 17) / 7;
    const p = q < 0.4 ? mix(CROUCH, TUCK, eio(q / 0.4)) : mix(TUCK, REACH, eio((q - 0.4) / 0.6));
    return { ...base, p, x: XT - 12 + (XW - (XT - 12)) * q, air: 150 * (1 - (1 - q) * (1 - q)) };
  }
  if (k < 30) {
    const q = (k - 24) / 6;
    return { ...base, p: mix(REACH, SPLAT, clamp01(q * 3)), x: XW, air: 150, sx: 1 - 0.3 * (1 - q), squashY: 1 + 0.08 * (1 - q) };
  }
  if (k < 42) {
    const q = (k - 30) / 12;
    return { ...base, p: mix(SPLAT, SLIDE, q), x: XW, air: 150 * (1 - ei(q)) };
  }
  if (k < 54) {
    const q = ei((k - 42) / 12);
    return { ...base, p: mix(SLIDE, LIE, q), x: XW + (XF - XW) * q, air: 0 };
  }
  if (k < 62) return { ...base, p: LIE, x: XF, air: 12 * Math.abs(Math.sin((k - 54) * 0.5)) * (1 - (k - 54) / 8) };
  if (k < 72) return { ...base, p: mix(LIE, SITLEGS, eio((k - 62) / 10)), x: XF, air: 0 };
  if (k < 80) return { ...base, p: mix(SITLEGS, CROUCH, eio((k - 72) / 8)), x: XF, air: 0 };
  if (k < 88) return { ...base, p: mix(CROUCH, STAND, eio((k - 80) / 8)), x: XF, air: 0 };
  return { ...base, p: STAND, x: XF, air: 0 };
};
const SLAMS = [24, 122 + 24 / 1.5, 250 + 24 / 1.6];
const FALLS = [54, 122 + 54 / 1.5, 250 + 54 / 1.6];
const A_FAR = 905;

const turn = (f: number, a: number, toRight: boolean, x: number, p: Pose = STAND): St => {
  const q = eio(ln(f, a, a + 5));
  const sx = toRight ? Math.cos(Math.PI * q) : -Math.cos(Math.PI * q);
  return { p, x, air: 0, d: -1, sx: Math.abs(sx) < 0.08 ? 0.08 * Math.sign(sx || 1) : sx, ground: GROUND };
};
const walkTo = (f: number, a: number, b: number, x0: number, x1: number, facingRight: boolean, base: Pose = STAND): St => {
  const q = (f - a) / (b - a);
  const blend = Math.min(1, Math.min(q, 1 - q) * 6);
  return { p: mix(base, walk((f - a) * 0.5), blend), x: x0 + (x1 - x0) * eio(q), air: 0, d: -1, sx: facingRight ? -1 : 1, ground: GROUND };
};

const poseA = (f: number): St => {
  const g = { d: -1, sx: 1, ground: GROUND, air: 0 };
  if (f < 88) return attempt(f, 1060);
  if (f < 93) return turn(f, 88, true, XF);
  if (f < 117) return walkTo(f, 93, 117, XF, A_FAR, true);
  if (f < 122) return turn(f, 117, false, A_FAR);
  if (f < 122 + 88 / 1.5) return attempt((f - 122) * 1.5, A_FAR);
  if (f < 186) return turn(f, 181, true, XF);
  if (f < 200) return walkTo(f, 186, 200, XF, A_FAR - 20, true);
  if (f < 205) return turn(f, 200, false, A_FAR - 20);
  if (f < 210) return { ...g, p: mix(STAND, CROUCH, eio((f - 205) / 5)), x: A_FAR - 20 };
  if (f < 216) return { ...g, p: mix(CROUCH, SITPHONE, eio((f - 210) / 6)), x: A_FAR - 20 };
  if (f < 240) {
    const p = { ...SITPHONE, fr: SITPHONE.fr + 12 * Math.max(0, Math.sin((f - 216) * 0.9)), head: SITPHONE.head + 2 * Math.sin(f * 0.2) };
    return { ...g, p, x: A_FAR - 20 };
  }
  if (f < 245) return { ...g, p: mix(SITPHONE, CROUCH, eio((f - 240) / 5)), x: A_FAR - 20 };
  if (f < 250) return { ...g, p: mix(CROUCH, STAND, eio((f - 245) / 5)), x: A_FAR - 20 };
  if (f < 250 + 72 / 1.6) return attempt((f - 250) * 1.6, A_FAR - 20);
  if (f < 318) return { ...g, p: breathe(SITLEGS, f, 0.6), x: XF };
  if (f < 330) return { ...g, p: mix(SITLEGS, SITUP, eio((f - 318) / 12)), x: XF };
  if (f < 345) return { ...g, p: breathe(SITUP, f, 0.6), x: XF };
  if (f < 352) return { ...g, p: mix(SITUP, CROUCH, eio((f - 345) / 7)), x: XF };
  if (f < 360) return { ...g, p: mix(CROUCH, LOOKUP, eio((f - 352) / 8)), x: XF };
  if (f < 372) return { ...g, p: breathe(LOOKUP, f), x: XF };
  if (f < 380) return { ...g, p: mix(LOOKUP, CATCH, eio((f - 372) / 8)), x: XF };
  if (f < 390) return { ...g, p: mix(CATCH, { ...HOLD, head: 25 }, eio((f - 380) / 10)), x: XF, squashY: 1 - 0.06 * decay(f, 380, 6) };
  if (f < 402) return { ...g, p: mix({ ...HOLD, head: 25 }, PLACE, eio((f - 390) / 12)), x: XF };
  if (f < 414) return { ...g, p: mix(PLACE, { ...STAND, head: 18 }, eio((f - 402) / 12)), x: XF };
  if (f < 450) return { ...g, p: breathe({ ...STAND, head: 18 }, f), x: XF };
  if (f < 462) {
    const nod = Math.sin(((f - 450) / 12) * Math.PI * 2) * 10;
    return { ...g, p: breathe({ ...STAND, head: 18 + nod }, f), x: XF };
  }
  if (f < 476) return { ...g, p: mix(breathe({ ...STAND, head: 18 }, f), breathe(LOOKUP, f), eio((f - 462) / 14)), x: XF };
  return { ...g, p: breathe(LOOKUP, f), x: XF };
};

// ---------- el que pone uno por día (B, a la izquierda, mira hacia la derecha) ----------
const B_START = 74;
const colX = (c: number) => ST.x0 + ST.w * c + ST.w / 2;
const colTop = (c: number) => GROUND - ST.h * (c + 1);
const B_TOP_X = 600;

const poseB = (f: number): St & { brick: boolean } => {
  const g = { d: 1, sx: 1, air: 0 };
  if (f < 66) return { ...g, p: breathe(HOLD, f), x: B_START, ground: GROUND, brick: true };
  if (f < 76) return { ...g, p: mix(HOLD, PLACE, eio((f - 66) / 10)), x: B_START, ground: GROUND, brick: true };
  if (f < 86) return { ...g, p: mix(PLACE, HOLD, eio((f - 76) / 10)), x: B_START, ground: GROUND, brick: f >= 81 };
  if (f < 300) {
    let cc = 0;
    while (cc < ST.n && TC[cc] <= f) cc++;
    const sup = (n: number) => (n === 0 ? { x: B_START, y: GROUND } : { x: colX(n - 1), y: colTop(n - 1) });
    const cur = sup(cc);
    const lastHop = cc > 0 ? TC[cc - 1] : -100;
    const hk = f - lastHop;
    if (hk < 7) {
      const prev = sup(cc - 1);
      const q = eio(hk / 7);
      const p = mix(CROUCH, HOLD, q);
      return { ...g, p, x: prev.x + (cur.x - prev.x) * q, ground: prev.y + (cur.y - prev.y) * q, air: 46 * Math.sin(Math.PI * (hk / 7)), brick: true };
    }
    const w = 0.5 - 0.5 * Math.cos(PSI[Math.floor(f)] ?? 0);
    return { ...g, p: mix(HOLD, PLACE, w), x: cur.x, ground: cur.y, brick: w < 0.55 };
  }
  if (f < 307) {
    const q = eio((f - 300) / 7);
    return { ...g, p: mix(CROUCH, HOLD, q), x: colX(ST.n - 2) + (colX(ST.n - 1) - colX(ST.n - 2)) * q, ground: colTop(ST.n - 2) + (colTop(ST.n - 1) - colTop(ST.n - 2)) * q, air: 46 * Math.sin(Math.PI * ((f - 300) / 7)), brick: true };
  }
  if (f < 330) {
    const q = (f - 307) / 23;
    const blend = Math.min(1, Math.min(q, 1 - q) * 6);
    return { ...g, p: withArms(mix(HOLD, walk((f - 307) * 0.5), blend), HOLD), x: colX(ST.n - 1) + (B_TOP_X - colX(ST.n - 1)) * eio(q), ground: PLAT.top, brick: true };
  }
  if (f < 345) return { ...g, p: breathe(mix(HOLD, { ...HOLD, head: -18, lean: -4 }, eio((f - 330) / 8)), f), x: B_TOP_X, ground: PLAT.top, brick: true };
  if (f < 352) return { ...g, p: mix({ ...HOLD, head: -18, lean: -4 }, { ...HOLD, head: 32, lean: 6 }, eio((f - 345) / 7)), x: B_TOP_X, ground: PLAT.top, brick: true };
  if (f < 360) return { ...g, p: mix({ ...HOLD, head: 32, lean: 6 }, THROW_BACK, eio((f - 352) / 8)), x: B_TOP_X, ground: PLAT.top, brick: true };
  if (f < 366) return { ...g, p: mix(THROW_BACK, THROW_REL, eo((f - 360) / 6)), x: B_TOP_X, ground: PLAT.top, brick: f < TOSS_A };
  if (f < 380) return { ...g, p: mix(THROW_REL, LOOKDOWN, eio((f - 366) / 14)), x: B_TOP_X, ground: PLAT.top, brick: false };
  if (f < 404) return { ...g, p: breathe(LOOKDOWN, f), x: B_TOP_X, ground: PLAT.top, brick: false };
  if (f < 412) return { ...g, p: mix(LOOKDOWN, FIST, eo((f - 404) / 8)), x: B_TOP_X, ground: PLAT.top, brick: false };
  if (f < 426) return { ...g, p: { ...FIST, fr: FIST.fr + 6 * Math.sin(f * 0.8) }, x: B_TOP_X, ground: PLAT.top, brick: false };
  if (f < 440) return { ...g, p: mix(FIST, LOOKDOWN, eio((f - 426) / 14)), x: B_TOP_X, ground: PLAT.top, brick: false };
  if (f < 470) return { ...g, p: breathe(LOOKDOWN, f), x: B_TOP_X, ground: PLAT.top, brick: false };
  // saluda
  const wv = ln(f, 470, 480, 0, 1, eio);
  const wave = P(LOOKDOWN.lean, LOOKDOWN.head, LOOKDOWN.tl, LOOKDOWN.sl, LOOKDOWN.tr, LOOKDOWN.sr, LOOKDOWN.al, LOOKDOWN.fl, 150 + 10 * Math.sin(f * 0.5), 170 + 25 * Math.sin(f * 0.5));
  return { ...g, p: breathe(mix(LOOKDOWN, wave, wv), f), x: B_TOP_X, ground: PLAT.top, brick: false };
};

// ladrillo que tira B y ataja A
const TOSS_A = 361;
const TOSS_B = 380;
const handMid = (b: Body) => ({ x: (b.HL.x + b.HR.x) / 2, y: (b.HL.y + b.HR.y) / 2 });

// ---------- piezas de escena ----------
const Brick: React.FC<{ x: number; y: number; s?: number; rot?: number; glow?: number }> = ({ x, y, s = 1, rot = 0, glow = 0 }) => (
  <g transform={`translate(${x + ST.w / 2} ${y + BRICK_H / 2}) rotate(${rot}) scale(${s})`}>
    <rect x={-ST.w / 2 + 1.5} y={-BRICK_H / 2 + 1.5} width={ST.w - 3} height={BRICK_H - 3} rx={4} fill={OR} stroke="#B83A10" strokeWidth={3} style={glow > 0 ? { filter: `drop-shadow(0 0 ${10 * glow}px rgba(255,90,31,0.9))` } : undefined} />
    <line x1={-ST.w / 2 + 6} y1={-BRICK_H / 2 + 7} x2={ST.w / 2 - 10} y2={-BRICK_H / 2 + 7} stroke="#FFB08A" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
  </g>
);

const Sparks: React.FC<{ f: number; at: number; x: number; y: number; n?: number; color?: string; spread?: number }> = ({ f, at, x, y, n = 7, color = OR, spread = 60 }) => {
  const k = f - at;
  if (k < 0 || k > 14) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = -Math.PI / 2 + (rnd(at * 7 + i) - 0.5) * 2.6;
        const v = spread * (0.5 + rnd(at + i * 3));
        const q = k / 14;
        return <circle key={i} cx={x + Math.cos(a) * v * q} cy={y + Math.sin(a) * v * q + 40 * q * q} r={4 * (1 - q) + 1} fill={color} opacity={1 - q} />;
      })}
    </g>
  );
};

const Dust: React.FC<{ f: number; at: number; x: number; y: number; w?: number }> = ({ f, at, x, y, w = 1 }) => {
  const k = f - at;
  if (k < 0 || k > 18) return null;
  const q = k / 18;
  return (
    <g opacity={0.5 * (1 - q)}>
      {Array.from({ length: 6 }, (_, i) => {
        const dir = i < 3 ? -1 : 1;
        const off = (i % 3) * 18 + 10;
        return <circle key={i} cx={x + dir * (off + 70 * w * eo(q))} cy={y - 8 - 22 * eo(q) * (0.5 + rnd(i + at))} r={(10 + 10 * rnd(i * 5 + at)) * (0.6 + q)} fill="#8C8C94" />;
      })}
    </g>
  );
};

const Impact: React.FC<{ f: number; at: number; x: number; y: number; big?: number }> = ({ f, at, x, y, big = 1 }) => {
  const k = f - at;
  if (k < 0 || k > 12) return null;
  const q = k / 12;
  return (
    <g opacity={1 - q}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 9 + 0.3;
        const r0 = 30 * big + 50 * big * eo(q);
        const r1 = r0 + 40 * big * (1 - q);
        return <line key={i} x1={x + Math.cos(a) * r0} y1={y + Math.sin(a) * r0} x2={x + Math.cos(a) * r1} y2={y + Math.sin(a) * r1} stroke={WH} strokeWidth={7} strokeLinecap="round" />;
      })}
      <circle cx={x} cy={y} r={20 * big + 90 * big * eo(q)} fill="none" stroke={WH} strokeWidth={5 * (1 - q)} />
    </g>
  );
};

// estrellitas de mareo alrededor de la cabeza
const Dizzy: React.FC<{ f: number; from: number; to: number; c: Pt }> = ({ f, from, to, c }) => {
  if (f < from || f > to) return null;
  const op = Math.min(ln(f, from, from + 5), 1 - ln(f, to - 8, to));
  return (
    <g opacity={op}>
      {[0, 1, 2].map((i) => {
        const a = f * 0.35 + (i * Math.PI * 2) / 3;
        const x = c.x + 34 * Math.cos(a);
        const y = c.y - 34 + 10 * Math.sin(a);
        return <path key={i} d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z`} fill={WH} />;
      })}
    </g>
  );
};

const SpeedLines: React.FC<{ b: Body; f: number; on: number; dir: number }> = ({ b, f, on, dir }) =>
  on <= 0 ? null : (
    <g opacity={0.55 * on}>
      {[0, 1, 2].map((i) => {
        const y = b.H.y - 60 + i * 40 + 6 * Math.sin(f + i);
        const x = b.H.x - dir * (40 + i * 12);
        return <line key={i} x1={x} y1={y} x2={x - dir * (60 + 20 * rnd(f + i))} y2={y} stroke={WH} strokeWidth={5} strokeLinecap="round" />;
      })}
    </g>
  );

// fondo: estrellas que giran (más rápido mientras pasan los días) y polvo
const ROT: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (let g = 0; g <= ESCALON_FRAMES; g++) {
    const fast = g >= 90 && g < 300 ? 0.004 + 0.05 * Math.pow((g - 90) / 210, 1.5) : 0.0015;
    acc += fast;
    out.push(acc);
  }
  return out;
})();
const Sky: React.FC<{ f: number }> = ({ f }) => {
  const a = ROT[Math.min(ESCALON_FRAMES, Math.floor(f))];
  const a0 = ROT[Math.max(0, Math.floor(f) - 3)];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 90 }, (_, k) => {
        const r = 500 + rnd(k) * 1900;
        const th = rnd(k + 9) * Math.PI * 2;
        const cx = 540;
        const cy = 2300;
        const x1 = cx + r * Math.cos(th + a);
        const y1 = cy + r * Math.sin(th + a);
        const x0 = cx + r * Math.cos(th + a0);
        const y0 = cy + r * Math.sin(th + a0);
        const tw = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(f * 0.13 + k));
        return <line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke={WH} strokeWidth={1.5 + rnd(k + 4) * 2.5} strokeLinecap="round" opacity={tw} />;
      })}
    </svg>
  );
};
const Motes: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: 36 }, (_, k) => {
      const sp = 0.5 + rnd(k) * 1.5;
      const x = rnd(k + 1) * 1080 + 24 * Math.sin(f * 0.04 * sp + k);
      const y = 1920 - ((rnd(k + 2) * 1920 + f * sp * 2.4) % 1920);
      return <circle key={k} cx={x} cy={y} r={1.4 + rnd(k + 3) * 2.6} fill={WH} opacity={0.08 + 0.18 * (0.5 + 0.5 * Math.sin(f * 0.15 * sp + k))} />;
    })}
  </svg>
);

const Flag: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  const pts = Array.from({ length: 9 }, (_, i) => {
    const u = i / 8;
    return { x: x + 6 + 90 * u, y: y - 150 + 8 * Math.sin(f * 0.25 - u * 4) * u };
  });
  const top = pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L");
  const bot = pts
    .slice()
    .reverse()
    .map((p) => `${p.x.toFixed(1)} ${(p.y + 56).toFixed(1)}`)
    .join(" L");
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 160} stroke={WH} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${top} L${bot} Z`} fill="#1A1A1E" stroke={WH} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

const Pill: React.FC<{ x: number; y: number; text: string; s: number }> = ({ x, y, text, s }) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-92} y={-32} width={184} height={64} rx={32} fill="#111114" stroke={OR} strokeWidth={4} />
      <text x={0} y={13} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={38} fill={OR} letterSpacing={1}>
        {text}
      </text>
    </g>
  );

// ---------- texto ----------
type Line = { t: string; size: number; hot?: string[] };
const Words: React.FC<{ f: number; at: number; out: number; y: number; lines: Line[]; gap?: number }> = ({ f, at, out, y, lines, gap = 6 }) => {
  if (f < at || f > out + 10) return null;
  const gone = ln(f, out, out + 9, 0, 1, Easing.in(Easing.cubic));
  let idx = 0;
  return (
    <div style={{ position: "absolute", left: 50, width: 980, top: y, textAlign: "center", fontFamily: PF, fontWeight: 800, color: WH, opacity: 1 - gone, transform: `translateY(${-30 * gone}px)` }}>
      {lines.map((ln_, li) => (
        <div key={li} style={{ fontSize: ln_.size, lineHeight: 1.04, letterSpacing: "0.02em", marginTop: li === 0 ? 0 : gap, whiteSpace: "nowrap" }}>
          {ln_.t.split(" ").map((w, wi) => {
            const k = f - at - 3 * idx++;
            const sp = k < 0 ? 0 : spring({ frame: k, fps: 30, config: { damping: 12, stiffness: 190, mass: 0.7 } });
            const hot = ln_.hot?.some((h) => w.replace(/[.,¿?«»]/g, "") === h);
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: "0.24em", opacity: clamp01(sp * 1.4), transform: `translateY(${(1 - sp) * 34}px) scale(${0.7 + 0.3 * sp})`, color: hot ? OR : WH, textShadow: hot ? "0 0 30px rgba(255,90,31,0.65), 0 6px 18px rgba(0,0,0,0.9)" : "0 0 22px rgba(255,255,255,0.18), 0 6px 18px rgba(0,0,0,0.9)" }}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- cámara ----------
const CAM: [number, number, number, number][] = [
  [0, 790, 1400, 1.75],
  [24, 780, 1390, 1.86],
  [52, 790, 1400, 1.8],
  [84, 548, 1250, 0.96],
  [300, 540, 1225, 1.04],
  [324, 548, 1195, 1.16],
  [376, 565, 1195, 1.18],
  [404, 790, 1490, 1.95],
  [452, 780, 1470, 2.12],
  [478, 548, 1262, 0.96],
  [ESCALON_FRAMES, 548, 1250, 1.0],
];
const cam = (f: number) => {
  let i = 0;
  while (i < CAM.length - 2 && f >= CAM[i + 1][0]) i++;
  const [f0, x0, y0, z0] = CAM[i];
  const [f1, x1, y1, z1] = CAM[i + 1];
  const q = eio(clamp01((f - f0) / (f1 - f0)));
  return { cx: x0 + (x1 - x0) * q, cy: y0 + (y1 - y0) * q, z: z0 + (z1 - z0) * q };
};

// ---------- composición ----------
export const Escalon: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;

  const A = poseA(f);
  const bA = solve(A);
  const Bs = poseB(f);
  const bB = solve(Bs);

  const placed = placedCount(f);
  const lastIdx = placed - 1;
  const day = lastIdx >= 0 ? dayOf(lastIdx) : 0;

  // ladrillo en vuelo
  const relB = solve(poseB(TOSS_A));
  const from = handMid(relB);
  const catchA = handMid(solve(poseA(TOSS_B)));
  const tq = clamp01((f - TOSS_A) / (TOSS_B - TOSS_A));
  const apex = Math.min(from.y, catchA.y) - 120;
  const flyX = from.x + (catchA.x - from.x) * tq;
  const flyY = (1 - tq) * (1 - tq) * from.y + 2 * (1 - tq) * tq * apex + tq * tq * catchA.y;

  // el ladrillo de A (su día 1)
  const A_PLACE = 402;
  const aBrickPos = (() => {
    const b = solve(poseA(A_PLACE));
    const m = handMid(b);
    return { x: m.x - ST.w / 2, y: GROUND - BRICK_H };
  })();

  // sacudones
  const shake =
    SLAMS.reduce((s, at, i) => s + (i === 0 ? 16 : 7) * decay(f, at, 12) * Math.sin((f - at) * 2.6), 0) +
    4 * decay(f, 76, 8) * Math.sin((f - 76) * 3) +
    7 * decay(f, BT[NB - 1], 12) * Math.sin((f - BT[NB - 1]) * 2.8) +
    6 * decay(f, A_PLACE, 10) * Math.sin((f - A_PLACE) * 3);
  const C = cam(f);
  const fx = 5 * Math.sin(t * 1.3) + shake;
  const fy = 4 * Math.cos(t * 1.1) + 0.6 * shake;
  const camT = `translate(${540 + fx} ${1150 + fy}) scale(${C.z}) translate(${-C.cx} ${-C.cy})`;

  // amanecer al llegar arriba
  const sun = ln(f, 300, 345, 0, 1, eo);
  const flash = 0.18 * decay(f, SLAMS[0], 6) + 0.12 * decay(f, BT[NB - 1], 8);

  // A corre (líneas de velocidad)
  const runOn = (f < 16 ? 1 : 0) + (f >= 122 && f < 122 + 16 / 1.5 ? 1 : 0) + (f >= 250 && f < 250 + 16 / 1.6 ? 1 : 0);

  const phoneOn = f >= 214 && f < 243 ? Math.min(ln(f, 214, 218), 1 - ln(f, 239, 243)) : 0;
  const pillB = f >= 76 && f < 160 ? Math.min(spring({ frame: f - 76, fps: 30, config: { damping: 11, stiffness: 200 } }), 1 - ln(f, 150, 158)) : 0;
  const pillA = f >= A_PLACE + 3 ? spring({ frame: f - A_PLACE - 3, fps: 30, config: { damping: 10, stiffness: 200 } }) : 0;
  const bigCount = f >= 150 && f < 322 ? Math.min(ln(f, 150, 158, 0, 1, eo), 1 - ln(f, 312, 320)) : 0;
  const countPulse = 1 + 0.12 * decay(f, BT[Math.max(0, lastIdx)], 5) + 0.25 * decay(f, BT[NB - 1], 14);

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, #101015 0%, #000 70%)", overflow: "hidden" }}>
      <Sky f={f} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sol" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB070" stopOpacity={0.9} />
            <stop offset="35%" stopColor={OR} stopOpacity={0.45} />
            <stop offset="100%" stopColor={OR} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={camT}>
          {/* amanecer detrás de la meta */}
          {sun > 0 ? (
            <g opacity={sun}>
              <circle cx={560} cy={PLAT.top + 60 - 140 * sun} r={900} fill="url(#sol)" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 + f * 0.006;
                return <line key={i} x1={560} y1={PLAT.top - 80 * sun} x2={560 + 1400 * Math.cos(a)} y2={PLAT.top - 80 * sun + 1400 * Math.sin(a)} stroke={OR} strokeWidth={36} opacity={0.06} />;
              })}
              <circle cx={560} cy={PLAT.top + 90 - 170 * sun} r={110} fill={OR} opacity={0.95} />
            </g>
          ) : null}
          {/* suelo */}
          <rect x={-800} y={GROUND} width={2700} height={900} fill="#08080A" />
          <line x1={-800} y1={GROUND} x2={1900} y2={GROUND} stroke={WH} strokeWidth={6} />
          {Array.from({ length: 22 }, (_, i) => (
            <line key={i} x1={-300 + i * 80 + 20 * rnd(i)} y1={GROUND + 22 + 30 * rnd(i + 3)} x2={-300 + i * 80 + 20 * rnd(i) + 26} y2={GROUND + 22 + 30 * rnd(i + 3)} stroke={WH} strokeWidth={3} opacity={0.18} strokeLinecap="round" />
          ))}
          {/* la meta */}
          <rect x={PLAT.x0} y={PLAT.top} width={PLAT.x1 - PLAT.x0} height={GROUND - PLAT.top + 3} fill="#141418" stroke={WH} strokeWidth={6} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${PLAT.x0 + 40 + i * 70} ${PLAT.top + 90 + 120 * rnd(i)} l18 30 l-12 26`} stroke={WH} strokeWidth={3} fill="none" opacity={0.18} strokeLinecap="round" />
          ))}
          <Flag f={f} x={PLAT.x1 - 50} y={PLAT.top} />
          {/* impactos en la pared */}
          {SLAMS.map((at, i) => (
            <Impact key={at} f={f} at={Math.round(at)} x={PLAT.x1 + 4} y={GROUND - 290} big={i === 0 ? 1.2 : 0.8} />
          ))}
          {/* escalera de ladrillos */}
          {BT.map((bt, i) => {
            if (f < bt) return null;
            const p = brickPos(i);
            const k = f - bt;
            const s = spring({ frame: k, fps: 30, config: { damping: 9, stiffness: 260, mass: 0.6 } });
            const glow = decay(f, bt, 10) + (i === NB - 1 ? 0.6 * decay(f, bt, 30) : 0);
            return <Brick key={i} x={p.x} y={p.y} s={0.3 + 0.7 * s} glow={glow} />;
          })}
          {BT.map((bt, i) => (i % 2 === 0 || i < 12 ? <Sparks key={`s${i}`} f={f} at={Math.round(bt)} x={brickPos(i).x + ST.w / 2} y={brickPos(i).y} n={i === NB - 1 ? 14 : 5} spread={i === NB - 1 ? 120 : 50} /> : null))}
          {/* polvo de las caídas */}
          {FALLS.map((at) => (
            <Dust key={at} f={f} at={Math.round(at)} x={XF + 40} y={GROUND} w={1.2} />
          ))}
          <Dust f={f} at={A_PLACE} x={aBrickPos.x + ST.w / 2} y={GROUND} w={0.7} />
          {/* el ladrillo de A */}
          {f >= A_PLACE ? <Brick x={aBrickPos.x} y={aBrickPos.y} s={0.3 + 0.7 * spring({ frame: f - A_PLACE, fps: 30, config: { damping: 9, stiffness: 260, mass: 0.6 } })} glow={0.4 + 0.6 * decay(f, A_PLACE, 16) + 0.25 * Math.sin(f * 0.2)} /> : null}
          <Sparks f={f} at={A_PLACE} x={aBrickPos.x + ST.w / 2} y={aBrickPos.y} n={12} spread={90} />
          {/* personajes */}
          <SpeedLines b={bA} f={f} on={runOn} dir={-1} />
          <Stick b={bB} glow={sun} />
          {Bs.brick ? <Brick x={handMid(bB).x - ST.w / 2} y={handMid(bB).y - BRICK_H / 2 - 6} rot={Bs.p.lean * 0.5} /> : null}
          <Stick b={bA} />
          {f >= TOSS_A && f < TOSS_B ? <Brick x={flyX - ST.w / 2} y={flyY - BRICK_H / 2} rot={(f - TOSS_A) * 38} glow={0.5} /> : null}
          {f >= TOSS_B && f < A_PLACE ? <Brick x={handMid(bA).x - ST.w / 2} y={handMid(bA).y - BRICK_H / 2 - 4} rot={-A.p.lean * 0.5} glow={0.3} /> : null}
          {/* el celular de A */}
          {phoneOn > 0 ? (
            <g opacity={phoneOn}>
              <polygon points={`${bA.HR.x},${bA.HR.y} ${bA.C.x - 6},${bA.C.y - 16} ${bA.C.x + 10},${bA.C.y + 22}`} fill="#9EC3FF" opacity={0.12 + 0.05 * Math.sin(f * 0.9)} />
              <rect x={bA.HR.x - 10} y={bA.HR.y - 18} width={20} height={34} rx={4} fill="#0B0B0D" stroke={WH} strokeWidth={4} />
              <rect x={bA.HR.x - 6} y={bA.HR.y - 14} width={12} height={26} rx={2} fill="#CFE0FF" opacity={0.7 + 0.3 * Math.sin(f * 1.3)} />
            </g>
          ) : null}
          {SLAMS.map((at) => (
            <Dizzy key={at} f={f} from={Math.round(at) + 8} to={Math.round(at) + 52} c={bA.C} />
          ))}
          {/* contadores */}
          <Pill x={Math.max(150, bB.C.x)} y={bB.C.y - 74} text={`DÍA ${day}`} s={pillB} />
          <Pill x={aBrickPos.x + ST.w / 2} y={GROUND - BRICK_H - 74} text="DÍA 1" s={pillA} />
        </g>
      </svg>
      <Motes f={f} />
      {/* sombra arriba en el plano cerrado del gancho: el borde del muro no cruza el texto */}
      {f < 86 ? <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.85) 22%, rgba(0,0,0,0) 36%)", opacity: 1 - ln(f, 62, 86) }} /> : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash }} /> : null}

      {/* texto */}
      <Words f={f} at={4} out={62} y={250} lines={[{ t: "ÉL QUIERE LLEGAR", size: 74 }, { t: "DE UN SALTO.", size: 98 }]} />
      <Words f={f} at={72} out={146} y={250} lines={[{ t: "ÉL PONE", size: 74 }, { t: "UNO POR DÍA.", size: 98, hot: ["UNO"] }]} />
      {bigCount > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 230, textAlign: "center", fontFamily: PF, fontWeight: 800, opacity: bigCount, transform: `translateY(${(1 - bigCount) * 30}px)` }}>
          <div style={{ fontSize: 70, color: WH, letterSpacing: "0.12em", lineHeight: 1 }}>DÍA</div>
          <div style={{ fontSize: 210, color: OR, lineHeight: 1, transform: `scale(${countPulse})`, textShadow: "0 0 40px rgba(255,90,31,0.55)", fontVariantNumeric: "tabular-nums" }}>{day}</div>
        </div>
      ) : null}
      <Words f={f} at={322} out={347} y={250} lines={[{ t: "NADIE LLEGA", size: 92 }, { t: "DE UN SALTO.", size: 92 }]} />
      <Words f={f} at={358} out={381} y={250} lines={[{ t: "SE LLEGA", size: 92 }, { t: "DE A UNO.", size: 112, hot: ["UNO"] }]} />
      <Words f={f} at={406} out={452} y={250} lines={[{ t: "¿DÍA 1", size: 120, hot: ["DÍA", "1"] }, { t: "O ALGÚN DÍA?", size: 92 }]} />
      <Words f={f} at={460} out={ESCALON_FRAMES + 20} y={240} lines={[{ t: "COMENTÁ «DÍA 1»", size: 76, hot: ["DÍA", "1"] }, { t: "si hoy ponés el tuyo", size: 54 }]} gap={10} />
      {f >= 470 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 470, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 40, letterSpacing: "0.22em", color: WH, opacity: 0.85 * ln(f, 470, 480) }}>
          HOOK HOUSE<span style={{ color: OR }}>.</span>
        </div>
      ) : null}

      {/* sonido */}
      <Audio src={staticFile("audio/musica_escalon.wav")} volume={0.5} />
      <Snd at={1} src="sfx/whoosh.wav" vol={0.22} />
      <Snd at={15} src="sfx/whoosh.wav" vol={0.3} />
      {SLAMS.map((at, i) => (
        <React.Fragment key={at}>
          <Snd at={Math.round(at)} src="sfx/slam.wav" vol={i === 0 ? 0.75 : 0.38} />
          <Snd at={Math.round(at)} src="sfx/hit.wav" vol={i === 0 ? 0.4 : 0.2} />
        </React.Fragment>
      ))}
      {FALLS.map((at, i) => (
        <Snd key={at} at={Math.round(at)} src="sfx/boom.wav" vol={i === 0 ? 0.1 : 0.06} />
      ))}
      <Snd at={122} src="sfx/whoosh.wav" vol={0.18} />
      <Snd at={250} src="sfx/whoosh.wav" vol={0.18} />
      <Snd at={76} src="sfx/hit.wav" vol={0.35} />
      {(() => {
        const out: React.ReactNode[] = [];
        let last = -99;
        BT.forEach((bt, i) => {
          if (i === 0) return;
          if (bt - last >= 4 || i === NB - 1) {
            out.push(<Snd key={`b${i}`} at={Math.round(bt)} src="sfx/pop.wav" vol={i === NB - 1 ? 0.55 : 0.12 + 0.08 * (i / NB)} />);
            last = bt;
          }
        });
        return out;
      })()}
      <Snd at={222} src="sfx/click.wav" vol={0.15} />
      <Snd at={229} src="sfx/click.wav" vol={0.15} />
      <Snd at={236} src="sfx/click.wav" vol={0.15} />
      <Snd at={358} src="sfx/whoosh.wav" vol={0.3} />
      <Snd at={TOSS_B} src="sfx/pop.wav" vol={0.4} />
      <Snd at={A_PLACE} src="sfx/hit.wav" vol={0.45} />
      <Snd at={A_PLACE} src="sfx/pop.wav" vol={0.35} />
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const EscalonPortada: React.FC = () => {
  const f = 336;
  const bA = solve({ p: SITUP, x: XF, air: 0, d: -1, sx: 1, ground: GROUND });
  const bB = solve({ p: { ...HOLD, head: -18, lean: -4 }, x: B_TOP_X, air: 0, d: 1, sx: 1, ground: PLAT.top });
  const camT = `translate(540 1240) scale(1.12) translate(-560 -1180)`;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, #101015 0%, #000 70%)" }}>
      <Sky f={40} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="solp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB070" stopOpacity={0.9} />
            <stop offset="35%" stopColor={OR} stopOpacity={0.45} />
            <stop offset="100%" stopColor={OR} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={camT}>
          <circle cx={560} cy={PLAT.top - 80} r={900} fill="url(#solp)" />
          <circle cx={560} cy={PLAT.top - 80} r={110} fill={OR} opacity={0.95} />
          <rect x={-800} y={GROUND} width={2700} height={900} fill="#08080A" />
          <line x1={-800} y1={GROUND} x2={1900} y2={GROUND} stroke={WH} strokeWidth={6} />
          <rect x={PLAT.x0} y={PLAT.top} width={PLAT.x1 - PLAT.x0} height={GROUND - PLAT.top + 3} fill="#141418" stroke={WH} strokeWidth={6} />
          <Flag f={f} x={PLAT.x1 - 50} y={PLAT.top} />
          {BT.map((_, i) => {
            const p = brickPos(i);
            return <Brick key={i} x={p.x} y={p.y} />;
          })}
          <Stick b={bB} glow={1} />
          <Brick x={handMid(bB).x - ST.w / 2} y={handMid(bB).y - BRICK_H / 2 - 6} />
          <Stick b={bA} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 40, width: 1000, top: 250, textAlign: "center", fontFamily: PF, fontWeight: 800, color: WH, lineHeight: 1.02, textShadow: "0 0 30px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.9)" }}>
        <div style={{ fontSize: 112 }}>NADIE LLEGA</div>
        <div style={{ fontSize: 112 }}>
          DE <span style={{ color: OR, textShadow: "0 0 34px rgba(255,90,31,0.7)" }}>UN SALTO</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
