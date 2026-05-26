const PUBLIC_LAYERS = [
  { id: "predios", label: "Predios" },
  { id: "manzanas", label: "Manzanas" },
  { id: "otbs", label: "OTBs" },
]

const PublicLayerSwitcher = ({ layers, setLayers }) => {
  const setReadingMode = (mode) => {
    setLayers((current) => ({
      ...current,
      predios: mode === "catastro",
      manzanas: mode === "catastro",
      otbs: mode === "catastro",
      zonas_homogeneas: false,
      pendientes: false,
      riesgos: false,
    }))
  }

  const toggleLayer = (id) => {
    setLayers((current) => ({ ...current, [id]: !current[id] }))
  }

  const isClearView = PUBLIC_LAYERS.every((layer) => !layers[layer.id])

  return (
    <section className="map-layer-switcher" aria-label="Capas visibles para consulta publica">
      <div className="map-layer-presets">
        <button
          type="button"
          className={isClearView ? "is-active" : ""}
          aria-pressed={isClearView}
          onClick={() => setReadingMode("clear")}
        >
          Leer calles
        </button>
        <button
          type="button"
          className={!isClearView ? "is-active" : ""}
          aria-pressed={!isClearView}
          onClick={() => setReadingMode("catastro")}
        >
          Vista catastral
        </button>
      </div>
      <details>
        <summary>Capas</summary>
        <p>Oculta polígonos para leer avenidas. El predio seleccionado seguirá resaltado.</p>
        {PUBLIC_LAYERS.map((layer) => (
          <label key={layer.id}>
            <span>{layer.label}</span>
            <input
              type="checkbox"
              checked={layers[layer.id]}
              onChange={() => toggleLayer(layer.id)}
            />
          </label>
        ))}
      </details>
    </section>
  )
}

export default PublicLayerSwitcher
