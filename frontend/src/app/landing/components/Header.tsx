"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavLink } from "@/types/landing";
import IndianFlag from "./IndianFlag";

interface LandingHeaderProps {
  navLinks: NavLink[];
  logoSrc?: string;
  announcements?: string[];
}

export default function LandingHeader({
  navLinks,
  logoSrc = "/icon-alms.svg",
  announcements = [
    "GOVERNMENT OF TELANGANA DIRECTIVE: Mandatory biometric enrollment (Iris Scan, Live Photo & Digital Signature) active across all Police Commissionerates.",
    "DUAL VERIFICATION MANDATE: All fresh applications in Telangana undergo simultaneous verification by the local Police Station (SHO) and Special Branch (SB).",
    "ELECTION ARMORY DEPOSIT: Under Telangana State Police orders, licensed firearms must be deposited in police station armories during statutory election periods.",
    "APPELLATE AUTHORITY: As per Section 18 of the Arms Act, appeals against orders of CP / DM lie before the Home Department, Government of Telangana Secretariat."
  ]
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotate announcement ticker every 6s
  useEffect(() => {
    if (!announcements || announcements.length === 0) return;
    const timer = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Indian National Tricolor Apex Accent */}
      <div className="h-[2.5px] w-full flex shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {/* Single Unified Government of Telangana Header */}
      <div
        className={`backdrop-blur-md border-b transition-all duration-300 ${
          scrolled
            ? "bg-[#071527]/95 border-white/15 shadow-xl py-2.5"
            : "bg-[#091D38]/90 border-white/10 py-3.5"
        }`}
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between gap-4">
            {/* Government of Telangana Identity & Department Crest */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="p-1 rounded-lg bg-white/10 border border-white/15 shadow-sm group-hover:border-[#D4AF37]/50 transition-colors">
                <img
                  src={logoSrc}
                  alt="Telangana ALMS Crest"
                  className="h-10 sm:h-11 w-auto drop-shadow-md"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <IndianFlag width={18} height={12} />
                  <span className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] tracking-wider uppercase block leading-none">
                    Government of Telangana
                  </span>
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">
                    State Police
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                    ALMS
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-200 hidden sm:inline leading-tight">
                    • Arms License Management System
                  </span>
                </div>
                <span className="text-[10px] text-gray-300 font-medium tracking-wide hidden sm:block leading-none mt-0.5">
                  Home (Police) Department • State Regulatory Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-0.5" aria-label="Main navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-2 py-1 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Header Right: Helpline & Official Sign In */}
            <div className="flex items-center gap-3">
              {/* Emergency / Helpline */}
              <div className="hidden md:flex flex-col items-end text-right border-r border-white/15 pr-3">
                <span className="text-[10px] text-gray-400 font-medium leading-none">
                  Telangana Police Helpline
                </span>
                <span className="text-xs font-extrabold text-[#D4AF37] leading-tight mt-0.5">
                  100 / 112 • 1800-425-0000
                </span>
              </div>

              {/* Official Officer / Authority Login Button */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#C4A02F] to-[#B8860B] text-[#071527] hover:from-[#E5BE48] hover:to-[#A0750A] shadow-md hover:shadow-lg transition-all duration-200 border border-[#FFE58F]/40 shrink-0"
              >
                <svg className="w-3.5 h-3.5 text-[#071527]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                </svg>
                <span>Officer Sign In</span>
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button
                className="xl:hidden p-2 text-white hover:bg-white/10 rounded-md transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileOpen && (
            <nav className="xl:hidden pt-4 pb-3 border-t border-white/15 mt-3 space-y-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-white/10">
                <Link
                  href="/login"
                  className="block w-full py-2.5 text-center text-sm font-bold rounded-lg bg-[#D4AF37] text-[#071527]"
                  onClick={() => setMobileOpen(false)}
                >
                  Officer Sign In
                </Link>
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* Slim Gazette Directive Ticker Strip */}
      <div className="bg-[#050E1A]/95 border-b border-white/10 py-1.5 px-4 text-xs text-white">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded bg-red-600/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Telangana Directive
          </div>
          <div className="overflow-hidden relative flex-1 h-5">
            <p
              key={activeAnnouncement}
              className="text-gray-200 text-xs truncate transition-all duration-500 transform animate-fadeIn leading-5"
            >
              {announcements[activeAnnouncement]}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 shrink-0 text-gray-400 text-[11px]">
            <a href="#services" className="hover:text-[#D4AF37] underline transition-colors">
              State Rules &amp; Forms
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
