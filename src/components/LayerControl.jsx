const layerConfig = [
  {
    key: "predios",
    title: "Predios",
    description: "Consulta base para ficha predial y avaluo.",
  },
  {
    key: "manzanas",
    title: "Manzanas",
    description: "Contexto urbano y lectura del bloque catastral.",
  },
  {
    key: "zonas_homogeneas",
    title: "Zonas homogeneas",
    description: "Ajuste espacial fino para zona de valor y lectura tributaria.",
  },
  {
    key: "otbs",
    title: "OTBs",
    description: "Organizaciones territoriales de base para lectura barrial y comunitaria.",
  },
  {
    key: "pendientes",
    title: "Pendientes",
    description: "Clases del relieve usadas por el contexto catastral.",
  },
  {
    key: "riesgos",
    title: "Riesgos",
    description: "Contexto fisico complementario visible sobre el predio.",
  },
  {
    key: "diferencias_superficie",
    title: "Dif. GIS vs legal",
    description: "Lectura masiva de inconsistencias entre superficie GIS y legal.",
  },
]

const opacityConfig = [
  {
    key: "zonas_homogeneas",
    label: "Zonas homogeneas",
  },
  {
    key: "otbs",
    label: "OTBs",
  },
  {
    key: "pendientes",
    label: "Pendientes",
  },
  {
    key: "riesgos",
    label: "Riesgos",
  },
  {
    key: "diferencias_superficie",
    label: "Dif. GIS vs legal",
  },
]

const LayerControl = ({ layers, setLayers, opacities, setOpacities }) => {
  const toggleLayer = (layer) => {
    setLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }))
  }

  const updateOpacity = (layer, value) => {
    setOpacities((current) => ({
      ...current,
      [layer]: Number(value),
    }))
  }

  return (
    <section className="panel-card">
      <div className="panel-header">
        <p className="eyebrow">Capas operativas</p>
        <h3>Control cartografico</h3>
      </div>

      <div className="layer-list">
        {layerConfig.map((layer) => (
          <label key={layer.key} className="layer-row">
            <div>
              <strong>{layer.title}</strong>
              <p>{layer.description}</p>
            </div>
            <input
              type="checkbox"
              checked={layers[layer.key]}
              onChange={() => toggleLayer(layer.key)}
            />
          </label>
        ))}
      </div>

      <div className="opacity-panel">
        <div className="panel-subheader">
          <h4>Transparencia</h4>
          <p>Ajusta la mezcla visual para leer mejor el predio sobre las capas.</p>
        </div>

        <div className="opacity-list">
          {opacityConfig.map((layer) => (
            <label key={layer.key} className="opacity-row">
              <span>{layer.label}</span>
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={opacities[layer.key]}
                  onChange={(event) => updateOpacity(layer.key, event.target.value)}
                />
                <strong>{opacities[layer.key]}%</strong>
              </div>
            </label>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LayerControl
