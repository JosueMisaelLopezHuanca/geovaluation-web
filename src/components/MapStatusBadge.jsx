const STATUS_COPY = {
  checking: "Conectando",
  online: "Conectado",
  warning: "Atencion",
  offline: "Sin conexion",
}

const MapStatusBadge = ({ health, mapError, loading }) => {
  const status = mapError ? "warning" : health.status

  return (
    <div className={`status-badge status-${status}`}>
      <span className="status-dot" />
      <div>
        <strong>{STATUS_COPY[status] || "Estado"}</strong>
        <p>{mapError || (loading ? "Actualizando capas visibles..." : health.message)}</p>
      </div>
    </div>
  )
}

export default MapStatusBadge
