import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { B } from "../HookHouse/brand";

// Escenas 3D (three.js) con la paleta Hook House. Todas las animaciones salen de useCurrentFrame().
const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Canvas: React.FC<{ children: React.ReactNode; z?: number; fov?: number }> = ({ children, z = 12, fov = 38 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, z], fov }} style={{ position: "absolute", inset: 0 }}>
      {children}
    </ThreeCanvas>
  );
};

// 1 · Campo de clips flotando que se parten en dos ("Ni un solo corte")
export const ClipField: React.FC<{ start: number; split: number }> = ({ start, split }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const p = interpolate(frame, [split, split + 10], [0, 1], { ...opt, easing: Easing.out(Easing.cubic) });
  const clips = Array.from({ length: 16 }, (_, k) => {
    const col = k % 4;
    const row = Math.floor(k / 4);
    return {
      x: (col - 1.5) * 2.1 + (random(`x${k}`) - 0.5) * 0.6,
      y: -row * 1.35 - 0.6 + (random(`y${k}`) - 0.5) * 0.4,
      z: (random(`z${k}`) - 0.5) * 4,
      color: k % 5 === 0 ? B.green : k % 3 === 0 ? "#F7F7F2" : "#2A2A2A",
      spin: (random(`s${k}`) - 0.5) * 0.02,
    };
  });
  return (
    <Canvas z={interpolate(t, [0, 120], [26, 21], opt)}>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={2.2} />
      <pointLight position={[-6, -2, 4]} intensity={30} color={B.green} />
      <group position={[0, -0.9, 0]} rotation={[0.35, interpolate(t, [0, 120], [-0.25, 0.15], opt), 0]}>
        {clips.map((c, k) => (
          <group key={k} position={[c.x, c.y + Math.sin((t + k * 9) / 20) * 0.12, c.z]} rotation={[0.2, t * c.spin, 0.08]}>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * (0.42 + p * 0.45), 0, 0]} rotation={[0, 0, side * p * 0.35]}>
                <boxGeometry args={[0.84, 0.9, 0.22]} />
                <meshStandardMaterial color={c.color} roughness={0.35} metalness={0.15} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Canvas>
  );
};

// 2 · Onda de audio en 3D: las barras de silencio (verdes) desaparecen y la onda se cierra
export const Waveform3D: React.FC<{ start: number; cut: number }> = ({ start, cut }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const p = interpolate(frame, [cut, cut + 18], [0, 1], { ...opt, easing: Easing.inOut(Easing.cubic) });
  const N = 34;
  const silent = (k: number) => (k >= 9 && k <= 13) || (k >= 22 && k <= 25);
  const bars = Array.from({ length: N }, (_, k) => ({
    h: silent(k) ? 0.12 : 0.5 + Math.abs(Math.sin(k * 1.7)) * 2.2 + random(`h${k}`) * 0.6,
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
  return (
    <Canvas z={28} fov={36}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 8, 6]} intensity={2} />
      <group position={[0, -5.0, 0]} rotation={[0.45, -0.5 + t * 0.002, 0]}>
        {pos.map((b, k) => {
          const pulse = b.s ? 1 : 1 + Math.sin((t + k * 6) / 5) * 0.12;
          return (
            <mesh key={k} position={[b.x - total / 2, (b.h * pulse) / 2, 0]} scale={[Math.max(0.001, b.w / gap), 1, 1]}>
              <boxGeometry args={[0.22, b.h * pulse, 0.5]} />
              <meshStandardMaterial color={b.s ? B.green : B.ink} roughness={0.4} />
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

// 3 · Producto "realista" renderizado en 3D: frasco de cristal verde con tapa metálica y luz de estudio
export const Product3D: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const s = interpolate(t, [0, 14], [0.6, 1], { ...opt, easing: Easing.out(Easing.back(1.4)) });
  return (
    <Canvas z={16} fov={36}>
      <ambientLight intensity={0.25} />
      <spotLight position={[5, 8, 6]} angle={0.5} penumbra={0.6} intensity={180} />
      <pointLight position={[-5, 1, 3]} intensity={40} color="#FFFFFF" />
      <pointLight position={[0, -3, -4]} intensity={60} color={B.green} />
      <group position={[0, -4.4, 0]} scale={s} rotation={[0.12, t * 0.025, 0]}>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 2.8, 64]} />
          <meshPhysicalMaterial color={B.green} roughness={0.08} metalness={0.1} clearcoat={1} clearcoatRoughness={0.05} transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.97, 0.97, 1.0, 64, 1, true]} />
          <meshStandardMaterial color="#F7F7F2" roughness={0.6} side={2} />
        </mesh>
        <mesh position={[0, 3.05, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 0.5, 48]} />
          <meshStandardMaterial color="#D9D9D9" roughness={0.2} metalness={1} />
        </mesh>
        <mesh position={[0, 3.55, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.55, 48]} />
          <meshStandardMaterial color={B.ink} roughness={0.25} metalness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, -4.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.7, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
    </Canvas>
  );
};

// 4 · Logo "h." en 3D (palo + arco + pata + esfera verde) girando
export const Logo3D: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const s = interpolate(t, [0, 16], [0.3, 1], { ...opt, easing: Easing.out(Easing.back(1.6)) });
  const dot = interpolate(t, [10, 22], [0, 1], { ...opt, easing: Easing.out(Easing.back(2.5)) });
  const mat = <meshStandardMaterial color={B.ink} roughness={0.3} metalness={0.25} />;
  return (
    <Canvas z={17} fov={36}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 8]} intensity={2.4} />
      <pointLight position={[-4, -3, 5]} intensity={40} color={B.green} />
      <group position={[-0.45, -3.4, 0]} scale={s} rotation={[0.15, Math.sin(t / 22) * 0.7, 0]}>
        <mesh position={[-1.1, 0.6, 0]}>
          <boxGeometry args={[0.7, 4.2, 0.7]} />
          {mat}
        </mesh>
        <mesh position={[0.05, -0.1, 0]}>
          <torusGeometry args={[0.8, 0.35, 32, 64, Math.PI]} />
          {mat}
        </mesh>
        <mesh position={[0.85, -0.85, 0]}>
          <boxGeometry args={[0.7, 1.5, 0.7]} />
          {mat}
        </mesh>
        <mesh position={[2.05, -1.25, 0]} scale={dot}>
          <sphereGeometry args={[0.45, 48, 48]} />
          <meshStandardMaterial color={B.green} roughness={0.2} metalness={0.2} />
        </mesh>
      </group>
    </Canvas>
  );
};
