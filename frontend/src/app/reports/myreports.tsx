import React, { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuthSync } from "../../hooks/useAuthSync";
import { useLayout } from "../../config/layoutContext";
import { useAuth } from "../../config/auth";
// Example data will be shown in place of the ApplicationTable

const STATUS_TYPES = [
  { key: "forwarded", label: "Forwarded" },
  { key: "returned", label: "Returned" },
  { key: "flagged", label: "Red Flagged" },
  { key: "disposed", label: "Disposed" },
];

const MyReportsPage = () => {
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
  const { userId } = useAuth();
  const { setShowHeader, setShowSidebar } = useLayout();
  const [appsByType, setAppsByType] = useState<Record<string, any[]>>({});
  const [loadingByType, setLoadingByType] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  // Seed example data so the page shows content everywhere immediately
  useEffect(() => {
    const seed: Record<string, any[]> = {};
    STATUS_TYPES.forEach(({ key }) => {
      seed[key] = [
        {
          id: `${key}-1`,
          applicantName: 'John Doe',
          applicationId: `APP-${1000 + Math.floor(Math.random() * 9000)}`,
          submittedAt: '2025-09-01',
          note: `Example ${key} application sample.`
        },
        {
          id: `${key}-2`,
          applicantName: 'Jane Smith',
          applicationId: `APP-${1000 + Math.floor(Math.random() * 9000)}`,
          submittedAt: '2025-09-05',
          note: `Second example ${key} item.`
        }
      ];
    });
    setAppsByType(seed);
    // mark all as not loading
    const notLoading: Record<string, boolean> = {};
    STATUS_TYPES.forEach(({ key }) => (notLoading[key] = false));
    setLoadingByType(notLoading);
  }, []);

  useEffect(() => {
    setShowHeader(true);
    setShowSidebar(true);
    return () => {
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  useEffect(() => {
    if (!userId) return;
    STATUS_TYPES.forEach(({ key }) => {
      setLoadingByType(prev => ({ ...prev, [key]: true }));
      // Simulate API delay and populate with example items
      setTimeout(() => {
        const exampleData = [
          {
            id: `${key}-1`,
            applicantName: 'John Doe',
            applicationId: `APP-${Math.floor(Math.random() * 9000) + 1000}`,
            submittedAt: '2025-09-01',
            note: `Example ${key} application sample.`
          },
          {
            id: `${key}-2`,
            applicantName: 'Jane Smith',
            applicationId: `APP-${Math.floor(Math.random() * 9000) + 1000}`,
            submittedAt: '2025-09-05',
            note: `Second example ${key} item.`
          }
        ];
        setAppsByType(prev => ({ ...prev, [key]: exampleData }));
        setLoadingByType(prev => ({ ...prev, [key]: false }));
      }, 750 + Math.floor(Math.random() * 600));
    });
  }, [userId]);

  if (authLoading || !isAuthenticated) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Special view for ZS role
  if (userRole === 'ZS') {
    return (
      <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
        <Sidebar />
        <Header userRole={userRole} onSearch={() => {}} onDateFilter={() => {}} onReset={() => {}} />
  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%]">
          <h1 className="text-2xl font-bold mb-8">My Reports</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center text-xl text-gray-700">
            Zonal Superintendent (ZS) does not have any reports to display here.
          </div>
        </main>
      </div>
    );
  }

  // No-op handlers for Header component which expects these props
  const noop = () => {};

  // Small totals/summary component
  function TotalSummary({ appsByType }: { appsByType: Record<string, any[]> }) {
    const totals = STATUS_TYPES.reduce((acc, { key }) => {
      acc[key] = (appsByType[key] && appsByType[key].length) || 0;
      return acc;
    }, {} as Record<string, number>);
    const total = Object.values(totals).reduce((s, n) => s + n, 0);
    return (
      <div className="mb-6 flex space-x-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Applications</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        {STATUS_TYPES.map(({ key, label }) => (
          <div key={key} className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-lg font-semibold">{totals[key]}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header userRole={userRole} onSearch={noop} onDateFilter={noop} onReset={noop} />
  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%]">
        <h1 className="text-2xl font-bold mb-8">My Reports</h1>
        {/* Totals summary */}
        <TotalSummary appsByType={appsByType} />

        <div className="space-y-6">
          {STATUS_TYPES.map(({ key, label }) => (
            <div key={key} className="bg-white rounded-lg shadow p-4">
              <button
                className="w-full flex justify-between items-center text-lg font-semibold focus:outline-none"
                onClick={() => setExpanded(expanded === key ? null : key)}
                aria-expanded={expanded === key}
              >
                <span>{label}</span>
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {loadingByType[key]
                    ? "Loading..."
                    : (appsByType[key]?.length || 0) + " application(s)"}
                </span>
              </button>
              {expanded === key && (
                <div className="mt-4">
                  {loadingByType[key] ? (
                    <div className="text-center text-gray-500">Loading...</div>
                  ) : (appsByType[key]?.length ? (
                    <div className="space-y-3">
                      {appsByType[key].map(item => (
                        <div key={item.id} className="border rounded p-3 flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{item.applicantName}</div>
                            <div className="text-sm text-gray-500">{item.applicationId} • {item.submittedAt}</div>
                            <div className="text-sm mt-2 text-gray-600">{item.note}</div>
                          </div>
                          <div className="text-sm text-gray-400">{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">No applications found for {label}.</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MyReportsPage;
