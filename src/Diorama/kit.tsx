import React from "react";
import { random } from "remotion";
import { E } from "../Reflejo/scene";

// Recortables planos (estilo-explicador.md §4: crema + contorno grueso, sin degradados) que el motor coloca de pie
// dentro de la maqueta 3D. Cada pieza define su tamaño natural; el ancla es el centro de la base.

export const SW = 8;
export const SKIN = "#F0E3D3";
export const INK = E.line;

export type SpriteProps = { t: number; [k: string]: unknown };
type Sprite = { w: number; h: number; C: React.FC<SpriteProps> };

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

// ---------- Persona ----------
export type FaceKind = "normal" | "blank" | "shock" | "happy" | "bored" | "love" | "talk" | "sleep";
const Face: React.FC<{ cx: number; cy: number; face: FaceKind; t: number }> = ({ cx, cy, face, t }) => {
  const eye = (dx: number) => {
    if (face === "happy" || face === "love") return <path key={dx} d={`M${cx + dx - 9} ${cy + 2} q9 -12 18 0`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (face === "sleep" || face === "bored") return <line key={dx} x1={cx + dx - 9} y1={cy} x2={cx + dx + 9} y2={cy} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
    if (face === "shock" || face === "blank")
      return (
        <g key={dx}>
          <circle cx={cx + dx} cy={cy} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
          <circle cx={cx + dx} cy={cy} r={3.5} fill={INK} />
        </g>
      );
    return <circle key={dx} cx={cx + dx} cy={cy} r={6} fill={INK} />;
  };
  let mouth: React.ReactNode;
  if (face === "shock") mouth = <ellipse cx={cx} cy={cy + 30} rx={11} ry={14} fill={INK} />;
  else if (face === "happy" || face === "love") mouth = <path d={`M${cx - 18} ${cy + 22} Q${cx} ${cy + 46} ${cx + 18} ${cy + 22} Z`} fill={E.wood} stroke={INK} strokeWidth={5} />;
  else if (face === "talk") mouth = <ellipse cx={cx} cy={cy + 28} rx={12} ry={4 + 6 * Math.abs(Math.sin(t * 14))} fill={INK} />;
  else if (face === "blank") mouth = <ellipse cx={cx} cy={cy + 28} rx={7} ry={5} fill={INK} />;
  else if (face === "bored" || face === "sleep") mouth = <line x1={cx - 14} y1={cy + 28} x2={cx + 14} y2={cy + 28} stroke={INK} strokeWidth={6} strokeLinecap="round" />;
  else mouth = <path d={`M${cx - 12} ${cy + 24} q12 10 24 0`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
  return (
    <g>
      {eye(-18)}
      {eye(18)}
      {mouth}
      {face === "love" ? (
        <g fill={E.red}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M${cx + s * 18} ${cy - 2} c-8 -10 -20 -2 -12 8 l12 10 l12 -10 c8 -10 -4 -18 -12 -8 z`} transform={`translate(0 ${-4 * Math.sin(t * 8)})`} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

const Person: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const face = str(p.face, "normal") as FaceKind;
  const shirt = str(p.shirt, E.cream);
  const pants = str(p.pants, "#3B4A63");
  const hair = str(p.hair, INK);
  const walk = num(p.walk, 0);
  const arm = str(p.arm, "down"); // down | up | point | wave | phone
  const shake = num(p.shake, 0) * Math.sin(t * 50) * 4;
  const sw = walk ? Math.sin(t * 9) : 0;
  const leg = (s: number) => `M110 250 L${110 + 30 * s} 372`;
  const armPath = (side: number) => {
    const sx = 110 + side * 44;
    if (arm === "up") return `M${sx} 175 L${sx + side * 34} 92`;
    if (arm === "point" && side === 1) return `M${sx} 178 L${sx + 78} 160`;
    if (arm === "wave" && side === 1) return `M${sx} 178 L${sx + 30 + 10 * Math.sin(t * 10)} 100`;
    if (arm === "phone" && side === 1) return `M${sx} 180 L${sx - 10} 140`;
    return `M${sx} 178 L${sx + side * 16 - 30 * sw * side} 262`;
  };
  return (
    <svg width={220} height={380} viewBox="0 0 220 380" style={{ overflow: "visible" }}>
      <g transform={`translate(${shake} 0)`}>
        {[sw, -sw].map((s, k) => (
          <g key={k}>
            <path d={leg(s)} stroke={INK} strokeWidth={40} strokeLinecap="round" />
            <path d={leg(s)} stroke={pants} strokeWidth={25} strokeLinecap="round" />
          </g>
        ))}
        {[-1, 1].map((side) => (
          <g key={side}>
            <path d={armPath(side)} stroke={INK} strokeWidth={34} strokeLinecap="round" />
            <path d={armPath(side)} stroke={shirt} strokeWidth={20} strokeLinecap="round" />
          </g>
        ))}
        <rect x={62} y={150} width={96} height={124} rx={38} fill={shirt} stroke={INK} strokeWidth={SW} />
        {arm === "phone" ? <rect x={128} y={104} width={34} height={58} rx={7} fill={INK} /> : null}
        <circle cx={110} cy={92} r={56} fill={SKIN} stroke={INK} strokeWidth={SW} />
        <path d="M54 86 A56 56 0 0 1 166 86 L152 78 Q110 46 68 78 Z" fill={hair} />
        <Face cx={110} cy={98} face={face} t={t} />
      </g>
    </svg>
  );
};

// ---------- Globo de pensamiento / diálogo ----------
const Bubble: React.FC<SpriteProps> = (p) => {
  const kind = str(p.kind, "think");
  const fill = str(p.fill, E.cream);
  return (
    <svg width={280} height={220} viewBox="0 0 280 220" style={{ overflow: "visible" }}>
      {kind === "think" ? (
        <g>
          <circle cx={58} cy={206} r={9} fill={fill} stroke={INK} strokeWidth={5} />
          <circle cx={80} cy={180} r={14} fill={fill} stroke={INK} strokeWidth={6} />
          <path d="M70 150 C20 150 18 84 66 80 C64 26 146 18 160 54 C188 14 270 36 250 94 C290 116 268 168 222 160 Z" fill={fill} stroke={INK} strokeWidth={SW} />
        </g>
      ) : (
        <path d="M40 30 H240 Q262 30 262 52 V130 Q262 152 240 152 H110 L70 196 L78 152 H40 Q18 152 18 130 V52 Q18 30 40 30 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      <g transform="translate(140 98)">{p.children as React.ReactNode}</g>
    </svg>
  );
};

// ---------- Iconos y objetos ----------
const Brain: React.FC<SpriteProps> = (p) => {
  const glow = num(p.glow, 0);
  return (
    <svg width={220} height={180} viewBox="-110 -100 220 180" style={{ overflow: "visible" }}>
      {glow > 0 ? <circle r={110} fill={E.gold} opacity={0.35 * glow} /> : null}
      <path d="M-84 14 C-110 -20 -84 -70 -40 -64 C-28 -92 30 -90 38 -62 C82 -66 100 -14 76 12 C88 50 40 74 10 58 C-20 78 -84 64 -84 14 Z" fill="#F2B8B5" stroke={INK} strokeWidth={SW} />
      <path d="M-4 -60 C-18 -20 14 10 0 56 M-56 -14 C-30 -16 -24 6 -38 24 M50 -26 C28 -18 32 4 54 16" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Mark: React.FC<SpriteProps> = (p) => {
  const ok = Boolean(p.ok);
  return (
    <svg width={120} height={120} viewBox="-60 -60 120 120">
      <circle r={52} fill={ok ? E.green : E.red} stroke={INK} strokeWidth={SW} />
      {ok ? <path d="M-24 2 L-6 20 L26 -18" stroke="#fff" strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M-21 -21 L21 21 M21 -21 L-21 21" stroke="#fff" strokeWidth={13} strokeLinecap="round" />}
    </svg>
  );
};

const Glyph: React.FC<SpriteProps> = (p) => (
  <svg width={140} height={160} viewBox="0 0 140 160">
    <text x={70} y={130} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={150} fill={str(p.color, E.gold)} stroke={INK} strokeWidth={7} paintOrder="stroke">
      {str(p.ch, "?")}
    </text>
  </svg>
);

const Reticle: React.FC<SpriteProps> = (p) => (
  <svg width={160} height={160} viewBox="-80 -80 160 160" style={{ overflow: "visible" }}>
    <g transform={`scale(${1 + 0.06 * Math.sin(p.t * 6)})`}>
      <circle r={56} fill="rgba(226,72,61,0.16)" stroke={E.red} strokeWidth={7} />
      <circle r={24} fill="none" stroke={E.red} strokeWidth={7} />
      <circle r={8} fill={E.red} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={0} y1={-42} x2={0} y2={-78} stroke={E.red} strokeWidth={7} strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </g>
  </svg>
);

const Burst: React.FC<SpriteProps> = (p) => {
  const k = num(p.k, 0);
  return (
    <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ overflow: "visible" }}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r0 = 40 + 60 * k;
        const r1 = 70 + 90 * k;
        return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={i % 2 ? E.gold : E.red} strokeWidth={12} strokeLinecap="round" opacity={1 - k * 0.8} />;
      })}
    </svg>
  );
};

// Pedazos que salen volando (para "estallar" cualquier cosa)
export const Shards: React.FC<{ p: number; color?: string; n?: number }> = ({ p, color = E.cream, n = 18 }) => (
  <svg width={10} height={10} style={{ overflow: "visible" }}>
    {Array.from({ length: n }, (_, i) => {
      const a = random(`a${i}`) * Math.PI * 2;
      const d = (60 + random(`d${i}`) * 220) * p;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d + 160 * p * p;
      const r = 10 + random(`r${i}`) * 18;
      return <path key={i} d={`M${x} ${y - r} L${x + r * 0.8} ${y + r * 0.6} L${x - r * 0.7} ${y + r * 0.4} Z`} fill={i % 3 === 0 ? E.red : color} stroke={INK} strokeWidth={4} opacity={1 - p * 0.8} transform={`rotate(${p * 500 * (random(`s${i}`) - 0.5)} ${x} ${y})`} />;
    })}
  </svg>
);

const Phone: React.FC<SpriteProps> = (p) => {
  const screen = str(p.screen, "dm");
  const sent = num(p.sent, 0);
  const t = p.t;
  const scroll = num(p.scroll, 0);
  let content: React.ReactNode = null;
  if (screen === "dm") {
    content = (
      <g>
        <circle cx={40} cy={44} r={16} fill={E.green} />
        <rect x={64} y={36} width={90} height={14} rx={7} fill={E.dim} />
        <line x1={14} y1={74} x2={206} y2={74} stroke="rgba(237,230,218,0.12)" strokeWidth={3} />
        <g transform={`translate(196 230) scale(${sent}) translate(-196 -230)`}>
          <rect x={70} y={200} width={128} height={56} rx={22} fill={E.green} />
          <text x={134} y={238} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#fff">
            HOOK
          </text>
        </g>
      </g>
    );
  } else if (screen === "grey" || screen === "color") {
    const cols = screen === "grey" ? ["#5A524B", "#5A524B", "#5A524B"] : [E.red, E.gold, "#3B4A63"];
    content = (
      <g>
        {Array.from({ length: 5 }, (_, k) => {
          const y = ((((k * 120 - scroll) % 600) + 600) % 600) - 100;
          return <rect key={k} x={18} y={y} width={184} height={104} rx={14} fill={cols[k % 3]} />;
        })}
      </g>
    );
  } else if (screen === "face") {
    content = (
      <g>
        <rect x={10} y={10} width={200} height={380} fill="#3B4A63" />
        <circle cx={110} cy={180} r={70} fill={SKIN} stroke={INK} strokeWidth={6} />
        <circle cx={86} cy={176} r={8} fill={INK} />
        <circle cx={134} cy={176} r={8} fill={INK} />
        <path d="M86 210 q24 18 48 0" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
      </g>
    );
  } else if (screen === "logo") {
    content = (
      <g>
        <rect x={60} y={150} width={100} height={100} rx={18} fill="#5A524B" />
        <text x={110} y={212} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={26} fill={E.dim}>
          LOGO
        </text>
      </g>
    );
  } else if (screen === "series") {
    content = (
      <g>
        {Array.from({ length: 6 }, (_, k) => (
          <g key={k}>
            <rect x={18 + (k % 2) * 96} y={30 + Math.floor(k / 2) * 120} width={88} height={108} rx={10} fill={[E.red, "#3B4A63", E.gold][k % 3]} />
            <text x={62 + (k % 2) * 96} y={96 + Math.floor(k / 2) * 120} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#fff">
              {k + 1}
            </text>
          </g>
        ))}
      </g>
    );
  } else if (screen === "brand") {
    content = (
      <g>
        {Array.from({ length: 6 }, (_, k) => (
          <g key={k} transform={`translate(${18 + (k % 2) * 96} ${30 + Math.floor(k / 2) * 120})`}>
            <rect width={88} height={108} rx={10} fill={E.gold} />
            <rect x={14} y={70} width={60} height={14} rx={7} fill={INK} />
            <circle cx={44} cy={40} r={18} fill={E.red} />
          </g>
        ))}
      </g>
    );
  }
  return (
    <svg width={220} height={400} viewBox="0 0 220 400" style={{ overflow: "visible" }}>
      <rect x={0} y={0} width={220} height={400} rx={34} fill={INK} />
      <defs>
        <clipPath id={`scr-${screen}`}>
          <rect x={10} y={10} width={200} height={380} rx={26} />
        </clipPath>
      </defs>
      <rect x={10} y={10} width={200} height={380} rx={26} fill="#2B2622" />
      <g clipPath={`url(#scr-${screen})`}>{content}</g>
      <rect x={80} y={18} width={60} height={10} rx={5} fill="#000" opacity={0.6 + 0 * t} />
    </svg>
  );
};

// ---------- Piezas por tema ----------
const Gorilla: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const sw = num(p.walk, 1) ? Math.sin(t * 8) : 0;
  return (
    <svg width={240} height={330} viewBox="0 0 240 330" style={{ overflow: "visible" }}>
      {[sw, -sw].map((s, k) => (
        <path key={k} d={`M120 220 L${120 + 34 * s} 316`} stroke={INK} strokeWidth={50} strokeLinecap="round" />
      ))}
      <path d={`M60 140 L${30 - 20 * sw} 290`} stroke={INK} strokeWidth={46} strokeLinecap="round" />
      <path d={`M180 140 L${210 + 20 * sw} 290`} stroke={INK} strokeWidth={46} strokeLinecap="round" />
      <ellipse cx={120} cy={170} rx={78} ry={92} fill="#3A3330" stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={186} rx={44} ry={52} fill="#6B5D55" />
      <circle cx={120} cy={70} r={50} fill="#3A3330" stroke={INK} strokeWidth={SW} />
      <ellipse cx={120} cy={86} rx={34} ry={26} fill="#8C7B70" />
      <circle cx={104} cy={62} r={6} fill="#fff" />
      <circle cx={136} cy={62} r={6} fill="#fff" />
      <path d="M106 96 q14 8 28 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      {num(p.wave, 0) ? <path d={`M180 140 L${226} ${70 + 10 * Math.sin(t * 10)}`} stroke={INK} strokeWidth={46} strokeLinecap="round" /> : null}
    </svg>
  );
};

const Ball: React.FC<SpriteProps> = () => (
  <svg width={70} height={70} viewBox="-35 -35 70 70">
    <circle r={30} fill={E.gold} stroke={INK} strokeWidth={6} />
    <path d="M-30 0 Q0 -14 30 0 M0 -30 Q-12 0 0 30" stroke={INK} strokeWidth={4} fill="none" />
  </svg>
);

const Counter: React.FC<SpriteProps> = (p) => (
  <svg width={200} height={130} viewBox="0 0 200 130">
    <rect x={4} y={4} width={192} height={122} rx={18} fill="#2B2622" stroke={E.gold} strokeWidth={7} />
    <text x={100} y={44} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} letterSpacing="0.12em" fill={E.dim}>
      {str(p.label, "PASES")}
    </text>
    <text x={100} y={106} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={58} fill={E.gold}>
      {str(p.value, "0")}
    </text>
  </svg>
);

const Eye: React.FC<SpriteProps> = (p) => {
  const look = num(p.look, 0);
  return (
    <svg width={200} height={120} viewBox="-100 -60 200 120">
      <path d="M-92 0 Q0 -70 92 0 Q0 70 -92 0 Z" fill="#fff" stroke={INK} strokeWidth={SW} />
      <circle cx={look * 30} r={30} fill="#3B4A63" stroke={INK} strokeWidth={6} />
      <circle cx={look * 30} r={12} fill={INK} />
      <circle cx={look * 30 + 9} cy={-9} r={5} fill="#fff" />
    </svg>
  );
};

const Plug: React.FC<SpriteProps> = (p) => {
  const alive = num(p.alive, 0);
  const t = p.t;
  const look = Math.sin(t * 2) * 6 * alive;
  return (
    <svg width={220} height={260} viewBox="0 0 220 260">
      <rect x={8} y={8} width={204} height={244} rx={36} fill="#F7F4EC" stroke={INK} strokeWidth={SW} />
      <rect x={34} y={34} width={152} height={192} rx={70} fill={E.cream} stroke={INK} strokeWidth={6} />
      <rect x={70 + look} y={92} width={18} height={44} rx={8} fill={INK} />
      <rect x={132 + look} y={92} width={18} height={44} rx={8} fill={INK} />
      <path d={alive > 0.5 ? "M88 176 Q110 196 132 176" : "M90 180 L130 180"} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      {alive > 0 ? (
        <g opacity={alive}>
          <path d="M60 76 l26 8 M160 76 l-26 8" stroke={INK} strokeWidth={7} strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
};

const House: React.FC<SpriteProps> = () => (
  <svg width={240} height={240} viewBox="0 0 240 240">
    <path d="M20 110 L120 20 L220 110 Z" fill={E.red} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={40} y={106} width={160} height={126} fill={E.cream} stroke={INK} strokeWidth={SW} />
    <rect x={64} y={128} width={36} height={36} fill="#BFD9E6" stroke={INK} strokeWidth={6} />
    <rect x={140} y={128} width={36} height={36} fill="#BFD9E6" stroke={INK} strokeWidth={6} />
    <path d="M96 198 Q120 182 144 198 L144 232 L96 232 Z" fill={E.wood} stroke={INK} strokeWidth={6} />
  </svg>
);

const Bush: React.FC<SpriteProps> = (p) => {
  const eyes = num(p.eyes, 0);
  return (
    <svg width={300} height={200} viewBox="0 0 300 200">
      <path d="M20 190 C0 140 40 90 80 110 C80 50 160 40 170 90 C200 40 290 70 270 130 C300 160 280 196 250 190 Z" fill="#4E6B45" stroke={INK} strokeWidth={SW} />
      {eyes > 0 ? (
        <g opacity={eyes}>
          <ellipse cx={130} cy={130} rx={16} ry={10} fill={E.gold} />
          <ellipse cx={180} cy={130} rx={16} ry={10} fill={E.gold} />
          <ellipse cx={130} cy={130} rx={4} ry={9} fill={INK} />
          <ellipse cx={180} cy={130} rx={4} ry={9} fill={INK} />
        </g>
      ) : null}
    </svg>
  );
};

const Caveman: React.FC<SpriteProps> = (p) => (
  <svg width={220} height={360} viewBox="0 0 220 360" style={{ overflow: "visible" }}>
    <line x1={170} y1={30} x2={160} y2={330} stroke={E.wood} strokeWidth={12} strokeLinecap="round" />
    <path d="M160 30 L172 0 L184 30 Z" fill={E.dim} stroke={INK} strokeWidth={5} />
    <path d="M110 240 L90 350 M110 240 L130 350" stroke={INK} strokeWidth={36} strokeLinecap="round" />
    <path d="M60 140 Q110 120 160 140 L150 260 L70 260 Z" fill="#A0703F" stroke={INK} strokeWidth={SW} />
    <circle cx={110} cy={86} r={54} fill={SKIN} stroke={INK} strokeWidth={SW} />
    <path d="M56 80 Q60 20 110 26 Q160 20 164 80 L150 60 L136 76 L120 56 L104 76 L88 56 L72 76 Z" fill={E.wood} />
    <Face cx={110} cy={92} face={str(p.face, "shock") as FaceKind} t={p.t} />
  </svg>
);

const Crowd: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const dim = num(p.dim, 0);
  return (
    <svg width={760} height={260} viewBox="0 0 760 260" style={{ overflow: "visible" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const x = 30 + (i % 7) * 110 + (i >= 7 ? 55 : 0);
        const y = i >= 7 ? 150 : 70;
        const bob = 4 * Math.sin(t * 7 + i);
        const col = ["#3B4A63", E.red, E.gold, "#4E6B45", E.wood][i % 5];
        return (
          <g key={i} opacity={1 - dim * 0.6}>
            <rect x={x - 34} y={y + 40 + bob} width={68} height={90} rx={26} fill={col} stroke={INK} strokeWidth={6} />
            <circle cx={x} cy={y + bob} r={30} fill={SKIN} stroke={INK} strokeWidth={6} />
            <ellipse cx={x} cy={y + 14 + bob} rx={8} ry={3 + 4 * Math.abs(Math.sin(t * 12 + i * 2))} fill={INK} />
          </g>
        );
      })}
    </svg>
  );
};

const Waves: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const color = str(p.color, E.dim);
  return (
    <svg width={240} height={160} viewBox="-120 -80 240 160" style={{ overflow: "visible" }}>
      {[0, 1, 2].map((k) => {
        const r = 30 + k * 30 + ((t * 60) % 30);
        return <path key={k} d={`M${-r * 0.7} ${-r * 0.7} A${r} ${r} 0 0 1 ${-r * 0.7} ${r * 0.7}`} transform="scale(-1 1)" stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" opacity={1 - k * 0.25} />;
      })}
    </svg>
  );
};

const NameTag: React.FC<SpriteProps> = (p) => (
  <svg width={300} height={170} viewBox="0 0 300 170">
    <rect x={6} y={6} width={288} height={158} rx={18} fill={E.red} stroke={INK} strokeWidth={SW} />
    <text x={150} y={56} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={28} fill="#fff" letterSpacing="0.1em">
      HOLA, ME LLAMO
    </text>
    <rect x={24} y={74} width={252} height={74} rx={10} fill="#fff" />
    <text x={150} y={128} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={44} fill={INK}>
      {str(p.name, "TÚ")}
    </text>
  </svg>
);

const Ear: React.FC<SpriteProps> = () => (
  <svg width={140} height={200} viewBox="0 0 140 200">
    <path d="M30 70 C30 10 120 0 124 70 C126 110 90 120 86 150 C82 190 30 196 26 160" fill={SKIN} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
    <path d="M60 70 C60 40 100 40 98 74 C96 96 74 96 72 116" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
  </svg>
);

const Funnel: React.FC<SpriteProps> = () => (
  <svg width={240} height={220} viewBox="0 0 240 220">
    <path d="M10 20 L230 20 L140 120 L140 200 L100 200 L100 120 Z" fill="#BFD9E6" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <line x1={20} y1={44} x2={220} y2={44} stroke={INK} strokeWidth={5} strokeDasharray="12 10" />
  </svg>
);

const Door: React.FC<SpriteProps> = () => (
  <svg width={200} height={320} viewBox="0 0 200 320">
    <rect x={8} y={8} width={184} height={304} rx={6} fill="#8A6A55" stroke={INK} strokeWidth={SW} />
    <rect x={30} y={30} width={140} height={110} rx={4} fill="none" stroke={INK} strokeWidth={5} />
    <rect x={30} y={170} width={140} height={120} rx={4} fill="none" stroke={INK} strokeWidth={5} />
    <circle cx={160} cy={166} r={9} fill={E.gold} stroke={INK} strokeWidth={4} />
  </svg>
);

const MapSheet: React.FC<SpriteProps> = () => (
  <svg width={180} height={140} viewBox="0 0 180 140">
    <path d="M6 16 L62 6 L118 16 L174 6 L174 124 L118 134 L62 124 L6 134 Z" fill="#F7F4EC" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M20 100 Q60 40 100 80 T160 30" stroke={E.red} strokeWidth={6} fill="none" strokeDasharray="10 8" />
    <circle cx={160} cy={30} r={9} fill={E.red} />
  </svg>
);

const Monkey: React.FC<SpriteProps> = (p) => (
  <svg width={220} height={260} viewBox="0 0 220 260" style={{ overflow: "visible" }}>
    <path d="M150 220 Q210 200 196 140" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
    <ellipse cx={110} cy={190} rx={62} ry={62} fill="#8A6A55" stroke={INK} strokeWidth={SW} />
    <circle cx={42} cy={90} r={22} fill="#C9A88C" stroke={INK} strokeWidth={6} />
    <circle cx={178} cy={90} r={22} fill="#C9A88C" stroke={INK} strokeWidth={6} />
    <circle cx={110} cy={92} r={62} fill="#8A6A55" stroke={INK} strokeWidth={SW} />
    <ellipse cx={110} cy={110} rx={44} ry={36} fill="#C9A88C" />
    <Face cx={110} cy={92} face={str(p.face, "normal") as FaceKind} t={p.t} />
  </svg>
);

const Juice: React.FC<SpriteProps> = () => (
  <svg width={110} height={170} viewBox="0 0 110 170">
    <line x1={70} y1={4} x2={60} y2={60} stroke={E.red} strokeWidth={8} strokeLinecap="round" />
    <path d="M10 40 L100 40 L88 164 L22 164 Z" fill="#CFE7F2" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M14 72 L96 72 L88 164 L22 164 Z" fill={E.gold} />
    <path d="M10 40 L100 40 L88 164 L22 164 Z" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

const Bulb: React.FC<SpriteProps> = (p) => {
  const on = num(p.on, 0);
  return (
    <svg width={150} height={200} viewBox="-75 -90 150 200" style={{ overflow: "visible" }}>
      {on > 0 ? <circle cy={-16} r={90} fill={E.gold} opacity={0.35 * on} /> : null}
      <path d="M-40 10 C-70 -30 -50 -84 0 -84 C50 -84 70 -30 40 10 L30 40 L-30 40 Z" fill={on > 0.5 ? "#FFE89A" : E.cream} stroke={INK} strokeWidth={SW} />
      <rect x={-30} y={40} width={60} height={40} rx={8} fill={E.dim} stroke={INK} strokeWidth={6} />
    </svg>
  );
};

const Meter: React.FC<SpriteProps> = (p) => {
  const v = Math.max(0, Math.min(1, num(p.value, 0)));
  return (
    <svg width={120} height={330} viewBox="0 0 120 330">
      <rect x={28} y={10} width={64} height={270} rx={30} fill="#2B2622" stroke={INK} strokeWidth={SW} />
      <rect x={38} y={20 + 250 * (1 - v)} width={44} height={250 * v} rx={20} fill={str(p.color, E.gold)} />
      <text x={60} y={318} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={E.text} letterSpacing="0.08em">
        {str(p.label, "")}
      </text>
    </svg>
  );
};

const Gift: React.FC<SpriteProps> = (p) => {
  const open = num(p.open, 0);
  return (
    <svg width={200} height={220} viewBox="0 0 200 220" style={{ overflow: "visible" }}>
      <rect x={20} y={90} width={160} height={126} rx={8} fill={E.red} stroke={INK} strokeWidth={SW} />
      <rect x={88} y={90} width={24} height={126} fill={E.gold} />
      <g transform={`translate(0 ${-60 * open}) rotate(${-20 * open} 20 90)`}>
        <rect x={10} y={60} width={180} height={40} rx={8} fill={E.red} stroke={INK} strokeWidth={SW} />
        <rect x={88} y={60} width={24} height={40} fill={E.gold} />
        <path d="M100 60 C70 20 50 40 70 60 M100 60 C130 20 150 40 130 60" stroke={E.gold} strokeWidth={12} fill="none" />
      </g>
    </svg>
  );
};

const Speaker: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const pulse = 1 + 0.06 * Math.abs(Math.sin(t * 8));
  return (
    <svg width={200} height={280} viewBox="0 0 200 280">
      <rect x={10} y={10} width={180} height={260} rx={20} fill={E.wood} stroke={INK} strokeWidth={SW} />
      <circle cx={100} cy={90} r={40 * pulse} fill={INK} />
      <circle cx={100} cy={190} r={58 * pulse} fill={INK} />
      <circle cx={100} cy={190} r={20} fill={E.dim} />
    </svg>
  );
};

const Note: React.FC<SpriteProps> = (p) => (
  <svg width={90} height={120} viewBox="0 0 90 120">
    <path d="M30 96 L30 16 L80 6 L80 80" stroke={INK} strokeWidth={8} fill="none" strokeLinejoin="round" />
    <ellipse cx={20} cy={98} rx={18} ry={14} fill={str(p.color, E.gold)} stroke={INK} strokeWidth={6} />
    <ellipse cx={70} cy={84} rx={18} ry={14} fill={str(p.color, E.gold)} stroke={INK} strokeWidth={6} />
  </svg>
);

const Heart: React.FC<SpriteProps> = (p) => (
  <svg width={140} height={130} viewBox="-70 -60 140 130">
    <path d="M0 56 C-80 0 -60 -56 -24 -56 C-6 -56 0 -40 0 -32 C0 -40 6 -56 24 -56 C60 -56 80 0 0 56 Z" fill={str(p.color, E.red)} stroke={INK} strokeWidth={SW} transform={`scale(${1 + 0.08 * Math.abs(Math.sin(p.t * 6))})`} />
  </svg>
);

const Bowl: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  const x = 20 * Math.sin(t * 2);
  return (
    <svg width={260} height={240} viewBox="0 0 260 240">
      <path d="M50 40 C-10 100 10 220 130 226 C250 220 270 100 210 40 Z" fill="#CFE7F2" stroke={INK} strokeWidth={SW} />
      <path d="M22 110 C30 200 80 222 130 222 C180 222 230 200 238 110 Z" fill="#8FC6E8" opacity={0.7} />
      <g transform={`translate(${130 + x} 150) scale(${Math.cos(t * 2) > 0 ? 1 : -1} 1)`}>
        <path d="M-40 0 C-20 -26 20 -26 30 0 C20 26 -20 26 -40 0 Z" fill="#F08A2C" stroke={INK} strokeWidth={6} />
        <path d="M30 0 L56 -20 L56 20 Z" fill="#F08A2C" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={-22} cy={-4} r={5} fill={INK} />
      </g>
      <ellipse cx={130} cy={40} rx={80} ry={14} fill="none" stroke={INK} strokeWidth={6} />
    </svg>
  );
};

const Sign: React.FC<SpriteProps> = (p) => {
  const crossed = num(p.crossed, 0);
  return (
    <svg width={260} height={200} viewBox="0 0 260 200" style={{ overflow: "visible" }}>
      <rect x={8} y={8} width={244} height={160} rx={18} fill={str(p.fill, E.gold)} stroke={INK} strokeWidth={SW} />
      <text x={130} y={118} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={num(p.size, 86)} fill={INK}>
        {str(p.text, "8 s")}
      </text>
      {crossed > 0 ? (
        <g>
          <line x1={-10} y1={-10} x2={-10 + 280 * crossed} y2={-10 + 200 * crossed} stroke={E.red} strokeWidth={18} strokeLinecap="round" />
          <line x1={270} y1={-10} x2={270 - 280 * crossed} y2={-10 + 200 * crossed} stroke={E.red} strokeWidth={18} strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  );
};

const Sofa: React.FC<SpriteProps> = () => (
  <svg width={420} height={200} viewBox="0 0 420 200">
    <rect x={30} y={20} width={360} height={110} rx={30} fill={E.wood} stroke={INK} strokeWidth={SW} />
    <rect x={50} y={100} width={320} height={60} rx={20} fill={E.cream} stroke={INK} strokeWidth={SW} />
    <rect x={6} y={70} width={70} height={110} rx={26} fill={E.wood} stroke={INK} strokeWidth={SW} />
    <rect x={344} y={70} width={70} height={110} rx={26} fill={E.wood} stroke={INK} strokeWidth={SW} />
  </svg>
);

const TV: React.FC<SpriteProps> = (p) => (
  <svg width={320} height={240} viewBox="0 0 320 240">
    <rect x={8} y={8} width={304} height={190} rx={16} fill={INK} />
    <rect x={22} y={22} width={276} height={162} rx={8} fill={str(p.screen, "#3B4A63")} />
    <text x={160} y={120} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={34} fill="#fff">
      {str(p.text, "EP 1")}
    </text>
    <rect x={130} y={198} width={60} height={30} fill={INK} />
  </svg>
);

const Car: React.FC<SpriteProps> = (p) => {
  const color = str(p.color, "#F2C230");
  const t = p.t;
  const spin = num(p.drive, 0) ? t * 600 : 0;
  return (
    <svg width={300} height={160} viewBox="0 0 300 160">
      <path d="M20 110 L30 70 L90 64 L120 24 L210 24 L250 64 L284 76 L284 110 Z" fill={color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M130 34 L200 34 L230 64 L110 64 Z" fill="#BFD9E6" stroke={INK} strokeWidth={6} />
      {[80, 224].map((x) => (
        <g key={x} transform={`rotate(${spin} ${x} 116)`}>
          <circle cx={x} cy={116} r={30} fill={INK} />
          <circle cx={x} cy={116} r={12} fill={E.dim} />
          <line x1={x} y1={98} x2={x} y2={104} stroke={E.dim} strokeWidth={5} />
        </g>
      ))}
    </svg>
  );
};

const Magnifier: React.FC<SpriteProps> = () => (
  <svg width={200} height={200} viewBox="0 0 200 200">
    <line x1={130} y1={130} x2={188} y2={188} stroke={E.wood} strokeWidth={26} strokeLinecap="round" />
    <circle cx={80} cy={80} r={66} fill="rgba(191,217,230,0.5)" stroke={INK} strokeWidth={14} />
  </svg>
);

const Graph: React.FC<SpriteProps> = (p) => {
  const draw = num(p.draw, 1);
  const N = 60;
  const f = (x: number) => 0.35 + 0.08 * Math.sin(x * 19) + 0.55 * Math.exp(-(((x - 0.45) / 0.06) ** 2)) + (x > 0.9 ? 0.3 * ((x - 0.9) / 0.1) : 0);
  const pts = Array.from({ length: Math.max(2, Math.round(N * draw)) }, (_, i) => {
    const x = i / N;
    return `${30 + x * 400},${230 - f(x) * 190}`;
  }).join(" ");
  const peak = num(p.peak, 0);
  const end = num(p.end, 0);
  return (
    <svg width={460} height={260} viewBox="0 0 460 260" style={{ overflow: "visible" }}>
      <rect x={4} y={4} width={452} height={252} rx={18} fill="#2B2622" stroke={E.text} strokeWidth={6} />
      <line x1={30} y1={230} x2={430} y2={230} stroke={E.dim} strokeWidth={4} />
      <polyline points={pts} fill="none" stroke={E.gold} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
      {peak > 0 ? <circle cx={30 + 0.45 * 400} cy={230 - f(0.45) * 190} r={18 * peak} fill={E.red} stroke={INK} strokeWidth={5} /> : null}
      {end > 0 ? <circle cx={30 + 0.983 * 400} cy={230 - f(0.983) * 190} r={18 * end} fill={E.green} stroke={INK} strokeWidth={5} /> : null}
    </svg>
  );
};

const Calendar: React.FC<SpriteProps> = (p) => (
  <svg width={200} height={210} viewBox="0 0 200 210">
    <rect x={8} y={20} width={184} height={182} rx={14} fill="#F7F4EC" stroke={INK} strokeWidth={SW} />
    <rect x={8} y={20} width={184} height={50} rx={14} fill={E.red} stroke={INK} strokeWidth={SW} />
    <text x={100} y={160} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={84} fill={INK}>
      {str(p.text, "HOY")}
    </text>
  </svg>
);

const Elephant: React.FC<SpriteProps> = (p) => {
  const t = p.t;
  return (
    <svg width={420} height={360} viewBox="0 0 420 360" style={{ overflow: "visible" }}>
      {[110, 170, 260, 320].map((x) => (
        <rect key={x} x={x - 26} y={250} width={52} height={104} rx={18} fill="#F4A3C0" stroke={INK} strokeWidth={SW} />
      ))}
      <ellipse cx={220} cy={210} rx={160} ry={110} fill="#F4A3C0" stroke={INK} strokeWidth={SW} />
      <ellipse cx={330} cy={150} rx={80} ry={74} fill="#F4A3C0" stroke={INK} strokeWidth={SW} />
      <ellipse cx={300} cy={150} rx={48} ry={66} fill="#E98AAE" stroke={INK} strokeWidth={6} />
      <path d={`M390 170 Q420 240 ${396 + 10 * Math.sin(t * 4)} 300`} stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
      <path d={`M390 170 Q420 240 ${396 + 10 * Math.sin(t * 4)} 300`} stroke="#F4A3C0" strokeWidth={30} fill="none" strokeLinecap="round" />
      <circle cx={360} cy={130} r={9} fill={INK} />
      <path d="M60 200 q-30 10 -36 40" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Words: React.FC<SpriteProps> = (p) => {
  const fade = num(p.fade, 0);
  const lines = ["bla bla bla", "texto texto", "palabras y", "más palabras"];
  return (
    <svg width={360} height={220} viewBox="0 0 360 220">
      {lines.map((l, i) => (
        <text key={i} x={180 + 60 * fade * (i % 2 ? 1 : -1)} y={50 + i * 50} textAnchor="middle" fontFamily="Inter" fontWeight={700} fontSize={38} fill={E.text} opacity={1 - fade} style={{ filter: `blur(${fade * 6}px)` }}>
          {l}
        </text>
      ))}
    </svg>
  );
};

const Clock: React.FC<SpriteProps> = (p) => {
  const speed = num(p.speed, 1);
  return (
    <svg width={160} height={160} viewBox="-80 -80 160 160">
      <circle r={70} fill="#F7F4EC" stroke={INK} strokeWidth={SW} />
      <line x2={0} y2={-40} stroke={INK} strokeWidth={8} strokeLinecap="round" transform={`rotate(${p.t * 30 * speed})`} />
      <line x2={0} y2={-56} stroke={E.red} strokeWidth={5} strokeLinecap="round" transform={`rotate(${p.t * 360 * speed})`} />
      <circle r={7} fill={INK} />
    </svg>
  );
};

const Flag: React.FC<SpriteProps> = (p) => (
  <svg width={160} height={260} viewBox="0 0 160 260">
    <line x1={20} y1={10} x2={20} y2={256} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    <path d={`M24 16 Q80 ${4 + 10 * Math.sin(p.t * 6)} 150 20 L150 100 Q80 ${86 + 10 * Math.sin(p.t * 6)} 24 96 Z`} fill="#fff" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={24 + (i % 4) * 32} y={20 + Math.floor(i / 4) * 40 + ((i % 4) % 2 ? 0 : 0)} width={32} height={38} fill={(i + Math.floor(i / 4)) % 2 ? INK : "transparent"} />
    ))}
  </svg>
);

const Arrow: React.FC<SpriteProps> = (p) => (
  <svg width={200} height={90} viewBox="0 0 200 90">
    <path d="M10 30 H130 V8 L192 45 L130 82 V60 H10 Z" fill={str(p.color, E.red)} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

const Plank: React.FC<SpriteProps> = () => (
  <svg width={360} height={300} viewBox="0 0 360 300">
    <rect x={10} y={10} width={340} height={280} rx={8} fill="#8A6A55" stroke={INK} strokeWidth={SW} />
    <rect x={36} y={36} width={288} height={100} rx={4} fill="none" stroke={INK} strokeWidth={5} />
    <rect x={36} y={160} width={288} height={104} rx={4} fill="none" stroke={INK} strokeWidth={5} />
  </svg>
);

const Tile: React.FC<SpriteProps> = (p) => (
  <svg width={150} height={190} viewBox="0 0 150 190">
    <rect x={6} y={6} width={138} height={178} rx={14} fill={str(p.fill, E.gold)} stroke={INK} strokeWidth={SW} />
    <circle cx={75} cy={74} r={30} fill={str(p.dot, E.red)} stroke={INK} strokeWidth={5} />
    <rect x={30} y={130} width={90} height={18} rx={9} fill={INK} />
  </svg>
);

const Lamp: React.FC<SpriteProps> = () => (
  <svg width={140} height={340} viewBox="0 0 140 340">
    <line x1={70} y1={90} x2={70} y2={330} stroke={INK} strokeWidth={9} />
    <ellipse cx={70} cy={330} rx={44} ry={8} fill={INK} />
    <path d="M20 90 L120 90 L100 20 L40 20 Z" fill={E.gold} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);

const Plant: React.FC<SpriteProps> = () => (
  <svg width={160} height={240} viewBox="0 0 160 240">
    <path d="M80 150 C40 120 20 60 40 30 C70 60 80 100 80 150 C80 100 100 40 130 20 C150 70 120 120 80 150" fill="#4E6B45" stroke={INK} strokeWidth={6} />
    <path d="M40 150 L120 150 L108 234 L52 234 Z" fill={E.red} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);

const Tree: React.FC<SpriteProps> = () => (
  <svg width={220} height={340} viewBox="0 0 220 340">
    <rect x={92} y={190} width={36} height={146} fill={E.wood} stroke={INK} strokeWidth={7} />
    <circle cx={110} cy={110} r={96} fill="#4E6B45" stroke={INK} strokeWidth={SW} />
  </svg>
);

export const SPRITES: Record<string, Sprite> = {
  person: { w: 220, h: 380, C: Person },
  bubble: { w: 280, h: 220, C: Bubble },
  brain: { w: 220, h: 180, C: Brain },
  mark: { w: 120, h: 120, C: Mark },
  glyph: { w: 140, h: 160, C: Glyph },
  reticle: { w: 160, h: 160, C: Reticle },
  burst: { w: 300, h: 300, C: Burst },
  phone: { w: 220, h: 400, C: Phone },
  gorilla: { w: 240, h: 330, C: Gorilla },
  ball: { w: 70, h: 70, C: Ball },
  counter: { w: 200, h: 130, C: Counter },
  eye: { w: 200, h: 120, C: Eye },
  plug: { w: 220, h: 260, C: Plug },
  house: { w: 240, h: 240, C: House },
  bush: { w: 300, h: 200, C: Bush },
  caveman: { w: 220, h: 360, C: Caveman },
  crowd: { w: 760, h: 260, C: Crowd },
  waves: { w: 240, h: 160, C: Waves },
  nametag: { w: 300, h: 170, C: NameTag },
  ear: { w: 140, h: 200, C: Ear },
  funnel: { w: 240, h: 220, C: Funnel },
  door: { w: 200, h: 320, C: Door },
  map: { w: 180, h: 140, C: MapSheet },
  monkey: { w: 220, h: 260, C: Monkey },
  juice: { w: 110, h: 170, C: Juice },
  bulb: { w: 150, h: 200, C: Bulb },
  meter: { w: 120, h: 330, C: Meter },
  gift: { w: 200, h: 220, C: Gift },
  speaker: { w: 200, h: 280, C: Speaker },
  note: { w: 90, h: 120, C: Note },
  heart: { w: 140, h: 130, C: Heart },
  bowl: { w: 260, h: 240, C: Bowl },
  sign: { w: 260, h: 200, C: Sign },
  sofa: { w: 420, h: 200, C: Sofa },
  tv: { w: 320, h: 240, C: TV },
  car: { w: 300, h: 160, C: Car },
  magnifier: { w: 200, h: 200, C: Magnifier },
  graph: { w: 460, h: 260, C: Graph },
  calendar: { w: 200, h: 210, C: Calendar },
  elephant: { w: 420, h: 360, C: Elephant },
  words: { w: 360, h: 220, C: Words },
  clock: { w: 160, h: 160, C: Clock },
  flag: { w: 160, h: 260, C: Flag },
  arrow: { w: 200, h: 90, C: Arrow },
  plank: { w: 360, h: 300, C: Plank },
  tile: { w: 150, h: 190, C: Tile },
  lamp: { w: 140, h: 340, C: Lamp },
  plant: { w: 160, h: 240, C: Plant },
  tree: { w: 220, h: 340, C: Tree },
};
