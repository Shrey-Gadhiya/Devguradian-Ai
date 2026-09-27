import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import { Shield, AlertTriangle, Zap, TestTube, ArrowRight, FileCode, Lock, GitBranch, Package, Clock, Code2, TrendingUp, Activity, ChevronRight } from 'lucide-react'
import ScoreCard from '../components/ScoreCard'
import ProgressBar from '../components/ProgressBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      <div style={{ color: payload[0]?.fill || '#818cf8', fontWeight: 700, fontSize: 16 }}>{payload[0]?.value}</div>
    </div>
  )
}

const LANG_COLORS = {
  'Node.js':'#6366f1','JavaScript':'#f7df1e','TypeScript':'#3178c6',
  'Python':'#3572a5','Java':'#b07219','Go':'#00add8','Rust':'#dea584',
  'Ruby':'#701516','PHP':'#4f5d95','C#':'#178600','C/C++':'#f34b7d',
}

function LangDot({ lang }) {
  const c = LANG_COLORS[lang] || '#64748b'
  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
}

export default function Overview() {
  const { results, loading, error, session } = useAnalysis()
  const navigate = useNavigate()
  // endTime/startTime live on the session object, not on the results payload

  /* ── Empty / Loading state ── */
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle,#6366f1 0%,transparent 70%)' }} />
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 48px rgba(99,102,241,0.45)' }}>
            <Shield size={36} color="#fff" strokeWidth={1.5} />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
            DevGuardian <span className="grad-text">AI</span>
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto text-sm leading-relaxed">
            Autonomous 6-agent security &amp; quality platform. Detect OWASP vulnerabilities,
            dependency CVEs, coverage gaps, and get AI-generated fixes — all in one scan.
          </p>
        </div>

        {loading ? (
          <div className="card w-full max-w-sm text-center py-7 space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center"
              style={{ border: '2px solid rgba(99,102,241,0.4)', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
            <div className="text-sm text-slate-300 font-semibold">{session?.currentAgent || 'Analyzing…'}</div>
            <div className="text-xs text-slate-600">{session?.progress || 0}% complete</div>
            <ProgressBar value={session?.progress || 0} color="indigo" showPercent={false} height={4} />
            {session?.agentLogs?.slice(-1).map((l, i) => (
              <div key={i} className="text-[11px] text-slate-600 font-mono truncate px-2">→ {l.message}</div>
            ))}
          </div>
        ) : (
          <button onClick={() => navigate('/repository')} className="btn-primary px-8 py-2.5">
            <Shield size={14} /> Load Repository <ArrowRight size={13} />
          </button>
        )}

        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>}

        {/* Capability grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mt-4">
          {[
            { icon: Lock,          label: 'OWASP Security',    desc: '18 detection rules', c: '#6366f1' },
            { icon: AlertTriangle, label: 'Dep. CVEs',         desc: 'Known vulnerabilities', c: '#f87171' },
            { icon: TestTube,      label: 'Test Coverage',     desc: 'Gap detection', c: '#4ade80' },
            { icon: FileCode,      label: 'Code Quality',      desc: 'Complexity & style', c: '#38bdf8' },
          ].map(({ icon: Icon, label, desc, c }) => (
            <div key={label} className="card text-center py-5 px-3">
              <div className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ background: c + '18', border: `1px solid ${c}30` }}>
                <Icon size={15} style={{ color: c }} />
              </div>
              <div className="text-[12px] font-semibold text-slate-300">{label}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Results state ── */
  const { summary, report, tests, security, quality, architecture, findings } = results

  const findingData = [
    { name: 'Critical', value: summary.critical, color: '#f87171' },
    { name: 'High',     value: summary.high,     color: '#fb923c' },
    { name: 'Medium',   value: summary.medium,   color: '#facc15' },
    { name: 'Low',      value: summary.low,      color: '#4ade80' },
  ]

  // Source breakdown
  const sourceMap = {}
  for (const f of findings) sourceMap[f.source] = (sourceMap[f.source] || 0) + 1
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }))
  const sourceColors = { security: '#f87171', dependency: '#fb923c', quality: '#818cf8', testing: '#4ade80' }

  // Language stats from architecture
  const langStats = architecture?.metrics?.byExtension || {}
  const topLangs = Object.entries(langStats)
    .sort((a, b) => b[1].files - a[1].files)
    .slice(0, 6)

  // Project info
  const proj = architecture?.projectInfo || {}
  const scanDurationSec = session?.endTime && session?.startTime
    ? Math.round((session.endTime - session.startTime) / 1000)
    : null

  const radarData = [
    { subject: 'Security',  A: report.securityScore },
    { subject: 'Quality',   A: report.qualityScore },
    { subject: 'Coverage',  A: tests.coverageEstimate },
    { subject: 'Deps',      A: Math.max(0, 100 - (results.dependencies?.summary?.total || 0) * 10) },
    { subject: 'Tests',     A: Math.min(100, tests.testFiles * 20) },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
            <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Analysis Complete</span>
          </div>
          <h1 className="page-title">Security Overview</h1>
          <p className="page-subtitle">
            {summary.filesAnalyzed} files · {summary.totalFindings} findings
            {scanDurationSec != null && <> · scanned in {scanDurationSec}s</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/findings')} className="btn-secondary text-[13px]">
            <AlertTriangle size={12} /> View Findings
          </button>
          <button onClick={() => navigate('/reports')} className="btn-primary text-[13px]">
            <FileCode size={12} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Score row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Security Score" score={report.securityScore} />
        <ScoreCard label="Quality Score"  score={report.qualityScore} />
        <ScoreCard label="Test Coverage"  score={tests.coverageEstimate} />
        <div className="stat-card flex flex-col justify-between"
          style={{ '--accent-gradient': 'linear-gradient(90deg,#f87171,#fb923c)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Findings</div>
          <div>
            <div className="text-[40px] font-bold leading-none text-slate-100 tabular-nums mt-2">{summary.totalFindings}</div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <span className="badge-critical">{summary.critical} critical</span>
              <span className="badge-high">{summary.high} high</span>
              {summary.medium > 0 && <span className="badge-medium">{summary.medium} med</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Project info strip ── */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            { icon: Code2,    label: 'Language',   val: proj.primaryLanguage || '—' },
            { icon: Package,  label: 'Frameworks', val: proj.frameworks?.join(', ') || '—' },
            { icon: GitBranch,label: 'Pkg Manager',val: proj.packageManagers?.join(', ') || '—' },
            { icon: FileCode, label: 'Files',      val: summary.filesAnalyzed },
            { icon: Activity, label: 'Est. LOC',   val: (architecture?.metrics?.estimatedLinesOfCode || 0).toLocaleString() },
            { icon: TestTube, label: 'Test Files',  val: tests.testFiles },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={12} className="text-slate-600" />
              <span className="text-[11px] text-slate-600">{label}:</span>
              <span className="text-[12px] font-semibold text-slate-300">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="card">
          <div className="section-heading">Findings by Severity</div>
          <ResponsiveContainer width="100%" height={148}>
            <BarChart data={findingData} barSize={26} barGap={6}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[5,5,2,2]}>
                {findingData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div className="card">
          <div className="section-heading">Findings by Source</div>
          <div className="space-y-3 mt-1">
            {sourceData.map(({ name, value }) => (
              <div key={name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400 capitalize font-medium">{name}</span>
                  <span className="text-slate-500 tabular-nums">{value}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (value / summary.totalFindings) * 100)}%`,
                    background: sourceColors[name] || '#6366f1'
                  }} />
                </div>
              </div>
            ))}
          </div>
          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Fixes', val: summary.fixesGenerated, c: '#4ade80' },
              { label: 'Tests', val: summary.testsGenerated, c: '#38bdf8' },
              { label: 'Files', val: summary.filesAnalyzed, c: '#818cf8' },
            ].map(({ label, val, c }) => (
              <div key={label} className="text-center rounded-lg py-2"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[16px] font-bold tabular-nums" style={{ color: c }}>{val}</div>
                <div className="text-[10px] text-slate-700 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Health radar */}
        <div className="card">
          <div className="section-heading">Health Radar</div>
          <ResponsiveContainer width="100%" height={148}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
              <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Language breakdown ── */}
      {topLangs.length > 0 && (
        <div className="card">
          <div className="section-heading">Language Breakdown</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topLangs.map(([ext, stat]) => {
              const pct = Math.round((stat.files / summary.filesAnalyzed) * 100)
              return (
                <div key={ext} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="inline-flex items-center justify-center text-[10px] font-bold rounded-lg flex-shrink-0"
                    style={{ width: 34, height: 34, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                    {ext.replace('.','').slice(0,3).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-medium">{ext}</span>
                      <span className="text-slate-600 tabular-nums">{stat.files} files</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Health metrics + Quick nav ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <div className="section-heading">Health Metrics</div>
          <ProgressBar value={tests.coverageEstimate} label="Test Coverage"  color={tests.coverageEstimate >= 70 ? 'green' : 'orange'} height={7} />
          <ProgressBar value={report.securityScore}   label="Security Score" color={report.securityScore >= 70 ? 'green' : 'red'} height={7} />
          <ProgressBar value={report.qualityScore}    label="Code Quality"   color={report.qualityScore >= 70 ? 'green' : 'yellow'} height={7} />
        </div>

        <div>
          <div className="section-heading">Navigate</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'All Findings',  sub: `${summary.totalFindings} issues`, icon: AlertTriangle, to: '/findings', c: '#f87171' },
              { label: 'Security Scan', sub: `${security.summary.total} findings`, icon: Lock, to: '/security', c: '#6366f1' },
              { label: 'Test Coverage', sub: `~${tests.coverageEstimate}%`, icon: TestTube, to: '/testing', c: '#4ade80' },
              { label: 'Fix Review',    sub: `${summary.fixesGenerated} ready`, icon: Zap, to: '/fixes', c: '#a78bfa' },
            ].map(({ label, sub, icon: Icon, to, c }) => (
              <button key={to} onClick={() => navigate(to)}
                className="flex items-center gap-3 p-3 rounded-xl text-left group transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: c + '18', border: `1px solid ${c}28` }}>
                  <Icon size={13} style={{ color: c }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">{label}</div>
                  <div className="text-[10px] text-slate-600">{sub}</div>
                </div>
                <ChevronRight size={12} className="ml-auto text-slate-700 group-hover:text-slate-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
