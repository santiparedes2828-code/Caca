import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { Z } from "../Zeigarnik/scene3d";

// Escena 3D del reel del efecto de posición serial: diez bloques-palabra en fila sobre el suelo con cuadrícula.

export const WORDS = ["SOL", "MESA", "GATO", "RÍO", "LLAVE", "NUBE", "PAN", "TREN", "FLOR", "LUNA"];
export const blockX = (i: number) => -6.3 + 1.4 * i;
export const BLOCK_Y = 1.0;
// Curva de recuerdo por posición (forma de U)
export const U = [1, 0.78, 0.5, 0.32, 0.24, 0.24, 0.32, 0.5, 0.78, 1];

export type Cam = { pos: [number, number, number]; look: [number, number, number] };
export type BlockState = { drop: number; memory: number; gold: number };
export type SerialState = {
  cam: Cam;
  blocks: BlockState[];
  loop: number; // flechas de repaso alrededor del primer bloque (0..1 visibilidad)
  loopSpin: number;
  rings: number; // ondas desde el último bloque (0..1 visibilidad)
  ringsT: number; // tiempo para las ondas
  curve: number; // fracción dibujada de la curva U
  curveGlow: number;
};

const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Fuentes para texturas 3D"));
  useEffect(() => {
    document.fonts.load('800 60px "Inter"').then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

const wordTex = (word: string) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = Z.line;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `800 ${word.length > 4 ? 58 : 74}px "Inter"`;
  g.fillText(word, 128, 134);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.look));
  return null;
};

const cream = new THREE.Color(Z.cream);
const grey = new THREE.Color("#5A524B");
const gold = new THREE.Color(Z.gold);

const Block: React.FC<{ i: number; b: BlockState; tex: THREE.Texture }> = ({ i, b, tex }) => {
  const color = cream.clone().lerp(grey, 1 - b.memory).lerp(gold, b.gold);
  const y = BLOCK_Y + (1 - b.drop) * 4.5 - (1 - b.memory) * 0.7;
  const s = 0.85 + 0.15 * b.memory + 0.12 * b.gold;
  return (
    <group position={[blockX(i), y, 0]} rotation={[(1 - b.drop) * 3, (1 - b.drop) * 2 + (i - 4.5) * -0.03, 0]} scale={[s, s, s]}>
      <mesh castShadow>
        <boxGeometry args={[1.15, 1.15, 1.15]} />
        <meshStandardMaterial color={color} roughness={b.gold > 0.5 ? 0.25 : 0.7} metalness={0.7 * b.gold} emissive={gold} emissiveIntensity={0.35 * b.gold} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.58]}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshStandardMaterial map={tex} color={color} transparent opacity={0.35 + 0.65 * b.memory} roughness={0.7} />
      </mesh>
    </group>
  );
};

// Flechas de repaso girando alrededor del primer bloque
const Loop: React.FC<{ v: number; spin: number }> = ({ v, spin }) => {
  const arc = useMemo(() => new THREE.TorusGeometry(1.15, 0.07, 10, 64, Math.PI * 1.6), []);
  if (v <= 0.001) return null;
  return (
    <group position={[blockX(0), BLOCK_Y, 0]} rotation={[Math.PI / 2.4, 0, spin]} scale={[v, v, v]}>
      <mesh geometry={arc}>
        <meshStandardMaterial color={Z.gold} emissive={Z.gold} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[1.15, 0, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.2, 0.42, 12]} />
        <meshStandardMaterial color={Z.gold} emissive={Z.gold} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
};

// Ondas de sonido que salen del último bloque
const Rings: React.FC<{ v: number; t: number }> = ({ v, t }) => {
  if (v <= 0.001) return null;
  return (
    <group position={[blockX(9), BLOCK_Y, 0]}>
      {[0, 1, 2].map((k) => {
        const p = (t * 0.9 + k / 3) % 1;
        return (
          <mesh key={k} rotation={[0, Math.PI / 2, 0]} scale={[0.6 + 1.8 * p, 0.6 + 1.8 * p, 1]}>
            <torusGeometry args={[0.8, 0.035, 8, 48]} />
            <meshBasicMaterial color={Z.gold} transparent opacity={v * (1 - p)} />
          </mesh>
        );
      })}
    </group>
  );
};

// Curva de recuerdo en forma de U por encima de los bloques
const Curve: React.FC<{ frac: number; glow: number }> = ({ frac, glow }) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(U.map((u, i) => new THREE.Vector3(blockX(i), 2.4 + 1.9 * u, 0))), []);
  const n = Math.max(2, Math.round(frac * 120));
  const geo = useMemo(() => {
    const pts = curve.getPoints(120).slice(0, n);
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(4, n), 0.07, 8, false);
  }, [curve, n]);
  if (frac <= 0.01) return null;
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={Z.gold} emissive={Z.gold} emissiveIntensity={0.5 + glow} />
    </mesh>
  );
};

export const SerialScene: React.FC<{ s: SerialState; width: number; height: number }> = ({ s, width, height }) => {
  const ready = useFontsReady();
  const tex = useMemo(() => (ready ? WORDS.map(wordTex) : null), [ready]);
  if (!tex) return null;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: s.cam.pos, fov: 40 }} shadows style={{ position: "absolute", inset: 0 }}>
      <CameraRig cam={s.cam} />
      <color attach="background" args={[Z.bg]} />
      <fog attach="fog" args={[Z.bg, 14, 30]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 10, 8]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-12, 12, 12, -12, 1, 40]} />
      </directionalLight>
      <pointLight position={[0, 4, 3]} intensity={16} distance={14} color="#FFB070" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={Z.floor} roughness={1} />
      </mesh>
      <gridHelper args={[80, 80, "#3A322C", "#332B26"]} position={[0, 0.01, 0]} />
      {s.blocks.map((b, i) => (
        <Block key={WORDS[i]} i={i} b={b} tex={tex[i]} />
      ))}
      <Loop v={s.loop} spin={s.loopSpin} />
      <Rings v={s.rings} t={s.ringsT} />
      <Curve frac={s.curve} glow={s.curveGlow} />
    </ThreeCanvas>
  );
};
