import React from 'react';

export default function SeverityBadge({ severity }) {
  const s = (severity || 'low').toLowerCase();
  return (
    <span className={`badge ${s}`}>
      <span className="badge-dot" style={{ background: 'currentColor' }} />
      {s}
    </span>
  );
}
