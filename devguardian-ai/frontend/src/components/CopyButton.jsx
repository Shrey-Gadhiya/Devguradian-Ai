import React, { useState } from 'react';

export default function CopyButton({ text, size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button className={`btn btn-ghost btn-${size}`} onClick={copy} title="Copy to clipboard">
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}
