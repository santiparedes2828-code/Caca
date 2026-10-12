import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, BigNumber, clamp, CtaPill, HeaderChip, headlineSize, ListCards, ProgressBar, SAFE, SPRINGS, Sticker, ThemedHeadline, useThemeFonts, Wipe } from "./motion";
import type { ThemedProps, ThemedScene } from "./theme";

// Vídeo creado con tema según el contenido: fondo animado, icono por escena, titular con subtítulos a
// juego, gráficos por tipo de escena (lista, cifra, llamada a la acción) y transiciones. Sin logo de marca.

export const calculateThemeMetadata: CalculateMetadataFunction<ThemedProps> = ({ props }) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
});

const STICKER = { titular: 330, lista: 200, cifra: 220, cta: 220 } as const;

const SceneView: React.FC<{ p: ThemedProps; s: ThemedScene; start: number; end: number; ready: boolean }> = ({ p, s, start, end, ready }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = p.theme;
  const enter = spring({ frame: frame - start, fps, config: SPRINGS[theme.motion] });
  const exit = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const words = p.captions.slice(s.from, s.to + 1);
  const size = headlineSize(theme, words, ready);
  const after = start + 10;
  return (
    <AbsoluteFill
      style={{
        boxSizing: "border-box",
        padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
        justifyContent: "center",
        gap: 46,
        opacity: Math.min(1, enter * 1.3) * (theme.motion === "suave" ? exit : 1),
        transform: `translateY(${(1 - enter) * 70}px) scale(${0.97 + 0.03 * exit})`,
      }}
    >
      {s.icon ? <Sticker theme={theme} src={p.icons[s.icon]} size={STICKER[s.component]} enter={start + 2} /> : null}
      <ThemedHeadline theme={theme} caps={p.captions} from={s.from} to={s.to} accent={s.accent} size={size} />
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
  const ready = useThemeFonts(p.theme.font);
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
      {starts.slice(1).map((at, k) => (
        <Wipe key={k} theme={p.theme} at={at} />
      ))}
      <HeaderChip theme={p.theme} text={p.headerLabel} />
      <ProgressBar theme={p.theme} />
    </AbsoluteFill>
  );
};
