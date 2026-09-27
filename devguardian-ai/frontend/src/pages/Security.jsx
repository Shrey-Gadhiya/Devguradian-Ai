import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import SeverityBadge from '../components/SeverityBadge';
import DetailDrawer from '../components/DetailDrawer';
import EmptyState from '../components/EmptyState';
import FileIcon from '../components/FileIcon';
import DiffBlock from '../components/DiffBlock';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6' };
const OWASP_LINKS = {
  'A01': 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
  'A02': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  'A03': 'https://owasp.org/Top10/A03_2021-Injection/',
  'A05': 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
  'A07': 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
  'A10': 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery/',
};

function RunningCard({ session, title }) {
  return (
    <div className="page animate-fade">
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>{title}</div>
      <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>⚙️ Analysis in progress…</div>
          <div style={{ color: 'var(--accent2)', fontWeight: 700 }}>{session?.progress || 0}%</div>
        </div>
        <div className="progress-wrap" style={{ height: 6 }}>
          <div className="progress-fill" style={{ width: `${session?.progress || 0}%` }} />
        </div>
        {session?.currentAgent && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
            Active: <span style={{ color: 'var(--accent2)' }}>{session.currentAgent}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Security() {
  const { results, session } = useAnalysis();
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState({});

  if (!results) {
    if (session?.status === 'running') return <RunningCard session={session} title="Security" />;
    return (
      <div className="page">
        <EmptyState icon="🔒" title="No security data" message="Run an analysis to see security findings." />
      </div>
    );
  }

  const secFindings = results.security?.findings || [];
  const depFindings = results.dependencies?.findings || [];
  const allSec = [...secFindings, ...depFindings];

  // Counts
  const bySeverity = allSec.reduce((a, f) => { a[f.severity] = (a[f.severity] || 0) + 1; return a; }, {});
  const pieData = Object.entries(bySeverity).map(([name, value]) => ({ name, value }));

  // By OWASP category
  const byCategory = {};
  for (const f of secFindings) {
    const cat = f.owasp || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }

  // OWASP top-10 bar chart data
  const owaspData = Object.entries(byCategory).map(([name, items]) => ({
    name: name.length > 30 ? name.slice(0, 28) + '…' : name,
    count: items.length,
    critical: items.filter(f => f.severity === 'critical').length,
    high: items.filter(f => f.severity === 'high').length,
  }));

  const getFixForFinding = (f) => (results.fixes || []).find(fx => fx.findingId === f.id && fx.file === f.file);

  const toggleExpand = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Security</h2>
        <div className="flex-row">
          <SeverityBadge severity="critical" /><span style={{ fontSize: 13, color: 'var(--text3)' }}>{bySeverity.critical || 0}</span>
          <SeverityBadge severity="high" /><span style={{ fontSize: 13, color: 'var(--text3)' }}>{bySeverity.high || 0}</span>
        </div>
      </div>

      {/* Chart row */}
      <div className="grid-3 mb-24">
        {/* Pie */}
        <div className="card">
          <div className="section-title mb-8">By Severity</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || '#64748b'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[d.name] || '#64748b' }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="section-title mb-8">By OWASP Category</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={owaspData} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 9 }} width={160} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="critical" fill={COLORS.critical} stackId="a" />
              <Bar dataKey="high" fill={COLORS.high} stackId="a" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings by OWASP category */}
      {Object.entries(byCategory).map(([cat, items]) => (
        <div className="card mb-16" key={cat} style={{ padding: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer' }}
            onClick={() => toggleExpand(cat)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{cat}</span>
              <span className="chip">{items.length} findings</span>
              {items.some(f => f.severity === 'critical') && <span className="badge critical">critical</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {OWASP_LINKS[items[0]?.category] && (
                <a href={OWASP_LINKS[items[0].category]} target="_blank" rel="noreferrer"
                  className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>
                  OWASP →
                </a>
              )}
              <span style={{ color: 'var(--text3)', fontSize: 18 }}>{expanded[cat] ? '▲' : '▼'}</span>
            </div>
          </div>
          {expanded[cat] && (
            <div className="table-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Rule</th>
                    <th>Title</th>
                    <th>File</th>
                    <th>Line</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f, i) => (
                    <tr key={i} className="clickable" onClick={() => setSelected(f)}>
                      <td><SeverityBadge severity={f.severity} /></td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.id}</span></td>
                      <td style={{ fontWeight: 500 }}>{f.title}</td>
                      <td>
                        <div className="flex-row" style={{ gap: 6 }}>
                          <FileIcon ext={f.file?.match(/\.[^.]+$/)?.[0] || '.js'} size={18} />
                          <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{f.file}</span>
                        </div>
                      </td>
                      <td><span className="mono" style={{ fontSize: 11 }}>{f.line || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Dependency risks */}
      {depFindings.length > 0 && (
        <div className="card mb-16" style={{ padding: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer' }}
            onClick={() => toggleExpand('deps')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>📦 Vulnerable Dependencies</span>
              <span className="chip">{depFindings.length}</span>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 18 }}>{expanded.deps ? '▲' : '▼'}</span>
          </div>
          {expanded.deps && (
            <div className="table-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              <table>
                <thead>
                  <tr><th>Severity</th><th>Package</th><th>CVE</th><th>Description</th><th>Fix</th></tr>
                </thead>
                <tbody>
                  {depFindings.map((f, i) => (
                    <tr key={i} className="clickable" onClick={() => setSelected(f)}>
                      <td><SeverityBadge severity={f.severity} /></td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{f.evidence}</span></td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--accent2)' }}>{f.cve || '—'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{f.message}</td>
                      <td><span style={{ fontSize: 12, color: 'var(--green)' }}>{f.fix}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
            {selected.evidence && (
              <div className="drawer-section">
                <div className="drawer-section-title">Evidence</div>
                <div className="code-block" style={{ fontSize: 12 }}>{selected.evidence}</div>
              </div>
            )}
            {selected.owasp && (
              <div className="drawer-section">
                <div className="drawer-section-title">OWASP</div>
                <div className="flex-row">
                  <span className="chip">{selected.category}</span>
                  <span style={{ fontSize: 13 }}>{selected.owasp}</span>
                  {OWASP_LINKS[selected.category] && (
                    <a href={OWASP_LINKS[selected.category]} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View →</a>
                  )}
                </div>
              </div>
            )}
            {selected.cve && (
              <div className="drawer-section">
                <div className="drawer-section-title">CVE Reference</div>
                <a href={`https://nvd.nist.gov/vuln/detail/${selected.cve}`} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent2)', fontFamily: 'monospace', fontSize: 13 }}>{selected.cve} →</a>
              </div>
            )}
            <div className="drawer-section">
              <div className="drawer-section-title">Remediation</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.fix}</div>
            </div>
            {(fix?.codeBefore || fix?.codeAfter) && (
              <div className="drawer-section">
                <div className="drawer-section-title">Code Fix</div>
                <DiffBlock before={fix.codeBefore} after={fix.codeAfter} />
              </div>
            )}
          </DetailDrawer>
        );
      })()}
    </div>
  );
}
