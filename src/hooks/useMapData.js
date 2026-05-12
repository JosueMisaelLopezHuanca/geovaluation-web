import { useEffect, useRef, useState } from "react"
import {
  getAvaluoLayerByBbox,
  getManzanasByBbox,
  getPrediosByBbox,
} from "../services/map.service"
import { toBackendBbox, toLeafletFeatureCollection } from "../utils/map"

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] }

export const useMapData = (mapBounds, layers) => {
  const [predios, setPredios] = useState(EMPTY_COLLECTION)
  const [manzanas, setManzanas] = useState(EMPTY_COLLECTION)
  const [pendientes, setPendientes] = useState(EMPTY_COLLECTION)
  const [riesgos, setRiesgos] = useState(EMPTY_COLLECTION)
  const [zonasHomogeneas, setZonasHomogeneas] = useState(EMPTY_COLLECTION)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const requestId = useRef(0)

  useEffect(() => {
    if (!mapBounds) {
      return undefined
    }

    const currentRequest = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")

      try {
        const bbox = toBackendBbox(mapBounds)
        const prediosData = layers.predios ? await getPrediosByBbox(bbox) : EMPTY_COLLECTION
        const manzanasData = layers.manzanas ? await getManzanasByBbox(bbox) : EMPTY_COLLECTION
        const zonasData = layers.zonas_homogeneas
          ? await getAvaluoLayerByBbox("zonas_homogeneas", bbox, 1200)
          : EMPTY_COLLECTION
        const pendientesData = layers.pendientes
          ? await getAvaluoLayerByBbox("pendientes", bbox, 1400)
          : EMPTY_COLLECTION
        const riesgosData = layers.riesgos
          ? await getAvaluoLayerByBbox("riesgos", bbox, 1400)
          : EMPTY_COLLECTION

        if (requestId.current !== currentRequest) {
          return
        }

        setPredios(toLeafletFeatureCollection(prediosData ?? EMPTY_COLLECTION))
        setManzanas(toLeafletFeatureCollection(manzanasData ?? EMPTY_COLLECTION))
        setPendientes(toLeafletFeatureCollection(pendientesData ?? EMPTY_COLLECTION))
        setRiesgos(toLeafletFeatureCollection(riesgosData ?? EMPTY_COLLECTION))
        setZonasHomogeneas(toLeafletFeatureCollection(zonasData ?? EMPTY_COLLECTION))
      } catch (fetchError) {
        if (requestId.current !== currentRequest) {
          return
        }

        setError(fetchError.message || "No se pudo cargar la cartografía")
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false)
        }
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [layers.manzanas, layers.predios, layers.pendientes, layers.riesgos, layers.zonas_homogeneas, mapBounds])

  return {
    predios,
    manzanas,
    pendientes,
    riesgos,
    zonasHomogeneas,
    loading,
    error,
  }
}
