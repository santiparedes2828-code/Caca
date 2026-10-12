import { makeCancelSignal, renderMedia, selectComposition } from "@remotion/renderer";
import { editPropsSchema, type EditProps } from "../../src/autopilot/props";
import { browserExecutable, type Config } from "../config";

// Render de la composición AutopilotEdit a MP4 H.264 + AAC (compatible con TikTok, Reels y Shorts).
export const COMPOSITION_ID = "AutopilotEdit";

export const renderEdit = (opts: Omit<Parameters<typeof renderComposition>[0], "id" | "props"> & { props: EditProps }) =>
  renderComposition({ ...opts, id: COMPOSITION_ID, props: editPropsSchema.parse(opts.props) });

// Render genérico de cualquier composición registrada en src/Root.tsx (props ya validadas por quien llama)
export const renderComposition = async (opts: {
  cfg: Config;
  serveUrl: string;
  id: string;
  props: Record<string, unknown>;
  output: string;
  onProgress?: (p: number) => void;
  shouldCancel?: () => boolean;
  onBrowserError?: (m: string) => void;
}) => {
  const inputProps = opts.props;
  const exe = browserExecutable(opts.cfg);
  const composition = await selectComposition({
    serveUrl: opts.serveUrl,
    id: opts.id,
    inputProps,
    browserExecutable: exe,
    timeoutInMilliseconds: opts.cfg.HH_RENDER_TIMEOUT_MS,
    chromiumOptions: { gl: "angle" },
    logLevel: "error",
  });
  const { cancelSignal, cancel } = makeCancelSignal();
  const poll = setInterval(() => {
    if (opts.shouldCancel?.()) cancel();
  }, 1000);
  try {
    await renderMedia({
      serveUrl: opts.serveUrl,
      composition,
      inputProps,
      codec: "h264",
      audioCodec: "aac",
      audioBitrate: "192k",
      pixelFormat: "yuv420p",
      crf: 18,
      colorSpace: "bt709",
      imageFormat: "jpeg",
      jpegQuality: 92,
      outputLocation: opts.output,
      overwrite: true,
      concurrency: opts.cfg.HH_RENDER_CONCURRENCY,
      browserExecutable: exe,
      chromiumOptions: { gl: "angle" },
      timeoutInMilliseconds: opts.cfg.HH_RENDER_TIMEOUT_MS,
      cancelSignal,
      logLevel: "error",
      licenseKey: opts.cfg.REMOTION_LICENSE_KEY ?? null,
      onBrowserLog: (l) => {
        if (l.type === "error") opts.onBrowserError?.(l.text.slice(0, 500));
      },
      onProgress: ({ progress }) => opts.onProgress?.(progress),
    });
  } finally {
    clearInterval(poll);
  }
  return { durationInFrames: composition.durationInFrames, width: composition.width, height: composition.height, fps: composition.fps };
};
