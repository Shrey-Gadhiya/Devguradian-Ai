import { useNavigate } from 'react-router-dom'
import { GitBranch, ArrowRight } from 'lucide-react'

export default function EmptyState({ icon: Icon, message, action }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] gap-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
        {Icon && <Icon size={22} style={{ color: '#818cf8' }} />}
      </div>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{message}</p>
      <button
        onClick={() => navigate('/repository')}
        className="btn-secondary text-[13px] flex items-center gap-2 mt-1"
      >
        <GitBranch size={13} />
        Load Repository
        <ArrowRight size={13} />
      </button>
    </div>
  )
}
