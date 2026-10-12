import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import { B } from "../HookHouse/brand";

// Escenas 3D (three.js) que representan el trabajo de edición, con la paleta Hook House.
// Todas las animaciones salen de useCurrentFrame(); las texturas se dibujan en canvas.
const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Canvas: React.FC<{
  children: React.ReactNode;
  z?: number;
  fov?: number;
}> = ({ children, z = 12, fov = 36 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, z], fov }}
      style={{ position: "absolute", inset: 0 }}
    >
      {children}
    </ThreeCanvas>
  );
};

// Espera a que las fuentes de la marca estén cargadas antes de dibujar texto en canvas
const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Fuentes para texturas 3D"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('800 60px "Inter"'),
      document.fonts.load('500 30px "JetBrains Mono"'),
    ]).then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

const makeTexture = (
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const roundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
};

const silhouette = (
  c: CanvasRenderingContext2D,
  cx: number,
  base: number,
  s: number,
  color: string,
) => {
  c.fillStyle = color;
  c.beginPath();
  c.arc(cx, base - s * 1.55, s * 0.42, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(cx - s, base);
  c.quadraticCurveTo(cx - s * 0.95, base - s * 0.95, cx, base - s * 1.0);
  c.quadraticCurveTo(cx + s * 0.95, base - s * 0.95, cx + s, base);
  c.fill();
};

const mono = (
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
) => {
  c.font = `500 ${size}px "JetBrains Mono"`;
  c.fillStyle = color;
  c.fillText(text.toUpperCase(), x, y);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Línea de tiempo de clips en 3D: un láser verde la recorre, se abren los cortes
//     y los clips "muertos" (silencios, tomas falsas) caen fuera ("Ni un solo corte" a mano)
export const FilmCut3D: React.FC<{ start: number; cut: number }> = ({
  start,
  cut,
}) => {
  const frame = useCurrentFrame();
  const fonts = useFontsReady();
  const t = frame - start;
  const N = 9;
  const dead = (k: number) => k === 2 || k === 5 || k === 7;
  const textures = useMemo(
    () =>
      fonts
        ? Array.from({ length: N }, (_, k) =>
            makeTexture(400, 240, (c) => {
              const g = c.createLinearGradient(0, 0, 0, 240);
              if (dead(k)) {
                g.addColorStop(0, "#2A2A2A");
                g.addColorStop(1, "#161616");
              } else {
                g.addColorStop(0, k % 3 === 0 ? "#1F6B43" : "#3B3B3B");
                g.addColorStop(1, "#141414");
              }
              c.fillStyle = g;
              c.fillRect(0, 0, 400, 240);
              if (!dead(k))
                silhouette(
                  c,
                  200 + (random(`sx${k}`) - 0.5) * 90,
                  228,
                  70,
                  "#5A5A5A",
                );
              c.fillStyle = "#F7F7F2";
              for (let i = 0; i < 12; i++) {
                c.fillRect(10 + i * 33, 6, 14, 10);
                c.fillRect(10 + i * 33, 224, 14, 10);
              }
              if (dead(k)) mono(c, "silencio", 128, 128, 30, B.green);
              mono(
                c,
                `clip ${String(k + 1).padStart(2, "0")}`,
                16,
                48,
                22,
                "rgba(247,247,242,0.75)",
              );
            }),
          )
        : [],
    [fonts],
  );
  const laser = interpolate(frame, [cut, cut + 14], [-1, 1], {
    ...opt,
    easing: Easing.inOut(Easing.quad),
  });
  const open = interpolate(frame, [cut + 6, cut + 18], [0, 1], {
    ...opt,
    easing: Easing.out(Easing.cubic),
  });
  const W = 1.6;
  const gap = 0.06 + open * 0.34;
  const scroll = interpolate(t, [0, 150], [0.8, -0.8], opt);
  const liveIndex = (k: number) =>
    Array.from({ length: k }, (_, j) => j).filter((j) => !dead(j)).length;
  const totalW = N * W + (N - 1) * 0.06;

  return (
    <Canvas z={13}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 8]} intensity={2.2} />
      <pointLight
        position={[0, 2, 3]}
        intensity={25 * (laser > -1 && laser < 1 ? 1 : 0.2)}
        color={B.green}
      />
      <group position={[0.3 + scroll, -1.9, 0]} rotation={[-0.45, 0.42, 0.04]}>
        {textures.map((tex, k) => {
          // Antes del corte: tira continua. Después: los muertos caen y los vivos se juntan con huecos de corte
          const x0 = -totalW / 2 + k * (W + 0.06) + W / 2;
          const x1 = -totalW / 2 + liveIndex(k) * (W + gap) + W / 2 + 1.0;
          const fall = dead(k) ? open : 0;
          const x = dead(k) ? x0 : interpolate(open, [0, 1], [x0, x1]);
          return (
            <group
              key={k}
              position={[x, -fall * 2.6, fall * 1.2]}
              rotation={[fall * 0.9, 0, fall * (k % 2 ? 0.4 : -0.4)]}
            >
              <mesh>
                <boxGeometry args={[W, 0.96, 0.08]} />
                <meshStandardMaterial
                  color={dead(k) ? "#202020" : "#0E0E0E"}
                  roughness={0.5}
                />
              </mesh>
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[W - 0.04, 0.92]} />
                <meshStandardMaterial
                  map={tex}
                  roughness={0.6}
                  transparent
                  opacity={1 - fall * 0.7}
                />
              </mesh>
            </group>
          );
        })}
        <mesh
          position={[laser * (totalW / 2 + 0.5), 0, 0.2]}
          visible={frame >= cut && frame <= cut + 14}
        >
          <boxGeometry args={[0.04, 2.2, 0.04]} />
          <meshBasicMaterial color={B.green} />
        </mesh>
        <mesh
          position={[laser * (totalW / 2 + 0.5), 0, 0.2]}
          visible={frame >= cut && frame <= cut + 14}
        >
          <boxGeometry args={[0.16, 2.3, 0.02]} />
          <meshBasicMaterial color={B.green} transparent opacity={0.3} />
        </mesh>
      </group>
    </Canvas>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Onda de audio en 3D: una cuchilla verde baja sobre cada silencio, que desaparece y la onda se cierra
export const Waveform3D: React.FC<{ start: number; cut: number }> = ({
  start,
  cut,
}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const p = interpolate(frame, [cut + 8, cut + 24], [0, 1], {
    ...opt,
    easing: Easing.inOut(Easing.cubic),
  });
  const blade = interpolate(frame, [cut - 4, cut + 6], [3.5, 0.4], {
    ...opt,
    easing: Easing.in(Easing.cubic),
  });
  const bladeOut = interpolate(frame, [cut + 8, cut + 14], [0, 3.5], opt);
  const N = 34;
  const silent = (k: number) => (k >= 9 && k <= 13) || (k >= 22 && k <= 25);
  const bars = Array.from({ length: N }, (_, k) => ({
    h: silent(k)
      ? 0.12
      : 0.5 + Math.abs(Math.sin(k * 1.7)) * 2.2 + random(`h${k}`) * 0.6,
    s: silent(k),
  }));
  const gap = 0.32;
  let x = 0;
  const pos = bars.map((b) => {
    const w = b.s ? gap * (1 - p) : gap;
    const cx = x + w / 2;
    x += w;
    return { ...b, x: cx, w };
  });
  const total = x;
  const groups = [
    [9, 13],
    [22, 25],
  ];
  return (
    <Canvas z={28}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 8, 6]} intensity={2} />
      <group position={[0, -5.0, 0]} rotation={[0.45, -0.5 + t * 0.002, 0]}>
        {pos.map((b, k) => {
          const pulse = b.s ? 1 : 1 + Math.sin((t + k * 6) / 5) * 0.12;
          return (
            <mesh
              key={k}
              position={[b.x - total / 2, (b.h * pulse) / 2, 0]}
              scale={[Math.max(0.001, b.w / gap), 1, 1]}
            >
              <boxGeometry args={[0.22, b.h * pulse, 0.5]} />
              <meshStandardMaterial
                color={b.s ? B.green : B.ink}
                roughness={0.4}
              />
            </mesh>
          );
        })}
        {groups.map(([a, b2]) => {
          const cx = (pos[a].x + pos[b2].x) / 2 - total / 2;
          return (
            <mesh
              key={a}
              position={[cx, blade + bladeOut, 0]}
              visible={frame >= cut - 4 && frame <= cut + 14}
            >
              <boxGeometry
                args={[(b2 - a + 1) * gap * (1 - p) + 0.1, 0.08, 1.2]}
              />
              <meshStandardMaterial
                color={B.green}
                emissive={B.green}
                emissiveIntensity={0.6}
                metalness={0.6}
                roughness={0.2}
              />
            </mesh>
          );
        })}
        <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 3]} />
          <meshStandardMaterial color="#E7E7E0" roughness={1} />
        </mesh>
      </group>
    </Canvas>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Abanico de fotos generadas en 3D (producto, retrato, paisaje, comida, ciudad)
export const Photos3D: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const fonts = useFontsReady();
  const t = frame - start;
  const draws: ((c: CanvasRenderingContext2D) => void)[] = [
    (c) => {
      // Producto: frasco verde con luz de estudio
      const g = c.createLinearGradient(0, 0, 0, 560);
      g.addColorStop(0, "#EDEDE6");
      g.addColorStop(1, "#BDBDB4");
      c.fillStyle = g;
      c.fillRect(0, 0, 440, 560);
      c.fillStyle = "rgba(0,0,0,0.25)";
      c.beginPath();
      c.ellipse(220, 470, 120, 22, 0, 0, Math.PI * 2);
      c.fill();
      const b = c.createLinearGradient(140, 0, 300, 0);
      b.addColorStop(0, "#0B5E30");
      b.addColorStop(0.45, "#3DD17F");
      b.addColorStop(1, "#0B5E30");
      c.fillStyle = b;
      roundRect(c, 140, 200, 160, 270, 26);
      c.fill();
      c.fillStyle = "#F7F7F2";
      c.fillRect(140, 300, 160, 80);
      c.fillStyle = "#0B0B0B";
      roundRect(c, 180, 140, 80, 70, 10);
      c.fill();
    },
    (c) => {
      // Retrato
      const g = c.createRadialGradient(220, 200, 20, 220, 260, 400);
      g.addColorStop(0, "#5B6B62");
      g.addColorStop(1, "#1A1F1C");
      c.fillStyle = g;
      c.fillRect(0, 0, 440, 560);
      silhouette(c, 220, 560, 170, "#0E1210");
    },
    (c) => {
      // Paisaje
      const g = c.createLinearGradient(0, 0, 0, 560);
      g.addColorStop(0, "#9FD6B8");
      g.addColorStop(0.55, "#F2E9C9");
      g.addColorStop(1, "#E9D9A8");
      c.fillStyle = g;
      c.fillRect(0, 0, 440, 560);
      c.fillStyle = "#F7F7F2";
      c.beginPath();
      c.arc(320, 170, 46, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#12A150";
      c.beginPath();
      c.moveTo(0, 420);
      c.lineTo(130, 260);
      c.lineTo(250, 400);
      c.lineTo(340, 300);
      c.lineTo(440, 410);
      c.lineTo(440, 560);
      c.lineTo(0, 560);
      c.fill();
      c.fillStyle = "#0B5E30";
      c.fillRect(0, 470, 440, 90);
    },
    (c) => {
      // Comida
      c.fillStyle = "#2B2B2B";
      c.fillRect(0, 0, 440, 560);
      c.fillStyle = "#F7F7F2";
      c.beginPath();
      c.arc(220, 290, 150, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#12A150";
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        c.ellipse(
          220 + Math.cos(i) * 70,
          290 + Math.sin(i * 1.3) * 60,
          34,
          18,
          i,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      c.fillStyle = "#E3B341";
      c.beginPath();
      c.arc(220, 290, 40, 0, Math.PI * 2);
      c.fill();
    },
    (c) => {
      // Ciudad de noche
      const g = c.createLinearGradient(0, 0, 0, 560);
      g.addColorStop(0, "#0B1A12");
      g.addColorStop(1, "#12A150");
      c.fillStyle = g;
      c.fillRect(0, 0, 440, 560);
      for (let i = 0; i < 8; i++) {
        const h = 160 + random(`b${i}`) * 260;
        c.fillStyle = "#0B0B0B";
        c.fillRect(i * 56, 560 - h, 50, h);
        c.fillStyle = "#E9F5EE";
        for (let j = 0; j < 8; j++)
          if (random(`w${i}${j}`) > 0.55)
            c.fillRect(
              i * 56 + 10 + (j % 2) * 18,
              560 - h + 20 + Math.floor(j / 2) * 40,
              10,
              16,
            );
      }
    },
  ];
  const textures = useMemo(
    () =>
      fonts
        ? draws.map((d) =>
            makeTexture(440, 560, (c) => {
              d(c);
              c.fillStyle = "rgba(11,11,11,0.55)";
              roundRect(c, 16, 500, 210, 40, 20);
              c.fill();
              mono(c, "generada con ia", 30, 528, 18, "#F7F7F2");
            }),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  const angles = [-34, -17, 0, 17, 34];
  return (
    <Canvas z={16}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 5, 8]} intensity={1.8} />
      <group
        position={[0, -4.7, 0]}
        rotation={[-0.15, Math.sin(t / 40) * 0.25, 0]}
      >
        {textures.map((tex, k) => {
          const p = interpolate(t, [k * 5, k * 5 + 14], [0, 1], {
            ...opt,
            easing: Easing.out(Easing.back(1.3)),
          });
          const a = (angles[k] * Math.PI) / 180;
          return (
            <group key={k} rotation={[0, 0, -a * p]}>
              <group
                position={[0, 3.2, k * 0.06 + (k === 2 ? 0.2 : 0)]}
                scale={0.6 + 0.4 * p}
              >
                <mesh>
                  <boxGeometry args={[2.36, 2.96, 0.04]} />
                  <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.06, 0.025]}>
                  <planeGeometry args={[2.2, 2.8]} />
                  <meshStandardMaterial map={tex} roughness={0.5} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>
    </Canvas>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Una edición desmontada en capas 3D: video, b-roll, zooms, subtítulos y sonido se separan
export const Layers3D: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const fonts = useFontsReady();
  const t = frame - start;
  const PW = 640;
  const PH = 1120;
  const layers: {
    label: string;
    draw: (c: CanvasRenderingContext2D) => void;
    solid?: boolean;
  }[] = [
    {
      label: "01 video",
      solid: true,
      draw: (c) => {
        const g = c.createLinearGradient(0, 0, 0, PH);
        g.addColorStop(0, "#3A3A3A");
        g.addColorStop(1, "#121212");
        c.fillStyle = g;
        c.fillRect(0, 0, PW, PH);
        silhouette(c, PW / 2, PH, 250, "#555");
      },
    },
    {
      label: "02 b-roll",
      draw: (c) => {
        c.fillStyle = "rgba(247,247,242,0.96)";
        roundRect(c, 340, 200, 240, 300, 24);
        c.fill();
        const b = c.createLinearGradient(400, 0, 520, 0);
        b.addColorStop(0, "#0B5E30");
        b.addColorStop(0.5, "#3DD17F");
        b.addColorStop(1, "#0B5E30");
        c.fillStyle = b;
        roundRect(c, 410, 270, 100, 190, 18);
        c.fill();
      },
    },
    {
      label: "03 zoom",
      draw: (c) => {
        c.strokeStyle = B.green;
        c.lineWidth = 14;
        const m = 60;
        const L = 110;
        [
          [m, m, 1, 1],
          [PW - m, m, -1, 1],
          [m, PH - m, 1, -1],
          [PW - m, PH - m, -1, -1],
        ].forEach(([x, y, sx, sy]) => {
          c.beginPath();
          c.moveTo(x, y + sy * L);
          c.lineTo(x, y);
          c.lineTo(x + sx * L, y);
          c.stroke();
        });
        mono(c, "x1.35", 70, PH - 90, 34, B.green);
      },
    },
    {
      label: "04 subtítulos",
      draw: (c) => {
        c.textAlign = "center";
        c.font = '800 70px "Inter"';
        c.fillStyle = "#FFFFFF";
        c.fillText("palabra", PW / 2, 760);
        c.fillStyle = B.green;
        roundRect(c, PW / 2 - 140, 790, 280, 96, 18);
        c.fill();
        c.fillStyle = "#FFFFFF";
        c.fillText("a palabra", PW / 2, 862);
        c.textAlign = "left";
      },
    },
    {
      label: "05 sonido",
      draw: (c) => {
        for (let i = 0; i < 30; i++) {
          const h = 20 + Math.abs(Math.sin(i * 1.3)) * 120;
          c.fillStyle = i % 5 === 0 ? B.green : "#F7F7F2";
          roundRect(c, 40 + i * 19, 1040 - h / 2, 10, h, 5);
          c.fill();
        }
      },
    },
  ];
  const textures = useMemo(
    () =>
      fonts
        ? layers.map((l) =>
            makeTexture(PW, PH, (c) => {
              l.draw(c);
              c.strokeStyle = l.solid ? "#0B0B0B" : "rgba(18,161,80,0.9)";
              c.lineWidth = 6;
              roundRect(c, 3, 3, PW - 6, PH - 6, 36);
              c.stroke();
            }),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  const labels = useMemo(
    () =>
      fonts
        ? layers.map((l) =>
            makeTexture(420, 80, (c) => {
              c.fillStyle = B.ink;
              roundRect(c, 0, 0, 420, 80, 40);
              c.fill();
              mono(c, l.label, 34, 52, 34, "#F7F7F2");
            }),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fonts],
  );
  const explode = interpolate(t, [12, 32], [0, 1], {
    ...opt,
    easing: Easing.inOut(Easing.cubic),
  });
  const enter = interpolate(t, [0, 12], [0, 1], {
    ...opt,
    easing: Easing.out(Easing.cubic),
  });
  return (
    <Canvas z={16}>
      <ambientLight intensity={1} />
      <directionalLight position={[4, 6, 8]} intensity={1.2} />
      <group
        position={[0.4, -2.3, 0]}
        scale={0.82 * (0.7 + 0.3 * enter)}
        rotation={[
          interpolate(explode, [0, 1], [0, -0.32]),
          interpolate(explode, [0, 1], [0, 0.85]) + Math.sin(t / 30) * 0.06,
          0,
        ]}
      >
        {textures.map((tex, k) => (
          <group key={k} position={[0, 0, (k - 2) * (0.03 + explode * 1.15)]}>
            <mesh>
              <planeGeometry args={[3.2, 5.6]} />
              <meshStandardMaterial
                map={tex}
                transparent
                side={THREE.DoubleSide}
                roughness={0.6}
                opacity={enter}
              />
            </mesh>
            <mesh position={[-1.25, 3.05, 0]} visible={explode > 0.6}>
              <planeGeometry args={[1.5, 0.29]} />
              <meshBasicMaterial
                map={labels[k]}
                transparent
                opacity={interpolate(explode, [0.6, 1], [0, 1], opt)}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>
    </Canvas>
  );
};
