# Frontend Sistema Catastral

Frontend React + Vite para exploracion catastral y generacion de avaluos conectado al backend del sistema.

## Estado actual

- Visualiza predios, manzanas, OTBs y capas tematicas desde el backend por `bbox`.
- Transforma coordenadas `EPSG:32719` a `EPSG:4326` para Leaflet.
- Consulta contexto espacial y territorial del predio seleccionado.
- Genera avaluos usando el modulo `/api/v2/avaluos/`.
- Muestra resultados economicos y factores usados por el backend.
- Incluye acceso administrador inicial conectado a `/api/v2/auth/login`.

## Requisitos

- Node.js 20+
- Backend FastAPI ejecutandose en `http://127.0.0.1:8000`

## Variables de entorno

Copiar `.env.example` a `.env` si necesitas personalizar valores:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
# Para acceder desde celular, reemplaza por la IP LAN de tu PC.
# VITE_API_BASE_URL=http://192.168.1.50:8000
VITE_DEFAULT_CENTER_LAT=-16.4897
VITE_DEFAULT_CENTER_LNG=-68.1193
VITE_DEFAULT_ZOOM=12
VITE_MAPTILER_TOKEN=
```

## Scripts

```bash
npm install
npm run dev
npm run dev:host
npm run build
npm run lint
```

## Despliegue beta

Vercel:

- Build command: `npm run build`
- Output directory: `dist`
- Variables:
  - `VITE_API_BASE_URL=https://URL-BACKEND.onrender.com`
  - `VITE_MAPTILER_TOKEN=token_publico_si_corresponde`

Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- El archivo `public/_redirects` queda incluido para que la SPA responda bien al refrescar rutas.

Despues de publicar, agrega la URL del frontend al backend en `CORS_ALLOWED_ORIGINS`.

Para abrir desde un celular conectado a la misma red:

1. Ejecuta el backend con `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
2. En el frontend usa `VITE_API_BASE_URL=http://TU_IP_LAN:8000`.
3. Ejecuta `npm run dev:host`.
4. Abre `http://TU_IP_LAN:5173` en el navegador del celular.

En esta maquina la IP LAN detectada fue `192.168.1.50`.

## Endpoints usados

- `POST /api/v2/auth/login`
- `GET /api/v1/predios/bbox`
- `GET /api/v1/manzanas/bbox`
- `GET /api/v2/health`
- `GET /api/v2/gis/capas/otbs/bbox`
- `POST /api/v2/avaluos/preview`
- `POST /api/v2/avaluos/calcular`

## Flujo principal

1. El usuario navega el mapa.
2. El frontend consulta predios y manzanas segun la vista actual.
3. Al seleccionar un predio, se consulta su contexto de avaluo.
4. El usuario ajusta parametros de calculo y dispara el avaluo.
5. El backend devuelve el desglose economico y factores aplicados.

## Guia de uso

La guia corta para usuario final, administrador y presentacion esta en:

```text
docs/guia_usuario_final.md
docs/documentacion_entrega_tecnica.md
```

## Siguiente paso recomendado

El siguiente frente es publicar una beta controlada: configurar Supabase/PostGIS, desplegar API en Render y el frontend en Vercel, con credenciales de administracion nuevas y validacion de los datos GIS que pueden exponerse publicamente.
