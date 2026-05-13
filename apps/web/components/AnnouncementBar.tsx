'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative z-[60] bg-bg-dark text-white">
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-2.5 flex items-center justify-center gap-3 text-[12.5px]">
        <span className="hidden sm:inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/10 text-white font-data text-[10px] uppercase tracking-[0.18em]">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-pink animate-pulse" />
          New
        </span>
        <span className="text-white/80 truncate">
          Vectorless SDK <span className="font-data">v1.0</span> is in early access &mdash;{' '}
          <Link href="/register" className="text-white font-medium underline underline-offset-2 hover:text-brand-pink transition-colors">
            claim a spot
          </Link>{' '}
          <span className="text-white/40">·</span> 100 docs free, no credit card
        </span>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="absolute right-3 md:right-6 text-white/40 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
