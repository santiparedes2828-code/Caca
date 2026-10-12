import React, { useContext } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { B, MONO, SANS, SERIF } from "../HookHouse/brand";
import { useEnter } from "../HookHouse/graphics";
import { CaptionsCtx, Mono, opt, useWf } from "../HookHouse/text";

// Gráficos con perspectiva CSS 3D para el reel (paleta Hook House)

const Silhouette: React.FC<{ tone?: string }> = ({ tone = "#3A3A3A" }) => (
  <svg
    viewBox="0 0 200 260"
    style={{
      position: "absolute",
      bottom: 0,
      left: "50%",
      width: "80%",
      translate: "-50% 0",
    }}
  >
    <circle cx={100} cy={80} r={46} fill={tone} />
    <path d="M10 260 Q14 150 100 140 Q186 150 190 260 Z" fill={tone} />
  </svg>
);

// Móvil inclinado en 3D con subtítulos palabra a palabra (la palabra activa en verde)
export const PhoneCaptions: React.FC<{
  start: number;
  words: readonly number[];
  top: number;
}> = ({ start, words, top }) => {
  const frame = useCurrentFrame();
  const w = useWf();
  const caps = useContext(CaptionsCtx);
  const enter = useEnter(start);
  const ry = interpolate(frame, [start, start + 60], [-24, -12], opt);
  const active = words.filter((i) => frame >= w(i)).length - 1;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        perspective: 1400,
        ...enter,
      }}
    >
      <div
        style={{
          width: 430,
          height: 860,
          borderRadius: 64,
          border: `14px solid ${B.ink}`,
          outline: "3px solid #444",
          background: "linear-gradient(180deg, #2B2B2B, #151515)",
          position: "relative",
          overflow: "hidden",
          transform: `rotateY(${ry}deg) rotateX(8deg)`,
          boxShadow: "40px 60px 80px rgba(0,0,0,0.5)",
        }}
      >
        <Silhouette tone="#454545" />
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            width: 120,
            height: 30,
            borderRadius: 15,
            background: B.ink,
            translate: "-50% 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 470,
            left: 20,
            right: 20,
            textAlign: "center",
          }}
        >
          {words.map((i, k) =>
            k <= active ? (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  margin: "0 8px",
                  padding: "2px 12px",
                  borderRadius: 10,
                  fontFamily: SANS,
                  fontWeight: 800,
                  fontSize: 58,
                  letterSpacing: "-0.04em",
                  color: B.white,
                  background: k === active ? B.green : "transparent",
                  scale: `${k === active ? interpolate(frame - w(i), [0, 3, 7], [0.8, 1.08, 1], opt) : 1}`,
                  textShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                {caps[i].text.replace(/[,.]/g, "")}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
};

// Encuadre que hace punch-in (zoom) + ondas de sonido verdes
export const ZoomSound: React.FC<{
  start: number;
  zoom: number;
  sound: number;
  top: number;
}> = ({ start, zoom, sound, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const z = interpolate(frame, [zoom, zoom + 5], [1, 1.35], {
    ...opt,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        height: 620,
        perspective: 1600,
        ...enter,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 120px 0 0",
          borderRadius: 32,
          overflow: "hidden",
          background: "linear-gradient(180deg, #2B2B2B, #121212)",
          transform: "rotateY(14deg) rotateX(4deg)",
          boxShadow: "30px 40px 70px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            scale: `${z}`,
            transformOrigin: "50% 35%",
          }}
        >
          <Silhouette tone="#4A4A4A" />
        </div>
        {[0, 1].map((k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              top: 20,
              [k ? "right" : "left"]: 20,
              width: 60,
              height: 60,
              borderTop: `6px solid ${B.green}`,
              [k ? "borderRight" : "borderLeft"]: `6px solid ${B.green}`,
              opacity: frame >= zoom ? 1 : 0,
            }}
          />
        ))}
        <Mono
          size={24}
          color={B.green}
          style={{
            position: "absolute",
            bottom: 24,
            left: 28,
            opacity: frame >= zoom ? 1 : 0,
          }}
        >
          zoom ×1.35
        </Mono>
      </div>
      <svg
        width={300}
        height={300}
        viewBox="-150 -150 300 300"
        style={{ position: "absolute", right: -40, top: 160 }}
      >
        <circle r={36} fill={B.green} opacity={frame >= sound ? 1 : 0} />
        {[0, 1, 2].map((k) => {
          const r = interpolate(
            (frame - sound - k * 6) % 24,
            [0, 24],
            [40, 140],
            opt,
          );
          const o =
            frame >= sound + k * 6
              ? interpolate(
                  (frame - sound - k * 6) % 24,
                  [0, 24],
                  [0.9, 0],
                  opt,
                )
              : 0;
          return (
            <circle
              key={k}
              r={r}
              fill="none"
              stroke={B.green}
              strokeWidth={8}
              opacity={o}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Micrófono + barras de voz + chip IA
export const VoiceAI: React.FC<{ start: number; top: number }> = ({
  start,
  top,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        display: "flex",
        alignItems: "center",
        gap: 40,
        ...enter,
        transformOrigin: "left center",
      }}
    >
      <svg width={200} height={260} viewBox="0 0 200 260">
        <rect x={60} y={10} width={80} height={140} rx={40} fill={B.green} />
        <path
          d="M30 110 Q30 190 100 190 Q170 190 170 110"
          fill="none"
          stroke={B.white}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line
          x1={100}
          y1={190}
          x2={100}
          y2={240}
          stroke={B.white}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <line
          x1={60}
          y1={244}
          x2={140}
          y2={244}
          stroke={B.white}
          strokeWidth={10}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, height: 200 }}
      >
        {Array.from({ length: 16 }, (_, k) => {
          const h =
            24 +
            Math.abs(Math.sin((frame - start) / 3 + k * 0.9)) *
              150 *
              Math.abs(Math.sin(k * 0.6 + 0.3));
          return (
            <div
              key={k}
              style={{
                width: 16,
                height: h,
                borderRadius: 8,
                background: k % 4 === 0 ? B.green : B.white,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: -70,
          padding: "8px 22px",
          borderRadius: 40,
          border: `3px solid ${B.green}`,
        }}
      >
        <Mono size={26} color={B.green}>
          voz ia
        </Mono>
      </div>
    </div>
  );
};

// Tarjeta que gira 180°: delante un vídeo "viral" genérico, detrás el mismo con estilo Hook House
export const FlipStyle: React.FC<{
  start: number;
  flip: number;
  colors: number;
  type: number;
  top: number;
}> = ({ start, flip, colors, type, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(start);
  const rot = interpolate(frame, [flip, flip + 14], [0, 180], {
    ...opt,
    easing: Easing.inOut(Easing.cubic),
  });
  const face: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: 36,
    backfaceVisibility: "hidden",
    overflow: "hidden",
  };
  const sw = (i: number) =>
    spring({ frame: frame - colors - i * 4, fps, config: { damping: 14 } });
  const ty = spring({ frame: frame - type, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        height: 640,
        ...enter,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 440,
          height: 640,
          perspective: 1600,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `rotateY(${rot}deg)`,
          }}
        >
          <div
            style={{
              ...face,
              background: "#F1E3D3",
              border: "4px solid #D9C3AA",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 70,
                left: 36,
                right: 36,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1,
                color: "#C2342B",
                letterSpacing: "-0.05em",
              }}
            >
              VIDEO
              <br />
              VIRAL
            </div>
            <Silhouette tone="#B9A08A" />
            <div
              style={{
                position: "absolute",
                bottom: 30,
                right: 30,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: MONO,
                fontSize: 26,
                color: "#C2342B",
              }}
            >
              <svg width={30} height={28} viewBox="0 0 30 28">
                <path
                  d="M15 27 L3 15 A7 7 0 0 1 15 5 A7 7 0 0 1 27 15 Z"
                  fill="#C2342B"
                />
              </svg>
              1.2M
            </div>
          </div>
          <div
            style={{
              ...face,
              background: B.bg,
              border: `4px solid ${B.ink}`,
              transform: "rotateY(180deg)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 60,
                left: 36,
                right: 36,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 60,
                lineHeight: 1,
                color: B.ink,
                letterSpacing: "-0.05em",
              }}
            >
              Tu video,
              <br />
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 700,
                  color: B.green,
                  letterSpacing: "-0.01em",
                }}
              >
                tu estilo.
              </span>
            </div>
            <Silhouette tone="#1F1F1F" />
            <div
              style={{
                position: "absolute",
                bottom: 30,
                left: 30,
                padding: "6px 16px",
                borderRadius: 30,
                background: B.green,
              }}
            >
              <Mono size={20} color={B.white}>
                hook house
              </Mono>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 500,
          top: 40,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <Mono size={24}>colores</Mono>
        <div style={{ display: "flex", gap: 18 }}>
          {[B.green, B.ink, B.white].map((c, i) => (
            <div
              key={c}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                background: c,
                border: `4px solid ${B.ink}`,
                scale: `${sw(i)}`,
              }}
            />
          ))}
        </div>
        <Mono size={24} style={{ marginTop: 40 }}>
          tipografía
        </Mono>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            scale: `${ty}`,
            transformOrigin: "left center",
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 130,
              letterSpacing: "-0.06em",
              color: B.ink,
            }}
          >
            Aa
          </span>
          <span
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 130,
              color: B.green,
            }}
          >
            Aa
          </span>
        </div>
      </div>
    </div>
  );
};

// Archivo de estilo con correcciones guardadas (las reales de esta marca)
export const StyleFile: React.FC<{
  start: number;
  items: readonly { at: number; text: string }[];
  top: number;
}> = ({ start, items, top }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        right: 80,
        perspective: 1600,
        ...enter,
      }}
    >
      <div
        style={{
          borderRadius: 28,
          background: "#161616",
          border: "3px solid #333",
          padding: "34px 40px",
          transform: "rotateX(10deg) rotateY(-8deg)",
          boxShadow: "0 50px 80px rgba(0,0,0,0.6)",
        }}
      >
        <Mono size={24} color={B.green}>
          estilo-hookhouse.md
        </Mono>
        <div
          style={{
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {items.map((it, k) => {
            const p = interpolate(frame, [it.at, it.at + 6], [0, 1], opt);
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  opacity: 0.25 + 0.75 * p,
                }}
              >
                <svg width={46} height={46} viewBox="0 0 46 46">
                  <rect
                    x={2}
                    y={2}
                    width={42}
                    height={42}
                    rx={10}
                    fill={p > 0.5 ? B.green : "none"}
                    stroke={B.green}
                    strokeWidth={4}
                  />
                  <polyline
                    points="12,24 20,32 34,14"
                    fill="none"
                    stroke={B.white}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - p}
                  />
                </svg>
                <span
                  style={{
                    fontFamily: SANS,
                    fontWeight: 800,
                    fontSize: 46,
                    letterSpacing: "-0.03em",
                    color: B.white,
                  }}
                >
                  {it.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Calendario de 7 días que se llena de verde ("publicar todos los días")
export const Week: React.FC<{ start: number; end: number; top: number }> = ({
  start,
  end,
  top,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(start);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const n = interpolate(frame, [start, end], [0, 7], opt);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 80,
        display: "flex",
        gap: 14,
        ...enter,
        transformOrigin: "left center",
      }}
    >
      {days.map((d, k) => (
        <div
          key={d}
          style={{
            width: 118,
            height: 140,
            borderRadius: 22,
            border: `4px solid ${B.ink}`,
            background: k < n ? B.green : "transparent",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            scale: `${k < n ? interpolate(n - k, [0, 0.5, 1], [0.85, 1.06, 1], opt) : 1}`,
          }}
        >
          <Mono size={22} color={k < n ? B.white : B.grey}>
            {d}
          </Mono>
          <svg width={34} height={38} viewBox="0 0 34 38">
            <polygon points="2,2 32,19 2,36" fill={k < n ? B.white : B.ink} />
          </svg>
        </div>
      ))}
    </div>
  );
};

// Caja verde del CTA con inclinación 3D
export const Cta3D: React.FC<{ start: number; text: string; top: number }> = ({
  start,
  text,
  top,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - start,
    fps,
    config: { damping: 11, stiffness: 170 },
  });
  const t = frame - start;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        perspective: 1200,
      }}
    >
      <div
        style={{
          padding: "14px 60px 24px",
          borderRadius: 30,
          background: B.green,
          color: B.white,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 200,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          opacity: frame >= start ? 1 : 0,
          transform: `scale(${s}) rotateX(${Math.sin(t / 12) * 12}deg) rotateY(${Math.cos(t / 15) * 16}deg)`,
          boxShadow: `0 ${30 + Math.sin(t / 12) * 10}px 60px rgba(18,161,80,0.45)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
