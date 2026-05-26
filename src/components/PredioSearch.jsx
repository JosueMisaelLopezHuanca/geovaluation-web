import { useEffect, useMemo, useRef, useState } from "react"
import { getOtbFeatureByName, getOtbOptions, searchPredios } from "../services/map.service"
import { formatNumber, getFeatureLabel, toLeafletFeatureCollection } from "../utils/map"

const MIN_QUERY_LENGTH = 2
const CATEGORY_OPTIONS = [
  { value: "avaluo", label: "Avaluo fiscal" },
  { value: "superficie", label: "Superficie" },
  { value: "servicios", label: "Servicios" },
  { value: "otbs", label: "OTBs" },
  { value: "riesgo", label: "Riesgo" },
]
const AREA_LABELS = {
  urbano: "Urbano",
  rural: "Rural",
  mixto: "Urbano / rural",
}
const TERRITORY_PROFILES = [
  {
    id: "la-paz",
    department: "La Paz",
    municipality: "Nuestra Senora de La Paz",
    areaType: "urbano",
    datasetStatus: "available",
    route: "/territorios/la-paz",
    zones: [
      "Todas las zonas",
      "Centro",
      "Sur",
      "Cotahuma",
      "Max Paredes",
      "Periferica",
      "San Antonio",
      "Mallasa",
    ],
  },
  {
    id: "el-alto",
    department: "La Paz",
    municipality: "El Alto",
    areaType: "urbano",
    datasetStatus: "planned",
    route: "/territorios/el-alto",
    zones: ["Todas las zonas", "Distrito 1", "Distrito 3", "Distrito 6", "Ceja", "Rio Seco"],
  },
  {
    id: "caranavi",
    department: "La Paz",
    municipality: "Caranavi",
    areaType: "rural",
    datasetStatus: "planned",
    route: "/territorios/caranavi",
    zones: ["Todas las zonas", "Urbano central", "Area rural", "Comunidades", "Eje productivo"],
  },
]
const DEFAULT_PROFILE = TERRITORY_PROFILES[0]

const PredioSearch = ({
  selectedPredio,
  onSelectPredio,
  onSelectOtb,
  onPredioSuggestionsChange,
  onTerritoryChange,
}) => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE.id)
  const [areaType, setAreaType] = useState(DEFAULT_PROFILE.areaType)
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value)
  const [zone, setZone] = useState(DEFAULT_PROFILE.zones[0])
  const [selectedOtbName, setSelectedOtbName] = useState("")
  const [otbOptions, setOtbOptions] = useState([])
  const [otbLoading, setOtbLoading] = useState(false)
  const [otbError, setOtbError] = useState("")
  const [otbSelecting, setOtbSelecting] = useState(false)
  const skipNextSearch = useRef(false)

  const activeProfile = useMemo(
    () => TERRITORY_PROFILES.find((profile) => profile.id === profileId) || DEFAULT_PROFILE,
    [profileId],
  )
  const activeCategory = CATEGORY_OPTIONS.find((option) => option.value === category) || CATEGORY_OPTIONS[0]
  const datasetAvailable = activeProfile.datasetStatus === "available"
  const hasOtbResults = Boolean(selectedOtbName && results.length)

  useEffect(() => {
    setAreaType(activeProfile.areaType)
    setZone(activeProfile.zones[0])
  }, [activeProfile])

  useEffect(() => {
    onTerritoryChange?.({
      department: activeProfile.department,
      municipality: activeProfile.municipality,
      areaType,
      areaLabel: AREA_LABELS[areaType] || areaType,
      categoryKey: activeCategory.value,
      categoryLabel: activeCategory.label,
      zone,
      route: activeProfile.route,
      datasetStatus: activeProfile.datasetStatus,
      otbName: selectedOtbName || null,
    })
  }, [activeCategory, activeProfile, areaType, onTerritoryChange, selectedOtbName, zone])

  useEffect(() => {
    if (!selectedPredio) return
    skipNextSearch.current = true
    setQuery(getFeatureLabel(selectedPredio))
  }, [selectedPredio])

  useEffect(() => {
    if (!datasetAvailable) {
      setOtbOptions([])
      setSelectedOtbName("")
      setOtbError("")
      onPredioSuggestionsChange?.([])
      onSelectOtb?.(null)
      return
    }

    let cancelled = false

    const loadOtbs = async () => {
      setOtbLoading(true)
      setOtbError("")
      try {
        const response = await getOtbOptions()
        if (cancelled) return
        setOtbOptions(response?.items || [])
      } catch (loadError) {
        if (cancelled) return
        setOtbOptions([])
        setOtbError(loadError.message || "No se pudo cargar la lista de OTBs")
      } finally {
        if (!cancelled) {
          setOtbLoading(false)
        }
      }
    }

    loadOtbs()

    return () => {
      cancelled = true
    }
  }, [datasetAvailable, onPredioSuggestionsChange, onSelectOtb, profileId])

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return undefined
    }

    const trimmedQuery = query.trim()
    if (!datasetAvailable) {
      setResults([])
      setLoading(false)
      setError("")
      setIsOpen(false)
      return undefined
    }

    const canSearchByOtbOnly = Boolean(selectedOtbName)

    if (trimmedQuery.length < MIN_QUERY_LENGTH && !canSearchByOtbOnly) {
      setResults([])
      setError("")
      setIsOpen(false)
      onPredioSuggestionsChange?.([])
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const resultLimit = selectedOtbName
          ? trimmedQuery.length >= MIN_QUERY_LENGTH
            ? 12
            : 24
          : 8
        const response = await searchPredios(trimmedQuery, resultLimit, selectedOtbName)
        if (cancelled) return
        const collection = toLeafletFeatureCollection(response)
        setResults(collection.features || [])
        onPredioSuggestionsChange?.(collection.features || [])
        setIsOpen(true)
      } catch (searchError) {
        if (cancelled) return
        setResults([])
        setError(searchError.message || "No se pudo buscar predios")
        onPredioSuggestionsChange?.([])
        setIsOpen(true)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, 260)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [datasetAvailable, onPredioSuggestionsChange, query, selectedOtbName])

  const selectResult = (feature) => {
    skipNextSearch.current = true
    onSelectPredio(feature)
    setQuery(getFeatureLabel(feature))
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || !results.length) return
    event.preventDefault()
    selectResult(results[0])
  }

  const handleOtbChange = async (event) => {
    const nextOtbName = event.target.value
    setSelectedOtbName(nextOtbName)
    setQuery("")
    setResults([])
    setIsOpen(Boolean(nextOtbName))
    setLoading(Boolean(nextOtbName))
    onSelectPredio?.(null)

    if (!nextOtbName) {
      setLoading(false)
      onPredioSuggestionsChange?.([])
      onSelectOtb?.(null)
      return
    }

    setOtbSelecting(true)
    setOtbError("")
    try {
      const response = await getOtbFeatureByName(nextOtbName)
      const collection = toLeafletFeatureCollection(response)
      const feature = collection.features?.[0] || null
      onSelectOtb?.(feature)
    } catch (selectionError) {
      onSelectOtb?.(null)
      setOtbError(selectionError.message || "No se pudo cargar la geometria de la OTB")
    } finally {
      setOtbSelecting(false)
    }
  }

  const searchPlaceholder = selectedOtbName
    ? `Selecciona un predio dentro de ${selectedOtbName} o escribe su codigo`
    : "Ej. codigo catastral, zona o UUID del predio"

  return (
    <div className="predio-search">
      <div className="territory-grid" aria-label="Filtros territoriales de busqueda">
        <label>
          <span>Departamento</span>
          <select value={activeProfile.department} disabled>
            <option>La Paz</option>
          </select>
        </label>
        <label>
          <span>Municipio</span>
          <select value={profileId} onChange={(event) => setProfileId(event.target.value)}>
            {TERRITORY_PROFILES.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.municipality}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Ambito</span>
          <select value={areaType} onChange={(event) => setAreaType(event.target.value)}>
            <option value="urbano">Urbano</option>
            <option value="rural">Rural</option>
            <option value="mixto">Urbano / rural</option>
          </select>
        </label>
        <label>
          <span>Categoria</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Zona</span>
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            {activeProfile.zones.map((profileZone) => (
              <option key={profileZone} value={profileZone}>
                {profileZone}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="search-form-grid">
        <label>
          <span>OTB de referencia</span>
          <select
            value={selectedOtbName}
            disabled={!datasetAvailable || otbLoading || otbSelecting}
            onChange={handleOtbChange}
          >
            <option value="">{otbLoading ? "Cargando OTBs..." : "Selecciona una OTB"}</option>
            {otbOptions.map((option) => (
              <option key={option.nombre} value={option.nombre}>
                {option.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="search-input-field">
          <span>Buscar predio</span>
          <input
            type="search"
            value={query}
            disabled={!datasetAvailable}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => results.length && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={datasetAvailable ? searchPlaceholder : `Dataset pendiente para ${activeProfile.municipality}`}
          />
        </label>
      </div>

      {selectedOtbName ? (
        <div className="search-helper-row">
          <p className="search-helper" role="status">
            Filtrando por OTB <strong>{selectedOtbName}</strong>.{" "}
            {loading
              ? "Buscando predios candidatos..."
              : hasOtbResults
                ? `${results.length} predios listos para elegir.`
                : "Escribe un codigo para precisar la busqueda."}
          </p>
          {hasOtbResults ? (
            <button
              type="button"
              className="search-results-toggle"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((currentValue) => !currentValue)}
            >
              {isOpen ? "Ocultar lista" : `Ver ${results.length} predios`}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`territory-status ${datasetAvailable ? "is-ready" : "is-planned"}`}>
        <div>
          <strong>{datasetAvailable ? "Dataset activo" : "Modulo preparado"}</strong>
          <span>
            {datasetAvailable
              ? `${activeProfile.municipality} - ${AREA_LABELS[areaType] || areaType} - ${zone}`
              : `${activeProfile.municipality} queda listo para conectar en ${activeProfile.route}`}
          </span>
        </div>
        {!datasetAvailable ? (
          <button type="button" onClick={() => setProfileId(DEFAULT_PROFILE.id)}>
            Usar La Paz
          </button>
        ) : null}
      </div>

      {otbError ? <p className="search-state search-error">{otbError}</p> : null}

      {isOpen ? (
        <div className="search-results" aria-label="Predios candidatos">
          {loading ? <p className="search-state">Buscando...</p> : null}
          {error ? <p className="search-state search-error">{error}</p> : null}
          {!loading && !error && !results.length ? (
            <p className="search-state">
              {selectedOtbName
                ? "No se encontraron predios visibles para la OTB seleccionada"
                : "Sin coincidencias"}
            </p>
          ) : null}
          {results.map((feature) => (
            <button
              key={feature.properties.id}
              type="button"
              className="search-result"
              onClick={() => selectResult(feature)}
            >
              <strong>{getFeatureLabel(feature)}</strong>
              <span>
                {feature.properties.superficie_gis == null
                  ? "Sin superficie GIS"
                  : `${formatNumber(feature.properties.superficie_gis)} m2`}
              </span>
              {feature.properties.otb_nombre ? (
                <em>
                  OTB {feature.properties.otb_nombre}
                  {feature.properties.match_origen === "otb" ? " - coincidencia por OTB" : ""}
                </em>
              ) : null}
              <small>
                {activeProfile.municipality} - {AREA_LABELS[areaType] || areaType} - {zone}
              </small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default PredioSearch
