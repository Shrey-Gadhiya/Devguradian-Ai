import React from 'react';

export default function DiffBlock({ before, after, language = 'javascript' }) {
  const renderLines = (code, prefix, cls) =>
    (code || '').split('\n').map((line, i) => (
      <div key={i} className={`diff-line ${cls}`}>
        <span className="diff-num">{i + 1}</span>
        <span>{prefix} {line}</span>
      </div>
    ));

  return (
    <div className="code-block" style={{ padding: 0, overflow: 'hidden' }}>
      {before && (
        <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Before</div>
          {renderLines(before, '−', 'removed')}
        </div>
      )}
      {after && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>After</div>
          {renderLines(after, '+', 'added')}
        </div>
      )}
    </div>
  );
}
