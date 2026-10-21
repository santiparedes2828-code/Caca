import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, SERIF } from "../HookHouse/brand";
import { Wordmark } from "../HookHouse/graphics";
import { opt } from "../HookHouse/text";
import { E } from "../Reflejo/scene";
import { Shards, SPRITES } from "./kit";

// Motor "maqueta 3D" para los reels explicativos de Hook House (skill formula-viral).
// Misma esencia que Reflejo / Cosquillas / Puerta (ilustración plana crema + contorno, diana roja, subtítulos abajo,
// zona segura de TikTok), pero la escena es una maqueta en 3D: recortables de pie sobre un suelo con grosor,
// con sombras, profundidad y una cámara que orbita. Cada reel es solo datos (ver src/Diorama/reels/*).

export type Ctx = { f: number; t: number; fps: number; w: (i: number) => number; sp: (i: number, damping?: number) => number; lin: (a: number, b: number, from?: number, to?: number) => number };
type Props = Record<string, unknown>;

export type Item = {
  sprite: string;
  x: number;
  z: number;
  lift?: number;
  scale?: number;
  tilt?: number; // giro en Y (grados)
  from?: number; // palabra en la que aparece
  to?: number; // palabra en la que desaparece
  enter?: "pop" | "drop" | "rise" | "left" | "right" | "none";
  exit?: "pop" | "shatter" | "fall" | "none";
  props?: Props;
  fn?: (c: Ctx) => Props & { x?: number; z?: number; lift?: number; scale?: number; tilt?: number; opacity?: number };
  inner?: { sprite: string; props?: Props; scale?: number; dy?: number };
  float?: boolean;
  shadow?: boolean;
};
export type Cam = { at: number; x: number; y: number; z: number; zoom: number; ry?: number; rx?: number; dur?: number };
export type Fx = { at: number; kind: "flash" | "shake" | "punch" | "glitch" | "dark"; amt?: number; len?: number };
export type Sfx = { at: number; src: string; vol?: number; len?: number; offset?: number };
export type Replay = { from: number; to: number; start: number; speed?: number };

export type Reel = {
  id: string;
  voice: string;
  captions: Caption[];
  key: number[];
  wall: string;
  floor: string;
  titles: { at: number; title: string; sub: string }[];
  items: Item[];
  camera: Cam[];
  fx?: Fx[];
  sfx?: Sfx[];
  replays?: Replay[];
};

const P = 1500; // perspectiva
const VIEW_TOP = 300;
const VIEW_H = 890;
const FW = 1600;
const FD = 1000;
const WALL_H = 820;

const sec = (caps: Caption[], i: number) => (i < caps.length ? caps[i].startMs : caps[caps.length - 1].endMs) / 1000;
export const endStart = (caps: Caption[], fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.3) * fps);
export const reelDuration = (r: Reel, fps: number) => endStart(r.captions, fps) + Math.round(1.8 * fps);

const Captions: React.FC<{ caps: Caption[]; key2: Set<number>; t: number; frame: number; fps: number }> = ({ caps, key2, t, frame, fps }) => {
  let cur = -1;
  for (let i = 0; i < caps.length; i++) if (t >= sec(caps, i)) cur = i;
  if (cur < 0) return null;
  let start = 0;
  let n = 0;
  for (let i = 0; i <= cur; i++) {
    if (i > 0 && (/[.,:…?!]$/.test(caps[i - 1].text) || n >= 5)) {
      start = i;
      n = 0;
    }
    n++;
  }
  const words = Array.from({ length: cur - start + 1 }, (_, k) => start + k);
  return (
    <div style={{ position: "absolute", top: 1236, left: 80, right: 180, textAlign: "center", fontFamily: SANS, fontSize: 74, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
      {words.map((i) => {
        const local = frame - Math.round(sec(caps, i) * fps);
        const p = interpolate(local, [0, 4], [0, 1], opt);
        const isCur = i === cur;
        const key = key2.has(i);
        const box = spring({ frame: local, fps, config: { damping: 14, stiffness: 220 } });
        const text = caps[i].text.replace(/[.,:…]/g, "");
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: p, filter: `blur(${(1 - p) * 6}px)` }}>
            {key ? (
              <span style={{ position: "relative", display: "inline-block", padding: "0 10px", margin: "0 2px", border: `3px solid ${E.red}`, borderRadius: 4, fontWeight: 700, color: "#fff", scale: `${0.9 + 0.1 * box}` }}>
                {text}
                <span style={{ position: "absolute", left: -8, top: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
                <span style={{ position: "absolute", right: -8, bottom: -8, width: 13, height: 13, borderRadius: "50%", background: E.bg, border: `3px solid ${E.red}` }} />
              </span>
            ) : (
              <span style={{ fontWeight: isCur ? 700 : 500, color: isCur ? "#fff" : "#D8D1C6" }}>{text}</span>
            )}{" "}
          </span>
        );
      })}
    </div>
  );
};

const ClockIcon: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={72} height={72} viewBox="-36 -36 72 72" style={{ position: "absolute", left: 850, top: 222 }}>
    <circle r={31} fill="none" stroke={E.text} strokeWidth={3.5} />
    <line x1={0} y1={0} x2={0} y2={-16} stroke={E.text} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${frame * 0.8})`} />
    <line x1={0} y1={0} x2={0} y2={-24} stroke={E.text} strokeWidth={3} strokeLinecap="round" transform={`rotate(${frame * 9})`} />
  </svg>
);

const plane = (style: React.CSSProperties): React.CSSProperties => ({ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", backfaceVisibility: "visible", ...style });

export const ReelView: React.FC<{ reel: Reel }> = ({ reel }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caps = reel.captions;
  const t = frame / fps;
  const W = (i: number) => Math.round(sec(caps, i) * fps);
  const end = endStart(caps, fps);

  // Tiempo de escena: igual al real salvo en las repeticiones ("rebobinar")
  let f = frame;
  let replaying = false;
  for (const r of reel.replays ?? []) {
    if (frame >= W(r.from) && frame < W(r.to)) {
      f = Math.round(r.start * fps + (frame - W(r.from)) * (r.speed ?? 1));
      replaying = true;
    }
  }
  const ts = f / fps;
  const ctx: Ctx = {
    f,
    t: ts,
    fps,
    w: W,
    sp: (i, damping = 12) => (f >= W(i) ? spring({ frame: f - W(i), fps, config: { damping, stiffness: 200 } }) : 0),
    lin: (a, b, from = 0, to = 1) => interpolate(f, [a, b], [from, to], opt),
  };

  // Cámara
  const cams = reel.camera;
  let ck = 0;
  for (let i = 0; i < cams.length; i++) if (f >= W(cams[i].at)) ck = i;
  const c0 = cams[Math.max(0, ck - 1)];
  const c1 = cams[ck];
  const dur = c1.dur ?? 12;
  const cp = ck === 0 ? 1 : interpolate(f, [W(c1.at) - 2, W(c1.at) - 2 + dur], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const mix = (a: number, b: number) => a + (b - a) * cp;
  const drift = Math.sin(ts * 0.7);
  let zoom = mix(c0.zoom, c1.zoom) * (1 + 0.015 * drift);
  const ry = mix(c0.ry ?? 0, c1.ry ?? 0) + 2.2 * drift;
  const rx = mix(c0.rx ?? -8, c1.rx ?? -8);
  const fx = mix(c0.x, c1.x);
  const fy = mix(c0.y, c1.y);
  const fz = mix(c0.z, c1.z);

  // Efectos
  let shake = 0;
  let flash = 0;
  let glitch = 0;
  let dark = 0;
  for (const e of reel.fx ?? []) {
    const d = frame - W(e.at);
    const a = e.amt ?? 1;
    if (d < 0 || d > (e.len ?? 30)) continue;
    if (e.kind === "shake") shake += a * interpolate(d, [0, 2, 4, 6, 8, 10, 12], [0, 22, -18, 12, -7, 3, 0], opt);
    if (e.kind === "flash") flash += a * interpolate(d, [0, 1, 8], [0, 0.9, 0], opt);
    if (e.kind === "punch") zoom *= 1 + 0.16 * a * interpolate(d, [0, 3, 14], [0, 1, 0], opt);
    if (e.kind === "glitch") glitch = Math.max(glitch, a * (d < (e.len ?? 10) ? 1 : 0));
    if (e.kind === "dark") dark = Math.max(dark, a * interpolate(d, [0, 4, (e.len ?? 30) - 4, e.len ?? 30], [0, 1, 1, 0], opt));
  }
  if (replaying) glitch = Math.max(glitch, 0.6);
  // Empuje del primer segundo: el frame 0 ya se mueve
  zoom *= 1 + 0.2 * interpolate(frame, [0, 16], [1, 0], { ...opt, easing: Easing.out(Easing.cubic) });
  const tz = P * (1 - 1 / zoom);
  const gx = glitch > 0 ? (Math.sin(frame * 37) > 0 ? 1 : -1) * 10 * glitch : 0;

  const ti = (() => {
    let k = 0;
    for (let i = 0; i < reel.titles.length; i++) if (frame >= W(reel.titles[i].at)) k = i;
    return k;
  })();
  const titleIn = interpolate(frame, [W(reel.titles[ti].at), W(reel.titles[ti].at) + 6], [0, 1], opt);

  return (
    <AbsoluteFill style={{ background: E.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(237,230,218,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(237,230,218,0.035) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `${-ry * 6}px ${rx * 4}px`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 35%, rgba(0,0,0,0.6) 100%)" }} />

      {/* Maqueta 3D */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: VIEW_TOP,
          width: 1080,
          height: VIEW_H,
          overflow: "hidden",
          perspective: P,
          perspectiveOrigin: "50% 50%",
          filter: glitch > 0 ? `drop-shadow(${gx}px 0 0 rgba(226,72,61,0.7)) drop-shadow(${-gx}px 0 0 rgba(111,183,232,0.7))` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 540 + shake,
            top: VIEW_H / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${-fx}px, ${-fy}px, ${-fz}px)`,
          }}
        >
          {/* Pared del fondo, suelo con grosor y pared lateral */}
          <div style={plane({ width: FW, height: WALL_H, background: reel.wall, transform: `translate3d(${-FW / 2}px, ${-WALL_H}px, ${-FD / 2}px)`, boxShadow: "inset 0 -60px 80px rgba(0,0,0,0.18)" })} />
          <div style={plane({ width: FD, height: WALL_H, background: reel.wall, filter: "brightness(0.82)", transform: `translate3d(${-FW / 2}px, ${-WALL_H}px, ${-FD / 2}px) rotateY(-90deg)`, transformOrigin: "0 0" })} />
          <div
            style={plane({
              width: FW,
              height: FD,
              background: reel.floor,
              backgroundImage: "linear-gradient(rgba(26,22,19,0.08) 3px, transparent 3px), linear-gradient(90deg, rgba(26,22,19,0.08) 3px, transparent 3px)",
              backgroundSize: "100px 100px",
              transform: `translate3d(${-FW / 2}px, 0px, ${-FD / 2}px) rotateX(90deg)`,
            })}
          />
          <div style={plane({ width: FW, height: 60, background: "#2B2622", borderTop: `6px solid ${E.line}`, transform: `translate3d(${-FW / 2}px, 0px, ${FD / 2}px)` })} />

          {reel.items.map((it, k) => (
            <ItemView key={k} it={it} ctx={ctx} />
          ))}
        </div>
        <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
        <AbsoluteFill style={{ background: "#000", opacity: 0.55 * dark, pointerEvents: "none" }} />
        {replaying ? (
          <div style={{ position: "absolute", left: 40, top: 30, fontFamily: MONO, fontSize: 34, color: "#fff", letterSpacing: "0.1em", textShadow: "0 0 10px #000" }}>◀◀ REW</div>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          top: 1190,
          left: 0,
          right: 0,
          height: 22,
          background: E.text,
          backgroundImage: `repeating-linear-gradient(90deg, ${E.line} 0 52px, transparent 52px 90px)`,
          backgroundSize: "90px 10px",
          backgroundRepeat: "repeat-x",
          backgroundPosition: `${-frame * 2}px 6px`,
        }}
      />

      <div style={{ position: "absolute", left: 78, top: 222, opacity: titleIn }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: E.text }}>{reel.titles[ti].title}</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 24, color: E.dim, marginTop: 4 }}>{reel.titles[ti].sub}</div>
      </div>
      <ClockIcon frame={frame} />

      <Captions caps={caps} key2={new Set(reel.key)} t={t} frame={frame} fps={fps} />

      <Sequence name="Cierre" from={end} premountFor={fps}>
        <EndCard />
      </Sequence>

      <Audio src={staticFile(reel.voice)} />
      {cams.slice(1).map((c, k) => (
        <Sequence key={`wh${k}`} name="Whoosh" from={Math.max(0, W(c.at) - 3)} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.18} />
        </Sequence>
      ))}
      {(reel.sfx ?? []).map((s, k) => (
        <Sequence key={`sf${k}`} name={s.src} from={Math.max(0, W(s.at) + (s.offset ?? 0))} durationInFrames={s.len ?? 45} premountFor={fps}>
          <Audio src={staticFile(s.src)} volume={s.vol ?? 0.35} />
        </Sequence>
      ))}
      <Sequence name="Whoosh cierre" from={end - 3} durationInFrames={14} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.25} />
      </Sequence>
    </AbsoluteFill>
  );
};

const ItemView: React.FC<{ it: Item; ctx: Ctx }> = ({ it, ctx }) => {
  const { f, fps, w } = ctx;
  const spr = SPRITES[it.sprite];
  if (!spr) return null;
  const from = it.from === undefined ? -1e9 : w(it.from);
  const to = it.to === undefined ? 1e9 : w(it.to);
  const exit = it.exit ?? "pop";
  const tail = exit === "shatter" ? 22 : exit === "fall" ? 16 : exit === "pop" ? 6 : 0;
  if (f < from || f >= to + tail) return null;
  const dyn = it.fn ? it.fn(ctx) : {};
  const props = { ...(it.props ?? {}), ...dyn };
  let x = dyn.x ?? it.x;
  const z = dyn.z ?? it.z;
  let lift = dyn.lift ?? it.lift ?? 0;
  let s = dyn.scale ?? it.scale ?? 1;
  const tilt = dyn.tilt ?? it.tilt ?? 0;
  let opacity = dyn.opacity ?? 1;

  // Entrada
  const local = f - from;
  const enter = it.from === undefined ? "none" : (it.enter ?? "pop");
  if (enter !== "none") {
    const e = spring({ frame: local, fps, config: { damping: enter === "drop" ? 9 : 12, stiffness: 180 } });
    if (enter === "pop") s *= e;
    if (enter === "drop") lift += (1 - e) * 900;
    if (enter === "rise") lift -= (1 - e) * spr.h * s;
    if (enter === "left") x -= (1 - e) * 900;
    if (enter === "right") x += (1 - e) * 900;
  }
  if (it.float) lift += 10 * Math.sin(ctx.t * 3 + x);
  // Salida
  const out = f - to;
  if (out >= 0) {
    if (exit === "pop") s *= interpolate(out, [0, 6], [1, 0], opt);
    if (exit === "fall") {
      lift -= out * out * 6;
      opacity *= interpolate(out, [8, 16], [1, 0], opt);
    }
    if (exit === "shatter") {
      const p = interpolate(out, [0, tail], [0.02, 1], opt);
      return (
        <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d", transform: `translate3d(${x}px, ${-lift - (spr.h * s) / 2}px, ${z}px)` }}>
          <div style={{ scale: `${s * 1.4}` }}>
            <Shards p={p} />
          </div>
        </div>
      );
    }
    if (exit === "none") return null;
  }
  if (s <= 0.001 || opacity <= 0) return null;

  const C = spr.C;
  const innerSpr = it.inner ? SPRITES[it.inner.sprite] : null;
  const body = (
    <div style={{ position: "relative", width: spr.w, height: spr.h }}>
      <C t={ctx.t} {...props} />
      {it.inner && innerSpr ? (
        <div style={{ position: "absolute", left: 140, top: 98 + (it.inner.dy ?? 0), transform: `translate(-50%, -50%) scale(${it.inner.scale ?? 0.5})` }}>
          <innerSpr.C t={ctx.t} {...(it.inner.props ?? {})} />
        </div>
      ) : null}
    </div>
  );
  const shadow = it.shadow ?? true;
  const shadowW = spr.w * s * 0.8;
  return (
    <>
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: shadowW,
            height: shadowW * 0.32,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 70%)",
            opacity: opacity * interpolate(lift, [0, 400], [1, 0.25], opt),
            transformOrigin: "50% 50%",
            transform: `translate3d(${x - shadowW / 2}px, ${-(shadowW * 0.16)}px, ${z}px) rotateX(90deg)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: spr.w,
          height: spr.h,
          opacity,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 100%",
          transform: `translate3d(${x - spr.w / 2}px, ${-lift - spr.h}px, ${z}px) rotateY(${tilt}deg) scale(${s})`,
        }}
      >
        {/* Canto del recortable: copia oscura detrás para dar grosor */}
        <div style={{ position: "absolute", inset: 0, transform: "translateZ(-9px)", filter: "brightness(0) opacity(0.55)" }}>{body}</div>
        <div style={{ position: "absolute", inset: 0 }}>{body}</div>
      </div>
    </>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const house = interpolate(frame, [4, 10], [0, 1], opt);
  const dot = interpolate(frame, [8, 14], [0, 1], { ...opt, easing: Easing.out(Easing.back(2.5)) });
  return (
    <AbsoluteFill style={{ background: E.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: sIn, paddingBottom: 200 }}>
      <Wordmark size={150} color={E.text} houseOpacity={house} dot={dot} />
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 40, color: E.text, opacity: house }}>edición que retiene</div>
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: "0.08em", color: E.dim, opacity: house }}>ESCRÍBEME «HOOK» POR DM</div>
    </AbsoluteFill>
  );
};

// Tramo final común: el móvil sube al centro de la maqueta con el DM y la burbuja "HOOK"
export const ctaItems = (iStart: number, iHook: number): Item[] => [
  { sprite: "phone", x: 0, z: 200, lift: 40, scale: 1.25, from: iStart, enter: "rise", exit: "none", fn: (c) => ({ screen: "dm", sent: c.sp(iHook, 10) }) },
];
export const ctaCam = (iStart: number): Cam => ({ at: iStart, x: 0, y: -330, z: 200, zoom: 1.7, ry: 0, rx: -4 });
