import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Motion graphic 16:9 sobre Claude (17-10-2026). Idea: el propio vídeo es la prueba («Este video no lo editó una
// persona»): todo lo que se ve es código de Remotion escrito por Claude. Paleta neutra cálida (negro cálido, hueso,
// ámbar), sin logotipos de terceros. Todo en Inter (regla de la casa). Voz de marca; tiempos de su transcripción.

loadInter();

const F = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const BG = "#131211";
const FG = "#F5F2EA";
const AMBER = "#E8A04C";
const MUTED = "#6E6A62";
const END = 28.2;
export const claudeMGDuration = F(END);
const CUTS = [0, 2.1, 8.4, 12.0, 17.2, 22.8, END];

const useP = (at: number, dur = 14) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [F(at), F(at) + dur], [0, 1], { ...clamp, easing: ease });
};
const useS = (at: number, cfg = { damping: 14, stiffness: 160, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - F(at), fps: 30, config: cfg });
};

// Texto que sube tras una máscara
const Reveal: React.FC<{ text: string; at: number; size: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({ text, at, size, color = FG, weight = 800, style }) => {
  const p = useP(at);
  return (
    <div style={{ overflow: "hidden", paddingBottom: size * 0.1, ...style }}>
      <div style={{ fontFamily: INTER, fontWeight: weight, fontSize: size, lineHeight: 1.04, letterSpacing: weight >= 800 ? "-0.045em" : "-0.01em", color, transform: `translateY(${(1 - p) * 110}%)`, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

const Cursor: React.FC<{ h: number; color?: string }> = ({ h, color = AMBER }) => {
  const frame = useCurrentFrame();
  return <span style={{ display: "inline-block", width: h * 0.08, height: h * 0.9, background: color, marginLeft: h * 0.06, verticalAlign: "middle", opacity: Math.floor(frame / 15) % 2 ? 0.15 : 1 }} />;
};

const Typed: React.FC<{ text: string; at: number; cps?: number; size: number; color?: string; weight?: number; cursor?: boolean }> = ({ text, at, cps = 22, size, color = FG, weight = 700, cursor }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - F(at)) / 30) * cps));
  return (
    <span style={{ fontFamily: INTER, fontWeight: weight, fontSize: size, color, letterSpacing: "-0.02em", whiteSpace: "pre" }}>
      {text.slice(0, n)}
      {cursor && n < text.length + 8 ? <Cursor h={size} /> : null}
    </span>
  );
};

// ——— Escenas (tiempos relativos al inicio de cada una) ———

// A · «Este video no lo editó una persona.»
const A: React.FC = () => {
  const strike = useP(1.75, 10);
  return (
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 200 }}>
      <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 40, color: MUTED, letterSpacing: "0.2em", marginBottom: 30 }}>
        <Typed text="// nota" at={0} size={40} color={MUTED} weight={500} />
      </div>
      <div>
        <Typed text="Este video no lo editó" at={0.05} cps={34} size={120} weight={800} />
      </div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
        <Typed text="una persona." at={1.35} cps={30} size={120} weight={800} color={AMBER} cursor />
        <div style={{ position: "absolute", left: 0, top: "52%", height: 12, width: 760 * strike, background: FG }} />
      </div>
    </AbsoluteFill>
  );
};

// B · «Lo escribió, lo animó y lo exportó Claude, una inteligencia artificial creada por Anthropic.»
const Verb: React.FC<{ text: string; at: number; i: number; out: number }> = ({ text, at, i, out }) => {
  const s = useS(at);
  const o = useP(out, 10);
  return (
    <div style={{ padding: "26px 44px", borderRadius: 28, border: `2px solid ${MUTED}`, fontFamily: INTER, fontWeight: 700, fontSize: 56, color: FG, opacity: s * (1 - o), transform: `translateY(${(1 - s) * 60 - o * 40}px) rotate(${(i - 1) * 2 * (1 - s)}deg)` }}>{text}</div>
  );
};
const B: React.FC = () => {
  const frame = useCurrentFrame();
  const name = "Claude";
  const ring = useP(2.5, 30);
  const sub = useP(3.4);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 170, display: "flex", gap: 30 }}>
        <Verb text="lo escribió" at={0.2} i={0} out={99} />
        <Verb text="lo animó" at={1.1} i={1} out={99} />
        <Verb text="lo exportó" at={2.1} i={2} out={99} />
      </div>
      {/* anillo de luz que se abre detrás del nombre */}
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: 900, border: `2px solid ${AMBER}`, opacity: 0.5 * ring * (1 - ring * 0.4), transform: `scale(${0.3 + 0.9 * ring}) rotate(${frame * 0.4}deg)`, boxShadow: `0 0 120px ${AMBER}44` }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: 600, background: `radial-gradient(circle, ${AMBER}33 0%, transparent 70%)`, opacity: ring }} />
      <div style={{ display: "flex", fontFamily: INTER, fontWeight: 800, fontSize: 260, letterSpacing: "-0.06em", color: FG }}>
        {name.split("").map((c, i) => {
          const s = spring({ frame: frame - F(2.6) - i * 2, fps: 30, config: { damping: 12, stiffness: 180 } });
          return (
            <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * 80}px)`, filter: `blur(${(1 - s) * 10}px)` }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 770, fontFamily: INTER, fontWeight: 500, fontSize: 46, color: MUTED, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        una inteligencia artificial creada por <span style={{ color: FG, fontWeight: 700 }}>Anthropic</span>
      </div>
    </AbsoluteFill>
  );
};

// C · «Claude lee, escribe, analiza y programa.»
const Glyph: React.FC<{ kind: string; on: number }> = ({ kind, on }) => {
  const frame = useCurrentFrame();
  const p = useP(on, 24);
  if (kind === "lee")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 260 }}>
        {[1, 0.8, 0.95, 0.6].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w * 100}%`, borderRadius: 6, background: MUTED, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, width: `${Math.min(1, Math.max(0, p * 4 - i)) * 100}%`, background: AMBER }} />
          </div>
        ))}
      </div>
    );
  if (kind === "escribe")
    return (
      <svg width={300} height={110} viewBox="0 0 300 110">
        <path d="M5 80 C 40 10, 70 10, 80 60 S 120 110, 150 50 S 200 0, 220 60 S 260 100, 295 40" fill="none" stroke={AMBER} strokeWidth={7} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - p)} />
      </svg>
    );
  if (kind === "analiza")
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 120 }}>
        {[0.4, 0.75, 0.55, 1].map((h, i) => (
          <div key={i} style={{ width: 44, height: 120 * h * Math.min(1, Math.max(0, p * 1.6 - i * 0.2)), borderRadius: 8, background: i === 3 ? AMBER : MUTED }} />
        ))}
      </div>
    );
  return (
    <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 110, color: AMBER, letterSpacing: "-0.04em", transform: `scale(${0.6 + 0.4 * p})`, opacity: p }}>
      {"</>"}
      <span style={{ opacity: Math.floor(frame / 12) % 2 ? 0.2 : 1, color: FG }}>_</span>
    </div>
  );
};
const C: React.FC = () => {
  const items: [string, string, number][] = [
    ["lee", "lee", 0.6],
    ["escribe", "escribe", 1.3],
    ["analiza", "analiza", 2.1],
    ["programa", "programa", 2.8],
  ];
  return (
    <AbsoluteFill style={{ padding: "120px 160px", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 40 }}>
      {items.map(([label, kind, at]) => (
        <Tile key={label} label={label} kind={kind} at={at} />
      ))}
    </AbsoluteFill>
  );
};
const Tile: React.FC<{ label: string; kind: string; at: number }> = ({ label, kind, at }) => {
  const s = useS(at);
  const frame = useCurrentFrame();
  const lit = frame >= F(at);
  return (
    <div style={{ borderRadius: 36, border: `2px solid ${lit ? AMBER : "#2A2825"}`, background: "#1B1A18", padding: "40px 54px", display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: 0.25 + 0.75 * s, transform: `scale(${0.94 + 0.06 * s})`, boxShadow: lit ? `0 0 60px ${AMBER}22` : "none" }}>
      <Glyph kind={kind} on={at} />
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: FG }}>{label}</div>
    </div>
  );
};

// D · «No mueve un mouse: escribe código, y el código se vuelve imagen.»
const CODE = ["<AbsoluteFill>", "  <Circle", "    r={240}", "    stroke=\"#E8A04C\"", "    progress={t}", "  />", "</AbsoluteFill>"];
const D: React.FC = () => {
  const frame = useCurrentFrame();
  const mouse = useS(0);
  const cross = useP(0.6, 10);
  const mouseOut = useP(1.4, 12);
  const panel = useP(1.4, 18);
  const chars = Math.max(0, Math.floor((frame - F(1.7)) * 1.5));
  let left = chars;
  const draw = useP(3.3, 36);
  const preview = useP(3.0, 16);
  return (
    <AbsoluteFill>
      {/* el mouse tachado */}
      <div style={{ position: "absolute", left: 860, top: 380, opacity: mouse * (1 - mouseOut), transform: `scale(${mouse}) translateY(${-mouseOut * 60}px)` }}>
        <svg width={200} height={260} viewBox="0 0 100 130">
          <path d="M10 5 L10 100 L35 78 L52 120 L68 113 L51 72 L85 72 Z" fill="none" stroke={FG} strokeWidth={6} strokeLinejoin="round" />
          <line x1={0} y1={125} x2={100} y2={5} stroke={AMBER} strokeWidth={9} strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - cross)} />
        </svg>
      </div>
      {/* editor de código */}
      <div style={{ position: "absolute", left: 140, top: 170, width: 780, height: 740, borderRadius: 28, background: "#1B1A18", border: "2px solid #2A2825", opacity: panel, transform: `translateX(${(1 - panel) * -80}px)` }}>
        <div style={{ display: "flex", gap: 12, padding: "26px 30px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: 16, background: "#3A3733" }} />
          ))}
        </div>
        <div style={{ padding: "10px 46px", fontFamily: INTER, fontWeight: 600, fontSize: 44, lineHeight: 1.6, color: FG, whiteSpace: "pre" }}>
          {CODE.map((l, i) => {
            const shown = l.slice(0, Math.max(0, left));
            left -= l.length;
            return (
              <div key={i} style={{ display: "flex" }}>
                <span style={{ color: MUTED, width: 60, fontWeight: 500 }}>{i + 1}</span>
                <span style={{ color: l.includes("E8A04C") ? AMBER : FG }}>{shown}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* vista previa: el código se vuelve imagen */}
      <div style={{ position: "absolute", left: 1000, top: 170, width: 780, height: 740, borderRadius: 28, background: "#0D0C0B", border: "2px solid #2A2825", opacity: preview, transform: `translateX(${(1 - preview) * 80}px)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <svg width={600} height={600} viewBox="0 0 600 600" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={300} cy={300} r={240} fill="none" stroke={AMBER} strokeWidth={18} strokeLinecap="round" strokeDasharray={1508} strokeDashoffset={1508 * (1 - draw)} style={{ filter: `drop-shadow(0 0 20px ${AMBER})` }} />
        </svg>
        <div style={{ position: "absolute", top: 26, left: 32, fontFamily: INTER, fontWeight: 700, fontSize: 24, letterSpacing: "0.2em", color: MUTED }}>VISTA PREVIA</div>
      </div>
      <div style={{ position: "absolute", left: 140, top: 950, display: "flex", gap: 24, alignItems: "baseline" }}>
        <Reveal text="código" at={1.6} size={70} />
        <Reveal text="→" at={2.9} size={70} color={MUTED} />
        <Reveal text="imagen" at={4.1} size={70} color={AMBER} />
      </div>
    </AbsoluteFill>
  );
};

// E · «Cada forma que ves, cada letra, cada transición, es una línea de código.»
const E: React.FC = () => {
  const frame = useCurrentFrame();
  const collapse = useP(3.6, 20);
  const shapes = useS(0.3);
  const letters = useS(1.5);
  const wipe = useP(2.6, 14);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - collapse, transform: `scale(${1 - 0.6 * collapse})` }}>
        {/* formas */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + frame / 60;
          const r = 380 * shapes;
          const kind = i % 3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 960 + Math.cos(a) * r * 1.4 - 40,
                top: 540 + Math.sin(a) * r * 0.8 - 40,
                width: 80,
                height: 80,
                borderRadius: kind === 0 ? 80 : kind === 1 ? 12 : 0,
                border: `4px solid ${i % 4 === 0 ? AMBER : FG}`,
                transform: `rotate(${frame * (i % 2 ? 2 : -2)}deg) scale(${shapes})`,
                clipPath: kind === 2 ? "polygon(50% 0, 100% 100%, 0 100%)" : undefined,
                background: kind === 2 ? (i % 4 === 0 ? AMBER : FG) : "transparent",
              }}
            />
          );
        })}
        {/* letras */}
        {"Aa Bb Cc".split("").map((c, i) => (
          <div key={i} style={{ position: "absolute", left: 560 + i * 110, top: 420 + Math.sin(i + frame / 9) * 30, fontFamily: INTER, fontWeight: 800, fontSize: 150, color: FG, opacity: letters, transform: `translateY(${(1 - letters) * (80 + random(`l${i}`) * 100)}px) rotate(${(1 - letters) * 30}deg)` }}>
            {c}
          </div>
        ))}
        {/* transición */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${wipe * 100}%`, background: `linear-gradient(90deg, transparent, ${AMBER}55)`, opacity: 1 - wipe * 0.6 }} />
        <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
          <Reveal text="cada forma," at={0.4} size={64} weight={600} />
          <Reveal text="cada letra," at={1.5} size={64} weight={600} />
          <Reveal text="cada transición" at={2.6} size={64} weight={600} />
        </div>
      </AbsoluteFill>
      {/* todo se vuelve una línea de código */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: collapse }}>
        <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 40, color: MUTED, marginBottom: 20 }}>es</div>
        <div style={{ padding: "24px 60px", borderRadius: 24, border: `2px solid ${AMBER}`, fontFamily: INTER, fontWeight: 800, fontSize: 110, letterSpacing: "-0.04em", color: FG, boxShadow: `0 0 80px ${AMBER}33`, transform: `scale(${0.8 + 0.2 * collapse})` }}>
          {"<"}
          <span style={{ color: AMBER }}>una línea de código</span>
          {" />"}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// F · «¿El editor del futuro? Probablemente sea una conversación.»
const Bubble: React.FC<{ side: "l" | "r"; at: number; children: React.ReactNode }> = ({ side, at, children }) => {
  const s = useS(at);
  return (
    <div style={{ alignSelf: side === "r" ? "flex-end" : "flex-start", maxWidth: 1100, padding: "34px 52px", borderRadius: 48, borderBottomRightRadius: side === "r" ? 12 : 48, borderBottomLeftRadius: side === "l" ? 12 : 48, background: side === "r" ? FG : "#1F1D1B", color: side === "r" ? BG : FG, fontFamily: INTER, fontWeight: 700, fontSize: 70, letterSpacing: "-0.03em", opacity: s, transform: `translateY(${(1 - s) * 50}px) scale(${0.9 + 0.1 * s})`, transformOrigin: side === "r" ? "right bottom" : "left bottom" }}>
      {children}
    </div>
  );
};
const Dots: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < F(from) || frame >= F(to)) return null;
  return (
    <div style={{ alignSelf: "flex-start", display: "flex", gap: 14, padding: "36px 48px", borderRadius: 48, background: "#1F1D1B" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 22, height: 22, borderRadius: 22, background: MUTED, transform: `translateY(${Math.sin((frame - i * 5) / 4) * 8}px)` }} />
      ))}
    </div>
  );
};
const Fin: React.FC = () => {
  const frame = useCurrentFrame();
  const end = useP(4.2, 20);
  return (
    <AbsoluteFill style={{ padding: "150px 240px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
      <Bubble side="r" at={0}>¿El editor del futuro?</Bubble>
      <Dots from={0.8} to={1.8} />
      {frame >= F(1.8) ? (
        <Bubble side="l" at={1.8}>
          Probablemente sea{" "}
          <span style={{ color: AMBER }}>
            <Typed text="una conversación." at={3.0} cps={20} size={70} color={AMBER} weight={700} />
          </span>
        </Bubble>
      ) : null}
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 30, letterSpacing: "0.25em", color: MUTED, opacity: end }}>ESTE VIDEO · 100 % CÓDIGO</div>
    </AbsoluteFill>
  );
};

const SCENES = [A, B, C, D, E, Fin];

export const ClaudeMG: React.FC = () => {
  const frame = useCurrentFrame();
  const push = 1 + frame * 0.00012;
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      {/* luz ambiental que se mueve despacio */}
      <AbsoluteFill style={{ background: `radial-gradient(50% 60% at ${50 + Math.sin(frame / 90) * 20}% ${40 + Math.cos(frame / 110) * 10}%, #2A241C 0%, ${BG} 70%)` }} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {SCENES.map((Sc, i) => {
          const from = F(CUTS[i]);
          const dur = F(CUTS[i + 1]) - from;
          const tin = interpolate(frame - from, [0, 12], [1, 0], { ...clamp, easing: ease });
          const tout = interpolate(frame - from, [dur - 8, dur], [0, 1], clamp);
          return (
            <Sequence key={i} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill style={{ opacity: (1 - tin) * (1 - tout), transform: `scale(${1.04 - 0.04 * (1 - tin) + 0.03 * tout})`, filter: `blur(${10 * tin + 8 * tout}px)` }}>
                <Sc />
              </AbsoluteFill>
              {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} /> : null}
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {/* grano y viñeta */}
      <AbsoluteFill style={{ opacity: 0.05, backgroundImage: `radial-gradient(${FG} 1px, transparent 1.4px)`, backgroundSize: "5px 5px", backgroundPosition: `${random(`gx${frame}`) * 5}px ${random(`gy${frame}`) * 5}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />
      {[4.7, 9.0, 9.7, 10.5, 11.2, 16.2, 21.8].map((h) => (
        <Sequence key={h} from={F(h)} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.25} />
        </Sequence>
      ))}
      <Audio src={staticFile("claudemg/voz.wav")} />
      <Audio src={staticFile("claudemg/musica.wav")} volume={(f) => 0.2 * interpolate(f, [claudeMGDuration - 30, claudeMGDuration], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
