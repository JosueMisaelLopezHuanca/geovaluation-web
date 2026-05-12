import { useEffect, useState } from "react"
import {
  createAvaluo,
  getAvaluoContext,
  getAvaluoCoverageStats,
  getAvaluoHealth,
  getAvaluoMethodology,
  previewConstrucciones,
} from "../services/avaluos.service"

const DEFAULT_FORM = {
  gestion_anio: 2026,
  usuario: "admin",
  superficie_manual: "",
  superficie_override_reason: "",
  observaciones: "",
}

const DEFAULT_BLOCK = {
  superficie: "",
  calidad_constructiva: "MEDIA",
  anio_construccion: "",
}

const OFFICIAL_SERVICES = [
  "AGUA POTABLE",
  "ALCANTARILLADO",
  "ENERGIA ELECTRICA",
  "TELEFONO",
]

const buildEmptyBlock = () => ({ ...DEFAULT_BLOCK })

export const useAvaluo = (selectedPredio, options = {}) => {
  const { onCalculated } = options
  const [health, setHealth] = useState({ status: "checking", message: "Verificando API..." })
  const [context, setContext] = useState(null)
  const [avaluo, setAvaluo] = useState(null)
  const [coverage, setCoverage] = useState(null)
  const [methodology, setMethodology] = useState(null)
  const [constructionPreview, setConstructionPreview] = useState(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(DEFAULT_FORM)
  const [blocks, setBlocks] = useState([buildEmptyBlock()])

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
    const intervalId = setInterval(checkHealth, 15000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!selectedPredio?.properties?.id) {
      setContext(null)
      setAvaluo(null)
      setConstructionPreview(null)
      setError("")
      return
    }

    let mounted = true

    const loadContext = async () => {
      setLoadingContext(true)
      setError("")
      setAvaluo(null)

      try {
        const response = await getAvaluoContext(selectedPredio.properties.id)
        if (mounted) {
          setContext(response)
        }
      } catch (contextError) {
        if (mounted) {
          setContext(null)
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
  }, [selectedPredio])

  useEffect(() => {
    const validBlocks = blocks
      .filter((block) => block.superficie && block.calidad_constructiva && block.anio_construccion)
      .map((block) => ({
        superficie: Number(block.superficie),
        calidad_constructiva: block.calidad_constructiva,
        anio_construccion: Number(block.anio_construccion),
      }))
      .filter(
        (block) =>
          Number.isFinite(block.superficie) &&
          block.superficie > 0 &&
          Number.isFinite(block.anio_construccion)
      )

    if (validBlocks.length === 0) {
      setConstructionPreview(null)
      return
    }

    let mounted = true

    const runPreview = async () => {
      setPreviewLoading(true)
      try {
        const response = await previewConstrucciones({
          gestion_anio: Number(form.gestion_anio),
          bloques: validBlocks,
        })
        if (mounted) {
          setConstructionPreview(response)
        }
      } catch {
        if (mounted) {
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
  }, [blocks, form.gestion_anio])

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const updateBlock = (index, field, value) => {
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
    setBlocks((current) => [...current, buildEmptyBlock()])
  }

  const removeBlock = (index) => {
    setBlocks((current) => (current.length === 1 ? [buildEmptyBlock()] : current.filter((_, i) => i !== index)))
  }

  const calculate = async () => {
    if (!selectedPredio?.properties?.id) return

    setSubmitting(true)
    setError("")

    try {
      const validBlocks = blocks
        .filter((block) => block.superficie && block.calidad_constructiva && block.anio_construccion)
        .map((block) => ({
          superficie: Number(block.superficie),
          calidad_constructiva: block.calidad_constructiva,
          anio_construccion: Number(block.anio_construccion),
        }))

      const response = await createAvaluo({
        predio_id: selectedPredio.properties.id,
        gestion_anio: Number(form.gestion_anio),
        usuario: form.usuario,
        superficie_manual: form.superficie_manual ? Number(form.superficie_manual) : null,
        superficie_override_reason: form.superficie_override_reason || null,
        observaciones: form.observaciones || null,
        bloques: validBlocks,
      })

      setAvaluo(response)
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
    coverage,
    methodology,
    constructionPreview,
    officialServices: OFFICIAL_SERVICES,
    blocks,
    form,
    error,
    loadingContext,
    previewLoading,
    submitting,
    updateField,
    updateBlock,
    addBlock,
    removeBlock,
    calculate,
  }
}
