import { useEffect, useMemo, useRef, useState } from "react"
import { canvas, latLngBounds } from "leaflet"
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Pane,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
import { env } from "../config/env"

const MAPTILER_ATTRIBUTION =
  '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'

const maptilerRasterUrl = (mapId) =>
  env.maptilerToken ? `https://api.maptiler.com/maps/${mapId}/{z}/{x}/{y}.png?key=${env.maptilerToken}` : ""

const DEFAULT_CENTER = [
  Number.isFinite(env.defaultCenter?.[0]) ? env.defaultCenter[0] : -16.4897,
  Number.isFinite(env.defaultCenter?.[1]) ? env.defaultCenter[1] : -68.1193,
]
const DEFAULT_ZOOM = Number.isFinite(env.defaultZoom) ? env.defaultZoom : 12

const BASEMAPS = {
  maptilerStreets: {
    url: maptilerRasterUrl("streets-v4"),
    attribution: MAPTILER_ATTRIBUTION,
    maxNativeZoom: 20,
    maxZoom: 20,
    crossOrigin: true,
    requiresToken: true,
    fallback: "streets",
  },
  maptilerDataviz: {
    url: maptilerRasterUrl("dataviz-v4"),
    attribution: MAPTILER_ATTRIBUTION,
    maxNativeZoom: 20,
    maxZoom: 20,
    crossOrigin: true,
    requiresToken: true,
    fallback: "city",
  },
  maptilerHybrid: {
    url: maptilerRasterUrl("hybrid-v4"),
    attribution: MAPTILER_ATTRIBUTION,
    maxNativeZoom: 20,
    maxZoom: 20,
    crossOrigin: true,
    requiresToken: true,
    fallback: "satellite",
  },
  maptilerBasic: {
    url: maptilerRasterUrl("basic-v2"),
    attribution: MAPTILER_ATTRIBUTION,
    maxNativeZoom: 20,
    maxZoom: 20,
    crossOrigin: true,
    requiresToken: true,
    fallback: "city",
  },
  streets: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
    maxZoom: 20,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    overlayUrl:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    overlayAttribution: "Labels &copy; Esri",
    maxNativeZoom: 19,
    maxZoom: 19,
  },
  city: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
    maxZoom: 20,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 20,
    maxZoom: 20,
  },
}

const defaultPredioStyle = {
  color: "#0b4a6f",
  weight: 1,
  fillColor: "#22d3ee",
  fillOpacity: 0.28,
}

const selectedPredioStyle = {
  color: "#f97316",
  weight: 3,
  fillColor: "#fde68a",
  fillOpacity: 0.78,
}

const manzanaStyle = {
  color: "#fb7185",
  weight: 1.4,
  fillOpacity: 0,
}

const pendienteColors = {
  1: "#2f86c7",
  2: "#b7dea0",
  3: "#f3c983",
}

const riesgoColors = {
  51: "#82c7e6",
  102: "#9dd7b4",
  153: "#f0d36f",
  204: "#e68867",
  255: "#cf4c4c",
}

const diffColors = {
  OK: "#34d399",
  REVISAR: "#f59e0b",
  CRITICO: "#ef4444",
  SIN_BASE_LEGAL: "#94a3b8",
}

const zonaPalette = ["#8a6de9", "#5963d7", "#35a1ff", "#41b88f", "#f0b451", "#ef7a5d"]

const satellitePredioStyle = {
  color: "#f8fafc",
  weight: 1.4,
  fillColor: "#38bdf8",
  fillOpacity: 0.16,
}

const satelliteSelectedPredioStyle = {
  color: "#fef08a",
  weight: 3,
  fillColor: "#f97316",
  fillOpacity: 0.28,
}

const satelliteManzanaStyle = {
  color: "#fef08a",
  weight: 1.5,
  fillOpacity: 0,
}

const getZoneColor = (code) =>
  zonaPalette[
    Math.abs([...String(code || "")].reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
      zonaPalette.length
  ]

const createPendienteStyle = (feature, opacity = 34) => {
  const color = pendienteColors[feature?.properties?.codigo] || "#94a3b8"
  const normalizedOpacity = Math.max(0, Math.min(1, opacity / 100))
  return {
    color,
    weight: 0.5,
    fillColor: color,
    fillOpacity: normalizedOpacity,
    opacity: Math.min(0.9, normalizedOpacity + 0.14),
  }
}

const createRiesgoStyle = (feature, opacity = 26) => {
  const color = riesgoColors[feature?.properties?.codigo] || "#cf8c6a"
  const normalizedOpacity = Math.max(0, Math.min(1, opacity / 100))
  return {
    color,
    weight: 0.5,
    fillColor: color,
    fillOpacity: normalizedOpacity,
    opacity: Math.min(0.85, normalizedOpacity + 0.12),
  }
}

const createZonaStyle = (feature, opacity = 16) => {
  const color = getZoneColor(feature?.properties?.codigo)
  const normalizedOpacity = Math.max(0, Math.min(1, opacity / 100))
  return {
    color,
    weight: 0.8,
    fillColor: color,
    fillOpacity: normalizedOpacity,
    opacity: Math.min(0.7, normalizedOpacity + 0.22),
  }
}

const createOtbStyle = (feature, opacity = 24, selectedOtbName = "") => {
  const normalizedOpacity = Math.max(0, Math.min(1, opacity / 100))
  const isSelected =
    selectedOtbName &&
    (feature?.properties?.nombre === selectedOtbName || feature?.properties?.codigo === selectedOtbName)

  return {
    color: isSelected ? "#1d4ed8" : "#2563eb",
    weight: isSelected ? 2.4 : 1.6,
    dashArray: isSelected ? undefined : "7 5",
    fillColor: isSelected ? "#60a5fa" : "#93c5fd",
    fillOpacity: isSelected ? Math.min(0.42, normalizedOpacity + 0.12) : normalizedOpacity,
    opacity: isSelected ? 1 : Math.min(0.85, normalizedOpacity + 0.24),
  }
}

const createSuggestedPredioStyle = (feature, selectedPredioId) => {
  const isSelected = feature?.properties?.id && feature.properties.id === selectedPredioId

  return {
    color: isSelected ? "#f97316" : "#d97706",
    weight: isSelected ? 3 : 2.2,
    fillColor: isSelected ? "#fde68a" : "#fef3c7",
    fillOpacity: isSelected ? 0.46 : 0.12,
    opacity: 0.92,
  }
}

const createSurfaceDifferenceStyle = (feature, opacity = 42) => {
  const color = diffColors[feature?.properties?.clasificacion] || "#94a3b8"
  const normalizedOpacity = Math.max(0, Math.min(1, opacity / 100))
  return {
    color,
    weight: 1,
    fillColor: color,
    fillOpacity: normalizedOpacity,
    opacity: Math.min(0.95, normalizedOpacity + 0.15),
  }
}

const MapViewportSync = ({ onBoundsChange }) => {
  const map = useMap()

  useEffect(() => {
    onBoundsChange({
      bounds: map.getBounds(),
      zoom: map.getZoom(),
    })
  }, [map, onBoundsChange])

  useMapEvents({
    load(event) {
      onBoundsChange({
        bounds: event.target.getBounds(),
        zoom: event.target.getZoom(),
      })
    },
    moveend(event) {
      onBoundsChange({
        bounds: event.target.getBounds(),
        zoom: event.target.getZoom(),
      })
    },
    zoomend(event) {
      onBoundsChange({
        bounds: event.target.getBounds(),
        zoom: event.target.getZoom(),
      })
    },
  })

  return null
}

const MapPointClickSync = ({ enabled, onPointSelect }) => {
  useMapEvents({
    click(event) {
      if (!enabled) return
      onPointSelect?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
        zoom: event.target.getZoom(),
      })
    },
  })

  return null
}

const collectLatLngs = (coordinates, points = []) => {
  if (!Array.isArray(coordinates)) return points
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    points.push([coordinates[1], coordinates[0]])
    return points
  }

  coordinates.forEach((coordinate) => collectLatLngs(coordinate, points))
  return points
}

const MapFeatureFocusSync = ({ feature, maxZoom = 18, padding = [64, 64], featureKey }) => {
  const map = useMap()
  const lastFeatureKey = useRef(null)

  useEffect(() => {
    if (!featureKey || featureKey === lastFeatureKey.current) return
    const points = collectLatLngs(feature?.geometry?.coordinates)
    if (!points.length) return
    const bounds = latLngBounds(points)

    if (bounds.isValid()) {
      map.flyToBounds(bounds, {
        padding,
        maxZoom,
        duration: 0.8,
      })
      lastFeatureKey.current = featureKey
    }
  }, [feature, featureKey, map, maxZoom, padding])

  return null
}

const UserLocationSync = ({ userLocation }) => {
  const map = useMap()
  const lastLocation = useRef("")

  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lng) return
    const locationKey = `${userLocation.lat}-${userLocation.lng}`
    if (locationKey === lastLocation.current) return
    map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 17), {
      duration: 0.7,
    })
    lastLocation.current = locationKey
  }, [map, userLocation])

  return null
}

const MapSizeGate = ({ onReady }) => {
  const map = useMap()

  useEffect(() => {
    let frameId = 0
    let attempts = 0
    let cancelled = false

    const waitForSize = () => {
      if (cancelled) return
      map.invalidateSize({ pan: false })
      const size = map.getSize()
      const hasUsableSize =
        Number.isFinite(size.x) && Number.isFinite(size.y) && size.x > 0 && size.y > 0

      if (hasUsableSize) {
        onReady(true)
        return
      }

      attempts += 1
      if (attempts > 60) return
      frameId = window.requestAnimationFrame(waitForSize)
    }

    frameId = window.requestAnimationFrame(waitForSize)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [map, onReady])

  return null
}

const createPredioStyle = (selectedPredioId, basemap) => (feature) => {
  const featureId = feature?.properties?.id
  const isSatellite = basemap === "satellite"

  if (featureId && featureId === selectedPredioId) {
    return isSatellite ? satelliteSelectedPredioStyle : selectedPredioStyle
  }

  return isSatellite ? satellitePredioStyle : defaultPredioStyle
}

const MapView = ({
  basemap,
  layers,
  predios,
  otbSuggestedPredios,
  manzanas,
  pendientes,
  riesgos,
  zonasHomogeneas,
  surfaceDifferences,
  otbs,
  opacities,
  selectedPredio,
  selectedOtb,
  userLocation,
  onSelectPredio,
  onSelectMapPoint,
  onBoundsChange,
}) => {
  const [mapReady, setMapReady] = useState(false)
  const [tileReady, setTileReady] = useState(false)
  const requestedBasemap = BASEMAPS[basemap] || BASEMAPS.streets
  const activeBasemap =
    requestedBasemap.requiresToken && !env.maptilerToken
      ? BASEMAPS[requestedBasemap.fallback || "streets"]
      : requestedBasemap
  const tileLayerProps = {
    attribution: activeBasemap.attribution,
    url: activeBasemap.url,
    maxNativeZoom: activeBasemap.maxNativeZoom,
    maxZoom: activeBasemap.maxZoom,
    ...(activeBasemap.tileSize ? { tileSize: activeBasemap.tileSize } : {}),
    ...(Number.isFinite(activeBasemap.zoomOffset) ? { zoomOffset: activeBasemap.zoomOffset } : {}),
    ...(activeBasemap.crossOrigin ? { crossOrigin: activeBasemap.crossOrigin } : {}),
  }

  const prediosKey = useMemo(
    () => `${predios?.features?.length || 0}-${selectedPredio?.properties?.id || "none"}-${basemap}`,
    [basemap, predios, selectedPredio],
  )
  const vectorRenderers = useMemo(
    () => ({
      otbs: canvas({ pane: "otbs", padding: 0.5 }),
      manzanas: canvas({ pane: "manzanas", padding: 0.5 }),
      otbPredios: canvas({ pane: "otb-predios", padding: 0.5 }),
      zonas: canvas({ pane: "zonas", padding: 0.5 }),
      pendientes: canvas({ pane: "pendientes", padding: 0.5 }),
      riesgos: canvas({ pane: "riesgos", padding: 0.5 }),
      surfaceDifferences: canvas({ pane: "surface-differences", padding: 0.5 }),
      predios: canvas({ pane: "predios", padding: 0.5 }),
      selectedPredio: canvas({ pane: "selected-predio", padding: 0.5 }),
      userLocation: canvas({ pane: "user-location", padding: 0.5 }),
    }),
    [],
  )

  const selectedPredioId = selectedPredio?.properties?.id
  const selectedOtbName = selectedOtb?.properties?.nombre || selectedOtb?.properties?.codigo || ""
  const isMapUsable = mapReady || tileReady

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={12}
      maxZoom={activeBasemap.maxZoom}
      zoomControl={false}
      className="map-canvas"
      whenReady={() => setMapReady(true)}
    >
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" metric imperial={false} />
      <MapSizeGate onReady={setTileReady} />
      {isMapUsable ? <TileLayer key={activeBasemap.url} {...tileLayerProps} /> : null}
      {isMapUsable && activeBasemap.overlayUrl ? (
        <TileLayer
          attribution={activeBasemap.overlayAttribution}
          url={activeBasemap.overlayUrl}
          maxNativeZoom={activeBasemap.maxNativeZoom}
          maxZoom={activeBasemap.maxZoom}
        />
      ) : null}
      <MapViewportSync onBoundsChange={onBoundsChange} />
      <MapPointClickSync enabled={isMapUsable} onPointSelect={onSelectMapPoint} />
      <MapFeatureFocusSync
        feature={selectedOtb}
        featureKey={selectedOtbName}
        maxZoom={16}
        padding={[56, 56]}
      />
      <MapFeatureFocusSync
        feature={selectedPredio}
        featureKey={selectedPredioId}
        maxZoom={18}
        padding={[64, 64]}
      />
      <UserLocationSync userLocation={userLocation} />

      <Pane name="otbs" style={{ zIndex: 355 }}>
        {isMapUsable && layers.otbs && otbs?.features?.length > 0 ? (
          <GeoJSON
            key={`otbs-${otbs.features.length}-${opacities.otbs}-${selectedOtbName || "none"}`}
            data={otbs}
            renderer={vectorRenderers.otbs}
            style={(feature) => createOtbStyle(feature, opacities.otbs, selectedOtbName)}
            onEachFeature={(feature, layer) => {
              const nombre = feature?.properties?.nombre || "Sin nombre"
              layer.bindTooltip(`OTB ${nombre}`, {
                sticky: true,
                direction: "top",
              })
            }}
          />
        ) : null}
      </Pane>

      <Pane name="manzanas" style={{ zIndex: 410 }}>
        {isMapUsable && layers.manzanas && manzanas?.features?.length > 0 ? (
          <GeoJSON
            key={`manzanas-${manzanas.features.length}-${basemap}`}
            data={manzanas}
            renderer={vectorRenderers.manzanas}
            style={basemap === "satellite" ? satelliteManzanaStyle : manzanaStyle}
          />
        ) : null}
      </Pane>

      <Pane name="otb-predios" style={{ zIndex: 430 }}>
        {isMapUsable && layers.predios && selectedOtbName && otbSuggestedPredios?.length > 0 ? (
          <GeoJSON
            key={`otb-predios-${selectedOtbName}-${otbSuggestedPredios.length}-${selectedPredioId || "none"}`}
            data={{ type: "FeatureCollection", features: otbSuggestedPredios }}
            renderer={vectorRenderers.otbPredios}
            style={(feature) => createSuggestedPredioStyle(feature, selectedPredioId)}
            eventHandlers={{
              click: (event) => {
                onSelectPredio(event.layer.feature)
              },
            }}
            onEachFeature={(feature, layer) => {
              const code = feature?.properties?.codigo || "Sin codigo"
              layer.bindTooltip(`Predio ${code}`, {
                sticky: true,
                direction: "top",
              })
            }}
          />
        ) : null}
      </Pane>

      <Pane name="zonas" style={{ zIndex: 360 }}>
        {isMapUsable && layers.zonas_homogeneas && zonasHomogeneas?.features?.length > 0 ? (
          <GeoJSON
            key={`zonas-${zonasHomogeneas.features.length}-${opacities.zonas_homogeneas}`}
            data={zonasHomogeneas}
            renderer={vectorRenderers.zonas}
            style={(feature) => createZonaStyle(feature, opacities.zonas_homogeneas)}
            onEachFeature={(feature, layer) => {
              const codigo = feature?.properties?.codigo || "Sin zona"
              const grupo = feature?.properties?.grupo || "Sin grupo"
              layer.bindTooltip(`Zona ${codigo} · Grupo ${grupo}`, {
                sticky: true,
                direction: "top",
              })
            }}
          />
        ) : null}
      </Pane>

      <Pane name="pendientes" style={{ zIndex: 390 }}>
        {isMapUsable && layers.pendientes && pendientes?.features?.length > 0 ? (
          <GeoJSON
            key={`pendientes-${pendientes.features.length}-${opacities.pendientes}`}
            data={pendientes}
            renderer={vectorRenderers.pendientes}
            style={(feature) => createPendienteStyle(feature, opacities.pendientes)}
          />
        ) : null}
      </Pane>

      <Pane name="riesgos" style={{ zIndex: 400 }}>
        {isMapUsable && layers.riesgos && riesgos?.features?.length > 0 ? (
          <GeoJSON
            key={`riesgos-${riesgos.features.length}-${opacities.riesgos}`}
            data={riesgos}
            renderer={vectorRenderers.riesgos}
            style={(feature) => createRiesgoStyle(feature, opacities.riesgos)}
          />
        ) : null}
      </Pane>

      <Pane name="surface-differences" style={{ zIndex: 405 }}>
        {isMapUsable && layers.diferencias_superficie && surfaceDifferences?.features?.length > 0 ? (
          <GeoJSON
            key={`surface-differences-${surfaceDifferences.features.length}-${opacities.diferencias_superficie}`}
            data={surfaceDifferences}
            renderer={vectorRenderers.surfaceDifferences}
            style={(feature) => createSurfaceDifferenceStyle(feature, opacities.diferencias_superficie)}
            onEachFeature={(feature, layer) => {
              const codigo = feature?.properties?.codigo || "Sin codigo"
              const clasificacion = feature?.properties?.clasificacion || "Sin clasificacion"
              layer.bindTooltip(`${codigo} · ${clasificacion}`, {
                sticky: true,
                direction: "top",
              })
            }}
          />
        ) : null}
      </Pane>

      <Pane name="predios" style={{ zIndex: 450 }}>
        {isMapUsable && layers.predios && predios?.features?.length > 0 ? (
          <GeoJSON
            key={`predios-${prediosKey}`}
            data={predios}
            renderer={vectorRenderers.predios}
            style={createPredioStyle(selectedPredioId, basemap)}
            eventHandlers={{
              click: (event) => {
                onSelectPredio(event.layer.feature)
              },
            }}
            onEachFeature={(feature, layer) => {
              const code = feature?.properties?.codigo || "Sin codigo"
              layer.bindTooltip(`Predio ${code}`, {
                sticky: true,
                direction: "top",
              })
            }}
          />
        ) : null}
      </Pane>

      <Pane name="selected-predio" style={{ zIndex: 470 }}>
        {isMapUsable && selectedPredio?.geometry ? (
          <GeoJSON
            key={`selected-${selectedPredio.properties?.id || "predio"}`}
            data={selectedPredio}
            interactive={false}
            renderer={vectorRenderers.selectedPredio}
            style={basemap === "satellite" ? satelliteSelectedPredioStyle : selectedPredioStyle}
          />
        ) : null}
      </Pane>

      <Pane name="user-location" style={{ zIndex: 480 }}>
        {isMapUsable && userLocation?.lat && userLocation?.lng ? (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            renderer={vectorRenderers.userLocation}
            radius={9}
            pathOptions={{
              color: "#0e7490",
              fillColor: "#67e8f9",
              fillOpacity: 0.9,
              weight: 3,
            }}
          />
        ) : null}
      </Pane>
    </MapContainer>
  )
}

export default MapView
