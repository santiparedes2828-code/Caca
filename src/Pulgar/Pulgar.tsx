import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "../data/captions-pulgar.json";
import { B } from "../HookHouse/brand";
import { Logo, Tabs, Timeline } from "../HookHouse/graphics";
import { CaptionsCtx, Headline, opt } from "../HookHouse/text";
import { Clover, DmChat, Fire, FirstSecond, LockBox, OpenBox, SpinClock, ThumbDrop, ThumbFeed, TwoPhones } from "./graphics";

// Reel "¿Por qué se detuvo tu pulgar?" — Hook House (guion-pulgar.md · skill formula-viral · estilo-hookhouse.md).
// Sin locución: el texto se lee palabra a palabra con los tiempos de lectura de scripts/timeline_pulgar.py.
// Cama rítmica y SFX en public/sfx; la cama se corta en seco cuando el pulgar se congela.

const caps = captionsJson as Caption[];
const LOGO_SECONDS = 1.8;
const logoStart = (fps: number) => Math.round((caps[caps.length - 1].endMs / 1000 + 0.8) * fps);
export const pulgarDuration = (fps: number) => logoStart(fps) + Math.round(LOGO_SECONDS * fps);

type World = "dark" | "light";
// Primera palabra de cada escena (ver la salida de timeline_pulgar.py)
const SCENES: { first: number; world: World }[] = [
  { first: 0, world: "dark" },
  { first: 13, world: "light" },
  { first: 19, world: "dark" },
  { first: 29, world: "light" },
  { first: 31, world: "light" },
  { first: 39, world: "light" },
  { first: 49, world: "light" },
  { first: 62, world: "dark" },
  { first: 70, world: "light" },
  { first: 85, world: "dark" },
];

// Escena: entra con zoom-through (1,14 → 1 + desenfoque) en 7 frames; los hijos reciben el frame absoluto
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
  const p = from === 0 ? 1 : interpolate(frame, [from, from + 7], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: world === "dark" ? B.ink : B.bg }}>
      <AbsoluteFill style={{ scale: `${1.14 - 0.14 * p}`, filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined, opacity: 0.4 + 0.6 * p }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Pulgar: React.FC = () => {
  const { fps } = useVideoConfig();
  const w = (i: number) => Math.round((caps[i].startMs / 1000) * fps);
  const s = (i: number) => Math.max(0, w(i) - 3);
  const logo = logoStart(fps);
  const ends = SCENES.map((_, k) => (k + 1 < SCENES.length ? s(SCENES[k + 1].first) : logo));
  const sc = (k: number) => ({ from: s(SCENES[k].first), to: ends[k], world: SCENES[k].world });
  const freeze = w(12);
  const tabs = { start: w(29), changes: [w(31), w(39), w(49)], labels: ["raro", "lo ves", "final"] } as const;
  const CLICKS = [29, 31, 39, 49, 94];
  const HITS = [12, 18, 47, 82, 95];
  const WHOOSH = SCENES.slice(1).filter((x) => ![31, 39, 49].includes(x.first));

  return (
    <CaptionsCtx.Provider value={caps}>
      <AbsoluteFill style={{ backgroundColor: B.ink }}>
        {/* Cama: suena desde el frame 0, se corta al congelarse el pulgar y vuelve con la escena 2 */}
        <Audio
          src={staticFile("sfx/cama.wav")}
          volume={(f) => (f >= freeze && f < s(13) ? 0 : interpolate(f, [logo, logo + 30], [0.82, 0], opt))}
        />

        <Scene name="1 · Gancho: pulgar" {...sc(0)}>
          <ThumbFeed start={0} freeze={freeze} top={720} />
          <Headline from={0} to={8} accent={[1, 1]} size={88} top={220} color={B.bg} dimAt={w(9) - 2} />
          <Headline from={9} to={12} accent={[11, 12]} size={104} top={500} color={B.bg} />
        </Scene>

        <Scene name="2 · Giro: edición" {...sc(1)}>
          <Clover start={w(13)} strike={w(15)} leave={w(16)} top={820} />
          <Timeline starts={[w(16), w(17), w(18), w(18) + 6]} from={w(16)} to={ends[1]} top={860} />
          <Headline from={13} to={15} accent={[15, 15]} size={130} top={300} dimAt={w(16) - 2} />
          <Headline from={16} to={18} accent={[18, 18]} underline size={130} top={470} />
        </Scene>

        <Scene name="3 · Repregunta" {...sc(2)}>
          <Headline from={19} to={28} accent={[28, 28]} size={100} top={260} color={B.bg} />
          <TwoPhones start={w(22)} mine={w(27)} top={760} />
        </Scene>

        <Scene name="4 · Tres cosas" {...sc(3)}>
          <Tabs {...tabs} />
          <Headline from={29} to={30} accent={[29, 29]} size={240} top={720} />
        </Scene>

        <Scene name="5 · Uno: raro" {...sc(4)}>
          <Tabs {...tabs} />
          <Headline from={31} to={38} accent={[38, 38]} size={108} top={480} />
          <FirstSecond start={w(32)} end={w(35) + 8} top={800} />
          <ThumbDrop at={w(38)} top={1090} />
        </Scene>

        <Scene name="6 · Dos: fuego" {...sc(5)}>
          <Tabs {...tabs} />
          <Headline from={39} to={44} accent={[44, 44]} size={110} top={480} dimAt={w(45) - 2} />
          <Headline from={45} to={48} size={110} top={700} />
          <Fire start={w(47)} top={880} />
        </Scene>

        <Scene name="7 · Tres: final" {...sc(6)}>
          <Tabs {...tabs} />
          <Headline from={49} to={57} accent={[57, 57]} size={96} top={480} dimAt={w(58) - 2} />
          <Headline from={58} to={61} size={96} top={690} />
          <LockBox start={w(52)} end={w(61) + 10} top={880} />
        </Scene>

        <Scene name="8 · Horas" {...sc(7)}>
          <Headline from={62} to={69} accent={[69, 69]} size={120} top={280} color={B.bg} />
          <SpinClock start={w(62)} fast={w(69)} top={720} />
        </Scene>

        <Scene name="9 · Respuesta" {...sc(8)}>
          <Headline from={70} to={78} accent={[73, 73]} size={92} top={280} dimAt={w(79) - 2} />
          <Headline from={79} to={84} accent={[82, 82]} underline size={110} top={500} />
          <OpenBox start={w(70)} open={w(79)} label={w(82)} top={820} />
        </Scene>

        <Scene name="10 · CTA" {...sc(9)}>
          <Headline from={85} to={93} accent={[87, 88]} size={96} top={260} color={B.bg} dimAt={w(94) - 2} />
          <DmChat start={w(89)} send={w(95)} top={700} />
          <Headline from={94} to={97} accent={[95, 95]} size={104} top={1230} align="center" color={B.bg} />
        </Scene>

        <Sequence name="Logo" from={logo} premountFor={fps}>
          <Sequence from={-logo} layout="none">
            <AbsoluteFill style={{ background: B.bg }}>
              <Logo start={logo} />
            </AbsoluteFill>
          </Sequence>
        </Sequence>

        {WHOOSH.map((x) => (
          <Sequence key={`w${x.first}`} name="Whoosh" from={s(x.first) - 2} durationInFrames={14} premountFor={fps}>
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
            <Audio src={staticFile("sfx/hit.wav")} volume={0.35} />
          </Sequence>
        ))}
        <Sequence name="Pop pulgar" from={w(38) + 6} durationInFrames={12} premountFor={fps}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.4} />
        </Sequence>
        <Sequence name="Pop logo" from={logo + 6} durationInFrames={12} premountFor={fps}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
        </Sequence>
      </AbsoluteFill>
    </CaptionsCtx.Provider>
  );
};
