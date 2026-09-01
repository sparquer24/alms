"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavLink } from "@/types/landing";

interface LandingHeaderProps {
  navLinks: NavLink[];
  logoSrc?: string;
}

export default function LandingHeader({ navLinks, logoSrc = "/icon-alms.svg" }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        scrolled
          ? "bg-[#0F2D52] shadow-lg py-2"
          : "bg-[#0F2D52] py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={logoSrc}
              alt="ALMS Logo"
              className="h-9 w-auto"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-white tracking-tight block leading-tight">
                ALMS
              </span>
              <span className="text-[10px] text-[#B8860B] tracking-wider uppercase block leading-tight">
                Arms License Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
            <Link
              href="/login"
              className="ml-3 px-5 py-2 text-sm font-semibold rounded-md bg-[#B8860B] text-white hover:bg-[#A0750A] transition-colors shadow-sm"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-md transition-colors"
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

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden pt-4 pb-2 border-t border-white/20 mt-3" aria-label="Mobile navigation">
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-3 py-2.5 text-sm text-gray-200 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
            <Link
              href="/login"
              className="block mt-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-[#B8860B] text-white hover:bg-[#A0750A] text-center transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
