import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Ebook de 35 recetas — video 1 «¿Qué cocino hoy?» (2026-10-25). Proyecto independiente de Hook House: sin Hookie,
// sin la identidad Altera. Identidad PROVISIONAL (crema, tomate, albahaca, tinta; Poppins) hasta tener la portada.
// Esta composición es solo la APERTURA (previsualización): la receta real todavía no está, así que la revelación
// es un marcador rotulado «pendiente» y no se presenta como plato real.

loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Poppins", url: staticFile("fonts/poppins-latin-600-normal.woff2"), weight: "600" });

const C = { cream: "#FFF6EA", creamDeep: "#F6E7D2", tomato: "#E4572E", basil: "#3C8D5A", ink: "#2B2118", mustard: "#F2B134", skin: "#F1C7A1", hair: "#4A2E1F", light: "#FFF3B0" };
const FONT = "Poppins";
const F = (s: number) => Math.round(s * 30);
const lin = (f: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) => interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
const bump = (local: number) => (local < 0 ? 0 : Math.exp(-local / 5) * Math.cos(local * 0.75));
export const APERTURA_FRAMES = F(8.2);

// ---------- tiempos (s) ----------
const VO = 0.15; // voz_gancho.wav
const WORDS = [["Abrís", 0.05], ["la", 0.44], ["heladera.", 0.56], ["La", 1.44], ["cerrás.", 1.72], ["La", 2.56], ["volvés", 2.84], ["a", 3.24], ["abrir…", 3.32], ["¿qué", 4.4], ["vas", 4.56], ["a", 4.68], ["cocinar?", 4.8]] as const; // Scribe
const DOOR = { open1: 0.35, close: 1.75, open2: 2.85 }; // puerta (y sus sonidos)
const QUESTION = VO + 4.4;
const RISER = { from: 0.3, to: 6.2 }; // riser.wav (5,9 s): sube bajo la voz y termina seco en la revelación
const REVEAL = 6.35; // tras 0,15 s de silencio
const VOICE: [number, number][] = [
  [VO + 0.05, VO + 1.0],
  [VO + 1.4, VO + 2.3],
  [VO + 2.5, VO + 3.95],
  [VO + 4.4, VO + 5.3],
];

// ---------- personaje ----------
type Mood = "neutral" | "hopeful" | "sigh" | "think";
const Cook: React.FC<{ x: number; y: number; mood: Mood; reach: number; t: number; lit: number; headTilt: number }> = ({ x, y, mood, reach, t, lit, headTilt }) => {
  const breathe = Math.sin(t * 2.2) * 3;
  const armR = interpolate(reach, [0, 1], [10, 70]); // brazo derecho hacia la manija
  const armL = mood === "think" ? 150 : 15;
  const hand = (sx: number, sy: number, ang: number, len = 150) => {
    const a = (ang * Math.PI) / 180;
    return { x: sx + Math.sin(a) * len, y: sy + Math.cos(a) * len };
  };
  const shL = { x: 110, y: 300 };
  const shR = { x: 250, y: 300 };
  const hR = hand(shR.x, shR.y, armR);
  const hL = mood === "think" ? { x: 168, y: 238 } : hand(shL.x, shL.y, -armL);
  return (
    <svg width={360} height={760} viewBox="0 0 360 760" style={{ position: "absolute", left: x - 180, top: y - 760, overflow: "visible" }}>
      {/* luz de la heladera sobre el personaje */}
      <defs>
        <linearGradient id="glow" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={C.light} stopOpacity={0.55 * lit} />
          <stop offset="100%" stopColor={C.light} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* piernas */}
      <rect x={128} y={520} width={44} height={200} rx={18} fill={C.ink} />
      <rect x={188} y={520} width={44} height={200} rx={18} fill={C.ink} />
      <ellipse cx={146} cy={724} rx={40} ry={16} fill={C.ink} />
      <ellipse cx={214} cy={724} rx={40} ry={16} fill={C.ink} />
      {/* brazos */}
      <path d={`M${shL.x} ${shL.y} Q ${(shL.x + hL.x) / 2 - 20} ${(shL.y + hL.y) / 2} ${hL.x} ${hL.y}`} stroke={C.skin} strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d={`M${shR.x} ${shR.y} Q ${(shR.x + hR.x) / 2 + 20} ${(shR.y + hR.y) / 2} ${hR.x} ${hR.y}`} stroke={C.skin} strokeWidth={30} fill="none" strokeLinecap="round" />
      {/* torso: remera + delantal */}
      <g transform={`translate(0 ${breathe})`}>
        <rect x={92} y={260} width={176} height={280} rx={60} fill={C.basil} />
        <path d="M128 330 L232 330 L242 540 L118 540 Z" fill={C.cream} />
        <rect x={160} y={360} width={40} height={30} rx={8} fill={C.tomato} opacity={0.85} />
      </g>
      {/* manos */}
      <circle cx={hL.x} cy={hL.y} r={20} fill={C.skin} />
      <circle cx={hR.x} cy={hR.y} r={20} fill={C.skin} />
      {/* cabeza */}
      <g transform={`rotate(${headTilt} 180 240) translate(0 ${breathe})`}>
        <circle cx={180} cy={150} r={96} fill={C.skin} />
        <path d="M86 140 C88 60 150 40 196 46 C250 52 282 96 276 150 C250 110 200 96 150 104 C120 110 100 124 86 140 Z" fill={C.hair} />
        <circle cx={232} cy={56} r={34} fill={C.hair} />
        {/* ojos y cejas según el ánimo */}
        {mood === "sigh" ? (
          <>
            <path d="M136 160 Q150 168 164 160" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d="M196 160 Q210 168 224 160" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={150 + (mood === "think" ? 6 : 10)} cy={mood === "think" ? 148 : 156} rx={10} ry={14} fill={C.ink} />
            <ellipse cx={210 + (mood === "think" ? 6 : 10)} cy={mood === "think" ? 148 : 156} rx={10} ry={14} fill={C.ink} />
          </>
        )}
        <path d={mood === "think" ? "M130 118 L166 126 M194 124 L230 112" : mood === "hopeful" ? "M130 122 Q148 108 166 120 M194 120 Q212 108 230 122" : "M130 126 L166 126 M194 126 L230 126"} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        {mood === "sigh" ? <ellipse cx={180} cy={202} rx={14} ry={10} fill={C.ink} /> : mood === "hopeful" ? <path d="M156 196 Q180 216 204 196" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" /> : <path d="M164 204 L200 198" stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" />}
        <circle cx={128} cy={186} r={12} fill={C.tomato} opacity={0.25} />
        <circle cx={234} cy={186} r={12} fill={C.tomato} opacity={0.25} />
      </g>
      <rect x={0} y={0} width={360} height={760} fill="url(#glow)" />
    </svg>
  );
};

// ---------- heladera ----------
const FR = { x: 540, y: 560, w: 380, h: 880 };
const Fridge: React.FC<{ open: number }> = ({ open }) => {
  const doorW = FR.w * (1 - 0.86 * open); // la puerta gira hacia el espectador desde la bisagra derecha
  return (
    <>
      {/* interior */}
      <div style={{ position: "absolute", left: FR.x, top: FR.y, width: FR.w, height: FR.h, borderRadius: 34, background: C.ink, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 14, borderRadius: 24, background: `linear-gradient(180deg, ${C.light} 0%, #FFFFFF 100%)`, opacity: 0.25 + 0.75 * open }}>
          {[0.27, 0.52, 0.77].map((p, i) => (
            <div key={i} style={{ position: "absolute", left: 10, right: 10, top: `${p * 100}%`, height: 10, borderRadius: 5, background: "#DCCFB8" }} />
          ))}
          {/* frascos sin identificar (la receta todavía no se eligió) */}
          {[
            [40, 150, 60, 80],
            [120, 166, 50, 64],
            [230, 140, 70, 90],
            [60, 372, 90, 70],
            [200, 360, 56, 82],
          ].map(([l, t, w, h], i) => (
            <div key={i} style={{ position: "absolute", left: l, top: t, width: w, height: h, borderRadius: 14, background: "#E9DDC8", border: `5px solid #CDBFA6` }} />
          ))}
        </div>
      </div>
      {/* puerta */}
      <div style={{ position: "absolute", left: FR.x + FR.w - doorW, top: FR.y, width: doorW, height: FR.h, borderRadius: 34, background: "#EDEFF0", border: `8px solid ${C.ink}`, boxSizing: "border-box", boxShadow: open > 0.05 ? "-20px 0 40px rgba(43,33,24,0.25)" : "none" }}>
        <div style={{ position: "absolute", left: 18 * (1 - open) + 6, top: 120, width: 18, height: 220, borderRadius: 9, background: C.ink, opacity: 1 - open * 0.6 }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 380, height: 8, background: C.ink }} />
      </div>
    </>
  );
};

const Caption: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  // un tramo por frase: se reemplaza al empezar la siguiente
  const groups = [
    [0, 3],
    [3, 5],
    [5, 9],
    [9, 13],
  ];
  const g = [...groups].reverse().find(([a]) => f >= F(VO + WORDS[a][1]));
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 72, width: 858, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 82, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.ink }}>
      {WORDS.slice(g[0], g[1]).map(([w, o], i) => {
        const at = F(VO + o);
        if (f < at) return null;
        const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 320 } });
        const hot = w === "heladera." || w === "cocinar?";
        return (
          <span key={i} style={{ display: "inline-block", marginRight: 18, color: hot ? C.tomato : C.ink, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * -24}px)` }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const EbookApertura: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const doorAnim = (at: number, close = false) => lin(f, F(at), F(at) + 7, 0, 1, (x) => 1 - (1 - x) ** 3) * (close ? -1 : 1);
  const open = Math.max(0, Math.min(1, (t >= DOOR.open1 ? doorAnim(DOOR.open1) : 0) + (t >= DOOR.close ? doorAnim(DOOR.close, true) : 0) + (t >= DOOR.open2 ? doorAnim(DOOR.open2) : 0)));
  const mood: "neutral" | "hopeful" | "sigh" | "think" = t < DOOR.open1 ? "neutral" : t < DOOR.close + 0.1 ? "hopeful" : t < DOOR.open2 ? "sigh" : t < QUESTION - 0.1 ? "hopeful" : "think";
  const reach = t < DOOR.open1 + 0.2 ? lin(f, 0, F(DOOR.open1), 0.6, 1) : t < DOOR.close + 0.3 ? 1 : t < DOOR.open2 + 0.2 ? lin(f, F(DOOR.open2) - 6, F(DOOR.open2), 0.4, 1) : t < QUESTION ? 1 : 0.2;
  // acercamiento a la heladera con la pregunta
  const zoom = 1 + 0.16 * lin(f, F(QUESTION), F(RISER.to), 0, 1, (x) => x * x);
  const revealed = t >= RISER.to;

  return (
    <AbsoluteFill style={{ background: C.cream }}>
      {!revealed ? (
        <>
          <AbsoluteFill style={{ transformOrigin: `${FR.x + FR.w / 2}px ${FR.y + FR.h * 0.4}px`, transform: `scale(${zoom})` }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1440, bottom: 0, background: C.creamDeep }} />
            <Fridge open={open} />
            <Cook x={300} y={1450} mood={mood} reach={reach} t={t} lit={open} headTilt={mood === "think" ? -8 : mood === "sigh" ? 6 : 0} />
            {/* la pregunta: flecha a la heladera y signos que se acumulan */}
            {t >= QUESTION
              ? [0, 1, 2].map((k) => {
                  const p = spring({ frame: f - F(QUESTION + 0.5 + k * 0.25), fps, config: { damping: 12, stiffness: 240 } });
                  return t >= QUESTION + 0.5 + k * 0.25 ? (
                    <div key={k} style={{ position: "absolute", left: 190 + k * 70, top: 520 - k * 40, fontFamily: FONT, fontWeight: 800, fontSize: 110 + k * 20, color: k === 2 ? C.tomato : C.ink, transform: `scale(${p}) rotate(${(k - 1) * 12}deg)` }}>
                      ?
                    </div>
                  ) : null;
                })
              : null}
            {t >= QUESTION + 0.2 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <path d={`M 470 ${880} Q 520 ${820} ${590} ${900}`} stroke={C.tomato} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 * (1 - lin(f, F(QUESTION + 0.2), F(QUESTION + 0.5)))} />
                <path d="M 570 880 L 596 906 L 562 914" stroke={C.tomato} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={lin(f, F(QUESTION + 0.45), F(QUESTION + 0.5))} />
              </svg>
            ) : null}
          </AbsoluteFill>
          <Caption f={f} fps={fps} />
        </>
      ) : (
        <AbsoluteFill style={{ background: C.cream }}>
          {/* revelación (MARCADOR): el plato real depende de la receta del ebook */}
          {t >= RISER.to ? (
            <>
              <div style={{ position: "absolute", left: 190, top: 760, width: 700, height: 700, borderRadius: "50%", background: "#FFFFFF", border: `10px solid ${C.ink}`, boxShadow: "0 40px 60px rgba(43,33,24,0.2)", transform: `scale(${1 + 0.04 * Math.max(0, Math.sin((f - F(REVEAL)) * 0.5)) * Math.exp(-(f - F(REVEAL)) / 8)})` }}>
                <div style={{ position: "absolute", inset: 120, borderRadius: "50%", border: `6px dashed ${C.tomato}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 52, lineHeight: 1.1, color: C.tomato }}>
                  RECETA
                  <br />
                  DEL EBOOK
                </div>
              </div>
              <div style={{ position: "absolute", left: 72, width: 858, top: 330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 62, lineHeight: 1.15, color: C.ink, opacity: lin(f, F(REVEAL) + 4, F(REVEAL) + 10) }}>
                Con esto podés preparar
                <br />
                <span style={{ color: C.tomato }}>[receta real del ebook]</span>
              </div>
              <div style={{ position: "absolute", left: 72, width: 858, textAlign: "center", top: 240, fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.ink, opacity: 0.7 }}>● MARCADOR PROVISIONAL · falta el ebook</div>
            </>
          ) : null}
          {/* tapa que se levanta en la revelación */}
          <div style={{ position: "absolute", left: 200, top: 760 - lin(f, F(REVEAL), F(REVEAL) + 10, 0, 1, (x) => x * x) * 1300, width: 680, height: 470, borderRadius: "360px 360px 40px 40px", background: "#D9DDE0", border: `10px solid ${C.ink}`, boxSizing: "border-box", transform: `rotate(${lin(f, F(REVEAL), F(REVEAL) + 10) * -14}deg)` }}>
            <div style={{ position: "absolute", left: 300, top: -46, width: 60, height: 50, borderRadius: 25, background: C.ink }} />
          </div>
        </AbsoluteFill>
      )}

      {/* sonido */}
      <Sequence from={F(VO)}>
        <Audio src={staticFile("ebook/voz_gancho.wav")} />
      </Sequence>
      {[DOOR.open1, DOOR.open2].map((a) => (
        <Sequence key={a} from={F(a)} durationInFrames={20}>
          <Audio src={staticFile("ebook/heladera_abre.wav")} volume={0.9} />
        </Sequence>
      ))}
      <Sequence from={F(DOOR.close)} durationInFrames={25}>
        <Audio src={staticFile("ebook/heladera_cierra.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={F(RISER.from)} durationInFrames={F(RISER.to) - F(RISER.from)}>
        <Audio
          src={staticFile("ebook/riser.wav")}
          volume={(fr) => {
            const tt = RISER.from + fr / 30;
            const d = Math.min(...VOICE.map(([a, b]) => (tt < a ? a - tt : tt > b ? tt - b : 0)));
            // bajo la voz el riser queda unos 7 dB por debajo; sin voz suena entero
            const under = interpolate(tt, [0.3, 1.2, 2.0, 3.3, 4.6, 5.45], [1, 0.85, 0.62, 0.45, 0.25, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return under + (1 - under) * Math.min(1, d / 0.15);
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
void bump;
void C.mustard;
