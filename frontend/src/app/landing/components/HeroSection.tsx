"use client";

import Link from "next/link";
import type { HeroData } from "@/types/landing";

interface HeroSectionProps {
  hero: HeroData;
}

function WorkflowArrow() {
  return (
    <svg className="w-5 h-5 text-[#B8860B] mx-auto my-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

export default function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section id="hero" className="bg-[#0F2D52] text-white min-h-screen flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-center">
          {/* Left content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
              <span className="text-xs font-medium text-[#B8860B] tracking-wider uppercase">
                Internal System — Authorized Personnel Only
              </span>
            </div>

            {/* Title */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight"
              dangerouslySetInnerHTML={{ __html: hero.title }}
            />

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
              {hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href={hero.primaryCta.href}
                className="px-8 py-3 bg-[#B8860B] text-white font-semibold rounded-md hover:bg-[#A0750A] transition-colors text-sm sm:text-base"
              >
                {hero.primaryCta.label}
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className="px-8 py-3 border border-white/30 text-white font-medium rounded-md hover:bg-white/10 transition-colors text-sm sm:text-base"
              >
                {hero.secondaryCta.label}
              </Link>
              <Link
                href={hero.tertiaryCta.href}
                className="px-8 py-3 text-gray-300 font-medium rounded-md hover:text-white hover:bg-white/5 transition-colors text-sm sm:text-base"
              >
                {hero.tertiaryCta.label} →
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 pt-8 border-t border-white/10">
              {["RBAC Security", "Audit Trail", "Encrypted Storage", "Multi-Level Approval"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-gray-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Workflow Hierarchy - 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/20 bg-white/5">
              <div className="p-6">
                <div className="text-center mb-4">
                  <span className="text-xs font-semibold text-[#B8860B] tracking-wider uppercase">
                    Approval Workflow Chain
                  </span>
                </div>
                <div className="space-y-0">
                  {hero.workflowHierarchy.map((step, idx) => (
                    <div key={step}>
                      <div
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                          idx === hero.workflowHierarchy.length - 1
                            ? "bg-[#2E7D32]/20 border border-[#2E7D32]/30"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            idx === hero.workflowHierarchy.length - 1
                              ? "bg-[#2E7D32] text-white"
                              : "bg-[#B8860B]/20 text-[#B8860B]"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`text-sm ${
                            idx === hero.workflowHierarchy.length - 1
                              ? "text-[#2E7D32] font-semibold"
                              : "text-gray-200"
                          }`}
                        >
                          {step}
                        </span>
                        {idx === hero.workflowHierarchy.length - 1 && (
                          <svg className="w-4 h-4 ml-auto text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      {idx < hero.workflowHierarchy.length - 1 && <WorkflowArrow />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
