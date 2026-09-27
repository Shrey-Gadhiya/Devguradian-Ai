import React, { useState } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import EmptyState from '../components/EmptyState';

const AGENT_META = {
  'code-analyst':   { icon: '🏗', color: 'var(--accent)',  desc: 'Architecture, dependencies, risky code patterns' },
  'security-agent': { icon: '🔒', color: 'var(--red)',     desc: 'OWASP vulnerabilities, secrets, unsafe dependencies' },
  'test-agent':     { icon: '🧪', color: 'var(--green)',   desc: 'Coverage gaps, unit/integration tests, test generation' },
  'debug-agent':    { icon: '🐛', color: 'var(--orange)',  desc: 'Root-cause analysis for failures and regressions' },
  'review-agent':   { icon: '👁', color: 'var(--purple)',  desc: 'Review proposed changes and prevent regressions' },
  'doc-agent':      { icon: '📄', color: 'var(--yellow)',  desc: 'Generate technical and security documentation' },
};

function getAgentMeta(agentId) { return AGENT_META[agentId]; }

const LOG_COLORS = { info: 'var(--accent2)', success: 'var(--green)', warning: 'var(--yellow)', error: 'var(--red2)' };

export default function Agents() {
  const { results, session } = useAnalysis();
  const [selectedAgent, setSelectedAgent] = useState(null);

  const agentLogs = session?.agentLogs || results?.agentLogs || [];

  if (!session && !results) return (
    <div className="page">
      <EmptyState icon="🤖" title="No agent activity" message="Run an analysis to see agent logs." />
    </div>
  );

  const agentIds = Object.keys(AGENT_META);

  // Per-agent stats derived from results
  const getAgentStats = (agentId) => {
    if (!results) return {};
    switch (agentId) {
      case 'code-analyst':
        return {
          files: results.architecture?.metrics?.totalFiles || 0,
          languages: Object.keys(results.architecture?.metrics?.byLanguage || {}).length,
          entryPoints: results.architecture?.entryPoints?.length || 0,
        };
      case 'security-agent':
        return {
          findings: (results.security?.findings || []).length,
          critical: results.summary?.critical || 0,
          depVulns: (results.dependencies?.findings || []).length,
        };
      case 'test-agent':
        return {
          testFiles: results.tests?.summary?.testFiles || 0,
          coverage: results.tests?.summary?.estimatedCoverage || 0,
          generated: (results.generatedTests || []).length,
        };
      case 'debug-agent':
        return { analysed: (results.findings || []).length };
      case 'review-agent':
        return { fixes: (results.fixes || []).length };
      case 'doc-agent':
        return { reportSections: 4 };
      default:
        return {};
    }
  };

  const agentLogMap = {};
  for (const log of agentLogs) {
    if (!agentLogMap[log.agentId]) agentLogMap[log.agentId] = [];
    agentLogMap[log.agentId].push(log);
  }

  return (
    <div className="page animate-fade">
      <div className="section-header mb-24">
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Agent Activity</h2>
        <span className="chip">{agentIds.length} agents</span>
      </div>

      {/* Agent grid */}
      <div className="grid-2 mb-24">
        {agentIds.map(id => {
          const meta = AGENT_META[id];
          const stats = getAgentStats(id);
          const logs = agentLogMap[id] || [];
          const isActive = session?.currentAgent === id;
          const isSelected = selectedAgent === id;

          return (
            <div key={id} className="card"
              style={{
                cursor: 'pointer',
                border: isSelected ? `2px solid ${meta.color}` : '1px solid var(--border)',
                borderTop: `2px solid ${meta.color}`,
                transition: 'all .15s',
              }}
              onClick={() => setSelectedAgent(isSelected ? null : id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{meta.desc}</div>
                  </div>
                </div>
                {isActive && (
                  <span className="badge info animate-pulse">active</span>
                )}
                {logs.length > 0 && !isActive && (
                  <span className="badge safe">done</span>
                )}
              </div>

              {/* Stats */}
              {Object.keys(stats).length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {Object.entries(stats).map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>
                      <span style={{ color: 'var(--text3)' }}>{k}: </span>
                      <span style={{ fontWeight: 600, color: meta.color }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Latest log line */}
              {logs.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace', background: 'var(--surface2)', borderRadius: 4, padding: '6px 8px' }}>
                  {logs[logs.length - 1].message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected agent log */}
      {selectedAgent && agentLogMap[selectedAgent]?.length > 0 && (
        <div className="card mb-24">
          <div className="section-title mb-12">
            {AGENT_META[selectedAgent]?.icon} {selectedAgent} — Detailed Log
          </div>
          <div className="terminal">
            {agentLogMap[selectedAgent].map((log, i) => (
              <div key={i} style={{ color: LOG_COLORS[log.level] || 'var(--text2)' }}>
                <span style={{ color: 'var(--text3)' }}>{new Date(log.timestamp).toLocaleTimeString()} </span>
                <span style={{ color: 'var(--text3)' }}>[{log.level}] </span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full log */}
      {agentLogs.length > 0 && (
        <div className="card">
          <div className="section-title mb-12">📋 Full Pipeline Log</div>
          <div className="terminal">
            {agentLogs.map((log, i) => (
              <div key={i} style={{ color: LOG_COLORS[log.level] || 'var(--text2)' }}>
                <span style={{ color: 'var(--text3)' }}>{new Date(log.timestamp).toLocaleTimeString()} </span>
                <span style={{ color: getAgentMeta(log.agentId)?.color || 'var(--text3)' }}>[{log.agentId}] </span>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

