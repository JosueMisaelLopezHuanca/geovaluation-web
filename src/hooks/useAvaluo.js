import { useEffect, useMemo, useState } from "react"
import {
  createAvaluo,
  getAvaluoContext,
  getAvaluoCoverageStats,
  getAvaluoHealth,
  getAvaluoMethodology,
  getPredioAudit,
  getPublicCatalogs,
  previewAvaluo,
  previewConstrucciones,
} from "../services/avaluos.service"

const DEFAULT_FORM = {
  gestion_anio: 2026,
  avaluo_tipo: "FISCAL",
  regimen_inmueble: "VIVIENDA_FAMILIAR",
  usuario: "consulta_publica",
  observaciones: "",
  motivo: "",
  es_temporal: true,
  superficie_manual: "",
  frente: "",
  fondo: "",
  forma_lote: "",
  uso_suelo: "",
  tipo_via: "",
  acceso_vehicular: false,
  pendiente_manual: "",
  zona_homogenea_manual: "",
  zona_tributaria_manual: "",
  coordenadas_manual: "",
  distrito_manual: "",
  macrodistrito_manual: "",
  agua: undefined,
  alcantarillado: undefined,
  electricidad: undefined,
  telefono: undefined,
  gas: undefined,
  internet: undefined,
  alumbrado_publico: undefined,
  riesgo_territorial_manual: "",
  tipo_riesgo: "",
  afectacion_riesgo: "",
  valor_unitario_manual: "",
  usar_valor_unitario_manual: false,
  coeficiente_manual: "",
  usar_coeficiente_manual: false,
  depreciacion_manual: "",
  usar_depreciacion_manual: false,
  ajuste_comercial: "",
  clasificacion_especial: "",
  observacion_tecnica: "",
}

const DEFAULT_BLOCK = {
  superficie: "",
  calidad_constructiva: "MEDIA",
  anio_construccion: "",
  estado_conservacion: "BUENO",
  numero_pisos: "",
  uso_construccion: "",
  material_estructural: "",
  tipo_cubierta: "",
  remodelaciones: "",
  depreciacion_manual: "",
  usar_depreciacion_manual: false,
}

const SAMPLE_FORM = {
  motivo: "Datos de ejemplo para prueba del motor",
  es_temporal: true,
  superficie_manual: "250",
  frente: "10",
  fondo: "25",
  forma_lote: "REGULAR",
  uso_suelo: "RESIDENCIAL",
  tipo_via: "ASFALTO",
  acceso_vehicular: true,
  pendiente_manual: "8",
  zona_tributaria_manual: "1-10",
  agua: true,
  alcantarillado: true,
  electricidad: true,
  telefono: true,
  gas: false,
  internet: false,
  alumbrado_publico: true,
  riesgo_territorial_manual: "BAJO",
  valor_unitario_manual: "800",
  usar_valor_unitario_manual: true,
  observacion_tecnica: "Carga rapida para verificar guardado y reporte.",
}

const SAMPLE_BLOCK = {
  superficie: "65",
  calidad_constructiva: "MEDIA",
  anio_construccion: "2015",
  estado_conservacion: "BUENO",
  numero_pisos: "2",
  uso_construccion: "VIVIENDA",
  material_estructural: "MIXTO",
  tipo_cubierta: "LOSA",
  remodelaciones: "",
  depreciacion_manual: "",
  usar_depreciacion_manual: false,
}

const SAMPLE_DIRTY_FIELDS = new Set(Object.keys(SAMPLE_FORM))

const OFFICIAL_SERVICES = [
  "AGUA POTABLE",
  "ALCANTARILLADO",
  "ENERGIA ELECTRICA",
  "TELEFONO",
]
const buildEmptyBlock = () => ({ ...DEFAULT_BLOCK })

const buildAutomaticFormFields = (context = null) => ({
  frente: context?.frente ?? "",
  fondo: context?.fondo ?? "",
  forma_lote: context?.forma_lote ?? "",
  uso_suelo: context?.uso_suelo ?? "",
  tipo_via: context?.tipo_via ?? "",
  zona_homogenea_manual: context?.zona_homogenea_codigo ?? "",
  zona_tributaria_manual: context?.zona_tributaria_codigo ?? "",
  coordenadas_manual: context?.coordenadas ?? "",
  distrito_manual: context?.distrito ?? "",
  macrodistrito_manual: context?.macrodistrito ?? "",
  pendiente_manual: context?.pendiente_grados ?? "",
  riesgo_territorial_manual: context?.riesgo_final ?? "",
  agua: context?.servicios_completos?.["AGUA POTABLE"],
  alcantarillado: context?.servicios_completos?.ALCANTARILLADO,
  electricidad: context?.servicios_completos?.["ENERGIA ELECTRICA"],
  telefono: context?.servicios_completos?.TELEFONO,
  gas: context?.servicios_completos?.["GAS DOMICILIARIO"],
  internet: context?.servicios_completos?.INTERNET,
  alumbrado_publico: context?.servicios_completos?.["ALUMBRADO PUBLICO"],
})

const numOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const boolOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined
  return Boolean(value)
}

const SYSTEM_USERS = new Set(["consulta_publica", "admin"])
const PH_QUALITIES = new Set(["LUJO", "ALTA", "MEDIA", "BASICA"])

const numberMessage = (value, { min = null, max = null, label }) => {
  if (value === "" || value === null || value === undefined) return ""
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return `${label} debe ser un numero valido.`
  if (min !== null && parsed < min) return `${label} debe ser mayor o igual a ${min}.`
  if (max !== null && parsed > max) return `${label} debe ser menor o igual a ${max}.`
  return ""
}

const buildValidationState = (form, blocks) => {
  const fields = {}
  const blockMessages = {}
  const isCommercial = form.avaluo_tipo === "COMERCIAL"

  const setFieldError = (field, message) => {
    if (message) fields[field] = message
  }

  setFieldError("gestion_anio", numberMessage(form.gestion_anio, { min: 2025, max: 2100, label: "La gestion" }))
  setFieldError("superficie_manual", numberMessage(form.superficie_manual, { min: 0.01, label: "La superficie manual" }))
  setFieldError("frente", numberMessage(form.frente, { min: 0.01, label: "El frente" }))
  setFieldError("fondo", numberMessage(form.fondo, { min: 0.01, label: "El fondo" }))
  setFieldError("pendiente_manual", numberMessage(form.pendiente_manual, { min: 0, max: 90, label: "La pendiente" }))
  setFieldError("valor_unitario_manual", numberMessage(form.valor_unitario_manual, { min: 0.01, label: "El valor unitario manual" }))
  setFieldError("coeficiente_manual", numberMessage(form.coeficiente_manual, { min: 0.01, label: "El coeficiente manual" }))
  if (isCommercial) {
    setFieldError("depreciacion_manual", numberMessage(form.depreciacion_manual, { min: 0.01, max: 1, label: "La depreciacion manual" }))
  }
  setFieldError("ajuste_comercial", numberMessage(form.ajuste_comercial, { min: 0.01, label: "El ajuste comercial" }))

  if (form.usar_valor_unitario_manual && !form.valor_unitario_manual) {
    fields.valor_unitario_manual = "Ingresa el valor unitario antes de activar el valor manual."
  }

  if (form.usar_coeficiente_manual && !form.coeficiente_manual) {
    fields.coeficiente_manual = "Ingresa el coeficiente antes de activarlo."
  }

  blocks.forEach((block, index) => {
    const touched = [
      block.superficie,
      block.anio_construccion,
      block.numero_pisos,
      block.uso_construccion,
      block.material_estructural,
      block.tipo_cubierta,
      block.remodelaciones,
      block.depreciacion_manual,
      block.usar_depreciacion_manual,
    ].some((value) => value !== "" && value !== false && value !== null && value !== undefined)
      || block.calidad_constructiva !== DEFAULT_BLOCK.calidad_constructiva
      || block.estado_conservacion !== DEFAULT_BLOCK.estado_conservacion
    if (!touched) return

    const currentMessages = {}
    const superficieMessage = numberMessage(block.superficie, { min: 0.01, label: "La superficie del bloque" })
    const gestionYear = Number(form.gestion_anio)
    const maxConstructionYear = Number.isFinite(gestionYear) ? gestionYear : 2100
    const anioMessage = numberMessage(block.anio_construccion, { min: 1500, max: maxConstructionYear, label: "El anio de construccion" })
    const pisosMessage = numberMessage(block.numero_pisos, { min: 1, max: 120, label: "El numero de pisos" })
    const depreciationMessage = numberMessage(block.depreciacion_manual, { min: 0.01, max: 1, label: "La depreciacion del bloque" })

    if (!block.superficie) currentMessages.superficie = "Indica la superficie construida del bloque."
    else if (superficieMessage) currentMessages.superficie = superficieMessage

    if (!block.anio_construccion) currentMessages.anio_construccion = "Indica el anio aproximado de construccion."
    else if (anioMessage) currentMessages.anio_construccion = anioMessage

    if (pisosMessage) currentMessages.numero_pisos = pisosMessage
    if (isCommercial && depreciationMessage) currentMessages.depreciacion_manual = depreciationMessage
    if (isCommercial && block.usar_depreciacion_manual && !block.depreciacion_manual) {
      currentMessages.depreciacion_manual = "Ingresa la depreciacion antes de activarla."
    }

    if (Object.keys(currentMessages).length) {
      blockMessages[index] = currentMessages
    }
  })

  const summary = [
    ...Object.values(fields),
    ...Object.values(blockMessages).flatMap((messages) => Object.values(messages)),
  ]

  return {
    fields,
    blocks: blockMessages,
    summary,
    hasBlockingErrors: summary.length > 0,
  }
}

export const useAvaluo = (selectedPredio, options = {}) => {
  const {
    onCalculated,
    defaultUsuario = DEFAULT_FORM.usuario,
    authToken = "",
    persistAppraisal = false,
    enableAudit = false,
  } = options
  const [health, setHealth] = useState({ status: "checking", message: "Verificando API..." })
  const [context, setContext] = useState(null)
  const [avaluo, setAvaluo] = useState(null)
  const [preview, setPreview] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [methodology, setMethodology] = useState(null)
  const [catalogs, setCatalogs] = useState(null)
  const [auditEntries, setAuditEntries] = useState([])
  const [constructionPreview, setConstructionPreview] = useState(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    usuario: defaultUsuario,
  }))
  const [blocks, setBlocks] = useState([buildEmptyBlock()])
  const [dirtyFields, setDirtyFields] = useState(new Set())

  useEffect(() => {
    let mounted = true

    const checkHealth = async () => {
      try {
        const response = await getAvaluoHealth()
        if (!mounted) return

        setHealth({
          status: response.status === "ok" ? "online" : "warning",
          message: "Motor de avaluos v2 disponible",
        })
      } catch {
        if (!mounted) return
        setHealth({
          status: "offline",
          message: "Backend no disponible en este momento",
        })
      }
    }

    checkHealth()
    getAvaluoCoverageStats().then(setCoverage).catch(() => {})
    getAvaluoMethodology().then(setMethodology).catch(() => {})
    getPublicCatalogs().then(setCatalogs).catch(() => {})
    const intervalId = setInterval(checkHealth, 15000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    setForm((current) => {
      if (!SYSTEM_USERS.has(current.usuario)) {
        return current
      }

      if (current.usuario === defaultUsuario) {
        return current
      }

      return {
        ...current,
        usuario: defaultUsuario,
      }
    })
  }, [defaultUsuario])

  useEffect(() => {
    if (!selectedPredio?.properties?.id) {
      setContext(null)
      setAvaluo(null)
      setPreview(null)
      setConstructionPreview(null)
      setAuditEntries([])
      setDirtyFields(new Set())
      setError("")
      return
    }

    let mounted = true

    const loadContext = async () => {
      setLoadingContext(true)
      setError("")
      setAvaluo(null)

      try {
        const contextResponse = await getAvaluoContext(selectedPredio.properties.id)
        const auditResponse = enableAudit
          ? await getPredioAudit(selectedPredio.properties.id, 20, authToken)
          : []
        if (mounted) {
          setContext(contextResponse)
          setAuditEntries(auditResponse)
          setDirtyFields(new Set())
          setForm((current) => ({
            ...current,
            ...buildAutomaticFormFields(contextResponse),
          }))
        }
      } catch (contextError) {
        if (mounted) {
          setContext(null)
          setAuditEntries([])
          setError(contextError.message || "No se pudo cargar el contexto del predio")
        }
      } finally {
        if (mounted) {
          setLoadingContext(false)
        }
      }
    }

    loadContext()

    return () => {
      mounted = false
    }
  }, [authToken, enableAudit, selectedPredio])

  const validBlocks = useMemo(
    () =>
      blocks
        .filter((block) => block.superficie && block.calidad_constructiva && block.anio_construccion)
        .map((block) => ({
          superficie: Number(block.superficie),
          calidad_constructiva: block.calidad_constructiva,
          anio_construccion: Number(block.anio_construccion),
          estado_conservacion: block.estado_conservacion || null,
          numero_pisos: numOrNull(block.numero_pisos),
          uso_construccion: block.uso_construccion || null,
          material_estructural: block.material_estructural || null,
          tipo_cubierta: block.tipo_cubierta || null,
          remodelaciones: block.remodelaciones || null,
          depreciacion_manual: numOrNull(block.depreciacion_manual),
          usar_depreciacion_manual: Boolean(block.usar_depreciacion_manual),
        }))
        .filter(
          (block) =>
            Number.isFinite(block.superficie) &&
            block.superficie > 0 &&
            Number.isFinite(block.anio_construccion)
        ),
    [blocks]
  )

  const manualPayload = useMemo(() => {
    const payload = {}
    const setIfDirty = (key, value) => {
      if (!dirtyFields.has(key)) return
      if (value === undefined || value === null || value === "") return
      payload[key] = value
    }

    setIfDirty("superficie_manual", numOrNull(form.superficie_manual))
    setIfDirty("frente", numOrNull(form.frente))
    setIfDirty("fondo", numOrNull(form.fondo))
    setIfDirty("forma_lote", form.forma_lote || null)
    setIfDirty("uso_suelo", form.uso_suelo || null)
    setIfDirty("tipo_via", form.tipo_via || null)
    setIfDirty("acceso_vehicular", boolOrUndefined(form.acceso_vehicular))
    setIfDirty("pendiente_manual", numOrNull(form.pendiente_manual))
    setIfDirty("zona_homogenea_manual", form.zona_homogenea_manual || null)
    setIfDirty("zona_tributaria_manual", form.zona_tributaria_manual || null)
    setIfDirty("coordenadas_manual", form.coordenadas_manual || null)
    setIfDirty("distrito_manual", form.distrito_manual || null)
    setIfDirty("macrodistrito_manual", form.macrodistrito_manual || null)
    setIfDirty("agua", form.agua)
    setIfDirty("alcantarillado", form.alcantarillado)
    setIfDirty("electricidad", form.electricidad)
    setIfDirty("telefono", form.telefono)
    setIfDirty("gas", form.gas)
    setIfDirty("internet", form.internet)
    setIfDirty("alumbrado_publico", form.alumbrado_publico)
    setIfDirty("riesgo_territorial_manual", form.riesgo_territorial_manual || null)
    setIfDirty("tipo_riesgo", form.tipo_riesgo || null)
    setIfDirty("afectacion_riesgo", form.afectacion_riesgo || null)
    setIfDirty("valor_unitario_manual", numOrNull(form.valor_unitario_manual))
    setIfDirty("usar_valor_unitario_manual", Boolean(form.usar_valor_unitario_manual))
    setIfDirty("coeficiente_manual", numOrNull(form.coeficiente_manual))
    setIfDirty("usar_coeficiente_manual", Boolean(form.usar_coeficiente_manual))
    setIfDirty("depreciacion_manual", numOrNull(form.depreciacion_manual))
    setIfDirty("usar_depreciacion_manual", Boolean(form.usar_depreciacion_manual))
    setIfDirty("ajuste_comercial", numOrNull(form.ajuste_comercial))
    setIfDirty("clasificacion_especial", form.clasificacion_especial || null)
    setIfDirty("observacion_tecnica", form.observacion_tecnica || null)

    if (Object.keys(payload).length === 0) return null

    return {
      motivo: form.motivo || null,
      es_temporal: Boolean(form.es_temporal),
      ...payload,
    }
  }, [dirtyFields, form])

  const validation = useMemo(() => buildValidationState(form, blocks), [blocks, form])
  const publicCalculationPayload = useMemo(
    () =>
      selectedPredio?.properties?.id
        ? {
            predio_id: selectedPredio.properties.id,
            gestion_anio: Number(form.gestion_anio),
            avaluo_tipo: form.avaluo_tipo,
            regimen_inmueble: form.regimen_inmueble,
            usuario: "consulta_publica",
            manual: manualPayload,
            bloques: validBlocks,
          }
        : null,
    [selectedPredio, form.gestion_anio, form.avaluo_tipo, form.regimen_inmueble, manualPayload, validBlocks],
  )

  useEffect(() => {
    if (!selectedPredio?.properties?.id) return
    if (validation.hasBlockingErrors) {
      setPreview(null)
      setConstructionPreview(null)
      setPreviewLoading(false)
      return
    }

    let mounted = true

    const runPreview = async () => {
      setPreviewLoading(true)
      try {
        const [avaluoPreview, blockPreview] = await Promise.all([
          previewAvaluo({
            predio_id: selectedPredio.properties.id,
            gestion_anio: Number(form.gestion_anio),
            avaluo_tipo: form.avaluo_tipo,
            regimen_inmueble: form.regimen_inmueble,
            usuario: form.usuario,
            manual: manualPayload,
            bloques: validBlocks,
          }),
          validBlocks.length > 0
            ? previewConstrucciones({
                gestion_anio: Number(form.gestion_anio),
                avaluo_tipo: form.avaluo_tipo,
                regimen_inmueble: form.regimen_inmueble,
                zona_tributaria_codigo: context?.zona_tributaria_codigo || null,
                manual: manualPayload,
                bloques: validBlocks,
              })
            : Promise.resolve(null),
        ])
        if (mounted) {
          setPreview(avaluoPreview)
          setConstructionPreview(blockPreview)
        }
      } catch {
        if (mounted) {
          setPreview(null)
          setConstructionPreview(null)
        }
      } finally {
        if (mounted) {
          setPreviewLoading(false)
        }
      }
    }

    runPreview()

    return () => {
      mounted = false
    }
  }, [selectedPredio, context?.zona_tributaria_codigo, form.gestion_anio, form.avaluo_tipo, form.regimen_inmueble, form.usuario, validBlocks, manualPayload, validation.hasBlockingErrors])

  const updateField = (name, value) => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setError("")
    setDirtyFields((current) => new Set(current).add(name))
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    if (name === "regimen_inmueble" && value === "PROPIEDAD_HORIZONTAL") {
      setBlocks((current) =>
        current.map((block) =>
          PH_QUALITIES.has(block.calidad_constructiva)
            ? block
            : { ...block, calidad_constructiva: "MEDIA" }
        )
      )
    }
  }

  const resetFieldToAutomatic = (name) => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setError("")
    setDirtyFields((current) => {
      const next = new Set(current)
      next.delete(name)
      return next
    })
    setForm((current) => ({
      ...current,
      [name]: DEFAULT_FORM[name] ?? "",
    }))
  }

  const updateBlock = (index, field, value) => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setError("")
    setBlocks((current) =>
      current.map((block, currentIndex) =>
        currentIndex === index
          ? {
              ...block,
              [field]: value,
            }
          : block
      )
    )
  }

  const addBlock = () => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setError("")
    setBlocks((current) => [...current, buildEmptyBlock()])
  }

  const removeBlock = (index) => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setError("")
    setBlocks((current) => (current.length === 1 ? [buildEmptyBlock()] : current.filter((_, i) => i !== index)))
  }

  const loadExampleData = () => {
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setDirtyFields(new Set(SAMPLE_DIRTY_FIELDS))
    setForm((current) => ({
      ...current,
      ...SAMPLE_FORM,
      observaciones: "Avaluo de ejemplo para validar guardado.",
    }))
    setBlocks([{ ...SAMPLE_BLOCK }])
    setError("")
  }

  const resetDraft = () => {
    setDirtyFields(new Set())
    setBlocks([buildEmptyBlock()])
    setError("")
    setAvaluo(null)
    setPreview(null)
    setConstructionPreview(null)
    setForm((current) => ({
      ...DEFAULT_FORM,
      gestion_anio: current.gestion_anio || DEFAULT_FORM.gestion_anio,
      avaluo_tipo: current.avaluo_tipo || DEFAULT_FORM.avaluo_tipo,
      usuario: current.usuario || defaultUsuario || DEFAULT_FORM.usuario,
      ...buildAutomaticFormFields(context),
    }))
  }

  const calculate = async () => {
    if (!selectedPredio?.properties?.id) return
    if (validation.hasBlockingErrors) {
      setError("Revisa los campos marcados antes de calcular el valuo.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await createAvaluo({
        predio_id: selectedPredio.properties.id,
        gestion_anio: Number(form.gestion_anio),
        avaluo_tipo: form.avaluo_tipo,
        regimen_inmueble: form.regimen_inmueble,
        usuario: form.usuario,
        observaciones: form.observaciones || null,
        manual: manualPayload,
        bloques: validBlocks,
        persistir_override: Boolean(persistAppraisal),
      }, authToken)

      setAvaluo(response)
      if (enableAudit) {
        const auditResponse = await getPredioAudit(selectedPredio.properties.id, 20, authToken)
        setAuditEntries(auditResponse)
      }
      await onCalculated?.(response)
    } catch (submitError) {
      setError(submitError.message || "No se pudo calcular el avaluo")
    } finally {
      setSubmitting(false)
    }
  }

  return {
    health,
    context,
    avaluo,
    preview,
    coverage,
    methodology,
    catalogs,
    constructionPreview,
    officialServices: OFFICIAL_SERVICES,
    auditEntries,
    blocks,
    form,
    error,
    validation,
    loadingContext,
    previewLoading,
    submitting,
    publicCalculationPayload,
    updateField,
    resetFieldToAutomatic,
    updateBlock,
    addBlock,
    removeBlock,
    loadExampleData,
    resetDraft,
    calculate,
  }
}
