import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../autopilot/Captions";
import type { CaptionPage } from "../autopilot/props";
import { useBrandFonts } from "../design/fonts";
import { HOOKHOUSE } from "../design/tokens";
import { B, SANS } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import data from "./kuleshov.json";

// Vídeo viral de Hook House con Capi: el efecto Kuleshov (dato real de la historia del montaje). Identidad de la
// marca (contenido propio), todo el texto en Inter, emojis Fluent, voz de marca (Rodrigo Zabú) y efectos propios.
// Capi se anima con recortes de su hoja de personaje: cambia de expresión según lo que dice y rebota con la voz.

export const KULESHOV_FPS = 30;
export const kuleshovDuration = Math.round((data.words[data.words.length - 1].endMs / 1000 + 1.5) * KULESHOV_FPS);

type Word = { text: string; startMs: number; endMs: number };
const W = data.words as Word[];
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const f = (ms: number) => Math.round((ms / 1000) * KULESHOV_FPS);
// Fotograma en que empieza la n-ésima aparición de una palabra
const at = (text: string, nth = 0) => {
  const hits = W.filter((w) => w.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === text);
  return f((hits[nth] ?? hits[0]).startMs);
};
const env = (frame: number) => data.envelope[Math.max(0, Math.min(data.envelope.length - 1, frame))] ?? 0;
const icon = (n: keyof typeof data.icons) => data.icons[n];

// Escenas (fotograma de inicio)
const S = {
  hook: 0,
  kuleshov: at("lev") - 4,
  imagenes: at("con") - 6,
  publico: at("el", 1) - 4,
  mismo: at("pero") - 4,
  frase: at("no") - 3,
  cierre: at("tú") - 3,
};

// Palabras clave del guion (color y tamaño en los subtítulos)
const KEYS = new Set(["experimento", "100", "cerebro", "kuleshov", "sopa", "ataúd", "diván", "hambre", "tristeza", "deseo", "mismo", "grabas", "editas", "graba", "yo"]);
const PAGES: CaptionPage[] = (data.pages as CaptionPage[]).map((p) => ({
  ...p,
  lines: p.lines.map((l) => l.map((t) => ({ ...t, emphasis: KEYS.has(t.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")) }))),
}));
const BRAND = {
  ...HOOKHOUSE,
  // Fondo claro: las palabras van en tinta (con su contorno) y las claves en verde
  colors: { ...HOOKHOUSE.colors, white: HOOKHOUSE.colors.ink },
  captions: { ...HOOKHOUSE.captions, fontSize: 86, positionY: 0.75 },
  layout: { ...HOOKHOUSE.layout, safeZone: { ...HOOKHOUSE.layout.safeZone, top: 300 } },
};

// ——— Piezas ———

// Fondo de la marca con una rejilla de puntos que deriva y destellos verdes en los golpes
const Background: React.FC<{ flash: number }> = ({ flash }) => {
  const frame = useCurrentFrame();
  const off = (frame * 0.6) % 60;
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${B.green}22 2.4px, transparent 2.6px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `${off}px ${off * 0.5}px`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${B.green}${Math.round(flash * 60).toString(16).padStart(2, "0")} 0%, transparent 62%)` }} />
    </AbsoluteFill>
  );
};

// Rayos que giran detrás de Capi en el gancho
const Burst: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 540 - 900, top: 760 - 900, width: 1800, height: 1800, opacity, transform: `rotate(${frame * 0.6}deg)` }}>
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 900 - 60,
            top: 0,
            width: 120,
            height: 900,
            transformOrigin: "50% 100%",
            transform: `rotate(${i * 22.5}deg)`,
            background: `linear-gradient(to top, ${B.green}00, ${B.green}30)`,
            clipPath: "polygon(35% 0, 65% 0, 52% 100%, 48% 100%)",
          }}
        />
      ))}
    </div>
  );
};

type Expr = "sorprendido" | "hablando" | "tranquilo" | "esceptico" | "riendo";

// Cabeza de Capi que habla: rebota y se inclina con la voz, entra con muelle
const CapiHead: React.FC<{ expr: Expr; x: number; y: number; size: number; enter: number; flip?: boolean }> = ({ expr, x, y, size, enter, flip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter, fps, config: { damping: 11, stiffness: 160, mass: 0.7 } });
  const v = env(frame);
  const bob = Math.sin(frame / 3.1) * v;
  if (frame < enter) return null;
  return (
    <Img
      src={staticFile(`capi/${expr}.png`)}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        objectFit: "contain",
        transform: `translateY(${(1 - s) * 220 - v * 14}px) scale(${(0.4 + 0.6 * s) * (1 + v * 0.05)}) rotate(${bob * 4 + (1 - s) * -12}deg) scaleX(${flip ? -1 : 1})`,
        transformOrigin: "50% 85%",
        filter: "drop-shadow(0 22px 30px rgba(0,0,0,0.22))",
      }}
    />
  );
};

const Emoji: React.FC<{ name: keyof typeof data.icons; x: number; y: number; size: number; enter: number }> = ({ name, x, y, size, enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter, fps, config: { damping: 8, stiffness: 180, mass: 0.6 } });
  if (frame < enter) return null;
  const wob = Math.sin((frame - enter) / 5) * 4 * Math.exp(-(frame - enter) / 30);
  return (
    <Img
      src={icon(name)}
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `scale(${s}) rotate(${(1 - s) * -30 + wob}deg)`,
        filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.18))",
      }}
    />
  );
};

// Fotograma de película: borde negro con perforaciones
const FilmFrame: React.FC<{ x: number; y: number; w: number; h: number; enter: number; children: React.ReactNode; tint?: string }> = ({ x, y, w, h, enter, children, tint }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter, fps, config: { damping: 14, stiffness: 170 } });
  if (frame < enter) return null;
  const holes = Math.round(w / 46);
  const Row: React.FC<{ top: boolean }> = ({ top }) => (
    <div style={{ position: "absolute", left: 0, right: 0, [top ? "top" : "bottom"]: 8, display: "flex", justifyContent: "space-around" }}>
      {Array.from({ length: holes }, (_, i) => (
        <div key={i} style={{ width: 18, height: 14, borderRadius: 4, background: B.bg, opacity: 0.85 }} />
      ))}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: B.ink,
        borderRadius: 18,
        transform: `translateY(${(1 - s) * 120}px) scale(${0.8 + 0.2 * s})`,
        opacity: Math.min(1, s * 1.6),
        boxShadow: "0 24px 50px rgba(0,0,0,0.25)",
      }}
    >
      <Row top />
      <Row top={false} />
      <div style={{ position: "absolute", left: 14, right: 14, top: 34, bottom: 34, borderRadius: 8, overflow: "hidden", background: tint ?? "#FFFFFF" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      </div>
    </div>
  );
};

// La cara del «actor» (Capi sin expresión, del frente de la hoja)
const ActorFace: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("capi/cuerpo-frente.png")} style={{ width: size, height: size * 1.25, objectFit: "cover", objectPosition: "50% 0%" }} />
);

const Label: React.FC<{ text: string; x: number; y: number; enter: number; size?: number; color?: string; bg?: string }> = ({ text, x, y, enter, size = 44, color = B.white, bg = B.green }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - enter, fps, config: { damping: 10, stiffness: 200, mass: 0.6 } });
  if (frame < enter) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${(1 - s) * 8 - 2}deg)`,
        padding: `${size * 0.22}px ${size * 0.55}px`,
        borderRadius: size * 0.35,
        background: bg,
        color,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
      }}
    >
      {text}
    </div>
  );
};

// Texto grande que entra palabra a palabra con máscara
const BigLine: React.FC<{ text: string; y: number; enter: number; size: number; color?: string; strike?: number }> = ({ text, y, enter, size, color = B.ink, strike = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: y, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26, fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.04em", color }}>
      {text.split(" ").map((w, i) => {
        const s = spring({ frame: frame - enter - i * 3, fps, config: { damping: 14, stiffness: 190 } });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - s) * 110}%)` }}>{w}</span>
          </span>
        );
      })}
      {strike > 0 ? <div style={{ position: "absolute", left: "8%", top: "48%", height: size * 0.12, width: `${84 * strike}%`, background: "#E5484D", borderRadius: 99 }} /> : null}
    </div>
  );
};

// Contador que rueda hasta 100 (el «más de cien años»)
const Counter: React.FC<{ enter: number }> = ({ enter }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame, [enter, enter + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = spring({ frame: frame - enter, fps, config: { damping: 12, stiffness: 170 } });
  if (frame < enter) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: SANS, transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.5) }}>
      <div style={{ fontSize: 210, fontWeight: 800, letterSpacing: "-0.05em", color: B.green, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>+{Math.round(100 * p)}</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: B.ink, letterSpacing: "0.12em", marginTop: 4 }}>AÑOS</div>
    </div>
  );
};

// Escena con entrada de barrido y empuje de cámara
const SceneWrap: React.FC<{ from: number; to: number; children: React.ReactNode; dir?: 1 | -1 }> = ({ from, to, children, dir = 1 }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 6) return null;
  const inP = interpolate(frame, [from, from + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(frame, [to - 1, to + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const push = interpolate(frame, [from, to], [1, 1.06], clamp);
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${((1 - inP) * 380 - outP * 380) * dir}px) scale(${push})`,
        filter: inP < 1 || outP > 0 ? `blur(${(1 - inP + outP) * 14}px)` : undefined,
        opacity: Math.min(inP * 1.4, 1 - outP),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ——— Composición ———

export const CapiKuleshov: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fonts = useBrandFonts(BRAND);
  // Golpes de cámara en las claves
  const hits = [at("100"), at("cerebro"), at("sopa"), at("ataúd"), at("diván"), at("mismo", 1), at("editas"), at("graba")];
  const punch = Math.max(0, ...hits.map((h) => (frame >= h && frame < h + 14 ? 1 - (frame - h) / 14 : 0)));
  const shake = punch > 0 ? (random(`s${frame}`) - 0.5) * 16 * punch : 0;
  const cerebro = at("cerebro");
  const glitch = frame >= cerebro && frame < cerebro + 8 ? 1 : 0;
  const hookSize = interpolate(frame, [0, 10], [1500, 640], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const toCorner = interpolate(frame, [S.kuleshov - 8, S.kuleshov + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const expr: Expr =
    frame < at("demuestra") ? "sorprendido" : frame < S.publico ? "hablando" : frame < S.mismo ? "esceptico" : frame < S.frase ? "sorprendido" : "riendo";
  const showHead = frame < S.frase;
  const showCaptions = frame < S.frase || frame >= S.cierre;
  const sfx: { name: string; at: number; v: number }[] = [
    { name: "hit", at: 0, v: 0.35 },
    { name: "click", at: at("100"), v: 0.25 },
    { name: "hit", at: cerebro, v: 0.4 },
    { name: "whoosh", at: S.kuleshov - 6, v: 0.35 },
    { name: "pop", at: at("actor"), v: 0.3 },
    { name: "whoosh", at: S.imagenes - 6, v: 0.3 },
    { name: "pop", at: at("sopa"), v: 0.35 },
    { name: "pop", at: at("ataúd"), v: 0.35 },
    { name: "pop", at: at("diván"), v: 0.35 },
    { name: "whoosh", at: S.publico - 6, v: 0.3 },
    { name: "click", at: at("hambre"), v: 0.35 },
    { name: "click", at: at("tristeza"), v: 0.35 },
    { name: "click", at: at("deseo"), v: 0.35 },
    { name: "whoosh", at: S.mismo - 6, v: 0.3 },
    { name: "hit", at: at("mismo", 1), v: 0.45 },
    { name: "whoosh", at: S.frase - 6, v: 0.3 },
    { name: "hit", at: at("editas"), v: 0.4 },
    { name: "whoosh", at: S.cierre - 6, v: 0.3 },
    { name: "brillo", at: at("encargo"), v: 0.35 },
  ];
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: "hidden" }}>
      <Audio src={staticFile("capi/voz-kuleshov.wav")} />
      {sfx.map((e, i) => (
        <Sequence key={i} from={Math.max(0, e.at)} durationInFrames={45} layout="none">
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.v * 0.55} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + punch * 0.035})` }}>
        <Background flash={punch} />

        {/* 1 · Gancho: Capi sorprendido entra enorme, contador de 100 años y el cerebro engañado */}
        <SceneWrap from={S.hook} to={S.kuleshov - 2}>
          <Burst opacity={interpolate(frame, [0, 6], [0, 1], clamp)} />
          <Counter enter={at("100") - 2} />
          <Emoji name="brain" x={820} y={560} size={230} enter={cerebro - 1} />
        </SceneWrap>

        {/* 2 · Kuleshov: el mismo plano de un actor sin expresión */}
        <SceneWrap from={S.kuleshov} to={S.imagenes - 2}>
          <Label text="LEV KULESHOV" x={460} y={420} enter={S.kuleshov + 2} size={58} bg={B.ink} />
          <Label text="EFECTO KULESHOV" x={460} y={510} enter={S.kuleshov + 8} size={34} />
          <FilmFrame x={210} y={600} w={500} h={560} enter={at("actor") - 2}>
            <ActorFace size={430} />
          </FilmFrame>
          <Label text="SIN EXPRESIÓN" x={460} y={1180} enter={at("expresión")} size={40} bg={B.ink} />
        </SceneWrap>

        {/* 3 · Tres imágenes: sopa, ataúd y diván */}
        <SceneWrap from={S.imagenes} to={S.publico - 2}>
          <Emoji name="film-frames" x={470} y={400} size={150} enter={S.imagenes + 2} />
          {(
            [
              ["bowl-with-spoon", at("plato") - 2],
              ["coffin", at("ataúd") - 2],
              ["couch-and-lamp", at("mujer") - 2],
            ] as const
          ).map(([n, e], i) => (
            <FilmFrame key={n} x={70 + i * 300} y={560} w={280} h={330} enter={e}>
              <Img src={icon(n)} style={{ width: 190, height: 190 }} />
            </FilmFrame>
          ))}
          {(["SOPA", "ATAÚD", "DIVÁN"] as const).map((t, i) => (
            <Label key={t} text={t} x={210 + i * 300} y={930} enter={[at("sopa"), at("ataúd"), at("diván")][i]} size={36} bg={B.ink} />
          ))}
        </SceneWrap>

        {/* 4 · El público vio hambre, tristeza y deseo (con la misma cara) */}
        <SceneWrap from={S.publico} to={S.mismo - 2} dir={-1}>
          {(
            [
              ["bowl-with-spoon", "HAMBRE", at("hambre")],
              ["coffin", "TRISTEZA", at("tristeza")],
              ["couch-and-lamp", "DESEO", at("deseo")],
            ] as const
          ).map(([n, t, e], i) => (
            <React.Fragment key={t}>
              <FilmFrame x={70} y={460 + i * 255} w={230} h={230} enter={S.publico + 2 + i * 3} tint="#FFFFFF">
                <Img src={icon(n)} style={{ width: 140, height: 140 }} />
              </FilmFrame>
              <FilmFrame x={320} y={460 + i * 255} w={230} h={230} enter={S.publico + 4 + i * 3}>
                <ActorFace size={190} />
              </FilmFrame>
              <Label text={t} x={760} y={575 + i * 255} enter={e} size={50} />
            </React.Fragment>
          ))}
        </SceneWrap>

        {/* 5 · Pero era el mismo plano: las tres caras se juntan en una */}
        <SceneWrap from={S.mismo} to={S.frase - 2}>
          {[0, 1, 2].map((i) => {
            const merge = interpolate(frame, [at("mismo", 1) - 6, at("mismo", 1) + 2], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
            return (
              <FilmFrame key={i} x={60 + i * 300 * (1 - merge) + 300 * merge} y={480} w={290} h={340} enter={S.mismo + 2 + i * 2}>
                <ActorFace size={230} />
              </FilmFrame>
            );
          })}
          <Label text="=" x={360} y={650} enter={S.mismo + 6} size={70} bg={B.ink} />
          <Label text="=" x={660} y={650} enter={S.mismo + 8} size={70} bg={B.ink} />
          <Label text="MISMO PLANO" x={450} y={920} enter={at("mismo", 1)} size={76} />
          <Label text="×3" x={450} y={1030} enter={at("tres", 1)} size={56} bg={B.ink} />
        </SceneWrap>

        {/* 6 · No es lo que grabas, es cómo lo editas */}
        <SceneWrap from={S.frase} to={S.cierre - 2}>
          <BigLine text="No es lo que grabas" y={430} enter={S.frase} size={104} color={B.grey} strike={interpolate(frame, [at("es", 1), at("es", 1) + 8], [0, 1], clamp)} />
          <BigLine text="Es cómo lo editas" y={720} enter={at("es", 1)} size={128} color={B.green} />
          <CapiHead expr="riendo" x={540} y={1180} size={420} enter={at("editas")} />
        </SceneWrap>

        {/* 7 · Cierre: Capi grabando y la marca */}
        <SceneWrap from={S.cierre} to={durationInFrames + 10} dir={-1}>
          <Img
            src={staticFile("capi/grabando.png")}
            style={{
              position: "absolute",
              left: 540 - 330,
              top: 360,
              width: 660,
              height: 720,
              objectFit: "contain",
              transform: `translateY(${(1 - spring({ frame: frame - S.cierre, fps, config: { damping: 12, stiffness: 150 } })) * 500}px) rotate(${Math.sin(frame / 9) * 1.5}deg)`,
              filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.22))",
              maskImage: "linear-gradient(to bottom, black 78%, transparent 94%)", WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 94%)",
            }}
          />
          <div style={{ position: "absolute", top: 1110, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: interpolate(frame, [at("encargo"), at("encargo") + 8], [0, 1], clamp) }}>
            <Wordmark size={120} />
          </div>
        </SceneWrap>

        {/* Capi presentador: enorme en el gancho y luego en la esquina, hablando */}
        {showHead ? (
          <CapiHead
            expr={expr}
            x={interpolate(toCorner, [0, 1], [540, 880])}
            y={interpolate(toCorner, [0, 1], [930, 400])}
            size={interpolate(toCorner, [0, 1], [hookSize, 300])}
            enter={0}
          />
        ) : null}

        {/* Destello con separación de color al «engañar a tu cerebro» */}
        {glitch ? (
          <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(229,72,77,0.18), rgba(18,161,80,0.18), rgba(60,120,255,0.18))`, mixBlendMode: "multiply", transform: `translateX(${(random(`g${frame}`) - 0.5) * 40}px)` }} />
        ) : null}
      </AbsoluteFill>

      {showCaptions ? <Captions pages={PAGES} mode="impacto" brand={BRAND} intensity="redes" fontsReady={fonts} icons={{}} /> : null}
    </AbsoluteFill>
  );
};
