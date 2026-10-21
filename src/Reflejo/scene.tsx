import React from "react";

// Ilustración única del reel (estilo-explicador.md §4): persona en la cama haciendo scroll de noche.
// Coordenadas de escena: 1080 x 720. Plana, crema + contorno grueso, sin degradados.

export const E = {
  bg: "#1E1A17",
  cream: "#EBE7DD",
  shade: "#D9D2C4",
  line: "#1A1613",
  wood: "#3E2F27",
  skin: "#F0E3D3",
  red: "#E2483D",
  red2: "#D9443A",
  gold: "#E8C35A",
  text: "#EDE6DA",
  dim: "#8C847B",
  green: "#12A150",
};

const SW = 9;

// Puntos de interés en coordenadas de escena (cámara y diana)
export const SPOT = {
  thumb: { x: 728, y: 217 },
  screen: { x: 687, y: 168 },
  head: { x: 846, y: 356 },
  heart: { x: 640, y: 372 },
  wide: { x: 540, y: 380 },
};

// Contenido de la pantalla del móvil
export type Screen =
  | { kind: "scroll"; offset: number; blur: number; same: boolean; odd: number }
  | { kind: "dm"; sent: number };

const PhoneScreen: React.FC<{ s: Screen }> = ({ s }) => {
  if (s.kind === "dm") {
    return (
      <g>
        <rect x={8} y={14} width={114} height={200} rx={8} fill="#2B2622" />
        <circle cx={26} cy={34} r={9} fill={E.green} />
        <rect x={40} y={29} width={50} height={9} rx={4} fill={E.dim} />
        <g transform={`translate(112 120) scale(${s.sent}) translate(-112 -120)`} opacity={s.sent > 0 ? 1 : 0}>
          <rect x={30} y={100} width={84} height={36} rx={12} fill={E.green} />
          <text x={72} y={125} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={20} fill="#fff">
            HOOK
          </text>
        </g>
      </g>
    );
  }
  const H = 70;
  const cards = [E.cream, E.red, E.gold, E.shade, E.cream, E.red];
  return (
    <g>
      <defs>
        <clipPath id="scr">
          <rect x={8} y={14} width={114} height={200} rx={8} />
        </clipPath>
        <filter id="vblur">
          <feGaussianBlur stdDeviation={`0 ${s.blur}`} />
        </filter>
      </defs>
      <rect x={8} y={14} width={114} height={200} rx={8} fill="#2B2622" />
      <g clipPath="url(#scr)" filter={s.blur > 0 ? "url(#vblur)" : undefined}>
        {cards.map((c, k) => {
          const y = ((((k * H - s.offset) % (cards.length * H)) + cards.length * H) % (cards.length * H)) - H + 20;
          const fill = s.same ? "#5A524B" : c;
          return <rect key={k} x={16} y={y} width={98} height={H - 10} rx={6} fill={fill} opacity={0.9} />;
        })}
        {s.odd > 0 ? (
          <g transform={`translate(65 114) scale(${s.odd}) translate(-65 -114)`}>
            <rect x={16} y={74} width={98} height={80} rx={8} fill={E.red} />
            <circle cx={65} cy={114} r={20} fill={E.gold} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

export const Bedroom: React.FC<{ screen: Screen; outline: number; heart: number; heartBeat: number }> = ({ screen, outline, heart, heartBeat }) => (
  <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ overflow: "visible" }}>
    {/* Cabecero y patas */}
    <rect x={960} y={200} width={52} height={520} rx={10} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <rect x={870} y={560} width={34} height={160} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    <rect x={-40} y={520} width={1010} height={56} fill={E.wood} stroke={E.line} strokeWidth={SW} />
    {/* Colchón */}
    <rect x={-40} y={436} width={990} height={92} rx={24} fill={E.cream} stroke={E.line} strokeWidth={SW} />
    <line x1={0} y1={482} x2={920} y2={482} stroke={E.dim} strokeWidth={4} strokeDasharray="14 18" />
    {/* Almohada */}
    <ellipse cx={850} cy={418} rx={104} ry={34} fill="#F7F4EC" stroke={E.line} strokeWidth={SW} />
    {/* Cabeza */}
    <circle cx={846} cy={356} r={56} fill={E.skin} stroke={E.line} strokeWidth={SW} />
    <path d="M846 300 A56 56 0 0 1 902 356 L886 356 A40 40 0 0 0 846 316 Z" fill={E.line} />
    <path d="M812 344 q10 -6 20 0" stroke={E.line} strokeWidth={6} fill="none" strokeLinecap="round" />
    {/* Manta */}
    <path d="M-40 312 Q300 282 720 306 L736 440 L-40 440 Z" fill={E.cream} stroke={E.line} strokeWidth={SW} strokeLinejoin="round" />
    {[140, 300, 460].map((x) => (
      <path key={x} d={`M${x} 302 Q${x + 30} 370 ${x + 10} 436`} stroke={E.shade} strokeWidth={6} fill="none" />
    ))}
    <rect x={40} y={296} width={26} height={144} rx={10} fill={E.line} />
    {/* Corazón (bajo la manta, se ve cuando se habla del pulso) */}
    <g transform={`translate(${SPOT.heart.x} ${SPOT.heart.y}) scale(${heart * heartBeat})`} opacity={heart}>
      <path d="M0 22 C-34 -2 -26 -30 -10 -30 C-2 -30 0 -22 0 -18 C0 -22 2 -30 10 -30 C26 -30 34 -2 0 22 Z" fill={E.red} stroke={E.line} strokeWidth={5} />
    </g>
    {/* Brazo con contorno rojo opcional */}
    {outline > 0 ? <path d="M752 352 Q712 316 668 270" stroke={E.red} strokeWidth={92} strokeLinecap="round" fill="none" opacity={outline} /> : null}
    <path d="M752 352 Q712 316 668 270" stroke={E.line} strokeWidth={74} strokeLinecap="round" fill="none" />
    <path d="M752 352 Q712 316 668 270" stroke={E.skin} strokeWidth={56} strokeLinecap="round" fill="none" />
    {/* Móvil en la mano */}
    <g transform="translate(600 70) rotate(-12)">
      {outline > 0 ? <rect x={-8} y={-8} width={146} height={246} rx={24} fill="none" stroke={E.red} strokeWidth={8} opacity={outline} /> : null}
      <rect x={0} y={0} width={130} height={230} rx={18} fill={E.line} />
      <PhoneScreen s={screen} />
      {/* Dedos y pulgar */}
      {[150, 178, 206].map((y) => (
        <rect key={y} x={-16} y={y - 20} width={30} height={24} rx={12} fill={E.skin} stroke={E.line} strokeWidth={5} />
      ))}
      <ellipse cx={95} cy={170} rx={20} ry={30} fill={E.skin} stroke={E.line} strokeWidth={6} />
      <path d="M86 150 q9 -8 18 0" stroke={E.shade} strokeWidth={4} fill="none" />
    </g>
  </svg>
);

// Diana roja (2 círculos + cruz) con pulso
export const Reticle: React.FC<{ x: number; y: number; pulse: number; opacity: number }> = ({ x, y, pulse, opacity }) => (
  <svg width={1080} height={720} viewBox="0 0 1080 720" style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
    <g transform={`translate(${x} ${y}) scale(${1 + 0.06 * pulse})`}>
      <circle r={50} fill="rgba(226,72,61,0.18)" stroke={E.red} strokeWidth={6} />
      <circle r={22} fill="none" stroke={E.red} strokeWidth={6} />
      <circle r={7} fill={E.red} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={0} y1={-38} x2={0} y2={-70} stroke={E.red} strokeWidth={6} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
      <line x1={70} y1={0} x2={260} y2={0} stroke={E.red} strokeWidth={3} strokeDasharray="10 10" />
    </g>
  </svg>
);
