import type { Video } from "./Motor";
import { huevo } from "./videos/huevo";
import { loteria } from "./videos/loteria";
import { venusf } from "./videos/venusf";

// Fábrica viral · cada video nuevo se agrega acá y Root le crea solo sus composiciones:
// Fabrica-<slug>-<v> (una por gancho) y Fabrica-<slug>-portada-<v>.
export const VIDEOS: Video[] = [venusf, huevo, loteria];
