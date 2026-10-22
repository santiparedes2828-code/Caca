import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../data/words-podcast.json";
import { BRoll, Editorial, GLIDE, GRADE, Grain, Orb, Plate, PodcastCaptions, S, SANS, SERIF, Soft, Vignette, ease, phrases, softCut, type SWord } from "./kit";

// Demo del ESTUDIO HOOKHOUSE (estilo-estudio.md) sobre el clip de podcast.
// Apertura en frío con la frase más fuerte · subtítulos de podcast (Inter + Garamond italic) · dos láminas de motion
// graphics sobre papel blanco · b-roll real a pantalla completa cuando haya imágenes en BROLL · todo suave.

const FPS = 30;
const words = wordsJson as { text: string; s: number; e: number }[];
const SEGS: [number, number][] = [
  [16.7, 20.12],
  [0.0, 6.3],
  [6.75, 10.35],
  [12.0, 26.2],
];
const segStart = SEGS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (SEGS[i - 1][1] - SEGS[i - 1][0])], []);
export const PODCAST_STUDIO_FRAMES = Math.round((segStart[SEGS.length - 1] + SEGS[SEGS.length - 1][1] - SEGS[SEGS.length - 1][0]) * FPS) + 12;
const OUT: SWord[] = SEGS.flatMap((seg, k) => words.filter((w) => w.s >= seg[0] - 0.02 && w.e <= seg[1] + 0.05).map((w) => ({ text: w.text, os: segStart[k] + w.s - seg[0], oe: segStart[k] + w.e - seg[0], seg: k })));
const KEYS = new Set(["broke", "rich", "lives", "alive", "times", "story", "events", "life", "varied"]);
const HOT = new Set(["rich", "varied"]); // retoque naranja: como mucho una palabra cada pocos segundos
const PH = phrases(OUT, KEYS);
const CUTS = segStart.slice(1).map((s) => Math.round(s * FPS));

// B-roll real (imágenes con licencia en public/broll/podcast/). Vacío = esas tomas se quedan en la lámina.
const BROLL: Record<"fighter" | "webcam" | "broke" | "rich", string | null> = { fighter: null, webcam: null, broke: null, rich: null };

const at = (text: string, seg: number, from = 0) => {
  const w = OUT.filter((o) => o.seg === seg).find((o) => o.os >= from && o.text.toLowerCase().startsWith(text));
  return w ? Math.round(w.os * FPS) : 0;
};
const focusAt = (src: number) => (src >= 7.74 && src < 17.45 ? { cx: 0.205, cy: 0.45, z: 1.55 } : { cx: 0.47, cy: 0.5, z: 1.0 });

const Clip: React.FC<{ k: number }> = ({ k }) => {
  const lf = useCurrentFrame();
  const seg = SEGS[k];
  const fo = focusAt(seg[0] + lf / FPS);
  const dur = (seg[1] - seg[0]) * FPS;
  const z = fo.z * (1 + 0.04 * (lf / dur)); // único efecto del plano: acercamiento lento
  const H = 1920 * z;
  const Wd = H * (16 / 9);
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <OffthreadVideo src={staticFile("portfolio/podcast_raw.mp4")} trimBefore={Math.round(seg[0] * FPS)} trimAfter={Math.round(seg[1] * FPS)} muted style={{ position: "absolute", height: H, width: Wd, left: 540 - fo.cx * Wd, top: 960 - fo.cy * H, maxWidth: "none", filter: GRADE }} />
    </AbsoluteFill>
  );
};

export const PodcastStudio: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = PODCAST_STUDIO_FRAMES;

  // Lámina 1: "many different LIVES"
  const many = at("many", 1);
  const lives = at("lives", 1);
  const l1 = { from: many + 4, to: at("i", 1, lives / FPS) + 16 };
  // Lámina 2: las cuatro vidas (sustituye a los subtítulos mientras está)
  const rows = [
    { n: "01", text: "fighter", at: at("professional", 3), img: BROLL.fighter },
    { n: "02", text: "webcam owner", at: at("webcam", 3), img: BROLL.webcam },
    { n: "03", text: "broke", at: at("broke", 3), img: BROLL.broke },
    { n: "04", text: "rich", at: at("rich", 3), img: BROLL.rich },
  ];
  const l2 = { from: rows[0].at - 14, to: rows[3].at + 34 };
  const prog = rows.reduce((acc, r) => acc + ease(f, r.at - 2, r.at + 12, 0, 1, GLIDE), 0);
  const cur = rows.reduce((c, r, i) => (f >= r.at - 2 ? i : c), -1);
  const sc = softCut(f, CUTS);
  const hideCaps = (fr: number) => (fr > l1.from - 6 && fr < l1.to + 6) || (fr > l2.from - 6 && fr < l2.to + 6);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: `blur(${sc.blur}px) brightness(${sc.dim})` }}>
        {SEGS.map((s, k) => (
          <Sequence key={k} from={Math.round(segStart[k] * FPS)} durationInFrames={Math.round((s[1] - s[0]) * FPS) + (k === SEGS.length - 1 ? 12 : 0)}>
            <Clip k={k} />
          </Sequence>
        ))}
        <Vignette />
        <Grain />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 75%, rgba(0,0,0,0.15) 100%)" }} />
      </AbsoluteFill>

      {/* B-roll a pantalla completa en cada vida (solo si hay imagen real) */}
      {rows.map((r, i) => (r.img ? <BRoll key={i} f={f} from={r.at - 4} to={(rows[i + 1]?.at ?? r.at + 40) - 4} src={r.img} dir={i % 2 ? -1 : 1} /> : null))}

      {/* Lámina 1 */}
      <Plate f={f} from={l1.from} to={l1.to}>
        <Editorial f={f} y={560} small={[{ text: "many", at: many - 2 }, { text: "different", at: at("different", 1) - 2 }]} big="lives" bigAt={lives - 2} />
        {[0, 1, 2, 3].map((k) => {
          const x = 260 + k * 187;
          const y = 1130 - Math.sin((k / 3) * Math.PI) * 120;
          return <Orb key={k} x={x} y={y} r={k === 3 ? 62 : 46} p={ease(f, lives + k * 4, lives + k * 4 + 14)} color={k === 3 ? S.orange : S.ink} />;
        })}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d="M260 1130 C 420 940, 660 940, 821 1130" stroke={S.orange} strokeWidth={5} fill="none" strokeDasharray="900" strokeDashoffset={900 * (1 - ease(f, lives + 2, lives + 26, 0, 1, GLIDE))} strokeLinecap="round" />
        </svg>
      </Plate>

      {/* Lámina 2: índice de las cuatro vidas */}
      <Plate f={f} from={l2.from} to={l2.to}>
        <div style={{ position: "absolute", left: 72, right: 72, top: 300, textAlign: "center" }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, letterSpacing: "-0.03em", color: S.ink, opacity: ease(f, l2.from, l2.from + 10) }}>he&apos;s lived </span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 104, letterSpacing: "-0.03em", color: S.ink, opacity: ease(f, l2.from + 4, l2.from + 14) }}>
            4 <span style={{ color: S.orange }}>lives</span>
          </span>
        </div>
        {/* línea de progreso naranja que baja hasta la vida actual */}
        <div style={{ position: "absolute", left: 150, top: 640, width: 5, borderRadius: 3, background: S.orange, height: 60 * Math.min(1, prog) + 200 * Math.max(0, prog - 1) }} />
        {rows.map((r, i) => {
          const p = ease(f, r.at - 2, r.at + 10);
          const past = i < cur;
          return (
            <div key={i} style={{ position: "absolute", left: 190, top: 620 + i * 200, display: "flex", alignItems: "center", gap: 34, opacity: p * (past ? 0.32 : 1), filter: `blur(${(1 - p) * 10}px)`, transform: `translateY(${(1 - p) * 16}px)` }}>
              {r.img ? <Img src={staticFile(r.img)} style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 10, boxShadow: "18px 26px 40px rgba(17,17,16,0.28)", filter: GRADE }} /> : null}
              <div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, letterSpacing: "0.08em", color: S.orange }}>{r.n}</div>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 84, lineHeight: 0.95, letterSpacing: "-0.03em", textTransform: "uppercase", whiteSpace: "nowrap", color: S.ink }}>{r.text}</div>
              </div>
            </div>
          );
        })}
      </Plate>

      <PodcastCaptions list={PH} f={f} fps={fps} hide={hideCaps} hot={HOT} />

      {/* Fundido final */}
      <AbsoluteFill style={{ background: "#000", opacity: ease(f, end - 14, end - 2, 0, 1, GLIDE) }} />

      {SEGS.map((s, k) => (
        <Sequence key={`a${k}`} from={Math.round(segStart[k] * FPS)} durationInFrames={Math.round((s[1] - s[0]) * FPS)}>
          <Audio src={staticFile("portfolio/podcast_raw.mp4")} trimBefore={Math.round(s[0] * FPS)} trimAfter={Math.round(s[1] * FPS)} />
        </Sequence>
      ))}
      <Audio src={staticFile("sfx/cama.wav")} volume={(fr) => 0.07 * ease(fr, 0, 20) * (1 - ease(fr, end - 30, end))} />
      <Soft at={0} src="sfx/studio/soft_riser.wav" vol={0.18} />
      <Soft at={l1.from - 8} />
      <Soft at={l1.to - 2} vol={0.25} />
      <Soft at={l2.from - 8} />
      <Soft at={l2.to - 2} vol={0.25} />
    </AbsoluteFill>
  );
};
