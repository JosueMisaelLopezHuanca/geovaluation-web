const PUBLIC_BASEMAP_OPTIONS = [
  { id: "streets", label: "Calles", description: "Mapa vial claro" },
  { id: "satellite", label: "Satelital", description: "Imagen aerea" },
  { id: "dark", label: "Oscuro", description: "Alto contraste" },
]

const MapBasemapSwitcher = ({ value, onChange }) => (
  <fieldset className="map-basemap-switcher">
    <legend>Vista del mapa</legend>
    <div>
      {PUBLIC_BASEMAP_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={value === option.id ? "is-active" : ""}
          aria-pressed={value === option.id}
          title={option.description}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
)

export default MapBasemapSwitcher
