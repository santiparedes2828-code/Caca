# Entorno cloud de Claude Code: lo que ya se sabe

| Problema | Solución en este repo |
|---|---|
| Remotion no puede descargar Chrome Headless Shell (`remotion.media` bloqueado) | `remotion.config.ts` usa `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` si existe |
| Google Fonts falla dentro del navegador de render (Chromium no usa el proxy) | Fuentes locales en `public/fonts/` (de `@fontsource`, OFL) cargadas con `@remotion/fonts`. Para otra fuente: `npm pack @fontsource/<fuente>` en el scratchpad y copiar los `.woff2` `latin` que hagan falta |
| SFX de `remotion.media` bloqueados | Sintetizar con ffmpeg (`anoisesrc` + `bandpass` para whoosh, `aevalsrc` seno grave para golpes) en `public/sfx/` |
| Whisper no descarga modelos (`huggingface.co` bloqueado) | `transcribir.py` sale con código 2 → usar ElevenLabs Scribe, o que el usuario añada `huggingface.co` en *Network access* del entorno |
| APIs de OpenAI / ElevenLabs / Groq bloqueadas por curl | Usar el conector MCP de ElevenLabs; sus archivos se descargan de `storage.googleapis.com` (accesible) |
| ElevenLabs: "Free Tier access has been disabled" | Algunas variaciones fallan; las que terminan sirven. Para más, la cuenta necesita plan de pago |
| npm y PyPI | Accesibles |

Volumen: una pista mono se duplica en estéreo al renderizar (+3 dB de loudness). `cortar_silencios.py` ya lo compensa.
