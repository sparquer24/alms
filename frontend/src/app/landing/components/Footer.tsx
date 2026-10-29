"use client";

import Link from "next/link";
import type { FooterData } from "@/types/landing";
import IndianFlag from "./IndianFlag";

interface LandingFooterProps {
  footer: FooterData;
}

export default function LandingFooter({ footer }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="relative bg-[#071324] text-white border-t border-white/10">
      {/* 1. Indian National Tricolor Ribbon */}
      <div className="h-[3px] w-full flex shadow-[0_-1px_6px_rgba(255,153,51,0.35)]">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-[#FFFFFF]" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      {/* 2. Main Government Directory */}
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Government Identity & Authority */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/10 border border-white/20">
                <img src="/icon-alms.svg" alt="ALMS Crest" className="h-10 w-auto" />
              </div>
              <div>
                <span className="text-xl font-black text-white block leading-tight tracking-tight">
                  ALMS
                </span>
                <span className="text-[10px] text-[#D4AF37] font-bold tracking-wider uppercase block leading-tight">
                  Telangana State Arms Licensing
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Telangana Arms License Management System (ALMS). Official state digital governance platform operating under the statutory provisions of <span className="text-white font-medium">The Arms Act, 1959</span>, <span className="text-white font-medium">The Arms Rules, 2016</span>, and the Telangana Police regulatory framework.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <IndianFlag width={22} height={15} />
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/30 uppercase tracking-wider">
                Government of Telangana • Home Dept
              </span>
            </div>
          </div>

          {/* Col 2: Telangana State Portals */}
          <div>
            <h3 className="text-xs font-bold text-[#D4AF37] mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              Telangana State Portals
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300">
              <li>
                <a
                  href="https://www.telangana.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors flex items-center justify-between"
                >
                  <span>Government of Telangana (telangana.gov.in)</span>
                  <span className="text-[10px] text-gray-500">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.tspolice.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors flex items-center justify-between"
                >
                  <span>Telangana State Police (tspolice.gov.in)</span>
                  <span className="text-[10px] text-gray-500">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.hyderabadpolice.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors flex items-center justify-between"
                >
                  <span>Hyderabad City Police</span>
                  <span className="text-[10px] text-gray-500">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://cyberabadpolice.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors flex items-center justify-between"
                >
                  <span>Cyberabad Police Commissionerate</span>
                  <span className="text-[10px] text-gray-500">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://rachakondapolice.telangana.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors flex items-center justify-between"
                >
                  <span>Rachakonda Police Commissionerate</span>
                  <span className="text-[10px] text-gray-500">↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen Services & Statutory Rights */}
          <div>
            <h3 className="text-xs font-bold text-[#D4AF37] mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              Citizen Services &amp; Rights
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-300">
              {footer.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-[#D4AF37] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#workflow"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Section 18 Appellate Guidelines
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[#D4AF37] hover:underline font-bold inline-flex items-center gap-1 pt-1"
                >
                  <span>Officer Sign In</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Helpline & Law Enforcement Emergency */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#D4AF37] mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1 h-3.5 bg-[#D4AF37] rounded-full inline-block" />
              Helplines &amp; Emergency
            </h3>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Citizen Helpline:</span>
                <a href="tel:18004250000" className="font-bold text-[#D4AF37] hover:underline">
                  1800-425-0000
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Police Emergency:</span>
                <span className="font-bold text-emerald-400">100 / 112</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Women Safety (SHE Teams):</span>
                <span className="font-bold text-pink-400">1091</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cyber Crime Helpline:</span>
                <span className="font-bold text-amber-300">1930</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">State Nodal Desk:</p>
              <p className="text-gray-400">{footer.contact}</p>
            </div>
          </div>
        </div>

        {/* 3. Official Legal & IT Act Security Notice */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
            <svg className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="font-bold text-gray-200">OFFICIAL LEGAL NOTICE: </span>
              {footer.securityNotice}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Copyright & National Web Standards Bar */}
      <div className="border-t border-white/10 bg-[#040C17] py-5">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-400 text-center md:text-left">
          <div>
            <p className="text-gray-300 font-medium">
              &copy; {currentYear} {footer.systemName}. All Rights Reserved.
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Website Content Managed by Licensing &amp; Regulatory Authorities. Compliant with Guidelines for Indian Government Websites (GIGW 3.0).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              STQC Certified
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              W3C WAI-AAA
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              SSL 256-Bit Encrypted
            </span>
            <span className="font-mono text-[10px] text-gray-500">
              v2.4-enterprise
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
