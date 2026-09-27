import { useState } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import { FileText, Download, Shield, AlertTriangle, TestTube, Zap } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function Reports() {
  const { results, session } = useAnalysis()
  const [tab, setTab] = useState('summary')
  if (!results) return <EmptyState icon={FileText} message="Run analysis to generate an exportable engineering report." />

  const { report, summary, tests } = results

  function downloadMarkdown() {
    const blob = new Blob([report.markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.md'; a.click()
    URL.revokeObjectURL(url)
  }
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(report.json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const TABS = ['summary', 'markdown', 'json']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generated {new Date(report.generatedAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadMarkdown} className="btn-secondary text-[13px]">
            <Download size={13} /> Markdown
          </button>
          <button onClick={downloadJSON} className="btn-secondary text-[13px]">
            <Download size={13} /> JSON
          </button>
        </div>
      </div>

      {/* Score highlight strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Shield,        label: 'Security Score', val: `${report.securityScore}/100`, c: report.securityScore >= 70 ? '#4ade80' : '#f87171' },
          { icon: AlertTriangle, label: 'Total Findings',  val: summary.totalFindings,         c: '#fb923c' },
          { icon: TestTube,      label: 'Test Coverage',   val: `~${tests.coverageEstimate}%`, c: '#38bdf8' },
          { icon: Zap,           label: 'Fixes Generated', val: summary.fixesGenerated,        c: '#818cf8' },
        ].map(({ icon: Icon, label, val, c }) => (
          <div key={label} className="stat-card"
            style={{ '--accent-gradient': `linear-gradient(90deg,${c}60,${c}20)` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={11} style={{ color: c }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{label}</span>
            </div>
            <div className="text-[26px] font-bold tabular-nums" style={{ color: c }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`tab capitalize ${tab === t ? 'active' : ''}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'summary' && (
        <div className="space-y-4 anim-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Quality Score',    val: `${report.qualityScore}/100` },
              { label: 'Critical',         val: summary.critical },
              { label: 'High',             val: summary.high },
              { label: 'Medium',           val: summary.medium },
              { label: 'Tests Generated',  val: summary.testsGenerated },
              { label: 'Files Analyzed',   val: summary.filesAnalyzed },
            ].map(({ label, val }, i) => (
              <div key={i} className="card">
                <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">{label}</div>
                <div className="text-[24px] font-bold text-slate-100 mt-1.5 tabular-nums">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'markdown' && (
        <div className="card anim-fade-in" style={{ padding: 0 }}>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[11px] text-slate-600 font-mono">devguardian-report.md</span>
            <button onClick={downloadMarkdown} className="btn-ghost text-[11px] py-1">
              <Download size={11} /> Download
            </button>
          </div>
          <pre className="code-block rounded-none text-[11px] max-h-[60vh] overflow-y-auto scrollbar-thin leading-relaxed"
            style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
            {report.markdown}
          </pre>
        </div>
      )}

      {tab === 'json' && (
        <div className="card anim-fade-in" style={{ padding: 0 }}>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <span className="text-[11px] text-slate-600 font-mono">devguardian-report.json</span>
            <button onClick={downloadJSON} className="btn-ghost text-[11px] py-1">
              <Download size={11} /> Download
            </button>
          </div>
          <pre className="code-block rounded-none text-[11px] max-h-[60vh] overflow-y-auto scrollbar-thin"
            style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
            {JSON.stringify(report.json, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
