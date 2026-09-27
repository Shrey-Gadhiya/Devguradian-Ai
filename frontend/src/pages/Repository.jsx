import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import { GitBranch, FolderOpen, Link2, Play, RefreshCw, AlertCircle, CheckCircle2, Package, Code2, FlaskConical, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const MODES = [
  { id: 'demo',   label: 'Demo Repo',  icon: GitBranch,  desc: 'Built-in vulnerable app — fastest way to try DevGuardian' },
  { id: 'path',   label: 'Local Path', icon: FolderOpen, desc: 'Analyze a project folder on this machine (dev only)' },
  { id: 'clone',  label: 'Git URL',    icon: Link2,      desc: 'Clone from GitHub, GitLab, or Bitbucket' },
  { id: 'upload', label: 'Upload ZIP', icon: Package,    desc: 'Upload a .zip archive of any project — no Git required' },
]

export default function Repository() {
  const { repo, loading, error, loadDemo, loadPath, cloneRepo, uploadRepo, startAnalysis, reset } = useAnalysis()
  const [mode, setMode] = useState('demo')
  const [input, setInput] = useState('')
  const [localError, setLocalError] = useState(null)
  const fileRef = useRef(null)   // holds the actual File object for upload mode
  const navigate = useNavigate()

  async function handleLoad() {
    setLocalError(null)
    try {
      if (mode === 'demo')        await loadDemo()
      else if (mode === 'path')   await loadPath(input)
      else if (mode === 'clone')  await cloneRepo(input)
      else if (mode === 'upload') {
        if (!fileRef.current) { setLocalError('Please select a .zip file first.'); return }
        await uploadRepo(fileRef.current)
      }
    } catch (e) { setLocalError(e.message) }
  }

  const isGitError = (localError || error || '').toLowerCase().includes('git is not installed') ||
                     (localError || error || '').toLowerCase().includes('spawn git')

  async function handleStart() {
    if (!repo) return
    try { await startAnalysis(repo.repoId); navigate('/overview') }
    catch (e) { setLocalError(e.message) }
  }

  const displayErr = localError || error

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Repository</h1>
        <p className="page-subtitle">Select a source to begin analysis</p>
      </div>

      {/* Source picker */}
      <div className="card space-y-5">
        <div className="section-heading" style={{ marginBottom: 0 }}>Source type</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setMode(id); setInput(''); setLocalError(null); fileRef.current = null }}
              className={clsx(
                'flex flex-col items-start gap-1.5 p-3 rounded-xl text-left border transition-all duration-150',
                mode === id
                  ? 'border-indigo-500/50 text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/10'
              )}
              style={mode === id ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(59,130,246,0.08))' } : { background: 'rgba(255,255,255,0.03)' }}
            >
              <Icon size={14} className={mode === id ? 'text-indigo-400' : 'text-slate-600'} />
              <span className="text-[12px] font-semibold">{label}</span>
            </button>
          ))}
        </div>

        {/* Context panel */}
        <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[12px] text-slate-400 leading-relaxed">{MODES.find(m => m.id === mode)?.desc}</p>
        </div>

        {(mode === 'path' || mode === 'clone') && (
          <input
            className="input"
            placeholder={mode === 'path' ? '/absolute/path/to/project' : 'https://github.com/owner/repository'}
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        )}

        {mode === 'upload' && (
          <label className="flex flex-col items-center gap-2 p-6 rounded-xl cursor-pointer transition-colors"
            style={{ border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f && f.name.endsWith('.zip')) { fileRef.current = f; setInput(f.name) }
              else setLocalError('Only .zip files are supported.')
            }}>
            <Package size={22} className="text-slate-600" />
            <span className="text-[13px] text-slate-400">Drop a <code className="font-mono text-slate-300">.zip</code> here or click to browse</span>
            <input type="file" accept=".zip" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { fileRef.current = f; setInput(f.name) } }} />
            {input && <span className="text-[12px] text-emerald-400 font-mono">{input}</span>}
          </label>
        )}

        {displayErr && (
          <div className="rounded-xl p-3 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-start gap-2.5 text-red-300">
              <AlertCircle size={14} className="flex-shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{displayErr}</span>
            </div>
            {isGitError && (
              <button
                onClick={() => { setMode('upload'); setLocalError(null); fileRef.current = null; setInput('') }}
                className="mt-2.5 ml-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                <Package size={11} /> Switch to Upload ZIP instead →
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            disabled={loading || (mode !== 'demo' && mode !== 'upload' && !input.trim()) || (mode === 'upload' && !fileRef.current && !loading)}
            className="btn-primary"
          >
            {loading
              ? <><RefreshCw size={13} className="animate-spin" /> Loading…</>
              : <><GitBranch size={13} /> Load Repository</>
            }
          </button>
          {repo && (
            <button onClick={reset} className="btn-ghost">
              <RefreshCw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Loaded repo panel */}
      {repo && (
        <div className="card space-y-5 anim-fade-in">
          {/* Repo identity */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(59,130,246,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Code2 size={16} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-100">{repo.name}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{repo.files} files detected</div>
              </div>
            </div>
            <span className="badge-info">{repo.projectInfo?.primaryLanguage || 'Unknown'}</span>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Package, label: 'Package Manager', val: repo.projectInfo?.packageManagers?.join(', ') || '—' },
              { icon: Code2,   label: 'Frameworks',      val: repo.projectInfo?.frameworks?.join(', ') || '—' },
              { icon: FlaskConical, label: 'Test Frameworks', val: repo.projectInfo?.testFrameworks?.join(', ') || (repo.projectInfo?.hasTests ? 'Detected' : 'None found') },
              { icon: GitBranch, label: 'Files',         val: repo.files },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={11} className="text-slate-600" />
                  <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">{label}</span>
                </div>
                <div className="text-[13px] text-slate-300 font-medium truncate">{val}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 text-[14px]"
          >
            {loading
              ? <><RefreshCw size={14} className="animate-spin" /> Starting…</>
              : <><Play size={14} /> Start Analysis <ChevronRight size={13} className="ml-1 opacity-60" /></>
            }
          </button>
        </div>
      )}
    </div>
  )
}
