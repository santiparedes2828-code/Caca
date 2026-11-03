import React from "react";
import { interpolate, spring } from "remotion";
import type { Esquema } from "./datos";
import { C, FONT_T, FONT_B } from "./tema";

// Panel 640 x 560 (viewBox). Cada esquema recibe f = frames desde que empezó.
const W = 640;
const H = 560;
const FPS = 30;

const sp = (f: number, delay = 0, damping = 14) =>
  spring({ frame: f - delay, fps: FPS, config: { damping, stiffness: 120 } });
const lin = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── Piezas ────────────────────────────────────────────────────────────────
const BASE_COLOR: Record<string, string> = { A: C.rojo, U: C.amarillo, T: C.amarillo, G: C.verde, C: C.azul };
const SEQ = "AUGGCUUACGGAUAA"; // AUG GCU UAC GGA UAA → Met Ala Tyr Gly STOP
const AA = [
  { n: "Met", c: C.rosa },
  { n: "Ala", c: C.naranja },
  { n: "Tyr", c: C.verde },
  { n: "Gly", c: C.azul },
];
const ANTI: Record<string, string> = { A: "U", U: "A", G: "C", C: "G" };

const BW = 34;
const BG = 4;
const X0 = (W - 15 * (BW + BG)) / 2;
const bx = (i: number) => X0 + i * (BW + BG);
const codonX = (i: number) => bx(i * 3) + (3 * (BW + BG) - BG) / 2;

const Base: React.FC<{ l: string; x: number; y: number; s?: number; o?: number; up?: boolean }> = ({ l, x, y, s = 1, o = 1, up }) => (
  <g opacity={o} transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={0} y={up ? -30 : 0} width={BW} height={30} rx={7} fill={BASE_COLOR[l]} stroke={C.tinta} strokeWidth={2} />
    <text x={BW / 2} y={up ? -9 : 21} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={18} fill={C.tinta}>
      {l}
    </text>
  </g>
);

const ARNm: React.FC<{ y: number; f: number; aparecer?: boolean; seq?: string; o?: number }> = ({ y, f, aparecer, seq = SEQ, o = 1 }) => (
  <g opacity={o}>
    <line x1={X0 - 14} x2={bx(seq.length - 1) + BW + 14} y1={y + 34} y2={y + 34} stroke={C.tinta} strokeWidth={5} strokeLinecap="round" />
    {seq.split("").map((l, i) => (
      <Base key={i} l={l} x={bx(i)} y={y} s={aparecer ? sp(f, i * 2) : 1} />
    ))}
    <text x={bx(seq.length - 1) + BW + 14} y={y + 104} textAnchor="end" fontFamily={FONT_B} fontWeight={700} fontSize={18} fill={C.gris}>
      ARN mensajero
    </text>
  </g>
);

const Ribosoma: React.FC<{ cx: number; y: number; o?: number; etiquetas?: number }> = ({ cx, y, o = 1, etiquetas = 0 }) => (
  <g opacity={o}>
    <ellipse cx={cx} cy={y - 40} rx={110} ry={78} fill={C.lila} fillOpacity={0.55} stroke={C.lilaOsc} strokeWidth={4} />
    <ellipse cx={cx} cy={y + 52} rx={92} ry={34} fill={C.lila} fillOpacity={0.55} stroke={C.lilaOsc} strokeWidth={4} />
    {etiquetas > 0 && (
      <g opacity={etiquetas} fontFamily={FONT_B} fontWeight={700} fontSize={18} fill={C.lilaOsc}>
        <text x={cx + 118} y={y - 90}>subunidad mayor</text>
        <text x={cx + 100} y={y + 70}>subunidad menor</text>
      </g>
    )}
  </g>
);

const Amino: React.FC<{ i: number; x: number; y: number; s?: number; r?: number }> = ({ i, x, y, s = 1, r = 24 }) => {
  const a = AA[i % AA.length];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={r} fill={a.c} stroke={C.tinta} strokeWidth={3} />
      <text y={6} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={r * 0.62} fill={C.tinta}>
        {a.n}
      </text>
    </g>
  );
};

// ARNt: aminoácido arriba, cuerpo en forma de trébol, anticodón abajo (la base de abajo queda en y).
const ARNt: React.FC<{ codon: number; x: number; y: number; s?: number; conAA?: boolean; etiquetas?: number }> = ({ codon, x, y, s = 1, conAA = true, etiquetas = 0 }) => {
  const cod = SEQ.slice(codon * 3, codon * 3 + 3);
  const anti = cod.split("").map((b) => ANTI[b]);
  const w3 = 3 * (BW + BG) - BG;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path
        d={`M ${-14} -40 L ${-14} -95 M 14 -40 L 14 -95`}
        stroke={C.tinta}
        strokeWidth={4}
      />
      <rect x={-22} y={-150} width={44} height={70} rx={14} fill={C.celeste} stroke={C.tinta} strokeWidth={3} />
      <circle cx={-46} cy={-115} r={22} fill={C.celeste} stroke={C.tinta} strokeWidth={3} />
      <circle cx={46} cy={-115} r={22} fill={C.celeste} stroke={C.tinta} strokeWidth={3} />
      <rect x={-w3 / 2 - 6} y={-72} width={w3 + 12} height={42} rx={10} fill={C.celeste} stroke={C.tinta} strokeWidth={3} />
      {anti.map((l, k) => (
        <Base key={k} l={l} x={-w3 / 2 + k * (BW + BG)} y={-67} />
      ))}
      <line x1={0} y1={-150} x2={0} y2={-172} stroke={C.tinta} strokeWidth={4} />
      {conAA && <Amino i={codon} x={0} y={-196} />}
      {etiquetas > 0 && (
        <g opacity={etiquetas} fontFamily={FONT_B} fontWeight={700} fontSize={18} fill={C.tinta}>
          <text x={36} y={-200}>aminoácido</text>
          <text x={w3 / 2 + 14} y={-44}>anticodón</text>
        </g>
      )}
    </g>
  );
};

const Celula: React.FC<{ f: number; nucleo?: number; citoplasma?: number }> = ({ f, nucleo = 0, citoplasma = 0 }) => (
  <g>
    <ellipse cx={320} cy={290} rx={290} ry={220} fill={C.celulaFondo} stroke={C.verdeOsc} strokeWidth={6} />
    <circle cx={250} cy={280} r={105} fill={C.nucleo} stroke={C.lilaOsc} strokeWidth={5} strokeDasharray={nucleo > 0 ? "0" : "14 8"} />
    {/* ADN dentro del núcleo */}
    {Array.from({ length: 12 }).map((_, i) => {
      const x = 180 + i * 12.5;
      const ph = i * 0.7 + f * 0.08;
      const y1 = 280 + Math.sin(ph) * 28;
      const y2 = 280 - Math.sin(ph) * 28;
      return (
        <g key={i}>
          <line x1={x} x2={x} y1={y1} y2={y2} stroke={C.gris} strokeWidth={2} />
          <circle cx={x} cy={y1} r={6} fill={C.azul} />
          <circle cx={x} cy={y2} r={6} fill={C.rosa} />
        </g>
      );
    })}
    {/* ribosomas en el citoplasma */}
    {[[470, 190], [500, 360], [420, 430], [140, 420], [120, 170], [540, 270]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x},${y + Math.sin(f * 0.06 + i) * 4})`}>
        <ellipse cy={-6} rx={16} ry={11} fill={C.lila} stroke={C.lilaOsc} strokeWidth={2} />
        <ellipse cy={8} rx={13} ry={6} fill={C.lila} stroke={C.lilaOsc} strokeWidth={2} />
      </g>
    ))}
    {nucleo > 0 && (
      <Etiqueta x={250} y={160} o={nucleo} color={C.lilaOsc}>
        Núcleo
      </Etiqueta>
    )}
    {citoplasma > 0 && (
      <Etiqueta x={470} y={500} o={citoplasma} color={C.verdeOsc}>
        Citoplasma
      </Etiqueta>
    )}
  </g>
);

const Etiqueta: React.FC<{ x: number; y: number; o?: number; color?: string; size?: number; children: React.ReactNode }> = ({ x, y, o = 1, color = C.tinta, size = 26, children }) => (
  <text x={x} y={y} textAnchor="middle" opacity={o} fontFamily={FONT_T} fontWeight={800} fontSize={size} fill={color} stroke={C.papel} strokeWidth={6} paintOrder="stroke">
    {children}
  </text>
);

const Flecha: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number; color?: string }> = ({ x1, y1, x2, y2, p = 1, color = C.tinta }) => {
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={p > 0.02 ? 1 : 0}>
      <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <path
        d={`M ${x} ${y} L ${x - 16 * Math.cos(ang - 0.5)} ${y - 16 * Math.sin(ang - 0.5)} M ${x} ${y} L ${x - 16 * Math.cos(ang + 0.5)} ${y - 16 * Math.sin(ang + 0.5)}`}
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </g>
  );
};

const Caja: React.FC<{ x: number; y: number; w: number; h: number; color: string; s?: number; texto: string; sub?: string; dim?: boolean }> = ({ x, y, w, h, color, s = 1, texto, sub, dim }) => (
  <g transform={`translate(${x + w / 2},${y + h / 2}) scale(${s})`} opacity={dim ? 0.35 : 1}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={color} stroke={C.tinta} strokeWidth={4} />
    <text y={sub ? -4 : 10} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={30} fill={C.tinta}>
      {texto}
    </text>
    {sub && (
      <text y={26} textAnchor="middle" fontFamily={FONT_B} fontWeight={500} fontSize={17} fill={C.tinta}>
        {sub}
      </text>
    )}
  </g>
);

// Cadena de aminoácidos (n puede ser fraccionario: el último entra con escala)
const Cadena: React.FC<{ x: number; y: number; n: number; dx?: number; dy?: number; r?: number; enlaces?: number }> = ({ x, y, n, dx = -46, dy = -30, r = 22, enlaces = 0 }) => {
  const items = Math.ceil(n);
  return (
    <g>
      {Array.from({ length: items }).map((_, k) => {
        const s = k < Math.floor(n) ? 1 : n - Math.floor(n);
        const px = x + k * dx;
        const py = y + k * dy;
        return (
          <g key={k}>
            {k > 0 && (
              <line x1={px - dx} y1={py - dy} x2={px} y2={py} stroke={enlaces > 0 ? C.naranja : C.tinta} strokeWidth={enlaces > 0 ? 7 : 5} opacity={s} />
            )}
            <Amino i={items - 1 - k} x={px} y={py} s={s} r={r} />
          </g>
        );
      })}
    </g>
  );
};

// Escena de traducción completa: ARNm + ribosoma en el codón `pos` + cadena saliendo.
const Traduccion: React.FC<{ f: number; pos: number; cadena: number; trna?: number; enlaces?: number; ribo?: number }> = ({ f, pos, cadena, trna = 0, enlaces = 0, ribo = 1 }) => {
  const y = 380;
  const cx = codonX(Math.min(pos, 4));
  return (
    <g>
      <ARNm y={y} f={f} />
      {trna > 0 && <ARNt codon={Math.round(pos)} x={cx} y={y} s={1} conAA={false} />}
      <Ribosoma cx={cx} y={y} o={ribo} />
      {cadena > 0 && <Cadena x={cx - 20} y={y - 120} n={cadena} enlaces={enlaces} />}
    </g>
  );
};

// ── Escenas ──────────────────────────────────────────────────────────────
export const TITULOS: Record<Esquema, string> = {
  pregunta: "¿Cómo se fabrican las proteínas?",
  celula: "Todo empieza en la célula",
  proteinas: "Las proteínas",
  flujo: "Dos procesos",
  "flujo-traduccion": "Hoy: la traducción",
  "transcripcion-intro": "Primero: la transcripción",
  copia: "Un gen se copia en ARN mensajero",
  nucleo: "Sucede en el núcleo",
  salida: "El ARNm sale al citoplasma",
  "llega-ribosoma": "Empieza la traducción",
  ribosoma: "El ribosoma",
  lectura: "Lee el ARN mensajero",
  codones: "Codones: grupos de 3 bases",
  "codon-aa": "Cada codón, un aminoácido",
  sigue: "Sigue las instrucciones",
  arnt: "El ARN de transferencia",
  transporte: "Transporta aminoácidos",
  anticodon: "Anticodón + codón",
  entrega: "Entrega el aminoácido",
  orden: "En el orden indicado",
  enlace: "Enlaces peptídicos",
  cadena: "Cadena polipeptídica",
  avanza: "El ribosoma avanza",
  stop: "Codón de terminación",
  plegado: "La proteína se pliega",
  resumen: "En resumen",
  participantes: "¿Quiénes participan?",
  funciones: "Funciones de las proteínas",
  fundamental: "Fundamental para la célula",
};

const Proteina: React.FC<{ f: number; cx: number; cy: number; s?: number; plegar?: number }> = ({ f, cx, cy, s = 1, plegar = 1 }) => {
  const n = 12;
  return (
    <g transform={`translate(${cx},${cy}) scale(${s})`}>
      {Array.from({ length: n }).map((_, k) => {
        const recto = { x: (k - (n - 1) / 2) * 44, y: 0 };
        const ang = k * 0.95 + f * 0.01;
        const rad = 30 + (k % 4) * 18;
        const plegado = { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.85 };
        const x = recto.x + (plegado.x - recto.x) * plegar;
        const y = recto.y + (plegado.y - recto.y) * plegar;
        return <circle key={k} cx={x} cy={y} r={20} fill={AA[k % 4].c} stroke={C.tinta} strokeWidth={3} />;
      })}
    </g>
  );
};

export const EsquemaSVG: React.FC<{ e: Esquema; f: number }> = ({ e, f }) => {
  let body: React.ReactNode = null;
  switch (e) {
    case "pregunta": {
      body = (
        <g>
          <Proteina f={f} cx={320} cy={300} s={sp(f) * 1.6} />
          <text x={320} y={330 + Math.sin(f * 0.1) * 6} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={200} fill={C.tinta} opacity={sp(f, 10)} stroke={C.papel} strokeWidth={12} paintOrder="stroke">
            ?
          </text>
        </g>
      );
      break;
    }
    case "celula":
    case "fundamental": {
      body = (
        <g transform={`translate(320,290) scale(${0.8 + 0.2 * sp(f)}) translate(-320,-290)`}>
          <Celula f={f} nucleo={e === "celula" ? lin(f, 20, 35) : 0} />
          {e === "celula" && <Etiqueta x={250} y={420} o={lin(f, 35, 50)} color={C.azul}>ADN</Etiqueta>}
          {e === "fundamental" && (
            <g transform={`translate(320,290) scale(${sp(f, 15)})`}>
              <circle r={70} fill={C.verde} stroke={C.tinta} strokeWidth={5} />
              <path d="M -32 0 L -8 26 L 36 -24" stroke={C.tinta} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
      );
      break;
    }
    case "proteinas": {
      body = (
        <g>
          <Proteina f={f} cx={320} cy={250} s={sp(f) * 1.4} plegar={1} />
          <Etiqueta x={320} y={470} o={lin(f, 15, 30)} size={30}>
            Cadenas de aminoácidos
          </Etiqueta>
        </g>
      );
      break;
    }
    case "flujo":
    case "flujo-traduccion":
    case "transcripcion-intro":
    case "resumen": {
      const hiT = e === "transcripcion-intro";
      const hiR = e === "flujo-traduccion";
      body = (
        <g>
          <Caja x={190} y={30} w={260} h={90} color={C.azulClaro} texto="ADN" s={sp(f)} />
          <Flecha x1={320} y1={130} x2={320} y2={210} p={lin(f, 10, 25)} />
          <text x={345} y={180} fontFamily={FONT_B} fontWeight={700} fontSize={22} fill={hiR ? C.gris : C.lilaOsc} opacity={lin(f, 15, 25)}>
            transcripción {hiT ? "←" : ""}
          </text>
          <Caja x={190} y={220} w={260} h={90} color={C.amarilloClaro} texto="ARNm" sub="ARN mensajero" s={sp(f, 20)} />
          <Flecha x1={320} y1={320} x2={320} y2={400} p={lin(f, 30, 45)} />
          <text x={345} y={370} fontFamily={FONT_B} fontWeight={700} fontSize={22} fill={hiT ? C.gris : C.naranja} opacity={lin(f, 35, 45)}>
            traducción {hiR ? "←" : ""}
          </text>
          <Caja x={190} y={410} w={260} h={90} color={C.rosaClaro} texto="Proteína" s={sp(f, 40)} />
          {(hiT || hiR) && (
            <rect
              x={130}
              y={hiT ? 135 : 325}
              width={380}
              height={70}
              rx={35}
              fill="none"
              stroke={hiT ? C.lilaOsc : C.naranja}
              strokeWidth={5}
              strokeDasharray="12 8"
              opacity={lin(f, 45, 60)}
            />
          )}
        </g>
      );
      if (e === "resumen") {
        body = (
          <g>
            <Caja x={190} y={30} w={260} h={90} color={C.amarilloClaro} texto="ARNm" sub="la información" s={sp(f)} />
            <Flecha x1={320} y1={130} x2={320} y2={210} p={lin(f, 10, 25)} color={C.naranja} />
            <text x={345} y={180} fontFamily={FONT_B} fontWeight={700} fontSize={22} fill={C.naranja} opacity={lin(f, 15, 25)}>
              traducción
            </text>
            <g transform={`translate(320,320) scale(${sp(f, 25)}) translate(-320,-320)`}>
              <Ribosoma cx={320} y={320} />
            </g>
            <Flecha x1={320} y1={410} x2={320} y2={440} p={lin(f, 35, 45)} color={C.naranja} />
            <Caja x={190} y={450} w={260} h={90} color={C.rosaClaro} texto="Proteína" s={sp(f, 45)} />
          </g>
        );
      }
      break;
    }
    case "copia": {
      const dna = "TACCGAATGCCT";
      const n = lin(f, 15, 90, 0, dna.length);
      body = (
        <g>
          <text x={40} y={110} fontFamily={FONT_B} fontWeight={700} fontSize={20} fill={C.gris}>
            gen del ADN
          </text>
          {dna.split("").map((l, i) => (
            <g key={i}>
              <Base l={l} x={bx(i + 1.5)} y={130} s={sp(f, i)} />
              <Base l={{ A: "T", T: "A", G: "C", C: "G" }[l] as string} x={bx(i + 1.5)} y={170} s={sp(f, i)} o={0.45} />
            </g>
          ))}
          {dna.split("").map((l, i) =>
            i < n ? <Base key={i} l={({ T: "A", A: "U", C: "G", G: "C" } as Record<string, string>)[l]} x={bx(i + 1.5)} y={320} s={Math.min(1, n - i)} /> : null,
          )}
          <Flecha x1={320} y1={220} x2={320} y2={305} p={lin(f, 5, 20)} color={C.lilaOsc} />
          <text x={40} y={400} fontFamily={FONT_B} fontWeight={700} fontSize={20} fill={C.naranja} opacity={lin(f, 20, 30)}>
            ARN mensajero (copia)
          </text>
          <Etiqueta x={320} y={480} o={lin(f, 40, 55)} size={24} color={C.gris}>
            En el ARN, la T se reemplaza por U
          </Etiqueta>
        </g>
      );
      break;
    }
    case "nucleo":
    case "salida": {
      const p = e === "salida" ? lin(f, 10, 70) : 0;
      const mx = 250 + p * 230;
      const my = 280 + p * 80;
      body = (
        <g>
          <Celula f={f} nucleo={e === "nucleo" ? lin(f, 10, 25) : 0.4} citoplasma={e === "salida" ? lin(f, 50, 65) : 0} />
          <path
            d={`M ${mx - 60} ${my} q 15 -20 30 0 t 30 0 t 30 0 t 30 0`}
            stroke={C.naranja}
            strokeWidth={9}
            fill="none"
            strokeLinecap="round"
            opacity={e === "nucleo" ? lin(f, 20, 35) : 1}
          />
          <Etiqueta x={mx} y={my + 50} o={e === "nucleo" ? lin(f, 30, 45) : 1} size={22} color={C.naranja}>
            ARNm
          </Etiqueta>
        </g>
      );
      break;
    }
    case "llega-ribosoma":
    case "ribosoma": {
      const llega = e === "llega-ribosoma" ? sp(f, 10, 20) : 1;
      body = (
        <g>
          <ARNm y={380} f={f} aparecer={e === "llega-ribosoma"} />
          <g transform={`translate(${(1 - llega) * -420},0)`}>
            <Ribosoma cx={codonX(1)} y={380} etiquetas={e === "ribosoma" ? lin(f, 20, 35) : 0} />
          </g>
          {e === "ribosoma" && (
            <Etiqueta x={codonX(1)} y={240} o={lin(f, 5, 20)} color={C.lilaOsc} size={30}>
              Ribosoma
            </Etiqueta>
          )}
        </g>
      );
      break;
    }
    case "lectura":
    case "sigue": {
      const pos = lin(f, 15, 150, 0, 4);
      body = (
        <g>
          <Traduccion f={f} pos={pos} cadena={0} />
          <Flecha x1={codonX(pos) + 120} y1={500} x2={codonX(pos) + 190} y2={500} p={lin(f, 5, 20)} color={C.lilaOsc} />
          <text x={40} y={540} fontFamily={FONT_B} fontWeight={700} fontSize={20} fill={C.gris}>
            se lee de izquierda a derecha →
          </text>
        </g>
      );
      break;
    }
    case "codones":
    case "codon-aa": {
      const tabla = e === "codon-aa";
      body = (
        <g transform={tabla ? `translate(0,${-lin(f, 0, 15) * 200})` : undefined}>
          <ARNm y={300} f={f} aparecer={!tabla} />
          {[0, 1, 2, 3, 4].map((i) => {
            const o = tabla ? 1 : lin(f, 25 + i * 10, 35 + i * 10);
            const x1 = bx(i * 3) - 2;
            const x2 = bx(i * 3 + 2) + BW + 2;
            return (
              <g key={i} opacity={o}>
                <path d={`M ${x1} 290 L ${x1} 275 L ${x2} 275 L ${x2} 290`} stroke={C.tinta} strokeWidth={3} fill="none" />
                <text x={(x1 + x2) / 2} y={265} textAnchor="middle" fontFamily={FONT_B} fontWeight={700} fontSize={16} fill={C.gris}>
                  codón {i + 1}
                </text>
              </g>
            );
          })}
          {tabla &&
            [0, 1, 2, 3, 4].map((i) => {
              const o = lin(f, 20 + i * 14, 32 + i * 14);
              return (
                <g key={i} opacity={o}>
                  <Flecha x1={codonX(i)} y1={385} x2={codonX(i)} y2={440} p={o} />
                  {i < 4 ? (
                    <Amino i={i} x={codonX(i)} y={480} s={o} r={28} />
                  ) : (
                    <g transform={`translate(${codonX(i)},480) scale(${o})`}>
                      <polygon points="-28,-12 -12,-28 12,-28 28,-12 28,12 12,28 -12,28 -28,12" fill={C.rojo} stroke={C.tinta} strokeWidth={3} />
                      <text y={6} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={14} fill="#fff">
                        STOP
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
        </g>
      );
      if (tabla) {
        body = (
          <g>
            {body}
            <Etiqueta x={320} y={420} o={lin(f, 80, 95)} size={22} color={C.gris}>
              AUG = inicio · UAA = terminar
            </Etiqueta>
          </g>
        );
      }
      break;
    }
    case "arnt": {
      body = (
        <g>
          <g transform={`translate(320,${420 + (1 - sp(f)) * 200})`}>
            <ARNt codon={0} x={0} y={0} s={1.4} etiquetas={lin(f, 20, 35)} />
          </g>
          <Etiqueta x={320} y={520} o={lin(f, 10, 25)} size={26} color={C.azul}>
            ARNt
          </Etiqueta>
        </g>
      );
      break;
    }
    case "transporte":
    case "orden": {
      const orden = e === "orden";
      body = (
        <g>
          <ARNm y={420} f={f} />
          {[0, 1, 2, 3].map((i) => {
            const d = orden ? i * 25 : i * 8;
            const p = sp(f, d, 18);
            const xf = codonX(i);
            const xi = orden ? xf : 80 + i * 160;
            const yi = orden ? 120 : 260 + (i % 2) * 40;
            const x = orden ? xf : xi + Math.sin(f * 0.05 + i) * 10;
            const y = orden ? yi + p * (420 - 120) : yi + Math.cos(f * 0.05 + i * 2) * 10;
            return <ARNt key={i} codon={i} x={x} y={orden ? Math.min(y, 420) : y} s={orden ? 0.62 : 0.6} />;
          })}
          {!orden && <Ribosoma cx={codonX(2)} y={420} o={0.25} />}
        </g>
      );
      break;
    }
    case "anticodon": {
      const p = sp(f, 5, 20);
      body = (
        <g>
          <ARNm y={400} f={f} />
          <ARNt codon={0} x={codonX(0)} y={400 - (1 - p) * 140} s={1} etiquetas={lin(f, 40, 55)} />
          {p > 0.95 &&
            [0, 1, 2].map((k) => (
              <line key={k} x1={bx(k) + BW / 2} x2={bx(k) + BW / 2} y1={392} y2={404} stroke={C.naranja} strokeWidth={5} opacity={0.5 + 0.5 * Math.sin(f * 0.3)} />
            ))}
          <Etiqueta x={codonX(0)} y={500} o={lin(f, 30, 45)} size={20} color={C.gris}>
            codón AUG
          </Etiqueta>
          <Etiqueta x={430} y={230} o={lin(f, 55, 70)} size={22} color={C.naranja}>
            ¡se complementan!
          </Etiqueta>
        </g>
      );
      break;
    }
    case "entrega": {
      const sale = lin(f, 30, 60);
      body = (
        <g>
          <Traduccion f={f} pos={1} cadena={1 + sale} trna={1} />
          <g opacity={1 - sale}>
            <Amino i={1} x={codonX(1)} y={380 - 196} />
          </g>
        </g>
      );
      break;
    }
    case "enlace":
    case "cadena":
    case "avanza": {
      const pos = e === "avanza" ? lin(f, 10, 140, 0, 3) : e === "cadena" ? 3 : 2;
      const cad = e === "enlace" ? 1 + lin(f, 10, 50, 0, 2) : e === "cadena" ? 4 : 1 + pos;
      body = (
        <g>
          <Traduccion f={f} pos={pos} cadena={cad} enlaces={e === "enlace" ? 0.5 + 0.5 * Math.sin(f * 0.3) : 0} />
          {e === "enlace" && (
            <Etiqueta x={250} y={140} o={lin(f, 40, 55)} size={22} color={C.naranja}>
              enlace peptídico
            </Etiqueta>
          )}
          {e === "cadena" && (
            <rect x={80} y={50} width={330} height={250} rx={30} fill="none" stroke={C.naranja} strokeWidth={4} strokeDasharray="10 8" opacity={lin(f, 10, 25)} />
          )}
        </g>
      );
      break;
    }
    case "stop": {
      const pos = 3 + lin(f, 5, 30);
      body = (
        <g>
          <Traduccion f={f} pos={pos} cadena={4} ribo={1} />
          <g transform={`translate(${codonX(4)},150) scale(${sp(f, 35)})`}>
            <polygon points="-60,-25 -25,-60 25,-60 60,-25 60,25 25,60 -25,60 -60,25" fill={C.rojo} stroke={C.tinta} strokeWidth={5} />
            <text y={12} textAnchor="middle" fontFamily={FONT_T} fontWeight={800} fontSize={30} fill="#fff">
              STOP
            </text>
          </g>
          <Etiqueta x={codonX(4)} y={500} o={lin(f, 40, 55)} size={22} color={C.rojo}>
            UAA
          </Etiqueta>
        </g>
      );
      break;
    }
    case "plegado": {
      body = (
        <g>
          <Proteina f={f} cx={320} cy={270} s={1.3} plegar={lin(f, 20, 90)} />
          <Etiqueta x={320} y={490} o={lin(f, 70, 90)} size={28}>
            ¡Proteína funcional!
          </Etiqueta>
        </g>
      );
      break;
    }
    case "participantes": {
      const items = [
        { t: "Ribosomas", el: <Ribosoma cx={0} y={0} /> },
        { t: "ARN de transferencia", el: <ARNt codon={0} x={0} y={110} s={0.85} /> },
        { t: "Aminoácidos", el: <Cadena x={50} y={30} n={3} dx={-50} dy={-20} /> },
      ];
      body = (
        <g>
          {items.map((it, i) => (
            <g key={i} transform={`translate(${110 + i * 210},${230}) scale(${sp(f, i * 12) * 0.6})`}>
              {it.el}
            </g>
          ))}
          {items.map((it, i) => (
            <Etiqueta key={i} x={110 + i * 210} y={400} o={lin(f, 15 + i * 12, 30 + i * 12)} size={21}>
              {it.t}
            </Etiqueta>
          ))}
        </g>
      );
      break;
    }
    case "funciones": {
      const items = [
        { t: "Formar estructuras", c: C.azulClaro, i: "🦴" },
        { t: "Transportar sustancias", c: C.rosaClaro, i: "🩸" },
        { t: "Acelerar reacciones", c: C.amarilloClaro, i: "⚡" },
      ];
      body = (
        <g>
          {items.map((it, i) => (
            <g key={i} transform={`translate(320,${110 + i * 150}) scale(${sp(f, i * 15)})`}>
              <rect x={-260} y={-55} width={520} height={110} rx={22} fill={it.c} stroke={C.tinta} strokeWidth={4} />
              <text x={-200} y={18} textAnchor="middle" fontSize={50}>
                {it.i}
              </text>
              <text x={-140} y={12} fontFamily={FONT_T} fontWeight={800} fontSize={32} fill={C.tinta}>
                {it.t}
              </text>
            </g>
          ))}
        </g>
      );
      break;
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
      {body}
    </svg>
  );
};
