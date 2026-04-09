'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-border-light">
      <div className="flex items-center justify-between px-6 md:px-12 h-20 max-w-[1200px] mx-auto">
        <Link href="/" className="font-display text-2xl font-medium tracking-tight text-text-dark flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand-pink"></div>
          Vectorless
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Link href="#how-it-works" className="text-[14px] font-medium text-text-dark px-4 py-2 rounded-full hover:bg-black/5 transition-colors">How It Works</Link>
          <Link href="/dashboard" className="text-[14px] font-medium text-text-dark px-4 py-2 rounded-full hover:bg-black/5 transition-colors">Docs</Link>
          <Link href="#pricing" className="text-[14px] font-medium text-text-dark px-4 py-2 rounded-full hover:bg-black/5 transition-colors">Pricing</Link>
          <div className="w-[1px] h-4 bg-border-gray mx-2"></div>
          <Link href="/login" className="text-[14px] font-medium text-text-dark px-4 py-2 hover:text-primary-500 transition-colors">Login</Link>
          <Link href="/register" className="bg-bg-dark text-white px-5 py-2.5 rounded-full text-[14px] font-medium hover:bg-black transition-colors ml-2">
            Get Started
          </Link>
        </div>
        <button className="md:hidden text-text-dark p-2 -mr-2" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-border-light p-6 flex flex-col gap-4 shadow-lg">
          <Link href="#how-it-works" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">How It Works</Link>
          <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Docs</Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Pricing</Link>
          <div className="h-[1px] w-full bg-border-light my-2"></div>
          <Link href="/login" onClick={() => setIsOpen(false)} className="text-[14px] font-medium text-text-dark p-2 rounded-lg hover:bg-black/5">Login</Link>
          <Link href="/register" onClick={() => setIsOpen(false)} className="bg-bg-dark text-white px-4 py-3 rounded-full text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center mt-2">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
