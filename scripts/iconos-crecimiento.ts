// Genera src/Crecimiento/iconos.json con los emojis (Fluent Emoji, MIT) que usan las piezas de crecimiento.
import { writeFileSync } from "node:fs";
import { iconDataUri } from "../autopilot/create/theme";

const NAMES = ["light-bulb", "scissors", "check-mark-button", "backhand-index-pointing-down", "studio-microphone"];
writeFileSync("src/Crecimiento/iconos.json", `${JSON.stringify(Object.fromEntries(NAMES.map((n) => [n, iconDataUri(n)])))}\n`);
console.log(`iconos: ${NAMES.join(", ")}`);
