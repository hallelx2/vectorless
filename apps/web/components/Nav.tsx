'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { VectorlessDot } from './VectorlessIcon';

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Tighten the glass (more opaque + stronger shadow) once the user
  // scrolls past the hero, so the floating bar stays legible over
  // white content sections.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed inset-x-0 top-3 sm:top-4 z-50 px-3 sm:px-4">
      <div
        className={[
          'mx-auto flex max-w-[1100px] items-center justify-between gap-2',
          'rounded-full border h-14 sm:h-16 pl-5 pr-2 sm:pl-6 sm:pr-2',
          'backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300',
          scrolled
            ? 'bg-white/80 border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.10)]'
            : 'bg-white/55 border-white/50 shadow-[0_6px_24px_rgba(0,0,0,0.06)]',
        ].join(' ')}
      >
        <Link
          href="/"
          className="font-display text-xl sm:text-2xl font-medium tracking-tight text-text-dark flex items-center gap-2"
        >
          <VectorlessDot size={20} />
          Vectorless
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="#how" className="text-[14px] font-medium text-text-dark px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">How it works</Link>
          <Link href="/dashboard" className="text-[14px] font-medium text-text-dark px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Docs</Link>
          <Link href="/whitepaper" className="text-[14px] font-medium text-text-dark px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Whitepaper</Link>
          <Link href="#pricing" className="text-[14px] font-medium text-text-dark px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Pricing</Link>
          <Link href="#faq" className="text-[14px] font-medium text-text-dark px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">FAQ</Link>
          <div className="w-[1px] h-4 bg-black/10 mx-2" />
          <Link href="/login" className="text-[14px] font-medium text-text-dark px-3 py-2 hover:text-primary-500 transition-colors">Login</Link>
          <Link href="/register" className="bg-bg-dark text-white px-5 py-2.5 rounded-full text-[14px] font-medium hover:bg-black transition-colors ml-1">
            Start free →
          </Link>
        </div>

        <button
          className="md:hidden text-text-dark p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu — floating glass sheet below the pill */}
      {isOpen && (
        <div className="md:hidden mx-auto mt-2 max-w-[1100px] rounded-2xl border border-white/50 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3">
          <Link href="#how" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">How it works</Link>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Docs</Link>
          <Link href="/whitepaper" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Whitepaper</Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Pricing</Link>
          <Link href="#faq" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">FAQ</Link>
          <div className="h-[1px] w-full bg-black/10 my-1" />
          <Link href="/login" onClick={() => setIsOpen(false)} className="text-[15px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Login</Link>
          <Link href="/register" onClick={() => setIsOpen(false)} className="bg-bg-dark text-white px-4 py-3 rounded-full text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center mt-1">
            Start free →
          </Link>
        </div>
      )}
    </nav>
  );
}
