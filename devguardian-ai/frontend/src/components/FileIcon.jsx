import React from 'react';

const EXT_COLORS = {
  '.js': '#f7df1e', '.jsx': '#61dafb', '.ts': '#3178c6', '.tsx': '#61dafb',
  '.py': '#3776ab', '.java': '#ed8b00', '.go': '#00acd7', '.rb': '#cc342d',
  '.php': '#8892bf', '.cs': '#239120', '.cpp': '#00599c', '.c': '#555555',
  '.rs': '#dea584', '.kt': '#7f52ff', '.swift': '#fa7343', '.sh': '#89e051',
  '.html': '#e34c26', '.css': '#264de4', '.scss': '#c69', '.sql': '#336791',
  '.json': '#4caf50', '.yaml': '#cb171e', '.yml': '#cb171e', '.md': '#083fa1',
};

export default function FileIcon({ ext, size = 22 }) {
  const color = EXT_COLORS[ext] || '#64748b';
  const label = (ext || '?').replace('.', '').toUpperCase().slice(0, 3);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: 4,
      background: color + '22', border: `1px solid ${color}44`,
      color, fontSize: 8, fontWeight: 700, fontFamily: 'monospace',
      flexShrink: 0, letterSpacing: '-0.5px',
    }}>
      {label}
    </span>
  );
}
