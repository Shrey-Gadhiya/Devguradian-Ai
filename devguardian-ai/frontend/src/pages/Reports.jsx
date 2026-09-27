import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import EmptyState from '../components/EmptyState';
import ScoreCard from '../components/ScoreCard';
import CopyButton from '../components/CopyButton';
import client from '../api/client';

export default function Reports() {
  const { results, session } = useAnalysis();
  const [tab, setTab] = useState('summary');
  const [downloading, setDownloading] = useState('');

  if (!results) return (
    <div className="page">
      <EmptyState icon="📊" title="No report available" message="Run an analysis to generate a report." />
    </div>
  );

  const { report, summary, architecture, security, quality, tests, dependencies } = results;
  const scores = report?.scores || {};
  // sessionId is stored on results as _sessionId or on session object
  const sessionId = results._sessionId || session?.sessionId;

  const downloadMarkdown = async () => {
    if (!sessionId) {
      // Fallback: generate from in-memory markdown
      const blob = new Blob([report?.markdown || '# No report'], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.md'; a.click();
      return;
    }
    setDownloading('md');
    try {
      const res = await client.get(`/reports/markdown/${sessionId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.md'; a.click();
    } catch {
      // Fallback to in-memory markdown
      const blob = new Blob([report?.markdown || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.md'; a.click();
    } finally { setDownloading(''); }
  };

  const downloadJson = async () => {
    setDownloading('json');
    try {
      const data = JSON.stringify(report?.json || results, null, 2);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'devguardian-report.json'; a.click();
    } catch {} finally { setDownloading(''); }
  };

  const TABS = [
    { id: 'summary', label: '📋 Summary' },
    { id: 'findings', label: '🔍 Findings' },
    { id: 'architecture', label: '🏗️ Architecture' },
    { id: 'markdown', label: '📝 Markdown' },
  ];

  // Group findings by category for report
  const findingsByCategory = {};
  for (const f of (results.findings || [])) {
    const cat = f.owasp || f.id?.split('-')[0] || 'Other';
    if (!findingsByCategory[cat]) findingsByCategory[cat] = [];
    findingsByCategory[cat].push(f);
  }

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Reports</h2>
        <div className="flex-row">
          <button className="btn btn-secondary btn-sm" onClick={downloadMarkdown} disabled={!!downloading}>
            {downloading === 'md' ? '⏳' : '⬇'} Markdown
          </button>
          <button className="btn btn-secondary btn-sm" onClick={downloadJson} disabled={!!downloading}>
            {downloading === 'json' ? '⏳' : '⬇'} JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-row mb-24" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0, gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id}
            className="btn btn-ghost"
            style={{
              borderRadius: '6px 6px 0 0', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent2)' : 'var(--text3)', fontWeight: tab === t.id ? 600 : 400,
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary tab */}
      {tab === 'summary' && (
        <div>
          {/* Score cards */}
          <div className="grid-4 mb-24">
            {[
              { label: 'Overall Health', value: scores.overall || 0, color: 'var(--accent)' },
              { label: 'Security',       value: scores.security || 0, color: 'var(--red)' },
              { label: 'Code Quality',   value: scores.quality  || 0, color: 'var(--yellow)' },
              { label: 'Test Coverage',  value: scores.tests    || 0, color: 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ '--accent-line': s.color, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                <ScoreCard label={s.label} score={s.value} color="auto" />
              </div>
            ))}
          </div>

          {/* Summary table */}
          <div className="grid-2 mb-24">
            <div className="card">
              <div className="section-title mb-12">Finding Summary</div>
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    { label: '🔴 Critical', value: summary?.critical || 0, color: 'var(--crit)' },
                    { label: '🟠 High',     value: summary?.high || 0,     color: 'var(--high)' },
                    { label: '🟡 Medium',   value: summary?.medium || 0,   color: 'var(--med)' },
                    { label: '🔵 Low',      value: summary?.low || 0,      color: 'var(--low)' },
                    { label: 'Total',       value: summary?.total || 0,    color: 'var(--text)' },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13 }}>{r.label}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: r.color, fontSize: 14 }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="section-title mb-12">Project Summary</div>
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    { label: 'Language',    value: architecture?.projectInfo?.primaryLanguage || '—' },
                    { label: 'Frameworks',  value: (architecture?.projectInfo?.frameworks || []).join(', ') || '—' },
                    { label: 'Total Files', value: architecture?.metrics?.totalFiles || 0 },
                    { label: 'Test Files',  value: tests?.summary?.testFiles || 0 },
                    { label: 'Packages',    value: dependencies?.summary?.total || 0 },
                    { label: 'Fixes Ready', value: (results.fixes || []).length },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13, color: 'var(--text3)' }}>{r.label}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontSize: 13, fontWeight: 500 }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Findings breakdown tab */}
      {tab === 'findings' && (
        <div>
          {Object.entries(findingsByCategory).map(([cat, items]) => (
            <div key={cat} className="card mb-16">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{cat}</span>
                <span className="chip">{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.slice(0, 5).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <span className={`badge ${f.severity}`} style={{ minWidth: 70 }}>{f.severity}</span>
                    <span style={{ color: 'var(--text2)', flex: 1 }}>{f.title}</span>
                    <span className="mono" style={{ color: 'var(--text3)' }}>{f.file}:{f.line}</span>
                  </div>
                ))}
                {items.length > 5 && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>+{items.length - 5} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Architecture tab */}
      {tab === 'architecture' && (
        <div>
          <div className="grid-2 mb-24">
            <div className="card">
              <div className="section-title mb-12">Project Info</div>
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    { label: 'Primary Language', value: architecture?.projectInfo?.primaryLanguage || '—' },
                    { label: 'Frameworks', value: (architecture?.projectInfo?.frameworks || []).join(', ') || 'None detected' },
                    { label: 'Package Managers', value: (architecture?.projectInfo?.packageManagers || []).join(', ') || 'None' },
                    { label: 'Test Frameworks', value: (architecture?.projectInfo?.testFrameworks || []).join(', ') || 'None' },
                    { label: 'Docker', value: architecture?.projectInfo?.hasDocker ? 'Yes' : 'No' },
                    { label: 'CI/CD', value: architecture?.projectInfo?.hasCI ? 'Yes' : 'No' },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13, color: 'var(--text3)' }}>{r.label}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontSize: 13 }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="section-title mb-12">File Metrics</div>
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    { label: 'Total Files',  value: architecture?.metrics?.totalFiles || 0 },
                    { label: 'Code Files',   value: architecture?.metrics?.codeFiles || 0 },
                    { label: 'Test Files',   value: architecture?.metrics?.testFiles || 0 },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13, color: 'var(--text3)' }}>{r.label}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontSize: 14, fontWeight: 700 }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>By Extension</div>
                {Object.entries(architecture?.metrics?.byExtension || {}).slice(0, 8).map(([ext, count]) => (
                  <div key={ext} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                    <span className="mono" style={{ color: 'var(--text3)' }}>{ext || 'no ext'}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Entry points */}
          {(architecture?.entryPoints || []).length > 0 && (
            <div className="card mb-24">
              <div className="section-title mb-12">Entry Points</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {architecture.entryPoints.map(ep => (
                  <span key={ep} className="chip" style={{ fontFamily: 'monospace' }}>{ep}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Markdown tab */}
      {tab === 'markdown' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8 }}>
            <CopyButton text={report?.markdown || ''} />
            <button className="btn btn-secondary btn-sm" onClick={downloadMarkdown}>⬇ Download</button>
          </div>
          <div className="code-block" style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 600, overflow: 'auto' }}>
            {report?.markdown || 'No report generated'}
          </div>
        </div>
      )}
    </div>
  );
}
