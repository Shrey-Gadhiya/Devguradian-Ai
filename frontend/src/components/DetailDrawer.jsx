import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function DetailDrawer({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx('fixed inset-0 z-40 transition-opacity duration-300', open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={clsx('fixed right-0 top-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out')}
        style={{
          width: 'min(600px, 95vw)',
          background: '#0d0f1a',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-24px 0 80px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex-1 min-w-0">
            {title && <div className="text-[15px] font-semibold text-slate-100 leading-snug">{title}</div>}
            {subtitle && <div className="text-[12px] text-slate-500 mt-1 font-mono">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1 flex-shrink-0">
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
          {children}
        </div>
      </div>
    </>
  )
}
