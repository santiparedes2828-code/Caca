# Seguimientos y registro comercial

**Regla:** nada se envía sin tu aprobación. Claude prepara los borradores y tú los revisas, apruebas y envías.
Cada paso queda en la base de datos (`npm run crm`).

## Recorrido de cada prospecto

| Paso | Cuándo | Qué se envía | Comando tras enviarlo tú |
|---|---|---|---|
| 1 · Primer contacto | día 0 | mensaje personalizado + ofrecer 1 clip gratis | `npm run crm -- aprobar <id>` → enviar → `npm run crm -- enviado <id>` |
| 2 · Seguimiento 1 | día 3 sin respuesta | recordatorio breve | `aprobar <id> --paso seguimiento-1` → enviar → `enviado <id> --paso seguimiento-1` |
| 3 · Seguimiento 2 | día 7 sin respuesta | una idea concreta de gancho con un episodio suyo | ídem con `seguimiento-2` |
| 4 · Seguimiento 3 | día 14 sin respuesta | cierre amable (la oferta queda abierta) | ídem con `seguimiento-3`; si sigue sin respuesta: `estado <id> perdido` |
| Respuesta | cuando conteste | según la tabla de abajo | `respuesta <id> --texto "…"` (pasa a «respondio») |
| Muestra | si pide el clip | 1 clip de su episodio en 48 h | `estado <id> prueba --nota "clip enviado <fecha>"` |
| Propuesta | tras la muestra | la oferta (`oferta.md`) | `estado <id> propuesta`; poner `valor_mensual` |
| Cierre | paga | bienvenida + calendario de entregas | `estado <id> cliente --nota "Medio 374,99 USD desde <fecha>"` |

`npm run crm -- pendientes` muestra cada día:
- qué borradores faltan por aprobar;
- cuáles están aprobados y por enviar;
- qué seguimientos vencen hoy y si ya tienen borrador.

## Respuestas preparadas (en inglés)

**Le interesa la muestra:**
> Great! Send me the episode you'd like (or I'll pick from your latest one) and tell me where you post (TikTok,
> Reels, Shorts, LinkedIn). You'll have the clip within 48 hours.

**Tras entregar la muestra:**
> Here's your clip: {link}. If you'd like this every week, plans start at $175/month for 6 clips. For a weekly
> show, Pro fits best: $374.99 for 12 clips (3 a week), month to month. Happy to start with your next episode.

**«¿Cuánto cuesta?» antes de la muestra:**
> Basic is $175/month for 6 clips, Pro $374.99 for 12 (3 a week), Max $679.99 for 24. But judge the quality first:
> the first clip is free.

**«Ya tenemos editor»:**
> Makes sense. If they're ever overloaded or you want to test more clips per week, I'm happy to help. The free clip
> offer stands.

**«Ahora no»:**
> No problem. Mind if I check back in a couple of months?

Luego: `estado <id> perdido --nota "volver a escribir en <fecha>"`.

**«¿Usan IA?»** (responder la verdad):
> I use my own tools to speed up transcription and captioning, and I pick the moments and review every clip by hand
> before it goes out.

**Pide resultados o garantías:**
> I can't promise views, nobody honestly can. What I can promise is a clean, consistent edit every week and the
> numbers each month so we can see what works.

## Registro: qué guarda la base de cada prospecto

- **Identidad y perfiles:** nombre, perfiles, nicho y segmento.
- **Contacto:** contacto público, dónde se vio y su nivel: `propio` si está en su web o canal, `tercero` si solo
  está en directorios.
- **Por qué es prospecto:** evidencia de necesidad con URL, contenido reciente, prioridad y motivo.
- **Recorrido comercial:**
  - el estado;
  - todos los mensajes, con su fecha, canal, paso, asunto, texto y si está aprobado;
  - el próximo seguimiento;
  - el resultado y el valor mensual.
- **Control:** las fuentes y la fecha de verificación.

Se puede exportar con `npm run crm -- csv`.
