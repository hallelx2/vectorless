'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  X,
  Calendar,
  Clock,
  Search,
  BookOpen,
  Terminal,
  ChevronRight,
  Menu,
  Sparkles,
  Newspaper,
  Zap,
  FileText,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { VectorlessIcon, VectorlessDot } from './VectorlessIcon';

/* ─── Types ─── */
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

/* ─── Authors ─── */
const AUTHORS: Record<string, Author> = {
  hallel: {
    name: 'Oludele Halleluyah',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'Founder & Principal Engineer',
  },
  jane: {
    name: 'Jane Cooper',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'AI Research Specialist',
  },
  guy: {
    name: 'Guy Hawkins',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
    role: 'Infrastructure Architect',
  },
};

/* ─── Blog Data ─── */
const BLOG_POSTS: BlogPost[] = [
  {
    id: 'retrieval-reasoning-era',
    title: 'Retrieval for the reasoning era: beyond vector search',
    snippet:
      'Why traditional RAG chunking is a black box that destroys document structure, and how LLM reasoning over document maps restores it.',
    category: 'Engineering',
    date: 'Jun 20, 2026',
    readTime: '5 min read',
    author: AUTHORS.hallel,
    imageType: 'architecture',
    content: [
      'Traditional RAG shatters your documents into arbitrary 500-token chunks. It computes vector embeddings for each chunk and places them in a vector database. But this similarity search is a black box. It has no understanding of headings, lists, table hierarchies, or structural flow.',
      'Vectorless takes a fundamentally different approach. We believe that documents have structure for a reason. By preserving document trees (headings, sections, chapters) and building section-by-section maps, we let LLM agents read and navigate the document outline like a human does.',
      'Why this matters:',
      '1. True Citations: Since sections are preserved, citations refer to actual logical units, not arbitrary character ranges.',
      '2. Full Context: When an agent selects a section, it gets the entire, unbroken section context.',
      '3. Deterministic Explanation: You can inspect exactly why the agent chose a particular section, making retrieval transparent.',
    ],
  },
  {
    id: 'self-hosting-vectorless-engine',
    title: 'Self-hosting the Vectorless Engine with Docker and Neon',
    snippet:
      'A step-by-step walkthrough to deploy the core Go retrieval engine in your private cloud with secure database isolation.',
    category: 'Guides',
    date: 'Jun 18, 2026',
    readTime: '6 min read',
    author: AUTHORS.hallel,
    imageType: 'database',
    content: [
      'The core Vectorless engine is open-source and built for speed in Go. To run it in your own environment, you only need three infrastructure primitives: PostgreSQL (with pgvector), S3-compatible object storage (e.g. Cloudflare R2 or MinIO), and a job queue (like River or QStash).',
      'In this post, we demonstrate how to spin up the Docker-based container stack, configure the Admin API endpoints, and establish encrypted BYOK (Bring Your Own Key) access for your organizational users.',
      'We will also explore setting up tenant boundaries so that document parser caches do not cross authorization scopes, guaranteeing metadata security.',
    ],
  },
  {
    id: 'llm-reasoning-retrieval',
    title: 'How LLM reasoning models solve the chunk-overlap nightmare',
    snippet:
      'How advanced reasoning loops avoid retrieval failures by reading summaries before pulling full-text contents.',
    category: 'Features',
    date: 'Jun 14, 2026',
    readTime: '4 min read',
    author: AUTHORS.guy,
    imageType: 'code',
    content: [
      'In classical retrieval, developers tweak overlap percentages to avoid splitting sentences in half. This is a fragile bandage. By generating an interactive table of contents (ToC) with summaries, we present the agent with a clean, high-level map.',
      'The agent reasons about which sections are relevant *before* reading them, bypassing overlap limits completely. This post explains the mathematical and logical validation behind this flow.',
    ],
  },
  {
    id: 'vectorless-release-1-0',
    title: 'Vectorless Release 1.0.0: Ingestion Streaming & Citations',
    snippet:
      'Announcing the stable v1 release of the Vectorless engine. Built on a modular Go core with SSE streaming and unified citations.',
    category: 'Product Updates',
    date: 'Jun 05, 2026',
    readTime: '3 min read',
    author: AUTHORS.hallel,
    imageType: 'architecture',
    content: [
      'We are thrilled to launch the fully redesigned Vectorless Core Engine 1.0.0. Built natively in Go for ultra-fast document parsing and tree building, this release is exclusively focused on making document retrieval deterministic and trace-verifiable.',
      'Key Features in 1.0:',
      '- Server-Sent Events Ingestion: Live progress logs while processing heavy PDFs and Word documents.',
      '- Integrated Citation Validation: Guarantee that retrieved chunks match the exact heading paths.',
      '- Native ConnectRPC & REST support: Expose standard JSON endpoints alongside protobuf definitions.',
    ],
  },
  {
    id: 'evaluating-retrieval-financebench',
    title: 'Evaluating Retrieval Accuracy: FinanceBench Case Study',
    snippet:
      'How structure-preserving retrieval outperforms traditional LangChain chunking setups on complex quarterly financial filings.',
    category: 'Engineering',
    date: 'May 28, 2026',
    readTime: '8 min read',
    author: AUTHORS.jane,
    imageType: 'benchmark',
    content: [
      'Evaluating retrieval systems is notoriously hard. In this study, we ran the FinanceBench benchmark dataset across three configurations: (A) Traditional recursive chunking, (B) Parent-document retrieval, and (C) Vectorless structure-preserving retrieval.',
      'Vectorless achieved 94.2% accuracy on complex tabular cross-referencing questions, compared to 62.1% for traditional chunking, because it did not truncate financial table nodes.',
    ],
  },
  {
    id: 'hybrid-retrieval-trees',
    title: 'Hybrid Retrieval: Combining Structural Trees with Keyword Search',
    snippet:
      'How the Vectorless hybrid strategy overlays BM25 keyword matching with LLM reasoning maps for the best of both worlds.',
    category: 'Engineering',
    date: 'May 14, 2026',
    readTime: '5 min read',
    author: AUTHORS.jane,
    imageType: 'architecture',
    content: [
      'While LLM reasoning over document outlines yields superior accuracy for contextual questions, sometimes users search for highly specific keywords or exact code definitions.',
      'To address this, Vectorless 1.0 supports a hybrid strategy. It performs a fast lexical pre-scan (BM25) over the document node tree to identify candidate sections, which are then annotated directly inside the Document Map.',
      'The LLM agent then reasons over both the semantic summaries and the keyword frequency hits to make the final retrieval decision. This combines the speed of classic search with the intelligence of agentic reasoning.',
    ],
  },
];

/* ─── Blueprint Illustrations (SVG Schematics) ─── */
function BlueprintIllustration({ type, large = false }: { type: BlogPost['imageType']; large?: boolean }) {
  const h = large ? 'h-[200px]' : 'h-[140px]';
  return (
    <div
      className={`w-full relative flex items-center justify-center bg-[#FAFAFA] border border-border-light rounded-xl overflow-hidden ${h} p-6 transition-all duration-500 group-hover:border-brand-blue/20 group-hover:bg-[#F8FAFF]`}
    >
      {/* Coordinate overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-3 left-3 font-data text-[7px] text-text-muted tracking-wider">
          SYS_REF // VECTORLESS
        </div>
        <div className="absolute bottom-3 right-3 font-data text-[7px] text-text-muted tracking-wider">
          SCALE // 1:1
        </div>
        {/* Cross-hair */}
        <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-black/[0.04]" />
        <div className="absolute inset-y-6 left-1/2 border-l border-dashed border-black/[0.04]" />
      </div>

      {type === 'architecture' && (
        <svg className="w-full h-full" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hierarchy tree */}
          <path d="M120 18 L60 55 H180 Z" stroke="#1456F0" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.2" />
          <line x1="120" y1="18" x2="120" y2="100" stroke="#1456F0" strokeWidth="1" opacity="0.15" />
          <line x1="120" y1="18" x2="120" y2="50" stroke="#1456F0" strokeWidth="1.2" />
          <line x1="120" y1="50" x2="60" y2="75" stroke="#1456F0" strokeWidth="1.2" />
          <line x1="120" y1="50" x2="180" y2="75" stroke="#1456F0" strokeWidth="1.2" />
          <line x1="60" y1="75" x2="40" y2="100" stroke="#0A0A0A" strokeWidth="0.8" opacity="0.4" />
          <line x1="60" y1="75" x2="80" y2="100" stroke="#0A0A0A" strokeWidth="0.8" opacity="0.4" />
          <line x1="180" y1="75" x2="160" y2="100" stroke="#0A0A0A" strokeWidth="0.8" opacity="0.4" />
          <line x1="180" y1="75" x2="200" y2="100" stroke="#0A0A0A" strokeWidth="0.8" opacity="0.4" />

          {/* Node dots */}
          <circle cx="120" cy="18" r="5" fill="#1456F0" />
          <circle cx="120" cy="18" r="5" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="120" cy="50" r="3.5" fill="#0A0A0A" />
          <circle cx="60" cy="75" r="3.5" fill="#0A0A0A" />
          <circle cx="180" cy="75" r="3.5" fill="#0A0A0A" />
          <circle cx="40" cy="100" r="2.5" fill="#71717A" />
          <circle cx="80" cy="100" r="2.5" fill="#71717A" />
          <circle cx="160" cy="100" r="2.5" fill="#71717A" />
          <circle cx="200" cy="100" r="2.5" fill="#71717A" />

          {/* Target callout */}
          <circle cx="120" cy="100" r="6" fill="#EA5EC1" fillOpacity="0.15" />
          <circle cx="120" cy="100" r="3" fill="#EA5EC1" />
          <line x1="126" y1="100" x2="155" y2="100" stroke="#EA5EC1" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="158" y="103" className="font-data" fontSize="7" fill="#EA5EC1">
            TARGET
          </text>

          {/* Label */}
          <rect x="96" y="7" width="48" height="7" rx="1.5" fill="#1456F0" fillOpacity="0.08" />
          <text x="100" y="13" className="font-data" fontSize="5.5" fill="#1456F0">
            node.root
          </text>
        </svg>
      )}

      {type === 'database' && (
        <svg className="w-full h-full" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="35" y="10" width="170" height="100" rx="4" stroke="black" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.1" />
          <g transform="translate(75, 15)">
            {/* DB cylinders */}
            <ellipse cx="45" cy="14" rx="30" ry="8" stroke="#0A0A0A" strokeWidth="1" />
            <path d="M15,14 L15,42 A30,8 0 0 0 75,42 L75,14" stroke="#0A0A0A" strokeWidth="1" fill="none" />
            <ellipse cx="45" cy="42" rx="30" ry="8" stroke="#1456F0" strokeWidth="1" fill="#1456F0" fillOpacity="0.04" />
            <path d="M15,42 L15,70 A30,8 0 0 0 75,70 L75,42" stroke="#1456F0" strokeWidth="1" fill="none" />
            <ellipse cx="45" cy="70" rx="30" ry="8" stroke="#EA5EC1" strokeWidth="1" fill="#EA5EC1" fillOpacity="0.06" />

            {/* Index callout */}
            <line x1="75" y1="42" x2="105" y2="42" stroke="#1456F0" strokeWidth="0.8" />
            <circle cx="105" cy="42" r="2" fill="#1456F0" />
            <text x="110" y="45" className="font-data" fontSize="6.5" fill="#1456F0">
              v_index
            </text>

            {/* Data flow arrows */}
            <line x1="45" y1="80" x2="45" y2="92" stroke="#EA5EC1" strokeWidth="0.8" markerEnd="url(#arrowPink)" />
            <text x="20" y="98" className="font-data" fontSize="5.5" fill="#EA5EC1">
              write_buffer
            </text>
          </g>
          <defs>
            <marker id="arrowPink" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M0,0 L6,3 L0,6 Z" fill="#EA5EC1" />
            </marker>
          </defs>
        </svg>
      )}

      {type === 'code' && (
        <svg className="w-full h-full" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="10" width="180" height="100" rx="6" fill="#0A0A0A" />
          <rect x="30" y="10" width="180" height="100" rx="6" stroke="#3F3F46" strokeWidth="0.6" />
          <g transform="translate(42, 22)">
            {/* Traffic lights */}
            <circle cx="6" cy="6" r="3" fill="#EF4444" />
            <circle cx="18" cy="6" r="3" fill="#F59E0B" />
            <circle cx="30" cy="6" r="3" fill="#10B981" />

            {/* Code lines */}
            <rect x="6" y="22" width="50" height="4.5" rx="2" fill="#64748B" opacity="0.6" />
            <rect x="6" y="33" width="110" height="4.5" rx="2" fill="#1456F0" opacity="0.8" />
            <rect x="18" y="44" width="90" height="4.5" rx="2" fill="#EA5EC1" opacity="0.7" />
            <rect x="18" y="55" width="60" height="4.5" rx="2" fill="#64748B" opacity="0.4" />
            <rect x="6" y="66" width="35" height="4.5" rx="2" fill="#10B981" opacity="0.6" />
            <rect x="6" y="77" width="75" height="4.5" rx="2" fill="#3B82F6" opacity="0.3" />
          </g>
        </svg>
      )}

      {type === 'benchmark' && (
        <svg className="w-full h-full" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Grid lines */}
          {[30, 50, 70, 90].map((y) => (
            <line key={y} x1="35" y1={y} x2="210" y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
          ))}

          {/* Axes */}
          <line x1="35" y1="15" x2="35" y2="100" stroke="#0A0A0A" strokeWidth="1.2" />
          <line x1="35" y1="100" x2="210" y2="100" stroke="#0A0A0A" strokeWidth="1.2" />

          {/* Baseline curve (traditional) */}
          <path
            d="M35,95 C60,90 90,82 120,78 S170,72 210,68"
            stroke="#A1A1AA"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Vectorless performance curve */}
          <path
            d="M35,95 C60,85 90,50 120,42 S170,22 210,15"
            stroke="#1456F0"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Area under Vectorless curve */}
          <path
            d="M35,95 C60,85 90,50 120,42 S170,22 210,15 L210,100 L35,100 Z"
            fill="#1456F0"
            fillOpacity="0.03"
          />

          {/* Data points */}
          <circle cx="120" cy="42" r="4" fill="white" stroke="#1456F0" strokeWidth="1.5" />
          <circle cx="210" cy="15" r="5" fill="#EA5EC1" />
          <circle cx="210" cy="15" r="5" fill="none" stroke="white" strokeWidth="1.5" />

          {/* Annotation */}
          <line x1="210" y1="20" x2="210" y2="100" stroke="#EA5EC1" strokeWidth="0.6" strokeDasharray="2 2" />
          <text x="168" y="94" className="font-data" fontSize="7" fill="#EA5EC1" fontWeight="600">
            94.2% ACC
          </text>

          {/* Legend */}
          <line x1="45" y1="108" x2="55" y2="108" stroke="#1456F0" strokeWidth="1.5" />
          <text x="58" y="111" className="font-data" fontSize="5" fill="#71717A">
            Vectorless
          </text>
          <line x1="100" y1="108" x2="110" y2="108" stroke="#A1A1AA" strokeWidth="1.5" />
          <text x="113" y="111" className="font-data" fontSize="5" fill="#71717A">
            Traditional
          </text>
        </svg>
      )}
    </div>
  );
}

/* ─── Main Blog Page ─── */
export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Interactive retrieval sandbox state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'vectorless-whitepaper.pdf' | 'fastify-manual.md' | 'terms-of-service.docx'>('vectorless-whitepaper.pdf');
  const [ingestionStep, setIngestionStep] = useState(0);
  const [demoQuery, setDemoQuery] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedResult, setRetrievedResult] = useState<string | null>(null);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ingestion simulation
  useEffect(() => {
    if (showDemoModal) {
      const t1 = setTimeout(() => setIngestionStep(1), 700);
      const t2 = setTimeout(() => setIngestionStep(2), 1400);
      const t3 = setTimeout(() => setIngestionStep(3), 2100);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [showDemoModal, selectedDoc]);

  const openSandbox = useCallback(() => {
    setIngestionStep(0);
    setRetrievedResult(null);
    setHighlightedSection(null);
    setShowDemoModal(true);
  }, []);

  const selectDoc = useCallback((docId: typeof selectedDoc) => {
    setIngestionStep(0);
    setRetrievedResult(null);
    setHighlightedSection(null);
    setSelectedDoc(docId);
  }, []);

  const handleRetrieve = useCallback((e: React.FormEvent) => {
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
            'Section 3: Performance & Benchmarks\n\nVectorless outperformed traditional chunking systems on quarterly reports, achieving 94.2% accuracy. Because it does not split financial tabular nodes, it avoids destroying structural context.'
          );
        } else {
          setHighlightedSection(1);
          setRetrievedResult(
            'Section 1: Introduction to Reasoned Retrieval\n\nInstead of chunking documents into arbitrary sizes and calculating embeddings, Vectorless builds a hierarchical structure tree which is summarized section-by-section.'
          );
        }
      } else if (selectedDoc === 'fastify-manual.md') {
        if (demoQuery.toLowerCase().includes('route') || demoQuery.toLowerCase().includes('matching')) {
          setHighlightedSection(2);
          setRetrievedResult(
            'Section 2: Routing Primitives\n\nFastify uses a radix tree router internally for extremely fast route resolution. It parses registered routes into prefix trees for O(L) matching speed.'
          );
        } else {
          setHighlightedSection(1);
          setRetrievedResult(
            'Section 1: Getting Started\n\nInstall fastify using npm. Boot the server and register core plugins to set up dynamic request and response validation pipelines.'
          );
        }
      } else {
        setHighlightedSection(1);
        setRetrievedResult(
          'Section 1: Definitions & Scope\n\nThis document governs the terms of service for the Vectorless API. Under self-hosted instances, your organization retains complete data ownership.'
        );
      }
    }, 1200);
  }, [demoQuery, selectedDoc]);

  const categories: Category[] = ['All', 'Product Updates', 'Engineering', 'Guides', 'Features'];

  const filteredPosts = BLOG_POSTS.filter((post) => {
    if (selectedCategory === 'All') return true;
    return post.category === selectedCategory;
  });

  const featuredPost = BLOG_POSTS[0]; // First post is the featured one
  const displayPosts = selectedCategory === 'All' ? BLOG_POSTS.slice(1) : filteredPosts;

  return (
    <div className="min-h-screen w-full bg-white text-[#0A0A0A] font-sans selection:bg-[#bfdbfe] selection:text-[#1d4ed8]">
      {/* ═══ FLOATING GLASS NAVBAR ═══ */}
      <nav className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
        <div
          className={[
            'mx-auto flex max-w-[1200px] items-center justify-between gap-2',
            'rounded-full border h-14 sm:h-16 pl-5 pr-2 sm:pl-6 sm:pr-2',
            'backdrop-blur-xl transition-all duration-500',
            scrolled
              ? 'bg-white/85 border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              : 'bg-white/50 border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
          ].join(' ')}
        >
          <div
            onClick={() => setActiveArticle(null)}
            className="font-display text-xl sm:text-[22px] font-medium tracking-tight text-[#0A0A0A] flex items-center gap-2.5 cursor-pointer"
          >
            <VectorlessDot size={22} />
            <span>Vectorless</span>
          </div>

          <div className="hidden md:flex items-center gap-0.5">
            {[
              { label: 'How it works', href: 'https://vectorless.store/#how' },
              { label: 'Docs', href: 'https://docs.vectorless.store' },
              { label: 'Whitepaper', href: 'https://vectorless.store/whitepaper' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13.5px] font-medium text-[#0A0A0A]/80 px-3.5 py-2 rounded-full hover:bg-black/[0.04] hover:text-[#0A0A0A] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-[13.5px] font-semibold text-brand-blue bg-brand-blue/[0.06] px-3.5 py-2 rounded-full">
              Blog
            </span>
            <Link
              href="https://vectorless.store/#pricing"
              className="text-[13.5px] font-medium text-[#0A0A0A]/80 px-3.5 py-2 rounded-full hover:bg-black/[0.04] hover:text-[#0A0A0A] transition-all duration-200"
            >
              Pricing
            </Link>
            <div className="w-px h-4 bg-black/10 mx-2" />
            <Link
              href="https://vectorless.store/login"
              className="text-[13.5px] font-medium text-[#0A0A0A]/70 px-3 py-2 hover:text-[#0A0A0A] transition-colors"
            >
              Login
            </Link>
            <Link
              href="https://vectorless.store/register"
              className="group relative inline-flex items-center gap-2.5 bg-[#0A0A0A] text-white pl-5 pr-2 py-2 rounded-full text-[13.5px] font-medium hover:bg-black transition-colors ml-1"
            >
              <span className="inline-flex overflow-hidden h-[22px]">
                <span className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
                  <span className="flex h-[22px] items-center">Start free</span>
                  <span className="flex h-[22px] items-center">Start free</span>
                </span>
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <ArrowRight className="h-3.5 w-3.5 text-[#0A0A0A] transition-transform duration-500 group-hover:-rotate-45" />
              </span>
            </Link>
          </div>

          <button className="md:hidden text-[#0A0A0A] p-2" onClick={() => setIsNavOpen(!isNavOpen)} aria-label="Toggle menu">
            {isNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mx-auto mt-2 max-w-[1200px] rounded-2xl border border-black/10 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-5 flex flex-col gap-3"
            >
              {['How it works', 'Docs', 'Whitepaper', 'Pricing'].map((item) => (
                <Link
                  key={item}
                  href="#"
                  onClick={() => setIsNavOpen(false)}
                  className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5"
                >
                  {item}
                </Link>
              ))}
              <span className="text-[15px] font-semibold text-brand-blue bg-brand-blue/5 p-2 rounded-lg">Blog</span>
              <div className="h-px w-full bg-black/10 my-1" />
              <Link
                href="https://vectorless.store/login"
                onClick={() => setIsNavOpen(false)}
                className="text-[15px] font-medium text-[#0A0A0A] p-2 rounded-lg hover:bg-black/5"
              >
                Login
              </Link>
              <Link
                href="https://vectorless.store/register"
                onClick={() => setIsNavOpen(false)}
                className="bg-[#0A0A0A] text-white px-4 py-3 rounded-full text-[14px] font-medium hover:bg-black transition-colors flex items-center justify-center mt-1"
              >
                Start free →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence mode="wait">
        {activeArticle ? (
          /* ━━━ ARTICLE READER VIEW ━━━ */
          <motion.div
            key="article-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen bg-white"
          >
            {/* Reader header band */}
            <div className="border-b border-border-gray bg-white/90 backdrop-blur-lg pt-24 pb-16 px-6 md:px-12 relative overflow-hidden">
              <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_60%)] pointer-events-none opacity-40" />
              <div className="relative z-10 max-w-[720px] mx-auto">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="group inline-flex items-center gap-2 text-text-muted hover:text-[#0A0A0A] transition-colors mb-8"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-data text-[11px] uppercase tracking-[0.15em]">Back to all posts</span>
                </button>

                <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-[0.16em] text-text-muted mb-6">
                  <span className="text-brand-blue font-semibold">{activeArticle.category}</span>
                  <span className="w-1 h-1 rounded-full bg-border-gray" />
                  <span>{activeArticle.date}</span>
                  <span className="w-1 h-1 rounded-full bg-border-gray" />
                  <span>{activeArticle.readTime}</span>
                </div>

                <h1 className="text-[36px] md:text-[52px] font-serif text-[#0A0A0A] leading-[1.06] tracking-tight mb-8">
                  {activeArticle.title}
                </h1>

                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img
                      src={activeArticle.author.avatarUrl}
                      alt={activeArticle.author.name}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#0A0A0A]">{activeArticle.author.name}</span>
                    <span className="text-[10px] font-data text-text-muted tracking-wider uppercase">
                      {activeArticle.author.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reader body */}
            <div className="max-w-[720px] mx-auto px-6 md:px-12 py-16 md:py-20">
              <article className="space-y-7">
                {activeArticle.content.map((paragraph, pIdx) => {
                  if (/^\d+\.\s/.test(paragraph)) {
                    const parts = paragraph.split(/^\d+\.\s/);
                    const titleAndText = parts[1].split(/:\s/);
                    return (
                      <div key={pIdx} className="pl-6 border-l-2 border-brand-blue/30 my-10 py-1">
                        {titleAndText.length > 1 ? (
                          <>
                            <h4 className="font-serif text-xl text-[#0A0A0A] mb-2">{titleAndText[0]}</h4>
                            <p className="text-[16px] text-text-secondary leading-relaxed">{titleAndText[1]}</p>
                          </>
                        ) : (
                          <p className="text-[16px] text-text-secondary leading-relaxed">{parts[1]}</p>
                        )}
                      </div>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <div key={pIdx} className="pl-6 border-l border-border-gray py-1">
                        <p className="text-[16px] text-text-secondary leading-relaxed">{paragraph.slice(2)}</p>
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-[17px] md:text-[18px] text-text-secondary leading-[1.75] font-light">
                      {paragraph}
                    </p>
                  );
                })}
              </article>

              {/* Bottom navigation */}
              <div className="mt-20 pt-8 border-t border-border-gray flex items-center justify-between">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="group inline-flex items-center gap-2.5 border border-border-gray hover:border-brand-blue hover:bg-brand-blue/[0.02] px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-blue group-hover:-translate-x-0.5 transition-all" />
                  <span>Return to Index</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ━━━ MAGAZINE INDEX VIEW ━━━ */
          <motion.div
            key="magazine-index"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ─── HERO SECTION ─── */}
            <section className="relative min-h-[85vh] flex items-end overflow-hidden">
              {/* Gradient backdrop */}
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.07)_0%,rgba(234,94,193,0.035)_40%,transparent_70%)] blur-[50px] pointer-events-none" />
              {/* Grid paper */}
              <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)] pointer-events-none opacity-60" />

              <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 pb-16 pt-36 md:pt-44">
                <div className="max-w-[920px]">
                  {/* Chip */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-border-gray bg-white/80 backdrop-blur-sm mb-8 shadow-sm"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-blue" />
                    </span>
                    <span className="font-data text-[10px] font-medium text-text-muted tracking-[0.16em] uppercase">
                      Vectorless Engineering Journal
                    </span>
                  </motion.div>

                  {/* Headline */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="font-serif text-[48px] sm:text-[64px] md:text-[80px] lg:text-[92px] font-normal leading-[0.92] tracking-tight text-[#0A0A0A] mb-8"
                  >
                    Retrieval,{' '}
                    <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink">
                      rethought.
                    </span>
                  </motion.h1>

                  {/* Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-lg md:text-xl font-light text-text-secondary leading-relaxed max-w-[640px]"
                  >
                    A technical journal on the design of structure-preserving retrieval architectures, no-chunking
                    models, and deterministic RAG systems for AI agents.
                  </motion.p>
                </div>

                {/* Decorative bottom border with date */}
                <div className="mt-16 pt-6 border-t border-[#0A0A0A] flex items-center justify-between">
                  <div className="font-data text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Vol. 01 — {new Date().getFullYear()}
                  </div>
                  <div className="hidden sm:flex items-center gap-4 font-data text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    <span>{BLOG_POSTS.length} Articles Published</span>
                    <span className="w-1 h-1 rounded-full bg-brand-pink" />
                    <span>Updated Weekly</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── CATEGORIES + SANDBOX BAR ─── */}
            <section className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-border-gray">
              <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-data uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-[#0A0A0A] text-white font-semibold shadow-sm'
                            : 'text-text-muted hover:text-[#0A0A0A] hover:bg-black/[0.04]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={openSandbox}
                  className="group inline-flex items-center gap-2 bg-brand-blue hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-data text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer self-start sm:self-auto"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Try Retrieval</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                </button>
              </div>
            </section>

            {/* ─── FEATURED ARTICLE (FULL WIDTH) ─── */}
            <AnimatePresence mode="wait">
              {selectedCategory === 'All' && featuredPost && (
                <motion.section
                  key="featured-hero"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="border-b border-border-gray"
                >
                  <div
                    onClick={() => setActiveArticle(featuredPost)}
                    className="group max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-20 cursor-pointer"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                      <div className="lg:col-span-7 flex flex-col justify-between min-h-[260px]">
                        <div>
                          <div className="flex items-center gap-3 font-data text-[10px] uppercase tracking-[0.16em] text-text-muted mb-5">
                            <span className="text-brand-blue font-semibold">{featuredPost.category}</span>
                            <span className="w-1 h-1 rounded-full bg-border-gray" />
                            <span>{featuredPost.date}</span>
                            <span className="w-1 h-1 rounded-full bg-border-gray" />
                            <span>{featuredPost.readTime}</span>
                          </div>

                          <h2 className="text-[32px] md:text-[44px] font-serif text-[#0A0A0A] group-hover:text-brand-blue transition-colors duration-300 leading-[1.06] tracking-tight mb-6">
                            {featuredPost.title}
                          </h2>

                          <p className="text-base md:text-lg text-text-secondary font-light leading-relaxed max-w-[600px] mb-8">
                            {featuredPost.snippet}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <img
                                src={featuredPost.author.avatarUrl}
                                alt={featuredPost.author.name}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-[#0A0A0A]">{featuredPost.author.name}</span>
                              <span className="text-[9px] font-data text-text-muted uppercase tracking-wider">
                                {featuredPost.author.role}
                              </span>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2 text-xs font-data uppercase tracking-[0.18em] font-semibold text-[#0A0A0A] group-hover:text-brand-blue transition-colors">
                            <span>Read article</span>
                            <ArrowRight className="w-4 h-4 text-brand-pink group-hover:translate-x-1.5 transition-transform duration-300" />
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 w-full">
                        <BlueprintIllustration type={featuredPost.imageType} large />
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* ─── ARTICLE GRID ─── */}
            <section className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16">
              {selectedCategory === 'All' && (
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-data text-[11px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    Latest Articles
                  </h2>
                  <div className="h-px flex-1 bg-border-gray ml-6" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-gray border border-border-gray rounded-xl overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {displayPosts.map((post, idx) => (
                    <motion.article
                      key={post.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      onClick={() => setActiveArticle(post)}
                      className="group flex flex-col cursor-pointer bg-white hover:bg-[#FAFBFF] transition-colors duration-300"
                    >
                      <div className="flex flex-col h-full p-7 md:p-8">
                        {/* Meta */}
                        <div className="flex items-center justify-between font-data text-[9px] uppercase tracking-[0.16em] text-text-muted mb-5">
                          <span className="text-brand-blue font-semibold">{post.category}</span>
                          <span>{post.date}</span>
                        </div>

                        {/* Headline */}
                        <h3 className="text-xl md:text-2xl font-serif text-[#0A0A0A] group-hover:text-brand-blue transition-colors duration-300 leading-tight mb-4">
                          {post.title}
                        </h3>

                        {/* Snippet */}
                        <p className="text-[13px] text-text-secondary leading-relaxed font-light mb-6 flex-grow">
                          {post.snippet}
                        </p>

                        {/* Blueprint */}
                        <div className="mb-6">
                          <BlueprintIllustration type={post.imageType} />
                        </div>

                        {/* Author + Read link */}
                        <div className="flex items-center justify-between pt-5 border-t border-border-light">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-border-gray">
                              <img
                                src={post.author.avatarUrl}
                                alt={post.author.name}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold text-[#0A0A0A]">{post.author.name}</span>
                              <span className="text-[8px] font-data text-text-muted uppercase tracking-wider">
                                {post.readTime}
                              </span>
                            </div>
                          </div>

                          <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-brand-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>

              {/* Empty State */}
              {displayPosts.length === 0 && (
                <div className="py-24 text-center border border-dashed border-border-gray rounded-2xl flex flex-col items-center justify-center gap-4 bg-[#FCFCFD] mt-4">
                  <Newspaper className="w-8 h-8 text-text-muted/40" />
                  <span className="font-display font-medium text-text-secondary">No matching articles found</span>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="text-xs font-data uppercase tracking-wider text-brand-blue hover:underline cursor-pointer"
                  >
                    Show all articles
                  </button>
                </div>
              )}
            </section>

            {/* ─── NEWSLETTER CTA ─── */}
            <section className="border-t border-border-gray">
              <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-20 md:py-28">
                <div className="max-w-[600px] mx-auto text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-gray bg-white mb-6">
                    <Sparkles className="w-3 h-3 text-brand-pink" />
                    <span className="font-data text-[10px] uppercase tracking-[0.16em] text-text-muted font-medium">
                      Stay in the loop
                    </span>
                  </div>

                  <h2 className="font-serif text-[32px] md:text-[42px] leading-[1.08] tracking-tight text-[#0A0A0A] mb-4">
                    Engineering updates,{' '}
                    <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink">
                      delivered.
                    </span>
                  </h2>

                  <p className="text-base text-text-secondary font-light leading-relaxed mb-8 max-w-[440px] mx-auto">
                    Get new posts on retrieval architectures, product releases, and the future of document AI — straight to
                    your inbox.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-[460px] mx-auto">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="flex-1 px-4 py-3 border border-border-gray rounded-full text-sm bg-[#FCFCFD] focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 transition-all placeholder:text-text-muted/60"
                    />
                    <button className="bg-[#0A0A0A] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-brand-blue transition-colors duration-300 cursor-pointer whitespace-nowrap">
                      Subscribe →
                    </button>
                  </div>

                  <p className="mt-4 text-[11px] text-text-muted font-data">
                    No spam. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-border-gray">
              <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    setActiveArticle(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <VectorlessDot size={18} />
                  <span className="font-display font-medium text-sm text-[#0A0A0A]">Vectorless</span>
                </div>

                <p className="text-[11px] font-data text-text-muted uppercase tracking-wider">
                  © {new Date().getFullYear()} Vectorless. All rights reserved.
                </p>

                <div className="flex items-center gap-5 text-[11px] font-data text-text-muted uppercase tracking-wider">
                  <a href="#" className="hover:text-[#0A0A0A] transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="hover:text-[#0A0A0A] transition-colors">
                    Terms
                  </a>
                  <a
                    href="https://github.com/hallelx2/vectorless"
                    className="hover:text-[#0A0A0A] transition-colors flex items-center gap-1"
                  >
                    GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INTERACTIVE RETRIEVAL SANDBOX MODAL ═══ */}
      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-[#0A0A0A]/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-[880px] h-[90vh] md:h-[700px] bg-white rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row border border-border-gray"
            >
              {/* Left Panel: Controls */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border-gray">
                <div>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="px-2.5 py-1 bg-brand-blue/10 text-brand-blue text-[9px] font-data rounded-full uppercase tracking-wider font-semibold">
                      Interactive API
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-data text-text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-medium tracking-tight mb-2">Retrieval Sandbox</h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-8">
                    Select a document, watch structural ingestion, then run reasoning queries to see how Vectorless
                    navigates document maps.
                  </p>

                  <h4 className="text-[9px] uppercase font-data font-bold text-text-muted mb-3 tracking-wider">
                    Select Document
                  </h4>
                  <div className="space-y-2 mb-6">
                    {[
                      { id: 'vectorless-whitepaper.pdf' as const, size: '2.4 MB', type: 'PDF' },
                      { id: 'fastify-manual.md' as const, size: '480 KB', type: 'Markdown' },
                      { id: 'terms-of-service.docx' as const, size: '1.1 MB', type: 'Word Doc' },
                    ].map((doc) => {
                      const isSel = selectedDoc === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => selectDoc(doc.id)}
                          className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${
                            isSel
                              ? 'border-brand-blue bg-brand-blue/[0.04] shadow-sm'
                              : 'border-border-gray hover:border-black/20 bg-[#FCFCFD]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className={`w-4 h-4 ${isSel ? 'text-brand-blue' : 'text-text-muted'}`} />
                            <span className="text-xs font-semibold text-[#0A0A0A]">{doc.id}</span>
                          </div>
                          <span className="text-[9px] font-data text-text-muted">
                            {doc.type} · {doc.size}
                          </span>
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
                        className="w-full text-xs border border-border-gray rounded-xl pl-4 pr-9 py-3 bg-[#FCFCFD] focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 transition-all"
                      />
                      <Search className="w-3.5 h-3.5 text-text-muted/50 absolute right-3.5 top-3.5" />
                    </div>
                    <button
                      type="submit"
                      disabled={isRetrieving || !demoQuery.trim()}
                      className="w-full bg-[#0A0A0A] hover:bg-brand-blue text-white py-3 rounded-xl text-xs font-data uppercase tracking-wider font-semibold transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isRetrieving ? 'Evaluating Outline...' : 'Retrieve Target'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Panel: Terminal */}
              <div className="w-full md:w-1/2 bg-[#0A0A0A] text-white p-6 md:p-8 flex flex-col justify-between font-data">
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5 text-white/40 text-[10px]">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-brand-blue" />
                        <span>vectorless_core_stdout</span>
                      </span>
                      <button onClick={() => setShowDemoModal(false)} className="hover:text-white cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-[11px] leading-relaxed">
                      <div className="text-white/30">$ ./vectorless ingest {selectedDoc}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span className="text-white/80">[1/3] File parsed: created node tree</span>
                      </div>

                      {ingestionStep >= 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span className="text-white/80">[2/3] Structural outline mapped (ToC)</span>
                        </div>
                      )}

                      {ingestionStep >= 2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span>
                          <span className="text-white/80">[3/3] Gemini-1.5 summary manifests generated</span>
                        </div>
                      )}

                      {isRetrieving && (
                        <div className="text-brand-pink animate-pulse">$ querying LLM agent reasoning engine...</div>
                      )}

                      {retrievedResult && (
                        <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                          <div className="text-brand-pink text-[10px] font-semibold">REASONING OUTLINE SELECTION:</div>
                          <p className="text-[10px] text-white/90 bg-white/[0.05] p-3 rounded-lg border border-white/10 leading-relaxed">
                            {retrievedResult}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {ingestionStep >= 2 && (
                    <div className="text-[9px] text-white/30 border-t border-white/10 pt-3 mt-6">
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
