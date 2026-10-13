import { promises as fs } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { ESTADOS, type Estado, type Mensaje } from "./schema";
import { addMessage, approveDraft, DB_PATH, getProspect, hoy, importProspects, loadDb, markSent, pendientes, resumen, saveDb, setEstado, toCsv } from "./store";

const HELP = `Hook House · base de datos comercial (${path.relative(process.cwd(), DB_PATH)})

Uso: npm run crm -- <comando>

  importar <archivo.json>...        Añade prospectos investigados (valida fuentes y evidencia; descarta duplicados).
  listar [--estado X] [--prioridad A] [--segmento podcaster]
  ver <id>                          Ficha completa con mensajes.
  borrador <id> --canal email --texto archivo.txt [--asunto "…"] [--paso primer-contacto]
                                    Guarda un mensaje para que lo apruebes (estado «mensaje-listo»).
  aprobar <id> [--paso primer-contacto]   Apruebas destinatario y texto de ese borrador (lo haces tú).
  enviado <id> --canal email [--paso primer-contacto] [--fecha AAAA-MM-DD]
                                    Marca que TÚ enviaste el último borrador de ese paso; programa el seguimiento.
  respuesta <id> --texto "…" [--canal email]   Registra una respuesta (estado «respondio»).
  estado <id> <${ESTADOS.join("|")}> [--nota "…"]
  pendientes                        Qué toca hoy: aprobaciones y seguimientos vencidos.
  resumen                           Totales por estado, prioridad y segmento; tasa de respuesta.
  csv [--salida archivo.csv]        Exporta para hojas de cálculo.

Claude nunca envía mensajes: prepara borradores y tú los envías y lo marcas con «enviado».`;

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      estado: { type: "string" },
      prioridad: { type: "string" },
      segmento: { type: "string" },
      canal: { type: "string", default: "email" },
      texto: { type: "string" },
      asunto: { type: "string" },
      paso: { type: "string", default: "primer-contacto" },
      fecha: { type: "string" },
      nota: { type: "string" },
      salida: { type: "string" },
    },
  });
  const [cmd, ...args] = positionals;
  if (!cmd || cmd === "ayuda") return console.log(HELP);
  const db = await loadDb();
  const canal = values.canal as Mensaje["canal"];
  const paso = values.paso as Mensaje["paso"];

  switch (cmd) {
    case "importar": {
      for (const f of args) {
        const raw = JSON.parse(await fs.readFile(f, "utf8"));
        const r = importProspects(db, Array.isArray(raw) ? raw : [raw]);
        console.log(`${f}: ${r.added.length} añadidos, ${r.duplicates.length} duplicados, ${r.invalid.length} inválidos`);
        for (const d of r.duplicates) console.log(`  duplicado: ${d.nombre} → ya existe como ${d.existente}`);
        for (const i of r.invalid) console.log(`  inválido: ${i.nombre}: ${i.error}`);
      }
      await saveDb(db);
      break;
    }
    case "listar": {
      const rows = db.prospectos.filter(
        (p) => (!values.estado || p.estado === values.estado) && (!values.prioridad || p.prioridad === values.prioridad) && (!values.segmento || p.segmento === values.segmento),
      );
      for (const p of rows) console.log(`${p.prioridad} ${p.estado.padEnd(13)} ${p.id.padEnd(34)} ${p.segmento.padEnd(11)} ${p.contacto_publico ?? "(sin contacto público)"}`);
      console.log(`${rows.length} prospectos`);
      break;
    }
    case "ver":
      console.log(JSON.stringify(getProspect(db, args[0]), null, 2));
      break;
    case "borrador": {
      if (!values.texto) throw new Error("Falta --texto archivo.txt");
      const texto = (await fs.readFile(values.texto, "utf8")).trim();
      addMessage(db, args[0], { canal, tipo: "borrador", paso, asunto: values.asunto ?? null, texto });
      await saveDb(db);
      console.log(`Borrador guardado para ${args[0]}`);
      break;
    }
    case "aprobar": {
      approveDraft(db, args[0], paso);
      await saveDb(db);
      console.log(`${args[0]}: borrador «${paso}» aprobado`);
      break;
    }
    case "enviado": {
      markSent(db, args[0], paso, values.canal === "email" && !process.argv.includes("--canal") ? undefined : canal, values.fecha ?? hoy());
      await saveDb(db);
      console.log(`${args[0]}: enviado (${paso}); próximo seguimiento: ${getProspect(db, args[0]).proximo_seguimiento ?? "—"}`);
      break;
    }
    case "respuesta": {
      if (!values.texto) throw new Error("Falta --texto");
      addMessage(db, args[0], { canal, tipo: "recibido", paso: "respuesta", asunto: null, texto: values.texto });
      await saveDb(db);
      console.log(`${args[0]}: respuesta registrada`);
      break;
    }
    case "estado": {
      const estado = args[1] as Estado;
      if (!ESTADOS.includes(estado)) throw new Error(`Estado no válido: ${args[1]}`);
      setEstado(db, args[0], estado, values.nota);
      await saveDb(db);
      console.log(`${args[0]} → ${estado}`);
      break;
    }
    case "pendientes": {
      const list = pendientes(db);
      for (const t of list) console.log(`${t.vencido ? "HOY " : "    "}${t.fecha}  ${t.id.padEnd(34)} ${t.accion}`);
      console.log(`${list.filter((t) => t.vencido).length} para hoy, ${list.length} en total`);
      break;
    }
    case "resumen":
      console.log(JSON.stringify(resumen(db), null, 2));
      break;
    case "csv": {
      const out = values.salida ?? "crecimiento/datos/prospectos.csv";
      await fs.writeFile(out, toCsv(db));
      console.log(`Exportado a ${out}`);
      break;
    }
    default:
      console.log(HELP);
      process.exitCode = 1;
  }
};

main().catch((e: Error) => {
  console.error(`Error: ${e.message}`);
  process.exitCode = 1;
});
