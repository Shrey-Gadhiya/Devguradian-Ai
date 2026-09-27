const DOT = { critical: '#f87171', high: '#fb923c', medium: '#facc15', low: '#4ade80' }
const LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

export default function SeverityBadge({ severity }) {
  const color = DOT[severity] || '#94a3b8'
  const label = LABEL[severity] || severity
  return (
    <span
      className={`badge-${severity || 'low'}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  )
}
