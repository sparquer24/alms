"use client";

import Link from "next/link";
import type { HeroData } from "@/types/landing";

interface HeroSectionProps {
  hero: HeroData;
}


export default function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section id="hero" className="bg-[#0F2D52] text-white min-h-screen flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
            <span className="text-sm font-medium text-[#B8860B] tracking-wider uppercase">
              Internal System — Authorized Personnel Only
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight max-w-4xl"
            dangerouslySetInnerHTML={{ __html: hero.title }}
          />

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-3xl">
            {hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link
              href={hero.primaryCta.href}
              className="px-8 py-3 bg-[#B8860B] text-white font-semibold rounded-md hover:bg-[#A0750A] transition-colors text-base"
            >
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className="px-8 py-3 border border-white/30 text-white font-medium rounded-md hover:bg-white/10 transition-colors text-base"
            >
              {hero.secondaryCta.label}
            </Link>
            <Link
              href={hero.tertiaryCta.href}
              className="px-8 py-3 text-gray-300 font-medium rounded-md hover:text-white hover:bg-white/5 transition-colors text-base"
            >
              {hero.tertiaryCta.label} →
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 pt-10 border-t border-white/10 w-full max-w-3xl">
            {["RBAC Security", "Audit Trail", "Encrypted Storage", "Multi-Level Approval"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-400">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
