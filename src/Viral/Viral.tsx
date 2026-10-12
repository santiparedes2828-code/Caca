import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-viral.json";
import { B, MONO } from "../HookHouse/brand";
import { ListRow, Logo, Wordmark } from "../HookHouse/graphics";
import { CaptionsCtx, Headline, Mono, opt } from "../HookHouse/text";
import { Cta3D, FlipStyle, PhoneCaptions, StyleFile, VoiceAI, Week, ZoomSound } from "./scenes";
import { FilmCut3D, Layers3D, Photos3D, Waveform3D } from "./three";

// Reel "Este video no lo editó nadie" — Hook House (guion-viral.md · estilo-hookhouse.md + 3D).
// Locución: Rodrigo Zabú (ElevenLabs, eleven_v4) en public/audio/voz_viral.wav; los tiempos de
// src/data/captions-viral.json salen de su transcripción con Scribe (silencios recortados).

const caps = captionsJson as Caption[];
const LOGO_SECONDS = 1.6;
const logoStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.5) * fps);
export const viralDuration = (fps: number) => logoStart(fps) + Math.round(LOGO_SECONDS * fps);

type World = "dark" | "light";
// Primera palabra de cada escena y su mundo (alternan negro / blanco roto)
const SCENES: { first: number; world: World }[] = [
  { first: 0, world: "dark" },
  { first: 12, world: "light" },
  { first: 23, world: "dark" },
  { first: 28, world: "light" },
  { first: 35, world: "dark" },
  { first: 40, world: "light" },
  { first: 43, world: "dark" },
  { first: 53, world: "light" },
  { first: 72, world: "dark" },
  { first: 84, world: "light" },
  { first: 95, world: "dark" },
];

const ink = (w: World) => (w === "dark" ? B.bg : B.ink);

// Cabecera de marca, del color del mundo
const Header: React.FC<{ world: World }> = ({ world }) => (
  <div style={{ position: "absolute", top: 160, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Wordmark size={36} color={ink(world)} />
    <span style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.08em", color: world === "dark" ? "#9A9A94" : B.grey }}>
      <span style={{ color: B.green }}>(02)</span> EDICIÓN AUTOMÁTICA
    </span>
  </div>
);

// Escena: entra con un "zoom-through" (escala 1,14 → 1 + desenfoque) en 7 frames; los hijos reciben el frame absoluto
const Scene: React.FC<{ name: string; from: number; to: number; world: World; children: React.ReactNode }> = ({ name, from, to, world, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={name} from={from} durationInFrames={to - from} premountFor={fps}>
      <Sequence from={-from} layout="none">
        <SceneBody from={from} world={world}>
          {children}
        </SceneBody>
      </Sequence>
    </Sequence>
  );
};

const SceneBody: React.FC<{ from: number; world: World; children: React.ReactNode }> = ({ from, world, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + 7], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: world === "dark" ? B.ink : B.bg }}>
      <AbsoluteFill style={{ scale: `${1.14 - 0.14 * p}`, filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined, opacity: 0.4 + 0.6 * p }}>
        {children}
      </AbsoluteFill>
      <Header world={world} />
    </AbsoluteFill>
  );
};

export const Viral: React.FC = () => {
  const { fps } = useVideoConfig();
  const w = (i: number) => Math.round((caps[i].startMs / 1000) * fps);
  const s = (i: number) => Math.max(0, w(i) - 3);
  const logo = logoStart(fps);
  const ends = SCENES.map((_, k) => (k + 1 < SCENES.length ? s(SCENES[k + 1].first) : logo));
  const sc = (k: number) => ({ from: s(SCENES[k].first), to: ends[k], world: SCENES[k].world });
  const CLICKS = [74, 77, 79, 82, 85, 86, 88];
  const HITS = [8, 42, 96];

  return (
    <CaptionsCtx.Provider value={caps}>
      <AbsoluteFill style={{ backgroundColor: B.ink }}>
        <Audio src={staticFile("audio/voz_viral.wav")} />
        <Scene name="1 · Gancho 3D" {...sc(0)}>
          <FilmCut3D start={s(0)} cut={w(8)} />
          <Headline from={0} to={7} accent={[5, 5]} size={118} top={400} color={B.bg} dimAt={w(8) - 2} />
          <Headline from={8} to={11} accent={[11, 11]} underline size={150} top={790} color={B.bg} />
        </Scene>

        <Scene name="2 · Silencios 3D" {...sc(1)}>
          <Waveform3D start={s(12)} cut={w(20)} />
          <Headline from={12} to={16} size={104} top={400} dimAt={w(17) - 2} />
          <Headline from={17} to={22} accent={[22, 22]} size={104} top={630} />
        </Scene>

        <Scene name="3 · Subtítulos" {...sc(2)}>
          <Headline from={23} to={24} size={120} top={370} color={B.bg} />
          <PhoneCaptions start={w(23)} words={[25, 26, 27]} top={640} />
        </Scene>

        <Scene name="4 · Zooms y sonido" {...sc(3)}>
          <Headline from={28} to={34} accent={[30, 30]} size={112} top={380} />
          <ZoomSound start={w(28)} zoom={w(30)} sound={w(32)} top={820} />
        </Scene>

        <Scene name="5 · Imágenes 3D" {...sc(4)}>
          <Photos3D start={w(37)} />
          <Headline from={35} to={36} size={112} top={390} color={B.bg} dimAt={w(37) - 2} />
          <Headline from={37} to={39} accent={[39, 39]} size={112} top={630} color={B.bg} />
        </Scene>

        <Scene name="6 · Animaciones 3D" {...sc(5)}>
          <Layers3D start={w(40)} />
          <Headline from={40} to={40} size={110} top={390} dimAt={w(41) - 2} />
          <Headline from={41} to={42} accent={[42, 42]} size={230} top={500} />
        </Scene>

        <Scene name="7 · Voz IA" {...sc(6)}>
          <Headline from={43} to={45} size={112} top={390} color={B.bg} dimAt={w(46) - 2} />
          <Headline from={46} to={52} accent={[51, 52]} size={100} top={620} color={B.bg} />
          <VoiceAI start={w(46)} top={1080} />
        </Scene>

        <Scene name="8 · Copia estilos" {...sc(7)}>
          <Headline from={53} to={59} size={92} top={370} dimAt={w(60) - 2} />
          <Headline from={60} to={71} accent={[62, 62]} size={78} top={590} />
          <FlipStyle start={w(55)} flip={w(60)} colors={w(68)} type={w(71)} top={860} />
        </Scene>

        <Scene name="9 · Aprende" {...sc(8)}>
          <Headline from={72} to={77} size={100} top={380} color={B.bg} dimAt={w(78) - 2} />
          <Headline from={78} to={83} accent={[82, 83]} size={100} top={600} color={B.bg} />
          <StyleFile
            start={w(73)}
            top={930}
            items={[
              { at: w(74), text: "Sin marca de agua" },
              { at: w(77), text: "Productos con foto real" },
              { at: w(79), text: "Inter + Garamond" },
              { at: w(82), text: "Verde #12A150" },
            ]}
          />
        </Scene>

        <Scene name="10 · Para quién" {...sc(9)}>
          <div style={{ position: "absolute", top: 400, left: 80 }}>
            <Mono size={28}>para</Mono>
          </div>
          <ListRow letter="A" text="Agencias" start={w(85)} top={460} />
          <ListRow letter="B" text="Coaches" start={w(86)} top={600} />
          <ListRow letter="C" text="Creadores" start={w(88)} top={740} />
          <Headline from={89} to={94} accent={[92, 94]} size={70} top={950} />
          <Week start={w(91)} end={w(94) + 12} top={1110} />
        </Scene>

        <Scene name="11 · CTA" {...sc(10)}>
          <Headline from={95} to={95} size={130} top={500} align="center" color={B.bg} />
          <Cta3D start={w(96)} text="HOOK" top={680} />
          <Headline from={97} to={98} size={110} top={960} align="center" color={B.bg} />
          <Headline from={99} to={105} size={52} top={1110} align="center" color="#9A9A94" />
        </Scene>

        <Sequence name="Logo" from={logo} premountFor={fps}>
          <Sequence from={-logo} layout="none">
            <AbsoluteFill style={{ background: B.bg }}>
              <Logo start={logo} />
            </AbsoluteFill>
          </Sequence>
        </Sequence>

        {SCENES.slice(1).map((sc2) => (
          <Sequence key={`w${sc2.first}`} name="Whoosh" from={s(sc2.first) - 2} durationInFrames={14} premountFor={fps}>
            <Audio src={staticFile("sfx/whoosh.wav")} volume={0.32} />
          </Sequence>
        ))}
        <Sequence name="Whoosh logo" from={logo - 2} durationInFrames={14} premountFor={fps}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.32} />
        </Sequence>
        {CLICKS.map((i) => (
          <Sequence key={`c${i}`} name="Click" from={w(i)} durationInFrames={6} premountFor={fps}>
            <Audio src={staticFile("sfx/click.wav")} volume={0.5} />
          </Sequence>
        ))}
        {HITS.map((i) => (
          <Sequence key={`h${i}`} name="Golpe" from={w(i)} durationInFrames={18} premountFor={fps}>
            <Audio src={staticFile("sfx/hit.wav")} volume={0.4} />
          </Sequence>
        ))}
        <Sequence name="Pop logo" from={logo + 6} durationInFrames={12} premountFor={fps}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
        </Sequence>
      </AbsoluteFill>
    </CaptionsCtx.Provider>
  );
};
