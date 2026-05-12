# Avalix Frontend v2

Frontend React + Vite para exploracion catastral y generacion de avaluos conectado al backend `avalix_backend_v2`.

## Estado actual

- Visualiza predios y manzanas desde el backend por `bbox`.
- Transforma coordenadas `EPSG:32719` a `EPSG:4326` para Leaflet.
- Consulta contexto espacial y territorial del predio seleccionado.
- Genera avaluos usando el modulo `/api/v1/avaluos/`.
- Muestra resultados economicos y factores usados por el backend.

## Requisitos

- Node.js 20+
- Backend `avalix_backend_v2` ejecutandose en `http://127.0.0.1:8000`

## Variables de entorno

Copiar `.env.example` a `.env` si necesitas personalizar valores:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_CENTER_LAT=-16.4897
VITE_DEFAULT_CENTER_LNG=-68.1193
VITE_DEFAULT_ZOOM=15
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Endpoints usados

- `GET /api/v1/predios/bbox`
- `GET /api/v1/manzanas/bbox`
- `GET /api/v1/avaluos/health`
- `GET /api/v1/avaluos/contexto/{id_predio}`
- `POST /api/v1/avaluos/`

## Flujo principal

1. El usuario navega el mapa.
2. El frontend consulta predios y manzanas segun la vista actual.
3. Al seleccionar un predio, se consulta su contexto de avaluo.
4. El usuario ajusta parametros de calculo y dispara el avaluo.
5. El backend devuelve el desglose economico y factores aplicados.

## Siguiente paso recomendado

El siguiente frente mas valioso es agregar una busqueda/filtro de predios y una ficha cartografica ampliada con zoom al predio, exportacion del resultado y trazabilidad del avaluo.
