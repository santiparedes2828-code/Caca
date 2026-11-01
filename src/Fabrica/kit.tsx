import React from "react";
import { AbsoluteFill, spring } from "remotion";
import { BigName, C, Grain, Pill, Sparks, Studio, Tap, Vignette, bump, ln, pop } from "../Altera/reels/Servilleta";
import { PF } from "./Motor";

// Fábrica viral · kit de piezas genéricas (sirven para cualquier tema). Las ilustraciones de temas ya hechos se
// reexportan abajo para reutilizarlas: fondos, personajes (siluetas sin cara), objetos, planetas, etc.
export { Auction, BigName, Bokeh, C, Coins, DarkPhone, Dust, Grain, Label, Pill, PriceCard, Sparks, Stars, Studio, Tap, Vignette, bump, decay, drop, eio, eo, ln, pop, rnd } from "../Altera/reels/Servilleta";
export { Cake, Ingot, Snail, Space, Sun, Surface, Thermo, Venus as Planeta } from "../Altera/reels/Venus";
export { CaesarBust, CleoBust, Desert, MoonScene, NearFar, Pyramid, Rocket } from "../Altera/reels/Cleopatra";
export { Hero, Shop } from "../Altera/reels/Medialuna";

/** Reto en tiempo real: anillo que se vacía en `segundos` desde el cuadro `desde`, con la cuenta en el centro. */
export const Reto: React.FC<{ f: number; fps: number; aparece: number; desde: number; segundos?: number; x?: number; y?: number; r?: number; color?: string }> = ({ f, fps, aparece, desde, segundos = 2, x = 540, y = 1560, r = 150, color = C.gold }) => {
  if (f < aparece) return null;
  const dur = segundos * fps;
  const k = Math.max(0, Math.min(1, (f - desde) / dur));
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={x} cy={y} r={r} fill="rgba(10,8,14,0.7)" stroke="rgba(255,255,255,0.15)" strokeWidth={12} />
        <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(1 - k) * 2 * Math.PI * r} ${2 * Math.PI * r}`} transform={`rotate(-90 ${x} ${y})`} style={{ filter: `drop-shadow(0 0 12px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", left: x - 200, width: 400, top: y - 55, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 90, color: C.white, transform: `scale(${pop(f, aparece, fps) * (1 + 0.15 * bump(f, desde + dur))})` }}>{(segundos * (1 - k)).toFixed(1).replace(".", ",")}</div>
    </>
  );
};

/** Comparación en barras verticales (la forma más legible en 9:16). `p` 0..1 hace crecer las barras; `mayorEn` muestra «>». */
export const Barras: React.FC<{ f: number; fps: number; p: number; a: { etiqueta: string; valor: number; texto: string; color: string }; b: { etiqueta: string; valor: number; texto: string; color: string }; mayorEn?: number; base?: number; alto?: number }> = ({ f, fps, p, a, b, mayorEn, base = 1560, alto = 760 }) => {
  const max = Math.max(a.valor, b.valor);
  const hs = [alto * (a.valor / max) * p, alto * (b.valor / max) * ln(p, 0.15, 1)];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {[a, b].map((x, i) => {
        const cx = i === 0 ? 300 : 780;
        const h = hs[i];
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: cx - 120, top: base - h, width: 240, height: h, borderRadius: "28px 28px 8px 8px", background: `linear-gradient(180deg, ${x.color}, ${x.color}88)`, boxShadow: `0 0 40px ${x.color}66` }} />
            <div style={{ position: "absolute", left: cx - 220, width: 440, top: base + 20, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 60, color: x.color, textShadow: `0 0 24px ${x.color}` }}>{x.etiqueta}</div>
            {h > 80 ? <Pill x={cx} y={base - h - 60} text={x.texto} s={Math.min(1, h / 200)} size={50} /> : null}
          </React.Fragment>
        );
      })}
      {mayorEn !== undefined && f >= mayorEn ? <div style={{ position: "absolute", left: 470, width: 140, top: base - alto * 0.6, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: 150, color: C.white, transform: `scale(${pop(f, mayorEn, fps) * (1 + 0.05 * Math.sin(f * 0.4))})`, textShadow: "0 0 30px rgba(255,255,255,0.6)" }}>{hs[0] >= hs[1] ? ">" : "<"}</div> : null}
    </div>
  );
};

/** Sello que cae y golpea («NI CERCA», «FALSO», «MITO»). */
export const Estampa: React.FC<{ f: number; fps: number; at: number; texto: string; color?: string; y?: number }> = ({ f, fps, at, texto, color = C.red, y = 860 }) => {
  if (f < at) return null;
  const s = Math.min(1, (f - at) / 6);
  const sp = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 260 } });
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translate(-50%, -50%) rotate(-10deg) scale(${2.2 - 1.2 * Math.min(1, sp)})`, opacity: s, border: `14px solid ${color}`, borderRadius: 28, padding: "10px 46px 18px", color, fontFamily: PF, fontWeight: 800, fontSize: 130, letterSpacing: "0.02em", background: "rgba(20,10,14,0.55)", boxShadow: `0 0 40px ${color}80`, whiteSpace: "nowrap" }}>
      {texto}
    </div>
  );
};

/** Pantalla dividida en diagonal con línea de luz: dos mundos en un mismo cuadro (gran fotograma 0). */
export const Dividida: React.FC<{ f: number; izq: React.ReactNode; der: React.ReactNode; corte?: [number, number] }> = ({ f, izq, der, corte = [58, 42] }) => (
  <>
    <AbsoluteFill style={{ clipPath: `polygon(0 0, ${corte[0]}% 0, ${corte[1]}% 100%, 0 100%)` }}>{izq}</AbsoluteFill>
    <AbsoluteFill style={{ clipPath: `polygon(${corte[0]}% 0, 100% 0, 100% 100%, ${corte[1]}% 100%)` }}>{der}</AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={(1080 * corte[0]) / 100} y1={0} x2={(1080 * corte[1]) / 100} y2={1920} stroke="#FFF6E6" strokeWidth={8} opacity={0.8 + 0.2 * Math.sin(f * 0.4)} style={{ filter: "drop-shadow(0 0 16px rgba(255,246,230,0.9))" }} />
    </svg>
  </>
);

/** CTA «Seguime»: nombre grande, botón que late, mano que toca y tarjeta opcional con el motivo concreto. */
export const CTASeguir: React.FC<{ f: number; fps: number; at: number; tarjeta?: { etiqueta: string; texto: React.ReactNode; desde: number }; abajo?: React.ReactNode }> = ({ f, fps, at, tarjeta, abajo }) => {
  const btn = at + 4;
  return (
    <>
      <Studio f={f} tint="#3A2030" />
      <BigName text="Seguime" f={f} at={at} fps={fps} y={520} size={150} />
      <div style={{ position: "absolute", left: 540, top: 800, transform: `translate(-50%, -50%) scale(${pop(f, btn, fps) * (1 + 0.06 * Math.sin(f * 0.4))})`, padding: "18px 80px 24px", borderRadius: 26, background: C.orange, color: C.white, fontFamily: PF, fontWeight: 800, fontSize: 64, boxShadow: `0 10px 0 rgba(0,0,0,0.4), 0 0 ${40 + 30 * Math.sin(f * 0.4)}px rgba(255,106,43,0.6)` }}>Seguir</div>
      <Tap x={600} y={830} f={f} from={btn + 8} />
      {tarjeta && f >= tarjeta.desde ? (
        <div style={{ position: "absolute", left: 540, top: 1060, transform: `translate(-50%, -50%) scale(${pop(f, tarjeta.desde, fps)}) rotate(${1.2 * Math.sin(f * 0.15)}deg)`, width: 820, borderRadius: 28, background: "rgba(16,13,20,0.92)", borderLeft: `8px solid ${C.gold}`, padding: "26px 0 30px", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: PF, fontWeight: 600, fontSize: 28, letterSpacing: "0.2em", color: "rgba(255,255,255,0.6)" }}>{tarjeta.etiqueta}</div>
          <div style={{ fontFamily: PF, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.15 }}>{tarjeta.texto}</div>
        </div>
      ) : null}
      {abajo}
      <Sparks f={f} at={btn} x={540} y={800} n={22} color={C.orange} spread={360} />
    </>
  );
};

/** CTA «Comentá <palabra>»: la palabra se escribe en una caja de comentario, se envía y salen corazones. */
export const CTAComentar: React.FC<{ f: number; fps: number; at: number; palabra: string; nota?: string; color?: string; abajo?: React.ReactNode }> = ({ f, fps, at, palabra, nota, color = C.gold, abajo }) => {
  const typed = palabra.slice(0, Math.max(0, Math.floor((f - at - 10) / 3)));
  const sent = f >= at + 10 + palabra.length * 3 + 12;
  const tSent = at + 10 + palabra.length * 3 + 12;
  return (
    <>
      <Studio f={f} tint="#3A2030" />
      <BigName text="Comentá" f={f} at={at} fps={fps} y={480} size={140} />
      <div style={{ position: "absolute", left: 90, top: 780, width: 900, height: 150, borderRadius: 40, background: "rgba(16,13,20,0.92)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", transform: `scale(${pop(f, at + 4, fps)})` }}>
        <div style={{ position: "absolute", left: 30, top: 35, width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${C.orange})` }} />
        <div style={{ position: "absolute", left: 140, top: 38, fontFamily: PF, fontWeight: 800, fontSize: 64, color: sent ? color : C.white }}>
          {typed}
          {!sent && Math.floor(f / 8) % 2 ? "|" : ""}
        </div>
        <div style={{ position: "absolute", right: 30, top: 35, width: 80, height: 80, borderRadius: "50%", background: sent ? C.green : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PF, fontWeight: 800, fontSize: 44, color: C.white }}>↑</div>
      </div>
      {sent && nota ? <Pill x={540} y={1040} text={nota} s={pop(f, tSent, fps)} size={54} /> : null}
      <Tap x={930} y={860} f={f} from={tSent - 6} />
      {sent
        ? Array.from({ length: 6 }, (_, i) => {
            const k = ((f - tSent + i * 6) % 36) / 36;
            return <div key={i} style={{ position: "absolute", left: 860 + 40 * Math.sin(i * 2 + k * 6), top: 760 - 300 * k, fontSize: 54, opacity: 1 - k }}>❤️</div>;
          })
        : null}
      {abajo}
      <Sparks f={f} at={tSent} x={540} y={850} n={22} color={color} spread={380} />
    </>
  );
};

/** Portada estándar: fondo de la escena del gancho + 2 líneas blancas + 1 línea en pastilla crema. */
export const PortadaTexto: React.FC<{ fondo: React.ReactNode; lineas: string[]; size?: number }> = ({ fondo, lineas, size = 96 }) => (
  <AbsoluteFill style={{ background: "#0E0B12" }}>
    {fondo}
    <Vignette />
    <div style={{ position: "absolute", left: 30, width: 1020, top: 240, textAlign: "center", fontFamily: PF, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: "-0.02em", color: C.white, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>
      {lineas.map((l, k) =>
        k === lineas.length - 1 ? (
          <div key={k} style={{ display: "inline-block", marginTop: 14, padding: "4px 36px 14px", borderRadius: 999, background: C.cream, color: C.ink, boxShadow: "0 12px 0 rgba(0,0,0,0.45)" }}>
            {l}
          </div>
        ) : (
          <div key={k}>{l}</div>
        ),
      )}
    </div>
    <Grain f={0} />
  </AbsoluteFill>
);
