import React, { useEffect } from 'react';

export default function DetailDrawer({ title, subtitle, badge, children, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            {badge && <div style={{ marginBottom: 6 }}>{badge}</div>}
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: subtitle ? 4 : 0 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace' }}>{subtitle}</div>}
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}
