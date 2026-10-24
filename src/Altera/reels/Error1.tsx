import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { FLOOR, M, ScreenRope, Snd, Stage, type RopeSpec } from "../reelkit";
import { A, ContactShadow, FONT, LABEL, Paper, SOUND, impact, lin } from "../system";

// «Encontrá el error» — video 1 de calendario-30-dias.md (2026-10-25). EJEMPLO CREADO PARA ESTE VIDEO.
// Una escena de Gancho apilando cajas con la línea tiene un error de continuidad: el plano 1 termina con 3 cajas y el
// plano 2 (tras un corte duro en 4,5 s) arranca con 4. Las cantidades salen de las constantes de abajo, no de la animación.
// Variante B: solo cambia el gancho de los primeros ~3 s (texto y primera locución); todo lo demás es idéntico.

export const ERROR1_FRAMES = 900; // 30,0 s
export type Error1Variant = "A" | "B";

const F = (s: number) => Math.round(s * 30);
const BOXES_SHOT1 = 3; // cajas al final del plano 1
const BOXES_SHOT2 = 4; // cajas al empezar el plano 2 (el error)
const LANDS = [9, 54, 99]; // fotograma en que aterriza cada caja del plano 1 (0,3 · 1,8 · 3,3 s)
const CUT = 135; // corte duro: 4,5 s
const SHOT2_END = 270; // 9,0 s
const TOWER_X = 720; // coordenadas de maqueta
const BOX_W = 190;
const BOX_H = 150;
const CAM2 = 0.8; // el plano 2 es más abierto
const boxY = (i: number) => FLOOR - BOX_H * (i + 0.5); // centro de la caja i (0 = la de abajo)
const topY = (n: number) => FLOOR - BOX_H * n;

// ---------- utilería ----------
const Box: React.FC<{ y: number; squash?: number }> = ({ y, squash = 0 }) => (
  <svg width={BOX_W + 12} height={BOX_H + 12} viewBox={`0 0 ${BOX_W + 12} ${BOX_H + 12}`} style={{ position: "absolute", left: TOWER_X - (BOX_W + 12) / 2, top: y - (BOX_H + 12) / 2, overflow: "visible", transformOrigin: "50% 100%", transform: `scale(${1 + 0.05 * squash}, ${1 - 0.1 * squash})` }}>
    <rect x={6} y={6} width={BOX_W} height={BOX_H} rx={18} fill="#FBF8F2" stroke={A.ink} strokeWidth={6} />
    <line x1={6} y1={6 + 34} x2={6 + BOX_W} y2={6 + 34} stroke={A.ink} strokeWidth={5} />
    <rect x={6 + BOX_W / 2 - 34} y={6 + 62} width={68} height={16} rx={8} fill={A.ink} />
  </svg>
);

const Num: React.FC<{ x: number; y: number; n: number; at: number; f: number; hot?: boolean }> = ({ x, y, n, at, f, hot }) => {
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 300 } });
  return (
    <div style={{ position: "absolute", left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: 42, background: hot ? A.orange : A.ink, color: A.ivory, fontFamily: FONT, fontWeight: 800, fontSize: 52, letterSpacing: "-0.04em", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, boxShadow: "0 10px 18px rgba(14,13,11,0.28)" }}>
      {n}
    </div>
  );
};

const Title: React.FC<{ lines: { text: string; hot?: boolean }[]; size?: number; top?: number; opacity?: number }> = ({ lines, size = 112, top = 250, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 72, top, width: 858, fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink, opacity }}>
    {lines.map((l, i) => (
      <div key={i} style={{ color: l.hot ? A.orange : A.ink }}>
        {l.text}
      </div>
    ))}
  </div>
);

const Tag: React.FC<{ text: string; x?: number; y: number; opacity?: number; align?: "left" | "center" }> = ({ text, x = 72, y, opacity = 1, align = "left" }) => (
  <div style={{ position: "absolute", top: y, left: align === "center" ? 0 : x, right: align === "center" ? 0 : undefined, textAlign: align, maxWidth: 858, opacity, fontFamily: LABEL, fontSize: 28, letterSpacing: "0.04em", color: A.ink, textTransform: "uppercase" }}>
    <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 7, background: A.orange, marginRight: 14, verticalAlign: "middle" }} />
    <span style={{ verticalAlign: "middle" }}>{text}</span>
  </div>
);

// ---------- la escena ----------
// shot 1 = plano cercano (3 cajas al final) · shot 2 = plano abierto tras el corte · shot 3 = vacía (cierre, pose del fotograma 0)
const drop = (f: number, land: number) => lin(f, land - 9, land, 0, 1, (x) => x * x);

const pose1 = (f: number): GanchoPose => {
  const pulling = LANDS.some((l) => f >= l - 9 && f < l + 6);
  return { x: 330, y: FLOOR, scale: 0.85, t: f / 30, expr: f >= LANDS[2] + 8 ? "smug" : "focused", armL: 30, armR: pulling ? 110 : 50, lean: pulling ? -7 : 0, look: { x: 1, y: -0.2 } };
};
const pose2 = (f: number): GanchoPose => {
  const back = lin(f, CUT, CUT + 35, 0, 1, (x) => 1 - (1 - x) ** 2);
  const up = f >= CUT + 40;
  return { x: 330 - 100 * back, y: FLOOR, scale: 0.85, t: f / 30, expr: up ? "happy" : "normal", walk: f < CUT + 35 ? f * 0.9 : undefined, armL: up ? 155 + 18 * Math.sin(f * 0.35) : 30, armR: up ? 155 + 18 * Math.cos(f * 0.35) : 30, lean: up ? 3 * Math.sin(f * 0.25) : 0, look: { x: 1, y: 0 } };
};

const Scene: React.FC<{ f: number; shot: 1 | 2 | 3; n2?: number }> = ({ f, shot, n2 = BOXES_SHOT2 }) => {
  let g: GanchoPose;
  let rope: RopeSpec = null;
  let bump = 0;
  const boxes: { y: number; squash: number }[] = [];
  if (shot === 1 || shot === 3) {
    g = shot === 3 ? pose1(0) : pose1(f);
    if (shot === 1) {
      LANDS.forEach((l, i) => {
        if (f < l - 9) return;
        const d = drop(f, l);
        const y = boxY(i) - (1 - d) * 700;
        boxes.push({ y, squash: f >= l ? impact(f - l) : 0 });
        bump += 0.22 * (f >= l ? impact(f - l) : 0);
        if (f >= l - 9 && f < l + 16) {
          rope = { bx: TOWER_X, by: y - BOX_H / 2, slack: f < l ? 0.05 : lin(f, l, l + 16, 0.05, 0.7), buzz: f >= l && f < l + 8 ? 0.6 : 0, screen: false };
        }
      });
    }
  } else {
    g = pose2(f);
    for (let i = 0; i < n2; i++) boxes.push({ y: boxY(i), squash: 0 });
    if (f >= CUT && f < CUT + 46) rope = { bx: TOWER_X, by: topY(n2) + 6, slack: lin(f, CUT + 14, CUT + 44, 0.05, 0.9), buzz: 0, screen: false };
  }
  const cam = shot === 2 ? { transformOrigin: "540px 1330px", transform: `scale(${CAM2})` } : {};
  return (
    <AbsoluteFill style={cam}>
      <Stage bump={bump}>
        <ContactShadow x={TOWER_X} y={FLOOR + 4} w={BOX_W * 1.15} />
        {boxes.map((b, i) => (
          <Box key={i} y={b.y} squash={b.squash} />
        ))}
        <Gancho {...g} />
      </Stage>
      <ScreenRope from={antennaWorld(g)} rope={rope} t={f / 30} />
    </AbsoluteFill>
  );
};

// posición en pantalla del centro de la caja i en el plano indicado
const proj = (shot: 1 | 2, i: number) => {
  const p = M(TOWER_X, boxY(i));
  return shot === 1 ? p : { x: 540 + (p.x - 540) * CAM2, y: 1330 + (p.y - 1330) * CAM2 };
};

// ---------- línea de tiempo (explicación del corte) ----------
const TimelineBar: React.FC<{ f: number; t0: number }> = ({ f, t0 }) => {
  const { fps } = useVideoConfig();
  const L = 110;
  const R = 970;
  const W = R - L;
  const Y = 880;
  const mid = L + W / 2;
  const sweep = lin(f, t0, t0 + 36, 0, 1, (x) => x * x * (3 - 2 * x));
  const hit = f >= t0 + 38;
  const p3 = spring({ frame: f - (t0 + 55), fps, config: { damping: 12, stiffness: 260 } });
  const p4 = spring({ frame: f - (t0 + 64), fps, config: { damping: 12, stiffness: 260 } });
  return (
    <>
      <Title lines={[{ text: "ERROR DE" }, { text: "CONTINUIDAD", hot: true }]} size={104} opacity={lin(f, t0 - 4, t0 + 4)} />
      <div style={{ position: "absolute", left: L, top: Y, width: W / 2 - 4, height: 120, borderRadius: 20, background: A.ivoryDeep, border: `6px solid ${A.ink}`, boxSizing: "border-box", fontFamily: LABEL, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", color: A.ink }}>PLANO 1</div>
      <div style={{ position: "absolute", left: mid + 4, top: Y, width: W / 2 - 4, height: 120, borderRadius: 20, background: A.ivoryDeep, border: `6px solid ${A.ink}`, boxSizing: "border-box", fontFamily: LABEL, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", color: A.ink }}>PLANO 2</div>
      {[["0:00", L], ["0:04,5", mid], ["0:09", R]].map(([lab, x], k) => (
        <div key={k} style={{ position: "absolute", left: (x as number) - 70, width: 140, top: Y + 134, textAlign: "center", fontFamily: LABEL, fontSize: 26, color: A.grey }}>
          {lab}
        </div>
      ))}
      {/* cursor */}
      <div style={{ position: "absolute", left: L + sweep * (W / 2) - 3, top: Y - 36, width: 6, height: 156, background: A.ink, borderRadius: 3 }} />
      {hit ? (
        <>
          <div style={{ position: "absolute", left: mid - 5, top: Y - 56, width: 10, height: 180, background: A.orange, borderRadius: 5, transform: `scaleY(${1 + 0.1 * impact(f - (t0 + 38))})` }} />
          <div style={{ position: "absolute", left: mid - 70, width: 140, top: Y - 108, textAlign: "center", fontFamily: LABEL, fontSize: 30, color: A.orange }}>CORTE</div>
        </>
      ) : null}
      {f >= t0 + 55 ? (
        <div style={{ position: "absolute", left: L + W / 4 - 150, top: Y + 200, width: 300, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, letterSpacing: "-0.04em", color: A.ink, transform: `scale(${p3})` }}>
          {BOXES_SHOT1} cajas
        </div>
      ) : null}
      {f >= t0 + 64 ? (
        <div style={{ position: "absolute", left: mid + W / 4 - 150, top: Y + 200, width: 300, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, letterSpacing: "-0.04em", color: A.ink, transform: `scale(${p4})` }}>
          <span style={{ color: A.orange }}>{BOXES_SHOT2}</span> cajas
        </div>
      ) : null}
      <Tag text="Continuidad: que todo siga igual al cambiar de plano" y={1250} opacity={lin(f, t0 + 88, t0 + 98)} />
    </>
  );
};

export const Error1: React.FC<{ variant?: Error1Variant }> = ({ variant = "A" }) => {
  const f = useCurrentFrame();
  const hookText = variant === "A" ? [{ text: "HAY" }, { text: "1 ERROR", hot: true }] : [{ text: "¿QUÉ ESTÁ" }, { text: "MAL?", hot: true }];
  const hookTag = variant === "A" ? "Encontralo" : "Tenés 9 segundos";
  const hookOpacity = f < F(2.8) ? 1 : lin(f, F(2.8), F(3.2), 1, 0);

  // qué se ve en cada tramo (todos los tiempos en fotogramas a 30 fps)
  let body: React.ReactNode = null;
  if (f < SHOT2_END) {
    body = (
      <>
        <Scene f={f} shot={f < CUT ? 1 : 2} />
        {f < F(3.2) ? (
          <>
            <Title lines={hookText} opacity={hookOpacity} />
            <Tag text={hookTag} y={500} opacity={hookOpacity} />
          </>
        ) : null}
      </>
    );
  } else if (f < F(10.2)) {
    const lo = lin(f, F(9.05), F(9.2));
    body = (
      <>
        <Scene f={SHOT2_END - 1} shot={2} />
        <Title lines={[{ text: "¿LO" }, { text: "VISTE?", hot: true }]} opacity={lo} />
      </>
    );
  } else if (f < F(13)) {
    const lf = f;
    body = (
      <>
        <Scene f={CUT - 1} shot={1} />
        <Title lines={[{ text: "ANTES DEL" }, { text: "CORTE" }]} size={92} />
        {[0, 1, 2].map((i) => {
          const p = proj(1, i);
          return <Num key={i} x={p.x} y={p.y} n={i + 1} at={F(10.95) + i * 9} f={lf} />;
        })}
        {f >= F(11.8) ? (
          <div style={{ position: "absolute", left: 72, top: 520, fontFamily: FONT, fontWeight: 800, fontSize: 170, lineHeight: 1, letterSpacing: "-0.05em", color: A.ink, transform: `scale(${1 + 0.1 * impact(f - F(11.8))})`, transformOrigin: "0 100%" }}>
            {BOXES_SHOT1}
            <span style={{ fontSize: 80, marginLeft: 18 }}>cajas</span>
          </div>
        ) : null}
        <Tag text="Último fotograma del plano 1" y={1400} />
      </>
    );
  } else if (f < F(17.2)) {
    body = (
      <>
        <Scene f={CUT} shot={2} />
        <Title lines={[{ text: "DESPUÉS DEL" }, { text: "CORTE" }]} size={92} />
        {[0, 1, 2, 3].map((i) => {
          const p = proj(2, i);
          const at = i < 3 ? F(13.55) + i * 6 : F(14.35);
          return <Num key={i} x={p.x} y={p.y} n={i + 1} at={at} f={f} hot={i === 3} />;
        })}
        {f >= F(14.35) ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`translate(${proj(2, 3).x} ${proj(2, 3).y}) scale(${1 + 0.07 * Math.sin((f - F(14.35)) * 0.3)}) translate(${-proj(2, 3).x} ${-proj(2, 3).y})`}>
              <rect x={proj(2, 3).x - 100} y={proj(2, 3).y - 78} width={200} height={156} rx={22} fill="none" stroke={A.orange} strokeWidth={9} />
            </g>
          </svg>
        ) : null}
        {f >= F(14.35) ? (
          <div style={{ position: "absolute", left: 72, top: 520, fontFamily: FONT, fontWeight: 800, fontSize: 170, lineHeight: 1, letterSpacing: "-0.05em", color: A.orange, transform: `scale(${1 + 0.14 * impact(f - F(14.35))})`, transformOrigin: "0 100%" }}>
            {BOXES_SHOT2}
            <span style={{ fontSize: 80, marginLeft: 18, color: A.ink }}>cajas</span>
          </div>
        ) : null}
        <Tag text="Primer fotograma del plano 2" y={1400} />
      </>
    );
  } else if (f < F(22.8)) {
    body = <TimelineBar f={f} t0={F(17.3)} />;
  } else if (f < F(23.2)) {
    body = <Title lines={[{ text: "CORREGIDO", hot: true }]} />;
  } else if (f < F(26.2)) {
    const lf = f - F(23.2);
    const pre = lf < 45;
    body = (
      <>
        <Scene f={pre ? 90 + lf : CUT + (lf - 45)} shot={pre ? 1 : 2} n2={BOXES_SHOT1} />
        <Tag text="Fragmento · 1,5 s antes + 1,5 s después" y={1400} />
      </>
    );
  } else if (f < F(27.8)) {
    body = (
      <>
        <Scene f={CUT + 44} shot={2} n2={BOXES_SHOT1} />
        <div style={{ position: "absolute", left: 72, top: 250, fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: 1, letterSpacing: "-0.05em", color: A.ink, transform: `scale(${1 + 0.1 * impact(f - F(26.2))})`, transformOrigin: "0 100%" }}>
          {BOXES_SHOT1} <span style={{ color: A.orange }}>→</span> {BOXES_SHOT1}
        </div>
      </>
    );
  } else {
    body = (
      <AbsoluteFill style={{ opacity: lin(f, F(27.8), F(28.0)) }}>
        <Scene f={0} shot={3} />
        <Title lines={[{ text: "¿LO ENCONTRASTE" }, { text: "A LA PRIMERA?", hot: true }]} size={82} opacity={lin(f, F(27.9), F(28.1))} />
      </AbsoluteFill>
    );
  }

  const hookSrc = variant === "A" ? "audio/error1/hookA.wav" : "audio/error1/hookB.wav";
  const voice = (at: number, src: string) => (
    <Sequence from={F(at)}>
      <Audio src={staticFile(src)} />
    </Sequence>
  );

  return (
    <Paper>
      {f >= F(27.8) && f < F(28.0) ? <Scene f={CUT + 44} shot={2} n2={BOXES_SHOT1} /> : null}
      {body}

      {/* voz */}
      {voice(0.2, hookSrc)}
      {voice(9.25, "audio/error1/b1.wav")}
      {voice(10.3, "audio/error1/b2.wav")}
      {voice(13.1, "audio/error1/b3.wav")}
      {voice(17.3, "audio/error1/b4.wav")}
      {voice(22.9, "audio/error1/b5.wav")}
      {voice(27.9, "audio/error1/b6.wav")}

      {/* sonido propio: tensión · tirón · impacto */}
      {LANDS.map((l) => (
        <React.Fragment key={l}>
          <Snd at={l - 11} src={SOUND.tension} vol={0.35} />
          <Snd at={l} src={SOUND.impacto} vol={0.8} />
        </React.Fragment>
      ))}
      <Snd at={CUT + 25} src={SOUND.tiron} vol={0.6} />
      <Snd at={F(9.1)} src={SOUND.impacto} vol={0.5} />
      {[10.95, 11.2, 11.45].map((s) => (
        <Snd key={s} at={F(s)} src={SOUND.impacto} vol={0.3} />
      ))}
      <Snd at={F(11.8)} src={SOUND.impacto} vol={0.5} />
      {[13.55, 13.75, 13.95].map((s) => (
        <Snd key={s} at={F(s)} src={SOUND.impacto} vol={0.3} />
      ))}
      <Snd at={F(14.35)} src={SOUND.impacto} vol={0.9} />
      <Snd at={F(17.3)} src={SOUND.tiron} vol={0.5} />
      <Snd at={F(17.3) + 38} src={SOUND.impacto} vol={0.7} />
      <Snd at={F(17.3) + 55} src={SOUND.impacto} vol={0.35} />
      <Snd at={F(17.3) + 64} src={SOUND.impacto} vol={0.45} />
      <Snd at={F(24.7)} src={SOUND.impacto} vol={0.45} />
      <Snd at={F(26.2)} src={SOUND.impacto} vol={0.5} />
    </Paper>
  );
};

// ---------- portada (1080 × 1920) ----------
export const Error1Portada: React.FC = () => {
  const g: GanchoPose = { x: 360, y: FLOOR, scale: 0.95, t: 1.2, expr: "surprised", armL: 40, armR: 60, look: { x: 1, y: -0.1 } };
  return (
    <Paper>
      <Title lines={[{ text: "HAY" }, { text: "1 ERROR", hot: true }]} size={190} top={260} />
      <Tag text="Encontralo" y={720} />
      <AbsoluteFill>
        <Stage>
          <ContactShadow x={TOWER_X} y={FLOOR + 4} w={BOX_W * 1.15} />
          {Array.from({ length: BOXES_SHOT1 }, (_, i) => (
            <Box key={i} y={boxY(i)} />
          ))}
          <Gancho {...g} />
        </Stage>
      </AbsoluteFill>
    </Paper>
  );
};
