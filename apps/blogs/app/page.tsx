'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  X, 
  Calendar, 
  User, 
  Clock, 
  Check, 
  ChevronRight, 
  Sparkles,
  Search,
  FileText,
  Database,
  Cpu,
  FileCheck,
  Play,
  ArrowLeft,
  ChevronDown
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

// Vector illustration components for the blog card backgrounds
function VectorIllustration({ type }: { type: BlogPost['imageType'] }) {
  if (type === 'architecture') {
    return (
      <svg className="w-full max-w-[220px]" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="110" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="40" y="40" width="50" height="30" rx="4" fill="#1456f0" fillOpacity="0.08" stroke="#1456f0" strokeWidth="1.5" />
        <rect x="110" y="40" width="50" height="30" rx="4" fill="#ea5ec1" fillOpacity="0.08" stroke="#ea5ec1" strokeWidth="1.5" />
        <path d="M90,55 L110,55" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        <rect x="75" y="90" width="50" height="25" rx="4" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M65,70 L75,90" stroke="#94A3B8" strokeWidth="1" />
        <path d="M135,70 L125,90" stroke="#94A3B8" strokeWidth="1" />
      </svg>
    );
  }
  if (type === 'database') {
    return (
      <svg className="w-full max-w-[220px]" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="110" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
        <ellipse cx="100" cy="45" rx="30" ry="12" fill="none" stroke="#1456f0" strokeWidth="1.8" />
        <path d="M70,45 L70,75 A30,12 0 0 0 130,75 L130,45" fill="none" stroke="#1456f0" strokeWidth="1.8" />
        <path d="M70,75 L70,105 A30,12 0 0 0 130,105 L130,75" fill="none" stroke="#1456f0" strokeWidth="1.8" />
        <circle cx="100" cy="75" r="3" fill="#ea5ec1" />
      </svg>
    );
  }
  if (type === 'code') {
    return (
      <svg className="w-full max-w-[220px]" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="110" rx="6" fill="#0A0A0A" />
        <text x="35" y="55" fill="#64748B" fontFamily="monospace" fontSize="10">const client = new VectorlessClient(&#123;</text>
        <text x="45" y="75" fill="#1456f0" fontFamily="monospace" fontSize="10">  baseUrl: "https://api.vectorless.dev",</text>
        <text x="45" y="95" fill="#ea5ec1" fontFamily="monospace" fontSize="10">  apiKey: "vl_live_..."</text>
        <text x="35" y="115" fill="#64748B" fontFamily="monospace" fontSize="10">&#125;);</text>
      </svg>
    );
  }
  return (
    <svg className="w-full max-w-[220px]" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="160" height="110" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
      <path d="M40,110 L70,50 L100,85 L130,35 L160,95" stroke="#1456f0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="130" cy="35" r="3.5" fill="#ea5ec1" stroke="white" strokeWidth="1.5" />
      <line x1="30" y1="110" x2="170" y2="110" stroke="#94A3B8" strokeWidth="1.5" />
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

  // Categories list
  const categories: Category[] = ['All', 'Product Updates', 'Engineering', 'Guides', 'Features'];

  // Filter Blog Posts
  const filteredPosts = BLOG_POSTS.filter(post => {
    if (selectedCategory === 'All') return true;
    return post.category === selectedCategory;
  });

  const featuredPost = BLOG_POSTS.find(p => p.id === 'retrieval-reasoning-era');
  const gridPosts = selectedCategory === 'All' 
    ? filteredPosts.filter(post => post.id !== 'retrieval-reasoning-era')
    : filteredPosts;

  // Run mock ingestion steps
  useEffect(() => {
    if (showDemoModal) {
      setIngestionStep(0);
      setRetrievedResult(null);
      setHighlightedSection(null);
      
      const timer1 = setTimeout(() => setIngestionStep(1), 800);
      const timer2 = setTimeout(() => setIngestionStep(2), 1600);
      const timer3 = setTimeout(() => setIngestionStep(3), 2400);

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

  return (
    <div id="app-root" className="min-h-screen w-full relative bg-[#FCFCFD] text-[#0A0A0A] flex flex-col justify-between font-sans selection:bg-[#bfdbfe]/50">
      
      {/* Accent Hairline Top Border */}
      <div className="h-1 bg-gradient-to-r from-[#1456F0] to-[#EA5EC1] w-full" />

      {/* Grid Paper Backdrop Wash */}
      <div className="absolute inset-0 grid-paper pointer-events-none opacity-20" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1300px] mx-auto flex-grow flex flex-col justify-between p-6 md:p-12">
        
        {/* Header Navigation */}
        <header id="site-header" className="w-full py-8 flex items-center justify-between border-b border-[#E5E7EB] relative z-20">
          {/* Logo Brand Lockup */}
          <div id="main-logo" className="flex items-center gap-3 cursor-pointer group">
            <VectorlessIcon size={32} />
            <div className="flex flex-col">
              <span className="text-[#0A0A0A] text-xl font-display font-medium tracking-tight">
                Vectorless
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#71717A]">
                Developer Blog
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3F3F46]">
            {['Engine', 'SDKs', 'Documentation', 'Control Plane'].map((link) => (
              <a 
                key={link} 
                href={
                  link === 'Documentation' 
                    ? '/docs' 
                    : link === 'Control Plane' 
                      ? 'https://vectorless.store' 
                      : '#'
                }
                className="hover:text-[#1456F0] transition-colors cursor-pointer"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Header Action Buttons */}
          <div id="header-actions" className="flex items-center gap-4">
            <button 
              id="btn-live-demo"
              onClick={() => setShowDemoModal(true)}
              className="bg-[#0A0A0A] text-white hover:bg-[#1456F0] px-5 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              Try Retrieval Demo
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA5EC1] animate-pulse" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="py-12 flex-grow w-full">
          
          {/* Main Hero Header */}
          <section id="hero-title-section" className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium tracking-tight mb-8">
              Document retrieval for the <span className="font-serif italic bg-gradient-to-r from-[#1456F0] to-[#EA5EC1] bg-clip-text text-transparent">reasoning era</span>.
            </h1>

            {/* Sub-Header Categories Toggle Bar */}
            <div id="categories-filter-bar" className="w-full border border-[#E5E7EB] bg-white/70 backdrop-blur-md p-1 rounded-xl shadow-xs overflow-x-auto flex items-center gap-1 max-w-[650px]">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      isActive 
                      ? 'bg-[#0A0A0A] text-white font-semibold' 
                      : 'text-[#71717A] hover:text-[#0A0A0A] hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Featured Hero Article Post */}
          <AnimatePresence mode="wait">
            {selectedCategory === 'All' && featuredPost && (
              <motion.div
                key="featured-hero-post"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={() => setActiveArticle(featuredPost)}
                className="grid grid-cols-1 md:grid-cols-2 border border-[#E5E7EB] bg-white rounded-2xl shadow-xs overflow-hidden mb-16 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                {/* Left Content Card */}
                <div id="hero-card-left" className="p-8 md:p-12 lg:p-14 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <span className="inline-block bg-[#1456f0]/10 text-[#1456f0] text-[10px] font-mono uppercase tracking-[0.16em] px-3 py-1 rounded-md mb-6 font-semibold">
                      {featuredPost.category}
                    </span>
                    
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium tracking-tight mb-4 group-hover:text-[#1456F0] transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-[#3F3F46] text-sm md:text-base leading-relaxed mb-6 font-normal">
                      {featuredPost.snippet}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-auto">
                    <span className="w-10 h-10 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center transition-all duration-300 group-hover:bg-[#1456F0]">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="font-medium text-xs uppercase tracking-[0.16em] text-[#0A0A0A] font-mono group-hover:underline">
                      Read full article
                    </span>
                  </div>
                </div>

                {/* Right Illustration Card */}
                <div id="hero-card-right" className="bg-[#F8FAFC] border-t md:border-t-0 md:border-l border-[#E5E7EB] flex items-center justify-center p-8 min-h-[250px] md:min-h-full">
                  <VectorIllustration type={featuredPost.imageType} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Three-Column Grid of Blog Cards */}
          <section id="posts-grid-section">
            {selectedCategory !== 'All' && (
              <h3 className="text-sm font-mono uppercase tracking-[0.16em] text-[#71717A] mb-8 flex items-center gap-2">
                <span>Category:</span>
                <span className="text-[#1456F0] font-semibold">{selectedCategory}</span>
                <span className="text-xs font-normal lowercase">({filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''})</span>
              </h3>
            )}

            <motion.div 
              id="grid-articles"
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-y-12"
            >
              <AnimatePresence mode="popLayout">
                {gridPosts.map((post, idx) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    onClick={() => setActiveArticle(post)}
                    className="flex flex-col justify-between group cursor-pointer border border-[#E5E7EB] bg-white p-6 rounded-2xl hover:shadow-md transition-all duration-300 h-full"
                  >
                    <div>
                      {/* Image/Illustration Preview Container */}
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#F8FAFC] mb-5 border border-[#E5E7EB] flex items-center justify-center">
                        <VectorIllustration type={post.imageType} />
                      </div>

                      {/* Header info */}
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] mb-4">
                        <span className="text-[#1456F0] font-semibold">
                          {post.category}
                        </span>
                        <span className="text-[#71717A]">
                          {post.date}
                        </span>
                      </div>

                      {/* Article Title */}
                      <h4 className="text-lg font-display font-medium text-[#0A0A0A] group-hover:text-[#1456F0] transition-colors leading-snug mb-3">
                        {post.title}
                      </h4>

                      <p className="text-xs text-[#3F3F46] leading-relaxed mb-6 font-normal">
                        {post.snippet}
                      </p>
                    </div>

                    {/* Author layout */}
                    <div className="flex items-center gap-3 mt-auto border-t border-[#E5E7EB] pt-4">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB]">
                        <img 
                          src={post.author.avatarUrl} 
                          alt={post.author.name}
                          className="object-cover w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#0A0A0A]">
                          {post.author.name}
                        </span>
                        <span className="text-[10px] text-[#71717A]">
                          {post.author.role}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              {/* Grid empty state */}
              {gridPosts.length === 0 && (
                <div className="col-span-1 md:col-span-3 py-16 text-center text-[#71717A] flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl">
                  <span className="font-display font-medium text-base">No articles found in this category</span>
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className="mt-2 text-[#1456F0] hover:underline text-xs font-semibold cursor-pointer"
                  >
                    View all articles
                  </button>
                </div>
              )}
            </motion.div>
          </section>
          
        </main>

        {/* Footer */}
        <footer id="site-footer" className="text-[#71717A] py-10 border-t border-[#E5E7EB] mt-16 text-xs text-center">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-[#0A0A0A]">
              <VectorlessIcon size={24} />
              <span className="font-display font-medium text-sm">Vectorless</span>
            </div>
            
            <p className="text-xs text-[#71717A]">
              © {new Date().getFullYear()} Vectorless. All rights reserved.
            </p>

            <div className="flex items-center gap-4 text-xs font-medium">
              <a href="#" className="hover:text-[#0A0A0A] transition-colors">Privacy Policy</a>
              <span className="text-[#E5E7EB]">•</span>
              <a href="#" className="hover:text-[#0A0A0A] transition-colors">Terms of Service</a>
            </div>
          </div>
        </footer>

      </div>

      {/* FULL ARTICLE MODAL PANEL */}
      <AnimatePresence>
        {activeArticle && (
          <div id="modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div 
              id="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveArticle(null)}
              className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              id="modal-body"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[750px] max-h-[85vh] bg-white rounded-2xl overflow-y-auto shadow-xl z-10 flex flex-col border border-[#E5E7EB]"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 md:px-8 py-5 border-b border-[#E5E7EB] flex items-center justify-between z-10">
                <span className="bg-[#1456f0]/10 text-[#1456f0] text-[10px] font-mono uppercase tracking-[0.16em] px-3 py-1 rounded-md font-semibold">
                  {activeArticle.category}
                </span>

                <button 
                  onClick={() => setActiveArticle(null)}
                  className="bg-[#FCFCFD] border border-[#E5E7EB] p-2 rounded-lg hover:bg-slate-50 transition-all cursor-pointer text-[#71717A]"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Contents */}
              <div id="modal-content-scroller" className="p-6 md:p-10 select-text flex-grow">
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-6 text-xs text-[#71717A] mb-4 font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1456f0]" />
                    {activeArticle.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1456f0]" />
                    {activeArticle.readTime}
                  </span>
                </div>

                {/* Article Title */}
                <h2 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-[#0A0A0A] mb-6 leading-tight">
                  {activeArticle.title}
                </h2>

                {/* Author Card */}
                <div className="flex items-center gap-4 bg-[#FCFCFD] border border-[#E5E7EB] p-4 rounded-xl mb-8">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB]">
                    <img 
                      src={activeArticle.author.avatarUrl} 
                      alt={activeArticle.author.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-[#0A0A0A]">{activeArticle.author.name}</h5>
                    <p className="text-[10px] text-[#71717A] leading-normal">{activeArticle.author.role}</p>
                  </div>
                </div>

                {/* Rich Image Preview */}
                <div className="relative aspect-[16/9] w-full rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] mb-8 flex items-center justify-center">
                  <VectorIllustration type={activeArticle.imageType} />
                </div>

                {/* Article Paragraphs */}
                <div className="space-y-6 text-sm md:text-base leading-relaxed text-[#3F3F46]">
                  {activeArticle.content.map((paragraph, pIdx) => (
                    <p key={pIdx} className="font-light">
                      {paragraph}
                    </p>
                  ))}
                  
                  {/* Decorative signoff */}
                  <div className="pt-8 border-t border-[#E5E7EB] mt-10">
                    <p className="text-xs italic text-[#71717A] font-serif">
                      Looking to build with structure-preserving retrieval? Try the live interactive sandbox by clicking &quot;Try Retrieval Demo&quot; in the navigation header.
                    </p>
                  </div>
                </div>

              </div>
              
              {/* Footer Actions */}
              <div className="p-6 border-t border-[#E5E7EB] bg-[#FCFCFD] flex justify-end gap-3 rounded-b-2xl">
                <button 
                  onClick={() => setActiveArticle(null)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#1456F0] rounded-lg cursor-pointer transition-all shadow-sm"
                >
                  Close Article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC INTERACTIVE RETRIEVAL DEMO MODAL */}
      <AnimatePresence>
        {showDemoModal && (
          <div id="demo-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              id="demo-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-[#0A0A0A]/40 backdrop-blur-xs"
            />

            <motion.div 
              id="demo-modal-body"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-[650px] bg-white rounded-2xl overflow-hidden shadow-xl z-10 flex flex-col border border-[#E5E7EB] text-[#0A0A0A]"
            >
              {/* Header */}
              <div className="bg-[#FCFCFD] border-b border-[#E5E7EB] p-6 relative">
                <button 
                  onClick={() => setShowDemoModal(false)}
                  className="absolute top-6 right-6 border border-[#E5E7EB] bg-white hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-all text-[#71717A]"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-[#1456F0]/10 text-[#1456F0] text-[9px] font-mono rounded uppercase tracking-wider font-semibold">Sandbox Simulation</span>
                  <span className="text-[#ea5ec1] text-[10px] font-mono flex items-center gap-1">🟢 Gemini-1.5-Pro Active</span>
                </div>

                <h3 className="text-xl font-display font-medium tracking-tight">
                  Vectorless Retrieval Simulator
                </h3>
                <p className="text-xs text-[#71717A] mt-1">
                  See how structure-preserving table-of-contents retrieval works in real-time.
                </p>
              </div>

              {/* Main Scheduler Panel */}
              <div className="p-6 flex-grow overflow-y-auto max-h-[60vh]">
                
                {/* Select Document */}
                <h4 className="text-[10px] uppercase font-mono font-bold text-[#71717A] mb-3 tracking-wider">
                  1. Select a Document to Ingest
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  {[
                    { id: 'vectorless-whitepaper.pdf', size: '2.4 MB', type: 'PDF' },
                    { id: 'fastify-manual.md', size: '480 KB', type: 'Markdown' },
                    { id: 'terms-of-service.docx', size: '1.1 MB', type: 'Word Doc' }
                  ].map((doc) => {
                    const isSel = selectedDoc === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoc(doc.id as any);
                        }}
                        className={`p-4 rounded-xl border flex flex-col justify-between items-start text-left cursor-pointer transition-all duration-300 ${
                          isSel 
                          ? 'border-[#1456F0] bg-[#1456F0]/5 ring-1 ring-[#1456F0]' 
                          : 'border-[#E5E7EB] hover:border-[#1456F0]/55 bg-[#FCFCFD]'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-[#71717A] uppercase font-bold">{doc.type} • {doc.size}</span>
                        <span className="text-xs font-semibold mt-1.5 break-all text-[#0A0A0A]">{doc.id}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ingestion Steps Progress */}
                <div className="border border-[#E5E7EB] bg-[#FCFCFD] rounded-xl p-4 mb-6">
                  <h4 className="text-[9px] font-mono uppercase font-bold text-[#71717A] mb-3 tracking-wider">
                    Processing Logs
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span className="text-[#3F3F46]">Node tree built successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ingestionStep >= 1 ? (
                        <>
                          <span className="text-emerald-500">✓</span>
                          <span className="text-[#3F3F46]">ToC mapping verified</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1456F0] animate-ping" />
                          <span className="text-[#71717A] italic">Verifying ToC map...</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ingestionStep >= 2 ? (
                        <>
                          <span className="text-emerald-500">✓</span>
                          <span className="text-[#3F3F46]">LLM summaries generated (Gemini)</span>
                        </>
                      ) : ingestionStep === 1 ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1456F0] animate-ping" />
                          <span className="text-[#71717A] italic">Summarizing sections...</span>
                        </>
                      ) : (
                        <span className="text-[#71717A] opacity-50">Pending summary triggers</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ingestion Output Document Map */}
                {ingestionStep >= 2 && (
                  <div className="mb-6">
                    <h4 className="text-[10px] uppercase font-mono font-bold text-[#71717A] mb-3 tracking-wider">
                      2. Generated Document Map
                    </h4>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto border border-[#E5E7EB] rounded-xl p-2 bg-white">
                      {selectedDoc === 'vectorless-whitepaper.pdf' ? (
                        <>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 1 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 1: Introduction</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">Summary of structure-preserving retrieval logic over chunking.</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 2 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 2: Architecture Stack</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">Details on the Go core parser and Neon PostgreSQL storage endpoints.</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 3 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 3: Performance & Benchmarks</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">Tabular data results comparing LLM retrieval accuracy on FinanceBench.</p>
                          </div>
                        </>
                      ) : selectedDoc === 'fastify-manual.md' ? (
                        <>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 1 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 1: Getting Started</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">Fastify v5 initialization and simple plugin registration sequences.</p>
                          </div>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 2 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 2: Routing Primitives</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">Prefix and Radix tree path evaluation mechanisms inside request flows.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`p-2.5 rounded-lg border text-xs transition-colors ${highlightedSection === 1 ? 'bg-emerald-50 border-emerald-300' : 'border-slate-100'}`}>
                            <span className="font-semibold text-slate-800">Section 1: Definitions & Scope</span>
                            <p className="text-[11px] text-[#71717A] mt-0.5">API guidelines, user account terms, and database ownership boundaries.</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Retrieval sandbox form */}
                    <form onSubmit={handleRetrieve} className="mt-6">
                      <h4 className="text-[10px] uppercase font-mono font-bold text-[#71717A] mb-3 tracking-wider">
                        3. Type a query to retrieve sections
                      </h4>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <input 
                            type="text" 
                            value={demoQuery}
                            onChange={(e) => setDemoQuery(e.target.value)}
                            placeholder={selectedDoc === 'vectorless-whitepaper.pdf' ? 'e.g. How does performance compare?' : 'e.g. Tell me about routing.'}
                            className="w-full text-xs border border-[#E5E7EB] rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-[#1456F0]"
                          />
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-3" />
                        </div>
                        <button 
                          type="submit"
                          disabled={isRetrieving || !demoQuery.trim()}
                          className="bg-[#0A0A0A] hover:bg-[#1456F0] text-white px-5 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isRetrieving ? 'Reasoning...' : 'Retrieve'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Retrieval Results Output */}
                <AnimatePresence>
                  {retrievedResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-4"
                    >
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#ea5ec1] font-bold uppercase mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#ea5ec1]" />
                        <span>LLM Agent Retrieval Output</span>
                      </div>
                      <pre className="text-xs text-[#0A0A0A] font-sans whitespace-pre-wrap leading-relaxed">
                        {retrievedResult}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-5 px-6 border-t border-slate-200 flex justify-end rounded-b-2xl">
                <button 
                  onClick={() => setShowDemoModal(false)}
                  className="px-5 py-2 hover:bg-slate-200 text-slate-700 bg-slate-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
