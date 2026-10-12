import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ChainRow, chainFocusX, chainGeometry, MorphCover, OdometerNumber, PromptCard, StepHeader } from "./animaciones";
import { Model } from "./models";
import {
  Background,
  BigNumber,
  clamp,
  CtaPill,
  Flash,
  HeaderChip,
  headlineHeight,
  headlineLayout,
  headlineSize,
  LIST_PITCH,
  ListCards,
  ProgressBar,
  SAFE,
  SPRINGS,
  Sticker,
  ThemedHeadline,
  useThemeFonts,
  Wipe,
  wordCenters,
} from "./motion";
import type { ThemedProps, ThemedScene } from "./theme";
import { type CameraKey, chainTimeline, cueFrame, followCamera, iconFrame, impactShake, itemFrames, sceneStartFrame, STEP, valueFrame } from "./timeline";

// Vídeo creado con tema según el contenido: fondo animado, icono o modelo animado por escena, titular con
// subtítulos a juego, gráficos por tipo de escena (lista, cifra, llamada a la acción, modelo, cadena, paso, tarjeta
// que escribe), cámara, transiciones y efectos de sonido. Cada pieza entra cuando la voz la nombra. Sin logo de marca.

export const calculateThemeMetadata: CalculateMetadataFunction<ThemedProps> = ({ props }) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
});

const STICKER = { titular: 330, lista: 200, cifra: 220, cta: 220, modelo: 0, cadena: 0, paso: 0, prompt: 0 } as const;
// El titular se reduce cuando el protagonista es otro gráfico
const HEADLINE_SCALE = { titular: 1, lista: 1, cifra: 1, cta: 1, modelo: 1, cadena: 0.85, paso: 0.85, prompt: 0.75 } as const;
const GAP = 46;

// La escena tiene icono grande (el objeto que se transforma entre escenas)
export const hasSticker = (s: ThemedScene) => STICKER[s.component] > 0 && !!s.icon;

const SceneView: React.FC<{
  p: ThemedProps;
  s: ThemedScene;
  start: number;
  end: number;
  ready: boolean;
  morphIn: boolean;
  morphOut: boolean;
  step: { n: number; total: number };
}> = ({ p, s, start, end, ready, morphIn, morphOut, step }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const theme = p.theme;
  const enter = spring({ frame: frame - start, fps, config: SPRINGS[theme.motion] });
  const exit = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const words = p.captions.slice(s.from, s.to + 1);
  const isAccent = (k: number) => !!s.accent && s.from + k >= s.accent[0] && s.from + k <= s.accent[1];
  const accentOpts = { isAccent, font: p.accentFont, scale: p.accentScale };
  const size = Math.round(headlineSize(theme, words, ready, accentOpts) * HEADLINE_SCALE[s.component]);
  const layout = headlineLayout(theme, words, size, ready, accentOpts);

  // Sincronía con la voz: cada pieza entra en la palabra que la nombra
  const cue = (i: number | null | undefined) => cueFrame(p.captions, i, fps);
  const iconAt = iconFrame(start, cue(s.cues.icon));
  const valueAt = valueFrame(start, cue(s.cues.value));
  const itemCues = s.items.map((_, k) => cue(s.cues.items[k]));
  const itemsAt = itemFrames(start, itemCues, s.items.length);
  const chain = s.component === "cadena" && s.items.length >= 2 ? chainTimeline(start + 8, itemCues, s.items.length) : null;
  const geo = chain ? chainGeometry(theme, s.items, ready) : null;
  const sticker = hasSticker(s);

  // Alto aproximado de cada bloque (arriba, titular, abajo) para que la cámara sepa dónde está cada cosa
  const promptFs = s.body.length > 110 ? 38 : s.body.length > 70 ? 44 : 52;
  const top = s.component === "modelo" ? 600 : s.component === "paso" ? 355 : s.component === "prompt" ? 215 + promptFs * 1.3 * Math.max(2, Math.ceil(s.body.length / 26)) : sticker ? STICKER[s.component] : 0;
  const head = layout ? headlineHeight(layout) : size * 1.08 * 2;
  const bottom =
    s.component === "lista" ? s.items.length * 116 + (s.items.length - 1) * 22 : s.component === "cifra" ? 344 : s.component === "cta" ? (p.pointerIcon ? 338 : 190) : geo ? geo.height : 0;
  const total = top + head + bottom + GAP * ((top ? 1 : 0) + (bottom ? 1 : 0));
  const y0 = SAFE.top + (height - SAFE.top - SAFE.bottom - total) / 2 - height / 2;
  const topC = y0 + top / 2;
  const headC = y0 + (top ? top + GAP : 0) + head / 2;
  const bottomTop = y0 + (top ? top + GAP : 0) + head + GAP;

  // Cámara: acercamiento lento durante la escena; «sigue» además acompaña lo que está pasando
  const sigue = theme.camera === "sigue";
  const keys: CameraKey[] = [];
  if (sigue) {
    // Se mueve una parte de la distancia y con tope: lo importante se acerca al centro sin salirse del margen seguro
    const k = (at: number, x: number, y: number) => keys.push({ at, x: Math.max(-30, Math.min(30, -x * 0.25)), y: Math.max(-80, Math.min(80, -y * 0.3)) });
    if (top) k(start, 0, topC);
    if (s.component === "paso") k(start + STEP.box, 200, topC);
    if (layout) {
      const centers = wordCenters(layout);
      words.forEach((w, i) => k(Math.round((w.startMs / 1000) * fps) - 2, centers[i].x, headC + centers[i].y));
    }
    if (s.component === "lista") itemsAt.forEach((at, i) => k(at, 0, bottomTop + i * LIST_PITCH + 58));
    if (s.component === "cifra" || s.component === "cta") k(valueAt, 0, bottomTop + bottom / 2);
    if (chain && geo) {
      const by = bottomTop + bottom / 2;
      k(chain.tIn, chainFocusX(chain.tIn + 10, chain, geo), by);
      for (let i = 1; i < s.items.length; i++) k(chain.hits[i], geo.xs[i] + geo.widths[i] / 2 - geo.total / 2, by);
    }
  }
  const cam = sigue ? followCamera(frame, keys) : { x: 0, y: 0 };
  const shake = sigue && chain ? impactShake(frame, chain.hits.slice(1)) : 0;
  const push = interpolate(frame, [start, end], [1, 1.06], clamp);
  const punch = theme.motion === "energico" ? interpolate(spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 170 } }), [0, 1], [1.18, 1]) : 1;
  // Con «transforma» la cubierta hace la entrada y la salida: la escena no se desvanece
  const fadeIn = morphIn ? 1 : Math.min(1, enter * 1.3);
  const enterY = morphIn ? 0 : (1 - enter) * 70;
  const exitK = morphOut ? 1 : exit;
  return (
    <AbsoluteFill
      style={{
        boxSizing: "border-box",
        padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
        justifyContent: "center",
        gap: GAP,
        opacity: fadeIn * (theme.motion === "suave" && !morphOut ? exit : 1),
        transform: `translate(${cam.x + shake}px, ${cam.y + enterY}px) scale(${(0.97 + 0.03 * exitK) * push * punch})`,
      }}
    >
      {s.component === "modelo" ? (
        <Model kind={s.label} value={s.value} theme={theme} enter={start + 2} ready={ready} />
      ) : s.component === "paso" ? (
        <StepHeader theme={theme} n={step.n} total={step.total} title={s.label} word={s.body} enter={start + 2} ready={ready} />
      ) : s.component === "prompt" ? (
        <PromptCard theme={theme} text={s.body} name={s.label} start={start} end={end} />
      ) : sticker ? (
        <Sticker
          theme={theme}
          src={p.icons[s.icon!]}
          size={STICKER[s.component]}
          enter={start + 2}
          iconAt={morphIn ? Math.max(iconAt, start + 6) : iconAt}
          morphIn={morphIn ? start : null}
          morphOut={morphOut ? end : null}
        />
      ) : null}
      <ThemedHeadline theme={theme} caps={p.captions} from={s.from} to={s.to} accent={s.accent} size={size} accentFont={p.accentFont} accentScale={p.accentScale} layout={layout} start={start} />
      {s.component === "lista" && s.items.length ? (
        <ListCards theme={theme} items={s.items} icons={s.items.map((_, k) => (s.itemIcons[k] ? p.icons[s.itemIcons[k]] : null))} enters={itemsAt} />
      ) : null}
      {s.component === "cifra" && s.value ? (
        theme.counter === "odometro" && /\d/.test(s.value) ? (
          <OdometerNumber theme={theme} value={s.value} label={s.label} enter={valueAt} ready={ready} />
        ) : (
          <BigNumber theme={theme} value={s.value} label={s.label} enter={valueAt} />
        )
      ) : null}
      {s.component === "cta" && s.value ? (
        <CtaPill theme={theme} text={s.value} enter={valueAt} pointer={p.pointerIcon ? p.icons[p.pointerIcon] : null} ready={ready} />
      ) : null}
      {chain && geo ? <ChainRow theme={theme} items={s.items} icons={s.items.map((_, k) => (s.itemIcons[k] ? p.icons[s.itemIcons[k]] : null))} tl={chain} g={geo} /> : null}
    </AbsoluteFill>
  );
};

export const AutopilotTheme: React.FC<ThemedProps> = (p) => {
  const { fps } = useVideoConfig();
  const ready = useThemeFonts(p.theme.font, p.accentFont);
  const starts = p.scenes.map((s) => sceneStartFrame(p.captions[s.from].startMs, fps));
  const morph = p.theme.sceneTransition === "transforma";
  const last = p.scenes.length - 1;
  // Pasos numerados solos: «PASO 2 DE 5»
  const totalSteps = p.scenes.filter((s) => s.component === "paso").length;
  return (
    <AbsoluteFill>
      <Background theme={p.theme} icons={p.icons} bgIcons={p.bgIcons} />
      {p.audioSrc ? <Audio src={p.audioSrc} /> : null}
      {p.scenes.map((s, k) => {
        const from = starts[k];
        const to = k < last ? starts[k + 1] : p.durationInFrames;
        const step = { n: p.scenes.slice(0, k + 1).filter((x) => x.component === "paso").length, total: totalSteps };
        return (
          <Sequence key={k} name={`Escena ${k + 1} · ${s.component}`} from={from} durationInFrames={Math.max(1, to - from)} premountFor={fps}>
            <Sequence from={-from} layout="none">
              <SceneView p={p} s={s} start={from} end={to} ready={ready} morphIn={morph && k > 0} morphOut={morph && k < last} step={step} />
            </Sequence>
          </Sequence>
        );
      })}
      {starts.slice(1).map((at, k) =>
        morph ? (
          <MorphCover key={k} theme={p.theme} at={at} grow={!hasSticker(p.scenes[k])} shrink={!hasSticker(p.scenes[k + 1])} />
        ) : p.theme.sceneTransition === "destello" ? (
          <Flash key={k} theme={p.theme} at={at} />
        ) : (
          <Wipe key={k} theme={p.theme} at={at} />
        ),
      )}
      {p.sfx.map((e, i) => (
        <Sequence key={`sfx${i}`} name={`Efecto · ${e.name}`} from={e.frame} durationInFrames={Math.round(fps * 1.5)} layout="none">
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
      <HeaderChip theme={p.theme} text={p.headerLabel} />
      <ProgressBar theme={p.theme} />
    </AbsoluteFill>
  );
};
