import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import SeverityBadge from '../components/SeverityBadge';
import DetailDrawer from '../components/DetailDrawer';
import EmptyState from '../components/EmptyState';
import FileIcon from '../components/FileIcon';
import DiffBlock from '../components/DiffBlock';
import CopyButton from '../components/CopyButton';
import { useNavigate } from 'react-router-dom';

const OWASP_LINKS = {
  'A01': 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
  'A02': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  'A03': 'https://owasp.org/Top10/A03_2021-Injection/',
  'A05': 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
  'A07': 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
  'A10': 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery/',
};

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function Findings() {
  const { results, session } = useAnalysis();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filterSev, setFilterSev] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  if (!results) {
    const isRunning = session?.status === 'running';
    if (isRunning) return (
      <div className="page animate-fade">
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Findings</div>
        <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>⚙️ Analysis in progress…</div>
            <div style={{ color: 'var(--accent2)', fontWeight: 700 }}>{session.progress || 0}%</div>
          </div>
          <div className="progress-wrap" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${session.progress || 0}%` }} />
          </div>
          {session.currentAgent && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
              Active: <span style={{ color: 'var(--accent2)' }}>{session.currentAgent}</span>
            </div>
          )}
        </div>
      </div>
    );
    return (
      <div className="page">
        <EmptyState icon="🔍" title="No findings yet"
          message="Run an analysis to see findings."
          action={<button className="btn btn-primary" onClick={() => navigate('/repository')}>Start Analysis</button>}
        />
      </div>
    );
  }

  const allFindings = results.findings || [];

  // Unique rule types
  const ruleTypes = [...new Set(allFindings.map(f => f.id?.split('-')[0] || 'OTHER'))];

  const filtered = allFindings
    .filter(f => filterSev === 'all' || f.severity === filterSev)
    .filter(f => filterType === 'all' || f.id?.startsWith(filterType))
    .filter(f => !search || f.title?.toLowerCase().includes(search.toLowerCase()) || f.file?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4));

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of allFindings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  // Get corresponding fix for selected finding
  const getFixForFinding = (f) => (results.fixes || []).find(fx => fx.findingId === f.id && fx.file === f.file);

  return (
    <div className="page animate-fade">
      <div className="section-header mb-16">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Findings</h2>
        <span style={{ color: 'var(--text3)', fontSize: 13 }}>{filtered.length} of {allFindings.length} shown</span>
      </div>

      {/* Severity summary */}
      <div className="grid-4 mb-24">
        {['critical', 'high', 'medium', 'low'].map(s => {
          const colors = { critical: 'crit', high: 'high', medium: 'med', low: 'low' };
          const c = colors[s];
          return (
            <div key={s} className="stat-card"
              style={{ '--accent-line': `var(--${c})`, cursor: 'pointer', background: filterSev === s ? `var(--${c}-bg)` : 'var(--surface)' }}
              onClick={() => setFilterSev(filterSev === s ? 'all' : s)}
            >
              <div className="stat-label">{s}</div>
              <div className="stat-value" style={{ color: `var(--${c})` }}>{counts[s] || 0}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex-row mb-16" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input
          placeholder="Search findings…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 12px', fontSize: 13, width: 220 }}
        />
        <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}>
          <option value="all">All Types</option>
          {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(filterSev !== 'all' || filterType !== 'all' || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterSev('all'); setFilterType('all'); setSearch(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Findings table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>ID</th>
                <th>Title</th>
                <th>File</th>
                <th>Line</th>
                <th>OWASP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No findings match filters</td></tr>
              ) : filtered.map((f, i) => (
                <tr key={i} className="clickable" onClick={() => setSelected(f)}>
                  <td><SeverityBadge severity={f.severity} /></td>
                  <td><span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.id}</span></td>
                  <td style={{ fontWeight: 500, maxWidth: 280 }}>{f.title}</td>
                  <td>
                    <div className="flex-row" style={{ gap: 6 }}>
                      <FileIcon ext={f.file?.match(/\.[^.]+$/)?.[0] || '.js'} size={18} />
                      <span className="mono truncate" style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 180 }}>{f.file}</span>
                    </div>
                  </td>
                  <td><span className="mono" style={{ fontSize: 11 }}>{f.line || '—'}</span></td>
                  <td>
                    {f.category ? (
                      <a href={OWASP_LINKS[f.category]} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent2)', fontSize: 11, textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}>
                        {f.category}
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (() => {
        const fix = getFixForFinding(selected);
        return (
          <DetailDrawer
            title={selected.title}
            subtitle={`${selected.file}:${selected.line}`}
            badge={<SeverityBadge severity={selected.severity} />}
            onClose={() => setSelected(null)}
          >
            <div className="drawer-section">
              <div className="drawer-section-title">Description</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.message}</div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">Evidence</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div className="code-block" style={{ flex: 1, fontSize: 12 }}>{selected.evidence || '—'}</div>
                {selected.evidence && <CopyButton text={selected.evidence} />}
              </div>
            </div>

            {selected.owasp && (
              <div className="drawer-section">
                <div className="drawer-section-title">OWASP Classification</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="chip">{selected.category}</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.owasp}</span>
                  {OWASP_LINKS[selected.category] && (
                    <a href={OWASP_LINKS[selected.category]} target="_blank" rel="noreferrer"
                      className="btn btn-ghost btn-sm">
                      OWASP Docs →
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="drawer-section">
              <div className="drawer-section-title">Remediation</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>{selected.fix}</div>
            </div>

            {(fix?.codeBefore || fix?.codeAfter) && (
              <div className="drawer-section">
                <div className="drawer-section-title">Code Fix</div>
                <DiffBlock before={fix.codeBefore} after={fix.codeAfter} />
              </div>
            )}

            <div className="drawer-section">
              <div className="drawer-section-title">Metadata</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Rule ID', value: selected.id },
                  { label: 'Severity', value: selected.severity },
                  { label: 'File', value: selected.file },
                  { label: 'Line', value: selected.line },
                ].map(r => (
                  <div key={r.label} style={{ background: 'var(--surface)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{r.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </DetailDrawer>
        );
      })()}
    </div>
  );
}
