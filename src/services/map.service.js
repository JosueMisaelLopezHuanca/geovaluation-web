import { apiGet } from "../lib/http"
import { env } from "../config/env"

export const getPrediosByBbox = (bounds, limit = 4000) =>
  apiGet("/api/v1/predios/bbox", {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
    limit,
  })

export const getManzanasByBbox = (bounds) =>
  apiGet("/api/v1/manzanas/bbox", {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
  })

export const getAvaluoLayerByBbox = (layer, bounds, limit = 3000) =>
  apiGet(`/api/v1/avaluos/capas/${layer}/bbox`, {
    xmin: bounds.xmin,
    ymin: bounds.ymin,
    xmax: bounds.xmax,
    ymax: bounds.ymax,
    limit,
  })

export const getTilesUrl = () =>
  `${env.apiBaseUrl}/api/v1/tiles/{z}/{x}/{y}.pbf`
