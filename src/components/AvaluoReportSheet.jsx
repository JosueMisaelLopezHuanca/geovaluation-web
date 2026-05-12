import { formatCurrency, formatNumber } from "../utils/map"

const renderValue = (value, fallback = "Sin dato") => {
  if (value === null || value === undefined || value === "") {
    return fallback
  }

  return value
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

const formatDate = (value) => {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value))
}

const AvaluoReportSheet = ({ avaluo, selectedPredio }) => {
  if (!avaluo) return null

  const identificacion = [
    { label: "ID avalúo", value: avaluo.appraisal_id },
    { label: "ID predio", value: avaluo.predio_id },
    { label: "Código catastral", value: selectedPredio?.properties?.codigo || "Sin dato" },
    { label: "Usuario", value: renderValue(avaluo.auditoria?.usuario) },
    { label: "Normativa", value: renderValue(avaluo.auditoria?.normative_version) },
    { label: "Fecha", value: formatDate(avaluo.created_at) },
  ]

  const contexto = [
    { label: "Zona homogénea", value: renderValue(avaluo.contexto_espacial?.zona_homogenea_codigo) },
    { label: "Zona tributaria", value: renderValue(avaluo.contexto_espacial?.zona_tributaria_codigo) },
    { label: "Material vía", value: renderValue(avaluo.contexto_espacial?.material_via_codigo) },
    { label: "Pendiente", value: renderValue(avaluo.contexto_espacial?.pendiente_codigo) },
    { label: "Riesgo territorial", value: renderValue(avaluo.contexto_espacial?.riesgo_grado) },
    {
      label: "Servicios oficiales",
      value: avaluo.contexto_espacial?.servicios_oficiales?.length
        ? avaluo.contexto_espacial.servicios_oficiales.join(", ")
        : "Sin dato",
    },
  ]

  const superficies = [
    {
      label: "Superficie GIS",
      value:
        avaluo.auditoria?.superficie_gis == null
          ? "Sin dato"
          : `${formatNumber(avaluo.auditoria.superficie_gis)} m2`,
    },
    {
      label: "Superficie legal",
      value:
        avaluo.auditoria?.superficie_legal == null
          ? "Sin dato"
          : `${formatNumber(avaluo.auditoria.superficie_legal)} m2`,
    },
    {
      label: "Superficie manual",
      value:
        avaluo.auditoria?.superficie_manual == null
          ? "Sin dato"
          : `${formatNumber(avaluo.auditoria.superficie_manual)} m2`,
    },
    {
      label: "Superficie cálculo",
      value: `${formatNumber(avaluo.auditoria?.superficie_calculo || 0)} m2`,
    },
    { label: "Fuente", value: renderValue(avaluo.auditoria?.superficie_fuente) },
  ]

  const resultado = [
    { label: "Valor terreno", value: formatCurrency(avaluo.valor_terreno) },
    { label: "Valor construcción", value: formatCurrency(avaluo.valor_construccion) },
    { label: "Base imponible", value: formatCurrency(avaluo.base_imponible) },
    { label: "Impuesto estimado", value: formatCurrency(avaluo.impuesto_estimado) },
    {
      label: "Valor unitario oficial",
      value: formatCurrency(avaluo.factores_aplicados?.valor_unitario || 0),
    },
    {
      label: "Valor unitario aplicado",
      value: formatCurrency(avaluo.factores_aplicados?.valor_unitario_aplicado || 0),
    },
    {
      label: "Puntaje servicios",
      value: formatNumber(avaluo.factores_aplicados?.puntaje_servicios || 0, 2),
    },
    {
      label: "Factor pendiente",
      value: formatNumber(avaluo.factores_aplicados?.factor_pendiente || 1, 2),
    },
  ]

  const trazabilidad = [
    {
      label: "Tablas usadas",
      value: avaluo.tablas_utilizadas?.length ? avaluo.tablas_utilizadas.join(" · ") : "Sin dato",
    },
    {
      label: "Bloques procesados",
      value: avaluo.bloques?.length || 0,
    },
  ]

  return (
    <article className="print-report">
      <header className="report-header">
        <div>
          <p className="report-kicker">Reporte técnico tributario</p>
          <h1>Avalúo Predial GAMLP</h1>
        </div>
        <p className="report-copy">
          Documento generado desde el motor profesional de valuación catastral con trazabilidad GIS
          y normativa versionada.
        </p>
      </header>

      <ReportBlock title="Identificación" items={identificacion} />
      <ReportBlock title="Contexto espacial" items={contexto} />
      <ReportBlock title="Superficies oficiales" items={superficies} />
      <ReportBlock title="Resultado económico" items={resultado} />
      <ReportBlock title="Trazabilidad" items={trazabilidad} />
    </article>
  )
}

export default AvaluoReportSheet
