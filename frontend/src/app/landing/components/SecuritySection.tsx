"use client";

import type { SecurityFeature } from "@/types/landing";

interface SecuritySectionProps {
  title: string;
  description: string;
  features: SecurityFeature[];
}

const categoryIcons: Record<string, string> = {
  Access: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  Audit: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  Data: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

export default function SecuritySection({ title, description, features }: SecuritySectionProps) {
  return (
    <section id="security" className="py-24 bg-gradient-to-b from-[#0B1F3A] to-[#071324] text-white border-t border-white/10">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-[#D4AF37] bg-white/10 rounded-full uppercase tracking-wider mb-3 border border-[#D4AF37]/30">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            National Security Standards
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">{title}</h2>
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{description}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:border-[#D4AF37]/50 shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-transparent group-hover:bg-gradient-to-r group-hover:from-[#FF9933] group-hover:via-[#D4AF37] group-hover:to-[#138808] transition-colors" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30 group-hover:bg-[#D4AF37] group-hover:text-[#0B1F3A] transition-colors duration-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={categoryIcons[feature.category] || categoryIcons.Access} />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {feature.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">{feature.description}</p>
              </div>

              {feature.standard && (
                <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{feature.standard}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
