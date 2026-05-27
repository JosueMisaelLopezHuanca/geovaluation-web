import { apiGet } from "../lib/http"
import { env } from "../config/env"

export const getPrediosByBbox = (bounds, limit = 1800) =>
  apiGet("/api/v1/predios/bbox", {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
    limit,
  })

export const getPredioByPoint = (lng, lat) =>
  apiGet("/api/v1/predios/point", {
    lng,
    lat,
  })

export const searchPredios = (query, limit = 8, otbName = "") =>
  apiGet("/api/v1/predios/search", {
    ...(query ? { q: query } : {}),
    limit,
    ...(otbName ? { otb: otbName } : {}),
  })

export const getOtbOptions = (limit = 600, query = "") =>
  apiGet("/api/v1/predios/otbs/options", {
    limit,
    ...(query ? { q: query } : {}),
  })

export const getOtbFeatureByName = (name) =>
  apiGet("/api/v1/predios/otbs/feature", {
    name,
  })

export const getManzanasByBbox = (bounds) =>
  apiGet("/api/v1/manzanas/bbox", {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
  })

export const getAvaluoLayerByBbox = (layer, bounds, limit = 3000, token = "") =>
  apiGet(`/api/v2/gis/capas/${layer}/bbox`, {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
    limit,
  }, { token })

export const getTilesUrl = () =>
  `${env.apiBaseUrl}/api/v1/tiles/{z}/{x}/{y}.pbf`
