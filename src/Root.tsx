import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { Promo, promoDuration } from "./Promo/Promo";
import { Clip, clipDuration } from "./Clip/Clip";
import { HookHouse, hookHouseDuration } from "./HookHouse/HookHouse";
import { Viral, viralDuration } from "./Viral/Viral";
import { Pulgar, pulgarDuration } from "./Pulgar/Pulgar";

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
