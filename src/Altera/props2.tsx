import React from "react";
import { A, ContactShadow, FONT } from "./system";

// Utilería extra del mundo de Gancho (mismas reglas que props.tsx: plana, contorno de tinta 8 px, sombra de contacto).

const INK = A.ink;
const PAPER = "#FBF8F2";
const SW = 8;

type Base = { x: number; y: number; scale?: number; lift?: number; squash?: number; rotate?: number; opacity?: number; shadow?: boolean };
const Holder: React.FC<Base & { w: number; h: number; children: React.ReactNode }> = ({ x, y, w, h, scale = 1, lift = 0, squash = 0, rotate = 0, opacity = 1, shadow = true, children }) => (
  <>
    {shadow ? <ContactShadow x={x} y={y} w={w * scale * 0.8} h={lift} opacity={opacity} /> : null}
    <div style={{ position: "absolute", left: x - (w * scale) / 2, top: y - h * scale, width: w * scale, height: h * scale, opacity, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) rotate(${rotate}deg) scale(${1 + 0.2 * squash}, ${1 - 0.3 * squash})` }}>
      <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {children}
      </svg>
    </div>
  </>
);

// Megáfono (boca hacia la derecha)
export const Megaphone: React.FC<Base> = (p) => (
  <Holder {...p} w={260} h={170} shadow={false}>
    <path d="M30 60 L150 20 L150 150 L30 110 Z" fill={A.orange} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={10} y={56} width={30} height={58} rx={8} fill={INK} />
    <path d="M150 20 Q190 85 150 150" fill={PAPER} stroke={INK} strokeWidth={SW} />
  </Holder>
);

// Ondas de sonido; crush (0..1) las aplasta contra el suelo
export const SoundWaves: React.FC<Base & { t: number; crush?: number }> = ({ t, crush = 0, ...p }) => (
  <Holder {...p} w={300} h={260} shadow={false}>
    <g transform={`translate(0 ${130 + 110 * crush}) scale(1 ${1 - 0.92 * crush}) translate(0 -130)`}>
      {[0, 1, 2].map((k) => {
        const r = 50 + k * 50 + ((t * 120) % 50);
        return <path key={k} d={`M${20 + r * 0.2} ${130 - r} A${r} ${r} 0 0 1 ${20 + r * 0.2} ${130 + r}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" opacity={1 - k * 0.25} />;
      })}
    </g>
  </Holder>
);

// Icono de silencio gigante (altavoz tachado)
export const MuteIcon: React.FC<Base> = (p) => (
  <Holder {...p} w={320} h={300}>
    <rect x={10} y={10} width={300} height={280} rx={60} fill={PAPER} stroke={INK} strokeWidth={SW + 2} />
    <path d="M60 115 h50 l70 -60 v190 l-70 -60 h-50 Z" fill={INK} />
    <path d="M215 110 l70 80 M285 110 l-70 80" stroke={A.orange} strokeWidth={22} strokeLinecap="round" />
  </Holder>
);

// Número/porcentaje grande en una tarjeta
export const BigStat: React.FC<Base & { value: string; label?: string; fill?: number }> = ({ value, label = "", fill = 0, ...p }) => (
  <Holder {...p} w={460} h={300}>
    <rect x={6} y={6} width={448} height={288} rx={34} fill={PAPER} stroke={INK} strokeWidth={SW} />
    <rect x={40} y={226} width={380} height={34} rx={17} fill="#E6DFD2" />
    <rect x={40} y={226} width={380 * Math.max(0, Math.min(1, fill))} height={34} rx={17} fill={A.orange} />
    <text x={230} y={160} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={150} letterSpacing="-6" fill={INK}>
      {value}
    </text>
    {label ? (
      <text x={230} y={205} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={A.orange} letterSpacing="2">
        {label}
      </text>
    ) : null}
  </Holder>
);

// Marco de puerta (la "puerta" de los 3 segundos); open 0..1 abre la hoja hacia atrás
export const Gate: React.FC<Base & { open: number; label?: string }> = ({ open, label = "3 s", ...p }) => (
  <Holder {...p} w={340} h={520}>
    <rect x={10} y={10} width={320} height={510} rx={12} fill="#2A2724" stroke={INK} strokeWidth={SW} />
    <g transform={`translate(34 34) scale(${1 - 0.85 * open} 1)`}>
      <rect x={0} y={0} width={272} height={486} rx={8} fill={A.orange} stroke={INK} strokeWidth={SW} />
      <circle cx={236} cy={250} r={14} fill={INK} />
      <text x={136} y={150} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={86} fill={PAPER} letterSpacing="-3">
        {label}
      </text>
    </g>
  </Holder>
);

// Tira de película con N fotogramas; `cut` (0..1) separa la parte sobrante; `jump` mueve el último al principio
export const FilmStrip: React.FC<Base & { n?: number; cut?: number; jump?: number; t: number }> = ({ n = 5, cut = 0, jump = 0, t, ...p }) => {
  const fw = 120;
  const cols = ["#D9D3C7", "#BFB7A8", "#E6DFD2", "#CFC6B6", A.orange];
  return (
    <Holder {...p} w={n * fw + 20} h={170} shadow={false}>
      {Array.from({ length: n }, (_, k) => {
        const last = k === n - 1;
        const x = last ? 10 + (n - 1) * fw * (1 - jump) : 10 + k * fw + (jump > 0 ? fw * jump : 0) + (k >= 2 ? cut * 80 : 0);
        const y = last && jump > 0 && jump < 1 ? -120 * Math.sin(Math.PI * jump) : k >= 2 ? cut * cut * 300 : 0;
        return (
          <g key={k} transform={`translate(${x} ${30 + y}) rotate(${k >= 2 ? cut * 12 * (k - 1) : 0})`} opacity={k >= 2 ? 1 - cut * 0.7 : 1}>
            <rect x={0} y={0} width={fw - 6} height={110} rx={6} fill={INK} />
            <rect x={10} y={16} width={fw - 26} height={78} rx={4} fill={cols[k % cols.length]} />
            {[0, 1, 2, 3].map((h) => (
              <rect key={h} x={10 + h * 26} y={4} width={12} height={8} rx={2} fill={PAPER} opacity={0.8 + 0 * t} />
            ))}
          </g>
        );
      })}
    </Holder>
  );
};

// Trofeo (el resultado)
export const Trophy: React.FC<Base> = (p) => (
  <Holder {...p} w={220} h={260}>
    <path d="M50 20 H170 V90 C170 140 130 160 110 160 C90 160 50 140 50 90 Z" fill={A.orange} stroke={INK} strokeWidth={SW} />
    <path d="M50 40 C10 40 10 100 56 104 M170 40 C210 40 210 100 164 104" stroke={INK} strokeWidth={SW} fill="none" />
    <rect x={96} y={158} width={28} height={50} fill={INK} />
    <rect x={56} y={204} width={108} height={46} rx={8} fill={INK} />
  </Holder>
);

// Ojo gigante: la pupila salta entre puntos (px, py en −1..1); lid 0..1 párpado
export const BigEye: React.FC<Base & { px: number; py: number; lid?: number }> = ({ px, py, lid = 0, ...p }) => (
  <Holder {...p} w={520} h={340} shadow={false}>
    <defs>
      <clipPath id="eyeclip">
        <path d="M20 170 Q260 -40 500 170 Q260 380 20 170 Z" />
      </clipPath>
    </defs>
    <path d="M20 170 Q260 -40 500 170 Q260 380 20 170 Z" fill={PAPER} stroke={INK} strokeWidth={SW + 4} />
    <g clipPath="url(#eyeclip)">
      <circle cx={260 + px * 150} cy={170 + py * 60} r={92} fill={INK} />
      <circle cx={260 + px * 150} cy={170 + py * 60} r={42} fill={A.orange} />
      <circle cx={260 + px * 150 + 26} cy={170 + py * 60 - 28} r={16} fill={PAPER} />
      <rect x={0} y={-60} width={520} height={60 + 300 * lid} fill={INK} />
    </g>
  </Holder>
);

// Diana (objetivo donde aterriza la mirada)
export const Target: React.FC<{ x: number; y: number; s?: number; opacity?: number }> = ({ x, y, s = 1, opacity = 1 }) => (
  <svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: "absolute", left: x - 100, top: y - 100, opacity, transform: `scale(${s})`, overflow: "visible" }}>
    <circle r={70} fill="none" stroke={A.orange} strokeWidth={10} />
    <circle r={30} fill="none" stroke={A.orange} strokeWidth={10} />
    <circle r={8} fill={A.orange} />
    {[0, 90, 180, 270].map((a) => (
      <line key={a} x1={0} y1={-56} x2={0} y2={-96} stroke={A.orange} strokeWidth={10} strokeLinecap="round" transform={`rotate(${a})`} />
    ))}
  </svg>
);

// Tarjeta "pantalla" con varias líneas de palabras (una puede ir naranja)
export const WordsCard: React.FC<Base & { words: string[]; hot?: number; big?: boolean }> = ({ words, hot = -1, big = false, ...p }) => (
  <Holder {...p} w={560} h={big ? 220 : 160}>
    <rect x={6} y={6} width={548} height={(big ? 220 : 160) - 12} rx={26} fill={PAPER} stroke={INK} strokeWidth={SW} />
    <text x={280} y={big ? 130 : 98} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={big ? 62 : 50} letterSpacing="-2">
      {words.map((w, i) => (
        <tspan key={i} fill={i === hot ? A.orange : INK}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </tspan>
      ))}
    </text>
  </Holder>
);
