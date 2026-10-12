import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig, type InteractivitySchema } from "remotion";
import { INTER, loadInter } from "../design/inter";

// Regla de la casa: todo el texto en Inter
loadInter();

type TitleProps = {
  readonly titleText: string;
  readonly titleColor: string;
  readonly style?: React.CSSProperties;
};

const TitleInner: React.FC<TitleProps> = ({ titleText, titleColor, style }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <Interactive.H1
      style={{
        fontFamily: INTER,
        fontWeight: "bold",
        fontSize: 100,
        textAlign: "center",
        position: "absolute",
        bottom: 160,
        width: "100%",
        ...style,
      }}
    >
      {titleText.split(" ").map((word, index) => {
        return (
          <span
            key={`${word}-${index}`}
            style={{
              marginLeft: 10,
              marginRight: 10,
              display: "inline-block",
              color: titleColor,
              scale: interpolate(frame, [index * 5, index * 5 + fps], [0, 1], {
                easing: Easing.spring({ damping: 200 }),
                output: "perceptual-scale",
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {word}
          </span>
        );
      })}
    </Interactive.H1>
  );
};

const titleSchema = {
  titleText: { type: "text-content", default: "Welcome to Remotion", description: "Title" },
  titleColor: { type: "color", default: "#000000", description: "Title color" },
} as const satisfies InteractivitySchema;

export const Title = Interactive.withSchema({
  Component: TitleInner,
  componentName: "<Title>",
  schema: titleSchema,
  wrapInSequence: true,
});
