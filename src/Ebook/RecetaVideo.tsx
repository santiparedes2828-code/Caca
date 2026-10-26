import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, Burbujas, C, Defs, FONT, HuevoCocido, Ingredientes, Picado, Revelacion, Salsa, Sarten, Vapor, blob, rnd } from "./Huevos";

// Video del recetario (27 s): apertura de 5,8 s (ingredientes → preparación → plato, con la muestra de sonido suave)
// + la receta en 4 pasos + el ebook + CTA «Escribime por DM». La receta es un EJEMPLO inventado: la voz no dice
// que esté en el ebook («Así de fáciles son las 35 recetas de mi ebook»).
// Audio: public/ebook/receta_mezcla.wav (armado en produccion/ebook con ffmpeg; tiempos abajo).

export const RECETA_FRAMES = 27 * 30;

const lin = (s: number, a: number, b: number, from = 0, to = 1, easing?: (x: number) => number) =>
  interpolate(s, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// ---------- tiempos (s), de la mezcla ----------
const T = {
  prep: 1.5, // ingredientes → sartén
  reveal: 3.5, // golpe + plato
  paso1: 5.8, // voz 6,0 «Cebolla, ajo y pimentón»
  ajo: 7.0,
  pimenton: 7.44,
  paso2: 8.6, // voz 8,7 «Tomate triturado, diez minutos»
  diez: 9.94,
  paso3: 11.3, // voz 11,4 «Hacés cuatro huecos… y rompés los huevos»
  huecos: 11.9,
  huevos: 13.28,
  paso4: 14.8, // voz 15,0 «Tapás unos minutos… y listo»
  listo: 16.66,
  libro: 17.6, // voz 18,0 «Así de fáciles son las 35 recetas de mi ebook»
  treintaYCinco: 19.5,
  cta: 22.0, // voz 22,2 «Escribime por DM y te lo paso»
};

// ---------- sartén paramétrica ----------
export type Estado = {
  cebolla: number; // 0–1 cantidad; dorado con `dorado`
  dorado: number;
  ajo: number;
  pimenton: number; // polvo cayendo (0–1 del tramo)
  vertido: number; // chorro de tomate
  salsa: number; // 0–1 cubre la sartén
  huecos: number; // 0–4
  huevos: number[]; // progreso de caída de cada huevo (0–1)
  cocido: number;
  tapa: number; // 1 = puesta
  hervor: number;
  t: number;
};
const P = { cx: 540, cy: 1060, rx: 470, ry: 370 };
const POS = [
  [-190, -105],
  [185, -95],
  [-140, 160],
  [205, 155],
];

export const Sartén: React.FC<{ e: Estado }> = ({ e }) => {
  const S = { cx: P.cx, cy: P.cy + 8, rx: P.rx * 0.9, ry: P.ry * 0.86 };
  const pour = { x: P.cx + 120, y: P.cy - 60 };
  const rSalsa = e.salsa * 1.25 * S.rx;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute" }}>
      <Defs />
      <radialGradient id="hornalla2" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stopColor="#5A463C" />
        <stop offset="1" stopColor="#1E1714" />
      </radialGradient>
      <rect width={1080} height={1920} fill="url(#hornalla2)" />
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const flick = 1 + Math.sin(e.t * 20 + i * 1.7) * 0.15;
        return <ellipse key={i} cx={P.cx + Math.cos(a) * P.rx * 0.95} cy={P.cy + P.ry * 0.25 + Math.sin(a) * P.ry * 0.95} rx={18} ry={34 * flick} fill="#5EA8FF" opacity={0.55} filter="url(#vapor)" />;
      })}
      <clipPath id="clipSalsa">
        <ellipse cx={pour.x} cy={pour.y} rx={rSalsa} ry={rSalsa * 0.8} />
      </clipPath>
      <Sarten {...P} mango="izq">
        {/* aceite */}
        <ellipse cx={S.cx} cy={S.cy} rx={S.rx * 0.75} ry={S.ry * 0.7} fill="#E9B949" opacity={0.55} />
        <ellipse cx={S.cx - 90} cy={S.cy - 60} rx={120} ry={40} fill="#FFF3B0" opacity={0.18} />
        {/* cebolla (dorándose) */}
        <g opacity={e.cebolla}>
          {Array.from({ length: 60 }, (_, i) => {
            const a = rnd(i + 500) * Math.PI * 2;
            const d = Math.sqrt(rnd(i + 600)) * 0.8;
            const x = S.cx + Math.cos(a) * S.rx * d;
            const y = S.cy + Math.sin(a) * S.ry * d;
            const col = interpolate(e.dorado, [0, 1], [0, 1]) > rnd(i + 700) ? "#D99A45" : "#F4E6C8";
            return <path key={i} d={`M ${x - 16} ${y} q 16 -14 32 0`} stroke={col} strokeWidth={8} fill="none" strokeLinecap="round" transform={`rotate(${rnd(i + 800) * 180} ${x} ${y})`} />;
          })}
        </g>
        {/* ajo laminado */}
        {Array.from({ length: 12 }, (_, i) => {
          const k = lin(e.ajo, i / 14, i / 14 + 0.25);
          const a = rnd(i + 900) * Math.PI * 2;
          const d = Math.sqrt(rnd(i + 950)) * 0.6;
          return <ellipse key={i} cx={S.cx + Math.cos(a) * S.rx * d} cy={S.cy + Math.sin(a) * S.ry * d - (1 - k) * 120} rx={14} ry={10} fill="#FBF4E8" stroke="#E2CDB8" strokeWidth={2} opacity={k} />;
        })}
        {/* pimentón que tiñe el aceite */}
        <ellipse cx={S.cx} cy={S.cy} rx={S.rx * 0.7} ry={S.ry * 0.65} fill="#C7321A" opacity={lin(e.pimenton, 0.3, 1) * 0.35} filter="url(#vapor)" />
        {/* salsa de tomate, crece desde el chorro */}
        {e.salsa > 0 && (
          <g clipPath="url(#clipSalsa)">
            <Salsa {...S} seed={7} />
            <Picado {...S} n={90} seed={23} />
          </g>
        )}
        {e.hervor > 0 && (
          <g opacity={e.hervor * (1 - e.cocido * 0.6)}>
            <Burbujas {...S} rx={S.rx * 0.85} ry={S.ry * 0.8} n={14} seed={5 + Math.floor(e.t * 6)} />
          </g>
        )}
        {/* huecos y huevos */}
        {POS.map(([dx, dy], i) => {
          const h = lin(e.huecos, i, i + 1);
          const caida = e.huevos[i] ?? 0;
          const x = P.cx + dx;
          const y = P.cy + dy;
          if (h <= 0 && caida <= 0) return null;
          const dentro = caida >= 1;
          const yCaida = interpolate(caida, [0, 1], [-560, 0], { easing: Easing.in(Easing.quad) });
          const squash = dentro ? 1 : 1;
          return (
            <g key={i}>
              <ellipse cx={x} cy={y + 6} rx={100 * h} ry={64 * h} fill="#5E1208" opacity={0.75 * (dentro ? 0.5 : 1)} />
              <ellipse cx={x} cy={y + 12} rx={80 * h} ry={46 * h} fill="#3A0A04" opacity={0.4 * (dentro ? 0 : 1)} />
              {caida > 0 && !dentro && (
                <g transform={`translate(0 ${yCaida})`}>
                  <path d={`M ${x - 10} ${y - 120} q -6 70 10 110 q 16 -40 10 -110 Z`} fill="#FFF4E2" opacity={0.6} />
                  <ellipse cx={x} cy={y} rx={34} ry={40} fill="url(#yema)" />
                  <ellipse cx={x - 10} cy={y - 14} rx={10} ry={7} fill="#FFFFFF" opacity={0.85} />
                </g>
              )}
              {dentro && (
                <g transform={`translate(${x} ${y}) scale(${squash}) translate(${-x} ${-y})`}>
                  <g opacity={1 - e.cocido}>
                    <path d={blob(x, y, 125, 100, i * 3 + 1, 0.16)} fill="url(#claraCruda)" />
                    <ellipse cx={x} cy={y} rx={52} ry={46} fill="url(#yema)" />
                    <ellipse cx={x - 16} cy={y - 18} rx={14} ry={8} fill="#FFFFFF" opacity={0.85} />
                  </g>
                  <g opacity={e.cocido}>
                    <HuevoCocido cx={x} cy={y} r={118} seed={i * 4 + 1} />
                  </g>
                </g>
              )}
            </g>
          );
        })}
      </Sarten>
      {/* polvo de pimentón cayendo */}
      {e.pimenton > 0 && e.pimenton < 1 && (
        <g>
          <g transform={`translate(760 520) rotate(${130 + Math.sin(e.t * 30) * 6})`} filter="url(#sombra)">
            <rect x={-60} y={-80} width={120} height={160} fill="url(#lata)" />
            <rect x={-60} y={-20} width={120} height={60} fill="#F6E3B4" />
          </g>
          {Array.from({ length: 40 }, (_, i) => {
            const ph = (e.t * 1.6 + rnd(i + 1000)) % 1;
            return <circle key={i} cx={700 + (rnd(i + 1100) - 0.5) * 140 - ph * 120} cy={600 + ph * 420} r={3 + rnd(i) * 4} fill="#B8260F" opacity={0.8 * (1 - ph)} />;
          })}
        </g>
      )}
      {/* chorro de tomate */}
      {e.vertido > 0 && e.vertido < 1 && (
        <g>
          <g transform="translate(830 470) rotate(118)" filter="url(#sombra)">
            <rect x={-80} y={-100} width={160} height={200} fill="url(#metal)" />
            <rect x={-80} y={-50} width={160} height={110} fill={C.tomato} />
            <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#FFF6EA">TOMATE</text>
          </g>
          <path d={`M 730 560 C 700 700 ${pour.x + 30} ${pour.y - 200} ${pour.x} ${pour.y}`} stroke="#C7321A" strokeWidth={44 * Math.sin(Math.PI * e.vertido) + 8} fill="none" strokeLinecap="round" />
          <path d={`M 722 570 C 694 700 ${pour.x + 18} ${pour.y - 200} ${pour.x - 10} ${pour.y - 10}`} stroke="#FF8A66" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
        </g>
      )}
      {e.hervor > 0.3 && (
        <g opacity={e.hervor}>
          <g transform={`translate(0 ${-((e.t * 60) % 80)})`}>
            <Vapor x={330} y={960} h={280} o={0.4} />
          </g>
          <g transform={`translate(0 ${-((e.t * 50 + 40) % 80)})`}>
            <Vapor x={700} y={940} h={300} o={0.35} />
          </g>
        </g>
      )}
      {/* tapa de vidrio */}
      {e.tapa > 0 && (
        <g transform={`translate(0 ${(1 - e.tapa) * -1100})`}>
          <ellipse cx={P.cx} cy={P.cy - 20} rx={P.rx * 1.0} ry={P.ry * 0.97} fill="#DDEFF5" opacity={0.28} stroke="#C9C9C9" strokeWidth={18} />
          <ellipse cx={P.cx} cy={P.cy - 20} rx={P.rx * 0.97} ry={P.ry * 0.94} fill="none" stroke="#8D8D8D" strokeWidth={4} />
          <path d={`M ${P.cx - 330} ${P.cy - 200} Q ${P.cx - 120} ${P.cy - 330} ${P.cx + 100} ${P.cy - 300}`} stroke="#FFFFFF" strokeWidth={22} fill="none" opacity={0.55} strokeLinecap="round" />
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={P.cx + (rnd(i + 1300) - 0.5) * P.rx * 1.6} cy={P.cy + (rnd(i + 1400) - 0.5) * P.ry * 1.5} r={4 + rnd(i) * 6} fill="#FFFFFF" opacity={0.35 * lin(e.cocido, 0, 0.5)} />
          ))}
          <ellipse cx={P.cx} cy={P.cy - 40} rx={70} ry={34} fill="#2B2420" />
          <ellipse cx={P.cx} cy={P.cy - 52} rx={60} ry={26} fill="#4A423E" />
        </g>
      )}
    </svg>
  );
};

// ---------- piezas de interfaz ----------
export const Reloj: React.FC<{ t: number; size: number }> = ({ t, size }) => {
  const ang = t * 360;
  return (
    <svg width={size} height={size} viewBox="0 0 150 150">
      <circle cx={75} cy={75} r={68} fill={C.cream} stroke={C.ink} strokeWidth={10} />
      <path d={`M 75 75 L 75 7 A 68 68 0 ${ang % 360 > 180 ? 1 : 0} 1 ${75 + 68 * Math.sin((ang % 360) * (Math.PI / 180))} ${75 - 68 * Math.cos((ang % 360) * (Math.PI / 180))} Z`} fill={C.tomato} opacity={0.85} />
      <path d={`M 75 75 L ${75 + 45 * Math.sin((ang * Math.PI) / 180)} ${75 - 45 * Math.cos((ang * Math.PI) / 180)}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <circle cx={75} cy={75} r={8} fill={C.ink} />
    </svg>
  );
};

const Paso: React.FC<{ s: number; desde: number; n: number; texto: React.ReactNode; chip?: string; chipDesde?: number; reloj?: number }> = ({ s, desde, n, texto, chip, chipDesde = desde, reloj }) => {
  const { fps } = useVideoConfig();
  const f = (s - desde) * fps;
  const k = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } });
  const kc = spring({ frame: (s - chipDesde) * fps, fps, config: { damping: 12, stiffness: 200 } });
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 230, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `translateY(${(1 - k) * -60}px)`, opacity: k }}>
        <div style={{ width: 104, height: 104, borderRadius: 52, background: C.mustard, color: C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 64, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 0 #B47E12", flexShrink: 0 }}>{n}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.02, color: "#FFF6EA", textShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>{texto}</div>
      </div>
      {chip && s >= chipDesde && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: C.cream, borderRadius: 60, padding: "10px 30px 10px 12px", transform: `scale(${kc})`, boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }}>
          <Reloj t={reloj ?? 0} size={78} />
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: C.ink }}>{chip}</div>
        </div>
      )}
    </div>
  );
};

export const Marca: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ background: C.tomato, color: "#FFF", padding: "0 16px", borderRadius: 16, display: "inline-block", transform: "rotate(-2deg)", boxShadow: "0 8px 0 #A8240F", textShadow: "none" }}>{children}</span>
);

// Tapa provisoria del ebook (no tenemos la real): título descriptivo y una ilustración del plato.
export const Libro: React.FC<{ w: number }> = ({ w }) => {
  const h = w * 1.38;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{ position: "absolute", left: 14, top: 12, width: w, height: h, background: "#EFE6D6", borderRadius: "6px 18px 18px 6px", boxShadow: "inset -10px 0 0 #DDD1BC, 0 30px 50px rgba(40,15,5,0.45)" }} />
      <div style={{ position: "absolute", inset: 0, background: C.cream, borderRadius: "6px 18px 18px 6px", overflow: "hidden", boxShadow: "inset 18px 0 0 rgba(0,0,0,0.08)" }}>
        <div style={{ height: h * 0.16, background: C.tomato, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: w * 0.08, color: "#FFF6EA", letterSpacing: w * 0.012 }}>EBOOK</div>
        <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 800, color: C.ink, marginTop: h * 0.04, lineHeight: 0.95 }}>
          <div style={{ fontSize: w * 0.34, color: C.tomato }}>35</div>
          <div style={{ fontSize: w * 0.12 }}>recetas</div>
          <div style={{ fontSize: w * 0.12 }}>fáciles</div>
        </div>
        <svg width={w} height={w * 0.62} viewBox="40 620 1000 860" style={{ position: "absolute", bottom: h * 0.02, left: 0 }}>
          <Defs />
          <Sarten cx={540} cy={1040} rx={440} ry={350} mango="der">
            <Salsa cx={540} cy={1048} rx={396} ry={300} seed={7} />
            <HuevoCocido cx={370} cy={940} r={110} seed={1} />
            <HuevoCocido cx={710} cy={950} r={108} seed={4} />
            <HuevoCocido cx={410} cy={1180} r={110} seed={8} />
            <HuevoCocido cx={720} cy={1170} r={104} seed={12} />
          </Sarten>
        </svg>
      </div>
    </div>
  );
};

// ---------- composición ----------
export const RecetaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  // estado de la sartén según el tramo
  let e: Estado = { cebolla: 0, dorado: 0, ajo: 0, pimenton: 0, vertido: 0, salsa: 0, huecos: 0, huevos: [], cocido: 0, tapa: 0, hervor: 0, t: s };
  if (s < T.reveal) {
    // apertura: todo el proceso acelerado en 2 s
    const p = lin(s, T.prep, T.reveal - 0.05);
    e = { ...e, cebolla: lin(p, 0, 0.1), dorado: lin(p, 0.05, 0.25), ajo: lin(p, 0.1, 0.22), pimenton: lin(p, 0.18, 0.3), vertido: lin(p, 0.3, 0.48), salsa: lin(p, 0.32, 0.55, 0, 1, ease), hervor: lin(p, 0.5, 0.6), huecos: lin(p, 0.6, 0.75, 0, 2), huevos: [lin(p, 0.72, 0.82), lin(p, 0.82, 0.92)], cocido: lin(p, 0.92, 1, 0, 0.3) };
  } else if (s < T.paso2) {
    e = { ...e, cebolla: lin(s, 6.0, 6.5), dorado: lin(s, 6.2, 8.4), ajo: lin(s, T.ajo, T.ajo + 0.5), pimenton: lin(s, T.pimenton, 8.45) };
  } else if (s < T.paso3) {
    e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, vertido: lin(s, 8.7, 9.7), salsa: lin(s, 8.8, 10.0, 0, 1, ease), hervor: lin(s, 9.8, 10.3) };
  } else if (s < T.paso4) {
    e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, salsa: 1, hervor: 1, huecos: lin(s, T.huecos, T.huecos + 1.0, 0, 4), huevos: [0, 1, 2, 3].map((i) => lin(s, T.huevos + i * 0.25, T.huevos + i * 0.25 + 0.22)) };
  } else {
    e = { ...e, cebolla: 1, dorado: 1, ajo: 1, pimenton: 1, salsa: 1, hervor: 1, huecos: 4, huevos: [1, 1, 1, 1], tapa: lin(s, 15.0, 15.35, 0, 1, Easing.out(Easing.back(1.4))) * lin(s, T.listo - 0.25, T.listo, 1, 0, Easing.in(Easing.quad)), cocido: lin(s, 15.4, 16.4) };
  }

  // encuadre: en la apertura la cámara se acerca a la sartén; en los pasos respira apenas
  const zoomSarten = s < T.reveal ? lin(s, T.prep, T.reveal, 1.0, 1.28, Easing.in(Easing.quad)) : 1 + Math.sin(s * 0.8) * 0.01;
  const kReveal = spring({ frame: frame - T.reveal * fps, fps, config: { damping: 13, stiffness: 120 } });
  const kListo = spring({ frame: frame - T.listo * fps, fps, config: { damping: 13, stiffness: 120 } });
  const flash = (s >= T.reveal && s < T.reveal + 0.15 ? lin(s, T.reveal, T.reveal + 0.15, 0.9, 0) : 0) + (s >= T.listo && s < T.listo + 0.12 ? lin(s, T.listo, T.listo + 0.12, 0.6, 0) : 0);

  const temblor = s >= T.prep && s < T.reveal ? lin(s, T.prep, T.reveal, 2, 16, Easing.in(Easing.quad)) : 0;
  const tx = (rnd(frame) - 0.5) * 2 * temblor;
  const ty = (rnd(frame + 77) - 0.5) * 2 * temblor;
  const giro = s >= T.prep && s < T.reveal ? lin(s, T.prep, T.reveal, -3, 3) : 0;
  const latigazo = s > T.prep - 0.12 && s < T.prep + 0.22 ? Math.sin(Math.PI * lin(s, T.prep - 0.12, T.prep + 0.22)) * 18 : 0;
  const kPlato = s < T.paso1 ? kReveal : kListo;
  const enSarten = (s >= T.prep && s < T.reveal) || (s >= T.paso1 && s < T.listo);
  const enPlato = (s >= T.reveal && s < T.paso1) || (s >= T.listo && s < T.libro);

  return (
    <AbsoluteFill style={{ background: C.cream, overflow: "hidden", filter: latigazo > 0.5 ? `blur(${latigazo}px)` : undefined }}>
      <Audio src={staticFile("ebook/receta_mezcla.wav")} />

      {/* 0–1,5 s: ingredientes; la cámara empuja y al final todo se desliza hacia la sartén */}
      {s < T.prep + 0.2 && (
        <AbsoluteFill style={{ transform: `scale(${lin(s, 0, T.prep, 1.0, 1.08)}) translateY(${lin(s, T.prep - 0.1, T.prep + 0.2, 0, -1920, Easing.in(Easing.quad))}px)` }}>
          <Ingredientes t={s} />
        </AbsoluteFill>
      )}

      {enSarten && (
        <AbsoluteFill style={{ transform: `translateY(${s < T.reveal ? lin(s, T.prep - 0.1, T.prep + 0.2, 1920, 0, Easing.out(Easing.quad)) : 0}px)` }}>
          <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) rotate(${giro}deg) scale(${zoomSarten})`, transformOrigin: "50% 58%" }}>
            <Sartén e={e} />
          </AbsoluteFill>
          {s < T.reveal && (
            <div style={{ position: "absolute", left: 72, top: 250, display: "flex", alignItems: "center", gap: 26, transform: `scale(${pop(s, T.prep + 0.1)})`, transformOrigin: "0 50%" }}>
              <div style={{ transform: `scale(${1 + Math.abs(Math.sin(s * 9)) * 0.12})` }}><Reloj t={lin(s, T.prep, T.reveal) * 3} size={150} /></div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 112, lineHeight: 0.98, color: "#FFF6EA", textShadow: "0 6px 0 rgba(0,0,0,0.35)" }}>
                +{Math.round(lin(s, T.prep + 0.1, T.reveal - 0.1, 0, 22))} MIN
              </div>
            </div>
          )}
          {s >= T.paso1 && s < T.paso2 && <Paso s={s} desde={6.0} n={1} texto={<>Cebolla, ajo<br />y pimentón</>} chip="5 + 1 MIN" chipDesde={6.6} reloj={lin(s, 6.6, 8.6) * 2} />}
          {s >= T.paso2 && s < T.paso3 && <Paso s={s} desde={8.7} n={2} texto={<>Tomate<br />triturado</>} chip="10 MIN" chipDesde={T.diez} reloj={lin(s, T.diez, 11.3) * 2} />}
          {s >= T.paso3 && s < T.paso4 && (
            <Paso s={s} desde={11.4} n={3} texto={<>4 huecos,<br /><span style={{ opacity: lin(s, T.huevos - 0.1, T.huevos + 0.1) }}>4 huevos</span></>} />
          )}
          {s >= T.paso4 && <Paso s={s} desde={15.0} n={4} texto={<>Tapás<br />y listo</>} chip="6–8 MIN" chipDesde={15.35} reloj={lin(s, 15.35, 16.5) * 2} />}
        </AbsoluteFill>
      )}

      {enPlato && (
        <AbsoluteFill style={{ transform: `scale(${1.3 - 0.3 * kPlato + lin(s, T.reveal + 0.6, T.paso1, 0, 0.05) * (s < T.paso1 ? 1 : 0)}) rotate(${(1 - kPlato) * -6}deg)` }}>
          <Revelacion t={s < T.paso1 ? s - T.reveal : s - T.listo} />
          <AbsoluteFill style={{ transform: `translateY(${-((s * 40) % 60)}px)`, opacity: 0.5 }}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              <Defs />
              <Vapor x={420} y={880} h={260} o={0.5} />
              <Vapor x={760} y={860} h={240} o={0.4} />
            </svg>
          </AbsoluteFill>
        </AbsoluteFill>
      )}

      {/* el ebook */}
      {s >= T.libro && s < T.cta && (() => {
        const k = spring({ frame: frame - T.libro * fps, fps, config: { damping: 14, stiffness: 110 } });
        const n = Math.round(lin(s, T.treintaYCinco - 0.6, T.treintaYCinco + 0.4, 1, 35, Easing.out(Easing.quad)));
        return (
          <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, #F07A55 0%, ${C.tomato} 55%, #A8240F 100%)` }}>
            <div style={{ position: "absolute", left: 72, right: 72, top: 240, textAlign: "center", fontFamily: FONT, fontWeight: 800, color: "#FFF6EA", lineHeight: 1.0, textShadow: "0 6px 0 rgba(0,0,0,0.25)" }}>
              <div style={{ fontSize: 86, opacity: lin(s, 18.0, 18.2) }}>Así de fáciles</div>
              <div style={{ fontSize: 150, color: C.mustard, opacity: lin(s, T.treintaYCinco - 0.7, T.treintaYCinco - 0.5) }}>{n} recetas</div>
            </div>
            <div style={{ position: "absolute", left: 540 - 250, top: 640 + (1 - k) * 900, perspective: 1600 }}>
              <div style={{ transform: `rotateY(${-22 + Math.sin(s * 1.2) * 4}deg) rotateZ(${-4 + (1 - k) * 20}deg)` }}>
                <Libro w={500} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 72, right: 72, top: 1390, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 64, color: "#FFF6EA", opacity: lin(s, 20.9, 21.2) }}>
              en mi <span style={{ color: C.mustard }}>ebook</span>
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* CTA */}
      {s >= T.cta && (() => {
        const k = spring({ frame: frame - T.cta * fps, fps, config: { damping: 14, stiffness: 140 } });
        const kb = spring({ frame: frame - 23.6 * fps, fps, config: { damping: 12, stiffness: 160 } });
        const envio = lin(s, 24.6, 25.2, 0, 1, Easing.in(Easing.quad));
        return (
          <AbsoluteFill style={{ background: C.cream }}>
            <div style={{ position: "absolute", left: 72, right: 72, top: 250, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 118, lineHeight: 1.08, color: C.ink, transform: `scale(${0.8 + 0.2 * k})`, opacity: k }}>
              Escribime
              <br />
              por <Marca>DM</Marca>
            </div>
            <div style={{ position: "absolute", left: 72, right: 72, top: 600, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 56, color: C.ink, opacity: lin(s, 23.3, 23.6) }}>y te paso el ebook</div>
            {/* mensaje de ejemplo que se envía */}
            <div style={{ position: "absolute", right: 110, top: 800 - envio * 60, transform: `scale(${kb})`, transformOrigin: "100% 100%", opacity: 1 - lin(s, 25.6, 25.9) * 0 }}>
              <div style={{ background: C.tomato, color: "#FFF", fontFamily: FONT, fontWeight: 600, fontSize: 48, padding: "26px 40px", borderRadius: "40px 40px 8px 40px", boxShadow: "0 10px 0 #A8240F" }}>Hola, quiero el ebook</div>
              <div style={{ textAlign: "right", fontFamily: FONT, fontWeight: 600, fontSize: 30, color: "#8A7A6A", marginTop: 18, opacity: lin(s, 25.0, 25.3) }}>Enviado ✓</div>
            </div>
            <div style={{ position: "absolute", left: 140, top: 1020 + (1 - k) * 700 }}>
              <div style={{ transform: "rotate(-8deg)" }}>
                <Libro w={330} />
              </div>
            </div>
            <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: 600, top: 1130, opacity: kb }}>
              <path d="M 40 150 L 260 60 L 200 250 L 150 170 Z" fill={C.ink} />
              <path d="M 150 170 L 260 60" stroke={C.cream} strokeWidth={8} />
            </svg>
          </AbsoluteFill>
        );
      })()}

      {flash > 0 && <AbsoluteFill style={{ background: "#FFFDF6", opacity: flash }} />}
    </AbsoluteFill>
  );
};
