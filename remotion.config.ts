// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// En el entorno cloud de Claude Code no se puede descargar Chrome Headless Shell:
// se usa el Chromium preinstalado si existe. En local no hace nada.
const cloudChromium =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(cloudChromium)) {
  Config.setBrowserExecutable(cloudChromium);
}
