import clsx from 'clsx'

const SCORE_COLORS = {
  stroke: (s) => s >= 80 ? '#4ade80' : s >= 60 ? '#facc15' : s >= 40 ? '#fb923c' : '#f87171',
  text:   (s) => s >= 80 ? '#4ade80' : s >= 60 ? '#facc15' : s >= 40 ? '#fb923c' : '#f87171',
  glow:   (s) => s >= 80 ? 'rgba(74,222,128,0.25)' : s >= 60 ? 'rgba(250,204,21,0.2)' : s >= 40 ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.25)',
  label:  (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Poor',
}

export default function ScoreCard({ label, score = 0 }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, score / 100)) * circ
  const color = SCORE_COLORS.stroke(score)
  const glow  = SCORE_COLORS.glow(score)
  const grade = SCORE_COLORS.label(score)

  return (
    <div className="stat-card flex flex-col items-center gap-2 py-5"
      style={{ '--accent-gradient': `linear-gradient(90deg,${color}80,${color}30)` }}>

      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>

      <div className="relative w-24 h-24 my-1">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full opacity-30 blur-md transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />

        <svg className="w-24 h-24 -rotate-90 relative z-10" viewBox="0 0 88 88">
          {/* Track */}
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          {/* Progress */}
          <circle
            cx="44" cy="44" r={r} fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
          <span className="text-[9px] text-slate-600 font-medium mt-0.5 uppercase tracking-wider">/100</span>
        </div>
      </div>

      <div className="text-[11px] font-semibold" style={{ color }}>{grade}</div>
    </div>
  )
}
