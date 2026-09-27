import clsx from 'clsx'

const COLORS = {
  blue:   { bar: 'linear-gradient(90deg,#3b82f6,#6366f1)', track: 'rgba(59,130,246,0.12)' },
  green:  { bar: 'linear-gradient(90deg,#22c55e,#4ade80)', track: 'rgba(34,197,94,0.12)' },
  red:    { bar: 'linear-gradient(90deg,#ef4444,#f87171)', track: 'rgba(239,68,68,0.12)' },
  yellow: { bar: 'linear-gradient(90deg,#ca8a04,#facc15)', track: 'rgba(234,179,8,0.12)' },
  orange: { bar: 'linear-gradient(90deg,#ea580c,#fb923c)', track: 'rgba(249,115,22,0.12)' },
  indigo: { bar: 'linear-gradient(90deg,#4f46e5,#818cf8)', track: 'rgba(99,102,241,0.12)' },
}

export default function ProgressBar({ value, max = 100, color = 'blue', label, showPercent = true, height = 6 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const { bar, track } = COLORS[color] || COLORS.blue

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-[12px] text-slate-400 font-medium">{label}</span>}
          {showPercent && (
            <span className="text-[12px] font-bold tabular-nums" style={{ color: COLORS[color]?.bar ? undefined : '#94a3b8' }}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div className="relative w-full rounded-full overflow-hidden" style={{ height, background: track }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: bar }}
        />
      </div>
    </div>
  )
}
