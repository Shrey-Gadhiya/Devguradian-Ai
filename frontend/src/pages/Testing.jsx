import { useState } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import { TestTube, ChevronDown, ChevronRight } from 'lucide-react'
import ScoreCard from '../components/ScoreCard'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import FileIcon from '../components/FileIcon'
import DiffBlock from '../components/DiffBlock'
import clsx from 'clsx'

const QUALITY_LABEL = { good: 'low', fair: 'medium', poor: 'high' }

export default function Testing() {
  const { results } = useAnalysis()
  const [expandedTest, setExpandedTest] = useState(null)
  const [showAllUntested, setShowAllUntested] = useState(false)

  if (!results) return <EmptyState icon={TestTube} message="Run analysis to see test coverage estimates and generated tests." />

  const { tests, generatedTests, findings } = results
  const testFindings = findings.filter(f => f.source === 'testing')

  const untestedVisible = showAllUntested ? tests.untestedFiles : tests.untestedFiles?.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Test Coverage</h1>
        <p className="page-subtitle">{tests.testFiles} test files · {tests.sourceFiles} source files · ~{tests.coverageEstimate}% estimated coverage</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Coverage" score={tests.coverageEstimate} />
        {[
          { label: 'Test Files',   val: tests.testFiles,      c: '#818cf8' },
          { label: 'Source Files', val: tests.sourceFiles,    c: '#94a3b8' },
          { label: 'Auto-Tests',   val: generatedTests.length, c: '#4ade80' },
        ].map(({ label, val, c }) => (
          <div key={label} className="stat-card" style={{ '--accent-gradient': `linear-gradient(90deg,${c}60,${c}20)` }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="text-[40px] font-bold tabular-nums mt-2 leading-none" style={{ color: c }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Coverage breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-5">
          <div className="section-heading">Coverage Breakdown</div>

          {/* Visual gauge */}
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              {(() => {
                const r = 34, circ = 2 * Math.PI * r
                const pct = tests.coverageEstimate / 100
                const c = pct >= 0.7 ? '#4ade80' : pct >= 0.4 ? '#fb923c' : '#f87171'
                return (
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                    <circle cx="44" cy="44" r={r} fill="none" stroke={c} strokeWidth="7"
                      strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${c}80)` }} />
                  </svg>
                )
              })()}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[18px] font-bold" style={{ color: tests.coverageEstimate >= 70 ? '#4ade80' : '#fb923c' }}>{tests.coverageEstimate}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <ProgressBar value={tests.testedFiles} max={tests.sourceFiles} label={`Covered (${tests.testedFiles})`} color="green" height={6} />
              <ProgressBar value={tests.sourceFiles - tests.testedFiles} max={tests.sourceFiles} label={`Uncovered (${tests.sourceFiles - tests.testedFiles})`} color="red" height={6} />
            </div>
          </div>

          {/* Coverage level label */}
          <div className="rounded-xl p-3 text-center"
            style={{ background: tests.coverageEstimate >= 70 ? 'rgba(34,197,94,0.08)' : 'rgba(249,115,22,0.08)',
              border: `1px solid ${tests.coverageEstimate >= 70 ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}` }}>
            <div className="text-[12px] font-semibold" style={{ color: tests.coverageEstimate >= 70 ? '#4ade80' : '#fb923c' }}>
              {tests.coverageEstimate >= 80 ? '✓ Good Coverage' : tests.coverageEstimate >= 50 ? '⚠ Coverage Needs Work' : '✗ Low Coverage — Increase Testing'}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Target: 80%+ for production-grade projects
            </div>
          </div>
        </div>

        {/* Test quality table */}
        <div className="card">
          <div className="section-heading">Test File Quality</div>
          <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-thin">
            {(!tests.testQuality || tests.testQuality.length === 0) ? (
              <div className="text-slate-600 text-sm py-6 text-center">No test files found</div>
            ) : tests.testQuality.map((tq, i) => (
              <div key={i} className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedTest(expandedTest === i ? null : i)}>
                  <FileIcon path={tq.file} size={10} />
                  <span className="text-[11px] text-slate-400 font-mono flex-1 truncate">{tq.file}</span>
                  <span className={`badge-${QUALITY_LABEL[tq.quality] || 'medium'} text-[10px]`}>{tq.quality}</span>
                  <span className="text-[10px] text-slate-600">{tq.testCases} cases</span>
                  {expandedTest === i ? <ChevronDown size={11} className="text-slate-600" /> : <ChevronRight size={11} className="text-slate-600" />}
                </button>
                {expandedTest === i && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Test Cases', val: tq.testCases, c: '#818cf8' },
                        { label: 'Assertions', val: tq.assertions, c: '#4ade80' },
                        { label: 'Quality', val: tq.quality, c: tq.quality === 'good' ? '#4ade80' : tq.quality === 'fair' ? '#facc15' : '#f87171' },
                      ].map(({ label, val, c }) => (
                        <div key={label} className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <div className="text-[14px] font-bold" style={{ color: c }}>{val}</div>
                          <div className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wide">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2 text-[11px] text-slate-600">
                      <span>{tq.hasSetup ? '✓ beforeEach' : '○ no setup'}</span>
                      <span>{tq.hasTeardown ? '✓ afterEach' : '○ no teardown'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Untested files */}
      {tests.untestedFiles?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="section-heading" style={{ marginBottom: 0 }}>
              Untested Source Files
              <span className="text-slate-600 font-normal ml-1">({tests.untestedFiles.length})</span>
            </div>
            {tests.untestedFiles.length > 10 && (
              <button onClick={() => setShowAllUntested(v => !v)} className="btn-ghost text-[11px]">
                {showAllUntested ? 'Show less' : `Show all ${tests.untestedFiles.length}`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {untestedVisible?.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[12px] font-mono text-slate-500 py-1.5 px-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <FileIcon path={f} size={10} />
                <span className="truncate">{f}</span>
              </div>
            ))}
          </div>
          {!showAllUntested && tests.untestedFiles.length > 10 && (
            <div className="text-[11px] text-slate-600 text-center mt-2">
              +{tests.untestedFiles.length - 10} more files without tests
            </div>
          )}
        </div>
      )}

      {/* Test coverage findings */}
      {testFindings.length > 0 && (
        <div className="card">
          <div className="section-heading">Coverage Findings ({testFindings.length})</div>
          <div className="divide-y divide-white/5">
            {testFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 first:pt-0">
                <span className="badge-medium flex-shrink-0 mt-0.5">Gap</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileIcon path={f.file} size={10} />
                    <span className="text-[12px] text-slate-300 font-mono truncate">{f.file}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{f.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated tests */}
      {generatedTests.length > 0 && (
        <div className="card">
          <div className="section-heading">Generated Test Files ({generatedTests.length})</div>
          <div className="space-y-3">
            {generatedTests.map((t, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="badge-info">{t.type}</span>
                  <FileIcon path={t.file} size={11} />
                  <span className="text-[12px] font-mono text-slate-200 flex-1 truncate">{t.file}</span>
                  <span className="text-[11px] text-slate-600">{t.framework}</span>
                </div>
                <DiffBlock code={t.content} language={t.language || 'js'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
