import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={doCopy} className={`btn-ghost py-1 px-2 text-[11px] ${className}`} title="Copy">
      {copied ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  )
}
