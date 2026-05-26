const AppHeader = ({
  isGeovisor,
  navItems,
  activeSection,
  activeSectionLabel,
  theme,
  adminSession,
  onSectionSelect,
  onLogout,
  onToggleTheme,
  searchSlot,
}) => {
  const handleSectionSelect = (sectionId) => {
    onSectionSelect(sectionId)
  }

  const renderNavigation = () => (
    <nav className="institution-nav" aria-label="Navegacion institucional">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={activeSection === item.id ? "is-active" : ""}
          aria-current={activeSection === item.id ? "page" : undefined}
          onClick={() => handleSectionSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )

  return (
    <header className={`institute-header ${isGeovisor ? "is-geovisor-header" : ""}`}>
      <div className="logo-lockup">
        <div className="logo-slot" aria-label="Instituto de Investigaciones Geograficas">
          IIGEO
        </div>
        <div>
          <p className="eyebrow">Instituto de Investigaciones Geograficas</p>
          <h1>Visor Catastral - Nombre del sistema</h1>
          <span>UMSA - plataforma academica para valoracion territorial</span>
          {renderNavigation()}
        </div>
      </div>

      {isGeovisor ? (
        searchSlot
      ) : (
        <div className="header-context">
          <span>Portal institucional</span>
          <strong>{activeSectionLabel}</strong>
        </div>
      )}

      <div className="header-actions">
        {adminSession ? (
          <button type="button" className="session-pill" onClick={onLogout}>
            <span>{adminSession.user}</span>
            <strong>Salir</strong>
          </button>
        ) : (
          <button
            type="button"
            className={`login-link ${activeSection === "login" ? "is-active" : ""}`}
            onClick={() => handleSectionSelect("login")}
          >
            Acceso
          </button>
        )}
        <button
          type="button"
          className="theme-toggle"
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
      </div>
    </header>
  )
}

export default AppHeader
