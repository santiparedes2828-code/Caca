import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Estilo «Firma» de Hook House (16-10-2026, pedido del usuario: «con tu propio estilo de motion graphics»).
// Editorial suizo en blanco y negro:
//   - papel (#F2EFE8) y tinta (#0E0E0E); las escenas se alternan con un iris circular que invierte los colores
//   - marco fino con marcas de esquina, barra de progreso arriba, contador de escena y una cinta que corre abajo
//   - tipografía Inter enorme que sube desde detrás de una máscara, línea a línea, al ritmo de la voz
//   - formas geométricas puras (anillos, barras, puntos) y emojis de Apple en PNG con un salto corto
// Textos solo en blanco y negro (corrección del 15-10-2026). Voz de marca; tiempos de su transcripción.

loadInter();

const F = (s: number) => Math.round(s * 30);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const PAPER = "#F2EFE8";
const INK = "#0E0E0E";
const END = 24.8;
export const firmaDuration = F(END);
const CUTS = [0, 2.9, 4.6, 8.2, 13.2, 17.4, 21.0, END];
const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Línea de texto que sube desde detrás de una máscara (at en segundos, relativo a la escena)
const Line: React.FC<{ text: string; at: number; size: number; color: string; weight?: number; italic?: boolean; box?: boolean }> = ({ text, at, size, color, weight = 800, italic, box }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F(at), F(at) + 12], [1, 0], { ...clamp, easing: ease });
  const fit = Math.min(size, 1500 / Math.max(5, text.length) / (weight >= 800 ? 1 : 0.85));
  return (
    <div style={{ overflow: "hidden", lineHeight: 1.02, paddingBottom: fit * 0.08 }}>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: weight,
          fontStyle: italic ? "italic" : "normal",
          fontSize: fit,
          letterSpacing: weight >= 800 ? "-0.055em" : "-0.01em",
          color: box ? (color === INK ? PAPER : INK) : color,
          background: box ? color : "transparent",
          display: "inline-block",
          padding: box ? `0 ${fit * 0.18}px ${fit * 0.06}px` : 0,
          transform: `translateY(${p * 110}%) skewY(${p * 6}deg)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Block: React.FC<{ top: number; children: React.ReactNode; align?: "left" | "center" }> = ({ top, children, align = "left" }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top, display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : "center", textAlign: align }}>{children}</div>
);

// Tachón que se dibuja
const StrikeOut: React.FC<{ at: number; top: number; left: number; width: number; color: string }> = ({ at, top, left, width, color }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F(at), F(at) + 8], [0, 1], { ...clamp, easing: ease });
  return <div style={{ position: "absolute", top, left, width: width * p, height: 16, background: color, transform: "rotate(-3deg)", transformOrigin: "left center" }} />;
};

const Emoji: React.FC<{ name: string; size: number; at: number; x: number; y: number; plate?: boolean }> = ({ name, size, at, x, y, plate }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - F(at), fps: 30, config: { damping: 9, stiffness: 190, mass: 0.6 } });
  if (plate)
    return (
      <div style={{ position: "absolute", left: x - size * 0.15, top: y - size * 0.15, width: size * 1.3, height: size * 1.3, borderRadius: 999, background: PAPER, opacity: s > 0.02 ? 1 : 0, transform: `scale(${s})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile(`firma/apple/${name}.png`)} style={{ width: size, height: size, transform: `rotate(${Math.sin(frame / 14) * 6}deg)` }} />
      </div>
    );
  return (
    <Img
      src={staticFile(`firma/apple/${name}.png`)}
      style={{ position: "absolute", left: x, top: y, width: size, height: size, opacity: s > 0.02 ? 1 : 0, transform: `scale(${s}) rotate(${(1 - s) * -30 + Math.sin(frame / 14) * 4}deg) translateY(${Math.sin(frame / 10) * 8}px)` }}
    />
  );
};

// Anillo que se llena (30 segundos)
const Ring: React.FC<{ at: number; x: number; y: number; r: number; color: string }> = ({ at, x, y, r, color }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F(at), F(at) + 40], [0, 1], { ...clamp, easing: ease });
  const c = 2 * Math.PI * r;
  return (
    <svg width={r * 2 + 30} height={r * 2 + 30} style={{ position: "absolute", left: x, top: y, transform: "rotate(-90deg)" }}>
      <circle cx={r + 15} cy={r + 15} r={r} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={22} />
      <circle cx={r + 15} cy={r + 15} r={r} fill="none" stroke={color} strokeWidth={22} strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
    </svg>
  );
};

// Rejilla de puntos donde se enciende uno solo (una sola idea)
const Dots: React.FC<{ at: number; top: number; color: string }> = ({ at, top, color }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [F(at), F(at) + 10], [1, 0.12], clamp);
  const pick = spring({ frame: frame - F(at), fps: 30, config: { damping: 8, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: 140, top, display: "grid", gridTemplateColumns: "repeat(10, 80px)", gap: 0 }}>
      {Array.from({ length: 40 }, (_, i) => {
        const me = i === 23;
        const appear = spring({ frame: frame - F(at - 1.2) - i * 0.6, fps: 30, config: { damping: 200 } });
        return (
          <div key={i} style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: me ? 26 + 40 * pick : 22, height: me ? 26 + 40 * pick : 22, borderRadius: 99, background: color, opacity: (me ? 1 : fade) * appear }} />
          </div>
        );
      })}
    </div>
  );
};

// Barra del episodio que se corta en seis puertas
const Slices: React.FC<{ at: number; split: number; color: string }> = ({ at, split, color }) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [F(at), F(at) + 14], [0, 1], { ...clamp, easing: ease });
  const s = interpolate(frame, [F(split), F(split) + 16], [0, 1], { ...clamp, easing: ease });
  const W = 900;
  const w = W / 6;
  return (
    <div style={{ position: "absolute", left: 90, top: 1020, width: W, height: 300 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * w + (i - 2.5) * 22 * s,
            top: 0,
            width: (w + 1) * a - 14 * s,
            height: 300 - 40 * s,
            background: color,
            borderRadius: 6 + 28 * s,
            transform: `translateY(${Math.sin(i * 1.3 + frame / 7) * 12 * s}px)`,
          }}
        >
          {s > 0.5 ? <div style={{ position: "absolute", right: 22, top: "48%", width: 14, height: 14, borderRadius: 14, background: color === INK ? PAPER : INK, opacity: (s - 0.5) * 2 }} /> : null}
        </div>
      ))}
    </div>
  );
};

// Flecha que se dibuja hacia abajo
const Arrow: React.FC<{ at: number; color: string }> = ({ at, color }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F(at), F(at) + 14], [1, 0], { ...clamp, easing: ease });
  return (
    <svg width={300} height={520} viewBox="0 0 100 180" style={{ position: "absolute", left: 640, top: 1150 }}>
      <path d="M50 0 C 50 60, 20 90, 50 170 M25 140 L50 172 L75 140" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={260} strokeDashoffset={260 * p} />
    </svg>
  );
};

// ——— Escenas (tiempos relativos al inicio de cada una) ———
type SceneProps = { fg: string };
const S1: React.FC<SceneProps> = ({ fg }) => (
  <>
    <Block top={600}>
      <Line text="Tu podcast" at={0} size={150} color={fg} />
      <Line text="no necesita" at={0.85} size={150} color={fg} weight={500} />
      <Line text="más" at={1.55} size={240} color={fg} />
      <Line text="episodios." at={1.75} size={240} color={fg} />
    </Block>
    <StrikeOut at={2.4} top={1260} left={80} width={920} color={fg} />
  </>
);
const S2: React.FC<SceneProps> = ({ fg }) => (
  <>
    <Block top={640}>
      <Line text="Necesita" at={0} size={170} color={fg} weight={500} />
      <Line text="ESTO." at={0.85} size={330} color={fg} />
    </Block>
    <Arrow at={1.0} color={fg} />
  </>
);
const S3: React.FC<SceneProps> = ({ fg }) => {
  const frame = useCurrentFrame();
  const secs = Math.min(30, Math.max(0, Math.round(interpolate(frame, [F(0.8), F(0.8) + 40], [0, 30], clamp))));
  return (
    <>
      <Block top={260}>
        <Line text="1 clip." at={0.1} size={190} color={fg} />
      </Block>
      <Ring at={0.8} x={90} y={560} r={190} color={fg} />
      <div style={{ position: "absolute", left: 120, top: 700, width: 380, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 150, letterSpacing: "-0.05em", color: fg }}>{secs}</div>
      <div style={{ position: "absolute", left: 560, top: 720 }}>
        <Line text="segundos." at={1.1} size={96} color={fg} weight={500} />
      </div>
      <Block top={1060}>
        <Line text="1 sola idea." at={2.2} size={150} color={fg} />
      </Block>
      <Dots at={3.0} top={1300} color={fg} />
    </>
  );
};
const S4: React.FC<SceneProps> = ({ fg }) => (
  <>
    <Block top={330}>
      <Line text="que alguien lo vea" at={0} size={100} color={fg} weight={500} />
      <Line text="sin saber" at={1.1} size={160} color={fg} />
      <Line text="quién sos" at={1.5} size={160} color={fg} box />
    </Block>
    <Emoji name="eyes" size={190} at={0.8} x={790} y={180} />
    <Block top={1130}>
      <Line text="y quiera escuchar" at={2.5} size={100} color={fg} weight={500} />
      <Line text="el episodio" at={3.6} size={160} color={fg} />
      <Line text="entero." at={4.1} size={160} color={fg} />
    </Block>
    <Emoji name="headphone" size={140} at={3.2} x={820} y={900} plate />
  </>
);
const S5: React.FC<SceneProps> = ({ fg }) => {
  return (
    <>
      <Block top={300}>
        <Line text="eso hace un buen clip:" at={0} size={86} color={fg} weight={500} />
      </Block>
      <Block top={500}>
        <Line text="no resume." at={1.8} size={170} color={fg} />
      </Block>
      <StrikeOut at={2.3} top={600} left={80} width={830} color={fg} />
      <Block top={740}>
        <Line text="abre" at={2.9} size={230} color={fg} />
        <Line text="la puerta." at={3.3} size={230} color={fg} box />
      </Block>
      <Emoji name="door" size={330} at={3.1} x={375} y={1290} />
    </>
  );
};
const S6: React.FC<SceneProps> = ({ fg }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 2, fps: 30, config: { damping: 14 } });
  return (
    <>
      <div style={{ position: "absolute", left: 90, top: 300, fontFamily: INTER, fontWeight: 800, fontSize: 130, letterSpacing: "-0.06em", color: fg, opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
        hookhouse<span style={{ color: fg }}>.</span>
      </div>
      <Block top={520}>
        <Line text="cada episodio" at={1.0} size={130} color={fg} weight={500} />
        <Line text="→ 6 puertas" at={2.6} size={170} color={fg} />
      </Block>
      <Slices at={1.0} split={2.6} color={fg} />
    </>
  );
};
const S7: React.FC<SceneProps> = ({ fg }) => (
  <>
    <Block top={420}>
      <Line text="Comentá" at={0} size={180} color={fg} weight={500} />
      <Line text="CLIP" at={0.7} size={380} color={fg} box />
    </Block>
    <Block top={1120}>
      <Line text="y te edito" at={1.4} size={110} color={fg} weight={500} />
      <Line text="la primera gratis." at={1.9} size={110} color={fg} />
    </Block>
    <Emoji name="speech-balloon" size={180} at={0.9} x={820} y={170} />
  </>
);
const SCENES = [S1, S2, S3, S4, S5, S6, S7];

// Iris circular que invierte los colores al entrar en cada escena
const Iris: React.FC<{ from: number; color: string; children: React.ReactNode; first: boolean }> = ({ from, color, children, first }) => {
  const frame = useCurrentFrame();
  const r = first ? 2400 : interpolate(frame, [from, from + 14], [0, 2400], { ...clamp, easing: ease });
  return <AbsoluteFill style={{ background: color, clipPath: `circle(${r}px at 540px 960px)` }}>{children}</AbsoluteFill>;
};

const Chrome: React.FC<{ fg: string; scene: number }> = ({ fg, scene }) => {
  const frame = useCurrentFrame();
  const p = frame / firmaDuration;
  const tick = (x: number, y: number, rot: number) => (
    <div style={{ position: "absolute", left: x, top: y, width: 44, height: 44, borderLeft: `4px solid ${fg}`, borderTop: `4px solid ${fg}`, transform: `rotate(${rot}deg)` }} />
  );
  const ticker = "CLIPS DE PODCAST · GANCHO PRIMERO · SUBTÍTULOS · CERO SILENCIOS · ";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${p * 100}%`, background: fg }} />
      {tick(40, 60, 0)}
      {tick(996, 60, 90)}
      {tick(40, 1816, -90)}
      {tick(996, 1816, 180)}
      <div style={{ position: "absolute", left: 100, top: 72, fontFamily: INTER, fontWeight: 700, fontSize: 26, letterSpacing: "0.22em", color: fg }}>HOOK HOUSE</div>
      <div style={{ position: "absolute", right: 100, top: 72, fontFamily: INTER, fontWeight: 700, fontSize: 26, letterSpacing: "0.12em", color: fg, fontVariantNumeric: "tabular-nums" }}>
        {String(scene + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, height: 46, overflow: "hidden", borderTop: `2px solid ${fg}`, borderBottom: `2px solid ${fg}` }}>
        <div style={{ whiteSpace: "nowrap", fontFamily: INTER, fontWeight: 700, fontSize: 24, letterSpacing: "0.18em", color: fg, lineHeight: "42px", transform: `translateX(${-(frame * 4) % 1400}px)` }}>{ticker.repeat(6)}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Firma: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const scene = Math.max(0, CUTS.findIndex((c, i) => t >= c && t < (CUTS[i + 1] ?? 999)));
  const bg = (i: number) => (i % 2 ? INK : PAPER);
  const fgOf = (i: number) => (i % 2 ? PAPER : INK);
  // cámara: deriva lenta y un pequeño golpe en cada corte
  const since = frame - F(CUTS[scene]);
  const punch = interpolate(since, [0, 10], [0.05, 0], { ...clamp, easing: ease });
  const driftX = Math.sin(frame / 60) * 10;
  const driftY = Math.cos(frame / 75) * 8;
  return (
    <AbsoluteFill style={{ background: bg(0), overflow: "hidden" }}>
      {SCENES.map((Sc, i) => {
        const from = F(CUTS[i]);
        const dur = F(CUTS[i + 1]) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={dur + (i < SCENES.length - 1 ? 0 : 0)} layout="none">
            <Iris from={0} color={bg(i)} first={i === 0}>
              <AbsoluteFill style={{ transform: `translate(${driftX}px, ${driftY}px) scale(${1 + punch})` }}>
                <Sc fg={fgOf(i)} />
              </AbsoluteFill>
              {/* grano de papel */}
              <AbsoluteFill style={{ opacity: 0.07, backgroundImage: `radial-gradient(${fgOf(i)} 1px, transparent 1.4px)`, backgroundSize: "6px 6px", backgroundPosition: `${random(`g${frame}`) * 6}px ${random(`h${frame}`) * 6}px` }} />
            </Iris>
            {i ? <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /> : null}
          </Sequence>
        );
      })}
      <Chrome fg={fgOf(scene)} scene={scene} />
      {[1.8, 3.8, 4.8, 7.6, 10.2, 12.5, 15.2, 16.7, 20.3, 21.7].map((h) => (
        <Sequence key={h} from={F(h)} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.28} />
        </Sequence>
      ))}
      <Audio src={staticFile("firma/voz.wav")} />
      <Audio src={staticFile("firma/musica.wav")} volume={(f) => 0.25 * interpolate(f, [firmaDuration - 20, firmaDuration], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
