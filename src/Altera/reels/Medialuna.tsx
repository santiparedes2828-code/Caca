import React from "react";
import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import caps from "../../data/captions-medialuna.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Thought } from "../props";
import { Snd, timing } from "../reelkit";
import { A, Captions, ContactShadow, FONT, LABEL, Paper, Rope, SOUND, Slab, fall, impact, lin, yank } from "../system";

// «La medialuna» — reel de Hook House para negocios locales (2026-10-30).
// Estructura tomada del reel de @altumapp ya analizado (analisis23/altum.md): detalle señalado con aro y zoom → mito
// → «falso» → «N cambios» con contador → cada cambio aplicado → barrido antes/después → resultado → CTA. Idea, guion,
// personaje y diseño propios; a diferencia de la referencia, se entregan los TRES cambios.
// La panadería y su video son un EJEMPLO CREADO PARA LA DEMO (rotulado en pantalla): no es un cliente.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });

const T = timing(caps);
const { W, idx, talkAt } = T;
export const MEDIALUNA_FRAMES = T.frames;

// ---------- momentos (fotogramas, salen de la voz) ----------
const iProducto = idx("producto");
const iAsi = idx("así");
const iY = idx("y");
const iCamara1 = idx("cámara");
const iCara = idx("cara");
const iFalso = idx("falso");
const iEl = idx("el", iFalso);
const iCamara2 = idx("cámara", iEl);
const iEditado = idx("editado");
const iTe = idx("te", iEditado);
const iTres = idx("tres", iTe);
const iUno = idx("uno");
const iCorto = idx("corto");
const iLogo = idx("logo");
const iArranque = idx("arranque");
const iDos = idx("dos");
const iAcerco = idx("acerco");
const iMedialuna = idx("medialuna");
const iHasta = idx("hasta");
const iPantalla = idx("pantalla");
const iTres2 = idx("tres", iPantalla);
const iTexto = idx("texto");
const iComprarla = idx("comprarla");
const iLocal = idx("local");
const iMismo = idx("mismo");
const iVideo1 = idx("video", iMismo);
const iMisma = idx("misma");
const iCamara3 = idx("cámara", iMisma);
const iAhora = idx("ahora");
const iBuscarla = idx("buscarla");
const iSi2 = idx("si", iBuscarla);
const iNegocio = idx("negocio");
const iMandame = idx("mandame");
const iVIDEO = idx('"video');
const iMuestro = idx("muestro", iVIDEO);

const S2 = W(iY); // mito
const S3 = W(iEl); // «el problema no es la cámara»
const S4 = W(iTe); // tres cambios
const S5 = W(iUno); // cambio 1
const S6 = W(iDos); // cambio 2
const S7 = W(iTres2); // cambio 3
const S8 = W(iMismo); // antes / después
const S9 = W(iSi2); // CTA
const END = T.frames;

const KEYS = [iProducto, iCara, iEditado, iTres, iLogo, iPantalla, iComprarla, iVideo1, iBuscarla, iNegocio];
const FLOOR = 1470;
export const ease = (x: number) => 1 - (1 - x) ** 3;
export const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// ---------- el celular (el video del negocio) ----------
// Pantalla en coordenadas locales de 452 × 826; el teléfono mide 480 × 854 y se coloca por su centro.
export const SCR = { w: 452, h: 826 };
export type PhoneState = { x: number; y: number; s: number; rot?: number; lift?: number };
export const LAYOUT: PhoneState = { x: 610, y: 1015, s: 1 };
export const toScreen = (p: PhoneState, lx: number, ly: number) => ({ x: p.x + (lx - SCR.w / 2) * p.s, y: p.y + (ly - SCR.h / 2) * p.s });
export const mixP = (a: PhoneState, b: PhoneState, k: number): PhoneState => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: a.s + (b.s - a.s) * k, rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * k, lift: (a.lift ?? 0) + ((b.lift ?? 0) - (a.lift ?? 0)) * k });

export const Phone: React.FC<{ p: PhoneState; play: number; children: React.ReactNode; overlay?: React.ReactNode; squash?: number }> = ({ p, play, children, overlay, squash = 0 }) => (
  <>
    <ContactShadow x={p.x} y={p.y + 427 * p.s + 10} w={420 * p.s} h={p.lift ?? 0} opacity={0.8} />
    <div
      style={{
        position: "absolute",
        left: p.x - 240,
        top: p.y - 427,
        width: 480,
        height: 854,
        transformOrigin: "50% 100%",
        transform: `translateY(${-(p.lift ?? 0) + 427 * (p.s - 1)}px) scale(${p.s * (1 + 0.12 * squash)}, ${p.s * (1 - 0.16 * squash)}) rotate(${p.rot ?? 0}deg)`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 54, background: A.ink, boxShadow: "0 30px 60px rgba(14,13,11,0.28), 0 4px 10px rgba(14,13,11,0.25)" }} />
      <div style={{ position: "absolute", left: 14, top: 14, width: SCR.w, height: SCR.h, borderRadius: 42, overflow: "hidden", background: "#111" }}>
        {children}
        {/* barra de reproducción: el video siempre avanza */}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.35)" }}>
          <div style={{ width: `${Math.max(0, Math.min(1, play)) * 100}%`, height: "100%", borderRadius: 3, background: "#FFFFFF" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, top: 14, width: SCR.w, height: SCR.h }}>{overlay}</div>
    </div>
  </>
);

// ---------- la medialuna ----------
// Gajos en arco (puntas abajo), dibujados de las puntas al centro; dorada con brillo.
export const Medialuna: React.FC<{ cx: number; cy: number; s: number; rot?: number; id: string }> = ({ cx, cy, s, rot = 0, id }) => {
  const L = 7;
  const R = 112;
  const lobes = Array.from({ length: L }, (_, k) => {
    const u = k / (L - 1);
    const th = ((204 - 228 * u) * Math.PI) / 180;
    const bulk = Math.sin(Math.PI * u);
    const ang = (Math.atan2(-Math.cos(th), -Math.sin(th)) * 180) / Math.PI;
    return { px: Math.cos(th) * R, py: -Math.sin(th) * R + 50, rx: 40 + 30 * bulk, ry: 22 + 44 * bulk, ang, bulk };
  }).sort((a, b) => a.bulk - b.bulk);
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-g`} cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#F9CF7A" />
          <stop offset="55%" stopColor="#DE9133" />
          <stop offset="100%" stopColor="#A4561B" />
        </radialGradient>
      </defs>
      {lobes.map((l, i) => (
        <g key={i} transform={`translate(${l.px} ${l.py}) rotate(${l.ang})`}>
          <ellipse rx={l.rx} ry={l.ry} fill={`url(#${id}-g)`} stroke="#7A3E12" strokeWidth={5} />
          <ellipse cx={0} cy={-l.ry * 0.38} rx={l.rx * 0.5} ry={l.ry * 0.2} fill="rgba(255,238,196,0.55)" />
          <path d={`M${-l.rx * 0.6} ${l.ry * 0.25} Q0 ${l.ry * 0.45} ${l.rx * 0.6} ${l.ry * 0.25}`} stroke="rgba(122,62,18,0.45)" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

// ---------- ANTES: la panadería en plano general (ejemplo) ----------
const TILT = -2.2;
const tilt = (x: number, y: number) => {
  const a = (TILT * Math.PI) / 180;
  const dx = x - SCR.w / 2;
  const dy = y - SCR.h / 2;
  return { x: SCR.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: SCR.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
};
const ML_RAW = { x: 372, y: 344 };
export const ML = tilt(ML_RAW.x, ML_RAW.y); // dónde queda la medialuna en la pantalla del celular

const Bread: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 46 }) => (
  <g>
    <ellipse cx={x} cy={y - w * 0.22} rx={w / 2} ry={w * 0.24} fill="#A98A62" stroke="#5E5446" strokeWidth={3} />
    <path d={`M${x - w * 0.22} ${y - w * 0.3} l${w * 0.1} ${w * 0.12} M${x} ${y - w * 0.34} l${w * 0.1} ${w * 0.12} M${x + w * 0.2} ${y - w * 0.3} l${w * 0.08} ${w * 0.1}`} stroke="#6E5A3E" strokeWidth={3} strokeLinecap="round" />
  </g>
);
const Jar: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 52 }) => (
  <g>
    <rect x={x - 18} y={y - h} width={36} height={h} rx={8} fill="#C9C2B4" stroke="#5E5446" strokeWidth={3} />
    <rect x={x - 20} y={y - h - 8} width={40} height={10} rx={3} fill="#7C7264" />
  </g>
);

export const Shop: React.FC<{ t: number }> = ({ t }) => (
  <svg width={SCR.w} height={SCR.h} viewBox={`0 0 ${SCR.w} ${SCR.h}`} style={{ position: "absolute", inset: 0 }}>
    <g transform={`rotate(${TILT} ${SCR.w / 2} ${SCR.h / 2})`}>
      <rect x={-80} y={-80} width={SCR.w + 160} height={SCR.h + 160} fill="#D8D1C2" />
      {/* pizarrón y reloj */}
      <rect x={34} y={92} width={150} height={118} rx={6} fill="#3E3C37" stroke="#6E6556" strokeWidth={6} />
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={52} x2={150 - k * 14} y1={118 + k * 24} y2={118 + k * 24} stroke="#A19B90" strokeWidth={5} strokeLinecap="round" />
      ))}
      <circle cx={330} cy={140} r={32} fill="#EEE9DE" stroke="#5E5446" strokeWidth={5} />
      <path d={`M330 140 L330 ${140 - 20} M330 140 L${330 + 14 * Math.cos(t)} ${140 + 14 * Math.sin(t)}`} stroke="#3E3C37" strokeWidth={4} strokeLinecap="round" />
      {/* estantes */}
      {[260, 362].map((y) => (
        <rect key={y} x={-20} y={y} width={SCR.w + 40} height={11} fill="#8E7F6A" />
      ))}
      <Jar x={40} y={260} />
      <Jar x={86} y={260} h={40} />
      <Bread x={150} y={260} />
      <Bread x={204} y={260} w={40} />
      <rect x={240} y={214} width={62} height={46} rx={4} fill="#C2B6A0" stroke="#5E5446" strokeWidth={3} />
      <Jar x={330} y={260} h={46} />
      <path d="M392 260 L382 226 L418 226 L408 260 Z" fill="#8C7A60" stroke="#5E5446" strokeWidth={3} />
      <path d="M400 226 C390 200 380 196 372 200 M400 226 C404 196 414 190 424 196" stroke="#6F8064" strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={26} y={318} width={70} height={44} rx={4} fill="#C2B6A0" stroke="#5E5446" strokeWidth={3} />
      <Bread x={128} y={362} w={42} />
      <Bread x={176} y={362} w={38} />
      <Jar x={228} y={362} h={44} />
      <rect x={262} y={330} width={44} height={32} rx={4} fill="#B3A891" stroke="#5E5446" strokeWidth={3} />
      {/* la medialuna: chiquita, al fondo */}
      <ellipse cx={ML_RAW.x} cy={360} rx={26} ry={5} fill="#EDE8DE" stroke="#5E5446" strokeWidth={2} />
      <Medialuna cx={ML_RAW.x} cy={ML_RAW.y - 8} s={0.1} id="mini" />
      <Jar x={420} y={362} h={38} />
      {/* vitrina y mostrador */}
      <rect x={-20} y={430} width={SCR.w + 40} height={110} fill="#C8BBA3" />
      <rect x={40} y={440} width={250} height={90} rx={6} fill="rgba(255,255,255,0.28)" stroke="#8E7F6A" strokeWidth={4} />
      {[78, 128, 178, 228].map((x) => (
        <ellipse key={x} cx={x} cy={506} rx={20} ry={11} fill="#B79A72" opacity={0.7} />
      ))}
      <rect x={312} y={452} width={104} height={78} rx={8} fill="#6E6A62" stroke="#3E3C37" strokeWidth={4} />
      <rect x={326} y={464} width={60} height={22} rx={3} fill="#9DB0A0" />
      <rect x={-20} y={540} width={SCR.w + 40} height={18} fill="#8E7F6A" />
      <rect x={-20} y={558} width={SCR.w + 40} height={340} fill="#B4A387" />
      {[600, 660, 720, 780].map((y) => (
        <line key={y} x1={-20} x2={SCR.w + 40} y1={y} y2={y} stroke="#A39276" strokeWidth={3} />
      ))}
    </g>
    {/* luz plana de celular: lavado gris y viñeta */}
    <rect width={SCR.w} height={SCR.h} fill="rgba(120,112,98,0.16)" />
    <rect width={SCR.w} height={SCR.h} fill="url(#vig)" />
    <defs>
      <radialGradient id="vig" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
      </radialGradient>
    </defs>
  </svg>
);

// Texto genérico del video original: el nombre del local
export const OldText: React.FC<{ squash?: number; dx?: number; dy?: number; rot?: number; outline?: number; opacity?: number }> = ({ squash = 0, dx = 0, dy = 0, rot = 0, outline = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 0, width: SCR.w, top: 52, textAlign: "center", opacity, transformOrigin: "50% 100%", transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scaleY(${1 - 0.82 * squash})` }}>
    <div style={{ display: "inline-block", padding: "6px 14px", border: outline > 0 ? `4px dashed rgba(255,255,255,${0.85 * outline})` : "4px solid transparent", borderRadius: 12 }}>
      <div style={{ fontFamily: "Poppins", fontWeight: 600, fontSize: 28, lineHeight: 1.25, color: "#FFFFFF", textShadow: "0 2px 6px rgba(0,0,0,0.55)" }}>
        BIENVENIDOS A
        <br />
        PANADERÍA
      </div>
    </div>
  </div>
);

// ---------- DESPUÉS: la medialuna llenando la pantalla ----------
const Steam: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => (
  <>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.55 + i / 3) % 1;
      const yy = y - ph * 150;
      const xx = x + (i - 1) * 70;
      return <path key={i} d={`M${xx} ${yy} c-22 -26 22 -44 0 -70 c-22 -26 22 -44 0 -70`} stroke="rgba(255,244,226,1)" strokeOpacity={0.42 * Math.sin(Math.PI * ph)} strokeWidth={9} fill="none" strokeLinecap="round" />;
    })}
  </>
);
const Crumbs: React.FC<{ t: number }> = ({ t }) => (
  <>
    {Array.from({ length: 12 }, (_, k) => {
      const ph = (t * (0.25 + (k % 3) * 0.08) + k * 0.137) % 1;
      const x = 60 + ((k * 97) % 330);
      const y = 140 + ph * 640;
      return <circle key={k} cx={x + 8 * Math.sin(t * 2 + k)} cy={y} r={3 + (k % 3)} fill="#F2C06A" opacity={0.65 * Math.sin(Math.PI * ph)} />;
    })}
  </>
);
export const Hero: React.FC<{ t: number; f: number; from: number }> = ({ t, f, from }) => {
  const k = f - from;
  const push = 1 + 0.06 * Math.min(1, Math.max(0, k) / 240);
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, #6A4428 0%, #33200F 55%, #170D06 100%)" }}>
      <svg width={SCR.w} height={SCR.h} viewBox={`0 0 ${SCR.w} ${SCR.h}`} style={{ position: "absolute", inset: 0, transformOrigin: "50% 55%", transform: `scale(${push})` }}>
        <ellipse cx={226} cy={598} rx={210} ry={44} fill="#4A2D18" />
        <ellipse cx={226} cy={590} rx={196} ry={34} fill="#5C3A20" />
        <ellipse cx={226} cy={584} rx={170} ry={20} fill="rgba(0,0,0,0.35)" />
        <Steam t={t} x={226} y={380} />
        <Medialuna cx={226} cy={480} s={1.32} rot={4 * Math.sin(t * 1.1)} id="hero" />
        <Crumbs t={t} />
      </svg>
    </div>
  );
};

// Texto nuevo: por qué comprarla (cae con peso sobre el viejo)
export const NewText: React.FC<{ f: number; fps: number; at: number }> = ({ f, fps, at }) => {
  if (f < at - 8) return null;
  const words = [
    { text: "RECIÉN", y: 128, d: 0, c: "#FBF8F2" },
    { text: "HORNEADAS", y: 204, d: 3, c: "#F6C46A" },
  ];
  return (
    <>
      {words.map((w) => {
        const p = fall(f - (at - 8 + w.d), fps);
        const sq = 0.45 * impact(f - (at + w.d) + 1);
        return (
          <div key={w.text} style={{ position: "absolute", left: 0, width: SCR.w, top: w.y - 72 - (1 - p) * 900, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 72, lineHeight: 1, letterSpacing: "-0.045em", color: w.c, textShadow: "0 6px 18px rgba(0,0,0,0.45)", transformOrigin: "50% 100%", transform: `scale(${1 + 0.18 * sq}, ${1 - 0.3 * sq})` }}>
            {w.text}
          </div>
        );
      })}
    </>
  );
};

// Intro con logo del video original (lo que se corta en el cambio 1)
export const LogoCard: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#2E2925" }}>
    <svg width={SCR.w} height={SCR.h} viewBox={`0 0 ${SCR.w} ${SCR.h}`}>
      <circle cx={226} cy={400} r={122} fill="none" stroke="#D9CFBE" strokeWidth={6} />
      <circle cx={226} cy={400} r={104} fill="none" stroke="#D9CFBE" strokeWidth={2} />
      <path d="M226 318 L226 362 M226 330 l-14 -10 M226 330 l14 -10 M226 344 l-14 -10 M226 344 l14 -10" stroke="#D9CFBE" strokeWidth={5} strokeLinecap="round" />
      <text x={226} y={420} textAnchor="middle" fontFamily="Poppins" fontWeight={600} fontSize={38} fill="#D9CFBE" letterSpacing="2">
        PANADERÍA
      </text>
      <line x1={170} x2={282} y1={446} y2={446} stroke="#D9CFBE" strokeWidth={3} />
    </svg>
  </div>
);

// ---------- piezas del plano ----------
export const Badge: React.FC<{ n: number; x: number; y: number; f: number; drop: number; active: number; done: number; out: number }> = ({ n, x, y, f, drop, active, done, out }) => {
  if (f < drop - 8) return null;
  const p = fall(f - (drop - 8), 30);
  const isActive = f >= active && f < done;
  const isDone = f >= done;
  const s = (isActive ? 1.18 : 1) * (1 + 0.2 * impact(f - drop)) * (1 + 0.25 * impact(f - done));
  const gone = lin(f, out, out + 10, 0, 1, (v) => v * v);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x - gone * 420} ${y - (1 - p) * 900}) scale(${s})`}>
        <circle r={46} fill={isActive ? "#FBF8F2" : A.ink} stroke={A.ink} strokeWidth={8} />
        {isDone ? (
          <path d="M-20 0 L-5 15 L22 -14" stroke="#FBF8F2" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <text y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill={isActive ? A.ink : "#FBF8F2"}>
            {n}
          </text>
        )}
        {isActive ? <path d="M58 -14 L80 0 L58 14 Z" fill={A.ink} /> : null}
      </g>
    </svg>
  );
};

export const Stamp: React.FC<{ kind: "x" | "ok"; x: number; y: number; f: number; at: number; out: number }> = ({ kind, x, y, f, at, out }) => {
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: 30, config: { damping: 11, stiffness: 320 } });
  const c = kind === "x" ? A.ink : A.orange;
  return (
    <svg width={150} height={150} viewBox="-75 -75 150 150" style={{ position: "absolute", left: x - 75, top: y - 75, overflow: "visible", opacity: 1 - lin(f, out, out + 6), transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -20}deg)` }}>
      <circle r={62} fill="#FBF8F2" stroke={c} strokeWidth={9} />
      {kind === "x" ? <path d="M-27 -27 L27 27 M27 -27 L-27 27" stroke={c} strokeWidth={15} strokeLinecap="round" /> : <path d="M-30 2 L-8 24 L32 -22" stroke={c} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
};

export const Chip: React.FC<{ text: string; x: number; y: number; align: "left" | "right"; opacity: number }> = ({ text, x, y, align, opacity }) => (
  <div style={{ position: "absolute", top: y, left: align === "left" ? x : undefined, right: align === "right" ? SCR.w - x : undefined, fontFamily: LABEL, fontSize: 24, letterSpacing: "0.08em", color: "#FBF8F2", background: A.ink, padding: "4px 12px", borderRadius: 8, opacity }}>{text}</div>
);

// Cámara cara (lo que el mito dice que falta), con etiqueta de precio que se balancea
export const ProCamera: React.FC<{ t: number; tag: number }> = ({ t, tag }) => (
  <svg width={210} height={170} viewBox="0 0 210 170" style={{ overflow: "visible" }}>
    <rect x={56} y={4} width={62} height={30} rx={6} fill={A.ink} />
    <rect x={6} y={26} width={170} height={104} rx={16} fill={A.ink} />
    <circle cx={92} cy={80} r={44} fill="#3A3834" stroke="#FBF8F2" strokeWidth={6} />
    <circle cx={92} cy={80} r={26} fill={A.ink} />
    <circle cx={82} cy={70} r={8} fill="rgba(251,248,242,0.7)" />
    <rect x={140} y={38} width={24} height={14} rx={3} fill="#FBF8F2" />
    {tag > 0 ? (
      <g transform={`translate(170 ${30 - (1 - tag) * 60}) rotate(${14 * Math.sin(t * 4)})`}>
        <line x1={0} y1={0} x2={10} y2={40} stroke={A.ink} strokeWidth={4} />
        <g transform="translate(10 40) rotate(-12)">
          <path d="M0 0 L58 0 L70 22 L58 44 L0 44 Z" fill="#FBF8F2" stroke={A.ink} strokeWidth={5} strokeLinejoin="round" />
          <text x={28} y={32} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill={A.ink}>
            $$$
          </text>
        </g>
      </g>
    ) : null}
  </svg>
);

export const Arrow: React.FC<{ x: number; y: number; bob: number; opacity: number }> = ({ x, y, bob, opacity }) => (
  <svg width={120} height={120} viewBox="0 0 120 120" style={{ position: "absolute", left: x - 112 - bob, top: y + 8 + bob * 0.4, width: 120, height: 120, overflow: "visible", opacity }}>
    <path d="M14 106 L92 28" stroke="#FBF8F2" strokeWidth={22} strokeLinecap="round" />
    <path d="M100 20 L100 74 M100 20 L46 20" stroke="#FBF8F2" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 106 L92 28" stroke={A.ink} strokeWidth={12} strokeLinecap="round" />
    <path d="M100 20 L100 74 M100 20 L46 20" stroke={A.ink} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Esquinas de encuadre que se cierran de la pantalla entera a la medialuna
export const Marks: React.FC<{ x: number; y: number; w: number; h: number; opacity: number }> = ({ x, y, w, h, opacity }) => {
  const L = Math.min(56, w * 0.3);
  const c = [
    [x - w / 2, y - h / 2, 1, 1],
    [x + w / 2, y - h / 2, -1, 1],
    [x - w / 2, y + h / 2, 1, -1],
    [x + w / 2, y + h / 2, -1, -1],
  ];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      {c.map(([cx, cy, sx, sy], i) => (
        <path key={i} d={`M${cx} ${cy + sy * L} L${cx} ${cy} L${cx + sx * L} ${cy}`} stroke={A.orange} strokeWidth={11} fill="none" strokeLinecap="square" />
      ))}
    </svg>
  );
};

// Ticket del CTA: lo que recibe quien escribe (más ancho que el de props para que entre la frase)
export const BigTicket: React.FC<{ x: number; y: number; lift: number; squash: number }> = ({ x, y, lift, squash }) => {
  const w = 700;
  const h = 210;
  return (
    <>
      <ContactShadow x={x} y={y} w={w * 0.8} h={lift} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) scale(${1 + 0.2 * squash}, ${1 - 0.3 * squash})` }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
          <path d={`M16 8 H${w - 16} Q${w - 6} 8 ${w - 6} 18 V${h / 2 - 28} A28 28 0 0 0 ${w - 6} ${h / 2 + 28} V${h - 18} Q${w - 6} ${h - 8} ${w - 16} ${h - 8} H16 Q6 ${h - 8} 6 ${h - 18} V${h / 2 + 28} A28 28 0 0 0 6 ${h / 2 - 28} V18 Q6 8 16 8 Z`} fill="#FBF8F2" stroke={A.ink} strokeWidth={8} />
          <line x1={84} y1={26} x2={84} y2={h - 26} stroke={A.orange} strokeWidth={6} strokeDasharray="10 9" />
          <text x={(84 + w - 30) / 2} y={92} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill={A.ink} letterSpacing="-1.5">
            TE MUESTRO CÓMO
          </text>
          <text x={(84 + w - 30) / 2} y={154} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill={A.orange} letterSpacing="-1.5">
            MEJORARÍA TU CLIP
          </text>
        </svg>
      </div>
    </>
  );
};

export type Cam = { z: number; cx: number; cy: number };
export const Camera: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${540 - cam.cx * cam.z}px, ${980 - cam.cy * cam.z}px) scale(${cam.z})` }}>{children}</AbsoluteFill>
);
// Empuje lento de cámara dentro de cada tramo: la imagen nunca queda quieta
export const Push: React.FC<{ f: number; a: number; b: number; children: React.ReactNode }> = ({ f, a, b, children }) => (
  <AbsoluteFill style={{ transformOrigin: "540px 1020px", transform: `scale(${1 + 0.03 * lin(f, a, b)})` }}>{children}</AbsoluteFill>
);

export const MedialunaReel: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talk = talkAt(f);
  // el video del negocio avanza siempre; en el cambio 1 se rebobina al principio
  const play = f < S5 ? 0.04 + (f / S5) * 0.5 : f < S5 + 6 ? lin(f, S5, S5 + 6, 0.54, 0.02) : lin(f, S5 + 6, END, 0.02, 0.95);

  // ---- estado del celular a lo largo del reel ----
  const MYTH: PhoneState = { x: 745, y: 1015, s: 0.76 };
  const REVEAL: PhoneState = { x: 600, y: 1000, s: 1.1 };
  const CTA: PhoneState = { x: 760, y: 1195, s: 0.6 };
  const tHook = W(iCamara2) + 2; // lanza el anzuelo
  const tYank = W(iEditado) - 2; // tirón
  const yk = yank(f - tYank, 9);
  let phone: PhoneState;
  if (f < S2) phone = { ...LAYOUT, lift: (1 - fall(f + 4, fps)) * 260 };
  else if (f < tYank) phone = mixP(LAYOUT, MYTH, lin(f, S2, S2 + 10, 0, 1, ease));
  else if (f < S8) phone = mixP(MYTH, LAYOUT, yk);
  else if (f < S9) phone = mixP(LAYOUT, REVEAL, lin(f, S8, S8 + 10, 0, 1, ease));
  else phone = mixP(REVEAL, CTA, lin(f, W(iMandame) - 10, W(iMandame) + 4, 0, 1, easeIO));
  const phoneSquash = f < S2 ? 0.5 * impact(f - 4) : f >= tYank + 9 && f < S4 ? 0.35 * impact(f - tYank - 9) : 0;

  // ---- contenido de la pantalla ----
  const tCut = W(iArranque) + 2; // corte del logo
  const zA = W(iHasta);
  const zB = W(iPantalla) + 4;
  const zoom = lin(f, zA, zB, 0, 1, easeIO);
  const heroIn = lin(f, zA + (zB - zA) * 0.55, zB, 0, 1);
  const tLand = W(iComprarla); // aterriza el texto nuevo
  const oldOut = W(iLocal) - 6;
  const wipeIn = lin(f, S8, S8 + 10, 0, 1, ease); // aparece el ANTES a la izquierda
  const wipeOut = lin(f, W(iAhora), W(iAhora) + 12, 0, 1, easeIO); // el DESPUÉS ocupa todo
  const split = f >= S8 ? 0.5 * wipeIn * (1 - wipeOut) : 0; // fracción de pantalla que muestra el ANTES

  const shopZoomed = (() => {
    const Z = 1 + 13 * zoom * zoom;
    const tx = ML.x + (SCR.w / 2 - ML.x) * zoom - ML.x * Z;
    const ty = ML.y + (470 - ML.y) * zoom - ML.y * Z;
    return (
      <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${Z})` }}>
        <Shop t={t} />
      </div>
    );
  })();

  const showLogo = f >= S5 && f < tCut + 30;
  const logoBlock = (() => {
    if (!showLogo) return null;
    const appear = lin(f, S5, S5 + 5);
    if (f < tCut) return <div style={{ position: "absolute", inset: 0, opacity: appear }}><LogoCard /></div>;
    const k = f - tCut;
    const g = (v: number) => 0.9 * v * v;
    // la tarjeta se parte en diagonal y las mitades caen
    return (
      <>
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 100% 0, 100% 38%, 0 58%)", transform: `translate(${-3 * k}px, ${g(k)}px) rotate(${-0.8 * k}deg)` }}>
          <LogoCard />
        </div>
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 58%, 100% 38%, 100% 100%, 0 100%)", transform: `translate(${4 * k}px, ${g(k) * 1.3}px) rotate(${0.9 * k}deg)` }}>
          <LogoCard />
        </div>
      </>
    );
  })();

  const afterFix2 = f >= zB;
  const screen = (
    <>
      {afterFix2 ? <Hero t={t} f={f} from={zB} /> : shopZoomed}
      {!afterFix2 && heroIn > 0 ? <div style={{ position: "absolute", inset: 0, opacity: heroIn, transform: `scale(${1.25 - 0.25 * heroIn})` }}><Hero t={t} f={f} from={zB} /></div> : null}
      {logoBlock}
      {/* ANTES a la izquierda en la comparación */}
      {split > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }}>
          <Shop t={t} />
          <OldText />
        </div>
      ) : null}
    </>
  );

  // texto viejo / nuevo dentro de la pantalla
  const oldSquash = f >= tLand ? Math.min(1, 0.85 + 0.15 * impact(f - tLand)) : 0;
  const oldFall = f >= oldOut ? f - oldOut : 0;
  const overlay = (
    <>
      {f < oldOut + 24 && f < S8 && !(showLogo && f < tCut + 2) ? (
        <OldText squash={oldSquash} outline={f >= W(iTexto) && f < tLand ? lin(f, W(iTexto), W(iTexto) + 4) : 0} dx={oldFall * -9} dy={0.9 * oldFall * oldFall} rot={-1.4 * oldFall} />
      ) : null}
      {f >= S7 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: split > 0.001 ? `inset(-1000px 0 0 ${split * 100}%)` : undefined }}>
          <NewText f={f} fps={fps} at={tLand} />
        </div>
      ) : null}
      {/* aro y flecha del gancho, sobre la medialuna diminuta */}
      {f < S2 ? (
        <>
          <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <ellipse cx={ML.x} cy={ML.y} rx={38} ry={30} fill="none" stroke={A.orange} strokeWidth={6} strokeDasharray={`${lin(f, 3, 13) * 220} 220`} strokeLinecap="round" />
          </svg>
          <Arrow x={ML.x - 26} y={ML.y + 14} bob={8 * Math.abs(Math.sin(f * 0.32))} opacity={lin(f, 8, 12)} />
        </>
      ) : null}
      {/* barra de edición con el tramo del logo (cambio 1) */}
      {f >= S5 && f < S6 + 6 ? (
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 44, height: 64, borderRadius: 12, background: "rgba(14,13,11,0.82)", display: "flex", gap: 4, padding: 6, boxSizing: "border-box", opacity: lin(f, S5, S5 + 5) * (1 - lin(f, S6, S6 + 6)) }}>
          <div style={{ width: `${30 * (1 - lin(f, tCut, tCut + 8, 0, 1, ease))}%`, height: "100%", borderRadius: 8, background: "#5A524A", border: f >= W(iLogo) && f < tCut ? `3px dashed ${A.orange}` : "3px solid transparent", boxSizing: "border-box", overflow: "hidden", fontFamily: LABEL, fontSize: 20, color: "#FBF8F2", display: "flex", alignItems: "center", justifyContent: "center" }}>LOGO</div>
          <div style={{ flex: 1, height: "100%", borderRadius: 8, background: "repeating-linear-gradient(90deg, #B4A387 0 44px, #A39276 44px 48px)" }} />
        </div>
      ) : null}
      {/* corte: trazo naranja en diagonal */}
      {f >= tCut - 4 && f < tCut + 8 ? (
        <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - lin(f, tCut + 3, tCut + 8) }}>
          <line x1={-20} y1={SCR.h * 0.58 + 9} x2={-20 + (SCR.w + 40) * lin(f, tCut - 4, tCut)} y2={SCR.h * 0.58 + 9 - (SCR.h * 0.2 + 2) * lin(f, tCut - 4, tCut)} stroke={A.orange} strokeWidth={12} strokeLinecap="round" />
        </svg>
      ) : null}
      {/* comparación: divisor, etiquetas y sellos */}
      {f >= S8 && split > 0.001 ? (
        <>
          <div style={{ position: "absolute", left: SCR.w * split - 5, top: 0, width: 10, height: SCR.h, background: A.orange }} />
          <Chip text="ANTES" x={18} y={250} align="left" opacity={lin(f, S8 + 4, S8 + 10) * (split > 0.25 ? 1 : 0)} />
          <Chip text="DESPUÉS" x={SCR.w - 18} y={250} align="right" opacity={lin(f, S8 + 4, S8 + 10)} />
        </>
      ) : null}
      {f >= S8 ? (
        <>
          <Stamp kind="x" x={SCR.w * 0.25} y={690} f={f} at={W(iVideo1)} out={W(iAhora)} />
          <Stamp kind="ok" x={SCR.w * 0.75} y={690} f={f} at={W(iCamara3)} out={W(iAhora)} />
        </>
      ) : null}
    </>
  );

  // ---- Gancho ----
  const gx = 190;
  const gs = 0.85;
  const landG = S2 + 9;
  let g: GanchoPose = { x: gx, y: FLOOR, scale: gs, t, talk, expr: "normal", armL: 30, armR: 40, look: { x: 1, y: -0.3 } };
  let gLift = 0;
  let rope: React.ReactNode = null;
  if (f < S2) gLift = 2000; // aún no entra
  else if (f < S3) {
    const p = fall(f - S2, fps);
    gLift = (1 - p) * 1100;
    const crushed = f >= W(iFalso) + 2;
    g = { ...g, expr: crushed ? "surprised" : f >= W(iCamara1) ? "happy" : "normal", squash: 0.4 * impact(f - landG), armL: crushed ? 160 : 30, armR: crushed ? 160 : f >= W(iCamara1) ? 120 : 40, look: { x: 0.4, y: -1 } };
  } else if (f < S4) {
    const pulling = f >= tHook && f < tYank + 9;
    const fell = f >= tYank + 9;
    g = { ...g, expr: fell ? "smug" : pulling ? "strain" : "normal", armR: pulling ? 105 : 40, lean: pulling ? -6 - 8 * lin(f, tHook, tYank) : 0, hookOut: pulling, squash: fell ? 0.38 * Math.max(0, impact(f - tYank - 9)) : 0, look: { x: 1, y: -0.2 } };
    if (pulling) {
      const ant = antennaWorld(g);
      const ph = mixP(MYTH, LAYOUT, yk);
      const end = { x: ph.x - 240 * ph.s + 6, y: ph.y };
      rope = <Rope ax={ant.x} ay={ant.y} bx={end.x} by={end.y} slack={lin(f, tHook, tHook + 10, 0.85, 0.05)} buzz={f >= tHook + 10 && f < tYank ? 0.5 : 0} t={t} />;
    }
  } else if (f < S5) {
    g = { ...g, expr: "happy", armL: f >= W(iTres) ? 165 : 30, armR: f >= W(iTres) ? 165 : 40, look: { x: -0.2, y: -1 } };
  } else if (f < S6) {
    const snip = f >= W(iCorto) - 6;
    g = { ...g, expr: snip ? "focused" : "normal", item: snip ? "scissors" : "none", armR: snip ? 100 + (f >= tCut - 6 && f < tCut + 2 ? 18 * Math.sin(f * 1.5) : 0) : 40 };
  } else if (f < S7) {
    const hold = f >= W(iAcerco) - 4;
    g = { ...g, expr: hold ? "focused" : "normal", item: hold ? "frame" : "none", armR: hold ? 110 : 40, look: { x: 1, y: -0.6 } };
  } else if (f < S8) {
    g = { ...g, expr: f >= tLand ? "smug" : "normal", armR: f >= W(iTexto) ? 115 : 40, look: { x: 1, y: -0.8 } };
  } else if (f < S9) {
    g = { ...g, x: gx - 30 * lin(f, S8, S8 + 10), scale: 0.78, expr: f >= W(iAhora) ? "love" : "happy", item: "popcorn", armR: 70, look: { x: 1, y: -0.5 } };
  } else {
    // señala el celular mientras dice «si tenés un negocio»; festeja cuando cae la caja VIDEO
    const tBox = W(iVIDEO);
    const cheer = f >= tBox;
    const move = lin(f, W(iMandame) - 10, W(iMandame) + 4, 0, 1, easeIO);
    g = { ...g, x: 160 + 90 * move, scale: 0.78 + 0.07 * move, expr: cheer ? "happy" : "smug", armL: cheer ? 165 : 30, armR: cheer ? 165 : 95, squash: cheer ? -0.12 * Math.max(0, impact(f - tBox - 2)) : 0, look: cheer ? { x: 0.6, y: -1 } : { x: 1, y: 0 } };
  }

  // ---- mito: globo con la cámara cara, aplastado por FALSO ----
  const tFalso = W(iFalso) + 2;
  const bubbleS = spring({ frame: f - (W(iY) + 6), fps, config: { damping: 12, stiffness: 220 } });
  const flat = f >= tFalso ? Math.min(1, 0.78 + 0.22 * impact(f - tFalso)) : 0;
  const dropOut = f >= W(iCamara2) ? f - W(iCamara2) : 0;
  const mythLayer =
    f >= S2 && f < S4 ? (
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${0.9 * dropOut * dropOut}px) rotate(${-0.4 * dropOut}deg)`, transformOrigin: "300px 1000px", opacity: dropOut > 20 ? 0 : 1 }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: "300px 1010px", transform: `scaleY(${1 - 0.8 * flat})` }}>
          <Thought x={300} y={1010} s={1.3 * bubbleS}>
            <div style={{ transform: `scale(${spring({ frame: f - W(iCamara1), fps, config: { damping: 11, stiffness: 300 } })})` }}>
              <ProCamera t={t} tag={fall(f - W(iCara) + 2, fps)} />
            </div>
          </Thought>
        </div>
        {f >= tFalso - 8 ? <Slab text="FALSO" x={330} y={1010 - 338 * (1 - 0.8 * flat) * 0.92 + 20} size={150} color={A.orange} squash={0.5 * impact(f - tFalso)} lift={(1 - fall(f - (tFalso - 8), fps)) * 1100} shadow={false} /> : null}
      </div>
    ) : null;

  // ---- insignias 1·2·3 ----
  const bx = 132;
  const badges =
    f >= S4 - 2 && f < S8 + 12 ? (
      <>
        {[0, 1, 2].map((k) => (
          <Badge key={k} n={k + 1} x={bx} y={650 + k * 132} f={f} drop={W(iTres) + k * 4} active={[S5, S6, S7][k]} done={[tCut + 12, zB + 6, W(iLocal) + 4][k]} out={S8} />
        ))}
      </>
    ) : null;

  // ---- marcas de encuadre (cambio 2) ----
  let marks: React.ReactNode = null;
  if (f >= W(iAcerco) - 2 && f < zB + 10) {
    const full = { x: phone.x, y: phone.y, w: SCR.w * phone.s, h: SCR.h * phone.s };
    const tgtC = toScreen(phone, ML.x, ML.y);
    const tight = { x: tgtC.x, y: tgtC.y, w: 74, h: 62 };
    const close = lin(f, W(iAcerco), W(iMedialuna) + 8, 0, 1, easeIO);
    const open = zoom;
    const k = close * (1 - open);
    const box = { x: full.x + (tight.x - full.x) * k, y: full.y + (tight.y - full.y) * k, w: full.w + (tight.w - full.w) * k, h: full.h + (tight.h - full.h) * k };
    marks = <Marks {...box} opacity={lin(f, W(iAcerco) - 2, W(iAcerco) + 3) * (1 - lin(f, zB, zB + 10))} />;
  }

  // ---- CTA ----
  const tBox = W(iVIDEO);
  const cta =
    f >= W(iMandame) - 2 ? (
      <>
        <div style={{ position: "absolute", left: 72, top: 300, fontFamily: LABEL, fontSize: 30, letterSpacing: "0.08em", color: A.ink, opacity: lin(f, W(iMandame) - 2, W(iMandame) + 4) }}>
          <span style={{ color: A.orange }}>● </span>SI TENÉS UN NEGOCIO
        </div>
        <div style={{ position: "absolute", left: 72, width: 858, top: 360, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 100, letterSpacing: "-0.045em", color: A.ink }}>
          <span style={{ opacity: lin(f, W(iMandame), W(iMandame) + 5), transform: `translateY(${(1 - lin(f, W(iMandame), W(iMandame) + 6)) * 14}px)` }}>Mandame</span>
          <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 10px", borderRadius: 18, transformOrigin: "50% 100%", transform: `translateY(${-(1 - fall(f - (tBox - 8), fps)) * 700}px) scale(${1 + 0.22 * impact(f - tBox)}, ${f < tBox - 8 ? 0 : 1 - 0.3 * impact(f - tBox)})`, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>VIDEO</span>
        </div>
        {f >= W(iMuestro) - 6 ? <BigTicket x={540} y={830} lift={(1 - fall(f - (W(iMuestro) - 6), fps)) * 1200} squash={0.4 * impact(f - W(iMuestro) - 1)} /> : null}
      </>
    ) : null;

  // ---- cámara del gancho (zoom al detalle) ----
  const mlScreen = toScreen(LAYOUT, ML.x, ML.y);
  const punch = lin(f, W(iAsi) - 2, W(iAsi) + 6, 0, 1, ease);
  const back = lin(f, S2, S2 + 9, 0, 1, ease);
  const camA: Cam = { z: 1.16 + 0.05 * lin(f, 0, W(iAsi)), cx: LAYOUT.x, cy: LAYOUT.y - 20 };
  const camB: Cam = { z: 4.2, cx: mlScreen.x, cy: mlScreen.y };
  const camC: Cam = { z: 1, cx: 540, cy: 980 };
  const mix = (a: Cam, b: Cam, k: number): Cam => ({ z: a.z + (b.z - a.z) * k, cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k });
  const cam = f < S2 ? mix(camA, camB, punch) : mix(mix(camA, camB, 1), camC, back);
  const inCam = f < S2 + 9;

  const sceneStarts = [0, S2, S3, S4, S5, S6, S7, S8, S9, END];
  let si = 0;
  while (si < sceneStarts.length - 2 && f >= sceneStarts[si + 1]) si++;

  const tagOpacity = 1;
  const world = (
    <>
      {mythLayer}
      {badges}
      <Phone p={phone} play={play} overlay={overlay} squash={phoneSquash}>
        <div style={{ position: "absolute", inset: 0, filter: f < S2 && punch > 0.3 ? `blur(${1.6 * punch}px)` : undefined }}>{screen}</div>
      </Phone>
      <div style={{ position: "absolute", left: phone.x - 240 * phone.s, top: phone.y - 427 * phone.s - (phone.lift ?? 0) - 48, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.08em", color: A.ink, opacity: tagOpacity, whiteSpace: "nowrap" }}>
        <span style={{ color: A.orange }}>● </span>EJEMPLO CREADO PARA LA DEMO
      </div>
      {marks}
      {gLift < 1500 ? (
        <>
          <ContactShadow x={g.x} y={FLOOR} w={250 * (g.scale ?? 1)} h={gLift} />
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${-gLift}px)` }}>
            <Gancho {...g} />
          </div>
        </>
      ) : null}
      {rope}
      {cta}
    </>
  );

  const hideCaps = (f >= W(iFalso) - 6 && f < S3) || f >= W(iMandame) - 2;

  return (
    <Paper>
      <Push f={f} a={sceneStarts[si]} b={sceneStarts[si + 1]}>
        {inCam ? <Camera cam={cam}>{world}</Camera> : world}
      </Push>
      {hideCaps ? null : <Captions words={T.words} f={f} fps={fps} keys={KEYS} top={250} size={82} />}

      <Audio src={staticFile("audio/voz_medialuna.wav")} />
      <Audio src={staticFile("audio/musica_medialuna.wav")} volume={(fr) => (fr < S2 ? 0.26 : 0.22)} />

      {/* sonido propio: tensión · tirón · impacto */}
      <Snd at={4} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iAsi)} src={SOUND.impacto} vol={0.3} />
      <Snd at={landG} src={SOUND.impacto} vol={0.4} />
      <Snd at={W(iCamara1)} src={SOUND.impacto} vol={0.25} />
      <Snd at={tFalso} src={SOUND.impacto} vol={0.9} />
      <Snd at={tHook} src={SOUND.tension} vol={0.35} />
      <Snd at={tYank} src={SOUND.tiron} vol={0.6} />
      <Snd at={tYank + 9} src={SOUND.impacto} vol={0.45} />
      {[0, 1, 2].map((k) => (
        <Snd key={k} at={W(iTres) + k * 4} src={SOUND.impacto} vol={0.28} />
      ))}
      <Snd at={tCut - 3} src={SOUND.tiron} vol={0.5} />
      <Snd at={tCut + 12} src={SOUND.impacto} vol={0.3} />
      <Snd at={W(iMedialuna) + 6} src={SOUND.tension} vol={0.25} />
      <Snd at={zB} src={SOUND.impacto} vol={0.5} />
      <Snd at={tLand} src={SOUND.impacto} vol={0.8} />
      <Snd at={oldOut} src={SOUND.tiron} vol={0.35} />
      <Snd at={S8} src={SOUND.tiron} vol={0.35} />
      <Snd at={W(iVideo1)} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iCamara3)} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iAhora)} src={SOUND.tiron} vol={0.5} />
      <Snd at={tBox} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iMuestro)} src={SOUND.impacto} vol={0.5} />
    </Paper>
  );
};

// ---------- portada (1080 × 1920): el gancho, sin la respuesta ----------
export const MedialunaPortada: React.FC = () => {
  const p: PhoneState = { x: 600, y: 1090, s: 1.02 };
  return (
    <Paper>
      <div style={{ position: "absolute", left: 72, top: 250, width: 880, fontFamily: FONT, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: "-0.045em", color: A.ink }}>
        ¿SE VE TU
        <br />
        <span style={{ color: A.orange }}>PRODUCTO?</span>
      </div>
      <Phone
        p={p}
        play={0.35}
        overlay={
          <>
            <div style={{ position: "absolute", left: SCR.w / 2 - 5, top: 0, width: 10, height: SCR.h, background: A.orange }} />
            <Chip text="ANTES" x={18} y={250} align="left" opacity={1} />
            <Chip text="DESPUÉS" x={SCR.w - 18} y={250} align="right" opacity={1} />
          </>
        }
      >
        <Hero t={0.8} f={0} from={0} />
        <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 50% 0 0)" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translateX(-190px)" }}>
            <Shop t={0} />
            <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0 }}>
              <ellipse cx={ML.x} cy={ML.y} rx={36} ry={28} fill="none" stroke={A.orange} strokeWidth={6} />
            </svg>
          </div>
        </div>
      </Phone>
      <div style={{ position: "absolute", left: 370, top: 1090 - 427 * 1.02 - 48, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.08em", color: A.ink }}>
        <span style={{ color: A.orange }}>● </span>EJEMPLO CREADO PARA LA DEMO
      </div>
      <ContactShadow x={190} y={FLOOR} w={220} />
      <Gancho x={190} y={FLOOR} scale={0.85} t={1.3} expr="surprised" armL={30} armR={110} look={{ x: 1, y: -0.4 }} />
    </Paper>
  );
};
