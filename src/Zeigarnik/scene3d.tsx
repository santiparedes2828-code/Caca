import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";

// Escena 3D del reel del efecto Zeigarnik (estilo-explicador.md llevado a 3D): móvil, cerebro con anillo abierto
// y pestañas, en la paleta del explicador (fondo marrón, crema, rojo, dorado). Low-poly con sombreado plano.

export const Z = {
  bg: "#1E1A17",
  floor: "#2A2420",
  cream: "#EBE7DD",
  line: "#1A1613",
  wood: "#3E2F27",
  red: "#E2483D",
  gold: "#E8C35A",
  text: "#EDE6DA",
  dim: "#8C847B",
  green: "#12A150",
};

// Posiciones de los objetos (también son los puntos de mira de la cámara)
export const P = {
  phone: new THREE.Vector3(-3.2, 1.9, 0),
  brain: new THREE.Vector3(0.3, 2.1, -0.6),
  tabs: new THREE.Vector3(3.6, 2.0, 0.2),
};

export type Cam = { pos: [number, number, number]; look: [number, number, number] };
export type ScreenKind = "ep7" | "ep8" | "video" | "dm";
export type SceneState = {
  cam: Cam;
  phoneDrop: number; // 0 = arriba, 1 = apoyado
  phoneSpin: number; // giro en Y (rad)
  progress: number; // barra de reproducción 0..1
  screen: ScreenKind;
  ring: number; // fracción del anillo cerrada (0..1)
  ringGlow: number;
  brainSpin: number;
  tabOpen: number; // 1 = pestaña roja abierta, 0 = cerrada
  tabPulse: number;
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

const texture = (draw: (c: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 900;
  draw(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const screenTex = (kind: ScreenKind) =>
  texture((c) => {
    c.fillStyle = "#2B2622";
    c.fillRect(0, 0, 512, 900);
    c.textAlign = "center";
    if (kind === "dm") {
      c.fillStyle = Z.green;
      c.beginPath();
      c.arc(70, 80, 30, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = Z.text;
      c.font = '800 34px "Inter"';
      c.textAlign = "left";
      c.fillText("hookhouse", 115, 92);
      c.fillStyle = Z.green;
      c.beginPath();
      c.roundRect(150, 600, 320, 130, 40);
      c.fill();
      c.fillStyle = "#fff";
      c.font = '800 84px "Inter"';
      c.textAlign = "center";
      c.fillText("HOOK", 310, 695);
      return;
    }
    // Fotograma del "capítulo": bloques de color + título
    const big = kind === "video" ? "ESTE VIDEO" : kind === "ep7" ? "EP. 07" : "EP. 08";
    c.fillStyle = kind === "ep8" ? Z.gold : kind === "video" ? Z.red : "#4A3F38";
    c.fillRect(30, 140, 452, 420);
    c.fillStyle = Z.cream;
    c.beginPath();
    c.arc(256, 350, 80, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = Z.line;
    c.beginPath();
    c.moveTo(232, 305);
    c.lineTo(232, 395);
    c.lineTo(300, 350);
    c.fill();
    c.fillStyle = Z.text;
    c.font = '800 70px "Inter"';
    c.fillText(big, 256, 680);
  });

// Coloca la cámara en cada frame
const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  camera.position.set(...cam.pos);
  camera.lookAt(new THREE.Vector3(...cam.look));
  return null;
};

const Phone: React.FC<{ s: SceneState; tex: Record<ScreenKind, THREE.Texture> }> = ({ s, tex }) => {
  const y = P.phone.y + (1 - s.phoneDrop) * 2.6;
  return (
    <group position={[P.phone.x, y, P.phone.z]} rotation={[0, s.phoneSpin + 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2.1, 3.7, 0.22]} />
        <meshStandardMaterial color={Z.line} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.115]}>
        <planeGeometry args={[1.9, 3.4]} />
        <meshStandardMaterial map={tex[s.screen]} roughness={0.5} emissive="#ffffff" emissiveMap={tex[s.screen]} emissiveIntensity={0.35} />
      </mesh>
      {/* Barra de reproducción */}
      {s.screen !== "dm" ? (
        <>
          <mesh position={[0, -1.25, 0.12]}>
            <planeGeometry args={[1.6, 0.06]} />
            <meshBasicMaterial color="#5A524B" />
          </mesh>
          <mesh position={[-0.8 + 0.8 * s.progress, -1.25, 0.125]} scale={[Math.max(0.001, s.progress), 1, 1]}>
            <planeGeometry args={[1.6, 0.07]} />
            <meshBasicMaterial color={Z.red} />
          </mesh>
          <mesh position={[-0.8 + 1.6 * s.progress, -1.25, 0.13]}>
            <circleGeometry args={[0.08, 20]} />
            <meshBasicMaterial color={Z.red} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

const Brain: React.FC<{ s: SceneState }> = ({ s }) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.05, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const n = 1 + 0.08 * Math.sin(v.x * 6) * Math.cos(v.y * 5) + 0.05 * Math.sin(v.z * 9);
      v.multiplyScalar(n);
      v.x *= 1.15;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  // Anillo: arco que se cierra al final
  const arc = Math.PI * 2 * (0.72 + 0.28 * s.ring);
  const ring = useMemo(() => new THREE.TorusGeometry(1.9, 0.12, 12, 96, arc), [arc]);
  return (
    <group position={P.brain.toArray()}>
      <mesh geometry={geo} rotation={[0.2, s.brainSpin, 0]} castShadow>
        <meshStandardMaterial color={Z.cream} roughness={0.7} flatShading />
      </mesh>
      <mesh geometry={ring} rotation={[0.15, 0.3, s.brainSpin * 0.8]} castShadow>
        <meshStandardMaterial color={Z.gold} emissive={s.ring >= 0.999 ? Z.gold : Z.red} emissiveIntensity={0.25 + 0.9 * s.ringGlow} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
};

const Tabs: React.FC<{ s: SceneState }> = ({ s }) => (
  <group position={P.tabs.toArray()} rotation={[0, -0.45, 0]}>
    {[0, 1, 2].map((k) => {
      const red = k === 0;
      const sc = red ? Math.max(0.001, s.tabOpen) : 1;
      return (
        <group key={k} position={[k * 0.35, k * -0.35, -k * 0.5]} scale={[sc, sc, sc]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 1.6, 0.08]} />
            <meshStandardMaterial color={red ? Z.red : Z.cream} emissive={red ? Z.red : "#000"} emissiveIntensity={red ? 0.25 + 0.5 * s.tabPulse : 0} roughness={0.6} flatShading />
          </mesh>
          <mesh position={[-0.6, 0.95, 0]} castShadow>
            <boxGeometry args={[1.1, 0.32, 0.08]} />
            <meshStandardMaterial color={red ? Z.red : Z.cream} roughness={0.6} />
          </mesh>
          <mesh position={[0.95, 0.55, 0.05]}>
            <boxGeometry args={[0.28, 0.06, 0.02]} />
            <meshBasicMaterial color={Z.line} />
          </mesh>
        </group>
      );
    })}
  </group>
);

export const Scene3D: React.FC<{ s: SceneState; width: number; height: number }> = ({ s, width, height }) => {
  const ready = useFontsReady();
  const tex = useMemo(() => (ready ? { ep7: screenTex("ep7"), ep8: screenTex("ep8"), video: screenTex("video"), dm: screenTex("dm") } : null), [ready]);
  if (!tex) return null;
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: s.cam.pos, fov: 38 }} shadows style={{ position: "absolute", inset: 0 }}>
      <CameraRig cam={s.cam} />
      <color attach="background" args={[Z.bg]} />
      <fog attach="fog" args={[Z.bg, 12, 26]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 9, 7]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 1, 30]} />
      </directionalLight>
      <pointLight position={[0.3, 3.5, 2.5]} intensity={18} distance={10} color="#FFB070" />
      {/* Suelo con cuadrícula */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={Z.floor} roughness={1} />
      </mesh>
      <gridHelper args={[60, 60, "#3A322C", "#332B26"]} position={[0, 0.01, 0]} />
      <Phone s={s} tex={tex} />
      <Brain s={s} />
      <Tabs s={s} />
    </ThreeCanvas>
  );
};
