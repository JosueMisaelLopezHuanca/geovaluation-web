import { useMemo, useState } from "react"
import { GeoJSON, MapContainer, Pane, TileLayer, useMapEvents } from "react-leaflet"
import { env } from "../config/env"

const BASEMAPS = {
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
    Math.abs(
      [...String(code || "")]
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % zonaPalette.length
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

const MapViewportSync = ({ onBoundsChange }) => {
  useMapEvents({
    load(event) {
      onBoundsChange(event.target.getBounds())
    },
    moveend(event) {
      onBoundsChange(event.target.getBounds())
    },
    zoomend(event) {
      onBoundsChange(event.target.getBounds())
    },
  })

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
  manzanas,
  pendientes,
  riesgos,
  zonasHomogeneas,
  opacities,
  selectedPredio,
  onSelectPredio,
  onBoundsChange,
}) => {
  const [mapReady, setMapReady] = useState(false)
  const activeBasemap = BASEMAPS[basemap] || BASEMAPS.city

  const prediosKey = useMemo(
    () => `${predios?.features?.length || 0}-${selectedPredio?.properties?.id || "none"}-${basemap}`,
    [basemap, predios, selectedPredio]
  )

  const selectedPredioId = selectedPredio?.properties?.id

  return (
    <MapContainer
      center={env.defaultCenter}
      zoom={env.defaultZoom}
      minZoom={12}
      maxZoom={activeBasemap.maxZoom}
      zoomControl={false}
      className="map-canvas"
      whenReady={() => setMapReady(true)}
    >
      <TileLayer
        attribution={activeBasemap.attribution}
        url={activeBasemap.url}
        maxNativeZoom={activeBasemap.maxNativeZoom}
        maxZoom={activeBasemap.maxZoom}
      />
      {activeBasemap.overlayUrl ? (
        <TileLayer
          attribution={activeBasemap.overlayAttribution}
          url={activeBasemap.overlayUrl}
          maxNativeZoom={activeBasemap.maxNativeZoom}
          maxZoom={activeBasemap.maxZoom}
        />
      ) : null}
      <MapViewportSync onBoundsChange={onBoundsChange} />

      <Pane name="manzanas" style={{ zIndex: 410 }}>
        {mapReady && layers.manzanas && manzanas?.features?.length > 0 ? (
          <GeoJSON
            key={`manzanas-${manzanas.features.length}-${basemap}`}
            data={manzanas}
            style={basemap === "satellite" ? satelliteManzanaStyle : manzanaStyle}
          />
        ) : null}
      </Pane>

      <Pane name="zonas" style={{ zIndex: 360 }}>
        {mapReady && layers.zonas_homogeneas && zonasHomogeneas?.features?.length > 0 ? (
          <GeoJSON
            key={`zonas-${zonasHomogeneas.features.length}-${opacities.zonas_homogeneas}`}
            data={zonasHomogeneas}
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
        {mapReady && layers.pendientes && pendientes?.features?.length > 0 ? (
          <GeoJSON
            key={`pendientes-${pendientes.features.length}-${opacities.pendientes}`}
            data={pendientes}
            style={(feature) => createPendienteStyle(feature, opacities.pendientes)}
          />
        ) : null}
      </Pane>

      <Pane name="riesgos" style={{ zIndex: 400 }}>
        {mapReady && layers.riesgos && riesgos?.features?.length > 0 ? (
          <GeoJSON
            key={`riesgos-${riesgos.features.length}-${opacities.riesgos}`}
            data={riesgos}
            style={(feature) => createRiesgoStyle(feature, opacities.riesgos)}
          />
        ) : null}
      </Pane>

      <Pane name="predios" style={{ zIndex: 450 }}>
        {mapReady && layers.predios && predios?.features?.length > 0 ? (
          <GeoJSON
            key={`predios-${prediosKey}`}
            data={predios}
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
    </MapContainer>
  )
}

export default MapView
