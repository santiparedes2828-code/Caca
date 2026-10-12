# Hook House · Autopilot

Producción automatizada de vídeos de Hook House para TikTok, Reels y Shorts (Remotion + FFmpeg + ElevenLabs).

**Estado:** las 7 etapas funcionan en versión básica (ver [PENDIENTE.md](PENDIENTE.md) para lo que falta pulir).
Reglas permanentes (solo Inter, emojis estilo iOS…) en [CLAUDE.md](CLAUDE.md). Arquitectura en
[docs/arquitectura.md](docs/arquitectura.md); estado para retomar en otra sesión en
[docs/TRASPASO.md](docs/TRASPASO.md).

| Etapa | Qué hace |
|---|---|
| 1 Base | Vídeo → vertical 1080x1920 con subtítulos de marca, SRT, informe de calidad; original intacto |
| 2 Material del cliente | Transcripción (ElevenLabs), encuadre que sigue la cara, subtítulos que no tapan caras, cortes de silencio no destructivos, escenas, ruido |
| 3 Edición inteligente | Plan editorial, clips de un vídeo largo, versiones cortas, B-roll y música con licencia, Claude opcional, aprobación del plan |
| 4 Narración | Voz de marca (ElevenLabs, Rodrigo Zabú) con tiempos por palabra |
| 5 Creación | Guion o idea → narración (o sin voz) → escenas con motion graphics según el tema (o la identidad de la marca) → MP4 |
| 6 Automatización | Cola en disco, trabajador concurrente, reintentos, recuperación, lotes, costes y alertas |
| 7 Web y clientes | Interfaz con usuarios por cliente, subida, progreso, vista previa, descargas, informes |

## Instalación

```console
npm ci
npm run setup:python      # opcional: detección de caras (OpenCV en .venv/)
cp .env.example .env      # y rellena ELEVENLABS_API_KEY (y ANTHROPIC_API_KEY si quieres Claude)
npm run autopilot -- elevenlabs   # comprueba la clave y muestra tu plan real
```

Requisitos: Node 22, FFmpeg/FFprobe, Python 3 (opcional). Las claves van solo en `.env` (ignorado por Git).

## Uso rápido

**Interfaz web** (recomendado):

```console
npm run autopilot -- usuario admin --rol admin          # pide la contraseña
npm run autopilot -- usuario ana --rol cliente --cliente hookhouse
npm run autopilot -- web                                # http://127.0.0.1:4321 (incluye el trabajador de la cola)
```

**Desde el teléfono**: arranca con `npm run autopilot -- web --red` y abre en el teléfono la dirección que muestra
(«Desde el teléfono…», p. ej. `http://192.168.1.23:4321`). El teléfono debe estar en la misma Wi-Fi que el ordenador,
o en la misma red de [Tailscale](https://tailscale.com) si estás fuera. El ordenador tiene que estar encendido con la
web en marcha. Va sin HTTPS: no la abras directamente a internet (para eso, un proxy HTTPS y `HH_WEB_SECURE_COOKIE=1`).

**Carpeta de entrada**: deja vídeos (y su `.srt`/`.json` con el mismo nombre) en `inbox/hookhouse/` y ejecuta
`npm run autopilot -- bandeja` (o `--vigilar`).

**Línea de comandos** (todas las opciones: `npm run autopilot`):

```console
# Editar un vídeo
npm run autopilot -- procesar grabacion.mp4
npm run autopilot -- procesar podcast.mp4 --edicion podcast --clips 3 --clip-min 20 --clip-max 60
npm run autopilot -- procesar anuncio.mp4 --edicion anuncio --corto 15,30 --aprobar-plan
npm run autopilot -- aprobar <id>

# Crear un vídeo desde un guion
npm run autopilot -- crear --guion guion.txt --tipo anuncio
npm run autopilot -- crear --brief "Servicio de edición automática para agencias" --segundos 30   # requiere Claude

# Cola y lotes
npm run autopilot -- encolar carpeta-de-videos/
npm run autopilot -- trabajador --concurrencia 2
npm run autopilot -- cola | pausar | reanudar | costes
```

Salidas en `data/clients/<cliente>/jobs/<id>/output/`: MP4 por variante (principal, clips, cortos), SRT,
`informe.md`, `plan.md` y fotogramas de control.

### Formato del guion (creación)

```text
Las agencias que más crecen en *TikTok* no editan sus videos.

[lista: Agencias | Coaches | Creadores]
Para agencias, coaches y creadores.

[cifra: clips | 3]
Te entregamos tres clips cada semana.

[cta: AUTO]
Escríbeme auto y te muestro cómo funciona.
```

Bloques separados por una línea en blanco; `[titular|lista|cifra|cta|modelo|paso|prompt|cadena: …]` elige el
componente; `*palabra*` se destaca. Las escenas largas se dividen solas.

```text
[paso: Máscara de texto]
Primero, las palabras aparecen detrás de una línea.

[prompt: Revela el texto desde una *máscara*. | Claude]
Pídeselo así a tu asistente.

[cadena: Guion | Voz | Vídeo]
El guion empuja a la voz y la voz al vídeo.
```

`[paso: Título]` pone un número grande con su etiqueta y se numera solo («PASO 2 DE 5»); `[prompt: texto | Nombre]`
escribe el texto en una tarjeta de chat y lo envía; `[cadena: A | B | C]` son bloques que entran y se empujan
hasta provocar una acción.

### Estilo visual de los vídeos creados

- **Según el tema** (lo normal para ideas): el sistema lee la idea y elige un tema (cítrico, comida, salud,
  deporte, tecnología, finanzas, belleza, viajes, naturaleza, mascotas, entretenimiento, ciencia, curiosidades o
  general).
  Cada tema trae su paleta, su forma de destacar palabras en los subtítulos, su movimiento y su fondo animado
  (el texto siempre en Inter). Cada escena lleva un icono animado relacionado con lo que se dice («limón» → 🍋, «ADN» → 🧬),
  las listas salen en tarjetas y la llamada a la acción en un botón que siempre cabe.
- **Identidad de la marca**: la del cliente (Hook House: verde y serif, logo al final). Para anuncios de la
  propia marca. Se elige con `--estilo marca` o en la web; en automático solo se usa si el contenido nombra la marca.

```console
npm run autopilot -- crear --guion guion.txt --brief "Datos curiosos sobre mandarinas"   # tema cítrico
npm run autopilot -- crear --guion anuncio.txt --estilo marca                           # identidad Hook House
npm run autopilot -- crear --guion guion.txt --tema deporte --sin-voz                   # tema fijo, sin narración
```

`--sin-voz` hace el vídeo sin narración: el texto aparece a ritmo de lectura y el sonido se añade en TikTok o
Reels. `--efectos` añade efectos de sonido propios (whoosh, pop, brillo…), `--claves-grandes` agranda las palabras
clave y `--claves-garamond` las pone en EB Garamond Bold Italic (solo si el pedido lo pide; la regla es Inter).
`[modelo: atomo|luz|formula|espaciotiempo]` en el guion pone un modelo animado en la escena
(`[modelo: formula | E=mc²]`). El tema «ciencia» trae cielo de estrellas, palabras que brillan, zoom y destellos.
Recursos y licencias en [docs/licencias.md](docs/licencias.md).

**Animaciones para dar dinamismo** ([estilo-animaciones.md](estilo-animaciones.md)): cada icono, tarjeta, cifra o
bloque entra en la palabra en que la voz lo nombra, y las cifras ruedan como un odómetro. Las animaciones especiales
(texto que sube desde detrás de una regla, cámara que sigue lo que pasa, el icono que se transforma en la escena
siguiente, cortes secos) son recursos para dar ritmo, no un paquete: el sistema las reparte solo, como mucho una por
escena, alternándolas y nunca la misma dos veces seguidas. El informe dice dónde puso cada una.

## Calidad y revisión

Cada vídeo pasa controles automáticos (archivo, códecs, resolución, fps, duración, decodificación, audio, sonoridad
−14 LUFS, picos, negros, pantallas vacías, subtítulos dentro del vídeo y sin tapar caras, confianza de la
transcripción, SRT válido). Veredicto: **APROBADO** (completado) · **ADVERTENCIA** (requiere revisión, se entrega)
· **FALLIDO** (no se entrega; se puede reintentar). Los anuncios con afirmaciones (cifras, superlativos) siempre
quedan en revisión. **La revisión humana sigue siendo necesaria.**

## Proveedores externos y costes

- **ElevenLabs**: transcripción (solo audio mono del tramo) y narración (solo el texto). Caché por cliente, límites
  por trabajo y por día, reintentos sin riesgo de doble cobro, uso en `data/usage/`.
- **Claude** (opcional): elige fragmentos o escribe guiones; recibe solo texto. Su salida se valida y nunca se ejecuta.
- Costes **reales** (lo que dice el proveedor) y **estimados** (con tarifas configurables) separados en cada informe y
  en `npm run autopilot -- costes`.

## Pruebas

```console
npm run lint        # eslint + tsc
npm test            # pruebas unitarias (segundos)
npm run test:e2e    # extremo a extremo con render real (~12 min)
```

Las APIs de ElevenLabs y Anthropic se simulan en `tests/support/` (claramente separadas del código real). Las
integraciones reales verificadas están anotadas en PENDIENTE.md.

## Licencias

Remotion exige licencia de empresa a partir de cierto tamaño ([condiciones](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md));
clave en `REMOTION_LICENSE_KEY`. Única fuente: Inter (OFL) en `public/fonts/`; emojis Fluent Emoji en color (MIT);
modelo de caras YuNet (MIT) en `models/`.
B-roll y música solo desde `library/` y `clients/<id>/library/` con licencia declarada (ver `library/README.md`).
