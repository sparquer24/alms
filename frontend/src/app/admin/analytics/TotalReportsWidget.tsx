"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { 
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading chart...</div>
});

// Mock data for total reports/analytics
const mockTotalReports = [
  { type: "Pending", count: 30 },
  { type: "Approved", count: 18 },
  { type: "Rejected", count: 6 },
  { type: "In Review", count: 12 }
];

export default function TotalReportsWidget() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setTimeout(() => setLoading(false), 400);
  }, []);

  // Export to CSV handler
  const handleExportCSV = () => {
    const header = "Type,Count\n";
    const rows = mockTotalReports.map(r => `${r.type},${r.count}`).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "total-reports.csv");
  };

  const chartData: ChartData<'bar'> = {
    labels: mockTotalReports.map(r => r.type),
    datasets: [
      {
        label: "Total Reports",
        data: mockTotalReports.map(r => r.count),
        backgroundColor: ["#6366F1", "#60a5fa", "#f87171", "#fbbf24"],
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Total Reports Overview</h2>
        <button
          onClick={handleExportCSV}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Export CSV
        </button>
      </div>
      {loading ? (
        <div className="h-64 flex items-center justify-center">Loading...</div>
      ) : (
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
