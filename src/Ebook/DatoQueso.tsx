import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, Cocinera, Defs, FONT, pop, rnd } from "./Huevos";
import { Frase } from "./Quesadilla";

// Dato curioso del queso (20,6 s): los agujeros del queso tipo Emmental. Las bacterias producen gas (CO₂) y las
// burbujas se forman alrededor de partículas microscópicas de heno que caen en la leche; con el ordeñe cerrado
// (más limpio) los quesos empezaron a tener menos agujeros. Agroscope y Empa (Suiza), 2015; ver swissinfo.ch y
// popsci.com. Arranca en escala microscópica (pedido del usuario) y se aleja hasta el agujero del queso.
// Audio: public/ebook/queso_mezcla.wav (voz +0,05 s; riser 12,39–14,05; golpe 14,05).

export const QUESO_FRAMES = Math.round(20.6 * 30);
const fps = 30;
const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

const T = { bacterias: 4.45, junta: 6.95, crece: 12.1, queso: 14.05, final: 18.85 };
const CENTRO = { x: 540, y: 1150 }; // centro del microscopio y de la partícula de heno

// ---------- escala microscópica ----------
const Heno: React.FC<{ x: number; y: number; s: number; rot: number }> = ({ x, y, s, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[
      ["#8A7A2E", 0, 16],
      ["#B49B45", -10, 10],
      ["#6F6224", 9, 9],
      ["#C9B25C", 3, 5],
    ].map(([col, dy, w], i) => (
      <path key={i} d={`M -170 ${dy} C -80 ${Number(dy) - 18} 60 ${Number(dy) + 16} 170 ${Number(dy) - 6}`} stroke={col as string} strokeWidth={w as number} fill="none" strokeLinecap="round" />
    ))}
    <path d="M 60 4 L 120 -40 M -60 0 L -110 34" stroke="#8A7A2E" strokeWidth={7} strokeLinecap="round" />
  </g>
);

const Bacteria: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-42} y={-15} width={84} height={30} rx={15} fill="#C07ADB" stroke="#7E3C9E" strokeWidth={4} />
    <ellipse cx={-12} cy={-5} rx={18} ry={5} fill="#FFFFFF" opacity={0.45} />
    <circle cx={14} cy={3} r={5} fill="#7E3C9E" opacity={0.5} />
  </g>
);

const Burbuja: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r} fill="#DDF1FF" fillOpacity={0.55} stroke="#4E8FC0" strokeWidth={Math.max(3, r * 0.05)} />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.25} ry={r * 0.14} fill="#FFFFFF" opacity={0.8} />
  </g>
);

const Microscopio: React.FC<{ s: number }> = ({ s }) => {
  // bacterias y glóbulos que se mueven despacio
  const bacterias = Array.from({ length: 14 }, (_, i) => {
    const a = rnd(i + 10) * Math.PI * 2;
    const d = 220 + rnd(i + 20) * 330;
    return { x: CENTRO.x + Math.cos(a + s * 0.08) * d, y: CENTRO.y + Math.sin(a + s * 0.08) * d * 0.95, rot: rnd(i + 30) * 180 + Math.sin(s * 3 + i) * 10 };
  });
  // gas: desde 4,45 s salen burbujitas de las bacterias; desde 7,9 s viajan hacia el heno
  const viaje = lin(s, 7.9, 11.5, 0, 1, Easing.inOut(Easing.quad));
  const gas = s >= T.bacterias;
  const rGrande = s < 7.9 ? 0 : lin(s, 8.4, 12.0, 20, 120) + lin(s, T.crece, T.queso - 0.05, 0, 1300, Easing.in(Easing.cubic));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <radialGradient id="leche" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stopColor="#FFF6D2" />
        <stop offset="1" stopColor="#F0D27E" />
      </radialGradient>
      <rect width={1080} height={1920} fill="url(#leche)" />
      {/* glóbulos de grasa */}
      {Array.from({ length: 26 }, (_, i) => {
        const x = rnd(i + 100) * 1080 + Math.sin(s * 0.6 + i) * 12;
        const y = rnd(i + 200) * 1920 + Math.cos(s * 0.5 + i) * 12;
        const r = 16 + rnd(i + 300) * 46;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="#FFE9A8" stroke="#E8C66A" strokeWidth={3} opacity={0.8} />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.3} ry={r * 0.16} fill="#FFFFFF" opacity={0.6} />
          </g>
        );
      })}
      <Heno x={CENTRO.x} y={CENTRO.y} s={1.25} rot={-12 + Math.sin(s * 0.7) * 3} />
      {bacterias.map((b, i) => (
        <Bacteria key={i} {...b} />
      ))}
      {gas &&
        bacterias.map((b, i) =>
          Array.from({ length: 3 }, (_, j) => {
            const ph = (s * 0.9 + rnd(i * 7 + j)) % 1;
            const x0 = b.x + Math.cos(i + j) * 50 * ph;
            const y0 = b.y - 40 - ph * 60;
            const x = x0 + (CENTRO.x + (rnd(i + j) - 0.5) * 120 - x0) * viaje;
            const y = y0 + (CENTRO.y + (rnd(i + j + 5) - 0.5) * 60 - y0) * viaje;
            return <Burbuja key={`${i}-${j}`} x={x} y={y} r={8 + rnd(i + j * 3) * 10} o={lin(s, T.bacterias, T.bacterias + 0.3) * (1 - lin(viaje, 0.85, 1))} />;
          }),
        )}
      {rGrande > 0 && <Burbuja x={CENTRO.x} y={CENTRO.y} r={rGrande} />}
      {/* lente del microscopio */}
      <mask id="lente">
        <rect width={1080} height={1920} fill="#FFFFFF" />
        <circle cx={CENTRO.x} cy={CENTRO.y} r={560} fill="#000000" />
      </mask>
      <rect width={1080} height={1920} fill="#151010" mask="url(#lente)" />
      <circle cx={CENTRO.x} cy={CENTRO.y} r={560} fill="none" stroke="#3A302A" strokeWidth={24} />
      <text x={880} y={1760} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill="#FFF6EA" opacity={0.85}>×1000</text>
    </svg>
  );
};

// ---------- queso (porción en cuña) ----------
const AGUJEROS = [
  [380, 1190, 46],
  [520, 1260, 34],
  [660, 1180, 52],
  [800, 1250, 30],
  [450, 1330, 26],
  [720, 1335, 40],
  [590, 1120, 22],
  [860, 1160, 24],
];
const Queso: React.FC<{ quedan: number }> = ({ quedan }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
    <Defs />
    <rect width={1080} height={1920} fill="url(#madera)" />
    <rect width={1080} height={1920} fill="#fff" filter="url(#grano)" />
    <g filter="url(#sombra)">
      {/* cara superior, frente y lateral */}
      <path d="M 260 1040 L 960 960 L 1000 1060 L 300 1130 Z" fill="#FFE59A" />
      <path d="M 300 1130 L 1000 1060 L 1000 1400 L 300 1430 Z" fill="#F6C94E" />
      <path d="M 260 1040 L 300 1130 L 300 1430 L 260 1340 Z" fill="#E3AE33" />
    </g>
    {AGUJEROS.map(([x, y, r], i) => {
      const k = lin(quedan, i / AGUJEROS.length, (i + 1) / AGUJEROS.length); // los agujeros se cierran de a uno
      const rr = Number(r) * (i < 3 ? 1 : k);
      if (rr < 1) return null;
      return (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={rr} ry={rr * 0.85} fill="#D99A2B" />
          <ellipse cx={x} cy={Number(y) + rr * 0.15} rx={rr * 0.8} ry={rr * 0.6} fill="#B97A1A" />
          <path d={`M ${Number(x) - rr} ${y} A ${rr} ${rr * 0.85} 0 0 1 ${Number(x) + rr} ${y}`} stroke="#FFF1C2" strokeWidth={3} fill="none" opacity={0.6} />
        </g>
      );
    })}
    {/* agujeros cortados en el borde superior */}
    <path d="M 480 1112 a 30 18 0 0 0 60 -6" fill="#D99A2B" opacity={0.9} />
    <path d="M 760 1083 a 26 15 0 0 0 52 -5" fill="#D99A2B" opacity={0.9} />
  </svg>
);

// ---------- composición ----------
export const DatoQueso: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / fps;
  const flash = s >= T.queso && s < T.queso + 0.15 ? lin(s, T.queso, T.queso + 0.15, 0.85, 0) : 0;
  const temblor = s > T.crece && s < T.queso ? lin(s, T.crece, T.queso, 0, 10, Easing.in(Easing.quad)) : 0;
  const tx = (rnd(frame) - 0.5) * 2 * temblor;
  const ty = (rnd(frame + 77) - 0.5) * 2 * temblor;

  return (
    <AbsoluteFill style={{ background: "#151010", overflow: "hidden" }}>
      <Audio src={staticFile("ebook/queso_mezcla.wav")} />

      {/* 0–14 s · dentro del queso: microscopio, con un acercamiento rápido al arrancar */}
      {s < T.queso && (
        <>
          <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${lin(s, 0, 0.35, 1.6, 1.0, Easing.out(Easing.cubic)) + lin(s, 0.35, T.queso, 0, 0.12)})`, transformOrigin: `${CENTRO.x}px ${CENTRO.y}px` }}>
            <Microscopio s={s} />
          </AbsoluteFill>
          {s < T.bacterias && (
            <>
              <Frase s={s} palabras={[{ txt: "¿Cómo es posible", t: -0.2 }]} top={150} size={84} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "que un pedacito de", t: 0.95 }, { txt: "HENO", t: 2.15, marca: true }]} top={250} size={72} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "haga los agujeros", t: 2.55 }, { txt: "del queso?", t: 3.45 }]} top={430} size={72} color="#FFF6EA" />
              {s >= 2.15 && (
                <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
                  <path d={`M 700 ${700} Q 760 900 ${CENTRO.x + 120} ${CENTRO.y - 60}`} stroke={C.mustard} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - lin(s, 2.15, 2.5))} />
                </svg>
              )}
            </>
          )}
          {s >= T.bacterias && s < T.junta && (
            <>
              <Frase s={s} palabras={[{ txt: "Las bacterias", t: 4.75 }]} top={170} size={92} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "largan", t: 5.85 }, { txt: "GAS", t: 6.45, marca: true }]} top={300} size={110} color="#FFF6EA" />
            </>
          )}
          {s >= T.junta && s < T.crece && (
            <>
              <Frase s={s} palabras={[{ txt: "El gas se junta", t: 7.0 }]} top={170} size={84} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "alrededor del", t: 8.25 }, { txt: "HENO", t: 10.25, marca: true }]} top={280} size={84} color="#FFF6EA" />
              <Frase s={s} palabras={[{ txt: "que cae en la leche", t: 10.6 }]} top={400} size={64} color="#FFF6EA" />
            </>
          )}
          {s >= T.crece && <Frase s={s} palabras={[{ txt: "…y crece la", t: 12.1 }, { txt: "BURBUJA", t: 13.25, marca: true }]} top={200} size={96} color="#FFF6EA" />}
        </>
      )}

      {/* 14 s · la burbuja es el agujero: nos alejamos hasta ver el queso; entra la cocinera */}
      {s >= T.queso && s < T.final && (
        <>
          <AbsoluteFill style={{ transform: `scale(${lin(s, T.queso, T.queso + 0.7, 8, 1.08, Easing.out(Easing.cubic))})`, transformOrigin: "640px 1180px" }}>
            <Queso quedan={1 - lin(s, 16.4, 17.9)} />
          </AbsoluteFill>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
            <Defs />
            <g transform={`translate(0 ${(1 - Math.min(1, pop(s, 14.5))) * 700})`}>
              <Cocinera cx={250} cy={1430} s={0.75} feliz />
            </g>
          </svg>
          <Frase s={s} palabras={[{ txt: "Ordeñe", t: 14.4 }, { txt: "más limpio", t: 15.35 }]} top={220} size={96} />
          <Frase s={s} palabras={[{ txt: "=", t: 17.2 }, { txt: "MENOS agujeros", t: 17.6, marca: true }]} top={470} size={90} />
          <div style={{ position: "absolute", right: 80, top: 1500, display: "flex", gap: 14, fontFamily: FONT, fontWeight: 800, fontSize: 44 }}>
            <span style={{ padding: "8px 22px", borderRadius: 30, background: s < 16.4 ? C.ink : "rgba(43,33,24,0.25)", color: "#FFF6EA" }}>antes</span>
            <span style={{ padding: "8px 22px", borderRadius: 30, background: s >= 17.9 ? C.tomato : "rgba(43,33,24,0.25)", color: "#FFF6EA" }}>ahora</span>
          </div>
        </>
      )}

      {/* 18,85 s · ¿Lo sabías? */}
      {s >= T.final && (
        <AbsoluteFill style={{ background: C.cream }}>
          <Frase s={s} palabras={[{ txt: "¿Lo", t: T.final }, { txt: "sabías?", t: T.final + 0.15, marca: true }]} top={480} size={150} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center", gap: 40 }}>
            {["Sí", "No"].map((t, i) => (
              <div key={t} style={{ width: 300, textAlign: "center", padding: "26px 0", borderRadius: 36, background: i ? C.ink : C.tomato, color: "#FFF", fontFamily: FONT, fontWeight: 800, fontSize: 80, transform: `scale(${pop(s, T.final + 0.4 + i * 0.15)})`, boxShadow: "0 10px 0 rgba(0,0,0,0.3)" }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 72, right: 72, top: 1200, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: C.ink, transform: `scale(${pop(s, T.final + 0.8)})` }}>Contalo en comentarios</div>
          <div style={{ position: "absolute", left: 72, right: 72, top: 1560, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 26, color: "#8A7A6A" }}>Fuente: Agroscope y Empa (Suiza), 2015 · ilustración</div>
        </AbsoluteFill>
      )}

      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </AbsoluteFill>
  );
};
