import { Composition, Folder, staticFile } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Promo, promoDuration } from "./Promo/Promo";
import { Clip, clipDuration } from "./Clip/Clip";
import { HookHouse, hookHouseDuration } from "./HookHouse/HookHouse";
import { Viral, viralDuration } from "./Viral/Viral";
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
              { from: 0, to: 6, accent: [5, 6] as [number, number], component: "titular" as const, items: [], label: "", value: "" },
              { from: 7, to: 12, accent: null, component: "cifra" as const, items: [], label: "clips", value: "3" },
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
              { from: 0, to: 7, accent: [1, 1] as [number, number], component: "titular" as const, items: [], label: "", value: "", icon: "muestra", itemIcons: [] },
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
            },
            icons: { muestra: `data:image/svg+xml;base64,${SAMPLE_ICON}` },
            bgIcons: ["muestra"],
            pointerIcon: null,
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
