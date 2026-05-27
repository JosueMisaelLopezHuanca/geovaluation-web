import { useMemo, useState } from "react"

const STORAGE_KEY = "catastro-public-appraisal-history"
const MAX_PUBLIC_HISTORY_ITEMS = 8

const readHistory = () => {
  if (typeof window === "undefined") return []

  try {
    const rawHistory = window.localStorage.getItem(STORAGE_KEY)
    const parsedHistory = rawHistory ? JSON.parse(rawHistory) : []
    return Array.isArray(parsedHistory) ? parsedHistory : []
  } catch {
    return []
  }
}

const writeHistory = (items) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // If storage is full or blocked, the in-memory history still works for this session.
  }
}

const pickPredioSnapshot = (selectedPredio) => {
  if (!selectedPredio?.properties) return null

  return {
    type: selectedPredio.type,
    properties: {
      id: selectedPredio.properties.id,
      codigo: selectedPredio.properties.codigo,
      codigo_catastral: selectedPredio.properties.codigo_catastral,
    },
  }
}

const buildHistoryEntry = ({ avaluo, selectedPredio, context }) => {
  const codigo =
    selectedPredio?.properties?.codigo ||
    selectedPredio?.properties?.codigo_catastral ||
    avaluo?.codigo_catastral ||
    avaluo?.predio_id ||
    "Predio sin codigo"
  const createdAt = avaluo?.created_at || new Date().toISOString()
  const entryId = String(avaluo?.appraisal_id || `${avaluo?.predio_id || codigo}-${Date.now()}`)

  return {
    id: entryId,
    appraisal_id: String(avaluo?.appraisal_id || entryId),
    predio_id: String(avaluo?.predio_id || selectedPredio?.properties?.id || ""),
    codigo_catastral: codigo,
    created_at: createdAt,
    saved_at: new Date().toISOString(),
    base_imponible: avaluo?.base_imponible,
    impuesto_estimado: avaluo?.impuesto_estimado,
    valor_terreno: avaluo?.valor_terreno,
    valor_construccion: avaluo?.valor_construccion,
    avaluo_tipo: avaluo?.avaluo_tipo,
    zona_tributaria: avaluo?.contexto_espacial?.zona_tributaria_codigo || context?.zona_tributaria_codigo,
    predio: pickPredioSnapshot(selectedPredio),
    avaluo,
  }
}

export const usePublicAvaluoHistory = () => {
  const [items, setItems] = useState(readHistory)
  const [selectedId, setSelectedId] = useState("")

  const selectedEntry = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || null,
    [items, selectedId],
  )

  const addEntry = (payload) => {
    if (!payload?.avaluo) return null

    const entry = buildHistoryEntry(payload)
    setItems((current) => {
      const nextItems = [
        entry,
        ...current.filter((item) => item.appraisal_id !== entry.appraisal_id),
      ].slice(0, MAX_PUBLIC_HISTORY_ITEMS)
      writeHistory(nextItems)
      return nextItems
    })
    setSelectedId(entry.id)
    return entry
  }

  const clearHistory = () => {
    setItems([])
    setSelectedId("")
    writeHistory([])
  }

  return {
    items,
    selectedId,
    selectedEntry,
    setSelectedId,
    addEntry,
    clearHistory,
  }
}
