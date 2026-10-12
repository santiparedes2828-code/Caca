import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B, MONO, SANS, SERIF, STROKE } from "./brand";
import { Mono, opt } from "./text";

// Entrada de gráficos: escala 0,92 → 1 + opacidad, spring sin rebote (estilo-hookhouse.md §4)
export const useEnter = (start: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: 10 });
  return { opacity: s, scale: `${0.92 + 0.08 * s}` };
};

// Logotipo de texto provisional: "hook" (Inter ExtraBold) + "house" (Inter ExtraBold verde) + punto verde.
// Sustituir por el logo real de Hook House cuando esté disponible.
export const Wordmark: React.FC<{ size: number; color?: string; houseOpacity?: number; dot?: number }> = ({
  size,
  color = B.ink,
  houseOpacity = 1,
  dot = 1,
}) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", whiteSpace: "nowrap", lineHeight: 1 }}>
    <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: "-0.05em", color }}>hook</span>
    <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: size, color: B.green, marginLeft: size * 0.02, opacity: houseOpacity }}>
      house
    </span>
    <span
      style={{
        display: "inline-block",
        width: size * 0.2,
        height: size * 0.2,
        borderRadius: "50%",
        background: B.green,
        marginLeft: size * 0.06,
        scale: `${dot}`,
      }}
    />
  </span>
);

// Cabecera de marca: logotipo + etiqueta mono
export const Header: React.FC = () => (
  <div style={{ position: "absolute", top: 160, left: 80, right: 80, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Wordmark size={36} />
    <Mono size={22}>
      <span style={{ color: B.green }}>(01)</span> edición automática
    </Mono>
  </div>
);

// Pestañas de progreso (estilo-hookhouse.md §3): changes = frames absolutos en que cada pestaña se activa
export const Tabs: React.FC<{ start: number; changes: readonly number[]; labels: readonly string[] }> = ({ start, changes, labels }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const active = changes.filter((c) => frame >= c).length - 1;
  return (
    <div style={{ position: "absolute", top: 330, left: 80, display: "flex", gap: 20, ...enter, transformOrigin: "left center" }}>
      {labels.map((l, k) => {
        const state = k === active ? "active" : k < active ? "done" : "todo";
        return (
          <div
            key={l}
            style={{
              width: 292,
              height: 82,
              borderRadius: 41,
              border: `3px solid ${state === "done" ? B.fill : B.ink}`,
              background: state === "active" ? B.ink : state === "done" ? B.fill : "transparent",
              color: state === "active" ? B.white : state === "done" ? B.grey : B.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            ({String(k + 1).padStart(2, "0")}) {l}
          </div>
        );
      })}
    </div>
  );
};

// Fila con icono + palabra + etiqueta mono (sección "Grabar / Editar")
export const IconRow: React.FC<{ top: number; start: number; icon: React.ReactNode; title: string; label: React.ReactNode; labelColor?: string }> = ({
  top,
  start,
  icon,
  title,
  label,
  labelColor = B.grey,
}) => {
  const enter = useEnter(start);
  return (
    <div style={{ position: "absolute", top, left: 80, display: "flex", alignItems: "center", gap: 40, ...enter, transformOrigin: "left center" }}>
      <div style={{ width: 170, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, letterSpacing: "-0.055em", lineHeight: 1, color: B.ink }}>{title}</div>
        <Mono size={28} color={labelColor} style={{ display: "block", marginTop: 14 }}>
          {label}
        </Mono>
      </div>
    </div>
  );
};

export const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={160} height={160} viewBox="-80 -80 160 160">
      <circle r={70} fill="none" stroke={B.ink} strokeWidth={STROKE} />
      <line x1={0} y1={0} x2={0} y2={-40} stroke={B.ink} strokeWidth={STROKE} strokeLinecap="round" transform={`rotate(${frame * 1.5})`} />
      <line x1={0} y1={0} x2={0} y2={-56} stroke={B.green} strokeWidth={6} strokeLinecap="round" transform={`rotate(${frame * 18})`} />
      <circle r={7} fill={B.ink} />
    </svg>
  );
};

// Cronómetro en caja verde: cuenta minutos de 0:00 a "una tarde entera"
export const TimerBox: React.FC<{ start: number; end: number }> = ({ start, end }) => {
  const frame = useCurrentFrame();
  const minutes = Math.round(interpolate(frame, [start, end], [0, 270], { ...opt, easing: Easing.in(Easing.quad) }));
  return (
    <div
      style={{
        width: 160,
        height: 160,
        borderRadius: 28,
        background: B.green,
        color: B.white,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Mono size={15} color="rgba(255,255,255,0.85)">tu tiempo</Mono>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 50, letterSpacing: "-0.04em" }}>
        {Math.floor(minutes / 60)}:{String(minutes % 60).padStart(2, "0")}
      </span>
    </div>
  );
};

// Línea de tiempo de edición: pistas que se rellenan con cada palabra; playhead verde
export const Timeline: React.FC<{ starts: readonly number[]; from: number; to: number; top: number }> = ({ starts, from, to, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(from);
  const W = 920;
  const labelW = 190;
  const trackW = W - labelW - 40;
  const play = interpolate(frame, [from, to], [0, 1], opt);
  const tracks: { label: string; blocks: [number, number][]; color: string; wave?: boolean }[] = [
    { label: "cortes", blocks: [[0, 0.22], [0.24, 0.42], [0.44, 0.7], [0.72, 1]], color: B.ink },
    { label: "subs", blocks: Array.from({ length: 10 }, (_, k) => [k * 0.1 + 0.01, k * 0.1 + 0.085] as [number, number]), color: B.greenDark },
    { label: "zoom", blocks: [[0.08, 0.3], [0.55, 0.8]], color: B.green },
    { label: "música", blocks: [], color: B.ink, wave: true },
  ];
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        width: W,
        height: 560,
        border: `${STROKE - 2}px solid ${B.ink}`,
        borderRadius: 28,
        ...enter,
      }}
    >
      <div style={{ position: "absolute", top: 22, left: labelW, right: 30, display: "flex", justifyContent: "space-between" }}>
        {["00:00", "00:10", "00:20", "00:30"].map((t) => (
          <Mono key={t} size={20}>
            {t}
          </Mono>
        ))}
      </div>
      {tracks.map((t, k) => {
        const p = interpolate(frame, [starts[k], starts[k] + 10], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
        const y = 80 + k * 118;
        return (
          <div key={t.label} style={{ position: "absolute", top: y, left: 0, right: 0, height: 118, borderTop: k ? `2px solid ${B.fill}` : undefined }}>
            <Mono size={22} color={p > 0.5 ? B.ink : B.grey} style={{ position: "absolute", left: 30, top: 44 }}>
              {t.label}
            </Mono>
            <svg width={trackW} height={80} style={{ position: "absolute", left: labelW, top: 20 }}>
              {t.wave
                ? Array.from({ length: 46 }, (_, j) => {
                    const h = 10 + ((j * 53) % 47) * 1.2;
                    return j / 46 < p ? <rect key={j} x={j * (trackW / 46)} y={40 - h / 2} width={6} height={h} rx={3} fill={t.color} /> : null;
                  })
                : t.blocks.map(([a, b], j) => (
                    <rect key={j} x={a * trackW} y={8} height={64} rx={8} width={Math.max(0, (b - a) * trackW * p)} fill={t.color} />
                  ))}
            </svg>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 56, bottom: 20, left: labelW + play * trackW, width: 5, background: B.green }}>
        <div style={{ position: "absolute", top: -12, left: -10, width: 25, height: 16, background: B.green, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
      </div>
    </div>
  );
};

// Móvil grabando + carpeta que recibe el clip
export const PhoneToFolder: React.FC<{ start: number; send: number; done: number; top: number }> = ({ start, send, done, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const folder = useEnter(start + 6);
  const fly = interpolate(frame, [send, done], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const received = frame >= done;
  return (
    <div style={{ position: "absolute", top, left: 80, width: 920, height: 520 }}>
      <svg width={260} height={500} viewBox="0 0 260 500" style={{ position: "absolute", left: 40, top: 0, ...enter }}>
        <rect x={6} y={6} width={248} height={488} rx={44} fill={B.bg} stroke={B.ink} strokeWidth={STROKE} />
        <rect x={95} y={26} width={70} height={16} rx={8} fill={B.ink} />
        <circle cx={44} cy={78} r={8} fill={B.green} opacity={Math.floor(frame / 10) % 2 ? 1 : 0.25} />
        <text x={60} y={86} fontFamily={MONO} fontWeight={700} fontSize={22} fill={B.ink}>
          REC
        </text>
        <rect x={50} y={120} width={160} height={250} rx={14} fill="none" stroke={B.fill} strokeWidth={4} />
        <circle cx={130} cy={428} r={34} fill="none" stroke={B.ink} strokeWidth={6} />
        <circle cx={130} cy={428} r={24} fill={B.green} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: interpolate(fly, [0, 1], [150, 640]),
          top: interpolate(fly, [0, 0.5, 1], [180, 40, 190]),
          width: 110,
          height: 160,
          borderRadius: 14,
          background: B.ink,
          rotate: `${interpolate(fly, [0, 1], [-8, 14])}deg`,
          opacity: fly > 0 && fly < 1 ? 1 : 0,
        }}
      />
      <div style={{ position: "absolute", left: 520, top: 170, width: 380, ...folder }}>
        <svg width={380} height={280} viewBox="0 0 380 280">
          <path d="M10 40 Q10 20 30 20 H140 L175 55 H350 Q370 55 370 75 V250 Q370 270 350 270 H30 Q10 270 10 250 Z" fill={B.ink} />
        </svg>
        <Mono size={26} color={received ? B.ink : B.grey} style={{ display: "block", marginTop: 18, textAlign: "center" }}>
          <span style={{ color: received ? B.green : B.grey }}>{received ? "1" : "0"}</span>/1 · bruto.mp4
        </Mono>
      </div>
    </div>
  );
};

// Tarjetas cuadradas numeradas: la del paso actual en verde
export const StepCards: React.FC<{ start: number; greenAt: readonly number[]; labels: readonly string[]; top: number }> = ({ start, greenAt, labels, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  // Solo la tarjeta del paso actual va en verde; las anteriores quedan negras
  const current = greenAt.filter((f) => frame >= f).length - 1;
  return (
    <div style={{ position: "absolute", top, left: 80, display: "flex", gap: 24, ...enter, transformOrigin: "left center" }}>
      {labels.map((l, k) => {
        const g = k === current;
        return (
          <div
            key={l}
            style={{
              width: 290,
              height: 320,
              borderRadius: 28,
              background: g ? B.green : B.ink,
              color: B.white,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Mono size={22} color="rgba(255,255,255,0.8)">
              {l}
            </Mono>
            <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 170, lineHeight: 1, letterSpacing: "-0.05em" }}>{k + 1}</span>
          </div>
        );
      })}
    </div>
  );
};

// Botón Seguir → Siguiendo + curva de retención que se mantiene alta
export const FollowRetention: React.FC<{ start: number; follow: number; top: number }> = ({ start, follow, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const on = frame >= follow;
  const bump = interpolate(frame, [follow, follow + 4, follow + 10], [1, 1.06, 1], opt);
  const draw = interpolate(frame, [start, follow], [1, 0], opt);
  return (
    <div style={{ position: "absolute", top, left: 80, width: 920, ...enter, transformOrigin: "left center" }}>
      <Mono size={24}>retención</Mono>
      <svg width={920} height={240} viewBox="0 0 920 240" style={{ display: "block", marginTop: 16 }}>
        <line x1={0} y1={230} x2={920} y2={230} stroke={B.fill} strokeWidth={4} />
        <path
          d="M0 30 C 200 40, 320 52, 460 58 S 760 70, 920 76"
          fill="none"
          stroke={B.green}
          strokeWidth={STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={draw}
        />
      </svg>
      <div
        style={{
          marginTop: 50,
          width: 560,
          height: 150,
          borderRadius: 75,
          background: on ? B.green : B.ink,
          color: B.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 66,
          letterSpacing: "-0.04em",
          scale: `${bump}`,
          transformOrigin: "left center",
        }}
      >
        {on ? "Siguiendo" : "Seguir"}
      </div>
    </div>
  );
};

// Lista A/B/C (estilo-hookhouse.md §2)
export const ListRow: React.FC<{ letter: string; text: string; start: number; top: number }> = ({ letter, text, start, top }) => {
  const enter = useEnter(start);
  return (
    <div style={{ position: "absolute", top, left: 80, display: "flex", alignItems: "center", gap: 36, ...enter, transformOrigin: "left center" }}>
      <Mono size={26} color={B.green}>
        ({letter})
      </Mono>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 112, letterSpacing: "-0.055em", color: B.ink }}>{text}</span>
    </div>
  );
};

// Insignia con contador (● EDITORES EXTRA 0)
export const Badge: React.FC<{ start: number; label: string; value: string; top: number }> = ({ start, label, value, top }) => {
  const enter = useEnter(start);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "22px 34px",
        border: `4px solid ${B.ink}`,
        borderRadius: 20,
        ...enter,
        transformOrigin: "left center",
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: 9, background: B.green }} />
      <Mono size={30} color={B.ink}>
        {label}
      </Mono>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: B.green, lineHeight: 1 }}>{value}</span>
    </div>
  );
};

// Caja verde del CTA con pop
export const CtaBox: React.FC<{ start: number; text: string; top: number }> = ({ start, text, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 180 } });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "10px 46px 18px",
          borderRadius: 24,
          background: B.green,
          color: B.white,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 170,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          scale: `${s}`,
          opacity: frame >= start ? 1 : 0,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Logo de cierre: logotipo grande + etiqueta mono (estilo-hookhouse.md §5)
export const Logo: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const house = interpolate(frame, [start + 4, start + 10], [0, 1], opt);
  const dot = interpolate(frame, [start + 8, start + 14], [0, 1], { ...opt, easing: Easing.out(Easing.back(2.5)) });
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, ...enter }}>
      <Wordmark size={170} houseOpacity={house} dot={dot} />
      <Mono size={26} style={{ opacity: house }}>
        edición de video automatizada
      </Mono>
    </div>
  );
};
