'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  X, 
  Calendar, 
  Clock, 
  Check, 
  Sparkles,
  Search,
  FileText,
  Database,
  Cpu,
  Play,
  Terminal,
  ArrowUpRight,
  BookOpen,
  ChevronRight
} from 'lucide-react';

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

function VectorlessIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#1456f0" />
      <line x1="7" y1="8" x2="16" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="7" x2="16" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="25" y1="8" x2="16" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="7" x2="16" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="24" r="2" fill="#ea5ec1" />
    </svg>
  );
}

// Highly stylized schematic vectors
function BlueprintIllustration({ type }: { type: BlogPost['imageType'] }) {
  if (type === 'architecture') {
    return (
      <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Coordinates grid back layer */}
        <line x1="20" y1="60" x2="180" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="100" y1="10" x2="100" y2="110" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Section nodes tree representation */}
        <circle cx="100" cy="30" r="4" fill="#1456F0" />
        <line x1="100" y1="34" x2="60" y2="70" stroke="#1456F0" strokeWidth="1.5" />
        <line x1="100" y1="34" x2="140" y2="70" stroke="#1456F0" strokeWidth="1.5" />
        
        <circle cx="60" cy="70" r="4" fill="#0A0A0A" />
        <circle cx="140" cy="70" r="4" fill="#0A0A0A" />
        
        <line x1="60" y1="74" x2="40" y2="100" stroke="#E5E7EB" strokeWidth="1.5" />
        <line x1="60" y1="74" x2="80" y2="100" stroke="#E5E7EB" strokeWidth="1.5" />
        
        <circle cx="40" cy="100" r="3" fill="#ea5ec1" />
        <circle cx="80" cy="100" r="3" fill="#71717A" />
        
        {/* Abstract border paths */}
        <path d="M10,10 L30,10 M10,10 L10,30" stroke="#1456F0" strokeWidth="1.5" />
        <path d="M190,110 L170,110 M190,110 L190,90" stroke="#EA5EC1" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'database') {
    return (
      <svg className="w-full h-full max-h-[140px]" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="60" x2="190" y2="60" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Neon database cylinders in technical drawing format */}
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
        {/* Abstract syntax-highlighted code blocks */}
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
  
  // Interactive Simulation state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'vectorless-whitepaper.pdf' | 'fastify-manual.md' | 'terms-of-service.docx'>('vectorless-whitepaper.pdf');
  const [ingestionStep, setIngestionStep] = useState<number>(0);
  const [demoQuery, setDemoQuery] = useState<string>('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedResult, setRetrievedResult] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);

  // Auto processing steps on mock document load
  useEffect(() => {
    if (showDemoModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIngestionStep(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRetrievedResult(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedSection(null);
      
      const timer1 = setTimeout(() => setIngestionStep(1), 700);
      const timer2 = setTimeout(() => setIngestionStep(2), 1400);
      const timer3 = setTimeout(() => setIngestionStep(3), 2100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
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

  // Editorial varying card layouts:
  // Post 1 -> Featured Hero
  const featuredPost = BLOG_POSTS.find(p => p.id === 'retrieval-reasoning-era');
  
  // Grid layout split:
  // If category is All, show Hero at top, and others in grid.
  const displayPosts = selectedCategory === 'All'
    ? BLOG_POSTS.filter(p => p.id !== 'retrieval-reasoning-era')
    : filteredPosts;

  return (
    <div className="min-h-screen w-full relative bg-[#FAF6EE] text-[#0F0F0F] font-sans selection:bg-[#bfdbfe]/50 flex flex-col justify-between">
      
      {/* Editorial top accent line */}
      <div className="h-1 bg-gradient-to-r from-[#1456F0] via-[#855BDE] to-[#EA5EC1] w-full" />

      {/* Subtle blueprint grid backdrop - hidden when reading article */}
      {!activeArticle && (
        <div className="absolute inset-0 grid-paper pointer-events-none opacity-25" />
      )}

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full flex-grow flex flex-col p-6 md:p-12 lg:px-16">
        
        {/* Header Block */}
        <header className="w-full py-8 flex items-center justify-between border-b border-[#E3DFD5] relative z-20">
          <div 
            onClick={() => setActiveArticle(null)} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <VectorlessIcon size={34} />
            <div className="flex flex-col">
              <span className="text-[#0F0F0F] text-2xl font-display font-medium tracking-tight">
                Vectorless
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#70706F] font-semibold">
                Intelligence Log
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-[#3F3F3E]">
            {['Engine', 'SDKs', 'Documentation', 'Control Plane'].map((link) => (
              <a 
                key={link} 
                href={link === 'Documentation' ? '/docs' : link === 'Control Plane' ? 'https://vectorless.store' : '#'}
                className="hover:text-[#1456F0] transition-colors relative py-1"
              >
                {link}
              </a>
            ))}
          </nav>

          <button 
            onClick={() => setShowDemoModal(true)}
            className="bg-[#0F0F0F] hover:bg-[#1456F0] text-white px-5 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer animate-fade-in"
          >
            Terminal Sandbox
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA5EC1] animate-ping" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {activeArticle ? (
            /* FULL PAGE ARTICLE READER VIEW (Warm cream background, flat, no grid lines) */
            <motion.main 
              key="article-reader"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
              className="flex-grow max-w-3xl mx-auto w-full py-16 md:py-24"
            >
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#70706F] mb-6">
                <span className="text-[#1456F0] font-semibold">{activeArticle.category}</span>
                <span>•</span>
                <span>{activeArticle.date}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight text-[#0F0F0F] leading-[1.08] mb-8">
                {activeArticle.title}
              </h1>

              {/* Author Card */}
              <div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#E3DFD5] p-5 rounded-2xl mb-12 shadow-xs">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E3DFD5]">
                  <img 
                    src={activeArticle.author.avatarUrl} 
                    alt={activeArticle.author.name}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0F0F0F]">{activeArticle.author.name}</span>
                  <span className="text-[10px] font-mono text-[#70706F]">{activeArticle.author.role}</span>
                </div>
              </div>

              {/* Large Accent Illustration */}
              <div className="bg-[#FAF8F5] border border-[#E3DFD5] rounded-3xl flex items-center justify-center p-12 min-h-[220px] mb-12">
                <div className="max-w-[400px] w-full">
                  <BlueprintIllustration type={activeArticle.imageType} />
                </div>
              </div>

              {/* Article Content with Premium Typography */}
              <article className="prose max-w-none space-y-8 text-[#3F3F3E]">
                {activeArticle.content.map((paragraph, pIdx) => {
                  // If it starts with a number list item like "1. "
                  if (/^\d+\.\s/.test(paragraph)) {
                    const parts = paragraph.split(/^\d+\.\s/);
                    const titleAndText = parts[1].split(/:\s/);
                    return (
                      <div key={pIdx} className="pl-6 border-l-2 border-[#1456F0] my-6">
                        {titleAndText.length > 1 ? (
                          <>
                            <h4 className="font-display font-semibold text-base text-[#0F0F0F] mb-2">{titleAndText[0]}</h4>
                            <p className="text-[16px] md:text-[18px] leading-relaxed text-[#3F3F3E] font-light">{titleAndText[1]}</p>
                          </>
                        ) : (
                          <p className="text-[16px] md:text-[18px] leading-relaxed text-[#3F3F3E] font-light">{parts[1]}</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-[17px] md:text-[19px] leading-relaxed font-light text-[#3F3F3E]">
                      {paragraph}
                    </p>
                  );
                })}
              </article>

              {/* Back button at the bottom */}
              <div className="mt-16 pt-8 border-t border-[#E3DFD5] flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="group flex items-center gap-2 border border-[#E3DFD5] hover:border-[#1456F0] hover:bg-[#FAF8F5] px-5 py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 text-[#70706F] group-hover:text-[#1456F0]" />
                  <span>Return to Library</span>
                </button>

                <span className="font-mono text-[10px] uppercase text-[#70706F] tracking-widest">
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
              {/* Hero Section */}
              <section className="py-16 md:py-24 border-b border-[#E3DFD5]">
                <div className="max-w-[850px]">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#1456F0] font-semibold mb-4 block">
                    Volume IV · Technical Library
                  </span>
                  <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#0F0F0F] leading-[1.05] mb-8">
                    Document retrieval for the <span className="font-serif italic bg-gradient-to-r from-[#1456F0] to-[#EA5EC1] bg-clip-text text-transparent">reasoning era</span>.
                  </h1>
                  <p className="text-lg md:text-xl font-light text-[#3F3F3E] leading-relaxed max-w-[650px]">
                    Deep dives, implementation specifications, and performance analyses of structure-preserving retrieval architectures.
                  </p>
                </div>
              </section>

              {/* Categories Bar */}
              <section className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E3DFD5] sticky top-0 bg-[#FAF6EE]/90 backdrop-blur-md z-30">
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          isActive 
                          ? 'bg-[#0F0F0F] text-white font-semibold' 
                          : 'text-[#70706F] hover:text-[#0F0F0F] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                
                <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-[#70706F]">
                  <BookOpen className="w-4 h-4 text-[#1456F0]" />
                  <span>Format: Structural / Open-Source Spec</span>
                </div>
              </section>

              {/* Featured Editorial Hero Article */}
              <AnimatePresence mode="wait">
                {selectedCategory === 'All' && featuredPost && (
                  <motion.section 
                    key="hero-spec"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveArticle(featuredPost)}
                    className="py-12 border-b border-[#E3DFD5] cursor-pointer group"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                      <div className="lg:col-span-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#70706F] mb-6">
                            <span className="text-[#1456F0] font-semibold">{featuredPost.category}</span>
                            <span>•</span>
                            <span>{featuredPost.date}</span>
                            <span>•</span>
                            <span>{featuredPost.readTime}</span>
                          </div>

                          <h2 className="text-3xl md:text-5xl font-display font-medium tracking-tight text-[#0F0F0F] group-hover:text-[#1456F0] transition-colors leading-[1.1] mb-6">
                            {featuredPost.title}
                          </h2>

                          <p className="text-base text-[#3F3F3E] font-light leading-relaxed max-w-[700px] mb-8">
                            {featuredPost.snippet}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Analyze Specification</span>
                          <ArrowRight className="w-4 h-4 text-[#EA5EC1]" />
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-[#FAF8F5] border border-[#E3DFD5] rounded-2xl flex items-center justify-center p-8 min-h-[220px] shadow-xs group-hover:shadow-sm transition-all duration-300">
                        <BlueprintIllustration type={featuredPost.imageType} />
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Magazine Grid List */}
              <section className="py-12">
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-12 md:gap-y-16"
                >
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
                        className="flex flex-col justify-between cursor-pointer group h-full pb-8 border-b border-[#E3DFD5]/80"
                      >
                        <div>
                          {/* Header meta */}
                          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#70706F] mb-4">
                            <span className="text-[#1456F0] font-semibold">{post.category}</span>
                            <span>{post.date}</span>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-display font-semibold text-[#0F0F0F] group-hover:text-[#1456F0] transition-colors leading-snug mb-3">
                            {post.title}
                          </h3>

                          {/* Snippet */}
                          <p className="text-xs text-[#3F3F3E] leading-relaxed font-light mb-6">
                            {post.snippet}
                          </p>
                        </div>

                        {/* Card Illustration */}
                        <div className="bg-[#FAF8F5] border border-[#E3DFD5]/50 rounded-xl flex items-center justify-center p-6 min-h-[140px] mb-6 group-hover:border-[#E3DFD5] transition-colors">
                          <BlueprintIllustration type={post.imageType} />
                        </div>

                        {/* Author */}
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E3DFD5]">
                            <img 
                              src={post.author.avatarUrl} 
                              alt={post.author.name}
                              className="object-cover w-full h-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#0F0F0F]">{post.author.name}</span>
                            <span className="text-[9px] font-mono text-[#70706F]">{post.author.role}</span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>

                  {/* Empty State */}
                  {displayPosts.length === 0 && (
                    <div className="col-span-1 md:col-span-3 py-20 text-center border border-dashed border-[#E3DFD5] rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#FAF8F5]">
                      <span className="font-display font-medium text-slate-800">No matching logs found</span>
                      <button 
                        onClick={() => setSelectedCategory('All')}
                        className="text-xs font-mono uppercase tracking-wider text-[#1456F0] hover:underline cursor-pointer"
                      >
                        Return to Index
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Footer */}
              <footer className="py-12 border-t border-[#E3DFD5] flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#70706F] font-mono uppercase tracking-widest mt-12">
                <div className="flex items-center gap-3 text-[#0F0F0F]">
                  <VectorlessIcon size={24} />
                  <span className="font-display font-medium text-sm normal-case tracking-normal">Vectorless</span>
                </div>
                <p className="text-[10px]">
                  © {new Date().getFullYear()} Vectorless. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-[10px]">
                  <a href="#" className="hover:text-[#0F0F0F] transition-colors">Privacy</a>
                  <span>/</span>
                  <a href="#" className="hover:text-[#0F0F0F] transition-colors">Terms</a>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* DYNAMIC INTERACTIVE RETRIEVAL TERMINAL SANDBOX */}
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

            {/* Split Screen Panel */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="relative w-full max-w-[850px] h-[90vh] md:h-[680px] bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row border border-[#E5E7EB]"
            >
              
              {/* Left Panel: Control Deck (Light) */}
              <div className="w-full md:w-1/2 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-[#1456F0]/10 text-[#1456F0] text-[9px] font-mono rounded uppercase tracking-wider font-semibold">Step-by-step API</span>
                    <span className="text-[#ea5ec1] text-[10px] font-mono animate-pulse">🟢 Active Server</span>
                  </div>

                  <h3 className="text-xl font-display font-medium tracking-tight mb-2">
                    Retrieval Interface
                  </h3>
                  <p className="text-xs text-[#71717A] leading-relaxed mb-6">
                    Choose a document, trigger structural ingestion, and execute reasoning queries locally.
                  </p>

                  <h4 className="text-[9px] uppercase font-mono font-bold text-[#71717A] mb-3 tracking-wider">
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
                            ? 'border-[#1456F0] bg-[#1456F0]/5' 
                            : 'border-[#E5E7EB] hover:border-slate-400 bg-[#FCFCFD]'
                          }`}
                        >
                          <span className="text-xs font-semibold text-[#0A0A0A]">{doc.id}</span>
                          <span className="text-[9px] font-mono text-[#71717A]">{doc.type} · {doc.size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {ingestionStep >= 2 && (
                  <form onSubmit={handleRetrieve} className="space-y-3">
                    <h4 className="text-[9px] uppercase font-mono font-bold text-[#71717A] tracking-wider">
                      Execute Query
                    </h4>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={demoQuery}
                        onChange={(e) => setDemoQuery(e.target.value)}
                        placeholder="e.g., How does performance compare?"
                        className="w-full text-xs border border-[#E5E7EB] rounded-lg pl-3 pr-8 py-2.5 bg-[#FCFCFD] focus:outline-none focus:border-[#1456F0]"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                    </div>
                    <button 
                      type="submit"
                      disabled={isRetrieving || !demoQuery.trim()}
                      className="w-full bg-[#0A0A0A] hover:bg-[#1456F0] text-white py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                        <Terminal className="w-3.5 h-3.5 text-[#1456F0]" />
                        <span>vectorless_core_stdout</span>
                      </span>
                      <button 
                        onClick={() => setShowDemoModal(false)}
                        className="hover:text-white"
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
                        <div className="text-[#ea5ec1] animate-pulse">
                          $ querying LLM agent reasoning engine...
                        </div>
                      )}

                      {retrievedResult && (
                        <div className="border-t border-[#3F3F46] pt-3 mt-4 text-[#A1A1AA] space-y-2">
                          <div className="text-[#ea5ec1] text-[10px]">REASONING OUTLINE SELECTION:</div>
                          <p className="text-[10px] text-white bg-slate-900 p-2 rounded">
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
