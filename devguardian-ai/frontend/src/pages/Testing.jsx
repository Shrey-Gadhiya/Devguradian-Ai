import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import EmptyState from '../components/EmptyState';
import FileIcon from '../components/FileIcon';
import DiffBlock from '../components/DiffBlock';
import SeverityBadge from '../components/SeverityBadge';

function CoverageGauge({ pct }) {
  const r = 56, cx = 70, cy = 70;
  const total = 2 * Math.PI * r;
  const dash = (pct / 100) * total;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface2)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${total - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text)" fontSize={22} fontWeight={700}>{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text3)" fontSize={11}>Coverage</text>
    </svg>
  );
}

export default function Testing() {
  const { results, session } = useAnalysis();
  const [expandedTest, setExpandedTest] = useState(null);
  const [showAllUntested, setShowAllUntested] = useState(false);
  const [selectedGenTest, setSelectedGenTest] = useState(null);

  if (!results) {
    if (session?.status === 'running') {
      return (
        <div className="page animate-fade">
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Testing</div>
          <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>⚙️ Analysis in progress…</div>
              <div style={{ color: 'var(--accent2)', fontWeight: 700 }}>{session.progress || 0}%</div>
            </div>
            <div className="progress-wrap" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${session.progress || 0}%` }} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="page">
        <EmptyState icon="🧪" title="No test data" message="Run an analysis to see test coverage and quality." />
      </div>
    );
  }

  const { tests, generatedTests } = results;
  const { summary = {}, testSummaries = [], untestedFiles = [] } = tests || {};
  const testFindings = results.findings?.filter(f => f.id?.startsWith('TEST')) || [];

  const displayedUntested = showAllUntested ? untestedFiles : untestedFiles.slice(0, 8);

  const qualityColors = { excellent: 'var(--green)', good: 'var(--accent2)', fair: 'var(--yellow)', poor: 'var(--orange)', none: 'var(--red)' };

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Testing</h2>
      </div>

      {/* Summary row */}
      <div className="grid-4 mb-24">
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CoverageGauge pct={summary.estimatedCoverage || 0} />
        </div>
        {[
          { label: 'Test Files',     value: summary.testFiles || 0,      icon: '📄', color: 'var(--accent)' },
          { label: 'Untested Files', value: summary.untestedFiles || 0,  icon: '⚠', color: 'var(--orange)' },
          { label: 'Tests Generated',value: (generatedTests || []).length, icon: '✨', color: 'var(--purple)' },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ '--accent-line': s.color }}>
            <div className="stat-label">{s.icon} {s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Test quality table */}
      {testSummaries.length > 0 && (
        <div className="card mb-24" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            Test File Quality
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Tests</th>
                  <th>Assertions</th>
                  <th>Avg/Test</th>
                  <th>Mocks</th>
                  <th>Async</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {testSummaries.map((ts, i) => (
                  <React.Fragment key={i}>
                    <tr className="expand-row" onClick={() => setExpandedTest(expandedTest === i ? null : i)}>
                      <td>
                        <div className="flex-row" style={{ gap: 6 }}>
                          <FileIcon ext={ts.file?.match(/\.[^.]+$/)?.[0] || '.js'} size={18} />
                          <span className="mono truncate" style={{ fontSize: 11, maxWidth: 200 }}>{ts.file}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{ts.tests}</span></td>
                      <td>{ts.expectations}</td>
                      <td>{ts.assertionsPerTest}</td>
                      <td>{ts.mocks}</td>
                      <td>{ts.hasAsync ? <span className="text-accent">✓</span> : <span className="text-muted">—</span>}</td>
                      <td>
                        <span style={{ color: qualityColors[ts.quality] || 'var(--text3)', fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>
                          {ts.quality || 'none'}
                        </span>
                      </td>
                    </tr>
                    {expandedTest === i && (
                      <tr className="expand-content">
                        <td colSpan={7}>
                          <div className="grid-3" style={{ gap: 12 }}>
                            {[
                              { label: 'describe blocks', value: ts.describes },
                              { label: 'beforeEach', value: ts.beforeEach },
                              { label: 'afterEach', value: ts.afterEach },
                            ].map(r => (
                              <div key={r.label} style={{ background: 'var(--surface)', borderRadius: 6, padding: '8px 12px' }}>
                                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.label}</div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>{r.value}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test findings */}
      {testFindings.length > 0 && (
        <div className="card mb-24" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            ⚠ Test Issues
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Severity</th><th>Rule</th><th>Title</th><th>File</th></tr>
              </thead>
              <tbody>
                {testFindings.map((f, i) => (
                  <tr key={i}>
                    <td><SeverityBadge severity={f.severity} /></td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{f.id}</span></td>
                    <td>{f.title}</td>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.file}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Untested files */}
      {untestedFiles.length > 0 && (
        <div className="card mb-24">
          <div className="section-header mb-12">
            <div className="section-title">⚠ Untested Files</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{untestedFiles.length} files</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {displayedUntested.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, padding: '5px 10px' }}>
                <FileIcon ext={f.ext} size={16} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.file}</span>
              </div>
            ))}
          </div>
          {untestedFiles.length > 8 && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAllUntested(!showAllUntested)}>
              {showAllUntested ? 'Show less' : `Show all ${untestedFiles.length}`}
            </button>
          )}
        </div>
      )}

      {/* Generated tests */}
      {(generatedTests || []).length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            ✨ Generated Regression Tests
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Source File</th><th>Test File</th><th>Language</th><th>Findings Covered</th><th></th></tr>
              </thead>
              <tbody>
                {generatedTests.map((gt, i) => (
                  <React.Fragment key={i}>
                    <tr className="expand-row" onClick={() => setSelectedGenTest(selectedGenTest === i ? null : i)}>
                      <td>
                        <div className="flex-row" style={{ gap: 6 }}>
                          <FileIcon ext={gt.file?.match(/\.[^.]+$/)?.[0] || '.js'} size={18} />
                          <span className="mono" style={{ fontSize: 11 }}>{gt.file}</span>
                        </div>
                      </td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--accent2)' }}>{gt.testFile}</span></td>
                      <td>{gt.language || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(gt.findingsCovered || []).map(id => <span key={id} className="chip" style={{ fontSize: 10 }}>{id}</span>)}
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--text3)', fontSize: 14 }}>{selectedGenTest === i ? '▲' : '▼'}</span></td>
                    </tr>
                    {selectedGenTest === i && (
                      <tr className="expand-content">
                        <td colSpan={5}>
                          <DiffBlock after={gt.code} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
