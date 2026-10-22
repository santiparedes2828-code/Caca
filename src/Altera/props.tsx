import React from "react";
import { random } from "remotion";
import { A, FONT, ContactShadow } from "./system";

// Utilería del mundo de Gancho: plana, contorno de tinta de 8 px, sombra de contacto.
// Solo marfil, tinta y naranja; un color fuera de paleta SOLO si el guion lo nombra (el elefante "rosa").

const INK = A.ink;
const PAPER = "#FBF8F2";
const SW = 8;

const Box: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; squash?: number; rotate?: number; lift?: number; shadow?: boolean; opacity?: number }> = ({ x, y, w, h, children, squash = 0, rotate = 0, lift = 0, shadow = true, opacity = 1 }) => (
  <>
    {shadow ? <ContactShadow x={x} y={y} w={w * 0.85} h={lift} opacity={opacity} /> : null}
    <div style={{ position: "absolute", left: x - w / 2, top: y - h, width: w, height: h, opacity, transformOrigin: "50% 100%", transform: `translateY(${-lift}px) rotate(${rotate}deg) scale(${1 + 0.2 * squash}, ${1 - 0.3 * squash})` }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        {children}
      </svg>
    </div>
  </>
);

// Elefante: `pink` 0 = sin color (marfil), 1 = rosa
export const Elephant: React.FC<{ x: number; y: number; scale?: number; pink?: number; squash?: number; lift?: number; t: number; trunk?: number; flip?: boolean }> = ({ x, y, scale = 1, pink = 1, squash = 0, lift = 0, t, trunk = 0, flip }) => {
  const c = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * pink)).join(",")})`;
  const body = c([251, 248, 242], [244, 163, 192]);
  const ear = c([235, 228, 216], [233, 138, 174]);
  const w = 440 * scale;
  const h = 380 * scale;
  const sway = 6 * Math.sin(t * 3) + trunk * -40;
  return (
    <Box x={x} y={y} w={w} h={h} squash={squash} lift={lift}>
      <g transform={`scale(${(flip ? -1 : 1) * scale} ${scale}) translate(${flip ? -440 : 0} 0)`}>
        {[120, 180, 270, 330].map((lx) => (
          <rect key={lx} x={lx - 28} y={262} width={56} height={112} rx={20} fill={body} stroke={INK} strokeWidth={SW} />
        ))}
        <ellipse cx={226} cy={216} rx={168} ry={116} fill={body} stroke={INK} strokeWidth={SW} />
        <path d="M58 200 q-34 12 -40 46" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
        <ellipse cx={346} cy={150} rx={84} ry={78} fill={body} stroke={INK} strokeWidth={SW} />
        <ellipse cx={312} cy={150} rx={50} ry={70} fill={ear} stroke={INK} strokeWidth={6} />
        <path d={`M408 172 Q440 ${236 + sway * 0.4} ${414 + sway} ${306 + trunk * -60}`} stroke={INK} strokeWidth={50} fill="none" strokeLinecap="round" />
        <path d={`M408 172 Q440 ${236 + sway * 0.4} ${414 + sway} ${306 + trunk * -60}`} stroke={body} strokeWidth={34} fill="none" strokeLinecap="round" />
        <circle cx={376} cy={128} r={10} fill={INK} />
        <circle cx={380} cy={124} r={3} fill={PAPER} />
      </g>
    </Box>
  );
};

// Sábana que tapa algo (con la silueta insinuada y un "?" naranja). Gancho la arrastra con su anzuelo.
export const Cover: React.FC<{ x: number; y: number; w?: number; h?: number; rotate?: number; lift?: number; opacity?: number; t: number }> = ({ x, y, w = 470, h = 400, rotate = 0, lift = 0, opacity = 1, t }) => {
  const wob = 6 * Math.sin(t * 7);
  return (
    <Box x={x} y={y} w={w} h={h} rotate={rotate} lift={lift} opacity={opacity}>
      <path d={`M14 ${h} C10 ${h * 0.55} 40 ${h * 0.32} 110 ${h * 0.3} C150 ${h * 0.05 + wob} 330 ${h * 0.02} 380 ${h * 0.18} C440 ${h * 0.3} 460 ${h * 0.6} ${w - 10} ${h} Z`} fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {[0.3, 0.5, 0.7].map((k) => (
        <path key={k} d={`M${w * k} ${h * 0.25} Q${w * k + 20} ${h * 0.6} ${w * k - 10} ${h}`} stroke="#D9D3C7" strokeWidth={6} fill="none" />
      ))}
      <text x={w * 0.52} y={h * 0.72} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={170} fill={A.orange}>
        ?
      </text>
    </Box>
  );
};

// Cajón de la memoria
export const MemoryBox: React.FC<{ x: number; y: number; rise?: number; squash?: number }> = ({ x, y, rise = 1, squash = 0 }) => {
  const w = 420;
  const h = 300;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: y, overflow: "hidden" }}>
      <Box x={x} y={y + h * (1 - rise)} w={w} h={h} squash={squash} shadow={rise > 0.95}>
        <rect x={4} y={40} width={w - 8} height={h - 44} rx={18} fill={INK} />
        <rect x={0} y={20} width={w} height={44} rx={12} fill="#2A2724" stroke={INK} strokeWidth={6} />
        <rect x={w / 2 - 110} y={130} width={220} height={64} rx={12} fill={PAPER} />
        <text x={w / 2} y={174} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={INK} letterSpacing="-1">
          MEMORIA
        </text>
      </Box>
    </div>
  );
};

// Tarjeta: imagen (elefante en miniatura) o palabra
export const Card: React.FC<{ x: number; y: number; kind: "image" | "word"; text?: string; rotate?: number; lift?: number; squash?: number; opacity?: number; shadow?: boolean }> = ({ x, y, kind, text = "ELEFANTE", rotate = 0, lift = 0, squash = 0, opacity = 1, shadow = true }) => {
  const w = 260;
  const h = 200;
  return (
    <Box x={x} y={y} w={w} h={h} rotate={rotate} lift={lift} squash={squash} opacity={opacity} shadow={shadow}>
      <rect x={4} y={4} width={w - 8} height={h - 8} rx={22} fill={PAPER} stroke={INK} strokeWidth={SW} />
      {kind === "image" ? (
        <g transform="translate(52 34) scale(0.34)">
          <ellipse cx={226} cy={216} rx={168} ry={116} fill="#F4A3C0" stroke={INK} strokeWidth={20} />
          <ellipse cx={346} cy={150} rx={84} ry={78} fill="#F4A3C0" stroke={INK} strokeWidth={20} />
          <path d="M408 172 Q440 236 414 306" stroke={INK} strokeWidth={60} fill="none" strokeLinecap="round" />
          <path d="M408 172 Q440 236 414 306" stroke="#F4A3C0" strokeWidth={34} fill="none" strokeLinecap="round" />
          <circle cx={376} cy={128} r={14} fill={INK} />
        </g>
      ) : (
        <text x={w / 2} y={h / 2 + 18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={INK} letterSpacing="-1.5">
          {text}
        </text>
      )}
    </Box>
  );
};

// Letras sueltas que caen al suelo (una palabra que se rompe)
export const Letters: React.FC<{ text: string; x: number; y: number; p: number }> = ({ text, x, y, p }) => (
  <>
    {text.split("").map((ch, i) => {
      const dx = (random(`lx${i}`) - 0.5) * 380 * p + (i - text.length / 2) * 36;
      const rot = (random(`lr${i}`) - 0.5) * 140 * p;
      const fy = y - 260 * (1 - p) * (1 - p) * (0.5 + random(`ly${i}`));
      return (
        <div key={i} style={{ position: "absolute", left: x + dx - 30, top: fy - 60, width: 60, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 58, color: INK, transform: `rotate(${rot}deg)`, transformOrigin: "50% 100%" }}>
          {ch}
        </div>
      );
    })}
  </>
);

// Globo de diálogo
export const Speech: React.FC<{ x: number; y: number; text: string; lift?: number; opacity?: number; rotate?: number }> = ({ x, y, text, lift = 0, opacity = 1, rotate = 0 }) => (
  <Box x={x} y={y} w={300} h={180} lift={lift} opacity={opacity} rotate={rotate} shadow={false}>
    <path d="M30 14 H270 Q290 14 290 34 V110 Q290 130 270 130 H120 L70 172 L80 130 H30 Q10 130 10 110 V34 Q10 14 30 14 Z" fill={PAPER} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <text x={150} y={90} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill={INK} letterSpacing="-1.5">
      {text}
    </text>
  </Box>
);

// Globo de pensamiento con contenido
export const Thought: React.FC<{ x: number; y: number; s: number; children?: React.ReactNode }> = ({ x, y, s, children }) => {
  if (s <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x - 170, top: y - 260, width: 340, height: 260, transformOrigin: "20% 100%", transform: `scale(${s})` }}>
      <svg width={340} height={260} viewBox="0 0 340 260" style={{ overflow: "visible" }}>
        <circle cx={40} cy={248} r={10} fill={PAPER} stroke={INK} strokeWidth={6} />
        <circle cx={66} cy={222} r={16} fill={PAPER} stroke={INK} strokeWidth={6} />
        <path d="M80 190 C26 190 22 110 76 104 C72 40 170 28 186 70 C218 20 318 46 296 116 C340 140 316 200 264 192 Z" fill={PAPER} stroke={INK} strokeWidth={SW} />
      </svg>
      <div style={{ position: "absolute", left: 170, top: 118, transform: "translate(-50%, -50%)" }}>{children}</div>
    </div>
  );
};
