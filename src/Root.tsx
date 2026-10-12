import { Composition, Folder } from "remotion";
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
            intensity: "sutil" as const,
            brand: HOOKHOUSE,
            captions: {
              mode: "frases" as const,
              pages: [{ startMs: 200, endMs: 2800, lines: [[{ text: "Vista previa", startMs: 200, endMs: 2800, emphasis: false }]] }],
            },
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
