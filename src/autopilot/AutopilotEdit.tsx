import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useBrandFonts } from "../design/fonts";
import { INTENSITY } from "../design/intensity";
import type { Reframe } from "../design/schema";
import { Captions } from "./Captions";
import type { CaptionPage, EditProps } from "./props";

// Edición automática de material del cliente: vídeo reencuadrado al formato de salida + subtítulos de marca.
// Todas las decisiones (formato, tiempos, páginas de subtítulos) llegan ya calculadas por props.

export const calculateEditMetadata: CalculateMetadataFunction<EditProps> = ({
  props,
}) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
  width: props.width,
  height: props.height,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Posición y escala del vídeo fuente dentro del lienzo según el modo de reencuadre
export const fitVideo = (
  vw: number,
  vh: number,
  W: number,
  H: number,
  r: Reframe,
  contain: boolean,
) => {
  const s = contain ? Math.min(W / vw, H / vh) : Math.max(W / vw, H / vh);
  const w = vw * s;
  const h = vh * s;
  const x = contain
    ? (W - w) / 2
    : Math.min(0, Math.max(W - w, W / 2 - r.focusX * w));
  const y = contain
    ? (H - h) / 2
    : Math.min(0, Math.max(H - h, H / 2 - r.focusY * h));
  return { x, y, w, h };
};

// Tramos de zoom: empiezan con una página de subtítulos y duran al menos minSecondsBetween
export const zoomSegments = (
  pages: CaptionPage[],
  minSeconds: number,
  totalMs: number,
) => {
  const starts: number[] = [0];
  for (const p of pages) {
    if (p.startMs - starts[starts.length - 1] >= minSeconds * 1000)
      starts.push(p.startMs);
  }
  return starts.map((s, i) => ({
    startMs: s,
    endMs: i + 1 < starts.length ? starts[i + 1] : totalMs,
  }));
};

const useZoom = (props: EditProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const z = INTENSITY[props.intensity].zoom;
  if (z.mode === "none" || z.amount === 0) return 1;
  const t = (frame / fps) * 1000;
  const segs = zoomSegments(
    props.captions.pages,
    z.minSecondsBetween,
    (durationInFrames / fps) * 1000,
  );
  const i = Math.max(
    0,
    segs.findIndex((s) => t >= s.startMs && t < s.endMs),
  );
  const seg = segs[i];
  if (z.mode === "drift") {
    // Alterna acercar/alejar para que no haya saltos entre tramos
    const p = interpolate(t, [seg.startMs, seg.endMs], [0, 1], clamp);
    return 1 + z.amount * (i % 2 === 0 ? p : 1 - p);
  }
  const level = (k: number) => (k % 2 === 0 ? 1 : 1 + z.amount);
  const f0 = (seg.startMs / 1000) * fps;
  return interpolate(
    frame,
    [f0, f0 + z.transitionFrames],
    [level(i - 1 < 0 ? 0 : i - 1), level(i)],
    {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    },
  );
};

const SourceVideo: React.FC<{
  props: EditProps;
  contain: boolean;
  muted: boolean;
  style?: React.CSSProperties;
}> = ({ props, contain, muted, style }) => {
  const { width, height } = useVideoConfig();
  const v = props.video;
  const box = fitVideo(
    v.width,
    v.height,
    width,
    height,
    props.reframe,
    contain,
  );
  return (
    <OffthreadVideo
      src={v.src}
      trimBefore={v.trimStartFrames > 0 ? v.trimStartFrames : undefined}
      muted={muted || !v.hasAudio}
      volume={v.volume}
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        ...style,
      }}
    />
  );
};

export const AutopilotEdit: React.FC<EditProps> = (props) => {
  const fontsReady = useBrandFonts(props.brand);
  const zoom = useZoom(props);
  const { reframe, brand } = props;
  const hasVideo = props.video.src !== "";

  return (
    <AbsoluteFill
      style={{
        backgroundColor:
          reframe.mode === "contain" ? brand.colors.bg : brand.colors.ink,
      }}
    >
      {hasVideo && reframe.mode === "blur-fill" ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <SourceVideo
            props={props}
            contain={false}
            muted
            style={{ filter: "blur(40px) brightness(0.6)", scale: "1.1" }}
          />
        </AbsoluteFill>
      ) : null}
      {hasVideo ? (
        <AbsoluteFill
          style={{
            overflow: "hidden",
            scale: `${zoom}`,
            transformOrigin: `${reframe.focusX * 100}% ${reframe.focusY * 100}%`,
          }}
        >
          <SourceVideo
            props={props}
            contain={reframe.mode !== "cover"}
            muted={false}
          />
        </AbsoluteFill>
      ) : null}
      <Captions
        pages={props.captions.pages}
        mode={props.captions.mode}
        brand={brand}
        intensity={props.intensity}
        fontsReady={fontsReady}
      />
    </AbsoluteFill>
  );
};
