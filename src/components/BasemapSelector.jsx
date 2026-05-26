const basemapOptions = [
  {
    group: "MapTiler",
    id: "maptilerStreets",
    title: "MapTiler Streets",
    description: "Calles y avenidas modernas para comparar con el estilo actual.",
  },
  {
    group: "MapTiler",
    id: "maptilerDataviz",
    title: "MapTiler Dataviz",
    description: "Base limpia para indicadores, coropletas y lectura academica.",
  },
  {
    group: "MapTiler",
    id: "maptilerHybrid",
    title: "MapTiler Hybrid",
    description: "Imagen satelital con etiquetas y vias visibles.",
  },
  {
    group: "MapTiler",
    id: "maptilerBasic",
    title: "MapTiler Basic",
    description: "Mapa neutro para capas catastrales de alto contraste.",
  },
  {
    group: "Fallback",
    id: "streets",
    title: "CARTO Voyager",
    description: "Calles, avenidas y referencias urbanas con alta legibilidad.",
  },
  {
    group: "Fallback",
    id: "satellite",
    title: "Esri Satelital",
    description: "Imagen aerea para ver techos, casas y manzanos reales.",
  },
  {
    group: "Fallback",
    id: "city",
    title: "CARTO Claro",
    description: "Mapa claro para lectura cartografica y capas catastrales.",
  },
  {
    group: "Fallback",
    id: "dark",
    title: "CARTO Oscuro",
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
            <small>{option.group}</small>
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default BasemapSelector
