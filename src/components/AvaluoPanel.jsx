import { formatCurrency, formatNumber, getFeatureLabel } from "../utils/map"

const renderValue = (value, fallback = "Sin dato") => {
  if (value === null || value === undefined || value === "") {
    return fallback
  }

  return value
}

const QUALITY_OPTIONS = ["ALTA", "MEDIA", "BASICA", "SOCIAL", "MARGINAL", "LUJO"]

const AvaluoPanel = ({
  selectedPredio,
  context,
  avaluo,
  methodology,
  constructionPreview,
  officialServices,
  blocks,
  form,
  error,
  loadingContext,
  previewLoading,
  submitting,
  onFieldChange,
  onBlockChange,
  onAddBlock,
  onRemoveBlock,
  onCalculate,
  onPrintReport,
}) => {
  if (!selectedPredio) {
    return (
      <section className="panel-card detail-panel">
        <div className="panel-header">
          <p className="eyebrow">Detalle predial</p>
          <h3>Selecciona un predio</h3>
        </div>
        <p className="muted">
          Haz clic sobre un predio en el mapa para consultar su contexto GIS y disparar el
          avalúo profesional.
        </p>
      </section>
    )
  }

  const activeServices = context?.servicios_oficiales || []

  return (
    <section className="panel-card detail-panel">
      <div className="panel-header">
        <p className="eyebrow">Predio activo</p>
        <h3>{getFeatureLabel(selectedPredio)}</h3>
      </div>

      <div className="detail-grid">
        <div>
          <span>ID</span>
          <strong>{selectedPredio.properties.id}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{loadingContext ? "Consultando..." : context ? "Contexto listo" : "Sin contexto"}</strong>
        </div>
      </div>

      {context ? (
        <>
          <div className="panel-subheader">
            <h4>Contexto GIS oficial</h4>
            <p>El backend resuelve zona, material, pendiente, servicios y overlays usados.</p>
          </div>

          <div className="context-grid">
            <div>
              <span>Superficie GIS</span>
              <strong>{formatNumber(context.superficie_gis)} m2</strong>
            </div>
            <div>
              <span>Superficie legal</span>
              <strong>
                {context.superficie_legal == null ? "Sin dato" : `${formatNumber(context.superficie_legal)} m2`}
              </strong>
            </div>
            <div>
              <span>Superficie cálculo actual</span>
              <strong>{formatNumber(context.superficie_calculo)} m2</strong>
            </div>
            <div>
              <span>Fuente de superficie</span>
              <strong>{renderValue(context.superficie_fuente)}</strong>
            </div>
            <div>
              <span>Zona homogénea</span>
              <strong>
                {context.zona_homogenea_codigo
                  ? `${context.zona_homogenea_codigo} / ${context.zona_homogenea_grupo || "Sin grupo"}`
                  : "Sin dato"}
              </strong>
            </div>
            <div>
              <span>Zona tributaria</span>
              <strong>{renderValue(context.zona_tributaria_codigo)}</strong>
            </div>
            <div>
              <span>Material de vía</span>
              <strong>{renderValue(context.material_via_codigo)}</strong>
            </div>
            <div>
              <span>Pendiente</span>
              <strong>
                {context.pendiente_grados == null
                  ? renderValue(context.pendiente_codigo)
                  : `${formatNumber(context.pendiente_grados)}°`}
              </strong>
            </div>
            <div>
              <span>Riesgo territorial</span>
              <strong>{renderValue(context.riesgo_grado)}</strong>
            </div>
          </div>

          <div className="services-editor">
            <span>Servicios oficiales GAMLP</span>
            <div className="services-grid">
              {officialServices.map((service) => (
                <label
                  key={service}
                  className={`service-chip ${activeServices.includes(service) ? "is-active" : ""}`}
                >
                  <input type="checkbox" checked={activeServices.includes(service)} readOnly />
                  <span>{service}</span>
                </label>
              ))}
            </div>
            <p className="muted">
              El backend calcula automáticamente el puntaje de servicios. Gas e internet no entran
              a la fórmula económica.
            </p>
          </div>
        </>
      ) : null}

      <div className="panel-subheader">
        <h4>Parámetros de cálculo</h4>
        <p>La superficie manual sobreescribe la superficie GIS y queda auditada con motivo.</p>
      </div>

      <div className="avaluo-form">
        <label>
          <span>Gestión tributaria</span>
          <input
            type="number"
            min="2025"
            value={form.gestion_anio}
            onChange={(event) => onFieldChange("gestion_anio", event.target.value)}
          />
        </label>
        <label>
          <span>Usuario</span>
          <input
            type="text"
            value={form.usuario}
            onChange={(event) => onFieldChange("usuario", event.target.value)}
          />
        </label>
        <label>
          <span>Superficie manual del terreno</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.superficie_manual}
            onChange={(event) => onFieldChange("superficie_manual", event.target.value)}
            placeholder={
              context?.superficie_gis
                ? `Automática: ${formatNumber(context.superficie_gis)} m2`
                : "Usa la automática si lo dejas vacío"
            }
          />
        </label>
        <label className="textarea-field">
          <span>Motivo del override manual</span>
          <textarea
            rows="3"
            value={form.superficie_override_reason}
            onChange={(event) => onFieldChange("superficie_override_reason", event.target.value)}
            placeholder="Ej. Regularización técnica o documento legal"
          />
        </label>
        <label className="textarea-field">
          <span>Observaciones técnicas</span>
          <textarea
            rows="3"
            value={form.observaciones}
            onChange={(event) => onFieldChange("observaciones", event.target.value)}
          />
        </label>
      </div>

      <div className="panel-subheader panel-subheader-inline">
        <div>
          <h4>Construcciones</h4>
          <p>Múltiples bloques constructivos con calidad y antigüedad oficiales.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onAddBlock}>
          Agregar bloque
        </button>
      </div>

      <div className="blocks-stack">
        {blocks.map((block, index) => (
          <div key={`block-${index}`} className="block-card">
            <div className="block-card-header">
              <strong>Bloque {index + 1}</strong>
              <button type="button" className="ghost-button" onClick={() => onRemoveBlock(index)}>
                Quitar
              </button>
            </div>
            <div className="avaluo-form compact-form">
              <label>
                <span>Superficie</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={block.superficie}
                  onChange={(event) => onBlockChange(index, "superficie", event.target.value)}
                />
              </label>
              <label>
                <span>Calidad</span>
                <select
                  value={block.calidad_constructiva}
                  onChange={(event) => onBlockChange(index, "calidad_constructiva", event.target.value)}
                >
                  {QUALITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Año</span>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={block.anio_construccion}
                  onChange={(event) => onBlockChange(index, "anio_construccion", event.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="context-banner">
        <span>Previsualización de construcción</span>
        <strong>
          {previewLoading
            ? "Valuando bloques..."
            : constructionPreview
              ? formatCurrency(constructionPreview.valor_construccion)
              : "Completa al menos un bloque válido"}
        </strong>
      </div>

      {methodology ? (
        <div className="context-banner">
          <span>Método aplicado</span>
          <strong>
            Riesgo fuera de fórmula · Servicios oficiales máx.{" "}
            {formatNumber(methodology.enforced_rules?.puntaje_servicios_maximo || 0.8, 2)} ·
            Superficie cálculo = superficie manual ?? superficie GIS
          </strong>
        </div>
      ) : null}

      <div className="action-row">
        <button className="primary-button" onClick={onCalculate} disabled={loadingContext || submitting}>
          {submitting ? "Calculando..." : "Generar avalúo"}
        </button>
        <button type="button" className="secondary-button" onClick={onPrintReport} disabled={!avaluo}>
          Imprimir reporte
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {avaluo ? (
        <div className="avaluo-output">
          <div className="panel-subheader">
            <h4>Resultado económico</h4>
            <p>Todo el cálculo ya sale del backend con trazabilidad y tablas oficiales.</p>
          </div>

          <div className="avaluo-result">
            <div>
              <span>Valor terreno</span>
              <strong>{formatCurrency(avaluo.valor_terreno)}</strong>
            </div>
            <div>
              <span>Valor construcción</span>
              <strong>{formatCurrency(avaluo.valor_construccion)}</strong>
            </div>
            <div>
              <span>Base imponible</span>
              <strong>{formatCurrency(avaluo.base_imponible)}</strong>
            </div>
            <div>
              <span>Impuesto estimado</span>
              <strong>{formatCurrency(avaluo.impuesto_estimado)}</strong>
            </div>
            <div>
              <span>Superficie aplicada</span>
              <strong>{formatNumber(avaluo.auditoria?.superficie_calculo)} m2</strong>
            </div>
            <div>
              <span>Fuente superficie</span>
              <strong>{renderValue(avaluo.auditoria?.superficie_fuente)}</strong>
            </div>
            <div>
              <span>Servicios aplicados</span>
              <strong>{renderValue(avaluo.factores_aplicados?.servicios_oficiales?.join(", "))}</strong>
            </div>
            <div>
              <span>Factor pendiente</span>
              <strong>{formatNumber(avaluo.factores_aplicados?.factor_pendiente || 1, 2)}</strong>
            </div>
            <div>
              <span>Valor unitario oficial</span>
              <strong>{formatCurrency(avaluo.factores_aplicados?.valor_unitario || 0)}</strong>
            </div>
            <div>
              <span>Valor unitario aplicado</span>
              <strong>{formatCurrency(avaluo.factores_aplicados?.valor_unitario_aplicado || 0)}</strong>
            </div>
            <div>
              <span>Tablas usadas</span>
              <strong>{avaluo.tablas_utilizadas?.length || 0}</strong>
            </div>
            <div>
              <span>Bloques procesados</span>
              <strong>{avaluo.bloques?.length || 0}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default AvaluoPanel
