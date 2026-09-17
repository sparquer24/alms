"use client";

import Link from "next/link";
import type { HeroData } from "@/types/landing";
import HeroBackground from "./HeroBackground";

interface HeroSectionProps {
  hero: HeroData;
}


export default function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section id="hero" className="relative text-white min-h-screen flex items-center overflow-hidden">
      <HeroBackground />
      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 lg:pr-0 py-24 md:py-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
          <span className="text-sm font-medium text-[#FFF] tracking-wider uppercase">
            Internal System — Authorized Personnel Only
          </span>
        </div>

        <div className="flex flex-col items-start text-left gap-8 max-w-4xl">
          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight"
            dangerouslySetInnerHTML={{ __html: hero.title }}
          />

          {/* Subtitle + CTA Buttons */}
          <div className="flex flex-col items-start text-left space-y-8">
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              {hero.subtitle}
            </p>

            <div className="flex flex-wrap items-start gap-4">
              <Link
                href={hero.tertiaryCta.href}
                className="px-8 py-3 bg-[#B8860B] text-white font-semibold rounded-md hover:bg-[#A0750A] transition-colors text-base"
              >
                {hero.tertiaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex flex-wrap justify-center gap-2">
          {["RBAC Security", "Audit Trail", "Encrypted Storage", "Multi-Level Approval"].map((item) => (
            <div key={item} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              <svg className="w-2.5 h-2.5 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[10px] text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
