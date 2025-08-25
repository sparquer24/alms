import React, { useEffect, useState } from "react";
import { Sidebar } from "../../components/Sidebar";
import Header from "../../components/Header";
import { useAuthSync } from "../../hooks/useAuthSync";
import { useLayout } from "../../config/layoutContext";
import { useAuth } from "../../config/auth";
import ApplicationTable from "../../components/ApplicationTable";

const STATUS_TYPES = [
  { key: "forwarded", label: "Forwarded" },
  { key: "returned", label: "Returned" },
  { key: "flagged", label: "Red Flagged" },
  { key: "disposed", label: "Disposed" },
];

const fetchApplicationsByType = async (userId, type) => {
  // Replace with your real API endpoint
  const res = await fetch(`/application/?user_id=${userId}&status_id=${type}`);
  if (!res.ok) return [];
  return res.json();
};

const MyReportsPage = () => {
  const { isAuthenticated, isLoading: authLoading, userRole } = useAuthSync();
  const { userId } = useAuth();
  const { setShowHeader, setShowSidebar } = useLayout();
  const [appsByType, setAppsByType] = useState({});
  const [loadingByType, setLoadingByType] = useState({});
  const [expanded, setExpanded] = useState<string | null>(null);

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
      fetchApplicationsByType(userId, key)
        .then(data => setAppsByType(prev => ({ ...prev, [key]: data || [] })))
        .finally(() => setLoadingByType(prev => ({ ...prev, [key]: false })));
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
        <Header userRole={userRole} />
        <main className="flex-1 p-8 overflow-y-auto ml-[18%]">
          <h1 className="text-2xl font-bold mb-8">My Reports</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center text-xl text-gray-700">
            Zonal Superintendent (ZS) does not have any reports to display here.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header userRole={userRole} />
      <main className="flex-1 p-8 overflow-y-auto ml-[18%]">
        <h1 className="text-2xl font-bold mb-8">My Reports</h1>
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
                    <ApplicationTable applications={appsByType[key]} isLoading={false} />
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
