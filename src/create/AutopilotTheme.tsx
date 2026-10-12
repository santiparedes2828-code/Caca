import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Model } from "./models";
import { Background, BigNumber, clamp, CtaPill, Flash, HeaderChip, headlineSize, ListCards, ProgressBar, SAFE, SPRINGS, Sticker, ThemedHeadline, useThemeFonts, Wipe } from "./motion";
import type { ThemedProps, ThemedScene } from "./theme";

// Vídeo creado con tema según el contenido: fondo animado, icono o modelo animado por escena, titular con
// subtítulos a juego, gráficos por tipo de escena (lista, cifra, llamada a la acción, modelo), cámara con
// zoom, transiciones y efectos de sonido. Sin logo de marca.

export const calculateThemeMetadata: CalculateMetadataFunction<ThemedProps> = ({ props }) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
});

const STICKER = { titular: 330, lista: 200, cifra: 220, cta: 220, modelo: 0 } as const;

const SceneView: React.FC<{ p: ThemedProps; s: ThemedScene; start: number; end: number; ready: boolean }> = ({ p, s, start, end, ready }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = p.theme;
  const enter = spring({ frame: frame - start, fps, config: SPRINGS[theme.motion] });
  const exit = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const words = p.captions.slice(s.from, s.to + 1);
  const isAccent = (k: number) => !!s.accent && s.from + k >= s.accent[0] && s.from + k <= s.accent[1];
  const size = headlineSize(theme, words, ready, { isAccent, font: p.accentFont, scale: p.accentScale });
  const after = start + 10;
  // Cámara: acercamiento lento durante la escena y, en los temas enérgicos, un golpe de zoom al entrar
  const push = interpolate(frame, [start, end], [1, 1.06], clamp);
  const punch = theme.motion === "energico" ? interpolate(spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 170 } }), [0, 1], [1.18, 1]) : 1;
  return (
    <AbsoluteFill
      style={{
        boxSizing: "border-box",
        padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
        justifyContent: "center",
        gap: 46,
        opacity: Math.min(1, enter * 1.3) * (theme.motion === "suave" ? exit : 1),
        transform: `translateY(${(1 - enter) * 70}px) scale(${(0.97 + 0.03 * exit) * push * punch})`,
      }}
    >
      {s.component === "modelo" ? (
        <Model kind={s.label} value={s.value} theme={theme} enter={start + 2} ready={ready} />
      ) : s.icon ? (
        <Sticker theme={theme} src={p.icons[s.icon]} size={STICKER[s.component]} enter={start + 2} />
      ) : null}
      <ThemedHeadline theme={theme} caps={p.captions} from={s.from} to={s.to} accent={s.accent} size={size} accentFont={p.accentFont} accentScale={p.accentScale} />
      {s.component === "lista" && s.items.length ? (
        <ListCards theme={theme} items={s.items} icons={s.items.map((_, k) => (s.itemIcons[k] ? p.icons[s.itemIcons[k]] : null))} enter={after} />
      ) : null}
      {s.component === "cifra" && s.value ? <BigNumber theme={theme} value={s.value} label={s.label} enter={after} /> : null}
      {s.component === "cta" && s.value ? (
        <CtaPill theme={theme} text={s.value} enter={after} pointer={p.pointerIcon ? p.icons[p.pointerIcon] : null} ready={ready} />
      ) : null}
    </AbsoluteFill>
  );
};

export const AutopilotTheme: React.FC<ThemedProps> = (p) => {
  const { fps } = useVideoConfig();
  const ready = useThemeFonts(p.theme.font, p.accentFont);
  const starts = p.scenes.map((s) => Math.max(0, Math.round((p.captions[s.from].startMs / 1000) * fps) - 4));
  return (
    <AbsoluteFill>
      <Background theme={p.theme} icons={p.icons} bgIcons={p.bgIcons} />
      {p.audioSrc ? <Audio src={p.audioSrc} /> : null}
      {p.scenes.map((s, k) => {
        const from = starts[k];
        const to = k + 1 < p.scenes.length ? starts[k + 1] : p.durationInFrames;
        return (
          <Sequence key={k} name={`Escena ${k + 1} · ${s.component}`} from={from} durationInFrames={Math.max(1, to - from)} premountFor={fps}>
            <Sequence from={-from} layout="none">
              <SceneView p={p} s={s} start={from} end={to} ready={ready} />
            </Sequence>
          </Sequence>
        );
      })}
      {starts.slice(1).map((at, k) => (p.theme.sceneTransition === "destello" ? <Flash key={k} theme={p.theme} at={at} /> : <Wipe key={k} theme={p.theme} at={at} />))}
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
