import React from "react";
import { Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import caps from "../../data/captions-marron.json";
import { Gancho, antennaWorld, type GanchoPose } from "../Gancho";
import { Cta, Snd, timing } from "../reelkit";
import { A, Captions, ContactShadow, FONT, LABEL, Paper, Rope, SOUND, Slab, fall, impact, lin, yank } from "../system";

// «El M&M marrón» — clon de la estructura de un reel (clon-hookie/references/ref3): dato curioso de un famoso
// (el contrato de Van Halen pedía un bol de M&M's sin ninguno marrón; era una prueba de que habían leído el contrato)
// → adaptado a lo que vende Hook House: los «M&M's marrones» de un video (subtítulo mal escrito, corte que salta,
// audio que satura). Paleta ALTERA; el único color fuera de paleta es el marrón, porque el guion lo nombra.
// Voz: Rodrigo Zabú (eleven_v4) → public/audio/voz_marron.wav; tiempos: produccion/salto/alinear.py (texto + silencios).

const T = timing(caps);
const { W, E, talkAt } = T;
export const MARRON_FRAMES = T.frames;

const BROWN = "#7A4A2A";
const BROWN_HI = "#9C6640";
const FLOOR = 1500;
const KEYS = [12, 17, 31, 35, 45, 51, 61, 67, 70, 75, 79, 88, 94];

// Escenas (por índice de palabra)
const S2 = W(13); // cancelar y cobrar
const S3 = W(23); // capricho → trampa
const S4 = W(32); // el contrato
const S5 = W(48); // si aparecía uno: revisaban todo
const S6 = W(62); // tu video
const S7 = W(80); // tu cliente
const S8 = W(89); // Hook House los saca
const S9 = W(100); // CTA

// ---------- utilería ----------
const Candy: React.FC<{ x: number; y: number; r?: number; brown?: boolean; tone?: number; rot?: number; s?: number }> = ({ x, y, r = 34, brown, tone = 0, rot = 0, s = 1 }) => {
  const fills = ["#FBF8F2", "#E6DFD2", "#CFC6B6", "#3A3732"];
  const fill = brown ? BROWN : fills[tone % fills.length];
  const ink = brown || tone % 4 === 3 ? "#FBF8F2" : A.ink;
  return (
    <svg width={r * 2.4} height={r * 2} viewBox={`${-r * 1.2} ${-r} ${r * 2.4} ${r * 2}`} style={{ position: "absolute", left: x - r * 1.2, top: y - r, overflow: "visible", transform: `rotate(${rot}deg) scale(${s})` }}>
      <ellipse rx={r * 1.15} ry={r * 0.9} fill={fill} stroke={A.ink} strokeWidth={5} />
      {brown ? <ellipse cx={-r * 0.35} cy={-r * 0.35} rx={r * 0.35} ry={r * 0.18} fill={BROWN_HI} /> : null}
      <text y={r * 0.32} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.95} fill={ink}>
        m
      </text>
    </svg>
  );
};

const BOWL = { x: 640, y: 1150, w: 420 };
const pile = Array.from({ length: 26 }, (_, k) => ({
  dx: ((k * 97) % 360) - 180,
  dy: -((k * 53) % 120) - 20 - Math.floor(k / 9) * 30,
  tone: k % 4,
  rot: (k * 37) % 360,
  at: 2 + k * 2, // cae en el fotograma
}));
const Bowl: React.FC<{ f: number; fps: number; brownAt?: number; brownOut?: number; hideBrown?: boolean }> = ({ f, fps, brownAt, brownOut = 0, hideBrown }) => {
  const { x, y, w } = BOWL;
  return (
    <>
      <ContactShadow x={x} y={y + 150} w={w * 0.9} />
      {pile.map((c, k) => {
        if (f < c.at) return null;
        const p = fall(f - c.at, fps);
        return <Candy key={k} x={x + c.dx} y={y + c.dy - (1 - p) * 1300} tone={c.tone} rot={c.rot} />;
      })}
      {brownAt !== undefined && f >= brownAt && !hideBrown ? (
        <Candy x={x + 40 - 700 * brownOut} y={y - 150 - spring({ frame: f - brownAt, fps, config: { damping: 9, stiffness: 260 } }) * 20 - 500 * brownOut} r={40} brown rot={-10 + 400 * brownOut} />
      ) : null}
      <svg width={w + 40} height={190} viewBox={`0 0 ${w + 40} 190`} style={{ position: "absolute", left: x - w / 2 - 20, top: y - 40, overflow: "visible" }}>
        <path d={`M20 10 L${w + 20} 10 Q${w + 10} 180 ${(w + 40) / 2} 180 Q30 180 20 10 Z`} fill="#FBF8F2" stroke={A.ink} strokeWidth={8} strokeLinejoin="round" />
        <path d={`M${(w + 40) / 2 - 70} 180 L${(w + 40) / 2 - 90} 190 L${(w + 40) / 2 + 90} 190 L${(w + 40) / 2 + 70} 180`} fill={A.ink} />
      </svg>
    </>
  );
};

const Stamp: React.FC<{ text: string; x: number; y: number; f: number; at: number; color?: string; rot?: number; size?: number }> = ({ text, x, y, f, at, color = A.ink, rot = -8, size = 96 }) => {
  if (f < at) return null;
  const p = spring({ frame: f - at, fps: 30, config: { damping: 12, stiffness: 320 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${2 - p})`, opacity: Math.min(1, p * 1.5), border: `10px solid ${color}`, borderRadius: 18, padding: "6px 26px 12px", fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: "-0.04em", color, whiteSpace: "nowrap", background: "rgba(242,237,227,0.85)" }}>
      {text}
    </div>
  );
};

// Contrato: una pila de hojas; en el medio, la página del artículo 126
const Contract: React.FC<{ f: number; fps: number; drop: number; open: number }> = ({ f, fps, drop, open }) => {
  const p = fall(f - drop, fps);
  const sq = 0.4 * impact(f - drop - 7);
  const x = 600;
  const base = 1230;
  return (
    <>
      <ContactShadow x={x} y={base + 6} w={480} />
      <div style={{ position: "absolute", left: x - 230, top: base - 330 - (1 - p) * 1400, width: 460, height: 330, transformOrigin: "50% 100%", transform: `scale(${1 + 0.1 * sq}, ${1 - 0.2 * sq})` }}>
        {Array.from({ length: 22 }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: (k % 3) * 3, top: 330 - (k + 1) * 15, width: 450, height: 15, background: k % 2 ? "#FBF8F2" : "#EFE9DD", border: `3px solid ${A.ink}`, boxSizing: "border-box", borderRadius: 3 }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: -64, width: 456, height: 56, background: "#FBF8F2", border: `5px solid ${A.ink}`, borderRadius: 6, fontFamily: LABEL, fontSize: 26, color: A.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>CONTRATO DE GIRA</div>
      </div>
      {open > 0 ? (
        <div style={{ position: "absolute", left: x - 230 + 540 * open - 290, top: base - 470 - 120 * open, width: 520, height: 330, background: "#FBF8F2", border: `6px solid ${A.ink}`, borderRadius: 10, boxShadow: "0 18px 30px rgba(14,13,11,0.25)", transform: `rotate(${-6 + 4 * open}deg)`, opacity: Math.min(1, open * 3), padding: 26, boxSizing: "border-box" }}>
          <div style={{ fontFamily: LABEL, fontSize: 26, color: A.grey }}>ARTÍCULO 126</div>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ height: 12, width: `${80 - k * 12}%`, background: "#E6DFD2", borderRadius: 6, marginTop: 14 }} />
          ))}
          <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: A.ink, lineHeight: 1.05 }}>
            NI UN M&M <span style={{ color: BROWN }}>MARRÓN</span>
          </div>
          <div style={{ position: "absolute", right: 30, bottom: 26 }}>
            <Candy x={0} y={0} r={34} brown />
          </div>
        </div>
      ) : null}
    </>
  );
};

// Escenario con focos; Hookie lo revisa con una lupa
const Stage: React.FC<{ f: number; scan: number }> = ({ f, scan }) => (
  <>
    <div style={{ position: "absolute", left: 60, right: 60, top: 1290, height: 70, background: A.ink, borderRadius: 10 }} />
    {[220, 540, 860].map((x, k) => (
      <svg key={x} width={300} height={700} style={{ position: "absolute", left: x - 150, top: 560, opacity: 0.5 + 0.5 * Math.abs(Math.sin(f * 0.05 + k)) }}>
        <polygon points="130,20 170,20 290,730 10,730" fill="rgba(14,13,11,0.07)" />
        <rect x={120} y={0} width={60} height={34} rx={8} fill={A.ink} />
      </svg>
    ))}
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <div key={k} style={{ position: "absolute", left: 110 + k * 150, top: 1268, width: 90, height: 22, borderRadius: 6, background: lin(scan, k / 6, k / 6 + 0.05) > 0.5 ? A.ink : "#CFC6B6" }} />
    ))}
  </>
);

const Magnifier: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={200} height={200} viewBox="0 0 200 200" style={{ position: "absolute", left: x - 70, top: y - 70, overflow: "visible" }}>
    <circle cx={70} cy={70} r={54} fill="rgba(251,248,242,0.5)" stroke={A.ink} strokeWidth={14} />
    <line x1={110} y1={110} x2={170} y2={170} stroke={A.ink} strokeWidth={22} strokeLinecap="round" />
  </svg>
);

// Teléfono con «tu video»: subtítulo, imagen y audio, cada defecto marcado con un M&M marrón
const PH = { x: 540, y: 960, w: 470, h: 820 };
const Phone: React.FC<{ f: number; typo: number; jump: number; clip: number; marks: number[]; out: number; fixed: boolean }> = ({ f, typo, jump, clip, marks, out, fixed }) => {
  const { x, y, w, h } = PH;
  const shake = jump > 0 && Math.floor(f / 4) % 2 === 0 ? 26 : 0;
  const bars = 18;
  return (
    <>
      <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 48, background: A.ink, boxShadow: "0 22px 40px rgba(14,13,11,0.25)" }}>
        <div style={{ position: "absolute", inset: 16, borderRadius: 34, background: "#E6DFD2", overflow: "hidden" }}>
          {/* la imagen del video: Hookie hablando a cámara (salta en el corte malo) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: w - 32, height: h - 32, transform: fixed ? undefined : `translate(${shake}px, ${-shake / 2}px) scale(${shake ? 1.12 : 1})` }}>
            <Gancho x={(w - 32) / 2} y={560} scale={0.75} t={f / 30} expr="happy" armL={30} armR={50} talk={Math.abs(Math.sin(f * 0.6))} />
          </div>
          {/* subtítulo */}
          <div style={{ position: "absolute", left: 20, right: 20, top: 590, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: A.ink }}>
            {fixed || typo <= 0 ? "Hola a todos" : "Hola a todso"}
            {typo > 0 && !fixed ? <div style={{ margin: "4px auto 0", width: 120, height: 6, borderRadius: 3, background: BROWN, transform: `translateX(70px) scaleX(${typo})` }} /> : null}
          </div>
          {/* forma de onda del audio */}
          <svg width={w - 32} height={120} style={{ position: "absolute", left: 0, bottom: 30 }}>
            <line x1={20} x2={w - 52} y1={10} y2={10} stroke={clip > 0 && !fixed ? BROWN : "transparent"} strokeWidth={4} strokeDasharray="10 8" />
            {Array.from({ length: bars }, (_, k) => {
              const amp = 20 + 35 * Math.abs(Math.sin(k * 1.3 + f * 0.25));
              const hot = clip > 0 && !fixed ? Math.min(100, amp * (1 + 1.6 * clip)) : amp;
              return <rect key={k} x={24 + k * ((w - 80) / bars)} y={110 - hot} width={12} height={hot} rx={4} fill={hot >= 100 ? BROWN : A.ink} />;
            })}
          </svg>
        </div>
      </div>
      {/* M&M's marrones sobre cada defecto: subtítulo · imagen · audio */}
      {[
        { x: x + 170, y: y + 180 },
        { x: x - 170, y: y - 250 },
        { x: x + 170, y: y + 330 },
      ].map((m, k) =>
        marks[k] > 0 ? <Candy key={k} x={m.x - 900 * out * (k % 2 ? -1 : 1)} y={m.y - 600 * out} r={38} brown s={marks[k]} rot={600 * out} /> : null,
      )}
    </>
  );
};

const Meter: React.FC<{ f: number; level: number }> = ({ level }) => (
  <div style={{ position: "absolute", left: 120, top: 560, width: 840 }}>
    <div style={{ fontFamily: LABEL, fontSize: 30, color: A.ink, marginBottom: 14 }}>CONFIANZA DEL CLIENTE</div>
    <div style={{ height: 70, borderRadius: 35, border: `7px solid ${A.ink}`, overflow: "hidden", background: "#FBF8F2" }}>
      <div style={{ height: "100%", width: `${level * 100}%`, background: level < 0.4 ? BROWN : A.ink, transition: "none" }} />
    </div>
    <div style={{ marginTop: 10, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: A.ink }}>{Math.round(level * 100)} %</div>
  </div>
);

export const Marron: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const talk = talkAt(f);
  let scene: React.ReactNode = null;
  let hide = false;

  if (f < S2) {
    // 1 · el bol de M&M's; en «marrón» aparece uno y Hookie lo arranca con la línea
    const hookAt = W(12) - 4;
    const yankAt = W(12) + 10;
    const yk = yank(f - yankAt, 8);
    const g: GanchoPose = { x: 250, y: FLOOR, scale: 0.85, t, expr: f >= W(12) ? "focused" : "happy", armL: 30, armR: f >= hookAt ? 110 : 40, lean: f >= hookAt ? -6 - 6 * lin(f, hookAt, yankAt) : 0, hookOut: f >= hookAt, look: { x: 1, y: -0.3 }, talk };
    const ant = antennaWorld(g);
    scene = (
      <>
        <div style={{ position: "absolute", left: 72, top: 470, fontFamily: LABEL, fontSize: 30, color: A.ink, opacity: lin(f, 0, 6) }}>VAN HALEN · CONTRATO DE GIRA</div>
        <Bowl f={f} fps={fps} brownAt={W(12) - 6} brownOut={yk} />
        {f >= hookAt && yk < 1 ? <Rope ax={ant.x} ay={ant.y} bx={BOWL.x + 40 - 700 * yk - 40} by={BOWL.y - 160 - 500 * yk} slack={lin(f, hookAt, hookAt + 8, 0.8, 0.05)} buzz={f >= hookAt + 8 ? 0.5 : 0} t={t} /> : null}
        <ContactShadow x={250} y={FLOOR} w={230} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S3) {
    // 2 · «cancelar el concierto y cobrarlo entero»
    const g: GanchoPose = { x: 250, y: FLOOR, scale: 0.85, t, expr: f >= W(17) ? "surprised" : "normal", armL: 30, armR: 40, look: { x: 1, y: -0.5 }, talk };
    scene = (
      <>
        <Slab text="CONCIERTO" x={600} y={900} size={150} lift={(1 - fall(f - S2, fps)) * 1000} squash={0.4 * impact(f - S2 - 6)} />
        <Stamp text="CANCELADO" x={600} y={830} f={f} at={W(17)} />
        {f >= W(21) ? <Slab text="COBRADO 100 %" x={560} y={1200} size={104} color={A.orange} lift={(1 - fall(f - W(21), fps)) * 1200} squash={0.5 * impact(f - W(21) - 6)} /> : null}
        <ContactShadow x={250} y={FLOOR} w={230} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S4) {
    // 3 · «capricho de estrella» → «trampa»
    const trap = f >= W(31) - 2;
    const g: GanchoPose = { x: 540, y: FLOOR, scale: 0.95, t, expr: trap ? "smug" : "happy", armL: trap ? 40 : 150, armR: trap ? 120 : 150, look: { x: 0, y: -0.6 }, talk };
    scene = (
      <>
        {!trap ? (
          <>
            <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ position: "absolute", left: 390, top: 520, transform: `scale(${spring({ frame: f - W(25), fps, config: { damping: 10 } })}) rotate(${f * 2}deg)` }}>
              <path d="M0 -120 L32 -38 L118 -38 L48 14 L74 98 L0 48 L-74 98 L-48 14 L-118 -38 L-32 -38 Z" fill="#FBF8F2" stroke={A.ink} strokeWidth={10} strokeLinejoin="round" />
            </svg>
            <Slab text="CAPRICHO" x={540} y={1000} size={140} lift={(1 - fall(f - W(25), fps)) * 900} squash={0.4 * impact(f - W(25) - 6)} />
          </>
        ) : (
          <Slab text="TRAMPA" x={540} y={1000} size={190} color={A.orange} lift={(1 - fall(f - (W(31) - 2), fps)) * 900} squash={0.55 * impact(f - W(31) + 2 - 6)} />
        )}
        <ContactShadow x={540} y={FLOOR} w={250} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S5) {
    // 4 · el contrato gordo; en el medio, el artículo de los M&M's
    const drop = W(35) - 6;
    const open = lin(f, W(45), W(45) + 10, 0, 1, (x) => 1 - (1 - x) ** 3);
    const squashed = f >= drop + 6 && f < drop + 20;
    const g: GanchoPose = { x: 200, y: FLOOR, scale: 0.8, t, expr: squashed ? "surprised" : f >= W(45) ? "focused" : "normal", armL: 30, armR: f >= W(44) ? 100 : 40, squash: squashed ? 0.25 * impact(f - drop - 6) : 0, look: { x: 1, y: -0.4 }, talk };
    scene = (
      <>
        {f >= drop ? <Contract f={f} fps={fps} drop={drop} open={open} /> : null}
        <ContactShadow x={200} y={FLOOR} w={210} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S6) {
    // 5 · si aparecía un marrón → nadie leyó el contrato → revisaban todo el escenario
    const scan = lin(f, W(58), W(62) - 4);
    const g: GanchoPose = { x: 140 + 800 * scan, y: FLOOR, scale: 0.8, t, expr: "focused", armL: 30, armR: 95, walk: scan > 0 && scan < 1 ? f * 0.8 : undefined, look: { x: 1, y: 0.5 }, talk };
    const hand = { x: g.x + 120, y: FLOOR - 250 };
    scene = (
      <>
        {f < W(57) ? (
          <>
            <Candy x={540} y={760} r={70} brown s={spring({ frame: f - W(48), fps, config: { damping: 10 } })} />
            <Stamp text="NADIE LO LEYÓ" x={540} y={1050} f={f} at={W(52)} size={84} />
          </>
        ) : (
          <>
            <Stage f={f} scan={scan} />
            <Magnifier x={hand.x} y={hand.y} />
          </>
        )}
        <ContactShadow x={g.x} y={FLOOR} w={210} />
        <Gancho {...g} />
      </>
    );
  } else if (f < S8) {
    // 6–7 · tu video y sus M&M's marrones; después, la confianza del cliente cae
    const marks = [W(69), W(73), W(77)].map((a) => (f >= a ? spring({ frame: f - a, fps, config: { damping: 9, stiffness: 260 } }) : 0));
    if (f < S7) {
      scene = <Phone f={f} typo={lin(f, W(69), W(69) + 8)} jump={f >= W(73) && f < W(76) ? 1 : 0} clip={lin(f, W(77), W(77) + 6)} marks={marks} out={0} fixed={false} />;
    } else {
      const level = lin(f, W(86), W(88) + 8, 1, 0.2);
      const g: GanchoPose = { x: 540, y: FLOOR, scale: 0.95, t, expr: level < 0.5 ? "surprised" : "normal", armL: 30, armR: 40, look: { x: 0, y: -0.6 }, talk };
      scene = (
        <>
          <Meter f={f} level={level} />
          <ContactShadow x={540} y={FLOOR} w={250} />
          <Gancho {...g} />
        </>
      );
    }
  } else if (f < S9) {
    // 8 · Hook House saca los marrones antes de que los vea (segundo tirón de la línea)
    const hookAt = W(92) - 2;
    const yankAt = W(94);
    const yk = yank(f - yankAt, 9);
    const fixed = f >= yankAt + 9;
    const g: GanchoPose = { x: 170, y: FLOOR, scale: 0.8, t, expr: fixed ? "smug" : "strain", armL: 30, armR: 110, lean: f >= hookAt && !fixed ? -8 : 0, hookOut: f >= hookAt && !fixed, look: { x: 1, y: -0.5 }, talk };
    const ant = antennaWorld(g);
    scene = (
      <>
        <Phone f={f} typo={1} jump={0} clip={1} marks={fixed ? [0, 0, 0] : [1, 1, 1]} out={yk} fixed={fixed} />
        {f >= hookAt && !fixed ? <Rope ax={ant.x} ay={ant.y} bx={PH.x - 170 - 900 * yk} by={PH.y - 250 - 600 * yk} slack={lin(f, hookAt, hookAt + 8, 0.8, 0.05)} buzz={f >= hookAt + 8 ? 0.5 : 0} t={t} /> : null}
        <Stamp text="SIN MARRONES" x={540} y={1450} f={f} at={W(97)} color={A.orange} size={70} rot={-4} />
        <ContactShadow x={170} y={FLOOR} w={200} />
        <Gancho {...g} />
      </>
    );
  } else {
    const g: GanchoPose = { x: 300, y: FLOOR, scale: 0.9, t, expr: "happy", armL: 40, armR: 140, look: { x: 1, y: -0.6 }, talk };
    scene = (
      <>
        <Cta f={f} fps={fps} tEscr={W(100)} tHook={W(101)} tMuestra={W(103)} until={MARRON_FRAMES + 10} verb="Escribinos" lines={["SIN M&M'S", "MARRONES"]} />
        <ContactShadow x={300} y={FLOOR} w={230} />
        <Gancho {...g} />
      </>
    );
    hide = true;
  }

  return (
    <Paper>
      {scene}
      {hide ? null : <Captions words={T.words} f={f} fps={fps} keys={KEYS} top={250} size={78} />}
      <Audio src={staticFile("audio/voz_marron.wav")} />

      {/* sonido propio: tensión · tirón · impacto */}
      <Snd at={8} src={SOUND.impacto} vol={0.35} />
      <Snd at={W(12) - 4} src={SOUND.tension} vol={0.35} />
      <Snd at={W(12) + 10} src={SOUND.tiron} vol={0.6} />
      <Snd at={S2 + 6} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(17)} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(21) + 6} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(25) + 6} src={SOUND.impacto} vol={0.4} />
      <Snd at={W(31) + 4} src={SOUND.impacto} vol={0.8} />
      <Snd at={W(35)} src={SOUND.impacto} vol={0.9} />
      <Snd at={W(45)} src={SOUND.tiron} vol={0.35} />
      <Snd at={W(48)} src={SOUND.impacto} vol={0.4} />
      <Snd at={W(52)} src={SOUND.impacto} vol={0.7} />
      {[W(69), W(73), W(77)].map((a) => (
        <Snd key={a} at={a} src={SOUND.impacto} vol={0.4} />
      ))}
      <Sequence from={W(86)} durationInFrames={E(88) - W(86) + 10}>
        <Audio src={staticFile("sfx/hh/tension_subida.wav")} volume={0.25} />
      </Sequence>
      <Snd at={W(92) - 2} src={SOUND.tension} vol={0.35} />
      <Snd at={W(94)} src={SOUND.tiron} vol={0.6} />
      <Snd at={W(97)} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(101)} src={SOUND.impacto} vol={0.6} />
      <Snd at={W(103)} src={SOUND.impacto} vol={0.5} />
    </Paper>
  );
};

// ---------- portada (1080 × 1920) ----------
export const MarronPortada: React.FC = () => (
  <Paper>
    <div style={{ position: "absolute", left: 72, top: 300, width: 900, fontFamily: FONT, fontWeight: 800, fontSize: 104, lineHeight: 1.0, letterSpacing: "-0.045em", color: A.ink }}>
      Tu video tiene
      <br />
      un M&M <span style={{ color: BROWN }}>marrón</span>
    </div>
    <Bowl f={200} fps={30} brownAt={0} />
    <ContactShadow x={250} y={FLOOR} w={230} />
    <Gancho x={250} y={FLOOR} scale={0.85} t={1} expr="surprised" armL={30} armR={110} look={{ x: 1, y: -0.3 }} />
  </Paper>
);
