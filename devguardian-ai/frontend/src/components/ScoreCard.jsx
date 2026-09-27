import React from 'react';

export default function ScoreCard({ label, score, max = 100, color = 'var(--accent)' }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score / max, 0), 1);
  const dash = pct * circ;

  const getColor = (s) => {
    if (s >= 80) return 'var(--green)';
    if (s >= 60) return 'var(--yellow)';
    if (s >= 40) return 'var(--orange)';
    return 'var(--red)';
  };

  const c = color === 'auto' ? getColor(score) : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="var(--surface2)" strokeWidth={7} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={c} strokeWidth={7}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dasharray .5s ease' }}
        />
        <text x={45} y={50} textAnchor="middle" fill="var(--text)" fontSize={18} fontWeight={700}>{score}</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>{label}</div>
    </div>
  );
}
