import { useEffect, useState } from "react"
import { getAvaluoById, listAvaluos } from "../services/avaluos.service"

export const useAvaluosHistory = () => {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [selectedAvaluo, setSelectedAvaluo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")

  const loadHistory = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await listAvaluos(12)
      setItems(response)
    } catch (historyError) {
      setError(historyError.message || "No se pudo cargar el historial")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSelectedAvaluo(null)
      return
    }

    let mounted = true

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError("")

      try {
        const response = await getAvaluoById(selectedId)
        if (mounted) {
          setSelectedAvaluo(response)
        }
      } catch (detailError) {
        if (mounted) {
          setError(detailError.message || "No se pudo cargar el detalle del avaluo")
        }
      } finally {
        if (mounted) {
          setLoadingDetail(false)
        }
      }
    }

    loadDetail()

    return () => {
      mounted = false
    }
  }, [selectedId])

  return {
    items,
    selectedId,
    selectedAvaluo,
    loading,
    loadingDetail,
    error,
    setSelectedId,
    refresh: loadHistory,
  }
}
