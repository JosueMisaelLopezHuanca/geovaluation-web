# Reporte tecnico de avance - Plataforma Catastral GIS

Fecha de corte: 14 de mayo de 2026

## 1. Resumen ejecutivo

La plataforma catastral GIS es una aplicacion web para visualizacion geoespacial, consulta publica de predios y calculo tecnico de avaluos catastrales. El sistema integra un backend en FastAPI con PostgreSQL/PostGIS y un frontend en React + Vite con Leaflet, orientado a una experiencia de uso moderna, institucional y compatible con equipos de escritorio y celulares.

El avance actual permite:

- Explorar predios, manzanas, zonas homogeneas, pendientes, riesgos y diferencias de superficie sobre un mapa interactivo.
- Buscar predios por codigo catastral o UUID.
- Seleccionar un predio en el mapa y consultar su contexto GIS.
- Calcular una vista previa de valor catastral, valor de terreno, valor de construccion, base imponible e impuesto estimado.
- Guardar avaluos en modo administrador.
- Consultar valores en modo publico sin iniciar sesion.
- Acceder al panel tecnico con usuario administrador.
- Usar mapas base MapTiler, CARTO, Esri y fallback OSM/CARTO.
- Abrir el sistema desde un celular conectado a la misma red local.

## 2. Arquitectura general

La plataforma esta dividida en dos aplicaciones principales:

Backend:

- Framework: FastAPI.
- Base de datos: PostgreSQL con extension PostGIS.
- Acceso a datos: SQLAlchemy asincrono con asyncpg.
- Modulos principales: predios, manzanas, tiles, avaluos v1, motor de avaluos v2 y autenticacion.
- Formato espacial de respuesta: GeoJSON para consumo directo en Leaflet.

Frontend:

- Framework: React 19.
- Empaquetador y servidor local: Vite.
- Libreria GIS: Leaflet + React Leaflet.
- Mapas base: MapTiler, CARTO y Esri.
- Estado de la aplicacion: hooks React especializados para mapa, avaluo e historial.
- Estilos: CSS modularizado en `src/styles/map.css`, con tema claro/oscuro, fondo topografico y diseno responsive.

## 3. Backend implementado

### 3.1 Configuracion principal

El backend expone una API FastAPI desde `app/main.py`. Se registraron routers para:

- `/api/v1`: endpoints historicos y capas base.
- `/api/v2`: motor de avaluos moderno.
- `/api/v2/auth`: autenticacion de administrador.

Tambien se ajusto CORS para permitir pruebas desde:

- `localhost`
- `127.0.0.1`
- redes LAN tipo `192.168.x.x`
- redes LAN tipo `10.x.x.x`
- redes LAN tipo `172.16.x.x` a `172.31.x.x`

Esto permite abrir el frontend desde el navegador del celular cuando el backend se ejecuta con `--host 0.0.0.0`.

### 3.2 Endpoints principales

Endpoints GIS:

- `GET /api/v1/predios/bbox`: devuelve predios visibles dentro del encuadre del mapa.
- `GET /api/v1/manzanas/bbox`: devuelve manzanas visibles.
- `GET /api/v1/predios/search`: busqueda de predios por codigo, UUID o texto asociado.
- `GET /api/v1/tiles/...`: soporte para capas espaciales por tiles.

Endpoints del motor de avaluo v2:

- `GET /api/v2/health`: verifica disponibilidad del modulo.
- `POST /api/v2/avaluos/preview`: calcula vista previa sin persistir.
- `POST /api/v2/avaluos/calcular`: calcula y, segun configuracion, persiste el avaluo.
- `GET /api/v2/avaluos`: lista avaluos guardados.
- `GET /api/v2/avaluos/{appraisal_id}`: obtiene detalle de un avaluo.
- `GET /api/v2/avaluos/{appraisal_id}/traza`: devuelve trazabilidad tecnica.
- `GET /api/v2/avaluos/{appraisal_id}/export/{format}`: prepara exportacion en formatos como PDF, Excel, CSV y GeoJSON.
- `GET /api/v2/predios/{predio_id}/contexto-gis`: contexto GIS del predio.
- `GET /api/v2/predios/{predio_id}/auditoria`: auditoria del predio.

Endpoints de autenticacion:

- `POST /api/v2/auth/login`: valida usuario administrador.
- `GET /api/v2/auth/me`: valida token bearer y devuelve la sesion.

### 3.3 Motor de avaluos

El motor de avaluos v2 integra:

- Lectura de version normativa activa por gestion.
- Calculo de valor de terreno.
- Calculo de valor de construccion.
- Calculo de base imponible.
- Calculo de impuesto estimado.
- Uso de datos oficiales GIS cuando existen.
- Uso de datos manuales cuando el usuario tecnico los registra.
- Soporte para bloques constructivos.
- Auditoria de fuentes: automatico, oficial, manual o sin dato.
- Persistencia de resultado y trazabilidad.

Se corrigieron errores detectados durante las pruebas:

- La consulta a `normative_version` fallaba cuando faltaban campos como `resolucion_municipal` y `detalle_normativo`.
- La tabla `predio_manual_data` rechazaba inserciones cuando campos booleanos obligatorios llegaban como `null`.
- Se agregaron valores por defecto y compatibilidad para que el calculo no falle al guardar datos manuales.

### 3.4 Busqueda de predios

Se agrego busqueda dedicada de predios:

- Archivo principal: `app/domain/predios/repository.py`.
- Servicio: `app/domain/predios/service.py`.
- Endpoint: `app/api/v1/endpoints/predios.py`.

La respuesta se entrega como `FeatureCollection` GeoJSON, lo que permite:

- Pintar el predio en Leaflet.
- Centrar el mapa automaticamente.
- Mostrar superficie y atributos disponibles.
- Usar la misma estructura para seleccion por mapa y seleccion por buscador.

### 3.5 Seguridad actual

Se implemento autenticacion inicial para modo administrador:

- Usuario por defecto: `admin`.
- Contrasena configurable por entorno con `CATASTRO_ADMIN_PASSWORD`.
- Variables configurables:
  - `CATASTRO_ADMIN_USER`
  - `CATASTRO_ADMIN_PASSWORD`
  - `CATASTRO_AUTH_SECRET`
  - `CATASTRO_AUTH_TTL_MINUTES`

El token se firma con HMAC y tiene vencimiento. Para produccion se recomienda reemplazar la contrasena de desarrollo, usar una clave secreta fuerte y, posteriormente, conectar con una tabla de usuarios institucional.

## 4. Frontend implementado

### 4.1 Base tecnica

El frontend esta construido con:

- React 19.
- Vite.
- Leaflet.
- React Leaflet.
- MapTiler como opcion de mapa base con token publico.
- CARTO y Esri como fallback visual.

Scripts principales:

- `npm run dev`: servidor local.
- `npm run dev:host`: servidor accesible desde red local.
- `npm run build`: compilacion de produccion.
- `npm run lint`: validacion de estilo y errores.

### 4.2 Interfaz institucional

Se incorporo una cabecera institucional con:

- Espacio visual para logo del IIGEO.
- Nombre del sistema.
- Referencia academica UMSA.
- Navegacion superior:
  - Inicio
  - Investigacion
  - Geovisores
  - Servicios
  - Contactos
  - Acceso

Se creo un estilo visual academico moderno, inspirado en visores GIS profesionales:

- Paleta natural verde institucional, celeste GIS y tonos neutros.
- Fondo con curvas de nivel para reforzar el caracter geografico/catastral.
- Bordes y tarjetas de 8 px para mantener orden visual.
- Tema claro y tema oscuro.

### 4.3 Geovisor

El geovisor incluye:

- Mapa interactivo como elemento principal.
- Seleccion de predios por clic.
- Busqueda por codigo o UUID.
- Capas encendibles/apagables:
  - Predios
  - Manzanas
  - Zonas homogeneas
  - Pendientes
  - Riesgos
  - Diferencias de superficie
- Control de opacidad para capas tematicas.
- Selector de mapa base:
  - MapTiler Streets
  - MapTiler Dataviz
  - MapTiler Hybrid
  - MapTiler Basic
  - CARTO Voyager
  - CARTO Light
  - CARTO Dark
  - Esri Satellite

### 4.4 Consulta publica

Se agrego un modo publico sin inicio de sesion para que cualquier usuario pueda:

- Buscar su predio.
- Seleccionarlo en el mapa.
- Ver una estimacion de valor catastral.
- Ver impuesto estimado.
- Ver valor terreno, valor construccion y base imponible.
- Ver contexto territorial como zona tributaria, superficie de calculo y riesgo.

Este modo no guarda modificaciones y no expone herramientas tecnicas internas.

### 4.5 Modo administrador

El modo administrador permite:

- Acceder con usuario y contrasena.
- Ver herramientas completas de cartografia.
- Editar parametros de avaluo.
- Usar datos manuales.
- Gestionar bloques constructivos.
- Guardar calculos.
- Ver historial.
- Imprimir reporte.
- Consultar auditoria y trazabilidad.

### 4.6 Busqueda territorial

La busqueda fue reorganizada con filtros:

- Departamento.
- Municipio.
- Ambito: urbano, rural o mixto.
- Categoria: avaluo, superficie, servicios o riesgo.
- Zona.

Actualmente el dataset activo es:

- Departamento: La Paz.
- Municipio: Nuestra Senora de La Paz.
- Ambito: urbano.

Se dejaron perfiles preparados para:

- El Alto.
- Caranavi.

Estos perfiles cambian automaticamente el ambito urbano/rural y quedan listos para conectar nuevos datasets.

### 4.7 Experiencia movil

Se mejoro la experiencia para celulares:

- El mapa queda como elemento principal.
- El panel de consulta se comporta como una bandeja inferior colapsable.
- Se agrego boton flotante para abrir/cerrar consulta o herramientas.
- Los formularios se adaptan a una sola columna.
- El usuario puede usar su ubicacion actual si el navegador lo permite.
- La seleccion de predio en mapa abre la consulta publica automaticamente.
- Se evita que las cajas de resultado saturen la pantalla pequena.

### 4.8 Mejoras UI/UX recientes

Se aplicaron mejoras de experiencia:

- Panel lateral ocultable en escritorio.
- Bandeja inferior responsive en movil.
- Altura visual uniforme entre el modulo de mapa y el modulo de consulta publica.
- Textos guia y placeholders mas claros en busqueda.
- Mensaje visual elegante sobre el mapa cuando no existe predio seleccionado.
- Microanimaciones en:
  - foco de inputs,
  - hover de botones,
  - aparicion de mensajes,
  - apertura/cierre de paneles,
  - carga de resultados.
- Se respeto `prefers-reduced-motion` para usuarios que prefieren menos animacion.

## 5. Acceso desde celular

Para probar en celular conectado a la misma red:

Backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
npm run dev:host
```

En `.env.local` del frontend:

```env
VITE_API_BASE_URL=http://TU_IP_LAN:8000
VITE_MAPTILER_TOKEN=token_publico_restringido_por_dominio
```

Luego abrir:

```text
http://TU_IP_LAN:5173
```

## 6. Herramientas utilizadas

Backend:

- Python.
- FastAPI.
- SQLAlchemy.
- asyncpg.
- PostgreSQL.
- PostGIS.
- Pydantic.
- Uvicorn.
- Alembic.

Frontend:

- JavaScript.
- React.
- Vite.
- Leaflet.
- React Leaflet.
- MapTiler.
- CARTO basemaps.
- Esri World Imagery.
- CSS responsive.

Control y verificacion:

- `npm run build`.
- `npm run lint`.
- `python -m compileall app`.
- Pruebas manuales con navegador.
- Revision de errores HTTP 422 y 500.
- Revision de trazas SQLAlchemy/asyncpg.

## 7. Estado para presentacion

El sistema ya puede demostrarse en dos perfiles:

Usuario publico:

- Entra sin login.
- Busca o selecciona un predio.
- Consulta valor catastral estimado.
- Usa ubicacion en celular.
- Ve informacion clara y simplificada.

Usuario administrador:

- Inicia sesion.
- Accede a herramientas tecnicas.
- Controla capas.
- Revisa contexto GIS.
- Calcula y guarda avaluos.
- Imprime reporte.
- Consulta historial.

## 8. Recomendaciones para la siguiente etapa

Prioridad alta:

- Conectar usuarios administradores a tabla real de base de datos.
- Agregar roles: administrador, tecnico, auditor y publico.
- Mejorar busqueda por direccion, zona, distrito y macrodistrito.
- Agregar geocodificacion o busqueda por calle/avenida.
- Agregar cluster o paginacion para predios en zonas densas.
- Crear reportes oficiales con plantilla institucional.

Prioridad media:

- Incorporar nuevos municipios como El Alto y Caranavi.
- Agregar dashboard estadistico por zona.
- Mejorar exportacion PDF/Excel.
- Crear cache de capas para mejorar velocidad.
- Evaluar vector tiles para alto volumen de predios.

Prioridad futura:

- Publicar en servidor institucional.
- Agregar HTTPS.
- Crear CI/CD.
- Implementar auditoria completa de usuarios.
- Integrar firmas digitales o validacion documental.

## 9. Conclusion

La plataforma avanzo de un visor tecnico funcional a una plataforma GIS catastral con identidad institucional, experiencia publica, modo administrador, autenticacion basica, busqueda de predios, calculo de avaluos y diseno responsive. La version actual es apta para demostracion academica y deja una base clara para evolucionar hacia un sistema institucional de consulta, valoracion y gestion catastral.
