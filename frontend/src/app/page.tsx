"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../components/Sidebar";
import Header from "../components/Header";
import ApplicationTable from "../components/ApplicationTable";
import DashboardSummary from "../components/DashboardSummary";
import { useAuth } from "../config/auth";
import { useLayout } from "../config/layoutContext";
import { mockApplications, filterApplications, ApplicationData } from "../config/mockData";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const { isAuthenticated } = useAuth();
  const { setShowHeader, setShowSidebar } = useLayout();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  useEffect(() => {
    // Initialize applications data
    setApplications(mockApplications);
    
    // Show header and sidebar on the Application Table page
    setShowHeader(true);
    setShowSidebar(true);
  }, [setShowHeader, setShowSidebar]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
    // Here you would typically fetch data based on the search query
  };

  const handleDateFilter = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    console.log("Filtering by date range:", start, "to", end);
    // Here you would typically fetch data based on the date range
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    console.log("Reset filters");
    // Here you would typically reset the data to its original state
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header 
        onSearch={handleSearch} 
        onDateFilter={handleDateFilter} 
        onReset={handleReset} 
      />
      <main className="flex-1 p-8 overflow-y-auto ml-[18%] mt-[70px]">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-black mb-6">Welcome to Arms License Dashboard</h1>
          <p className="text-gray-600 mb-4">
            This dashboard provides access to all arms license applications and their statuses.
            Use the sidebar navigation to access different sections.
          </p>
          
          {/* Display search and filter information if applied */}
          {(searchQuery || startDate || endDate) && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="font-semibold text-blue-700">Active Filters:</h3>
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {searchQuery && <p>Search: {searchQuery}</p>}
                {(startDate || endDate) && (
                  <p>Date Range: {startDate || "Any"} to {endDate || "Any"}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Dashboard Summary Component */}
          <div className="mb-8">
            <DashboardSummary />
          </div>

          <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
          <ApplicationTable 
            applications={filterApplications(applications, searchQuery, startDate, endDate)} 
          />
        </div>
      </main>
    </div>
  );
}
