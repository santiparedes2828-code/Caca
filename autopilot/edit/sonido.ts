import type { CaptionPage, EditProps, Graphic } from "../../src/autopilot/props";

// Efectos de sonido de los vídeos hablados (estilo-hablado.md): los propios del proyecto (public/sfx/, sintetizados
// con ffmpeg), suaves y solo donde pasa algo en pantalla, nunca en cada palabra:
//   - whoosh al entrar (y más flojo al salir) un gráfico a pantalla completa o un B-roll
//   - golpe en las páginas destacadas (gancho y cifras)
//   - pop cuando salta un emoji y cuando aparece el año del calendario
//   - tic en cada check de la lista
// Volúmenes bajos: la voz va a −14 LUFS con picos de −1,4 dBTP y los efectos no deben acercarla a saturar.

type Sfx = EditProps["sfx"][number];

const VOL = { whoosh: 0.3, whooshOut: 0.18, hit: 0.18, pop: 0.18, click: 0.3 } as const;

export const planEditSfx = (o: {
  pages: CaptionPage[];
  graphics: Graphic[];
  overlays: { startMs: number; endMs: number }[];
  fps: number;
  durationInFrames: number;
}): { sfx: Sfx[]; note: string | null } => {
  const at = (ms: number) => Math.round((ms / 1000) * o.fps);
  const ev: Sfx[] = [];
  const add = (name: Sfx["name"], frame: number, volume: number) => {
    const f = Math.max(0, Math.round(frame));
    if (f < o.durationInFrames - 2) ev.push({ name, frame: f, volume });
  };
  for (const g of o.graphics) {
    add("whoosh", at(g.startMs) - 5, VOL.whoosh);
    add("whoosh", at(g.endMs) - 7, VOL.whooshOut);
    if (g.kind === "calendario" || g.kind === "cifra") add("pop", at(g.startMs) + 5, VOL.pop);
    // Cada elemento (o barra) entra cuando se dice (Graphics.tsx)
    else for (const it of g.items) add("click", at(it.startMs) - 1 + 5, VOL.click);
  }
  for (const b of o.overlays) add("whoosh", at(b.startMs) - 5, VOL.whoosh);
  for (const p of o.pages) {
    const key = p.lines.flat().find((t) => t.emphasis);
    if (p.feature && key) add("hit", at(key.startMs) - 1, VOL.hit);
    for (const t of p.lines.flat()) if (t.icon) add("pop", at(t.startMs) + 1, VOL.pop);
  }
  // Dos efectos casi a la vez se pisan: se queda el primero (salvo los tics de una lista, que van seguidos)
  const sfx = ev
    .sort((a, b) => a.frame - b.frame)
    .filter((e, i, all) => !all.slice(0, i).some((p) => e.frame - p.frame < 4 && !(p.name === "click" && e.name === "click")));
  const count = (n: Sfx["name"]) => sfx.filter((e) => e.name === n).length;
  const parts = (["whoosh", "hit", "pop", "click"] as const).filter((n) => count(n)).map((n) => `${count(n)} ${n}`);
  return { sfx, note: sfx.length ? `Efectos de sonido propios: ${parts.join(", ")}` : null };
};
