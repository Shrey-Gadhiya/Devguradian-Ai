import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import client from '../api/client';

const MODES = [
  {
    id: 'demo',
    icon: '🎯',
    label: 'Demo Repo',
    desc: 'Intentionally vulnerable Express app — 15+ security issues built in',
  },
  {
    id: 'path',
    icon: '📂',
    label: 'Local Path',
    desc: 'Analyze a repository already on your filesystem',
  },
  {
    id: 'upload',
    icon: '📦',
    label: 'Upload ZIP',
    desc: 'Upload a .zip archive of your repository',
  },
  {
    id: 'git',
    icon: '🔗',
    label: 'Git URL',
    desc: 'Clone from GitHub, GitLab, or Bitbucket',
  },
];

const DEMO_VULNS = [
  { cat: 'Injection',         items: ['SQL injection', 'Command injection', 'eval() injection'] },
  { cat: 'Auth Failures',     items: ['Weak JWT secret', 'MD5 password hashing', 'Plain-text storage'] },
  { cat: 'Secrets',           items: ['Hardcoded DB password', 'Math.random() tokens'] },
  { cat: 'Access Control',    items: ['Path traversal', 'Open redirect', 'Wildcard CORS'] },
  { cat: 'SSRF',              items: ['User-controlled HTTP fetch'] },
  { cat: 'Dependencies',      items: ['lodash@4.17.20', 'jsonwebtoken@8.5.1', 'minimist@1.2.5'] },
];

export default function Repository() {
  const { repo, setRepo, startAnalysis, session, results, reset } = useAnalysis();
  const navigate = useNavigate();
  const [mode, setMode] = useState('demo');
  const [localPath, setLocalPath] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const isRunning = session?.status === 'running';

  const handleLoad = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      let repoData;
      if (mode === 'demo') {
        const res = await client.get('/repository/demo');
        repoData = res.data;
      } else if (mode === 'path') {
        if (!localPath.trim()) throw new Error('Please enter a path');
        const res = await client.post('/repository/path', { repoPath: localPath.trim() });
        repoData = res.data;
      } else if (mode === 'git') {
        if (!gitUrl.trim()) throw new Error('Please enter a Git URL');
        const res = await client.post('/repository/clone', { url: gitUrl.trim() });
        repoData = res.data;
      } else if (mode === 'upload') {
        if (!file) throw new Error('Please select a ZIP file');
        const fd = new FormData();
        fd.append('file', file);
        const res = await client.post('/repository/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        repoData = res.data;
      }
      setRepo(repoData);
    } catch (e) {
      // Show a clean error — strip verbose git error prefixes
      let msg = e.message || 'Failed to load repository';
      if (msg.includes('Failed to clone')) msg = 'Clone failed — check the URL is public and accessible.';
      if (msg.includes('Path does not exist')) msg = 'Path not found — enter an absolute path to an existing directory.';
      if (msg.includes('Network Error') || msg.includes('ECONNREFUSED'))
        msg = 'Cannot reach backend — make sure the server is running on port 4000.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!repo?.path) return;
    await startAnalysis(repo.path);
    navigate('/');
  };

  const handleReset = () => {
    reset();
    setLoadError(null);
    setFile(null);
    setGitUrl('');
    setLocalPath('');
  };

  return (
    <div className="page animate-fade">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Repository</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Select a source to begin analysis</div>
      </div>

      {/* Source type selector */}
      <div className="card mb-20" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          SOURCE TYPE
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setLoadError(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                border: mode === m.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: mode === m.id ? 'rgba(59,130,246,.1)' : 'var(--surface2)',
                color: mode === m.id ? 'var(--accent2)' : 'var(--text2)',
                fontSize: 13, fontWeight: mode === m.id ? 600 : 400,
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
          {MODES.find(m => m.id === mode)?.desc}
        </div>
      </div>

      {/* Input card */}
      <div className="card mb-20">
        {mode === 'demo' && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎯</span> demo-vulnerable-app
              <span className="badge high" style={{ fontSize: 11 }}>15+ vulns</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {DEMO_VULNS.map(g => (
                <div key={g.cat} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', marginBottom: 6 }}>{g.cat}</div>
                  {g.items.map(item => (
                    <div key={item} style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>• {item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'path' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>
              Enter the absolute path to your repository directory
            </div>
            <input
              value={localPath}
              onChange={e => setLocalPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
              placeholder="/absolute/path/to/your/repo"
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                color: 'var(--text)', borderRadius: 8, padding: '10px 14px',
                fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        )}

        {mode === 'git' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>
              Clone from GitHub, GitLab, or Bitbucket (public repositories only)
            </div>
            <input
              value={gitUrl}
              onChange={e => setGitUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoad()}
              placeholder="https://github.com/user/repository.git"
              style={{
                width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                color: 'var(--text)', borderRadius: 8, padding: '10px 14px',
                fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
              ⚠ Only public repositories supported. Cloning may take 30–60 seconds.
            </div>
          </div>
        )}

        {mode === 'upload' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10 }}>
              Upload a ZIP archive of your repository
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              padding: '20px', borderRadius: 8, border: '2px dashed var(--border2)',
              background: 'var(--surface2)', color: 'var(--text3)', fontSize: 13,
              transition: 'border-color .15s',
            }}>
              <span style={{ fontSize: 24 }}>📦</span>
              <div>
                <div style={{ color: 'var(--text2)', fontWeight: 500 }}>
                  {file ? file.name : 'Click to select .zip file'}
                </div>
                {file && <div style={{ fontSize: 11, marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB</div>}
              </div>
              <input type="file" accept=".zip" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>
        )}

        {/* Error */}
        {loadError && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 8,
            background: 'var(--crit-bg)', border: '1px solid var(--crit-border)',
            color: 'var(--red2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>⊘</span> {loadError}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={loading}
            style={{ minWidth: 160 }}
          >
            {loading ? (
              <><span className="animate-pulse">⏳</span> Loading…</>
            ) : (
              <><span>🔀</span> Load Repository</>
            )}
          </button>
          {(repo || loadError) && (
            <button className="btn btn-ghost" onClick={handleReset}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Loaded repo — start analysis */}
      {repo && (
        <div className="card mb-20" style={{ border: '1px solid var(--border2)', borderTop: '2px solid var(--green)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>📁</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{repo.name}</span>
                <span className="badge safe">{repo.type}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Type', value: repo.type },
                  { label: 'Repo ID', value: repo.repoId },
                  { label: 'Path', value: repo.path, mono: true, span: true },
                ].map(r => (
                  <div key={r.label} style={{ gridColumn: r.span ? 'span 2' : 'auto' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 12, fontFamily: r.mono ? 'monospace' : 'inherit', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.value}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={isRunning}
                  style={{ minWidth: 160 }}
                >
                  {isRunning
                    ? <><span className="animate-pulse">⏳</span> Running… {session?.progress || 0}%</>
                    : <><span>🚀</span> Start Analysis</>
                  }
                </button>
                {results && (
                  <span className="badge safe">✓ Results available — <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}
                  >view</button></span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-progress indicator (shown when navigating away and back) */}
      {isRunning && !repo && (
        <div className="card mb-20">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="animate-pulse" style={{ fontSize: 20 }}>⚙️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Analysis in progress — {session.progress || 0}%</div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: `${session.progress || 0}%` }} />
              </div>
              {session.currentAgent && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Agent: <span style={{ color: 'var(--accent2)' }}>{session.currentAgent}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety notice */}
      <div style={{
        padding: '12px 16px', borderRadius: 8,
        background: 'rgba(59,130,246,.04)', border: '1px solid rgba(59,130,246,.15)',
        fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <div>
          <strong style={{ color: 'var(--text2)' }}>Safety guarantee:</strong>{' '}
          DevGuardian AI never modifies files, deletes data, or executes destructive commands.
          All fixes require explicit human approval before application.
        </div>
      </div>
    </div>
  );
}
