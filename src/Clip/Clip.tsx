import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/fonts";
import { Audio, Video } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import captionsJson from "../data/captions-clip.json";

// estilo-entrevista.md — estilo de la referencia 2 (entrevista con palabras clave en serif)

const SANS = "Inter";
const SERIF = "EB Garamond";
loadFont({ family: SANS, url: staticFile("fonts/inter-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: SERIF, url: staticFile("fonts/eb-garamond-latin-500-italic.woff2"), weight: "500", style: "italic" });

const GOLD = "#B67928";
const GREEN = "#0E3C32";
const CREAM = "#F4F2EC";

const captions = captionsJson as Caption[];
const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const VIDEO_SECONDS = 14.1; // public/video/clip.mp4 funde a negro en 14,17 s: se congela antes
const TAIL_SECONDS = 0.8; // congelado final para que "Jesus." se lea

export const clipDuration = (fps: number) => Math.round((VIDEO_SECONDS + TAIL_SECONDS) * fps);

const wf = (i: number, fps: number) => Math.round((captions[i].startMs / 1000) * fps);

type Kw = { readonly from: number; readonly to: number; readonly kind: "gold" | "white" | "big" };

// Bloques de subtítulo: una frase o media frase cada uno (estilo-entrevista.md §2)
const BLOCKS: { from: number; to: number; kw?: Kw }[] = [
  { from: 0, to: 2 },
  { from: 3, to: 6, kw: { from: 3, to: 3, kind: "gold" } },
  { from: 7, to: 11, kw: { from: 10, to: 11, kind: "white" } },
  { from: 12, to: 13, kw: { from: 13, to: 13, kind: "gold" } },
  { from: 14, to: 19, kw: { from: 19, to: 19, kind: "white" } },
  { from: 20, to: 27 },
  { from: 28, to: 34 },
  { from: 35, to: 36, kw: { from: 36, to: 36, kind: "gold" } },
  { from: 37, to: 44 },
  { from: 45, to: 45, kw: { from: 45, to: 45, kind: "big" } },
];

// Punch-in al empezar cada bloque: alterna 1,00 / 1,14 (estilo-entrevista.md §6)
const ZOOMS = [1, 1.14, 1, 1.16, 1.04, 1.15, 1, 1.18, 1.06, 1];

const clean = (t: string) => t.replace(/[,]$/, "");

const Word: React.FC<{ i: number; kw?: Kw; last: boolean }> = ({ i, kw, last }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - wf(i, fps);
  const isKw = kw && i >= kw.from && i <= kw.to;
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        opacity: interpolate(local, [0, 5], [0, 1], opt),
        translate: `0px ${interpolate(local, [0, 5], [14, 0], opt)}px`,
        filter: `blur(${interpolate(local, [0, 5], [6, 0], opt)}px)`,
        ...(isKw
          ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: kw.kind === "big" ? 200 : 112, letterSpacing: 0 }
          : {}),
      }}
    >
      {clean(captions[i].text)}
      {last ? "" : " "}
    </span>
  );
};

const Block: React.FC<{ b: (typeof BLOCKS)[number] }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Array.from({ length: b.to - b.from + 1 }, (_, k) => b.from + k);
  const kw = b.kw;
  const before = kw ? idx.filter((i) => i < kw.from) : idx;
  const inside = kw ? idx.filter((i) => i >= kw.from && i <= kw.to) : [];
  const after = kw ? idx.filter((i) => i > kw.to) : [];
  const grow = kw ? interpolate(frame - wf(kw.from, fps), [0, 6], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) }) : 0;
  const box = kw && kw.kind !== "big";

  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        top: kw?.kind === "big" ? 1240 : 930,
        textAlign: "center",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1.12,
        letterSpacing: "-0.01em",
        color: "#FFFFFF",
        textShadow: "0 4px 14px rgba(0,0,0,0.55)",
      }}
    >
      {before.map((i) => (
        <Word key={i} i={i} kw={kw} last={false} />
      ))}
      {kw && inside.length > 0 ? (
        <span style={{ position: "relative", display: "inline-block", padding: box ? "0 0.18em" : 0 }}>
          {box ? (
            <span
              style={{
                position: "absolute",
                inset: "0.12em 0 0.04em 0",
                background: kw.kind === "gold" ? GOLD : CREAM,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                transformOrigin: "left center",
                scale: `${grow} 1`,
              }}
            />
          ) : null}
          <span
            style={{
              position: "relative",
              color: kw.kind === "white" ? GREEN : "#FFFFFF",
              textShadow: kw.kind === "white" ? "none" : "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            {inside.map((i) => (
              <Word key={i} i={i} kw={kw} last={i === kw.to} />
            ))}
          </span>
        </span>
      ) : null}
      {after.length > 0 ? " " : null}
      {after.map((i) => (
        <Word key={i} i={i} kw={kw} last={i === b.to} />
      ))}
    </div>
  );
};

// Lata recortada (foto realista generada con IA) con etiqueta (estilo-entrevista.md §3–4)
const Can: React.FC<{ side: "left" | "right"; label: string }> = ({ side, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 150 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 1120,
        [side]: 90,
        width: 250,
        scale: `${0.6 + 0.4 * s}`,
        rotate: `${(1 - s) * (side === "right" ? 8 : -8) + (side === "right" ? -6 : 6)}deg`,
        opacity: s,
        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
      }}
    >
      <Img src={staticFile("broll/monster.png")} style={{ width: 250, display: "block" }} />
      <div
        style={{
          position: "absolute",
          top: 180,
          [side === "right" ? "right" : "left"]: 270,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexDirection: side === "right" ? "row" : "row-reverse",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 54,
          color: "#FFFFFF",
          whiteSpace: "nowrap",
          textShadow: "0 3px 10px rgba(0,0,0,0.6)",
          opacity: interpolate(frame, [6, 12], [0, 1], opt),
        }}
      >
        {label}
        <span style={{ width: 120, height: 3, background: "#FFFFFF" }} />
      </div>
    </div>
  );
};

// Imán en forma de U para "piss magnets"
const Magnet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 160 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 470,
        left: 760,
        width: 260,
        scale: `${0.6 + 0.4 * s}`,
        rotate: `${(1 - s) * 10 + Math.sin(frame / 4) * 3}deg`,
        opacity: s,
        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
      }}
    >
      <svg viewBox="0 0 200 200" width={260}>
        <path d="M40 30 V110 A60 60 0 0 0 160 110 V30 H120 V110 A20 20 0 0 1 80 110 V30 Z" fill={GOLD} />
        <rect x="40" y="20" width="40" height="34" fill={CREAM} />
        <rect x="120" y="20" width="40" height="34" fill={CREAM} />
        <path d="M28 8 L16 -4 M60 0 L60 -14 M92 8 L104 -4" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" transform="translate(40 4)" />
      </svg>
    </div>
  );
};

export const Clip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const videoEnd = Math.round(VIDEO_SECONDS * fps);

  const starts = BLOCKS.map((b) => Math.max(0, wf(b.from, fps) - 1));
  const current = Math.max(0, starts.filter((s) => s <= frame).length - 1);
  const prevZoom = ZOOMS[Math.max(0, current - 1)];
  const zoom =
    interpolate(frame, [starts[current], starts[current] + 4], [prevZoom, ZOOMS[current]], {
      ...opt,
      easing: Easing.out(Easing.cubic),
    }) + interpolate(frame, [starts[current], starts[current] + 45], [0, 0.02], opt);

  // Layout dividido durante la risa final (estilo-entrevista.md §4): marco redondeado sobre tarjeta verde
  const splitStart = Math.round((captions[44].endMs / 1000) * fps) + 3;
  const p = interpolate(frame, [splitStart, splitStart + 8], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const frameW = interpolate(p, [0, 1], [1080, 842]);
  const frameH = interpolate(p, [0, 1], [1920, 1120]);
  const frameTop = interpolate(p, [0, 1], [0, 150]);

  const video = (
    <Video
      name="Clip"
      src={staticFile("video/clip.mp4")}
      premountFor={fps}
      muted
      objectFit="cover"
      style={{ width: "100%", height: "100%" }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: GREEN }}>
      <div
        style={{
          position: "absolute",
          top: frameTop,
          left: (1080 - frameW) / 2,
          width: frameW,
          height: frameH,
          borderRadius: 40 * p,
          overflow: "hidden",
          boxShadow: p > 0 ? "0 30px 60px rgba(0,0,0,0.45)" : undefined,
        }}
      >
        <AbsoluteFill
          style={{
            scale: `${zoom}`,
            // Gradación dorada cálida (estilo-entrevista.md §7)
            filter: "sepia(0.18) saturate(1.15) contrast(1.06) brightness(1.02)",
          }}
        >
          <Sequence name="Vídeo" durationInFrames={videoEnd} premountFor={fps}>
            {video}
          </Sequence>
          <Sequence name="Congelado final" from={videoEnd - 1} premountFor={fps}>
            <Freeze frame={videoEnd - 2}>
              <Video src={staticFile("video/clip.mp4")} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
            </Freeze>
          </Sequence>
        </AbsoluteFill>
        <AbsoluteFill
          style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }}
        />
      </div>

      <Audio name="Audio del clip" src={staticFile("video/clip.mp4")} />

      <Sequence name="Lata 1" from={wf(3, fps) - 2} durationInFrames={wf(7, fps) - wf(3, fps)} premountFor={fps}>
        <Can side="right" label="energy drink" />
      </Sequence>
      <Sequence name="Imán" from={wf(10, fps) - 2} durationInFrames={wf(12, fps) - wf(10, fps) + 2} premountFor={fps}>
        <Magnet />
      </Sequence>
      <Sequence name="Lata 2" from={wf(35, fps) - 2} durationInFrames={wf(37, fps) - wf(35, fps) + 2} premountFor={fps}>
        <Can side="left" label="energy drink" />
      </Sequence>

      {BLOCKS.map((b, k) => (
        <Sequence
          key={b.from}
          name={`Subtítulo ${k + 1}`}
          from={starts[k]}
          durationInFrames={(k + 1 < BLOCKS.length ? starts[k + 1] : clipDuration(fps)) - starts[k]}
          premountFor={fps}
        >
          <Sequence from={-starts[k]} layout="none">
            <Block b={b} />
          </Sequence>
        </Sequence>
      ))}

      <Sequence name="Whoosh lata" from={wf(3, fps) - 3} durationInFrames={15} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Whoosh imán" from={wf(10, fps) - 3} durationInFrames={15} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Whoosh layout" from={splitStart - 2} durationInFrames={15} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence name="Golpe Jesus" from={wf(45, fps)} durationInFrames={18} premountFor={fps}>
        <Audio src={staticFile("sfx/hit.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
