import { useCallback, useEffect, useState } from "react"
import {
  deletePublicBetaContact,
  downloadPublicBetaConsultations,
  getPublicBetaSummary,
  listPublicBetaConsultations,
} from "../services/avaluos.service"
import { formatCurrency } from "../utils/map"

const UTILITY_LABELS = {
  UTIL: "Si, me orienta",
  PARCIAL: "Parcialmente",
  NO_REFLEJA: "No refleja el predio",
  NO_SE: "No esta seguro",
}

const formatDate = (value) => {
  if (!value) return "Sin consultas"
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

const saveDownload = ({ blob, filename }) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

const BetaConsultasPanel = ({ authToken = "" }) => {
  const [summary, setSummary] = useState({
    total_consultas: 0,
    total_con_contacto: 0,
    ultima_consulta: null,
    utilidad: {},
  })
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [summaryResponse, listResponse] = await Promise.all([
        getPublicBetaSummary(authToken),
        listPublicBetaConsultations(12, authToken),
      ])
      setSummary(summaryResponse)
      setConsultations(listResponse.items || [])
    } catch (fetchError) {
      setError(fetchError.message || "No se pudo cargar el seguimiento beta.")
    } finally {
      setLoading(false)
    }
  }, [authToken])

  useEffect(() => {
    load()
  }, [load])

  const handleExport = async () => {
    setError("")
    try {
      saveDownload(await downloadPublicBetaConsultations(authToken))
    } catch (downloadError) {
      setError(downloadError.message || "No se pudo exportar las consultas beta.")
    }
  }

  const handleRemoveContact = async (item) => {
    const confirmed = window.confirm(
      "Se eliminaran nombre, correo y telefono. La consulta anonima se conservara para estadistica. Continuar?",
    )
    if (!confirmed) return

    setError("")
    try {
      await deletePublicBetaContact(item.beta_submission_id, authToken)
      await load()
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar el contacto.")
    }
  }

  const visibleConsultations = consultations.filter((item) => {
    if (filter === "contact") return item.contacto_autorizado
    if (filter === "comment") return Boolean(item.comentario)
    if (filter === "alert") return item.utilidad_resultado === "NO_REFLEJA"
    return true
  })

  return (
    <section className="panel-card beta-admin-panel">
      <div className="panel-subheader panel-subheader-inline history-header">
        <div>
          <p className="eyebrow">Prueba beta</p>
          <h3>Consultas publicas</h3>
        </div>
        <div className="beta-admin-actions">
          <button type="button" className="secondary-button" onClick={handleExport}>
            Descargar CSV
          </button>
          <button type="button" className="secondary-button" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <div className="beta-admin-notice">
        <strong>Datos protegidos</strong>
        <span>Los contactos visibles fueron autorizados por el usuario y no afectan su avaluo.</span>
      </div>

      <div className="beta-admin-policy">
        <strong>Política operativa para beta</strong>
        <p>
          Usar estos datos solo para validar la experiencia y corregir el sistema. El plazo de
          retención debe aprobarse antes del lanzamiento; mientras tanto, elimina contactos cuando
          dejen de ser necesarios o cuando su titular lo solicite.
        </p>
      </div>

      <div className="context-grid beta-summary-grid">
        <div className="data-card">
          <span>Consultas</span>
          <strong>{summary.total_consultas}</strong>
        </div>
        <div className="data-card">
          <span>Con contacto</span>
          <strong>{summary.total_con_contacto}</strong>
        </div>
        <div className="data-card">
          <span>Utiles</span>
          <strong>{summary.utilidad?.UTIL || 0}</strong>
        </div>
        <div className="data-card">
          <span>Ultima</span>
          <strong className="beta-summary-date">{formatDate(summary.ultima_consulta)}</strong>
        </div>
      </div>

      <div className="beta-utility-row" aria-label="Valoracion recibida">
        {Object.entries(UTILITY_LABELS).map(([code, label]) => (
          <div key={code}>
            <strong>{summary.utilidad?.[code] || 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {!loading && !error && consultations.length === 0 ? (
        <p className="muted">Aun no se recibieron consultas voluntarias de la prueba beta.</p>
      ) : null}

      {consultations.length ? (
        <div className="beta-filter-row" aria-label="Filtrar consultas beta">
          {[
            ["all", "Todas"],
            ["contact", "Con contacto"],
            ["comment", "Comentarios"],
            ["alert", "No refleja"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? "is-active" : ""}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="beta-consulta-list">
        {!loading && consultations.length > 0 && visibleConsultations.length === 0 ? (
          <p className="muted">No hay consultas para este filtro.</p>
        ) : null}
        {visibleConsultations.map((item) => (
          <article key={item.beta_submission_id} className="beta-consulta-item">
            <div className="beta-consulta-heading">
              <div>
                <strong>{item.codigo_catastral || item.predio_id}</strong>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <em>{UTILITY_LABELS[item.utilidad_resultado] || "Sin respuesta"}</em>
            </div>
            <div className="beta-consulta-values">
              <span>Base {formatCurrency(item.base_imponible)}</span>
              <span>IMPBI {formatCurrency(item.impuesto_estimado)}</span>
            </div>
            {item.comentario ? <p>{item.comentario}</p> : null}
            {item.contacto_autorizado ? (
              <address>
                <strong>Contacto autorizado</strong>
                {item.nombre_contacto ? <span>{item.nombre_contacto}</span> : null}
                {item.correo_contacto ? <span>{item.correo_contacto}</span> : null}
                {item.telefono_contacto ? <span>{item.telefono_contacto}</span> : null}
                <button
                  type="button"
                  className="beta-delete-contact"
                  onClick={() => handleRemoveContact(item)}
                >
                  Eliminar contacto
                </button>
              </address>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default BetaConsultasPanel
