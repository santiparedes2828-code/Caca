import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import {
  BoardGraphic,
  CardsGraphic,
  ChartGraphic,
  ChatBubble,
  ClockGraphic,
  EyeFollowGraphic,
  GearsGraphic,
  TimelineGraphic,
  UploadGraphic,
} from "./graphics";
import { Words, captions, wordFrame } from "./Kinetic";
import { GraphicZone, Petals, Scene, SmallPrint, TextZone } from "./Scene";
import { C, WHIP } from "./theme";

// Primera palabra de cada escena (índices de src/data/captions.json) y tipo de entrada.
// guion.md tiene la tabla escena por escena.
const SCENES = [
  { first: 0, enter: "cut" },
  { first: 11, enter: "whip" },
  { first: 21, enter: "whip" },
  { first: 25, enter: "cut" }, // corte seco a negro para el reencuadre (estilo.md §5)
  { first: 34, enter: "whip" },
  { first: 38, enter: "whip" },
  { first: 50, enter: "whip" },
  { first: 60, enter: "whip" },
  { first: 65, enter: "cut" },
  { first: 72, enter: "whip" },
] as const;

// Palabras destacadas: cada una lleva un golpe sonoro (estilo.md §8)
const HITS = [7, 17, 30, 37, 47, 58, 70, 73];

const TAIL_SECONDS = 1.2; // el CTA se queda en pantalla tras la última palabra

export const promoDuration = (fps: number) =>
  Math.ceil((captions[captions.length - 1].endMs / 1000 + TAIL_SECONDS) * fps);

const useTimeline = () => {
  const { fps } = useVideoConfig();
  const total = promoDuration(fps);
  // El corte cae 2 frames antes de la primera palabra de la escena
  const cuts = SCENES.map((s) => Math.max(0, wordFrame(s.first, fps) - 2));
  return SCENES.map((s, i) => {
    const from = cuts[i] - (s.enter === "whip" ? WHIP : 0);
    const end = i + 1 < SCENES.length ? cuts[i + 1] : total;
    return {
      from,
      duration: end - from,
      enter: s.enter,
      exit: (i + 1 < SCENES.length ? SCENES[i + 1].enter : "cut") as "whip" | "cut",
    };
  });
};

export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useTimeline();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene name="1 · Gancho" {...t[0]} bg="light">
        <Petals />
        <SmallPrint />
        <TextZone>
          <Words from={0} to={6} font="script" size={84} color={C.ink} />
          <Words from={7} to={10} font="bold" size={110} color={C.ink} hl={{ from: 7, to: 8, kind: "box" }} />
        </TextZone>
        <GraphicZone>
          <ChartGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="2 · Dolor" {...t[1]} bg="dark">
        <TextZone>
          <Words from={11} to={14} font="script" size={92} color={C.paper} />
          <Words from={15} to={20} font="bold" size={96} color={C.paper} hl={{ from: 17, to: 19, kind: "glow" }} />
        </TextZone>
        <GraphicZone>
          <ClockGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="3 · Tareas" {...t[2]} bg="light">
        <TextZone>
          <Words from={21} to={24} font="bold" size={100} color={C.ink} />
        </TextZone>
        <GraphicZone>
          <TimelineGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="4 · Reencuadre" {...t[3]} bg="black">
        <TextZone bottom={1080}>
          <Words from={25} to={29} font="script" size={100} color={C.paper} />
          <Words from={30} to={33} font="bold" size={112} color={C.paper} hl={{ from: 30, to: 33, kind: "glow" }} />
        </TextZone>
      </Scene>

      <Scene name="5 · Solución" {...t[4]} bg="light">
        <TextZone>
          <Words from={34} to={35} font="script" size={96} color={C.ink} />
          <Words from={36} to={37} font="bold" size={140} color={C.ink} hl={{ from: 37, to: 37, kind: "box" }} />
        </TextZone>
        <GraphicZone>
          <GearsGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="6 · Proceso" {...t[5]} bg="dark">
        <TextZone>
          <Words from={38} to={42} font="script" size={90} color={C.paper} />
          <Words from={43} to={49} font="bold" size={92} color={C.paper} hl={{ from: 47, to: 49, kind: "glow" }} />
        </TextZone>
        <GraphicZone>
          <UploadGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="7 · Retención" {...t[6]} bg="light">
        <Petals flip />
        <TextZone>
          <Words from={50} to={54} font="script" size={90} color={C.ink} />
          <Words from={55} to={59} font="bold" size={104} color={C.ink} hl={{ from: 58, to: 59, kind: "box" }} />
        </TextZone>
        <GraphicZone>
          <EyeFollowGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="8 · Para quién" {...t[7]} bg="dark">
        <TextZone>
          <Words from={60} to={60} font="script" size={110} color={C.paper} />
          <Words from={61} to={64} font="bold" size={96} color={C.paper} />
        </TextZone>
        <GraphicZone>
          <CardsGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="9 · Objeción" {...t[8]} bg="dark">
        <SmallPrint dark />
        <TextZone>
          <Words from={65} to={68} font="script" size={96} color={C.paper} />
          <Words from={69} to={71} font="bold" size={120} color={C.paper} hl={{ from: 70, to: 71, kind: "glow" }} />
        </TextZone>
        <GraphicZone>
          <BoardGraphic />
        </GraphicZone>
      </Scene>

      <Scene name="10 · CTA" {...t[9]} bg="light">
        <ChatBubble x={640} y={130} start={WHIP} />
        <ChatBubble x={20} y={1330} flip start={WHIP + 6} />
        <TextZone bottom={1060}>
          <Words from={72} to={73} font="bold" size={124} color={C.ink} hl={{ from: 73, to: 73, kind: "box" }} />
          <Words from={74} to={78} font="bold" size={78} color={C.ink} hl={{ from: 74, to: 78, kind: "green" }} />
        </TextZone>
      </Scene>

      <Audio name="Voz" src={staticFile("audio/voz.wav")} />
      {t
        .filter((s) => s.enter === "whip")
        .map((s) => (
          <Sequence key={`w${s.from}`} name="Whoosh" from={s.from} durationInFrames={Math.round(0.5 * fps)} premountFor={fps}>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.55} />
          </Sequence>
        ))}
      {HITS.map((i) => (
        <Sequence key={`h${i}`} name="Golpe" from={wordFrame(i, fps)} durationInFrames={Math.round(0.6 * fps)} premountFor={fps}>
          <Audio src={staticFile("sfx/hit.wav")} volume={0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
