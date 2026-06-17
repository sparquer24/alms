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
    <section id="ecosystem" className="py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 rounded-full uppercase tracking-wider mb-4">
            Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F2D52] mb-4">
            ALMS Ecosystem
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Four interconnected user groups working together through a unified governance platform with role-specific capabilities and access controls.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group, idx) => (
            <div key={group.role} className="relative">
              {/* Connector arrow between cards (desktop) */}
              {idx < groups.length - 1 && (
                <div className="hidden lg:flex absolute -right-4 top-1/3 z-10 text-[#B8860B]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-6 h-full hover:shadow-lg hover:border-[#B8860B]/20 transition-all duration-300">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-5 ${
                  idx === 0 ? "bg-blue-50 text-blue-600" :
                  idx === 1 ? "bg-amber-50 text-amber-600" :
                  idx === 2 ? "bg-green-50 text-green-600" :
                  "bg-purple-50 text-purple-600"
                }`}>
                  {roleIcons[group.role]}
                </div>
                <h3 className="text-xl font-bold text-[#0F2D52] mb-4">{group.title}</h3>
                <ul className="space-y-2.5">
                  {group.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[#2E7D32] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
