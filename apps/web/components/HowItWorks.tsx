'use client';

import { useState, useEffect } from 'react';
import FadeIn from './FadeIn';
import CodeBlock from './CodeBlock';
import { motion } from 'motion/react';

const steps = [
  {
    title: "Add your document",
    description: "Point Vectorless at anything: a PDF, a Word doc, a URL, a plain text file, a knowledge base. We parse it, extract or generate a table of contents, and store every section as an addressable unit.",
    lines: [1, 2]
  },
  {
    title: "Get a navigable map",
    description: "You receive a structured document map — a JSON manifest of every section, with titles, summaries, and direct retrieval links. This is your document's new interface.",
    lines: [4, 5]
  },
  {
    title: "Query with reasoning",
    description: "Pass the map and a user question to any LLM. It reads the map, picks the relevant sections, and we fetch them — in parallel, in milliseconds. You get complete, structured context back.",
    lines: [7, 8, 9]
  }
];

const howItWorksSnippets = [
  {
    label: 'TypeScript',
    language: 'typescript',
    code: `// 01 - Add your document
const { doc_id, toc } = await vectorless.addDocument(file);

// 02 - Get a navigable map
const sectionIds = await llm.reason(toc, userQuestion);

// 03 - Query with reasoning
const context = await vectorless.fetchSections(doc_id, sectionIds);
const answer = await llm.answer(context, userQuestion);`
  },
  {
    label: 'Python',
    language: 'python',
    code: `# 01 - Add your document
doc_id, toc = await vectorless.add_document(file)

# 02 - Get a navigable map
section_ids = await llm.reason(toc, user_question)

# 03 - Query with reasoning
context = await vectorless.fetch_sections(doc_id, section_ids)
answer = await llm.answer(context, user_question)`
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-border-light">
      <FadeIn>
        <span className="font-mid text-[18px] font-medium text-text-muted mb-4 block">How It Works</span>
        <h2 className="font-display text-4xl md:text-[56px] font-medium leading-[1.10] text-text-base mb-20">
          Three steps. Clean API. Done.
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
        {/* Left: Animated Steps */}
        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-6 relative cursor-pointer group"
              onClick={() => setActiveStep(i)}
            >
              {/* Line & Circle Container */}
              <div className="relative flex flex-col items-center">
                {/* Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[2px] z-10 bg-bg-base transition-all duration-500 ${activeStep === i ? 'border-primary-500 text-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : activeStep > i ? 'border-primary-500 text-primary-500' : 'border-border-light text-text-muted group-hover:border-primary-300'}`}>
                  <span className="font-data text-[14px] font-medium">0{i + 1}</span>
                </div>

                {/* Connecting Line */}
                {i < steps.length - 1 && (
                  <div className="w-[2px] bg-border-light absolute top-10 bottom-0">
                    {/* Animated Fill */}
                    {activeStep === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ duration: 4, ease: 'linear' }}
                        className="w-full bg-primary-500 origin-top"
                      />
                    )}
                    {activeStep > i && (
                      <div className="w-full h-full bg-primary-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`pb-12 pt-1 transition-all duration-500 ${activeStep === i ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-2 group-hover:opacity-60'}`}>
                <h3 className="text-[20px] font-medium text-text-dark mb-3">{step.title}</h3>
                <p className="text-[16px] font-normal leading-[1.60] text-text-secondary">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Code Block */}
        <FadeIn delay={0.2} className="lg:mt-0 h-full min-h-[400px]">
          <div className="sticky top-32">
            <CodeBlock
              snippets={howItWorksSnippets}
              highlightLines={steps[activeStep].lines}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
