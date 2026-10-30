"use client";

import type { UserGroup } from "@/types/landing";

interface EcosystemSectionProps {
  groups: UserGroup[];
}

const roleIcons: Record<string, React.ReactNode> = {
  citizen: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  officer: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  authority: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  admin: (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function EcosystemSection({ groups }: EcosystemSectionProps) {
  return (
    <section id="ecosystem" className="py-24 bg-white border-b border-gray-200 overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 rounded-full uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            Integrated Stakeholder Network
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight mb-3">
            Telangana ALMS Ecosystem
          </h2>
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Four interconnected user groups working together through a unified governance platform with role-specific capabilities and statutory access controls.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group, idx) => (
            <div key={group.role} className="relative">
              {/* Connector arrow between cards (desktop) */}
              {idx < groups.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/3 z-20 text-gray-300 pointer-events-none">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              <div className="group bg-white rounded-2xl border border-gray-200/90 p-7 h-full shadow-sm hover:shadow-xl hover:border-[#D4AF37]/80 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                {/* Top Accent Strip on Hover */}
                <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-[#0F2D52] group-hover:via-[#D4AF37] group-hover:to-[#0F2D52] transition-colors" />

                <div>
                  <div className="w-14 h-14 rounded-xl bg-[#0F2D52]/5 text-[#0F2D52] flex items-center justify-center group-hover:bg-[#0F2D52] group-hover:text-white transition-colors duration-300 shadow-sm mb-5">
                    {roleIcons[group.role]}
                  </div>
                  <h3 className="text-xl font-bold text-[#0B1F3A] mb-1">{group.title}</h3>
                  {group.designation && (
                    <span className="inline-block text-[11px] font-semibold text-[#0F2D52] bg-[#0F2D52]/10 px-2.5 py-0.5 rounded-full mb-4 border border-[#0F2D52]/15">
                      {group.designation}
                    </span>
                  )}
                  <ul className="space-y-2.5 mt-2">
                    {group.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-[#138808] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs sm:text-sm text-gray-600 leading-snug">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Tier 0{idx + 1}</span>
                  <span className="text-[#0F2D52] font-semibold group-hover:text-[#D4AF37] transition-colors">Access Portal &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
