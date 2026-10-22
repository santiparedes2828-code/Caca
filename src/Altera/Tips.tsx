import React from "react";
import { useCurrentFrame } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "./Gancho";
import { Card, PhoneFeed, Ticket } from "./props";
import { BigStat, FilmStrip, Gate, WordsCard } from "./props2";
import { Slots, Thumb } from "./reelkit";
import { A, FONT, LABEL, Paper, Rope, Tag } from "./system";

// Carrusel de tips (1080 × 1350) con la fórmula viral: pregunta que abre bucle → giro → promesa con número →
// 3 errores con su arreglo a la vista → respuesta → CTA con beneficio. Cada fotograma = una imagen.

export const TIPS_SLIDES = 8;
const FL = 1170; // suelo
const INK = A.ink;

const Head: React.FC<{ kicker?: string; size?: number; children: React.ReactNode }> = ({ kicker, size = 96, children }) => (
  <div style={{ position: "absolute", left: 72, top: 84, width: 936 }}>
    {kicker ? (
      <div style={{ fontFamily: LABEL, fontSize: 30, letterSpacing: "0.08em", color: INK, marginBottom: 22 }}>
        <span style={{ color: A.orange }}>● </span>
        {kicker}
      </div>
    ) : null}
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: "-0.05em", color: INK }}>{children}</div>
  </div>
);
const O: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: A.orange }}>{children}</span>;
const Fix: React.FC<{ y?: number; children: React.ReactNode }> = ({ y = 470, children }) => (
  <div style={{ position: "absolute", left: 72, top: y, maxWidth: 936, display: "inline-block", background: INK, color: A.ivory, fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: "-0.03em", lineHeight: 1.1, padding: "14px 24px 18px", borderRadius: 16 }}>{children}</div>
);
const Floor: React.FC = () => <div style={{ position: "absolute", left: 0, right: 0, top: FL + 6, height: 3, background: "rgba(14,13,11,0.10)" }} />;
const Swipe: React.FC<{ i: number }> = ({ i }) => (
  <div style={{ position: "absolute", left: 72, right: 72, bottom: 56, display: "flex", justifyContent: "space-between", fontFamily: LABEL, fontSize: 26, letterSpacing: "0.1em", color: INK }}>
    <span style={{ opacity: 0.6 }}>
      <span style={{ color: A.orange }}>● </span>HOOKHOUSE · {i + 1}/{TIPS_SLIDES}
    </span>
    {i < TIPS_SLIDES - 1 ? <span style={{ color: A.orange, fontWeight: 700 }}>DESLIZA →</span> : <span style={{ opacity: 0.6 }}>GUÁRDALO</span>}
  </div>
);
const Cross: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <svg width={200 * s} height={200 * s} viewBox="0 0 200 200" style={{ position: "absolute", left: x - 100 * s, top: y - 100 * s, overflow: "visible" }}>
    <path d="M30 30 L170 170 M170 30 L30 170" stroke={A.orange} strokeWidth={26} strokeLinecap="round" />
  </svg>
);
const G: React.FC<Omit<GanchoPose, "t" | "y"> & { y?: number }> = (p) => <Gancho y={FL} t={0.4} {...p} />;

const Slide: React.FC<{ i: number }> = ({ i }) => {
  switch (i) {
    // 1 · Gancho: lo más raro + pregunta que abre bucle
    case 0:
      return (
        <>
          <Head size={104}>
            ¿Por qué la gente pasa tu video en <O>menos de 2 segundos</O>?
          </Head>
          <PhoneFeed x={330} y={FL} scale={1.15} scroll={90} />
          <G x={720} y={FL - 240} scale={0.8} expr="surprised" lean={28} armL={170} armR={150} squash={-0.12} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1350, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: "scale(0.8)" }}>
              <Thumb x={400} y={960} rot={-24} />
            </div>
          </div>
        </>
      );
    // 2 · Giro
    case 1:
      return (
        <>
          <Head kicker="SPOILER" size={110}>
            No es tu <O>contenido</O>
          </Head>
          <Card x={360} y={FL} kind="word" text="TU IDEA" rotate={-4} />
          <svg width={180} height={180} viewBox="0 0 180 180" style={{ position: "absolute", left: 420, top: 820, overflow: "visible" }}>
            <circle cx={90} cy={90} r={78} fill={A.orange} stroke={INK} strokeWidth={8} />
            <path d="M50 92 L80 122 L132 60" stroke={A.ivory} strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <G x={760} scale={0.95} expr="smug" armR={100} armL={30} look={{ x: -1, y: 0 }} />
          <Fix y={360}>es lo que pasa en los primeros 3 s</Fix>
        </>
      );
    // 3 · Promesa con número
    case 2:
      return (
        <>
          <Head kicker="ES LA EDICIÓN" size={110}>
            Son <O>3 errores</O> de edición
          </Head>
          <Fix y={360}>el 3 es el que menos se nota</Fix>
          <Slots xs={[220, 540, 860]} f={100} at={0} />
          {[220, 540, 860].map((x, k) => (
            <div key={k} style={{ position: "absolute", left: x - 90, top: 590, width: 180, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 210, letterSpacing: "-0.06em", color: k === 2 ? A.orange : INK }}>
              {k + 1}
            </div>
          ))}
          <G x={860} scale={0.55} expr="focused" look={{ x: -1, y: -0.8 }} />
        </>
      );
    // 4 · Error 1
    case 3:
      return (
        <>
          <Head kicker="ERROR 1 / 3" size={92}>
            Empezar con «hola» o con <O>tu logo</O>
          </Head>
          <Fix y={420}>Arreglo: empieza por el final, enseña el resultado primero</Fix>
          <Card x={210} y={FL - 330} kind="word" text="¡HOLA!" rotate={-6} />
          <Cross x={320} y={FL - 520} s={0.55} />
          <FilmStrip x={560} y={FL} scale={1.0} n={5} t={0} jump={0.55} />
          <G x={890} scale={0.6} expr="happy" armR={150} armL={30} />
        </>
      );
    // 5 · Error 2
    case 4:
      return (
        <>
          <Head kicker="ERROR 2 / 3" size={92}>
            Subtítulos <O>pequeños</O> o sin subtítulos
          </Head>
          <Fix y={420}>Arreglo: grandes y con la palabra clave en otro color</Fix>
          <BigStat x={290} y={FL} scale={0.85} value="85%" label="SIN SONIDO" fill={0.85} />
          <Tag x={72} y={FL + 30} text="DIGIDAY · 2016 · VIDEOS DE FACEBOOK" />
          <WordsCard x={540} y={FL - 330} scale={0.95} words={["ASÍ", "DE", "GRANDES"]} hot={2} big rotate={-3} />
          <G x={820} scale={0.75} expr="surprised" armR={150} armL={40} look={{ x: -1, y: -0.6 }} />
        </>
      );
    // 6 · Error 3
    case 5:
      return (
        <>
          <Head kicker="ERROR 3 / 3" size={92}>
            Dejar las <O>pausas</O> y los «eeh»
          </Head>
          <Fix y={420}>Arreglo: ningún silencio de más de medio segundo</Fix>
          <FilmStrip x={400} y={FL - 60} scale={1.15} n={5} t={0} cut={0.55} />
          <G x={820} scale={0.85} expr="focused" item="scissors" armR={80} armL={30} look={{ x: -1, y: 0.2 }} />
        </>
      );
    // 7 · Respuesta al gancho
    case 6:
      return (
        <>
          <Head kicker="LA RESPUESTA" size={98}>
            No se van por tu idea, se van por <O>tu edición</O>
          </Head>
          <Fix y={490}>y la edición se puede arreglar</Fix>
          <Gate x={360} y={FL} scale={0.95} open={0.5} />
          <G x={720} scale={0.85} expr="happy" armL={160} armR={150} />
          <Tag x={72} y={FL + 30} text="65 % DE QUIEN PASA LOS 3 S LLEGA A 10 S · FACEBOOK" />
        </>
      );
    // 8 · CTA
    case 7: {
      const g: GanchoPose = { x: 270, y: FL, scale: 0.85, t: 0.4, expr: "happy", hookOut: true, lean: 8, armL: 30, armR: 40 };
      const a = antennaWorld(g);
      return (
        <>
          <Head size={96}>
            ¿Quieres ver <O>tu video</O> sin esos 3 errores?
          </Head>
          <div style={{ position: "absolute", left: 72, top: 440, display: "flex", alignItems: "center", gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: "-0.045em", color: INK }}>
            Escríbeme
            <span style={{ background: A.orange, color: A.ivory, padding: "2px 24px 8px", borderRadius: 18, boxShadow: "0 18px 30px rgba(14,13,11,0.25)" }}>HOOK</span>
          </div>
          <div style={{ position: "absolute", left: 76, top: 570, fontFamily: LABEL, fontSize: 30, letterSpacing: "0.08em", color: INK }}>POR DM</div>
          <Ticket x={720} y={1010} />
          <Gancho {...g} />
          <Rope ax={a.x} ay={a.y} bx={716} by={562} slack={0.15} t={0} />
        </>
      );
    }
    default:
      return null;
  }
};

export const Tips: React.FC = () => {
  const i = useCurrentFrame();
  return (
    <Paper>
      <Floor />
      <Slide i={i} />
      <Swipe i={i} />
    </Paper>
  );
};
