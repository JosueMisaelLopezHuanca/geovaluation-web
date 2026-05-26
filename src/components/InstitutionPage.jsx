import { useState } from "react"

const SECTION_CONTENT = {
  inicio: {
    eyebrow: "Portal geografico institucional",
    title: "Catastro, avaluo y lectura territorial en un solo visor",
    copy:
      "La plataforma organiza informacion predial, cartografia base y criterios tecnicos para apoyar decisiones academicas, municipales y territoriales desde el IIGEO.",
    primaryAction: "Abrir geovisor",
    highlights: [
      ["Linea base", "Predios, manzanas y zonas de valor para lectura fiscal."],
      ["Control tecnico", "Diferencias GIS vs superficie legal y trazabilidad de cambios."],
      ["Trabajo academico", "Espacio para investigacion aplicada, docencia y extension."],
    ],
    stats: [
      ["01", "Catastro urbano"],
      ["02", "Avaluo fiscal"],
      ["03", "Riesgo territorial"],
    ],
  },
  investigacion: {
    eyebrow: "Investigacion aplicada",
    title: "Lineas para convertir datos catastrales en conocimiento geografico",
    copy:
      "Esta seccion puede alojar estudios, metodologias, publicaciones y tableros de seguimiento ligados a valor del suelo, morfologia urbana y vulnerabilidad territorial.",
    highlights: [
      ["Valor del suelo", "Modelos comparativos por zona homogenea, pendiente, accesibilidad y servicios."],
      ["Calidad de dato", "Auditoria de superficies, geometrias, fuentes oficiales y ediciones manuales."],
      ["Expansion urbana", "Lectura futura para El Alto, Caranavi y otros municipios del departamento."],
      ["Riesgo y ambiente", "Cruce de catastro con pendientes, amenazas y restricciones territoriales."],
    ],
  },
  servicios: {
    eyebrow: "Servicios geograficos",
    title: "Capacidades que el sistema puede ofrecer al instituto y a municipios",
    copy:
      "La plataforma puede crecer como ventanilla tecnica para consultas prediales, reportes, mapas tematicos y asistencia en procesos de actualizacion catastral.",
    highlights: [
      ["Geovisores tematicos", "Mapas de predios, servicios, riesgo, superficies y zonas de valor."],
      ["Reportes de avaluo", "Impresion de fichas tecnicas con parametros, metodologia y resultado economico."],
      ["Analisis espacial", "Identificacion de inconsistencias, areas prioritarias y cambios territoriales."],
      ["Soporte institucional", "Preparado para perfiles de acceso y trazabilidad de usuarios."],
    ],
  },
  contactos: {
    eyebrow: "Vinculacion institucional",
    title: "Canales para soporte, coordinacion y extension",
    copy:
      "Aqui puede ir la informacion oficial del IIGEO, responsables tecnicos del geovisor y enlaces a repositorios o mesas de trabajo.",
    highlights: [
      ["Institucion", "Instituto de Investigaciones Geograficas - UMSA."],
      ["Soporte tecnico", "Mesa interna para catastro, GIS, datos y avaluos."],
      ["Municipios", "Espacio de coordinacion para La Paz, El Alto, Caranavi y futuras coberturas."],
    ],
  },
  login: {
    eyebrow: "Acceso institucional",
    title: "Ingreso administrativo al geovisor",
    copy:
      "Este acceso habilita la sesion local del administrador para trabajar con el geovisor. Para produccion, la autenticacion debe validarse desde el backend con tokens y roles.",
    highlights: [
      ["Investigador", "Consulta, descarga de reportes y revision metodologica."],
      ["Tecnico municipal", "Edicion controlada de datos manuales y seguimiento de cambios."],
      ["Administrador", "Gestion de usuarios, normativa, coberturas y parametros."],
    ],
  },
}

const LOGIN_INITIAL_STATE = {
  user: "admin",
  password: "",
}

const CREATOR_PROFILE = {
  name: "Josué Misael López Huanca",
  role: "Creador y desarrollador del proyecto",
  phoneLabel: "+591 77536854",
  phoneHref: "https://wa.me/59177536854",
  email: "lopezhuancajosuemisael@gmail.com",
}

const InstitutionPage = ({
  section = "inicio",
  session,
  accessMessage,
  onLogin,
  onLogout,
  onOpenGeovisor,
}) => {
  const content = SECTION_CONTENT[section] || SECTION_CONTENT.inicio
  const isLogin = section === "login"
  const isContact = section === "contactos"
  const [loginData, setLoginData] = useState(LOGIN_INITIAL_STATE)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLoginChange = (field, value) => {
    setLoginData((current) => ({ ...current, [field]: value }))
    setLoginError("")
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoginLoading(true)
    try {
      const response = await onLogin?.(loginData)
      if (!response?.ok) {
        setLoginError(response?.message || "No se pudo iniciar sesion.")
      }
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <section className={`portal-panel ${isLogin ? "is-login-view" : ""}`}>
      <div className="portal-hero">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h2>{content.title}</h2>
          <p className="portal-hero-copy">{content.copy}</p>
          <div className="portal-action-row">
            <button type="button" className="primary-button portal-action" onClick={onOpenGeovisor}>
              {content.primaryAction || "Ir al geovisor"}
            </button>
            <span>UMSA - IIGEO - Sistema Catastral</span>
          </div>
        </div>

        <div className="portal-map-mark">
          <span>La Paz</span>
          <strong>16.4897 S</strong>
          <strong>68.1193 W</strong>
        </div>
      </div>

      {content.stats ? (
        <div className="portal-kpis">
          {content.stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className={`portal-grid ${isLogin ? "has-login" : ""}`}>
        {isLogin ? (
          <div className="login-surface">
            {session ? (
              <div className="login-session">
                <span>Sesion activa</span>
                <strong>{session.user}</strong>
                <p>Rol: {session.role}</p>
                <div className="login-actions">
                  <button type="button" className="primary-button" onClick={onOpenGeovisor}>
                    Entrar al geovisor
                  </button>
                  <button type="button" className="secondary-button" onClick={onLogout}>
                    Cerrar sesion
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit}>
                <h3>Acceso admin</h3>
                {accessMessage ? <p className="login-alert">{accessMessage}</p> : null}
                {loginError ? <p className="login-alert is-error">{loginError}</p> : null}
                <label className="login-field">
                  <span>Usuario</span>
                  <input
                    type="text"
                    value={loginData.user}
                    onChange={(event) => handleLoginChange("user", event.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    disabled={loginLoading}
                  />
                </label>
                <label className="login-field">
                  <span>Contrasena</span>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(event) => handleLoginChange("password", event.target.value)}
                    placeholder="Contrasena configurada"
                    autoComplete="current-password"
                    disabled={loginLoading}
                  />
                </label>
                <button type="submit" className="primary-button" disabled={loginLoading}>
                  {loginLoading ? "Validando..." : "Ingresar"}
                </button>
                <p className="login-note">
                  Usuario inicial: admin. La contrasena se valida en el backend y puede cambiarse
                  con CATASTRO_ADMIN_PASSWORD.
                </p>
              </form>
            )}
          </div>
        ) : null}

        <div className="portal-card is-wide">
          <h3>{isLogin ? "Perfiles previstos" : "Lo importante de esta seccion"}</h3>
          <div className="portal-list">
            {content.highlights.map(([title, description]) => (
              <article key={title}>
                <strong>{title}</strong>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>

        {!isLogin ? (
          <div className="portal-card">
            <h3>Siguiente paso sugerido</h3>
            <p>
              Consolidar datos de cobertura y definir que municipios pasan a modo activo despues de
              La Paz.
            </p>
            <button type="button" className="secondary-button" onClick={onOpenGeovisor}>
              Comparar en el mapa
            </button>
          </div>
        ) : null}
      </div>

      {isContact ? (
        <section className="creator-profile" aria-label="Autor y contacto del proyecto">
          <div className="creator-monogram" aria-hidden="true">
            JL
          </div>
          <div className="creator-copy">
            <p className="eyebrow">Autor del sistema</p>
            <h3>{CREATOR_PROFILE.name}</h3>
            <span>{CREATOR_PROFILE.role}</span>
            <p>
              Contacto para colaboración, soporte técnico, integración GIS o continuidad del
              proyecto.
            </p>
          </div>
          <div className="creator-actions">
            <a href={`mailto:${CREATOR_PROFILE.email}`}>Enviar correo</a>
            <a href={CREATOR_PROFILE.phoneHref} target="_blank" rel="noreferrer">
              WhatsApp {CREATOR_PROFILE.phoneLabel}
            </a>
            <small>GitHub y repositorio público pueden incorporarse al publicar el perfil oficial.</small>
          </div>
        </section>
      ) : null}
    </section>
  )
}

export default InstitutionPage
