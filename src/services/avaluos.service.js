import { apiDelete, apiDownload, apiGet, apiPost } from "../lib/http"

export const getAvaluoHealth = () => apiGet("/api/v2/health")

export const getAvaluoContext = (predioId) =>
  apiGet(`/api/v2/predios/${predioId}/contexto-gis`)

export const getAvaluoCoverageStats = () =>
  apiGet("/api/v2/cobertura-estadisticas")

export const getAvaluoMethodology = () =>
  apiGet("/api/v2/metodologia")

export const getPublicCatalogs = () =>
  apiGet("/api/v2/catalogos/publicos")

export const createAvaluo = (payload, token = "") =>
  apiPost("/api/v2/avaluos/calcular", payload, { token })

export const previewAvaluo = (payload) =>
  apiPost("/api/v2/avaluos/preview", payload)

export const submitPublicBetaConsultation = (payload) =>
  apiPost("/api/v2/beta/consultas", payload)

export const getPublicBetaSummary = (token = "") =>
  apiGet("/api/v2/beta/consultas/resumen", undefined, { token })

export const listPublicBetaConsultations = (limit = 20, token = "") =>
  apiGet("/api/v2/beta/consultas", { limit }, { token })

export const downloadPublicBetaConsultations = (token = "") =>
  apiDownload("/api/v2/beta/consultas/export/csv", undefined, {
    token,
    filename: "consultas_beta_publicas.csv",
  })

export const deletePublicBetaContact = (submissionId, token = "") =>
  apiDelete(`/api/v2/beta/consultas/${submissionId}/contacto`, { token })

export const listAvaluos = (limit = 20, token = "") =>
  apiGet("/api/v2/avaluos", { limit }, { token })

export const getAvaluoById = (avaluoId, token = "") =>
  apiGet(`/api/v2/avaluos/${avaluoId}`, undefined, { token })

export const getAvaluoTrace = (avaluoId, token = "") =>
  apiGet(`/api/v2/avaluos/${avaluoId}/traza`, undefined, { token })

export const downloadAvaluoExport = (avaluoId, format, token = "") =>
  apiDownload(`/api/v2/avaluos/${avaluoId}/export/${format}`, undefined, {
    token,
    filename: `avaluo_${avaluoId}.${format === "excel" ? "xls" : format}`,
  })

export const previewConstrucciones = (payload) =>
  apiPost("/api/v2/construcciones", payload)

export const getPredioAudit = (predioId, limit = 50, token = "") =>
  apiGet(`/api/v2/predios/${predioId}/auditoria`, { limit }, { token })

export const listSurfaceDifferences = (params = {}, token = "") =>
  apiGet("/api/v2/superficies/diferencias", params, { token })

export const refreshSurfaceDifferences = (token = "") =>
  apiPost("/api/v2/superficies/diferencias/refresh", {}, { token })

export const downloadSurfaceDifferences = (format, params = {}, token = "") =>
  apiDownload(`/api/v2/superficies/diferencias/export/${format}`, params, {
    token,
    filename: `diferencias_superficie.${format === "excel" ? "xls" : format}`,
  })
