"use client";

import Link from "next/link";
import type { FooterData } from "@/types/landing";

interface LandingFooterProps {
  footer: FooterData;
}

export default function LandingFooter({ footer }: LandingFooterProps) {
  return (
    <footer id="footer" className="bg-[#0F2D52] text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/icon-alms.svg" alt="ALMS Logo" className="h-10 w-auto" />
              <div>
                <span className="text-lg font-bold text-white block leading-tight">ALMS</span>
                <span className="text-[10px] text-[#B8860B] tracking-wider uppercase block leading-tight">
                  Arms License Management
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              A comprehensive digital governance platform for managing the complete arms licensing ecosystem.
            </p>
            <p className="text-xs text-gray-500">
              {footer.governingBody} — Internal Use Only
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              {footer.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#B8860B] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" className="text-sm text-[#B8860B] hover:text-[#C4A02F] transition-colors font-medium">
                  Officer Login →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Contact &amp; Support</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{footer.contact}</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {footer.systemName}
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-start gap-3 justify-center">
            <svg className="w-5 h-5 text-[#B8860B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-gray-400 text-center max-w-2xl">
              {footer.securityNotice}
            </p>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} {footer.systemName}. Internal Use Only.
          </p>
        </div>
      </div>
    </footer>
  );
}
