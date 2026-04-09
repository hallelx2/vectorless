'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface CodeSnippet {
  language: string;
  label: string;
  code: string;
}

interface CodeBlockProps {
  snippets: CodeSnippet[];
  highlightLines?: number[];
}

export default function CodeBlock({ snippets, highlightLines }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-[20px] p-[1px] overflow-hidden group h-full shadow-[rgba(44,30,116,0.16)_0px_0px_15px]">
      {/* Aceternity Animated Border */}
      <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#181e25_0%,#3b82f6_50%,#181e25_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-[#1e1e1e] rounded-[20px] flex flex-col overflow-hidden h-full w-full z-10">
        {/* Tabs Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#181818]">
          <div className="flex gap-2">
            {snippets.map((snippet, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  activeTab === index 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {snippet.label}
              </button>
            ))}
          </div>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-white/5 text-white/40 transition-all hover:text-white hover:bg-white/10"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#1e1e1e] py-4">
          <SyntaxHighlighter
            language={snippets[activeTab].language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'var(--font-mono), monospace',
            }}
            wrapLines={true}
            lineProps={(lineNumber) => {
              if (!highlightLines || highlightLines.length === 0) {
                return { style: { display: 'block', padding: '0 16px' } };
              }
              const isActive = highlightLines.includes(lineNumber);
              return {
                style: {
                  display: 'block',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'all 0.3s ease',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  paddingLeft: isActive ? '14px' : '16px',
                  paddingRight: '16px',
                }
              };
            }}
          >
            {snippets[activeTab].code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
