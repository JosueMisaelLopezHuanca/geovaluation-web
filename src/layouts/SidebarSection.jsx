const SidebarSection = ({ index, title, children, open = false }) => (
  <details className="sidebar-disclosure" open={open}>
    <summary>
      <span>{String(index).padStart(2, "0")}</span>
      <strong>{title}</strong>
    </summary>
    <div className="sidebar-section-content">{children}</div>
  </details>
)

export default SidebarSection
