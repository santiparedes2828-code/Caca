import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-caras-1.json";
import c2 from "../../data/captions-caras-2.json";
import c3 from "../../data/captions-caras-3.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Stopwatch } from "../props";
import { Snd, timing } from "../reelkit";
import { A, ContactShadow, FONT, LABEL, Paper, Rope, SAFE, SOUND, Slab, fall, impact, lin, yank } from "../system";
import { Camera, Hero, Medialuna, Phone, Stamp, ease, easeIO, type Cam, type PhoneState } from "./Medialuna";

// «Caras» — dato curioso de Hook House para negocios locales (2026-10-31), en 3 variantes de gancho:
// 1 cifra + misterio («las fotos con esto…») · 2 reto en tiempo real («mirá este feed, tenés un segundo») ·
// 3 historia del local («subís tu mejor producto… y pocos le dan me gusta»). El cuerpo es el mismo.
// Dato: Bakhshi, Shamma y Gilbert (Georgia Tech + Yahoo Labs), CHI 2014: en 1,1 millones de fotos de Instagram, las
// fotos con caras tuvieron 38 % más probabilidad de recibir me gusta. El estudio no explica el porqué.
// La panadera, la medialuna y los posts son ilustraciones creadas para el video.

const CAPS: Caption[][] = [c1, c2, c3];
const FLOOR = 1470;
const IVORY = "#FBF8F2";

// ---------- tiempos ----------
// En la variante 2 la voz se parte: después de «Tenés un segundo» espera a que el reloj de 1 s llegue a 0.
const makeTimes = (v: number) => {
  const T = timing(CAPS[v - 1]);
  const { W: W0, E: E0, idx } = T;
  let splitAt = 99999;
  let gap = 0;
  let tStart = -1;
  if (v === 2) {
    const iSeg = idx("segundo");
    const iQue = idx("qué", iSeg);
    tStart = E0(iSeg) + 2;
    splitAt = iQue;
    gap = Math.max(0, tStart + 30 + 4 - W0(iQue));
  }
  const W = (i: number) => W0(i) + (i >= splitAt ? gap : 0);
  const E = (i: number) => E0(i) + (i >= splitAt ? gap : 0);
  const cut = splitAt < 99999 ? W0(splitAt) - 2 : 0;
  return { T, W, E, idx, gap, cut, tStart, frames: T.frames + gap };
};
export const carasFrames = (v: number) => makeTimes(v).frames;

// ---------- ilustraciones ----------
// Panadera (dibujo plano en un cuadro de 100 × 100): gorro, cara, delantal y la medialuna en la mano
const Baker: React.FC<{ blink?: number; smile?: number; hold?: boolean }> = ({ blink = 0, smile = 1, hold = true }) => (
  <g>
    <path d="M14 100 C16 82 30 76 50 76 C70 76 84 82 86 100 Z" fill={IVORY} stroke={A.ink} strokeWidth={1.6} />
    <path d="M40 76 L50 90 L60 76" fill="none" stroke={A.ink} strokeWidth={1.4} />
    <rect x={45} y={64} width={10} height={12} fill="#D99B6C" />
    <ellipse cx={30} cy={50} rx={5} ry={9} fill="#5B3A26" />
    <ellipse cx={70} cy={50} rx={5} ry={9} fill="#5B3A26" />
    <circle cx={50} cy={50} r={19} fill="#E8B088" stroke={A.ink} strokeWidth={1.6} />
    <path d="M33 36 C35 22 65 22 67 36 Z" fill="#5B3A26" />
    <path d="M33 34 C28 20 38 12 44 17 C46 8 56 8 58 16 C64 11 74 19 67 34 Z" fill={IVORY} stroke={A.ink} strokeWidth={1.6} />
    <rect x={33} y={30} width={34} height={7} rx={2} fill={IVORY} stroke={A.ink} strokeWidth={1.6} />
    <path d="M38 45 Q42 42.5 46 45 M54 45 Q58 42.5 62 45" stroke={A.ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    <ellipse cx={42} cy={51} rx={2.3} ry={2.6 * (1 - blink)} fill={A.ink} />
    <ellipse cx={58} cy={51} rx={2.3} ry={2.6 * (1 - blink)} fill={A.ink} />
    <circle cx={37} cy={57} r={3} fill="#F09A88" opacity={0.6} />
    <circle cx={63} cy={57} r={3} fill="#F09A88" opacity={0.6} />
    <path d={`M43 59 Q50 ${59 + 6 * smile} 57 59`} stroke={A.ink} strokeWidth={1.6} fill={smile > 0.5 ? "#B5523F" : "none"} strokeLinecap="round" />
    {hold ? (
      <>
        <Medialuna cx={50} cy={86} s={0.12} id="bk" />
        <ellipse cx={36} cy={92} rx={5} ry={4} fill="#E8B088" stroke={A.ink} strokeWidth={1.2} />
        <ellipse cx={64} cy={92} rx={5} ry={4} fill="#E8B088" stroke={A.ink} strokeWidth={1.2} />
      </>
    ) : null}
  </g>
);

type Img = "medialuna" | "baker" | "cake" | "coffee" | "bread" | "cookies";
const BG: Record<Img, string> = { medialuna: "#4A2E1A", baker: "#EBD8BE", cake: "#F3E2D6", coffee: "#D9C2A2", bread: "#E8D3B5", cookies: "#F1E6D8" };
const Picture: React.FC<{ kind: Img; t: number }> = ({ kind, t }) => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0, display: "block" }}>
    <rect width={100} height={100} fill={BG[kind]} />
    {kind === "medialuna" ? (
      <>
        <ellipse cx={50} cy={70} rx={36} ry={8} fill="#2E1C10" />
        <Medialuna cx={50} cy={50} s={0.2} rot={3 * Math.sin(t)} id="pm" />
      </>
    ) : null}
    {kind === "baker" ? <Baker blink={Math.sin(t * 1.7) > 0.97 ? 1 : 0} /> : null}
    {kind === "cake" ? (
      <g>
        <ellipse cx={50} cy={78} rx={34} ry={6} fill="#E3CDBE" />
        <path d="M22 74 L50 40 L78 74 Z" fill="#F6E7D0" stroke={A.ink} strokeWidth={1.4} />
        <path d="M30 64 L70 64 M37 55 L63 55" stroke="#D97B8C" strokeWidth={3} />
        <circle cx={50} cy={38} r={4} fill="#C8323B" />
      </g>
    ) : null}
    {kind === "coffee" ? (
      <g>
        <ellipse cx={50} cy={78} rx={26} ry={5} fill="#BFA584" />
        <path d="M32 48 L68 48 L64 76 L36 76 Z" fill={IVORY} stroke={A.ink} strokeWidth={1.4} />
        <path d="M68 54 C78 54 78 66 66 66" fill="none" stroke={A.ink} strokeWidth={1.4} />
        <ellipse cx={50} cy={48} rx={18} ry={3.5} fill="#6B4426" />
        <path d={`M44 40 c-3 -4 3 -6 0 -10 M54 40 c-3 -4 3 -6 0 -10`} stroke="#FFF" strokeOpacity={0.7} strokeWidth={1.5} fill="none" />
      </g>
    ) : null}
    {kind === "bread" ? (
      <g>
        <ellipse cx={50} cy={74} rx={34} ry={6} fill="#CDB490" />
        <path d="M20 66 C20 44 80 44 80 66 Z" fill="#C98D4E" stroke={A.ink} strokeWidth={1.4} />
        <path d="M34 52 l6 6 M46 49 l6 6 M58 50 l6 6" stroke="#8A5A2B" strokeWidth={2} strokeLinecap="round" />
      </g>
    ) : null}
    {kind === "cookies" ? (
      <g>
        {[
          [36, 52],
          [62, 46],
          [52, 70],
        ].map(([x, y], k) => (
          <g key={k}>
            <circle cx={x} cy={y} r={13} fill="#D9A15F" stroke={A.ink} strokeWidth={1.3} />
            <circle cx={x - 4} cy={y - 3} r={2} fill="#4A2E1A" />
            <circle cx={x + 4} cy={y + 3} r={2} fill="#4A2E1A" />
          </g>
        ))}
      </g>
    ) : null}
  </svg>
);

// Sticker «?» que tapa la cara (lo arranca el anzuelo de Gancho)
const Sticker: React.FC<{ size: number; wiggle: number; off?: { x: number; y: number; r: number } }> = ({ size, wiggle, off = { x: 0, y: 0, r: 0 } }) => (
  <div style={{ position: "absolute", left: "50%", top: "50%", width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: size * 0.16, background: A.orange, boxShadow: "0 10px 20px rgba(14,13,11,0.3)", border: `5px solid ${A.ink}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: size * 0.7, color: A.ivory, transform: `translate(${off.x}px, ${off.y}px) rotate(${-8 + off.r + 6 * wiggle}deg)` }}>?</div>
);

// Post de Instagram ilustrado. (x, y) = centro; w = ancho; alto = 1,32 w
const Post: React.FC<{ x: number; y: number; w: number; img: Img; t: number; likes?: string; heart?: number; sticker?: number; stickerWiggle?: number; stickerOff?: { x: number; y: number; r: number }; lift?: number; scale?: number; opacity?: number; ring?: number; squash?: number }> = ({ x, y, w, img, t, likes, heart = 0, sticker = 0, stickerWiggle = 0, stickerOff, lift = 0, scale = 1, opacity = 1, ring = 0, squash = 0 }) => {
  const h = w * 1.32;
  return (
    <>
      <ContactShadow x={x} y={y + h / 2 * scale + 8} w={w * 0.85 * scale} h={lift} opacity={opacity} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) scale(${scale * (1 + 0.12 * squash)}, ${scale * (1 - 0.16 * squash)})` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.07, background: IVORY, border: `5px solid ${A.ink}`, boxSizing: "border-box", boxShadow: "0 18px 34px rgba(14,13,11,0.18)" }} />
        <div style={{ position: "absolute", left: w * 0.06, top: w * 0.05, width: w * 0.09, height: w * 0.09, borderRadius: "50%", background: A.ink }} />
        <div style={{ position: "absolute", left: w * 0.19, top: w * 0.075, width: w * 0.36, height: w * 0.04, borderRadius: w * 0.02, background: "#CFC7B8" }} />
        <div style={{ position: "absolute", left: w * 0.04, top: w * 0.18, width: w * 0.92, height: w * 0.92, overflow: "hidden", borderRadius: w * 0.03 }}>
          <Picture kind={img} t={t} />
          {sticker > 0 ? (
            <div style={{ position: "absolute", inset: 0, transform: `scale(${sticker})`, transformOrigin: "50% 50%" }}>
              <Sticker size={w * 0.62} wiggle={stickerWiggle} off={stickerOff} />
            </div>
          ) : null}
        </div>
        <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path transform={`translate(${w * 0.06} ${w * 1.15}) scale(${w / 330})`} d="M18 32 C-6 14 4 -4 18 6 C32 -4 42 14 18 32 Z" fill={heart > 0 ? A.orange : "none"} stroke={heart > 0 ? A.orangeDeep : A.ink} strokeWidth={4} />
          {likes ? (
            <text x={w * 0.2} y={w * 1.235} fontFamily={FONT} fontWeight={800} fontSize={w * 0.075} fill={A.ink} letterSpacing="-0.5">
              {likes}
            </text>
          ) : null}
        </svg>
        {ring > 0 ? <div style={{ position: "absolute", inset: -14, borderRadius: w * 0.09, border: `9px solid ${A.orange}`, opacity: ring, transform: `scale(${1.08 - 0.08 * ring})` }} /> : null}
      </div>
    </>
  );
};

// Corazones que suben (los me gusta)
const Hearts: React.FC<{ x: number; y: number; f: number; from: number; n?: number }> = ({ x, y, f, from, n = 7 }) => (
  <>
    {Array.from({ length: n }, (_, k) => {
      const local = f - from - k * 3;
      if (local < 0 || local > 40) return null;
      const p = local / 40;
      return (
        <svg key={k} width={60} height={60} viewBox="-2 -6 40 44" style={{ position: "absolute", left: x + Math.sin(k * 2.1 + local * 0.15) * 40 - 30, top: y - p * 300 - 30, opacity: 1 - p, transform: `scale(${0.6 + 0.5 * Math.sin(Math.PI * Math.min(1, p * 2))})` }}>
          <path d="M18 32 C-6 14 4 -4 18 6 C32 -4 42 14 18 32 Z" fill={A.orange} stroke={A.orangeDeep} strokeWidth={3} />
        </svg>
      );
    })}
  </>
);

// Cerebro con la «zona de las caras» (giro fusiforme, en la base)
const Brain: React.FC<{ x: number; y: number; s: number; zone: number; label: string; t: number; lift?: number; squash?: number; face?: number }> = ({ x, y, s, zone, label, t, lift = 0, squash = 0, face = 0 }) => (
  <div style={{ position: "absolute", left: x - 280, top: y - 230, width: 560, height: 460, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) scale(${s * (1 + 0.1 * squash)}, ${s * (1 - 0.14 * squash)})` }}>
    <svg width={560} height={460} viewBox="0 0 560 460" style={{ overflow: "visible" }}>
      <path d="M120 300 C60 300 40 230 80 200 C50 150 90 90 150 100 C160 50 230 30 270 60 C310 25 390 40 400 95 C460 90 510 140 480 200 C520 240 490 310 430 305 C420 350 360 370 320 340 C290 370 230 365 210 335 C170 350 125 335 120 300 Z" fill={IVORY} stroke={A.ink} strokeWidth={10} strokeLinejoin="round" />
      <path d="M150 160 C190 140 200 190 240 170 M300 120 C320 160 370 140 380 180 M140 240 C180 220 220 260 260 240 M330 220 C360 200 400 240 440 220 M270 60 C260 120 290 160 270 220 C255 270 280 300 300 330" fill="none" stroke={A.ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M300 340 C300 380 310 410 330 440" fill="none" stroke={A.ink} strokeWidth={10} strokeLinecap="round" />
      {zone > 0 ? (
        <>
          <ellipse cx={330} cy={290} rx={88 + 10 * Math.sin(t * 6) * zone} ry={40 + 5 * Math.sin(t * 6) * zone} fill={A.orange} opacity={0.22 * zone} />
          <ellipse cx={330} cy={290} rx={62} ry={26} fill={A.orange} opacity={zone} stroke={A.orangeDeep} strokeWidth={5} />
        </>
      ) : null}
      {face > 0 ? (
        <g transform={`translate(330 288) scale(${face})`}>
          <circle r={20} fill={IVORY} stroke={A.ink} strokeWidth={4} />
          <circle cx={-7} cy={-4} r={3} fill={A.ink} />
          <circle cx={7} cy={-4} r={3} fill={A.ink} />
          <path d="M-8 6 Q0 13 8 6" stroke={A.ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
    {zone > 0 && label ? (
      <div style={{ position: "absolute", left: 330 - 200, top: 352, width: 400, textAlign: "center", opacity: zone }}>
        <span style={{ display: "inline-block", fontFamily: LABEL, fontSize: 26, letterSpacing: "0.08em", color: IVORY, background: A.ink, padding: "5px 14px", borderRadius: 10 }}>{label}</span>
      </div>
    ) : null}
  </div>
);

const TagLine: React.FC<{ text: string; x: number; y: number; opacity?: number; align?: "left" | "center" }> = ({ text, x, y, opacity = 1, align = "left" }) => (
  <div style={{ position: "absolute", left: align === "center" ? x - 450 : x, width: align === "center" ? 900 : undefined, textAlign: align, top: y, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.07em", color: A.ink, opacity, whiteSpace: "nowrap" }}>
    <span style={{ color: A.orange }}>● </span>
    {text}
  </div>
);

// Ticket del CTA
export const NextTicket: React.FC<{ x: number; y: number; lift: number; squash: number }> = ({ x, y, lift, squash }) => {
  const w = 720;
  const h = 210;
  return (
    <>
      <ContactShadow x={x} y={y} w={w * 0.8} h={lift} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) scale(${1 + 0.2 * squash}, ${1 - 0.3 * squash})` }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
          <path d={`M16 8 H${w - 16} Q${w - 6} 8 ${w - 6} 18 V${h / 2 - 28} A28 28 0 0 0 ${w - 6} ${h / 2 + 28} V${h - 18} Q${w - 6} ${h - 8} ${w - 16} ${h - 8} H16 Q6 ${h - 8} 6 ${h - 18} V${h / 2 + 28} A28 28 0 0 0 6 ${h / 2 - 28} V18 Q6 8 16 8 Z`} fill={IVORY} stroke={A.ink} strokeWidth={8} />
          <line x1={84} y1={26} x2={84} y2={h - 26} stroke={A.orange} strokeWidth={6} strokeDasharray="10 9" />
          <text x={(84 + w - 30) / 2} y={90} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={A.ink} letterSpacing="-1.5">
            EN EL PRÓXIMO VIDEO:
          </text>
          <text x={(84 + w - 30) / 2} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={A.orange} letterSpacing="-1.5">
            MEJORO EL DE OTRO NEGOCIO
          </text>
        </svg>
      </div>
    </>
  );
};

// Subtítulos con la palabra que suena en píldora (estilo-altera.md, corrección 8)
export const Subs: React.FC<{ words: { text: string; at: number }[]; keys: number[]; f: number; fps: number }> = ({ words, keys, f, fps }) => {
  let cur = -1;
  for (let i = 0; i < words.length; i++) if (f >= words[i].at) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?!]$/.test(words[i - 1].text) || n >= 4)) {
      start = i;
      n = 0;
    }
    n++;
  }
  return (
    <div style={{ position: "absolute", top: 250, left: SAFE.left, width: SAFE.right - SAFE.left, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 80, lineHeight: 1.18, letterSpacing: "-0.04em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const local = f - words[i].at;
        const d = spring({ frame: local, fps, config: { damping: 13, stiffness: 320 } });
        const land = impact(local - 3);
        const now = i === cur;
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 6px", opacity: Math.min(1, d * 1.6), transformOrigin: "50% 100%", transform: `translateY(${(1 - d) * -26}px) scale(${1 + 0.06 * land}, ${1 - 0.1 * land})` }}>
            <span style={{ display: "inline-block", padding: "0 14px 6px", borderRadius: 16, background: now ? A.orange : "transparent", color: now ? A.ivory : keys.includes(i) ? A.orange : "#3A3732" }}>{words[i].text.replace(/[.,:…]+$/, "")}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Caras: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { T, W, E, idx, gap, cut, tStart, frames: END } = makeTimes(v);
  const words = T.words.map((w, i) => ({ text: w.text, at: W(i) }));
  const talkAt = (fr: number) => {
    for (let i = 0; i < T.words.length; i++) {
      const a = W(i);
      const b = Math.max(a + 3, E(i));
      if (fr >= a && fr < b) return 0.35 + 0.65 * Math.abs(Math.sin((fr - a) * 0.9));
    }
    return 0;
  };
  const talk = talkAt(f);

  // ---- índices del cuerpo (iguales en las 3 variantes) ----
  const iMid = idx("midieron");
  const i11 = idx("11"); // «1,1 millones» (idx quita la coma)
  const iEstudio = idx("estudio");
  const iPorque = idx("qué", iEstudio);
  const iCerebro = idx("cerebro");
  const iZona = idx("zona");
  const iCaras = idx("caras", iZona);
  const iEstoZ = idx("esto", iZona);
  const iAsi = idx("así");
  const iProducto = idx("producto", iAsi);
  const iMostra = idx("mostrá");
  const iVes = idx("ves", iMostra);
  const iCara = idx("cara", iVes + 2);
  const iSeguime = idx("seguime");
  const iMejorar = idx("mejorar", iSeguime);
  const i38 = idx("38");
  const iGusta = idx("gusta", i38);

  const B1 = W(iMid - 1); // «Lo midieron…»
  const B2 = W(iEstudio - 1); // «El estudio no dice por qué…»
  const B3 = W(iCaras); // revelación
  const B4 = W(iAsi);
  const B5 = W(iVes);
  const B6 = W(iSeguime);
  const tYank = W(iCaras);
  const tHook = v === 2 ? tYank : W(iEstoZ) - 2;

  const KEYS = [i38, idx("fotos", i11), iCaras, idx("producto", iAsi), iMostra, iCara, iSeguime];

  // ---------------- capas por tramo ----------------
  let layer: React.ReactNode = null;
  let gPose: Partial<GanchoPose> = {};
  let rope: React.ReactNode = null;
  let camZ = 1;
  let camC = { x: 540, y: 980 };
  const sounds: React.ReactNode[] = [];
  const g0: GanchoPose = { x: 190, y: FLOOR, scale: 0.8, t, talk, expr: "normal", armL: 30, armR: 40, look: { x: 1, y: -0.4 } };

  // «+38 %» que cae sobre el post con cara / con sticker
  const plus38 = (x: number, y: number) =>
    f >= W(i38) - 8 ? <Slab text="+38 %" x={x} y={y} size={124} color={A.orange} squash={0.5 * impact(f - W(i38))} lift={(1 - fall(f - (W(i38) - 8), fps)) * 1000} /> : null;

  // post «estrella» (la foto con cara): donde vive en cada variante durante el gancho
  const starHook = v === 1 ? { x: 745, y: 840 } : v === 2 ? { x: 540, y: 860 } : { x: 600, y: 900 };

  if (f < B1) {
    // ================= GANCHOS =================
    if (v === 1) {
      // Las fotos de Instagram con esto… tienen 38 % más chances de recibir me gusta.
      const iEsto = idx("esto");
      const dropL = fall(f + 6, fps);
      const dropR = fall(f + 2, fps);
      layer = (
        <>
          <Post x={335} y={840} w={320} img="medialuna" t={t} likes="me gusta" lift={(1 - dropL) * 900} squash={0.4 * impact(f - 3)} />
          <Post x={starHook.x} y={starHook.y} w={320} img="baker" t={t} likes={f >= W(iGusta) ? "+38 % me gusta" : "me gusta"} heart={f >= W(iGusta) ? 1 : 0} sticker={1} stickerWiggle={f >= W(iEsto) && f < W(iEsto) + 14 ? Math.sin((f - W(iEsto)) * 1.2) : 0} lift={(1 - dropR) * 900} squash={0.4 * impact(f - 7)} ring={lin(f, W(iEsto), W(iEsto) + 6)} />
          {plus38(starHook.x, 668)}
          <Hearts x={starHook.x - 120} y={1060} f={f} from={W(iGusta)} />
        </>
      );
      gPose = { expr: f >= W(i38) ? "surprised" : "normal", armR: f >= W(iEsto) ? 100 : 40, look: { x: 1, y: -0.5 } };
      sounds.push(<Snd key="l" at={3} src={SOUND.impacto} vol={0.5} />, <Snd key="e" at={W(iEsto)} src={SOUND.impacto} vol={0.3} />, <Snd key="38" at={W(i38)} src={SOUND.impacto} vol={0.8} />);
    } else if (v === 2) {
      // Mirá este feed. Tenés un segundo. ¿Qué miraste primero? ¿Fue esta? Las fotos con caras… 38 %
      const iFue = idx("fue");
      const iCaras1 = idx("caras");
      const imgs: Img[] = ["cake", "coffee", "bread", "cookies", "baker", "medialuna"];
      const k = tStart >= 0 ? Math.max(0, Math.min(1, (f - tStart) / 30)) : 0;
      const pick = lin(f, W(iFue), W(iFue) + 8);
      const solo = lin(f, W(iCaras1) - 4, W(iCaras1) + 8, 0, 1, easeIO);
      layer = (
        <>
          {imgs.map((img, n) => {
            const col = n % 3;
            const row = Math.floor(n / 3);
            const x = 250 + col * 290;
            const y = 690 + row * 360;
            const isStar = img === "baker";
            const drop = fall(f + 6 - n * 2, fps);
            const p = isStar ? solo : 0;
            return (
              <Post key={n} x={x + (starHook.x - x) * p} y={y + (starHook.y - y) * p} w={240 + 120 * p} img={img} t={t} likes={isStar && f >= W(iGusta) ? "+38 % me gusta" : "me gusta"} heart={isStar && f >= W(iGusta) ? 1 : 0} lift={(1 - drop) * 900} squash={0.4 * impact(f - 4 - n * 2)} opacity={isStar ? 1 : (1 - 0.65 * pick) * (1 - solo)} ring={isStar ? pick : 0} />
            );
          })}
          {f < W(iCaras1) + 10 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - lin(f, W(iCaras1), W(iCaras1) + 8) }}>
              <Stopwatch x={850} y={1460} value={(1 - k).toFixed(1).replace(".", ",")} ring={1 - k} scale={0.42} squash={0.5 * impact(f - (tStart + 30))} t={t} />
            </div>
          ) : null}
          {plus38(starHook.x, 640)}
          <Hearts x={starHook.x - 140} y={1100} f={f} from={W(iGusta)} />
        </>
      );
      gPose = { scale: 0.72, expr: f >= W(iFue) ? "smug" : f >= tStart ? "focused" : "normal", armR: f >= W(iFue) ? 105 : 60, look: { x: 1, y: -0.6 + 0.3 * Math.sin(f * 0.25) } };
      sounds.push(...[0, 1, 2, 3, 4, 5].map((n) => <Snd key={`d${n}`} at={4 + n * 2} src={SOUND.impacto} vol={0.18} />), <Snd key="go" at={tStart} src={SOUND.tension} vol={0.35} />, <Snd key="end" at={tStart + 30} src={SOUND.impacto} vol={0.7} />, <Snd key="38" at={W(i38)} src={SOUND.impacto} vol={0.8} />);
    } else {
      // Tenés un local, subís tu mejor producto… y pocos le dan me gusta. A lo mejor le falta esto. Las fotos con esto… 38 %
      const iSubis = idx("subís");
      const iPocos = idx("pocos");
      const iFalta = idx("falta");
      const iEsto = idx("esto", iFalta);
      const up = lin(f, W(iSubis), W(iSubis) + 24);
      const likesN = f < W(iPocos) ? 0 : Math.min(3, 1 + Math.floor((f - W(iPocos)) / 12));
      const slap = W(iEsto) - 6;
      layer = (
        <>
          <Post x={starHook.x} y={starHook.y} w={380} img={f < slap ? "medialuna" : "baker"} t={t} likes={f >= W(iGusta) ? "+38 % me gusta" : f >= W(iPocos) ? `${likesN} me gusta` : "me gusta"} heart={f >= W(iGusta) ? 1 : 0} sticker={f >= slap ? Math.min(1, spring({ frame: f - slap, fps, config: { damping: 10, stiffness: 260 } })) : 0} lift={(1 - fall(f + 4, fps)) * 900} squash={0.4 * impact(f - 4) + 0.3 * impact(f - slap - 4)} />
          {/* barra «publicando» mientras sube el producto */}
          {f >= W(iSubis) - 2 && up < 1 ? (
            <div style={{ position: "absolute", left: starHook.x - 160, top: starHook.y + 260, width: 320, fontFamily: LABEL, fontSize: 24, color: A.ink }}>
              PUBLICANDO…
              <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: "#D9D2C4" }}>
                <div style={{ width: `${up * 100}%`, height: "100%", borderRadius: 5, background: A.ink }} />
              </div>
            </div>
          ) : null}
          {plus38(starHook.x, 690)}
          <Hearts x={starHook.x - 150} y={1150} f={f} from={W(iGusta)} />
          <TagLine text="EJEMPLO ILUSTRADO" x={starHook.x - 190} y={starHook.y + 300} opacity={f >= W(iSubis) - 2 && up < 1 ? 0 : 1} />
        </>
      );
      gPose = { expr: f >= W(iPocos) && f < slap ? "squashed" : f >= W(i38) ? "surprised" : "normal", squash: f >= W(iPocos) && f < slap ? 0.25 : 0, armR: f >= slap ? 100 : 40, look: { x: 1, y: -0.4 } };
      sounds.push(<Snd key="l" at={4} src={SOUND.impacto} vol={0.5} />, <Snd key="s" at={slap + 4} src={SOUND.impacto} vol={0.6} />, <Snd key="38" at={W(i38)} src={SOUND.impacto} vol={0.8} />);
    }
  } else if (f < B2) {
    // ================= «Lo midieron en 1,1 millones de fotos» =================
    const k = lin(f, B1, W(i11) + 20, 0, 1, easeIO);
    const count = Math.round(1100000 * k);
    const cols = 11;
    const rows = 12;
    const shown = Math.floor(k * cols * rows);
    const imgs: Img[] = ["baker", "medialuna", "cake", "coffee", "bread", "cookies"];
    layer = (
      <>
        {Array.from({ length: cols * rows }, (_, n) => {
          if (n >= shown) return null;
          const c = n % cols;
          const r = Math.floor(n / cols);
          const pop = Math.min(1, (shown - n) / 6);
          return (
            <div key={n} style={{ position: "absolute", left: 92 + c * 80, top: 470 + r * 82, width: 70, height: 72, borderRadius: 8, overflow: "hidden", border: `3px solid ${A.ink}`, transform: `scale(${pop})`, opacity: 0.85 }}>
              <Picture kind={imgs[(n * 7) % 6]} t={t} />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 140, top: 860, width: 800, padding: "26px 0 30px", borderRadius: 28, background: IVORY, border: `6px solid ${A.ink}`, textAlign: "center", boxShadow: "0 20px 40px rgba(14,13,11,0.25)", transform: `scale(${0.9 + 0.1 * lin(f, B1, B1 + 8, 0, 1, ease)})` }}>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: "-0.045em", color: A.ink, lineHeight: 1 }}>{count.toLocaleString("es-AR")}</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: A.orange, letterSpacing: "-0.03em" }}>FOTOS DE INSTAGRAM</div>
          <div style={{ marginTop: 10, fontFamily: LABEL, fontSize: 22, letterSpacing: "0.06em", color: A.grey }}>GEORGIA TECH + YAHOO LABS · 2014</div>
        </div>
      </>
    );
    gPose = { expr: "surprised", armL: 150, armR: 150, look: { x: 0.5, y: -1 } };
  } else if (f < B4) {
    // ================= «El estudio no dice por qué… pero tu cerebro tiene una zona…» + revelación =================
    const brainIn = fall(f - (W(iCerebro) - 6), fps);
    const zone = lin(f, W(iZona), W(iZona) + 8);
    const revealed = v === 2 ? f >= W(iCaras) : f >= tYank + 6;
    const toCorner = lin(f, B3 - 6, B3 + 8, 0, 1, easeIO) * (v === 2 ? 0 : 1);
    const qDrop = W(iPorque) - 6;
    // post con sticker que vuelve para la revelación (variantes 1 y 3)
    const postIn = v === 2 ? 0 : lin(f, tHook - 8, tHook + 4, 0, 1, ease);
    const yk = yank(f - tYank, 8);
    const postPos = { x: 660, y: 930 };
    const stickerScreen = { x: postPos.x, y: postPos.y - 380 * 1.32 / 2 + 380 * 0.18 + 380 * 0.46 };
    layer = (
      <>
        {f < qDrop + 16 ? (
          <div style={{ position: "absolute", left: 140, top: 860, width: 800, padding: "26px 0 30px", borderRadius: 28, background: IVORY, border: `6px solid ${A.ink}`, textAlign: "center", boxShadow: "0 20px 40px rgba(14,13,11,0.25)", transformOrigin: "50% 100%", transform: `scale(${1 + 0.1 * Math.min(1, Math.max(0, (f - qDrop - 6) / 4))}, ${1 - 0.75 * Math.min(1, Math.max(0, (f - qDrop - 6) / 4))})`, opacity: 1 - lin(f, qDrop + 10, qDrop + 16) }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: "-0.045em", color: A.ink, lineHeight: 1 }}>1.100.000</div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: A.orange, letterSpacing: "-0.03em" }}>FOTOS DE INSTAGRAM</div>
            <div style={{ marginTop: 10, fontFamily: LABEL, fontSize: 22, letterSpacing: "0.06em", color: A.grey }}>GEORGIA TECH + YAHOO LABS · 2014</div>
          </div>
        ) : null}
        {f < W(iCerebro) + 4 ? <Slab text="¿POR QUÉ?" x={540} y={1090} size={120} squash={0.4 * impact(f - qDrop - 8)} lift={(1 - fall(f - qDrop, fps)) * 1000} opacity={1 - lin(f, W(iCerebro) - 4, W(iCerebro) + 4)} /> : null}
        {f < B2 + 30 ? <TagLine text="EL ESTUDIO NO LO EXPLICA" x={540} y={1120} align="center" opacity={lin(f, qDrop + 8, qDrop + 14) * (1 - lin(f, W(iCerebro) - 4, W(iCerebro) + 4))} /> : null}
        {f >= W(iCerebro) - 6 ? (
          <Brain x={560 + (300 - 560) * toCorner} y={860 + (620 - 860) * toCorner} s={1 - 0.45 * toCorner} zone={zone} label={revealed ? "ZONA DE LAS CARAS" : "ESTA ZONA"} t={t} lift={(1 - brainIn) * 1000} squash={0.4 * impact(f - W(iCerebro) - 2)} face={v === 2 ? spring({ frame: f - W(iCaras), fps, config: { damping: 10, stiffness: 260 } }) : revealed ? 1 : 0} />
        ) : null}
        {v !== 2 && f >= W(iEstoZ) - 2 && f < tHook ? (
          // el «?» aparece en la zona al decir «esto»
          <div style={{ position: "absolute", left: 560 + 50 - 50, top: 860 - 230 + 290 - 50, width: 100, height: 100 }}>
            <Sticker size={100 * spring({ frame: f - W(iEstoZ), fps, config: { damping: 10, stiffness: 260 } })} wiggle={0} />
          </div>
        ) : null}
        {postIn > 0 ? (
          <Post x={postPos.x} y={postPos.y + (1 - postIn) * 900} w={380} img="baker" t={t} likes="+38 % me gusta" heart={1} sticker={yk < 1 ? 1 : 0} stickerOff={{ x: yk * 900, y: -yk * 300, r: yk * 60 }} squash={0.35 * impact(f - tYank - 8)} />
        ) : null}
        {revealed ? <Hearts x={postPos.x - 150} y={1150} f={f} from={tYank + 6} n={5} /> : null}
        {/* sticker arrancado que sale volando */}
        {v !== 2 && yk >= 1 && f < tYank + 30 ? (
          <div style={{ position: "absolute", left: stickerScreen.x - 118 + (f - tYank) * 30, top: stickerScreen.y - 118 - (f - tYank) * 12 + 0.6 * (f - tYank) ** 2, width: 236, height: 236, transform: `rotate(${(f - tYank) * 14}deg)` }}>
            <Sticker size={236} wiggle={0} />
          </div>
        ) : null}
      </>
    );
    const pulling = v !== 2 && f >= tHook && f < tYank + 8;
    gPose = { expr: revealed ? "happy" : pulling ? "strain" : f >= W(iCerebro) ? "focused" : "normal", armR: pulling ? 105 : 50, lean: pulling ? -6 - 8 * lin(f, tHook, tYank) : 0, hookOut: pulling, look: { x: 1, y: -0.6 } };
    if (pulling) {
      const g = { ...g0, ...gPose };
      const ant = antennaWorld(g);
      const bx = stickerScreen.x - 110 + yk * 900;
      const by = stickerScreen.y - yk * 300;
      rope = <Rope ax={ant.x} ay={ant.y} bx={bx} by={by} slack={lin(f, tHook, tHook + 10, 0.85, 0.05)} buzz={f >= tHook + 10 && f < tYank ? 0.5 : 0} t={t} />;
      sounds.push(<Snd key="ten" at={tHook + 2} src={SOUND.tension} vol={0.35} />);
    }
    sounds.push(<Snd key="q" at={qDrop + 8} src={SOUND.impacto} vol={0.5} />, <Snd key="b" at={W(iCerebro) + 2} src={SOUND.impacto} vol={0.5} />, <Snd key="z" at={W(iZona)} src={SOUND.impacto} vol={0.25} />);
    if (v !== 2) sounds.push(<Snd key="y" at={tYank} src={SOUND.tiron} vol={0.6} />, <Snd key="r" at={tYank + 8} src={SOUND.impacto} vol={0.6} />);
    else sounds.push(<Snd key="c" at={W(iCaras)} src={SOUND.impacto} vol={0.6} />);
  } else if (f < B5) {
    // ================= «En el video de tu negocio, no muestres solo el producto: mostrá quién lo hace» =================
    const p: PhoneState = { x: 640, y: 1062, s: 0.9, lift: (1 - fall(f - B4 + 2, fps)) * 1000 };
    const bakerIn = lin(f, W(iMostra) - 2, W(iMostra) + 10, 0, 1, ease);
    layer = (
      <Phone
        p={p}
        play={lin(f, B4, B5, 0.05, 0.6)}
        squash={0.4 * impact(f - B4 - 8)}
        overlay={
          <>
            <Stamp kind="x" x={110} y={700} f={f} at={W(iProducto)} out={W(iMostra) - 2} />
            <Stamp kind="ok" x={110} y={700} f={f} at={W(iMostra) + 10} out={9999} />
          </>
        }
      >
        <Hero t={t} f={f} from={B4} />
        <svg viewBox="0 0 100 100" width={420} height={420} style={{ position: "absolute", left: 452 - 360 + (1 - bakerIn) * 460, top: 826 - 420, overflow: "visible" }}>
          <Baker blink={Math.sin(t * 1.7) > 0.97 ? 1 : 0} hold={false} />
        </svg>
      </Phone>
    );
    gPose = { expr: f >= W(iMostra) ? "happy" : "normal", armR: f >= W(iMostra) ? 110 : 60 };
    sounds.push(<Snd key="p" at={B4 + 8} src={SOUND.impacto} vol={0.5} />, <Snd key="x" at={W(iProducto)} src={SOUND.impacto} vol={0.35} />, <Snd key="m" at={W(iMostra)} src={SOUND.tiron} vol={0.35} />, <Snd key="ok" at={W(iMostra) + 10} src={SOUND.impacto} vol={0.4} />);
  } else if (f < B6) {
    // ================= «¿Ves? Por eso este video tiene un personaje con cara» =================
    const z = lin(f, B5, B5 + 10, 0, 1, easeIO);
    camZ = 1 + 0.75 * z;
    camC = { x: 540 + (330 - 540) * z, y: 980 + (1240 - 980) * z };
    layer = (
      <>
        <Phone p={{ x: 640, y: 1062, s: 0.9 }} play={0.6} overlay={null}>
          <Hero t={t} f={f} from={B4} />
          <svg viewBox="0 0 100 100" width={360} height={360} style={{ position: "absolute", left: 452 - 330, top: 826 - 360, overflow: "visible" }}>
            <Baker hold={false} />
          </svg>
        </Phone>
        {f >= W(iCara) - 2 ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <ellipse cx={200} cy={1235} rx={150} ry={130} fill="none" stroke={A.orange} strokeWidth={10} strokeDasharray={`${lin(f, W(iCara) - 2, W(iCara) + 8) * 900} 900`} strokeLinecap="round" />
          </svg>
        ) : null}
      </>
    );
    gPose = { expr: f >= W(iCara) ? "smug" : "happy", armL: 30, armR: f >= W(iVes) + 4 ? 140 + 15 * Math.sin(f * 0.5) : 60, look: { x: 0.2, y: 0 } };
    sounds.push(<Snd key="c" at={W(iCara)} src={SOUND.impacto} vol={0.4} />);
  } else {
    // ================= CTA: «Seguime: voy a mejorar otro video de un negocio en el próximo» =================
    const tBox = B6 + 4;
    const cheer = f >= tBox;
    gPose = { x: 250, scale: 0.85, expr: f >= W(iMejorar) ? "happy" : cheer ? "happy" : "focused", armL: cheer ? 165 : 30, armR: cheer ? 165 : 95, squash: cheer ? -0.12 * Math.max(0, impact(f - tBox - 2)) : 0, look: cheer ? { x: 0.6, y: -1 } : { x: 1, y: 0 } };
    layer = (
      <>
        <Phone p={{ x: 760, y: 1195, s: 0.6 }} play={0.7} overlay={null}>
          <Hero t={t} f={f} from={B4} />
          <svg viewBox="0 0 100 100" width={360} height={360} style={{ position: "absolute", left: 452 - 330, top: 826 - 360, overflow: "visible" }}>
            <Baker hold={false} />
          </svg>
        </Phone>
        <div style={{ position: "absolute", left: 72, width: 858, top: 360, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 100, letterSpacing: "-0.045em", color: A.ink }}>
          <span style={{ opacity: lin(f, B6, B6 + 5) }}>Seguime</span>
          <span style={{ background: A.orange, color: A.ivory, padding: "2px 26px 10px", borderRadius: 18, transformOrigin: "50% 100%", transform: `translateY(${-(1 - fall(f - (tBox - 8), fps)) * 700}px) scale(${1 + 0.22 * impact(f - tBox)}, ${f < tBox - 8 ? 0 : 1 - 0.3 * impact(f - tBox)})`, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>SEGUIR</span>
        </div>
        {f >= W(iMejorar) - 6 ? <NextTicket x={540} y={830} lift={(1 - fall(f - (W(iMejorar) - 6), fps)) * 1200} squash={0.4 * impact(f - W(iMejorar) - 1)} /> : null}
      </>
    );
    sounds.push(<Snd key="b" at={tBox} src={SOUND.impacto} vol={0.6} />, <Snd key="k" at={W(iMejorar)} src={SOUND.impacto} vol={0.5} />);
  }

  const pose: GanchoPose = { ...g0, ...gPose };
  const scenes = [0, B1, B2, B4, B5, B6, END];
  let si = 0;
  while (si < scenes.length - 2 && f >= scenes[si + 1]) si++;
  const push = 1 + 0.03 * lin(f, scenes[si], scenes[si + 1]);
  const cam: Cam = { z: camZ, cx: camC.x, cy: camC.y };
  const hideCaps = f >= B6;
  const topTag = f < B1 ? (v === 3 ? "PARA NEGOCIOS LOCALES" : "DATO REAL · PARA NEGOCIOS") : "";

  return (
    <Paper>
      <AbsoluteFill style={{ transformOrigin: "540px 1020px", transform: `scale(${push})` }}>
        <Camera cam={cam}>
          {layer}
          <ContactShadow x={pose.x} y={FLOOR} w={250 * (pose.scale ?? 1)} />
          <Gancho {...pose} />
          {rope}
        </Camera>
      </AbsoluteFill>
      {topTag ? <TagLine text={topTag} x={72} y={448} /> : null}
      {hideCaps ? null : <Subs words={words} keys={KEYS} f={f} fps={fps} />}

      {gap > 0 ? (
        <>
          <Sequence from={0} durationInFrames={cut}>
            <Audio src={staticFile(`audio/voz_caras_${v}.wav`)} trimAfter={cut} />
          </Sequence>
          <Sequence from={cut + gap}>
            <Audio src={staticFile(`audio/voz_caras_${v}.wav`)} trimBefore={cut} />
          </Sequence>
        </>
      ) : (
        <Audio src={staticFile(`audio/voz_caras_${v}.wav`)} />
      )}
      <Audio src={staticFile(`audio/musica_caras_${v}.wav`)} volume={0.22} />
      {sounds}
    </Paper>
  );
};

// ---------- portada: el post con el sticker y el +38 %, sin revelar qué hay debajo ----------
const COVER: Record<number, [string, string]> = { 1: ["LAS FOTOS CON", "ESTO TIENEN"], 2: ["¿QUÉ MIRASTE", "PRIMERO?"], 3: ["¿POCOS ME GUSTA?", "LE FALTA ESTO"] };
export const CarasPortada: React.FC<{ v?: number }> = ({ v = 1 }) => (
  <Paper>
    <div style={{ position: "absolute", left: 72, top: 250, width: 920, fontFamily: FONT, fontWeight: 800, fontSize: v === 3 ? 96 : 108, lineHeight: 0.98, letterSpacing: "-0.045em", color: A.ink }}>
      {COVER[v][0]}
      <br />
      <span style={{ color: A.orange }}>{COVER[v][1]}</span>
    </div>
    <Post x={620} y={1000} w={420} img="baker" t={0} likes="+38 % me gusta" heart={1} sticker={1} />
    <Slab text="+38 %" x={620} y={790} size={130} color={A.orange} />
    <ContactShadow x={190} y={FLOOR} w={210} />
    <Gancho x={190} y={FLOOR} scale={0.8} t={1.3} expr="surprised" armL={30} armR={100} look={{ x: 1, y: -0.5 }} />
  </Paper>
);

