import { formatCurrency, formatNumber } from "../utils/map"

const formatDate = (value) => {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

const renderValue = (value, fallback = "Sin dato") => {
  if (value === null || value === undefined || value === "") return fallback
  return value
}

const formatTablesCount = (tables = []) => {
  if (!Array.isArray(tables)) return 0
  return tables.length
}

const DetailGrid = ({ title, items }) => (
  <>
    <div className="panel-subheader">
      <h4>{title}</h4>
    </div>
    <div className="avaluo-result">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  </>
)

const AvaluosHistoryPanel = ({
  items,
  selectedId,
  selectedAvaluo,
  loading,
  loadingDetail,
  error,
  onSelect,
  onRefresh,
  onPrintReport,
}) => {
  const resumenItems = selectedAvaluo
    ? [
        { label: "ID avaluo", value: selectedAvaluo.appraisal_id },
        { label: "Valor terreno", value: formatCurrency(selectedAvaluo.valor_terreno) },
        { label: "Valor construccion", value: formatCurrency(selectedAvaluo.valor_construccion) },
        { label: "Base imponible", value: formatCurrency(selectedAvaluo.base_imponible) },
        { label: "IMPBI estimado", value: formatCurrency(selectedAvaluo.impuesto_estimado) },
      ]
    : []

  const contextoItems = selectedAvaluo
    ? [
        {
          label: "Zona tributaria",
          value: renderValue(selectedAvaluo.contexto_espacial?.zona_tributaria_codigo),
        },
        {
          label: "Material via",
          value: renderValue(selectedAvaluo.contexto_espacial?.material_via_codigo),
        },
        {
          label: "Zona homogenea",
          value: renderValue(selectedAvaluo.contexto_espacial?.zona_homogenea_codigo),
        },
        {
          label: "Riesgo territorial",
          value: renderValue(selectedAvaluo.contexto_espacial?.riesgo_grado),
        },
        {
          label: "Servicios oficiales",
          value: selectedAvaluo.contexto_espacial?.servicios_oficiales?.length
            ? selectedAvaluo.contexto_espacial.servicios_oficiales.join(", ")
            : "Sin dato",
        },
      ]
    : []

  const auditoriaItems = selectedAvaluo
    ? [
        {
          label: "Superficie calculo",
          value: `${formatNumber(selectedAvaluo.auditoria?.superficie_calculo || 0)} m2`,
        },
        {
          label: "Fuente superficie",
          value: renderValue(selectedAvaluo.auditoria?.superficie_fuente),
        },
        {
          label: "Superficie manual",
          value:
            selectedAvaluo.auditoria?.superficie_manual == null
              ? "Sin dato"
              : `${formatNumber(selectedAvaluo.auditoria.superficie_manual)} m2`,
        },
        {
          label: "Tablas usadas",
          value: formatTablesCount(selectedAvaluo.tablas_utilizadas),
        },
        {
          label: "Bloques procesados",
          value: selectedAvaluo.bloques?.length || 0,
        },
      ]
    : []

  return (
    <section className="panel-card">
      <div className="panel-subheader panel-subheader-inline history-header">
        <div>
          <p className="eyebrow">Historial</p>
          <h3>Avaluos guardados</h3>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh}>
          Actualizar
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onPrintReport}
          disabled={!selectedAvaluo}
        >
          Imprimir detalle
        </button>
      </div>

      {loading ? <p className="muted">Cargando historial...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <p className="muted">Todavia no hay avaluos guardados para mostrar.</p>
      ) : null}

      <div className="history-list">
        {items.map((item) => (
          <button
            key={item.appraisal_id}
            type="button"
            className={`history-item ${selectedId === item.appraisal_id ? "is-active" : ""}`}
            onClick={() => onSelect(item.appraisal_id)}
          >
            <strong>{item.codigo_catastral || item.predio_id}</strong>
            <span>{formatCurrency(item.base_imponible)}</span>
            <small>{formatDate(item.created_at)}</small>
          </button>
        ))}
      </div>

      {loadingDetail ? <p className="muted">Cargando detalle...</p> : null}

      {selectedAvaluo ? (
        <>
          <DetailGrid title="Resumen guardado" items={resumenItems} />
          <DetailGrid title="Contexto espacial" items={contextoItems} />
          <DetailGrid title="Auditoria y trazabilidad" items={auditoriaItems} />
        </>
      ) : null}
    </section>
  )
}

export default AvaluosHistoryPanel
