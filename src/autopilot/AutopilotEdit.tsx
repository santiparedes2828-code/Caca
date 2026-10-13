import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useBrandFonts } from "../design/fonts";
import { INTENSITY } from "../design/intensity";
import { Captions } from "./Captions";
import { Graphics } from "./Graphics";
import { cutZoomKeys, emphasisPunch, fitVideo, focusAt, zoomSegments } from "./geometry";
import { Broll, Music, SoundEffects } from "./Overlays";
import type { EditProps } from "./props";

// Edición automática de material del cliente: tramos del vídeo encadenados (cortes no destructivos),
// reencuadre que sigue a la cara, zoom según intensidad y subtítulos de marca.
// Todas las decisiones llegan ya calculadas por props; aquí solo se dibujan.

export const calculateEditMetadata: CalculateMetadataFunction<EditProps> = ({
  props,
}) => ({
  durationInFrames: props.durationInFrames,
  fps: props.fps,
  width: props.width,
  height: props.height,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Fundido de audio en los cortes internos (2 fotogramas) para que no haya chasquidos
const CUT_FADE_FRAMES = 2;

const useZoom = (props: EditProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const z = INTENSITY[props.intensity].zoom;
  if (z.mode === "none" || z.amount === 0) return 1;
  const t = (frame / fps) * 1000;
  if (z.mode === "cortes") {
    // Vídeos hablados: nivel alterno en cada corte (instantáneo: esconde el salto) o frase (suave), deriva lenta
    // dentro del tramo y un golpe suave en las palabras clave
    let acc = 0;
    const cutsMs = props.video.segments.map((s) => {
      const at = (acc / fps) * 1000;
      acc += s.durationInFrames;
      return at;
    });
    const keys = cutZoomKeys(cutsMs, props.captions.pages, (durationInFrames / fps) * 1000, z.minSecondsBetween);
    const i = Math.max(0, keys.findIndex((k) => t >= k.startMs && t < k.endMs));
    const k = keys[i];
    const level = (j: number) => (keys[j].level ? 1 + z.amount : 1);
    const f0 = (k.startMs / 1000) * fps;
    const base = k.cut || i === 0 ? level(i) : interpolate(frame, [f0, f0 + z.transitionFrames], [level(i - 1), level(i)], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    const drift = 1 + 0.025 * interpolate(t, [k.startMs, k.endMs], [0, 1], clamp);
    return base * drift * (1 + 0.04 * emphasisPunch(props.captions.pages, frame, fps, z.minSecondsBetween));
  }
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
    { ...clamp, easing: Easing.out(Easing.cubic) },
  );
};

const useFocus = (props: EditProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return focusAt(props.focusTrack, (frame / fps) * 1000, {
    x: props.reframe.focusX,
    y: props.reframe.focusY,
  });
};

// Encadena los tramos del vídeo fuente
const Segments: React.FC<{
  props: EditProps;
  contain: boolean;
  muted: boolean;
  style?: React.CSSProperties;
}> = ({ props, contain, muted, style }) => {
  const { width, height, fps } = useVideoConfig();
  const v = props.video;
  const focus = useFocus(props);
  const box = fitVideo(
    v.width,
    v.height,
    width,
    height,
    { focusX: focus.x, focusY: focus.y },
    contain,
  );
  let from = 0;
  return (
    <>
      {v.segments.map((seg, k) => {
        const start = from;
        from += seg.durationInFrames;
        const fadeIn = k > 0;
        const fadeOut = k < v.segments.length - 1;
        return (
          <Sequence
            key={k}
            from={start}
            durationInFrames={seg.durationInFrames}
            premountFor={fps}
            name={`Tramo ${k + 1}`}
          >
            <OffthreadVideo
              src={v.src}
              trimBefore={seg.srcStartFrame > 0 ? seg.srcStartFrame : undefined}
              muted={muted || !v.hasAudio}
              volume={(f) =>
                v.volume *
                (fadeIn
                  ? interpolate(f, [0, CUT_FADE_FRAMES], [0, 1], clamp)
                  : 1) *
                (fadeOut
                  ? interpolate(
                      f,
                      [
                        seg.durationInFrames - CUT_FADE_FRAMES,
                        seg.durationInFrames,
                      ],
                      [1, 0],
                      clamp,
                    )
                  : 1)
              }
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                ...style,
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};

export const AutopilotEdit: React.FC<EditProps> = (props) => {
  const fontsReady = useBrandFonts(props.brand);
  const zoom = useZoom(props);
  const focus = useFocus(props);
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
          <Segments
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
            transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
          }}
        >
          <Segments
            props={props}
            contain={reframe.mode !== "cover"}
            muted={false}
          />
        </AbsoluteFill>
      ) : null}
      <Broll overlays={props.overlays} brand={brand} />
      <Graphics graphics={props.graphics} brand={brand} fontsReady={fontsReady} icons={props.icons} />
      {props.music ? <Music music={props.music} /> : null}
      {props.sfx.length ? <SoundEffects sfx={props.sfx} /> : null}
      <Captions
        pages={props.captions.pages}
        mode={props.captions.mode}
        brand={brand}
        intensity={props.intensity}
        fontsReady={fontsReady}
        icons={props.icons}
        light={props.graphics.filter((g) => !(g.kind === "concepto" && g.modo === "tarjeta"))}
      />
    </AbsoluteFill>
  );
};
