import { env } from "../config/env"

const API_PORT = "8000"
const API_REQUEST_TIMEOUT_MS = 12000
let activeApiBaseUrl = ""

const getApiBaseCandidates = () => {
  const candidates = []

  if (typeof window !== "undefined" && window.location?.hostname) {
    candidates.push(`${window.location.protocol}//${window.location.hostname}:${API_PORT}`)
  }

  candidates.push(env.apiBaseUrl)
  candidates.push("http://127.0.0.1:8000", "http://localhost:8000")

  return [...new Set(candidates.map((baseUrl) => baseUrl.replace(/\/$/, "")))]
}

const buildUrl = (baseUrl, path, params) => {
  const url = new URL(path, baseUrl)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const requestWithFallback = async (path, options = {}, params) => {
  const candidates = getApiBaseCandidates()
  const orderedCandidates =
    activeApiBaseUrl && candidates.includes(activeApiBaseUrl)
      ? [activeApiBaseUrl, ...candidates.filter((baseUrl) => baseUrl !== activeApiBaseUrl)]
      : candidates
  let networkError = null

  for (const baseUrl of orderedCandidates) {
    try {
      const response = await fetchWithTimeout(buildUrl(baseUrl, path, params), options)
      activeApiBaseUrl = baseUrl
      return response
    } catch (error) {
      networkError = error
    }
  }

  throw networkError || new Error("No se pudo conectar con el backend.")
}

const getErrorMessage = async (response) => {
  try {
    const data = await response.json()
    const detail = data?.detail

    if (typeof detail === "string" && detail.trim()) {
      return detail
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => item?.msg).filter(Boolean).join(", ")
    }
  } catch {
    // Ignore JSON parse errors and fall back to status text.
  }

  return response.statusText || `Error ${response.status}`
}

const buildHeaders = (options = {}) => ({
  ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
  ...(options.headers || {}),
})

export const apiGet = async (path, params, options = {}) => {
  const response = await requestWithFallback(path, {
    headers: buildHeaders(options),
  }, params)

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  return response.json()
}

export const apiPost = async (path, body, options = {}) => {
  const response = await requestWithFallback(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildHeaders(options),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  return response.json()
}

export const apiDelete = async (path, options = {}) => {
  const response = await requestWithFallback(path, {
    method: "DELETE",
    headers: buildHeaders(options),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  return response.json()
}

export const apiDownload = async (path, params, options = {}) => {
  const response = await requestWithFallback(path, {
    headers: buildHeaders(options),
  }, params)

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  const disposition = response.headers.get("Content-Disposition") || ""
  const fileMatch = disposition.match(/filename="?([^"]+)"?/i)

  return {
    blob: await response.blob(),
    filename: fileMatch?.[1] || options.filename || "descarga",
  }
}
