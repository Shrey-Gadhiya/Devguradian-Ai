export default function MetricRow({ label, value, valueColor, mono, sub }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div>
        <div className="text-[12px] text-slate-400 font-medium">{label}</div>
        {sub && <div className="text-[11px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
      <div className={`text-[13px] font-semibold text-right flex-shrink-0 max-w-[60%] ${valueColor || 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}
