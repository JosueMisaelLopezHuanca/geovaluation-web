import { useEffect, useRef, useState } from "react"
import {
  getAvaluoLayerByBbox,
  getManzanasByBbox,
  getPrediosByBbox,
} from "../services/map.service"
import { toBackendBbox, toLeafletFeatureCollection } from "../utils/map"

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] }

const getScaleVisibility = (zoom) => ({
  otbs: zoom >= 11,
  zonas_homogeneas: zoom >= 12,
  pendientes: zoom >= 12,
  riesgos: zoom >= 12,
  manzanas: zoom >= 14,
  predios: zoom >= 16,
  diferencias_superficie: zoom >= 16,
})

const getScaleStage = (zoom) => {
  if (zoom < 14) {
    return {
      label: "Ciudad y OTBs",
      description: "Vista general de La Paz con lectura barrial.",
    }
  }

  if (zoom < 16) {
    return {
      label: "Barrios y manzanas",
      description: "Aparecen bloques urbanos y contexto territorial.",
    }
  }

  return {
    label: "Predios",
    description: "Detalle predial para seleccion y avaluo.",
  }
}
export const useMapData = (mapBounds, layers, authToken = "") => {
  const [predios, setPredios] = useState(EMPTY_COLLECTION)
  const [manzanas, setManzanas] = useState(EMPTY_COLLECTION)
  const [pendientes, setPendientes] = useState(EMPTY_COLLECTION)
  const [riesgos, setRiesgos] = useState(EMPTY_COLLECTION)
  const [zonasHomogeneas, setZonasHomogeneas] = useState(EMPTY_COLLECTION)
  const [surfaceDifferences, setSurfaceDifferences] = useState(EMPTY_COLLECTION)
  const [otbs, setOtbs] = useState(EMPTY_COLLECTION)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const requestId = useRef(0)

  useEffect(() => {
    const bounds = mapBounds?.bounds || mapBounds
    const zoom = Number(mapBounds?.zoom || 0)
    const scaleVisibility = getScaleVisibility(zoom)

    if (!bounds) {
      return undefined
    }

    const currentRequest = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")

      try {
        const bbox = toBackendBbox(bounds)
        const [
          prediosData,
          manzanasData,
          zonasData,
          pendientesData,
          riesgosData,
          surfaceDifferencesData,
          otbsData,
        ] = await Promise.all([
          layers.predios && scaleVisibility.predios
            ? getPrediosByBbox(bbox, zoom >= 17 ? 1800 : 900)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.manzanas && scaleVisibility.manzanas
            ? getManzanasByBbox(bbox)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.zonas_homogeneas && scaleVisibility.zonas_homogeneas
            ? getAvaluoLayerByBbox("zonas_homogeneas", bbox, 1200)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.pendientes && scaleVisibility.pendientes
            ? getAvaluoLayerByBbox("pendientes", bbox, 1400)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.riesgos && scaleVisibility.riesgos
            ? getAvaluoLayerByBbox("riesgos", bbox, 1400)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.diferencias_superficie && scaleVisibility.diferencias_superficie
            ? getAvaluoLayerByBbox("diferencias_superficie", bbox, 1400, authToken)
            : Promise.resolve(EMPTY_COLLECTION),
          layers.otbs && scaleVisibility.otbs
            ? getAvaluoLayerByBbox("otbs", bbox, 900)
            : Promise.resolve(EMPTY_COLLECTION),
        ])

        if (requestId.current !== currentRequest) {
          return
        }

        setPredios(toLeafletFeatureCollection(prediosData ?? EMPTY_COLLECTION))
        setManzanas(toLeafletFeatureCollection(manzanasData ?? EMPTY_COLLECTION))
        setPendientes(toLeafletFeatureCollection(pendientesData ?? EMPTY_COLLECTION))
        setRiesgos(toLeafletFeatureCollection(riesgosData ?? EMPTY_COLLECTION))
        setZonasHomogeneas(toLeafletFeatureCollection(zonasData ?? EMPTY_COLLECTION))
        setSurfaceDifferences(toLeafletFeatureCollection(surfaceDifferencesData ?? EMPTY_COLLECTION))
        setOtbs(toLeafletFeatureCollection(otbsData ?? EMPTY_COLLECTION))
      } catch (fetchError) {
        if (requestId.current !== currentRequest) {
          return
        }

        setError(fetchError.message || "No se pudo cargar la cartografia")
      } finally {
        if (requestId.current === currentRequest) {
          setLoading(false)
        }
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [authToken, layers.diferencias_superficie, layers.manzanas, layers.otbs, layers.predios, layers.pendientes, layers.riesgos, layers.zonas_homogeneas, mapBounds])

  return {
    predios,
    manzanas,
    pendientes,
    riesgos,
    zonasHomogeneas,
    surfaceDifferences,
    otbs,
    loading,
    error,
    scale: getScaleStage(Number(mapBounds?.zoom || 0)),
    zoom: Number(mapBounds?.zoom || 0),
  }
}
