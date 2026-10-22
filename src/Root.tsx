import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Promo, promoDuration } from "./Promo/Promo";
import { Clip, clipDuration } from "./Clip/Clip";
import { HookHouse, hookHouseDuration } from "./HookHouse/HookHouse";
import { Viral, viralDuration } from "./Viral/Viral";
import { Pulgar, pulgarDuration } from "./Pulgar/Pulgar";
import { Reflejo, reflejoDuration } from "./Reflejo/Reflejo";
import { Cosquillas, cosquillasDuration } from "./Cosquillas/Cosquillas";
import { Puerta, puertaDuration } from "./Puerta/Puerta";
import { DIORAMAS } from "./Diorama/reels";
import { MANIFIESTO_FRAMES, Manifiesto } from "./Altera/reels/Manifiesto";
import { GanchoSheet } from "./Altera/GanchoSheet";
import { DUMP_SLIDES, Dump } from "./Altera/Dump";
import { TIPS_SLIDES, Tips } from "./Altera/Tips";
import { LogoSquare, LogoWide } from "./Altera/Logo";
import { PODCAST_FRAMES, Podcast } from "./Clips/Podcast";
import { SEGUNDOS_FRAMES, Segundos } from "./Altera/reels/Segundos";
import { SONIDO_FRAMES, Sonido } from "./Altera/reels/Sonido";
import { TRES_FRAMES, Tres } from "./Altera/reels/Tres";
import { OJOS_FRAMES, Ojos } from "./Altera/reels/Ojos";
import { ELEFANTE_FRAMES, Elefante } from "./Altera/reels/Elefante";
import { ReelView, reelDuration } from "./Diorama/Engine";
import { AnimeIntro, animeIntroDuration } from "./AnimeIntro/AnimeIntro";
import { AnimeTeaser, animeTeaserDuration } from "./AnimeTeaser/AnimeTeaser";
import { Zeigarnik, zeigarnikDuration } from "./Zeigarnik/Zeigarnik";
import { Serial, serialDuration } from "./Serial/Serial";
import { Restorff, restorffDuration } from "./Restorff/Restorff";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        id="Restorff"
        component={Restorff}
        durationInFrames={restorffDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Serial"
        component={Serial}
        durationInFrames={serialDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Zeigarnik"
        component={Zeigarnik}
        durationInFrames={zeigarnikDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AnimeTeaser"
        component={AnimeTeaser}
        durationInFrames={animeTeaserDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AnimeIntro"
        component={AnimeIntro}
        durationInFrames={animeIntroDuration()}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Reflejo"
        component={Reflejo}
        durationInFrames={reflejoDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Cosquillas"
        component={Cosquillas}
        durationInFrames={cosquillasDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Puerta"
        component={Puerta}
        durationInFrames={puertaDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="Sonido" component={Sonido} durationInFrames={SONIDO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Tres" component={Tres} durationInFrames={TRES_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Ojos" component={Ojos} durationInFrames={OJOS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Segundos" component={Segundos} durationInFrames={SEGUNDOS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Podcast" component={Podcast} durationInFrames={PODCAST_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Dump" component={Dump} durationInFrames={DUMP_SLIDES} fps={30} width={1080} height={1350} />
      <Composition id="Tips" component={Tips} durationInFrames={TIPS_SLIDES} fps={30} width={1080} height={1350} />
      <Composition id="LogoWide" component={LogoWide} durationInFrames={2} fps={30} width={2400} height={1000} />
      <Composition id="LogoSquare" component={LogoSquare} durationInFrames={3} fps={30} width={1600} height={1600} />
      <Composition id="GanchoSheet" component={GanchoSheet} durationInFrames={60} fps={30} width={1920} height={1080} />
      <Composition id="Elefante" component={Elefante} durationInFrames={ELEFANTE_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Manifiesto" component={Manifiesto} durationInFrames={MANIFIESTO_FRAMES} fps={30} width={1080} height={1920} />
      {DIORAMAS.map((r) => (
        <Composition key={r.id} id={r.id} component={ReelView} defaultProps={{ reel: r }} durationInFrames={reelDuration(r, 30)} fps={30} width={1080} height={1920} />
      ))}
      <Composition
        id="Pulgar"
        component={Pulgar}
        durationInFrames={pulgarDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Viral"
        component={Viral}
        durationInFrames={viralDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HookHouse"
        component={HookHouse}
        durationInFrames={hookHouseDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Clip"
        component={Clip}
        durationInFrames={clipDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={promoDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};
