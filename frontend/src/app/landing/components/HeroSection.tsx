"use client";

import Link from "next/link";
import type { HeroData } from "@/types/landing";
import HeroBackground from "./HeroBackground";
import IndianFlag from "./IndianFlag";

interface HeroSectionProps {
  hero: HeroData;
}

export default function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="relative text-white min-h-[92vh] flex items-center overflow-hidden pt-36 pb-20 md:pt-40 md:pb-24"
    >
      <HeroBackground />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Official Mandate, Headline, Subtitle, Trust Indicators */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            {/* Government Authority Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-md">
                <IndianFlag width={20} height={13} />
                <span className="text-[11px] font-bold text-white tracking-wider uppercase">
                  Government of Telangana • Home (Police) Department
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/15 backdrop-blur-md rounded-full border border-[#D4AF37]/30 text-[11px] font-medium text-[#FFD700]">
                <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>The Arms Act, 1959 &amp; The Arms Rules, 2016</span>
              </div>
            </div>

            {/* Official Title */}
            <div className="space-y-3">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight drop-shadow-md"
                dangerouslySetInnerHTML={{ __html: hero.title }}
              />
              {/* Refined Indian Tricolor Hairline Accent */}
              <div className="h-[3px] w-36 rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] shadow-[0_0_10px_rgba(255,153,51,0.6)] my-2" />
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-2xl font-normal drop-shadow">
              {hero.subtitle}
            </p>

            {/* Verified Trust Badges */}
            <div className="pt-4 border-t border-white/15 w-full flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="font-medium">CCTNS Telangana Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="font-medium">Special Branch (SB) Clearance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="font-medium">Biometric Vault (Rule 11)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <span className="font-medium">Section 18 Appellate Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated Access Portals Card with the 3 Action Buttons */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-gradient-to-b from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/25 p-6 sm:p-8 shadow-2xl relative overflow-hidden w-full max-w-lg">
              {/* Official Indian National Tricolor Ribbon */}
              <div className="absolute top-0 inset-x-0 h-1.5 flex shadow-sm">
                <div className="w-1/3 bg-[#FF9933]" />
                <div className="w-1/3 bg-[#FFFFFF]" />
                <div className="w-1/3 bg-[#138808]" />
              </div>

              <div className="space-y-5">
                {/* Header */}
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#FFD700] border border-[#D4AF37]/30 uppercase tracking-wider mb-2">
                    Official Portals &amp; Modules
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Telangana ALMS Gateway
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Select a portal to sign in or explore state licensing modules and approval workflows.
                  </p>
                </div>

                {/* The 3 Moved Buttons */}
                <div className="space-y-3 pt-2">
                  {/* 1. Officer / Authority Sign In */}
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#D4AF37] via-[#C4A02F] to-[#B8860B] hover:from-[#E5BE48] hover:to-[#A0750A] text-[#0B1F3A] rounded-xl font-extrabold shadow-xl hover:shadow-2xl transition-all duration-200 border border-[#FFE58F]/60 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-[#0B1F3A]/15 flex items-center justify-center text-[#0B1F3A] group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-black leading-tight">Officer / Authority Sign In</span>
                        <span className="block text-[11px] font-semibold text-[#0B1F3A]/80">SHO • SB • ACP • DCP • CP / DM</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#0B1F3A] group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </Link>

                  {/* 2. State Services & Modules */}
                  <a
                    href="#services"
                    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-[#D4AF37]/50 rounded-xl text-white backdrop-blur-md shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold leading-tight">State Services &amp; Modules</span>
                        <span className="block text-[11px] text-gray-300">Fresh Licenses, Renewals &amp; Transfers</span>
                      </div>
                    </div>
                    <span className="text-lg text-gray-300 group-hover:text-white group-hover:translate-y-0.5 transition-transform">&darr;</span>
                  </a>

                  {/* 3. Police Approval Chain */}
                  <a
                    href="#workflow"
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/15 border border-white/15 hover:border-white/30 rounded-xl text-white backdrop-blur-md shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-bold leading-tight">Police Approval Chain</span>
                        <span className="block text-[11px] text-gray-300">7-Tier Law Enforcement Hierarchy</span>
                      </div>
                    </div>
                    <span className="text-lg text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </a>
                </div>

                {/* Subtle Authority Footer note inside card */}
                <div className="pt-3 border-t border-white/15 flex items-center justify-between text-[11px] text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>State Police Network Active</span>
                  </span>
                  <span className="text-[#D4AF37] font-semibold">Arms Act, 1959</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Telemetry Bar: Official Counters & Standards */}
        <div className="mt-16 pt-8 border-t border-white/15">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            {hero.stats ? (
              hero.stats.map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/40 transition-colors">
                  <div className="text-xl sm:text-2xl font-black text-[#D4AF37] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[10px] text-gray-300 mt-0.5 hidden sm:block">
                    {stat.desc}
                  </div>
                </div>
              ))
            ) : (
              [
                { value: "Paperless", label: "100% Digital", desc: "Digital lifecycle workflow" },
                { value: "6 Tiers", label: "Police Scrutiny", desc: "SHO to Licensing Authority" },
                { value: "26 Roles", label: "Granular RBAC", desc: "Strict separation of powers" },
                { value: "Immutable", label: "Audit Ledger", desc: "Cryptographic SHA-256 logs" },
                { value: "Real-Time", label: "CCTNS Sync", desc: "National crime records check" }
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-xl sm:text-2xl font-black text-[#D4AF37] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-white mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[10px] text-gray-300 mt-0.5 hidden sm:block">
                    {stat.desc}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
