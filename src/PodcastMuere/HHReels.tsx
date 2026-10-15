import React from "react";
import { AbsoluteFill, Audio, interpolate, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { INTER } from "../design/inter";
import { clamp, Dust, F, glow, Halo, LongWave, Phone, Slam, useAt } from "./PodcastMuere";

// Dos reels de Hook House (15-10-2026) con el estilo de «Tu podcast se está muriendo» (negro, blanco que brilla,
// golpes de zoom y sacudidas por palabra, destellos en cada corte):
//   v07 «Así es como un episodio se convierte en 6 clips» (cómo funciona Hook House)
//   v08 «3 cosas que tiene todo clip de podcast que se comparte»
// Cada escena es una lista de rótulos (tiempos relativos a la escena, sacados de la transcripción de la voz) y un
// gráfico opcional. Todo en Inter; el logotipo «hookhouse.» en verde porque es contenido de la propia marca.

type Txt = { text: string; at: number; size: number; top: number; dim?: boolean };
type Scene = { start: number; texts: Txt[]; graphic?: React.FC };
type Reel = { voice: string; end: number; hits: number[]; scenes: Scene[] };

const until = (from: number, to: number, el: React.ReactNode) => {
  const Comp: React.FC = () => {
    const frame = useCurrentFrame();
    return frame >= F(from) - 1 && frame < F(to) ? <>{el}</> : null;
  };
  return <Comp />;
};

const Phones: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return frame >= F(at) ? <>{[0, 1, 2, 3, 4, 5].map((i) => <Phone key={i} i={i} at={at} />)}</> : null;
};

const LinkIcon: React.FC<{ at: number }> = ({ at }) => {
  const s = useAt(at);
  const frame = useCurrentFrame();
  return (
    <svg width={420} height={420} viewBox="0 0 100 100" style={{ position: "absolute", left: 330, top: 820, opacity: s, transform: `scale(${s}) rotate(${-45 + Math.sin(frame / 8) * 8}deg)`, filter: "drop-shadow(0 0 14px #fff)" }}>
      <rect x={8} y={36} width={48} height={28} rx={14} fill="none" stroke="#fff" strokeWidth={7} />
      <rect x={44} y={36} width={48} height={28} rx={14} fill="none" stroke="#fff" strokeWidth={7} />
    </svg>
  );
};

const Clock: React.FC<{ at: number }> = ({ at }) => {
  const s = useAt(at);
  const frame = useCurrentFrame();
  const a = frame * 14;
  return (
    <svg width={360} height={360} viewBox="0 0 100 100" style={{ position: "absolute", left: 360, top: 800, opacity: s, transform: `scale(${s})`, filter: "drop-shadow(0 0 14px #fff)" }}>
      <circle cx={50} cy={50} r={44} fill="none" stroke="#fff" strokeWidth={6} />
      <line x1={50} y1={50} x2={50 + 30 * Math.sin((a * Math.PI) / 180)} y2={50 - 30 * Math.cos((a * Math.PI) / 180)} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      <line x1={50} y1={50} x2={50 + 20 * Math.sin((a * Math.PI) / 2160)} y2={50 - 20 * Math.cos((a * Math.PI) / 2160)} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    </svg>
  );
};

const Check: React.FC<{ at: number; top: number }> = ({ at, top }) => {
  const frame = useCurrentFrame();
  const d = interpolate(frame, [F(at), F(at) + 10], [1, 0], clamp);
  return (
    <svg width={200} height={200} viewBox="0 0 100 100" style={{ position: "absolute", left: 440, top, filter: "drop-shadow(0 0 14px #fff)" }}>
      <path d="M18 52 L42 76 L84 26" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={120} strokeDashoffset={120 * d} />
    </svg>
  );
};

const Numbers: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", gap: 50 }}>
      {[1, 2, 3].map((n, i) => {
        const s = spring({ frame: frame - 4 - i * 6, fps: 30, config: { damping: 10, stiffness: 200 } });
        return (
          <div key={n} style={{ width: 200, height: 200, borderRadius: 200, border: "8px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: 120, color: "#fff", transform: `scale(${s}) translateY(${Math.sin((frame + i * 12) / 9) * 10}px)`, boxShadow: "0 0 30px rgba(255,255,255,0.6)", textShadow: glow(120) }}>
            {n}
          </div>
        );
      })}
    </div>
  );
};

const BigNum: React.FC<{ n: string }> = ({ n }) => {
  const s = useAt(0);
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: n.length > 2 ? 200 : 300, color: "rgba(255,255,255,0.13)", transform: `scale(${1.5 - 0.5 * s}) translateY(${Math.sin(frame / 12) * 8}px)`, letterSpacing: "-0.05em" }}>{n}</div>
  );
};

const Strike: React.FC<{ at: number; top: number; w: number }> = ({ at, top, w }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F(at), F(at) + 8], [0, 1], clamp);
  return <div style={{ position: "absolute", left: (1080 - w) / 2, top, width: w * p, height: 14, background: "#fff", boxShadow: "0 0 18px #fff", transform: "rotate(-4deg)" }} />;
};

const Muted: React.FC<{ at: number }> = ({ at }) => {
  const s = useAt(at);
  return (
    <svg width={260} height={260} viewBox="0 0 100 100" style={{ position: "absolute", left: 410, top: 1500, opacity: s, transform: `scale(${s})`, filter: "drop-shadow(0 0 12px #fff)" }}>
      <path d="M14 38 L32 38 L54 18 L54 82 L32 62 L14 62 Z" fill="#fff" />
      <line x1={66} y1={36} x2={90} y2={64} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
      <line x1={90} y1={36} x2={66} y2={64} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
};

const Words: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center", gap: 18, fontFamily: INTER, fontWeight: 800, fontSize: 70 }}>
      {["que", "se", "MUEVEN"].map((w, i) => {
        const s = spring({ frame: frame - F(at) - i * 4, fps: 30, config: { damping: 10, stiffness: 220 } });
        return (
          <span key={w} style={{ color: i === 2 ? "#000" : "#fff", background: i === 2 ? "#fff" : "transparent", padding: "4px 14px", borderRadius: 10, transform: `scale(${s})`, display: "inline-block" }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

const CutWave: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const cut = interpolate(frame, [F(at), F(at) + 12], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 1000, height: 180, display: "flex", alignItems: "center", gap: 6 }}>
      {Array.from({ length: 40 }, (_, i) => {
        const silent = (i >= 10 && i < 16) || (i >= 26 && i < 31);
        const v = silent ? 0.06 : 0.3 + 0.7 * Math.abs(Math.sin(i * 1.3 + frame / 4));
        return <div key={i} style={{ flex: silent ? 1 - cut : 1, height: 180 * v, background: "#fff", borderRadius: 3, opacity: silent ? 1 - cut : 1 }} />;
      })}
    </div>
  );
};

const Comment: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const typed = "CLIP".slice(0, Math.max(0, Math.floor((frame - F(at)) / 3)));
  const box = useAt(at - 0.5, { damping: 14, stiffness: 170, mass: 0.7 });
  return (
    <div style={{ position: "absolute", left: 140, right: 140, top: 760, padding: "40px 50px", borderRadius: 44, border: "6px solid #fff", boxShadow: "0 0 40px rgba(255,255,255,0.6)", fontFamily: INTER, fontWeight: 800, fontSize: 170, color: "#fff", textAlign: "center", opacity: box, transform: `scale(${0.6 + 0.4 * box}) rotate(${Math.sin(frame / 10) * 1.5}deg)`, textShadow: glow(170) }}>
      {typed}
      <span style={{ opacity: Math.floor(frame / 8) % 2 }}>|</span>
    </div>
  );
};

const Logo: React.FC<{ at: number }> = ({ at }) => {
  const s = useAt(at);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 150, letterSpacing: "-0.05em", color: "#fff", opacity: s, transform: `scale(${1.6 - 0.6 * s})`, filter: `blur(${(1 - s) * 16}px)`, textShadow: "0 0 30px rgba(18,161,80,0.8)" }}>
      hookhouse<span style={{ color: "#12A150" }}>.</span>
    </div>
  );
};

// Escena de llamada a la acción común (tiempos relativos a «Comentá»)
const cta = (start: number, clip: number, gratis: number): Scene => ({
  start,
  texts: [
    { text: "COMENTÁ", at: 0, size: 150, top: 420 },
    { text: "y te edito uno", at: clip - start + 0.6, size: 70, top: 1160, dim: true },
    { text: "GRATIS", at: gratis - start, size: 190, top: 1250 },
  ],
  graphic: () => <Comment at={clip - start} />,
});

export const REELS: Record<"v07" | "v08", Reel> = {
  v07: {
    voice: "hhreels/v1.wav",
    end: 23.6,
    hits: [0.9, 3.0, 5.3, 6.5, 7.8, 9.5, 10.9, 12.8, 13.4, 14.6, 16.0, 17.5, 20.9],
    scenes: [
      {
        start: 0,
        texts: [
          { text: "así es como", at: 0, size: 64, top: 200, dim: true },
          { text: "1 EPISODIO", at: 0.8, size: 160, top: 280 },
          { text: "6 CLIPS", at: 3.0, size: 170, top: 1160 },
          { text: "sin que edites", at: 4.1, size: 64, top: 1400, dim: true },
          { text: "NADA", at: 5.2, size: 190, top: 1490 },
        ],
        graphic: () => <Phones at={2.9} />,
      },
      {
        start: 6.0,
        texts: [
          { text: "me mandás el", at: 1.0, size: 70, top: 470, dim: true },
          { text: "LINK", at: 1.8, size: 230, top: 560 },
          { text: "del episodio", at: 2.2, size: 64, top: 1320, dim: true },
        ],
        graphic: () => (
          <>
            <BigNum n="PASO 1" />
            <LinkIcon at={1.8} />
          </>
        ),
      },
      {
        start: 9.1,
        texts: [
          { text: "encuentro las", at: 1.0, size: 64, top: 470, dim: true },
          { text: "FRASES", at: 1.8, size: 210, top: 550 },
          { text: "QUE ENGANCHAN", at: 2.3, size: 110, top: 1300 },
        ],
        graphic: () => (
          <>
            <BigNum n="PASO 2" />
            <LongWave highlightAt={1.8} />
          </>
        ),
      },
      {
        start: 12.4,
        texts: [],
        graphic: () => (
          <>
            <BigNum n="PASO 3" />
            {until(1.0, 2.2, <Slam text="GANCHO PRIMERO" at={1.0} size={115} top={700} />)}
            {until(2.2, 3.6, <Slam text="SUBTÍTULOS" at={2.2} size={140} top={600} />)}
            {until(2.2, 3.6, <Words at={2.5} />)}
            {until(3.6, 5, <Slam text="CERO SILENCIOS" at={3.6} size={115} top={700} />)}
            {until(3.6, 5, <CutWave at={3.9} />)}
          </>
        ),
      },
      {
        start: 17.3,
        texts: [
          { text: "en", at: 0, size: 70, top: 380, dim: true },
          { text: "48 HORAS", at: 0.2, size: 190, top: 460 },
          { text: "listos para subir", at: 1.3, size: 80, top: 1300, dim: true },
        ],
        graphic: () => (
          <>
            <Clock at={0.2} />
            <Check at={1.7} top={1440} />
          </>
        ),
      },
      cta(20.2, 20.9, 22.4),
    ],
  },
  v08: {
    voice: "hhreels/v2.wav",
    end: 24.0,
    hits: [0, 2.8, 3.8, 5.4, 7.5, 9.2, 9.9, 13.0, 13.8, 14.6, 17.2, 19.6, 21.2],
    scenes: [
      {
        start: 0,
        texts: [
          { text: "3 COSAS", at: 0, size: 200, top: 260 },
          { text: "que tiene todo clip de podcast", at: 0.9, size: 58, top: 1220, dim: true },
          { text: "QUE SE COMPARTE", at: 2.6, size: 110, top: 1310 },
        ],
        graphic: () => <Numbers />,
      },
      {
        start: 3.8,
        texts: [
          { text: "arranca con la", at: 0.7, size: 64, top: 460, dim: true },
          { text: "FRASE MÁS FUERTE", at: 1.6, size: 105, top: 550 },
          { text: "no con", at: 3.0, size: 64, top: 1050, dim: true },
          { text: "«hola, bienvenidos»", at: 3.7, size: 84, top: 1140 },
        ],
        graphic: () => (
          <>
            <BigNum n="1" />
            <Strike at={4.4} top={1175} w={820} />
          </>
        ),
      },
      {
        start: 9.2,
        texts: [
          { text: "SUBTÍTULOS", at: 0.7, size: 140, top: 560 },
          { text: "para que se entienda", at: 2.5, size: 64, top: 1300, dim: true },
          { text: "SIN SONIDO", at: 3.6, size: 130, top: 1380 },
        ],
        graphic: () => (
          <>
            <BigNum n="2" />
            <Words at={1.6} />
            <Muted at={3.8} />
          </>
        ),
      },
      {
        start: 13.8,
        texts: [
          { text: "nada de", at: 0.8, size: 64, top: 520, dim: true },
          { text: "SILENCIOS", at: 1.4, size: 160, top: 600 },
          { text: "ni muletillas", at: 2.0, size: 80, top: 1300, dim: true },
        ],
        graphic: () => (
          <>
            <BigNum n="3" />
            <CutWave at={1.6} />
          </>
        ),
      },
      {
        start: 17.0,
        texts: [
          { text: "en", at: 0, size: 64, top: 540, dim: true },
          { text: "hacemos esas 3 cosas", at: 1.2, size: 70, top: 1000, dim: true },
          { text: "EN CADA CLIP", at: 2.6, size: 130, top: 1090 },
        ],
        graphic: () => <Logo at={0.2} />,
      },
      cta(20.6, 21.2, 22.7),
    ],
  },
};

export const reelDuration = (id: "v07" | "v08") => F(REELS[id].end);

export const HHReel: React.FC<{ id: "v07" | "v08" }> = ({ id }) => {
  const reel = REELS[id];
  const frame = useCurrentFrame();
  const t = frame / 30;
  const total = F(reel.end);
  const hit = reel.hits.reduce((m, h) => {
    const d = t - h;
    return d >= 0 && d < 0.35 ? Math.max(m, 1 - d / 0.35) : m;
  }, 0);
  const shakeX = (random(`sx${frame}`) - 0.5) * 28 * hit;
  const shakeY = (random(`sy${frame}`) - 0.5) * 28 * hit;
  const drift = 1.03 + Math.sin(frame / 25) * 0.015;
  const rot = Math.sin(frame / 33) * 0.8;
  const starts = reel.scenes.map((s) => s.start);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${drift + 0.06 * hit}) rotate(${rot}deg)` }}>
        {reel.scenes.map((sc, i) => {
          const from = F(sc.start);
          const dur = F(reel.scenes[i + 1]?.start ?? reel.end) - from;
          const tin = interpolate(frame - from, [0, 6], [1, 0], clamp);
          const G = sc.graphic;
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill style={{ transform: `scale(${1 + 0.25 * tin}) rotate(${tin * (i % 2 ? 4 : -4)}deg)`, filter: `blur(${18 * tin}px)` }}>
                <Halo y={i % 2 ? 50 : 40} />
                {G ? <G /> : null}
                {sc.texts.map((x) => (
                  <Slam key={x.text} {...x} />
                ))}
              </AbsoluteFill>
              {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} /> : null}
            </Sequence>
          );
        })}
        <Dust />
      </AbsoluteFill>
      {starts.slice(1).map((c) => {
        const o = interpolate(frame, [F(c) - 1, F(c), F(c) + 4], [0, 0.85, 0], clamp);
        return o > 0 ? <AbsoluteFill key={c} style={{ background: "#fff", opacity: o }} /> : null;
      })}
      {reel.hits.map((h) => (
        <Sequence key={h} from={F(h)} durationInFrames={15} layout="none">
          <Audio src={staticFile("sfx/hit.wav")} volume={0.22} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ opacity: 0.1, backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.5px)", backgroundSize: "5px 5px", backgroundPosition: `${(frame * 7) % 5}px ${(frame * 3) % 5}px`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(85% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
      <Audio src={staticFile(reel.voice)} />
      <Audio src={staticFile("hhreels/musica.wav")} volume={(f) => 0.28 * interpolate(f, [total - 20, total], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
