import { useState } from "react"
import AvaluoPanel from "./AvaluoPanel"
import { submitPublicBetaConsultation } from "../services/avaluos.service"
import { formatCurrency, formatNumber, getFeatureLabel } from "../utils/map"

const OFFICIAL_SERVICE_FIELDS = ["agua", "alcantarillado", "electricidad", "telefono"]
const OFFICIAL_SERVICE_MAP = {
  agua: "AGUA POTABLE",
  alcantarillado: "ALCANTARILLADO",
  electricidad: "ENERGIA ELECTRICA",
  telefono: "TELEFONO",
}

const hasEffectiveOfficialService = (context, form) =>
  OFFICIAL_SERVICE_FIELDS.some((field) => {
    if (form[field] !== undefined) return form[field] === true
    return Boolean(context?.servicios_completos?.[OFFICIAL_SERVICE_MAP[field]])
  })

const PublicSummaryCard = ({ label, value, helper = null, emphasized = false }) => (
  <div className={`public-data-card${emphasized ? " is-emphasized" : ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    {helper ? <small>{helper}</small> : null}
  </div>
)

const EMPTY_BETA_FORM = {
  utilidad_resultado: "",
  comentario: "",
  acepta_registro_consulta: false,
  acepta_contacto: false,
  nombre_contacto: "",
  correo_contacto: "",
  telefono_contacto: "",
}

const PublicBetaParticipation = ({ result, calculationPayload }) => {
  const [form, setForm] = useState(EMPTY_BETA_FORM)
  const [status, setStatus] = useState({ type: "idle", message: "" })

  if (!result || !calculationPayload) return null

  const updateField = (name, value) => {
    setStatus({ type: "idle", message: "" })
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.acepta_registro_consulta) {
      setStatus({ type: "error", message: "Autoriza el registro de la consulta para enviarla." })
      return
    }
    if (form.acepta_contacto && !form.correo_contacto.trim() && !form.telefono_contacto.trim()) {
      setStatus({ type: "error", message: "Ingresa un correo o telefono si deseas seguimiento." })
      return
    }

    setStatus({ type: "loading", message: "Enviando aporte beta..." })
    try {
      const response = await submitPublicBetaConsultation({
        calculo: calculationPayload,
        utilidad_resultado: form.utilidad_resultado || null,
        comentario: form.comentario.trim() || null,
        nombre_contacto: form.acepta_contacto ? form.nombre_contacto.trim() || null : null,
        correo_contacto: form.acepta_contacto ? form.correo_contacto.trim() || null : null,
        telefono_contacto: form.acepta_contacto ? form.telefono_contacto.trim() || null : null,
        acepta_registro_consulta: form.acepta_registro_consulta,
        acepta_contacto: form.acepta_contacto,
        consentimiento_version: "beta-v1",
      })
      setStatus({ type: "success", message: response.message })
    } catch (submitError) {
      setStatus({
        type: "error",
        message: submitError.message || "No se pudo registrar tu participacion.",
      })
    }
  }

  const submitted = status.type === "success"

  return (
    <details className="public-beta-card">
      <summary>
        <div>
          <p className="eyebrow">Prueba beta</p>
          <strong>Ayudanos a mejorar el sistema</strong>
          <span>Comparte esta consulta voluntariamente o deja un contacto opcional.</span>
        </div>
      </summary>
      <form className="public-beta-form" onSubmit={submit}>
        <div className="public-beta-note">
          <strong>Tu resultado no cambia.</strong>
          <p>
            La participacion se guarda aparte del avaluo. Nunca se usa tu contacto para modificar
            el valor calculado.
          </p>
        </div>
        <p className="public-beta-policy">
          Tus datos se usan solo para mejorar esta prueba. Si compartes contacto, puedes solicitar
          su eliminación escribiendo a{" "}
          <a href="mailto:lopezhuancajosuemisael@gmail.com">
            lopezhuancajosuemisael@gmail.com
          </a>
          .
        </p>

        <label>
          <span>Este resultado te parece util?</span>
          <select
            value={form.utilidad_resultado}
            onChange={(event) => updateField("utilidad_resultado", event.target.value)}
            disabled={submitted}
          >
            <option value="">Prefiero no responder</option>
            <option value="UTIL">Si, me orienta</option>
            <option value="PARCIAL">Parcialmente</option>
            <option value="NO_REFLEJA">No refleja mi predio</option>
            <option value="NO_SE">No estoy seguro</option>
          </select>
        </label>
        <label>
          <span>Comentario opcional</span>
          <textarea
            rows="3"
            maxLength="1000"
            placeholder="Ej. Falta considerar una construccion o un dato no coincide. No incluyas informacion sensible."
            value={form.comentario}
            onChange={(event) => updateField("comentario", event.target.value)}
            disabled={submitted}
          />
        </label>

        <label className="public-beta-check">
          <input
            type="checkbox"
            checked={form.acepta_registro_consulta}
            onChange={(event) => updateField("acepta_registro_consulta", event.target.checked)}
            disabled={submitted}
          />
          <span>
            Autorizo guardar esta consulta para mejorar la prueba beta.
            <small>
              Se almacenan el predio consultado, datos usados, resultado y mi comentario si lo envio.
            </small>
          </span>
        </label>

        <label className="public-beta-check">
          <input
            type="checkbox"
            checked={form.acepta_contacto}
            onChange={(event) => updateField("acepta_contacto", event.target.checked)}
            disabled={submitted}
          />
          <span>
            Deseo que me contacten para validar mi experiencia.
            <small>Opcional. Tu contacto queda separado del calculo catastral.</small>
          </span>
        </label>

        {form.acepta_contacto ? (
          <div className="public-beta-contact">
            <label>
              <span>Nombre opcional</span>
              <input
                type="text"
                maxLength="120"
                value={form.nombre_contacto}
                onChange={(event) => updateField("nombre_contacto", event.target.value)}
                disabled={submitted}
              />
            </label>
            <label>
              <span>Correo</span>
              <input
                type="email"
                maxLength="254"
                placeholder="nombre@correo.com"
                value={form.correo_contacto}
                onChange={(event) => updateField("correo_contacto", event.target.value)}
                disabled={submitted}
              />
            </label>
            <label>
              <span>Telefono</span>
              <input
                type="tel"
                maxLength="30"
                placeholder="+591 ..."
                value={form.telefono_contacto}
                onChange={(event) => updateField("telefono_contacto", event.target.value)}
                disabled={submitted}
              />
            </label>
          </div>
        ) : null}

        {status.message ? (
          <p className={`public-beta-status is-${status.type}`} role="status">
            {status.message}
          </p>
        ) : null}
        <button
          type="submit"
          className="primary-button"
          disabled={submitted || status.type === "loading"}
        >
          {submitted ? "Aporte registrado" : status.type === "loading" ? "Enviando..." : "Enviar aporte beta"}
        </button>
      </form>
    </details>
  )
}

const formatDate = (value) => {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

const formatSlopeReference = (context) => {
  if (context?.pendiente_grados != null) return `${formatNumber(context.pendiente_grados)} grados`
  if (context?.pendiente_codigo != null) return `clase GIS ${context.pendiente_codigo}`
  return "Sin dato"
}

const buildQualityModel = ({ selectedPredio, context, form, blocks }) => {
  const isHorizontal = form.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
  const hasConstructionBlock = blocks.some(
    (block) => block.superficie && block.anio_construccion && block.calidad_constructiva,
  )
  const hasConfirmedService = hasEffectiveOfficialService(context, form)
  const checks = [
    {
      label: "Predio seleccionado",
      ok: Boolean(selectedPredio),
      helper: selectedPredio ? "El calculo tiene una geometria base." : "Selecciona un predio del mapa.",
    },
    {
      label: "Superficie disponible",
      ok: Boolean(context?.superficie_calculo || form.superficie_manual),
      helper: "Base principal para terreno.",
    },
    {
      label: isHorizontal ? "Zona para factor PH" : "Zona y material de via",
      ok: Boolean(context?.zona_tributaria_codigo && (isHorizontal || context?.material_via_codigo || form.tipo_via)),
      helper: isHorizontal ? "Determina el factor de ubicacion de la unidad." : "Ayuda a elegir el valor unitario.",
    },
    {
      label: isHorizontal ? "Regimen PH elegido" : "Factor de servicios disponible",
      ok: Boolean(context),
      helper: isHorizontal
        ? "El terreno queda incorporado mediante el factor PH."
        : hasConfirmedService
        ? "Se aplican servicios confirmados."
        : "Sin confirmacion, aplica minimo normativo 0.20.",
    },
    {
      label: "Construcciones declaradas",
      ok: hasConstructionBlock,
      helper: "Agrega bloques si el predio tiene edificacion.",
    },
  ]
  const completed = checks.filter((check) => check.ok).length
  const percent = Math.round((completed / checks.length) * 100)
  const level = percent >= 80 ? "Alta" : percent >= 60 ? "Media" : "Basica"

  return { checks, completed, percent, level }
}

const PublicValuationPanel = ({
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
  publicCalculationPayload,
  locationStatus,
  onUseLocation,
  onOpenAdmin,
  publicHistoryItems = [],
  selectedPublicHistoryId = "",
  onSelectPublicHistory,
  onClearPublicHistory,
  onPrintPublicHistory,
}) => {
  const activeResult = avaluo || preview
  const quality = buildQualityModel({ selectedPredio, context, form, blocks })
  const activePublicHistoryId = selectedPublicHistoryId || publicHistoryItems[0]?.id || ""
  const hasConstructionBlock = blocks.some(
    (block) => block.superficie && block.anio_construccion && block.calidad_constructiva,
  )
  const hasConfirmedService = hasEffectiveOfficialService(context, form)
  const isHorizontal = form.regimen_inmueble === "PROPIEDAD_HORIZONTAL"
  const publicNotices = selectedPredio
    ? [
        !hasConstructionBlock
          ? "Si el predio tiene construcciones, agrega al menos un bloque para mejorar la precision."
          : null,
        !isHorizontal && !hasConfirmedService
          ? "Si no confirmas servicios oficiales, el calculo fiscal aplica automaticamente el factor minimo 0.20."
          : null,
        !isHorizontal && !form.tipo_via
          ? "Si conoces el material de la via frontal, seleccionarlo mejora el calculo del valor del suelo."
          : null,
      ].filter(Boolean)
    : []

  return (
    <section className="panel-card public-panel public-workspace">
      <div className="panel-header">
        <p className="eyebrow">Consulta publica</p>
        <h3>Valua tu predio sin cuenta</h3>
        <p className="public-hero-copy">
          El sistema toma datos automaticos del mapa y te deja ajustar los campos necesarios para
          generar una valuacion catastral guiada.
        </p>
      </div>

      <div className="public-pill-row">
        <div className="public-pill">
          <span>Acceso</span>
          <strong>Libre</strong>
        </div>
        <div className="public-pill">
          <span>OTBs</span>
          <strong>Seleccion guiada</strong>
        </div>
        <div className="public-pill">
          <span>Motor</span>
          <strong>Fiscal ref. 2023 / comercial</strong>
        </div>
      </div>

      <div className="public-actions public-actions-rich">
        <button type="button" className="primary-button" onClick={onLoadExample} disabled={!selectedPredio}>
          {selectedPredio ? "Cargar ejemplo" : "Selecciona un predio primero"}
        </button>
        <button type="button" className="secondary-button" onClick={onUseLocation}>
          Usar mi ubicacion
        </button>
        <button type="button" className="ghost-button" onClick={onResetDraft}>
          Limpiar campos
        </button>
      </div>

      {locationStatus ? <p className="location-status">{locationStatus}</p> : null}

      <div className="public-summary-grid">
        <PublicSummaryCard
          label="Predio seleccionado"
          value={selectedPredio ? getFeatureLabel(selectedPredio) : "Aun no seleccionado"}
          helper={
            selectedPredio
              ? loadingContext
                ? "Cargando contexto del predio..."
                : "Listo para completar el formulario"
              : "Busca por OTB o toca un predio visible en el mapa"
          }
        />
        <PublicSummaryCard
          label="Valor estimado"
          value={
            activeResult
              ? formatCurrency(activeResult.valor_total || activeResult.base_imponible)
              : "Completa los datos para ver el calculo"
          }
          helper={
            activeResult
              ? `IMPBI estimado ref. 2023 ${formatCurrency(activeResult.impuesto_estimado)}`
              : "La previsualizacion se actualiza automaticamente"
          }
          emphasized
        />
        <PublicSummaryCard
          label="Referencia territorial"
          value={context?.zona_tributaria_codigo || "Sin zona detectada"}
          helper={
            context
              ? `Riesgo ${context.riesgo_final || "Sin dato"} / Pendiente ${formatSlopeReference(context)}`
              : "Selecciona un predio para cargar zona, riesgo y pendiente"
          }
        />
        <PublicSummaryCard
          label="Superficie de calculo"
          value={
            context?.superficie_calculo == null
              ? "Sin dato"
              : `${formatNumber(context.superficie_calculo)} m2`
          }
          helper="Puedes corregirla manualmente en el formulario"
        />
      </div>

      <div className="public-guide">
        <div>
          <span>1</span>
          <strong>Ubica</strong>
          <p>Elige una OTB o busca el codigo catastral para acercarte al predio correcto.</p>
        </div>
        <div>
          <span>2</span>
          <strong>Completa</strong>
          <p>Carga el ejemplo y corrige solo los datos que conozcas del predio.</p>
        </div>
        <div>
          <span>3</span>
          <strong>Calcula</strong>
          <p>Obtendras la base imponible y un IMPBI estimado con fuente oficial verificada.</p>
        </div>
      </div>

      <div className="public-quality-card">
        <div className="public-quality-header">
          <div>
            <span>Calidad de estimacion</span>
            <strong>{quality.level}</strong>
          </div>
          <small>{quality.completed}/5 datos clave listos</small>
        </div>
        <div className="public-quality-meter" aria-hidden="true">
          <span style={{ width: `${quality.percent}%` }} />
        </div>
        <div className="public-quality-list">
          {quality.checks.map((check) => (
            <div key={check.label} className={check.ok ? "is-complete" : ""}>
              <strong>{check.ok ? "Listo" : "Pendiente"}</strong>
              <span>{check.label}</span>
              <small>{check.helper}</small>
            </div>
          ))}
        </div>
      </div>

      {!selectedPredio ? (
        <div className="public-empty-state public-empty-state-highlight">
          <strong>Empieza por una OTB o un predio.</strong>
          <p>
            Este espacio esta pensado para el publico: no necesitas una cuenta para probar el
            motor. Primero selecciona un predio en el mapa y luego puedes usar el boton de ejemplo
            para completar una prueba rapida.
          </p>
        </div>
      ) : null}

      {publicNotices.length ? (
        <div className="public-notice-stack">
          {publicNotices.map((notice) => (
            <div key={notice} className="public-notice-card">
              <strong>Sugerencia</strong>
              <p>{notice}</p>
            </div>
          ))}
        </div>
      ) : null}

      {publicHistoryItems.length ? (
        <div className="public-history-panel">
          <div className="panel-subheader panel-subheader-inline">
            <div>
              <p className="eyebrow">Tu historial reciente</p>
              <h4>Consultas guardadas en este navegador</h4>
            </div>
            <button type="button" className="ghost-button" onClick={onClearPublicHistory}>
              Limpiar
            </button>
          </div>
          <div className="public-history-list">
            {publicHistoryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`public-history-item${
                  activePublicHistoryId === item.id ? " is-active" : ""
                }`}
                onClick={() => onSelectPublicHistory?.(item.id)}
              >
                <span>{item.codigo_catastral}</span>
                <strong>{formatCurrency(item.base_imponible || 0)}</strong>
                <small>
                  {formatDate(item.created_at)} / impuesto {formatCurrency(item.impuesto_estimado || 0)}
                </small>
                <em>{item.zona_tributaria || "Zona sin dato"}</em>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onPrintPublicHistory?.(activePublicHistoryId)}
          >
            Imprimir consulta seleccionada
          </button>
        </div>
      ) : null}

      <AvaluoPanel
        selectedPredio={selectedPredio}
        context={context}
        avaluo={avaluo}
        preview={preview}
        methodology={methodology}
        catalogs={catalogs}
        constructionPreview={constructionPreview}
        auditEntries={auditEntries}
        blocks={blocks}
        form={form}
        error={error}
        validation={validation}
        loadingContext={loadingContext}
        previewLoading={previewLoading}
        submitting={submitting}
        onFieldChange={onFieldChange}
        onResetField={onResetField}
        onBlockChange={onBlockChange}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        onLoadExample={onLoadExample}
        onResetDraft={onResetDraft}
        onCalculate={onCalculate}
        onPrintReport={onPrintReport}
        audience="public"
        embedded
      />

      {avaluo ? (
        <PublicBetaParticipation
          key={`${avaluo.predio_id}:${avaluo.base_imponible}:${avaluo.impuesto_estimado}`}
          result={avaluo}
          calculationPayload={publicCalculationPayload}
        />
      ) : null}

      <button type="button" className="text-link-button" onClick={onOpenAdmin}>
        Acceso admin
      </button>
    </section>
  )
}

export default PublicValuationPanel
