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
  Menu,
  ArrowUpRight
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

// High-fidelity blueprint schematic visualizations
function BlueprintIllustration({ type }: { type: BlogPost['imageType'] }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#FDFDFD] border border-border-light rounded-lg overflow-hidden group-hover/card:border-brand-blue/30 transition-colors duration-300 min-h-[160px] p-6">
      {/* Schematic coordinate lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-2 left-2 font-data text-[7px] text-text-muted">SYS_REF // X_01</div>
        <div className="absolute bottom-2 right-2 font-data text-[7px] text-text-muted">SCALE // 1:1.0</div>
        <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-black/[0.04]" />
        <div className="absolute inset-y-4 left-1/2 border-l border-dashed border-black/[0.04]" />
      </div>

      {type === 'architecture' && (
        <svg className="w-full h-[110px]" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Main Tree structure */}
          <path d="M100 20 L50 60 H150 Z" stroke="#1456F0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
          <line x1="100" y1="20" x2="100" y2="90" stroke="#1456F0" strokeWidth="1.2" />
          <line x1="100" y1="45" x2="50" y2="70" stroke="#1456F0" strokeWidth="1.2" />
          <line x1="100" y1="45" x2="150" y2="70" stroke="#1456F0" strokeWidth="1.2" />
          
          {/* Node representation */}
          <circle cx="100" cy="20" r="4.5" fill="#1456F0" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="100" cy="45" r="3.5" fill="#0A0A0A" />
          <circle cx="50" cy="70" r="3.5" fill="#0A0A0A" />
          <circle cx="150" cy="70" r="3.5" fill="#0A0A0A" />
          
          {/* Target points */}
          <circle cx="100" cy="90" r="5" fill="#EA5EC1" stroke="#FFFFFF" strokeWidth="1.5" className="animate-pulse" />
          <line x1="100" y1="90" x2="135" y2="90" stroke="#EA5EC1" strokeWidth="1" strokeDasharray="2 2" />
          <text x="140" y="93" className="font-data text-[7px]" fill="#EA5EC1">TARGET</text>
          
          {/* Tree branch outlines */}
          <rect x="80" y="10" width="40" height="6" rx="1" fill="#1456F0" fillOpacity="0.05" stroke="#1456F0" strokeWidth="0.5" />
          <text x="83" y="15" className="font-data text-[5px]" fill="#1456F0">node.root</text>
        </svg>
      )}

      {type === 'database' && (
        <svg className="w-full h-[110px]" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Coordinate grid */}
          <rect x="40" y="15" width="120" height="80" rx="4" stroke="black" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.15" />
          
          {/* DB Cylinder shapes */}
          <g transform="translate(60, 25)">
            <ellipse cx="40" cy="12" rx="22" ry="6" stroke="#0A0A0A" strokeWidth="1.2" />
            <path d="M18,12 L18,36 A22,6 0 0 0 62,36 L62,12" stroke="#0A0A0A" strokeWidth="1.2" fill="none" />
            <ellipse cx="40" cy="36" rx="22" ry="6" stroke="#1456F0" strokeWidth="1.2" fill="#1456F0" fillOpacity="0.03" />
            <path d="M18,36 L18,60 A22,6 0 0 0 62,60 L62,36" stroke="#1456F0" strokeWidth="1.2" fill="none" />
            <ellipse cx="40" cy="60" rx="22" ry="6" stroke="#EA5EC1" strokeWidth="1.2" fill="#EA5EC1" fillOpacity="0.05" />
            
            {/* Index label indicator */}
            <line x1="62" y1="36" x2="88" y2="36" stroke="#1456F0" strokeWidth="1" />
            <circle cx="88" cy="36" r="2" fill="#1456F0" />
            <text x="94" y="39" className="font-data text-[6px]" fill="#1456F0">v_index</text>
          </g>
        </svg>
      )}

      {type === 'code' && (
        <svg className="w-full h-[110px]" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Code Window Border */}
          <rect x="25" y="15" width="150" height="80" rx="4" fill="#0A0A0A" stroke="#E5E7EB" strokeWidth="0.8" />
          
          {/* Custom syntax drawing */}
          <g transform="translate(35, 25)">
            {/* Header / Dots */}
            <circle cx="5" cy="5" r="2.5" fill="#EF4444" />
            <circle cx="15" cy="5" r="2.5" fill="#F59E0B" />
            <circle cx="25" cy="5" r="2.5" fill="#10B981" />
            
            {/* Lines */}
            <rect x="5" y="20" width="40" height="4" rx="2" fill="#64748B" />
            <rect x="5" y="30" width="85" height="4" rx="2" fill="#1456F0" />
            <rect x="15" y="40" width="70" height="4" rx="2" fill="#EA5EC1" />
            <rect x="15" y="50" width="45" height="4" rx="2" fill="#64748B" />
            <rect x="5" y="60" width="25" height="4" rx="2" fill="#10B981" />
          </g>
        </svg>
      )}

      {type === 'benchmark' && (
        <svg className="w-full h-[110px]" viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Axis lines */}
          <line x1="30" y1="20" x2="30" y2="90" stroke="#0A0A0A" strokeWidth="1.2" />
          <line x1="30" y1="90" x2="175" y2="90" stroke="#0A0A0A" strokeWidth="1.2" />
          
          {/* Performance Curves */}
          <path d="M30,85 C 55,80 80,45 105,42 T 170,18" stroke="#1456F0" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M30,85 C 55,83 80,75 105,70 T 170,60" stroke="#A1A1AA" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          
          {/* Interactive target dots */}
          <circle cx="105" cy="42" r="3.5" fill="#0A0A0A" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="170" cy="18" r="4.5" fill="#EA5EC1" stroke="#FFFFFF" strokeWidth="1.5" />
          
          {/* Grid annotations */}
          <line x1="170" y1="18" x2="170" y2="90" stroke="#EA5EC1" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="135" y="85" className="font-data text-[6px]" fill="#EA5EC1">94.2% ACC</text>
        </svg>
      )}
    </div>
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

  const openSandbox = () => {
    setIngestionStep(0);
    setRetrievedResult(null);
    setHighlightedSection(null);
    setShowDemoModal(true);
  };

  const selectDoc = (docId: typeof selectedDoc) => {
    setIngestionStep(0);
    setRetrievedResult(null);
    setHighlightedSection(null);
    setSelectedDoc(docId);
  };

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
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.06)_0%,rgba(234,94,193,0.03)_40%,transparent_70%)] blur-[40px] pointer-events-none" />

      {/* Grid Backdrop */}
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
      <div className="relative z-10 w-full flex-grow flex flex-col p-6 pt-24 md:p-12 md:pt-32 lg:px-16 max-w-[1200px] mx-auto">
        
        <AnimatePresence mode="wait">
          {activeArticle ? (
            /* EDITORIAL FULL PAGE READER VIEW */
            <motion.main 
              key="article-reader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
              className="flex-grow max-w-2xl mx-auto w-full py-16 md:py-24"
            >
              <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-[0.15em] text-text-muted mb-8">
                <span className="text-brand-blue font-semibold">{activeArticle.category}</span>
                <span>/</span>
                <span>{activeArticle.date}</span>
                <span>/</span>
                <span>{activeArticle.readTime}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-serif text-[#0A0A0A] leading-[1.1] tracking-tight mb-8">
                {activeArticle.title}
              </h1>

              {/* Author & Info bar */}
              <div className="flex items-center justify-between border-y border-border-gray py-4 my-10">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border-gray">
                    <img 
                      src={activeArticle.author.avatarUrl} 
                      alt={activeArticle.author.name}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#0A0A0A]">{activeArticle.author.name}</span>
                    <span className="text-[9px] font-data text-text-muted tracking-wider uppercase">{activeArticle.author.role}</span>
                  </div>
                </div>
                
                <span className="font-data text-[9px] uppercase tracking-wider text-text-muted">
                  Log // {activeArticle.id}.txt
                </span>
              </div>

              {/* Editorial Content Layout */}
              <article className="prose prose-slate max-w-none text-text-secondary leading-relaxed font-sans space-y-6">
                {activeArticle.content.map((paragraph, pIdx) => {
                  if (/^\d+\.\s/.test(paragraph)) {
                    const parts = paragraph.split(/^\d+\.\s/);
                    const titleAndText = parts[1].split(/:\s/);
                    return (
                      <div key={pIdx} className="pl-6 border-l border-brand-blue my-8 py-1">
                        {titleAndText.length > 1 ? (
                          <>
                            <h4 className="font-serif text-lg text-[#0A0A0A] mb-1.5">{titleAndText[0]}</h4>
                            <p className="text-base text-text-secondary font-light">{titleAndText[1]}</p>
                          </>
                        ) : (
                          <p className="text-base text-text-secondary font-light">{parts[1]}</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-[17px] md:text-[18px] font-light leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </article>

              {/* Back to Index Navigation */}
              <div className="mt-20 pt-8 border-t border-border-gray flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="group flex items-center gap-2 border border-border-gray hover:border-brand-blue hover:bg-black/[0.02] px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 text-text-muted group-hover:text-brand-blue" />
                  <span>Return to Index</span>
                </button>
              </div>
            </motion.main>
          ) : (
            /* PREMIUM EDITORIAL INDEX LAYOUT */
            <motion.div
              key="magazine-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Massive Newspaper Editorial Header */}
              <section className="py-20 md:py-28 border-b border-[#0A0A0A] relative">
                <div className="max-w-[900px]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-gray bg-white/70 backdrop-blur-xs mb-8 shadow-xs">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500" />
                    </span>
                    <span className="font-data text-[10px] font-medium text-text-muted tracking-[0.16em] uppercase">
                      Vectorless Intelligence Log
                    </span>
                  </div>

                  <h1 className="font-serif text-[42px] sm:text-[60px] md:text-[84px] font-normal leading-[0.95] tracking-tight text-[#0A0A0A] mb-8">
                    Document retrieval for the <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink">reasoning era.</span>
                  </h1>

                  <p className="text-lg md:text-xl font-light text-text-secondary leading-relaxed max-w-[620px] mt-6">
                    A technical journal examining the design of structure-preserving retrieval architectures, no-chunking models, and deterministic RAG systems.
                  </p>
                </div>
              </section>

              {/* Categories Navigation Bar - Sticky pill outline style */}
              <section className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-gray sticky top-0 bg-white/85 backdrop-blur-md z-30">
                <div className="flex flex-wrap items-center gap-1">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-data uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          isActive 
                          ? 'bg-[#0A0A0A] text-white font-semibold shadow-xs' 
                          : 'text-text-muted hover:text-[#0A0A0A] hover:bg-black/5'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={openSandbox}
                  className="bg-brand-blue hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  Terminal Sandbox
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA5EC1] animate-ping" />
                </button>
              </section>

              {/* Featured Headline Section (Split Grid Layout) */}
              <AnimatePresence mode="wait">
                {selectedCategory === 'All' && featuredPost && (
                  <motion.section 
                    key="hero-spec"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveArticle(featuredPost)}
                    className="py-16 border-b border-border-gray cursor-pointer group/hero"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                      <div className="lg:col-span-8 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-widest text-text-muted mb-5">
                            <span className="text-brand-blue font-semibold">{featuredPost.category}</span>
                            <span>•</span>
                            <span>{featuredPost.date}</span>
                            <span>•</span>
                            <span>{featuredPost.readTime}</span>
                          </div>

                          <h2 className="text-3xl md:text-5xl font-serif text-[#0A0A0A] group-hover/hero:text-brand-blue transition-colors duration-300 leading-[1.08] mb-6">
                            {featuredPost.title}
                          </h2>

                          <p className="text-base text-text-secondary font-light leading-relaxed max-w-[680px] mb-10">
                            {featuredPost.snippet}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-data uppercase tracking-[0.2em] font-semibold text-[#0A0A0A] group-hover/hero:text-brand-blue transition-colors">
                          <span>Analyze Article</span>
                          <ArrowRight className="w-4 h-4 text-brand-pink group-hover/hero:translate-x-1.5 transition-transform duration-300" />
                        </div>
                      </div>

                      <div className="lg:col-span-4 w-full group-hover/hero:border-[#A1A1AA] transition-colors duration-300">
                        <BlueprintIllustration type={featuredPost.imageType} />
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Grid-based Newspaper List View (Thin border divisions, no card shadows) */}
              <section className="py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border-gray">
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
                        className="flex flex-col justify-between cursor-pointer group/card h-full p-8 border-r border-b border-border-gray hover:bg-[#FAF8F5]/30 transition-colors duration-300"
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            {/* Eyebrow / meta info */}
                            <div className="flex items-center justify-between font-data text-[9px] uppercase tracking-widest text-text-muted mb-5">
                              <span className="text-brand-blue font-semibold">{post.category}</span>
                              <span>{post.date}</span>
                            </div>

                            {/* Headline */}
                            <h3 className="text-2xl font-serif text-[#0A0A0A] group-hover/card:text-brand-blue transition-colors duration-300 leading-tight mb-4">
                              {post.title}
                            </h3>

                            {/* Short Intro */}
                            <p className="text-xs text-text-secondary leading-relaxed font-light mb-8">
                              {post.snippet}
                            </p>
                          </div>

                          {/* Render fine blueprint drawing card */}
                          <div className="mb-8">
                            <BlueprintIllustration type={post.imageType} />
                          </div>

                          {/* Author line */}
                          <div className="flex items-center gap-3 pt-4 border-t border-border-light">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border-gray">
                              <img 
                                src={post.author.avatarUrl} 
                                alt={post.author.name}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-[#0A0A0A]">{post.author.name}</span>
                              <span className="text-[9px] font-data text-text-muted uppercase tracking-wider">{post.author.role}</span>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {displayPosts.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-border-gray rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#FCFCFD]">
                    <span className="font-display font-medium text-text-secondary">No matching logs found</span>
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className="text-xs font-data uppercase tracking-wider text-brand-blue hover:underline cursor-pointer"
                    >
                      Return to Index
                    </button>
                  </div>
                )}
              </section>

              {/* Newspaper Footer */}
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
                          onClick={() => selectDoc(doc.id as any)}
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

              {/* Right Panel: Terminal Output */}
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
