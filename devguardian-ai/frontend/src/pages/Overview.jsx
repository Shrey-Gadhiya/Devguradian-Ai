import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import ScoreCard from '../components/ScoreCard';
import SeverityBadge from '../components/SeverityBadge';
import EmptyState from '../components/EmptyState';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const { results, session, error } = useAnalysis();
  const navigate = useNavigate();

  if (error) return (
    <div className="page">
      <div className="card" style={{ borderColor: 'var(--crit-border)', background: 'var(--crit-bg)' }}>
        <div style={{ color: 'var(--red2)', fontWeight: 600, marginBottom: 4 }}>Analysis Error</div>
        <div style={{ color: 'var(--text2)' }}>{error}</div>
      </div>
    </div>
  );

  if (!results) {
    const isRunning = session?.status === 'running';
    return (
      <div className="page animate-fade">
        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, var(--accent2), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DevGuardian AI
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 20 }}>
            Autonomous security &amp; code quality platform — 6 agents, 18 OWASP rules, real-time analysis
          </div>
          {!isRunning && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ fontSize: 14, padding: '10px 24px' }} onClick={() => navigate('/repository')}>
                🚀 Start Analysis
              </button>
              <button className="btn btn-secondary" style={{ fontSize: 14 }} onClick={() => navigate('/repository')}>
                📂 Choose Repository →
              </button>
            </div>
          )}
        </div>

        {/* Running state — full progress card */}
        {isRunning && (
          <div className="card mb-24" style={{ borderTop: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                <span className="animate-pulse">⚙️</span> Analysis in progress
              </div>
              <div style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: 18 }}>{session.progress || 0}%</div>
            </div>
            <div className="progress-wrap" style={{ height: 8, marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: `${session.progress || 0}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
              {session.currentAgent && (
                <div>Active agent: <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>{session.currentAgent}</span></div>
              )}
              <div>Logs: {session.agentLogs?.length || 0} entries</div>
            </div>
            {/* Latest log entries */}
            {(session.agentLogs || []).length > 0 && (
              <div style={{ marginTop: 12, background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', maxHeight: 100, overflow: 'hidden' }}>
                {(session.agentLogs || []).slice(-4).map((log, i) => (
                  <div key={i} style={{ color: log.level === 'success' ? 'var(--green)' : log.level === 'warning' ? 'var(--yellow)' : log.level === 'error' ? 'var(--red2)' : 'var(--accent2)' }}>
                    [{log.agentId}] {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid-3" style={{ marginBottom: 32 }}>
          {[
            { icon: '🔒', title: 'Security Scanning',    desc: '18 OWASP rules, secret detection, CVE checks' },
            { icon: '🧪', title: 'Test Analysis',         desc: 'Coverage estimation, quality scoring, gap detection' },
            { icon: '🔧', title: 'Auto-Fix Generation',   desc: 'Code-level remediation with before/after diffs' },
            { icon: '📊', title: 'Engineering Reports',   desc: 'Markdown + JSON export, full findings detail' },
            { icon: '🤖', title: '6-Agent Pipeline',      desc: 'Specialized agents for deep parallel analysis' },
            { icon: '📁', title: 'Any Repository',        desc: 'Local path, Git URL, or ZIP upload supported' },
          ].map((f, i) => (
            <div className="card" key={i} style={{ cursor: 'pointer' }} onClick={() => navigate('/repository')}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, report, architecture, security, quality, tests } = results;
  const scores = report?.scores || {};

  const radarData = [
    { subject: 'Security',    value: scores.security || 0 },
    { subject: 'Quality',     value: scores.quality  || 0 },
    { subject: 'Coverage',    value: scores.tests    || 0 },
    { subject: 'Dependencies',value: Math.max(0, 100 - (results.dependencies?.findings?.length || 0) * 10) },
    { subject: 'Tests',       value: tests?.summary?.estimatedCoverage || 0 },
  ];

  const langData = Object.entries(architecture?.metrics?.byLanguage || {})
    .filter(([lang]) => lang && lang !== 'null')
    .sort((a, b) => b[1] - a[1]);
  const totalLangFiles = langData.reduce((s, [, v]) => s + v, 0);

  const LANG_COLORS = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
    Java: '#ed8b00', Go: '#00acd7', Ruby: '#cc342d',
    HTML: '#e34c26', CSS: '#264de4', Shell: '#89e051',
  };

  return (
    <div className="page animate-fade">
      {/* Project strip */}
      <div className="card mb-24" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 36 }}>📁</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{architecture?.projectInfo?.primaryLanguage || 'Unknown'} Project</div>
          <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>
            {[
              ...(architecture?.projectInfo?.frameworks || []),
              ...(architecture?.projectInfo?.packageManagers || []),
            ].join(' · ') || 'No frameworks detected'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {architecture?.projectInfo?.testFrameworks?.map(f => (
            <span className="chip" key={f}>{f}</span>
          ))}
          {architecture?.projectInfo?.hasDocker && <span className="chip">🐳 Docker</span>}
          {architecture?.projectInfo?.hasCI && <span className="chip">⚙️ CI</span>}
        </div>
      </div>

      {/* Score cards */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Overall Health', value: scores.overall || 0, accent: '--accent' },
          { label: 'Security Score', value: scores.security || 0, accent: '--red' },
          { label: 'Code Quality',   value: scores.quality  || 0, accent: '--yellow' },
          { label: 'Test Coverage',  value: scores.tests    || 0, accent: '--green' },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ '--accent-line': `var(${s.accent})` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: `var(${s.accent})` }}>{s.value}</div>
            <div className="stat-sub">out of 100</div>
          </div>
        ))}
      </div>

      {/* Findings summary */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Critical', value: summary.critical, color: 'var(--crit)', bg: 'var(--crit-bg)' },
          { label: 'High',     value: summary.high,     color: 'var(--high)', bg: 'var(--high-bg)' },
          { label: 'Medium',   value: summary.medium,   color: 'var(--med)',  bg: 'var(--med-bg)'  },
          { label: 'Low',      value: summary.low,      color: 'var(--low)',  bg: 'var(--low-bg)'  },
        ].map(s => (
          <div className="stat-card" key={s.label}
            style={{ background: s.bg, '--accent-line': s.color, cursor: 'pointer' }}
            onClick={() => navigate('/findings')}
          >
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value || 0}</div>
            <div className="stat-sub">findings</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        {/* Health Radar */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Health Radar</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Language breakdown */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Language Breakdown</div>
            <span className="text-muted" style={{ fontSize: 12 }}>{architecture?.metrics?.totalFiles} files</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {langData.slice(0, 6).map(([lang, count]) => {
              const pct = totalLangFiles > 0 ? (count / totalLangFiles * 100).toFixed(1) : 0;
              const color = LANG_COLORS[lang] || 'var(--accent)';
              return (
                <div key={lang}>
                  <div className="flex-between mb-4">
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{lang}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{count} files ({pct}%)</span>
                  </div>
                  <div className="progress-wrap">
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick navigation cards */}
      <div className="grid-3">
        {[
          { to: '/findings', icon: '🔍', title: 'All Findings', value: summary.total || 0, sub: 'issues found', color: 'var(--accent)' },
          { to: '/security', icon: '🔒', title: 'Security', value: (security?.findings || []).length, sub: 'vulnerabilities', color: 'var(--red)' },
          { to: '/fixes',    icon: '🔧', title: 'Fixes Ready', value: (results.fixes || []).length, sub: 'suggested fixes', color: 'var(--green)' },
        ].map(card => (
          <div key={card.to} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(card.to)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{card.icon} {card.title}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{card.sub}</div>
              </div>
              <div style={{ color: 'var(--text3)', fontSize: 20 }}>→</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
