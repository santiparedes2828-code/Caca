import { fitText } from "@remotion/layout-utils";
import React, { useId } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, CONTENT_W, displayFont, SPRINGS } from "./motion";
import type { MODELS } from "./props";
import type { Theme } from "./theme";

// Modelos animados para la escena [modelo: …]: ilustraciones de motion graphics hechas con código (sin imágenes
// externas). Cada uno recibe el tema, el fotograma de entrada y, la fórmula, su texto.

type ModelProps = { theme: Theme; enter: number; value: string; ready: boolean };

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const useEnter = (theme: Theme, enter: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { s: spring({ frame: frame - enter, fps, config: SPRINGS[theme.motion] }), t: Math.max(0, frame - enter) / fps };
};

// Átomo: núcleo que late y tres órbitas que giran con sus electrones
const Atom: React.FC<ModelProps> = ({ theme, enter }) => {
  const { s, t } = useEnter(theme, enter);
  const id = useId().replace(/:/g, "");
  const p = theme.palette;
  const pulse = 1 + Math.sin(t * Math.PI * 2 * 1.2) * 0.08;
  return (
    <svg viewBox="-320 -320 640 640" style={{ width: 600, height: 600, alignSelf: "center", overflow: "visible", transform: `scale(${s}) rotate(${(1 - s) * -40}deg)` }}>
      <defs>
        <radialGradient id={`halo${id}`}>
          <stop offset="0%" stopColor={p.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle r={170 * pulse} fill={`url(#halo${id})`} />
      {[0, 60, 120].map((rot, i) => {
        const a = t * Math.PI * 2 * (0.55 + i * 0.12) + i * 2.1;
        return (
          <g key={i} transform={`rotate(${rot + t * 10})`}>
            <ellipse rx="285" ry="96" fill="none" stroke={p.accent2} strokeWidth="5" opacity="0.6" />
            <circle cx={285 * Math.cos(a)} cy={96 * Math.sin(a)} r="17" fill={p.accent2} filter={`url(#glow${id})`} />
          </g>
        );
      })}
      <circle r={48 * pulse} fill={p.accent} filter={`url(#glow${id})`} />
      <circle r={20} cx={-12} cy={-12} fill={rgba("#FFFFFF", 0.55)} />
    </svg>
  );
};

// Luz en paquetes: una fuente que brilla y paquetes de onda que viajan con su fotón
const Light: React.FC<ModelProps> = ({ theme, enter }) => {
  const { s, t } = useEnter(theme, enter);
  const id = useId().replace(/:/g, "");
  const p = theme.palette;
  const W = 820;
  const span = W + 220;
  const packets = [0, 1, 2].map((i) => {
    const c = ((t * 260 + i * (span / 3)) % span) - 110 - W / 2 + 120;
    let d = "";
    for (let x = -150; x <= 150; x += 6) {
      const y = 70 * Math.exp(-((x / 80) ** 2)) * Math.sin(x * 0.11 - t * 14);
      d += `${d ? "L" : "M"}${(c + x).toFixed(1)} ${y.toFixed(1)}`;
    }
    const fade = interpolate(c, [-W / 2 + 60, -W / 2 + 160, W / 2 - 80, W / 2 + 40], [0, 1, 1, 0], clamp);
    return { d, c, fade };
  });
  const rays = (t * 30) % 360;
  return (
    <svg viewBox={`${-W / 2} -230 ${W} 460`} style={{ width: W, height: 460, alignSelf: "center", overflow: "visible", opacity: s, transform: `scale(${0.6 + 0.4 * s})` }}>
      <defs>
        <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`sol${id}`}>
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor={p.accent} />
          <stop offset="100%" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${-W / 2 + 70} 0)`}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="-4" y="-120" width="8" height="46" rx="4" fill={p.accent} opacity="0.7" transform={`rotate(${rays + i * 30})`} />
        ))}
        <circle r="90" fill={`url(#sol${id})`} />
      </g>
      {packets.map((k, i) => (
        <g key={i} opacity={k.fade}>
          <path d={k.d} fill="none" stroke={p.accent} strokeWidth="9" strokeLinecap="round" filter={`url(#glow${id})`} />
          <circle cx={k.c} cy="0" r="13" fill="#FFFFFF" filter={`url(#glow${id})`} />
        </g>
      ))}
    </svg>
  );
};

// Fórmula: el texto grande con resplandor, rayos que giran detrás y partículas en órbita
const Formula: React.FC<ModelProps> = ({ theme, enter, value, ready }) => {
  const { s, t } = useEnter(theme, enter);
  const p = theme.palette;
  const f = displayFont(theme);
  const size = ready ? Math.min(250, fitText({ text: value, withinWidth: CONTENT_W * 0.86, fontFamily: f.fontFamily, fontWeight: 800 }).fontSize) : 200;
  const glow = 0.75 + Math.sin(t * Math.PI * 2 * 0.8) * 0.25;
  return (
    <div style={{ position: "relative", alignSelf: "center", width: CONTENT_W, height: size * 2.1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          width: size * 2.6,
          height: size * 2.6,
          borderRadius: "50%",
          background: `repeating-conic-gradient(${rgba(p.accent, 0.22)} 0deg 8deg, transparent 8deg 24deg)`,
          maskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 70%)",
          transform: `rotate(${t * 18}deg) scale(${s})`,
        }}
      />
      {Array.from({ length: 10 }, (_, i) => {
        const a = t * Math.PI * 2 * 0.35 + (i / 10) * Math.PI * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: i % 2 ? p.accent2 : "#FFFFFF",
              boxShadow: `0 0 18px ${p.accent2}`,
              transform: `translate(${Math.cos(a) * size * 1.25}px, ${Math.sin(a) * size * 0.55}px) scale(${s})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "relative",
          fontFamily: f.fontFamily,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: "-0.03em",
          color: p.accent,
          whiteSpace: "nowrap",
          filter: `drop-shadow(0 0 ${18 * glow}px ${rgba(p.accent, 0.9)}) drop-shadow(0 0 ${46 * glow}px ${rgba(p.accent, 0.5)})`,
          transform: `scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * -8}deg)`,
        }}
      >
        {value}
      </div>
    </div>
  );
};

// Espacio-tiempo: una malla que se curva bajo una masa que se mueve, con una luna en órbita
const Spacetime: React.FC<ModelProps> = ({ theme, enter }) => {
  const { s, t } = useEnter(theme, enter);
  const id = useId().replace(/:/g, "");
  const p = theme.palette;
  const W = 820;
  const H = 520;
  const mx = Math.sin(t * 0.9) * 140;
  const my = 40 + Math.cos(t * 0.7) * 50;
  const depth = 150 * s;
  const point = (x: number, y: number) => {
    const d2 = (x - mx) ** 2 + (y - my) ** 2;
    // Perspectiva sencilla: las filas lejanas se comprimen
    const py = y * 0.55 + depth * Math.exp(-d2 / 26000);
    const k = 0.75 + (y + H / 2) / H / 2;
    return `${(x * k).toFixed(1)} ${py.toFixed(1)}`;
  };
  const lines: string[] = [];
  for (let gy = -H / 2; gy <= H / 2; gy += 40) {
    let d = "";
    for (let gx = -W / 2; gx <= W / 2; gx += 20) d += `${d ? "L" : "M"}${point(gx, gy)}`;
    lines.push(d);
  }
  for (let gx = -W / 2; gx <= W / 2; gx += 48) {
    let d = "";
    for (let gy = -H / 2; gy <= H / 2; gy += 20) d += `${d ? "L" : "M"}${point(gx, gy)}`;
    lines.push(d);
  }
  const ball = point(mx, my).split(" ").map(Number);
  const moonA = t * Math.PI * 2 * 0.5;
  return (
    <svg viewBox={`${-W / 2} -190 ${W} 440`} style={{ width: W, height: 440, alignSelf: "center", overflow: "visible", opacity: Math.min(1, s * 1.4) }}>
      <defs>
        <radialGradient id={`masa${id}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor={p.accent} />
          <stop offset="100%" stopColor={rgba(p.accent, 0.6)} />
        </radialGradient>
        <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={p.accent2} strokeWidth="2.5" opacity="0.55" />
      ))}
      <circle cx={ball[0]} cy={ball[1] - 40} r={52 * s} fill={`url(#masa${id})`} filter={`url(#glow${id})`} />
      <circle cx={ball[0] + Math.cos(moonA) * 120} cy={ball[1] - 40 + Math.sin(moonA) * 40} r={14 * s} fill="#FFFFFF" filter={`url(#glow${id})`} />
    </svg>
  );
};

export const Model: React.FC<ModelProps & { kind: (typeof MODELS)[number] | string }> = ({ kind, ...props }) =>
  kind === "atomo" ? <Atom {...props} /> : kind === "luz" ? <Light {...props} /> : kind === "formula" ? (props.value ? <Formula {...props} /> : null) : kind === "espaciotiempo" ? <Spacetime {...props} /> : null;
