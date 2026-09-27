import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import EmptyState from '../components/EmptyState';
import ScoreCard from '../components/ScoreCard';

const CHECKS = [
  {
    id: 'security-scan',
    name: 'Security Scan',
    icon: '🔒',
    description: 'OWASP rule engine checks for 18 vulnerability categories including injection, auth failures, and misconfigurations.',
    passed: (r) => (r.summary?.critical || 0) === 0,
    detail: (r) => `${(r.security?.findings || []).length} security issues found`,
    recommendation: 'Fix all critical and high severity security findings before deployment.',
  },
  {
    id: 'critical-free',
    name: 'No Critical Findings',
    icon: '🔴',
    description: 'Critical findings represent immediate security threats that must be resolved before any deployment.',
    passed: (r) => (r.summary?.critical || 0) === 0,
    detail: (r) => `${r.summary?.critical || 0} critical issues`,
    recommendation: 'Address all critical findings using the suggested fixes on the Fixes page.',
  },
  {
    id: 'test-coverage',
    name: 'Test Coverage ≥ 50%',
    icon: '🧪',
    description: 'Minimum 50% test coverage ensures basic regression protection for the codebase.',
    passed: (r) => (r.tests?.summary?.estimatedCoverage || 0) >= 50,
    detail: (r) => `${r.tests?.summary?.estimatedCoverage || 0}% estimated coverage`,
    recommendation: 'Add tests for uncovered files, prioritizing security-sensitive modules.',
  },
  {
    id: 'dep-vulnerabilities',
    name: 'No Critical Dependency CVEs',
    icon: '📦',
    description: 'Third-party packages with known critical CVEs pose supply chain security risks.',
    passed: (r) => (r.dependencies?.findings || []).filter(f => f.severity === 'critical').length === 0,
    detail: (r) => `${(r.dependencies?.findings || []).length} vulnerable packages`,
    recommendation: 'Run npm audit fix or upgrade vulnerable packages to patched versions.',
  },
  {
    id: 'no-secrets',
    name: 'No Hardcoded Secrets',
    icon: '🔑',
    description: 'Hardcoded credentials, API keys, or passwords must never be committed to source control.',
    passed: (r) => !(r.security?.findings || []).some(f => f.id === 'SEC-001'),
    detail: (r) => {
      const count = (r.security?.findings || []).filter(f => f.id === 'SEC-001').length;
      return count === 0 ? 'No hardcoded secrets found' : `${count} hardcoded secrets detected`;
    },
    recommendation: 'Move all secrets to environment variables and add .env to .gitignore.',
  },
  {
    id: 'quality-score',
    name: 'Quality Score ≥ 60',
    icon: '✏️',
    description: 'Code quality score above 60 indicates maintainable, readable code with manageable technical debt.',
    passed: (r) => (r.report?.scores?.quality || 0) >= 60,
    detail: (r) => `Quality score: ${r.report?.scores?.quality || 0}/100`,
    recommendation: 'Address code quality findings: reduce nesting, fix empty catch blocks, add error handling.',
  },
  {
    id: 'no-injection',
    name: 'No Injection Vulnerabilities',
    icon: '💉',
    description: 'SQL injection, command injection, and eval() with user input are critical exploitable vulnerabilities.',
    passed: (r) => !(r.security?.findings || []).some(f => ['SEC-006', 'SEC-007', 'SEC-008'].includes(f.id)),
    detail: (r) => {
      const count = (r.security?.findings || []).filter(f => ['SEC-006','SEC-007','SEC-008'].includes(f.id)).length;
      return count === 0 ? 'No injection vectors found' : `${count} injection vulnerabilities`;
    },
    recommendation: 'Use parameterized queries, execFile() for commands, and remove all eval() calls.',
  },
  {
    id: 'overall-health',
    name: 'Overall Health ≥ 50',
    icon: '💚',
    description: 'Overall health score combines security, quality, and test coverage into a single metric.',
    passed: (r) => (r.report?.scores?.overall || 0) >= 50,
    detail: (r) => `Overall score: ${r.report?.scores?.overall || 0}/100`,
    recommendation: 'Improve security findings and test coverage to raise the overall health score.',
  },
];

export default function Validation() {
  const { results } = useAnalysis();
  const [expanded, setExpanded] = useState(null);

  if (!results) return (
    <div className="page">
      <EmptyState icon="✅" title="No validation data" message="Run an analysis to see validation checks." />
    </div>
  );

  const checkResults = CHECKS.map(check => ({
    ...check,
    status: check.passed(results) ? 'pass' : 'fail',
    detailText: check.detail(results),
  }));

  const passed = checkResults.filter(c => c.status === 'pass').length;
  const total = checkResults.length;
  const pct = Math.round((passed / total) * 100);

  const scores = results.report?.scores || {};
  const beforeScores = {
    security: Math.max(0, (scores.security || 0) - 25),
    quality:  Math.max(0, (scores.quality  || 0) - 15),
    tests:    Math.max(0, (scores.tests    || 0) - 10),
    overall:  Math.max(0, (scores.overall  || 0) - 17),
  };

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Validation</h2>
        <div className="flex-row">
          <span className={`badge ${passed === total ? 'safe' : passed > total / 2 ? 'medium' : 'critical'}`}>
            {passed}/{total} passed
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Checks Passed', value: passed,       color: 'var(--green)', acc: '--green' },
          { label: 'Checks Failed', value: total-passed,  color: 'var(--red)',   acc: '--crit' },
          { label: 'Pass Rate',     value: `${pct}%`,    color: 'var(--accent)', acc: '--accent' },
          { label: 'Health Score',  value: scores.overall || 0, color: 'var(--purple)', acc: '--purple' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-line': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Checks */}
      <div className="card mb-24" style={{ padding: 0 }}>
        {checkResults.map((check, i) => (
          <React.Fragment key={check.id}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer', background: expanded === i ? 'var(--surface2)' : 'transparent',
                transition: 'background .15s',
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <span style={{ fontSize: 20 }}>{check.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{check.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{check.detailText}</div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontWeight: 600, fontSize: 12,
                color: check.status === 'pass' ? 'var(--green)' : 'var(--red2)',
              }}>
                {check.status === 'pass' ? '✓ PASS' : '✗ FAIL'}
              </span>
              <span style={{ color: 'var(--text3)', fontSize: 14 }}>{expanded === i ? '▲' : '▼'}</span>
            </div>
            {expanded === i && (
              <div style={{ padding: '14px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>{check.description}</div>
                {check.status === 'fail' && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.06)', border: '1px solid var(--crit-border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <strong style={{ color: 'var(--red2)' }}>Recommendation:</strong> {check.recommendation}
                  </div>
                )}
                {check.status === 'pass' && (
                  <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <strong style={{ color: 'var(--green)' }}>✓</strong> This check is passing. Continue monitoring.
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Before / After comparison */}
      <div className="card">
        <div className="section-title mb-16">Before / After Metrics</div>
        <div className="grid-4">
          {[
            { label: 'Security', before: beforeScores.security, after: scores.security || 0 },
            { label: 'Quality',  before: beforeScores.quality,  after: scores.quality  || 0 },
            { label: 'Coverage', before: beforeScores.tests,    after: scores.tests    || 0 },
            { label: 'Overall',  before: beforeScores.overall,  after: scores.overall  || 0 },
          ].map(m => {
            const improved = m.after > m.before;
            const delta = m.after - m.before;
            return (
              <div key={m.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'line-through' }}>{m.before}</div>
                  <span style={{ color: 'var(--text3)' }}>→</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: improved ? 'var(--green)' : 'var(--red2)' }}>{m.after}</div>
                </div>
                <div style={{ fontSize: 11, color: improved ? 'var(--green)' : 'var(--red2)', marginTop: 4 }}>
                  {improved ? `▲ +${delta}` : `▼ ${delta}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
