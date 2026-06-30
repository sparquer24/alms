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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/10 rounded-full uppercase tracking-wider mb-4">
            Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F2D52] mb-4">{title}</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Desktop: Horizontal timeline */}
        <div className="hidden lg:block relative">
          {/* Central line */}
          <div className="absolute left-0 right-0 top-[76px] h-0.5 bg-[#0F2D52]/10" />

          <div className="grid grid-cols-9 gap-4">
            {stages.map((stage, idx) => (
              <div key={stage.stage} className="relative flex flex-col items-center text-center">
                {/* Node */}
                <div className="relative z-10 mb-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      idx === 0
                        ? "bg-[#0F2D52] border-[#0F2D52] text-white"
                        : idx === stages.length - 1
                        ? "bg-[#2E7D32] border-[#2E7D32] text-white"
                        : "bg-white border-[#B8860B] text-[#B8860B]"
                    } hover:scale-110 transition-transform`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stageIcons[idx] || stageIcons[0]} />
                    </svg>
                  </div>
                </div>
                {/* Label */}
                <h3 className={`text-xs font-bold mb-1 ${
                  idx === 0 ? "text-[#0F2D52]" :
                  idx === stages.length - 1 ? "text-[#2E7D32]" : "text-gray-800"
                }`}>
                  {stage.stage}
                </h3>
                <p className="text-[10px] text-gray-500 leading-tight max-w-[130px]">
                  {stage.description.length > 80 ? stage.description.substring(0, 80) + "..." : stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet / Mobile: Vertical timeline */}
        <div className="lg:hidden space-y-0 relative">
          <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-[#B8860B]/20" />
          {stages.map((stage, idx) => (
            <div key={stage.stage} className="flex items-start gap-5 py-4">
              <div className="relative z-10">
                <div
                  className={`w-[46px] h-[46px] rounded-full flex items-center justify-center border-2 shrink-0 ${
                    idx === 0
                      ? "bg-[#0F2D52] border-[#0F2D52] text-white"
                      : idx === stages.length - 1
                      ? "bg-[#2E7D32] border-[#2E7D32] text-white"
                      : "bg-white border-[#B8860B] text-[#B8860B]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stageIcons[idx] || stageIcons[0]} />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <h3 className="text-sm font-bold text-[#0F2D52]">{stage.stage}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{stage.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
