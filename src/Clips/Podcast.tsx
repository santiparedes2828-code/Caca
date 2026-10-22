import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../data/words-podcast.json";
import { SANS } from "../HookHouse/brand";

// Clip de podcast editado estilo Hormozi + motion graphics del video de referencia 2 (tarjetas marfil, naranja).
// formula-viral: abre con la frase más fuerte ("broke… rich") y luego el clip completo sin silencios.
// Zona segura TikTok: subtítulos en y ≈ 1120–1300, tarjetas en y 300–760, nada en los bordes.

const FPS = 30;
const words = wordsJson as { text: string; s: number; e: number }[];
// Tramos del original (s) en orden de montaje
const SEGS: [number, number][] = [
  [16.7, 20.12],
  [0.0, 6.3],
  [6.75, 10.35],
  [12.0, 26.2],
];
const segStart = SEGS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (SEGS[i - 1][1] - SEGS[i - 1][0])], []);
export const PODCAST_FRAMES = Math.round((segStart[SEGS.length - 1] + SEGS[SEGS.length - 1][1] - SEGS[SEGS.length - 1][0]) * FPS);
const toOut = (k: number, src: number) => segStart[k] + src - SEGS[k][0];
// Palabras en tiempo de salida
const OUT = SEGS.flatMap((seg, k) => words.filter((w) => w.s >= seg[0] - 0.02 && w.e <= seg[1] + 0.05).map((w) => ({ ...w, os: toOut(k, w.s), oe: toOut(k, w.e), seg: k })));
const KEYWORDS = new Set(["lives.", "alive", "story", "fighter,", "webcam", "owner,", "broke,", "rich.", "times,", "varied", "life."]);

// Encuadre vertical: plano corto centrado en él; plano general (7,74–17,45 s del original) recortado sobre él
const focusAt = (src: number) => (src >= 7.74 && src < 17.45 ? { cx: 0.205, cy: 0.45, z: 1.55 } : { cx: 0.47, cy: 0.5, z: 1.0 });

const Clip: React.FC<{ k: number; f: number }> = ({ k, f }) => {
  const seg = SEGS[k];
  const localS = f / FPS;
  const src = seg[0] + localS;
  const fo = focusAt(src);
  // Punch-in alterno por tramo + empuje en palabras clave
  const kw = OUT.filter((w) => w.seg === k && KEYWORDS.has(w.text));
  let punch = 0;
  for (const w of kw) {
    const d = localS - (w.s - seg[0]);
    if (d >= 0 && d < 0.6) punch = Math.max(punch, interpolate(d, [0, 0.08, 0.6], [0, 1, 0.6]));
  }
  const base = k % 2 === 0 ? 1.12 : 1.0;
  const z = fo.z * (base + 0.06 * punch + 0.02 * (localS / 10));
  const H = 1920 * z;
  const Wd = H * (16 / 9);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <OffthreadVideo
        src={staticFile("portfolio/podcast_raw.mp4")}
        startFrom={Math.round(seg[0] * FPS)}
        endAt={Math.round(seg[1] * FPS)}
        muted
        style={{ position: "absolute", height: H, width: Wd, left: 540 - fo.cx * Wd, top: 960 - fo.cy * H, maxWidth: "none" }}
      />
    </AbsoluteFill>
  );
};

// Subtítulos Hormozi: Inter 800 blanca con contorno, 3 palabras, la que suena en naranja y con pop
const Captions: React.FC<{ t: number; f: number; fps: number }> = ({ t, f, fps }) => {
  let cur = -1;
  for (let i = 0; i < OUT.length; i++) if (t >= OUT[i].os - 0.02) cur = i;
  if (cur < 0) return null;
  if (t > OUT[cur].oe + 0.5) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (n >= 3 || /[.,]$/.test(OUT[i - 1].text) || OUT[i].seg !== OUT[i - 1].seg)) {
      start = i;
      n = 0;
    }
    n++;
  }
  const chunk = OUT.slice(start, cur + 1);
  const chunkIn = spring({ frame: f - Math.round(OUT[start].os * fps), fps, config: { damping: 12, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", top: 1130, left: 70, right: 150, textAlign: "center", transform: `scale(${0.85 + 0.15 * chunkIn})` }}>
      {chunk.map((w, k) => {
        const i = start + k;
        const isCur = i === cur;
        const pop = spring({ frame: f - Math.round(w.os * fps), fps, config: { damping: 10, stiffness: 300 } });
        const key = KEYWORDS.has(w.text);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 12px",
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: key ? 104 : 92,
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: isCur ? (key ? "#FF7A1A" : "#FFD23F") : "#FFFFFF",
              WebkitTextStroke: "10px #000",
              paintOrder: "stroke fill",
              textShadow: "0 8px 0 rgba(0,0,0,0.55), 0 0 26px rgba(0,0,0,0.5)",
              transform: `scale(${isCur ? 1 + 0.12 * (1 - Math.min(1, pop)) + 0.06 : 1}) translateY(${(1 - Math.min(1, pop)) * 18}px)`,
            }}
          >
            {w.text.replace(/[.,]/g, "")}
          </span>
        );
      })}
    </div>
  );
};

// Tarjeta marfil al estilo del video de referencia (sombra grande, etiqueta naranja, palabra enorme)
const Card: React.FC<{ f: number; at: number; until: number; label: string; big: string; emoji: string; x: number; y: number; rot: number; fps: number }> = ({ f, at, until, label, big, emoji, x, y, rot, fps }) => {
  if (f < at || f > until + 8) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 220 } });
  const out = interpolate(f, [until, until + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot * (2 - s)}deg) scale(${s * out})`,
        background: "#F5EEE3",
        borderRadius: 34,
        padding: "26px 40px 30px",
        boxShadow: "0 40px 70px rgba(0,0,0,0.45), 0 6px 0 rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div style={{ fontSize: 96, lineHeight: 1 }}>{emoji}</div>
      <div>
        <div style={{ display: "inline-block", background: "#FF7A1A", color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: "0.06em", padding: "4px 14px", borderRadius: 10 }}>{label}</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: "#111", letterSpacing: "-0.04em", lineHeight: 1 }}>{big}</div>
      </div>
    </div>
  );
};

const at = (text: string, seg: number) => {
  const w = OUT.find((o) => o.text === text && o.seg === seg);
  return w ? Math.round(w.os * FPS) : 0;
};

export const Podcast: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cuts = segStart.map((s) => Math.round(s * FPS));
  const endMain = PODCAST_FRAMES;
  // Tarjetas: las 4 "vidas"
  const fighter = at("professional", 3);
  const webcam = at("webcam", 3);
  const broke = at("broke,", 3);
  const rich = at("rich.", 3);
  const brokeT = at("broke,", 0);
  const richT = at("rich.", 0);
  const flash = cuts.slice(1).reduce((m, c) => Math.max(m, interpolate(f - c, [0, 1, 5], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  const shake = [rich, richT].reduce((m, c) => m + interpolate(f - c, [0, 2, 4, 6, 8], [0, 14, -10, 6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
        {SEGS.map((_, k) => (
          <Sequence key={k} from={cuts[k]} durationInFrames={Math.round((SEGS[k][1] - SEGS[k][0]) * FPS)}>
            <SegmentClip k={k} />
          </Sequence>
        ))}
      </AbsoluteFill>
      {/* Degradado para legibilidad de subtítulos */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.2) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />

      {/* Gancho: sello superior durante la apertura */}
      {f < cuts[1] + 6 ? (
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", transform: `scale(${spring({ frame: f, fps, config: { damping: 10 } })})`, opacity: interpolate(f, [cuts[1], cuts[1] + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <span style={{ display: "inline-block", background: "#F5EEE3", color: "#111", fontFamily: SANS, fontWeight: 800, fontSize: 64, padding: "14px 30px", borderRadius: 24, transform: "rotate(-3deg)", boxShadow: "0 30px 60px rgba(0,0,0,0.45)" }}>
            HE&apos;S LIVED <span style={{ color: "#FF7A1A" }}>4 LIVES</span>
          </span>
        </div>
      ) : null}
      <Card f={f} fps={fps} at={brokeT} until={richT - 2} label="LIFE 03" big="BROKE" emoji="📉" x={540} y={950} rot={-6} />
      <Card f={f} fps={fps} at={richT} until={cuts[1] - 2} label="LIFE 04" big="RICH" emoji="💰" x={540} y={950} rot={5} />
      <Card f={f} fps={fps} at={fighter} until={webcam - 2} label="LIFE 01" big="FIGHTER" emoji="🥊" x={540} y={950} rot={-5} />
      <Card f={f} fps={fps} at={webcam} until={broke - 2} label="LIFE 02" big="WEBCAM BIZ" emoji="💻" x={540} y={950} rot={4} />
      <Card f={f} fps={fps} at={broke} until={rich - 2} label="LIFE 03" big="BROKE" emoji="📉" x={540} y={950} rot={-4} />
      <Card f={f} fps={fps} at={rich} until={rich + 50} label="LIFE 04" big="RICH" emoji="💰" x={540} y={950} rot={5} />

      <Captions t={t} f={f} fps={fps} />

      {/* Pregunta final para comentarios */}
      {f >= endMain - 75 ? (
        <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", transform: `scale(${spring({ frame: f - (endMain - 75), fps, config: { damping: 11 } })})` }}>
          <span style={{ display: "inline-block", background: "#111", color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 56, padding: "16px 30px", borderRadius: 22, boxShadow: "0 30px 60px rgba(0,0,0,0.45)" }}>
            WHICH LIFE WOULD YOU <span style={{ color: "#FFD23F" }}>PICK?</span> 👇
          </span>
        </div>
      ) : null}

      {/* Audio: voz de cada tramo + sonidos */}
      {SEGS.map((s, k) => (
        <Sequence key={`a${k}`} from={cuts[k]} durationInFrames={Math.round((s[1] - s[0]) * FPS)}>
          <Audio src={staticFile("portfolio/podcast_raw.mp4")} trimBefore={Math.round(s[0] * FPS)} trimAfter={Math.round(s[1] * FPS)} />
        </Sequence>
      ))}
      {cuts.slice(1).map((c) => (
        <Sequence key={`w${c}`} from={c - 3} durationInFrames={14}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
        </Sequence>
      ))}
      {[brokeT, richT, fighter, webcam, broke, rich].map((c, k) => (
        <Sequence key={`p${k}`} from={c} durationInFrames={12}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.45} />
        </Sequence>
      ))}
      {[richT, rich].map((c) => (
        <Sequence key={`h${c}`} from={c} durationInFrames={20}>
          <Audio src={staticFile("sfx/hit.wav")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={40}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};

const SegmentClip: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  return <Clip k={k} f={f} />;
};
