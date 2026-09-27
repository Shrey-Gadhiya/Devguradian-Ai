const EXT_COLOR = {
  js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#61dafb',
  py: '#3572a5', java: '#b07219', go: '#00add8', rs: '#dea584',
  rb: '#701516', php: '#4f5d95', cs: '#178600', cpp: '#f34b7d',
  c: '#555555', sh: '#89e051', html: '#e34c26', css: '#563d7c',
  json: '#cbcb41', yaml: '#cb171e', yml: '#cb171e', md: '#083fa1',
  sql: '#e38c00', tf: '#623ce4', dockerfile: '#0db7ed',
}

export default function FileIcon({ path, size = 11 }) {
  const ext = path?.split('.').pop()?.toLowerCase() || ''
  const color = EXT_COLOR[ext] || '#64748b'
  return (
    <span
      className="inline-block flex-shrink-0 font-bold uppercase text-center rounded leading-none"
      style={{
        fontSize: size - 1,
        color,
        background: color + '20',
        border: `1px solid ${color}30`,
        padding: '1px 3px',
        minWidth: 22,
        letterSpacing: '-0.02em',
      }}
    >
      {ext.slice(0, 3) || '?'}
    </span>
  )
}
