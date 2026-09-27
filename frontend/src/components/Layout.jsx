import { NavLink, useLocation } from 'react-router-dom'
import { Shield, Home, GitBranch, AlertTriangle, Lock, TestTube, Bot, Wrench, CheckCircle, FileText, ChevronRight, Activity } from 'lucide-react'
import { useAnalysis } from '../context/AnalysisContext'
import clsx from 'clsx'

const NAV = [
  { to: '/overview',    label: 'Overview',    icon: Home,          group: 'main' },
  { to: '/repository',  label: 'Repository',  icon: GitBranch,     group: 'main' },
  { to: '/findings',    label: 'Findings',    icon: AlertTriangle, group: 'analysis' },
  { to: '/security',    label: 'Security',    icon: Lock,          group: 'analysis' },
  { to: '/testing',     label: 'Testing',     icon: TestTube,      group: 'analysis' },
  { to: '/agents',      label: 'Agents',      icon: Bot,           group: 'workflow' },
  { to: '/fixes',       label: 'Fixes',       icon: Wrench,        group: 'workflow' },
  { to: '/validation',  label: 'Validation',  icon: CheckCircle,   group: 'workflow' },
  { to: '/reports',     label: 'Reports',     icon: FileText,      group: 'output' },
]

const GROUPS = [
  { id: 'main',     label: null },
  { id: 'analysis', label: 'Analysis' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'output',   label: 'Output' },
]

function StatusDot({ status }) {
  if (!status) return null
  const map = {
    scanning:     'bg-indigo-400 shadow-[0_0_6px_2px_rgba(99,102,241,0.5)]',
    initializing: 'bg-indigo-400 shadow-[0_0_6px_2px_rgba(99,102,241,0.5)]',
    complete:     'bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]',
    error:        'bg-red-400 shadow-[0_0_6px_2px_rgba(248,113,113,0.5)]',
  }
  const cls = map[status] || 'bg-slate-500'
  const pulse = status === 'scanning' || status === 'initializing'
  return (
    <span className={clsx('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', cls, pulse && 'animate-pulse')} />
  )
}

export default function Layout({ children }) {
  const { results, session } = useAnalysis()
  const location = useLocation()

  const isAnalyzing = session && session.status !== 'complete' && session.status !== 'error'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0b0d1a 0%, #080a14 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)'
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-[18px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
            <Shield size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-slate-100 leading-none tracking-tight">DevGuardian</div>
            <div className="text-[10px] text-indigo-400 font-medium mt-0.5 leading-none">AI Platform</div>
          </div>
        </div>

        {/* Analysis status strip */}
        {session && (
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.04)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <StatusDot status={session.status} />
                <span className="text-[11px] text-slate-400 capitalize font-medium">{session.status || 'idle'}</span>
              </div>
              {session.progress > 0 && (
                <span className="text-[10px] text-slate-500 tabular-nums">{session.progress}%</span>
              )}
            </div>
            {isAnalyzing && (
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${session.progress || 0}%`,
                    background: 'linear-gradient(90deg,#6366f1,#38bdf8)'
                  }}
                />
              </div>
            )}
            {session.currentAgent && isAnalyzing && (
              <div className="flex items-center gap-1 mt-1.5">
                <Activity size={9} className="text-indigo-400" />
                <span className="text-[10px] text-slate-500 truncate">{session.currentAgent}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
          {GROUPS.map(group => {
            const items = NAV.filter(n => n.group === group.id)
            return (
              <div key={group.id}>
                {group.label && (
                  <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(148,163,184,0.4)' }}>
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => clsx(
                        'flex items-center gap-2.5 px-3 py-[7px] rounded-[10px] text-[13px] font-medium transition-all duration-150 group relative',
                        isActive
                          ? 'text-slate-100'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                      style={({ isActive }) => isActive ? {
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.12) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)'
                      } : {}}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'} />
                          <span className="flex-1">{label}</span>
                          {isActive && <ChevronRight size={11} className="text-indigo-500 opacity-60" />}
                          {to === '/findings' && results && results.summary.critical > 0 && (
                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                              {results.summary.critical}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Scan summary footer */}
        {results && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'rgba(148,163,184,0.4)' }}>Last Scan</div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { val: results.summary.critical, label: 'C', color: '#f87171' },
                { val: results.summary.high, label: 'H', color: '#fb923c' },
                { val: results.summary.medium, label: 'M', color: '#facc15' },
                { val: results.summary.low, label: 'L', color: '#4ade80' },
              ].map(({ val, label, color }) => (
                <div key={label} className="rounded-lg py-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-[13px] font-bold tabular-nums" style={{ color }}>{val}</div>
                  <div className="text-[9px] font-semibold" style={{ color: 'rgba(100,116,139,0.8)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-[1100px] mx-auto px-8 py-7 anim-fade-in" key={location.pathname}>
          {children}
        </div>
      </main>

    </div>
  )
}
