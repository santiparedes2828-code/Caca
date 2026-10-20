import React from "react";
import { Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B, MONO, SANS, STROKE } from "../HookHouse/brand";
import { useEnter } from "../HookHouse/graphics";
import { Mono, opt } from "../HookHouse/text";

// Gráficos del reel "¿Por qué se detuvo tu pulgar?" (guion-pulgar.md). Todos reciben frames absolutos.

const SKIN = "#E9B596";
const SKIN_DARK = "#CF9273";
const NAIL = "#F8D9CB";

// Pulgar gigante visto desde arriba, apuntando hacia arriba
export const Thumb: React.FC<{ width: number; frozen?: number }> = ({ width, frozen = 0 }) => (
  <svg width={width} height={width * 1.75} viewBox="0 0 200 350" style={{ overflow: "visible", filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.35)) saturate(${1 - 0.6 * frozen})` }}>
    <path d="M30 350 L30 100 Q30 10 100 10 Q170 10 170 100 L170 350 Z" fill={SKIN} />
    <path d="M150 60 Q170 90 170 120 L170 350 L140 350 Z" fill={SKIN_DARK} opacity={0.55} />
    <rect x={58} y={30} width={84} height={100} rx={40} fill={NAIL} />
    <rect x={64} y={110} width={72} height={10} rx={5} fill={SKIN} opacity={0.7} />
    <path d="M60 205 Q100 222 140 205" stroke={SKIN_DARK} strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d="M70 222 Q100 234 130 222" stroke={SKIN_DARK} strokeWidth={4} fill="none" strokeLinecap="round" />
    {frozen > 0 ? <path d="M30 350 L30 100 Q30 10 100 10 Q170 10 170 100 L170 350" fill="none" stroke={B.white} strokeWidth={6} opacity={frozen} /> : null}
  </svg>
);

// Escena 1: un feed que pasa a toda velocidad bajo un pulgar gigante; en `freeze` todo se congela
export const ThumbFeed: React.FC<{ start: number; freeze: number; top: number }> = ({ start, freeze, top }) => {
  const frame = useCurrentFrame();
  const t = Math.min(frame, freeze) - start;
  const moving = frame < freeze;
  const punch = interpolate(frame, [start, start + 8], [1.18, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const jolt = interpolate(frame, [freeze, freeze + 3, freeze + 8], [1, 1.04, 1], opt);
  const frozen = interpolate(frame, [freeze, freeze + 6], [0, 1], opt);
  const scroll = t * 46;
  // El pulgar desliza hacia arriba cada 14 frames
  const cycle = (t % 14) / 14;
  const swipe = moving ? -Math.sin(cycle * Math.PI) * 260 : -200;
  const cards = [B.green, "#2A2A2A", B.fill, "#2A2A2A", B.greenDark, B.fill, "#2A2A2A", B.green];
  const H = 330;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, height: 760, display: "flex", justifyContent: "center", scale: `${punch * jolt}` }}>
      <div style={{ position: "relative", width: 430, height: 760, borderRadius: 60, border: `12px solid #2C2C2C`, background: "#151515", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, filter: moving ? "blur(5px)" : undefined }}>
          {cards.map((c, k) => {
            const y = ((((k * H - scroll) % (cards.length * H)) + cards.length * H) % (cards.length * H)) - H;
            return <div key={k} style={{ position: "absolute", left: 18, right: 18, top: y + 18, height: H - 36, borderRadius: 26, background: c, opacity: 0.9 }} />;
          })}
        </div>
        <div style={{ position: "absolute", top: 30, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: frozen }}>
          <div style={{ padding: "10px 24px", borderRadius: 40, background: B.green, display: "flex", gap: 12, alignItems: "center" }}>
            <Mono size={24} color={B.white}>
              ❚❚ pausa
            </Mono>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 600, top: 380, translate: `0px ${swipe}px`, rotate: `${moving ? -8 : -14}deg`, filter: moving ? "blur(1.5px)" : undefined }}>
        <Thumb width={330} frozen={frozen} />
      </div>
    </div>
  );
};

// Trébol de la suerte que se tacha y sale de escena
export const Clover: React.FC<{ start: number; strike: number; leave: number; top: number }> = ({ start, strike, leave, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const s = interpolate(frame, [strike, strike + 6], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [leave, leave + 8], [0, -1300], { ...opt, easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", translate: `${out}px 0px`, ...enter }}>
      <svg width={420} height={460} viewBox="-210 -210 420 460">
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a + frame * 0.6})`}>
            <circle cx={-48} cy={-78} r={62} fill={B.green} />
            <circle cx={48} cy={-78} r={62} fill={B.green} />
            <path d="M-100 -60 L0 30 L100 -60 Z" fill={B.green} />
          </g>
        ))}
        <path d="M0 20 Q30 140 -10 240" stroke={B.greenDark} strokeWidth={STROKE + 4} fill="none" strokeLinecap="round" />
        <line x1={-190} y1={-170} x2={-190 + 380 * s} y2={-170 + 360 * s} stroke={B.ink} strokeWidth={22} strokeLinecap="round" />
      </svg>
    </div>
  );
};

// Dos móviles: este (vivo) y el tuyo (gris y quieto)
export const TwoPhones: React.FC<{ start: number; mine: number; top: number }> = ({ start, mine, top }) => {
  const frame = useCurrentFrame();
  const enterThis = useEnter(start);
  const enterMine = useEnter(mine);
  const t = frame - start;
  const phone = (children: React.ReactNode, border: string, bg: string) => (
    <div style={{ position: "relative", width: 380, height: 680, borderRadius: 50, border: `10px solid ${border}`, background: bg, overflow: "hidden" }}>{children}</div>
  );
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, ...enterMine }}>
        {phone(
          <div style={{ padding: "90px 34px", display: "flex", flexDirection: "column", gap: 22 }}>
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, color: "#6A6A66" }}>Hola a todos…</span>
            {[1, 0.8, 0.9, 0.6].map((w, k) => (
              <div key={k} style={{ height: 18, width: `${w * 100}%`, borderRadius: 9, background: "#3A3A38" }} />
            ))}
          </div>,
          "#3A3A38",
          "#1E1E1D",
        )}
        <Mono size={24} color="#8A8A84">
          el tuyo
        </Mono>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, ...enterThis }}>
        {phone(
          <>
            {Array.from({ length: 7 }, (_, k) => {
              const h = 90 + 220 * Math.abs(Math.sin(t / 5 + k * 0.9));
              return <div key={k} style={{ position: "absolute", bottom: 60, left: 30 + k * 46, width: 30, height: h, borderRadius: 15, background: k % 2 ? B.green : B.white }} />;
            })}
            <div style={{ position: "absolute", top: 70, left: 30, right: 30, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: "-0.05em", color: B.white, scale: `${1 + 0.12 * Math.abs(Math.sin(t / 4))}` }}>
              {["¡PARA!", "MIRA", "ESTO"][Math.floor(t / 9) % 3]}
            </div>
          </>,
          B.green,
          "#0F2A1A",
        )}
        <Mono size={24} color={B.green}>
          este
        </Mono>
      </div>
    </div>
  );
};

// Barra de 0 s a 1 s con contador
export const FirstSecond: React.FC<{ start: number; end: number; top: number }> = ({ start, end, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const p = interpolate(frame, [start, end], [0, 1], opt);
  return (
    <div style={{ position: "absolute", top, left: 80, right: 80, ...enter, transformOrigin: "left center" }}>
      <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 130, letterSpacing: "-0.05em", color: B.green }}>{p.toFixed(1).replace(".", ",")} s</span>
      <div style={{ marginTop: 20, height: 34, borderRadius: 17, border: `${STROKE - 3}px solid ${B.ink}` }}>
        <div style={{ height: "100%", width: `${p * 100}%`, borderRadius: 17, background: B.ink }} />
      </div>
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
        <Mono size={24}>0 s</Mono>
        <Mono size={24}>1 s</Mono>
      </div>
    </div>
  );
};

// El pulgar congelado cae del cielo (lo raro del primer segundo)
export const ThumbDrop: React.FC<{ at: number; top: number }> = ({ at, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: frame >= at ? 1 : 0, translate: `0px ${(1 - s) * -900}px`, rotate: `${-25 + 15 * s}deg` }}>
      <Thumb width={200} frozen={1} />
    </div>
  );
};

// «fuego» que se prende al leerlo
export const Fire: React.FC<{ start: number; top: number }> = ({ start, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - start;
  const s = spring({ frame: t, fps, config: { damping: 10, stiffness: 200 } });
  const heat = interpolate(t, [0, 10], [0, 1], opt);
  const flames = Array.from({ length: 110 }, (_, k) => {
    const born = random(`b${k}`) * 30;
    const life = 18 + random(`l${k}`) * 16;
    const age = (((t - born) % life) + life) % life;
    const a = age / life;
    const x = -380 + random(`x${k}`) * 760 + Math.sin((t + k * 7) / 5) * 14;
    const size = (60 + random(`s${k}`) * 90) * (1 - a);
    const color = a < 0.3 ? "#FFE27A" : a < 0.65 ? "#FF9A1F" : "#E8461C";
    return { x, y: 20 - a * 380, size, color, o: t > born ? (1 - a) * heat : 0 };
  });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, height: 520, opacity: t >= 0 ? 1 : 0 }}>
      <svg width={1080} height={520} viewBox="-540 -360 1080 520" style={{ position: "absolute", inset: 0, filter: "blur(6px)" }}>
        {flames.map((f, k) => (
          <ellipse key={k} cx={f.x} cy={f.y} rx={f.size * 0.6} ry={f.size} fill={f.color} opacity={f.o} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          top: 210,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 230,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: heat > 0.5 ? "#FF7A1A" : B.ink,
          textShadow: `0 0 ${30 + 20 * Math.sin(t / 2)}px rgba(255,140,30,${0.8 * heat})`,
          scale: `${s}`,
          translate: `${Math.sin(t * 1.7) * 3 * heat}px 0px`,
        }}
      >
        fuego
      </div>
    </div>
  );
};

const Box: React.FC<{ lid: number; children?: React.ReactNode }> = ({ lid, children }) => (
  <div style={{ position: "relative", width: 440, height: 360, perspective: 900 }}>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, borderRadius: 30, background: B.ink }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 300, display: "flex", justifyContent: "center", height: 0 }}>{children}</div>
    <div
      style={{
        position: "absolute",
        left: -20,
        right: -20,
        top: 0,
        height: 80,
        borderRadius: 24,
        background: "#222",
        border: `4px solid ${B.ink}`,
        transformOrigin: "left bottom",
        transform: `rotate(${-lid * 110}deg)`,
      }}
    />
  </div>
);

// Caja cerrada con candado + barra de reproducción que casi llega al final
export const LockBox: React.FC<{ start: number; end: number; top: number }> = ({ start, end, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const p = interpolate(frame, [start, end], [0.05, 0.93], opt);
  const shake = Math.sin(frame * 1.3) * 2;
  return (
    <div style={{ position: "absolute", top, left: 80, right: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 50, ...enter }}>
      <div style={{ position: "relative", rotate: `${shake}deg` }}>
        <Box lid={0} />
        <svg width={120} height={140} viewBox="0 0 120 140" style={{ position: "absolute", left: 160, top: 150 }}>
          <path d="M28 64 V40 a32 32 0 0 1 64 0 V64" stroke={B.green} strokeWidth={14} fill="none" />
          <rect x={10} y={60} width={100} height={76} rx={14} fill={B.green} />
          <circle cx={60} cy={96} r={10} fill={B.ink} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center" }}>
          <Mono size={24} color={B.white}>
            la respuesta
          </Mono>
        </div>
      </div>
      <div style={{ width: "100%" }}>
        <div style={{ position: "relative", height: 14, borderRadius: 7, background: B.fill }}>
          <div style={{ height: "100%", width: `${p * 100}%`, borderRadius: 7, background: B.green }} />
          <div style={{ position: "absolute", top: -11, left: `calc(${p * 100}% - 18px)`, width: 36, height: 36, borderRadius: "50%", background: B.green }} />
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
          <Mono size={22}>tú, aquí</Mono>
          <Mono size={22} color={B.green}>
            final
          </Mono>
        </div>
      </div>
    </div>
  );
};

// Reloj que gira cada vez más rápido + clips que se amontonan
export const SpinClock: React.FC<{ start: number; fast: number; top: number }> = ({ start, fast, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const t = frame - start;
  const speed = interpolate(frame, [start, fast], [1, 6], { ...opt, easing: Easing.in(Easing.quad) });
  const minute = t * 9 * speed;
  const pile = Math.floor(interpolate(frame, [start, fast + 15], [0, 8], opt));
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, ...enter }}>
      <svg width={460} height={460} viewBox="-230 -230 460 460">
        <circle r={210} fill="#161616" stroke={B.white} strokeWidth={STROKE + 4} />
        {Array.from({ length: 12 }, (_, k) => (
          <line key={k} x1={0} y1={-190} x2={0} y2={-165} stroke={k % 3 ? "#555" : B.white} strokeWidth={8} strokeLinecap="round" transform={`rotate(${k * 30})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-110} stroke={B.white} strokeWidth={14} strokeLinecap="round" transform={`rotate(${minute / 12})`} />
        <line x1={0} y1={0} x2={0} y2={-160} stroke={B.green} strokeWidth={9} strokeLinecap="round" transform={`rotate(${minute})`} />
        <circle r={14} fill={B.green} />
      </svg>
      <div style={{ display: "flex", gap: 12, height: 70 }}>
        {Array.from({ length: 8 }, (_, k) => (
          <div key={k} style={{ width: 90, height: 70, borderRadius: 14, background: k % 3 === 0 ? B.green : "#2A2A2A", opacity: k < pile ? 1 : 0, translate: `0px ${k < pile ? 0 : 20}px` }} />
        ))}
      </div>
      <Mono size={24} color="#9A9A94">
        editando a mano…
      </Mono>
    </div>
  );
};

// La caja se abre: dentro estaba el pulgar congelado, con su etiqueta "editado"
export const OpenBox: React.FC<{ start: number; open: number; label: number; top: number }> = ({ start, open, label, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(start);
  const lid = spring({ frame: frame - open, fps, config: { damping: 14 } });
  const rise = spring({ frame: frame - open - 4, fps, config: { damping: 11, stiffness: 140 } });
  const tag = spring({ frame: frame - label, fps, config: { damping: 10, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", ...enter }}>
      <div style={{ position: "relative", marginTop: 300 }}>
        <div style={{ position: "absolute", left: 120, bottom: 230, translate: `0px ${(1 - rise) * 440}px`, opacity: frame >= open ? 1 : 0 }}>
          <Thumb width={200} frozen={1} />
        </div>
        <Box lid={lid} />
        <div
          style={{
            position: "absolute",
            left: 240,
            top: -150,
            padding: "10px 26px 14px",
            borderRadius: 20,
            background: B.green,
            color: B.white,
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            scale: `${tag}`,
            rotate: "8deg",
          }}
        >
          editado ✔
        </div>
      </div>
    </div>
  );
};

// DM de Instagram: el mensaje "HOOK" se envía
export const DmChat: React.FC<{ start: number; send: number; top: number }> = ({ start, send, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(start);
  const s = spring({ frame: frame - send, fps, config: { damping: 11, stiffness: 180 } });
  const seen = interpolate(frame, [send + 18, send + 24], [0, 1], opt);
  return (
    <div style={{ position: "absolute", top, left: 100, right: 100, height: 460, borderRadius: 40, background: "#161616", border: "3px solid #2C2C2C", ...enter }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "28px 34px", borderBottom: "2px solid #2C2C2C" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: B.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 36, color: B.white }}>
          h
        </div>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: B.white, letterSpacing: "-0.03em" }}>hookhouse</span>
      </div>
      <div style={{ position: "absolute", right: 34, bottom: 70, transformOrigin: "right bottom", scale: `${s}`, opacity: frame >= send ? 1 : 0 }}>
        <div style={{ padding: "12px 44px 20px", borderRadius: "36px 36px 8px 36px", background: B.green, fontFamily: SANS, fontWeight: 800, fontSize: 130, lineHeight: 1, letterSpacing: "-0.05em", color: B.white }}>
          HOOK
        </div>
      </div>
      <div style={{ position: "absolute", right: 40, bottom: 26, opacity: seen }}>
        <Mono size={20} color="#9A9A94">
          visto
        </Mono>
      </div>
    </div>
  );
};
