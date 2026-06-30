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
  const grouped = features.reduce<Record<string, SecurityFeature[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <section className="py-20 bg-[#0F2D52]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 rounded-full uppercase tracking-wider mb-4">
            Security
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h2>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-colors hover:border-[#B8860B]/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#B8860B]/10 text-[#B8860B] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={categoryIcons[feature.category] || categoryIcons.Access} />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-[#B8860B] uppercase tracking-wider">{feature.category}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
