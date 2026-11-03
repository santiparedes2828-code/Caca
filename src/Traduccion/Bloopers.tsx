import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { BLOOPERS, BLOOPERS_FIN, BLOOPERS_TITULO, PARTES, framesBlooper, type Blooper } from "./datos";
import { Garabatos, Sfx, pop } from "./Efectos";
import { C, COLORES, FONT_B, FONT_T } from "./tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const colorDe = (n: string) => COLORES[Math.max(0, PARTES.findIndex((p) => p.nombre === n))];

const Fondo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FFF4D6",
        backgroundImage: `repeating-linear-gradient(45deg, rgba(31,42,68,0.05) 0 24px, transparent 24px 48px)`,
        backgroundPosition: `${f * 0.8}px 0`,
      }}
    >
      <Garabatos color="#E0B45A" />
    </AbsoluteFill>
  );
};

// Claqueta dibujada
const Claqueta: React.FC<{ abierta: number; size?: number }> = ({ abierta, size = 220 }) => (
  <svg width={size} height={size} viewBox="0 0 220 220">
    <g transform={`rotate(${-28 * abierta} 20 78)`}>
      <rect x={14} y={54} width={192} height={34} rx={6} fill="#fff" stroke={C.tinta} strokeWidth={6} />
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={`M ${30 + k * 38} 56 L ${52 + k * 38} 86`} stroke={C.tinta} strokeWidth={14} />
      ))}
    </g>
    <rect x={14} y={92} width={192} height={110} rx={8} fill={C.tinta} />
    <text x={110} y={158} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={34} fill="#fff">
      TOMA ?
    </text>
  </svg>
);

const Titulo: React.FC = () => {
  const f = useCurrentFrame();
  const golpe = interpolate(f, [8, 12, 16], [1, 0, 0], clamp);
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ transform: `scale(${pop(f)}) rotate(${(1 - pop(f)) * -40}deg)` }}>
          <Claqueta abierta={golpe} />
        </div>
        <div
          style={{
            fontFamily: FONT_T,
            fontWeight: 800,
            fontSize: 190,
            color: C.tinta,
            lineHeight: 1,
            transform: `scale(${pop(f, 10)}) rotate(-3deg)`,
            textShadow: `8px 8px 0 ${C.rosa}`,
          }}
        >
          Bloopers
        </div>
        <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 44, color: C.gris, marginTop: 20, opacity: pop(f, 22) }}>lo que no salió en la toma 😅</div>
      </AbsoluteFill>
      <Sfx at={0} s="scratch" v={0.6} />
      <Sfx at={12} s="claqueta" v={0.7} />
      <Sfx at={20} s="boing" v={0.45} />
    </AbsoluteFill>
  );
};

// sello que aparece al final de cada toma (la última no lleva: sigue el FIN)
const SELLOS = ["¡CORTE!", "OTRA VEZ 😂", "¡CORTE!", "TOMA 27", "¡CORTE!", "JAJAJA", "¡CORTE!", "SE RINDIÓ"];

const Toma: React.FC<{ b: Extract<Blooper, { archivo: string }>; n: number; dur: number; sello: string }> = ({ b, n, dur, sello }) => {
  const f = useCurrentFrame();
  const lado = n % 2 ? 1 : -1;
  const entra = pop(f);
  const sale = interpolate(f, [dur - 6, dur], [0, 1], clamp);
  const col = colorDe(b.nombre);
  const ts = dur - 16; // aparece el sello
  const ps = pop(f, ts);
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            background: "#fff",
            padding: "24px 24px 0",
            border: `5px solid ${C.tinta}`,
            boxShadow: `14px 14px 0 ${col}`,
            transform: `translate(${lado * sale * 1400}px, ${(1 - entra) * 500}px) rotate(${lado * 2.5 + (1 - entra) * lado * 12 + Math.sin(f * 0.15) * 0.6 + sale * lado * 20}deg)`,
            position: "relative",
          }}
        >
          {/* cinta */}
          <div style={{ position: "absolute", top: -26, left: "50%", width: 240, height: 52, marginLeft: -120, background: "rgba(250,204,21,0.75)", transform: `rotate(${-lado * 4}deg)` }} />
          <div style={{ width: 1120, height: 630, overflow: "hidden", background: C.tinta }}>
            <Video src={staticFile(b.archivo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", fontFamily: FONT_T, fontWeight: 800, fontSize: 48, color: C.tinta }}>
            <span>
              Toma {n + 1} · <span style={{ color: col }}>{b.nombre}</span>
            </span>
            <span style={{ fontSize: 56 }}>❌</span>
          </div>
          {/* sello */}
          {sello && f >= ts && (
            <div
              style={{
                position: "absolute",
                right: -60,
                top: 40,
                transform: `rotate(${12 * lado}deg) scale(${2.4 - 1.4 * ps})`,
                opacity: Math.min(1, ps * 1.5),
                border: `10px solid ${C.rojo}`,
                color: C.rojo,
                background: "rgba(255,255,255,0.85)",
                borderRadius: 18,
                padding: "6px 30px",
                fontFamily: FONT_T,
                fontWeight: 800,
                fontSize: 84,
                letterSpacing: 2,
              }}
            >
              {sello}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Sfx at={0} s="swish" v={0.35} />
      {sello && <Sfx at={ts} s="claqueta" v={0.55} />}
    </AbsoluteFill>
  );
};

const Fotos: React.FC<{ fotos: string[] }> = ({ fotos }) => {
  const f = useCurrentFrame();
  const pos = [
    { x: -560, y: 40, r: -7 },
    { x: 0, y: -10, r: 3 },
    { x: 560, y: 50, r: -3 },
  ];
  return (
    <AbsoluteFill>
      <Fondo />
      <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: FONT_T, fontWeight: 800, fontSize: 90, color: C.tinta, transform: `scale(${pop(f)})` }}>
        Detrás de cámara 📸
      </div>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {fotos.map((src, k) => {
          const d = 8 + k * 22;
          const p = pop(f, d);
          const flash = interpolate(f, [d, d + 6], [0.9, 0], clamp);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                marginTop: 120,
                transform: `translate(${pos[k].x}px, ${pos[k].y + (1 - p) * -900}px) rotate(${pos[k].r + (1 - p) * 25}deg)`,
                background: "#fff",
                padding: "20px 20px 80px",
                border: `4px solid ${C.tinta}`,
                boxShadow: `10px 10px 0 ${COLORES[k * 2]}`,
              }}
            >
              <div style={{ width: 470, height: 520, overflow: "hidden", position: "relative" }}>
                <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.06 * Math.min(1, (f - d) / 90)})` }} />
                <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: f >= d ? flash : 0 }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      {fotos.map((_, k) => (
        <Sfx key={k} at={8 + k * 22} s="obturador" v={0.55} />
      ))}
    </AbsoluteFill>
  );
};

const Fin: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Fondo />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT_T, fontWeight: 800, fontSize: 220, color: C.tinta, transform: `scale(${pop(f)}) rotate(${(1 - pop(f)) * 20}deg)`, textShadow: `10px 10px 0 ${C.amarillo}` }}>
          FIN 🎬
        </div>
      </AbsoluteFill>
      <Sfx at={2} s="ding" v={0.5} />
    </AbsoluteFill>
  );
};

export const Bloopers: React.FC = () => {
  let t = BLOOPERS_TITULO;
  let n = 0;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={BLOOPERS_TITULO}>
        <Titulo />
      </Sequence>
      {BLOOPERS.map((b, k) => {
        const desde = t;
        const dur = framesBlooper(b);
        t += dur;
        const idx = "archivo" in b ? n++ : -1;
        const ultima = k === BLOOPERS.length - 1;
        return (
          <Sequence key={k} from={desde} durationInFrames={dur}>
            {"archivo" in b ? <Toma b={b} n={idx} dur={dur} sello={ultima ? "" : SELLOS[idx % SELLOS.length]} /> : <Fotos fotos={b.fotos} />}
          </Sequence>
        );
      })}
      <Sequence from={t} durationInFrames={BLOOPERS_FIN}>
        <Fin />
      </Sequence>
    </AbsoluteFill>
  );
};
