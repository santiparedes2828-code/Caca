import React from "react";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-sacudida-1.json";
import c2 from "../../data/captions-sacudida-2.json";
import c3 from "../../data/captions-sacudida-3.json";
import { SOUND } from "../../Altera/system";
import type { Ctx, Video } from "../Motor";
import { PF } from "../Motor";
import { C, CTASeguir, Dust, Estampa, Label, Pill, PortadaTexto, Sparks, Stars, Studio, bump, decay, eio, eo, ln, pop, rnd } from "../kit";

// «¿Por qué nos despertamos al caer en un sueño?» — Fábrica viral (2026-11-06). Investigación y fuentes:
// produccion/sacudida/investigacion.md. Sacudida hípnica: 60–70 % de las personas (Sleep Foundation, Sleep Charity);
// la causa no está confirmada (se dice «la teoría más conocida»); lo de los árboles es una hipótesis (Coolidge y Wynn, 2006).
// Siluetas sin cara, con 2 brazos y 2 piernas.

const LILA = "#C9A0FF";
const ROJO = "#E5484D";
const ROSA = "#FF8FB8";
const AZUL = "#7CC4FF";
const TINTA = "#241E30";

// ---------- piezas ----------
const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>{children}</svg>
);
const rad = (a: number) => (a * Math.PI) / 180;
/** punto a `len` desde (x,y) con ángulo `a` en grados (0 = hacia abajo, 90 = hacia adelante/derecha, 180 = arriba) */
const pt = (x: number, y: number, len: number, a: number): [number, number] => [x + len * Math.sin(rad(a)), y + len * Math.cos(rad(a))];

/** Silueta sin cara: cadera en (0,0). brazos/antebrazos/muslos/piernas en grados (0 = colgando). primate = brazos largos. */
const Figura: React.FC<{ x: number; y: number; s?: number; rot?: number; color?: string; brazos?: [number, number]; codos?: [number, number]; muslos?: [number, number]; rodillas?: [number, number]; primate?: boolean; luz?: string; atras?: string }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  color = TINTA,
  brazos = [12, -12],
  codos = [10, 10],
  muslos = [6, -6],
  rodillas = [0, 0],
  primate = false,
  luz,
  atras,
}) => {
  const hombro: [number, number] = [0, primate ? -96 : -112];
  const la = primate ? [74, 70] : [58, 54];
  const lp = primate ? [52, 48] : [70, 66];
  const limb = (base: [number, number], l: number[], a1: number, a2: number, k: string, w: number, col: string) => {
    const m = pt(base[0], base[1], l[0], a1);
    const e = pt(m[0], m[1], l[1], a1 + a2);
    return <path key={k} d={`M${base[0]} ${base[1]} L${m[0]} ${m[1]} L${e[0]} ${e[1]}`} stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  };
  const back = atras ?? (primate ? "#4E4062" : "#1A1522");
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {limb([0, 0], lp, muslos[1], rodillas[1], "p2", 28, back)}
      {limb(hombro, la, brazos[1], codos[1], "b2", 24, back)}
      <path d={`M0 -2 L${primate ? 10 : 0} ${hombro[1]}`} stroke={color} strokeWidth={primate ? 54 : 46} strokeLinecap="round" />
      <circle cx={primate ? 18 : 0} cy={hombro[1] - (primate ? 38 : 50)} r={primate ? 34 : 32} fill={color} />
      {primate ? <ellipse cx={46} cy={hombro[1] - 30} rx={18} ry={13} fill={color} /> : null}
      {limb([0, 0], lp, muslos[0], rodillas[0], "p1", 28, color)}
      {limb(hombro, la, brazos[0], codos[0], "b1", 24, color)}
      {luz ? <circle cx={primate ? 18 : 0} cy={hombro[1] - (primate ? 38 : 50)} r={primate ? 34 : 32} fill="none" stroke={luz} strokeWidth={4} opacity={0.7} /> : null}
    </g>
  );
};

/** Cama vista de costado con una persona tapada (sin cara). salto 0..1 = la sacudida; brazo 0..1 = saca el brazo. */
const Cama: React.FC<{ x: number; y: number; s?: number; rot?: number; f: number; salto?: number; brazo?: number; brillo?: number; manta?: string }> = ({ x, y, s = 1, rot = 0, f, salto = 0, brazo = 0, brillo = 0, manta = "#6C5CE7" }) => {
  const dy = -70 * salto;
  const resp = 3 * Math.sin(f * 0.12);
  const ah = pt(-120, -96 + dy, 70, 180 - 40 * (1 - brazo));
  const am = pt(ah[0], ah[1], 60, 160 + 20 * Math.sin(f * 0.5) * brazo);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {brillo > 0 ? <ellipse cx={0} cy={-60} rx={330} ry={150} fill={LILA} opacity={0.25 * brillo} /> : null}
      <rect x={-252} y={30} width={22} height={80} rx={6} fill="#4A3226" />
      <rect x={226} y={30} width={22} height={80} rx={6} fill="#4A3226" />
      <rect x={-270} y={-160} width={44} height={250} rx={16} fill="#6B4A36" />
      <rect x={-262} y={-6} width={520} height={56} rx={12} fill="#5B3E2E" />
      <rect x={-232} y={-44} width={480} height={46} rx={16} fill="#E8E2F2" />
      <ellipse cx={-168} cy={-62 + dy * 0.6} rx={62} ry={24} fill="#FFFFFF" />
      <g transform={`translate(0 ${dy})`}>
        {brazo > 0.02 ? <path d={`M-120 -96 L${ah[0]} ${ah[1]} L${am[0]} ${am[1]}`} stroke={TINTA} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={Math.min(1, brazo * 3)} /> : null}
        <circle cx={-166} cy={-96} r={34} fill={TINTA} />
        <path d="M-200 -104 Q-170 -140 -134 -108" stroke="#3A2E48" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d={`M-140 -44 Q-138 ${-112 - resp} -40 ${-108 - resp} Q120 ${-102 - resp} 212 -76 Q246 -64 246 -44 Z`} fill={manta} />
        <path d={`M-100 -60 Q60 ${-96 - resp} 230 -56`} stroke="rgba(255,255,255,0.18)" strokeWidth={10} fill="none" />
      </g>
    </g>
  );
};

/** Vacío: fondo oscuro con estelas que suben (se cae hacia abajo). vel = velocidad de caída. */
const Vacio: React.FC<{ f: number; vel?: number; desde?: number }> = ({ f, vel = 1, desde = 0 }) => {
  const k = Math.max(0, f - desde);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, #2A1F5A 0%, #120E2A 55%, #07060F 100%)" }} />
      <Stars f={f} n={60} h={1920} shoot={false} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 46 }, (_, i) => {
          const len = 80 + 200 * rnd(i + 3);
          const sp = (14 + 26 * rnd(i + 9)) * vel;
          const yy = (((rnd(i + 5) * 2400 - k * sp) % 2400) + 2400) % 2400 - 240;
          const xx = rnd(i) * 1080;
          return <line key={i} x1={xx} y1={yy} x2={xx} y2={yy + len} stroke={i % 5 === 0 ? LILA : "#C9D6FF"} strokeWidth={2 + 4 * rnd(i + 1)} strokeLinecap="round" opacity={(0.18 + 0.4 * rnd(i + 7)) * Math.min(1, vel)} />;
        })}
      </svg>
    </>
  );
};

/** Dormitorio de noche: pared, ventana con luna, cortinas que se mueven, piso. */
const Dormitorio: React.FC<{ f: number; piso?: number }> = ({ f, piso = 0 }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #120E22 0%, #221A3A 60%, #120E18 100%)" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={600} y={560} width={320} height={420} rx={14} fill="#0B0A1C" stroke="#4A3E66" strokeWidth={12} />
      <circle cx={790} cy={700} r={62} fill="#FFF1C9" opacity={0.95} />
      <circle cx={815} cy={685} r={58} fill="#0B0A1C" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={630 + rnd(i + 2) * 260} cy={590 + rnd(i + 8) * 360} r={2 + 2 * rnd(i)} fill="#FFFFFF" opacity={0.4 + 0.6 * Math.abs(Math.sin(f * 0.08 + i))} />
      ))}
      <line x1={760} y1={560} x2={760} y2={980} stroke="#4A3E66" strokeWidth={8} />
      <path d={`M584 540 Q${610 + 10 * Math.sin(f * 0.07)} 780 ${590 + 14 * Math.sin(f * 0.07)} 1010 L560 1010 L560 540 Z`} fill="#3B2A5E" />
      <path d={`M936 540 Q${910 - 10 * Math.sin(f * 0.07 + 1)} 780 ${930 - 14 * Math.sin(f * 0.07 + 1)} 1010 L960 1010 L960 540 Z`} fill="#3B2A5E" />
      <rect x={0} y={1440} width={1080} height={480} fill="#17121F" />
      {piso > 0 ? <path d={`M${540 - 520 * piso} 1440 L${540 + 520 * piso} 1440 L${540 + 420 * piso} ${1440 + 480 * piso} L${540 - 420 * piso} ${1440 + 480 * piso} Z`} fill="#05040A" /> : null}
    </svg>
  </>
);

/** «z z z» que suben */
const Zzz: React.FC<{ f: number; x: number; y: number; s?: number; op?: number }> = ({ f, x, y, s = 1, op = 1 }) => (
  <>
    {[0, 1, 2].map((i) => {
      const k = ((f + i * 16) % 48) / 48;
      return (
        <div key={i} style={{ position: "absolute", left: x + 40 * i + 20 * k, top: y - 120 * k - i * 30, fontFamily: PF, fontWeight: 800, fontSize: (40 + 16 * i) * s, color: LILA, opacity: op * (1 - k) }}>
          z
        </div>
      );
    })}
  </>
);

/** Cerebro (mitad dormida = oscura). */
const Cerebro: React.FC<{ x: number; y: number; s?: number; f: number; dormido?: number; alerta?: number }> = ({ x, y, s = 1, f, dormido = 0.5, alerta = 0 }) => {
  const lobes = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2;
    return [210 * Math.cos(a), 140 * Math.sin(a) - 10] as const;
  });
  const shape = (
    <>
      <ellipse cx={0} cy={-10} rx={225} ry={160} />
      {lobes.map(([lx, ly], i) => (
        <circle key={i} cx={lx} cy={ly} r={70} />
      ))}
    </>
  );
  const pulse = 1 + 0.03 * Math.sin(f * 0.25) + 0.08 * alerta * Math.abs(Math.sin(f * 0.9));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <clipPath id="cerebroClip">{shape}</clipPath>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${s * pulse})`}>
        <path d="M-30 150 Q-20 240 -40 300 L40 300 Q30 230 40 150 Z" fill="#E07AA4" />
        <ellipse cx={120} cy={170} rx={90} ry={56} fill="#E98AB2" />
        <g fill={alerta > 0 ? `rgb(255,${143 - 60 * alerta},${184 - 90 * alerta})` : ROSA}>{shape}</g>
        <g clipPath="url(#cerebroClip)" fill="none" stroke="#D2638F" strokeWidth={9} strokeLinecap="round">
          {[-150, -90, -30, 30, 90, 150].map((gx, i) => (
            <path key={i} d={`M${gx} -170 Q${gx + 40 * Math.sin(i)} -80 ${gx - 20} -10 Q${gx + 30} 60 ${gx} 170`} />
          ))}
          <path d="M-260 -40 Q-120 -10 0 -60 Q120 -10 260 -40" />
          <path d="M-260 60 Q-120 90 0 40 Q120 90 260 60" />
          <line x1={0} y1={-200} x2={0} y2={200} stroke="#B84E7A" strokeWidth={12} />
        </g>
        <rect x={0} y={-260} width={320} height={520} fill="#0A0818" opacity={0.6 * dormido} clipPath="url(#cerebroClip)" />
      </g>
    </svg>
  );
};

/** Escalón que falta: escalera dentro de una nube de sueño; la figura pisa el vacío. falta 0..1, cae 0..1 */
const SuenoEscalera: React.FC<{ f: number; fps: number; aparece: number; falta: number; cae: number }> = ({ f, fps, aparece, falta, cae }) => {
  const p = pop(f, aparece, fps);
  const step = (i: number) => ({ x: 250 + i * 120, y: 830 + i * 92 });
  const paso = Math.min(2.4, (f - aparece) / 14);
  const sx = 250 + 60 + paso * 120;
  const sy = 830 + paso * 92 - 4 * Math.abs(Math.sin(f * 0.45));
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${p})`, transformOrigin: "540px 1120px" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g opacity={0.95}>
          {[
            [540, 1120, 400, 330],
            [260, 980, 170, 150],
            [820, 980, 170, 150],
            [300, 1300, 160, 140],
            [790, 1300, 170, 150],
          ].map(([cx, cy, rx, ry], i) => (
            <ellipse key={i} cx={cx} cy={cy + 6 * Math.sin(f * 0.1 + i)} rx={rx} ry={ry} fill="#2C2450" stroke={LILA} strokeWidth={6} strokeOpacity={0.5} />
          ))}
          <ellipse cx={540} cy={1120} rx={392} ry={322} fill="#2C2450" />
        </g>
        {[0, 1, 2, 3, 4].map((i) => {
          const st = step(i);
          const gone = i === 3 ? falta : 0;
          return <rect key={i} x={st.x} y={st.y + 260 * gone * gone} width={130} height={30} rx={8} fill="#E8E2F2" opacity={1 - gone} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const st = step(i);
          return i === 3 ? null : <rect key={`s${i}`} x={st.x + 10} y={st.y + 30} width={110} height={62} fill="#4A3E78" opacity={0.6} />;
        })}
        <Figura x={cae > 0 ? sx + 40 * cae : sx} y={cae > 0 ? sy + 140 * cae * cae : sy} s={0.62} rot={30 * cae} color="#F2EEF8" atras="#B8B0D0" brazos={cae > 0 ? [150 * cae, -140 * cae] : [25 * Math.sin(f * 0.45), -25 * Math.sin(f * 0.45)]} codos={[10, 10]} muslos={cae > 0 ? [40 * cae, -30 * cae] : [30 * Math.sin(f * 0.45), -30 * Math.sin(f * 0.45)]} rodillas={[0, 20]} />
      </svg>
    </div>
  );
};

/** Árbol de noche con un primate que duerme en la rama; resbala 0..1 y se agarra 0..1. */
const ArbolPrimate: React.FC<{ f: number; resbala?: number; agarra?: number; y0?: number }> = ({ f, resbala = 0, agarra = 0, y0 = 0 }) => {
  const sway = 5 * Math.sin(f * 0.09);
  const resp = 6 * Math.sin(f * 0.22) * (1 - resbala);
  const bx = 430;
  const by = 1130 + y0;
  const caida = resbala * (1 - agarra) * 90 + agarra * 70;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <circle cx={860} cy={620 + y0} r={70} fill="#FFF1C9" opacity={0.9} />
      <circle cx={890} cy={600 + y0} r={66} fill="#120E22" />
      <g transform={`rotate(${sway} 820 1900)`}>
        <path d={`M760 1920 Q790 ${1400 + y0} 800 ${900 + y0} L880 ${900 + y0} Q880 ${1400 + y0} 900 1920 Z`} fill="#3A2A22" />
        <path d={`M810 ${1110 + y0} Q500 ${1060 + y0} 120 ${1150 + y0}`} stroke="#4A3428" strokeWidth={46} fill="none" strokeLinecap="round" />
        {[
          [820, 800, 240],
          [600, 860, 200],
          [1000, 880, 190],
          [380, 960, 170],
          [740, 640, 200],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx + 6 * Math.sin(f * 0.05 + i)} cy={cy + y0} r={r} fill={["#183A2A", "#1E4632", "#143024"][i % 3]} opacity={0.95} />
        ))}
        <Figura
          x={bx + 30 * resbala}
          y={by - 22 + caida + resp}
          s={0.85}
          rot={-8 + 38 * resbala * (1 - agarra) + 10 * agarra}
          color="#6E5A86"
          primate
          luz="#C9A0FF"
          brazos={agarra > 0 ? [180 - 10 * (1 - agarra), 60] : [70 + 40 * resbala, 50 + 60 * resbala]}
          codos={agarra > 0 ? [0, 30] : [60, 60]}
          muslos={[95 - 30 * resbala, 85 - 40 * resbala]}
          rodillas={[-80 + 40 * resbala, -70 + 50 * resbala]}
        />
      </g>
    </svg>
  );
};

/** Tarjeta de un factor (ícono + palabra). */
const Factor: React.FC<{ f: number; fps: number; at: number; y: number; texto: string; icono: React.ReactNode }> = ({ f, fps, at, y, texto, icono }) => {
  if (f < at) return null;
  const p = pop(f, at, fps);
  return (
    <div style={{ position: "absolute", left: 540, top: y, width: 800, height: 220, transform: `translate(-50%, -50%) scale(${p}) rotate(${1.5 * Math.sin(f * 0.13 + y)}deg)`, borderRadius: 30, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
      <svg width={220} height={220} style={{ position: "absolute", left: 20, top: 0, overflow: "visible" }}>
        {icono}
      </svg>
      <div style={{ position: "absolute", left: 260, top: 0, height: 220, display: "flex", alignItems: "center", fontFamily: PF, fontWeight: 800, fontSize: 84, color: C.gold }}>{texto}</div>
    </div>
  );
};
const IconoCelular: React.FC<{ f: number }> = ({ f }) => (
  <g transform={`translate(110 112) rotate(${6 * Math.sin(f * 1.3)})`}>
    <rect x={-48} y={-82} width={96} height={164} rx={16} fill="#2A2436" stroke="#8E88A0" strokeWidth={5} />
    <rect x={-38} y={-66} width={76} height={120} rx={6} fill="#5B4FA0" opacity={0.6 + 0.4 * Math.abs(Math.sin(f * 0.3))} />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={-30} y={-56 + i * 34} width={60} height={22} rx={6} fill="#E8E2F2" opacity={0.85} />
    ))}
    <circle cx={46} cy={-80} r={22} fill={ROJO} />
    <text x={46} y={-71} textAnchor="middle" fontFamily={PF} fontWeight={800} fontSize={26} fill="#fff">
      {9 + (Math.floor(f / 12) % 3)}
    </text>
  </g>
);
const IconoTaza: React.FC<{ f: number }> = ({ f }) => (
  <g transform="translate(110 130)">
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${-28 + i * 28} -40 q${12 * Math.sin(f * 0.2 + i)} -24 0 -48 q${-12 * Math.sin(f * 0.2 + i)} -24 0 -48`} stroke="#E8E2F2" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.5 + 0.4 * Math.sin(f * 0.15 + i)} />
    ))}
    <path d="M-62 -34 L62 -34 L50 50 Q48 66 30 66 L-30 66 Q-48 66 -50 50 Z" fill="#F2EEF8" />
    <path d="M62 -16 Q100 -14 96 20 Q92 48 56 44" stroke="#F2EEF8" strokeWidth={12} fill="none" />
    <ellipse cx={0} cy={-34} rx={62} ry={12} fill="#6B4A36" />
  </g>
);
const IconoReloj: React.FC<{ f: number }> = ({ f }) => (
  <g transform={`translate(110 112) rotate(${3 * Math.sin(f * 0.4)})`}>
    <circle r={78} fill="#F2EEF8" />
    <circle r={66} fill="#2A2436" />
    {Array.from({ length: 12 }, (_, i) => {
      const [a, b] = [pt(0, 0, 54, i * 30), pt(0, 0, 62, i * 30)];
      return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#E8E2F2" strokeWidth={4} />;
    })}
    <line x1={0} y1={0} x2={34} y2={0} stroke={C.gold} strokeWidth={9} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={-50} stroke="#E8E2F2" strokeWidth={6} strokeLinecap="round" transform={`rotate(${(f * 6) % 360})`} />
    <circle r={8} fill={C.gold} />
  </g>
);

/** Escudo verde con ✓ que se dibuja. */
const Escudo: React.FC<{ f: number; fps: number; at: number; x: number; y: number }> = ({ f, fps, at, x, y }) => {
  const p = pop(f, at, fps);
  const chk = ln(f, at + 4, at + 14, 0, 1, eo);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x} ${y}) scale(${p * (1 + 0.03 * Math.sin(f * 0.3))})`}>
        <circle r={260} fill={C.green} opacity={0.12 + 0.06 * Math.sin(f * 0.2)} />
        <path d="M0 -190 L150 -130 Q150 60 0 190 Q-150 60 -150 -130 Z" fill="#1F6B45" stroke={C.green} strokeWidth={14} />
        <path d="M-70 0 L-15 55 L80 -60" stroke="#FFFFFF" strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="260" strokeDashoffset={260 * (1 - chk)} />
      </g>
    </svg>
  );
};

/** Líneas de sacudida alrededor de un punto. */
const Lineas: React.FC<{ f: number; x: number; y: number; k: number; color?: string }> = ({ f, x, y, k, color = LILA }) =>
  k <= 0.01 ? null : (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 360 + 10 * Math.sin(f * 0.3);
        const [a1, b1] = pt(x, y, 240 + 40 * (1 - k), a);
        const [a2, b2] = pt(x, y, 300 + 70 * (1 - k), a);
        return <line key={i} x1={a1} y1={b1} x2={a2} y2={b2} stroke={color} strokeWidth={10} strokeLinecap="round" opacity={k} />;
      })}
    </svg>
  );

// ---------- el video ----------
const ib = (c: Ctx) => c.i("llama") - 1; // primera palabra del cuerpo («Se llama…»)
const salto = (f: number, at: number) => (f < at ? 0 : Math.exp(-(f - at) / 6) * Math.abs(Math.cos((f - at) * 0.5)));
const CAMAS_7 = [0, 3, 1, 6, 4, 9, 7];

export const sacudida: Video = {
  slug: "sacudida",
  titulo: "¿Por qué nos despertamos al caer en un sueño?",
  captions: [c1, c2, c3] as Caption[][],
  colores: [
    [/^(caés|caída|caer)$/i, ROJO],
    [/^(sacudida|hípnica|salto|golpe)$/i, LILA],
    [/^(cerebro|microsueño|escalón)$/i, ROSA],
    [/^(músculos|tensa|agarrarse)$/i, AZUL],
    [/^(despierta|despertás|dormirte)$/i, C.gold],
    [/^(antepasados|árboles|primates|hipótesis|reflejo)$/i, C.green],
    [/^(estrés|café|sueño)$/i, C.gold],
  ],

  gancho: (c) => {
    const { f, fps, v } = c;
    if (v === 1) {
      const tG = c.w("golpe");
      const tC = c.w("caés");
      return (
        <>
          <Vacio f={f} vel={1.2} />
          <Lienzo>
            <Cama x={540} y={1250} s={1.25} rot={-8 + 6 * Math.sin(f * 0.07)} f={f} salto={salto(f, tG)} brazo={ln(f, tG, tG + 6) * (1 - ln(f, tC + 10, tC + 20))} />
          </Lienzo>
          <Lineas f={f} x={540} y={1180} k={decay(f, tG, 8)} />
          <div style={{ position: "absolute", left: 0, width: 1080, top: 560, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 280, color: LILA, opacity: 0.9, transform: `scale(${1 + 0.06 * Math.sin(f * 0.3) + 0.25 * bump(f, tC)}) rotate(${6 * Math.sin(f * 0.1)}deg)`, textShadow: `0 0 50px ${LILA}` }}>?</div>
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 2) {
      const tG = c.w("golpe");
      const cae = ln(f, tG, tG + 10, 0, 1, eio);
      return (
        <>
          {f < tG + 6 ? <Dormitorio f={f} piso={ln(f, tG - 2, tG + 4)} /> : <Vacio f={f} vel={ln(f, tG, tG + 10, 0.2, 1.4)} desde={tG} />}
          <Lienzo>
            <Cama x={520} y={1330 + (f >= tG ? 60 * cae : 0)} s={1.15} rot={f >= tG ? -14 * cae + 5 * Math.sin(f * 0.2) : 0} f={f} salto={salto(f, tG)} brazo={ln(f, tG + 2, tG + 8)} />
          </Lienzo>
          {f < tG ? <Zzz f={f} x={300} y={1130} /> : null}
          <Lineas f={f} x={520} y={1260} k={decay(f, tG, 8)} />
          {f >= c.w("caés") ? <Pill x={540} y={680} text="¿POR QUÉ?" s={pop(f, c.w("caés"), fps)} size={72} rot={-3 + 2 * Math.sin(f * 0.2)} /> : null}
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    const tS = c.w("salto");
    const tP = c.w("primates");
    return (
      <>
        <Studio f={f} tint="#221A3A" />
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 960, overflow: "hidden" }}>
          <Dormitorio f={f} />
          <div style={{ position: "absolute", inset: 0, transform: "translateY(-430px)" }}>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <Cama x={500} y={1300} s={1.0} f={f} salto={salto(f, tS)} brazo={ln(f, tS, tS + 6) * (1 - ln(f, tS + 30, tS + 40))} />
            </svg>
            <Lineas f={f} x={500} y={1230} k={decay(f, tS, 8)} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 960, overflow: "hidden", background: "linear-gradient(180deg, #0E0C1E, #16122A)" }}>
          <div style={{ position: "absolute", inset: 0, transform: "translateY(-560px)" }}>
            <ArbolPrimate f={f} resbala={ln(f, tP - 4, tP + 4, 0, 1, eio)} agarra={ln(f, tP + 6, tP + 12, 0, 1, eo)} />
          </div>
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={0} y1={960} x2={1080} y2={960} stroke="#FFF6E6" strokeWidth={8} opacity={0.8 + 0.2 * Math.sin(f * 0.4)} style={{ filter: "drop-shadow(0 0 16px rgba(255,246,230,0.9))" }} />
        </svg>
        {f >= tP ? <Pill x={540} y={960} text="¿un reflejo antiguo?" s={pop(f, tP, fps)} size={60} rot={2 * Math.sin(f * 0.2)} dark /> : null}
        <Label text="ILUSTRACIÓN" x={72} y={1780} />
      </>
    );
  },

  escenas: [
    {
      id: "nombre",
      desde: (c) => c.W(ib(c)) - 2,
      dibujar: (c) => {
        const tS = c.w("sacudida", ib(c));
        return (
          <>
            <Dormitorio f={c.f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <Cama x={540} y={1330} s={1.3} f={c.f} salto={salto(c.f, tS) + 0.25 * salto(c.f, tS + 14)} brazo={ln(c.f, tS, tS + 5) * (1 - ln(c.f, tS + 24, tS + 34))} brillo={decay(c.f, tS, 10)} />
            </svg>
            <Lineas f={c.f} x={540} y={1250} k={decay(c.f, tS, 9)} />
            {c.f >= tS ? <Pill x={540} y={700} text="SACUDIDA HÍPNICA" s={pop(c.f, tS, c.fps)} size={74} rot={-2 + 1.5 * Math.sin(c.f * 0.2)} /> : null}
            <Zzz f={c.f} x={250} y={1150} op={1 - decay(c.f, tS, 30)} />
            <Label text="EN INGLÉS: HYPNIC JERK · ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "cifra",
      desde: (c) => c.w("les", ib(c)) - 2,
      dibujar: (c) => {
        const t7 = c.w("7", ib(c));
        return (
          <>
            <Studio f={c.f} tint="#221A3A" />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {Array.from({ length: 10 }, (_, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const k = CAMAS_7.indexOf(i);
                const at = t7 - 4 + k * 3;
                const on = k >= 0 && c.f >= at;
                const ap = Math.min(1, pop(c.f, c.inicio + i * 1.5, c.fps));
                return (
                  <g key={i} transform={`translate(${col ? 790 : 300} ${800 + row * 200}) scale(${ap})`}>
                    <Cama x={0} y={0} s={0.5} f={c.f + i * 7} salto={on ? salto(c.f, at) + 0.3 * salto(c.f, at + 20 + i) : 0} brillo={on ? 0.8 : 0} manta={on ? "#8E6CFF" : "#4A4458"} />
                  </g>
                );
              })}
            </svg>
            {c.f >= t7 ? <Pill x={540} y={620} text="60–70 % de las personas" s={pop(c.f, t7, c.fps)} size={74} rot={2 * Math.sin(c.f * 0.2)} /> : null}
            <Label text="SLEEP FOUNDATION / SLEEP CHARITY: 60–70 % DE LAS PERSONAS" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "musculos",
      desde: (c) => c.w("al", ib(c)) - 2,
      dibujar: (c) => {
        const tA = c.w("aflojan", ib(c));
        const tension = 1 - ln(c.f, c.w("músculos", ib(c)), tA + 8, 0, 0.85, eio);
        return (
          <>
            <Studio f={c.f} tint="#1E2238" />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <rect x={90} y={1262} width={720} height={46} rx={20} fill="#E8E2F2" opacity={0.9} />
              <ellipse cx={170} cy={1236} rx={74} ry={26} fill="#FFFFFF" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <ellipse key={i} cx={250 + i * 95} cy={1215 + 6 * Math.sin(c.f * 0.3 + i)} rx={60} ry={34} fill={ROJO} opacity={0.6 * tension * (0.7 + 0.3 * Math.sin(c.f * 0.5 + i))} style={{ filter: "blur(6px)" }} />
              ))}
              <Figura x={520} y={1222} s={1.5} rot={-90} color="#C8BEE0" atras="#8E84A8" luz={AZUL} brazos={[30 + 50 * tension, -15 + 35 * tension]} codos={[35 * tension, 25 * tension]} muslos={[4 + 10 * tension, -4]} rodillas={[0, 8 * tension]} />
            </svg>
            <div style={{ position: "absolute", left: 870, top: 640, width: 110, height: 820, borderRadius: 30, background: "rgba(16,13,20,0.92)", border: "4px solid rgba(255,255,255,0.15)" }}>
              <div style={{ position: "absolute", left: 14, right: 14, bottom: 14, height: 792 * tension, borderRadius: 20, background: `linear-gradient(180deg, ${tension > 0.5 ? ROJO : AZUL}, ${AZUL})`, boxShadow: `0 0 30px ${AZUL}` }} />
            </div>
            <div style={{ position: "absolute", left: 775, width: 300, top: 1484, textAlign: "center", fontFamily: PF, fontWeight: 600, fontSize: 24, lineHeight: 1.3, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)" }}>TENSIÓN<br />MUSCULAR</div>
            <Zzz f={c.f} x={150} y={1120} op={ln(c.f, tA, tA + 10)} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "teoria",
      desde: (c) => c.w("teoría", ib(c)) - 6,
      dibujar: (c) => {
        const b = ib(c);
        const tCaida = c.w("caída", b);
        const tConf = c.w("confunde", b);
        const bub = c.f >= tConf - 4 ? pop(c.f, tConf - 4, c.fps) : 0;
        return (
          <>
            <Studio f={c.f} tint="#2A1A30" />
            <Cerebro x={540} y={1300} s={1.0} f={c.f} dormido={ln(c.f, c.w("medio", b), c.w("medio", b) + 8)} alerta={decay(c.f, tCaida, 14)} />
            <Zzz f={c.f} x={640} y={1180} op={ln(c.f, c.w("medio", b), c.w("medio", b) + 8)} />
            {bub > 0 ? (
              <div style={{ position: "absolute", inset: 0, transform: `scale(${bub})`, transformOrigin: "540px 1080px" }}>
                <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  <circle cx={500} cy={1060} r={18} fill="#F2EEF8" />
                  <circle cx={470} cy={1000} r={28} fill="#F2EEF8" />
                  <ellipse cx={540} cy={790} rx={252} ry={172} fill="#F2EEF8" />
                  <clipPath id="burbuja">
                    <ellipse cx={540} cy={790} rx={236} ry={156} />
                  </clipPath>
                  <g clipPath="url(#burbuja)">
                    <rect x={290} y={620} width={500} height={340} fill="#3B3080" />
                    {Array.from({ length: 14 }, (_, i) => {
                      const yy = ((rnd(i) * 420 - (c.f - tConf) * 16) % 420 + 420) % 420 + 580;
                      const xx = 320 + rnd(i + 4) * 440;
                      return <line key={i} x1={xx} y1={yy} x2={xx} y2={yy + 80} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />;
                    })}
                    <Figura x={540} y={850} s={0.62} rot={12 * Math.sin(c.f * 0.2)} color="#FFFFFF" atras="#B8B0D0" brazos={[160 + 10 * Math.sin(c.f * 0.6), -160 - 10 * Math.sin(c.f * 0.6)]} codos={[15, -15]} muslos={[28, -28]} rodillas={[-20, 20]} />
                  </g>
                </svg>
              </div>
            ) : null}
            {c.f >= tCaida ? <Pill x={540} y={600} text="¿una caída?" s={pop(c.f, tCaida, c.fps)} size={64} rot={-3} dark /> : null}
            <Label text="TEORÍA: LA CAUSA EXACTA NO ESTÁ CONFIRMADA" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "reaccion",
      desde: (c) => c.w("entonces", ib(c)) - 2,
      dibujar: (c) => {
        const b = ib(c);
        const tD = c.w("despierta", b);
        const tens = ln(c.f, c.w("tensa", b), c.w("agarrarse", b) + 6);
        return (
          <>
            <Dormitorio f={c.f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <Cama x={540 + 6 * tens * Math.sin(c.f * 2.1) * (c.f < tD ? 1 : 0)} y={1330} s={1.3} f={c.f} salto={0.12 * tens * (c.f < tD ? 1 : 0) + 1.1 * salto(c.f, tD)} brazo={Math.max(tens * 0.6, ln(c.f, tD, tD + 4))} brillo={decay(c.f, tD, 12)} manta={tens > 0.3 && c.f < tD + 20 ? "#7A5CE7" : "#6C5CE7"} />
            </svg>
            <Lineas f={c.f} x={540} y={1240} k={Math.max(0.35 * tens * (c.f < tD ? 1 : 0), decay(c.f, tD, 10))} color={c.f >= tD ? C.gold : AZUL} />
            {c.f >= tD ? <div style={{ position: "absolute", left: 0, width: 1080, top: 560, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 230, color: C.gold, transform: `scale(${pop(c.f, tD, c.fps) * (1 + 0.05 * Math.sin(c.f * 0.5))})`, textShadow: `0 0 40px ${C.gold}` }}>¡!</div> : null}
            <Sparks f={c.f} at={tD} x={540} y={1200} n={24} color={C.gold} spread={420} />
            <div style={{ position: "absolute", inset: 0, background: "#FFF6E6", opacity: 0.55 * decay(c.f, tD, 3), pointerEvents: "none" }} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "micro",
      desde: (c) => c.w("a", c.i("despierta", ib(c))) - 2,
      dibujar: (c) => {
        const b = ib(c);
        const tE = c.w("escalón", b);
        const tN = c.w("no", c.i("escalón", b));
        return (
          <>
            <Studio f={c.f} tint="#231C40" />
            <Stars f={c.f} n={40} h={1900} shoot={false} />
            <SuenoEscalera f={c.f} fps={c.fps} aparece={c.inicio} falta={ln(c.f, tE, tE + 8, 0, 1, eo)} cae={ln(c.f, tN, tN + 12, 0, 1, eio)} />
            {c.f >= c.w("microsueño", b) ? <Pill x={540} y={640} text="microsueño" s={pop(c.f, c.w("microsueño", b), c.fps)} size={64} rot={-2 + 2 * Math.sin(c.f * 0.2)} /> : null}
            {c.f >= tN + 4 ? <div style={{ position: "absolute", left: 760, top: 1060, fontFamily: PF, fontWeight: 800, fontSize: 160, color: ROJO, transform: `scale(${pop(c.f, tN + 4, c.fps)}) rotate(${10 * Math.sin(c.f * 0.3)}deg)`, textShadow: `0 0 30px ${ROJO}` }}>!</div> : null}
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "hipotesis",
      desde: (c) => c.w("por", c.i("estaba", ib(c))) - 2,
      dibujar: (c) => {
        const b = ib(c);
        const tH = c.w("hipótesis", b);
        const tR = c.w("reflejo", b);
        const tA = c.w("árboles", b);
        return (
          <>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0E0C1E, #16122A 60%, #0B0A14)" }} />
            <Stars f={c.f} n={50} h={1100} shoot={false} />
            <ArbolPrimate f={c.f} y0={60} resbala={ln(c.f, tR, tR + 8, 0, 1, eio)} agarra={ln(c.f, tR + 10, tR + 16, 0, 1, eo)} />
            <Dust f={c.f} x0={60} x1={1020} y0={700} y1={1600} n={36} color="#D8FF9C" />
            <Zzz f={c.f} x={480} y={1040} s={0.8} op={1 - ln(c.f, tR - 4, tR + 2)} />
            <Sparks f={c.f} at={tR + 10} x={470} y={1150} n={14} color={C.green} spread={200} />
            <Estampa f={c.f} fps={c.fps} at={tH} texto="HIPÓTESIS" color={C.gold} y={640} size={110} />
            {c.f >= tA ? <Pill x={540} y={1560} text="antepasados que dormían en árboles" s={pop(c.f, tA, c.fps)} size={44} dark /> : null}
            <Label text="COOLIDGE Y WYNN, 2006 · NO ESTÁ PROBADA · ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "factores",
      desde: (c) => c.w("pasa", c.i("árboles", ib(c))) - 2,
      dibujar: (c) => {
        const b = ib(c);
        return (
          <>
            <Studio f={c.f} tint="#2A2238" />
            <Factor f={c.f} fps={c.fps} at={c.w("estrés", b) - 2} y={720} texto="ESTRÉS" icono={<IconoCelular f={c.f} />} />
            <Factor f={c.f} fps={c.fps} at={c.w("café", b) - 2} y={1000} texto="CAFÉ" icono={<IconoTaza f={c.f} />} />
            <Factor f={c.f} fps={c.fps} at={c.w("poco", b) - 2} y={1280} texto="POCO SUEÑO" icono={<IconoReloj f={c.f} />} />
            <Dust f={c.f} x0={0} x1={1080} y0={600} y1={1700} n={24} color="#FFE7C0" />
            <Label text="SLEEP FOUNDATION · CLEVELAND CLINIC" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "seguro",
      desde: (c) => c.w("y", c.i("sueño", c.i("poco", ib(c)))) - 2,
      dibujar: (c) => (
        <>
          <Dormitorio f={c.f} />
          <Escudo f={c.f} fps={c.fps} at={c.inicio + 2} x={540} y={860} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Cama x={540} y={1400} s={0.95} f={c.f} />
          </svg>
          <Zzz f={c.f} x={330} y={1250} />
          <Sparks f={c.f} at={c.inicio + 6} x={540} y={860} n={20} color={C.green} spread={340} />
        </>
      ),
    },
    {
      id: "cta",
      subtitulos: false,
      desde: (c) => c.w("seguime"),
      dibujar: (c) => (
        <CTASeguir
          f={c.f}
          fps={c.fps}
          at={c.inicio}
          tarjeta={{ etiqueta: "MÁS COSAS RARAS", texto: <>que hace tu <span style={{ color: LILA }}>cuerpo</span></>, desde: c.w("cosas", c.i("seguime")) - 4 }}
          abajo={
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <Cama x={540} y={1520} s={0.9} f={c.f} salto={0.5 * salto(c.f, c.inicio + 24)} brazo={0.6 * ln(c.f, c.inicio + 24, c.inicio + 28) * (1 - ln(c.f, c.inicio + 40, c.inicio + 48))} />
            </svg>
          }
        />
      ),
    },
  ],

  impactos: (c) => {
    const b = ib(c);
    const g = c.v === 3 ? c.w("salto") : c.w("golpe");
    return [g, c.w("sacudida", b), c.w("despierta", b), c.w("no", c.i("escalón", b)) + 4, c.w("hipótesis", b) + 4];
  },
  pops: (c) => {
    const b = ib(c);
    return [c.w("sacudida", b), c.w("7", b), c.w("caída", b), c.w("microsueño", b), c.w("árboles", b), c.w("estrés", b) - 2, c.w("café", b) - 2, c.w("poco", b) - 2];
  },
  temblor: (c, escena) => {
    if (escena === "gancho" && c.v !== 3) return 4 + 3 * Math.sin(c.f * 0.2);
    return 0;
  },
  sfx: (c) => {
    const b = ib(c);
    const g = c.v === 3 ? c.w("salto") : c.w("golpe");
    const out = [
      { at: g, src: "sfx/slam.wav", vol: 0.55 },
      { at: c.w("sacudida", b), src: "sfx/slam.wav", vol: 0.45 },
      ...CAMAS_7.map((_, k) => ({ at: c.w("7", b) - 4 + k * 3, src: "sfx/click.wav", vol: 0.3 })),
      { at: c.w("teoría", b), src: SOUND.tension, vol: 0.3 },
      { at: c.w("despierta", b), src: SOUND.impacto, vol: 0.75 },
      { at: c.w("despierta", b), src: "sfx/slam.wav", vol: 0.4 },
      { at: c.w("no", c.i("escalón", b)), src: "sfx/whoosh.wav", vol: 0.5 },
      { at: c.w("hipótesis", b), src: SOUND.impacto, vol: 0.5 },
      { at: c.w("reflejo", b), src: SOUND.tiron, vol: 0.45 },
      { at: c.w("seguime"), src: "sfx/pop.wav", vol: 0.5 },
    ];
    if (c.v === 2) out.push({ at: c.w("golpe"), src: "sfx/whoosh.wav", vol: 0.6 }, { at: c.w("golpe") + 2, src: "sfx/boom.wav", vol: 0.35 });
    if (c.v === 1) out.push({ at: 0, src: "sfx/whoosh.wav", vol: 0.4 });
    if (c.v === 3) out.push({ at: c.w("primates"), src: SOUND.tiron, vol: 0.45 });
    return out;
  },

  portada: (v) => (
    <PortadaTexto
      lineas={v === 2 ? ["Estás por dormirte…", "y de golpe", "sentís que te caés"] : v === 3 ? ["Ese salto al dormirte", "podría venir", "de los primates"] : ["¿Por qué te despertás", "cuando soñás", "que te caés?"]}
      fondo={
        <>
          <Vacio f={20} vel={1} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Cama x={540} y={1300} s={1.3} rot={-10} f={20} salto={0.4} brazo={0.9} brillo={0.6} />
          </svg>
          <Lineas f={20} x={540} y={1230} k={0.8} />
        </>
      }
    />
  ),
};
