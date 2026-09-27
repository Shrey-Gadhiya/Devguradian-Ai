import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import SeverityBadge from '../components/SeverityBadge';
import DiffBlock from '../components/DiffBlock';
import DetailDrawer from '../components/DetailDrawer';
import EmptyState from '../components/EmptyState';
import FileIcon from '../components/FileIcon';
import CopyButton from '../components/CopyButton';

const EFFORT_COLORS = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--yellow)', trivial: 'var(--green)' };
const CATEGORY_ICONS = { SEC: '🔒', QA: '✏️', DEP: '📦', TEST: '🧪' };

export default function Fixes() {
  const { results } = useAnalysis();
  const [selected, setSelected] = useState(null);
  const [filterCat, setFilterCat] = useState('all');

  if (!results) return (
    <div className="page">
      <EmptyState icon="🔧" title="No fixes generated" message="Run an analysis to generate fix suggestions." />
    </div>
  );

  const fixes = results.fixes || [];

  // Group by category
  const byCategory = {};
  for (const fix of fixes) {
    const cat = fix.findingId?.split('-')[0] || 'OTHER';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(fix);
  }

  const categories = Object.keys(byCategory);
  const filtered = filterCat === 'all' ? fixes : (byCategory[filterCat] || []);

  const effortCounts = fixes.reduce((a, f) => { a[f.effort] = (a[f.effort] || 0) + 1; return a; }, {});
  const criticalFixes = fixes.filter(f => f.severity === 'critical');

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Fixes</h2>
        <div className="flex-row">
          <span className="badge critical">{criticalFixes.length} critical</span>
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>{fixes.length} total</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Total Fixes',     value: fixes.length,                     color: 'var(--accent)', acc: '--accent' },
          { label: 'Critical',        value: criticalFixes.length,              color: 'var(--crit)',  acc: '--crit' },
          { label: 'High Effort',     value: effortCounts.high || 0,            color: 'var(--orange)', acc: '--high' },
          { label: 'Quick Wins (Low)',value: (effortCounts.low || 0) + (effortCounts.trivial || 0), color: 'var(--green)', acc: '--low' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-line': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex-row mb-16" style={{ flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filterCat === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterCat('all')}>
          All ({fixes.length})
        </button>
        {categories.map(cat => (
          <button key={cat} className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterCat(cat)}>
            {CATEGORY_ICONS[cat] || '📌'} {cat} ({byCategory[cat].length})
          </button>
        ))}
      </div>

      {/* Fixes list */}
      {(filterCat === 'all' ? categories : [filterCat]).map(cat => (
        <div key={cat} className="card mb-16" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat] || '📌'}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {cat === 'SEC' ? 'Security Fixes' : cat === 'QA' ? 'Code Quality Fixes' : cat === 'DEP' ? 'Dependency Updates' : cat === 'TEST' ? 'Test Coverage' : cat}
            </span>
            <span className="chip">{(byCategory[cat] || []).length}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Title</th>
                  <th>File</th>
                  <th>Effort</th>
                  <th>Fix</th>
                </tr>
              </thead>
              <tbody>
                {(byCategory[cat] || []).map((fix, i) => (
                  <tr key={i} className="clickable" onClick={() => setSelected(fix)}>
                    <td><SeverityBadge severity={fix.severity} /></td>
                    <td style={{ fontWeight: 500, maxWidth: 220 }}>{fix.title}</td>
                    <td>
                      <div className="flex-row" style={{ gap: 6 }}>
                        <FileIcon ext={fix.file?.match(/\.[^.]+$/)?.[0] || '.js'} size={18} />
                        <span className="mono truncate" style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 180 }}>{fix.file}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: EFFORT_COLORS[fix.effort] || 'var(--text3)', fontSize: 12, fontWeight: 600 }}>
                        {fix.effort || '—'}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text2)' }}>{fix.suggestion?.slice(0, 60)}…</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          title={selected.title}
          subtitle={`${selected.file}:${selected.line}`}
          badge={<SeverityBadge severity={selected.severity} />}
          onClose={() => setSelected(null)}
        >
          <div className="drawer-section">
            <div className="drawer-section-title">Description</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.description}</div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Remediation Suggestion</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', background: 'var(--surface2)', borderRadius: 6, padding: '10px 12px', border: '1px solid var(--border2)' }}>
              {selected.suggestion}
            </div>
          </div>

          {selected.aiSuggestion && (
            <div className="drawer-section">
              <div className="drawer-section-title">🤖 AI Suggestion</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', background: 'rgba(139,92,246,.05)', borderRadius: 6, padding: '10px 12px', border: '1px solid rgba(139,92,246,.2)' }}>
                {selected.aiSuggestion}
              </div>
            </div>
          )}

          {(selected.codeBefore || selected.codeAfter) && (
            <div className="drawer-section">
              <div className="drawer-section-title flex-between">
                <span>Code Diff</span>
                {selected.codeAfter && <CopyButton text={selected.codeAfter} />}
              </div>
              <DiffBlock before={selected.codeBefore} after={selected.codeAfter} />
            </div>
          )}

          <div className="drawer-section">
            <div className="drawer-section-title">Details</div>
            <div className="grid-2" style={{ gap: 8 }}>
              {[
                { label: 'Finding ID', value: selected.findingId },
                { label: 'Effort',     value: selected.effort },
                { label: 'Severity',   value: selected.severity },
                { label: 'Line',       value: selected.line },
              ].map(r => (
                <div key={r.label} style={{ background: 'var(--surface)', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'capitalize' }}>{r.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(59,130,246,.06)', borderRadius: 6, border: '1px solid rgba(59,130,246,.15)', fontSize: 12, color: 'var(--text3)' }}>
            🔒 Safety: Fixes are suggestions only. No file has been modified. Apply changes manually after review.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
