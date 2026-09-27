import { useState } from 'react'
import { useAnalysis } from '../context/AnalysisContext'
import { Bot, CheckCircle, Circle, Loader2, ChevronDown, ChevronRight, Activity, Clock } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MetricRow from '../components/MetricRow'
import clsx from 'clsx'

const AGENTS = [
  {
    id: 'code-analyst', name: 'Code Analyst', emoji: '🔍', color: '#6366f1',
    desc: 'Scans architecture, directory structure, entry points, dependency chains, and risky code patterns.',
    capabilities: ['File system scan', 'Architecture mapping', 'Entry point detection', 'Dependency graph', 'Code metrics (LOC, complexity)'],
    outputs: ['File map', 'Language breakdown', 'Dependency risks', 'Project metadata'],
  },
  {
    id: 'security-agent', name: 'Security Agent', emoji: '🔒', color: '#3b82f6',
    desc: 'Runs 18 OWASP-aligned security rules against every source file. Detects injection, secrets, weak crypto, SSRF, path traversal, and more.',
    capabilities: ['SQL/OS injection detection', 'XSS pattern matching', 'Hardcoded secret scan', 'Weak crypto detection', 'SSRF/path traversal', 'Auth issue detection'],
    outputs: ['Security findings', 'OWASP mapping', 'Severity scores', 'Remediation suggestions'],
  },
  {
    id: 'test-agent', name: 'Test Agent', emoji: '🧪', color: '#22c55e',
    desc: 'Pairs source files with test files, estimates coverage, scores test quality, and auto-generates regression test templates.',
    capabilities: ['Source↔test file pairing', 'Coverage estimation', 'Test quality scoring', 'Assertion counting', 'Test framework detection'],
    outputs: ['Coverage estimate', 'Quality scores', 'Untested file list', 'Generated test templates'],
  },
  {
    id: 'debug-agent', name: 'Debug Agent', emoji: '🐛', color: '#f97316',
    desc: 'Performs root-cause analysis on critical findings, tracing the most dangerous code paths and failure patterns.',
    capabilities: ['Critical path analysis', 'Root-cause tracing', 'Failure pattern detection'],
    outputs: ['Root-cause annotations', 'Critical finding highlights'],
  },
  {
    id: 'review-agent', name: 'Review Agent', emoji: '👁️', color: '#8b5cf6',
    desc: 'Reviews proposed fix suggestions and generates code examples to prevent regressions when changes are applied.',
    capabilities: ['Fix validation', 'Code example generation', 'Regression prevention', 'AI-enhanced suggestions'],
    outputs: ['Fix suggestions', 'Code examples', 'AI annotations'],
  },
  {
    id: 'doc-agent', name: 'Documentation Agent', emoji: '📄', color: '#06b6d4',
    desc: 'Synthesizes all agent outputs into a structured Markdown and JSON engineering report with full metrics.',
    capabilities: ['Markdown report generation', 'JSON export', 'Score computation', 'Executive summary'],
    outputs: ['Markdown report', 'JSON report', 'Security score', 'Quality score'],
  },
]

export default function Agents() {
  const { results, status, session } = useAnalysis()
  const [expandedAgent, setExpandedAgent] = useState(null)

  if (!results && !session) return <EmptyState icon={Bot} message="Run analysis to see the 6 AI agents in action." />

  const logs = status?.agentLogs || session?.agentLogs || results?.agentLogs || []
  const currentAgent = session?.currentAgent
  const isComplete = session?.status === 'complete' || !!results

  function agentLogs(name) { return logs.filter(l => l.agent === name) }

  // Compute output counts from results
  function getAgentOutputs(agentId) {
    if (!results) return null
    switch (agentId) {
      case 'code-analyst':  return { Files: results.summary?.filesAnalyzed, 'Est. LOC': results.architecture?.metrics?.estimatedLinesOfCode?.toLocaleString() || '—' }
      case 'security-agent':return { Findings: results.security?.summary?.total, Critical: results.security?.summary?.bySeverity?.critical, High: results.security?.summary?.bySeverity?.high }
      case 'test-agent':    return { Coverage: `~${results.tests?.coverageEstimate}%`, 'Test Files': results.tests?.testFiles, 'Generated': results.generatedTests?.length }
      case 'debug-agent':   return { Critical: results.summary?.critical, Analyzed: results.summary?.critical }
      case 'review-agent':  return { Fixes: results.summary?.fixesGenerated }
      case 'doc-agent':     return { Reports: 2, 'Security Score': results.report?.securityScore, 'Quality Score': results.report?.qualityScore }
      default: return null
    }
  }

  const duration = session?.endTime && session?.startTime
    ? Math.round((session.endTime - session.startTime) / 1000)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Agent Activity</h1>
        <p className="page-subtitle">
          {AGENTS.length} autonomous agents · {logs.length} log entries
          {duration != null && ` · completed in ${duration}s`}
        </p>
      </div>

      {/* Pipeline grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AGENTS.map((agent, idx) => {
          const aLogs = agentLogs(agent.name)
          const isActive = !isComplete && agent.name === currentAgent
          const isDone = isComplete || aLogs.length > 0
          const state = isActive ? 'active' : isDone ? 'done' : 'idle'
          const isExpanded = expandedAgent === agent.id
          const outputs = getAgentOutputs(agent.id)

          return (
            <div key={agent.id} className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : isDone ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
                background: isActive ? 'rgba(99,102,241,0.06)' : 'var(--c-surface)'
              }}>
              {/* Header */}
              <button className="w-full flex items-start gap-3 p-4 text-left"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: agent.color + '18', border: `1px solid ${agent.color}28` }}>
                  {agent.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-slate-100">{agent.name}</span>
                    {isActive && <span className="badge-info text-[10px] animate-pulse">● Running</span>}
                    {!isActive && isDone && <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1"><CheckCircle size={10} /> Done</span>}
                    {!isActive && !isDone && <span className="text-[10px] text-slate-600 flex items-center gap-1"><Circle size={10} /> Waiting</span>}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{agent.desc}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                  {isExpanded ? <ChevronDown size={13} className="text-slate-600" /> : <ChevronRight size={13} className="text-slate-600" />}
                </div>
              </button>

              {/* Output stats */}
              {outputs && isDone && (
                <div className="flex gap-2 px-4 pb-3 flex-wrap">
                  {Object.entries(outputs).filter(([,v]) => v !== undefined && v !== null).map(([k, v]) => (
                    <div key={k} className="text-center px-3 py-1.5 rounded-lg"
                      style={{ background: agent.color + '12', border: `1px solid ${agent.color}20` }}>
                      <div className="text-[13px] font-bold" style={{ color: agent.color }}>{v}</div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-wide">{k}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {/* Capabilities */}
                  <div>
                    <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Capabilities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map(cap => (
                        <span key={cap} className="text-[11px] text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/8">{cap}</span>
                      ))}
                    </div>
                  </div>
                  {/* Outputs */}
                  <div>
                    <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Outputs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.outputs.map(out => (
                        <span key={out} className="text-[11px] px-2 py-1 rounded-lg" style={{ background: agent.color + '14', color: agent.color, border: `1px solid ${agent.color}25` }}>{out}</span>
                      ))}
                    </div>
                  </div>
                  {/* Agent logs */}
                  {aLogs.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Activity Log ({aLogs.length})</div>
                      <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
                        {aLogs.map((log, i) => (
                          <div key={i} className="text-[11px] text-slate-500 font-mono flex gap-2">
                            <span className="text-slate-700 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>→ {log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Full log terminal */}
      <div className="card">
        <div className="section-heading flex items-center gap-2">
          <Activity size={12} className="text-indigo-400" />
          Full Activity Log
          <span className="text-slate-600 font-normal">({logs.length} entries)</span>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: '#050709', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              {['#ef4444','#f59e0b','#22c55e'].map(c => (
                <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-600 ml-2 font-mono">devguardian — analysis log</span>
          </div>
          <div className="p-3 max-h-56 overflow-y-auto scrollbar-thin space-y-0.5 font-mono text-[11px]">
            {logs.length === 0 && <div className="text-slate-700">No logs yet</div>}
            {logs.map((log, i) => {
              const agentDef = AGENTS.find(a => a.name === log.agent)
              return (
                <div key={i} className={clsx('flex gap-2.5', log.level === 'error' ? 'text-red-400' : '')}>
                  <span className="text-slate-700 flex-shrink-0 tabular-nums w-16">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="flex-shrink-0 font-semibold w-32 truncate" style={{ color: agentDef?.color || '#64748b' }}>
                    [{log.agent}]
                  </span>
                  <span className="text-slate-400 flex-1">{log.message}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
