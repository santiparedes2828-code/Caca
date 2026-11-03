import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { FPS } from "./datos";
import { C, FONT_T } from "./tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ── Efecto de sonido en un frame (relativo a la Sequence que lo contiene) ──
export type NombreSfx = "whoosh" | "swish" | "pop" | "ding" | "tick" | "scratch" | "claqueta" | "boing" | "obturador" | "tada" | "stop" | "brillo";
export const Sfx: React.FC<{ at: number; s: NombreSfx; v?: number }> = ({ at, s, v = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={2 * FPS} layout="none">
    <Audio src={staticFile(`traduccion/sfx/${s}.wav`)} volume={v} />
  </Sequence>
);

// ── Cortina de transición: franjas de colores con las bases del ARN ──────
export const CORTINA = 20; // frames; el corte queda tapado en la mitad
const FRANJAS = [
  { c: C.rojo, l: "A" },
  { c: C.amarillo, l: "U" },
  { c: C.verde, l: "G" },
  { c: C.azul, l: "C" },
];
export const Cortina: React.FC = () => {
  const f = useCurrentFrame();
  const W = 640;
  const total = FRANJAS.length * W;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {FRANJAS.map((fr, k) => {
        // el grupo entra por la izquierda, tapa la pantalla entera justo en la mitad (el corte) y sale por la derecha;
        // cada franja se despega un poco de las vecinas para dar efecto de ola
        const mitad = CORTINA / 2;
        const ease = (q: number) => 1 - Math.pow(1 - q, 3);
        const x0 =
          f < mitad
            ? -total - 340 + ease(f / mitad) * (total + 20)
            : -320 + Math.pow((f - mitad) / mitad, 3) * (1920 + 340 + 320);
        const ola = Math.sin((f / CORTINA) * Math.PI) * (k - 1.5) * -30;
        const x = x0 + k * W + ola;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              top: -100,
              left: x,
              width: W + 4,
              height: 1280,
              background: fr.c,
              transform: "skewX(-14deg)",
              borderRight: `8px solid ${C.tinta}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT_T, fontWeight: 800, fontSize: 260, color: C.tinta, opacity: 0.18, transform: "skewX(14deg)" }}>{fr.l}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Garabatos de cuaderno que se dibujan solos y flotan ──────────────────
const DOODLES: { x: number; y: number; r: number; d: string; s?: number }[] = [
  // estrellita
  { x: 40, y: 170, r: -8, d: "M30 4 L37 22 L56 22 L41 34 L47 53 L30 41 L13 53 L19 34 L4 22 L23 22 Z" },
  // hélice
  { x: 34, y: 520, r: 0, d: "M10 0 C 50 20, 50 40, 10 60 C -30 80, -30 100, 10 120 M50 0 C 10 20, 10 40, 50 60 C 90 80, 90 100, 50 120 M14 18 L46 18 M14 42 L46 42 M14 78 L46 78 M14 102 L46 102", s: 0.8 },
  // molécula (hexágono)
  { x: 36, y: 860, r: 10, d: "M30 2 L56 17 L56 47 L30 62 L4 47 L4 17 Z M56 17 L78 6 M30 62 L30 84" },
  // flecha curva
  { x: 1790, y: 990, r: -10, d: "M4 40 C 20 4, 60 4, 76 30 M66 16 L77 31 L60 36" },
  // ribosoma
  { x: 1800, y: 30, r: 6, d: "M8 30 C 8 8, 62 8, 62 30 C 62 44, 8 44, 8 30 Z M14 52 C 14 42, 56 42, 56 52 C 56 62, 14 62, 14 52 Z" },
  // rayito
  { x: 300, y: 1000, r: 0, d: "M30 0 L10 34 L28 34 L16 64 L50 24 L32 24 L44 0 Z", s: 0.9 },
];
export const Garabatos: React.FC<{ color?: string }> = ({ color = "#9DB3CF" }) => {
  const f = useCurrentFrame();
  return (
    <>
      {DOODLES.map((g, k) => {
        const dibujo = interpolate(f, [k * 4, k * 4 + 24], [1, 0], clamp);
        return (
          <svg
            key={k}
            width={100}
            height={140}
            viewBox="-10 -10 100 140"
            style={{
              position: "absolute",
              left: g.x,
              top: g.y + Math.sin(f * 0.05 + k) * 6,
              transform: `rotate(${g.r + Math.sin(f * 0.03 + k * 2) * 5}deg) scale(${g.s ?? 1})`,
              opacity: 0.75,
            }}
          >
            <path d={g.d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={dibujo} />
          </svg>
        );
      })}
    </>
  );
};

// ── Subtítulo con palabras clave subrayadas con marcador ─────────────────
const CLAVES =
  /^(adn|arn|arnm|arnt|mensajero|transferencia|ribosomas?|cod[oó]n|codones|anticod[oó]n|amino[aá]cidos?|prote[ií]nas?|transcripci[oó]n|traducci[oó]n|pept[ií]dicos?|polipept[ií]dica|n[uú]cleo|citoplasma|c[eé]lulas?|gen|gen[eé]tica|terminaci[oó]n)$/i;

const limpio = (w: string) => w.replace(/[¿?¡!.,;:«»"]/g, "");

export const TextoResaltado: React.FC<{ texto: string; f: number; color: string }> = ({ texto, f, color }) => {
  const palabras = texto.split(" ");
  let n = 0;
  return (
    <>
      {palabras.map((w, k) => {
        const clave = CLAVES.test(limpio(w));
        const delay = clave ? 3 + n++ * 4 : 0;
        const p = interpolate(f, [delay, delay + 8], [0, 1], clamp);
        return (
          <React.Fragment key={k}>
            {clave ? (
              <span
                style={{
                  backgroundImage: `linear-gradient(${color}, ${color})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 85%",
                  backgroundSize: `${p * 100}% 42%`,
                  borderRadius: 4,
                  padding: "0 3px",
                }}
              >
                {w}
              </span>
            ) : (
              w
            )}
            {k < palabras.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const pop = (f: number, delay = 0) => spring({ frame: f - delay, fps: FPS, config: { damping: 11, stiffness: 180 } });
