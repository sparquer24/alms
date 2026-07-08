"use client";

import React from "react";

interface Props {
  smallLabel?: string;
  title?: string;
  acknowledgementNo?: string;
  renewalId?: string | number;
  applicationId?: string | number;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  currentSection?: string;
  accentColorClass?: string;
  imageSrc?: string;
}

export default function RenewalApplicationDetailsHeader({
  smallLabel = "RENEWAL REQUEST",
  title,
  acknowledgementNo,
  renewalId,
  applicationId,
  tabs = ["Renewal Application Info", "Original License Details"],
  activeTab,
  onTabChange,
  currentSection,
  accentColorClass = "bg-gradient-to-b from-indigo-500 to-indigo-400",
  imageSrc,
}: Props) {
  const subtitleParts: string[] = [];
  if (renewalId !== undefined && renewalId !== null) subtitleParts.push(`For Renewal ID: #${renewalId}`);
  if (acknowledgementNo) subtitleParts.push(`Ack No: ${acknowledgementNo}`);
  if (applicationId) subtitleParts.push(`App ID: ${applicationId}`);

  return (
    <div className="relative">
      <div className="rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex">
          <div className={`w-2 ${accentColorClass}`} />

          <div className="flex-1 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                    {imageSrc ? (
                      <img src={imageSrc} alt="" className="h-5 w-5" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6M9 16h6M12 8h.01M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                      </svg>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    {smallLabel}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 truncate">
                    {title || (renewalId ? `Renewal Request #${renewalId}` : "Renewal Request")}
                  </h2>
                  {subtitleParts.length > 0 && (
                    <p className="mt-1 text-sm text-slate-500">{subtitleParts.join(" · ")}</p>
                  )}

                  {tabs && tabs.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {tabs.map((t) => {
                        const isActive = t === activeTab;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onTabChange?.(t)}
                            className={`${isActive ? "bg-[#071933] text-white shadow" : "bg-white text-slate-700 border border-slate-200"} px-4 py-2 rounded-md text-sm font-semibold`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 text-right pr-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Section</div>
                <div className="mt-1 text-sm font-bold text-slate-800">{currentSection || activeTab}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
