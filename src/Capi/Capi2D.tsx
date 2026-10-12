import React from "react";

// Capi en 2D, de frente: capibara con la sudadera verde de Hook House (punto blanco), auriculares al cuello y sus
// dos dientes. Todo vectorial para poder animarlo: boca por vocal (visema), cejas, ojos que parpadean y miran,
// respiración. Lo mueve quien lo usa (CapiKuleshov) con los tiempos de cada palabra de la voz.

export type Mouth = { open: number; width: number; round: number }; // 0–1, 0.5–1.2, 0–1
export type CapiPose = {
  mouth: Mouth;
  blink: number; // 0 abierto · 1 cerrado
  brow: number; // −1 enfadado · 0 normal · 1 levantadas
  browTilt: number; // una ceja más alta que la otra (escepticismo)
  lookX: number; // −1..1
  lookY: number; // −1..1
  tilt: number; // grados de la cabeza
  breathe: number; // 0–1
  wink: number; // 0–1 (ojo derecho)
  smile: number; // 0–1 (comisuras arriba)
};

const FUR = "#B9784A";
const FUR_DARK = "#8F5A35";
const MUZZLE = "#9C6440";
const NOSE = "#4A2A18";
const GREEN = "#12A150";
const GREEN_DARK = "#0C7C3D";
const INK = "#141414";

const Eye: React.FC<{ cx: number; cy: number; blink: number; lookX: number; lookY: number }> = ({ cx, cy, blink, lookX, lookY }) => {
  const ry = 30 * (1 - blink * 0.94);
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={31} ry={Math.max(1.5, ry * 1.12)} fill="#FFFFFF" stroke="#6E4127" strokeWidth={3} />
      {blink < 0.8 ? (
        <g>
          <circle cx={cx + lookX * 9} cy={cy + lookY * 9} r={18} fill="#5A3A22" />
          <circle cx={cx + lookX * 9} cy={cy + lookY * 9} r={10} fill={INK} />
          <circle cx={cx + lookX * 9 + 6} cy={cy + lookY * 9 - 7} r={5} fill="#FFFFFF" />
        </g>
      ) : null}
      {/* párpado: el pelo baja sobre el ojo */}
      <rect x={cx - 35} y={cy - 38} width={70} height={38 * blink + 1} rx={8} fill={FUR} />
      <rect x={cx - 35} y={cy + 38 - 38 * blink * 0.4} width={70} height={38 * blink * 0.4 + 1} rx={8} fill={FUR} opacity={blink > 0 ? 1 : 0} />
    </g>
  );
};

export const Capi2D: React.FC<{ pose: CapiPose; width: number }> = ({ pose, width }) => {
  const { mouth } = pose;
  const mw = 74 * mouth.width * (1 - mouth.round * 0.35);
  const mh = 8 + 70 * mouth.open;
  const my = 418;
  const browY = 168 - pose.brow * 14;
  return (
    <svg viewBox="0 0 600 720" width={width} height={(width * 720) / 600} style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${-pose.breathe * 6}) scale(1 ${1 + pose.breathe * 0.012})`} style={{ transformOrigin: "300px 720px" }}>
        {/* Cuerpo: sudadera */}
        <path d="M40 720 C 40 600, 90 535, 170 515 L 430 515 C 510 535, 560 600, 560 720 Z" fill={GREEN} />
        <path d="M170 515 C 210 560, 390 560, 430 515" fill="none" stroke={GREEN_DARK} strokeWidth={14} strokeLinecap="round" />
        <path d="M262 560 L 255 640 M 338 560 L 345 640" stroke="#E9F5EC" strokeWidth={7} strokeLinecap="round" />
        <circle cx={392} cy={618} r={19} fill="#FFFFFF" />
        {/* Capucha alrededor del cuello */}
        <ellipse cx={300} cy={500} rx={205} ry={58} fill={GREEN_DARK} />
        {/* Auriculares al cuello */}
        <path d="M150 500 C 170 560, 430 560, 450 500" fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" />
        <rect x={112} y={455} width={64} height={86} rx={26} fill={INK} />
        <rect x={424} y={455} width={64} height={86} rx={26} fill={INK} />
        <rect x={126} y={470} width={36} height={56} rx={16} fill="#2C2C2C" />
        <rect x={438} y={470} width={36} height={56} rx={16} fill="#2C2C2C" />
      </g>
      {/* Cabeza (se inclina sobre el cuello) */}
      <g transform={`rotate(${pose.tilt} 300 470)`}>
        {/* Orejas */}
        <ellipse cx={178} cy={92} rx={34} ry={30} fill={FUR_DARK} />
        <ellipse cx={422} cy={92} rx={34} ry={30} fill={FUR_DARK} />
        <ellipse cx={180} cy={96} rx={18} ry={15} fill="#6E4127" />
        <ellipse cx={420} cy={96} rx={18} ry={15} fill="#6E4127" />
        {/* Cabeza: bloque redondeado, más ancho abajo (capibara) */}
        <path d="M300 70 C 410 70, 450 120, 455 210 C 462 330, 470 420, 420 470 C 380 505, 220 505, 180 470 C 130 420, 138 330, 145 210 C 150 120, 190 70, 300 70 Z" fill={FUR} />
        {/* Hocico */}
        <path d="M300 268 C 400 268, 432 320, 428 380 C 424 440, 380 482, 300 484 C 220 482, 176 440, 172 380 C 168 320, 200 268, 300 268 Z" fill={MUZZLE} />
        {/* Mejillas */}
        <ellipse cx={186} cy={330} rx={26} ry={16} fill="#D98B6A" opacity={0.35} />
        <ellipse cx={414} cy={330} rx={26} ry={16} fill="#D98B6A" opacity={0.35} />
        {/* Nariz */}
        <path d="M300 300 C 352 300, 362 318, 356 334 C 350 350, 320 356, 300 356 C 280 356, 250 350, 244 334 C 238 318, 248 300, 300 300 Z" fill={NOSE} />
        <ellipse cx={278} cy={330} rx={9} ry={6} fill="#1E100A" />
        <ellipse cx={322} cy={330} rx={9} ry={6} fill="#1E100A" />
        <path d="M300 356 L 300 388" stroke={NOSE} strokeWidth={6} strokeLinecap="round" />
        {/* Boca: línea con sonrisa cuando está cerrada; abierta con dientes y lengua */}
        {mouth.open < 0.06 ? (
          <path
            d={`M ${300 - mw * 0.75} ${my - 6 - pose.smile * 10} Q 300 ${my + 14 + pose.smile * 10} ${300 + mw * 0.75} ${my - 6 - pose.smile * 10}`}
            fill="none"
            stroke={NOSE}
            strokeWidth={7}
            strokeLinecap="round"
          />
        ) : (
          <g>
            <path
              d={`M ${300 - mw} ${my - 10} Q 300 ${my - 22 - pose.smile * 6} ${300 + mw} ${my - 10} Q ${300 + mw * 0.9} ${my + mh} 300 ${my + mh + 6} Q ${300 - mw * 0.9} ${my + mh} ${300 - mw} ${my - 10} Z`}
              fill="#3A1410"
              stroke={NOSE}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <ellipse cx={300} cy={my + mh * 0.75} rx={mw * 0.55} ry={Math.max(4, mh * 0.28)} fill="#E0636E" />
            {/* Los dos dientes de capibara */}
            <rect x={278} y={my - 16} width={21} height={Math.min(30, 12 + mh * 0.35)} rx={5} fill="#FFFFFF" />
            <rect x={301} y={my - 16} width={21} height={Math.min(30, 12 + mh * 0.35)} rx={5} fill="#FFFFFF" />
          </g>
        )}
        {/* Ojos y cejas */}
        <Eye cx={232} cy={210} blink={pose.blink} lookX={pose.lookX} lookY={pose.lookY} />
        <Eye cx={368} cy={210} blink={Math.max(pose.blink, pose.wink)} lookX={pose.lookX} lookY={pose.lookY} />
        <path d={`M 190 ${browY + 6 - pose.browTilt * 8} Q 226 ${browY - 10 - pose.browTilt * 8} 262 ${browY + 2 - pose.browTilt * 8}`} fill="none" stroke="#4A2A18" strokeWidth={11} strokeLinecap="round" />
        <path d={`M 338 ${browY + 2 + pose.browTilt * 4} Q 374 ${browY - 10 + pose.browTilt * 4} 410 ${browY + 6 + pose.browTilt * 4}`} fill="none" stroke="#4A2A18" strokeWidth={11} strokeLinecap="round" />
        {/* Mechón */}
        <path d="M282 74 Q 300 46 318 74" fill={FUR_DARK} />
      </g>
    </svg>
  );
};

// ——— Labios: visema por letra de la palabra que suena ———
const VOWEL: Record<string, Mouth> = {
  a: { open: 1, width: 1.05, round: 0 },
  e: { open: 0.62, width: 1.15, round: 0 },
  i: { open: 0.38, width: 1.2, round: 0 },
  o: { open: 0.8, width: 0.8, round: 0.8 },
  u: { open: 0.5, width: 0.62, round: 1 },
};
const CLOSED: Mouth = { open: 0, width: 0.9, round: 0 };

export const mouthAt = (words: { text: string; startMs: number; endMs: number }[], tMs: number, level: number): Mouth => {
  const w = words.find((x) => tMs >= x.startMs && tMs < x.endMs);
  if (!w) return CLOSED;
  const letters = w.text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zñ0-9]/g, "");
  const chars = /\d/.test(letters) ? "sien" : letters; // «100» se dice «cien»
  if (!chars) return CLOSED;
  const p = (tMs - w.startMs) / Math.max(60, w.endMs - w.startMs);
  const c = chars[Math.min(chars.length - 1, Math.floor(p * chars.length))];
  const gain = Math.min(1, 0.35 + level * 1.1);
  if (VOWEL[c]) return { ...VOWEL[c], open: VOWEL[c].open * gain };
  if ("mbp".includes(c)) return CLOSED;
  if ("fv".includes(c)) return { open: 0.16, width: 1, round: 0 };
  return { open: 0.3 * gain, width: 0.95, round: 0 };
};

export const mixMouth = (a: Mouth, b: Mouth, k: number): Mouth => ({
  open: a.open + (b.open - a.open) * k,
  width: a.width + (b.width - a.width) * k,
  round: a.round + (b.round - a.round) * k,
});
