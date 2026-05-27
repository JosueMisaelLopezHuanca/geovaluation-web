const SkeletonBlock = ({ lines = 3, dense = false }) => (
  <div className={`skeleton-block ${dense ? "is-dense" : ""}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <span key={`skeleton-line-${index}`} className="skeleton-line" />
    ))}
  </div>
)

export default SkeletonBlock
