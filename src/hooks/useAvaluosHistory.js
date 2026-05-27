import { useCallback, useEffect, useState } from "react"
import { getAvaluoById, listAvaluos } from "../services/avaluos.service"

export const useAvaluosHistory = ({ enabled = true, authToken = "" } = {}) => {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [selectedAvaluo, setSelectedAvaluo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")

  const loadHistory = useCallback(async () => {
    if (!enabled) {
      setItems([])
      setSelectedId("")
      setSelectedAvaluo(null)
      return []
    }

    setLoading(true)
    setError("")

    try {
      const response = await listAvaluos(12, authToken)
      setItems(response)
      return response
    } catch (historyError) {
      setError(historyError.message || "No se pudo cargar el historial")
      return []
    } finally {
      setLoading(false)
    }
  }, [authToken, enabled])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (!enabled) {
      setSelectedAvaluo(null)
      return
    }

    if (!selectedId) {
      setSelectedAvaluo(null)
      return
    }

    let mounted = true

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError("")

      try {
        const response = await getAvaluoById(selectedId, authToken)
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
  }, [authToken, enabled, selectedId])

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
