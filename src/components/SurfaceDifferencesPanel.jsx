import { useCallback, useEffect, useState } from "react"
import {
  downloadSurfaceDifferences,
  listSurfaceDifferences,
  refreshSurfaceDifferences,
} from "../services/avaluos.service"
import { formatNumber } from "../utils/map"

const STATUS_OPTIONS = ["OK", "REVISAR", "CRITICO", "SIN_BASE_LEGAL"]

const saveDownload = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

const SurfaceDifferencesPanel = ({ authToken = "" }) => {
  const [status, setStatus] = useState("")
  const [search, setSearch] = useState("")
  const [data, setData] = useState({ total: 0, items: [], resumen: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await listSurfaceDifferences({
        status: status || undefined,
        search: search || undefined,
        limit: 8,
        offset: 0,
      }, authToken)
      setData(response)
    } catch (fetchError) {
      setError(fetchError.message || "No se pudo cargar diferencias de superficie")
    } finally {
      setLoading(false)
    }
  }, [authToken, search, status])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = async () => {
    await refreshSurfaceDifferences(authToken)
    await load()
  }

  const handleExport = async (format) => {
    try {
      const download = await downloadSurfaceDifferences(
        format,
        { status: status || undefined, search: search || undefined },
        authToken,
      )
      saveDownload(download)
    } catch (downloadError) {
      setError(downloadError.message || "No se pudo exportar diferencias de superficie")
    }
  }

  return (
    <section className="panel-card">
      <div className="panel-subheader panel-subheader-inline history-header">
        <div>
          <p className="eyebrow">Control tecnico</p>
          <h3>GIS vs legal</h3>
        </div>
        <button type="button" className="secondary-button" onClick={handleRefresh}>
          Recalcular
        </button>
      </div>

      <div className="avaluo-form compact-form">
        <label>
          <span>Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Buscar predio</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Codigo o ID"
          />
        </label>
      </div>

      <div className="context-grid">
        <div className="data-card">
          <span>Total</span>
          <strong>{data.resumen?.total || 0}</strong>
        </div>
        <div className="data-card">
          <span>OK</span>
          <strong>{data.resumen?.ok || 0}</strong>
        </div>
        <div className="data-card">
          <span>Revisar</span>
          <strong>{data.resumen?.revisar || 0}</strong>
        </div>
        <div className="data-card">
          <span>Critico</span>
          <strong>{data.resumen?.critico || 0}</strong>
        </div>
      </div>

      <div className="export-row">
        <button type="button" onClick={() => handleExport("csv")} className="secondary-button">
          Exportar CSV
        </button>
        <button type="button" onClick={() => handleExport("excel")} className="secondary-button">
          Exportar Excel
        </button>
        <button type="button" onClick={() => handleExport("geojson")} className="secondary-button">
          Exportar GeoJSON
        </button>
      </div>

      {loading ? <p className="muted">Cargando diferencias...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="audit-list">
        {data.items?.map((item) => (
          <div key={item.predio_id} className="audit-item">
            <strong>{item.codigo_catastral || item.predio_id}</strong>
            <span>
              GIS {formatNumber(item.superficie_gis)} m2 · Legal{" "}
              {item.superficie_legal == null ? "Sin dato" : `${formatNumber(item.superficie_legal)} m2`}
            </span>
            <small>
              {item.clasificacion} · {item.porcentaje_diferencia == null ? "Sin base legal" : `${formatNumber(item.porcentaje_diferencia)}%`}
            </small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SurfaceDifferencesPanel
