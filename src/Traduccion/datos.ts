// Video «Biología — La traducción».
// Clips: se anotan en produccion/traduccion/clips.json (qué frases cubre cada uno) y se corre
// `python3 -I produccion/traduccion/armar.py`, que escribe src/Traduccion/clips.json con duraciones y subtítulos.
// Las frases que todavía no tienen clip quedan como espacio reservado.

import CLIPS from "./clips.json";

export const FPS = 30;
export const INTRO = 7 * FPS;
export const OUTRO = 9 * FPS;
export const PORTADA = Math.round(2.5 * FPS); // tarjeta antes de cada integrante

// Datos de la intro y los créditos. Lo que quede vacío no se muestra.
export const DATOS = {
  colegio: "",
  curso: "2do CT 1",
  profe: "Adriana Silva",
  fecha: "",
};

// Apellidos para los créditos (vacío = solo el nombre).
export const APELLIDOS: Record<string, string> = {
  Mateo: "Vazquez",
  Julieta: "Verde",
  Gabriel: "Barrios",
  Francisco: "Facio",
  Juan: "Cerruti",
  Santiago: "Paredes",
};

// Esquemas animados: uno por frase del guion.
export type Esquema =
  | "pregunta" | "celula" | "proteinas" | "flujo" | "flujo-traduccion"
  | "transcripcion-intro" | "copia" | "nucleo" | "salida" | "llega-ribosoma"
  | "ribosoma" | "lectura" | "codones" | "codon-aa" | "sigue"
  | "arnt" | "transporte" | "anticodon" | "entrega" | "orden"
  | "enlace" | "cadena" | "avanza" | "stop" | "plegado"
  | "resumen" | "participantes" | "funciones" | "fundamental";

export type Parte = {
  nombre: string;
  tema: string;
  detalle: string;
  guion: string[];
  esquemas: Esquema[]; // uno por frase
};

export const PARTES: Parte[] = [
  {
    nombre: "Mateo",
    tema: "Introducción",
    detalle: "¿Cómo fabrica proteínas nuestro cuerpo?",
    guion: [
      "¿Alguna vez se preguntaron cómo nuestro cuerpo fabrica las proteínas que necesita?",
      "Todo comienza en nuestras células, donde el ADN contiene la información genética.",
      "Esa información sirve para fabricar proteínas, que son fundamentales para el funcionamiento de nuestro organismo.",
      "Pero el ADN no fabrica las proteínas directamente. Para eso existen dos procesos: la transcripción y la traducción.",
      "Hoy vamos a explicar cómo funciona la traducción.",
    ],
    esquemas: ["pregunta", "celula", "proteinas", "flujo", "flujo-traduccion"],
  },
  {
    nombre: "Julieta",
    tema: "La transcripción",
    detalle: "Del ADN al ARN mensajero",
    guion: [
      "Antes de que ocurra la traducción, primero sucede un proceso llamado transcripción.",
      "Durante este proceso, la información de un gen del ADN se copia en una molécula llamada ARN mensajero.",
      "En las células humanas, esto sucede dentro del núcleo.",
      "Después, el ARN mensajero sale hacia el citoplasma, donde se encuentran los ribosomas.",
      "Ahí es donde comienza la traducción, que permite utilizar esa información para fabricar una proteína.",
    ],
    esquemas: ["transcripcion-intro", "copia", "nucleo", "salida", "llega-ribosoma"],
  },
  {
    nombre: "Gabriel",
    tema: "El ribosoma y los codones",
    detalle: "Leer el ARN de a tres bases",
    guion: [
      "El ribosoma es una estructura de la célula que se encarga de fabricar las proteínas.",
      "Cuando el ARN mensajero llega al ribosoma, este comienza a leer la información que contiene.",
      "Esa información está organizada en grupos de tres bases, llamados codones.",
      "Cada codón indica qué aminoácido debe incorporarse a la proteína o señala cuándo terminar.",
      "De esta manera, el ribosoma va siguiendo las instrucciones del ARN mensajero.",
    ],
    esquemas: ["ribosoma", "lectura", "codones", "codon-aa", "sigue"],
  },
  {
    nombre: "Francisco",
    tema: "El ARN de transferencia",
    detalle: "Anticodones que traen aminoácidos",
    guion: [
      "Para formar una proteína también necesitamos el ARN de transferencia.",
      "Su función es transportar los aminoácidos hasta el ribosoma.",
      "Cada ARN de transferencia tiene un anticodón que puede unirse a un codón complementario del ARN mensajero.",
      "Cuando encuentra el codón correspondiente, entrega el aminoácido que transporta.",
      "Así, los aminoácidos van llegando en el orden indicado por la información genética.",
    ],
    esquemas: ["arnt", "transporte", "anticodon", "entrega", "orden"],
  },
  {
    nombre: "Juan",
    tema: "La cadena polipeptídica",
    detalle: "Enlaces peptídicos y codón de terminación",
    guion: [
      "A medida que llegan los aminoácidos, el ribosoma los va uniendo mediante enlaces peptídicos.",
      "Esto forma una cadena llamada cadena polipeptídica.",
      "El proceso continúa mientras el ribosoma avanza por el ARN mensajero, leyendo sus codones.",
      "Cuando llega a un codón de terminación, la traducción finaliza.",
      "Entonces, la cadena se libera y puede plegarse hasta adquirir su forma funcional.",
    ],
    esquemas: ["enlace", "cadena", "avanza", "stop", "plegado"],
  },
  {
    nombre: "Santiago",
    tema: "Conclusión",
    detalle: "Por qué la traducción es fundamental",
    guion: [
      "En resumen, la traducción es el proceso por el cual la célula utiliza la información del ARN mensajero para fabricar proteínas.",
      "En este proceso participan principalmente los ribosomas, el ARN de transferencia y los aminoácidos.",
      "Las proteínas son muy importantes porque cumplen distintas funciones en nuestro cuerpo, como formar estructuras, transportar sustancias y acelerar reacciones químicas.",
      "Por eso, la traducción es fundamental para el funcionamiento de nuestras células.",
    ],
    esquemas: ["resumen", "participantes", "funciones", "fundamental"],
  },
];

// Ritmo de lectura para estimar las frases que todavía no tienen clip (~2,8 palabras/seg).
const PALABRAS_SEG = 2.8;

export type Subtitulo = { texto: string; desde: number; hasta: number; frase: number };

// Un integrante se arma con bloques en orden: clips reales o espacios reservados.
export type Bloque = {
  tipo: "clip" | "espacio";
  archivo?: string;
  recorteInicio: number; // seg
  frames: number;
  desde: number; // frame de inicio dentro del segmento del integrante
  frases: number[];
  subtitulos: Subtitulo[]; // en segundos, relativos al bloque
};

type ClipJSON = { archivo: string; frases: number[]; recorteInicio: number; segundos: number; subtitulos: Subtitulo[] };
const CLIPS_POR_NOMBRE = CLIPS as Record<string, ClipJSON[]>;

const espacio = (p: Parte, frases: number[]): Omit<Bloque, "desde"> => {
  const subs: Subtitulo[] = [];
  let t = 0.5;
  for (const i of frases) {
    const w = p.guion[i].split(/\s+/);
    const trozos = Math.ceil(w.length / 8);
    const tam = Math.ceil(w.length / trozos);
    for (let k = 0; k < trozos; k++) {
      const pedazo = w.slice(k * tam, (k + 1) * tam);
      const d = pedazo.length / PALABRAS_SEG;
      subs.push({ texto: pedazo.join(" "), desde: t, hasta: t + d, frase: i });
      t += d;
    }
    t += 0.3;
  }
  return { tipo: "espacio", recorteInicio: 0, frames: Math.round((t + 0.5) * FPS), frases, subtitulos: subs };
};

export const bloques = (p: Parte): Bloque[] => {
  const clips = CLIPS_POR_NOMBRE[p.nombre] ?? [];
  const out: Omit<Bloque, "desde">[] = [];
  let pendientes: number[] = [];
  const cerrar = () => {
    if (pendientes.length) out.push(espacio(p, pendientes));
    pendientes = [];
  };
  for (let i = 0; i < p.guion.length; i++) {
    const c = clips.find((x) => x.frases[0] === i);
    if (c) {
      cerrar();
      out.push({ tipo: "clip", archivo: c.archivo, recorteInicio: c.recorteInicio, frames: Math.round(c.segundos * FPS), frases: c.frases, subtitulos: c.subtitulos });
      i = c.frases[c.frases.length - 1];
    } else {
      pendientes.push(i);
    }
  }
  cerrar();
  let d = 0;
  return out.map((b) => {
    const r = { ...b, desde: d };
    d += b.frames;
    return r;
  });
};

export const framesParte = (p: Parte) => bloques(p).reduce((a, b) => a + b.frames, 0);

// Subtítulos de todo el segmento, en segundos desde el inicio del segmento.
export const subtitulosParte = (p: Parte): Subtitulo[] =>
  bloques(p).flatMap((b) => b.subtitulos.map((s) => ({ ...s, desde: s.desde + b.desde / FPS, hasta: s.hasta + b.desde / FPS })));

export const framesTotales = () =>
  INTRO + PARTES.reduce((acc, p) => acc + PORTADA + framesParte(p), 0) + OUTRO;
