export default function DiffBlock({ code, language = 'js' }) {
  if (!code) return null
  const lines = code.split('\n')
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#050709' }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
        </div>
        <span className="text-[10px] text-slate-600 ml-2 font-mono">{language}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {lines.map((line, i) => {
              const isRemoved = line.startsWith('// BAD:') || line.startsWith('// Instead')
              const isAdded = line.startsWith('// Use:') || line.startsWith('// Good')
              const isMeta = line.startsWith('//')
              return (
                <tr key={i} style={{
                  background: isAdded ? 'rgba(34,197,94,0.05)' : isRemoved ? 'rgba(239,68,68,0.05)' : 'transparent'
                }}>
                  <td className="select-none pr-3 pl-3 text-right tabular-nums"
                    style={{ color: '#334155', width: 36, verticalAlign: 'top', paddingTop: 2, paddingBottom: 2 }}>
                    {i + 1}
                  </td>
                  <td className="pl-2 pr-4" style={{
                    color: isMeta ? '#64748b' : '#94a3b8',
                    paddingTop: 2, paddingBottom: 2,
                    whiteSpace: 'pre',
                  }}>
                    {line}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
