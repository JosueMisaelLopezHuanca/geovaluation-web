# Documentacion tecnica de entrega - Sistema Catastral GIS

## 1. Objetivo del sistema

Sistema web GIS para consulta catastral, visualizacion de predios, calculo de avaluo fiscal y apoyo a lectura territorial institucional. La version actual esta orientada a demo beta para La Paz, con base tecnica preparada para crecer hacia otros municipios como El Alto, Caranavi u otras areas urbanas/rurales.

## 2. Arquitectura general

- Frontend: React + Vite + Leaflet.
- Backend: FastAPI + SQLAlchemy Async + PostgreSQL/PostGIS.
- Base de datos: PostgreSQL con extension PostGIS para geometria, indices GiST y consultas por bounding box.
- Cartografia: capas vectoriales propias, basemaps OSM/CARTO/Esri y opcion MapTiler con token publico.
- Modo de uso: consulta publica sin login y modo administrador con usuario `admin` y variables `CATASTRO_*`.

## 3. Base de datos

Motor recomendado: PostgreSQL 15+ con PostGIS.

Tablas principales del dominio:

- `predio`: unidad predial, codigo catastral, superficie mensura y geometria.
- `manzana`: bloque urbano asociado a zona.
- `departamento`, `provincia`, `municipio`, `distrito`, `zona`: jerarquia territorial.
- `normative_version`: version normativa activa por gestion.
- `predio_contexto_espacial`: cache/resultado de cruce espacial.
- `predio_manual_data`: ediciones manuales temporales o vigentes usadas por el motor.
- `avaluo_result` y tablas relacionadas: resultado economico y trazabilidad.

Tablas staging GIS:

- `staging_predios`: shapefile de predios.
- `staging_manzanas`: shapefile de manzanas.
- `staging_pendientes`: clases de pendiente.
- `staging_riesgos`: capa territorial de riesgo.
- `staging_zonas_homogeneas`: zonas de valor/homogeneas.
- `staging_otbs`: nueva capa de organizaciones territoriales de base.

La capa OTB detectada contiene:

- Archivo: `otb_lapaz.shp`.
- Registros: 548 poligonos.
- CRS: `EPSG:32719`.
- Campo principal: `NOM_OTB`.
- Uso actual: visualizacion y consulta territorial por bbox.
- Uso futuro recomendado: guardar OTB dominante por predio en `predio_contexto_espacial` o en una tabla puente `predio_otb_contexto`.

## 4. Importacion GIS

Script principal:

```bash
python -m app.scripts.importar staging
python -m app.scripts.importar reparar
python -m app.scripts.importar transferir
python -m app.scripts.importar diagnostico
```

El importador lee los shapefiles desde `shapefiles/`, crea tablas staging con `GeoPandas.to_postgis`, normaliza SRID `32719`, repara geometrias con `ST_MakeValid` y crea indices espaciales GiST.

Para OTB:

- Copiar `otb_lapaz.shp`, `.dbf`, `.shx`, `.prj`, `.cpg` a `shapefiles/`.
- Ejecutar `python -m app.scripts.importar staging`.
- Verificar con `python -m app.scripts.importar diagnostico`.
- Consumir en frontend desde `/api/v2/gis/capas/otbs/bbox`.

## 5. Backend

Entrada principal:

- `app/main.py`: crea FastAPI, CORS, routers v1/v2 y static fallback.

Routers relevantes:

- `/api/v2/health`: estado general.
- `/api/v2/auth/login`: acceso administrador.
- `/api/v2/avaluos/preview`: previsualizacion sin persistir.
- `/api/v2/avaluos/calcular`: calculo con opcion de persistir.
- `/api/v2/gis/capas/{capa}/bbox`: entrega GeoJSON simplificado por bbox.
- `/api/v1/predios/bbox` y `/api/v1/manzanas/bbox`: capas base.

Variables de entorno backend:

```env
DATABASE_URL=postgresql+asyncpg://usuario:password@host:5432/db
CATASTRO_ADMIN_USER=admin
CATASTRO_ADMIN_PASSWORD=definir-en-entorno
CATASTRO_AUTH_SECRET=cambiar-en-produccion
CATASTRO_AUTH_TTL_MINUTES=240
```

Puntos ya corregidos:

- Se quito el nombre anterior de la interfaz visible.
- La autenticacion admin usa variables `CATASTRO_*`.
- El motor evita errores por campos manuales nulos usando valores por defecto en flujo previo.
- La capa OTB fue agregada al importador y al endpoint GIS.
- Se mantiene CORS para localhost y acceso LAN en desarrollo.

## 6. Frontend

Entrada principal:

- `src/pages/MapPage.jsx`: layout general, modo publico/admin, panel lateral, mapa y metricas.
- `src/components/MapView.jsx`: Leaflet, basemaps, capas GeoJSON y seleccion.
- `src/hooks/useMapData.js`: carga dinamica por bbox.
- `src/components/LayerControl.jsx`: activacion de capas y transparencias.
- `src/components/PublicValuationPanel.jsx`: consulta publica sin login.
- `src/components/AvaluoPanel.jsx`: modo tecnico/admin.

Variables de entorno frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEFAULT_CENTER_LAT=-16.4897
VITE_DEFAULT_CENTER_LNG=-68.1193
VITE_DEFAULT_ZOOM=15
VITE_MAPTILER_TOKEN=
```

Capas actuales:

- Predios.
- Manzanas.
- Zonas homogeneas.
- OTBs.
- Pendientes.
- Riesgos.
- Diferencias GIS vs legal.

Mejoras UI aplicadas:

- Panel lateral colapsable para priorizar el mapa.
- Layout de escritorio a alto completo para reducir areas vacias.
- Modo publico sin login.
- Modo administrador con sesion local y validacion backend.
- Fondo con curvas de nivel para identidad geografica.
- Paleta institucional natural: verdes, celestes, superficies claras y modo oscuro.
- Controles responsive para celular, con acciones visibles para ubicacion y consulta.

## 7. Flujo de usuario

Consulta publica:

1. Entrar al geovisor.
2. Buscar por codigo o moverse por el mapa.
3. Usar ubicacion del celular si se habilita el permiso del navegador.
4. Tocar un predio.
5. Ver valor catastral estimado, impuesto, superficie, zona tributaria y riesgo.

Administrador:

1. Entrar a `Acceso`.
2. Usuario inicial: `admin`.
3. Password: el definido en `CATASTRO_ADMIN_PASSWORD`.
4. Activar/desactivar capas, cambiar basemap y revisar metrica.
5. Seleccionar predio, cargar datos de ejemplo, calcular avaluo e imprimir reporte.

## 8. Despliegue beta gratuito recomendado

Opcion recomendada para demo:

- Frontend: Cloudflare Pages o Vercel.
- Backend FastAPI: Render Free Web Service.
- Base de datos: Supabase Free con PostGIS.

Ventajas:

- No requiere servidor propio.
- Permite publicar una URL de demo.
- Se integra con GitHub para despliegue automatico.
- Suficiente para beta academica con trafico bajo.

Limitaciones:

- Render Free no es para produccion y puede tener cold starts.
- Supabase Free incluye 500 MB de base de datos y puede pausar proyectos inactivos.
- Si los shapefiles de predios son muy pesados, se debe reducir geometria, usar tiles vectoriales o pasar a plan pagado.
- La base local medida ocupa aproximadamente 415 MB; Supabase Free queda con poco margen frente a su limite de 500 MB antes del modo solo lectura.
- Los archivos GIS crudos y tokens cartograficos no deben publicarse dentro del repositorio; los tokens de mapas deben restringirse por dominio en el proveedor.

Pasos de beta:

1. Subir backend y frontend a GitHub.
2. Crear proyecto Supabase Free.
3. Activar PostGIS.
4. Migrar tablas y cargar datos GIS desde una fuente autorizada fuera del repositorio publico.
5. Crear servicio Render para FastAPI.
6. Configurar `DATABASE_URL` y `CATASTRO_*` en Render.
7. Crear proyecto Cloudflare Pages/Vercel para el frontend.
8. Configurar `VITE_API_BASE_URL` con la URL publica del backend.
9. Configurar `VITE_MAPTILER_TOKEN` si se usara MapTiler.
10. Probar login, busqueda, seleccion, avaluo preview y capas.

## 9. Pendientes para siguiente desarrollador

- Crear migraciones Alembic formales para toda tabla nueva o cambio de esquema.
- Incorporar OTB dominante al contexto predial.
- Convertir capas pesadas a vector tiles si crece el volumen de datos.
- Reemplazar autenticacion simple por JWT con usuarios, roles y refresh tokens.
- Agregar auditoria de acceso publico/admin.
- Agregar tests API para `/api/v2/avaluos/*` y `/api/v2/gis/capas/*`.
- Crear seed oficial para gestiones normativas y valores unitarios.
- Definir nombre final, logo oficial y textos legales institucionales.

## 10. Comandos locales

Backend:

```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```bash
npm install
npm run dev
npm run dev:host
npm run build
npm run lint
```

Acceso desde celular en la misma red:

1. Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
2. Frontend: `npm run dev:host`.
3. En `.env`, usar `VITE_API_BASE_URL=http://IP_DE_TU_PC:8000`.
4. Abrir `http://IP_DE_TU_PC:5173` en el celular.
