import React from 'react';

export default function EmptyState({ icon = '🔍', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {message && <div style={{ fontSize: 13, marginBottom: 20 }}>{message}</div>}
      {action}
    </div>
  );
}
