import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";

// Frente de la carta (Charizard) animado en WebGL: las alas aletean deformando la ilustración alrededor de la raíz
// de cada ala (sin recortes ni relleno) y de la boca sale fuego hecho con ruido turbulento + brasas, en mezcla aditiva.
// Coordenadas en UV de la carta original (747x1052, v hacia abajo).

const W = 660;
const H = 922;
const ART = [92 / 747, 125 / 1052, 672 / 747, 548 / 1052]; // ventana de la ilustración (u0, v0, u1, v1)
const MOUTH = [330 / 747, 372 / 1052];
const WING_L = { root: [392 / 747, 305 / 1052], tip: [300 / 747, 165 / 1052] };
const WING_R = { root: [482 / 747, 322 / 1052], tip: [640 / 747, 140 / 1052] };

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const frag = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform float time;
uniform float flap;
uniform float fire;
uniform vec4 art;
uniform vec2 mouth;
uniform vec2 wlRoot; uniform vec2 wlTip;
uniform vec2 wrRoot; uniform vec2 wrTip;
varying vec2 vUv;
const float ASPECT = ${(H / W).toFixed(5)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

// Rota el punto de muestreo alrededor de la raíz del ala; el peso crece hacia la punta y se apaga fuera del ala
vec2 wing(vec2 uv, vec2 root, vec2 tip, float ang) {
  vec2 p = (uv - root) * vec2(1.0, ASPECT);
  vec2 t = (tip - root) * vec2(1.0, ASPECT);
  float len = length(t);
  float along = dot(p, t) / (len * len);
  float side = abs(p.x * t.y - p.y * t.x) / len;
  float wgt = smoothstep(0.0, 0.5, along) * (1.0 - smoothstep(1.1, 1.4, along)) * (1.0 - smoothstep(len * 0.6, len * 0.95, side));
  float a = -ang * wgt;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  q *= 1.0 + 0.06 * ang * wgt; // se acorta un poco al bajar
  return root + q / vec2(1.0, ASPECT);
}

void main() {
  vec2 uv = vUv;
  vec2 v = vec2(uv.x, 1.0 - uv.y); // v hacia abajo como en la imagen
  bool inArt = v.x > art.x && v.x < art.z && v.y > art.y && v.y < art.w;
  vec2 s = v;
  if (inArt) {
    s = wing(s, wlRoot, wlTip, flap);
    s = wing(s, wrRoot, wrTip, -flap);
    s = clamp(s, art.xy + 0.002, art.zw - 0.002);
  }
  vec3 col = texture2D(map, vec2(s.x, 1.0 - s.y)).rgb;

  if (inArt && fire > 0.001) {
    // Llamarada: penacho que sale de la boca hacia la izquierda y se abre con la distancia
    vec2 dir = normalize(vec2(-1.0, 0.24));
    vec2 p = (v - mouth) * vec2(1.0, ASPECT);
    float along = dot(p, dir);
    float across = dot(p, vec2(-dir.y, dir.x));
    float L = 0.44 * fire;
    float width = 0.02 + 0.5 * max(along, 0.0);
    // Turbulencia que avanza con la llama (dos escalas)
    vec2 q = vec2(along * 6.0 - time * 4.0, across * 7.0);
    float n1 = fbm(q + vec2(0.0, time * 0.9));
    float n2 = fbm(q * 2.6 + vec2(-time * 2.3, time * 1.1));
    float n = n1 * 0.65 + n2 * 0.5;
    float edge = abs(across) + (n - 0.55) * width * 1.6;
    float shape = 1.0 - smoothstep(width * 0.15, width, edge);
    float lenF = smoothstep(-0.01, 0.025, along) * (1.0 - smoothstep(L * 0.4, L, along + (n - 0.5) * 0.12));
    float core = (1.0 - smoothstep(0.0, width * 0.45, abs(across))) * (1.0 - smoothstep(0.0, L * 0.7, along));
    float f = clamp(shape * lenF * (0.25 + n * 1.25) + core * 0.6 * lenF, 0.0, 1.4);
    vec3 fireCol = mix(vec3(0.55, 0.05, 0.0), vec3(0.98, 0.32, 0.03), smoothstep(0.05, 0.35, f));
    fireCol = mix(fireCol, vec3(1.0, 0.72, 0.18), smoothstep(0.35, 0.75, f));
    fireCol = mix(fireCol, vec3(1.0, 0.97, 0.82), smoothstep(0.8, 1.2, f));
    // Brasas que se escapan del penacho
    vec2 g = vec2(along * 30.0 - time * 6.0, across * 30.0 + time * 2.0 + sin(along * 40.0));
    float spark = step(0.982, hash(floor(g))) * smoothstep(0.4, 0.05, length(fract(g) - 0.5)) * smoothstep(0.0, 0.05, along) * (1.0 - smoothstep(L * 0.9, L * 1.25, along)) * step(abs(across), width * 1.6);
    float a = smoothstep(0.02, 0.25, f);
    col = mix(col, col * 0.6 + fireCol * 1.4, a * fire);
    col += fireCol * f * 0.55 * fire + vec3(1.0, 0.65, 0.25) * spark * fire * 1.4;
    // Resplandor cálido sobre la ilustración
    col += vec3(1.0, 0.42, 0.08) * 0.32 * fire * exp(-length(p - dir * L * 0.35) * 7.0);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const useCardTexture = () => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender("Textura de la carta Charizard"));
  useEffect(() => {
    new THREE.TextureLoader().load(staticFile("anime/carta_charizard.png"), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      setTex(t);
      continueRender(handle);
    });
  }, [handle]);
  return tex;
};

export const CharizardCard: React.FC<{ time: number; flap: number; fire: number }> = ({ time, flap, fire }) => {
  const tex = useCardTexture();
  const material = useMemo(
    () =>
      tex
        ? new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
              map: { value: tex },
              time: { value: 0 },
              flap: { value: 0 },
              fire: { value: 0 },
              art: { value: new THREE.Vector4(...ART) },
              mouth: { value: new THREE.Vector2(...MOUTH) },
              wlRoot: { value: new THREE.Vector2(...WING_L.root) },
              wlTip: { value: new THREE.Vector2(...WING_L.tip) },
              wrRoot: { value: new THREE.Vector2(...WING_R.root) },
              wrTip: { value: new THREE.Vector2(...WING_R.tip) },
            },
          })
        : null,
    [tex],
  );
  if (!material) return null;
  material.uniforms.time.value = time;
  material.uniforms.flap.value = flap;
  material.uniforms.fire.value = fire;
  return (
    <ThreeCanvas width={W} height={H} orthographic camera={{ position: [0, 0, 10], zoom: 1 }} style={{ position: "absolute", inset: 0 }}>
      <mesh material={material}>
        <planeGeometry args={[W, H]} />
      </mesh>
    </ThreeCanvas>
  );
};
