import { useAnalysis } from '../context/AnalysisContext'
import { CheckCircle } from 'lucide-react'
import ScoreCard from '../components/ScoreCard'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'

export default function Validation() {
  const { results } = useAnalysis()
  if (!results) return <EmptyState icon={CheckCircle} message="Run analysis to see the validation checklist." />

  const { report, summary, tests, security, quality } = results

  const checks = [
    { label: 'Security scan completed',          pass: true,                                   detail: `${security.summary.total} findings` },
    { label: 'Dependency analysis completed',    pass: true,                                   detail: `${results.dependencies.totalDependencies} deps checked` },
    { label: 'Code quality analysis completed',  pass: true,                                   detail: `${quality.summary.total} quality issues` },
    { label: 'Test coverage analyzed',           pass: true,                                   detail: `~${tests.coverageEstimate}% coverage` },
    { label: 'No critical hardcoded secrets',    pass: security.summary.bySeverity.critical === 0, detail: security.summary.bySeverity.critical > 0 ? `${security.summary.bySeverity.critical} critical` : 'Passed' },
    { label: 'Test files detected',              pass: tests.testFiles > 0,                    detail: `${tests.testFiles} test files` },
    { label: 'Security score ≥ 60',              pass: report.securityScore >= 60,             detail: `Score: ${report.securityScore}/100` },
    { label: 'Fix suggestions generated',        pass: summary.fixesGenerated > 0,             detail: `${summary.fixesGenerated} fixes ready` },
  ]

  const passed = checks.filter(c => c.pass).length
  const pct = Math.round((passed / checks.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Validation</h1>
        <p className="page-subtitle">Post-analysis checklist · {passed}/{checks.length} checks passed</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Security" score={report.securityScore} />
        <ScoreCard label="Quality"  score={report.qualityScore} />
        <ScoreCard label="Coverage" score={tests.coverageEstimate} />
        <div className="stat-card"
          style={{ '--accent-gradient': pct >= 75 ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#facc15,#f97316)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Checks Passed</div>
          <div className="text-[38px] font-bold tabular-nums mt-2 leading-none"
            style={{ color: pct >= 75 ? '#4ade80' : '#facc15' }}>{passed}<span className="text-slate-600 text-lg">/{checks.length}</span></div>
        </div>
      </div>

      {/* Checklist */}
      <div className="card">
        <div className="section-heading">Validation Checklist</div>
        <div className="mb-5">
          <ProgressBar value={passed} max={checks.length} color={pct >= 75 ? 'green' : 'yellow'} label="Overall progress" height={7} />
        </div>
        <div className="space-y-1">
          {checks.map((check, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                ${check.pass ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                {check.pass ? '✓' : '✗'}
              </div>
              <span className={`text-[13px] flex-1 ${check.pass ? 'text-slate-200' : 'text-slate-500'}`}>{check.label}</span>
              <span className="text-[11px] text-slate-600 font-mono">{check.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Before/after metrics */}
      <div className="card">
        <div className="section-heading">Baseline Metrics</div>
        <p className="text-[12px] text-slate-600 mb-4">Re-run analysis after applying fixes to see improvement.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Issues',   val: summary.totalFindings, c: '#fb923c' },
            { label: 'Critical',       val: summary.critical,      c: '#f87171' },
            { label: 'High',           val: summary.high,          c: '#fb923c' },
            { label: 'Test Coverage',  val: `~${tests.coverageEstimate}%`, c: '#38bdf8' },
            { label: 'Security Score', val: `${report.securityScore}/100`, c: report.securityScore >= 70 ? '#4ade80' : '#f87171' },
            { label: 'Files Analyzed', val: summary.filesAnalyzed, c: '#818cf8' },
          ].map((m, i) => (
            <div key={i} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{m.label}</div>
              <div className="text-[24px] font-bold tabular-nums mt-1.5" style={{ color: m.c }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
