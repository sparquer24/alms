"use client";

import type { WorkflowGovernance } from "@/types/landing";

interface WorkflowSectionProps {
  workflow: WorkflowGovernance;
}

export default function WorkflowSection({ workflow }: WorkflowSectionProps) {
  return (
    <section id="workflow" className="py-24 bg-white border-b border-gray-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 rounded-full uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            Telangana Law Enforcement Hierarchy
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight mb-3">
            {workflow.title}
          </h2>
          {/* Subtle Tricolor Accent Underline */}
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {workflow.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Statutory Law Enforcement & Magisterial Chain */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-6 bg-[#0F2D52] rounded-full inline-block" />
                <h3 className="text-lg font-bold text-[#0B1F3A]">
                  Statutory Law Enforcement Approval Chain
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                7 Tiers of Scrutiny
              </span>
            </div>

            <div className="space-y-4 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gray-300 hidden sm:block" />

              {workflow.chain.map((step, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === workflow.chain.length - 1;
                const isAuthority = idx === 5; // CP / DM

                return (
                  <div
                    key={step}
                    className={`relative flex items-start gap-4 p-3.5 rounded-xl transition-all duration-200 ${
                      isLast
                        ? "bg-emerald-50 border border-emerald-200"
                        : isAuthority
                        ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30"
                        : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm"
                    }`}
                  >
                    {/* Node Number / Icon */}
                    <div className="relative z-10 shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm ${
                          isLast
                            ? "bg-[#138808] text-white"
                            : isAuthority
                            ? "bg-[#B8860B] text-white"
                            : isFirst
                            ? "bg-[#FF9933] text-white"
                            : "bg-[#0F2D52] text-white"
                        }`}
                      >
                        {isLast ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          `0${idx + 1}`
                        )}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isLast
                              ? "text-emerald-900"
                              : isAuthority
                              ? "text-[#875F05]"
                              : "text-gray-900"
                          }`}
                        >
                          {step}
                        </span>
                        {isLast && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded uppercase">
                            Final Issuance
                          </span>
                        )}
                        {isAuthority && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D4AF37] text-[#0B1F3A] rounded uppercase">
                            Adjudication
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Workflow Governance Architecture & Safeguards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-[#0B1F3A] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full inline-block" />
                Administrative &amp; Legal Safeguards
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                Every workflow transition is strictly enforced by state transition logic, cryptographic identity binding, and non-repudiable audit recording.
              </p>

              <div className="space-y-4">
                {workflow.highlights.map((highlight, idx) => {
                  const [title, desc] = highlight.includes("—")
                    ? highlight.split("—")
                    : [highlight, ""];

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-[#D4AF37]/50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#0F2D52]/10 text-[#0F2D52] flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0B1F3A]">
                            {title.trim()}
                          </h4>
                          {desc && (
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                              {desc.trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statutory Legal Note */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs">
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-bold block">Telangana State Statutory Framework:</span>
                  <span className="text-blue-800 text-[11px] leading-relaxed">
                    Under Sections 13 and 14 of The Arms Act, 1959, all arms licenses in Telangana are adjudicated by the Commissioner of Police (Commissionerate areas) or the District Magistrate (Districts) following dual inquiries by the local Police Station (SHO) and Special Branch (SB). Any appeal against adverse orders lies before the Home Department, Government of Telangana Secretariat under Section 18.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
