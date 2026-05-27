import { useState } from "react"
import ContentState from "./ui/ContentState"
import { formatCurrency, formatNumber, getFeatureLabel } from "../utils/map"

const QUALITY_OPTIONS = ["ALTA", "MEDIA", "BASICA", "SOCIAL", "MARGINAL", "LUJO"]
const PH_QUALITY_OPTIONS = new Set(["LUJO", "ALTA", "MEDIA", "BASICA"])
const RISK_OPTIONS = ["MUY BAJO", "BAJO", "MODERADO", "ALTO", "MUY ALTO"]
const LOT_SHAPE_OPTIONS = ["REGULAR", "IRREGULAR", "ESQUINERO", "PASILLO", "LADERA"]
const LAND_USE_OPTIONS = [
  "RESIDENCIAL",
  "MIXTO",
  "COMERCIAL",
  "INSTITUCIONAL",
  "EQUIPAMIENTO",
  "LOTE BALDIO",
]
const ROAD_OPTIONS = [
  "ASFALTO",
  "ADOQUIN",
  "CEMENTO",
  "LOSETA",
  "PIEDRA",
  "RIPIO",
  "TIERRA",
]
const CONDITION_OPTIONS = ["EXCELENTE", "BUENO", "REGULAR", "MALO"]
const BUILDING_USE_OPTIONS = [
  "VIVIENDA",
  "COMERCIO",
  "MIXTO",
  "OFICINA",
  "DEPOSITO",
  "EQUIPAMIENTO",
  "OTRO",
]
const STRUCTURE_OPTIONS = [
  "HORMIGON ARMADO",
  "LADRILLO",
  "ADOBE",
  "MIXTO",
  "MADERA",
  "METALICO",
  "OTRO",
]
const ROOF_OPTIONS = ["LOSA", "CALAMINA", "TEJA", "FIBROCEMENTO", "MIXTA", "OTRO"]

const renderValue = (value, fallback = "Sin dato") => {
  if (value === null || value === undefined || value === "") return fallback
  return value
}

const renderAutomaticSlope = (context) => {
  if (context?.pendiente_grados != null) return `${formatNumber(context.pendiente_grados)} grados`
  if (context?.pendiente_codigo != null) return `Clase GIS ${context.pendiente_codigo}`
  return "Sin dato"
}

const sourceLabel = (source) => {
  if (!source) return "SIN DATO"
  if (source === "oficial") return "OFICIAL"
  if (source === "manual") return "MANUAL"
  if (source === "automatico") return "AUTOMATICO"
  if (source === "estimacion") return "ESTIMACION"
  if (source === "fiscal_consulta") return "FISCAL / FUENTE 2023"
  if (source === "referencial") return "COMERCIAL / REFERENCIAL"
  if (source === "sin_dato") return "SIN DATO"
  return String(source).toUpperCase()
}

const SourceBadge = ({ source, temporary = false }) => (
  <span className={`source-badge source-${String(source || "sin_dato").toLowerCase()}`}>
    {sourceLabel(source)}
    {temporary ? " / TEMPORAL" : ""}
  </span>
)

const DataFieldCard = ({ label, value, source }) => (
  <div className="data-card">
    <span>{label}</span>
    <strong>{renderValue(value)}</strong>
    {source ? <SourceBadge source={source.source} temporary={source.is_temporary} /> : null}
  </div>
)

const FormulaCard = ({ title, formula }) => {
  if (!formula) return null
  const components = formula.componentes || []
  const blocks = formula.bloques || []

  return (
    <div className="panel-card nested-panel">
      <div className="panel-subheader">
        <h4>{title}</h4>
        <p>{formula.simbolica}</p>
      </div>
      <div className="context-banner">
        <span>Formula expandida</span>
        <strong>{formula.expandida}</strong>
      </div>
      {components.length ? (
        <div className="audit-list">
          {components.map((component) => (
            <div key={`${title}-${component.nombre}`} className="audit-item">
              <strong>{component.nombre}</strong>
              <span>{renderValue(component.valor)}</span>
              <small>
                {renderValue(component.fuente)} / {renderValue(component.tabla)}
              </small>
            </div>
          ))}
        </div>
      ) : null}
      {blocks.length ? (
        <div className="audit-list">
          {blocks.map((block, index) => (
            <div key={`${title}-block-${index}`} className="audit-item">
              <strong>Bloque {index + 1}</strong>
              <span>{block.expandida}</span>
              <small>{block.simbolica}</small>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const manualCheckboxItems = [
  ["agua", "Agua"],
  ["alcantarillado", "Alcantarillado"],
  ["electricidad", "Electricidad"],
  ["telefono", "Telefono"],
  ["gas", "Gas"],
  ["internet", "Internet"],
  ["alumbrado_publico", "Alumbrado publico"],
]
const officialServiceKeys = new Set(["agua", "alcantarillado", "electricidad", "telefono"])

const exportButtons = [
  ["PDF", "pdf"],
  ["Excel", "excel"],
  ["CSV", "csv"],
  ["GeoJSON", "geojson"],
]

const FormSection = ({ title, description, children, open = true, actions = null }) => {
  const [isOpen, setIsOpen] = useState(open)

  return (
    <details
      className="form-section"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary>
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
        {actions}
      </summary>
      <div className="avaluo-form section-form">{children}</div>
    </details>
  )
}

const catalogValues = (catalogs, key, fallback) =>
  catalogs?.[key]?.length ? catalogs[key] : fallback

const OptionList = ({ options, label = "Selecciona una opcion" }) => (
  <>
    <option value="">{label}</option>
    {options.map((option) => {
      const value = typeof option === "string" ? option : option.value
      const optionLabel = typeof option === "string" ? option : option.label

      return (
        <option key={value} value={value}>
          {optionLabel}
        </option>
      )
    })}
  </>
)

const FieldMessage = ({ message }) =>
  message ? <small className="field-error">{message}</small> : null

const formatArea = (value) =>
  value === null || value === undefined ? "Sin dato" : `${formatNumber(value)} m2`

const PublicCalculationTrace = ({ result }) => {
  const factors = result.factores_aplicados || {}
  const context = result.contexto_espacial || {}
  const formula = result.formula_aplicada || {}
  const blocks = result.bloques || []
  const isHorizontal = result.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
  const buildingArea = blocks.reduce((total, block) => total + Number(block.superficie || 0), 0)
  const serviceDetail = factors.factor_servicios_minimo_aplicado
    ? "Se aplico el minimo normativo porque no se confirmaron servicios oficiales."
    : `${(factors.servicios_oficiales || []).length} servicios oficiales considerados.`

  return (
    <details className="public-trace">
      <summary>
        <div>
          <strong>Como se calculo</strong>
          <span>Revisa los datos usados, formulas e IMPBI aplicado.</span>
        </div>
        <em>Trazabilidad</em>
      </summary>
      <div className="public-trace-body">
        <div className="public-trace-steps">
          <article>
            <span className="trace-step-number">1</span>
            <div>
              <small>Superficie utilizada</small>
              <strong>{isHorizontal ? formatArea(buildingArea) : formatArea(context.superficie_calculo)}</strong>
              <p>
                {isHorizontal
                  ? "Superficie declarada de la unidad en propiedad horizontal."
                  : `Fuente: ${renderValue(context.superficie_fuente, "dato del predio")}.`}
              </p>
            </div>
          </article>
          <article>
            <span className="trace-step-number">2</span>
            <div>
              <small>{isHorizontal ? "Ubicacion PH" : "Valor del terreno"}</small>
              <strong>
                {isHorizontal
                  ? `Factor ${formatNumber(factors.factor_ubicacion_ph || 1, 3)}`
                  : formatCurrency(result.valor_terreno)}
              </strong>
              <p>
                {isHorizontal
                  ? `Zona ${renderValue(context.zona_tributaria_codigo)}. El terreno queda incluido en este factor.`
                  : `Servicios ${formatNumber(factors.factor_servicios || 0, 2)} y pendiente ${formatNumber(factors.factor_pendiente || 1, 2)}. ${serviceDetail}`}
              </p>
            </div>
          </article>
          <article>
            <span className="trace-step-number">3</span>
            <div>
              <small>Construccion</small>
              <strong>{formatCurrency(result.valor_construccion)}</strong>
              <p>
                {blocks.length
                  ? `${blocks.length} bloque${blocks.length === 1 ? "" : "s"} valorado${blocks.length === 1 ? "" : "s"} por tipologia y antiguedad.`
                  : "No se declararon construcciones para este calculo."}
              </p>
            </div>
          </article>
          <article>
            <span className="trace-step-number">4</span>
            <div>
              <small>Base imponible</small>
              <strong>{formatCurrency(result.base_imponible)}</strong>
              <p>{formula.base_imponible?.expandida || "Suma de componentes valorados."}</p>
            </div>
          </article>
          <article className="is-tax-step">
            <span className="trace-step-number">5</span>
            <div>
              <small>IMPBI estimado</small>
              <strong>{formatCurrency(result.impuesto_estimado)}</strong>
              <p>
                Tramo {renderValue(factors.impbi_tramo)} / alicuota excedente{" "}
                {formatNumber((factors.alicuota_excedente || 0) * 100, 6)}%.
              </p>
            </div>
          </article>
        </div>

        {blocks.length ? (
          <section className="public-trace-blocks" aria-label="Detalle de construcciones valoradas">
            <h5>Detalle de construcciones</h5>
            <div>
              {blocks.map((block, index) => (
                <article key={`public-trace-block-${index}`}>
                  <strong>Bloque {index + 1} / {block.calidad_constructiva}</strong>
                  <span>{formatArea(block.superficie)} / {block.anio_construccion}</span>
                  <small>
                    Tipologia {formatCurrency(block.valor_tipologia_m2)} por m2 / antiguedad{" "}
                    {formatNumber(block.factor_antiguedad, 3)}
                    {isHorizontal ? ` / PH ${formatNumber(block.factor_ubicacion_ph || 1, 3)}` : ""}
                  </small>
                  <em>{formatCurrency(block.valor_bloque)}</em>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="public-trace-formulas" aria-label="Formulas aplicadas">
          <h5>Formulas aplicadas</h5>
          {!isHorizontal && formula.terreno ? (
            <p><span>Terreno</span><strong>{formula.terreno.expandida}</strong></p>
          ) : null}
          {formula.construccion ? (
            <p><span>{isHorizontal ? "Unidad PH" : "Construccion"}</span><strong>{formula.construccion.expandida}</strong></p>
          ) : null}
          {formula.impuesto ? (
            <p><span>IMPBI</span><strong>{formula.impuesto.expandida}</strong></p>
          ) : null}
        </section>

        <aside className="public-trace-warning">
          <strong>Referencia documental</strong>
          <p>
            {result.normativa?.resolucion_municipal || "Fuente municipal no disponible."} La fuente
            fue verificada para {renderValue(result.normativa?.fuente_gestion_anio)}; confirma la
            vigencia de la gestion consultada antes de usar el resultado en un tramite oficial.
          </p>
        </aside>
      </div>
    </details>
  )
}

const AvaluoPanel = ({
  selectedPredio,
  context,
  avaluo,
  preview,
  methodology,
  catalogs,
  constructionPreview,
  auditEntries,
  blocks,
  form,
  error,
  validation,
  loadingContext,
  previewLoading,
  submitting,
  onFieldChange,
  onResetField,
  onBlockChange,
  onAddBlock,
  onRemoveBlock,
  onLoadExample,
  onResetDraft,
  onCalculate,
  onPrintReport,
  onExportReport,
  audience = "admin",
  embedded = false,
}) => {
  const activeResult = avaluo || preview
  const diff = context?.diferencia_superficie
  const modeDefinition = methodology?.motores?.[form.avaluo_tipo]
  const isCommercial = form.avaluo_tipo === "COMERCIAL"
  const isHorizontal = form.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
  const isPublic = audience === "public"
  const publicModeBadgeSource = isCommercial ? "referencial" : "fiscal_consulta"
  const fieldErrors = validation?.fields || {}
  const blockErrors = validation?.blocks || {}
  const validationSummary = validation?.summary || []
  const options = {
    calidad_constructiva: catalogValues(catalogs, "calidad_constructiva", QUALITY_OPTIONS),
    riesgo_territorial: catalogValues(catalogs, "riesgo_territorial", RISK_OPTIONS),
    forma_lote: catalogValues(catalogs, "forma_lote", LOT_SHAPE_OPTIONS),
    uso_suelo: catalogValues(catalogs, "uso_suelo", LAND_USE_OPTIONS),
    tipo_via: catalogValues(catalogs, "tipo_via", ROAD_OPTIONS),
    estado_conservacion: catalogValues(catalogs, "estado_conservacion", CONDITION_OPTIONS),
    uso_construccion: catalogValues(catalogs, "uso_construccion", BUILDING_USE_OPTIONS),
    material_estructural: catalogValues(catalogs, "material_estructural", STRUCTURE_OPTIONS),
    tipo_cubierta: catalogValues(catalogs, "tipo_cubierta", ROOF_OPTIONS),
  }
  const constructionQualityOptions = isHorizontal
    ? options.calidad_constructiva.filter((option) =>
        PH_QUALITY_OPTIONS.has(typeof option === "string" ? option : option.value)
      )
    : options.calidad_constructiva
  const panelClassName = `panel-card${embedded ? " is-embedded-panel" : ""}${
    isPublic ? " is-public-avaluo-panel" : ""
  }`

  const renderResetButton = onResetDraft ? (
    <button type="button" className="ghost-button" onClick={onResetDraft}>
      Limpiar formulario
    </button>
  ) : null

  if (!selectedPredio) {
    return (
      <section className={panelClassName}>
        <div className="panel-header">
          <p className="eyebrow">{isPublic ? "Valuacion ciudadana" : "Motor v2"}</p>
          <h3>{isPublic ? "Valua tu predio paso a paso" : "Avaluo tecnico"}</h3>
        </div>

        {isPublic ? (
          <>
            <div className="context-banner public-callout">
              <span>Antes de calcular</span>
              <strong>
                Busca una OTB o un codigo catastral, toca el predio correcto y luego completa
                solo los datos que conozcas. Lo demas se toma del mapa automaticamente.
              </strong>
            </div>
            <div className="inline-button-row">
              <button type="button" className="primary-button" onClick={onLoadExample} disabled>
                Selecciona un predio para cargar ejemplo
              </button>
              {renderResetButton}
            </div>
          </>
        ) : null}

        <ContentState
          kind="empty"
          compact
          title="Selecciona un predio"
          description={
            isPublic
              ? "Elige un predio en el mapa para ver sus datos base y generar tu valuo catastral."
              : "Elige un predio en el mapa para cargar su contexto GIS y comenzar el calculo tecnico."
          }
        />
      </section>
    )
  }

  return (
    <section className={panelClassName}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            {isPublic ? "Estimacion guiada" : "Motor de avaluos v2"}
          </p>
          <h3>{getFeatureLabel(selectedPredio)}</h3>
        </div>
        <SourceBadge
          source={isPublic ? publicModeBadgeSource : form.avaluo_tipo === "FISCAL" ? "oficial" : "manual"}
        />
      </div>

      {isPublic ? (
        <div className="context-banner public-callout">
          <span>Consejo rapido</span>
          <strong>
            Puedes dejar vacios los datos que no conozcas. El sistema intentara usar el contexto
            oficial del predio y solo aplicara tus cambios donde realmente edites.
          </strong>
        </div>
      ) : null}

      <div className="detail-grid">
        <div>
          <span>ID</span>
          <strong>{selectedPredio.properties.id}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>
            {loadingContext ? "Consultando..." : context ? "Contexto listo" : "Sin contexto"}
          </strong>
        </div>
      </div>

      {loadingContext ? (
        <ContentState
          kind="loading"
          compact
          title={isPublic ? "Cargando datos del predio" : "Cargando contexto tecnico"}
          description={
            isPublic
              ? "Estamos leyendo capas del mapa, superficies y referencias tributarias para ayudarte con el valuo."
              : "Estamos consultando capas espaciales, superficies y factores aplicables al predio."
          }
        />
      ) : null}

      {context ? (
        <>
          <div className="panel-subheader">
            <h4>{isPublic ? "Superficie y medidas del predio" : "Comparacion GIS vs legal"}</h4>
            <p>
              {isPublic
                ? "La superficie corregida modifica el calculo. Frente y fondo quedan como referencia hasta contar con una regla oficial aplicable."
                : "La superficie manual sobreescribe la superficie legal y GIS cuando exista."}
            </p>
          </div>
          <div className="context-grid">
            <DataFieldCard
              label="Superficie GIS"
              value={`${formatNumber(context.superficie_gis)} m2`}
              source={context.fuentes?.superficie_gis}
            />
            <DataFieldCard
              label="Superficie legal"
              value={
                context.superficie_legal == null
                  ? "Sin dato"
                  : `${formatNumber(context.superficie_legal)} m2`
              }
              source={context.fuentes?.superficie_legal}
            />
            <DataFieldCard
              label="Superficie calculo"
              value={`${formatNumber(context.superficie_calculo)} m2`}
              source={context.fuentes?.superficie}
            />
            <div className={`data-card diff-${String(diff?.color || "gris")}`}>
              <span>Diferencia</span>
              <strong>
                {diff?.porcentaje_diferencia == null
                  ? "Sin base legal"
                  : `${formatNumber(diff?.porcentaje_diferencia)} %`}
              </strong>
              <span className="diff-chip">{diff?.clasificacion}</span>
            </div>
          </div>

          <div className="panel-subheader">
            <h4>{isPublic ? "Lectura territorial automatica" : "Contexto territorial"}</h4>
            <p>
              {isPublic
                ? "Estos datos vienen del mapa y sirven como referencia para el valuo si no haces una correccion manual."
                : "Fuentes visibles para lectura tributaria y auditoria GIS."}
            </p>
          </div>
          <div className="context-grid">
            <DataFieldCard
              label="Zona homogenea"
              value={context.zona_homogenea_codigo}
              source={context.fuentes?.zona_homogenea}
            />
            <DataFieldCard
              label="Zona tributaria"
              value={context.zona_tributaria_codigo}
              source={context.fuentes?.zona_tributaria}
            />
            <DataFieldCard
              label="Material via"
              value={context.material_via_codigo}
              source={context.fuentes?.tipo_via}
            />
            <DataFieldCard
              label="Pendiente detectada"
              value={renderAutomaticSlope(context)}
              source={context.fuentes?.pendiente}
            />
            <DataFieldCard
              label="Riesgo final"
              value={context.riesgo_final}
              source={context.fuentes?.riesgo}
            />
            <DataFieldCard
              label="Distrito / Macrodistrito"
              value={`${renderValue(context.distrito)} / ${renderValue(context.macrodistrito)}`}
              source={context.fuentes?.distrito}
            />
            <DataFieldCard
              label="Frente"
              value={context.frente == null ? "Sin dato" : `${formatNumber(context.frente)} m`}
              source={context.fuentes?.frente}
            />
            <DataFieldCard
              label="Fondo"
              value={context.fondo == null ? "Sin dato" : `${formatNumber(context.fondo)} m`}
              source={context.fuentes?.fondo}
            />
          </div>

          <div className="services-editor">
            <span>Servicios detectados y su fuente</span>
            <div className="services-grid">
              {Object.entries(context.servicios_completos || {}).map(([service, enabled]) => (
                <div key={service} className={`service-chip ${enabled ? "is-active" : ""}`}>
                  <span>{service}</span>
                  <SourceBadge
                    source={context.fuentes?.[`servicio:${service}`]?.source}
                    temporary={context.fuentes?.[`servicio:${service}`]?.is_temporary}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="panel-subheader">
        <h4>{isPublic ? "Como quieres valorar el predio" : "Tipo de avaluo"}</h4>
        <p>
          {isPublic
            ? "Fiscal usa parametros contrastados con la fuente municipal 2023. La vigencia para un tramite actual debe confirmarse."
            : "Fiscal usa factores normativos. Comercial habilita factores de mercado y localizacion."}
        </p>
      </div>
      <div className="avaluo-form compact-form">
        <label>
          <span>Modo de avaluo</span>
          <select
            value={form.avaluo_tipo}
            onChange={(event) => onFieldChange("avaluo_tipo", event.target.value)}
          >
            <option value="FISCAL">Fiscal - fuente GAMLP verificada 2023</option>
            <option value="COMERCIAL">Comercial referencial - no oficial</option>
          </select>
        </label>
        <label>
          <span>Regimen del inmueble</span>
          <select
            value={form.regimen_inmueble}
            onChange={(event) => onFieldChange("regimen_inmueble", event.target.value)}
          >
            <option value="VIVIENDA_FAMILIAR">Vivienda familiar / predio</option>
            <option value="PROPIEDAD_HORIZONTAL">Departamento / propiedad horizontal</option>
          </select>
        </label>
        <div className="data-card">
          <span>Motor activo</span>
          <strong>{form.avaluo_tipo}</strong>
          <SourceBadge
            source={isPublic ? publicModeBadgeSource : form.avaluo_tipo === "FISCAL" ? "oficial" : "manual"}
          />
        </div>
      </div>

      {modeDefinition ? (
        <div className="context-banner">
          <span>{isPublic ? "Formula que se aplicara" : "Formula normativa activa"}</span>
          <strong>
            {isHorizontal
              ? modeDefinition.formula_propiedad_horizontal
              : modeDefinition.formula_terreno}
          </strong>
        </div>
      ) : null}

      <div className="panel-subheader panel-subheader-inline">
        <div>
          <h4>{isPublic ? "Completa o corrige datos" : "Datos temporales / no oficiales"}</h4>
          <p>
            {isPublic
              ? "Empieza con el ejemplo y luego corrige solo lo necesario para tu predio."
              : "Si completas estos campos, el motor usa manual; si no, cae al dato oficial o automatico."}
          </p>
        </div>
        <div className="inline-button-row inline-button-row-compact">
          <button type="button" className="secondary-button" onClick={onLoadExample}>
            Cargar ejemplo
          </button>
          {renderResetButton}
        </div>
      </div>

      <FormSection
        title="Datos base y geometria"
        description={
          isPublic
            ? "Gestion, medidas y datos minimos para arrancar el calculo."
            : "Gestion, responsable, motivo y medidas principales del predio."
        }
      >
        <label>
          <span>Gestion tributaria</span>
          <input
            type="number"
            min="2025"
            inputMode="numeric"
            value={form.gestion_anio}
            onChange={(event) => onFieldChange("gestion_anio", event.target.value)}
          />
          <FieldMessage message={fieldErrors.gestion_anio} />
        </label>

        {!isPublic ? (
          <>
            <label>
              <span>Usuario</span>
              <input
                type="text"
                value={form.usuario}
                onChange={(event) => onFieldChange("usuario", event.target.value)}
              />
            </label>
            <label>
              <span>Motivo tecnico</span>
              <input
                type="text"
                value={form.motivo}
                onChange={(event) => onFieldChange("motivo", event.target.value)}
              />
            </label>
            <label className="toggle-field">
              <span>Dato temporal</span>
              <input
                type="checkbox"
                checked={Boolean(form.es_temporal)}
                onChange={(event) => onFieldChange("es_temporal", event.target.checked)}
              />
            </label>
          </>
        ) : null}

        <label>
          <span>Superficie manual</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 250"
            value={form.superficie_manual}
            onChange={(event) => onFieldChange("superficie_manual", event.target.value)}
          />
          <FieldMessage message={fieldErrors.superficie_manual} />
          {isPublic ? (
            <small className="field-hint">
              Usa este campo solo si la superficie real del predio difiere del dato cargado por el
              sistema.
            </small>
          ) : null}
          <button
            type="button"
            className="micro-button"
            onClick={() => onResetField("superficie_manual")}
          >
            Volver a automatico
          </button>
        </label>
        <label>
          <span>Pendiente manual</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 8"
            value={form.pendiente_manual}
            onChange={(event) => onFieldChange("pendiente_manual", event.target.value)}
          />
          <FieldMessage message={fieldErrors.pendiente_manual} />
          {isPublic ? (
            <small className="field-hint">
              Ingresa grados solo si deseas reemplazar la clase de pendiente detectada en el mapa.
            </small>
          ) : null}
        </label>
        <label>
          <span>Frente</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 10"
            value={form.frente}
            onChange={(event) => onFieldChange("frente", event.target.value)}
          />
          <FieldMessage message={fieldErrors.frente} />
        </label>
        <label>
          <span>Fondo</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 25"
            value={form.fondo}
            onChange={(event) => onFieldChange("fondo", event.target.value)}
          />
          <FieldMessage message={fieldErrors.fondo} />
        </label>
      </FormSection>

      <FormSection
        title="Contexto urbano y riesgo"
        description={
          isPublic
            ? isCommercial
              ? "Via, pendiente, zona, uso y forma pueden afectar el calculo comercial; el riesgo economico proviene del mapa oficial."
              : "Via, pendiente y zona tributaria pueden afectar el calculo; los demas datos documentan el contexto."
            : "Uso, via, zonas de valor y lectura territorial complementaria."
        }
        open={isPublic}
      >
        <label>
          <span>Forma del lote</span>
          <select
            value={form.forma_lote}
            onChange={(event) => onFieldChange("forma_lote", event.target.value)}
          >
            <OptionList options={options.forma_lote} />
          </select>
        </label>
        <label>
          <span>Uso de suelo</span>
          <select
            value={form.uso_suelo}
            onChange={(event) => onFieldChange("uso_suelo", event.target.value)}
          >
            <OptionList options={options.uso_suelo} />
          </select>
        </label>
        <label>
          <span>Material de via frontal</span>
          <select
            value={form.tipo_via}
            onChange={(event) => onFieldChange("tipo_via", event.target.value)}
          >
            <OptionList options={options.tipo_via} />
          </select>
          {isPublic ? (
            <small className="field-hint">
              Selecciona el material visible: asfalto, adoquin, cemento, loseta, piedra, ripio o tierra.
            </small>
          ) : null}
        </label>
        <label className="toggle-field">
          <span>Acceso vehicular</span>
          <input
            type="checkbox"
            checked={Boolean(form.acceso_vehicular)}
            onChange={(event) => onFieldChange("acceso_vehicular", event.target.checked)}
          />
          {isPublic ? (
            <small className="field-hint">Dato descriptivo; actualmente no modifica el valor calculado.</small>
          ) : null}
        </label>
        <label>
          <span>Zona homogenea manual</span>
          <input
            type="text"
            placeholder="Ej. ZH-03"
            value={form.zona_homogenea_manual}
            onChange={(event) => onFieldChange("zona_homogenea_manual", event.target.value)}
          />
          {isPublic ? (
            <small className="field-hint">Referencia territorial; la zona tributaria es la que define la tabla de suelo.</small>
          ) : null}
        </label>
        <label>
          <span>Zona tributaria manual</span>
          <input
            type="text"
            placeholder="Ej. 1-10"
            value={form.zona_tributaria_manual}
            onChange={(event) => onFieldChange("zona_tributaria_manual", event.target.value)}
          />
          {isPublic ? (
            <small className="field-hint">
              Modifica esta simulacion; no reemplaza la zona registrada oficialmente.
            </small>
          ) : null}
        </label>
        <label>
          <span>Riesgo territorial</span>
          <select
            value={form.riesgo_territorial_manual}
            onChange={(event) => onFieldChange("riesgo_territorial_manual", event.target.value)}
          >
            <option value="">Automatico</option>
            {options.riesgo_territorial.map((option) => {
              const value = typeof option === "string" ? option : option.value
              const label = typeof option === "string" ? option : option.label

              return (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            })}
          </select>
          {isPublic ? (
            <small className="field-hint">
              {isCommercial
                ? "El factor economico de riesgo se toma de la capa GIS oficial; este dato queda como referencia declarada."
                : "El riesgo es informativo en modo fiscal; no reduce ni incrementa el valor."}
            </small>
          ) : null}
        </label>
        <label>
          <span>Tipo de riesgo</span>
          <input
            type="text"
            placeholder="Ej. Deslizamiento"
            value={form.tipo_riesgo}
            onChange={(event) => onFieldChange("tipo_riesgo", event.target.value)}
          />
          {isPublic ? <small className="field-hint">Dato descriptivo para futura validacion.</small> : null}
        </label>
        <label>
          <span>Afectacion</span>
          <input
            type="text"
            placeholder="Ej. Parcial"
            value={form.afectacion_riesgo}
            onChange={(event) => onFieldChange("afectacion_riesgo", event.target.value)}
          />
          {isPublic ? <small className="field-hint">Dato descriptivo para futura validacion.</small> : null}
        </label>
      </FormSection>

      <FormSection
        title="Valores manuales y observacion"
        description={
          isPublic
            ? "Solo completa esta parte si deseas reemplazar el valor automatico o dejar una observacion."
            : "Activa solo los factores que deban reemplazar al valor oficial."
        }
        open={isCommercial || isPublic}
      >
        <label>
          <span>{isPublic ? "Valor unitario declarado (simulacion)" : "Valor unitario manual"}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 800"
            value={form.valor_unitario_manual}
            onChange={(event) => onFieldChange("valor_unitario_manual", event.target.value)}
          />
          <FieldMessage message={fieldErrors.valor_unitario_manual} />
          {isPublic ? (
            <small className="field-hint">
              Al completarlo, reemplaza el valor oficial solo dentro de esta simulacion.
            </small>
          ) : null}
          <button
            type="button"
            className="micro-button"
            onClick={() => onResetField("valor_unitario_manual")}
          >
            Volver a automatico
          </button>
        </label>
        <label className="toggle-field">
          <span>Usar valor manual</span>
          <input
            type="checkbox"
            checked={Boolean(form.usar_valor_unitario_manual)}
            onChange={(event) => onFieldChange("usar_valor_unitario_manual", event.target.checked)}
          />
        </label>

        {isCommercial ? (
          <>
            <label>
              <span>Coeficiente manual</span>
              <input
                type="number"
                min="0.01"
                step="0.0001"
                inputMode="decimal"
                placeholder="Ej. 1.05"
                value={form.coeficiente_manual}
                onChange={(event) => onFieldChange("coeficiente_manual", event.target.value)}
              />
              <FieldMessage message={fieldErrors.coeficiente_manual} />
              <button
                type="button"
                className="micro-button"
                onClick={() => onResetField("coeficiente_manual")}
              >
                Volver a automatico
              </button>
            </label>
            <label className="toggle-field">
              <span>Usar coeficiente manual</span>
              <input
                type="checkbox"
                checked={Boolean(form.usar_coeficiente_manual)}
                onChange={(event) =>
                  onFieldChange("usar_coeficiente_manual", event.target.checked)
                }
              />
            </label>
            <label>
              <span>Ajuste comercial</span>
              <input
                type="number"
                step="0.0001"
                inputMode="decimal"
                placeholder="Ej. 0.98"
                value={form.ajuste_comercial}
                onChange={(event) => onFieldChange("ajuste_comercial", event.target.value)}
              />
              <FieldMessage message={fieldErrors.ajuste_comercial} />
            </label>
            <label>
              <span>Ubicacion especial</span>
              <select
                value={form.clasificacion_especial}
                onChange={(event) =>
                  onFieldChange("clasificacion_especial", event.target.value)
                }
              >
                <option value="">Sin ajuste especial</option>
                <option value="ESQUINA">Esquina</option>
                <option value="AVENIDA">Sobre avenida principal</option>
                <option value="ESQUINA_AVENIDA">Esquina sobre avenida principal</option>
              </select>
              {isPublic ? (
                <small className="field-hint">Solo interviene en la estimacion comercial.</small>
              ) : null}
            </label>
          </>
        ) : null}

        <label className="textarea-field">
          <span>Observacion tecnica</span>
          <textarea
            rows="3"
            placeholder="Ej. El predio tiene acceso por escalinata y mejoras parciales."
            value={form.observacion_tecnica}
            onChange={(event) => onFieldChange("observacion_tecnica", event.target.value)}
          />
          {isPublic ? (
            <small className="field-hint">
              Escribe aqui cualquier detalle importante que no aparezca en el mapa.
            </small>
          ) : null}
        </label>
      </FormSection>

      <div className="services-editor">
        <span>{isPublic ? "Servicios del predio" : "Servicios editables"}</span>
        {isPublic ? (
          <small className="field-hint">
            Agua, alcantarillado, energia electrica y telefono participan en el factor fiscal.
            Si no se confirma ninguno, la tabla fiscal aplica el minimo 0.20. Gas, internet y
            alumbrado se registran como informacion complementaria.
          </small>
        ) : null}
        <div className="services-grid">
          {manualCheckboxItems.map(([key, label]) => (
            isPublic && officialServiceKeys.has(key) ? (
              <label
                key={key}
                className={`service-choice ${form[key] === true ? "is-active" : ""}`}
              >
                <span>{label}</span>
                <select
                  aria-label={`${label}: servicio declarado`}
                  value={form[key] === undefined ? "" : form[key] ? "SI" : "NO"}
                  onChange={(event) =>
                    onFieldChange(
                      key,
                      event.target.value === "" ? undefined : event.target.value === "SI",
                    )
                  }
                >
                  <option value="">No se / usar detectado</option>
                  <option value="SI">Si tiene</option>
                  <option value="NO">No tiene</option>
                </select>
              </label>
            ) : (
              <label key={key} className={`service-chip ${form[key] ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(event) => onFieldChange(key, event.target.checked)}
                />
                <span>{label}</span>
              </label>
            )
          ))}
        </div>
        <FieldMessage message={fieldErrors.servicios} />
      </div>

      <div className="panel-subheader panel-subheader-inline">
        <div>
          <h4>{isPublic ? "Construcciones y mejoras" : "Construcciones"}</h4>
          <p>
            {isPublic
              ? isHorizontal
                ? "Agrega la superficie de la unidad. El factor de ubicacion PH incluye su fraccion ideal de terreno."
                : "Agrega un bloque por cada construccion principal para mejorar la precision del resultado."
              : "Multiples bloques con estado, pisos, material, cubierta y depreciacion opcional."}
          </p>
          {isPublic ? (
            <small className="field-hint">
              {isCommercial
                ? "La estimacion comercial puede aplicar estado, remodelaciones y depreciacion manual si existe una matriz referencial."
                : isHorizontal
                  ? "En PH intervienen superficie de la unidad, tipologia PH, antiguedad y factor de ubicacion de la zona."
                  : "En el calculo fiscal intervienen superficie, tipologia y antiguedad. Estado, material, cubierta y remodelaciones se registran como referencia."}
            </small>
          ) : null}
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
                  inputMode="decimal"
                  placeholder="Ej. 65"
                  value={block.superficie}
                  onChange={(event) => onBlockChange(index, "superficie", event.target.value)}
                />
                <FieldMessage message={blockErrors[index]?.superficie} />
              </label>
              <label>
                <span>Calidad</span>
                <select
                  value={block.calidad_constructiva}
                  onChange={(event) =>
                    onBlockChange(index, "calidad_constructiva", event.target.value)
                  }
                >
                  {constructionQualityOptions.map((option) => {
                    const value = typeof option === "string" ? option : option.value
                    const label = typeof option === "string" ? option : option.label

                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label>
                <span>Anio</span>
                <input
                  type="number"
                  min="1500"
                  max="2100"
                  inputMode="numeric"
                  placeholder="Ej. 2015"
                  value={block.anio_construccion}
                  onChange={(event) =>
                    onBlockChange(index, "anio_construccion", event.target.value)
                  }
                />
                <FieldMessage message={blockErrors[index]?.anio_construccion} />
                {isPublic ? (
                  <small className="field-hint">
                    Puedes usar un anio aproximado, incluso si es anterior a 1900; no puede ser posterior a la gestion.
                  </small>
                ) : null}
              </label>
              <label>
                <span>Estado conservacion</span>
                <select
                  value={block.estado_conservacion}
                  onChange={(event) =>
                    onBlockChange(index, "estado_conservacion", event.target.value)
                  }
                >
                  {options.estado_conservacion.map((option) => {
                    const value = typeof option === "string" ? option : option.value
                    const label = typeof option === "string" ? option : option.label

                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label>
                <span>Numero de pisos</span>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Ej. 2"
                  value={block.numero_pisos}
                  onChange={(event) => onBlockChange(index, "numero_pisos", event.target.value)}
                />
                <FieldMessage message={blockErrors[index]?.numero_pisos} />
              </label>
              <label>
                <span>Uso construccion</span>
                <select
                  value={block.uso_construccion}
                  onChange={(event) =>
                    onBlockChange(index, "uso_construccion", event.target.value)
                  }
                >
                  <OptionList options={options.uso_construccion} />
                </select>
              </label>
              <label>
                <span>Material estructural</span>
                <select
                  value={block.material_estructural}
                  onChange={(event) =>
                    onBlockChange(index, "material_estructural", event.target.value)
                  }
                >
                  <OptionList options={options.material_estructural} />
                </select>
              </label>
              <label>
                <span>Tipo cubierta</span>
                <select
                  value={block.tipo_cubierta}
                  onChange={(event) =>
                    onBlockChange(index, "tipo_cubierta", event.target.value)
                  }
                >
                  <OptionList options={options.tipo_cubierta} />
                </select>
              </label>
              <label>
                <span>Remodelaciones</span>
                <input
                  type="text"
                  placeholder="Ej. Cocina y fachada"
                  value={block.remodelaciones}
                  onChange={(event) =>
                    onBlockChange(index, "remodelaciones", event.target.value)
                  }
                />
              </label>
              {isCommercial ? (
                <>
                  <label>
                    <span>Depreciacion manual</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.01"
                      inputMode="decimal"
                      placeholder="Ej. 0.92"
                      value={block.depreciacion_manual}
                      onChange={(event) =>
                        onBlockChange(index, "depreciacion_manual", event.target.value)
                      }
                    />
                    <FieldMessage message={blockErrors[index]?.depreciacion_manual} />
                  </label>
                  <label className="toggle-field">
                    <span>Usar depreciacion manual</span>
                    <input
                      type="checkbox"
                      checked={Boolean(block.usar_depreciacion_manual)}
                      onChange={(event) =>
                        onBlockChange(index, "usar_depreciacion_manual", event.target.checked)
                      }
                    />
                  </label>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="context-banner">
        <span>Previsualizacion en tiempo real</span>
        <strong>
          {previewLoading
            ? "Recalculando motor..."
            : activeResult
              ? `${isHorizontal ? "Terreno incluido en PH" : `Terreno ${formatCurrency(activeResult.valor_terreno)}`} / Construccion ${formatCurrency(activeResult.valor_construccion)} / IMPBI ref. ${formatCurrency(activeResult.impuesto_estimado)}`
              : "Completa datos para ver el calculo"}
        </strong>
      </div>

      {constructionPreview ? (
        <div className="context-banner">
          <span>Bloques constructivos</span>
          <strong>{formatCurrency(constructionPreview.valor_construccion)}</strong>
        </div>
      ) : null}

      <div className={`action-row${isPublic ? " is-public-actions" : ""}`}>
        {validationSummary.length ? (
          <div className="validation-summary">
            <strong>Revisa estos datos</strong>
            <ul>
              {validationSummary.slice(0, 4).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          className="primary-button"
          onClick={onCalculate}
          disabled={loadingContext || submitting || validation?.hasBlockingErrors}
        >
          {submitting
            ? "Calculando..."
            : isPublic
              ? "Calcular valuo catastral"
              : "Guardar avaluo"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onPrintReport}
          disabled={!avaluo}
        >
          {isPublic ? "Imprimir resumen" : "Imprimir reporte"}
        </button>
        {isPublic && renderResetButton}
      </div>

      {activeResult ? (
        <>
          <div className="avaluo-output">
            <div className="panel-subheader">
              <h4>{isPublic ? "Resultado estimado" : "Resultado economico"}</h4>
              <p>
                {isPublic
                  ? "Este resultado combina los datos del mapa con la informacion que completaste en el formulario."
                  : "Preview y resultado persistido comparten la misma logica del backend."}
              </p>
            </div>
            <div className="avaluo-result">
              <div>
                <span>Modo</span>
                <strong>{activeResult.avaluo_tipo}</strong>
              </div>
              <div>
                <span>Regimen</span>
                <strong>
                  {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
                    ? "Propiedad horizontal"
                    : "Vivienda familiar / predio"}
                </strong>
              </div>
              <div>
                <span>Normativa aplicada</span>
                <strong>{renderValue(activeResult.normativa?.nombre)}</strong>
              </div>
              <div>
                <span>Fuente / gestion calculada</span>
                <strong>
                  Fuente {renderValue(activeResult.normativa?.fuente_gestion_anio)} / calculo {renderValue(activeResult.normativa?.vigente_para_gestion)}
                </strong>
              </div>
              <div>
                <span>Resolucion</span>
                <strong>{renderValue(activeResult.normativa?.resolucion_municipal)}</strong>
              </div>
              <div>
                <span>Valor terreno</span>
                <strong>
                  {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
                    ? "Incluido en factor PH"
                    : formatCurrency(activeResult.valor_terreno)}
                </strong>
              </div>
              <div>
                <span>Valor construccion</span>
                <strong>{formatCurrency(activeResult.valor_construccion)}</strong>
              </div>
              <div>
                <span>Base imponible</span>
                <strong>{formatCurrency(activeResult.base_imponible)}</strong>
              </div>
              <div>
                <span>IMPBI estimado (referencia 2023)</span>
                <strong>{formatCurrency(activeResult.impuesto_estimado)}</strong>
              </div>
              <div>
                <span>Valor unitario final</span>
                <strong>
                  {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
                    ? "No aplica en PH"
                    : formatCurrency(activeResult.factores_aplicados?.valor_unitario_final || 0)}
                </strong>
              </div>
              <div>
                <span>Fuente valor unitario</span>
                <strong>{renderValue(activeResult.factores_aplicados?.valor_unitario_fuente)}</strong>
              </div>
              <div>
                <span>Factor servicios</span>
                <strong>
                  {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
                    ? "No aplica en PH"
                    : formatNumber(activeResult.factores_aplicados?.puntaje_servicios || 0, 2)}
                  {activeResult.regimen_inmueble !== "PROPIEDAD_HORIZONTAL" && activeResult.factores_aplicados?.factor_servicios_minimo_aplicado
                    ? " (minimo normativo)"
                    : ""}
                </strong>
              </div>
              <div>
                <span>Factor pendiente</span>
                <strong>
                  {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
                    ? "No aplica en PH"
                    : formatNumber(activeResult.factores_aplicados?.factor_pendiente || 1, 2)}
                </strong>
              </div>
              {activeResult.regimen_inmueble === "PROPIEDAD_HORIZONTAL" ? (
                <div>
                  <span>Factor ubicacion PH</span>
                  <strong>{formatNumber(activeResult.factores_aplicados?.factor_ubicacion_ph || 1, 3)}</strong>
                </div>
              ) : null}
              {activeResult.avaluo_tipo === "COMERCIAL" ? (
                <>
                  <div>
                    <span>Factor riesgo</span>
                    <strong>
                      {formatNumber(activeResult.factores_aplicados?.factor_riesgo || 1, 2)}
                    </strong>
                  </div>
                  <div>
                    <span>Coeficiente comercial</span>
                    <strong>
                      {formatNumber(
                        activeResult.factores_aplicados?.coeficiente_comercial || 1,
                        2,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Factor esquina</span>
                    <strong>
                      {formatNumber(activeResult.factores_aplicados?.factor_esquina || 1, 2)}
                    </strong>
                  </div>
                  <div>
                    <span>Factor avenida</span>
                    <strong>
                      {formatNumber(activeResult.factores_aplicados?.factor_avenida || 1, 2)}
                    </strong>
                  </div>
                  <div>
                    <span>Factor forma</span>
                    <strong>
                      {formatNumber(activeResult.factores_aplicados?.factor_forma || 1, 2)}
                    </strong>
                  </div>
                </>
              ) : null}
            </div>
            {isPublic && activeResult.normativa?.alcance ? (
              <div className="context-banner">
                <span>Alcance del IMPBI</span>
                <strong>{activeResult.normativa.alcance}</strong>
              </div>
            ) : null}
            {isPublic ? <PublicCalculationTrace result={activeResult} /> : null}
          </div>

          {!isPublic ? (
            <>
              <div className="panel-subheader">
                <h4>Tablas maestras utilizadas</h4>
              </div>
              <div className="audit-list">
                {(activeResult.tablas_utilizadas || []).map((table) => (
                  <div key={`${table.nombre}-${table.version_codigo}`} className="audit-item">
                    <strong>{table.nombre}</strong>
                    <span>{renderValue(table.descripcion)}</span>
                    <small>
                      {renderValue(table.version_codigo)} /{" "}
                      {renderValue(table.resolucion_municipal)}
                    </small>
                  </div>
                ))}
              </div>

              <FormulaCard title="Valor terreno" formula={activeResult.formula_aplicada?.terreno} />
              <FormulaCard
                title="Valor construccion"
                formula={activeResult.formula_aplicada?.construccion}
              />
              <FormulaCard
                title="Base imponible"
                formula={activeResult.formula_aplicada?.base_imponible}
              />
              <FormulaCard title="Impuesto" formula={activeResult.formula_aplicada?.impuesto} />
            </>
          ) : null}
        </>
      ) : null}

      {!isPublic && avaluo?.export_urls ? (
        <div className="export-row">
          {exportButtons.map(([label, format]) =>
            avaluo.export_urls[format] ? (
              <button
                key={label}
                type="button"
                className="secondary-button"
                disabled={!onExportReport}
                onClick={() => onExportReport?.(format)}
              >
                Exportar {label}
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {!isPublic && auditEntries?.length ? (
        <>
          <div className="panel-subheader">
            <h4>Ultimos cambios auditados</h4>
          </div>
          <div className="audit-list">
            {auditEntries.slice(0, 6).map((entry) => (
              <div key={entry.auditoria_id} className="audit-item">
                <strong>{entry.campo}</strong>
                <span>
                  {renderValue(entry.valor_anterior)}
                  {" -> "}
                  {renderValue(entry.valor_nuevo)}
                </span>
                <small>
                  {entry.fuente_nueva}
                  {entry.es_temporal ? " / temporal" : ""}
                  {entry.motivo ? ` / ${entry.motivo}` : ""}
                </small>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {error ? (
        <ContentState
          kind="error"
          compact
          title={isPublic ? "No se pudo generar el valuo" : "No se pudo guardar el avaluo"}
          description={error}
        />
      ) : null}
    </section>
  )
}

export default AvaluoPanel
