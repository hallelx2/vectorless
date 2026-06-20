'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  ArrowRight, 
  X, 
  Calendar, 
  Clock, 
  Search, 
  BookOpen, 
  Terminal,
  ChevronRight,
  Menu
} from 'lucide-react';
import { VectorlessIcon, VectorlessDot } from './VectorlessIcon';

// Categories matching our blog categories
type Category = 'All' | 'Product Updates' | 'Engineering' | 'Guides' | 'Features';

interface Author {
  name: string;
  avatarUrl: string;
  role: string;
}

interface BlogPost {
  id: string;
  title: string;
  snippet: string;
  content: string[];
  category: Category;
  date: string;
  readTime: string;
  author: Author;
  imageType: 'architecture' | 'database' | 'code' | 'benchmark';
}

const AUTHORS: Record<string, Author> = {
  hallel: {
    name: 'Oludele Halleluyah',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'Founder & Principal Engineer'
  },
  jane: {
    name: 'Jane Cooper',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'AI Research Specialist'
  },
  guy: {
    name: 'Guy Hawkins',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'Infrastructure Architect'
  }
};

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'retrieval-reasoning-era',
    title: 'Retrieval for the reasoning era: beyond vector search',
    snippet: 'Why traditional RAG chunking is a black box that destroys document structure, and how LLM reasoning over document maps restores it.',
    category: 'Engineering',
    date: 'Jun 20, 2026',
    readTime: '5 min read',
    author: AUTHORS.hallel,
    imageType: 'architecture',
    content: [
      "Traditional RAG shatters your documents into arbitrary 500-token chunks. It computes vector embeddings for each chunk and places them in a vector database. But this similarity search is a black box. It has no understanding of headings, lists, table hierarchies, or structural flow.",
      "Vectorless takes a fundamentally different approach. We believe that documents have structure for a reason. By preserving document trees (headings, sections, chapters) and building section-by-section maps, we let LLM agents read and navigate the document outline like a human does.",
      "Why this matters:",
      "1. True Citations: Since sections are preserved, citations refer to actual logical units, not arbitrary character ranges.",
      "2. Full Context: When an agent selects a section, it gets the entire, unbroken section context.",
      "3. Deterministic Explanation: You can inspect exactly why the agent chose a particular section, making retrieval transparent."
    ]
  },
  {
    id: 'self-hosting-vectorless-engine',
    title: 'Self-hosting the Vectorless Engine with Docker and Neon',
    snippet: 'A step-by-step walkthrough to deploy the core Go retrieval engine in your private cloud with secure database isolation.',
    category: 'Guides',
    date: 'Jun 18, 2026',
    readTime: '6 min read',
    author: AUTHORS.hallel,
    imageType: 'database',
    content: [
      "The core Vectorless engine is open-source and built for speed in Go. To run it in your own environment, you only need three infrastructure primitives: PostgreSQL (with pgvector), S3-compatible object storage (e.g. Cloudflare R2 or MinIO), and a job queue (like River or QStash).",
      "In this post, we demonstrate how to spin up the Docker-based container stack, configure the Admin API endpoints, and establish encrypted BYOK (Bring Your Own Key) access for your organizational users.",
      "We will also explore setting up tenant boundaries so that document parser caches do not cross authorization scopes, guaranteeing metadata security."
    ]
  },
  {
    id: 'llm-reasoning-retrieval',
    title: 'How LLM reasoning models solve the chunk-overlap nightmare',
    snippet: 'How advanced reasoning loops avoid retrieval failures by reading summaries before pulling full-text contents.',
    category: 'Features',
    date: 'Jun 14, 2026',
    readTime: '4 min read',
    author: AUTHORS.guy,
    imageType: 'code',
    content: [
      "In classical retrieval, developers tweak overlap percentages to avoid splitting sentences in half. This is a fragile bandage. By generating an interactive table of contents (ToC) with summaries, we present the agent with a clean, high-level map.",
      "The agent reasons about which sections are relevant *before* reading them, bypassing overlap limits completely. This post explains the mathematical and logical validation behind this flow."
    ]
  },
  {
    id: 'vectorless-release-1-0',
    title: 'Vectorless Release 1.0.0: Ingestion Streaming & Citations',
    snippet: 'Announcing the stable v1 release of the Vectorless engine. Built on a modular Go core with SSE streaming and unified citations.',
    category: 'Product Updates',
    date: 'Jun 05, 2026',
    readTime: '3 min read',
    author: AUTHORS.hallel,
    imageType: 'architecture',
    content: [
      "We are thrilled to launch the fully redesigned Vectorless Core Engine 1.0.0. Built natively in Go for ultra-fast document parsing and tree building, this release is exclusively focused on making document retrieval deterministic and trace-verifiable.",
      "Key Features in 1.0:",
      "- Server-Sent Events Ingestion: Live progress logs while processing heavy PDFs and Word documents.",
      "- Integrated Citation Validation: Guarantee that retrieved chunks match the exact heading paths.",
      "- Native ConnectRPC & REST support: Expose standard JSON endpoints alongside protobuf definitions."
    ]
  },
  {
    id: 'evaluating-retrieval-financebench',
    title: 'Evaluating Retrieval Accuracy: FinanceBench Case Study',
    snippet: 'How structure-preserving retrieval outperforms traditional LangChain chunking setups on complex quarterly financial filings.',
    category: 'Engineering',
    date: 'May 28, 2026',
    readTime: '8 min read',
    author: AUTHORS.jane,
    imageType: 'benchmark',
    content: [
      "Evaluating retrieval systems is notoriously hard. In this study, we ran the FinanceBench benchmark dataset across three configurations: (A) Traditional recursive chunking, (B) Parent-document retrieval, and (C) Vectorless structure-preserving retrieval.",
      "Vectorless achieved 94.2% accuracy on complex tabular cross-referencing questions, compared to 62.1% for traditional chunking, because it did not truncate financial table nodes."
    ]
  },
  {
    id: 'hybrid-retrieval-trees',
    title: 'Hybrid Retrieval: Combining Structural Trees with Keyword Search',
    snippet: 'How the Vectorless hybrid strategy overlays BM25 keyword matching with LLM reasoning maps for the best of both worlds.',
    category: 'Engineering',
    date: 'May 14, 2026',
    readTime: '5 min read',
    author: AUTHORS.jane,
    imageType: 'architecture',
    content: [
      "While LLM reasoning over document outlines yields superior accuracy for contextual questions, sometimes users search for highly specific keywords or exact code definitions.",
      "To address this, Vectorless 1.0 supports a hybrid strategy. It performs a fast lexical pre-scan (BM25) over the document node tree to identify candidate sections, which are then annotated directly inside the Document Map.",
      "The LLM agent then reasons over both the semantic summaries and the keyword frequency hits to make the final retrieval decision. This combines the speed of classic search with the intelligence of agentic reasoning."
    ]
  }
];

// Technical blueprint vectors
function BlueprintIllustration({ type }: { type: BlogPost['imageType'] }) {
  if (type === 'architecture') {
    return (
      <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="60" x2="180" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="100" y1="10" x2="100" y2="110" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="100" cy="30" r="4" fill="#1456F0" />
        <line x1="100" y1="34" x2="60" y2="70" stroke="#1456F0" strokeWidth="1.5" />
        <line x1="100" y1="34" x2="140" y2="70" stroke="#1456F0" strokeWidth="1.5" />
        <circle cx="60" cy="70" r="4" fill="#0A0A0A" />
        <circle cx="140" cy="70" r="4" fill="#0A0A0A" />
        <line x1="60" y1="74" x2="40" y2="100" stroke="#E5E7EB" strokeWidth="1.5" />
        <line x1="60" y1="74" x2="80" y2="100" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="40" cy="100" r="3" fill="#ea5ec1" />
        <circle cx="80" cy="100" r="3" fill="#71717A" />
        <path d="M10,10 L30,10 M10,10 L10,30" stroke="#1456F0" strokeWidth="1.5" />
        <path d="M190,110 L170,110 M190,110 L190,90" stroke="#EA5EC1" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'database') {
    return (
      <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="60" x2="190" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
        <g transform="translate(60, 20)">
          <ellipse cx="40" cy="15" rx="25" ry="8" stroke="#0A0A0A" strokeWidth="1.5" />
          <path d="M15,15 L15,45 A25,8 0 0 0 65,45 L65,15" stroke="#0A0A0A" strokeWidth="1.5" fill="none" />
          <path d="M15,45 L15,75 A25,8 0 0 0 65,75 L65,45" stroke="#1456F0" strokeWidth="1.5" fill="none" />
          <line x1="40" y1="45" x2="100" y2="45" stroke="#EA5EC1" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="100" cy="45" r="3.5" fill="#EA5EC1" />
        </g>
      </svg>
    );
  }
  if (type === 'code') {
    return (
      <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="170" height="90" rx="4" fill="#0A0A0A" />
        <rect x="30" y="35" width="60" height="6" rx="3" fill="#64748B" />
        <rect x="30" y="47" width="100" height="6" rx="3" fill="#1456F0" />
        <rect x="45" y="59" width="80" height="6" rx="3" fill="#EA5EC1" />
        <rect x="45" y="71" width="40" height="6" rx="3" fill="#64748B" />
        <rect x="30" y="83" width="20" height="6" rx="3" fill="#1456F0" />
      </svg>
    );
  }
  return (
    <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20,90 Q60,40 100,75 T180,30" stroke="#1456F0" strokeWidth="2" strokeLinecap="round" />
      <path d="M20,90 H180" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="100" cy="75" r="4" fill="#0A0A0A" stroke="white" strokeWidth="1.5" />
      <circle cx="180" cy="30" r="4" fill="#EA5EC1" stroke="white" strokeWidth="1.5" />
      <line x1="180" y1="30" x2="180" y2="90" stroke="#EA5EC1" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Interactive Simulation state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'vectorless-whitepaper.pdf' | 'fastify-manual.md' | 'terms-of-service.docx'>('vectorless-whitepaper.pdf');
  const [ingestionStep, setIngestionStep] = useState<number>(0);
  const [demoQuery, setDemoQuery] = useState<string>('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedResult, setRetrievedResult] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);

  // Monitor scroll for glass navbar effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ingestion simulation steps
  useEffect(() => {
    if (showDemoModal) {
      setIngestionStep(0);
      setRetrievedResult(null);
      setHighlightedSection(null);
      
      const t1 = setTimeout(() => setIngestionStep(1), 700);
      const t2 = setTimeout(() => setIngestionStep(2), 1400);
      const t3 = setTimeout(() => setIngestionStep(3), 2100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [showDemoModal, selectedDoc]);

  // Handle mock retrieval
  const handleRetrieve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoQuery.trim()) return;

    setIsRetrieving(true);
    setRetrievedResult(null);
    setHighlightedSection(null);

    setTimeout(() => {
      setIsRetrieving(false);
      if (selectedDoc === 'vectorless-whitepaper.pdf') {
        if (demoQuery.toLowerCase().includes('performance') || demoQuery.toLowerCase().includes('benchmark')) {
          setHighlightedSection(3);
          setRetrievedResult(
            "Section 3: Performance & Benchmarks\n\nVectorless outperformed traditional chunking systems on quarterly reports, achieving 94.2% accuracy. Because it does not split financial tabular nodes, it avoids destroying structural context."
          );
        } else {
          setHighlightedSection(1);
          setRetrievedResult(
            "Section 1: Introduction to Reasoned Retrieval\n\nInstead of chunking documents into arbitrary sizes and calculating embeddings, Vectorless builds a hierarchical structure tree which is summarized section-by-section."
          );
        }
      } else if (selectedDoc === 'fastify-manual.md') {
        if (demoQuery.toLowerCase().includes('route') || demoQuery.toLowerCase().includes('matching')) {
          setHighlightedSection(2);
          setRetrievedResult(
            "Section 2: Routing Primitives\n\nFastify uses a radix tree router internally for extremely fast route resolution. It parses registered routes into prefix trees for O(L) matching speed."
          );
        } else {
          setHighlightedSection(1);
          setRetrievedResult(
            "Section 1: Getting Started\n\nInstall fastify using npm. Boot the server and register core plugins to set up dynamic request and response validation pipelines."
          );
        }
      } else {
        setHighlightedSection(1);
        setRetrievedResult(
          "Section 1: Definitions & Scope\n\nThis document governs the terms of service for the Vectorless API. Under self-hosted instances, your organization retains complete data ownership."
        );
      }
    }, 1200);
  };

  const categories: Category[] = ['All', 'Product Updates', 'Engineering', 'Guides', 'Features'];

  const filteredPosts = BLOG_POSTS.filter(post => {
    if (selectedCategory === 'All') return true;
    return post.category === selectedCategory;
  });

  const featuredPost = BLOG_POSTS.find(p => p.id === 'retrieval-reasoning-era');
  
  const displayPosts = selectedCategory === 'All'
    ? BLOG_POSTS.filter(p => p.id !== 'retrieval-reasoning-era')
    : filteredPosts;

  return (
    <div className="min-h-screen w-full relative bg-white text-[#0A0A0A] font-sans selection:bg-[#bfdbfe] selection:text-[#1d4ed8] flex flex-col justify-between overflow-x-hidden">
      
      {/* Decorative gradient overlay matching landing page */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.08)_0%,rgba(234,94,193,0.04)_40%,transparent_70%)] blur-[40px] pointer-events-none" />

      {/* Grid Backdrop (Only visible on main index page) */}
      {!activeArticle && (
        <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none opacity-80" />
      )}

      {/* FLOATING GLASS PILL NAVBAR */}
      <nav className="fixed inset-x-0 top-3 sm:top-4 z-50 px-3 sm:px-4">
        <div
          className={[
            'mx-auto flex max-w-[1100px] items-center justify-between gap-2',
            'rounded-full border h-14 sm:h-16 pl-5 pr-2 sm:pl-6 sm:pr-2',
            'backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-300',
            scrolled
              ? 'bg-white/80 border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.10)]'
              : 'bg-white/55 border-black/10 shadow-[0_6px_24px_rgba(0,0,0,0.04)]',
          ].join(' ')}
        >
          <div
            onClick={() => setActiveArticle(null)}
            className="font-display text-xl sm:text-2xl font-medium tracking-tight text-text-dark flex items-center gap-2 cursor-pointer"
          >
            <VectorlessDot size={20} />
            Vectorless
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Link href="https://vectorless.store/#how" className="text-[14px] font-medium text-[#0A0A0A] px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">How it works</Link>
            <Link href="https://docs.vectorless.store" className="text-[14px] font-medium text-[#0A0A0A] px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Docs</Link>
            <Link href="https://vectorless.store/whitepaper" className="text-[14px] font-medium text-[#0A0A0A] px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Whitepaper</Link>
            <span className="text-[14px] font-medium text-primary-500 bg-primary-500/5 px-3.5 py-2 rounded-full font-semibold">Blog</span>
            <Link href="https://vectorless.store/#pricing" className="text-[14px] font-medium text-[#0A0A0A] px-3.5 py-2 rounded-full hover:bg-black/5 transition-colors">Pricing</Link>
            <div className="w-[1px] h-4 bg-black/10 mx-2" />
            <Link href="https://vectorless.store/login" className="text-[14px] font-medium text-[#0A0A0A] px-3 py-2 hover:text-primary-500 transition-colors">Login</Link>
            <Link href="https://vectorless.store/register" className="bg-bg-dark text-white px-5 py-2.5 rounded-full text-[14px] font-medium hover:bg-black transition-colors ml-1">
              Start free →
            </Link>
          </div>

          <button
            className="md:hidden text-[#0A0A0A] p-2"
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-label="Toggle menu"
          >
            {isNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu container */}
        {isNavOpen && (
          <div className="md:hidden mx-auto mt-2 max-w-[1100px] rounded-2xl border border-black/10 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3">
            <Link href="https://vectorless.store/#how" onClick={() => setIsNavOpen(false)} className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5">How it works</Link>
            <Link href="https://docs.vectorless.store" onClick={() => setIsNavOpen(false)} className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5">Docs</Link>
            <Link href="https://vectorless.store/whitepaper" onClick={() => setIsNavOpen(false)} className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5">Whitepaper</Link>
            <span className="text-[15px] font-medium text-primary-500 bg-primary-500/5 p-2 rounded-lg font-semibold">Blog</span>
            <Link href="https://vectorless.store/#pricing" onClick={() => setIsNavOpen(false)} className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5">Pricing</Link>
            <div className="h-[1px] w-full bg-black/10 my-1" />
            <Link href="https://vectorless.store/login" onClick={() => setIsNavOpen(false)} className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5">Login</Link>
            <Link href="https://vectorless.store/register" onClick={() => setIsNavOpen(false)} className="bg-bg-dark text-white px-4 py-3 rounded-full text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center mt-1">
              Start free →
            </Link>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <div className="relative z-10 w-full flex-grow flex flex-col p-6 pt-24 md:p-12 md:pt-32 lg:px-16 max-w-[1240px] mx-auto">
        
        <AnimatePresence mode="wait">
          {activeArticle ? (
            /* FULL PAGE ARTICLE READER VIEW (Sleek Clean Canvas, Minimal Grid) */
            <motion.main 
              key="article-reader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
              className="flex-grow max-w-3xl mx-auto w-full py-16 md:py-24"
            >
              <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-widest text-text-muted mb-6">
                <span className="text-brand-blue font-semibold">{activeArticle.category}</span>
                <span>•</span>
                <span>{activeArticle.date}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-display font-medium tracking-tight text-[#0A0A0A] leading-[1.08] mb-8">
                {activeArticle.title}
              </h1>

              {/* Author Row */}
              <div className="flex items-center gap-4 bg-white border border-[#E5E7EB] p-4 rounded-xl mb-12 shadow-sm">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E5E7EB]">
                  <img 
                    src={activeArticle.author.avatarUrl} 
                    alt={activeArticle.author.name}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0A0A0A]">{activeArticle.author.name}</span>
                  <span className="text-[10px] font-data text-text-muted">{activeArticle.author.role}</span>
                </div>
              </div>

              {/* Blueprint Illustration Card */}
              <div className="bg-[#FCFCFD] border border-[#E5E7EB] rounded-2xl flex items-center justify-center p-12 min-h-[220px] mb-12 shadow-sm">
                <div className="max-w-[400px] w-full">
                  <BlueprintIllustration type={activeArticle.imageType} />
                </div>
              </div>

              {/* Article Content */}
              <article className="prose max-w-none space-y-8 text-text-secondary">
                {activeArticle.content.map((paragraph, pIdx) => {
                  if (/^\d+\.\s/.test(paragraph)) {
                    const parts = paragraph.split(/^\d+\.\s/);
                    const titleAndText = parts[1].split(/:\s/);
                    return (
                      <div key={pIdx} className="pl-6 border-l-2 border-brand-blue my-6">
                        {titleAndText.length > 1 ? (
                          <>
                            <h4 className="font-display font-semibold text-base text-[#0A0A0A] mb-2">{titleAndText[0]}</h4>
                            <p className="text-[16px] md:text-[18px] leading-relaxed text-text-secondary font-light">{titleAndText[1]}</p>
                          </>
                        ) : (
                          <p className="text-[16px] md:text-[18px] leading-relaxed text-text-secondary font-light">{parts[1]}</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-[17px] md:text-[19px] leading-relaxed font-light text-text-secondary">
                      {paragraph}
                    </p>
                  );
                })}
              </article>

              {/* Back to Library Index */}
              <div className="mt-16 pt-8 border-t border-[#E5E7EB] flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="group flex items-center gap-2 border border-border-gray hover:border-brand-blue hover:bg-black/[0.02] px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 text-text-muted group-hover:text-brand-blue" />
                  <span>Return to Index</span>
                </button>

                <span className="font-data text-[10px] uppercase text-text-muted tracking-widest">
                  File: {activeArticle.id}.log
                </span>
              </div>
            </motion.main>
          ) : (
            /* MAGAZINE LIST VIEW */
            <motion.div
              key="magazine-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero Header matching landing page style */}
              <section className="py-16 md:py-24 border-b border-[#E5E7EB]">
                <div className="max-w-[850px] relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/70 backdrop-blur-sm mb-6 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                    </span>
                    <span className="font-data text-[11px] font-medium text-text-muted tracking-[0.16em] uppercase">
                      Vectorless Intelligence Log
                    </span>
                  </div>

                  <h1 className="font-display text-[40px] sm:text-5xl md:text-7xl font-medium leading-[0.98] tracking-[-0.03em] text-text-base mb-8 relative">
                    <span>Document retrieval for the </span>
                    <span className="relative inline-block">
                      <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink">
                        reasoning era.
                      </span>
                      {/* Underline vector */}
                      <svg aria-hidden viewBox="0 0 520 36" className="absolute left-0 -bottom-3.5 w-[90%] max-w-[460px] h-[28px] opacity-90">
                        <path d="M4 22 C 120 6, 260 6, 514 18" fill="none" stroke="#1456f0" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M16 30 C 140 18, 280 18, 502 28" fill="none" stroke="#ea5ec1" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl font-light text-text-secondary leading-relaxed max-w-[650px] mt-10">
                    Deep dives, engineering specifications, and core performance analyses of structure-preserving retrieval architectures.
                  </p>
                </div>
              </section>

              {/* Categories Navigation Bar */}
              <section className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E7EB] sticky top-0 bg-white/80 backdrop-blur-md z-30">
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-data uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                          isActive 
                          ? 'bg-[#0A0A0A] text-white font-semibold border-transparent shadow-sm' 
                          : 'text-text-muted hover:text-[#0A0A0A] hover:bg-black/5 border-transparent'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="bg-brand-blue hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  Terminal Sandbox
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA5EC1] animate-ping" />
                </button>
              </section>

              {/* Featured Article Layout */}
              <AnimatePresence mode="wait">
                {selectedCategory === 'All' && featuredPost && (
                  <motion.section 
                    key="hero-spec"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveArticle(featuredPost)}
                    className="py-12 border-b border-[#E5E7EB] cursor-pointer group"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                      <div className="lg:col-span-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-widest text-text-muted mb-6">
                            <span className="text-brand-blue font-semibold">{featuredPost.category}</span>
                            <span>•</span>
                            <span>{featuredPost.date}</span>
                            <span>•</span>
                            <span>{featuredPost.readTime}</span>
                          </div>

                          <h2 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-[#0A0A0A] group-hover:text-brand-blue transition-colors leading-[1.1] mb-6">
                            {featuredPost.title}
                          </h2>

                          <p className="text-base text-text-secondary font-light leading-relaxed max-w-[700px] mb-8">
                            {featuredPost.snippet}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-data uppercase tracking-[0.2em] font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Analyze Specification</span>
                          <ArrowRight className="w-4 h-4 text-brand-pink" />
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center p-8 min-h-[220px] shadow-sm group-hover:border-[#C0C0C0] transition-all duration-300">
                        <BlueprintIllustration type={featuredPost.imageType} />
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Post Grid List */}
              <section className="py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-12 md:gap-y-16">
                  <AnimatePresence mode="popLayout">
                    {displayPosts.map((post, idx) => (
                      <motion.article
                        key={post.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.02 }}
                        onClick={() => setActiveArticle(post)}
                        className="flex flex-col justify-between cursor-pointer group h-full pb-8 border-b border-[#E5E7EB]"
                      >
                        <div>
                          <div className="flex items-center justify-between font-data text-[9px] uppercase tracking-widest text-text-muted mb-4">
                            <span className="text-brand-blue font-semibold">{post.category}</span>
                            <span>{post.date}</span>
                          </div>

                          <h3 className="text-xl font-display font-semibold text-[#0A0A0A] group-hover:text-brand-blue transition-colors leading-snug mb-3">
                            {post.title}
                          </h3>

                          <p className="text-xs text-text-secondary leading-relaxed font-light mb-6">
                            {post.snippet}
                          </p>
                        </div>

                        <div className="bg-white border border-[#E5E7EB]/70 rounded-xl flex items-center justify-center p-6 min-h-[140px] mb-6 group-hover:border-[#E5E7EB] transition-colors shadow-xs">
                          <BlueprintIllustration type={post.imageType} />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB]">
                            <img 
                              src={post.author.avatarUrl} 
                              alt={post.author.name}
                              className="object-cover w-full h-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#0A0A0A]">{post.author.name}</span>
                            <span className="text-[9px] font-data text-text-muted">{post.author.role}</span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>

                  {displayPosts.length === 0 && (
                    <div className="col-span-1 md:col-span-3 py-20 text-center border border-dashed border-border-gray rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#FCFCFD]">
                      <span className="font-display font-medium text-text-secondary">No matching logs found</span>
                      <button 
                        onClick={() => setSelectedCategory('All')}
                        className="text-xs font-data uppercase tracking-wider text-brand-blue hover:underline cursor-pointer"
                      >
                        Return to Index
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Footer */}
              <footer className="py-12 border-t border-border-gray flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-text-muted font-data uppercase tracking-widest mt-12">
                <div className="flex items-center gap-2 text-[#0A0A0A] cursor-pointer" onClick={() => setActiveArticle(null)}>
                  <VectorlessDot size={18} />
                  <span className="font-display font-medium text-sm normal-case tracking-normal">Vectorless</span>
                </div>
                <p className="text-[10px]">
                  © {new Date().getFullYear()} Vectorless. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-[10px]">
                  <a href="#" className="hover:text-[#0A0A0A] transition-colors">Privacy</a>
                  <span>/</span>
                  <a href="#" className="hover:text-[#0A0A0A] transition-colors">Terms</a>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* INTERACTIVE RETRIEVAL SANDBOX */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-[850px] h-[90vh] md:h-[680px] bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row border border-[#E5E7EB]"
            >
              {/* Left Panel: Control Deck */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-brand-blue/10 text-brand-blue text-[9px] font-data rounded uppercase tracking-wider font-semibold">Step-by-step API</span>
                    <span className="text-[#ea5ec1] text-[10px] font-data animate-pulse">🟢 Active Server</span>
                  </div>

                  <h3 className="text-xl font-display font-medium tracking-tight mb-2">
                    Retrieval Interface
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6">
                    Choose a document, trigger structural ingestion, and execute reasoning queries locally.
                  </p>

                  <h4 className="text-[9px] uppercase font-data font-bold text-text-muted mb-3 tracking-wider">
                    Select Document
                  </h4>
                  <div className="space-y-2 mb-6">
                    {[
                      { id: 'vectorless-whitepaper.pdf', size: '2.4 MB', type: 'PDF' },
                      { id: 'fastify-manual.md', size: '480 KB', type: 'Markdown' },
                      { id: 'terms-of-service.docx', size: '1.1 MB', type: 'Word Doc' }
                    ].map((doc) => {
                      const isSel = selectedDoc === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc.id as any)}
                          className={`w-full p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${
                            isSel 
                            ? 'border-brand-blue bg-brand-blue/5' 
                            : 'border-[#E5E7EB] hover:border-slate-400 bg-[#FCFCFD]'
                          }`}
                        >
                          <span className="text-xs font-semibold text-[#0A0A0A]">{doc.id}</span>
                          <span className="text-[9px] font-data text-text-muted">{doc.type} · {doc.size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {ingestionStep >= 2 && (
                  <form onSubmit={handleRetrieve} className="space-y-3">
                    <h4 className="text-[9px] uppercase font-data font-bold text-text-muted tracking-wider">
                      Execute Query
                    </h4>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={demoQuery}
                        onChange={(e) => setDemoQuery(e.target.value)}
                        placeholder="e.g., How does performance compare?"
                        className="w-full text-xs border border-[#E5E7EB] rounded-lg pl-3 pr-8 py-2.5 bg-[#FCFCFD] focus:outline-none focus:border-brand-blue"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                    </div>
                    <button 
                      type="submit"
                      disabled={isRetrieving || !demoQuery.trim()}
                      className="w-full bg-[#0A0A0A] hover:bg-brand-blue text-white py-2.5 rounded-lg text-xs font-data uppercase tracking-wider font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRetrieving ? 'Evaluating Outline...' : 'Retrieve Target'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Panel: Terminal Output (Dark) */}
              <div className="w-full md:w-1/2 bg-[#0A0A0A] text-white p-6 flex flex-col justify-between font-mono">
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#3F3F46] pb-3 mb-4 text-[#71717A] text-[10px]">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                        <span>vectorless_core_stdout</span>
                      </span>
                      <button 
                        onClick={() => setShowDemoModal(false)}
                        className="hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-[11px] leading-relaxed">
                      <div className="text-slate-500">$ ./vectorless ingest {selectedDoc}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">✓</span>
                        <span>[1/3] File parsed: created node tree</span>
                      </div>
                      
                      {ingestionStep >= 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          <span>[2/3] Structural outline mapped (ToC)</span>
                        </div>
                      )}

                      {ingestionStep >= 2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500">✓</span>
                          <span>[3/3] Gemini-1.5 summary manifests generated</span>
                        </div>
                      )}

                      {isRetrieving && (
                        <div className="text-brand-pink animate-pulse">
                          $ querying LLM agent reasoning engine...
                        </div>
                      )}

                      {retrievedResult && (
                        <div className="border-t border-[#3F3F46] pt-3 mt-4 text-[#A1A1AA] space-y-2">
                          <div className="text-brand-pink text-[10px]">REASONING OUTLINE SELECTION:</div>
                          <p className="text-[10px] text-white bg-slate-900 p-2.5 rounded border border-white/10">
                            {retrievedResult}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {ingestionStep >= 2 && (
                    <div className="text-[9px] text-[#71717A] border-t border-[#3F3F46] pt-3 mt-6">
                      * Structural citations are generated dynamically matching header paths.
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
