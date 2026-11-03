// Video «Biología — La traducción».
// Para sumar un clip: poné el archivo en public/traduccion/ y completá `archivo` y `segundos`.
// Mientras `archivo` sea null, se muestra una pantalla de espacio con el guion.

export const FPS = 30;
export const INTRO = 7 * FPS;
export const OUTRO = 9 * FPS;
export const PORTADA = Math.round(2.5 * FPS); // tarjeta antes de cada integrante

// Datos de la intro y los créditos. Lo que quede vacío no se muestra.
export const DATOS = {
  colegio: "",
  curso: "",
  profe: "",
  fecha: "",
};

// Apellidos para los créditos (vacío = solo el nombre).
export const APELLIDOS: Record<string, string> = {
  Mateo: "",
  Julieta: "",
  Gabriel: "",
  Fran: "",
  Juan: "",
  Santiago: "",
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
  archivo: string | null; // p. ej. "traduccion/mateo.mp4"
  segundos: number | null; // duración real del clip (la mido yo con ffprobe)
  recorteInicio?: number; // segundos a recortar al principio
  volumen?: number; // volumen de la voz del clip (1 = normal)
  subtitulos?: Subtitulo[]; // sacados del audio del clip
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
    archivo: null,
    segundos: null,
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
    archivo: null,
    segundos: null,
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
    archivo: null,
    segundos: null,
  },
  {
    nombre: "Fran",
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
    archivo: null,
    segundos: null,
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
    archivo: null,
    segundos: null,
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
    archivo: null,
    segundos: null,
  },
];

// Duración estimada leyendo el guion a ritmo de exposición (~2,8 palabras/seg).
const PALABRAS_SEG = 2.8;
const palabras = (t: string) => t.split(/\s+/).length;
export const segundosEstimados = (p: Parte) =>
  Math.ceil(palabras(p.guion.join(" ")) / PALABRAS_SEG) + 1;

// Subtítulos: [inicio, fin) en segundos dentro del clip, por frase.
// Hasta tener el clip se reparten según la cantidad de palabras; con el clip, los saco del audio.
export type Subtitulo = { texto: string; desde: number; hasta: number; frase: number };
export const subtitulosEstimados = (p: Parte): Subtitulo[] => {
  const total = framesParte(p) / FPS - 1;
  const pesos = p.guion.map(palabras);
  const suma = pesos.reduce((a, b) => a + b, 0);
  let t = 0.5;
  const out: Subtitulo[] = [];
  p.guion.forEach((frase, i) => {
    const d = (pesos[i] / suma) * total;
    // partir frases largas en trozos de ~9 palabras
    const w = frase.split(/\s+/);
    const trozos = Math.ceil(w.length / 9);
    const tam = Math.ceil(w.length / trozos);
    for (let k = 0; k < trozos; k++) {
      const pedazo = w.slice(k * tam, (k + 1) * tam);
      const dd = (d * pedazo.length) / w.length;
      out.push({ texto: pedazo.join(" "), desde: t, hasta: t + dd, frase: i });
      t += dd;
    }
  });
  return out;
};

export const framesParte = (p: Parte) =>
  Math.round((p.segundos != null ? p.segundos - (p.recorteInicio ?? 0) : segundosEstimados(p)) * FPS);

export const framesTotales = () =>
  INTRO + PARTES.reduce((acc, p) => acc + PORTADA + framesParte(p), 0) + OUTRO;
