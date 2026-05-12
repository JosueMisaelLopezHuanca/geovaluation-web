const basemapOptions = [
  {
    id: "satellite",
    title: "Satelital",
    description: "Imagen aerea para ver techos, casas y manzanos reales.",
  },
  {
    id: "city",
    title: "Ciudad",
    description: "Mapa claro para lectura cartografica y capas catastrales.",
  },
  {
    id: "dark",
    title: "Oscuro",
    description: "Contraste alto para presentaciones y trabajo nocturno.",
  },
]

const BasemapSelector = ({ value, onChange }) => {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <p className="eyebrow">Mapa base</p>
        <h3>Vista de fondo</h3>
      </div>

      <div className="basemap-list">
        {basemapOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`basemap-option ${value === option.id ? "is-active" : ""}`}
            onClick={() => onChange(option.id)}
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default BasemapSelector
