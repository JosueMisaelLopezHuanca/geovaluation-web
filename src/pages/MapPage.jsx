import { useState } from "react"
import AvaluoPanel from "../components/AvaluoPanel"
import AvaluosHistoryPanel from "../components/AvaluosHistoryPanel"
import AvaluoReportSheet from "../components/AvaluoReportSheet"
import BasemapSelector from "../components/BasemapSelector"
import LayerControl from "../components/LayerControl"
import MapLegend from "../components/MapLegend"
import MapStatusBadge from "../components/MapStatusBadge"
import MapView from "../components/MapView"
import MetricCard from "../components/MetricCard"
import { useAvaluo } from "../hooks/useAvaluo"
import { useAvaluosHistory } from "../hooks/useAvaluosHistory"
import { useMapData } from "../hooks/useMapData"

const MapPage = () => {
  const [layers, setLayers] = useState({
    predios: true,
    manzanas: true,
    zonas_homogeneas: true,
    pendientes: true,
    riesgos: true,
  })
  const [opacities, setOpacities] = useState({
    zonas_homogeneas: 16,
    pendientes: 34,
    riesgos: 26,
  })
  const [basemap, setBasemap] = useState("satellite")
  const [mapBounds, setMapBounds] = useState(null)
  const [selectedPredio, setSelectedPredio] = useState(null)
  const [reportMode, setReportMode] = useState("current")

  const {
    predios,
    manzanas,
    pendientes,
    riesgos,
    zonasHomogeneas,
    loading,
    error,
  } = useMapData(mapBounds, layers)
  const {
    items: historyItems,
    selectedId: selectedHistoryId,
    selectedAvaluo,
    loading: historyLoading,
    loadingDetail: historyLoadingDetail,
    error: historyError,
    setSelectedId: setSelectedHistoryId,
    refresh: refreshHistory,
  } = useAvaluosHistory()
  const {
    health,
    context,
    avaluo,
    coverage,
    methodology,
    constructionPreview,
    officialServices,
    blocks,
    form,
    error: avaluoError,
    loadingContext,
    previewLoading,
    submitting,
    updateField,
    updateBlock,
    addBlock,
    removeBlock,
    calculate,
  } = useAvaluo(selectedPredio, {
    onCalculated: async (response) => {
      await refreshHistory()
      if (response?.appraisal_id) {
        setSelectedHistoryId(response.appraisal_id)
      }
      setReportMode("current")
    },
  })

  const printableAvaluo = reportMode === "history" ? selectedAvaluo : avaluo || selectedAvaluo

  const handlePrintCurrent = () => {
    setReportMode("current")
    window.print()
  }

  const handlePrintHistory = () => {
    setReportMode("history")
    window.print()
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Sistema de avaluo catastral</p>
          <h1>Avalix</h1>
          <p className="hero-copy">
            Plataforma web para explorar cartografia predial, consultar contexto territorial y
            disparar calculos de avaluo conectados a tu backend.
          </p>
        </div>

        <div className="metrics-grid">
          <MetricCard label="Predios visibles" value={predios?.features?.length || 0} accent="cyan" />
          <MetricCard label="Manzanas visibles" value={manzanas?.features?.length || 0} accent="rose" />
          <MetricCard
            label="Zonas homogéneas visibles"
            value={zonasHomogeneas?.features?.length || 0}
            accent="emerald"
          />
          <MetricCard label="Pendientes visibles" value={pendientes?.features?.length || 0} accent="cyan" />
          <MetricCard label="Riesgos visibles" value={riesgos?.features?.length || 0} accent="rose" />
          <MetricCard
            label="Cobertura zona valor"
            value={coverage ? `${coverage.con_zona_valor}/${coverage.total_predios}` : health.status === "online" ? "Activo" : "Pendiente"}
          />
        </div>

        <MapStatusBadge health={health} mapError={error} loading={loading} />
        <BasemapSelector value={basemap} onChange={setBasemap} />
        <LayerControl
          layers={layers}
          setLayers={setLayers}
          opacities={opacities}
          setOpacities={setOpacities}
        />
        <MapLegend />
        <AvaluoPanel
          selectedPredio={selectedPredio}
          context={context}
          avaluo={avaluo}
          methodology={methodology}
          constructionPreview={constructionPreview}
          officialServices={officialServices}
          blocks={blocks}
          form={form}
          error={avaluoError}
          loadingContext={loadingContext}
          previewLoading={previewLoading}
          submitting={submitting}
          onFieldChange={updateField}
          onBlockChange={updateBlock}
          onAddBlock={addBlock}
          onRemoveBlock={removeBlock}
          onCalculate={calculate}
          onPrintReport={handlePrintCurrent}
        />
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
      </aside>

      <section className="map-panel">
        <div className="map-panel-header">
          <div>
            <p className="eyebrow">Vista urbana</p>
            <h2>Explorador geoespacial</h2>
          </div>
          <p className="map-panel-copy">
            Base cartografica clara y veloz para lectura de ciudad. Esta version prioriza
            rendimiento, limpieza visual y seleccion rapida de predios para el trabajo tecnico.
          </p>
        </div>

        <div className="map-frame">
          <MapView
            basemap={basemap}
            layers={layers}
            predios={predios}
            manzanas={manzanas}
            pendientes={pendientes}
            riesgos={riesgos}
            zonasHomogeneas={zonasHomogeneas}
            opacities={opacities}
            selectedPredio={selectedPredio}
            onSelectPredio={setSelectedPredio}
            onBoundsChange={setMapBounds}
          />
        </div>
      </section>

      <AvaluoReportSheet avaluo={printableAvaluo} selectedPredio={selectedPredio} />
    </main>
  )
}

export default MapPage
