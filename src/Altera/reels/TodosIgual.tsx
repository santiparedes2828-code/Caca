import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Snd } from "../reelkit";
import { SOUND } from "../system";

// «Todos empiezan igual» — Hook House (2026-10-31). Objetivo: alcance y seguidores.
// Principios tomados de la referencia (sin copiar personajes, escenas ni textos): una sola metáfora visual que se
// entiende en 1 s, fondo negro + figuras blancas + UN color de acento que es el símbolo (acá el naranja de Hook House),
// repetición con una sola diferencia, texto mínimo que aparece cuando la imagen ya planteó la pregunta, giro final y
// sin voz (música y sonido). Metáfora propia: el feed. Celulares grises que empiezan todos con «Hola, hoy les…» y un
// pulgar que los descarta cada vez más rápido; llega uno naranja que ya muestra acción en el primer segundo y el pulgar
// se frena. Giro: adentro de ese celular está este mismo video. Cierre: el pulgar toca «Seguir».

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });
const PF = "Poppins";
const OR = "#FF5A1F";
const WH = "#F4F1EC";

export const TODOS_FRAMES = 405;

const ln = (f: number, a: number, b: number, from = 0, to = 1, ease?: (x: number) => number) => (b <= a ? (f >= b ? to : from) : interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
const eo = Easing.out(Easing.cubic);
const eio = Easing.inOut(Easing.cubic);
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- guion visual (fotogramas a 30 fps) ----------
// Pulgar que descarta: cada vez más rápido (de 0,57 s a 0,2 s entre uno y otro)
const FLICKS = [3, 20, 36, 51, 64, 76, 87, 97, 106, 114, 121, 128, 134, 140, 146];
const ORANGE_IN = 158; // llega el celular naranja al centro
const FREEZE = 166; // el pulgar se frena
const HEART = 188;
const T1 = 30; // «TODOS EMPIEZAN IGUAL.»
const T2 = 176; // «EL PULGAR SE FRENA / CON EL QUE NO.»
const ZOOM_A = 228;
const ZOOM_B = 286;
const T3 = 244; // «COMO VOS, / CON ESTE VIDEO.»
const CTA = 300;
const TAP = 352;

const CENTER = { x: 540, y: 1020 };
const PH = { w: 440, h: 764 }; // pantalla interior exactamente 9:16 (416 × 740)

// ---------- piezas ----------
const GreyScreen: React.FC<{ seed: number }> = ({ seed }) => (
  <div style={{ position: "absolute", inset: 0, background: "#1B1B1E" }}>
    <div style={{ position: "absolute", left: 34, top: 52, width: 76, height: 76, borderRadius: "50%", background: "#3A3A40" }} />
    <div style={{ position: "absolute", left: 128, top: 72, width: 160 + (seed % 3) * 26, height: 18, borderRadius: 9, background: "#3A3A40" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 270, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 56, color: "#8A8A92", letterSpacing: "0.02em", lineHeight: 1.12 }}>
      HOLA,
      <br />
      HOY LES…
    </div>
    {[0, 1, 2].map((k) => (
      <div key={k} style={{ position: "absolute", left: 52, right: 52 + k * 52, top: 540 + k * 46, height: 18, borderRadius: 9, background: "#2E2E34" }} />
    ))}
  </div>
);

// Pantalla naranja: ya está pasando algo (y adentro, este mismo video)
const OrangeScreen: React.FC<{ f: number; depth: number }> = ({ f, depth }) => (
  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 45%, #FF8A55 0%, ${OR} 45%, #B83A10 100%)`, overflow: "hidden" }}>
    {depth === 0 ? (
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${(PH.w - 24) / 1080})` }}>
        <Feed f={f} depth={1} />
      </div>
    ) : (
      <svg width="100%" height="100%" viewBox="0 0 300 560" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(150 280) scale(${1 + 0.15 * Math.sin(f * 0.4)})`}>
          <path d="M-30 -45 L50 0 L-30 45 Z" fill={WH} />
        </g>
      </svg>
    )}
  </div>
);

const Phone: React.FC<{ x: number; y: number; s?: number; rot?: number; opacity?: number; blur?: number; orange?: boolean; glow?: number; f: number; seed: number; depth: number }> = ({ x, y, s = 1, rot = 0, opacity = 1, blur = 0, orange = false, glow = 0, f, seed, depth }) => (
  <div style={{ position: "absolute", left: x - PH.w / 2, top: y - PH.h / 2, width: PH.w, height: PH.h, opacity, transform: `rotate(${rot}deg) scale(${s})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 46, border: `6px solid ${orange ? OR : "#8C8C94"}`, boxShadow: orange ? `0 0 ${40 + 50 * glow}px rgba(255,90,31,${0.5 + 0.4 * glow})` : "0 20px 40px rgba(0,0,0,0.6)", background: "#000", padding: 6, boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden" }}>{orange ? <OrangeScreen f={f} depth={depth} /> : <GreyScreen seed={seed} />}</div>
    </div>
  </div>
);

// Pulgar blanco (de costado), con brillo
const Thumb: React.FC<{ x: number; y: number; rot?: number; s?: number; opacity?: number }> = ({ x, y, rot = 0, s = 1, opacity = 1 }) => (
  <svg width={360} height={520} viewBox="0 0 360 520" style={{ position: "absolute", left: x - 70 * s, top: y - 40 * s, width: 360 * s, height: 520 * s, overflow: "visible", opacity, transform: `rotate(${rot}deg)`, transformOrigin: `${70 * s}px ${40 * s}px`, filter: "drop-shadow(0 0 18px rgba(255,255,255,0.35))" }}>
    <path d="M70 40 C40 40 30 70 34 100 L60 300 C64 330 80 350 110 360 L110 520 L320 520 L320 300 C320 240 280 220 240 226 L210 230 C200 200 170 190 150 200 L130 90 C124 56 100 40 70 40 Z" fill="#0B0B0D" stroke={WH} strokeWidth={10} strokeLinejoin="round" />
    <path d="M52 70 C62 58 90 58 102 74 L112 130 C96 140 66 140 58 128 Z" fill="none" stroke={WH} strokeWidth={7} strokeLinejoin="round" opacity={0.85} />
  </svg>
);

// Partículas de polvo en la oscuridad
const Motes: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: 50 }, (_, k) => {
      const sp = 0.5 + rnd(k) * 1.5;
      const x = rnd(k + 1) * 1080 + 20 * Math.sin(f * 0.04 * sp + k);
      const y = 1920 - ((rnd(k + 2) * 1920 + f * sp * 3) % 1920);
      return <circle key={k} cx={x} cy={y} r={1.2 + rnd(k + 3) * 2.4} fill={WH} opacity={0.12 + 0.25 * (0.5 + 0.5 * Math.sin(f * 0.15 * sp + k))} />;
    })}
  </svg>
);

// ---------- el feed (se usa también adentro del celular naranja) ----------
const Feed: React.FC<{ f: number; depth: number }> = ({ f, depth }) => {
  const halted = f >= FREEZE;
  const still = depth === 0 ? 1 - ln(f, ZOOM_A, ZOOM_B, 0, 1, eio) : 1; // al entrar al celular, el celular deja de bambolearse
  // celulares grises que llegan desde abajo y el pulgar los descarta
  const greys = FLICKS.map((fl, i) => {
    const prev = i === 0 ? fl - 40 : FLICKS[i - 1];
    const arrive = fl - 3;
    const k = f - fl;
    if (k > 16) return null;
    let x = CENTER.x;
    let y = CENTER.y;
    let rot = 2 * Math.sin(f * 0.3 + i);
    let op = 1;
    let blur = 0;
    if (f < arrive) {
      const p = (arrive - f) / Math.max(4, arrive - prev);
      if (p > 1.4) return null;
      y = CENTER.y + 1000 * p;
    } else if (k >= 0) {
      x = CENTER.x - 110 * k - 3 * k * k;
      y = CENTER.y - 40 * k - 4 * k * k;
      rot = -9 * k;
      op = 1 - k / 16;
      blur = k * 0.9;
    }
    return <Phone key={i} x={x} y={y} rot={rot} opacity={op} blur={blur} f={f} seed={i} depth={depth} />;
  });
  // el naranja: llega después del último gris y se queda
  const p = (ORANGE_IN - f) / 12;
  const oy = f < ORANGE_IN ? (p > 1.4 ? null : CENTER.y + 1000 * p) : CENTER.y + 6 * still * Math.sin(f * 0.12);
  const glow = 0.5 + 0.5 * Math.sin(f * 0.25);
  // pulgar: descarta (llega, empuja hacia arriba a la izquierda, vuelve); después se frena frente al naranja
  let tx = 860;
  let ty = 1330;
  let trot = 0;
  if (!halted) {
    let near = FLICKS[0];
    for (const fl of FLICKS) if (Math.abs(f - fl) < Math.abs(f - near)) near = fl;
    const k = f - near;
    if (k >= -5 && k < 0) {
      const q = (k + 5) / 5;
      tx = 860 + (700 - 860) * q;
      ty = 1330 + (1200 - 1330) * q;
    } else if (k >= 0 && k < 4) {
      const q = k / 4;
      tx = 700 - 260 * q;
      ty = 1200 - 170 * q;
      trot = -18 * q;
    } else if (k >= 4 && k < 9) {
      const q = (k - 4) / 5;
      tx = 440 + (860 - 440) * q;
      ty = 1030 + (1330 - 1030) * q;
      trot = -18 * (1 - q);
    }
    if (f >= ORANGE_IN - 8) {
      const q = ln(f, ORANGE_IN - 8, FREEZE, 0, 1, eo);
      tx = 860 + (730 - 860) * q;
      ty = 1330 + (1220 - 1330) * q;
    }
  } else {
    // se frena: tiembla, duda, retrocede un poco cuando aparece el corazón
    const back = ln(f, HEART, HEART + 10, 0, 1, eo);
    tx = 730 + 4 * Math.sin(f * 1.9) + 70 * back;
    ty = 1220 + 3 * Math.cos(f * 2.3) + 60 * back;
    trot = 4 * Math.sin(f * 0.5);
  }
  const heart = f >= HEART ? spring({ frame: f - HEART, fps: 30, config: { damping: 9, stiffness: 220 } }) : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Motes f={f} />
      {greys}
      {oy !== null ? <Phone x={CENTER.x} y={oy} orange glow={glow} f={f} seed={99} depth={depth} s={halted ? 1 + 0.03 * still * Math.sin(f * 0.2) : 1} /> : null}
      {heart > 0 ? (
        <svg width={200} height={200} viewBox="-50 -50 100 100" style={{ position: "absolute", left: CENTER.x + 150, top: CENTER.y - PH.h / 2 - 150 - 30 * heart, transform: `scale(${heart})`, overflow: "visible", filter: "drop-shadow(0 0 20px rgba(255,90,31,0.8))" }}>
          <path d="M0 30 C-40 5 -30 -30 0 -12 C30 -30 40 5 0 30 Z" fill={OR} />
        </svg>
      ) : null}
      <Thumb x={tx} y={ty} rot={trot} s={1.15} />
    </AbsoluteFill>
  );
};

// Línea de texto que se escribe letra por letra (texto chico y espaciado, con una palabra en naranja)
const TypeLine: React.FC<{ text: string; f: number; at: number; y: number; hot?: string; size?: number; out?: number }> = ({ text, f, at, y, hot, size = 60, out }) => {
  if (f < at) return null;
  const n = Math.floor((f - at) * 1.6);
  const gone = out !== undefined ? ln(f, out, out + 8) : 0;
  const words = text.split(" ");
  let count = 0;
  return (
    <div style={{ position: "absolute", left: 70, width: 940, top: y, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: size, letterSpacing: "0.06em", color: WH, opacity: 1 - gone, transform: `translateY(${-20 * gone}px)`, textShadow: "0 0 24px rgba(255,255,255,0.25)" }}>
      {words.map((w, wi) => {
        const isHot = hot && w.replace(/[.,]/g, "") === hot;
        return (
          <span key={wi} style={{ color: isHot ? OR : WH, textShadow: isHot ? "0 0 26px rgba(255,90,31,0.7)" : undefined }}>
            {w.split("").map((ch, ci) => {
              const vis = count++ < n;
              return (
                <span key={ci} style={{ opacity: vis ? 1 : 0 }}>
                  {ch}
                </span>
              );
            })}
            {wi < words.length - 1 ? (count++ < n ? " " : " ") : ""}
          </span>
        );
      })}
    </div>
  );
};

export const TodosIgual: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;

  // cámara: flota siempre; empuja durante el frenesí; entra al celular naranja en el giro
  const frenzy = ln(f, 60, FREEZE, 0, 1);
  const zoom = ln(f, ZOOM_A, ZOOM_B, 0, 1, eio);
  const scrX = CENTER.x;
  const scrY = CENTER.y;
  const Z = 1 + ((1920 / (PH.h - 24)) * 1.02 - 1) * zoom; // la pantalla del celular naranja llena el cuadro
  const camX = 6 * (1 - 0.8 * zoom) * Math.sin(t * 1.3) + (f < FREEZE ? 4 * frenzy * Math.sin(f * 1.7) : 0);
  const camY = 5 * (1 - 0.8 * zoom) * Math.cos(t * 1.1) + (960 - CENTER.y) * zoom; // la pantalla queda centrada en el cuadro
  const push = 1 + 0.06 * frenzy * (1 - zoom);

  // CTA: adentro del video, el pulgar toca «Seguir»
  const cta = f >= CTA;
  const ctaIn = ln(f, CTA, CTA + 10, 0, 1, eo);
  const tapK = f - TAP;
  const press = tapK >= 0 && tapK < 8 ? Math.sin((tapK / 8) * Math.PI) : 0;
  const followed = f >= TAP + 3;
  const ripple = f >= TAP ? ln(f, TAP, TAP + 18) : 0;
  const thumbIn = ln(f, CTA + 14, TAP - 2, 0, 1, eo);

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: `${scrX}px ${scrY}px`, transform: `translate(${camX}px, ${camY}px) scale(${Z * push})` }}>
        <Feed f={f} depth={0} />
      </AbsoluteFill>

      {/* texto mínimo: aparece cuando la imagen ya planteó la pregunta */}
      <TypeLine text="TODOS EMPIEZAN" f={f} at={T1} y={250} size={80} out={T2 - 10} />
      <TypeLine text="IGUAL." f={f} at={T1 + 9} y={345} hot="IGUAL" size={150} out={T2 - 10} />
      <TypeLine text="EL PULGAR SE FRENA" f={f} at={T2} y={270} size={64} out={ZOOM_A} />
      <TypeLine text="CON EL QUE NO." f={f} at={T2 + 14} y={360} hot="NO" size={92} out={ZOOM_A} />
      <TypeLine text="COMO VOS," f={f} at={T3} y={250} size={110} out={CTA - 6} />
      <TypeLine text="CON ESTE VIDEO." f={f} at={T3 + 12} y={385} hot="VIDEO" size={84} out={CTA - 6} />

      {cta ? (
        <AbsoluteFill style={{ background: `rgba(0,0,0,${0.55 * ctaIn})` }}>
          <div style={{ position: "absolute", left: 0, width: 1080, top: 560, textAlign: "center", fontFamily: PF, fontWeight: 800, letterSpacing: "0.04em", opacity: ctaIn, transform: `translateY(${(1 - ctaIn) * 30}px)` }}>
            <div style={{ fontSize: 64, color: WH }}>SEGUÍ A</div>
            <div style={{ fontSize: 120, color: OR, lineHeight: 1, textShadow: "0 0 40px rgba(255,90,31,0.6)" }}>HOOK HOUSE</div>
            <div style={{ marginTop: 26, fontFamily: PF, fontWeight: 600, fontSize: 50, color: WH, opacity: 0.9, letterSpacing: "0.01em" }}>un truco de edición en cada video</div>
          </div>
          <div style={{ position: "absolute", left: 540, top: 1040, transform: `translate(-50%, -50%) scale(${(1 - 0.08 * press) * (1 + 0.04 * Math.sin(f * 0.35))})`, padding: "22px 90px 28px", borderRadius: 28, background: followed ? "#2A2A2E" : OR, border: followed ? `4px solid ${WH}` : "4px solid transparent", color: WH, fontFamily: PF, fontWeight: 800, fontSize: 60, boxShadow: followed ? "none" : `0 0 ${40 + 20 * Math.sin(f * 0.4)}px rgba(255,90,31,0.6)`, whiteSpace: "nowrap" }}>{followed ? "Siguiendo ✓" : "Seguir"}</div>
          {ripple > 0 && ripple < 1 ? <div style={{ position: "absolute", left: 540 - 160, top: 1040 - 160, width: 320, height: 320, borderRadius: "50%", border: `8px solid ${OR}`, transform: `scale(${0.3 + ripple * 1.6})`, opacity: 1 - ripple }} /> : null}
          <Thumb x={600 + (1 - thumbIn) * 400 + 6 * Math.sin(f * 0.6) * (1 - press)} y={1050 + (1 - thumbIn) * 600 + 30 * press} rot={-25} s={0.9} />
        </AbsoluteFill>
      ) : null}

      {/* sonido: música propia, un barrido por cada celular descartado, el pulgar que se frena, el corazón y el toque */}
      <Audio src={staticFile("audio/musica_todosigual.wav")} volume={0.55} />
      {FLICKS.map((fl, i) => (
        <Snd key={fl} at={fl - 1} src="sfx/whoosh.wav" vol={0.16 + 0.1 * (i / FLICKS.length)} />
      ))}
      <Snd at={FREEZE} src={SOUND.tension} vol={0.4} />
      <Snd at={HEART} src="sfx/pop.wav" vol={0.5} />
      <Snd at={ZOOM_A} src="sfx/studio/soft_whoosh.wav" vol={0.5} />
      <Snd at={TAP} src="sfx/click.wav" vol={0.6} />
      <Snd at={TAP + 2} src="sfx/pop.wav" vol={0.45} />
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const TodosIgualPortada: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <AbsoluteFill style={{ transformOrigin: `${CENTER.x}px ${CENTER.y}px`, transform: "scale(1.02)" }}>
      <Feed f={HEART + 20} depth={0} />
    </AbsoluteFill>
    <Phone x={CENTER.x - 360} y={CENTER.y - 120} rot={-28} opacity={0.5} blur={3} f={0} seed={1} depth={1} />
    <Phone x={CENTER.x + 380} y={CENTER.y + 160} rot={22} opacity={0.4} blur={4} f={0} seed={2} depth={1} />
    <div style={{ position: "absolute", left: 60, width: 960, top: 250, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 104, lineHeight: 1.02, letterSpacing: "0.03em", color: WH, textShadow: "0 0 30px rgba(255,255,255,0.25)" }}>
      TODOS
      <br />
      EMPIEZAN <span style={{ color: OR, textShadow: "0 0 30px rgba(255,90,31,0.7)" }}>IGUAL</span>
    </div>
  </AbsoluteFill>
);
