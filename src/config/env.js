const parseNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, ""),
  maptilerToken: import.meta.env.VITE_MAPTILER_TOKEN || "",
  defaultCenter: [
    parseNumber(import.meta.env.VITE_DEFAULT_CENTER_LAT, -16.4897),
    parseNumber(import.meta.env.VITE_DEFAULT_CENTER_LNG, -68.1193),
  ],
  defaultZoom: parseNumber(import.meta.env.VITE_DEFAULT_ZOOM, 12),
}
