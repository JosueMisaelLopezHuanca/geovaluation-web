import proj4 from "proj4"

const WGS84 = "EPSG:4326"
const UTM_19S = "EPSG:32719"

proj4.defs(UTM_19S, "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs +type=crs")

const transformCoordinate = (coordinate, from, to) => {
  const [x, y] = proj4(from, to, coordinate)
  return [x, y]
}

const transformCoordinates = (coordinates, from, to) => {
  if (!Array.isArray(coordinates?.[0])) {
    return transformCoordinate(coordinates, from, to)
  }

  return coordinates.map((coordinate) => transformCoordinates(coordinate, from, to))
}

export const toBackendBbox = (bounds) => {
  const [xmin, ymin] = transformCoordinate([bounds.getWest(), bounds.getSouth()], WGS84, UTM_19S)
  const [xmax, ymax] = transformCoordinate([bounds.getEast(), bounds.getNorth()], WGS84, UTM_19S)

  return {
    xmin,
    ymin,
    xmax,
    ymax,
  }
}

export const toLeafletFeatureCollection = (featureCollection) => {
  if (!featureCollection?.features) {
    return { type: "FeatureCollection", features: [] }
  }

  return {
    ...featureCollection,
    features: featureCollection.features
      .filter((feature) => feature?.geometry?.coordinates)
      .map((feature) => ({
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: transformCoordinates(feature.geometry.coordinates, UTM_19S, WGS84),
        },
      })),
  }
}

export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    maximumFractionDigits: 2,
  }).format(value ?? 0)

export const formatNumber = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("es-BO", {
    maximumFractionDigits,
  }).format(value ?? 0)

export const formatPercent = (value, maximumFractionDigits = 1) =>
  `${formatNumber(value ?? 0, maximumFractionDigits)}%`

export const getFeatureLabel = (feature) =>
  feature?.properties?.codigo ||
  feature?.properties?.nombre ||
  feature?.properties?.codigo_catastral ||
  "Sin codigo"

const collectCoordinatePairs = (coordinates, pairs = []) => {
  if (!Array.isArray(coordinates)) return pairs
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    pairs.push(coordinates)
    return pairs
  }

  coordinates.forEach((coordinate) => collectCoordinatePairs(coordinate, pairs))
  return pairs
}

export const getFeatureCenter = (feature) => {
  const pairs = collectCoordinatePairs(feature?.geometry?.coordinates)
  if (!pairs.length) {
    const lat = Number(feature?.properties?.centroide_lat)
    const lng = Number(feature?.properties?.centroide_lng)
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  }

  const total = pairs.reduce(
    (acc, [lng, lat]) => ({
      lat: acc.lat + Number(lat || 0),
      lng: acc.lng + Number(lng || 0),
    }),
    { lat: 0, lng: 0 }
  )

  return {
    lat: total.lat / pairs.length,
    lng: total.lng / pairs.length,
  }
}
