import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import AvaluoPanel from "../components/AvaluoPanel"
import BasemapSelector from "../components/BasemapSelector"
import LayerControl from "../components/LayerControl"
import MapBasemapSwitcher from "../components/MapBasemapSwitcher"
import MapLegend from "../components/MapLegend"
import MapStatusBadge from "../components/MapStatusBadge"
import MapView from "../components/MapView"
import MetricCard from "../components/MetricCard"
import PredioSearch from "../components/PredioSearch"
import PublicLayerSwitcher from "../components/PublicLayerSwitcher"
import ContentState from "../components/ui/ContentState"
import SkeletonBlock from "../components/ui/SkeletonBlock"
import { useAvaluo } from "../hooks/useAvaluo"
import { useAvaluosHistory } from "../hooks/useAvaluosHistory"
import { useMapData } from "../hooks/useMapData"
import { usePublicAvaluoHistory } from "../hooks/usePublicAvaluoHistory"
import { useTheme } from "../hooks/useTheme"
import AppHeader from "../layouts/AppHeader"
import SidebarSection from "../layouts/SidebarSection"
import { downloadAvaluoExport } from "../services/avaluos.service"
import { loginAdmin } from "../services/auth.service"
import { getPredioByPoint } from "../services/map.service"
import { formatCurrency, formatNumber, getFeatureCenter, toLeafletFeatureCollection } from "../utils/map"

const AvaluosHistoryPanel = lazy(() => import("../components/AvaluosHistoryPanel"))
const AvaluoReportSheet = lazy(() => import("../components/AvaluoReportSheet"))
const InstitutionPage = lazy(() => import("../components/InstitutionPage"))
const PublicValuationPanel = lazy(() => import("../components/PublicValuationPanel"))
const SurfaceDifferencesPanel = lazy(() => import("../components/SurfaceDifferencesPanel"))
const BetaConsultasPanel = lazy(() => import("../components/BetaConsultasPanel"))

const DEFAULT_TERRITORY_CONTEXT = {
  department: "La Paz",
  municipality: "Nuestra Senora de La Paz",
  areaType: "urbano",
  areaLabel: "Urbano",
  categoryKey: "avaluo",
  categoryLabel: "Avaluo fiscal",
  zone: "Todas las zonas",
  route: "/territorios/la-paz",
  datasetStatus: "available",
}

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio" },
  { id: "investigacion", label: "Investigacion" },
  { id: "geovisores", label: "Geovisores" },
  { id: "servicios", label: "Servicios" },
  { id: "contactos", label: "Contactos" },
]

const METRIC_CARDS = [
  { label: "Predios visibles", key: "predios", accent: "cyan" },
  { label: "Manzanas visibles", key: "manzanas", accent: "rose" },
  { label: "Zonas homogeneas visibles", key: "zonasHomogeneas", accent: "emerald" },
  { label: "OTBs visibles", key: "otbs", accent: "cyan" },
  { label: "Pendientes visibles", key: "pendientes", accent: "cyan" },
  { label: "Riesgos visibles", key: "riesgos", accent: "rose" },
  { label: "Dif. GIS vs legal", key: "surfaceDifferences", accent: "emerald" },
]

const ADMIN_SESSION_KEY = "catastro-admin-session"
const ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60 * 4

const readAdminSession = () => {
  if (typeof window === "undefined") return null

  try {
    const rawSession = window.localStorage.getItem(ADMIN_SESSION_KEY)
    if (!rawSession) return null

    const parsedSession = JSON.parse(rawSession)
    if (!parsedSession?.expiresAt || parsedSession.expiresAt < Date.now()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY)
      return null
    }

    return parsedSession
  } catch {
    return null
  }
}

const createAdminSession = (authResponse) => {
  const issuedAt = Date.now()
  const parsedExpiresAt = Date.parse(authResponse?.expires_at)

  return {
    user: authResponse?.user || "admin",
    role: authResponse?.role || "Administrador",
    token: authResponse?.access_token || "",
    issuedAt,
    expiresAt: Number.isFinite(parsedExpiresAt)
      ? parsedExpiresAt
      : issuedAt + ADMIN_SESSION_DURATION_MS,
  }
}

const getInitialToolsPanelState = () => {
  if (typeof window === "undefined") return true
  return !window.matchMedia("(max-width: 760px)").matches
}

const MapPage = () => {
  const [layers, setLayers] = useState({
    predios: true,
    manzanas: true,
    zonas_homogeneas: false,
    otbs: true,
    pendientes: false,
    riesgos: false,
    diferencias_superficie: false,
  })
  const [opacities, setOpacities] = useState({
    zonas_homogeneas: 16,
    otbs: 24,
    pendientes: 34,
    riesgos: 26,
    diferencias_superficie: 42,
  })
  const [basemap, setBasemap] = useState("streets")
  const [mapBounds, setMapBounds] = useState(null)
  const [selectedPredio, setSelectedPredio] = useState(null)
  const [selectedOtb, setSelectedOtb] = useState(null)
  const [otbSuggestedPredios, setOtbSuggestedPredios] = useState([])
  const [reportMode, setReportMode] = useState("current")
  const [territoryContext, setTerritoryContext] = useState(DEFAULT_TERRITORY_CONTEXT)
  const [adminSession, setAdminSession] = useState(() => readAdminSession())
  const [activeSection, setActiveSection] = useState("geovisores")
  const [accessMessage, setAccessMessage] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState("")
  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(getInitialToolsPanelState)
  const pointSelectionRequestId = useRef(0)
  const { theme, toggleTheme } = useTheme()
  const isAdmin = Boolean(adminSession)
  const {
    items: publicHistoryItems,
    selectedId: selectedPublicHistoryId,
    selectedEntry: selectedPublicHistoryEntry,
    setSelectedId: setSelectedPublicHistoryId,
    addEntry: addPublicHistoryEntry,
    clearHistory: clearPublicHistory,
  } = usePublicAvaluoHistory()

  const {
    predios,
    manzanas,
    pendientes,
    riesgos,
    zonasHomogeneas,
    surfaceDifferences,
    otbs,
    loading,
    error,
    scale,
    zoom,
  } = useMapData(mapBounds, layers, adminSession?.token || "")

  const {
    items: historyItems,
    selectedId: selectedHistoryId,
    selectedAvaluo,
    loading: historyLoading,
    loadingDetail: historyLoadingDetail,
    error: historyError,
    setSelectedId: setSelectedHistoryId,
    refresh: refreshHistory,
  } = useAvaluosHistory({ enabled: isAdmin, authToken: adminSession?.token || "" })

  const {
    health,
    context,
    avaluo,
    preview,
    coverage,
    methodology,
    catalogs,
    constructionPreview,
    auditEntries,
    blocks,
    form,
    error: avaluoError,
    validation,
    loadingContext,
    previewLoading,
    submitting,
    publicCalculationPayload,
    updateField,
    resetFieldToAutomatic,
    updateBlock,
    addBlock,
    removeBlock,
    loadExampleData,
    resetDraft,
    calculate,
  } = useAvaluo(selectedPredio, {
    defaultUsuario: isAdmin ? adminSession?.user || "admin" : "consulta_publica",
    authToken: adminSession?.token || "",
    persistAppraisal: isAdmin,
    enableAudit: isAdmin,
    onCalculated: async (response) => {
      if (isAdmin) {
        await refreshHistory()
        if (response?.appraisal_id) {
          setSelectedHistoryId(response.appraisal_id)
        }
      } else {
        addPublicHistoryEntry({
          avaluo: response,
          selectedPredio,
          context,
        })
      }
      setReportMode("current")
    },
  })

  const printableAvaluo =
    reportMode === "history"
      ? selectedAvaluo
      : reportMode === "public-history"
        ? selectedPublicHistoryEntry?.avaluo
        : avaluo || selectedAvaluo
  const printablePredio =
    reportMode === "public-history" ? selectedPublicHistoryEntry?.predio : selectedPredio
  const printableAudience = isAdmin && reportMode !== "public-history" ? "admin" : "public"
  const selectedCenter = useMemo(() => getFeatureCenter(selectedPredio), [selectedPredio])
  const isGeovisor = activeSection === "geovisores"
  const activeSectionLabel =
    activeSection === "login"
      ? "Acceso"
      : NAV_ITEMS.find((item) => item.id === activeSection)?.label || "Inicio"

  const mapCollections = {
    predios,
    manzanas,
    pendientes,
    riesgos,
    zonasHomogeneas,
    surfaceDifferences,
    otbs,
  }

  useEffect(() => {
    if (!adminSession) {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      return
    }

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession))
  }, [adminSession])

  useEffect(() => {
    if (!isGeovisor || typeof window === "undefined") return undefined

    const media = window.matchMedia("(max-width: 760px)")
    const syncPanelState = (event) => {
      setIsToolsPanelOpen(!event.matches)
    }

    if (media.addEventListener) {
      media.addEventListener("change", syncPanelState)
      return () => media.removeEventListener("change", syncPanelState)
    }

    media.addListener(syncPanelState)
    return () => media.removeListener(syncPanelState)
  }, [isGeovisor])

  const handleSectionSelect = (sectionId) => {
    setAccessMessage("")
    setActiveSection(sectionId)
    if (sectionId === "geovisores") {
      setIsToolsPanelOpen(getInitialToolsPanelState())
    }
  }

  const handleSelectPredio = (feature) => {
    setSelectedPredio(feature)

    if (
      !isAdmin &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      setIsToolsPanelOpen(true)
    }
  }

  const handleSelectMapPoint = async ({ lat, lng, zoom }) => {
    if (zoom < 16) return

    const currentRequest = ++pointSelectionRequestId.current

    try {
      const response = await getPredioByPoint(lng, lat)
      if (pointSelectionRequestId.current !== currentRequest) return

      const collection = toLeafletFeatureCollection(response)
      const feature = collection.features?.[0]
      if (feature) {
        handleSelectPredio(feature)
      }
    } catch {
      // El clic directo es un respaldo: si no encuentra predio, la navegacion del mapa sigue normal.
    }
  }

  const handleAdminLogin = async ({ user, password }) => {
    try {
      const authResponse = await loginAdmin({ user: user.trim(), password })
      const nextSession = createAdminSession(authResponse)
      setAdminSession(nextSession)
      setIsToolsPanelOpen(getInitialToolsPanelState())
      setAccessMessage("")
      setActiveSection("geovisores")
      return { ok: true }
    } catch (loginError) {
      return {
        ok: false,
        message: loginError.message || "No se pudo iniciar sesion.",
      }
    }
  }

  const handleLogout = () => {
    setAdminSession(null)
    setIsToolsPanelOpen(getInitialToolsPanelState())
    setAccessMessage("Sesion cerrada.")
    setActiveSection("geovisores")
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Tu navegador no permite geolocalizacion.")
      return
    }

    setLocationStatus("Solicitando ubicacion...")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setUserLocation(nextLocation)
        setLocationStatus(
          `Ubicacion detectada. Precision aproximada ${formatNumber(
            position.coords.accuracy,
            0,
          )} m.`,
        )
        setIsToolsPanelOpen(false)
      },
      () => {
        setLocationStatus("No se pudo obtener la ubicacion. Revisa permisos del navegador.")
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    )
  }

  const handlePrintCurrent = () => {
    setReportMode("current")
    window.setTimeout(() => window.print(), 0)
  }

  const handlePrintHistory = () => {
    setReportMode("history")
    window.setTimeout(() => window.print(), 0)
  }

  const handlePrintPublicHistory = (entryId = "") => {
    if (entryId) {
      setSelectedPublicHistoryId(entryId)
    }
    setReportMode("public-history")
    window.setTimeout(() => window.print(), 0)
  }

  const handleExportAvaluo = async (format) => {
    if (!avaluo?.appraisal_id || !adminSession?.token) return

    const download = await downloadAvaluoExport(avaluo.appraisal_id, format, adminSession.token)
    const url = window.URL.createObjectURL(download.blob)
    const link = document.createElement("a")
    link.href = url
    link.download = download.filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const appraisalPanelProps = {
    selectedPredio,
    context,
    avaluo,
    preview,
    methodology,
    catalogs,
    constructionPreview,
    auditEntries,
    blocks,
    form,
    error: avaluoError,
    validation,
    loadingContext,
    previewLoading,
    submitting,
    publicCalculationPayload,
    onFieldChange: updateField,
    onResetField: resetFieldToAutomatic,
    onBlockChange: updateBlock,
    onAddBlock: addBlock,
    onRemoveBlock: removeBlock,
    onLoadExample: loadExampleData,
    onResetDraft: resetDraft,
    onCalculate: calculate,
    onPrintReport: handlePrintCurrent,
    onExportReport: handleExportAvaluo,
  }

  const renderPanelFallback = (title) => (
    <section className="panel-card">
      <div className="panel-header">
        <p className="eyebrow">Cargando modulo</p>
        <h3>{title}</h3>
      </div>
      <SkeletonBlock lines={4} />
    </section>
  )

  return (
    <main
      className={`app-shell ${isGeovisor ? "" : "is-portal-view"} ${
        isGeovisor && !isToolsPanelOpen ? "is-tools-collapsed" : ""
      }`}
      data-theme={theme}
    >
      <AppHeader
        isGeovisor={isGeovisor}
        navItems={NAV_ITEMS}
        activeSection={activeSection}
        activeSectionLabel={activeSectionLabel}
        theme={theme}
        adminSession={adminSession}
        onSectionSelect={handleSectionSelect}
        onLogout={handleLogout}
        onToggleTheme={toggleTheme}
        searchSlot={
          <PredioSearch
            selectedPredio={selectedPredio}
            onSelectPredio={handleSelectPredio}
            onSelectOtb={setSelectedOtb}
            onPredioSuggestionsChange={setOtbSuggestedPredios}
            onTerritoryChange={setTerritoryContext}
          />
        }
      />

      {isGeovisor ? (
        <button
          type="button"
          className="panel-toggle"
          aria-label={isToolsPanelOpen ? "Ocultar panel lateral" : "Abrir panel lateral"}
          aria-expanded={isToolsPanelOpen}
          aria-controls="tools-sidebar"
          onClick={() => setIsToolsPanelOpen((current) => !current)}
        >
          <span>{isToolsPanelOpen ? "Ocultar" : "Abrir"}</span>
          <strong>{isAdmin ? "Herramientas" : "Consulta"}</strong>
        </button>
      ) : null}

      {isGeovisor ? (
        <aside
          id="tools-sidebar"
          className={`sidebar ${isAdmin ? "is-admin-panel" : "is-public-panel"} ${
            isToolsPanelOpen ? "is-open" : "is-collapsed"
          }`}
        >
          {isAdmin ? (
            <div className="brand-block">
              <p className="eyebrow">Investigacion geografica aplicada</p>
              <h1>Nombre del sistema</h1>
              <p className="hero-copy">
                Lectura territorial para catastro, avaluo y control de consistencia espacial con
                trazabilidad tecnica.
              </p>
              <div className="filter-strip" aria-label="Filtros de trabajo">
                <div className="filter-chip">
                  <span>Institucion</span>
                  <strong>IIGEO UMSA</strong>
                </div>
                <div className="filter-chip">
                  <span>Territorio</span>
                  <strong>{territoryContext.municipality}</strong>
                </div>
                <div className="filter-chip">
                  <span>Lectura</span>
                  <strong>{territoryContext.categoryLabel}</strong>
                </div>
              </div>
              <div className="dimension-tabs" aria-label="Dimensiones catastrales">
                <div className="dimension-tab">
                  <span>01</span>
                  <strong>Valor suelo</strong>
                </div>
                <div className="dimension-tab">
                  <span>02</span>
                  <strong>Superficie</strong>
                </div>
                <div className="dimension-tab">
                  <span>03</span>
                  <strong>Riesgo</strong>
                </div>
                <div className="dimension-tab">
                  <span>04</span>
                  <strong>Servicios</strong>
                </div>
              </div>
            </div>
          ) : null}

          {isAdmin ? <MapStatusBadge health={health} mapError={error} loading={loading} /> : null}

          {!isAdmin ? (
            <Suspense fallback={renderPanelFallback("Consulta publica")}>
              <PublicValuationPanel
                {...appraisalPanelProps}
                locationStatus={locationStatus}
                onUseLocation={handleUseLocation}
                onOpenAdmin={() => setActiveSection("login")}
                publicHistoryItems={publicHistoryItems}
                selectedPublicHistoryId={selectedPublicHistoryId}
                onSelectPublicHistory={setSelectedPublicHistoryId}
                onClearPublicHistory={clearPublicHistory}
                onPrintPublicHistory={handlePrintPublicHistory}
              />
            </Suspense>
          ) : null}

          {isAdmin ? (
            <SidebarSection index={1} title="Cartografia y capas">
              <BasemapSelector value={basemap} onChange={setBasemap} />
              <LayerControl
                layers={layers}
                setLayers={setLayers}
                opacities={opacities}
                setOpacities={setOpacities}
              />
              <MapLegend />
            </SidebarSection>
          ) : null}

          {isAdmin ? (
            <SidebarSection index={2} title="Avaluo tecnico" open>
              <AvaluoPanel
                {...appraisalPanelProps}
              />
            </SidebarSection>
          ) : null}

          {isAdmin ? (
            <SidebarSection index={3} title="Participacion beta" open>
              <Suspense fallback={renderPanelFallback("Seguimiento beta")}>
                <BetaConsultasPanel authToken={adminSession?.token || ""} />
              </Suspense>
            </SidebarSection>
          ) : null}

          {isAdmin ? (
            <SidebarSection index={4} title="Historial y control">
              <Suspense fallback={renderPanelFallback("Historial de avaluos")}>
                <AvaluosHistoryPanel
                  items={historyItems}
                  selectedId={selectedHistoryId}
                  selectedAvaluo={selectedAvaluo}
                  loading={historyLoading}
                  loadingDetail={historyLoadingDetail}
                  error={historyError}
                  onSelect={setSelectedHistoryId}
                  onRefresh={refreshHistory}
                  onPrintReport={handlePrintHistory}
                />
              </Suspense>
              <Suspense fallback={renderPanelFallback("Control de superficies")}>
                <SurfaceDifferencesPanel authToken={adminSession?.token || ""} />
              </Suspense>
            </SidebarSection>
          ) : null}
        </aside>
      ) : null}

      {isGeovisor ? (
        <section className="map-panel">
          <div className="map-panel-header">
            <div>
              <p className="eyebrow">Visualizaciones catastrales</p>
              <h2>Mapa de valoracion territorial</h2>
            </div>
            <div className="map-panel-copy">
              <span className="location-pill">
                {selectedCenter
                  ? `Ubicacion ${formatNumber(selectedCenter.lat, 5)}, ${formatNumber(
                      selectedCenter.lng,
                      5,
                    )}`
                  : userLocation
                    ? `Tu ubicacion ${formatNumber(userLocation.lat, 5)}, ${formatNumber(
                        userLocation.lng,
                        5,
                      )}`
                    : "Selecciona o busca un predio"}
              </span>
              <span className="scale-pill">
                {scale.label} - zoom {Math.round(zoom || 0)}
              </span>
            </div>
          </div>

          <div className="visualization-toolbar">
            <div className="toolbar-filters" aria-label="Filtros territoriales">
              <div className="toolbar-filter">
                <span>Departamento</span>
                <strong>{territoryContext.department}</strong>
              </div>
              <div className="toolbar-filter">
                <span>Municipio</span>
                <strong>{territoryContext.municipality}</strong>
              </div>
              <div className="toolbar-filter">
                <span>Ambito</span>
                <strong>{territoryContext.areaLabel}</strong>
              </div>
              <div className="toolbar-filter">
                <span>Zona</span>
                <strong>{territoryContext.zone}</strong>
              </div>
              <div className="toolbar-filter">
                <span>Gestion</span>
                <strong>{form.gestion_anio}</strong>
              </div>
            </div>
            <div className="dimension-segmented" aria-label="Dimensiones de lectura">
              <button
                type="button"
                className={territoryContext.categoryKey === "avaluo" ? "is-active" : ""}
                aria-pressed={territoryContext.categoryKey === "avaluo"}
              >
                Avaluo
              </button>
              <button
                type="button"
                className={territoryContext.categoryKey === "superficie" ? "is-active" : ""}
                aria-pressed={territoryContext.categoryKey === "superficie"}
              >
                Superficie
              </button>
              <button
                type="button"
                className={territoryContext.categoryKey === "servicios" ? "is-active" : ""}
                aria-pressed={territoryContext.categoryKey === "servicios"}
              >
                Servicios
              </button>
              <button
                type="button"
                className={territoryContext.categoryKey === "riesgo" ? "is-active" : ""}
                aria-pressed={territoryContext.categoryKey === "riesgo"}
              >
                Riesgo
              </button>
            </div>
          </div>

          {error ? (
            <ContentState
              kind="error"
              compact
              title="Problema al cargar cartografia"
              description={error}
            />
          ) : null}

          <div className="metrics-grid map-metrics" aria-label="Metricas de capas visibles">
            {METRIC_CARDS.map((metric) => (
              <MetricCard
                key={metric.key}
                label={metric.label}
                value={mapCollections[metric.key]?.features?.length || 0}
                accent={metric.accent}
              />
            ))}
            <MetricCard
              label="Cobertura zona valor"
              value={
                coverage
                  ? `${coverage.con_zona_valor}/${coverage.total_predios}`
                  : health.status === "online"
                    ? "Activo"
                    : "Pendiente"
              }
            />
          </div>

          {!isAdmin ? (
            <div className="mobile-public-summary">
              <div>
                <span>Consulta publica</span>
                <strong>
                  {preview
                    ? `${formatCurrency(preview.valor_total || preview.base_imponible)}`
                    : selectedPredio
                      ? "Calculando valor..."
                      : "Busca o toca un predio"}
                </strong>
              </div>
              <div className="mobile-summary-actions">
                <button type="button" onClick={() => setIsToolsPanelOpen(true)}>
                  Valuar
                </button>
                <button type="button" onClick={handleUseLocation}>
                  Ubicacion
                </button>
              </div>
            </div>
          ) : null}

          <div className="map-frame">
            <MapView
              basemap={basemap}
              layers={layers}
              predios={predios}
              otbSuggestedPredios={otbSuggestedPredios}
              manzanas={manzanas}
              pendientes={pendientes}
              riesgos={riesgos}
              zonasHomogeneas={zonasHomogeneas}
              surfaceDifferences={surfaceDifferences}
              otbs={otbs}
              opacities={opacities}
              selectedPredio={selectedPredio}
              selectedOtb={selectedOtb}
              userLocation={userLocation}
              onSelectPredio={handleSelectPredio}
              onSelectMapPoint={handleSelectMapPoint}
              onBoundsChange={setMapBounds}
            />
            {!isAdmin ? <MapBasemapSwitcher value={basemap} onChange={setBasemap} /> : null}
            {!isAdmin ? <PublicLayerSwitcher layers={layers} setLayers={setLayers} /> : null}
            {!isAdmin && !selectedPredio ? (
              <div className="map-helper-toast">
                <strong>Consulta publica</strong>
                <span>
                  {selectedOtb && otbSuggestedPredios.length
                    ? `${otbSuggestedPredios.length} predios candidatos. Elige uno en la lista superior para iniciar el avaluo.`
                    : "Acercate por escala: ciudad y OTBs, luego manzanas, y al final predios."}
                </span>
              </div>
            ) : null}
            <div className="map-data-overlay">
              <div>
                <span>Escala activa</span>
                <strong>{scale.label}</strong>
              </div>
              <div>
                <span>OTBs visibles</span>
                <strong>{otbs?.features?.length || 0}</strong>
              </div>
              <div>
                <span>Manzanas visibles</span>
                <strong>{manzanas?.features?.length || 0}</strong>
              </div>
              <div>
                <span>{selectedOtb && otbSuggestedPredios.length ? "Predios candidatos" : "Predios visibles"}</span>
                <strong>{selectedOtb && otbSuggestedPredios.length ? otbSuggestedPredios.length : predios?.features?.length || 0}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Suspense fallback={renderPanelFallback("Portal institucional")}>
          <InstitutionPage
            section={activeSection}
            session={adminSession}
            accessMessage={accessMessage}
            onLogin={handleAdminLogin}
            onLogout={handleLogout}
            onOpenGeovisor={() => handleSectionSelect("geovisores")}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <AvaluoReportSheet
          avaluo={printableAvaluo}
          selectedPredio={printablePredio}
          audience={printableAudience}
        />
      </Suspense>
    </main>
  )
}

export default MapPage
