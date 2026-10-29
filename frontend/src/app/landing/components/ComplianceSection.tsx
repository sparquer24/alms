"use client";

import type { ComplianceItem } from "@/types/landing";

interface ComplianceSectionProps {
  title: string;
  description: string;
  items: ComplianceItem[];
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Background: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Identity: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Document: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Inspection: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Compliance: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

const complianceIcons: Record<string, React.ReactNode> = {
  "Criminal History Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  "FIR Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "Conviction Tracking": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  "Aadhaar Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  "PAN Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  "Training Certificate Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  "Medical &amp; Fitness Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  "Ground Reports": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  "Biometric Verification": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    </svg>
  ),
  "Legal Declarations": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  "Audit Logs &amp; Tracking": (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function ComplianceSection({ title, description, items }: ComplianceSectionProps) {
  // Group items by category
  const grouped = items.reduce<Record<string, ComplianceItem[]>>((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <section id="compliance" className="py-24 bg-white border-b border-gray-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 rounded-full uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            Statutory Inquiries & Checks
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight mb-3">
            {title}
          </h2>
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
        </div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([category, categoryItems]) => {
            const colors = categoryColors[category] || categoryColors.Compliance;
            return (
              <div key={category} className="bg-[#F8FAFC] rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-5">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${colors.bg} ${colors.text} ${colors.border} border tracking-wide uppercase`}>
                    {category} Verification
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3.5 bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs hover:shadow-md hover:border-[#D4AF37]/60 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#0F2D52]/5 text-[#0F2D52] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#0F2D52] group-hover:text-white transition-colors duration-200">
                        {complianceIcons[item.title] || (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-[#0B1F3A] block leading-snug">{item.title}</span>
                        {item.statutoryBasis && (
                          <span className="text-[11px] text-[#0F2D52] font-semibold block mt-1">
                            {item.statutoryBasis}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
