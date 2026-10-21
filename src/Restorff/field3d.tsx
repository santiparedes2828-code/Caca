import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import * as THREE from "three";

// Estudio 3D claro para el reel del efecto Von Restorff: un campo de esferas grises idénticas y una sola verde.
// Plano único: la cámara vuela sin cortes. Paleta Hook House (blanco roto, tinta, verde).

export const R = {
  bg: "#F2F0EA",
  grey: "#C9C6BD",
  ink: "#0B0B0B",
  green: "#12A150",
};

const COLS = 15;
const ROWS = 26;
const RAD = 0.38;
export const GREEN = new THREE.Vector3(1, RAD, -5);

export type Cam = { pos: [number, number, number]; look: [number, number, number] };
export type FieldState = {
  cam: Cam;
  t: number;
  bob: number; // amplitud del rebote sincronizado (todas iguales = repetición)
  fade: number; // las grises se funden con el fondo
  waveT: number; // segundos desde que salió la onda (negativo = sin onda)
  sink: number; // las grises se hunden (0..1)
  greenLift: number;
  greenScale: number;
  greenGlow: number;
};

const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.look));
  return null;
};

const Field: React.FC<{ s: FieldState }> = ({ s }) => {
  const cells = useMemo(() => {
    const out: { x: number; z: number; d: number; seed: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c - 7;
        const z = r - 20;
        if (x === GREEN.x && z === GREEN.z) continue;
        out.push({ x, z, d: Math.hypot(x - GREEN.x, z - GREEN.z), seed: (c * 37 + r * 91) % 100 / 100 });
      }
    }
    return out;
  }, []);
  const mesh = useMemo(() => {
    const geo = new THREE.SphereGeometry(RAD, 32, 20);
    const mat = new THREE.MeshStandardMaterial({ color: R.grey, roughness: 0.55, metalness: 0.05 });
    const m = new THREE.InstancedMesh(geo, mat, cells.length);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [cells.length]);

  const mat = mesh.material as THREE.MeshStandardMaterial;
  mat.color.set(R.grey).lerp(new THREE.Color(R.bg), 0.75 * s.fade);
  const dummy = new THREE.Object3D();
  cells.forEach((cell, i) => {
    let y = RAD + s.bob * Math.abs(Math.sin(s.t * 4.2));
    // Onda que sale de la esfera verde: las grises se levantan al pasar
    if (s.waveT >= 0) {
      const front = s.waveT * 9;
      const k = cell.d - front;
      y += 0.9 * Math.exp(-(k * k) / 1.4) * Math.exp(-s.waveT * 0.6);
    }
    // Hundirse: primero las lejanas
    const sinkP = Math.min(1, Math.max(0, s.sink * 1.6 - (1 - cell.d / 22) * 0.6));
    y -= sinkP * (RAD * 2 + 0.1);
    const sc = 1 - 0.25 * sinkP;
    dummy.position.set(cell.x, y, cell.z);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

const Green: React.FC<{ s: FieldState }> = ({ s }) => (
  <group position={[GREEN.x, RAD + s.greenLift, GREEN.z]} scale={[s.greenScale, s.greenScale, s.greenScale]}>
    <mesh castShadow>
      <sphereGeometry args={[RAD, 48, 32]} />
      <meshStandardMaterial color={R.green} roughness={0.15} metalness={0.25} emissive={R.green} emissiveIntensity={0.15 + 0.6 * s.greenGlow} />
    </mesh>
  </group>
);

// Anillo que se expande con la onda
const Ripple: React.FC<{ waveT: number }> = ({ waveT }) => {
  if (waveT < 0 || waveT > 2.5) return null;
  const r = 0.5 + waveT * 9;
  return (
    <mesh position={[GREEN.x, 0.02, GREEN.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r, r + 0.12, 96]} />
      <meshBasicMaterial color={R.green} transparent opacity={Math.max(0, 0.8 - waveT * 0.35)} />
    </mesh>
  );
};

export const FieldScene: React.FC<{ s: FieldState; width: number; height: number }> = ({ s, width, height }) => (
  <ThreeCanvas width={width} height={height} camera={{ position: s.cam.pos, fov: 40 }} shadows style={{ position: "absolute", inset: 0 }}>
    <CameraRig cam={s.cam} />
    <color attach="background" args={[R.bg]} />
    <fog attach="fog" args={[R.bg, 10, 30]} />
    <hemisphereLight args={["#ffffff", "#D9D5CB", 1.1]} />
    <directionalLight position={[6, 12, 6]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
      <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 50]} />
    </directionalLight>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color={R.bg} roughness={1} />
    </mesh>
    <Field s={s} />
    <Green s={s} />
    <Ripple waveT={s.waveT} />
  </ThreeCanvas>
);
