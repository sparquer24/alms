"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useLayout } from "@/config/layoutContext";
import { fetchAllApplications } from "@/services/sidebarApiCalls";
import type { ApplicationData } from "@/types";

interface Application {
  status: string;
  // ...other fields if needed
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const { isLoggedIn } = useAdminAuth();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    // Fetch applications data
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        const fetchedApplications = await fetchAllApplications();
        setApplications(fetchedApplications);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      loadApplications();
    }
  }, [isLoggedIn]);
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/admin/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    // Hide header on My Reports page, but keep sidebar
    setShowHeader(false);
    setShowSidebar(true);

    return () => {
      // Reset visibility when unmounting
      setShowHeader(true);
      setShowSidebar(true);
    };
  }, [setShowHeader, setShowSidebar]);

  const handleSearch = () => {};
  const handleDateFilter = () => {};
  const handleReset = () => {};

  // Get statistics for the report
  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter((app: ApplicationData) => app.status === "pending")
      .length;
    const approved = applications.filter((app: ApplicationData) => app.status === "approved")
      .length;
    const rejected = applications.filter((app: ApplicationData) => app.status === "rejected")
      .length;
    const returned = applications.filter((app: ApplicationData) => app.status === "returned")
      .length;
    const flagged = applications.filter((app: ApplicationData) => app.status === "red-flagged")
      .length;
    const disposed = applications.filter((app: ApplicationData) => app.status === "disposed")
      .length;

    return {
      total,
      pending,
      approved,
      rejected,
      returned,
      flagged,
      disposed,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  };

  const stats = getStats();
  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header
        onSearch={handleSearch}
        onDateFilter={handleDateFilter}
        onReset={handleReset}
      />

  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">My Reports</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800">
                    Total Applications
                  </h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h3 className="text-sm font-medium text-yellow-800">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-medium text-green-800">Approved</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.approved}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h3 className="text-sm font-medium text-red-800">Rejected</h3>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.rejected}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">
                  Application Status Breakdown
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full"
                        style={{
                          width: `${(stats.pending / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.pending / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Approved</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{
                          width: `${(stats.approved / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.approved / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejected</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-red-500 h-4 rounded-full"
                        style={{
                          width: `${(stats.rejected / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.rejected / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Returned</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-orange-500 h-4 rounded-full"
                        style={{
                          width: `${(stats.returned / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.returned / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Flagged</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-red-400 h-4 rounded-full"
                        style={{
                          width: `${(stats.flagged / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.flagged / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Disposed</span>
                    <div className="w-3/4 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gray-400 h-4 rounded-full"
                        style={{
                          width: `${(stats.disposed / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-right w-16">
                      {Math.round((stats.disposed / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Performance Metrics</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Processing Time</span>
                      <span className="font-bold">7.4 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate</span>
                      <span className="font-bold">{stats.approvalRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applications Processed Today</span>
                      <span className="font-bold">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applications Processed This Week</span>
                      <span className="font-bold">12</span>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6">
                  <h2 className="text-lg font-bold mb-4">Report Actions</h2>
                  <div className="space-y-4">
                    <button className="w-full px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5]">
                      Download Full Report (PDF)
                    </button>
                    <button className="w-full px-4 py-2 border border-[#6366F1] text-[#6366F1] rounded-md hover:bg-[#EEF2FF]">
                      Export Data (Excel)
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      Schedule Regular Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
