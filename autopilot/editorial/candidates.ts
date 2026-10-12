import type { Sentence } from "./analyze";

// Clips candidatos: ventanas de frases CONSECUTIVAS (nunca se reordena ni se empalma contenido de sitios
// distintos, para no alterar el significado). Empiezan en inicio de frase y terminan en frase completa.

export type EditMode = "talking-head" | "podcast" | "clips" | "anuncio" | "educativo";

export type ClipCandidate = {
  startSentence: number;
  endSentence: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  score: number;
  title: string;
  reasons: string[];
};

const title = (s: Sentence) => {
  const t = s.text.replace(/[.,;:!?…]+$/, "").trim();
  return t.length > 70 ? `${t.slice(0, 67).replace(/\s+\S*$/, "")}…` : t;
};

export const clipCandidates = (
  sentences: Sentence[],
  o: { minMs: number; maxMs: number; boundaries: number[]; mode: EditMode },
): ClipCandidate[] => {
  const ideal = (o.minMs + o.maxMs) / 2;
  const out: ClipCandidate[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const first = sentences[i];
    // En podcast/entrevista, una frase que depende de la anterior no puede abrir un clip (le falta contexto)
    if (first.features.dangling && i > 0) continue;
    for (let j = i; j < sentences.length; j++) {
      const last = sentences[j];
      const dur = last.endMs - first.startMs;
      if (dur > o.maxMs) break;
      if (dur < o.minMs || !last.complete) continue;
      const span = sentences.slice(i, j + 1);
      const mean = span.reduce((n, s) => n + s.score, 0) / span.length;
      const crossings = o.boundaries.filter((b) => b > i && b <= j).length;
      const speakers = new Set(span.map((s) => s.speaker).filter(Boolean)).size;
      let score = 2 * first.score + mean - 1.5 * crossings - Math.abs(dur - ideal) / ideal;
      const reasons: string[] = [];
      if (first.features.hook.length) reasons.push(`abre con gancho ("${first.features.hook[0]}")`);
      else if (first.features.question) reasons.push("abre con una pregunta");
      if (crossings === 0) reasons.push("un solo tema");
      else reasons.push(`atraviesa ${crossings} cambio(s) de tema`);
      if (o.mode === "anuncio" && span.some((s) => s.features.cta)) {
        score += 1.5;
        reasons.push("incluye llamada a la acción");
      }
      if (o.mode === "educativo" && span.some((s) => s.features.numbers)) {
        score += 0.5;
        reasons.push("incluye datos");
      }
      if (o.mode === "podcast" && speakers > 1) {
        score += 0.5;
        reasons.push("intercambio entre hablantes");
      }
      reasons.push("termina en frase completa", `${(dur / 1000).toFixed(0)} s`);
      out.push({
        startSentence: i,
        endSentence: j,
        startMs: first.startMs,
        endMs: last.endMs,
        durationMs: dur,
        score: Number(score.toFixed(2)),
        title: title(first),
        reasons,
      });
    }
  }
  return out.sort((a, b) => b.score - a.score);
};

// Mejores N sin solaparse (como mucho un 20 % del más corto en común)
export const selectClips = (cands: ClipCandidate[], n: number) => {
  const chosen: ClipCandidate[] = [];
  for (const c of cands) {
    if (chosen.length >= n) break;
    const clash = chosen.some((k) => {
      const ov = Math.min(k.endMs, c.endMs) - Math.max(k.startMs, c.startMs);
      return ov > 0.2 * Math.min(k.durationMs, c.durationMs);
    });
    if (!clash) chosen.push(c);
  }
  return chosen.sort((a, b) => a.startMs - b.startMs);
};
