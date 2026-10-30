"use client";

import Link from "next/link";
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
    <section id="services" className="py-24 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F1F5F9] border-t border-b border-gray-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 rounded-full uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            Telangana State Regulatory Services
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight mb-3">
            State Arms Licensing Service Modules
          </h2>
          {/* Subtle Tricolor Accent Underline */}
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Statutory citizen and institutional licensing services governed under <span className="font-semibold text-gray-900">The Arms Act, 1959</span>, <span className="font-semibold text-gray-900">The Arms Rules, 2016</span>, and Telangana State Police directives, executed by Police Commissionerates and District Magistracies.
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="group bg-white rounded-2xl border border-gray-200/90 p-7 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/80 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Strip on Hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-[#0F2D52] group-hover:via-[#D4AF37] group-hover:to-[#0F2D52] transition-colors" />

              <div>
                {/* Form Badge & Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-xl bg-[#0F2D52]/5 text-[#0F2D52] flex items-center justify-center group-hover:bg-[#0F2D52] group-hover:text-white transition-colors duration-300 shadow-sm">
                    {iconMap[service.icon] || iconMap["new-license"]}
                  </div>
                  {service.statutoryForm && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                      {service.statutoryForm}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#0B1F3A] mb-2 group-hover:text-[#B8860B] transition-colors">
                  {service.title}
                </h3>

                {/* Badge if available */}
                {service.badge && (
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-3">
                    {service.badge}
                  </span>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>

              {/* Card Footer: SLA & Action */}
              <div className="pt-4 border-t border-gray-100">
                {service.sla && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mb-3">
                    <svg className="w-3.5 h-3.5 text-[#B8860B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{service.sla}</span>
                  </div>
                )}
                <Link
                  href="/login"
                  className="inline-flex items-center justify-between w-full text-xs font-bold text-[#0F2D52] group-hover:text-[#B8860B] transition-colors"
                >
                  <span>Official Processing Desk</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Citizen Information & Downloads Strip */}
        <div className="mt-14 p-6 rounded-2xl bg-gradient-to-r from-[#0F2D52] to-[#09182B] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0 border border-white/15">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Telangana State Police Guidelines, Forms &amp; Fee Schedules
              </h4>
              <p className="text-xs text-gray-300">
                Download the official Telangana Citizen Charter, Form II/III Application Blank, Medical Certificate Form 1-A, Firing Training Guidelines, and Election Armory Deposit SOPs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#workflow"
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
            >
              Approval Workflow
            </a>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#C4A02F] text-[#0B1F3A] font-bold text-xs transition-colors shadow-md"
            >
              Sign In to Apply / Process
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
