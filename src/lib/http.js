import { env } from "../config/env"

const buildUrl = (path, params) => {
  const url = new URL(path, env.apiBaseUrl)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
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

export const apiGet = async (path, params) => {
  const response = await fetch(buildUrl(path, params))

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  return response.json()
}

export const apiPost = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response)
    throw new Error(`Error ${response.status}: ${message}`)
  }

  return response.json()
}
