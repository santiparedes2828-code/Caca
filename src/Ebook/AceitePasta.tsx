import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Aceite, C, Cocinera, Defs, FONT, pop, rnd } from "./Huevos";
import { Mesa, QDefs } from "./Quesadilla";
import { Libro } from "./RecetaVideo";
import { PALABRAS } from "./aceitePalabras";

// «¿Por qué le echas aceite al agua de la pasta?» en el estilo ilustrado del recetario (35 s).
// Mismo guion, voz y efectos que el reel 3D (produccion/reel3d_aceite): la voz está alineada a los tiempos de
// PALABRAS y los efectos (sfx.py) caen en los mismos momentos, así que los cambios de escena siguen esos tiempos.
// Audio: public/ebook/aceite_mezcla.wav (voz + efectos, −14 LUFS).

export const ACEITE_FRAMES = 35 * 30;
const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// escenas (s): pregunta · «No» · adentro de la olla · almidón · escurrir · solución · compartir · ebook
const E = { no: 2.85, adentro: 5.15, almidon: 14.25, escurrir: 17.95, solucion: 22.45, compartir: 28.0, ebook: 32.0 };

// ---------- subtítulos: grupos de hasta 5 palabras, cada una aparece cuando se dice ----------
const CLAVE = new Set(["aceite", "pasta", "No", "pegue", "olla", "menos", "flotando", "toca", "almidón", "minutos", "resbala", "solución", "agua", "hirviendo", "revolver", "Envíaselo"]);
const limpia = (w: string) => w.replace(/[¿?.,:…"]/g, "");
const GRUPOS: number[][] = (() => {
  const g: number[][] = [];
  let cur: number[] = [];
  PALABRAS.forEach((p, i) => {
    cur.push(i);
    if (/[.?:,…]$/.test(p.w) || cur.length === 5) {
      g.push(cur);
      cur = [];
    }
  });
  if (cur.length) g.push(cur);
  return g;
})();

const Subtitulos: React.FC<{ s: number; claro: boolean }> = ({ s, claro }) => {
  const g = [...GRUPOS].reverse().find((gr) => s >= PALABRAS[gr[0]].s - 0.05);
  if (!g) return null;
  const fin = PALABRAS[g[g.length - 1]].e;
  const siguiente = GRUPOS[GRUPOS.indexOf(g) + 1];
  if (siguiente === undefined && s > fin + 0.8) return null;
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 230, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 22px", fontFamily: FONT, fontWeight: 800, fontSize: 92, lineHeight: 1.08 }}>
      {g.map((i) => {
        const p = PALABRAS[i];
        const k = pop(s, p.s);
        const marca = CLAVE.has(limpia(p.w));
        return (
          <span
            key={i}
            style={
              marca
                ? { display: "inline-block", background: C.tomato, color: "#FFF", padding: "0 16px", borderRadius: 16, transform: `rotate(-2deg) scale(${k})`, boxShadow: "0 8px 0 #A8240F" }
                : { display: "inline-block", color: claro ? "#FFF6EA" : C.ink, transform: `scale(${k})`, opacity: Math.min(1, k * 3), textShadow: claro ? "0 6px 0 rgba(0,0,0,0.35)" : "0 4px 0 rgba(255,255,255,0.7)" }
            }
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- dibujos ----------
const Hornalla: React.FC = () => (
  <>
    <radialGradient id="hornallaA" cx="0.5" cy="0.62" r="0.6">
      <stop offset="0" stopColor="#5A463C" />
      <stop offset="1" stopColor="#1E1714" />
    </radialGradient>
    <rect width={1080} height={1920} fill="url(#hornallaA)" />
  </>
);

const Etiqueta: React.FC<{ x: number; y: number; tx: number; ty: number; txt: string; k: number; color?: string }> = ({ x, y, tx, ty, txt, k, color = C.mustard }) =>
  k <= 0 ? null : (
    <g opacity={Math.min(1, k * 2)}>
      <line x1={x} y1={y} x2={x + (tx - x) * Math.min(1, k)} y2={y + (ty - y) * Math.min(1, k)} stroke={color} strokeWidth={6} strokeLinecap="round" />
      <circle cx={x} cy={y} r={10} fill={color} />
      <g transform={`translate(${tx} ${ty}) scale(${k})`}>
        <rect x={-txt.length * 17 - 24} y={-34} width={txt.length * 34 + 48} height={68} rx={34} fill={color} />
        <text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.ink}>{txt}</text>
      </g>
    </g>
  );

// olla en corte (vista de frente): estado de aceite, pasta, almidón, hervor y cuchara
type Olla = { s: number; aceite: number; capa: number; pasta: number; almidon: number; hervor: number; cuchara: number; zoom?: number };
const OllaCorte: React.FC<Olla> = ({ s, aceite, capa, pasta, almidon, hervor, cuchara }) => {
  const X0 = 150, X1 = 930, TOP = 760, BOT = 1500, AGUA = 860;
  return (
    <g>
      {/* sombra y asas */}
      <ellipse cx={540} cy={BOT + 30} rx={440} ry={40} fill="#000" opacity={0.35} filter="url(#vapor)" />
      <rect x={X0 - 70} y={TOP + 60} width={90} height={34} rx={17} fill="#5C5450" />
      <rect x={X1 - 20} y={TOP + 60} width={90} height={34} rx={17} fill="#5C5450" />
      {/* cuerpo: pared trasera, agua, pared delantera cortada */}
      <path d={`M ${X0} ${TOP} L ${X0} ${BOT - 40} Q ${X0} ${BOT} ${X0 + 40} ${BOT} L ${X1 - 40} ${BOT} Q ${X1} ${BOT} ${X1} ${BOT - 40} L ${X1} ${TOP} Z`} fill="url(#metalOlla)" />
      <path d={`M ${X0 + 22} ${AGUA} L ${X0 + 22} ${BOT - 50} Q ${X0 + 22} ${BOT - 22} ${X0 + 50} ${BOT - 22} L ${X1 - 50} ${BOT - 22} Q ${X1 - 22} ${BOT - 22} ${X1 - 22} ${BOT - 50} L ${X1 - 22} ${AGUA} Z`} fill="url(#aguaA)" />
      {/* pasta en el fondo */}
      <g opacity={pasta}>
        {Array.from({ length: 16 }, (_, i) => {
          const y = BOT - 60 - rnd(i + 5) * 120;
          const x = 260 + rnd(i + 9) * 380;
          const a = (rnd(i + 2) - 0.5) * 50;
          const pegado = almidon > 0.6 && i < 6;
          return <path key={i} d={`M ${x} ${y} q 90 ${-20 + Math.sin(i) * 20} 220 ${(rnd(i + 30) - 0.5) * 30}`} stroke={pegado ? "#F0D592" : "#F7E2A8"} strokeWidth={16} strokeLinecap="round" fill="none" transform={`rotate(${a} ${x + 110} ${y})`} />;
        })}
        {/* nube de almidón que se suelta */}
        {Array.from({ length: 14 }, (_, i) => {
          const ph = (s * 0.4 + rnd(i + 70)) % 1;
          return <ellipse key={i} cx={260 + rnd(i + 71) * 560} cy={BOT - 120 - ph * 260} rx={50 + rnd(i) * 40} ry={26} fill="#FFFFFF" opacity={almidon * 0.45 * (1 - ph)} filter="url(#vapor)" />;
        })}
      </g>
      {/* burbujas del hervor */}
      {Array.from({ length: 22 }, (_, i) => {
        const ph = (s * (0.9 + rnd(i) * 0.6) + rnd(i + 40)) % 1;
        return <circle key={i} cx={200 + rnd(i + 41) * 680} cy={BOT - 40 - ph * (BOT - AGUA - 60)} r={6 + rnd(i + 42) * 12} fill="#FFFFFF" opacity={hervor * 0.6 * (1 - ph * 0.5)} stroke="#CFE8F5" strokeWidth={2} />;
      })}
      {/* aceite: gotas que caen y suben hasta formar una capa arriba */}
      {Array.from({ length: 9 }, (_, i) => {
        const k = lin(aceite, i * 0.06, i * 0.06 + 0.45, 0, 1, Easing.inOut(Easing.quad));
        if (k <= 0) return null;
        const x = 260 + i * 70 + Math.sin(s * 2 + i) * 8;
        const yCae = TOP - 160 + k * 420; // entra y se hunde un poco…
        const y = k < 0.6 ? yCae : AGUA + 30 - (k - 0.6) * 20; // …y vuelve a subir
        const r = 22 * (1 - capa * 0.3);
        return (
          <g key={i} opacity={1 - capa}>
            <ellipse cx={x} cy={Math.min(y, AGUA + 120)} rx={r} ry={r * 0.9} fill="#F2C14E" stroke="#C9952A" strokeWidth={3} />
            <ellipse cx={x - 7} cy={Math.min(y, AGUA + 120) - 8} rx={7} ry={4} fill="#FFF6D2" />
          </g>
        );
      })}
      {capa > 0 && (
        <g opacity={capa}>
          <path d={`M ${X0 + 22} ${AGUA} Q 540 ${AGUA - 14} ${X1 - 22} ${AGUA} L ${X1 - 22} ${AGUA + 22} Q 540 ${AGUA + 34} ${X0 + 22} ${AGUA + 22} Z`} fill="#F2C14E" opacity={0.9} />
          {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={230 + i * 100} cy={AGUA + 8} rx={28} ry={6} fill="#FFF6D2" opacity={0.6} />)}
        </g>
      )}
      {/* borde delantero y labio */}
      <rect x={X0} y={TOP} width={22} height={BOT - TOP - 40} fill="#8A9099" />
      <rect x={X1 - 22} y={TOP} width={22} height={BOT - TOP - 40} fill="#8A9099" />
      <rect x={X0 - 10} y={TOP - 14} width={X1 - X0 + 20} height={22} rx={11} fill="#D5DAE1" />
      {/* cuchara que revuelve */}
      {cuchara > 0 && (
        <g transform={`translate(${540 + Math.sin(s * 6) * 150} ${AGUA - 260}) rotate(${Math.sin(s * 6) * 14})`} opacity={cuchara}>
          <rect x={-12} y={-200} width={24} height={560} rx={12} fill="#B9844A" />
          <ellipse cx={0} cy={370} rx={46} ry={28} fill="#A9743C" />
        </g>
      )}
    </g>
  );
};

const DefsAceite: React.FC = () => (
  <defs>
    <linearGradient id="metalOlla" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#7E858F" />
      <stop offset="0.3" stopColor="#D5DAE1" />
      <stop offset="0.7" stopColor="#B5BBC4" />
      <stop offset="1" stopColor="#6E747D" />
    </linearGradient>
    <linearGradient id="aguaA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#9FD3EE" stopOpacity={0.95} />
      <stop offset="1" stopColor="#4F9BC9" stopOpacity={0.95} />
    </linearGradient>
  </defs>
);

// fideo en primer plano al escurrir: brillo de aceite y gotas de salsa que se resbalan
const Fideo: React.FC<{ s: number }> = ({ s }) => {
  const u = s - E.escurrir;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <Defs />
      <QDefs />
      <Mesa />
      <g filter="url(#sombra)">
        <path d="M -80 1100 C 200 980 420 1200 640 1080 C 820 980 980 1080 1160 1020" stroke="#C9952A" strokeWidth={170} fill="none" strokeLinecap="round" />
        <path d="M -80 1080 C 200 960 420 1180 640 1060 C 820 960 980 1060 1160 1000" stroke="#F3D27A" strokeWidth={150} fill="none" strokeLinecap="round" />
        <path d="M -80 1110 C 200 990 420 1210 640 1090 C 820 990 980 1090 1160 1030" stroke="#D9AE52" strokeWidth={40} fill="none" strokeLinecap="round" opacity={0.6} />
        <path d="M -80 1050 C 200 930 420 1150 640 1030 C 820 930 980 1030 1160 970" stroke="#FFF1B8" strokeWidth={26} fill="none" strokeLinecap="round" opacity={lin(u, 0.8, 1.6) * 0.9} />
        {/* capa de aceite brillante */}
        {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={120 + i * 170} cy={1010 + Math.sin(i * 1.7) * 50} rx={40} ry={12} fill="#FFFFFF" opacity={lin(u, 1.2, 2.2) * 0.75} />)}
      </g>
      {/* gotas de salsa que se resbalan y caen */}
      {[0, 1, 2, 3].map((i) => {
        const t0 = 2.9 + i * 0.25;
        const k = lin(u, t0, t0 + 1.2, 0, 1, Easing.in(Easing.quad));
        const x = 220 + i * 210 + k * 60;
        const y = 960 + Math.sin(i * 1.7) * 50 + k * 520;
        return (
          <g key={i} opacity={lin(u, t0 - 0.4, t0 - 0.2)}>
            <ellipse cx={x} cy={y} rx={46} ry={38 + k * 14} fill="#D9452B" />
            <ellipse cx={x - 12} cy={y - 12} rx={12} ry={7} fill="#FF9A80" />
          </g>
        );
      })}
    </svg>
  );
};

// ---------- composición ----------
export const AceitePasta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const corte = [0, E.no, E.adentro, E.almidon, E.escurrir, E.solucion, E.compartir, E.ebook].filter((c) => s >= c).pop()!;
  const golpe = 1 + 0.08 * Math.exp(-(s - corte) * 10);
  const enOlla = (s < E.escurrir && !(s >= E.no && s < E.adentro)) || (s >= E.solucion && s < E.compartir);
  const claro = enOlla || s >= E.ebook;

  // estado de la olla según el momento
  const o: Olla = {
    s,
    aceite: lin(s, 0.85, 2.4),
    capa: lin(s, 9.6, 10.8),
    pasta: 1,
    almidon: lin(s, E.almidon + 0.3, E.almidon + 1.6),
    hervor: s < E.solucion ? 0.5 : lin(s, 24.9, 25.4, 0.5, 1),
    cuchara: lin(s, 26.2, 26.5),
  };
  if (s >= E.solucion) Object.assign(o, { aceite: 0, capa: 0, almidon: 0 });
  // cámara: de lejos en la pregunta, acercamiento «adentro de la olla», más cerca en el almidón
  const zoom = s < E.adentro ? 1.0 : s < E.almidon ? lin(s, E.adentro, E.adentro + 0.6, 1.0, 1.12, Easing.out(Easing.cubic)) : s < E.escurrir ? 1.5 : 1.0;
  const origen = s >= E.almidon && s < E.escurrir ? "50% 72%" : "50% 60%";

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden" }}>
      <Audio src={staticFile("ebook/aceite_mezcla.wav")} />
      <AbsoluteFill style={{ transform: `scale(${golpe})` }}>
        {enOlla && (
          <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: origen }}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <DefsAceite />
              <Hornalla />
              <OllaCorte {...o} />
              {/* botella que vierte el aceite al principio */}
              {s < E.no + 0.2 && (
                <g transform={`translate(${760 + (1 - lin(s, 0, 0.4, 0, 1, Easing.out(Easing.back(1.5)))) * 400} 520) rotate(${lin(s, 0.3, 0.8, 20, 125)})`}>
                  <Aceite x={0} y={0} s={0.9} />
                </g>
              )}
              {/* etiquetas */}
              {s >= E.adentro && s < E.almidon && (
                <>
                  <Etiqueta x={300} y={1150} tx={330} ty={1620} txt="AGUA" k={pop(s, 9.4)} color="#9FD3EE" />
                  <Etiqueta x={760} y={872} tx={790} ty={640} txt="ACEITE" k={pop(s, 7.75)} />
                  <Etiqueta x={640} y={1400} tx={760} ty={1640} txt="PASTA" k={pop(s, 12.2)} color="#F7E2A8" />
                </>
              )}
              {s >= E.almidon && s < E.escurrir && <Etiqueta x={560} y={1290} tx={700} ty={1050} txt="ALMIDÓN" k={pop(s, 15.4)} color="#FFFFFF" />}
            </svg>
            {/* «ni lo toca»: espacio marcado entre la capa de aceite y la pasta */}
            {s >= 13.15 && s < E.almidon && (
              <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
                <g transform={`translate(890 1100) scale(${pop(s, 13.2)})`}>
                  <path d="M 0 -230 L 0 300" stroke="#FFF6EA" strokeWidth={8} strokeDasharray="20 16" />
                  <path d="M -22 -200 L 0 -236 L 22 -200 M -22 270 L 0 306 L 22 270" stroke="#FFF6EA" strokeWidth={8} fill="none" strokeLinecap="round" />
                </g>
              </svg>
            )}
          </AbsoluteFill>
        )}

        {/* «No, no evita que se pegue»: la cocinera niega, con una X grande */}
        {s >= E.no && s < E.adentro && (
          <AbsoluteFill style={{ background: C.cream }}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <g transform={`translate(${Math.sin(s * 18) * 10 * Math.exp(-(s - E.no) * 2)} 0)`}>
                <Cocinera cx={540} cy={1120} s={1.3} />
              </g>
              <g transform={`translate(540 760) scale(${pop(s, 2.9)}) rotate(-6)`}>
                <path d="M -150 -150 L 150 150 M 150 -150 L -150 150" stroke={C.tomato} strokeWidth={56} strokeLinecap="round" />
              </g>
            </svg>
          </AbsoluteFill>
        )}

        {s >= E.escurrir && s < E.solucion && <Fideo s={s} />}

        {/* la solución: lista que se va tildando */}
        {s >= E.solucion && s < E.compartir && (
          <div style={{ position: "absolute", left: 160, right: 160, top: 470, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Mucha agua", 25.04],
              ["Bien hirviendo", 26.32],
              ["Revolver 2 minutos", 27.12],
            ].map(([t, at]) => (
              <div key={t as string} style={{ display: "flex", alignItems: "center", gap: 18, background: C.cream, borderRadius: 30, padding: "10px 26px", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.ink, transform: `scale(${pop(s, (at as number) - 0.15)})`, boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
                <span style={{ width: 46, height: 46, borderRadius: 23, background: C.basil, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✓</span>
                {t}
              </div>
            ))}
          </div>
        )}

        {/* compartir */}
        {s >= E.compartir && s < E.ebook && (
          <AbsoluteFill style={{ background: C.cream }}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
              <Defs />
              <Cocinera cx={540} cy={860} s={1.0} feliz />
            </svg>
            <div style={{ position: "absolute", left: 60, right: 60, bottom: 400, background: "#FFFFFF", borderRadius: 40, padding: "30px 30px 40px", boxShadow: "0 -10px 40px rgba(0,0,0,0.2)", transform: `translateY(${(1 - spring({ frame: frame - (E.compartir + 0.3) * fps, fps, config: { damping: 14 } })) * 700}px)` }}>
              <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.ink, marginBottom: 26 }}>Enviar a</div>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {[
                  ["M", "Mamá", "#E4572E"],
                  ["T", "Tío Raúl", "#5B7DB1"],
                  ["A", "Ana", "#3C8D5A"],
                  ["F", "Fede", "#9B6BC0"],
                ].map(([l, n, col], i) => (
                  <div key={n} style={{ textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 28, color: C.ink }}>
                    <div style={{ width: 110, height: 110, borderRadius: 55, background: col, color: "#FFF", fontWeight: 800, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", border: i === 1 && s >= 30.4 ? `8px solid ${C.mustard}` : "8px solid transparent" }}>{l}</div>
                    {n}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 30, textAlign: "center", padding: "22px 0", borderRadius: 40, background: s >= 30.56 ? C.mustard : C.ink, color: s >= 30.56 ? C.ink : "#FFF", fontFamily: FONT, fontWeight: 800, fontSize: 40 }}>{s >= 30.56 ? "Enviado ✓" : "Enviar"}</div>
            </div>
          </AbsoluteFill>
        )}

        {/* ebook */}
        {s >= E.ebook && (() => {
          const k = spring({ frame: frame - E.ebook * fps, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #F07A55 0%, ${C.tomato} 55%, #A8240F 100%)` }}>
              <div style={{ position: "absolute", left: 540 - 260, top: 520 + (1 - k) * 900, perspective: 1600 }}>
                <div style={{ transform: `rotateY(${-20 + Math.sin(s * 1.2) * 4}deg) rotateZ(-4deg)` }}>
                  <Libro w={520} />
                </div>
              </div>
              <div style={{ position: "absolute", left: 72, right: 72, top: 1330, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 62, color: "#FFF6EA", transform: `scale(${pop(s, E.ebook + 0.6)})`, textShadow: "0 6px 0 rgba(0,0,0,0.25)" }}>
                Más trucos así,
                <br />
                <span style={{ color: C.mustard }}>en el ebook</span>
              </div>
            </AbsoluteFill>
          );
        })()}

        {s < E.ebook && <Subtitulos s={s} claro={claro && s < E.ebook} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
