import { formatCurrency, formatNumber } from "../utils/map"

const renderValue = (value, fallback = "Sin dato") => {
  if (value === null || value === undefined || value === "") return fallback
  return value
}

const formatDate = (value) => {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value))
}

const formatArea = (value) => {
  if (value === null || value === undefined || value === "") return "Sin dato"
  return `${formatNumber(value)} m2`
}

const formatTables = (tables = []) => {
  if (!tables.length) return "Sin dato"

  return tables
    .map((table) => {
      if (typeof table === "string") return table
      return table.nombre || table.version_codigo || table.codigo || table.tabla || "Tabla"
    })
    .join(" / ")
}

const ReportBlock = ({ title, items }) => (
  <section className="report-block">
    <h3>{title}</h3>
    <div className="report-grid">
      {items.map((item) => (
        <div key={item.label} className="report-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  </section>
)

const AvaluoReportSheet = ({ avaluo, selectedPredio, audience = "public" }) => {
  if (!avaluo) return null

  const isPublic = audience === "public"
  const codigoPredio =
    selectedPredio?.properties?.codigo ||
    selectedPredio?.properties?.codigo_catastral ||
    avaluo.codigo_catastral ||
    "Sin dato"
  const contexto = avaluo.contexto_espacial || {}
  const auditoria = avaluo.auditoria || {}
  const factores = avaluo.factores_aplicados || {}
  const normativa = avaluo.normativa || {}
  const isHorizontal = avaluo.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
  const servicios = contexto.servicios_oficiales?.length
    ? contexto.servicios_oficiales.join(", ")
    : Object.entries(contexto.servicios_completos || {})
        .filter(([, enabled]) => enabled)
        .map(([service]) => service)
        .join(", ")
  const serviciosAplicados = factores.factor_servicios_minimo_aplicado
    ? "Minimo normativo 0.20 (sin servicios confirmados)"
    : servicios || "Sin dato"

  const identificacion = [
    { label: "ID avaluo", value: avaluo.appraisal_id },
    { label: "ID predio", value: avaluo.predio_id },
    { label: "Codigo catastral", value: codigoPredio },
    { label: "Gestion", value: normativa.gestion_anio || auditoria.gestion_anio || "Sin dato" },
    { label: "Usuario", value: renderValue(auditoria.usuario) },
    { label: "Fecha", value: formatDate(avaluo.created_at) },
  ]

  const contextoItems = [
    { label: "Zona homogenea", value: renderValue(contexto.zona_homogenea_codigo) },
    { label: "Zona tributaria", value: renderValue(contexto.zona_tributaria_codigo) },
    { label: "Material via", value: renderValue(contexto.material_via_codigo) },
    { label: "Pendiente", value: renderValue(contexto.pendiente_final || contexto.pendiente_codigo) },
    { label: "Riesgo territorial", value: renderValue(contexto.riesgo_final || contexto.riesgo_grado) },
    { label: "Servicios", value: serviciosAplicados },
  ]

  const superficies = [
    { label: "Superficie GIS", value: formatArea(auditoria.superficie_gis) },
    { label: "Superficie legal", value: formatArea(auditoria.superficie_legal) },
    { label: "Superficie manual", value: formatArea(auditoria.superficie_manual) },
    { label: "Superficie de calculo", value: formatArea(auditoria.superficie_calculo) },
    { label: "Fuente de superficie", value: renderValue(auditoria.superficie_fuente) },
  ]

  const resultado = [
    { label: "Valor terreno", value: isHorizontal ? "Incluido en factor PH" : formatCurrency(avaluo.valor_terreno) },
    { label: "Valor construccion", value: formatCurrency(avaluo.valor_construccion) },
    { label: "Base imponible", value: formatCurrency(avaluo.base_imponible) },
    { label: "IMPBI estimado (ref. 2023)", value: formatCurrency(avaluo.impuesto_estimado) },
    {
      label: "Valor unitario aplicado",
      value: isHorizontal ? "No aplica en PH" : formatCurrency(factores.valor_unitario_final || factores.valor_unitario_aplicado || 0),
    },
    {
      label: "Puntaje servicios",
      value: isHorizontal ? "No aplica en PH" : `${formatNumber(factores.puntaje_servicios || 0, 2)}${
        factores.factor_servicios_minimo_aplicado ? " (minimo normativo)" : ""
      }`,
    },
    {
      label: "Factor pendiente",
      value: isHorizontal ? "No aplica en PH" : formatNumber(factores.factor_pendiente || 1, 2),
    },
    {
      label: "Modo",
      value: avaluo.avaluo_tipo,
    },
    {
      label: "Regimen",
      value: isHorizontal ? "Propiedad horizontal" : "Vivienda familiar / predio",
    },
    ...(isHorizontal
      ? [{ label: "Factor ubicacion PH", value: formatNumber(factores.factor_ubicacion_ph || 1, 3) }]
      : []),
  ]

  const trazabilidad = [
    { label: "Normativa", value: renderValue(normativa.nombre || normativa.version_codigo || auditoria.normative_version) },
    { label: "Fuente normativa", value: normativa.fuente_gestion_anio ? `Fuente municipal verificada ${normativa.fuente_gestion_anio}` : "Sin dato" },
    { label: "Vigencia", value: renderValue(normativa.alcance) },
    { label: "Resolucion", value: renderValue(normativa.resolucion_municipal) },
    { label: "Tablas usadas", value: formatTables(avaluo.tablas_utilizadas) },
    { label: "Bloques procesados", value: avaluo.bloques?.length || 0 },
  ]

  return (
    <article className="print-report">
      <header className="report-header">
        <div>
          <p className="report-kicker">
            {isPublic ? "Consulta ciudadana" : "Reporte tecnico tributario"}
          </p>
          <h1>{isPublic ? "Resumen de valuacion catastral" : "Avaluo predial institucional"}</h1>
          <div className="report-meta-strip">
            <span>{codigoPredio}</span>
            <span>{avaluo.avaluo_tipo}</span>
            <span>{formatDate(avaluo.created_at)}</span>
          </div>
        </div>
        <div className="report-total-card">
          <span>Base imponible</span>
          <strong>{formatCurrency(avaluo.base_imponible)}</strong>
          <small>IMPBI estimado ref. 2023 {formatCurrency(avaluo.impuesto_estimado)}</small>
        </div>
      </header>

      <p className="report-copy">
        {isPublic
          ? "Este resumen fue generado desde la consulta publica del visor catastral. Sirve como referencia informativa y debe contrastarse con la instancia municipal competente para tramites oficiales."
          : "Documento generado desde el motor profesional de valuacion catastral con trazabilidad GIS y normativa versionada."}
      </p>

      <ReportBlock title="Identificacion" items={identificacion} />
      <ReportBlock title="Contexto espacial" items={contextoItems} />
      <ReportBlock title="Superficies" items={superficies} />
      <ReportBlock title="Resultado economico" items={resultado} />
      <ReportBlock title="Trazabilidad" items={trazabilidad} />

      <section className="report-disclaimer">
        <strong>Alcance del documento</strong>
        <p>
          El resultado depende de la informacion geoespacial disponible, de los datos ingresados por
          el usuario y de la normativa cargada en el sistema. Si existen diferencias con la
          documentacion legal del predio, debe priorizarse la revision tecnica correspondiente.
        </p>
      </section>

      <footer className="report-signature-row">
        <span>Generado por IIGEO - Sistema Catastral GIS</span>
        <span>Fecha de impresion {formatDate(new Date().toISOString())}</span>
      </footer>
    </article>
  )
}

export default AvaluoReportSheet
