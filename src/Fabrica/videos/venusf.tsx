import type { Caption } from "@remotion/captions";
import c1 from "../../data/captions-venusf-1.json";
import c2 from "../../data/captions-venusf-2.json";
import c3 from "../../data/captions-venusf-3.json";
import c4 from "../../data/captions-venusf-4.json";
import c5 from "../../data/captions-venusf-5.json";
import { SOUND } from "../../Altera/system";
import type { Video } from "../Motor";
import { Barras, C, CTAComentar, Cake, Ingot, Label, Pill, Planeta, PortadaTexto, Reto, Snail, Space, Sparks, Studio, Sun, Surface, Thermo, bump, eio, eo, ln, pop } from "../kit";

// «Un día en Venus» rehecho con la fábrica (prueba del motor): mismo audio y subtítulos que el original
// (src/Altera/reels/Venus.tsx), escenas escritas como especificación. Dato y fuentes: produccion/venus/entrega.md.
const DIA = "#FF8A3D";
const SKY = "#7CC4FF";
const MERC = "#B8C4D6";

export const venusf: Video = {
  slug: "venusf",
  titulo: "Un día en Venus",
  captions: [c1, c2, c3, c4, c5] as Caption[][],
  fondo: "#07060E",
  colores: [
    [/^(venus|planeta)$/i, C.gold],
    [/^(día|días)$/i, DIA],
    [/^(año|años)$/i, C.green],
    [/^(revés|oeste|sol)$/i, SKY],
    [/^(caliente|grados|plomo|derretir)$/i, C.red],
    [/^(mercurio)$/i, MERC],
  ],

  gancho: (c) => {
    const { f, fps, v } = c;
    if (v === 1) {
      const seg = c.i("2");
      const orbA = f * 0.06;
      return (
        <>
          <Space f={f} />
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}>
            <Planeta x={270} y={1150} r={200} rot={f * 0.02} f={f} marker />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}>
            <Sun x={810} y={1150} r={80} f={f} />
            <Planeta x={810 + 210 * Math.cos(orbA)} y={1150 + 210 * Math.sin(orbA)} r={42} rot={0} f={f} />
          </div>
          {f >= c.w("día") ? <Pill x={270} y={760} text="UN DÍA" s={pop(f, c.w("día"), fps)} size={66} rot={-3} /> : null}
          {f >= c.w("año") ? <Pill x={810} y={760} text="UN AÑO" s={pop(f, c.w("año"), fps)} size={66} rot={3} dark /> : null}
          <Reto f={f} fps={fps} aparece={c.W(seg)} desde={c.E(seg) + 2} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 2 || v === 4) {
      const p = ln(f, c.w("día") - 4, c.w("año") + 10, 0, 1, eo);
      return (
        <>
          <Space f={f} tint="#2A1410" />
          <Planeta x={540} y={v === 4 ? 1120 : 1000} r={v === 4 ? 300 : 230} rot={f * 0.01} f={f} marker arrow={v === 4 ? ln(f, 4, 30) : 0} dir={-1} />
          {v === 4 && f < c.w("día") - 4 ? <Snail x={540} y={826} s={0.8} f={f} /> : null}
          {f >= c.w("día") - 4 ? <Barras f={f} fps={fps} p={p} base={1500} alto={560} mayorEn={c.w("año") + 8} a={{ etiqueta: "DÍA", valor: 243, texto: "243 días", color: DIA }} b={{ etiqueta: "AÑO", valor: 225, texto: "225 días", color: C.green }} /> : null}
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    if (v === 3) {
      const day = ln(f, 0, c.w("termine") + 10, 0, 0.92);
      return (
        <>
          <Surface f={f} />
          <Cake x={540} y={1420} s={1.1 * (1 + 0.03 * Math.sin(f * 0.4))} f={f} />
          <Pill x={540} y={1610} text="VENUS" s={0.9 + 0.03 * Math.sin(f * 0.3)} size={56} dark />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <circle cx={540} cy={820} r={130} fill="rgba(10,8,14,0.7)" stroke="#FFFFFF" strokeWidth={8} />
            <circle cx={540} cy={820} r={130} fill="none" stroke={DIA} strokeWidth={14} strokeDasharray={`${day * 2 * Math.PI * 130} 999`} transform="rotate(-90 540 820)" />
            <line x1={540} y1={820} x2={540 + 100 * Math.sin(day * 2 * Math.PI)} y2={820 - 100 * Math.cos(day * 2 * Math.PI)} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />
          </svg>
          {f >= c.w("termine") ? <Pill x={540} y={1010} text="el día sigue…" s={pop(f, c.w("termine"), fps)} size={56} dark /> : null}
          <Sparks f={f} at={c.w("cumplirías")} x={540} y={1150} n={22} color={C.gold} spread={360} />
          <Label text="ILUSTRACIÓN" x={72} y={1780} />
        </>
      );
    }
    const rise = ln(f, c.w("oeste") - 18, c.w("oeste") + 12, 0, 1, eo);
    return (
      <>
        <Surface f={f} sunrise={rise} />
        <Pill x={190} y={1330} text="OESTE" s={f >= c.w("oeste") ? pop(f, c.w("oeste"), fps) : 0.0001} size={60} rot={-3} />
        <Pill x={900} y={1330} text="ESTE" s={0.8} size={50} dark />
        <Label text="ILUSTRACIÓN" x={72} y={1780} />
      </>
    );
  },

  escenas: [
    {
      id: "giro",
      desde: (c) => c.W(c.i("tarda") - 1) - 3,
      dibujar: (c) => {
        const t243 = c.w("243", c.i("tarda"));
        const days = Math.round(ln(c.f, c.inicio + 2, t243 + 2, 1, 243, eio));
        return (
          <>
            <Space f={c.f} tint="#2A1410" />
            <Planeta x={540} y={1150} r={330} rot={ln(c.f, c.inicio, c.fin, 0, Math.PI * 1.6)} f={c.f} marker />
            <Pill x={540} y={700} text={`DÍA ${days}`} s={(1 + 0.12 * bump(c.f, t243 + 2)) * (1 + 0.03 * Math.sin(c.f * 0.5))} size={96} rot={2 * Math.sin(c.f * 0.15)} />
            {c.f >= c.w("vuelta", c.i("tarda")) ? <Pill x={540} y={1600} text="1 vuelta sobre sí misma" s={pop(c.f, c.w("vuelta", c.i("tarda")), c.fps)} size={52} dark /> : null}
            <Sparks f={c.f} at={t243 + 2} x={540} y={700} n={18} color={DIA} spread={320} />
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "orbita",
      desde: (c) => c.w("pero", c.i("tarda")) - 2,
      dibujar: (c) => {
        const t225 = c.w("225", c.i("tarda"));
        const a = ln(c.f, c.inicio, t225 + 4, -Math.PI / 2, Math.PI * 1.5, eio);
        const days = Math.round(ln(c.f, c.inicio, t225 + 4, 0, 225, eio));
        return (
          <>
            <Space f={c.f} />
            <Sun x={540} y={1150} r={110} f={c.f} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <circle cx={540} cy={1150} r={360} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={4} strokeDasharray="14 14" />
              <path d={`M540 790 A360 360 0 ${a + Math.PI / 2 > Math.PI ? 1 : 0} 1 ${540 + 360 * Math.cos(a)} ${1150 + 360 * Math.sin(a)}`} stroke={C.green} strokeWidth={12} fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 12px rgba(74,222,128,0.8))" }} />
            </svg>
            <Planeta x={540 + 360 * Math.cos(a)} y={1150 + 360 * Math.sin(a)} r={62} rot={0} f={c.f} />
            <Pill x={540} y={680} text={`AÑO: ${days} días`} s={(1 + 0.12 * bump(c.f, t225 + 4)) * (1 + 0.03 * Math.sin(c.f * 0.5))} size={80} rot={2 * Math.sin(c.f * 0.15)} />
            <Sparks f={c.f} at={t225 + 4} x={540} y={790} n={18} color={C.green} spread={300} />
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "compara",
      desde: (c) => c.w("o", c.i("225", c.i("tarda"))) - 2,
      dibujar: (c) => {
        const io = c.i("o", c.i("225", c.i("tarda")));
        const tDia = c.w("día", io);
        const tAno = c.w("año", c.i("día", io));
        return (
          <>
            <Studio f={c.f} tint="#2A1A30" />
            <Barras f={c.f} fps={c.fps} p={ln(c.f, tDia - 6, tAno + 8, 0, 1, eo)} mayorEn={tAno + 8} a={{ etiqueta: "DÍA", valor: 243, texto: "243 días", color: DIA }} b={{ etiqueta: "AÑO", valor: 225, texto: "225 días", color: C.green }} />
            <Sparks f={c.f} at={tAno + 8} x={540} y={1100} n={22} color={C.white} spread={380} />
          </>
        );
      },
    },
    {
      id: "reves",
      desde: (c) => c.W(c.i("gira", c.i("año", c.i("tarda"))) - 1) - 2,
      dibujar: (c) => {
        const tReves = c.w("revés", c.i("tarda"));
        const tOeste = c.w("oeste", c.i("tarda"));
        const flip = ln(c.f, tReves - 4, tReves + 8);
        return (
          <>
            <Surface f={c.f} sunrise={ln(c.f, tOeste - 14, tOeste + 14, 0, 1, eo)} />
            <div style={{ position: "absolute", left: 760, top: 560, width: 260, height: 220, borderRadius: 30, background: "rgba(16,13,20,0.7)" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center", fontFamily: "Poppins", fontWeight: 600, fontSize: 24, letterSpacing: "0.14em", color: "rgba(255,255,255,0.7)" }}>VENUS GIRA</div>
              <svg width={260} height={180} viewBox="0 0 260 180" style={{ position: "absolute", left: 0, top: 40 }}>
                <circle cx={130} cy={80} r={46} fill="#E2A157" />
                <g transform={`translate(130 80) scale(${1 - 2 * flip} 1)`}>
                  <path d="M-80 30 A86 30 0 0 0 80 30" stroke={SKY} strokeWidth={10} fill="none" strokeLinecap="round" />
                  <path d="M80 30 l-26 -16 l2 30 Z" fill={SKY} />
                </g>
              </svg>
            </div>
            {c.f >= tReves ? <Pill x={890} y={830} text="AL REVÉS" s={pop(c.f, tReves, c.fps)} size={50} rot={3} /> : null}
            {c.f >= tOeste ? <Pill x={190} y={1330} text="OESTE" s={pop(c.f, tOeste, c.fps)} size={60} rot={-3} /> : null}
            <Pill x={900} y={1330} text="ESTE" s={0.8} size={50} dark />
            <Sparks f={c.f} at={tOeste + 6} x={190} y={900} n={18} color="#FFE2A8" spread={300} />
            <Label text="ILUSTRACIÓN" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "mercurio",
      desde: (c) => c.w("encima") - 2,
      dibujar: (c) => {
        const iM = c.i("mercurio", c.i("encima"));
        const m = c.f >= c.W(iM) - 2 ? pop(c.f, c.W(iM) - 2, c.fps) : 0;
        return (
          <>
            <Space f={c.f} />
            <Sun x={-40} y={1150} r={260} f={c.f} />
            <Planeta x={820} y={1150} r={130} rot={c.f * 0.01} f={c.f} />
            {m > 0 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                <g transform={`translate(440 1150) scale(${m})`}>
                  <circle r={70} fill="#9EA6B4" />
                  <circle cx={-20} cy={-18} r={12} fill="#7E8696" />
                  <circle cx={24} cy={20} r={16} fill="#7E8696" />
                </g>
                <line x1={250} y1={1330} x2={250 + 140 * m} y2={1330} stroke={MERC} strokeWidth={10} strokeLinecap="round" />
                <line x1={250} y1={1390} x2={250 + 520 * m} y2={1390} stroke={C.gold} strokeWidth={10} strokeLinecap="round" />
              </svg>
            ) : null}
            {m > 0 ? <Pill x={440} y={970} text="MERCURIO" s={m} size={50} dark /> : null}
            <Pill x={820} y={940} text="VENUS" s={pop(c.f, c.inicio + 4, c.fps)} size={50} />
            {c.f >= c.W(iM + 2) ? <Pill x={440} y={1480} text="más cerca del Sol" s={pop(c.f, c.W(iM + 2), c.fps)} size={50} rot={-2} /> : null}
            <Label text="ILUSTRACIÓN · NO A ESCALA" x={72} y={1780} />
          </>
        );
      },
    },
    {
      id: "calor",
      desde: (c) => c.w("venus", c.i("mercurio", c.i("encima"))) - 2,
      dibujar: (c) => {
        const tCal = c.w("caliente", c.i("encima"));
        const t450 = c.w("450", c.i("encima"));
        const p = ln(c.f, tCal - 4, t450 + 6, 0, 1, eio);
        return (
          <>
            <Space f={c.f} tint="#3A0E08" />
            <Planeta x={330} y={1150} r={250} rot={c.f * 0.01} f={c.f} heat={p} />
            <Thermo x={820} y={1500} p={p} f={c.f} />
            <Pill x={820} y={640} text={`${Math.round(450 * p)} °C`} s={(1 + 0.15 * bump(c.f, t450 + 6)) * (1 + 0.03 * Math.sin(c.f * 0.5))} size={100} rot={2 * Math.sin(c.f * 0.15)} />
            <Sparks f={c.f} at={t450 + 6} x={820} y={760} n={22} color={C.red} spread={360} />
            {c.f >= tCal ? <Pill x={330} y={1520} text="el más caliente" s={pop(c.f, tCal, c.fps)} size={52} dark /> : null}
          </>
        );
      },
    },
    {
      id: "plomo",
      desde: (c) => c.w("alcanza") - 2,
      dibujar: (c) => {
        const tPlomo = c.w("plomo", c.i("alcanza"));
        return (
          <>
            <Surface f={c.f} heat={1} />
            <Ingot x={540} y={1440} melt={ln(c.f, tPlomo - 6, c.fin, 0, 1)} f={c.f} />
            {c.f >= tPlomo ? <Pill x={540} y={760} text="el plomo se derrite a 327 °C" s={pop(c.f, tPlomo, c.fps)} size={48} dark rot={-2 + 2 * Math.sin(c.f * 0.2)} /> : null}
            <Sparks f={c.f} at={tPlomo + 4} x={540} y={1380} n={20} color="#FFB347" spread={300} />
          </>
        );
      },
    },
    {
      id: "cta",
      subtitulos: false,
      desde: (c) => c.w("comentá") - 2,
      dibujar: (c) => <CTAComentar f={c.f} fps={c.fps} at={c.inicio + 2} palabra="Venus" nota="si no lo sabías 🤯" abajo={<Planeta x={540} y={1450} r={190} rot={c.f * 0.01} f={c.f} />} />,
    },
  ],

  impactos: (c) => {
    const ib = c.i("tarda");
    const g = c.v === 1 ? c.E(c.i("2")) + 62 : c.v === 2 || c.v === 4 ? c.w("año") + 8 : c.v === 3 ? c.w("cumplirías") : c.w("oeste");
    return [g, c.w("243", ib) + 2, c.w("225", ib) + 4, c.w("revés", ib), c.w("oeste", ib), c.w("mercurio", ib), c.w("450", ib) + 6, c.w("plomo", ib) + 4];
  },
  pops: (c) => {
    const ib = c.i("tarda");
    return [c.w("vuelta", ib), c.w("revés", ib), c.w("oeste", ib), c.w("mercurio", ib) - 2, c.w("caliente", ib), c.w("plomo", ib)];
  },
  sfx: (c) => {
    const ib = c.i("tarda");
    const out = [
      { at: c.W(ib - 1), src: SOUND.tension, vol: 0.25 },
      { at: c.w("243", ib) + 2, src: SOUND.impacto, vol: 0.55 },
      { at: c.w("pero", ib), src: SOUND.tiron, vol: 0.35 },
      { at: c.w("225", ib) + 4, src: "sfx/hit.wav", vol: 0.5 },
      { at: c.w("año", c.i("o", c.i("225", ib))) + 8, src: SOUND.impacto, vol: 0.7 },
      { at: c.w("revés", ib), src: "sfx/rebobinar.wav", vol: 0.4 },
      { at: c.w("oeste", ib), src: "sfx/cristal.wav", vol: 0.35 },
      { at: c.w("mercurio", ib), src: "sfx/hit.wav", vol: 0.4 },
      { at: c.w("caliente", ib), src: "sfx/fuego.wav", vol: 0.35 },
      { at: c.w("450", ib) + 6, src: SOUND.impacto, vol: 0.7 },
      { at: c.w("plomo", ib), src: "sfx/fuego.wav", vol: 0.3 },
      ...[0, 1, 2, 3, 4].map((k) => ({ at: c.w("comentá") + 10 + k * 3, src: "sfx/click.wav", vol: 0.25 })),
      { at: c.w("comentá") + 40, src: "sfx/pop.wav", vol: 0.55 },
    ];
    if (c.v === 1) {
      const t0 = c.E(c.i("2")) + 2;
      out.push(...[0, 15, 30, 45].map((k) => ({ at: t0 + k, src: "sfx/click.wav", vol: 0.45 })), { at: t0 + 60, src: SOUND.impacto, vol: 0.6 });
    } else {
      const g = c.v === 2 || c.v === 4 ? c.w("año") + 8 : c.v === 3 ? c.w("cumplirías") : c.w("oeste");
      out.push({ at: g, src: SOUND.impacto, vol: 0.6 });
    }
    return out;
  },
  temblor: (_c, escena) => (escena === "calor" || escena === "plomo" ? 3 : 0),
  capa: (c, escena) => (escena === "calor" || escena === "plomo" ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(255,90,40,${0.08 + 0.04 * Math.sin(c.f * 0.3)}) 0%, rgba(0,0,0,0) 70%)` }} /> : null),

  portada: (v) => (
    <PortadaTexto
      size={v === 3 ? 88 : 96}
      lineas={v === 3 ? ["En Venus cumplirías", "años antes de que", "termine el día 🎂"] : ["En Venus,", "¿qué dura más?", "¿Un día o un año?"]}
      fondo={
        <>
          <Space f={20} tint="#2A1410" />
          <Planeta x={540} y={1300} r={360} rot={0.6} f={20} marker={v !== 3} />
          {v === 3 ? <Cake x={540} y={960} s={0.9} f={20} /> : null}
        </>
      }
    />
  ),
};
