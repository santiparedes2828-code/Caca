import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, Revelacion, rnd } from "./Huevos";
import { Frase } from "./Quesadilla";
import { Estado, Reloj, Sartén } from "./RecetaVideo";

// Video 3 (13,9 s): mismo plato (huevos en salsa de tomate, receta de ejemplo), con otro arranque.
// Datos del video 1 que pasó el usuario: 27 s, promedio visto 3,2 s, la mayoría se fue en el segundo 1.
// Por eso: plato terminado + problema escrito desde el fotograma 0, acercamiento rápido, sin título ni intro;
// pasos con cortes rápidos y texto grande; cierre con el resultado y «Guardala…». Sin CTA de venta.
// Audio: public/ebook/hambre_mezcla.wav (voz +0,05 s; riser 7,87–9,53; golpe 9,53).

export const HAMBRE_FRAMES = Math.round(13.9 * 30);
const fps = 30;
const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// cortes (s): gancho · cebolla y ajo · pimentón · tomate · huevos · tapa · resultado · guardala
const CORTES = [0, 2.74, 4.0, 4.85, 6.58, 8.68, 9.53, 10.3];

const base: Estado = { cebolla: 0, dorado: 0, ajo: 0, pimenton: 0, vertido: 0, salsa: 0, huecos: 0, huevos: [], cocido: 0, tapa: 0, hervor: 0, t: 0 };

export const Hambre: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / fps;
  const i = CORTES.filter((c) => s >= c).length - 1;
  const desde = CORTES[i];
  const u = s - desde;
  // golpe de zoom en cada corte + encuadres alternados (cerca / más cerca)
  const golpe = 1 + 0.1 * Math.exp(-u * 10);
  const encuadre = i % 2 === 0 ? 1 : 1.18;
  const origen = ["50% 55%", "50% 60%", "45% 55%", "55% 58%", "50% 55%", "50% 55%", "50% 55%", "50% 55%"][i];

  let e: Estado = { ...base, t: s };
  if (i === 1) e = { ...e, cebolla: lin(s, 2.74, 3.0), dorado: lin(s, 2.8, 4.0), ajo: lin(s, 3.3, 3.7) };
  if (i === 2) e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: lin(s, 4.0, 4.85) };
  if (i === 3) e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, vertido: lin(s, 4.85, 5.6), salsa: lin(s, 4.9, 5.8, 0, 1, Easing.out(Easing.quad)), hervor: lin(s, 5.8, 6.2) };
  if (i === 4)
    e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, salsa: 1, hervor: 1, huecos: lin(s, 6.6, 7.4, 0, 4), huevos: [0, 1, 2, 3].map((k) => lin(s, 7.68 + k * 0.18, 7.86 + k * 0.18)) };
  if (i === 5) e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, salsa: 1, hervor: 1, huecos: 4, huevos: [1, 1, 1, 1], tapa: lin(s, 8.68, 8.95, 0, 1, Easing.out(Easing.back(1.4))), cocido: lin(s, 8.9, 9.5) };

  // temblor mientras sube el riser (tapa)
  const temblor = i === 5 ? lin(s, 8.68, 9.53, 1, 12, Easing.in(Easing.quad)) : 0;
  const tx = (rnd(frame) - 0.5) * 2 * temblor;
  const ty = (rnd(frame + 77) - 0.5) * 2 * temblor;
  const flash = i === 6 ? lin(s, 9.53, 9.68, 0.9, 0) : 0;

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      <Audio src={staticFile("ebook/hambre_mezcla.wav")} />

      {/* 0 · gancho: plato terminado desde el fotograma 0 con acercamiento rápido + el problema */}
      {i === 0 && (
        <>
          <AbsoluteFill style={{ transform: `scale(${lin(s, 0, 0.35, 1.45, 1.0, Easing.out(Easing.cubic)) + lin(s, 0.35, 2.74, 0, 0.06)})`, transformOrigin: "50% 58%" }}>
            <Revelacion limpio />
          </AbsoluteFill>
          <Frase s={s} palabras={[{ txt: "¿Llegás", t: -0.2 }, { txt: "con hambre", t: -0.2, marca: true }]} top={240} size={104} />
          <Frase s={s} palabras={[{ txt: "y no sabés", t: 1.05 }, { txt: "qué cocinar?", t: 1.45 }]} top={530} size={88} />
        </>
      )}

      {/* 1–5 · proceso con cortes rápidos */}
      {i >= 1 && i <= 5 && (
        <>
          <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${golpe * encuadre})`, transformOrigin: origen }}>
            <Sartén e={e} />
          </AbsoluteFill>
          {i === 1 && <Frase s={s} palabras={[{ txt: "Cebolla", t: 2.74 }, { txt: "+ ajo", t: 3.3, marca: true }]} top={250} size={120} color="#FFF6EA" />}
          {i === 2 && <Frase s={s} palabras={[{ txt: "Pimentón", t: 4.0, marca: true }]} top={250} size={130} color="#FFF6EA" />}
          {i === 3 && (
            <>
              <Frase s={s} palabras={[{ txt: "Tomate", t: 4.85, marca: true }]} top={250} size={130} color="#FFF6EA" />
              {s >= 5.5 && (
                <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, background: C.cream, borderRadius: 60, padding: "10px 34px 10px 12px", transform: `scale(${lin(s, 5.5, 5.62, 0, 1, Easing.out(Easing.back(2)))})`, boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
                    <Reloj t={lin(s, 5.5, 6.58) * 2} size={84} />
                    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: C.ink }}>10 MIN</div>
                  </div>
                </div>
              )}
            </>
          )}
          {i === 4 && (
            <>
              <Frase s={s} palabras={[{ txt: "4 huecos", t: 6.6 }]} top={250} size={120} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "4 huevos", t: 7.68, marca: true }]} top={400} size={120} color="#FFF6EA" />
            </>
          )}
          {i === 5 && (
            <>
              <Frase s={s} palabras={[{ txt: "Tapá", t: 8.7, marca: true }]} top={250} size={130} color="#FFF6EA" />
              <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, color: C.mustard, opacity: lin(s, 8.85, 8.95) }}>6–8 min</div>
            </>
          )}
        </>
      )}

      {/* 6 · resultado */}
      {i === 6 && (
        <>
          <AbsoluteFill style={{ transform: `scale(${1.25 - 0.25 * lin(s, 9.53, 9.8, 0, 1, Easing.out(Easing.back(1.6)))}) rotate(${lin(s, 9.53, 9.8, -4, 0)}deg)` }}>
            <Revelacion limpio />
          </AbsoluteFill>
          <Frase s={s} palabras={[{ txt: "¡Listo!", t: 9.53, marca: true }]} top={250} size={140} />
        </>
      )}

      {/* 7 · cierre: el resultado de fondo + «Guardala…» */}
      {i === 7 && (
        <>
          <AbsoluteFill style={{ transform: `scale(${1 + lin(s, 10.3, 13.9, 0, 0.06)})` }}>
            <Revelacion limpio />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(43,33,24,0.82) 0%, rgba(43,33,24,0.35) 45%, rgba(43,33,24,0) 70%)" }} />
          <Frase s={s} palabras={[{ txt: "Guardala", t: 10.3, marca: true }]} top={230} size={130} color="#FFF6EA" />
          <Frase s={s} palabras={[{ txt: "para la próxima vez", t: 10.95 }]} top={410} size={76} color="#FFF6EA" />
          <Frase s={s} palabras={[{ txt: "que te quedes", t: 11.7 }, { txt: "sin ideas", t: 12.2 }]} top={510} size={76} color="#FFF6EA" />
          {/* ícono genérico de «guardar» que se llena */}
          <svg width={220} height={260} viewBox="0 0 220 260" style={{ position: "absolute", left: 430, top: 1290, transform: `scale(${lin(s, 10.4, 10.6, 0, 1, Easing.out(Easing.back(2)))})` }}>
            <path d="M 30 20 Q 30 6 44 6 L 176 6 Q 190 6 190 20 L 190 246 L 110 186 L 30 246 Z" fill={C.cream} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
            <clipPath id="relleno">
              <rect x={0} y={260 - 260 * lin(s, 12.4, 12.8)} width={220} height={260} />
            </clipPath>
            <path d="M 30 20 Q 30 6 44 6 L 176 6 Q 190 6 190 20 L 190 246 L 110 186 L 30 246 Z" fill={C.mustard} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" clipPath="url(#relleno)" />
          </svg>
          <div style={{ position: "absolute", left: 72, right: 72, top: 1600, display: "flex", justifyContent: "center", opacity: lin(s, 10.6, 10.8) }}>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: "#FFF6EA", background: "rgba(43,33,24,0.78)", padding: "8px 22px", borderRadius: 30 }}>Receta de ejemplo · ilustración</div>
          </div>
        </>
      )}

      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </AbsoluteFill>
  );
};
