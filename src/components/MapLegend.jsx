const MapLegend = () => {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <p className="eyebrow">Lectura cartografica</p>
        <h3>Leyenda</h3>
      </div>

      <div className="legend-list">
        <div className="legend-item">
          <span className="legend-swatch predio" />
          <div>
            <strong>Predios</strong>
            <p>Unidad predial con relleno cian y borde oscuro.</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-swatch manzana" />
          <div>
            <strong>Manzanas</strong>
            <p>Marco urbano para lectura rapida del tejido catastral.</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-swatch selected" />
          <div>
            <strong>Seleccion</strong>
            <p>Resalta el predio sobre el que estas consultando el avaluo.</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-swatch zona" />
          <div>
            <strong>Zonas homogéneas</strong>
            <p>Referencia espacial para afinar la zona valor del suelo.</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-swatch pendiente" />
          <div>
            <strong>Pendientes</strong>
            <p>Clases 1, 2 y 3 con transparencia para lectura rápida.</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-swatch riesgo" />
          <div>
            <strong>Riesgos</strong>
            <p>Muy bajo a muy alto según la capa espacial consolidada.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MapLegend
