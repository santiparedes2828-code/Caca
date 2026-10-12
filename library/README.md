# Biblioteca interna de recursos autorizados (Hook House)

- `broll/catalog.json`: imágenes y vídeos de apoyo (B-roll).
- `music/catalog.json`: música de fondo.

Los recursos de un cliente van en `clients/<cliente>/library/<broll|music>/catalog.json` y tienen prioridad.
**Cada elemento debe declarar su licencia y procedencia; sin ellas el sistema no lo usa.** No se descargan recursos de
internet automáticamente: añade solo material con derechos claros.

```json
{
  "items": [
    {
      "id": "oficina-portatil",
      "file": "oficina-portatil.jpg",
      "kind": "image",
      "tags": ["edición", "ordenador", "portátil"],
      "description": "Manos editando vídeo en un portátil",
      "license": { "type": "licencia-comercial", "source": "Banco X, licencia nº …" }
    },
    {
      "id": "piso-centro-cocina",
      "file": "piso-centro/cocina.jpg",
      "kind": "image",
      "tags": ["cocina"],
      "presentation": "pantalla",
      "license": { "type": "cliente", "source": "Fotos de la propiedad entregadas por el cliente el 12-10-2026" }
    },
    {
      "id": "pulso-120",
      "file": "pulso-120.mp3",
      "kind": "audio",
      "mood": "energica",
      "license": { "type": "cc-by", "source": "Autor Y", "attribution": "Música: Y (CC BY 4.0)" }
    }
  ]
}
```

`presentation` (opcional): `pantalla` (por defecto, cubre el plano: fotos de la propiedad, planos de recurso) o
`tarjeta` (imagen con esquinas redondeadas sobre el vídeo: capturas, gráficos). Las etiquetas se emparejan con lo que
se dice, también con sinónimos de España y Latinoamérica para inmobiliaria (alberca/pileta → piscina, recámara →
dormitorio, cochera → garaje, departamento → piso, colonia → barrio…; ver `autopilot/editorial/library.ts`).

Tipos de licencia admitidos: `propia`, `cliente`, `cc0`, `cc-by` (exige `attribution`), `licencia-comercial`,
`generada-ia` (indica la herramienta en `source`), `generado-en-pruebas`. Las atribuciones aparecen en el informe.

Nota: `public/broll/monster.png` (usada en la composición `Clip`) no está en el catálogo porque su licencia no consta.
