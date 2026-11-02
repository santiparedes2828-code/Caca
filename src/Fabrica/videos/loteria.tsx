import React from "react";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-loteria-1.json";
import c2 from "../../data/captions-loteria-2.json";
import c3 from "../../data/captions-loteria-3.json";
import { SOUND } from "../../Altera/system";
import type { Ctx, Video } from "../Motor";
import { PF } from "../Motor";
import { Bokeh, C, CTAComentar, Coins, Dust, Label, Pill, PortadaTexto, PriceCard, Sparks, Stars, Studio, bump, decay, eio, eo, ln, pop, rnd } from "../kit";

// «¿Qué tan difícil es ganar la lotería?» — Fábrica viral (2026-11-02). Investigación y fuentes:
// produccion/loteria/investigacion.md. Powerball: 5 de 69 + 1 de 26 = 292.201.338 combinaciones; INDEC 2022: 46 M;
// un boleto por semana ≈ 5,6 M de años; pozo récord de 2.040 M (2022, un solo boleto). Sin logos de marcas.

const SKY = "#7CC4FF";
const LILA = "#C9A0FF";
const ROJO = "#E5484D";

// ---------- piezas ----------
const Bolilla: React.FC<{ x: number; y: number; r?: number; n: number; roja?: boolean; s?: number; rot?: number }> = ({ x, y, r = 44, n, roja = false, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <circle r={r} fill={roja ? "#D9363E" : "#F7F4EE"} />
    <circle r={r} fill="url(#bolBrillo)" />
    <circle r={r * 0.52} fill={roja ? "#F7F4EE" : "#FFFFFF"} opacity={roja ? 1 : 0.9} />
    <text y={r * 0.2} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={r * 0.62} fill={roja ? "#B4222A" : "#1E1A28"}>
      {n}
    </text>
  </g>
);
const BolDefs = () => (
  <defs>
    <radialGradient id="bolBrillo" cx="32%" cy="28%" r="70%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
      <stop offset="35%" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="100%" stopColor="#000000" stopOpacity={0.28} />
    </radialGradient>
  </defs>
);

/** Bombo que gira con bolillas adentro. */
const Bombo: React.FC<{ x: number; y: number; R?: number; f: number; s?: number; vel?: number }> = ({ x, y, R = 260, f, s = 1, vel = 1 }) => {
  const a = f * 0.05 * vel;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <BolDefs />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x={-30} y={R - 20} width={60} height={160} fill="#3A3646" />
        <rect x={-160} y={R + 130} width={320} height={30} rx={12} fill="#2A2632" />
        <circle r={R + 14} fill="rgba(124,196,255,0.08)" stroke="#C9C2D6" strokeWidth={10} />
        {Array.from({ length: 30 }, (_, i) => {
          const rr = (0.25 + 0.65 * rnd(i)) * R;
          const ang = a * (0.8 + 0.6 * rnd(i + 3)) + i * 2.1;
          return <Bolilla key={i} x={rr * Math.cos(ang)} y={rr * Math.sin(ang) * 0.9 + 30 * Math.sin(f * 0.2 + i)} r={30} n={1 + Math.floor(rnd(i + 7) * 69)} roja={i % 9 === 0} rot={f * 3 + i * 40} />;
        })}
        <g transform={`rotate(${(a * 180) / Math.PI})`}>
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1={0} y1={0} x2={(R + 10) * Math.cos((i * Math.PI) / 4)} y2={(R + 10) * Math.sin((i * Math.PI) / 4)} stroke="#C9C2D6" strokeWidth={5} opacity={0.6} />
          ))}
          <circle r={R + 14} fill="none" stroke="#E8E2F2" strokeWidth={4} strokeDasharray="30 18" />
        </g>
        <circle r={22} fill="#C9C2D6" />
        <g transform={`rotate(${(a * 180) / Math.PI} 0 0)`}>
          <rect x={R + 10} y={-8} width={70} height={16} rx={8} fill="#8E88A0" />
          <circle cx={R + 84} cy={0} r={18} fill={C.gold} />
        </g>
      </g>
    </svg>
  );
};

/** Boleto con 5 números y uno rojo (sin logos). */
const Boleto: React.FC<{ x: number; y: number; s?: number; rot?: number; nums?: number[]; roja?: number; llenos?: number; glow?: number }> = ({ x, y, s = 1, rot = 0, nums = [7, 18, 23, 41, 66], roja = 12, llenos = 6, glow = 0 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <BolDefs />
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} style={{ filter: `drop-shadow(0 16px 20px rgba(0,0,0,0.45))${glow > 0 ? ` drop-shadow(0 0 ${30 * glow}px rgba(247,185,85,${0.9 * glow}))` : ""}` }}>
      <rect x={-300} y={-120} width={600} height={240} rx={22} fill="#FBF3E2" />
      <rect x={-300} y={-120} width={600} height={56} rx={22} fill={C.gold} />
      <rect x={-300} y={-84} width={600} height={20} fill={C.gold} />
      <text x={-276} y={-82} fontFamily={PF} fontWeight={800} fontSize={30} fill="#5A3A10" letterSpacing={3}>
        LOTERÍA · EE. UU.
      </text>
      {nums.map((n, i) => (i < llenos ? <Bolilla key={i} x={-230 + i * 92} y={10} r={36} n={n} /> : <circle key={i} cx={-230 + i * 92} cy={10} r={36} fill="none" stroke="#C9B48A" strokeWidth={4} strokeDasharray="8 6" />))}
      {llenos > 5 ? <Bolilla x={230} y={10} r={36} n={roja} roja /> : <circle cx={230} cy={10} r={36} fill="none" stroke={ROJO} strokeWidth={4} strokeDasharray="8 6" />}
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={i} x={-270 + i * 18} y={70} width={i % 3 ? 6 : 10} height={34} fill="#2A2632" opacity={0.7} />
      ))}
    </g>
  </svg>
);

/** Lluvia de boletos (densidad 0..1). */
const LluviaBoletos: React.FC<{ f: number; desde: number; dens?: number }> = ({ f, desde, dens = 1 }) => {
  const k = f - desde;
  if (k < 0) return null;
  const n = Math.round(10 + 40 * dens);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const sp = 9 + 10 * rnd(i);
        const x = rnd(i + 2) * 1080 + 40 * Math.sin(k * 0.08 + i);
        const y = ((rnd(i + 5) * 2200 + k * sp) % 2200) - 200;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(k * (3 + 4 * rnd(i + 1)) + i * 37) % 360})`}>
            <rect x={-46} y={-20} width={92} height={40} rx={6} fill="#FBF3E2" opacity={0.92} />
            <rect x={-46} y={-20} width={92} height={10} rx={4} fill={C.gold} />
          </g>
        );
      })}
    </svg>
  );
};

/** Multitud de personas (íconos sin cara); una dorada con foco. zoom 0 = de cerca, 1 = muy lejos. */
const Multitud: React.FC<{ f: number; zoom: number; foco?: number }> = ({ f, zoom, foco = 1 }) => {
  const sc = 1.6 - 1.35 * zoom;
  const cols = 34;
  const rows = 60;
  const gx = 64;
  const gy = 70;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(540 1150) scale(${sc})`}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const x = (c - cols / 2) * gx + (r % 2) * gx * 0.5;
            const y = (r - rows / 2) * gy;
            const yo = 3 * Math.sin(f * 0.2 + r * 0.7 + c);
            const yo2 = (r === rows / 2 && c === cols / 2) ? 0 : yo;
            const me = r === rows / 2 && c === cols / 2;
            const col = me ? C.gold : ["#3A3646", "#4A4458", "#2E2A3A", "#544C64"][(r * 7 + c * 3) % 4];
            return (
              <g key={`${r}-${c}`} transform={`translate(${x} ${y + yo2})`}>
                <circle cy={-22} r={14} fill={col} />
                <path d="M-22 18 Q-22 -6 0 -6 Q22 -6 22 18 Z" fill={col} />
              </g>
            );
          }),
        )}
        {foco > 0 ? <circle cx={0} cy={-4} r={46 + 6 * Math.sin(f * 0.3)} fill="none" stroke={C.gold} strokeWidth={6 / Math.max(0.3, sc)} opacity={foco} /> : null}
      </g>
    </svg>
  );
};

/** Seis banderas argentinas (franjas celeste-blanco-celeste) con multitudes. */
const SeisArgentinas: React.FC<{ f: number; fps: number; at: number }> = ({ f, fps, at }) => (
  <>
    {Array.from({ length: 6 }, (_, i) => {
      const p = f >= at + i * 3 ? pop(f, at + i * 3, fps) : 0;
      const x = 120 + (i % 3) * 300;
      const y = 1300 + Math.floor(i / 3) * 230;
      return p > 0 ? (
        <div key={i} style={{ position: "absolute", left: x - 10, top: y, width: 260, height: 170, borderRadius: 16, overflow: "hidden", transform: `scale(${p}) rotate(${2 * Math.sin(f * 0.15 + i)}deg)`, boxShadow: "0 12px 24px rgba(0,0,0,0.45)" }}>
          <div style={{ height: "33.3%", background: "#74ACDF" }} />
          <div style={{ height: "33.4%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F6B40E", transform: `rotate(${f * 2}deg)` }} />
          </div>
          <div style={{ height: "33.3%", background: "#74ACDF" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 4, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 26, color: "#1E3A5A" }}>46 M</div>
        </div>
      ) : null;
    })}
  </>
);

/** Reloj de arena que gira cada tanto. */
const Arena: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => {
  const ph = (f % 60) / 60;
  const flip = ph > 0.85 ? (ph - 0.85) / 0.15 : 0;
  const lvl = Math.min(1, ph / 0.85);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x} ${y}) scale(${s}) rotate(${180 * eio(flip)})`}>
        <rect x={-120} y={-200} width={240} height={24} rx={10} fill="#8A5A2B" />
        <rect x={-120} y={176} width={240} height={24} rx={10} fill="#8A5A2B" />
        <path d="M-90 -176 L90 -176 L10 0 L90 176 L-90 176 L-10 0 Z" fill="rgba(200,230,255,0.15)" stroke="#E8E2F2" strokeWidth={6} />
        <path d={`M${-70 * (1 - lvl)} ${-150 + 140 * lvl} L${70 * (1 - lvl)} ${-150 + 140 * lvl} L8 -6 L-8 -6 Z`} fill="#F2C470" />
        <path d={`M-80 172 L80 172 L${80 - 60 * lvl} ${172 - 120 * lvl} L${-80 + 60 * lvl} ${172 - 120 * lvl} Z`} fill="#F2C470" />
        <line x1={0} y1={0} x2={0} y2={172 - 120 * lvl} stroke="#F2C470" strokeWidth={4} opacity={lvl < 1 ? 1 : 0} />
      </g>
    </svg>
  );
};

const Trebol: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${8 * Math.sin(f * 0.1)})`}>
      <path d="M0 0 Q20 80 -10 160" stroke="#2E7A3A" strokeWidth={12} fill="none" strokeLinecap="round" />
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 0 C-40 -30 -50 -90 -12 -96 C0 -98 6 -88 0 -78 C-6 -88 0 -98 12 -96 C50 -90 40 -30 0 0 Z" fill="#3E9E4E" transform="scale(1.2)" />
        </g>
      ))}
    </g>
  </svg>
);

// ---------- el video ----------
const ib = (c: Ctx) => c.i("hay") - 6; // «En el Powerball de Estados Unidos hay…»

export const loteria: Video = {
  slug: "loteria",
  titulo: "¿Qué tan difícil es ganar la lotería?",
  captions: [c1, c2, c3] as Caption[][],
  colores: [
    [/^(powerball|lotería|boleto)$/i, C.gold],
    [/^(millones|dólares|pozo|gana|ganó|ganás|ganar)$/i, C.green],
    [/^(argentinas|persona|personas)$/i, SKY],
    [/^(años|semana)$/i, LILA],
    [/^(suerte)$/i, C.gold],
  ],

  gancho: (c) => {
    const { f, fps, v } = c;
    if (v === 1) {
      const t292 = c.w("292");
      const n = Math.round(ln(f, 0, t292 + 4, 1, 292201338, eio));
      return (
        <>
          <Studio f={f} tint="#2A2238" />
          <Bombo x={540} y={1250} f={f} vel={1.6} />
          <PriceCard x={540} y={700} label="TU CHANCE DE GANAR" value={`1 en ${n.toLocaleString("es-AR")}`} s={(1 + 0.08 * bump(f, t292 + 4)) * (1 + 0.015 * Math.sin(f * 0.4))} glow={decay(f, t292 + 4, 10) + 0.2} money={false} rot={1.2 * Math.sin(f * 0.12)} />
          <Sparks f={f} at={t292 + 4} x={540} y={700} n={20} color={C.gold} spread={380} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 2) {
      const t5 = c.w("5 millones");
      const anos = Math.round(ln(f, 0, t5 + 4, 1000, 5000000, eio)); // ya corre en el cuadro 0
      return (
        <>
          <Studio f={f} tint="#221E3A" />
          <Stars f={f} n={40} h={1900} />
          <LluviaBoletos f={f} desde={-200} dens={0.3} />
          <Arena x={540} y={1260} s={1.3} f={f} />
          <PriceCard x={540} y={700} label="1 BOLETO POR SEMANA" value={`${anos.toLocaleString("es-AR")} años`} s={(1 + 0.08 * bump(f, t5 + 4)) * (1 + 0.015 * Math.sin(f * 0.4))} glow={decay(f, t5 + 4, 10) + 0.2} money={false} rot={1.2 * Math.sin(f * 0.12)} />
          <Sparks f={f} at={t5 + 4} x={540} y={700} n={20} color={LILA} spread={380} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    const tArg = c.w("argentinas");
    return (
      <>
        <Studio f={f} tint="#1E2A3A" />
        <Multitud f={f} zoom={ln(f, 0, tArg + 6, 0, 1, eio)} />
        {f >= tArg ? <Pill x={540} y={760} text="× 6 ARGENTINAS" s={pop(f, tArg, fps)} size={70} rot={2 * Math.sin(f * 0.15)} /> : null}
        <Label text="ILUSTRACIÓN" x={72} y={1780} />
      </>
    );
  },

  escenas: [
    {
      id: "reglas",
      desde: (c) => c.W(ib(c)) - 3,
      dibujar: (c) => {
        const b = ib(c);
        const t5 = c.w("5", b);
        const t26 = c.w("26", b);
        const llenos = c.f < t5 ? 0 : c.f < t26 ? Math.min(5, 1 + Math.floor((c.f - t5) / 4)) : 6;
        return (
          <>
            <Studio f={c.f} tint="#2A2238" />
            <Bombo x={540} y={1020} R={230} f={c.f} vel={1.2} />
            <Boleto x={540} y={1530} s={1.3} f-unused={0} llenos={llenos} glow={decay(c.f, t26, 12)} />
            {c.f >= c.w("69", b) ? <Pill x={300} y={700} text="5 de 69" s={pop(c.f, c.w("69", b), c.fps)} size={60} rot={-3} /> : null}
            {c.f >= t26 ? <Pill x={790} y={700} text="+ 1 de 26" s={pop(c.f, t26, c.fps)} size={60} rot={3} dark /> : null}
            <Sparks f={c.f} at={t26} x={840} y={1530} n={16} color={ROJO} spread={260} />
            <Label text="POWERBALL (EE. UU.) · ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "combinaciones",
      desde: (c) => c.w("eso", ib(c)) - 2,
      dibujar: (c) => {
        const t292 = c.w("292", ib(c));
        const n = Math.round(ln(c.f, c.inicio, t292 + 4, 1000, 292201338, eio));
        return (
          <>
            <Studio f={c.f} tint="#2A2238" />
            <LluviaBoletos f={c.f} desde={c.inicio} dens={ln(c.f, c.inicio, t292 + 4, 0.2, 1)} />
            <PriceCard x={540} y={1050} label="COMBINACIONES POSIBLES" value={n.toLocaleString("es-AR")} s={(1 + 0.08 * bump(c.f, t292 + 4)) * (1 + 0.015 * Math.sin(c.f * 0.4))} glow={decay(c.f, t292 + 4, 10) + 0.2} money={false} rot={1.2 * Math.sin(c.f * 0.12)} />
            {c.f >= t292 + 4 ? <Pill x={540} y={1300} text="y solo 1 gana el pozo" s={pop(c.f, t292 + 4, c.fps)} size={54} dark /> : null}
            <Sparks f={c.f} at={t292 + 4} x={540} y={1050} n={22} color={C.gold} spread={420} />
          </>
        );
      },
    },
    {
      id: "argentinas",
      desde: (c) => c.w("es", c.i("combinaciones", ib(c))) - 2,
      dibujar: (c) => {
        const t6 = c.w("6", c.i("persona", ib(c)));
        const tArg = c.w("argentinas", ib(c));
        return (
          <>
            <Studio f={c.f} tint="#1E2A3A" />
            <div style={{ position: "absolute", inset: 0, transform: `translateY(${-320 * ln(c.f, t6 - 6, t6 + 10, 0, 1, eo)}px)` }}>
              <Multitud f={c.f} zoom={ln(c.f, c.inicio, t6, 0, 1, eio)} />
            </div>
            {c.f >= c.w("persona", ib(c)) ? <Pill x={540} y={700} text="1 persona al azar" s={pop(c.f, c.w("persona", ib(c)), c.fps)} size={56} dark /> : null}
            <SeisArgentinas f={c.f} fps={c.fps} at={t6} />
            {c.f >= tArg ? <Pill x={540} y={1210} text="más de 6 Argentinas enteras" s={pop(c.f, tArg, c.fps)} size={54} rot={2 * Math.sin(c.f * 0.15)} /> : null}
            <Label text="INDEC, CENSO 2022: 46 M DE HABITANTES" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "semana",
      desde: (c) => c.w("con", ib(c)) - 2,
      dibujar: (c) => {
        const t55 = c.w("55", ib(c));
        const anos = Math.round(ln(c.f, c.inicio + 4, t55 + 4, 0, 5619256, eio));
        return (
          <>
            <Studio f={c.f} tint="#221E3A" />
            <Stars f={c.f} n={50} h={1900} />
            <Arena x={540} y={1300} s={1.35} f={c.f} />
            {Array.from({ length: 4 }, (_, i) => {
              const ph = ((c.f + i * 9) % 36) / 36;
              return <div key={i} style={{ position: "absolute", left: 540 - 90 + ph * (i % 2 ? 380 : -380), top: 980 - ph * 280 + ph * ph * 460, width: 180, height: 110, borderRadius: 14, background: "#FBF3E2", opacity: 1 - ph, transform: `rotate(${ph * (i % 2 ? 140 : -140)}deg)`, boxShadow: "0 6px 0 rgba(0,0,0,0.3)", fontFamily: PF, fontWeight: 800, fontSize: 30, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>SEMANA</div>;
            })}
            <PriceCard x={540} y={720} label="1 BOLETO POR SEMANA" value={`${anos.toLocaleString("es-AR")} años`} s={(1 + 0.08 * bump(c.f, t55 + 4)) * (1 + 0.015 * Math.sin(c.f * 0.4))} glow={decay(c.f, t55 + 4, 10) + 0.2} money={false} rot={1.2 * Math.sin(c.f * 0.12)} />
            <Sparks f={c.f} at={t55 + 4} x={540} y={720} n={20} color={LILA} spread={380} />
            <Label text="EN PROMEDIO · 292.201.338 ÷ 52 SEMANAS" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "pozo",
      desde: (c) => c.w("y", c.i("55", ib(c))) - 2,
      dibujar: (c) => {
        const tPozo = c.w("2040", ib(c));
        const n = Math.round(ln(c.f, c.inicio, tPozo + 6, 1000000, 2040000000, eio)); // sube desde que empieza la escena
        return (
          <>
            <Studio f={c.f} tint="#14301E" />
            <Bokeh f={c.f} color="#7CFFB0" seed={8} n={10} />
            <Boleto x={540} y={1430} s={1.2} rot={-4 + 2 * Math.sin(c.f * 0.2)} glow={0.5 + 0.4 * Math.sin(c.f * 0.3)} />
            <PriceCard x={540} y={860} label="POZO RÉCORD · 2022" value={`US$ ${n.toLocaleString("es-AR")}`} s={(1 + 0.08 * bump(c.f, tPozo + 6)) * (1 + 0.015 * Math.sin(c.f * 0.4))} glow={decay(c.f, tPozo + 6, 10) + 0.3} note={c.f >= tPozo + 6 ? "UN SOLO BOLETO · CALIFORNIA" : undefined} rot={1.2 * Math.sin(c.f * 0.12)} />
            <Coins f={c.f} at={tPozo + 6} x={540} y={880} />
            <Sparks f={c.f} at={tPozo + 6} x={540} y={880} n={24} color={C.green} spread={440} />
            {c.f >= c.w("alguien", ib(c)) ? <Pill x={540} y={1180} text="y aun así… alguien gana" s={pop(c.f, c.w("alguien", ib(c)), c.fps)} size={54} dark /> : null}
            <Label text="POZO ANUNCIADO; EN EFECTIVO ≈ US$ 997,6 M" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "millones",
      desde: (c) => c.w("cómo", ib(c)) - 2,
      dibujar: (c) => (
        <>
          <Studio f={c.f} tint="#2A2238" />
          <Multitud f={c.f} zoom={0.75 + 0.15 * ln(c.f, c.inicio, c.fin)} foco={0} />
          <LluviaBoletos f={c.f} desde={c.inicio - 40} dens={1} />
          {c.f >= c.w("juegan", ib(c)) ? <Pill x={540} y={760} text="millones de boletos por sorteo" s={pop(c.f, c.w("juegan", ib(c)), c.fps)} size={52} rot={2 * Math.sin(c.f * 0.2)} /> : null}
          <Dust f={c.f} x0={0} x1={1080} y0={600} y1={1800} n={24} color="#FFE7C0" />
        </>
      ),
    },
    {
      id: "cta",
      subtitulos: false,
      desde: (c) => c.w("comentá"),
      dibujar: (c) => (
        <CTAComentar
          f={c.f}
          fps={c.fps}
          at={c.inicio}
          palabra="suerte"
          nota="si igual vas a jugar 🍀"
          abajo={
            <>
              <Bombo x={760} y={1500} R={150} f={c.f} vel={1.4} />
              <Trebol x={300} y={1420} s={1.1} f={c.f} />
            </>
          }
        />
      ),
    },
  ],

  impactos: (c) => {
    const b = ib(c);
    const g = c.v === 1 ? c.w("292") + 4 : c.v === 2 ? c.w("5 millones") + 4 : c.w("argentinas");
    return [g, c.w("26", b), c.w("292", b) + 4, c.w("6", c.i("persona", b)), c.w("55", b) + 4, c.w("2040", b) + 6];
  },
  pops: (c) => {
    const b = ib(c);
    return [c.w("69", b), c.w("26", b), c.w("292", b) + 4, c.w("persona", b), c.w("argentinas", b), c.w("alguien", b), c.w("juegan", b)];
  },
  sfx: (c) => {
    const b = ib(c);
    const out = [
      ...[0, 1, 2, 3, 4].map((k) => ({ at: c.w("5", b) + k * 4, src: "sfx/click.wav", vol: 0.35 })),
      { at: c.w("26", b), src: "sfx/hit.wav", vol: 0.45 },
      { at: c.w("292", b) + 4, src: SOUND.impacto, vol: 0.65 },
      { at: c.w("6", c.i("persona", b)), src: SOUND.tiron, vol: 0.4 },
      { at: c.w("con", b), src: SOUND.tension, vol: 0.3 },
      { at: c.w("55", b) + 4, src: SOUND.impacto, vol: 0.6 },
      { at: c.w("2040", b) + 5, src: "sfx/hit.wav", vol: 0.6 },
      { at: c.w("2040", b) + 6, src: SOUND.impacto, vol: 0.8 },
      { at: c.w("2040", b) + 6, src: "sfx/cristal.wav", vol: 0.35 },
      ...[0, 1, 2, 3, 4, 5].map((k) => ({ at: c.w("comentá") + 10 + k * 3, src: "sfx/click.wav", vol: 0.25 })),
      { at: c.w("comentá") + 10 + 18 + 12, src: "sfx/pop.wav", vol: 0.55 },
    ];
    const g = c.v === 1 ? c.w("292") + 4 : c.v === 2 ? c.w("5 millones") + 4 : c.w("argentinas");
    out.push({ at: g, src: SOUND.impacto, vol: 0.65 });
    return out;
  },

  portada: (v) => (
    <PortadaTexto
      lineas={v === 2 ? ["1 boleto por semana:", "ganás en", "5 millones de años"] : v === 3 ? ["Ganar la lotería", "es adivinar 1 persona", "entre 6 Argentinas"] : ["Ganar la lotería:", "1 chance en", "292 millones"]}
      fondo={
        <>
          <Studio f={20} tint="#2A2238" />
          <Bombo x={540} y={1250} f={20} />
        </>
      }
    />
  ),
};
