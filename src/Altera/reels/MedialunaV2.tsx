import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import caps from "../../data/captions-medialuna-v2.json";
import { Gancho, type GanchoPose } from "../Gancho";
import { Stopwatch } from "../props";
import { Snd, timing } from "../reelkit";
import { A, ContactShadow, FONT, LABEL, Paper, SAFE, SOUND, fall, impact, lin } from "../system";
import { Arrow, BigTicket, Camera, Chip, Hero, LogoCard, ML, Marks, NewText, OldText, Phone, SCR, Shop, Stamp, ease, easeIO, mixP, toScreen, type Cam, type PhoneState } from "./Medialuna";

// «La medialuna» v2 (2026-10-30). Ganó cada prueba de produccion/medialuna_v2/pruebas.md:
// gancho 2 (reto en tiempo real, 5/5 en el panel) + guion B (escalera: después de cada cambio se repite el primer
// segundo con el indicador «EN EL SEGUNDO 1 SE VE:») + voz de marca. La panadería es un EJEMPLO CREADO PARA LA DEMO.

const T = timing(caps);
const { W: W0, E: E0, idx } = T;

const iTenes = idx("tenés");
const iEsta = idx("está");
// el reloj corre 2 s reales desde «Tenés»; la voz espera a que llegue a 0 antes de «Está acá»
const T_START = W0(iTenes);
const T_END = T_START + 60;
const GAP = Math.max(0, T_END + 4 - W0(iEsta));
const CUT = W0(iEsta) - 2; // dónde se parte la voz
const W = (i: number) => W0(i) + (i >= iEsta ? GAP : 0);
const E = (i: number) => E0(i) + (i >= iEsta ? GAP : 0);
export const MEDIALUNA_V2_FRAMES = T.frames + GAP;
const END = MEDIALUNA_V2_FRAMES;

const iAl = idx("al", iEsta);
const iY = idx("y", iEsta);
const iPrimer1 = idx("primer", iY);
const iLogo1 = idx("logo", iY);
const iUno = idx("uno");
const iCorto = idx("corto");
const iLogo2 = idx("logo", iCorto);
const iDos = idx("dos", iUno);
const iAcerco = idx("acerco");
const iMed2 = idx("medialuna", iAcerco);
const iHasta = idx("hasta");
const iPantalla = idx("pantalla");
const iTres = idx("tres", iPantalla);
const iTexto = idx("texto");
const iComprarla = idx("comprarla");
const iMismo = idx("mismo");
const iVideo1 = idx("video", iMismo);
const iCamara = idx("cámara", iMismo);
const iAhora = idx("ahora");
const iPrimer2 = idx("primer", iAhora);
const iSi = idx("si", iAhora);
const iNegocio = idx("negocio");
const iMandame = idx("mandame");
const iVIDEO = idx('"video');
const iMuestro = idx("muestro", iVIDEO);

const S2 = W(iEsta); // revelación
const S3 = W(iY); // «en el primer segundo tu cliente ve… un logo»
const S4 = W(iUno);
const S5 = W(iDos);
const S6 = W(iTres);
const S7 = W(iMismo);
const S8 = W(iSi);

const KEYS = [idx("medialuna"), idx("segundos"), iLogo1, iLogo2, iPantalla, iComprarla, iVideo1, iPrimer2 + 1, iNegocio];
const FLOOR = 1470;

// ---------- celular ----------
const BASE: PhoneState = { x: 640, y: 1062, s: 0.9 };
const REVEAL: PhoneState = { x: 610, y: 1082, s: 0.95 };
const CTA: PhoneState = { x: 760, y: 1195, s: 0.6 };

// ---------- subtítulos: palabra actual en píldora naranja (variante B) o solo color (variante A) ----------
const Subs: React.FC<{ f: number; fps: number; pill: boolean }> = ({ f, fps, pill }) => {
  const words = T.words.map((w, i) => ({ text: w.text, at: W(i) }));
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
        const key = KEYS.includes(i);
        const text = words[i].text.replace(/[.,:…]+$/, "").replace(/"/g, "");
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", margin: "0 6px", opacity: Math.min(1, d * 1.6), transformOrigin: "50% 100%", transform: `translateY(${(1 - d) * -26}px) scale(${1 + 0.06 * land}, ${1 - 0.1 * land})` }}>
            <span style={{ display: "inline-block", padding: pill ? "0 14px 6px" : 0, borderRadius: 16, background: pill && now ? A.orange : "transparent", color: pill && now ? A.ivory : key ? A.orange : now ? A.ink : "#3A3732" }}>{text}</span>
          </span>
        );
      })}
    </div>
  );
};

// ---------- marcador de la escalera ----------
const LADDER = ["UN LOGO", "EL LOCAL", "LA MEDIALUNA", "LA MEDIALUNA"];
const Ladder: React.FC<{ f: number; step: number; changedAt: number; plus: number; appear: number; out: number }> = ({ f, step, changedAt, plus, appear, out }) => {
  const p = lin(f, appear, appear + 8, 0, 1, ease) * (1 - lin(f, out, out + 8));
  if (p <= 0) return null;
  const hit = impact(f - changedAt);
  return (
    <div style={{ position: "absolute", left: 72, top: 452, width: 858, height: 150, opacity: p, transform: `translateY(${(1 - p) * -30}px)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: "#FBF8F2", border: `6px solid ${A.ink}`, boxShadow: "0 14px 28px rgba(14,13,11,0.18)" }} />
      <div style={{ position: "absolute", left: 30, top: 24, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.08em", color: A.grey }}>EN EL SEGUNDO 1 SE VE:</div>
      <div style={{ position: "absolute", left: 30, top: 58, fontFamily: FONT, fontWeight: 800, fontSize: plus > 0 ? 58 : 66, letterSpacing: "-0.045em", whiteSpace: "nowrap", color: step >= 2 ? A.orange : A.ink, transformOrigin: "0 100%", transform: `scale(${1 + 0.16 * hit}, ${1 - 0.22 * hit})` }}>
        {LADDER[step]}
        {plus > 0 ? <span style={{ fontSize: 30, color: A.ink, marginLeft: 12, opacity: plus, letterSpacing: "-0.03em" }}>+ POR QUÉ COMPRARLA</span> : null}
      </div>
      {/* escalones 0·1·2·3 */}
      <div style={{ position: "absolute", right: 26, top: 22, display: "flex", gap: 10 }}>
        {[1, 2, 3].map((k) => (
          <div key={k} style={{ width: 34, height: 34, borderRadius: 17, border: `5px solid ${A.ink}`, background: step + (plus > 0 ? 1 : 0) >= k ? A.ink : "transparent", color: "#FBF8F2", fontFamily: FONT, fontWeight: 800, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
            {k}
          </div>
        ))}
      </div>
    </div>
  );
};

const TagLine: React.FC<{ text: string; x: number; y: number; opacity?: number }> = ({ text, x, y, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: LABEL, fontSize: 26, letterSpacing: "0.08em", color: A.ink, opacity, whiteSpace: "nowrap" }}>
    <span style={{ color: A.orange }}>● </span>
    {text}
  </div>
);

export const MedialunaV2: React.FC<{ pill?: boolean; music?: number }> = ({ pill = true, music = 0.22 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talkAt = (fr: number) => {
    for (let i = 0; i < T.words.length; i++) {
      const a = W(i);
      const b = Math.max(a + 3, E(i));
      if (fr >= a && fr < b) return 0.35 + 0.65 * Math.abs(Math.sin((fr - a) * 0.9));
    }
    return 0;
  };
  const talk = talkAt(f);

  // ---- tiempos clave ----
  const tCut = W(iLogo2) + 4;
  const zA = W(iHasta);
  const zB = W(iPantalla) + 6;
  const zoom = lin(f, zA, zB, 0, 1, easeIO);
  const heroIn = lin(f, zA + (zB - zA) * 0.55, zB, 0, 1);
  const tLand = W(iComprarla);
  const oldOut = tLand + 12;
  const wipeIn = lin(f, S7, S7 + 10, 0, 1, ease);
  const wipeOut = lin(f, W(iAhora), W(iAhora) + 12, 0, 1, easeIO);
  const split = f >= S7 ? 0.5 * wipeIn * (1 - wipeOut) : 0;

  // ---- reproducción del video del negocio: en «el primer segundo» se rebobina a 0 ----
  const rew = W(iPrimer1);
  const play = f < rew ? 0.12 + (f / rew) * 0.3 : f < rew + 6 ? lin(f, rew, rew + 6, 0.42, 0) : f < W(iAhora) ? lin(f, rew + 6, W(iAhora), 0, 0.5) : f < W(iAhora) + 6 ? lin(f, W(iAhora), W(iAhora) + 6, 0.5, 0) : lin(f, W(iAhora) + 6, END, 0, 0.6);

  // ---- celular ----
  let phone: PhoneState;
  if (f < S7) phone = { ...BASE, lift: (1 - fall(f + 4, fps)) * 260 };
  else if (f < S8) phone = mixP(BASE, REVEAL, lin(f, S7, S7 + 10, 0, 1, ease));
  else phone = mixP(REVEAL, CTA, lin(f, W(iMandame) - 10, W(iMandame) + 4, 0, 1, easeIO));
  const phoneSquash = 0.5 * impact(f - 4);

  // ---- pantalla ----
  const showLogo = f >= S3 && f < tCut + 30;
  const logoBlock = (() => {
    if (!showLogo) return null;
    // la intro del logo «carga» lenta (zoom y respiración): se ve que hace esperar, pero nunca queda quieta
    if (f < tCut) return <div style={{ position: "absolute", inset: 0, opacity: lin(f, rew, rew + 4), transform: `scale(${0.9 + 0.12 * lin(f, rew, tCut)}) rotate(${1.5 * Math.sin(f * 0.08)}deg)`, filter: `brightness(${0.85 + 0.15 * Math.sin(f * 0.15)})` }}><LogoCard /></div>;
    const k = f - tCut;
    const g = (v: number) => 0.9 * v * v;
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
  const after = f >= zB;
  const screen = (
    <>
      {after ? <Hero t={t} f={f} from={zB} /> : shopZoomed}
      {!after && heroIn > 0 ? <div style={{ position: "absolute", inset: 0, opacity: heroIn, transform: `scale(${1.25 - 0.25 * heroIn})` }}><Hero t={t} f={f} from={zB} /></div> : null}
      {logoBlock}
      {split > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }}>
          <Shop t={t} />
          <OldText />
        </div>
      ) : null}
    </>
  );
  const oldSquash = f >= tLand ? Math.min(1, 0.85 + 0.15 * impact(f - tLand)) : 0;
  const oldFall = f >= oldOut ? f - oldOut : 0;
  const ringP = f >= S2 && f < S3 + 6 ? lin(f, S2, S2 + 8) * (1 - lin(f, S3, S3 + 6)) : 0;
  const overlay = (
    <>
      {f < oldOut + 24 && f < S7 && !(showLogo && f < tCut + 2) ? <OldText squash={oldSquash} outline={f >= W(iTexto) && f < tLand ? lin(f, W(iTexto), W(iTexto) + 4) : 0} dx={oldFall * -9} dy={0.9 * oldFall * oldFall} rot={-1.4 * oldFall} /> : null}
      {f >= S6 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: split > 0.001 ? `inset(-1000px 0 0 ${split * 100}%)` : undefined }}>
          <NewText f={f} fps={fps} at={tLand} />
        </div>
      ) : null}
      {ringP > 0 ? (
        <>
          <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <ellipse cx={ML.x} cy={ML.y} rx={38} ry={30} fill="none" stroke={A.orange} strokeWidth={6} strokeDasharray={`${ringP * 220} 220`} strokeLinecap="round" />
          </svg>
          <Arrow x={ML.x - 26} y={ML.y + 14} bob={8 * Math.abs(Math.sin(f * 0.32))} opacity={ringP} />
        </>
      ) : null}
      {/* chip de tiempo del video: «0:00» cuando se rebobina, «0:01» cuando ya se ve */}
      {(f >= rew && f < S4) || (f >= W(iPrimer2) && f < S8) ? (
        <div style={{ position: "absolute", left: 18, top: 166, fontFamily: LABEL, fontSize: 28, color: "#FBF8F2", background: f >= S7 ? A.orange : A.ink, padding: "3px 12px", borderRadius: 8, transformOrigin: "0 50%", transform: `scale(${spring({ frame: f - (f >= S7 ? W(iPrimer2) : rew), fps, config: { damping: 11, stiffness: 300 } })})` }}>0:01</div>
      ) : null}
      {f >= S4 && f < S5 + 6 ? (
        <div style={{ position: "absolute", left: 22, right: 22, bottom: 44, height: 64, borderRadius: 12, background: "rgba(14,13,11,0.82)", display: "flex", gap: 4, padding: 6, boxSizing: "border-box", opacity: lin(f, S4, S4 + 5) * (1 - lin(f, S5, S5 + 6)) }}>
          <div style={{ width: `${30 * (1 - lin(f, tCut, tCut + 8, 0, 1, ease))}%`, height: "100%", borderRadius: 8, background: "#5A524A", border: f >= W(iCorto) && f < tCut ? `3px dashed ${A.orange}` : "3px solid transparent", boxSizing: "border-box", overflow: "hidden", fontFamily: LABEL, fontSize: 20, color: "#FBF8F2", display: "flex", alignItems: "center", justifyContent: "center" }}>LOGO</div>
          <div style={{ flex: 1, height: "100%", borderRadius: 8, background: "repeating-linear-gradient(90deg, #B4A387 0 44px, #A39276 44px 48px)" }} />
        </div>
      ) : null}
      {f >= tCut - 4 && f < tCut + 8 ? (
        <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - lin(f, tCut + 3, tCut + 8) }}>
          <line x1={-20} y1={SCR.h * 0.58 + 9} x2={-20 + (SCR.w + 40) * lin(f, tCut - 4, tCut)} y2={SCR.h * 0.58 + 9 - (SCR.h * 0.2 + 2) * lin(f, tCut - 4, tCut)} stroke={A.orange} strokeWidth={12} strokeLinecap="round" />
        </svg>
      ) : null}
      {f >= S7 && split > 0.001 ? (
        <>
          <div style={{ position: "absolute", left: SCR.w * split - 5, top: 0, width: 10, height: SCR.h, background: A.orange }} />
          <Chip text="ANTES" x={18} y={250} align="left" opacity={lin(f, S7 + 4, S7 + 10) * (split > 0.25 ? 1 : 0)} />
          <Chip text="DESPUÉS" x={SCR.w - 18} y={250} align="right" opacity={lin(f, S7 + 4, S7 + 10)} />
        </>
      ) : null}
      {f >= S7 ? (
        <>
          <Stamp kind="x" x={SCR.w * 0.25} y={690} f={f} at={W(iVideo1)} out={W(iAhora)} />
          <Stamp kind="ok" x={SCR.w * 0.75} y={690} f={f} at={W(iCamara)} out={W(iAhora)} />
        </>
      ) : null}
    </>
  );

  // ---- marcas de encuadre (cambio 2) ----
  let marks: React.ReactNode = null;
  if (f >= W(iAcerco) - 2 && f < zB + 10) {
    const full = { x: phone.x, y: phone.y, w: SCR.w * phone.s, h: SCR.h * phone.s };
    const tgt = toScreen(phone, ML.x, ML.y);
    const close = lin(f, W(iAcerco), W(iMed2) + 8, 0, 1, easeIO);
    const k = close * (1 - zoom);
    marks = <Marks x={full.x + (tgt.x - full.x) * k} y={full.y + (tgt.y - full.y) * k} w={full.w + (74 - full.w) * k} h={full.h + (62 - full.h) * k} opacity={lin(f, W(iAcerco) - 2, W(iAcerco) + 3) * (1 - lin(f, zB, zB + 10))} />;
  }

  // ---- escalera ----
  const step = f < tCut ? 0 : f < zB ? 1 : 2;
  const changedAt = f < tCut ? W(iLogo1) : f < zB ? tCut : zB;
  const plus = lin(f, tLand, tLand + 6);
  const ladder = <Ladder f={f} step={step} changedAt={f >= tLand ? tLand : changedAt} plus={plus} appear={W(iLogo1) - 4} out={S8} />;

  // ---- Gancho ----
  const gx = 190;
  let g: GanchoPose = { x: gx, y: FLOOR, scale: 0.85, t, talk, expr: "normal", armL: 30, armR: 40, look: { x: 1, y: -0.3 } };
  if (f < S2) g = { ...g, expr: f >= T_START ? "focused" : "normal", armR: 95, look: { x: 1, y: -0.6 + 0.35 * Math.sin(f * 0.22) } };
  else if (f < S3) g = { ...g, expr: "surprised", armR: 110, look: { x: 1, y: -0.6 } };
  else if (f < S4) g = { ...g, expr: f >= W(iLogo1) ? "smug" : "normal", armL: 30, armR: 60 };
  else if (f < S5) {
    const snip = f >= W(iCorto) - 6;
    g = { ...g, expr: snip ? "focused" : "normal", item: snip ? "scissors" : "none", armR: snip ? 100 + (f >= tCut - 6 && f < tCut + 2 ? 18 * Math.sin(f * 1.5) : 0) : 40 };
  } else if (f < S6) {
    const hold = f >= W(iAcerco) - 4;
    g = { ...g, expr: hold ? "focused" : "normal", item: hold ? "frame" : "none", armR: hold ? 110 : 40, look: { x: 1, y: -0.6 } };
  } else if (f < S7) g = { ...g, expr: f >= tLand ? "smug" : "normal", armR: f >= W(iTexto) ? 115 : 40, look: { x: 1, y: -0.8 } };
  else if (f < S8) g = { ...g, x: gx - 30 * lin(f, S7, S7 + 10), scale: 0.78, expr: f >= W(iAhora) ? "love" : "happy", item: "popcorn", armR: 70, look: { x: 1, y: -0.5 } };
  else {
    const tBox = W(iVIDEO);
    const cheer = f >= tBox;
    const move = lin(f, W(iMandame) - 10, W(iMandame) + 4, 0, 1, easeIO);
    g = { ...g, x: 160 + 90 * move, scale: 0.78 + 0.07 * move, expr: cheer ? "happy" : "smug", armL: cheer ? 165 : 30, armR: cheer ? 165 : 95, squash: cheer ? -0.12 * Math.max(0, impact(f - tBox - 2)) : 0, look: cheer ? { x: 0.6, y: -1 } : { x: 1, y: 0 } };
  }

  // ---- cronómetro del reto ----
  const k = Math.max(0, Math.min(1, (f - T_START) / 60));
  const clock =
    f < S3 + 8 ? (
      <div style={{ position: "absolute", inset: 0, opacity: 1 - lin(f, S3, S3 + 8), transform: `translateY(${-lin(f, S3, S3 + 8) * 40}px)` }}>
        <Stopwatch x={200} y={930} value={(2 * (1 - k)).toFixed(1).replace(".", ",")} ring={1 - k} scale={0.62} squash={0.5 * impact(f - T_END) + 0.4 * impact(f - 4)} t={t} />
      </div>
    ) : null;

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

  // ---- cámara: zoom al detalle en «al fondo» ----
  const mls = toScreen(BASE, ML.x, ML.y);
  const punch = lin(f, W(iAl) - 2, W(iAl) + 6, 0, 1, ease) * (1 - lin(f, S3, S3 + 9, 0, 1, ease));
  const cam: Cam = { z: 1 + 3 * punch, cx: 540 + (mls.x - 540) * punch, cy: 980 + (mls.y - 980) * punch };
  const scenes = [0, S2, S3, S4, S5, S6, S7, S8, END];
  let si = 0;
  while (si < scenes.length - 2 && f >= scenes[si + 1]) si++;
  const push = 1 + 0.03 * lin(f, scenes[si], scenes[si + 1]);

  const world = (
    <>
      {clock}
      <Phone p={phone} play={play} overlay={overlay} squash={f < 30 ? phoneSquash : 0}>
        <div style={{ position: "absolute", inset: 0, filter: punch > 0.3 ? `blur(${1.5 * punch}px)` : undefined }}>{screen}</div>
      </Phone>
      <TagLine text="EJEMPLO CREADO PARA LA DEMO" x={phone.x - 240 * phone.s} y={phone.y - 427 * phone.s - (phone.lift ?? 0) - 42} />
      {marks}
      <ContactShadow x={g.x} y={FLOOR} w={250 * (g.scale ?? 1)} />
      <Gancho {...g} />
      {cta}
    </>
  );

  const hideCaps = f >= W(iMandame) - 2;

  return (
    <Paper>
      <AbsoluteFill style={{ transformOrigin: "540px 1020px", transform: `scale(${push})` }}>
        <Camera cam={cam}>{world}</Camera>
      </AbsoluteFill>
      {ladder}
      {f < S3 ? <TagLine text="EDITO REELS PARA NEGOCIOS" x={72} y={470} opacity={1 - lin(f, S3 - 6, S3)} /> : null}
      {hideCaps ? null : <Subs f={f} fps={fps} pill={pill} />}

      {/* voz partida: la segunda parte espera a que el reloj llegue a 0 */}
      <Sequence from={0} durationInFrames={CUT}>
        <Audio src={staticFile("audio/voz_medialuna_v2.wav")} trimAfter={CUT} />
      </Sequence>
      <Sequence from={CUT + GAP}>
        <Audio src={staticFile("audio/voz_medialuna_v2.wav")} trimBefore={CUT} />
      </Sequence>
      <Audio src={staticFile("audio/musica_medialuna_v2.wav")} volume={music} />

      {/* sonido propio: tensión · tirón · impacto */}
      <Snd at={4} src={SOUND.impacto} vol={0.5} />
      <Snd at={T_START} src={SOUND.tension} vol={0.35} />
      <Snd at={T_END} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(iAl)} src={SOUND.impacto} vol={0.3} />
      <Snd at={W(iLogo1)} src={SOUND.impacto} vol={0.5} />
      <Snd at={tCut - 3} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iMed2) + 6} src={SOUND.tension} vol={0.25} />
      <Snd at={zB} src={SOUND.impacto} vol={0.55} />
      <Snd at={tLand} src={SOUND.impacto} vol={0.8} />
      <Snd at={oldOut} src={SOUND.tiron} vol={0.35} />
      <Snd at={S7} src={SOUND.tiron} vol={0.35} />
      <Snd at={W(iVideo1)} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iCamara)} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iAhora)} src={SOUND.tiron} vol={0.5} />
      <Snd at={tBox} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iMuestro)} src={SOUND.impacto} vol={0.5} />
    </Paper>
  );
};

// ---------- portada: el reto, sin la respuesta ----------
export const MedialunaV2Portada: React.FC = () => (
  <Paper>
    <div style={{ position: "absolute", left: 72, top: 250, width: 900, fontFamily: FONT, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: "-0.045em", color: A.ink }}>
      ¿ENCONTRÁS LA
      <br />
      <span style={{ color: A.orange }}>MEDIALUNA?</span>
    </div>
    <div style={{ position: "absolute", inset: 0 }}>
      <Stopwatch x={205} y={930} value="2,0" ring={1} scale={0.62} t={0.5} />
    </div>
    <Phone p={{ ...BASE, y: 1090 }} play={0.3} overlay={<OldText />}>
      <Shop t={0} />
    </Phone>
    <TagLine text="EJEMPLO CREADO PARA LA DEMO" x={BASE.x - 240 * BASE.s} y={1090 - 427 * BASE.s - 42} />
    <ContactShadow x={190} y={FLOOR} w={210} />
    <Gancho x={190} y={FLOOR} scale={0.85} t={1.3} expr="focused" armL={30} armR={95} look={{ x: 1, y: -0.5 }} />
  </Paper>
);
