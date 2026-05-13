'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const TABS = [
  { label: 'npm', cmd: 'npm i @vectorless/sdk' },
  { label: 'pnpm', cmd: 'pnpm add @vectorless/sdk' },
  { label: 'python', cmd: 'pip install vectorless' },
  { label: 'mcp', cmd: 'claude mcp add vectorless' },
  { label: 'cursor', cmd: 'curl vectorless.dev/install | sh' },
];

export default function InstallTabs() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TABS[active].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-xl border border-border-gray bg-bg-dark text-white overflow-hidden max-w-[460px]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-white/10 bg-white/[0.03]">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`relative px-3.5 py-2 font-data text-[11px] transition-colors ${
              active === i
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
            {active === i && (
              <span className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-brand-blue to-brand-pink" />
            )}
          </button>
        ))}
      </div>

      {/* Command row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="font-data text-text-muted select-none">$</span>
        <span className="font-data text-[13px] text-white truncate flex-1">{TABS[active].cmd}</span>
        <button
          onClick={handleCopy}
          aria-label="Copy command"
          className="text-text-muted hover:text-white transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
