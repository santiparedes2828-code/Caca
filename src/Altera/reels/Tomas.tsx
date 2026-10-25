import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { FLOOR, ScreenRope, Snd, Stage, type RopeSpec } from "../reelkit";
import { A, Captions, FONT, LABEL, Paper, SOUND, fall, impact, lin } from "../system";
import { Tag } from "./Error1";

// «Cuatro tomas, una frase» — ajuste del video 5 del calendario con el mecanismo situación común → incógnita → tensión
// (subida hecha con nuestro sonido de tensión) → corte a silencio → resolución → cómo se hizo (2026-10-25).
// Hookie graba «Hola, les presento mi nuevo podcast» y se traba en las 4 tomas. Con su línea saca un trozo de cada toma
// y arma la frase limpia: 4 tomas → 4 trozos → 3 cortes. El audio de la frase limpia está montado de verdad con esos
// trozos (public/audio/tomas/limpia.wav, receta en produccion/tomas/armar_frase.sh). EJEMPLO CREADO PARA ESTE VIDEO.

const F = (s: number) => Math.round(s * 30);
export const TOMAS_FRAMES = F(15.4);

// ---------- tiempos (s) ----------
// Apertura (v2, 2026-10-25): las tomas 1–3 ya fallaron; en el fotograma 0 Hookie estornuda en la toma 4 y tira el celular.
// Frase de situación → la línea saca un trozo de cada toma mientras sube el riser → corte seco a silencio → frase limpia.
const TAKE_ERRORS = ["(se ríe)", "mi nue… mi nue…", "(tos)", "(achís)"]; // cómo falló cada toma (grabadas en voz_full.wav)
const SNEEZE = 0.05;
const N0 = { at: 0.45, words: [["Grabaste", 0.02], ["cuatro", 0.66], ["tomas", 1.06], ["y", 1.66], ["no", 1.86], ["salió", 2.1], ["ninguna.", 2.58]] as const, end: 3.57 };
const N2 = { at: 3.65, words: [["Pero", 0], ["tienen", 0.24], ["todo", 0.64], ["lo", 0.96], ["que", 1.08], ["necesito.", 1.2]] as const, end: 5.58 };
const HOOK_LINE = 3.75; // lanza la línea
const CHIP_AT = [4.15, 4.55, 4.95, 5.35]; // un trozo de cada toma cae en la tira
const RISE = { from: 0.45, to: 6.4 }; // riser_hh.wav (5,95 s): sube bajo la voz y termina seco en el corte
const CLEAN = { at: 6.6, dur: 2.515, cuts: [0.57, 1.2, 1.805] }; // revelación: frase montada con 4 trozos, 3 cortes
const CLEAN_WORDS = [["Hola.", 0], ["Les", 0.57], ["presento", 0.8], ["mi", 1.2], ["nuevo", 1.33], ["podcast.", 1.805]] as const;
const REVEAL = { at: 9.4, tomas: 9.44, cortes: 10.56, frase: 11.68, end: 12.5 };
const N4 = { at: 12.7, words: [["La", 0.04], ["próxima,", 0.2], ["grabá", 1.08], ["tranquilo.", 1.48]] as const, end: 15.0 };
const PIECES = ["Hola.", "les presento", "mi nuevo", "podcast."];
const VOICE: [number, number][] = [
  [N0.at, N0.end],
  [N2.at, N2.end],
];

// ---------- utilería ----------
const Clapper: React.FC<{ x: number; y: number; n: number; open: number; drop: number }> = ({ x, y, n, open, drop }) => (
  <svg width={280} height={220} viewBox="0 0 280 220" style={{ position: "absolute", left: x - 140, top: y - 110 + drop * 1500, overflow: "visible", opacity: 1 - drop, transform: `rotate(${drop * 25}deg)` }}>
    <g transform={`rotate(${-28 * open} 12 58)`}>
      <rect x={10} y={30} width={260} height={30} rx={6} fill={A.ink} />
      {[0, 1, 2, 3, 4].map((k) => (
        <polygon key={k} points={`${30 + k * 52},30 ${56 + k * 52},30 ${40 + k * 52},60 ${14 + k * 52},60`} fill="#FBF8F2" />
      ))}
    </g>
    <rect x={10} y={62} width={260} height={150} rx={10} fill={A.ink} />
    <text x={140} y={155} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={56} fill="#FBF8F2" letterSpacing="-2">
      TOMA {n}
    </text>
  </svg>
);

const Tripod: React.FC<{ tilt: number; rec: boolean }> = ({ tilt, rec }) => {
  const x = 800;
  const top = FLOOR - 330;
  return (
    <>
      <svg width={300} height={400} style={{ position: "absolute", left: x - 150, top: top, overflow: "visible" }}>
        <line x1={150} y1={40} x2={80} y2={330} stroke={A.ink} strokeWidth={10} strokeLinecap="round" />
        <line x1={150} y1={40} x2={220} y2={330} stroke={A.ink} strokeWidth={10} strokeLinecap="round" />
        <line x1={150} y1={40} x2={150} y2={330} stroke={A.ink} strokeWidth={8} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: x - 42, top: top - 120, width: 84, height: 150, borderRadius: 16, background: A.ink, transformOrigin: "50% 100%", transform: `rotate(${tilt}deg)` }}>
        <div style={{ position: "absolute", left: 30, top: 18, width: 24, height: 24, borderRadius: 12, background: rec ? A.orange : "#4A4640" }} />
      </div>
    </>
  );
};

const TakeCard: React.FC<{ x: number; y: number; n: number; p: number; hooked: boolean; t: number }> = ({ x, y, n, p, hooked, t }) => (
  <div style={{ position: "absolute", left: x - 95, top: y - 65 - (1 - p) * 700, width: 190, height: 130, borderRadius: 18, background: "#FBF8F2", border: `6px solid ${hooked ? A.orange : A.ink}`, boxShadow: "0 14px 22px rgba(14,13,11,0.22)", overflow: "hidden", transform: `rotate(${(n % 2 ? -1 : 1) * 3 * (1 - p)}deg)` }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 6, textAlign: "center", fontFamily: LABEL, fontSize: 26, color: A.ink }}>TOMA {n}</div>
    <div style={{ position: "absolute", left: 0, top: 0, width: 190, height: 130 }}>
      <Gancho x={95} y={128} scale={0.17} t={t} expr="squashed" armL={40} armR={40} />
    </div>
    <svg width={190} height={130} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={125} y1={52} x2={165} y2={92} stroke={A.ink} strokeWidth={8} strokeLinecap="round" />
      <line x1={165} y1={52} x2={125} y2={92} stroke={A.ink} strokeWidth={8} strokeLinecap="round" />
    </svg>
  </div>
);
const CARD_X = [170, 380, 590, 800];
const CARD_Y = 470;

const CHIP_FONT = 34;
const chipW = (s: string) => Math.round(s.length * CHIP_FONT * 0.6 + 38);
const STRIP_Y = 1390;
const slotX = (() => {
  const ws = PIECES.map(chipW);
  const total = ws.reduce((a, b) => a + b, 0) + 3 * 8;
  let x = 72 + (858 - total) / 2;
  return ws.map((w) => {
    const c = x + w / 2;
    x += w + 8;
    return c;
  });
})();
const Chip: React.FC<{ text: string; x: number; y: number; hot?: boolean; buzz?: number }> = ({ text, x, y, hot, buzz = 0 }) => (
  <div style={{ position: "absolute", left: x - chipW(text) / 2, top: y - 32 + buzz, width: chipW(text), height: 64, borderRadius: 32, background: hot ? A.ink : "#FBF8F2", color: hot ? A.ivory : A.ink, border: `5px solid ${A.ink}`, boxSizing: "border-box", fontFamily: FONT, fontWeight: 800, fontSize: CHIP_FONT, letterSpacing: "-0.03em", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}>
    {text}
  </div>
);

// habla de Hookie a partir de los tiempos de cada palabra
const SPEECH: [number, number][] = [
  [N0.at, N0.end],
  [N2.at, N2.end],
  [CLEAN.at, CLEAN.at + CLEAN.dur],
  [REVEAL.at, REVEAL.end],
  [N4.at, N4.end],
];
const talkAt = (t: number) => (SPEECH.some(([a, b]) => t >= a && t < b) ? 0.35 + 0.65 * Math.abs(Math.sin(t * 27)) : 0);
const wordsFrom = (at: number, ws: readonly (readonly [string, number])[]) => ws.map(([text, o]) => ({ text, at: F(at + o) }));

export const Tomas: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const inScene = t < RISE.to || t >= N4.at - 0.2;

  // ---------- Hookie ----------
  let g: GanchoPose = { x: 330, y: FLOOR, scale: 0.9, t, talk: 0, expr: "squashed", armL: 30, armR: 150, look: { x: 1, y: 0 }, squash: 0.55 * impact(f - F(SNEEZE) - 2) };
  let rope: RopeSpec = null;
  if (t >= N0.at - 0.1) g = { ...g, expr: "squashed", armR: 40, armL: 30, look: { x: -0.3, y: 0.4 }, squash: 0 }; // avergonzado, mira a cámara
  if (t >= N2.at - 0.15 && t < RISE.to) {
    g = { ...g, expr: t < HOOK_LINE ? "surprised" : t < CHIP_AT[3] + 0.3 ? "smug" : "strain", look: { x: 0.4, y: -1 }, armR: 120, armL: 50, lean: t >= CHIP_AT[3] + 0.3 ? -14 : 0 };
    if (t >= HOOK_LINE) {
      g = { ...g, hookOut: true };
      const k = CHIP_AT.findIndex((c) => t < c + 0.05);
      if (k >= 0) {
        rope = { screen: true, bx: CARD_X[k], by: CARD_Y + 60, slack: lin(t, k === 0 ? HOOK_LINE : CHIP_AT[k - 1], CHIP_AT[k], 0.5, 0.05), buzz: 0.3 };
      } else {
        const kk = lin(t, CHIP_AT[3] + 0.05, RISE.to, 0, 1);
        rope = { screen: true, bx: slotX[3] + chipW(PIECES[3]) / 2 - 10, by: STRIP_Y - 20, slack: 0.04, buzz: 0.3 + 1.4 * kk };
      }
    }
  }
  if (t >= N4.at - 0.2) g = { ...g, expr: "happy", armL: 150, armR: 40 + 30 * Math.sin(t * 6), look: { x: 1, y: -0.2 }, hookOut: false, lean: 0, squash: 0 };
  g = { ...g, talk: talkAt(t) };

  const hookedCard = t >= HOOK_LINE && t < RISE.to ? CHIP_AT.findIndex((c) => t < c + 0.05) : -1;
  const strainBuzz = t >= CHIP_AT[3] && t < RISE.to ? Math.sin(t * 90) * 5 * lin(t, CHIP_AT[3], RISE.to) : 0;
  const cleanOn = t >= RISE.to && t < REVEAL.at;
  const revealOn = t >= REVEAL.at && t < N4.at - 0.2;
  const question = t >= N2.at - 0.1;

  return (
    <Paper>
      {inScene ? (
        <>
          {/* situación → incógnita */}
          {t < RISE.to ? (
            <div style={{ position: "absolute", left: 72, top: 230, fontFamily: FONT, fontWeight: 800, fontSize: question ? 80 : 96, lineHeight: 1, letterSpacing: "-0.045em", color: A.ink, transform: `scale(${1 + 0.08 * impact(f - F(N2.at - 0.1))})`, transformOrigin: "0 50%" }}>
              {question ? (
                <>
                  ¿4 TOMAS → <span style={{ color: A.orange }}>1 FRASE</span>?
                </>
              ) : (
                <>
                  <span style={{ color: A.orange }}>4</span> TOMAS
                </>
              )}
            </div>
          ) : null}
          {t < RISE.to
            ? [0, 1, 2, 3].map((i) =>
                i < 3 || t >= SNEEZE + 0.4 ? <TakeCard key={i} x={CARD_X[i]} y={CARD_Y} n={i + 1} p={i < 3 ? 1 : fall(f - F(SNEEZE + 0.4), fps)} hooked={hookedCard === i} t={t} /> : null,
              )
            : null}
          {t < N0.at ? <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: A.ink }}>{TAKE_ERRORS[3]}</div> : null}
          <AbsoluteFill>
            <Stage>
              <Tripod tilt={t >= SNEEZE && t < RISE.to ? -18 * Math.min(1, (t - SNEEZE) * 6) : 0} rec={Math.floor(t * 2) % 2 === 0} />
              <Gancho {...g} />
            </Stage>
            <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
          </AbsoluteFill>
          {t < 0.7 ? <Clapper x={640} y={860} n={4} open={0} drop={lin(t, 0.25, 0.65, 0, 1, (x) => x * x)} /> : null}
          {t < RISE.to
            ? PIECES.map((p, i) => {
                if (t < CHIP_AT[i] - 0.25) return null;
                const k = lin(t, CHIP_AT[i] - 0.25, CHIP_AT[i], 0, 1, (x) => x * x);
                return <Chip key={i} text={p} x={CARD_X[i] + (slotX[i] - CARD_X[i]) * k} y={CARD_Y + (STRIP_Y - CARD_Y) * k} buzz={strainBuzz} />;
              })
            : null}
          {t >= N0.at - 0.05 && t < RISE.to ? <Captions words={t >= N2.at - 0.05 ? wordsFrom(N2.at, N2.words) : wordsFrom(N0.at, N0.words)} f={f} fps={fps} top={640} size={64} keys={[]} /> : null}
          {t >= N4.at - 0.2 ? <Captions words={wordsFrom(N4.at, N4.words)} f={f} fps={fps} top={640} size={64} keys={[]} /> : null}
        </>
      ) : null}

      {cleanOn ? <CleanView t={t} /> : null}
      {revealOn ? <Reveal t={t} f={f} /> : null}

      {/* audio */}
      <Sequence from={F(SNEEZE)}>
        <Audio src={staticFile("audio/tomas/achis.wav")} />
      </Sequence>
      <Snd at={0} src={SOUND.impacto} vol={0.35} />
      <Sequence from={F(N0.at)}>
        <Audio src={staticFile("audio/tomas/n0.wav")} />
      </Sequence>
      <Sequence from={F(N2.at)}>
        <Audio src={staticFile("audio/tomas/n2.wav")} />
      </Sequence>
      {/* riser propio: bajo la voz se agacha; sin voz sube entero; termina seco en el corte */}
      <Sequence from={F(RISE.from)} durationInFrames={F(RISE.to) - F(RISE.from)}>
        <Audio
          src={staticFile("sfx/hh/riser_hh.wav")}
          volume={(fr) => {
            const tt = RISE.from + fr / 30;
            // distancia a la voz más cercana: 0,45 bajo la voz, sube a 1 en 0,15 s fuera de ella
            const d = Math.min(...VOICE.map(([a, b]) => (tt < a ? a - tt : tt > b ? tt - b : 0)));
            // bajo la voz el riser queda ~6–8 dB por debajo de ella (su propio nivel crece, así que se baja más con el tiempo)
            const under = interpolate(tt, [0.45, 2.0, 3.0, 4.15, 5.05], [1, 0.8, 0.57, 0.4, 0.21], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return under + (1 - under) * Math.min(1, d / 0.15);
          }}
        />
      </Sequence>
      <Sequence from={F(CLEAN.at)}>
        <Audio src={staticFile("audio/tomas/limpia.wav")} />
      </Sequence>
      <Sequence from={F(REVEAL.at)}>
        <Audio src={staticFile("audio/tomas/n3.wav")} />
      </Sequence>
      <Sequence from={F(N4.at)}>
        <Audio src={staticFile("audio/tomas/n4.wav")} />
      </Sequence>
      {[REVEAL.cortes, REVEAL.cortes + 0.25, REVEAL.cortes + 0.5].map((c) => (
        <Snd key={c} at={F(c)} src={SOUND.impacto} vol={0.3} />
      ))}
      <Snd at={F(REVEAL.frase)} src={SOUND.tiron} vol={0.7} />
    </Paper>
  );
};

// la frase editada: 4 trozos, 3 cortes con cambio de encuadre (como se disimulan en un video a cámara)
const CleanView: React.FC<{ t: number }> = ({ t }) => {
  const f = Math.round(t * 30);
  const local = t - CLEAN.at;
  const seg = CLEAN.cuts.filter((c) => local >= c).length; // 0..3
  const zoom = seg % 2 ? 1.14 : 1;
  const g: GanchoPose = { x: 540, y: 1330, scale: 1.55, t, talk: talkAt(t), expr: "happy", armL: 30, armR: seg === 3 ? 120 : 40, look: { x: 0, y: 0 } };
  return (
    <AbsoluteFill>
      <Tag text="La versión editada" y={250} />
      <div style={{ position: "absolute", left: 140, top: 310, width: 800, height: 1150, borderRadius: 56, border: `10px solid ${A.ink}`, overflow: "hidden", background: "#FBF8F2" }}>
        <div style={{ position: "absolute", left: -140, top: -310, width: 1080, height: 1920, transformOrigin: "540px 900px", transform: `scale(${zoom})` }}>
          <Gancho {...g} />
        </div>
        <div style={{ position: "absolute", left: 28, top: 26, width: 22, height: 22, borderRadius: 11, background: A.orange }} />
        <div style={{ position: "absolute", left: -101, top: 0, width: 1080, height: 400 }}>
          <Captions words={wordsFrom(CLEAN.at, CLEAN_WORDS)} f={f} fps={30} top={90} size={70} keys={[5]} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Reveal: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const { fps } = useVideoConfig();
  const rows = PIECES.map((p, i) => ({ p, i }));
  const merge = lin(t, REVEAL.frase, REVEAL.frase + 0.35, 0, 1, (x) => x * x);
  const g: GanchoPose = { x: 300, y: FLOOR, scale: 0.6, t, talk: talkAt(t), expr: t >= REVEAL.frase ? "strain" : "smug", armR: 120, armL: 40, hookOut: t >= REVEAL.frase - 0.3 && t < REVEAL.frase + 0.4, lean: t >= REVEAL.frase ? -10 : 0, look: { x: 1, y: -1 } };
  const rope: RopeSpec = g.hookOut ? { screen: true, bx: 520, by: 900, slack: lin(t, REVEAL.frase - 0.3, REVEAL.frase, 0.5, 0.05), buzz: 0.5 } : null;
  const count = (label: string, at: number) => (t >= at ? <span style={{ display: "inline-block", transform: `scale(${1 + 0.1 * impact(f - Math.round(at * 30))})` }}>{label}</span> : null);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 72, top: 236, fontFamily: FONT, fontWeight: 800, fontSize: 72, lineHeight: 1.05, letterSpacing: "-0.04em", color: A.ink }}>
        {count("4 tomas", REVEAL.tomas)} {count("· 3 cortes", REVEAL.cortes)}{" "}
        <span style={{ color: A.orange }}>{count("· 1 frase", REVEAL.frase)}</span>
      </div>
      {merge < 1
        ? rows.map(({ p, i }) => {
            const y = 470 + i * 118;
            const yy = y + (840 - y) * merge;
            const p0 = spring({ frame: f - Math.round((REVEAL.tomas + i * 0.12) * 30), fps, config: { damping: 13, stiffness: 260 } });
            return (
              <div key={i} style={{ position: "absolute", left: 72, top: yy, width: 858, height: 96, display: "flex", alignItems: "center", gap: 22, opacity: Math.min(1, p0 * 1.5) * (1 - merge), transform: `translateX(${(1 - p0) * -80}px)` }}>
                <div style={{ width: 210, fontFamily: LABEL, fontSize: 36, color: A.ink }}>TOMA {i + 1}</div>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 62, letterSpacing: "-0.04em", color: A.ink }}>{p}</div>
              </div>
            );
          })
        : null}
      {/* los 3 cortes entre los 4 trozos */}
      {merge < 1
        ? [0, 1, 2].map((k) =>
            t >= REVEAL.cortes + k * 0.25 ? (
              <div key={k} style={{ position: "absolute", left: 72, top: 470 + (k + 1) * 118 - 13, width: 858 * Math.min(1, (t - REVEAL.cortes - k * 0.25) * 6), height: 8, borderRadius: 4, background: A.orange, opacity: 1 - merge }} />
            ) : null,
          )
        : null}
      {t >= REVEAL.frase ? (
        <div style={{ position: "absolute", left: 72, top: 790, width: 858, fontFamily: FONT, fontWeight: 800, fontSize: 70, lineHeight: 1.05, letterSpacing: "-0.04em", color: A.ink, opacity: merge, transform: `scale(${1 + 0.06 * impact(f - Math.round((REVEAL.frase + 0.35) * 30))})`, transformOrigin: "0 50%" }}>
          Hola. Les presento mi nuevo podcast.
        </div>
      ) : null}
      <Stage>
        <Gancho {...g} />
      </Stage>
      <ScreenRope from={antennaWorld(g)} rope={rope} t={t} />
    </AbsoluteFill>
  );
};

// ---------- portada ----------
export const TomasPortada: React.FC = () => {
  const g: GanchoPose = { x: 330, y: FLOOR, scale: 0.9, t: 2.3, expr: "squashed", armL: 30, armR: 150, look: { x: 1, y: 0 } };
  return (
    <Paper>
      <div style={{ position: "absolute", left: 72, top: 260, fontFamily: FONT, fontWeight: 800, fontSize: 170, lineHeight: 0.95, letterSpacing: "-0.05em", color: A.ink }}>
        <div>
          <span style={{ color: A.orange }}>4</span> TOMAS
        </div>
        <div style={{ fontSize: 92, marginTop: 18 }}>ninguna salió bien</div>
      </div>
      {CARD_X.map((x, i) => (
        <TakeCard key={i} x={x} y={640} n={i + 1} p={1} hooked={false} t={1} />
      ))}
      <AbsoluteFill>
        <Stage>
          <Tripod tilt={0} rec />
          <Gancho {...g} />
        </Stage>
      </AbsoluteFill>
      <Clapper x={640} y={900} n={4} open={0} drop={0} />
    </Paper>
  );
};
