import React from "react";
import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-gancho-v2-1.json";
import c2 from "../../data/captions-gancho-v2-2.json";
import c3 from "../../data/captions-gancho-v2-3.json";
import c4 from "../../data/captions-gancho-v2-4.json";
import c5 from "../../data/captions-gancho-v2-5.json";
import { Gancho } from "../Gancho";
import { Stopwatch } from "../props";
import { Snd, timing } from "../reelkit";
import { A, Captions, ContactShadow, LABEL, Paper, SOUND, fall, impact, lin } from "../system";
import { Arrow, Badge, Camera, Chip, Hero, LAYOUT, ML, NewText, OldText, Phone, ProCamera, SCR, Shop, Stamp, ease, toScreen, type Cam } from "./Medialuna";

// Prueba de 5 ganchos para la v2 de «La medialuna» (2026-10-30). Cada variante es solo la apertura (voz del gancho
// + 1,2 s de cola) sobre la misma panadería de ejemplo, para compararlas con el panel de espectadores.
// 1 pregunta con conflicto · 2 reto en tiempo real · 3 promesa con número · 4 nicho + conflicto · 5 resultado primero.

const CAPS: Caption[][] = [c1, c2, c3, c4, c5];
const TAIL = 36;
export const ganchoFrames = (v: number) => timing(CAPS[v - 1]).frames - 36 + TAIL;

const FLOOR = 1470;
const TagLine: React.FC<{ text: string; y: number; x?: number; opacity?: number }> = ({ text, y, x = 72, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: LABEL, fontSize: 28, letterSpacing: "0.08em", color: A.ink, opacity, whiteSpace: "nowrap" }}>
    <span style={{ color: A.orange }}>● </span>
    {text}
  </div>
);

export const MedialunaGancho: React.FC<{ v: number }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const T = timing(CAPS[v - 1]);
  const { W, E, idx, talkAt } = T;
  const last = T.words.length - 1;
  const endV = E(last);
  const play = 0.04 + (f / 200) * 0.5;

  // por defecto: el celular cae en el fotograma 0 (golpe a los 0,2 s)
  const phoneLift = (1 - fall(f + 4, fps)) * 260;
  const phoneSquash = 0.5 * impact(f - 4);
  let screen: React.ReactNode = (
    <>
      <Shop t={t} />
    </>
  );
  let overlay: React.ReactNode = <OldText />;
  let extra: React.ReactNode = null;
  let cam: Cam = { z: 1, cx: 540, cy: 980 };
  let expr: "normal" | "happy" | "surprised" | "focused" | "smug" = "normal";
  let armR = 40;
  let look = { x: 1, y: -0.3 };
  let item: "none" | "popcorn" = "none";
  let topTag = "";
  let blur = 0;
  const mls = toScreen(LAYOUT, ML.x, ML.y);
  const ring = (p: number) => (
    <svg width={SCR.w} height={SCR.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <ellipse cx={ML.x} cy={ML.y} rx={38} ry={30} fill="none" stroke={A.orange} strokeWidth={6} strokeDasharray={`${p * 220} 220`} strokeLinecap="round" />
    </svg>
  );
  const sounds: React.ReactNode[] = [<Snd key="land" at={4} src={SOUND.impacto} vol={0.5} />];

  if (v === 1) {
    // ¿Se puede mejorar el video de una panadería… sin comprar una cámara?
    topTag = "EDITO REELS PARA NEGOCIOS";
    const iPan = idx("panadería");
    const iCam = idx("cámara");
    overlay = (
      <>
        <OldText />
        {ring(lin(f, W(iPan), W(iPan) + 8))}
      </>
    );
    const drop = W(iCam) - 8;
    extra =
      f >= drop ? (
        <>
          <ContactShadow x={250} y={1000} w={200} h={(1 - fall(f - drop, fps)) * 900} />
          <div style={{ position: "absolute", left: 140, top: 840 - (1 - fall(f - drop, fps)) * 900, transform: `scale(${1.2 * (1 + 0.15 * impact(f - drop - 8))})`, transformOrigin: "50% 100%" }}>
            <ProCamera t={t} tag={1} />
          </div>
          <Stamp kind="x" x={250} y={900} f={f} at={E(last) - 2} out={9999} />
        </>
      ) : null;
    expr = f >= W(iCam) ? "smug" : "focused";
    armR = 100;
    sounds.push(<Snd key="c" at={drop + 8} src={SOUND.impacto} vol={0.6} />, <Snd key="x" at={E(last) - 2} src={SOUND.impacto} vol={0.4} />);
  } else if (v === 2) {
    // Encontrá la medialuna en este video. Tenés dos segundos. — el reloj corre 2,0 → 0,0 en tiempo real
    const tStart = E(idx("segundos"));
    const k = Math.max(0, Math.min(1, (f - tStart) / 60));
    const val = (2 * (1 - k)).toFixed(1).replace(".", ",");
    const found = f >= tStart + 60;
    overlay = (
      <>
        <OldText />
        {found ? ring(lin(f, tStart + 60, tStart + 68)) : null}
        {found ? <Arrow x={ML.x - 26} y={ML.y + 14} bob={8 * Math.abs(Math.sin(f * 0.32))} opacity={1} /> : null}
      </>
    );
    extra = (
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <Stopwatch x={190} y={760} value={val} ring={1 - k} scale={0.62} squash={0.4 * impact(f - 4)} t={t} />
      </div>
    );
    expr = found ? "surprised" : "focused";
    look = { x: 1, y: -0.5 + 0.3 * Math.sin(f * 0.25) };
    armR = 90;
    cam = { z: 1 + 0.12 * lin(f, 0, tStart + 60), cx: 600, cy: 1000 };
    sounds.push(<Snd key="go" at={tStart} src={SOUND.tension} vol={0.35} />, <Snd key="end" at={tStart + 60} src={SOUND.impacto} vol={0.7} />);
  } else if (v === 3) {
    // Tres cambios para que tu producto se vea en el primer segundo.
    topTag = "PARA NEGOCIOS LOCALES";
    const iTres = idx("tres");
    const iProd = idx("producto");
    const iPrimer = idx("primer");
    overlay = (
      <>
        <OldText />
        {ring(lin(f, W(iProd), W(iProd) + 8))}
        {f >= W(iPrimer) ? (
          <div style={{ position: "absolute", left: 18, top: 210, fontFamily: LABEL, fontSize: 30, color: "#FBF8F2", background: A.orange, padding: "4px 12px", borderRadius: 8, transform: `scale(${spring({ frame: f - W(iPrimer), fps, config: { damping: 11, stiffness: 300 } })})`, transformOrigin: "0 50%" }}>0:01</div>
        ) : null}
      </>
    );
    extra = (
      <>
        {[0, 1, 2].map((k) => (
          <Badge key={k} n={k + 1} x={132} y={650 + k * 132} f={f} drop={W(iTres) + 2 + k * 4} active={99999} done={99999} out={99999} />
        ))}
      </>
    );
    expr = "happy";
    sounds.push(...[0, 1, 2].map((k) => <Snd key={`b${k}`} at={W(iTres) + 2 + k * 4} src={SOUND.impacto} vol={0.3} />));
  } else if (v === 4) {
    // Si tenés una panadería, tu medialuna está en el video… pero no se ve.
    const iMed = idx("medialuna");
    const iNo = idx("no");
    overlay = (
      <>
        <OldText />
        {ring(lin(f, W(iMed), W(iMed) + 8))}
        <Arrow x={ML.x - 26} y={ML.y + 14} bob={8 * Math.abs(Math.sin(f * 0.32))} opacity={lin(f, W(iMed) + 4, W(iMed) + 8)} />
      </>
    );
    const punch = lin(f, W(iNo) - 2, W(iNo) + 6, 0, 1, ease);
    cam = { z: 1 + 3.2 * punch, cx: 540 + (mls.x - 540) * punch, cy: 980 + (mls.y - 980) * punch };
    blur = punch > 0.3 ? 1.6 * punch : 0;
    expr = f >= W(iNo) ? "surprised" : "normal";
    armR = 95;
    sounds.push(<Snd key="z" at={W(iNo)} src={SOUND.impacto} vol={0.35} />);
  } else {
    // Mismo video, misma cámara. Solo cambió la edición. — la comparación desde el fotograma 0
    topTag = "EDITO REELS PARA NEGOCIOS";
    const iEd = idx("edición");
    const sweep = lin(f, W(iEd), W(iEd) + 12, 0, 1, ease);
    const split = (0.5 + 0.06 * Math.sin(f * 0.12)) * (1 - sweep);
    screen = (
      <>
        <Hero t={t} f={f} from={0} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }}>
          <Shop t={t} />
          <OldText />
        </div>
      </>
    );
    overlay = (
      <>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(-1000px 0 0 ${split * 100}%)` }}>
          <NewText f={f} fps={fps} at={-20} />
        </div>
        {split > 0.01 ? <div style={{ position: "absolute", left: SCR.w * split - 5, top: 0, width: 10, height: SCR.h, background: A.orange }} /> : null}
        <Chip text="ANTES" x={18} y={250} align="left" opacity={split > 0.25 ? 1 : 0} />
        <Chip text="DESPUÉS" x={SCR.w - 18} y={250} align="right" opacity={1} />
      </>
    );
    item = "popcorn";
    expr = f >= W(iEd) ? "happy" : "normal";
    armR = 70;
    sounds.push(<Snd key="w" at={W(iEd)} src={SOUND.tiron} vol={0.5} />);
  }

  const world = (
    <>
      {extra}
      <Phone p={{ ...LAYOUT, lift: phoneLift }} play={play} overlay={overlay} squash={phoneSquash}>
        <div style={{ position: "absolute", inset: 0, filter: blur ? `blur(${blur}px)` : undefined }}>{screen}</div>
      </Phone>
      <TagLine text="EJEMPLO CREADO PARA LA DEMO" x={LAYOUT.x - 240} y={LAYOUT.y - 427 - phoneLift - 48} />
      <ContactShadow x={190} y={FLOOR} w={210} />
      <Gancho x={190} y={FLOOR} scale={0.85} t={t} talk={talkAt(f)} expr={expr} armL={30} armR={armR} look={look} item={item} />
    </>
  );

  return (
    <Paper>
      <AbsoluteFill style={{ transformOrigin: "540px 1020px", transform: `scale(${1 + 0.03 * lin(f, 0, endV + TAIL)})` }}>
        <Camera cam={cam}>{world}</Camera>
      </AbsoluteFill>
      {topTag ? <TagLine text={topTag} y={448} opacity={1} /> : null}
      <Captions words={T.words} f={f} fps={fps} keys={[]} top={250} size={82} />
      <Audio src={staticFile(`audio/gancho_v2_${v}.wav`)} />
      <Audio src={staticFile("audio/musica_medialuna.wav")} volume={0.26} />
      {sounds}
    </Paper>
  );
};
