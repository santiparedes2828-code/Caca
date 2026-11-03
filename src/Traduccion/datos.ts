// Video «Biología — La traducción».
// Para sumar un clip: poné el archivo en public/traduccion/ y completá `archivo` y `segundos`.
// Mientras `archivo` sea null, se muestra una pantalla de espacio con el guion.

export const FPS = 30;
export const INTRO = 8 * FPS;
export const OUTRO = 11 * FPS;
export const PORTADA = 3 * FPS; // tarjeta antes de cada integrante

export type Parte = {
  nombre: string;
  tema: string;
  detalle: string;
  guion: string[];
  archivo: string | null; // p. ej. "traduccion/mateo.mp4"
  segundos: number | null; // duración real del clip (la mido yo con ffprobe)
  recorteInicio?: number; // segundos a recortar al principio
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
    archivo: null,
    segundos: null,
  },
];

// Duración estimada leyendo el guion a ritmo de exposición (~2,4 palabras/seg).
export const segundosEstimados = (p: Parte) => {
  const palabras = p.guion.join(" ").split(/\s+/).length;
  return Math.ceil(palabras / 2.4) + 1;
};

export const framesParte = (p: Parte) =>
  Math.round((p.segundos != null ? p.segundos - (p.recorteInicio ?? 0) : segundosEstimados(p)) * FPS);

export const framesTotales = () =>
  INTRO + PARTES.reduce((acc, p) => acc + PORTADA + framesParte(p), 0) + OUTRO;
