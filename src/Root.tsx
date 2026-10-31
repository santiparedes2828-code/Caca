import { Composition, Folder, Still } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Promo, promoDuration } from "./Promo/Promo";
import { Clip, clipDuration } from "./Clip/Clip";
import { HookHouse, hookHouseDuration } from "./HookHouse/HookHouse";
import { Viral, viralDuration } from "./Viral/Viral";
import { Pulgar, pulgarDuration } from "./Pulgar/Pulgar";
import { Reflejo, reflejoDuration } from "./Reflejo/Reflejo";
import { Salto, SaltoPortada, saltoDuration } from "./Salto/Salto";
import { Cosquillas, cosquillasDuration } from "./Cosquillas/Cosquillas";
import { Puerta, puertaDuration } from "./Puerta/Puerta";
import { DIORAMAS } from "./Diorama/reels";
import { MANIFIESTO_FRAMES, Manifiesto } from "./Altera/reels/Manifiesto";
import { GanchoSheet } from "./Altera/GanchoSheet";
import { DUMP_SLIDES, Dump } from "./Altera/Dump";
import { TIPS_SLIDES, Tips } from "./Altera/Tips";
import { LogoSquare, LogoWide } from "./Altera/Logo";
import { PODCAST_CUT_FRAMES, PodcastCut } from "./Cut/PodcastCut";
import { PODCAST_STUDIO_FRAMES, PodcastStudio } from "./Studio/PodcastStudio";
import { ANTES_DESPUES_FRAMES, AntesDespues } from "./Altera/reels/AntesDespues";
import { ANTES_DESPUES_BEAST_FRAMES, AntesDespuesBeast } from "./Altera/reels/AntesDespuesBeast";
import { CORTES_FRAMES, Cortes } from "./Altera/reels/Cortes";
import { SNAP_FRAMES, Snap } from "./Altera/reels/Snap";
import { CRISTAL_FRAMES, Cristal } from "./Altera/reels/Cristal";
import { PIEDRA_FRAMES, Piedra } from "./Altera/reels/Piedra";
import { ERROR1_FRAMES, Error1, Error1Portada } from "./Altera/reels/Error1";
import { FALSO15_FRAMES, Falso15, Falso15Portada } from "./Altera/reels/Falso15";
import { MARRON_FRAMES, Marron, MarronPortada } from "./Altera/reels/Marron";
import { MEDIALUNA_FRAMES, MedialunaPortada, MedialunaReel } from "./Altera/reels/Medialuna";
import { MedialunaGancho, ganchoFrames } from "./Altera/reels/MedialunaGanchos";
import { MEDIALUNA_V2_FRAMES, MedialunaV2, MedialunaV2Portada } from "./Altera/reels/MedialunaV2";
import { Caras, CarasPortada, carasFrames } from "./Altera/reels/Caras";
import { Servilleta, ServilletaPortada, servilletaFrames } from "./Altera/reels/Servilleta";
import { TODOS_FRAMES, TodosIgual, TodosIgualPortada } from "./Altera/reels/TodosIgual";
import { ESCALON_FRAMES, Escalon, EscalonPortada } from "./Altera/reels/Escalon";
import { CAPAS_FRAMES, Capas, CapasPortada } from "./Altera/reels/Capas";
import { TOMAS_FRAMES, Tomas, TomasPortada } from "./Altera/reels/Tomas";
import { APERTURA_FRAMES, EbookApertura } from "./Ebook/Heladera";
import { HuevosClave, Logo as LogoRecetas } from "./Ebook/Huevos";
import { RECETA_FRAMES, RecetaVideo } from "./Ebook/RecetaVideo";
import { QUESADILLA_FRAMES, Quesadilla } from "./Ebook/Quesadilla";
import { HAMBRE_FRAMES, Hambre } from "./Ebook/Hambre";
import { DATO_FRAMES, DatoQuesadilla } from "./Ebook/DatoQuesadilla";
import { QUESO_FRAMES, DatoQueso } from "./Ebook/DatoQueso";
import { ACEITE_FRAMES, AceitePasta } from "./Ebook/AceitePasta";
import { GanchoHuevos, GanchoQuesa, framesHuevos, framesQuesa } from "./Ebook/Ganchos";
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
      <Composition id="PodcastCut" component={PodcastCut} durationInFrames={PODCAST_CUT_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="PodcastStudio" component={PodcastStudio} durationInFrames={PODCAST_STUDIO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="AntesDespues" component={AntesDespues} durationInFrames={ANTES_DESPUES_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="AntesDespuesBeast" component={AntesDespuesBeast} durationInFrames={ANTES_DESPUES_BEAST_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Cortes" component={Cortes} durationInFrames={CORTES_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Snap" component={Snap} durationInFrames={SNAP_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Cristal" component={Cristal} durationInFrames={CRISTAL_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Error1A" component={Error1} defaultProps={{ variant: "A" as const }} durationInFrames={ERROR1_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Error1B" component={Error1} defaultProps={{ variant: "B" as const }} durationInFrames={ERROR1_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Capas" component={Capas} durationInFrames={CAPAS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="EbookApertura" component={EbookApertura} durationInFrames={APERTURA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="RecetaVideo" component={RecetaVideo} durationInFrames={RECETA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Quesadilla" component={Quesadilla} durationInFrames={QUESADILLA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Hambre" component={Hambre} durationInFrames={HAMBRE_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="DatoQuesadilla" component={DatoQuesadilla} durationInFrames={DATO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="DatoQueso" component={DatoQueso} durationInFrames={QUESO_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="AceitePasta" component={AceitePasta} durationInFrames={ACEITE_FRAMES} fps={30} width={1080} height={1920} />
      {([1, 2, 3] as const).map((n) => <Composition key={`h${n}`} id={`GanchoHuevos${n}`} component={GanchoHuevos} defaultProps={{ n }} durationInFrames={framesHuevos(n)} fps={30} width={1080} height={1920} />)}
      {([1, 2, 3] as const).map((n) => <Composition key={`q${n}`} id={`GanchoQuesa${n}`} component={GanchoQuesa} defaultProps={{ n }} durationInFrames={framesQuesa(n)} fps={30} width={1080} height={1920} />)}
      <Still id="LogoTikTok" component={LogoRecetas} width={1080} height={1080} />
      {([1, 2, 3] as const).map((e) => <Still key={e} id={`HuevosClave${e}`} component={HuevosClave} defaultProps={{ escena: e }} width={1080} height={1920} />)}
      <Composition id="Tomas" component={Tomas} durationInFrames={TOMAS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TomasPortada" component={TomasPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="CapasPortada" component={CapasPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Salto" component={Salto} durationInFrames={saltoDuration(30)} fps={30} width={1080} height={1920} />
      <Composition id="SaltoPortada" component={SaltoPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Marron" component={Marron} durationInFrames={MARRON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MarronPortada" component={MarronPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Falso15" component={Falso15} durationInFrames={FALSO15_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="Falso15Portada" component={Falso15Portada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Medialuna" component={MedialunaReel} durationInFrames={MEDIALUNA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaPortada" component={MedialunaPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaGancho1" component={MedialunaGancho} defaultProps={{ v: 1 }} durationInFrames={ganchoFrames(1)} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaGancho2" component={MedialunaGancho} defaultProps={{ v: 2 }} durationInFrames={ganchoFrames(2)} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaGancho3" component={MedialunaGancho} defaultProps={{ v: 3 }} durationInFrames={ganchoFrames(3)} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaGancho4" component={MedialunaGancho} defaultProps={{ v: 4 }} durationInFrames={ganchoFrames(4)} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaGancho5" component={MedialunaGancho} defaultProps={{ v: 5 }} durationInFrames={ganchoFrames(5)} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaV2" component={MedialunaV2} defaultProps={{ pill: true, music: 0.22 }} durationInFrames={MEDIALUNA_V2_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaV2SinPildora" component={MedialunaV2} defaultProps={{ pill: false, music: 0.22 }} durationInFrames={MEDIALUNA_V2_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaV2MusicaBaja" component={MedialunaV2} defaultProps={{ pill: true, music: 0.12 }} durationInFrames={MEDIALUNA_V2_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="MedialunaV2Portada" component={MedialunaV2Portada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Caras1" component={Caras} defaultProps={{ v: 1 }} durationInFrames={carasFrames(1)} fps={30} width={1080} height={1920} />
      <Composition id="Caras2" component={Caras} defaultProps={{ v: 2 }} durationInFrames={carasFrames(2)} fps={30} width={1080} height={1920} />
      <Composition id="Caras3" component={Caras} defaultProps={{ v: 3 }} durationInFrames={carasFrames(3)} fps={30} width={1080} height={1920} />
      <Composition id="CarasPortada1" component={CarasPortada} defaultProps={{ v: 1 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="CarasPortada2" component={CarasPortada} defaultProps={{ v: 2 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="CarasPortada3" component={CarasPortada} defaultProps={{ v: 3 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Servilleta1" component={Servilleta} defaultProps={{ v: 1 }} durationInFrames={servilletaFrames(1)} fps={30} width={1080} height={1920} />
      <Composition id="ServilletaPortada1" component={ServilletaPortada} defaultProps={{ v: 1 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Servilleta2" component={Servilleta} defaultProps={{ v: 2 }} durationInFrames={servilletaFrames(2)} fps={30} width={1080} height={1920} />
      <Composition id="ServilletaPortada2" component={ServilletaPortada} defaultProps={{ v: 2 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Servilleta3" component={Servilleta} defaultProps={{ v: 3 }} durationInFrames={servilletaFrames(3)} fps={30} width={1080} height={1920} />
      <Composition id="ServilletaPortada3" component={ServilletaPortada} defaultProps={{ v: 3 }} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="TodosIgual" component={TodosIgual} durationInFrames={TODOS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TodosIgualPortada" component={TodosIgualPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Escalon" component={Escalon} durationInFrames={ESCALON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="EscalonPortada" component={EscalonPortada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Error1Portada" component={Error1Portada} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Piedra" component={Piedra} durationInFrames={PIEDRA_FRAMES} fps={30} width={1080} height={1920} />
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
