import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import wordsJson from "../data/words-podcast.json";
import { A, Paper } from "../Altera/system";
import { FRAMING, Finish, GRADE, HangCard, LineCaptions, Sfx, StackCard, YankRope, punchAt, sentenceIndex, yankOffset, type CutWord } from "./kit";

// Demo del CORTE HOOKHOUSE sobre el clip de podcast (estilo-corte.md).
// formula-viral: abre con la frase más fuerte ("broke… rich") colgada de la línea; la respuesta (las 4 vidas) se
// cuenta con tarjetas que se apilan; cierre con pregunta para comentarios.

const FPS = 30;
const words = wordsJson as { text: string; s: number; e: number }[];
const SEGS: [number, number][] = [
  [16.7, 20.12],
  [0.0, 6.3],
  [6.75, 10.35],
  [12.0, 26.2],
];
const segStart = SEGS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (SEGS[i - 1][1] - SEGS[i - 1][0])], []);
export const PODCAST_CUT_FRAMES = Math.round((segStart[SEGS.length - 1] + SEGS[SEGS.length - 1][1] - SEGS[SEGS.length - 1][0]) * FPS);
const OUT: CutWord[] = SEGS.flatMap((seg, k) => words.filter((w) => w.s >= seg[0] - 0.02 && w.e <= seg[1] + 0.05).map((w) => ({ text: w.text, os: segStart[k] + w.s - seg[0], oe: segStart[k] + w.e - seg[0], seg: k })));
const SENT = sentenceIndex(OUT);
const KEYS = new Set(["lives", "alive", "fighter", "webcam", "broke", "rich", "varied", "life"]);
const CUTS = segStart.map((s) => Math.round(s * FPS));
const YANKS = [CUTS[1], CUTS[3]]; // los dos tirones del vídeo

// Plano general del original (7,74–17,45 s) recortado sobre él
const focusAt = (src: number) => (src >= 7.74 && src < 17.45 ? { cx: 0.205, cy: 0.45, z: 1.55 } : { cx: 0.47, cy: 0.5, z: 1.0 });
const at = (text: string, seg: number) => {
  const w = OUT.find((o) => o.text.toLowerCase().startsWith(text) && o.seg === seg);
  return w ? Math.round(w.os * FPS) : 0;
};

const Clip: React.FC<{ k: number }> = ({ k }) => {
  const lf = useCurrentFrame();
  const seg = SEGS[k];
  const f = CUTS[k] + lf;
  const t = f / FPS;
  const src = seg[0] + lf / FPS;
  const fo = focusAt(src);
  // Encuadre A/B alterno por frase
  let wi = 0;
  for (let i = 0; i < OUT.length; i++) if (OUT[i].os <= t) wi = i;
  const framing = SENT[wi] % 2 === 0 ? FRAMING.A : FRAMING.B;
  const z = fo.z * (framing + FRAMING.punch * punchAt(t, OUT, KEYS) + FRAMING.drift * (lf / FPS / 10));
  const H = 1920 * z;
  const Wd = H * (16 / 9);
  // Tirón de salida
  const cutEnd = k + 1 < CUTS.length ? CUTS[k + 1] : Infinity;
  const yo = YANKS.includes(cutEnd) ? yankOffset(f, cutEnd) : { x: 0, rot: 0, p: 0 };
  return (
    <AbsoluteFill style={{ transform: `translateX(${yo.x}px) rotate(${yo.rot}deg)`, transformOrigin: "100% 40%", boxShadow: yo.p > 0 ? "0 40px 80px rgba(14,13,11,0.5)" : undefined, overflow: "hidden", background: A.ink }}>
      <OffthreadVideo src={staticFile("portfolio/podcast_raw.mp4")} trimBefore={Math.round(seg[0] * FPS)} trimAfter={Math.round(seg[1] * FPS)} muted style={{ position: "absolute", height: H, width: Wd, left: 540 - fo.cx * Wd, top: 960 - fo.cy * H, maxWidth: "none", filter: GRADE }} />
      <Finish />
    </AbsoluteFill>
  );
};

export const PodcastCut: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const end = PODCAST_CUT_FRAMES;
  const lives = [at("professional", 3), at("webcam", 3), at("broke", 3), at("rich", 3)];
  const ask = end - 70;

  return (
    <Paper>
      {SEGS.map((s, k) => (
        <Sequence key={k} from={CUTS[k]} durationInFrames={Math.round((s[1] - s[0]) * FPS)}>
          <Clip k={k} />
        </Sequence>
      ))}
      {YANKS.map((c) => (
        <YankRope key={c} f={f} cut={c} fps={fps} />
      ))}

      {/* Apertura: la frase gancho colgada de la línea; sale con el primer tirón */}
      <HangCard f={f} fps={fps} at={-6} out={CUTS[1] - 9}>
        he&apos;s lived <span style={{ color: A.orange }}>4 lives</span>
      </HangCard>
      {/* Las 4 vidas: tarjetas que se apilan (número, no la palabra: el subtítulo ya la dice) */}
      {lives.map((a, k) => (
        <StackCard key={k} f={f} fps={fps} at={a} until={lives[3] + 55} k={k} label="LIFE" text={`0${k + 1}`} hot={k === 3} />
      ))}
      {/* Cierre: pregunta para comentarios */}
      <HangCard f={f} fps={fps} at={ask} out={end + 20} rot={2}>
        which one would <span style={{ color: A.orange }}>you</span> pick?
      </HangCard>

      <LineCaptions words={OUT} t={t} f={f} fps={fps} keys={KEYS} />

      {SEGS.map((s, k) => (
        <Sequence key={`a${k}`} from={CUTS[k]} durationInFrames={Math.round((s[1] - s[0]) * FPS)}>
          <Audio src={staticFile("portfolio/podcast_raw.mp4")} trimBefore={Math.round(s[0] * FPS)} trimAfter={Math.round(s[1] * FPS)} />
        </Sequence>
      ))}
      <Audio src={staticFile("sfx/cama.wav")} volume={0.05} />
      <Sfx at={0} kind="impacto" vol={0.8} />
      <Sfx at={0} kind="tension" vol={0.35} />
      {YANKS.map((c) => (
        <Sfx key={c} at={c - 9} kind="tiron" vol={0.75} />
      ))}
      {lives.map((a, k) => (
        <Sfx key={k} at={a + 4} kind="impacto" vol={k === 3 ? 0.8 : 0.5} />
      ))}
      <Sfx at={ask + 5} kind="impacto" vol={0.6} />
    </Paper>
  );
};

