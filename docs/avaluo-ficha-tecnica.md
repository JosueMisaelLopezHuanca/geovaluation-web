# Ficha Tecnica de Avaluo

## Objetivo

Definir una ficha unica para que el sistema combine:

- datos detectados automaticamente desde GIS y BD
- datos corregidos o complementados por un tecnico
- parametros economicos del calculo
- trazabilidad de que se uso realmente en el avaluo

## Estructura funcional

### 1. Identificacion predial

Campos:

- `id_predio`
- `codigo_catastral`
- `manzana`
- `superficie_terreno`
- `geojson`

Origen:

- automatico desde capas catastrales y tabla `predio`

### 2. Contexto espacial detectado

Campos:

- `pendiente_codigo_detectado`
- `pendiente_grados_detectado`
- `pendiente_cobertura_pct`
- `riesgo_codigo_detectado`
- `riesgo_grado_detectado`
- `riesgo_cobertura_pct`
- `material_via_detectado`
- `zona_valor_detectada`
- `servicios_detectados`

Origen:

- automatico desde `predio_contexto_espacial`
- fallback por interseccion espacial de `predio` con capas de riesgo y pendiente
- tablas maestras y relaciones del predio

### 3. Datos tecnicos aplicados

Campos editables por tecnico:

- `material_via_aplicado`
- `zona_valor_aplicada`
- `servicios_aplicados`
- `uso_predio`
- `estado_construccion`
- `calidad_constructiva`
- `superficie_construida_declarada`
- `anio_construccion_referencia`
- `observaciones_tecnicas`

Regla:

- iniciar con sugerencia automatica
- permitir correccion manual
- guardar tanto el valor detectado como el valor aplicado

### 4. Parametros del calculo

Campos:

- `valor_base_m2`
- `alicuota_impuesto`
- `gestion_anio`
- `nombre_usuario`
- `factor_servicios_manual`
- `usar_tablas_maestras`

Regla:

- si `usar_tablas_maestras = true`, el backend prioriza tablas maestras
- si `usar_tablas_maestras = false`, usar los valores manuales

### 5. Resultado del avaluo

Campos:

- `valor_terreno`
- `valor_construccion`
- `valor_total`
- `base_imponible`
- `impuesto_estimado`
- `factor_pendiente`
- `factor_riesgo`
- `factor_servicios`
- `valor_unitario_aplicado`
- `construcciones_procesadas`

### 6. Trazabilidad

Campos:

- `fuente_contexto`
- `columnas_origen`
- `contexto_precalculado`
- `usuario_creador`
- `fecha_calculo`
- `version_esquema_valuacion`
- `datos_editados_manualmente`

## Recomendacion de UX

La ficha debe mostrar tres bloques:

1. `Detectado por sistema`
2. `Aplicado al avaluo`
3. `Resultado`

Cada dato clave debe dejar claro si es:

- automatico
- editable
- usado realmente en el calculo

## Recomendacion de backend

Siguiente ampliacion sugerida del payload de avaluo:

```json
{
  "id_predio": "uuid",
  "valor_base_m2": 100,
  "alicuota_impuesto": 0.0035,
  "gestion_anio": 2026,
  "nombre_usuario": "admin",
  "factor_servicios": 1,
  "usar_tablas_maestras": true,
  "ficha_tecnica": {
    "material_via_aplicado": "ASFALTO",
    "zona_valor_aplicada": "ZONA 1",
    "servicios_aplicados": ["AGUA POTABLE", "ENERGIA ELECTRICA"],
    "uso_predio": "VIVIENDA",
    "estado_construccion": "BUENO",
    "observaciones_tecnicas": "Sin observaciones"
  }
}
```

## Recomendacion de BD

### Tabla principal

`avaluo_predio`

Agregar o consolidar:

- `ficha_tecnica jsonb`
- `contexto_detectado jsonb`
- `campos_editados jsonb`

### Alternativa mas robusta

Crear tablas separadas:

- `avaluo_ficha_tecnica`
- `avaluo_servicio_aplicado`
- `avaluo_auditoria`

## Prioridad de implementacion

1. Frontend: ficha editable con sugerencias automaticas
2. Backend: aceptar `ficha_tecnica`
3. BD: persistir datos aplicados y auditoria
4. Reporte: exportar ficha + resultado
