import { useState } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import { Wrench, AlertTriangle, Sparkles, ChevronRight, FileCode } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge'
import EmptyState from '../components/EmptyState'
import clsx from 'clsx'

const STRIPE = { critical: 'stripe-critical', high: 'stripe-high', medium: 'stripe-medium', low: 'stripe-low' }

export default function Fixes() {
  const { results } = useAnalysis()
  const [expanded, setExpanded] = useState(null)
  if (!results) return <EmptyState icon={Wrench} message="Run analysis to see AI-generated fix suggestions." />

  const fixes = results.fixes ?? []
  const aiCount = fixes.filter(f => f.aiEnhanced).length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Generated Fixes</h1>
          <p className="page-subtitle">
            {fixes.length} suggestion{fixes.length !== 1 ? 's' : ''} — review before applying
            {aiCount > 0 && <span className="ml-2 text-blue-400">· {aiCount} AI-enhanced</span>}
          </p>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl text-[13px]"
        style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
        <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-yellow-300/80 leading-relaxed">
          <span className="font-semibold text-yellow-300">Human approval required.</span> DevGuardian never automatically applies changes.
          Review each fix carefully and test in a branch before merging.
        </div>
      </div>

      <div className="space-y-2.5">
        {fixes.length === 0 && <div className="card text-center py-8 text-slate-500">No fixes generated</div>}
        {fixes.map((fix, i) => {
          const isOpen = expanded === i
          const severityKey = fix.severity in STRIPE ? fix.severity : 'low'
          return (
            <div
              key={i}
              className={clsx('overflow-hidden cursor-pointer transition-all duration-200', STRIPE[severityKey])}
              style={{
                background: isOpen ? 'rgba(99,102,241,0.05)' : 'var(--c-surface)',
                border: `1px solid ${isOpen ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14,
              }}
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="flex items-start gap-3 p-4">
                <SeverityBadge severity={fix.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[13px] font-semibold text-slate-100 leading-snug">{fix.issue}</div>
                    {fix.aiEnhanced && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <Sparkles size={9} /> AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FileCode size={10} className="text-slate-700 flex-shrink-0" />
                    <span className="text-[11px] text-slate-600 font-mono truncate">{fix.file}:{fix.line}</span>
                  </div>
                </div>
                <ChevronRight size={13} className={clsx('text-slate-700 flex-shrink-0 mt-0.5 transition-transform duration-200', isOpen && 'rotate-90')} />
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {fix.remediation && (
                    <div className="rounded-xl p-3.5"
                      style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">Remediation</div>
                      <p className="text-[13px] text-slate-300 leading-relaxed">{fix.remediation}</p>
                    </div>
                  )}

                  {fix.codeExample && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Code Example</div>
                      <pre className="code-block text-emerald-400/90">{fix.codeExample}</pre>
                    </div>
                  )}

                  {fix.aiEnhanced && (
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(59,130,246,0.25)' }}>
                      {/* AI suggestion header */}
                      <div className="flex items-center gap-2 px-3.5 py-2.5"
                        style={{ background: 'rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                          <Sparkles size={11} color="#fff" />
                        </div>
                        <div className="text-[11px] font-semibold text-blue-300 flex-1">AI-Generated Suggestion</div>
                        <span className="text-[10px] text-blue-400/60 font-mono">devguardian-ai</span>
                      </div>
                      {/* AI suggestion body */}
                      <div className="px-3.5 py-3" style={{ background: 'rgba(59,130,246,0.04)' }}>
                        <p className="text-[13px] text-slate-300 leading-relaxed">{fix.aiEnhanced}</p>
                      </div>
                      {/* AI disclaimer footer */}
                      <div className="px-3.5 py-2 flex items-center gap-1.5"
                        style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                        <AlertTriangle size={10} className="text-yellow-500/70 flex-shrink-0" />
                        <span className="text-[10px] text-slate-600">AI output — validate before applying to production code</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-yellow-600/70 italic pt-1">
                    ⚠️ Requires human review and approval before applying
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
