"use client";

import type { LifecycleStage } from "@/types/landing";

interface LifecycleSectionProps {
  title: string;
  description: string;
  stages: LifecycleStage[];
}

const stageIcons: string[] = [
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "M13 16h-1v-4h-1m1-4h.01M12 2v2m8 8h2M4 12H2m15.07-5.07l1.41-1.41M5.64 17.64l-1.41 1.41",
  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
];

export default function LifecycleSection({ title, description, stages }: LifecycleSectionProps) {
  return (
    <section id="lifecycle" className="py-24 bg-[#F8FAFC] border-b border-gray-200">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 text-xs font-bold text-[#0F2D52] bg-[#0F2D52]/10 rounded-full uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-[#138808]" />
            Telangana License Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight mb-3">
            {title}
          </h2>
          <div className="mx-auto h-[2.5px] w-24 rounded-full bg-gradient-to-r from-[#FF9933] via-[#D4AF37] to-[#138808] mb-4" />
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Desktop: Horizontal timeline (visible on xl screens to avoid cramped columns) */}
        <div className="hidden xl:block relative bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm">
          {/* Central line */}
          <div className="absolute left-12 right-12 top-[60px] h-0.5 bg-gray-200" />

          <div className="grid grid-cols-9 gap-3 relative z-10">
            {stages.map((stage, idx) => (
              <div key={stage.stage} className="relative flex flex-col items-center text-center group">
                {/* Node */}
                <div className="relative z-10 mb-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                      idx === 0
                        ? "bg-[#0F2D52] border-[#0F2D52] text-white shadow-[#0F2D52]/20"
                        : idx === stages.length - 1
                        ? "bg-[#138808] border-[#138808] text-white shadow-[#138808]/20"
                        : "bg-white border-gray-300 text-[#0F2D52] group-hover:border-[#D4AF37] group-hover:text-[#D4AF37] group-hover:scale-105"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stageIcons[idx] || stageIcons[0]} />
                    </svg>
                  </div>
                </div>
                {/* Step number badge */}
                <span className="text-[10px] font-bold text-gray-400 mb-1">
                  0{idx + 1}
                </span>
                {/* Label */}
                <h3 className={`text-xs font-bold mb-1.5 line-clamp-2 ${
                  idx === 0 ? "text-[#0F2D52]" :
                  idx === stages.length - 1 ? "text-[#138808]" : "text-[#0B1F3A]"
                }`}>
                  {stage.stage}
                </h3>
                {stage.statutoryRef && (
                  <span className="inline-block text-[9px] font-semibold text-[#0F2D52] bg-[#0F2D52]/10 px-2 py-0.5 rounded-full mb-1.5 border border-[#0F2D52]/15">
                    {stage.statutoryRef}
                  </span>
                )}
                <p className="text-[11px] text-gray-500 leading-snug line-clamp-3">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet / Mobile: Vertical timeline */}
        <div className="xl:hidden bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative">
          <div className="absolute left-[39px] sm:left-[47px] top-8 bottom-8 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {stages.map((stage, idx) => (
              <div key={stage.stage} className="flex items-start gap-4 sm:gap-5 relative">
                <div className="relative z-10 shrink-0">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                      idx === 0
                        ? "bg-[#0F2D52] border-[#0F2D52] text-white"
                        : idx === stages.length - 1
                        ? "bg-[#138808] border-[#138808] text-white"
                        : "bg-white border-gray-300 text-[#0F2D52]"
                    }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={stageIcons[idx] || stageIcons[0]} />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400">STAGE 0{idx + 1}</span>
                    <h3 className="text-base font-bold text-[#0B1F3A]">{stage.stage}</h3>
                    {stage.statutoryRef && (
                      <span className="text-[10px] font-semibold text-[#0F2D52] bg-[#0F2D52]/10 px-2 py-0.5 rounded-full border border-[#0F2D52]/15">
                        {stage.statutoryRef}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
