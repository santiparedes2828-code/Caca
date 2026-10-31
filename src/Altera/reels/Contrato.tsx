import React from "react";
import { AbsoluteFill, Audio, Easing, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-contrato-1.json";
import c2 from "../../data/captions-contrato-2.json";
import c3 from "../../data/captions-contrato-3.json";
import c4 from "../../data/captions-contrato-4.json";
import c5 from "../../data/captions-contrato-5.json";
import { Snd, timing } from "../reelkit";
import { SOUND } from "../system";
import { Hero, Shop } from "./Medialuna";
import { Auction, BigName, Bokeh, C, Coins, DarkPhone, Dust, Grain, Label, Pill, PriceCard, Sparks, Studio, Tap, Vignette, bump, decay, drop, eio, eo, ln, pop, rnd } from "./Servilleta";

// «El contrato de 800 dólares» — dato curioso de Hook House (2026-10-31), mismo formato que «La servilleta de Messi»
// (estilo-animado.md: escenas ilustradas a pantalla completa, todo se mueve, palabras clave con color, sin Hookie).
// Dato verificado: el 1/4/1976 Steve Jobs, Steve Wozniak y Ronald Wayne firmaron el contrato de sociedad de Apple; Wayne
// tenía el 10 % y el 12/4/1976 vendió su parte por US$ 800 (temía responder con sus bienes por las deudas). A principios
// de los 90 vendió el contrato original por US$ 500; Sotheby's (Nueva York) lo subastó el 13/12/2011 por US$ 1.594.500.
// Fuentes: Computerworld, ABC News, AppleInsider/Bloomberg (2011). Personas: siluetas genéricas; el contrato es una
// recreación ilustrada (no reproduce el texto real). 5 variantes de gancho con el mismo cuerpo, para el panel.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";

const CAPS: Caption[][] = [c1, c2, c3, c4, c5];
export const contratoFrames = (v: number) => timing(CAPS[v - 1]).frames;

// plata y lo que suma en verde · protagonistas en dorado · lo negativo en rojo
const KEYCOLOR: [RegExp, string][] = [
  [/^(millón|medio|dólares|subastó)$/i, C.green],
  [/^(papel|contrato|apple|ronald|wayne|steve|jobs|wozniak)$/i, C.gold],
  [/^(miedo|deudas|vayas|dejaste|fue)$/i, C.red],
];
const keyColor = (w: string) => {
  const clean = w.toLowerCase().replace(/[¿?¡!.,:…"]/g, "");
  for (const [re, col] of KEYCOLOR) if (re.test(clean)) return col;
  return null;
};

// ---------- subtítulos: la palabra que suena entra con golpe; cifras en pastilla ----------
const Subs: React.FC<{ words: { text: string; at: number }[]; f: number; fps: number }> = ({ words, f, fps }) => {
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
    <div style={{ position: "absolute", top: 270, left: 60, width: 960, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 78, lineHeight: 1.22, letterSpacing: "-0.01em" }}>
      {Array.from({ length: cur - start + 1 }, (_, k) => start + k).map((i) => {
        const d = spring({ frame: f - words[i].at, fps, config: { damping: 9, stiffness: 300 } });
        const now = i === cur;
        const txt = words[i].text.replace(/[,:…]+$/, "").replace(/\.$/, "").replace(/"/g, "");
        const num = /\d/.test(txt);
        const wob = now ? 1 + 0.04 * Math.sin(f * 0.5) : 1;
        const kc = keyColor(txt);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 9px", opacity: Math.min(1, d * 1.5), transform: `translateY(${(1 - d) * 40}px) scale(${(0.7 + 0.3 * d) * wob}) rotate(${(1 - d) * (i % 2 ? 8 : -8)}deg)` }}>
            {num && now ? (
              <span style={{ display: "inline-block", padding: "0 22px 6px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 8px 0 rgba(0,0,0,0.45)" }}>{txt}</span>
            ) : kc ? (
              <span style={{ color: kc, opacity: now ? 1 : 0.85, textShadow: now ? `0 0 30px ${kc}, 0 4px 14px rgba(0,0,0,0.6)` : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            ) : (
              <span style={{ color: now ? C.white : C.grey, textShadow: now ? "0 0 26px rgba(255,255,255,0.45), 0 4px 14px rgba(0,0,0,0.6)" : "0 4px 14px rgba(0,0,0,0.5)" }}>{txt}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ---------- el contrato (recreación): flota en 3D, con reflejo y tres firmas ----------
const SIG = ["M0 0 c14 -34 30 26 46 -6 s24 -28 40 6 c8 12 18 -4 26 -10", "M0 0 c8 -26 26 -8 34 -26 c8 18 26 26 48 -2 c6 -6 14 4 20 -2", "M0 0 c16 -18 26 18 42 -6 s16 -10 34 6 c10 6 18 -8 26 -4"];
const Contract: React.FC<{ x: number; y: number; s?: number; sign?: number; glow?: number; blur?: number; rot?: number; f?: number; tilt?: number; stamp?: string; stampAt?: number }> = ({ x, y, s = 1, sign = 3, glow = 0, blur = 0, rot = 0, f = 0, tilt = 1, stamp, stampAt = 0 }) => {
  const rx = tilt * (10 + 5 * Math.sin(f * 0.07));
  const ry = tilt * 9 * Math.sin(f * 0.05);
  const bob = tilt * 12 * Math.sin(f * 0.09);
  const sweep = ((f % 70) / 70) * 900 - 250;
  const ink = glow > 0 ? `rgb(${Math.round(30 + 217 * glow)},${Math.round(40 + 145 * glow)},${Math.round(90 - 5 * glow)})` : "#1E2A55";
  const st = stamp ? spring01(f - stampAt) : 0;
  return (
    <div style={{ position: "absolute", left: x - 230, top: y - 300, width: 460, height: 600, perspective: 1300 }}>
      <div style={{ width: 460, height: 600, transform: `translateY(${bob}px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rot}deg)`, filter: `drop-shadow(0 30px 30px rgba(0,0,0,0.5))${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(247,185,85,${0.7 * glow}))` : ""}` }}>
        <svg width={460} height={600} viewBox="0 0 460 600" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="ctp" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FBF3E2" />
              <stop offset="100%" stopColor="#E6D6B8" />
            </linearGradient>
            <linearGradient id="ctsheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
            <clipPath id="ctclip">
              <rect x={0} y={0} width={460} height={600} rx={8} />
            </clipPath>
          </defs>
          <rect x={0} y={0} width={460} height={600} rx={8} fill="url(#ctp)" />
          <path d="M460 0 L460 70 L392 0 Z" fill="#D8C7A6" />
          <g style={{ filter: blur > 0 ? `blur(${blur * 12}px)` : undefined }}>
            <rect x={130} y={46} width={200} height={16} rx={8} fill={ink} opacity={0.85} />
            <rect x={160} y={74} width={140} height={9} rx={4} fill={ink} opacity={0.5} />
            {Array.from({ length: 11 }, (_, k) => (
              <rect key={k} x={44} y={116 + k * 26} width={k % 4 === 3 ? 230 : 372 - (k % 3) * 24} height={8} rx={4} fill={ink} opacity={0.32} />
            ))}
            {[0, 1, 2].map((i) => {
              const p = Math.max(0, Math.min(1, sign - i));
              const sx = 40 + i * 140;
              return (
                <g key={i}>
                  <line x1={sx} y1={530} x2={sx + 110} y2={530} stroke={ink} strokeWidth={3} opacity={0.5} />
                  <path d={SIG[i]} transform={`translate(${sx + 6} 518)`} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${p * 200} 200`} />
                </g>
              );
            })}
          </g>
          <g clipPath="url(#ctclip)">
            <rect x={sweep} y={-100} width={150} height={800} fill="url(#ctsheen)" transform={`rotate(20 ${sweep + 75} 300)`} />
          </g>
          {stamp && st > 0 ? (
            <g transform={`translate(300 230) rotate(-14) scale(${2.2 - 1.2 * st})`} opacity={Math.min(1, st * 1.5)}>
              <rect x={-120} y={-44} width={240} height={88} rx={14} fill="none" stroke={C.red} strokeWidth={9} />
              <text x={0} y={18} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={50} fill={C.red}>
                {stamp}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
};
const spring01 = (k: number) => (k < 0 ? 0 : Math.min(1, 1 - Math.exp(-k / 3) * Math.cos(k * 0.5)));

// ---------- escenarios ----------
// Garage de los 70 de noche: foco que se balancea, puerta de chapa, herramientas colgadas y mesa de trabajo
const Garage: React.FC<{ f: number; lamp?: number }> = ({ f, lamp = 1 }) => {
  const a = 5 * Math.sin(f * 0.07);
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #121624 0%, #2A2230 50%, #20181C 100%)" }} />
      {/* puerta de chapa con luz que entra por abajo */}
      <div style={{ position: "absolute", left: 90, top: 380, width: 900, height: 780, background: "linear-gradient(180deg, #2C3040, #22252F)", borderRadius: 8, overflow: "hidden" }}>
        {Array.from({ length: 13 }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: 0, right: 0, top: k * 60, height: 6, background: "#171A22" }} />
        ))}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, background: `linear-gradient(0deg, rgba(255,200,120,${0.55 + 0.1 * Math.sin(f * 0.3)}), rgba(255,200,120,0))` }} />
      </div>
      {/* tablero con herramientas que se mecen */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[
          { x: 170, d: "M0 0 L0 120 M-18 120 L18 120 L18 150 L-18 150 Z" },
          { x: 260, d: "M0 0 L0 90 M-30 90 L30 90 L30 112 L-30 112 Z" },
          { x: 820, d: "M0 0 L0 130 M-12 130 C-30 150 -10 176 0 160 C10 176 30 150 12 130 Z" },
          { x: 910, d: "M0 0 L0 100 M-22 100 L22 100 L0 150 Z" },
        ].map((t, i) => (
          <g key={i} transform={`translate(${t.x} 440) rotate(${6 * Math.sin(f * 0.09 + i * 1.7)})`}>
            <circle cx={0} cy={0} r={6} fill="#5A5F70" />
            <path d={t.d} stroke="#0E1018" strokeWidth={10} fill="#0E1018" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, transformOrigin: "540px 0px", transform: `rotate(${a}deg)` }}>
        <div style={{ position: "absolute", left: 538, top: 0, width: 4, height: 600, background: "#0A0A0E" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="gcone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFD9A0" stopOpacity={(0.34 + 0.06 * Math.sin(f * 0.5)) * lamp} />
              <stop offset="100%" stopColor="#FFD9A0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M490 630 L590 630 L1000 1500 L80 1500 Z" fill="url(#gcone)" />
          <circle cx={540} cy={622} r={30} fill="#FFE9BE" opacity={0.75 + 0.25 * Math.sin(f * 0.6) * lamp} />
          <circle cx={540} cy={622} r={70} fill="#FFE9BE" opacity={0.15 * lamp} />
        </svg>
        <Dust f={f} x0={260} x1={820} y0={660} y1={1400} n={36} />
      </div>
      <div style={{ position: "absolute", left: -40, right: -40, top: 1180, bottom: -40, background: "linear-gradient(180deg, #6A4A30 0%, #44301E 40%, #241A12 100%)" }} />
      <div style={{ position: "absolute", left: -40, right: -40, top: 1176, height: 10, background: "#8E6A46", opacity: 0.8 }} />
      <div style={{ position: "absolute", left: 140 + 600 * Math.sin((a * Math.PI) / 180), top: 1150, width: 800, height: 260, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,210,150,0.45) 0%, rgba(255,210,150,0) 70%)" }} />
    </>
  );
};

// Busto de silueta genérica (sin cara): respira y mueve la cabeza
const Bust: React.FC<{ x: number; y: number; s?: number; f: number; color?: string; seed?: number; lit?: number }> = ({ x, y, s = 1, f, color = "#0B0910", seed = 0, lit = 0 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y + 5 * Math.sin(f * 0.12 + seed)}) scale(${s})`} style={lit > 0 ? { filter: `drop-shadow(0 0 ${24 * lit}px rgba(247,185,85,${0.8 * lit}))` } : undefined}>
      <path d="M-120 160 Q-120 40 0 30 Q120 40 120 160 Z" fill={color} />
      <rect x={-26} y={-6} width={52} height={44} rx={12} fill={color} />
      <circle cx={3 * Math.sin(f * 0.09 + seed)} cy={-60} r={66} fill={color} />
    </g>
  </svg>
);

// Silueta de cuerpo entero que camina (dos piernas que giran desde la cadera, dos brazos)
const Walker: React.FC<{ x: number; y: number; s?: number; f: number; color?: string; dir?: number }> = ({ x, y, s = 1, f, color = "#0B0910", dir = -1 }) => {
  const sw = Math.sin(f * 0.35);
  const leg = (a: number, back: boolean) => (
    <g transform={`rotate(${a} 0 0)`} opacity={back ? 0.8 : 1}>
      <rect x={-13} y={0} width={26} height={170} rx={13} fill={color} />
      <ellipse cx={dir * 16} cy={168} rx={26} ry={11} fill={color} />
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y - 4 * Math.abs(sw)}) scale(${s})`}>
        {leg(-24 * sw, true)}
        <g transform={`translate(0 -170) rotate(${22 * sw})`} opacity={0.8}>
          <rect x={-11} y={0} width={22} height={140} rx={11} fill={color} />
        </g>
        <path d="M-40 -180 Q-44 -20 -26 4 L26 4 Q44 -20 40 -180 Q0 -196 -40 -180 Z" fill={color} />
        {leg(24 * sw, false)}
        <g transform={`translate(0 -170) rotate(${-22 * sw})`}>
          <rect x={-11} y={0} width={22} height={140} rx={11} fill={color} />
        </g>
        <circle cx={0} cy={-238} r={44} fill={color} />
      </g>
    </svg>
  );
};

// Torta de la sociedad: 45 % · 45 % · 10 % (la de Wayne en dorado, se puede despegar)
const Pie: React.FC<{ x: number; y: number; r?: number; f: number; out?: number; glow?: number; labels?: boolean; fly?: number }> = ({ x, y, r = 260, f, out = 0, glow = 0, labels = true, fly = 0 }) => {
  const arc = (a0: number, a1: number, rr: number) => {
    const p0 = [Math.cos(a0) * rr, Math.sin(a0) * rr];
    const p1 = [Math.cos(a1) * rr, Math.sin(a1) * rr];
    return `M0 0 L${p0[0]} ${p0[1]} A${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1[0]} ${p1[1]} Z`;
  };
  const start = -Math.PI / 2 + 0.02 * Math.sin(f * 0.05);
  const a1 = start + Math.PI * 2 * 0.45;
  const a2 = a1 + Math.PI * 2 * 0.45;
  const a3 = a2 + Math.PI * 2 * 0.1;
  const mid = (a2 + a3) / 2;
  const off = out * r * 0.35;
  const fx = fly * 900;
  const fy = -fly * 500;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) rotate(${3 * Math.sin(f * 0.06)})`}>
        <circle r={r + 16} fill="rgba(0,0,0,0.35)" />
        <path d={arc(start, a1, r)} fill="#5B4A8A" stroke="#120E18" strokeWidth={6} />
        <path d={arc(a1, a2, r)} fill="#3E6194" stroke="#120E18" strokeWidth={6} />
        <g transform={`translate(${Math.cos(mid) * off + fx} ${Math.sin(mid) * off + fy}) rotate(${fly * 220})`} style={{ filter: `drop-shadow(0 0 ${10 + 30 * glow}px rgba(247,185,85,${0.4 + 0.6 * glow}))` }}>
          <path d={arc(a2, a3, r * (1 + 0.04 * Math.sin(f * 0.4)))} fill={C.gold} stroke="#120E18" strokeWidth={6} />
          {labels ? (
            <text x={Math.cos(mid) * r * 0.66} y={Math.sin(mid) * r * 0.66 + 14} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={40} fill={C.ink}>
              10 %
            </text>
          ) : null}
        </g>
        {labels ? (
          <>
            <text x={Math.cos((start + a1) / 2) * r * 0.58} y={Math.sin((start + a1) / 2) * r * 0.58 + 16} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={50} fill="#EDE6FA">
              45 %
            </text>
            <text x={Math.cos((a1 + a2) / 2) * r * 0.58} y={Math.sin((a1 + a2) / 2) * r * 0.58 + 16} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={50} fill="#E3EEFF">
              45 %
            </text>
          </>
        ) : null}
      </g>
    </svg>
  );
};

// Calendario de abril de 1976 (el 1 fue jueves): los días se tachan hasta el 12, que queda en un círculo rojo
const Calendar: React.FC<{ x: number; y: number; s?: number; day: number; f: number; circle?: number }> = ({ x, y, s = 1, day, f, circle = 0 }) => {
  const cw = 92;
  const off = 3; // jueves
  return (
    <div style={{ position: "absolute", left: x - 340, top: y - 300, width: 680, height: 600, transform: `scale(${s}) rotate(${2 * Math.sin(f * 0.1)}deg) translateY(${8 * Math.sin(f * 0.12)}px)`, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.55))" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 28, background: C.cream, overflow: "hidden" }}>
        <div style={{ height: 112, background: C.red, color: C.white, fontFamily: PF, fontWeight: 800, fontSize: 60, textAlign: "center", lineHeight: "112px", letterSpacing: "0.04em" }}>ABRIL 1976</div>
        <svg width={680} height={488} viewBox="0 0 680 488" style={{ position: "absolute", left: 0, top: 112 }}>
          {Array.from({ length: 30 }, (_, i) => {
            const d = i + 1;
            const col = (i + off) % 7;
            const row = Math.floor((i + off) / 7);
            const cx = 24 + col * cw + cw / 2;
            const cy = 40 + row * 92;
            const crossed = Math.max(0, Math.min(1, day - i));
            return (
              <g key={d}>
                <text x={cx} y={cy + 18} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={44} fill={d === 12 && circle > 0 ? C.red : C.ink} opacity={d <= 12 ? 1 : 0.35}>
                  {d}
                </text>
                {crossed > 0 && d < 12 ? (
                  <path d={`M${cx - 26} ${cy - 18} L${cx - 26 + 52 * crossed} ${cy - 18 + 44 * crossed}`} stroke={C.red} strokeWidth={8} strokeLinecap="round" opacity={0.75} />
                ) : null}
                {d === 12 && circle > 0 ? (
                  <circle cx={cx} cy={cy + 2} r={40} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray={`${circle * 252} 252`} transform={`rotate(-90 ${cx} ${cy + 2})`} />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Lluvia de facturas de deudas
const Debts: React.FC<{ f: number; from: number }> = ({ f, from }) => {
  const k = f - from;
  if (k < 0) return null;
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const t0 = i * 2.2;
        const kk = k - t0;
        if (kk < 0) return null;
        const x = 80 + rnd(i * 3) * 920 + 30 * Math.sin(kk * 0.15 + i);
        const y = -200 + kk * (22 + 8 * rnd(i)) ;
        const r = (rnd(i + 5) - 0.5) * 60 + kk * (i % 2 ? 3 : -3);
        return (
          <div key={i} style={{ position: "absolute", left: x - 90, top: y, width: 180, height: 120, borderRadius: 12, background: "#F3EADA", transform: `rotate(${r}deg)`, boxShadow: "0 10px 20px rgba(0,0,0,0.4)", padding: "12px 14px", boxSizing: "border-box" }}>
            <div style={{ height: 8, width: 110, borderRadius: 4, background: "#BDB09A" }} />
            <div style={{ height: 8, width: 80, borderRadius: 4, background: "#BDB09A", marginTop: 8 }} />
            <div style={{ marginTop: 10, display: "inline-block", border: `5px solid ${C.red}`, borderRadius: 8, padding: "0 8px", color: C.red, fontFamily: PF, fontWeight: 800, fontSize: 28, transform: "rotate(-8deg)" }}>DEUDA</div>
          </div>
        );
      })}
    </>
  );
};

// Torre de luz que crece (lo que venía)
const Tower: React.FC<{ f: number; grow: number }> = ({ f, grow }) => {
  const h = 1100 * grow;
  return (
    <>
      <div style={{ position: "absolute", left: 600, top: 1500 - h, width: 300, height: h, background: "linear-gradient(180deg, #2E2A44, #1A1828)", boxShadow: `0 0 ${80 * grow}px rgba(247,185,85,${0.35 * grow})`, overflow: "hidden" }}>
        {Array.from({ length: 60 }, (_, j) => (
          <div key={j} style={{ position: "absolute", left: 22 + (j % 5) * 56, bottom: 30 + Math.floor(j / 5) * 88, width: 30, height: 44, background: "#FFD58A", opacity: (j + Math.floor(f / 5)) % 4 === 0 ? 0.95 : 0.35 }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 450, top: 1500 - h - 300, width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, rgba(247,185,85,${0.4 * grow}) 0%, rgba(247,185,85,0) 65%)` }} />
    </>
  );
};

type SceneId = "hook" | "firma" | "wayne" | "dias" | "venta" | "papel" | "socios" | "apple" | "subasta" | "fue" | "negocio" | "cta";

const usd = (n: number) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;

export const Contrato: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const T = timing(CAPS[v - 1]);
  const { W, E, idx } = T;
  const END = T.frames;
  const words = T.words;

  // ---- índices del cuerpo (igual en las 5 variantes) ----
  const i1976 = idx("1976");
  const iB = i1976 - 1;
  const iFirmaron = idx("firmaron", iB);
  const iContrato = idx("contrato", iFirmaron);
  const iRonald = idx("ronald", iB);
  const i10 = idx("10", iRonald);
  const i12a = idx("12", i10);
  const iMiedo = idx("miedo", i12a);
  const iDeudas = idx("deudas", iMiedo);
  const iVendio = idx("vendió", iDeudas);
  const i800 = idx("800", iVendio);
  const iAnos = idx("años", i800);
  const iPapelB = idx("papel", iAnos);
  const i500 = idx("500", iPapelB);
  const iLos = idx("los", i500);
  const iSteve = idx("steve", iLos);
  const iWoz = idx("wozniak", iSteve);
  const iEra = idx("era", iWoz);
  const iApple = idx("apple", iEra);
  const i2011 = idx("2011", iApple);
  const iSub = idx("subastó", i2011);
  const iDol2 = idx("dólares", iSub);
  const iWayne2 = idx("wayne", iDol2);
  const i12b = idx("12", iWayne2);
  const iAntes = idx("antes", i12b);
  const iCon = idx("con", iAntes);
  const iNeg = idx("negocio", iCon);
  const iVayas = idx("vayas", iNeg);
  const i12c = idx("12", iVayas);
  const iSeguime = idx("seguime", i12c);
  const iHist = idx("historias", iSeguime);

  // ---- escenas ----
  const H = W(iB) - 3;
  const S = {
    firma: H,
    wayne: W(iRonald) - 2,
    dias: W(i12a) - 2,
    venta: W(iVendio) - 2,
    papel: W(iAnos) - 2,
    socios: W(iLos) - 2,
    apple: W(iEra) - 2,
    subasta: W(i2011 - 1) - 2,
    fue: W(iWayne2) - 2,
    negocio: W(iCon) - 2,
    cta: W(iSeguime),
  };
  const raw: [SceneId, number][] = [["hook", 0], ...(Object.entries(S) as [SceneId, number][])];
  const scenes = raw.filter(([, s], i) => i === 0 || s > raw[i - 1][1]);
  let si = 0;
  while (si < scenes.length - 1 && f >= scenes[si + 1][1]) si++;
  const sceneStart = scenes[si][1];
  const sceneEnd = si + 1 < scenes.length ? scenes[si + 1][1] : END;

  // ---- tiempos clave ----
  const land1976 = W(i1976) + 2;
  const signAt = W(iFirmaron);
  const glow10 = W(i10);
  const circle12 = W(i12a) + 10;
  const debtsAt = W(iMiedo) - 2;
  const slam800 = W(i800);
  const slam500 = W(i500);
  const tSteve = W(iSteve);
  const tWoz = W(iWoz) - 2;
  const tApple = W(iApple);
  const slamAuc = W(iDol2);
  const tAntes = W(iAntes);
  const tVayas = W(iVayas);
  const tBtn = S.cta + 4;

  // ---- ganchos ----
  const hk = {
    dol: idx("dólares"),
    por: idx("por", idx("dólares")),
    cuanto: idx("cuánto"),
    seg: idx("2"),
    hombre: idx("hombre"),
    diez: idx("10"),
    apple: idx("apple"),
    vendio: idx("vendió"),
    ochoc: idx("800"),
    gig: idx("gigante"),
    doce: idx("12"),
    dejaste: idx("dejaste"),
    videos: idx("videos"),
    funcion: idx("funcionaban"),
    mira: idx("mirá"),
  };
  const tTimer = E(hk.seg) + 2;

  const renderHook = (): React.ReactNode => {
    if (v === 1) {
      const slam = W(hk.dol);
      const count = ln(f, 0, slam, 0, 1594500, eio);
      return (
        <>
          <Garage f={f} />
          <Contract x={540} y={1180 - (1 - drop(f, -4, fps)) * 900} s={0.95} rot={-4} f={f} />
          <PriceCard x={540} y={640} label="SE SUBASTÓ POR" value={usd(count)} s={(1 + 0.08 * bump(f, slam)) * (1 + 0.015 * Math.sin(f * 0.4))} shake={f > slam - 4 && f < slam + 10 ? 10 * Math.sin(f * 3) : 0} note={f >= slam ? "NUEVA YORK · 2011" : undefined} glow={decay(f, slam, 10) + 0.25 * (0.5 + 0.5 * Math.sin(f * 0.3))} rot={1.2 * Math.sin(f * 0.12)} />
          <Coins f={f} at={slam} x={540} y={660} />
          <Sparks f={f} at={slam} x={540} y={660} n={20} spread={420} />
          {f >= W(hk.por) ? <Pill x={540 + 10 * Math.sin(f * 0.3)} y={900} text="¿Por qué?" s={pop(f, W(hk.por), fps)} size={80} rot={5 * Math.sin(f * 0.25)} /> : null}
          <Label text="RECREACIÓN ILUSTRADA" />
        </>
      );
    }
    if (v === 2) {
      const k = Math.max(0, Math.min(1, (f - tTimer) / 60));
      const ringR = 320;
      return (
        <>
          <Garage f={f} lamp={0.7 + 0.3 * k} />
          <Contract x={540} y={1180 - (1 - drop(f, -4, fps)) * 900} s={0.95} rot={-3} f={f} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <circle cx={540} cy={1180} r={ringR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
            <circle cx={540} cy={1180} r={ringR} fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${(1 - k) * 2 * Math.PI * ringR} ${2 * Math.PI * ringR}`} transform="rotate(-90 540 1180)" style={{ filter: "drop-shadow(0 0 12px rgba(74,222,128,0.8))" }} />
          </svg>
          <PriceCard x={540} y={650} label="¿CUÁNTO VALE?" value={k >= 1 ? "US$ ?.???.???" : `US$ ${String(Math.floor(rnd(Math.floor(f / 2)) * 9000000)).padStart(7, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`} s={(1 + 0.015 * Math.sin(f * 0.4)) * (1 + 0.1 * bump(f, tTimer + 60))} glow={0.3} rot={1.2 * Math.sin(f * 0.12)} />
          {f >= W(hk.seg) ? <Pill x={540} y={880} text={`${(2 * (1 - k)).toFixed(1).replace(".", ",")} s`} s={pop(f, W(hk.seg), fps) * (1 + 0.15 * bump(f, tTimer + 60))} size={72} dark /> : null}
          <Label text="RECREACIÓN ILUSTRADA" />
        </>
      );
    }
    if (v === 3) {
      const out = ln(f, W(hk.vendio), W(hk.vendio) + 14, 0, 1, eo);
      return (
        <>
          <Studio f={f} tint="#2A2238" />
          <Bust x={290} y={1250} s={1.5} f={f} lit={ln(f, W(hk.diez), W(hk.diez) + 8)} />
          <Pie x={720} y={1150} r={230} f={f} glow={ln(f, W(hk.diez), W(hk.diez) + 8)} out={ln(f, W(hk.diez), W(hk.diez) + 8) * (1 - out)} fly={out * 0.9} />
          {f >= W(hk.apple) ? <Pill x={720} y={820} text="APPLE" s={pop(f, W(hk.apple), fps)} size={74} rot={2 * Math.sin(f * 0.2)} /> : null}
          {f >= W(hk.ochoc) ? <PriceCard x={540} y={1440} label="LO VENDIÓ POR" value="US$ 800" s={pop(f, W(hk.ochoc), fps) * 0.85} glow={decay(f, W(hk.ochoc), 10)} rot={1.2 * Math.sin(f * 0.12)} /> : null}
          <Sparks f={f} at={W(hk.ochoc)} x={540} y={1440} n={18} color={C.green} spread={360} />
          <Label text="SILUETA ILUSTRADA" x={72} y={1720} />
        </>
      );
    }
    if (v === 4) {
      const dd = ln(f, W(hk.doce) - 24, W(hk.doce), 0, 12);
      const out = ln(f, W(hk.doce) + 4, W(hk.doce) + 18, 0, 1, eo);
      return (
        <>
          <Studio f={f} tint="#22283A" />
          <Pie x={540} y={1120} r={300} f={f} glow={ln(f, W(hk.diez), W(hk.diez) + 8)} out={ln(f, W(hk.diez), W(hk.diez) + 8) * (1 - out)} fly={out * 0.9} />
          {f >= W(hk.gig) - 2 ? <Pill x={540} y={760} text="EMPRESA GIGANTE" s={pop(f, W(hk.gig) - 2, fps)} size={60} dark rot={2 * Math.sin(f * 0.2)} /> : null}
          {f >= W(hk.doce) - 24 ? <Pill x={540} y={1500} text={`DÍA ${Math.max(1, Math.floor(dd))}`} s={pop(f, W(hk.doce) - 24, fps) * (1 + 0.15 * bump(f, W(hk.doce)))} size={92} rot={3 * Math.sin(f * 0.2)} /> : null}
          <Sparks f={f} at={W(hk.doce)} x={540} y={1500} n={18} color={C.red} spread={300} />
        </>
      );
    }
    // v5: nicho
    const outPh = ln(f, W(hk.mira) - 2, W(hk.mira) + 10, 0, 1, eio);
    const drop0 = W(hk.mira) + 2;
    return (
      <>
        <Garage f={f} lamp={0.4 + 0.6 * outPh} />
        {outPh < 1 ? (
          <DarkPhone x={540 - 900 * outPh} y={1060} s={0.95} f={f}>
            <Shop t={t} />
          </DarkPhone>
        ) : null}
        {f >= W(hk.dejaste) && outPh < 1 ? <Pill x={540 - 900 * outPh} y={1500} text="Dejé de subir" s={pop(f, W(hk.dejaste), fps)} size={70} dark rot={-3 + 2 * Math.sin(f * 0.2)} /> : null}
        {f >= drop0 - 8 ? <Contract x={540} y={1180 - (1 - drop(f, drop0 - 8, fps)) * 1100} s={0.95} rot={-4} f={f} /> : null}
        <Label text={f >= drop0 ? "RECREACIÓN ILUSTRADA" : "PARA NEGOCIOS"} />
      </>
    );
  };

  const renderScene = (id: SceneId): React.ReactNode => {
    switch (id) {
      case "hook":
        return renderHook();
      case "firma": {
        const sign = ln(f, signAt + 2, W(iContrato) + 14, 0, 3);
        return (
          <>
            <Garage f={f} />
            <Contract x={540} y={1150} s={1.12} sign={sign} rot={-2} f={f} tilt={0.5} />
            {/* tres manos con lapicera (siluetas) que firman de a una */}
            {sign > 0 && sign < 3 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                {(() => {
                  const i = Math.min(2, Math.floor(sign));
                  const p = sign - i;
                  const px = 540 + (-230 + 40 + i * 140 + 6 + 120 * p - 0) * 1.12;
                  const py = 1150 + (518 - 300 - 4 * Math.sin(p * 30)) * 1.12;
                  return (
                    <g transform={`translate(${px} ${py}) rotate(${-8 + 6 * Math.sin(f * 0.9)})`}>
                      <path d="M0 0 L-10 -36 L10 -36 Z" fill="#C9C2B4" />
                      <rect x={-11} y={-220} width={22} height={186} rx={10} fill="#1E1A28" />
                      <ellipse cx={28} cy={-140} rx={64} ry={48} fill={["#C98F68", "#E8B48C", "#B07656"][i]} />
                      <path d="M56 -160 L250 -300 L310 -230 L100 -100 Z" fill={["#3A3646", "#4A3A2A", "#2E3A5C"][i]} />
                    </g>
                  );
                })()}
              </svg>
            ) : null}
            {f >= land1976 - 2 ? <Pill x={540} y={700} text="1976" s={(1 + 0.15 * bump(f, land1976)) * pop(f, land1976 - 2, fps)} size={110} rot={2 * Math.sin(f * 0.15)} /> : null}
            <Sparks f={f} at={land1976} x={540} y={700} n={18} color={C.cream} spread={320} />
            {[0, 1, 2].map((i) => (
              <Sparks key={i} f={f} at={Math.round(signAt + 2 + ((W(iContrato) + 12 - signAt - 2) / 3) * (i + 1))} x={540 + (-190 + 40 + i * 140 + 110) * 1.12} y={1150 + 218 * 1.12} n={8} color="#9FB4FF" spread={90} dur={12} />
            ))}
            <Label text="RECREACIÓN ILUSTRADA" />
          </>
        );
      }
      case "wayne": {
        const g = ln(f, glow10, glow10 + 10);
        return (
          <>
            <Studio f={f} tint="#2A2238" />
            <Bust x={250} y={1500} s={1.2} f={f} color="#120E18" seed={1} />
            <Bust x={830} y={1500} s={1.2} f={f} color="#120E18" seed={2} />
            <Bust x={540} y={1560} s={1.45} f={f} seed={3} lit={g} />
            <Pie x={540} y={1000} r={250} f={f} glow={g} out={g} />
            <BigName text="Ronald Wayne" f={f} at={W(iRonald)} fps={fps} y={600} size={112} />
            <Sparks f={f} at={glow10 + 2} x={540 + 160} y={900} n={18} spread={300} />
            <Label text="SILUETAS ILUSTRADAS" x={72} y={1740} />
          </>
        );
      }
      case "dias": {
        const day = ln(f, S.dias + 2, circle12 - 2, 0, 11.99, Easing.out(Easing.quad));
        const circle = ln(f, circle12, circle12 + 10);
        const red = ln(f, debtsAt, debtsAt + 12);
        return (
          <>
            <Studio f={f} tint="#2A1E2A" />
            <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(229,72,77,${0.28 * red}) 0%, rgba(0,0,0,0) 70%)` }} />
            <Calendar x={540} y={1060} s={1.2 - 0.12 * red} day={day} f={f} circle={circle} />
            <Debts f={f} from={debtsAt} />
            <Sparks f={f} at={circle12} x={540} y={1060} n={14} color={C.red} spread={260} />
          </>
        );
      }
      case "venta": {
        const fly = ln(f, slam800 - 10, slam800 + 6, 0, 1, Easing.in(Easing.cubic));
        return (
          <>
            <Studio f={f} tint="#1E2A26" />
            <Pie x={540} y={1180} r={250} f={f} glow={1 - fly} out={1 - fly} fly={fly} />
            <PriceCard x={540} y={720} label="VENDIÓ SU 10 % POR" value={usd(ln(f, S.venta + 2, slam800, 0, 800, eio))} s={(1 + 0.08 * bump(f, slam800)) * (1 + 0.015 * Math.sin(f * 0.4))} shake={f > slam800 - 3 && f < slam800 + 8 ? 9 * Math.sin(f * 3) : 0} note={f >= slam800 ? "12 DE ABRIL DE 1976" : undefined} glow={decay(f, slam800, 10)} rot={1.2 * Math.sin(f * 0.12)} />
            <Sparks f={f} at={slam800} x={540} y={720} n={20} color={C.green} spread={380} />
          </>
        );
      }
      case "papel": {
        const slide = ln(f, slam500 - 14, slam500 + 4, 0, 1, eio);
        return (
          <>
            <Garage f={f} lamp={0.8} />
            <Contract x={540 + 380 * slide} y={1150} s={1.0} rot={-4 + 10 * slide} f={f} tilt={0.6} />
            {f >= slam500 - 4 ? (
              <div style={{ position: "absolute", left: 600, top: 760, transform: `rotate(${12 + 10 * Math.sin(f * 0.22)}deg) scale(${pop(f, slam500 - 4, fps) * (1 + 0.15 * bump(f, slam500))})`, transformOrigin: "0 50%" }}>
                <svg width={300} height={140} viewBox="0 0 300 140">
                  <path d="M40 8 L290 8 L290 132 L40 132 L6 70 Z" fill={C.cream} />
                  <circle cx={40} cy={70} r={11} fill={C.ink} />
                  <text x={170} y={95} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={70} fill={C.ink}>
                    US$ 500
                  </text>
                </svg>
              </div>
            ) : null}
            <Pill x={540} y={640} text="Principios de los 90" s={pop(f, S.papel + 4, fps)} size={54} dark rot={2 * Math.sin(f * 0.18)} />
            <Sparks f={f} at={slam500} x={700} y={830} n={16} color={C.cream} spread={280} />
            <Label text="RECREACIÓN ILUSTRADA" />
          </>
        );
      }
      case "socios": {
        const l1 = ln(f, tSteve - 2, tSteve + 8);
        const l2 = ln(f, tWoz, tWoz + 8);
        return (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg, #0E0C16 0%, #1E1830 60%, #0E0C12 100%)" }} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="spt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF0D0" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#FFF0D0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <g opacity={l1} transform={`rotate(${3 * Math.sin(f * 0.08)} 300 0)`}>
                <path d="M260 0 L340 0 L520 1700 L80 1700 Z" fill="url(#spt)" />
              </g>
              <g opacity={l2} transform={`rotate(${-3 * Math.sin(f * 0.08)} 780 0)`}>
                <path d="M740 0 L820 0 L1000 1700 L560 1700 Z" fill="url(#spt)" />
              </g>
            </svg>
            <Bust x={300} y={1450} s={1.35} f={f} color="#0A080E" seed={4} lit={l1 * 0.6} />
            <Bust x={780} y={1450} s={1.35} f={f} color="#0A080E" seed={5} lit={l2 * 0.6} />
            <BigName text="Steve Jobs" f={f} at={tSteve} fps={fps} y={640} size={104} />
            <BigName text="Steve Wozniak" f={f} at={tWoz} fps={fps} y={770} size={104} />
            <Dust f={f} x0={150} x1={950} y0={500} y1={1600} n={30} color="#FFF0D0" />
            <Label text="SILUETAS ILUSTRADAS" x={72} y={1740} />
          </>
        );
      }
      case "apple": {
        const gl = ln(f, tApple - 2, tApple + 12);
        return (
          <>
            <Studio f={f} tint="#2A2010" />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: gl }}>
              <g transform={`translate(540 1150) rotate(${f * 0.8})`}>
                {Array.from({ length: 14 }, (_, i) => (
                  <path key={i} d="M0 0 L50 -1000 L-50 -1000 Z" fill="#F7B955" opacity={0.18} transform={`rotate(${i * 25.7})`} />
                ))}
              </g>
            </svg>
            <div style={{ position: "absolute", left: 140, top: 750, width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, rgba(247,185,85,${0.4 * gl}) 0%, rgba(247,185,85,0) 65%)`, transform: `scale(${1 + 0.06 * Math.sin(f * 0.3)})` }} />
            <Contract x={540} y={1180} s={1.05} glow={gl} rot={-3} f={f} />
            <BigName text="APPLE" f={f} at={tApple} fps={fps} y={600} size={170} />
            {gl > 0 ? <Dust f={f} x0={300} x1={780} y0={700} y1={1500} n={40} color="#FFD27A" /> : null}
            <Sparks f={f} at={tApple + 2} x={540} y={1180} n={26} spread={520} />
            <Label text="RECREACIÓN ILUSTRADA" />
          </>
        );
      }
      case "subasta":
        return (
          <>
            <Auction f={f} from={S.subasta} />
            <Contract x={540} y={1080} s={0.55} rot={-2} f={f} />
            <PriceCard x={540} y={640} label="SUBASTA · NUEVA YORK · 2011" value={usd(ln(f, S.subasta + 6, slamAuc, 500, 1594500, eio))} s={(1 + 0.08 * bump(f, slamAuc)) * (1 + 0.015 * Math.sin(f * 0.4))} note={f >= slamAuc ? "LO HABÍA VENDIDO POR US$ 500" : undefined} glow={decay(f, slamAuc, 10) + 0.2} rot={1.2 * Math.sin(f * 0.12)} />
            <Coins f={f} at={slamAuc} x={540} y={660} />
            <Sparks f={f} at={slamAuc} x={540} y={660} n={22} color={C.green} spread={440} />
            <svg width={220} height={220} viewBox="-110 -110 220 220" style={{ position: "absolute", left: 760, top: 820, overflow: "visible" }}>
              <g transform={`rotate(${f < slamAuc - 6 ? -40 + 8 * Math.sin(f * 0.3) : f < slamAuc ? -40 + 50 * ((f - (slamAuc - 6)) / 6) : 10 - 10 * Math.min(1, (f - slamAuc) / 8)})`}>
                <rect x={-10} y={-10} width={20} height={150} rx={8} fill="#8A5A2B" />
                <rect x={-60} y={-46} width={120} height={50} rx={14} fill="#B07A44" />
              </g>
            </svg>
          </>
        );
      case "fue": {
        const walk = ln(f, S.fue, sceneEndOf("fue"), 0, 1);
        const grow = ln(f, tAntes - 4, tAntes + 30, 0, 1, eo);
        return (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg, #0C0E1C 0%, #1E2240 60%, #12101A 100%)" }} />
            <Bokeh f={f} color="#B98CFF" seed={9} n={10} />
            <Tower f={f} grow={grow} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 1500, bottom: 0, background: "#0A0A12" }} />
            <Walker x={520 - 380 * walk} y={1500} s={1.25} f={f} />
            <Pill x={540} y={700} text="Se fue en el día 12" s={pop(f, S.fue + 4, fps)} size={62} dark rot={2 * Math.sin(f * 0.18)} />
            <Label text="ILUSTRACIÓN" x={72} y={1740} />
          </>
        );
      }
      case "negocio": {
        const day = Math.floor(ln(f, tVayas, sceneEndOf("negocio"), 12, 30));
        return (
          <>
            <Studio f={f} tint="#1E2A26" />
            <DarkPhone x={540} y={1120} s={0.86} lift={(1 - drop(f, S.negocio - 2, fps)) * 1300} f={f} ry={-25 * (1 - ln(f, S.negocio, S.negocio + 14, 0, 1, eo))}>
              {f < tVayas ? <Shop t={t} /> : <Hero t={t} f={f} from={tVayas} />}
            </DarkPhone>
            {f >= W(i12c) - 2 ? <Pill x={540} y={660} text={`DÍA ${day}`} s={pop(f, W(i12c) - 2, fps) * (1 + 0.1 * bump(f, W(i12c)))} size={96} rot={2 * Math.sin(f * 0.2)} /> : null}
            <Sparks f={f} at={tVayas} x={540} y={1120} n={18} color={C.green} spread={360} />
          </>
        );
      }
      case "cta":
        return (
          <>
            <Studio f={f} tint="#3A2030" />
            <BigName text="Seguime" f={f} at={S.cta} fps={fps} y={520} size={150} />
            <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%, -50%) scale(${pop(f, tBtn, fps) * (1 + 0.06 * Math.sin(f * 0.4))})`, padding: "18px 80px 24px", borderRadius: 26, background: C.orange, color: C.white, fontFamily: PF, fontWeight: 800, fontSize: 64, boxShadow: `0 10px 0 rgba(0,0,0,0.4), 0 0 ${40 + 30 * Math.sin(f * 0.4)}px rgba(255,106,43,0.6)` }}>Seguir</div>
            <Tap x={600} y={830} f={f} from={tBtn + 8} />
            {f >= W(iHist) - 4 ? (
              <div style={{ position: "absolute", left: 540, top: 1060, transform: `translate(-50%, -50%) scale(${pop(f, W(iHist) - 4, fps)}) rotate(${1.2 * Math.sin(f * 0.15)}deg)`, width: 820, borderRadius: 28, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, padding: "26px 0 30px", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 28, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>MÁS HISTORIAS COMO ESTA</div>
                <div style={{ fontFamily: PF, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.15 }}>
                  papeles que valen <span style={{ color: C.green }}>millones</span>
                </div>
              </div>
            ) : null}
            <Contract x={540} y={1460} s={0.48} glow={1} rot={-8} f={f} />
            <Sparks f={f} at={tBtn} x={540} y={800} n={22} color={C.orange} spread={360} />
          </>
        );
    }
  };
  function sceneEndOf(id: SceneId) {
    const k = scenes.findIndex(([s]) => s === id);
    return k >= 0 && k + 1 < scenes.length ? scenes[k + 1][1] : END;
  }

  // ---- cámara viva (sin zoom por palabra): flota, empuja en cada escena y tiembla en los impactos ----
  const impacts = [v === 1 ? W(hk.dol) : -99, v === 2 ? tTimer + 60 : -99, v === 3 ? W(hk.ochoc) : -99, v === 4 ? W(hk.doce) : -99, land1976, glow10, circle12, slam800, slam500, tSteve, tApple, slamAuc, tVayas, tBtn];
  const shake = impacts.reduce((a, at) => a + decay(f, at, 3), 0);
  const prog = ln(f, sceneStart, sceneEnd, 0, 1, eio);
  const camX = 9 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.1) + shake * 10 * Math.sin(f * 2.7);
  const camY = 7 * Math.sin(t * 1.05 + 1) + shake * 8 * Math.cos(f * 3.3);
  const camR = 0.6 * Math.sin(t * 0.9) + shake * 0.6 * Math.sin(f * 2.1);
  const camS = 1 + 0.1 * prog;

  // ---- transición entre escenas: barrido, zoom o destello (alternando) ----
  const TR = 9;
  const local = f - sceneStart;
  const inTr = si > 0 && local < TR;
  const kind = si % 3;
  const p = inTr ? eo(local / TR) : 1;
  const sceneNow = renderScene(scenes[si][0]);
  const scenePrev = inTr ? renderScene(scenes[si - 1][0]) : null;
  const dir = si % 2 ? 1 : -1;
  const trNow: React.CSSProperties = !inTr ? {} : kind === 0 ? { transform: `translateX(${dir * 1100 * (1 - p)}px)`, filter: `blur(${18 * (1 - p)}px)` } : kind === 1 ? { transform: `scale(${1.6 - 0.6 * p})`, opacity: p, filter: `blur(${14 * (1 - p)}px)` } : { opacity: p };
  const trPrev: React.CSSProperties = kind === 0 ? { transform: `translateX(${-dir * 1100 * p}px)`, filter: `blur(${18 * p}px)` } : kind === 1 ? { transform: `scale(${1 + 0.4 * p})`, opacity: 1 - p } : { opacity: 1 - p };
  const flash = inTr && kind === 2 ? 1 - p : 0;

  const hideCaps = f >= S.cta;
  const transitionAts = scenes.slice(1).map(([, s]) => s);
  const popAts = [land1976 - 2, glow10, circle12, S.papel + 4, slam500 - 4, S.fue + 4, W(i12c) - 2, W(iHist) - 4, ...(v === 1 ? [W(hk.por)] : []), ...(v === 2 ? [W(hk.seg)] : []), ...(v === 3 ? [W(hk.apple)] : []), ...(v === 4 ? [W(hk.gig) - 2, W(hk.doce) - 24] : []), ...(v === 5 ? [W(hk.dejaste)] : [])];

  return (
    <AbsoluteFill style={{ background: "#0E0B12", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "540px 1000px", transform: `translate(${camX}px, ${camY}px) rotate(${camR}deg) scale(${camS})` }}>
        {scenePrev ? <AbsoluteFill style={trPrev}>{scenePrev}</AbsoluteFill> : null}
        <AbsoluteFill style={trNow}>{sceneNow}</AbsoluteFill>
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "#FFF6E6", opacity: flash * 0.85 }} /> : null}
      <Vignette />
      <Grain f={f} />
      {hideCaps ? null : <Subs words={words} f={f} fps={fps} />}

      <Audio src={staticFile(`audio/voz_contrato_${v}.wav`)} />
      <Audio src={staticFile(`audio/musica_contrato_${v}.wav`)} volume={0.22} />

      {transitionAts.map((at) => (
        <Snd key={`w${at}`} at={at - 3} src="sfx/whoosh.wav" vol={0.35} />
      ))}
      {popAts.map((at) => (
        <Snd key={`p${at}`} at={at} src="sfx/pop.wav" vol={0.4} />
      ))}
      {v === 1 ? (
        <>
          <Snd at={Math.max(0, W(hk.dol) - 2)} src="sfx/hit.wav" vol={0.6} />
          <Snd at={W(hk.dol)} src={SOUND.impacto} vol={0.8} />
        </>
      ) : null}
      {v === 2 ? (
        <>
          {[0, 15, 30, 45].map((k) => (
            <Snd key={k} at={tTimer + k} src="sfx/click.wav" vol={0.45} />
          ))}
          <Snd at={tTimer + 60} src={SOUND.impacto} vol={0.6} />
        </>
      ) : null}
      {v === 3 ? <Snd at={W(hk.ochoc)} src={SOUND.impacto} vol={0.7} /> : null}
      {v === 4 ? <Snd at={W(hk.doce)} src={SOUND.impacto} vol={0.7} /> : null}
      {v === 5 ? <Snd at={W(hk.mira) + 2} src={SOUND.impacto} vol={0.5} /> : null}
      <Snd at={land1976} src={SOUND.impacto} vol={0.5} />
      <Snd at={signAt + 2} src={SOUND.tension} vol={0.22} />
      <Snd at={circle12} src="sfx/hit.wav" vol={0.45} />
      <Snd at={debtsAt} src={SOUND.tension} vol={0.35} />
      <Snd at={slam800 - 1} src="sfx/hit.wav" vol={0.55} />
      <Snd at={slam800} src={SOUND.impacto} vol={0.6} />
      <Snd at={slam500} src={SOUND.impacto} vol={0.45} />
      <Snd at={tSteve} src="sfx/hit.wav" vol={0.4} />
      <Snd at={tWoz} src="sfx/hit.wav" vol={0.4} />
      <Snd at={tApple} src="sfx/cristal.wav" vol={0.45} />
      <Snd at={tApple} src={SOUND.impacto} vol={0.6} />
      <Snd at={Math.max(0, slamAuc - 2)} src="sfx/hit.wav" vol={0.6} />
      <Snd at={slamAuc} src={SOUND.impacto} vol={0.8} />
      <Snd at={tVayas} src="sfx/pop.wav" vol={0.4} />
      <Snd at={tBtn} src="sfx/pop.wav" vol={0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Snd key={`c${i}`} at={tBtn + 8 + i * 24 + 4} src="sfx/click.wav" vol={0.3} />
      ))}
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const ContratoPortada: React.FC<{ v?: number }> = ({ v = 1 }) => {
  const lines: Record<number, string[]> = {
    1: ["Este papel", "se subastó por", "US$ 1.594.500"],
    2: ["¿Cuánto vale", "este papel?", "Tenés 2 segundos"],
    3: ["Tenía el 10 %", "de Apple y lo", "vendió por US$ 800"],
    4: ["Dueño del 10 %", "de una gigante…", "durante 12 días"],
    5: ["¿Dejaste de", "subir videos?", "Mirá este papel"],
  };
  const L = lines[v];
  return (
    <AbsoluteFill style={{ background: "#0E0B12" }}>
      <Garage f={20} />
      <Contract x={540} y={1200} s={1} rot={-4} f={10} />
      <Vignette />
      <div style={{ position: "absolute", left: 60, width: 960, top: 300, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 98, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.white, textShadow: "0 8px 30px rgba(0,0,0,0.7)" }}>
        {L.map((l, k) =>
          k === L.length - 1 ? (
            <div key={k} style={{ display: "inline-block", marginTop: 14, padding: "4px 36px 14px", borderRadius: 999, background: C.cream, color: v === 1 ? "#15803D" : C.ink, boxShadow: "0 12px 0 rgba(0,0,0,0.45)" }}>
              {l}
            </div>
          ) : (
            <div key={k}>{l}</div>
          ),
        )}
      </div>
      <Grain f={0} />
    </AbsoluteFill>
  );
};
