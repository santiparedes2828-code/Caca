import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Reel «Tu podcast de una hora se está muriendo en TikTok» (14-10-2026). Estilo del motion graphic de Leonardo
// (negro, blanco que brilla, grano), con más vida a pedido del usuario: cada palabra clave entra con un golpe de zoom
// y una sacudida, destello blanco en cada corte, cámara que nunca se queda quieta, partículas y gráficos que se
// mueven todo el tiempo. Voz de marca; los tiempos salen de la transcripción. Todo en Inter (regla de la casa).

loadInter();

const F = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CUTS = [0, 3.3, 5.8, 10.5, 15.6, 19.1, 22.6];
// Golpes: palabras clave (segundos absolutos) que sacuden la cámara y suenan
const HITS = [0.3, 1.8, 3.3, 4.3, 6.9, 9.4, 10.5, 11.8, 13.0, 14.1, 15.6, 16.6, 17.8, 19.7];
export const podcastMuereDuration = F(CUTS[CUTS.length - 1]);

const useAt = (s: number, cfg = { damping: 12, stiffness: 220, mass: 0.6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - F(s), fps, config: cfg });
};

const glow = (size: number) => `0 0 ${size * 0.12}px rgba(255,255,255,0.9), 0 0 ${size * 0.35}px rgba(255,255,255,0.4)`;

// Palabra que entra de golpe: desde grande y desenfocada a su tamaño, con un pequeño rebote
const Slam: React.FC<{ text: string; at: number; size: number; top: number; italic?: boolean; dim?: boolean }> = ({ text, at, size, top, italic = true, dim }) => {
  const s = useAt(at);
  const frame = useCurrentFrame();
  if (frame < F(at) - 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 30,
        right: 30,
        top,
        textAlign: "center",
        fontFamily: INTER,
        fontWeight: dim ? 600 : 800,
        fontStyle: italic && !dim ? "italic" : "normal",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: dim ? "0em" : "-0.045em",
        color: dim ? "rgba(255,255,255,0.85)" : "#fff",
        opacity: Math.min(1, s * 1.6),
        transform: `scale(${dim ? 1 + (1 - s) * 0.2 : 1.9 - 0.9 * s})`,
        filter: `blur(${(1 - Math.min(1, s)) * (dim ? 6 : 18)}px)`,
        textShadow: dim ? "0 0 14px rgba(255,255,255,0.4)" : glow(size),
      }}
    >
      {text}
    </div>
  );
};

const Halo: React.FC<{ y?: number }> = ({ y = 45 }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: `radial-gradient(65% 42% at ${50 + Math.sin(frame / 40) * 8}% ${y}%, #3d3d3d 0%, #141414 55%, #000 100%)` }} />;
};

// Polvo de luz que sube
const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 34 }, (_, i) => {
        const x = random(`dx${i}`) * 1080 + Math.sin((frame + i * 20) / 30) * 20;
        const y = (1920 + 200 - ((frame * (1.5 + random(`dv${i}`) * 3) + random(`dy${i}`) * 2100) % 2100)) - 100;
        const r = 2 + random(`dr${i}`) * 4;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: r, background: "#fff", boxShadow: "0 0 8px #fff", opacity: 0.25 + random(`do${i}`) * 0.5 }} />;
      })}
    </>
  );
};

// Micrófono de podcast en línea blanca con brillo
const Mic: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <svg width={260 * scale} height={420 * scale} viewBox="0 0 260 420" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 0 12px #fff) drop-shadow(0 0 30px rgba(255,255,255,0.5))" }}>
    <rect x={70} y={10} width={120} height={200} rx={60} fill="#fff" />
    {[50, 85, 120, 155].map((yy) => (
      <line key={yy} x1={80} x2={180} y1={yy} y2={yy} stroke="#111" strokeWidth={6} />
    ))}
    <path d="M40 140 Q40 270 130 270 Q220 270 220 140" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" />
    <line x1={130} y1={270} x2={130} y2={360} stroke="#fff" strokeWidth={14} />
    <line x1={70} y1={370} x2={190} y2={370} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
  </svg>
);

// Línea de pulso que se aplana
const Pulse: React.FC<{ flatAt: number }> = ({ flatAt }) => {
  const frame = useCurrentFrame();
  const flat = interpolate(frame, [F(flatAt), F(flatAt) + 12], [1, 0], clamp);
  const pts = Array.from({ length: 120 }, (_, i) => {
    const x = i * 9.5;
    const ph = (i * 3 - frame * 9) % 60;
    const beat = ph > 20 && ph < 30 ? (ph < 25 ? -(ph - 20) * 28 : -(30 - ph) * 28) + (ph > 24 && ph < 27 ? 160 : 0) : 0;
    return `${x},${100 + beat * flat}`;
  }).join(" ");
  return (
    <svg width={1080} height={300} viewBox="0 -100 1140 300" style={{ position: "absolute", left: 0, top: 1110, filter: "drop-shadow(0 0 10px #fff)" }}>
      <polyline points={pts} fill="none" stroke="#fff" strokeWidth={7} strokeLinejoin="round" />
    </svg>
  );
};

// Onda larga de un episodio con un tramo resaltado
const LongWave: React.FC<{ highlightAt: number }> = ({ highlightAt }) => {
  const frame = useCurrentFrame();
  const h = useAt(highlightAt, { damping: 14, stiffness: 120, mass: 0.8 });
  const n = 90;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 860, height: 260, display: "flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: n }, (_, i) => {
        const inside = i >= 52 && i < 64;
        const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + frame / 5) * Math.cos(i * 0.6 - frame / 9));
        return <div key={i} style={{ flex: 1, height: 240 * v, borderRadius: 4, background: "#fff", opacity: inside ? 1 : 1 - 0.75 * h, boxShadow: inside ? `0 0 ${14 * h}px #fff` : "none" }} />;
      })}
      <div style={{ position: "absolute", left: `${(52 / n) * 100}%`, width: `${(12 / n) * 100}%`, top: -30, bottom: -30, border: "6px solid #fff", borderRadius: 18, opacity: h, transform: `scale(${1.6 - 0.6 * h})`, boxShadow: "0 0 30px #fff" }} />
    </div>
  );
};

const Phone: React.FC<{ i: number; at: number }> = ({ i, at }) => {
  const s = useAt(at + i * 0.07, { damping: 13, stiffness: 160, mass: 0.7 });
  const frame = useCurrentFrame();
  const ang = (i - 2.5) * 13 * s;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 85,
        top: 760,
        width: 170,
        height: 300,
        borderRadius: 26,
        border: "6px solid #fff",
        background: "rgba(255,255,255,0.08)",
        boxShadow: "0 0 24px rgba(255,255,255,0.6)",
        transformOrigin: "50% 160%",
        transform: `rotate(${ang}deg) translateY(${Math.sin((frame + i * 10) / 8) * 6}px)`,
        opacity: s,
      }}
    >
      <div style={{ margin: "120px auto 0", width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #fff" }} />
    </div>
  );
};

// ——— Escenas ———
const A: React.FC = () => (
  <AbsoluteFill>
    <Halo y={38} />
    <Mic x={410} y={430} />
    <Pulse flatAt={1.8} />
    <Slam text="tu podcast de" at={0} size={60} top={170} dim />
    <Slam text="1 HORA" at={0.9} size={190} top={250} />
    <Slam text="se está" at={1.5} size={60} top={1400} dim />
    <Slam text="MURIENDO" at={1.8} size={170} top={1480} />
    <Slam text="en TikTok" at={2.4} size={70} top={1680} dim />
  </AbsoluteFill>
);

const B: React.FC = () => {
  const frame = useCurrentFrame();
  const secs = Math.max(0, 3600 - frame * 53);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <AbsoluteFill>
      <Halo />
      <Slam text="NADIE" at={0} size={230} top={300} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 240, color: "#fff", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", textShadow: glow(240) }}>
        {mm}:{ss}
      </div>
      <Slam text="va a mirar" at={0.5} size={64} top={1150} dim />
      <Slam text="60 MINUTOS" at={1.0} size={150} top={1240} />
    </AbsoluteFill>
  );
};

const C: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [F(1.1), F(1.6)], [1, 1.35], { ...clamp });
  return (
    <AbsoluteFill>
      <Halo />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "62% 52%" }}>
        <LongWave highlightAt={1.1} />
      </AbsoluteFill>
      <Slam text="pero adentro hay" at={0} size={64} top={330} dim />
      <Slam text="FRASES" at={1.1} size={220} top={420} />
      <Slam text="que la gente sí" at={2.6} size={64} top={1330} dim />
      <Slam text="COMPARTIRÍA" at={3.6} size={150} top={1420} />
    </AbsoluteFill>
  );
};

const Step: React.FC<{ at: number; end: number; small: string; big: string; children?: React.ReactNode }> = ({ at, end, small, big, children }) => {
  const frame = useCurrentFrame();
  if (frame < F(at) - 1 || frame >= F(end)) return null;
  return (
    <AbsoluteFill>
      {small ? <Slam text={small} at={at} size={70} top={520} dim /> : null}
      <Slam text={big} at={at + 0.05} size={Math.min(180, 1450 / big.length)} top={610} />
      {children}
    </AbsoluteFill>
  );
};

const D: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = interpolate(frame, [F(3.7), F(4.1)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Halo />
      <Step at={0} end={1.3} small="encontrá la" big="FRASE">
        <svg width={360} height={360} viewBox="0 0 100 100" style={{ position: "absolute", left: 360, top: 1000, transform: `rotate(${Math.sin(frame / 5) * 12}deg)`, filter: "drop-shadow(0 0 12px #fff)" }}>
          <circle cx={42} cy={42} r={26} fill="none" stroke="#fff" strokeWidth={8} />
          <line x1={61} y1={61} x2={88} y2={88} stroke="#fff" strokeWidth={10} strokeLinecap="round" />
        </svg>
      </Step>
      <Step at={1.3} end={2.5} small="ponela" big="PRIMERO">
        <div style={{ position: "absolute", left: 140, right: 140, top: 1060, display: "flex", gap: 20 }}>
          {[0, 1, 2, 3].map((i) => {
            const first = i === 0;
            const x = first ? 0 : interpolate(frame, [F(1.4), F(1.8)], [0, 0], clamp);
            return <div key={i} style={{ flex: first ? 2 : 1, height: 140, borderRadius: 18, background: first ? "#fff" : "rgba(255,255,255,0.25)", boxShadow: first ? "0 0 30px #fff" : "none", transform: `translateX(${x}px) scale(${first ? 1 + 0.06 * Math.sin(frame / 3) : 1})` }} />;
          })}
        </div>
      </Step>
      <Step at={2.5} end={3.6} small="" big="SUBTÍTULOS">
        <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", gap: 18, fontFamily: INTER, fontWeight: 800, fontSize: 64 }}>
          {["que", "se", "MUEVEN"].map((w, i) => {
            const s = spring({ frame: frame - F(2.6) - i * 4, fps: 30, config: { damping: 10, stiffness: 220 } });
            return (
              <span key={w} style={{ color: i === 2 ? "#000" : "#fff", background: i === 2 ? "#fff" : "transparent", padding: "4px 14px", borderRadius: 10, transform: `scale(${s})`, display: "inline-block" }}>
                {w}
              </span>
            );
          })}
        </div>
      </Step>
      <Step at={3.6} end={5.2} small="cortá los" big="SILENCIOS">
        <div style={{ position: "absolute", left: 120, right: 120, top: 1080, height: 160, display: "flex", alignItems: "center", gap: 6 }}>
          {Array.from({ length: 40 }, (_, i) => {
            const silent = i >= 15 && i < 25;
            const v = silent ? 0.06 : 0.3 + 0.7 * Math.abs(Math.sin(i * 1.3 + frame / 4));
            return <div key={i} style={{ flex: silent ? 1 - cut : 1, height: 160 * v, background: "#fff", borderRadius: 3, opacity: silent ? 1 - cut : 1 }} />;
          })}
        </div>
      </Step>
    </AbsoluteFill>
  );
};

const E: React.FC = () => {
  const frame = useCurrentFrame();
  const cal = useAt(2.2, { damping: 14, stiffness: 160, mass: 0.7 });
  return (
    <AbsoluteFill>
      <Halo />
      <Slam text="1 EPISODIO" at={0} size={150} top={300} />
      {frame >= F(1.0) ? [0, 1, 2, 3, 4, 5].map((i) => <Phone key={i} i={i} at={1.0} />) : null}
      <Slam text="6 CLIPS" at={1.0} size={170} top={1180} />
      <div style={{ position: "absolute", left: 300, top: 1420, display: "grid", gridTemplateColumns: "repeat(7, 58px)", gap: 10, opacity: cal, transform: `scale(${0.7 + 0.3 * cal})` }}>
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} style={{ height: 40, borderRadius: 8, background: [2, 6, 11, 15, 20, 25].includes(i) ? "#fff" : "rgba(255,255,255,0.18)", boxShadow: [2, 6, 11, 15, 20, 25].includes(i) ? "0 0 14px #fff" : "none" }} />
        ))}
      </div>
      <Slam text="1 mes de publicaciones" at={2.2} size={70} top={1720} dim />
    </AbsoluteFill>
  );
};

const G: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = "CLIP".slice(0, Math.max(0, Math.floor((frame - F(0.6)) / 3)));
  const box = useAt(0.1, { damping: 14, stiffness: 170, mass: 0.7 });
  return (
    <AbsoluteFill>
      <Halo y={50} />
      <Slam text="COMENTÁ" at={0} size={150} top={420} />
      <div style={{ position: "absolute", left: 140, right: 140, top: 760, padding: "40px 50px", borderRadius: 44, border: "6px solid #fff", boxShadow: "0 0 40px rgba(255,255,255,0.6)", fontFamily: INTER, fontWeight: 800, fontSize: 170, color: "#fff", textAlign: "center", opacity: box, transform: `scale(${0.6 + 0.4 * box}) rotate(${Math.sin(frame / 10) * 1.5}deg)`, textShadow: glow(170) }}>
        {typed}
        <span style={{ opacity: Math.floor(frame / 8) % 2 }}>|</span>
      </div>
      <Slam text="y te edito uno" at={1.1} size={70} top={1160} dim />
      <Slam text="GRATIS" at={2.0} size={190} top={1250} />
    </AbsoluteFill>
  );
};

const SCENES = [A, B, C, D, E, G];

export const PodcastMuere: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  // Sacudida y golpe de zoom en cada palabra clave; deriva continua de la cámara
  const hit = HITS.reduce((m, h) => {
    const d = t - h;
    return d >= 0 && d < 0.35 ? Math.max(m, 1 - d / 0.35) : m;
  }, 0);
  const shakeX = (random(`sx${frame}`) - 0.5) * 28 * hit;
  const shakeY = (random(`sy${frame}`) - 0.5) * 28 * hit;
  const drift = 1.03 + Math.sin(frame / 25) * 0.015;
  const rot = Math.sin(frame / 33) * 0.8;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${drift + 0.06 * hit}) rotate(${rot}deg)` }}>
        {SCENES.map((Sc, i) => {
          const from = F(CUTS[i]);
          const dur = F(CUTS[i + 1]) - from;
          const tin = interpolate(frame - from, [0, 6], [1, 0], clamp);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill style={{ transform: `scale(${1 + 0.25 * tin}) rotate(${tin * (i % 2 ? 4 : -4)}deg)`, filter: `blur(${18 * tin}px)` }}>
                <Sc />
              </AbsoluteFill>
              {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} /> : null}
            </Sequence>
          );
        })}
        <Dust />
      </AbsoluteFill>
      {/* destello blanco en cada corte */}
      {CUTS.slice(1, -1).map((c) => {
        const o = interpolate(frame, [F(c) - 1, F(c), F(c) + 4], [0, 0.85, 0], clamp);
        return o > 0 ? <AbsoluteFill key={c} style={{ background: "#fff", opacity: o }} /> : null;
      })}
      {HITS.map((h) => (
        <Sequence key={h} from={F(h)} durationInFrames={15} layout="none">
          <Audio src={staticFile("sfx/hit.wav")} volume={0.22} />
        </Sequence>
      ))}
      <AbsoluteFill
        style={{
          opacity: 0.1,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.5px)",
          backgroundSize: "5px 5px",
          backgroundPosition: `${(frame * 7) % 5}px ${(frame * 3) % 5}px`,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(85% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
      <Audio src={staticFile("podcastmuere/voz.wav")} />
      <Audio src={staticFile("podcastmuere/musica.wav")} volume={(f) => 0.28 * interpolate(f, [podcastMuereDuration - 20, podcastMuereDuration], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
