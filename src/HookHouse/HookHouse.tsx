import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "./brand";
import {
  Badge,
  Clock,
  CtaBox,
  FollowRetention,
  Header,
  IconRow,
  ListRow,
  Logo,
  PhoneToFolder,
  StepCards,
  Tabs,
  TimerBox,
  Timeline,
} from "./graphics";
import { Headline, Mono, Typed, captions, opt, wf } from "./text";

// Motion graphic "Edición automática" rehecho con el estilo de marca Hook House (estilo-hookhouse.md).
// Misma locución y tiempos que src/Promo (public/audio/voz.wav + src/data/captions.json).

const LOGO_SECONDS = 1.6;
const logoStart = (fps: number) => Math.round((captions[captions.length - 1].endMs / 1000 + 0.25) * fps);
export const hookHouseDuration = (fps: number) => logoStart(fps) + Math.round(LOGO_SECONDS * fps);

// Primera palabra de cada sección (índices de captions.json)
const SECTIONS = [0, 21, 25, 34, 50, 60, 65, 72] as const;

// Sección: visible desde 3 frames antes de su primera palabra; se apaga a gris en sus últimos 6 frames.
// Los hijos reciben el frame absoluto (Sequence interna con from negativo).
const Section: React.FC<{ name: string; from: number; to: number; children: React.ReactNode }> = ({ name, from, to, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence name={name} from={from} durationInFrames={to - from} premountFor={fps}>
      <Sequence from={-from} layout="none">
        <Dim to={to}>{children}</Dim>
      </Sequence>
    </Sequence>
  );
};

const Dim: React.FC<{ to: number; children: React.ReactNode }> = ({ to, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [to - 6, to], [1, 0.3], opt) }}>{children}</AbsoluteFill>;
};

// Muestra a los hijos solo entre dos frames absolutos (subpasos dentro de una sección)
const Show: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

export const HookHouse: React.FC = () => {
  const { fps } = useVideoConfig();
  const w = (i: number) => wf(i, fps);
  const s = (i: number) => Math.max(0, w(i) - 3);
  const logo = logoStart(fps);
  const ends = SECTIONS.map((_, k) => (k + 1 < SECTIONS.length ? s(SECTIONS[k + 1]) : logo));
  const CLICKS = [11, 16, 21, 38, 43, 47, 61, 62, 64, 68];

  return (
    <AbsoluteFill style={{ backgroundColor: B.bg }}>
      <Sequence name="Cabecera" durationInFrames={logo} premountFor={fps}>
        <Header />
      </Sequence>

      <Section name="1 · Gancho + dolor" from={s(0)} to={ends[0]}>
        <Headline from={0} to={10} accent={[7, 8]} size={104} top={400} />
        <IconRow top={880} start={w(11)} icon={<Clock />} title="Grabar" label="diez minutos" />
        <IconRow
          top={1110}
          start={w(16)}
          icon={<TimerBox start={w(17)} end={w(20) + 10} />}
          title="Editar"
          label="una tarde entera"
          labelColor={B.green}
        />
      </Section>

      <Section name="2 · Tareas" from={s(21)} to={ends[1]}>
        <Headline from={21} to={24} size={118} top={420} />
        <Timeline starts={[w(21), w(22), w(23), w(24)]} from={s(21)} to={ends[1]} top={830} />
      </Section>

      <Section name="3 · Reencuadre" from={s(25)} to={ends[2]}>
        <Headline from={25} to={29} size={124} top={440} dimAt={w(30) - 2} />
        <Headline from={30} to={33} accent={[33, 33]} underline size={124} top={720} />
      </Section>

      <Section name="4 · Proceso" from={s(34)} to={ends[3]}>
        <Tabs start={w(34)} changes={[w(38), w(43), w(47)]} labels={["subes", "editamos", "listo"]} />
        <Show from={s(34)} to={s(38)}>
          <Headline from={34} to={37} accent={[37, 37]} size={120} top={480} />
        </Show>
        <Show from={s(38)} to={s(43)}>
          <Headline from={38} to={42} accent={[42, 42]} size={120} top={480} />
          <PhoneToFolder start={w(38)} send={w(40)} done={w(42) + 6} top={800} />
        </Show>
        <Show from={s(43)} to={ends[3]}>
          <Headline from={43} to={46} size={120} top={480} />
          <StepCards start={w(43)} greenAt={[w(43), w(46), w(47)]} labels={["subes", "editamos", "listo"]} top={800} />
          <Typed text="Listo para publicar." accentFrom={11} start={w(47)} size={92} top={1170} />
        </Show>
      </Section>

      <Section name="5 · Retención" from={s(50)} to={ends[4]}>
        <Headline from={50} to={59} accent={[58, 59]} size={112} top={420} />
        <FollowRetention start={w(50) + 4} follow={w(58)} top={900} />
      </Section>

      <Section name="6 · Para quién" from={s(60)} to={ends[5]}>
        <div style={{ position: "absolute", top: 470, left: 80 }}>
          <Mono size={28}>para</Mono>
        </div>
        <ListRow letter="A" text="Agencias" start={w(61)} top={540} />
        <ListRow letter="B" text="Coaches" start={w(62)} top={690} />
        <ListRow letter="C" text="Creadores" start={w(64)} top={840} />
      </Section>

      <Section name="7 · Objeción" from={s(65)} to={ends[6]}>
        <Headline from={65} to={68} size={124} top={440} dimAt={w(69) - 2} />
        <Headline from={69} to={71} accent={[70, 71]} underline size={124} top={720} />
        <Badge start={w(68) + 4} label="editores extra" value="0" top={1020} />
      </Section>

      <Section name="8 · CTA" from={s(72)} to={ends[7]}>
        <Headline from={72} to={72} size={130} top={560} align="center" />
        <CtaBox start={w(73)} text="AUTO" top={720} />
        <Headline from={74} to={78} size={56} top={960} align="center" color={B.grey} />
      </Section>

      <Sequence name="Logo" from={logo} premountFor={fps}>
        <Sequence from={-logo} layout="none">
          <Logo start={logo} />
        </Sequence>
      </Sequence>

      <Audio name="Voz" src={staticFile("audio/voz.wav")} />
      {CLICKS.map((i) => (
        <Sequence key={`c${i}`} name="Click" from={w(i)} durationInFrames={6} premountFor={fps}>
          <Audio src={staticFile("sfx/click.wav")} volume={0.5} />
        </Sequence>
      ))}
      <Sequence name="Pop CTA" from={w(73)} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence name="Pop logo" from={logo + 6} durationInFrames={12} premountFor={fps}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};
