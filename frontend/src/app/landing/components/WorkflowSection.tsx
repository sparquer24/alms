"use client";

import type { WorkflowGovernance } from "@/types/landing";

interface WorkflowSectionProps {
  workflow: WorkflowGovernance;
}

export default function WorkflowSection({ workflow }: WorkflowSectionProps) {
  return (
    <section id="workflow" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 rounded-full uppercase tracking-wider mb-4">
            Governance
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F2D52] mb-4">
            {workflow.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {workflow.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Workflow Chain */}
          <div>
            <h3 className="text-xl font-bold text-[#0F2D52] mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#B8860B] rounded-full inline-block" />
              Approval Chain
            </h3>
            <div className="space-y-0 relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-[#B8860B]/30 hidden md:block" />

              {workflow.chain.map((step, idx) => (
                <div key={step} className="flex items-start gap-4 py-3 relative">
                  <div className="relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === workflow.chain.length - 1
                          ? "bg-[#2E7D32] text-white"
                          : idx % 2 === 0
                          ? "bg-[#0F2D52] text-white"
                          : "bg-[#B8860B] text-white"
                      }`}
                    >
                      {idx === workflow.chain.length - 1 ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-2">
                    <span
                      className={`text-sm font-medium ${
                        idx === workflow.chain.length - 1
                          ? "text-[#2E7D32] font-bold"
                          : "text-gray-800"
                      }`}
                    >
                      {step}
                    </span>
                    {idx < workflow.chain.length - 1 && (
                      <div className="hidden md:block mt-1">
                        <svg className="w-4 h-4 text-gray-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Highlights */}
          <div>
            <h3 className="text-xl font-bold text-[#0F2D52] mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-[#B8860B] rounded-full inline-block" />
              Key Capabilities
            </h3>
            <div className="space-y-4">
              {workflow.highlights.map((highlight) => {
                const [title, desc] = highlight.split(" — ");
                return (
                  <div
                    key={title}
                    className="flex items-start gap-4 p-4 bg-[#F8F9FA] rounded-lg hover:bg-[#0F2D52]/5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#0F2D52]">{title}</span>
                      {desc && (
                        <p className="text-xs text-gray-500 mt-1">{desc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
