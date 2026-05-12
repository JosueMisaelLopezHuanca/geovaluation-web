const MetricCard = ({ label, value, accent = "emerald" }) => {
  return (
    <article className={`metric-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default MetricCard
