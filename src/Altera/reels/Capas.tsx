import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Snd } from "../reelkit";
import { A, ContactShadow, FONT, LABEL, Paper, Rope, SOUND, impact, lin } from "../system";
import { Tag } from "./Error1";

// «Un clip, cuatro capas» — video 2 de calendario-30-dias.md (2026-10-25). EJEMPLO CREADO PARA ESTE VIDEO.
// Un clip de 4 s (Gancho sube una caja a un estante con la línea) se desmonta capa por capa — texto, motion, color,
// sonido — hasta el bruto y se reconstruye. Las capas son interruptores reales del render: lo que se dice que falta, falta.
// Los fragmentos son siempre los últimos 2 s del clip (fotogramas 60–119), donde está el tirón (60) y el aterrizaje (90).

const F = (s: number) => Math.round(s * 30);
export const CAPAS_FRAMES = F(27.1);

type Layers = { text: boolean; motion: boolean; color: boolean; sound: boolean };
const ALL: Layers = { text: true, motion: true, color: true, sound: true };
const CLIP = 120; // 4,0 s
const SND = { tension: 15, tiron: 60, impacto: 90 }; // capa de sonido, en fotogramas del clip

// ---------- tramos (fotogramas globales) ----------
const S1 = F(4.8); // quitar texto
const S1F = F(5.3); // fragmento sin texto
const S2 = F(7.3); // quitar motion (congelado a mitad del tirón)
const S2X = F(7.6); // la línea se suelta y la caja vuelve al suelo
const S2F = F(8.52); // fragmento sin motion: la caja aparece en el estante en S2F + 30 (≈ «aparece»)
const S3 = S2F + 60; // quitar color
const S3F = S3 + 14;
const S4 = S3F + 60; // quitar sonido
const S4X = F(13.62); // «sonido»
const S4F = S4X + 3;
const S5 = S4F + 60; // pausa sobre el bruto
const S6 = F(16.6); // reconstrucción (clip completo)
const S7 = S6 + CLIP; // el clip completo otra vez, con las 4 capas
const S8 = S7 + CLIP; // quieto
const WM = F(25.6); // wordmark
const REBUILD = { sound: 0, color: 30, motion: 60, text: 100 }; // fotograma del clip en que vuelve cada capa

// ---------- escena del clip (coordenadas de la tarjeta 900 × 860) ----------
const CW = 900;
const CH = 860;
const FLOOR_Y = 760;
const SHELF = { x: 600, w: 260, y: 430 };
const BOX = { w: 170, h: 130 };
const START = { x: 470, y: FLOOR_Y }; // centro inferior de la caja
const END = { x: SHELF.x + SHELF.w / 2, y: SHELF.y };

const ease = (x: number) => x * x * (3 - 2 * x);
const boxPos = (c: number, motion: boolean) => {
  if (!motion) return c < 90 ? { ...START, sq: 0 } : { ...END, sq: 0 };
  if (c < 60) return { ...START, sq: 0 };
  if (c < 90) {
    const t = ease((c - 60) / 30);
    const cx = 560;
    const cy = 250;
    const x = (1 - t) * (1 - t) * START.x + 2 * (1 - t) * t * cx + t * t * END.x;
    const y = (1 - t) * (1 - t) * START.y + 2 * (1 - t) * t * cy + t * t * END.y;
    return { x, y, sq: 0 };
  }
  return { ...END, sq: impact(c - 90) };
};
const pose = (c: number): GanchoPose => {
  let g: GanchoPose = { x: 200, y: FLOOR_Y, scale: 0.75, t: c / 30, expr: "focused", armL: 30, armR: 40, look: { x: 1, y: -0.2 } };
  if (c >= 8 && c < 60) g = { ...g, armR: 110, lean: c >= 15 ? -5 : 0 };
  if (c >= 60 && c < 90) g = { ...g, expr: "strain", armR: 120, armL: 60, lean: -14 };
  if (c >= 96) g = { ...g, expr: "happy", armL: 140, armR: 140, lean: 0, look: { x: 1, y: -0.4 } };
  return g;
};

const Box: React.FC<{ x: number; y: number; sq: number }> = ({ x, y, sq }) => (
  <svg width={BOX.w + 12} height={BOX.h + 12} style={{ position: "absolute", left: x - (BOX.w + 12) / 2, top: y - BOX.h - 6, overflow: "visible", transformOrigin: "50% 100%", transform: `scale(${1 + 0.06 * sq}, ${1 - 0.12 * sq})` }}>
    <rect x={6} y={6} width={BOX.w} height={BOX.h} rx={16} fill="#FBF8F2" stroke={A.ink} strokeWidth={6} />
    <line x1={6} y1={36} x2={6 + BOX.w} y2={36} stroke={A.ink} strokeWidth={5} />
    <rect x={6 + BOX.w / 2 - 30} y={62} width={60} height={14} rx={7} fill={A.ink} />
  </svg>
);

const Clip: React.FC<{ c: number; L: Layers; textAt?: number; textFall?: number; ropeSnap?: number; colorK?: number }> = ({ c, L, textAt = 6, textFall = 0, ropeSnap = 0, colorK }) => {
  const g = pose(c);
  const b = boxPos(c, L.motion || ropeSnap > 0);
  // la caja vuelve al suelo cuando se quita el motion a mitad del tirón
  const by = ropeSnap > 0 ? b.y + (START.y - b.y) * ropeSnap : b.y;
  const bx = ropeSnap > 0 ? b.x + (START.x - b.x) * ropeSnap : b.x;
  let rope: { bx: number; by: number; slack: number; buzz: number } | null = null;
  if (L.motion && ropeSnap === 0) {
    const top = { x: bx, y: by - BOX.h };
    if (c >= 8 && c < 24) rope = { ...{ bx: top.x, by: top.y }, slack: lin(c, 8, 24, 0.9, 0.1), buzz: 0 };
    else if (c >= 24 && c < 90) rope = { bx: top.x, by: top.y, slack: 0.05, buzz: c >= 15 && c < 60 ? 0.3 : c >= 60 ? 0.6 : 0 };
    else if (c >= 90 && c < 100) rope = { bx: top.x, by: top.y, slack: lin(c, 90, 100, 0.05, 0.6), buzz: 0 };
  }
  const k = colorK ?? (L.color ? 1 : 0); // 1 = color y textura, 0 = gris plano
  const a = antennaWorld(g);
  const tIn = (d: number) => (c >= textAt + d ? lin(c, textAt + d, textAt + d + 6, 0, 1) : 0);
  return (
    <AbsoluteFill style={{ filter: k < 1 ? `grayscale(${1 - k})` : undefined }}>
      <Paper tone={k < 1 ? `rgb(${Math.round(242 * k + 205 * (1 - k))},${Math.round(237 * k + 205 * (1 - k))},${Math.round(227 * k + 205 * (1 - k))})` : A.ivory} />
      {k < 1 ? <AbsoluteFill style={{ background: "#CDCDCD", opacity: 1 - k }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR_Y, bottom: 0, background: k < 1 ? `rgba(160,160,160,${0.5})` : A.ivoryDeep }} />
      {/* estante */}
      <div style={{ position: "absolute", left: SHELF.x, top: SHELF.y, width: SHELF.w, height: 18, borderRadius: 6, background: A.ink }} />
      <div style={{ position: "absolute", left: SHELF.x + 30, top: SHELF.y + 18, width: 14, height: 60, background: A.ink }} />
      <div style={{ position: "absolute", left: SHELF.x + SHELF.w - 44, top: SHELF.y + 18, width: 14, height: 60, background: A.ink }} />
      <ContactShadow x={200} y={FLOOR_Y + 2} w={170} />
      {by >= FLOOR_Y - 1 ? <ContactShadow x={bx} y={FLOOR_Y + 2} w={BOX.w} /> : null}
      <Box x={bx} y={by} sq={L.motion ? b.sq : 0} />
      <Gancho {...g} />
      {rope ? <Rope ax={a.x} ay={a.y} bx={rope.bx} by={rope.by} slack={rope.slack} buzz={rope.buzz} t={c / 30} /> : null}
      {/* capa de texto */}
      {L.text && c >= textAt ? (
        <div style={{ position: "absolute", left: 48, top: 48 + textFall * 900, opacity: 1 - textFall, transform: `rotate(${textFall * 14}deg)`, fontFamily: FONT, fontWeight: 800, fontSize: 92, lineHeight: 1, letterSpacing: "-0.045em" }}>
          <span style={{ display: "inline-block", color: A.ink, opacity: tIn(0), transform: `translateY(${(1 - tIn(0)) * -30}px)` }}>ENTREGA</span>{" "}
          <span style={{ display: "inline-block", color: A.orange, opacity: tIn(8), transform: `translateY(${(1 - tIn(8)) * -30}px)` }}>HOY</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CARD = { x: 72, y: 400 }; // 858 de ancho: dentro de la zona segura (x 72–930)
const K = 858 / CW;
const ClipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CW * K, height: CH * K, borderRadius: 30, overflow: "hidden", border: `6px solid ${A.ink}`, boxSizing: "border-box", boxShadow: "0 30px 50px rgba(14,13,11,0.25)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `scale(${K})` }}>{children}</div>
  </div>
);

const CHIPS: { key: keyof Layers; label: string }[] = [
  { key: "text", label: "TEXTO" },
  { key: "motion", label: "MOTION" },
  { key: "color", label: "COLOR" },
  { key: "sound", label: "SONIDO" },
];
const Chips: React.FC<{ L: Layers; f: number; changedAt: Partial<Record<keyof Layers, number>> }> = ({ L, f, changedAt }) => (
  <div style={{ position: "absolute", left: 72, top: 1300, width: 858, display: "flex", gap: 14 }}>
    {CHIPS.map(({ key, label }) => {
      const on = L[key];
      const at = changedAt[key];
      const pop = at !== undefined && f >= at ? impact(f - at) : 0;
      return (
        <div key={key} style={{ position: "relative", flex: 1, height: 80, borderRadius: 40, border: `5px solid ${A.ink}`, background: on ? A.ink : "transparent", color: on ? A.ivory : A.grey, fontFamily: LABEL, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.08 * pop})` }}>
          {label}
          {!on ? <div style={{ position: "absolute", left: 18, right: 18, top: 32, height: 6, background: A.ink, borderRadius: 3 }} /> : null}
        </div>
      );
    })}
  </div>
);

const Counter: React.FC<{ n: number; f: number; at: number }> = ({ n, f, at }) => (
  <div style={{ position: "absolute", left: 72, top: 236, fontFamily: FONT, fontWeight: 800, fontSize: 130, lineHeight: 1, letterSpacing: "-0.05em", color: A.ink, transformOrigin: "0 100%", transform: `scale(${1 + 0.1 * impact(f - at)})` }}>
    <span style={{ color: A.orange }}>{n}</span> {n === 1 ? "CAPA" : "CAPAS"}
  </div>
);

const Wordmark: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const drop = (at: number) => (f < at ? 0 : Math.min(1, spring({ frame: f - at, fps, config: { damping: 14, stiffness: 260, mass: 1.2 } })));
  const word = (text: string, at: number, color: string) => {
    const d = drop(at - 9);
    const sq = impact(f - at);
    return (
      <span style={{ display: "inline-block", color, transformOrigin: "50% 100%", transform: `translateY(${(1 - d) * -700}px) scale(${1 + 0.12 * sq}, ${1 - 0.18 * sq})` }}>{text}</span>
    );
  };
  return (
    <div style={{ position: "absolute", left: 72, top: 276, fontFamily: FONT, fontWeight: 800, fontSize: 124, lineHeight: 1, letterSpacing: "-0.055em" }}>
      {word("HOOK", WM + 9, A.orange)}
      {word("HOUSE", WM + 21, A.ink)}
    </div>
  );
};

export const Capas: React.FC = () => {
  const f = useCurrentFrame();

  // estado de cada tramo
  let c = 0;
  let L: Layers = ALL;
  let extra: Partial<React.ComponentProps<typeof Clip>> = {};
  let n = 4;
  let nAt = -99;
  const changed: Partial<Record<keyof Layers, number>> = {};
  if (f < S1) {
    c = Math.min(f, CLIP - 1);
  } else if (f < S1F) {
    c = CLIP - 1;
    const fall = lin(f, S1 + 6, S1F, 0, 1, (x) => x * x);
    extra = { textFall: fall };
    if (f >= S1 + 6) {
      n = 3;
      nAt = S1 + 6;
      changed.text = S1 + 6;
    }
  } else if (f < S2) {
    c = 60 + (f - S1F);
    L = { ...ALL, text: false };
    n = 3;
  } else if (f < S2F) {
    c = 75;
    L = { ...ALL, text: false };
    n = 3;
    if (f >= S2X) {
      extra = { ropeSnap: lin(f, S2X, S2X + 10, 0, 1, (x) => x * x) };
      n = 2;
      nAt = S2X;
      changed.motion = S2X;
      L = { ...L, motion: false };
    }
  } else if (f < S3) {
    c = 60 + (f - S2F);
    L = { ...ALL, text: false, motion: false };
    n = 2;
  } else if (f < S3F) {
    c = CLIP - 1;
    L = { ...ALL, text: false, motion: false };
    extra = { colorK: 1 - lin(f, S3, S3F - 2) };
    n = f >= S3 + 6 ? 1 : 2;
    nAt = S3 + 6;
    if (f >= S3 + 6) changed.color = S3 + 6;
    L = { ...L, color: f < S3 + 6 };
  } else if (f < S4) {
    c = 60 + (f - S3F);
    L = { text: false, motion: false, color: false, sound: true };
    n = 1;
  } else if (f < S5) {
    c = f < S4F ? CLIP - 1 : 60 + (f - S4F);
    L = { text: false, motion: false, color: false, sound: f < S4X };
    n = f >= S4X ? 0 : 1;
    nAt = S4X;
    if (f >= S4X) changed.sound = S4X;
  } else if (f < S6) {
    c = CLIP - 1;
    L = { text: false, motion: false, color: false, sound: false };
    n = 0;
  } else if (f < S7) {
    c = f - S6;
    L = { sound: c >= REBUILD.sound, color: c >= REBUILD.color, motion: c >= REBUILD.motion, text: c >= REBUILD.text };
    n = [L.sound, L.color, L.motion, L.text].filter(Boolean).length;
    const lastAt = [REBUILD.text, REBUILD.motion, REBUILD.color, REBUILD.sound].find((x) => c >= x) ?? 0;
    nAt = S6 + lastAt;
    (Object.keys(REBUILD) as (keyof Layers)[]).forEach((key) => {
      if (c >= REBUILD[key]) changed[key] = S6 + REBUILD[key];
    });
    extra = { textAt: REBUILD.text };
  } else if (f < S8) {
    c = f - S7;
    extra = { textAt: -30 }; // al repetir el clip el rótulo ya está: no vuelve a entrar
  } else {
    c = CLIP - 1;
  }

  // el motion vuelve a mitad del clip: la línea entra ya tensa
  const showBruto = f >= S4X && f < S6;

  const voice = (at: number, src: string) => (
    <Sequence from={F(at)}>
      <Audio src={staticFile(`audio/capas/${src}.wav`)} />
    </Sequence>
  );
  // sonidos de la capa de sonido para un tramo que reproduce el clip desde c0 en el fotograma g0
  const clipSounds = (g0: number, c0: number, key: string, on: (c: number) => boolean = () => true) =>
    (Object.entries(SND) as [keyof typeof SND, number][])
      .filter(([, cc]) => cc >= c0 && on(cc))
      .map(([name, cc]) => <Snd key={`${key}-${name}`} at={g0 + (cc - c0)} src={SOUND[name]} vol={name === "impacto" ? 0.8 : name === "tiron" ? 0.7 : 0.4} />);

  return (
    <Paper>
      {f < WM ? <Counter n={n} f={f} at={nAt} /> : <Wordmark f={f} />}
      <ClipCard>
        <Clip c={c} L={L} {...extra} />
      </ClipCard>
      <Chips L={L} f={f} changedAt={changed} />
      <Tag text={showBruto ? "El bruto · ejemplo creado para este video" : "Ejemplo creado para este video"} y={1410} />

      {/* voz */}
      {voice(0.2, "l1")}
      {voice(4.9, "l2")}
      {voice(7.3, "l3")}
      {voice(10.55, "l4")}
      {voice(13.0, "l5")}
      {voice(15.95, "l6")}
      {voice(20.75, "l7")}

      {/* capa de sonido: solo suena cuando la capa está activa */}
      {clipSounds(0, 0, "s0")}
      {clipSounds(S1F, 60, "s1")}
      {clipSounds(S2F, 60, "s2")}
      {clipSounds(S3F, 60, "s3")}
      {clipSounds(S6, 0, "s6", (cc) => cc >= REBUILD.sound)}
      {clipSounds(S7, 0, "s7")}
      {/* quitar/poner capas (acciones de edición) */}
      <Snd at={S1 + 6} src={SOUND.impacto} vol={0.3} />
      <Snd at={S2X} src={SOUND.tiron} vol={0.5} />
      <Snd at={S3 + 6} src={SOUND.impacto} vol={0.3} />
      <Snd at={WM + 9} src={SOUND.impacto} vol={0.8} />
      <Snd at={WM + 21} src={SOUND.impacto} vol={0.8} />
    </Paper>
  );
};

// ---------- portada (1080 × 1920): el clip completo a mitad del tirón, sin revelar el bruto ----------
export const CapasPortada: React.FC = () => (
  <Paper>
    <div style={{ position: "absolute", left: 72, top: 250, fontFamily: FONT, fontWeight: 800, fontSize: 190, lineHeight: 1, letterSpacing: "-0.05em", color: A.ink }}>
      <span style={{ color: A.orange }}>4</span> CAPAS
    </div>
    <div style={{ position: "absolute", left: CARD.x, top: 500, width: CW * K, height: CH * K, borderRadius: 30, overflow: "hidden", border: `6px solid ${A.ink}`, boxSizing: "border-box", boxShadow: "0 30px 50px rgba(14,13,11,0.25)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `scale(${K})` }}>
        <Clip c={80} L={ALL} textAt={-30} />
      </div>
    </div>
    <Tag text="Un clip · se desarma capa por capa" y={1390} />
  </Paper>
);
