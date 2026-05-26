const STATE_COPY = {
  loading: {
    title: "Cargando contenido",
    description: "Estamos preparando la informacion disponible.",
  },
  empty: {
    title: "Sin datos disponibles",
    description: "Todavia no hay informacion para mostrar en este bloque.",
  },
  error: {
    title: "Ocurrio un problema",
    description: "No se pudo completar la accion solicitada.",
  },
  success: {
    title: "Accion completada",
    description: "La operacion termino correctamente.",
  },
}

const ContentState = ({
  kind = "empty",
  title,
  description,
  action = null,
  compact = false,
}) => {
  const copy = STATE_COPY[kind] || STATE_COPY.empty

  return (
    <div
      className={`content-state content-state-${kind} ${compact ? "is-compact" : ""}`}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <span className="content-state-marker" aria-hidden="true" />
      <div className="content-state-copy">
        <strong>{title || copy.title}</strong>
        <p>{description || copy.description}</p>
      </div>
      {action}
    </div>
  )
}

export default ContentState
