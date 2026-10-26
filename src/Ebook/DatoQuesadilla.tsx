import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, Cocinera, Defs, FONT, pop } from "./Huevos";
import { EscenaEstirado, Frase, MediaLuna, Mesa, QDefs, Tablita, Tortilla } from "./Quesadilla";

// Dato curioso (17,4 s): en Ciudad de México una quesadilla puede no llevar queso; lo que la define es la tortilla
// doblada y, si la querés con queso, se pide «con queso». Fuente: Mexico News Daily, «To cheese or not to cheese:
// What's in a quesadilla?» (mexiconewsdaily.com). Gancho en forma de pregunta (pedido del usuario).
// Audio: public/ebook/dato_mezcla.wav. Tiempos de la voz (Scribe + medición) abajo.

export const DATO_FRAMES = Math.round(17.4 * 30);
const fps = 30;
const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

const CORTES = [0, 4.05, 6.9, 10.65, 14.1];

// tarjeta de relleno: media luna abierta con el relleno a la vista
const Relleno: React.FC<{ x: number; y: number; k: number; tipo: "papa" | "hongos" | "flor"; nombre: string; rot: number }> = ({ x, y, k, tipo, nombre, rot }) => (
  <div style={{ position: "absolute", left: x - 170, top: y, width: 340, transform: `scale(${k * 1.55}) rotate(${rot}deg)`, opacity: Math.min(1, k * 3) }}>
    <svg width={340} height={240} viewBox="0 0 340 240">
      <Defs />
      <QDefs />
      <ellipse cx={170} cy={170} rx={160} ry={60} fill="#3A1E0E" opacity={0.25} filter="url(#vapor)" />
      <path d="M 20 160 A 150 120 0 0 1 320 160 Z" fill="url(#tortilla)" stroke="#D2A86B" strokeWidth={4} />
      {tipo === "papa" &&
        Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={70 + (i % 4) * 50 + (i > 7 ? 15 : 0)} y={90 + Math.floor(i / 4) * 22} width={34} height={28} rx={8} fill={i % 3 ? "#F0D9A0" : "#E2BE72"} stroke="#C9A060" strokeWidth={2} />
        ))}
      {tipo === "hongos" &&
        Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`translate(${80 + (i % 4) * 52} ${100 + Math.floor(i / 4) * 34})`}>
            <path d="M -22 4 Q -22 -22 0 -22 Q 22 -22 22 4 Z" fill="#8A5A3A" />
            <rect x={-6} y={2} width={12} height={16} rx={4} fill="#E6D2B8" />
          </g>
        ))}
      {tipo === "flor" &&
        Array.from({ length: 5 }, (_, i) => (
          <g key={i} transform={`translate(${90 + i * 40} ${110 + (i % 2) * 22}) rotate(${i * 30})`}>
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-14} rx={9} ry={18} fill={a % 144 ? "#F7A21C" : "#FFC24A"} transform={`rotate(${a})`} />)}
            <circle r={6} fill="#5E9A3A" />
          </g>
        ))}
    </svg>
    <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 52, color: "#FFF6EA", marginTop: -10, textShadow: "0 5px 0 rgba(0,0,0,0.35)" }}>{nombre}</div>
  </div>
);

const Boton: React.FC<{ txt: string; marca: string; k: number; color: string; x: number; y: number }> = ({ txt, marca, k, color, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 420, transform: `scale(${k * 1.0})`, opacity: Math.min(1, k * 3), textAlign: "center", background: color, borderRadius: 40, padding: "34px 0", boxShadow: "0 12px 0 rgba(0,0,0,0.3)", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "#FFF", lineHeight: 1.0 }}>
    <div style={{ fontSize: 96 }}>{marca}</div>
    {txt}
  </div>
);

export const DatoQuesadilla: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / fps;
  const i = CORTES.filter((c) => s >= c).length - 1;
  const u = s - CORTES[i];
  const golpe = 1 + 0.08 * Math.exp(-u * 10);
  const flash = i === 3 ? lin(s, 10.65, 10.8, 0.8, 0) : 0;

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      <Audio src={staticFile("ebook/dato_mezcla.wav")} />
      <AbsoluteFill style={{ transform: `scale(${golpe})` }}>
        {/* 0 · la pregunta, con una quesadilla abierta… sin queso, desde el fotograma 0 */}
        {i === 0 && (
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <QDefs />
              <Mesa />
            </svg>
            {/* la quesadilla abierta y sin queso, abajo */}
            <AbsoluteFill style={{ transform: `translateY(450px) scale(${lin(s, 0, 0.35, 1.15, 1.0, Easing.out(Easing.cubic))})`, transformOrigin: "50% 70%" }}>
              <EscenaEstirado s={s + 0.6} desde={0} sinQueso />
              <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
                <g transform={`translate(540 1080) scale(${pop(s, 0.15)}) rotate(${Math.sin(s * 4) * 6})`}>
                  <text x={0} y={60} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={220} fill={C.tomato} stroke="#FFF6EA" strokeWidth={10} paintOrder="stroke">?</text>
                </g>
              </svg>
            </AbsoluteFill>
            {/* la cocinera, dudando, desde el fotograma 0 (entra con un acercamiento rápido) */}
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <g transform={`translate(540 1350) scale(${lin(s, 0, 0.3, 1.25, 1, Easing.out(Easing.back(1.4)))}) rotate(${Math.sin(s * 5) * 2.5}) translate(-540 -1350)`}>
                <Cocinera cx={540} cy={950} s={1.0} />
              </g>
            </svg>
            <Frase s={s} palabras={[{ txt: "¿Cómo es posible", t: -0.2 }]} top={200} size={92} />
            <Frase s={s} palabras={[{ txt: "que en México", t: 1.1 }]} top={322} size={76} />
            <Frase s={s} palabras={[{ txt: "una quesadilla", t: 1.95 }, { txt: "venga", t: 2.6 }]} top={425} size={76} />
            <Frase s={s} palabras={[{ txt: "SIN QUESO?", t: 3.2, marca: true }]} top={535} size={100} />
          </>
        )}

        {/* 1 · lo que la define: la tortilla doblada */}
        {i === 1 && (
          <>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <QDefs />
              <Mesa />
              <Tablita cx={540} cy={1100} r={470} />
              {s < 5.95 ? (
                <>
                  <Tortilla cx={540} cy={1100} r={360} />
                  {s >= 5.5 && (
                    <g transform={`translate(0 1100) scale(1 ${1 - 2 * lin(s, 5.55, 5.95, 0, 1, Easing.inOut(Easing.quad))}) translate(0 -1100)`}>
                      <path d={`M ${540 - 360} 1100 A 360 310 0 0 0 ${540 + 360} 1100 Z`} fill="url(#tortilla)" stroke="#D2A86B" strokeWidth={4} />
                    </g>
                  )}
                </>
              ) : (
                <g transform={`translate(0 ${-Math.exp(-(s - 5.95) * 9) * 30})`}>
                  <MediaLuna cx={540} cy={1100} r={360} tostado={0.6} sinQueso />
                </g>
              )}
            </svg>
            <Frase s={s} palabras={[{ txt: "Lo que la define:", t: 4.09 }]} top={250} size={88} />
            <Frase s={s} palabras={[{ txt: "la tortilla", t: 5.29 }, { txt: "DOBLADA", t: 5.89, marca: true }]} top={380} size={104} />
          </>
        )}

        {/* 2 · rellenos */}
        {i === 2 && (
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, #5A463C 0%, #2B2118 100%)` }}>
            <Frase s={s} palabras={[{ txt: "El relleno", t: 6.95 }, { txt: "puede ser:", t: 7.35 }]} top={250} size={92} color="#FFF6EA" />
            <Relleno x={330} y={560} k={pop(s, 8.0)} tipo="papa" nombre="papa" rot={-4} />
            <Relleno x={760} y={860} k={pop(s, 8.6)} tipo="hongos" nombre="hongos" rot={4} />
            <Relleno x={400} y={1170} k={pop(s, 9.35)} tipo="flor" nombre="flor de calabaza" rot={-2} />
          </AbsoluteFill>
        )}

        {/* 3 · si la querés con queso, se pide */}
        {i === 3 && (
          <>
            <AbsoluteFill style={{ transform: `scale(${1.25 - 0.2 * lin(s, 10.65, 10.95, 0, 1, Easing.out(Easing.back(1.6)))})`, transformOrigin: "50% 62%" }}>
              <EscenaEstirado s={s} desde={10.65} />
            </AbsoluteFill>
            <Frase s={s} palabras={[{ txt: "¿La querés", t: 10.69 }, { txt: "con queso?", t: 11.2 }]} top={240} size={92} />
            <Frase s={s} palabras={[{ txt: "Pedila", t: 12.1 }, { txt: "«CON QUESO»", t: 13.1, marca: true }]} top={480} size={96} />
          </>
        )}

        {/* 4 · ¿y vos? — pregunta para comentarios */}
        {i === 4 && (
          <AbsoluteFill style={{ background: C.cream }}>
            <Frase s={s} palabras={[{ txt: "¿Y vos?", t: 14.12 }]} top={300} size={150} />
            <Boton txt="queso" marca="CON" k={pop(s, 14.94)} color={C.tomato} x={80} y={660} />
            <Boton txt="queso" marca="SIN" k={pop(s, 15.6)} color={C.ink} x={580} y={660} />
            <Frase s={s} palabras={[{ txt: "Contalo en", t: 16.3 }, { txt: "comentarios", t: 16.45, marca: true }]} top={1100} size={84} />
            <div style={{ position: "absolute", left: 72, right: 72, top: 1560, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 26, color: "#8A7A6A", opacity: lin(s, 14.3, 14.6) }}>Fuente: Mexico News Daily · ilustración</div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </AbsoluteFill>
  );
};
