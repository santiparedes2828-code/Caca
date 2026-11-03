import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import {
  APELLIDOS,
  DATOS,
  FPS,
  INTRO,
  OUTRO,
  PARTES,
  PORTADA,
  framesParte,
  framesTotales,
  bloques,
  subtitulosParte,
  type Parte,
} from "./datos";
import { EsquemaSVG, TITULOS } from "./Esquemas";
import { C, COLORES, FONT_B, FONT_T } from "./tema";

export const TRADUCCION_FRAMES = framesTotales();

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const sp = (f: number, d = 0, damping = 14) => spring({ frame: f - d, fps: FPS, config: { damping, stiffness: 120 } });

// ── Fondo: hoja cuadriculada ─────────────────────────────────────────────
const Hoja: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: C.papel,
      backgroundImage: `linear-gradient(${C.cuadricula} 2px, transparent 2px), linear-gradient(90deg, ${C.cuadricula} 2px, transparent 2px)`,
      backgroundSize: "48px 48px",
    }}
  >
    {/* margen rojo de cuaderno */}
    <div style={{ position: "absolute", left: 120, top: 0, bottom: 0, width: 3, background: "#F8A5A5" }} />
  </AbsoluteFill>
);

const Fundido: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const BASES = ["A", "U", "G", "C"];
const BASE_C: Record<string, string> = { A: C.rojo, U: C.amarillo, G: C.verde, C: C.azul };

const Ficha: React.FC<{ l: string; size?: number }> = ({ l, size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: BASE_C[l],
      border: `4px solid ${C.tinta}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT_T,
      fontWeight: 800,
      fontSize: size * 0.5,
      color: C.tinta,
      boxShadow: `4px 4px 0 ${C.tinta}`,
    }}
  >
    {l}
  </div>
);

const nombreCompleto = (n: string) => (APELLIDOS[n] ? `${n} ${APELLIDOS[n]}` : n);
const lineaDatos = () => [DATOS.colegio, DATOS.curso, DATOS.profe && `Prof. ${DATOS.profe}`, DATOS.fecha].filter(Boolean).join("  ·  ");

// ── Intro ────────────────────────────────────────────────────────────────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const seq = "AUGGCUUACGGAUAA";
  const subrayado = interpolate(f, [28, 50], [0, 1], clamp);
  const datos = lineaDatos();
  return (
    <Fundido dur={INTRO}>
      <Hoja />
      {/* tira de ARNm que entra arriba */}
      <div style={{ position: "absolute", top: 90, left: 220, display: "flex", gap: 10 }}>
        {seq.split("").map((l, i) => (
          <div key={i} style={{ transform: `translateY(${(1 - sp(f, i * 2)) * -200}px) rotate(${(i % 3) * 3 - 3}deg)` }}>
            <Ficha l={l} size={58} />
          </div>
        ))}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 220 }}>
        <div
          style={{
            display: "inline-block",
            alignSelf: "flex-start",
            background: C.verde,
            color: C.tinta,
            border: `4px solid ${C.tinta}`,
            borderRadius: 16,
            padding: "8px 24px",
            fontFamily: FONT_T,
            fontWeight: 800,
            fontSize: 36,
            transform: `scale(${sp(f, 8)}) rotate(-3deg)`,
            boxShadow: `5px 5px 0 ${C.tinta}`,
          }}
        >
          Biología
        </div>
        <div style={{ position: "relative", alignSelf: "flex-start", marginTop: 20 }}>
          <div
            style={{
              position: "absolute",
              left: -10,
              bottom: 24,
              height: 58,
              width: `${subrayado * 104}%`,
              background: C.amarillo,
              opacity: 0.7,
              borderRadius: 8,
              transform: "rotate(-1deg)",
            }}
          />
          <div
            style={{
              position: "relative",
              fontFamily: FONT_T,
              fontWeight: 800,
              fontSize: 170,
              lineHeight: 1.05,
              color: C.tinta,
              transform: `translateY(${(1 - sp(f, 14)) * 60}px)`,
              opacity: sp(f, 14),
            }}
          >
            La traducción
          </div>
        </div>
        <div
          style={{
            fontFamily: FONT_B,
            fontWeight: 500,
            fontSize: 44,
            color: C.gris,
            marginTop: 10,
            opacity: interpolate(f, [40, 55], [0, 1], clamp),
          }}
        >
          Cómo la célula convierte el ARN mensajero en proteínas
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 60, flexWrap: "wrap", maxWidth: 1500 }}>
          {PARTES.map((p, i) => (
            <div
              key={p.nombre}
              style={{
                transform: `scale(${sp(f, 70 + i * 6)})`,
                background: "#fff",
                border: `4px solid ${COLORES[i]}`,
                borderRadius: 999,
                padding: "10px 28px",
                fontFamily: FONT_T,
                fontWeight: 600,
                fontSize: 34,
                color: C.tinta,
              }}
            >
              {nombreCompleto(p.nombre)}
            </div>
          ))}
        </div>
        {datos && (
          <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 32, color: C.gris, marginTop: 34, opacity: interpolate(f, [110, 125], [0, 1], clamp) }}>
            {datos}
          </div>
        )}
      </AbsoluteFill>
      {/* proteína decorativa */}
      <div style={{ position: "absolute", right: 120, bottom: 120, width: 360, height: 360, opacity: interpolate(f, [30, 50], [0, 1], clamp) }}>
        <svg viewBox="-180 -180 360 360" width="100%" height="100%">
          {Array.from({ length: 14 }).map((_, k) => {
            const ang = k * 0.9 + f * 0.015;
            const r = 40 + (k % 4) * 30;
            return (
              <circle
                key={k}
                cx={Math.cos(ang) * r}
                cy={Math.sin(ang) * r}
                r={26 * sp(f, 40 + k * 3)}
                fill={[C.rosa, C.naranja, C.verde, C.azul][k % 4]}
                stroke={C.tinta}
                strokeWidth={4}
              />
            );
          })}
        </svg>
      </div>
    </Fundido>
  );
};

// ── Tarjeta antes de cada integrante ─────────────────────────────────────
const Portada: React.FC<{ p: Parte; i: number }> = ({ p, i }) => {
  const f = useCurrentFrame();
  const col = COLORES[i];
  return (
    <Fundido dur={PORTADA}>
      <Hoja />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 80 }}>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: col,
            border: `6px solid ${C.tinta}`,
            boxShadow: `10px 10px 0 ${C.tinta}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_T,
            fontWeight: 800,
            fontSize: 150,
            color: "#fff",
            transform: `scale(${sp(f)}) rotate(${(1 - sp(f)) * -90}deg)`,
          }}
        >
          {i + 1}
        </div>
        <div style={{ maxWidth: 1050 }}>
          <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 36, color: col, opacity: sp(f, 6), letterSpacing: 2 }}>
            PARTE {i + 1} DE {PARTES.length}
          </div>
          <div style={{ fontFamily: FONT_T, fontWeight: 800, fontSize: 120, color: C.tinta, lineHeight: 1.05, transform: `translateX(${(1 - sp(f, 8)) * 80}px)`, opacity: sp(f, 8) }}>
            {p.tema}
          </div>
          <div style={{ fontFamily: FONT_B, fontWeight: 500, fontSize: 42, color: C.gris, marginTop: 10, opacity: sp(f, 16) }}>{p.detalle}</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              marginTop: 34,
              background: "#fff",
              border: `4px solid ${col}`,
              borderRadius: 999,
              padding: "10px 30px",
              fontFamily: FONT_T,
              fontWeight: 600,
              fontSize: 40,
              color: C.tinta,
              transform: `scale(${sp(f, 22)})`,
            }}
          >
            🎤 {nombreCompleto(p.nombre)}
          </div>
        </div>
      </AbsoluteFill>
      <Progreso actual={i} />
    </Fundido>
  );
};

const Progreso: React.FC<{ actual: number }> = ({ actual }) => (
  <div style={{ position: "absolute", bottom: 46, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
    {PARTES.map((p, k) => (
      <div
        key={k}
        style={{
          width: k === actual ? 56 : 18,
          height: 18,
          borderRadius: 9,
          background: k <= actual ? COLORES[k] : "#D5DCE6",
          border: `3px solid ${C.tinta}`,
        }}
      />
    ))}
  </div>
);

// ── Segmento de cada integrante: clip + esquema + subtítulos ─────────────
const CLIP = { x: 150, y: 120, w: 1060, h: 596 };
const PANEL = { x: 1250, y: 120, w: 610, h: 596 };

const Segmento: React.FC<{ p: Parte; i: number }> = ({ p, i }) => {
  const f = useCurrentFrame();
  const dur = framesParte(p);
  const t = f / FPS;
  const subs = subtitulosParte(p);
  const sub = subs.find((s) => t >= s.desde && t < s.hasta);
  // la frase vigente manda el esquema (se queda la última hasta que empieza la siguiente)
  const vigente = [...subs].reverse().find((s) => t >= s.desde) ?? subs[0];
  const frase = vigente.frase;
  const inicioFrase = subs.find((s) => s.frase === frase)!.desde;
  const fe = f - Math.round(inicioFrase * FPS);
  const esquema = p.esquemas[frase];
  const col = COLORES[i];
  const entra = sp(f, 0, 18);

  return (
    <Fundido dur={dur}>
      <Hoja />
      {/* encabezado */}
      <div style={{ position: "absolute", left: CLIP.x, top: 40, display: "flex", alignItems: "center", gap: 16, fontFamily: FONT_T, fontWeight: 800, fontSize: 36, color: C.tinta }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: col, color: "#fff", border: `4px solid ${C.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {i + 1}
        </div>
        {p.tema}
      </div>

      {/* clip */}
      <div
        style={{
          position: "absolute",
          left: CLIP.x,
          top: CLIP.y,
          width: CLIP.w,
          height: CLIP.h,
          borderRadius: 28,
          overflow: "hidden",
          border: `6px solid ${C.tinta}`,
          boxShadow: `10px 10px 0 ${col}`,
          background: "#fff",
          transform: `translateY(${(1 - entra) * 40}px)`,
        }}
      >
        {bloques(p).map((b, k) => (
          <Sequence key={k} from={b.desde} durationInFrames={b.frames} layout="none">
            {b.tipo === "clip" && b.archivo ? (
              <AbsoluteFill>
                <Video
                  src={staticFile(b.archivo)}
                  muted
                  trimBefore={Math.round(b.recorteInicio * FPS)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(0.9)", transform: "scale(1.15)" }}
                />
                <Video
                  src={staticFile(b.archivo)}
                  trimBefore={Math.round(b.recorteInicio * FPS)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                />
              </AbsoluteFill>
            ) : (
              <EspacioClip p={p} col={col} segundos={Math.round(b.frames / FPS)} />
            )}
          </Sequence>
        ))}
      </div>

      {/* esquema */}
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 28,
          background: "#fff",
          border: `6px solid ${C.tinta}`,
          boxShadow: `10px 10px 0 ${C.tinta}`,
          transform: `translateY(${(1 - sp(f, 6, 18)) * 40}px)`,
          overflow: "hidden",
        }}
      >
        <div key={`t-${frase}`} style={{ padding: "18px 24px 0", fontFamily: FONT_T, fontWeight: 800, fontSize: 32, color: col, lineHeight: 1.1, opacity: interpolate(fe, [0, 8], [0, 1], clamp) }}>
          {TITULOS[esquema]}
        </div>
        <div key={`e-${frase}`} style={{ position: "absolute", left: 0, right: 0, top: 70, bottom: 0, opacity: interpolate(fe, [0, 8], [0, 1], clamp) }}>
          <EsquemaSVG e={esquema} f={Math.max(0, fe)} />
        </div>
      </div>

      {/* subtítulos */}
      <div style={{ position: "absolute", left: 150, right: 60, top: 760, height: 190, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {sub && (
          <div
            style={{
              background: "#fff",
              border: `4px solid ${C.tinta}`,
              borderRadius: 20,
              padding: "16px 34px",
              fontFamily: FONT_T,
              fontWeight: 600,
              fontSize: 46,
              lineHeight: 1.25,
              color: C.tinta,
              textAlign: "center",
              maxWidth: 1550,
              boxShadow: `6px 6px 0 ${col}`,
            }}
          >
            {sub.texto}
          </div>
        )}
      </div>
      <Progreso actual={i} />
    </Fundido>
  );
};

const EspacioClip: React.FC<{ p: Parte; col: string; segundos: number }> = ({ p, col, segundos }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#F4F7FB" }}>
      <div style={{ position: "absolute", inset: 24, border: `5px dashed ${col}`, borderRadius: 20, opacity: 0.7 }} />
      <div style={{ fontSize: 120, transform: `scale(${1 + 0.04 * Math.sin(f * 0.12)})` }}>🎬</div>
      <div style={{ fontFamily: FONT_T, fontWeight: 800, fontSize: 56, color: C.tinta, marginTop: 10 }}>Clip de {p.nombre}</div>
      <div style={{ fontFamily: FONT_B, fontWeight: 500, fontSize: 30, color: C.gris, marginTop: 8 }}>falta este clip · ~{segundos} s</div>
    </AbsoluteFill>
  );
};

// ── Outro ────────────────────────────────────────────────────────────────
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const datos = lineaDatos();
  return (
    <Fundido dur={OUTRO}>
      <Hoja />
      {/* fichas que caen como confeti */}
      {Array.from({ length: 22 }).map((_, k) => {
        const x = (k * 137) % 1820 + 50;
        const y = -120 + ((f * (3 + (k % 4)) + k * 90) % 1300);
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, transform: `rotate(${f * (k % 2 ? 2 : -2) + k * 20}deg)`, opacity: 0.85 }}>
            <Ficha l={BASES[k % 4]} size={46} />
          </div>
        );
      })}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            background: C.papel,
            border: `6px solid ${C.tinta}`,
            borderRadius: 40,
            boxShadow: `14px 14px 0 ${C.tinta}`,
            padding: "50px 90px",
            textAlign: "center",
            transform: `scale(${sp(f, 0, 12)})`,
          }}
        >
          <div style={{ fontFamily: FONT_T, fontWeight: 800, fontSize: 150, color: C.tinta, lineHeight: 1 }}>¡Gracias!</div>
          <div style={{ fontFamily: FONT_B, fontWeight: 500, fontSize: 38, color: C.gris, marginTop: 14 }}>Biología — La traducción</div>
          <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 28, color: C.gris, marginTop: 40, letterSpacing: 3 }}>INTEGRANTES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "14px 40px", marginTop: 16, justifyContent: "center" }}>
            {PARTES.map((p, i) => (
              <div key={p.nombre} style={{ fontFamily: FONT_T, fontWeight: 600, fontSize: 40, color: C.tinta, opacity: sp(f, 20 + i * 6), display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: COLORES[i], border: `3px solid ${C.tinta}` }} />
                {nombreCompleto(p.nombre)}
              </div>
            ))}
          </div>
          {datos && <div style={{ fontFamily: FONT_B, fontWeight: 700, fontSize: 30, color: C.gris, marginTop: 36, opacity: sp(f, 60) }}>{datos}</div>}
        </div>
      </AbsoluteFill>
    </Fundido>
  );
};

// ── Música: fuerte en intro/tarjetas/outro, muy bajita debajo de las voces ──
const MUSICA_ALTA = 0.45;
const MUSICA_BAJA = 0.05;

const tramos = () => {
  const out: { desde: number; hasta: number; alta: boolean }[] = [{ desde: 0, hasta: INTRO, alta: true }];
  let t = INTRO;
  for (const p of PARTES) {
    out.push({ desde: t, hasta: t + PORTADA, alta: true });
    t += PORTADA;
    out.push({ desde: t, hasta: t + framesParte(p), alta: false });
    t += framesParte(p);
  }
  out.push({ desde: t, hasta: t + OUTRO, alta: true });
  return out;
};

const volumenMusica = (f: number, total: number) => {
  const tr = tramos().find((x) => f >= x.desde && f < x.hasta) ?? { alta: true, desde: 0, hasta: total };
  let v = tr.alta ? MUSICA_ALTA : MUSICA_BAJA;
  // rampa de 15 frames al entrar en cada tramo
  const prev = tramos().find((x) => x.hasta === tr.desde);
  if (prev && f - tr.desde < 15) {
    const pv = prev.alta ? MUSICA_ALTA : MUSICA_BAJA;
    v = pv + (v - pv) * ((f - tr.desde) / 15);
  }
  const fade = interpolate(f, [0, 10, total - 45, total - 1], [0, 1, 1, 0], clamp);
  return v * fade;
};

export const Traduccion: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  let t = INTRO;
  return (
    <AbsoluteFill style={{ background: C.papel }}>
      <Sequence durationInFrames={INTRO}>
        <Intro />
      </Sequence>
      {PARTES.map((p, i) => {
        const inicio = t;
        t += PORTADA + framesParte(p);
        return (
          <React.Fragment key={p.nombre}>
            <Sequence from={inicio} durationInFrames={PORTADA}>
              <Portada p={p} i={i} />
            </Sequence>
            <Sequence from={inicio + PORTADA} durationInFrames={framesParte(p)}>
              <Segmento p={p} i={i} />
            </Sequence>
          </React.Fragment>
        );
      })}
      <Sequence from={t} durationInFrames={OUTRO}>
        <Outro />
      </Sequence>
      <Audio src={staticFile("traduccion/musica.wav")} loop volume={(f) => volumenMusica(f, durationInFrames)} />
    </AbsoluteFill>
  );
};
