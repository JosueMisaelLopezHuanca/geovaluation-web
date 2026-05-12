import { apiGet, apiPost } from "../lib/http"

export const getAvaluoHealth = () => apiGet("/api/v2/health")

export const getAvaluoContext = (predioId) =>
  apiGet(`/api/v2/predios/${predioId}/contexto-gis`)

export const getAvaluoCoverageStats = () =>
  apiGet("/api/v1/avaluos/cobertura-estadisticas")

export const getAvaluoMethodology = () =>
  apiGet("/api/v2/metodologia")

export const createAvaluo = (payload) =>
  apiPost("/api/v2/avaluos/calcular", payload)

export const listAvaluos = (limit = 20) =>
  apiGet("/api/v2/avaluos", { limit })

export const getAvaluoById = (avaluoId) =>
  apiGet(`/api/v2/avaluos/${avaluoId}`)

export const getAvaluoTrace = (avaluoId) =>
  apiGet(`/api/v2/avaluos/${avaluoId}/traza`)

export const previewConstrucciones = (payload) =>
  apiPost("/api/v2/construcciones", payload)
