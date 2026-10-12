import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { B } from "../HookHouse/brand";
import { Badge, CtaBox, ListRow, Logo, Wordmark } from "../HookHouse/graphics";
import { CaptionsCtx, Headline, Mono, opt } from "../HookHouse/text";
import type { CreateProps, Scene } from "./props";

// Vídeo creado desde un guion: una escena por bloque del guion, con el titular cinético de Hook House
// (palabras que entran al sonar), un componente validado debajo y el logo de cierre.
// Reutiliza los componentes de src/HookHouse (misma identidad que el motion graphic original).

export const calculateCreateMetadata: CalculateMetadataFunction<
  CreateProps
> = ({ props }) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
});

const headlineSize = (words: number) =>
  words <= 5 ? 150 : words <= 9 ? 128 : words <= 13 ? 110 : 96;

const Component: React.FC<{ s: Scene; start: number; end: number }> = ({
  s,
  start,
  end,
}) => {
  if (s.component === "lista") {
    const step = Math.max(6, Math.floor((end - start) / (s.items.length + 1)));
    return (
      <>
        {s.items.map((it, k) => (
          <ListRow
            key={k}
            letter={String.fromCharCode(65 + k)}
            text={it}
            start={start + step * (k + 1)}
            top={900 + k * 150}
          />
        ))}
      </>
    );
  }
  if (s.component === "cifra") {
    return (
      <Badge start={start + 6} label={s.label} value={s.value} top={980} />
    );
  }
  if (s.component === "cta") {
    return <CtaBox start={start + 6} text={s.value} top={1000} />;
  }
  return null;
};

const SceneView: React.FC<{ s: Scene; next: number | null }> = ({
  s,
  next,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caps = React.useContext(CaptionsCtx);
  const start = Math.max(
    0,
    Math.round((caps[s.from].startMs / 1000) * fps) - 3,
  );
  const end =
    next ?? Math.round((caps[s.to].endMs / 1000) * fps) + Math.round(0.4 * fps);
  const dim = interpolate(frame, [end - 6, end], [1, 0.3], opt);
  const words = s.to - s.from + 1;
  return (
    <AbsoluteFill style={{ opacity: dim }}>
      <Headline
        from={s.from}
        to={s.to}
        accent={s.accent ?? undefined}
        size={headlineSize(words)}
        top={s.component === "titular" ? 620 : 420}
        underline={s.component === "titular" && !!s.accent}
      />
      <Component s={s} start={start} end={end} />
    </AbsoluteFill>
  );
};

export const AutopilotCreate: React.FC<CreateProps> = (props) => {
  const { fps } = useVideoConfig();
  const caps = props.captions;
  const startOf = (s: Scene) =>
    Math.max(0, Math.round((caps[s.from].startMs / 1000) * fps) - 3);
  const logoStart =
    props.durationInFrames - Math.round(props.logoSeconds * fps);
  return (
    <CaptionsCtx.Provider value={caps}>
      <AbsoluteFill style={{ background: B.bg }}>
        {props.audioSrc ? <Audio src={props.audioSrc} /> : null}
        <div
          style={{
            position: "absolute",
            top: 160,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Wordmark size={36} />
          <Mono size={22}>{props.headerLabel}</Mono>
        </div>
        {props.scenes.map((s, k) => {
          const from = startOf(s);
          const nextStart =
            k + 1 < props.scenes.length
              ? startOf(props.scenes[k + 1])
              : logoStart;
          return (
            <Sequence
              key={k}
              name={`Escena ${k + 1} · ${s.component}`}
              from={from}
              durationInFrames={Math.max(1, nextStart - from)}
              premountFor={fps}
            >
              <Sequence from={-from} layout="none">
                <SceneView s={s} next={nextStart} />
              </Sequence>
            </Sequence>
          );
        })}
        {props.logoSeconds > 0 ? (
          <Sequence from={logoStart} name="Logo">
            <Sequence from={-logoStart} layout="none">
              <AbsoluteFill style={{ background: B.bg }}>
                <Logo start={logoStart} />
              </AbsoluteFill>
            </Sequence>
          </Sequence>
        ) : null}
      </AbsoluteFill>
    </CaptionsCtx.Provider>
  );
};
