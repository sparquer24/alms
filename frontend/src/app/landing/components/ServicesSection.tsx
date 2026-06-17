"use client";

import type { ServiceCard } from "@/types/landing";

interface ServicesSectionProps {
  services: ServiceCard[];
}

const iconMap: Record<string, React.ReactNode> = {
  "new-license": (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  renewal: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  transfer: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  cancel: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

export default function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="services" className="py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 rounded-full uppercase tracking-wider mb-4">
            Core Services
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F2D52] mb-4">
            License Service Modules
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Comprehensive digital services covering the entire spectrum of arms license management — from initial application through lifecycle events.
          </p>
        </div>

        {/* Service cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-[#B8860B]/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-lg bg-[#0F2D52]/5 text-[#0F2D52] flex items-center justify-center mb-5 group-hover:bg-[#0F2D52] group-hover:text-white transition-colors duration-300">
                {iconMap[service.icon] || iconMap["new-license"]}
              </div>
              <h3 className="text-lg font-bold text-[#0F2D52] mb-3 group-hover:text-[#B8860B] transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
