import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import caps from "../../data/captions-falso15.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, Snd, timing } from "../reelkit";
import { A, Captions, ContactShadow, FONT, LABEL, Paper, Rope, SOUND, Slab, fall, impact, lin, yank } from "../system";

// «FALSO: 15 segundos» — clon de la estructura de un reel de @altumapp (análisis en clon-hookie/ y analisis23/altum.md),
// pasado a Hookie y al sistema ALTERA (2026-10-30). Se clona el lenguaje: detalle con zoom → mito con cifra →
// FALSO tachado que se rompe → «tres formas» con cuenta 3·2·1 → cada forma con X → ✓ → respuesta → CTA.
// A diferencia de la referencia, se entregan las TRES formas. Todo lo que se ve en el móvil es un ejemplo creado para la pieza.

const T = timing(caps);
const { W, E, idx, talkAt } = T;
export const FALSO15_FRAMES = T.frames;

// ---------- momentos (fotogramas, salen de la voz) ----------
const iQuince = idx("quince");
const iSeg = idx("segundos");
const iNadie = idx("nadie");
const iFinal = idx("final");
const iObv = idx("obviamente");
const iTotal = idx("totalmente");
const iFalso = idx("falso");
const iHay = idx("hay");
const iTres = idx("tres");
const iSaber = idx("saber");
const iDejan = idx("dejan");
const iVer1 = idx("ver", iDejan);
const iPrimera = idx("primera");
const iSegundo1 = idx("segundo", iPrimera);
const iHola = idx('"hola');
const iVan = idx("van");
const iSi2 = idx("si", iVan);
const iPasando = idx("pasando");
const iQuedan = idx("quedan");
const iSegunda = idx("segunda");
const iPausas = idx("pausas");
const iSilencio = idx("silencio");
const iPuerta = idx("puerta");
const iSalida = idx("salida");
const iTercera = idx("tercera");
const iDecis1 = idx("decís", iTercera);
const iVer2 = idx("ver", iDecis1);
const iSi3 = idx("si", iVer2);
const iCajaW = idx('"caja');
const iCae = idx("cae");
const iCaja2 = idx("caja", iCae);
const iAsi = idx("así");
const iDuracion = idx("duración");
const iEs2 = idx("es", iDuracion);
const iEdicion = idx("edición");
const iQueres = idx("querés");
const iEscr = idx("escribinos");
const iHook = idx('"hook');
const iDM = idx("dm");

const S2 = W(iNadie) - 2; // corte al plano abierto
const S3 = W(iObv); // fondo de alarma
const S4 = W(iHay); // cuenta 3·2·1
const S5 = W(iPrimera) - 3; // forma 1
const S6 = W(iSegunda) - 3; // forma 2
const S7 = W(iTercera) - 3; // forma 3
const S8 = W(iAsi); // respuesta
const S9 = W(iQueres); // CTA
const END = T.frames;

const FLOOR = 1500; // suelo en pantalla
const KEYS = [iQuince, iFinal, iTres, iSegundo1, iHola, iPasando, iPausas, iSalida, iVer2, iQueres];

// ---------- cámara: (z, cx, cy) = zoom y punto del plano que queda en el centro de la pantalla ----------
type Cam = { z: number; cx: number; cy: number };
const Camera: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})` }}>{children}</AbsoluteFill>
);
const mix = (a: Cam, b: Cam, p: number): Cam => ({ z: a.z + (b.z - a.z) * p, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p });
const ease = (x: number) => 1 - (1 - x) ** 3;

// ---------- utilería ----------
const PHONE = { x: 720, y: 1000, w: 340, h: 620 };
const Phone: React.FC<{ secs: number; ring: number; t: number }> = ({ secs, ring, t }) => {
  const { x, y, w, h } = PHONE;
  const barY = y + h / 2 - 70;
  return (
    <>
      <ContactShadow x={x} y={FLOOR} w={w * 0.9} />
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 46, background: A.ink, boxShadow: "0 22px 40px rgba(14,13,11,0.25)" }}>
        <div style={{ position: "absolute", inset: 14, borderRadius: 34, background: "#FBF8F2", overflow: "hidden" }}>
          {/* un video cualquiera: Hookie en miniatura saluda */}
          <div style={{ position: "absolute", left: 0, top: 0, width: w - 28, height: h - 28 }}>
            <Gancho x={(w - 28) / 2} y={h - 150} scale={0.42} t={t} expr="happy" armL={30} armR={150 + 20 * Math.sin(t * 9)} />
          </div>
          {/* barra de progreso + reloj */}
          <div style={{ position: "absolute", left: 22, right: 22, top: barY - (y - h / 2) - 14, height: 12, borderRadius: 6, background: "#D9D2C4" }}>
            <div style={{ width: `${Math.min(1, secs / 15) * 100}%`, height: "100%", borderRadius: 6, background: A.ink }} />
          </div>
          <div style={{ position: "absolute", right: 22, top: barY - (y - h / 2) + 8, fontFamily: LABEL, fontSize: 30, color: A.ink }}>0:{String(Math.floor(secs)).padStart(2, "0")}</div>
        </div>
      </div>
      {ring > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <ellipse cx={x + 60} cy={barY + 6} rx={150} ry={80} fill="none" stroke={A.orange} strokeWidth={10} strokeDasharray={`${ring * 760} 760`} strokeLinecap="round" />
        </svg>
      ) : null}
    </>
  );
};

const Arrow: React.FC<{ x: number; y: number; bob: number; scale?: number }> = ({ x, y, bob, scale = 1 }) => (
  <svg width={200} height={200} viewBox="0 0 200 200" style={{ position: "absolute", left: x - 180 * scale - bob, top: y - 180 * scale - bob, width: 200 * scale, height: 200 * scale, overflow: "visible" }}>
    <path d="M20 20 L150 150" stroke={A.ink} strokeWidth={26} strokeLinecap="round" />
    <path d="M160 160 L160 80 M160 160 L80 160" stroke={A.ink} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Regla de duración (0–20 s) a la derecha; la línea de 15 s cae desde arriba
const RULER = { x: 930, top: 420, bottom: FLOOR };
const secY = (s: number) => RULER.bottom - ((RULER.bottom - RULER.top) * s) / 20;
const Ruler: React.FC<{ line: number; f: number }> = ({ line, f }) => (
  <>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <line x1={RULER.x} y1={RULER.top} x2={RULER.x} y2={RULER.bottom} stroke={A.ink} strokeWidth={6} />
      {Array.from({ length: 21 }, (_, k) => (
        <line key={k} x1={RULER.x} y1={secY(k)} x2={RULER.x - (k % 5 === 0 ? 46 : 22)} y2={secY(k)} stroke={A.ink} strokeWidth={5} />
      ))}
      {[0, 5, 10, 20].map((s) => (
        <text key={s} x={RULER.x - 60} y={secY(s) + 12} textAnchor="end" fontFamily={LABEL} fontSize={30} fill={A.grey}>
          {s}
        </text>
      ))}
      {line > 0 ? (
        <>
          <line x1={0} x2={RULER.x} y1={secY(15) - (1 - line) * 1400} y2={secY(15) - (1 - line) * 1400} stroke={A.orange} strokeWidth={12} />
        </>
      ) : null}
    </svg>
    {line >= 1 ? (
      <div style={{ position: "absolute", left: RULER.x - 190, top: secY(15) - 92, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: A.orange, transformOrigin: "100% 100%", transform: `scale(${1 + 0.2 * impact(f)})` }}>15 s</div>
    ) : null}
  </>
);

// Flechitas que suben (el fondo de la referencia), en tinta suave
const RisingArrows: React.FC<{ f: number; opacity?: number }> = ({ f, opacity = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
    {Array.from({ length: 16 }, (_, k) => {
      const x = 60 + ((k * 263) % 800);
      const speed = 6 + (k % 4) * 3;
      const y = 1700 - ((f * speed + k * 211) % 1500);
      return <path key={k} d={`M${x} ${y} l0 -60 M${x - 12} ${y - 46} l12 -14 l12 14`} stroke={A.ink} strokeOpacity={0.14} strokeWidth={5} fill="none" strokeLinecap="round" />;
    })}
  </svg>
);

// Rayos de alarma (el fondo rojo de la referencia → rayos de tinta sobre marfil profundo)
const Burst: React.FC<{ f: number; p: number }> = ({ f, p }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: p }}>
    <rect width={1080} height={1920} fill={A.ivoryDeep} />
    {Array.from({ length: 28 }, (_, k) => {
      const a = (k / 28) * Math.PI * 2 + f * 0.006;
      return <line key={k} x1={540 + Math.cos(a) * 260} y1={900 + Math.sin(a) * 260} x2={540 + Math.cos(a) * 1500} y2={900 + Math.sin(a) * 1500} stroke={A.ink} strokeOpacity={0.12} strokeWidth={k % 2 ? 6 : 14} />;
    })}
  </svg>
);

// FALSO que cae, se tacha y se rompe en letras
const Falso: React.FC<{ f: number; fps: number; drop: number; slash: number; shatter: number }> = ({ f, fps, drop, slash, shatter }) => {
  if (f < drop) return null;
  const p = fall(f - drop, fps);
  const sq = 0.45 * impact(f - drop - 6);
  const letters = "FALSO".split("");
  const size = 250;
  const cy = 1180;
  const s1 = lin(f, slash, slash + 4);
  const s2 = lin(f, slash + 3, slash + 7);
  const k = f - shatter;
  return (
    <>
      {letters.map((ch, i) => {
        const dx = (i - 2) * size * 0.64;
        const vx = (i - 2) * 9 + (i % 2 ? 4 : -4);
        const fly = k > 0 ? { x: vx * k, y: -26 * k + 1.6 * k * k, r: (i % 2 ? 1 : -1) * 9 * k } : { x: 0, y: 0, r: 0 };
        return (
          <div key={i} style={{ position: "absolute", left: 540 + dx - 100 + fly.x, top: cy - size * 0.86 - (1 - p) * 1300 + fly.y, width: 200, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: "-0.045em", color: A.orange, transformOrigin: "50% 100%", transform: `rotate(${fly.r}deg) scale(${1 + 0.18 * sq}, ${1 - 0.32 * sq})`, opacity: k > 18 ? 0 : 1 }}>
            {ch}
          </div>
        );
      })}
      {f >= slash && k < 10 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - lin(f, shatter, shatter + 8) }}>
          <line x1={200} y1={860} x2={200 + 680 * s1} y2={860 + 420 * s1} stroke={A.ink} strokeWidth={46} strokeLinecap="round" />
          <line x1={880} y1={860} x2={880 - 680 * s2} y2={860 + 420 * s2} stroke={A.ink} strokeWidth={46} strokeLinecap="round" />
        </svg>
      ) : null}
    </>
  );
};

// Insignia redonda con número y aro que gira (la cuenta 3·2·1)
const Badge: React.FC<{ x: number; y: number; r: number; n: number; f: number; pop: number; fill?: string }> = ({ x, y, r, n, f, pop, fill = A.ink }) => {
  const s = 1 + 0.16 * impact(f - pop);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <circle r={r} fill={fill} />
        <g transform={`rotate(${f * 4})`}>
          <path d={`M ${r * 1.18} 0 A ${r * 1.18} ${r * 1.18} 0 0 1 ${-r * 0.59} ${r * 1.02}`} fill="none" stroke={A.orange} strokeWidth={r * 0.1} strokeLinecap="round" />
          <path d={`M ${-r * 1.18} 0 A ${r * 1.18} ${r * 1.18} 0 0 1 ${r * 0.59} ${-r * 1.02}`} fill="none" stroke={A.orange} strokeWidth={r * 0.1} strokeLinecap="round" />
        </g>
        <text y={r * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 1.05} fill="#FBF8F2">
          {n}
        </text>
      </g>
    </svg>
  );
};

// Cabecera de cada forma: insignia pequeña + título
const FormHead: React.FC<{ n: number; title: string; f: number; at: number; titleAt: number }> = ({ n, title, f, at, titleAt }) => (
  <>
    <Badge x={140} y={470} r={58} n={n} f={f} pop={at} />
    <div style={{ position: "absolute", left: 230, top: 432, fontFamily: FONT, fontWeight: 800, fontSize: 66, letterSpacing: "-0.045em", color: A.ink, opacity: lin(f, titleAt, titleAt + 5), transform: `translateY(${(1 - lin(f, titleAt, titleAt + 6)) * -20}px)` }}>{title}</div>
  </>
);

const Stamp: React.FC<{ kind: "x" | "ok"; x: number; y: number; f: number; at: number }> = ({ kind, x, y, f, at }) => {
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: 30, config: { damping: 11, stiffness: 320 } });
  const c = kind === "x" ? A.ink : A.orange;
  return (
    <svg width={180} height={180} viewBox="-90 -90 180 180" style={{ position: "absolute", left: x - 90, top: y - 90, transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -20}deg)`, overflow: "visible" }}>
      <circle r={78} fill="#FBF8F2" stroke={c} strokeWidth={10} />
      {kind === "x" ? <path d="M-34 -34 L34 34 M34 -34 L-34 34" stroke={c} strokeWidth={18} strokeLinecap="round" /> : <path d="M-38 2 L-10 30 L40 -28" stroke={c} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
};

// Pantalla vertical (un «video» dentro del video)
const CARD = { x: 540, y: 1040, w: 560, h: 820 };
const Screen: React.FC<{ children: React.ReactNode; clipLeft?: number; clipRight?: number }> = ({ children, clipLeft = 0, clipRight = 0 }) => (
  <div style={{ position: "absolute", left: CARD.x - CARD.w / 2, top: CARD.y - CARD.h / 2, width: CARD.w, height: CARD.h, borderRadius: 40, overflow: "hidden", background: "#FBF8F2", clipPath: `inset(0 ${clipRight * 100}% 0 ${clipLeft * 100}%)` }}>{children}</div>
);
const ScreenFrame: React.FC = () => (
  <div style={{ position: "absolute", left: CARD.x - CARD.w / 2 - 8, top: CARD.y - CARD.h / 2 - 8, width: CARD.w + 16, height: CARD.h + 16, borderRadius: 46, border: `8px solid ${A.ink}`, boxSizing: "border-box", boxShadow: "0 22px 40px rgba(14,13,11,0.2)" }} />
);

const Bubble: React.FC<{ x: number; y: number; text: string; p: number; size?: number; hot?: boolean }> = ({ x, y, text, p, size = 64, hot }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${p})`, transformOrigin: "30% 100%", background: "#FBF8F2", border: `7px solid ${A.ink}`, borderRadius: 34, padding: "10px 30px 14px", fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", color: hot ? A.orange : A.ink, whiteSpace: "nowrap", opacity: p > 0.02 ? 1 : 0 }}>
    {text}
  </div>
);

const BOX = 230;
const BigBox: React.FC<{ x: number; y: number; squash?: number; rot?: number }> = ({ x, y, squash = 0, rot = 0 }) => (
  <svg width={BOX + 12} height={BOX * 0.8 + 12} viewBox={`0 0 ${BOX + 12} ${BOX * 0.8 + 12}`} style={{ position: "absolute", left: x - (BOX + 12) / 2, top: y - (BOX * 0.8 + 12), overflow: "visible", transformOrigin: "50% 100%", transform: `rotate(${rot}deg) scale(${1 + 0.08 * squash}, ${1 - 0.14 * squash})` }}>
    <rect x={6} y={6} width={BOX} height={BOX * 0.8} rx={20} fill="#FBF8F2" stroke={A.ink} strokeWidth={7} />
    <line x1={6} y1={50} x2={6 + BOX} y2={50} stroke={A.ink} strokeWidth={6} />
    <rect x={6 + BOX / 2 - 40} y={86} width={80} height={18} rx={9} fill={A.ink} />
  </svg>
);

// Tira de clips con dos pausas (forma 2)
const STRIP = { left: 110, right: 970, y: 760, h: 120 };
const Strip: React.FC<{ f: number; gap: number; hi: number; door: number; out: number }> = ({ f, gap, hi, door, out }) => {
  const blocks = [0.28, 0.32, 0.4];
  const gw = 120 * gap;
  const total = STRIP.right - STRIP.left - 2 * 120;
  const ws = blocks.map((b) => (b / 1) * total);
  const xs: number[] = [];
  let x = STRIP.left + (2 * 120 - 2 * gw) / 2;
  ws.forEach((w, i) => {
    xs.push(x);
    x += w + (i < 2 ? gw : 0);
  });
  return (
    <>
      {ws.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: xs[i], top: STRIP.y - STRIP.h / 2, width: w, height: STRIP.h, borderRadius: 18, background: A.ink }}>
          <svg width={w} height={STRIP.h} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: Math.floor(w / 14) }, (_, k) => {
              const h = 14 + 70 * Math.abs(Math.sin(k * 1.7 + i * 2.1));
              return <line key={k} x1={10 + k * 14} x2={10 + k * 14} y1={STRIP.h / 2 - h / 2} y2={STRIP.h / 2 + h / 2} stroke="#FBF8F2" strokeOpacity={0.55} strokeWidth={6} strokeLinecap="round" />;
            })}
          </svg>
        </div>
      ))}
      {gap > 0.02
        ? [0, 1].map((g) => {
            const gx = xs[g] + ws[g];
            return (
              <div key={g} style={{ position: "absolute", left: gx + 6, top: STRIP.y - STRIP.h / 2, width: Math.max(0, gw - 12), height: STRIP.h, borderRadius: 14, border: `5px dashed ${hi > 0 ? A.orange : A.grey}`, boxSizing: "border-box", transform: `scale(${1 + 0.1 * hi * Math.max(0, Math.sin(f * 0.5))})` }}>
                {g === 0 && door > 0 ? <div style={{ position: "absolute", inset: 6, background: A.ink, borderRadius: 8, transformOrigin: "0 50%", transform: `perspective(400px) rotateY(${-75 * door}deg)`, opacity: 0.9 }} /> : null}
              </div>
            );
          })
        : null}
      {/* espectadores que se van por la puerta */}
      {out > 0 && gap > 0.02
        ? [0, 1, 2].map((k) => {
            const p = Math.max(0, Math.min(1, out * 1.6 - k * 0.3));
            const gx = xs[0] + ws[0] + gw / 2;
            return <div key={k} style={{ position: "absolute", left: gx - 20 + (k - 1) * 40 * (1 - p), top: STRIP.y + 120 - p * 300, width: 40, height: 40, borderRadius: 20, background: A.grey, opacity: p > 0 && p < 1 ? 1 - p * 0.6 : 0 }} />;
          })
        : null}
    </>
  );
};

export const Falso15: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talk = talkAt(f);

  let scene: React.ReactNode = null;
  let hideCaps = false;

  if (f < S2) {
    // 1 · detalle con zoom: el móvil y su reloj (como el aro y la flecha de la referencia)
    const punch = ease(lin(f, 10, 18));
    const cam = mix({ z: 1, cx: 540, cy: 960 }, { z: 2.3, cx: PHONE.x + 10, cy: PHONE.y + 160 }, punch);
    const secs = interpolate(f, [10, W(iQuince), W(iSeg) + 6], [0, 13, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const g: GanchoPose = { x: 300, y: FLOOR, scale: 1.15, t, expr: "focused", armL: 30, armR: 95, look: { x: 1, y: -0.2 }, talk };
    scene = (
      <Camera cam={cam}>
        <ContactShadow x={300} y={FLOOR} w={260} />
        <Gancho {...g} />
        <Phone secs={secs} ring={lin(f, 0, 9)} t={t} />
        <Arrow x={PHONE.x - 30} y={PHONE.y + 200} bob={8 * Math.abs(Math.sin(f * 0.35))} scale={punch > 0.5 ? 0.55 : 1} />
      </Camera>
    );
  } else if (f < S3) {
    // 2 · plano abierto: la regla y la línea de 15 s; Hookie estira los brazos para pasarla
    const line = fall(f - (W(iFinal) - 8), fps);
    const reach = lin(f, W(iFinal) - 2, W(iFinal) + 6);
    const g: GanchoPose = { x: 450, y: FLOOR, scale: 1.4, t, expr: reach > 0 ? "surprised" : "normal", armL: 30 + 145 * reach, armR: 30 + 145 * reach, squash: -0.12 * reach, look: { x: 0.3, y: -1 }, talk };
    scene = (
      <>
        <RisingArrows f={f} />
        <Ruler line={f >= W(iFinal) - 8 ? line : 0} f={f - W(iFinal)} />
        <ContactShadow x={450} y={FLOOR} w={360} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S4) {
    // 3 · «obviamente… totalmente FALSO»: rayos, zoom a Hookie, FALSO cae, se tacha y se rompe
    const z = lin(f, S3, S3 + 8, 1, 1.35, ease);
    const shatter = W(iFalso) + 9;
    const g: GanchoPose = { x: 540, y: FLOOR, scale: 1.4, t, expr: f >= shatter ? "smug" : f >= W(iTotal) ? "surprised" : "focused", armL: 40, armR: f >= W(iFalso) ? 140 : 40, look: { x: 0, y: f >= W(iTotal) ? -0.6 : 0 }, talk, squash: 0.3 * impact(f - W(iTotal) - 6) };
    scene = (
      <>
        <Burst f={f} p={lin(f, S3, S3 + 4)} />
        <Camera cam={{ z, cx: 540, cy: 1250 }}>
          <ContactShadow x={540} y={FLOOR} w={360} />
          <Gancho {...g} />
        </Camera>
        <Falso f={f} fps={fps} drop={W(iTotal) - 4} slash={W(iFalso)} shatter={shatter} />
      </>
    );
    if (f >= W(iTotal) - 4) hideCaps = true;
  } else if (f < S5) {
    // 4 · «hay tres formas…»: cuenta 3·2·1 en una insignia; el 1 crece hasta llenar la pantalla
    const n = f >= W(iDejan) ? 1 : f >= W(iSaber) ? 2 : 3;
    const pop = f >= W(iDejan) ? W(iDejan) : f >= W(iSaber) ? W(iSaber) : W(iTres);
    const grow = lin(f, E(iVer1) - 2, S5, 0, 1, (x) => x * x * x);
    const g: GanchoPose = { x: 540, y: FLOOR, scale: 1.25, t, expr: "happy", armL: 150, armR: 150, look: { x: 0, y: -1 }, talk };
    scene = (
      <>
        <RisingArrows f={f} opacity={0.8} />
        <div style={{ position: "absolute", left: 72, top: 430, display: "flex", alignItems: "baseline", gap: 16, fontFamily: FONT, fontWeight: 800, letterSpacing: "-0.045em", opacity: lin(f, W(iTres), W(iTres) + 4) * (1 - grow) }}>
          <span style={{ fontSize: 120, color: A.orange }}>3</span>
          <span style={{ fontSize: 76, color: A.ink }}>FORMAS</span>
        </div>
        <ContactShadow x={540} y={FLOOR} w={330} />
        <Gancho {...g} />
        {f >= W(iTres) ? <Badge x={540} y={720 - 40 * grow} r={150 + 1500 * grow} n={n} f={f} pop={pop} /> : null}
      </>
    );
  } else if (f < S6) {
    // 5 · forma 1: el primer segundo. A: arranca con «hola» → se van (X). B (barrido): arranca con algo pasando → se quedan (✓)
    const wipe = lin(f, W(iSi2), W(iPasando), 0, 1, ease);
    const swipe = lin(f, W(iVan), W(iVan) + 8, 0, 1, (x) => x * x);
    const holaP = spring({ frame: f - W(iHola), fps, config: { damping: 12, stiffness: 300 } });
    const land = W(iPasando) - 2; // en B, Hookie cae desde arriba en el primer segundo
    const fallB = fall(f - (W(iSi2) + 4), fps);
    const enter = lin(f, S5, S5 + 6, 0, 1, ease);
    const cw = CARD.w;
    scene = (
      <>
        <FormHead n={1} title="EL PRIMER SEGUNDO" f={f} at={S5} titleAt={W(iSegundo1) - 4} />
        <AbsoluteFill style={{ transform: `scale(${0.9 + 0.1 * enter})`, opacity: enter }}>
          <Screen clipRight={wipe}>
            <div style={{ position: "absolute", inset: 0, transform: `translateY(${-swipe * 900}px)` }}>
              <Gancho x={cw / 2} y={CARD.h - 120} scale={0.75} t={t} expr="happy" armL={30} armR={f >= W(iHola) ? 150 + 22 * Math.sin(t * 10) : 40} />
              <Bubble x={cw / 2 + 120} y={250} text="¡Hola!" p={holaP} />
            </div>
          </Screen>
          <Screen clipLeft={1 - wipe}>
            <div style={{ position: "absolute", inset: 0, background: A.ivoryDeep }}>
              <ContactShadow x={cw / 2} y={CARD.h - 120} w={180} />
              <Gancho x={cw / 2} y={CARD.h - 120 - (1 - fallB) * 900} scale={0.75} t={t} expr={f >= land ? "surprised" : "focused"} armL={160} armR={160} squash={0.45 * impact(f - (W(iSi2) + 12))} />
            </div>
          </Screen>
          {wipe > 0 && wipe < 1 ? <div style={{ position: "absolute", left: CARD.x + CARD.w / 2 - CARD.w * wipe - 4, top: CARD.y - CARD.h / 2, width: 8, height: CARD.h, background: A.orange }} /> : null}
          <ScreenFrame />
          <div style={{ position: "absolute", left: CARD.x - CARD.w / 2 + 26, top: CARD.y - CARD.h / 2 + 22, fontFamily: LABEL, fontSize: 30, color: A.ink, background: "#FBF8F2", padding: "2px 10px", borderRadius: 8 }}>0:01</div>
          <Stamp kind="x" x={CARD.x - CARD.w / 2 + 40} y={CARD.y + CARD.h / 2 - 40} f={f} at={W(iVan)} />
          <Stamp kind="ok" x={CARD.x + CARD.w / 2 - 40} y={CARD.y + CARD.h / 2 - 40} f={f} at={W(iQuedan)} />
        </AbsoluteFill>
      </>
    );
  } else if (f < S7) {
    // 6 · forma 2: las pausas. Cada hueco es una puerta de salida; Hookie los corta con la tijera
    const snip1 = E(iSalida) + 2;
    const snip2 = snip1 + 8;
    const gap = 1 - 0.5 * lin(f, snip1, snip1 + 4) - 0.5 * lin(f, snip2, snip2 + 4);
    const g: GanchoPose = { x: 540, y: FLOOR, scale: 1.2, t, expr: f >= snip1 - 6 ? "focused" : "normal", item: f >= snip1 - 10 ? "scissors" : "none", armL: 30, armR: f >= snip1 - 10 ? 120 + 20 * Math.sin(f * 1.4) : 40, look: { x: 0, y: -1 }, talk };
    scene = (
      <>
        <FormHead n={2} title="LAS PAUSAS" f={f} at={S6} titleAt={W(iPausas) - 4} />
        <Strip f={f} gap={gap} hi={f >= W(iPausas) && f < snip1 ? 1 : 0} door={lin(f, W(iPuerta), W(iPuerta) + 8)} out={lin(f, W(iSalida), E(iSalida) + 6)} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: LABEL, fontSize: 30, color: A.grey, opacity: lin(f, W(iSilencio), W(iSilencio) + 5) * (1 - lin(f, snip1, snip1 + 4)) }}>SILENCIO · SILENCIO</div>
        <ContactShadow x={540} y={FLOOR} w={250} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S8) {
    // 7 · forma 3: lo que decís se tiene que ver. Dice «caja» → cae una caja (encima de él)
    const boxLand = W(iCaja2) + 2;
    const boxP = fall(f - (boxLand - 10), fps);
    const squashed = f >= boxLand;
    const g: GanchoPose = { x: 480, y: FLOOR, scale: 1.25, t, expr: squashed ? "squashed" : f >= W(iCae) ? "surprised" : "happy", armL: squashed ? 100 : 30, armR: squashed ? 100 : f >= W(iDecis1) ? 120 : 40, squash: squashed ? 0.5 + 0.2 * impact(f - boxLand) : 0, look: { x: 0, y: f >= W(iCae) ? -1 : 0 }, talk: squashed ? 0 : talk };
    const headY = FLOOR - 400 * 1.25 * (1 - (squashed ? 0.5 : 0) * 0.32);
    scene = (
      <>
        <FormHead n={3} title="LO QUE DECÍS, SE VE" f={f} at={S7} titleAt={W(iVer2) - 6} />
        <ContactShadow x={480} y={FLOOR} w={squashed ? 400 : 330} />
        <Gancho {...g} />
        <Bubble x={720} y={860} text={f >= W(iCajaW) ? "CAJA" : "…"} p={spring({ frame: f - W(iDecis1), fps, config: { damping: 12, stiffness: 280 } }) * (1 - lin(f, W(iCae), W(iCae) + 5))} size={84} hot={f >= W(iCajaW)} />
        {f >= boxLand - 10 ? <BigBox x={480} y={squashed ? headY + 30 : headY - (1 - boxP) * 1400} squash={squashed ? impact(f - boxLand) : 0} /> : null}
      </>
    );
    if (f >= W(iSi3) - 4) hideCaps = true;
  } else if (f < S9) {
    // 8 · respuesta: Hookie sale de debajo de la caja, engancha «DURACIÓN» y la arranca; cae «EDICIÓN»
    const dDrop = W(iDuracion) - 2;
    const hookAt = dDrop + 8;
    const yankAt = W(iEs2) - 4;
    const yk = yank(f - yankAt, 8);
    const eDrop = W(iEdicion) - 2;
    const out = lin(f, S8, S8 + 8, 0, 1, ease);
    const g: GanchoPose = { x: 480 - 200 * out, y: FLOOR, scale: 1.15, t, expr: f >= eDrop ? "smug" : f >= hookAt ? "strain" : "normal", armL: 40, armR: f >= hookAt ? 110 : 40, lean: f >= hookAt && f < yankAt + 8 ? -8 - 6 * lin(f, hookAt, yankAt) : 0, hookOut: f >= hookAt && f < yankAt + 8, look: { x: 1, y: -0.4 }, talk };
    const ant = antennaWorld(g);
    const dx = 600 - 1400 * yk;
    scene = (
      <>
        <BigBox x={800} y={FLOOR} rot={lin(f, S8, S8 + 8, 0, 18)} />
        {f >= dDrop && yk < 1 ? <Slab text="DURACIÓN" x={dx} y={900} size={150} squash={0.5 * impact(f - dDrop - 6)} lift={(1 - fall(f - dDrop, fps)) * 1000} pull={f >= hookAt ? -0.6 * lin(f, hookAt, yankAt) : 0} /> : null}
        {f >= hookAt && f < yankAt + 8 ? <Rope ax={ant.x} ay={ant.y} bx={dx - 380} by={830} slack={lin(f, hookAt, hookAt + 8, 0.8, 0.05)} buzz={f >= hookAt + 8 ? 0.5 : 0} t={t} /> : null}
        {f >= eDrop ? <Slab text="EDICIÓN" x={600} y={900} size={170} color={A.orange} squash={0.55 * impact(f - eDrop - 6)} lift={(1 - fall(f - eDrop, fps)) * 1200} /> : null}
        <ContactShadow x={g.x} y={FLOOR} w={250} />
        <Gancho {...g} />
      </>
    );
    if (f >= dDrop) hideCaps = true;
  } else {
    // 9 · CTA: «¿querés que revisemos el tuyo?» + Escribinos HOOK (Hookie engancha la caja naranja)
    const tHook = W(iHook);
    const g: GanchoPose = { x: 300, y: FLOOR, scale: 1.1, t, expr: f >= W(iDM) ? "happy" : "focused", armL: 40, armR: f >= tHook ? 120 : 60, lean: f >= tHook + 4 ? -6 : 0, hookOut: f >= tHook + 4, look: { x: 1, y: -0.6 }, talk };
    const ant = antennaWorld(g);
    scene = (
      <>
        {f < W(iEscr) ? <Slab text="EDICIÓN" x={600} y={900} size={170} color={A.orange} opacity={1 - lin(f, W(iEscr) - 6, W(iEscr))} /> : null}
        <Cta f={f} fps={fps} tEscr={W(iEscr)} tHook={tHook} tMuestra={W(iDM)} until={END + 10} verb="Escribinos" lines={["REVISAMOS", "EL TUYO"]} />
        {f >= tHook + 4 ? <Rope ax={ant.x} ay={ant.y} bx={712} by={476} slack={lin(f, tHook + 4, tHook + 14, 0.8, 0.1)} buzz={f >= tHook + 14 ? 0.4 : 0} t={t} /> : null}
        <ContactShadow x={300} y={FLOOR} w={250} />
        <Gancho {...g} />
      </>
    );
    if (f >= W(iEscr)) hideCaps = true;
  }

  return (
    <Paper>
      {scene}
      {hideCaps ? null : <Captions words={T.words} f={f} fps={fps} keys={KEYS} top={250} size={82} />}

      <Audio src={staticFile("audio/voz_falso15.wav")} />

      {/* sonido propio: tensión · tirón · impacto */}
      <Snd at={10} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iFinal) - 1} src={SOUND.impacto} vol={0.7} />
      <Sequence from={S3} durationInFrames={W(iTotal) - 4 - S3}>
        <Audio src={staticFile("sfx/hh/tension_subida.wav")} volume={0.32} />
      </Sequence>
      <Snd at={W(iTotal) + 2} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(iFalso)} src={SOUND.tiron} vol={0.5} />
      <Snd at={W(iFalso) + 9} src={SOUND.impacto} vol={0.4} />
      {[W(iTres), W(iSaber), W(iDejan)].map((a) => (
        <Snd key={a} at={a} src={SOUND.impacto} vol={0.35} />
      ))}
      <Snd at={W(iVan)} src={SOUND.impacto} vol={0.45} />
      <Snd at={W(iSi2) + 12} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iQuedan)} src={SOUND.impacto} vol={0.45} />
      <Snd at={E(iSalida) + 2} src={SOUND.impacto} vol={0.35} />
      <Snd at={E(iSalida) + 10} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(iCaja2) + 2} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(iDuracion) - 2 + 6} src={SOUND.impacto} vol={0.5} />
      <Snd at={W(iDuracion) + 6} src={SOUND.tension} vol={0.35} />
      <Snd at={W(iEs2) - 4} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(iEdicion) + 4} src={SOUND.impacto} vol={0.7} />
      <Snd at={W(iHook)} src={SOUND.tension} vol={0.35} />
      <Snd at={W(iHook) + 2} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(iDM)} src={SOUND.impacto} vol={0.5} />
    </Paper>
  );
};

// ---------- portada (1080 × 1920): el mito sin revelar el desenlace ----------
export const Falso15Portada: React.FC = () => {
  const g: GanchoPose = { x: 450, y: FLOOR, scale: 1.4, t: 1.2, expr: "surprised", armL: 175, armR: 175, squash: -0.12, look: { x: 0.3, y: -1 } };
  return (
    <Paper>
      <div style={{ position: "absolute", left: 72, top: 300, width: 760, fontFamily: FONT, fontWeight: 800, fontSize: 98, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink }}>
        ¿MÁS DE <span style={{ color: A.orange }}>15 s</span>
        <br />Y NADIE LO VE?
      </div>
      <Ruler line={1} f={99} />
      <ContactShadow x={450} y={FLOOR} w={360} />
      <Gancho {...g} />
    </Paper>
  );
};
