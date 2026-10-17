import { Composition, Folder, staticFile } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Promo, promoDuration } from "./Promo/Promo";
import { Clip, clipDuration } from "./Clip/Clip";
import { HookHouse, hookHouseDuration } from "./HookHouse/HookHouse";
import { AntesDespues, antesDespuesSchema, calculateAntesDespuesMetadata } from "./AntesDespues/AntesDespues";
import einsteinEnvelope from "./AntesDespues/einstein-envolvente.json";
import { CapiKuleshov, kuleshovDuration } from "./Capi/CapiKuleshov";
import { AntesDespuesFijo, antesDespuesFijoSchema, calculateAntesDespuesFijoMetadata } from "./AntesDespues/AntesDespuesFijo";
import { MISMO_CLIP_EN, MISMO_CLIP_ES, MismoClip, mismoClipDuration, mismoClipSchema } from "./Crecimiento/MismoClip";
import { Viral, viralDuration } from "./Viral/Viral";
import { Neon, neonDuration } from "./Neon/Neon";
import { Firma, firmaDuration } from "./Firma/Firma";
import { ClaudeMG, claudeMGDuration } from "./ClaudeMG/ClaudeMG";
import { Leonardo, leonardoDuration } from "./Leonardo/Leonardo";
import { PodcastMuere, podcastMuereDuration } from "./PodcastMuere/PodcastMuere";
import { HHReel, reelDuration } from "./PodcastMuere/HHReels";
import { Collage, collageDuration } from "./Collage/Collage";
import { Diferencia, diferenciaDuration } from "./Collage/Diferencia";
import { calculateMontajeMetadata, Montaje, montajeSchema } from "./Montaje/Montaje";
import { AutopilotEdit, calculateEditMetadata } from "./autopilot/AutopilotEdit";
import { CaptionModesDemo, captionDemoDuration, captionDemoSchema } from "./autopilot/CaptionModesDemo";
import { editPropsSchema } from "./autopilot/props";
import { AutopilotCreate, calculateCreateMetadata } from "./create/AutopilotCreate";
import { createPropsSchema } from "./create/props";
import { AutopilotTheme, calculateThemeMetadata } from "./create/AutopilotTheme";
import { themedPropsSchema } from "./create/theme";

// Icono de muestra para la vista previa en Remotion Studio (los reales los pone el backend)
const SAMPLE_ICON =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNyIgcj0iMTIiIGZpbGw9IiNmZjgyMmQiLz48cGF0aCBmaWxsPSIjMDBkMjZhIiBkPSJNMTQgM2g0YzIgMCA0IDIgNCA0aC00Yy0yIDAtNC0yLTQtNCIvPjwvc3ZnPg==";
import captionsDemo from "./data/captions.json";
import { HOOKHOUSE } from "./design/tokens";

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
      <Folder name="Autopilot">
        {/* Composición del pipeline de edición: el backend (autopilot/) le pasa todas las props */}
        <Composition
          id="AutopilotEdit"
          component={AutopilotEdit}
          schema={editPropsSchema}
          calculateMetadata={calculateEditMetadata}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            fps: 30,
            width: 1080,
            height: 1920,
            durationInFrames: 90,
            video: { src: "", width: 1920, height: 1080, hasAudio: false, volume: 1, segments: [{ srcStartFrame: 0, durationInFrames: 90 }] },
            reframe: { mode: "cover" as const, focusX: 0.5, focusY: 0.4 },
            focusTrack: [],
            overlays: [],
            music: null,
            intensity: "sutil" as const,
            brand: HOOKHOUSE,
            icons: {},
            graphics: [],
            sfx: [],
            captions: {
              mode: "frases" as const,
              pages: [{ startMs: 200, endMs: 2800, lines: [[{ text: "Vista previa", startMs: 200, endMs: 2800, emphasis: false }]] }],
            },
          }}
        />
        {/* Creación desde guion: el backend (autopilot/create) le pasa escenas y narración */}
        <Composition
          id="AutopilotCreate"
          component={AutopilotCreate}
          schema={createPropsSchema}
          calculateMetadata={calculateCreateMetadata}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            fps: 30,
            durationInFrames: 300,
            audioSrc: staticFile("audio/voz.wav"),
            captions: captionsDemo,
            scenes: [
              { from: 0, to: 6, accent: [5, 6] as [number, number], component: "titular" as const, items: [], label: "", value: "", body: "" },
              { from: 7, to: 12, accent: null, component: "cifra" as const, items: [], label: "clips", value: "3", body: "" },
            ],
            headerLabel: "(01) demo",
            logoSeconds: 1.5,
          }}
        />
        {/* Creación con tema según el contenido (motion graphics); el backend resuelve tema e iconos */}
        <Composition
          id="AutopilotTheme"
          component={AutopilotTheme}
          schema={themedPropsSchema}
          calculateMetadata={calculateThemeMetadata}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            fps: 30,
            durationInFrames: 150,
            audioSrc: null,
            captions: ["La", "mandarina", "es", "más", "antigua", "que", "la", "naranja."].map((text, i) => ({
              text,
              startMs: 300 + i * 380,
              endMs: 680 + i * 380,
              timestampMs: null,
              confidence: null,
            })),
            scenes: [
              {
                from: 0,
                to: 7,
                accent: [1, 1] as [number, number],
                component: "titular" as const,
                items: [],
                label: "",
                value: "",
                body: "",
                icon: "muestra",
                itemIcons: [],
                cues: { icon: 1, value: null, items: [] },
                fx: { reveal: "mascara" as const, camera: null, sceneTransition: null },
              },
            ],
            headerLabel: "Dato curioso",
            theme: {
              id: "citrico",
              name: "Cítrico",
              palette: { bg: "#FFF3E2", bg2: "#FFD6A0", ink: "#2A1606", accent: "#E96400", onAccent: "#FFFFFF", accent2: "#3B9B3A", card: "#FFFFFF" },
              font: "inter" as const,
              captionStyle: "caja" as const,
              motion: "rebote" as const,
              background: "burbujas" as const,
              sceneTransition: "barrido" as const,
              reveal: "salto" as const,
              camera: "empuje" as const,
              counter: "odometro" as const,
            },
            icons: { muestra: `data:image/svg+xml;base64,${SAMPLE_ICON}` },
            bgIcons: ["muestra"],
            pointerIcon: null,
            accentFont: "inter" as const,
            accentScale: 1,
            sfx: [],
          }}
        />
        <Composition
          id="CaptionModesDemo"
          component={CaptionModesDemo}
          schema={captionDemoSchema}
          durationInFrames={captionDemoDuration(30)}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ mode: "palabra-activa" as const, intensity: "sutil" as const, variant: "card" as const }}
        />
      </Folder>
      <Composition
        id="Viral"
        component={Viral}
        durationInFrames={viralDuration(30)}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="CapiKuleshov" component={CapiKuleshov} durationInFrames={kuleshovDuration} fps={30} width={1080} height={1920} />
      <Composition
        id="AntesDespuesFijo"
        component={AntesDespuesFijo}
        schema={antesDespuesFijoSchema}
        calculateMetadata={calculateAntesDespuesFijoMetadata}
        defaultProps={{ video: "antes-despues/einstein.mp4", videoSeconds: 25.45, envelope: [], labels: ["Antes", "Después", "Solo audio"] as [string, string, string] }}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="MismoClipEN" component={MismoClip} schema={mismoClipSchema} defaultProps={MISMO_CLIP_EN} durationInFrames={mismoClipDuration(MISMO_CLIP_EN)} fps={30} width={1080} height={1920} />
      <Composition id="MismoClipES" component={MismoClip} schema={mismoClipSchema} defaultProps={MISMO_CLIP_ES} durationInFrames={mismoClipDuration(MISMO_CLIP_ES)} fps={30} width={1080} height={1920} />
      <Composition
        id="AntesDespues"
        component={AntesDespues}
        schema={antesDespuesSchema}
        calculateMetadata={calculateAntesDespuesMetadata}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          video: "antes-despues/einstein.mp4",
          audio: "antes-despues/einstein.wav",
          videoSeconds: 25.45,
          envelope: einsteinEnvelope,
          introSeconds: 2.6,
          labels: ["Antes", "Después", "Solo un audio"] as [string, string, string],
        }}
      />
      <Composition id="Diferencia" component={Diferencia} durationInFrames={diferenciaDuration} fps={30} width={1080} height={1920} />
      <Composition id="Collage" component={Collage} durationInFrames={collageDuration} fps={30} width={1080} height={1920} defaultProps={{ env: [] as number[] }} />
      <Composition id="ReelV07" component={HHReel} durationInFrames={reelDuration("v07")} fps={30} width={1080} height={1920} defaultProps={{ id: "v07" as const }} />
      <Composition id="ReelV10" component={HHReel} durationInFrames={reelDuration("v10")} fps={30} width={1080} height={1920} defaultProps={{ id: "v10" as const }} />
      <Composition id="ReelV08" component={HHReel} durationInFrames={reelDuration("v08")} fps={30} width={1080} height={1920} defaultProps={{ id: "v08" as const }} />
      <Composition id="PodcastMuere" component={PodcastMuere} durationInFrames={podcastMuereDuration} fps={30} width={1080} height={1920} />
      <Composition id="Leonardo" component={Leonardo} durationInFrames={leonardoDuration} fps={30} width={1080} height={1920} />
      <Composition id="ClaudeMG" component={ClaudeMG} durationInFrames={claudeMGDuration} fps={30} width={1920} height={1080} />
      <Composition id="Firma" component={Firma} durationInFrames={firmaDuration} fps={30} width={1080} height={1920} />
      <Composition id="Neon" component={Neon} durationInFrames={neonDuration} fps={30} width={1080} height={1920} />
      <Composition
        id="Montaje"
        component={Montaje}
        schema={montajeSchema}
        calculateMetadata={calculateMontajeMetadata}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          bpm: 120,
          accent: "#2C8FB0",
          musicVolume: 0.5,
          segments: [{ src: "broll/muestra.mp4", from: 0, beats: 4, vertical: true, zoom: "in" as const, focusX: 50, big: "Muestra", leak: false }],
          end: { beats: 4, title: "Marca", lines: [], cta: "Reservá" },
        }}
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
