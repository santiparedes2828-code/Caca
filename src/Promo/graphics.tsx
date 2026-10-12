import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useWordFrame } from "./Kinetic";
import { C, bold } from "./theme";

const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Cuadrícula fina (estilo.md §4: líneas 1–2 px, gris al 50 %, celdas de ~70 px)
const Grid: React.FC<{ w: number; h: number; cell?: number; color?: string }> = ({
  w,
  h,
  cell = 70,
  color = C.grid,
}) => (
  <g>
    {Array.from({ length: Math.floor(w / cell) + 1 }, (_, i) => (
      <line key={`v${i}`} x1={i * cell} y1={0} x2={i * cell} y2={h} stroke={color} strokeWidth={1.5} />
    ))}
    {Array.from({ length: Math.floor(h / cell) + 1 }, (_, i) => (
      <line key={`h${i}`} x1={0} y1={i * cell} x2={w} y2={i * cell} stroke={color} strokeWidth={1.5} />
    ))}
  </g>
);

const usePop = (startFrame: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - startFrame, fps, config: { damping: 14, stiffness: 160 } });
};

// 1 · Gráfica ascendente con botón de play (las agencias que más crecen)
export const ChartGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const tip = usePop(useWordFrame(6));
  const pts = "40,470 170,380 260,420 380,280 470,330 600,160 700,70";
  return (
    <svg width={760} height={540} viewBox="0 0 760 540">
      <Grid w={760} h={540} />
      <polyline
        points={pts}
        fill="none"
        stroke={C.ink}
        strokeWidth={12}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={interpolate(frame, [4, 50], [1, 0], { ...opt, easing: ease })}
      />
      <g transform={`translate(700 70) scale(${tip})`}>
        <circle r={52} fill={C.red} />
        <polygon points="-16,-24 -16,24 26,0" fill={C.paper} />
      </g>
    </svg>
  );
};

// 2 · Reloj que gira + barras GRABAR vs EDITAR (pierdes una tarde entera)
export const ClockGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const hl = useWordFrame(17);
  const rec = useWordFrame(12);
  const sweep = interpolate(frame, [hl, hl + 40], [0, 160], { ...opt, easing: ease });
  const a = (sweep * Math.PI) / 180;
  const R = 190;
  const wedge = `M0 0 L0 ${-R} A${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${R * Math.sin(a)} ${-R * Math.cos(a)} Z`;
  return (
    <svg width={760} height={600} viewBox="-380 -230 760 600">
      <path d={wedge} fill={C.red} opacity={0.85} />
      <circle r={210} fill="none" stroke={C.paper} strokeWidth={10} />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1={0}
          y1={-185}
          x2={0}
          y2={i % 3 === 0 ? -150 : -165}
          stroke={C.paper}
          strokeWidth={i % 3 === 0 ? 8 : 4}
          transform={`rotate(${i * 30})`}
        />
      ))}
      <line x1={0} y1={0} x2={0} y2={-110} stroke={C.paper} strokeWidth={12} strokeLinecap="round" transform={`rotate(${frame * 1.2})`} />
      <line x1={0} y1={0} x2={0} y2={-165} stroke={C.paper} strokeWidth={7} strokeLinecap="round" transform={`rotate(${frame * 14})`} />
      <circle r={14} fill={C.paper} />
      <g fontFamily={bold} fontWeight={800} fontSize={30} fill={C.paper}>
        <text x={-300} y={290}>GRABAR</text>
        <rect x={-110} y={262} height={34} rx={6} fill={C.paper} width={interpolate(frame, [rec, rec + 12], [0, 70], opt)} />
        <text x={-300} y={345}>EDITAR</text>
        <rect x={-110} y={317} height={34} rx={6} fill={C.red} width={interpolate(frame, [hl, hl + 45], [0, 390], { ...opt, easing: ease })} />
      </g>
    </svg>
  );
};

// 3 · Timeline de edición: una pista se enciende con cada palabra
export const TimelineGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const tracks = [
    { label: "CORTES", clips: [[0, 120], [135, 90], [240, 160], [415, 110]] },
    { label: "SUBS", clips: [[0, 70], [80, 70], [160, 70], [240, 70], [320, 70], [400, 70], [480, 70]] },
    { label: "ZOOM", clips: [[40, 150], [300, 180]] },
    { label: "MÚSICA", clips: [[0, 560]] },
  ];
  const f = [useWordFrame(21), useWordFrame(22), useWordFrame(23), useWordFrame(24)];
  return (
    <svg width={820} height={520} viewBox="0 0 820 520">
      <rect x={0} y={0} width={820} height={520} rx={28} fill="#151515" />
      {tracks.map((t, k) => {
        const on = interpolate(frame, [f[k], f[k] + 8], [0, 1], { ...opt, easing: ease });
        const y = 60 + k * 110;
        return (
          <g key={t.label}>
            <text x={30} y={y + 50} fontFamily={bold} fontWeight={800} fontSize={24} fill={on > 0.5 ? C.paper : "#555"}>
              {t.label}
            </text>
            <rect x={200} y={y + 14} width={590} height={56} rx={10} fill="#232323" />
            {t.clips.map(([x, w], j) => (
              <rect
                key={j}
                x={220 + x}
                y={y + 20}
                height={44}
                rx={8}
                width={w * on}
                fill={k === 3 ? C.red : C.paper}
                opacity={k === 3 ? 0.9 : 0.85}
              />
            ))}
          </g>
        );
      })}
      <line
        x1={interpolate(frame, [0, 110], [220, 790], opt)}
        x2={interpolate(frame, [0, 110], [220, 790], opt)}
        y1={30}
        y2={490}
        stroke={C.red}
        strokeWidth={5}
      />
    </svg>
  );
};

// Engranaje generado por código
const gearPath = (teeth: number, R: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a0 = (Math.PI * 2 * i) / (teeth * 2) - 0.12;
    const a1 = (Math.PI * 2 * (i + 1)) / (teeth * 2) - 0.12;
    pts.push(`${rad * Math.cos(a0)},${rad * Math.sin(a0)}`, `${rad * Math.cos(a1)},${rad * Math.sin(a1)}`);
  }
  return `M${pts.join(" L")} Z`;
};

// 5 · Engranajes (automatizamos tu edición)
export const GearsGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = usePop(2);
  return (
    <svg width={760} height={560} viewBox="0 0 760 560">
      <Grid w={760} h={560} />
      <g transform={`translate(300 300) scale(${pop}) rotate(${frame * 2})`}>
        <path d={gearPath(12, 210, 175)} fill={C.ink} />
        <circle r={95} fill="#D9D9D9" />
      </g>
      <g transform={`translate(300 300) scale(${pop})`}>
        <polygon points="-28,-42 -28,42 46,0" fill={C.red} />
      </g>
      <g transform={`translate(575 140) scale(${pop}) rotate(${-frame * 3.4 + 8})`}>
        <path d={gearPath(8, 122, 98)} fill={C.ink} />
        <circle r={44} fill="#D9D9D9" />
      </g>
    </svg>
  );
};

// 6 · Video en bruto → barra de progreso → móvil "LISTO"
export const UploadGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const file = usePop(useWordFrame(38));
  const pStart = useWordFrame(43);
  const done = useWordFrame(47);
  const phone = usePop(done);
  const progress = interpolate(frame, [pStart, done], [0, 1], opt);
  return (
    <svg width={860} height={600} viewBox="0 0 860 600">
      <g transform={`translate(160 250) scale(${file})`} fontFamily={bold} fontWeight={800}>
        <rect x={-130} y={-170} width={260} height={320} rx={24} fill="#1C1C1C" stroke={C.paper} strokeWidth={6} />
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={-100 + i * 15} y={-40 - ((i * 37) % 60)} width={8} height={30 + ((i * 37) % 60) * 2} rx={4} fill="#777" />
        ))}
        <text y={110} textAnchor="middle" fontSize={30} fill={C.paper}>BRUTO.mp4</text>
      </g>
      <g fontFamily={bold} fontWeight={800}>
        <rect x={320} y={230} width={220} height={26} rx={13} fill="#2A2A2A" />
        <rect x={320} y={230} width={220 * progress} height={26} rx={13} fill={C.red} />
        <text x={430} y={310} textAnchor="middle" fontSize={34} fill={C.paper}>
          {Math.round(progress * 100)}%
        </text>
      </g>
      <g transform={`translate(700 250) scale(${phone})`} fontFamily={bold} fontWeight={800}>
        <rect x={-110} y={-220} width={220} height={430} rx={34} fill="#0E0E0E" stroke={C.paper} strokeWidth={8} />
        <rect x={-30} y={-205} width={60} height={12} rx={6} fill={C.paper} />
        <circle cy={-30} r={58} fill={C.red} />
        <polyline points="-26,-30 -6,-8 30,-52" fill="none" stroke={C.paper} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        <text y={90} textAnchor="middle" fontSize={40} fill={C.paper}>LISTO</text>
      </g>
    </svg>
  );
};

// 7 · Ojo + botón "Seguir" → "Siguiendo" (ritmo que retiene / te sigan)
export const EyeFollowGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const eye = usePop(2);
  const follow = useWordFrame(59);
  const on = interpolate(frame, [follow, follow + 5], [0, 1], opt);
  const look = Math.sin(frame / 9) * 36;
  return (
    <svg width={760} height={600} viewBox="0 0 760 600">
      <Grid w={760} h={600} />
      <g transform={`translate(380 220) scale(${eye})`}>
        <path d="M-300 0 Q0 -230 300 0 Q0 230 -300 0 Z" fill="#F4F4F4" stroke={C.ink} strokeWidth={12} />
        <circle cx={look} r={98} fill="#3C3C3C" />
        <circle cx={look} r={98} fill="none" stroke={C.ink} strokeWidth={6} />
        <circle cx={look} r={44} fill="#050505" />
        <circle cx={look + 26} cy={-28} r={16} fill="#FFFFFF" />
      </g>
      <g transform={`translate(380 500) scale(${1 + 0.1 * Math.sin(Math.min(on, 1) * Math.PI)})`} fontFamily={bold} fontWeight={800}>
        <rect x={-210} y={-50} width={420} height={100} rx={50} fill={on > 0.5 ? "#2A2A2A" : C.red} />
        <text y={16} textAnchor="middle" fontSize={44} fill={C.paper}>
          {on > 0.5 ? "Siguiendo" : "Seguir"}
        </text>
      </g>
    </svg>
  );
};

const Card: React.FC<{ x: number; start: number; label: string; children: React.ReactNode }> = ({
  x,
  start,
  label,
  children,
}) => {
  const pop = usePop(start);
  return (
    <g transform={`translate(${x} 250) scale(${pop}) rotate(${(1 - pop) * -12})`}>
      <rect x={-130} y={-190} width={260} height={360} rx={26} fill="#161616" stroke={C.paper} strokeWidth={6} />
      <g transform="translate(0 -40)">{children}</g>
      <text y={120} textAnchor="middle" fontFamily={bold} fontWeight={800} fontSize={30} fill={C.paper}>
        {label}
      </text>
    </g>
  );
};

// 8 · Tres tarjetas: agencias · coaches · creadores
export const CardsGraphic: React.FC = () => (
  <svg width={900} height={560} viewBox="0 0 900 560">
    <Card x={150} start={useWordFrame(61)} label="AGENCIAS">
      <rect x={-60} y={-40} width={120} height={90} rx={12} fill="none" stroke={C.paper} strokeWidth={9} />
      <path d="M-25 -40 V-62 H25 V-40" fill="none" stroke={C.paper} strokeWidth={9} />
      <line x1={-60} y1={0} x2={60} y2={0} stroke={C.red} strokeWidth={9} />
    </Card>
    <Card x={450} start={useWordFrame(62)} label="COACHES">
      <circle r={70} fill="none" stroke={C.paper} strokeWidth={9} />
      <circle r={42} fill="none" stroke={C.paper} strokeWidth={9} />
      <circle r={14} fill={C.red} />
    </Card>
    <Card x={750} start={useWordFrame(64)} label="CREADORES">
      <rect x={-70} y={-45} width={110} height={90} rx={14} fill="none" stroke={C.paper} strokeWidth={9} />
      <polygon points="40,-20 78,-42 78,42 40,20" fill="none" stroke={C.paper} strokeWidth={9} strokeLinejoin="round" />
      <circle cx={-15} cy={0} r={16} fill={C.red} />
    </Card>
  </svg>
);

const Note: React.FC<{ x: number; y: number; r: number; start: number; label: string; children?: React.ReactNode }> = ({
  x,
  y,
  r,
  start,
  label,
  children,
}) => {
  const pop = usePop(start);
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${pop})`} fontFamily={bold} fontWeight={800}>
      <rect x={-125} y={-120} width={250} height={240} fill={C.note} />
      <rect x={-40} y={-135} width={80} height={30} fill="rgba(255,255,255,0.5)" />
      <text y={-62} textAnchor="middle" fontSize={32} fill={C.ink}>{label}</text>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-90} x2={i === 3 ? 20 : 90} y1={-10 + i * 30} y2={-10 + i * 30} stroke="#9A9486" strokeWidth={6} />
      ))}
      {children}
    </g>
  );
};

// 9 · Corcho con notas GRABAR → EDITAR → PUBLICAR unidas con hilo rojo (necesitas un sistema)
export const BoardGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useWordFrame(65);
  const b = useWordFrame(67);
  const c = useWordFrame(69);
  const stamp = useWordFrame(71);
  const s = interpolate(frame, [stamp, stamp + 5], [2.2, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const so = interpolate(frame, [stamp, stamp + 3], [0, 1], opt);
  return (
    <svg width={900} height={600} viewBox="0 0 900 600">
      <polyline
        points="160,170 450,330 740,170"
        fill="none"
        stroke={C.red}
        strokeWidth={6}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={interpolate(frame, [b, c + 10], [1, 0], opt)}
      />
      <Note x={160} y={170} r={-5} start={a} label="GRABAR" />
      <Note x={450} y={360} r={3} start={b} label="EDITAR">
        <g transform={`translate(0 20) rotate(-14) scale(${s})`} opacity={so}>
          <rect x={-105} y={-42} width={210} height={84} rx={8} fill="none" stroke={C.red} strokeWidth={8} />
          <text y={22} textAnchor="middle" fontSize={56} fill={C.red}>AUTO</text>
        </g>
      </Note>
      <Note x={740} y={170} r={6} start={c} label="PUBLICAR" />
    </svg>
  );
};

// 10 · Bocadillos de mensaje (CTA)
export const ChatBubble: React.FC<{ x: number; y: number; flip?: boolean; start: number }> = ({ x, y, flip, start }) => {
  const pop = usePop(start);
  return (
    <svg
      width={420}
      height={330}
      viewBox="0 0 420 330"
      style={{ position: "absolute", left: x, top: y, scale: `${flip ? -pop : pop} ${pop}` }}
    >
      <path
        d="M30 20 H390 Q410 20 410 40 V210 Q410 230 390 230 H170 L110 300 L115 230 H30 Q10 230 10 210 V40 Q10 20 30 20 Z"
        fill="none"
        stroke="#4A4A4A"
        strokeWidth={22}
        strokeLinejoin="round"
      />
      <line x1={90} y1={95} x2={340} y2={95} stroke="#4A4A4A" strokeWidth={22} strokeLinecap="round" />
      <line x1={90} y1={155} x2={340} y2={155} stroke="#4A4A4A" strokeWidth={22} strokeLinecap="round" />
    </svg>
  );
};
