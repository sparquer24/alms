"use client";

import { Sidebar } from "../../../components/Sidebar";
import TotalReportsWidget from "./TotalReportsWidget";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Type assertion for recharts components to fix React 18 compatibility
const ResponsiveContainerFixed = ResponsiveContainer as any;
const BarChartFixed = BarChart as any;
const BarFixed = Bar as any;
const XAxisFixed = XAxis as any;
const YAxisFixed = YAxis as any;
const TooltipFixed = Tooltip as any;
const CartesianGridFixed = CartesianGrid as any;
const PieChartFixed = PieChart as any;
const PieFixed = Pie as any;
const CellFixed = Cell as any;
const LegendFixed = Legend as any;

// Mock data (reuse from userManagement)
const roles = ["ZS", "DCP", "SHO", "ADMIN"];
const mockUsers = [
  { id: 1, name: "Alice", role: "ZS", office: "Office A", email: "alice@example.com", phone: "1234567890" },
  { id: 2, name: "Bob", role: "DCP", office: "Office B", email: "bob@example.com", phone: "2345678901" },
  { id: 3, name: "Charlie", role: "SHO", office: "Office C", email: "charlie@example.com", phone: "3456789012" },
];
const mockApplications = [
  { id: 1, state: "pending", createdAt: "2025-06-01", assignedRole: "ZS" },
  { id: 2, state: "approved", createdAt: "2025-06-02", assignedRole: "DCP" },
  { id: 3, state: "pending", createdAt: "2025-06-08", assignedRole: "ZS" },
  { id: 4, state: "rejected", createdAt: "2025-06-10", assignedRole: "SHO" },
  { id: 5, state: "approved", createdAt: "2025-06-15", assignedRole: "DCP" },
  { id: 6, state: "pending", createdAt: "2025-06-15", assignedRole: "ZS" },
  { id: 7, state: "approved", createdAt: "2025-06-22", assignedRole: "SHO" },
];
const applicationStates = ["pending", "approved", "rejected"];
const mockAdminActivities = [
  { id: 1, user: "ZS123", action: "forwarded application #15 to ACP", time: "2025-06-28 10:15" },
  { id: 2, user: "DCP456", action: "approved application #12", time: "2025-06-28 09:50" },
  { id: 3, user: "SHO789", action: "rejected application #9", time: "2025-06-27 17:30" },
  { id: 4, user: "ADMIN", action: "created user Bob", time: "2025-06-27 16:00" },
];
const pieColors = ["#6366F1", "#F59E42", "#10B981", "#EF4444"];

export default function AnalyticsPage() {
  // User counts per role
  const userCountsByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    mockUsers.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, []);
  // Application counts per state
  const applicationCountsByState = useMemo(() => {
    const counts: Record<string, number> = {};
    mockApplications.forEach((a) => {
      counts[a.state] = (counts[a.state] || 0) + 1;
    });
    return counts;
  }, []);
  // Applications over time (weekly)
  const applicationsByWeek = useMemo(() => {
    const weekMap: Record<string, number> = {};
    mockApplications.forEach((app) => {
      const date = new Date(app.createdAt);
      const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
      weekMap[week] = (weekMap[week] || 0) + 1;
    });
    return Object.entries(weekMap).map(([week, count]) => ({ week, count }));
  }, []);
  // Role-wise application load
  const appLoadByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    mockApplications.forEach((a) => {
      counts[a.assignedRole] = (counts[a.assignedRole] || 0) + 1;
    });
    return roles.map((role) => ({ name: role, value: counts[role] || 0 }));
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Overview</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Applications Over Time</h2>
            <ResponsiveContainerFixed width="100%" height={300}>
              <BarChartFixed data={applicationsByWeek}>
                <CartesianGridFixed strokeDasharray="3 3" />
                <XAxisFixed dataKey="week" />
                <YAxisFixed />
                <TooltipFixed />
                <BarFixed dataKey="count" fill="#4F46E5" />
              </BarChartFixed>
            </ResponsiveContainerFixed>
          </div>
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Role-wise Application Load</h2>
            <ResponsiveContainerFixed width="100%" height={300}>
              <PieChartFixed>
                <PieFixed data={appLoadByRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {appLoadByRole.map((entry, idx) => (
                    <CellFixed key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </PieFixed>
                <TooltipFixed />
                <LegendFixed />
              </PieChartFixed>
            </ResponsiveContainerFixed>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Analytics Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">ZS</h3>
                <p className="text-2xl font-bold text-blue-600">{userCountsByRole["ZS"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">DCP</h3>
                <p className="text-2xl font-bold text-blue-600">{userCountsByRole["DCP"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">SHO</h3>
                <p className="text-2xl font-bold text-blue-600">{userCountsByRole["SHO"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">ADMIN</h3>
                <p className="text-2xl font-bold text-blue-600">{userCountsByRole["ADMIN"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-blue-600">{applicationCountsByState["pending"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Approved</h3>
                <p className="text-2xl font-bold text-blue-600">{applicationCountsByState["approved"] || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
                <p className="text-2xl font-bold text-blue-600">{applicationCountsByState["rejected"] || 0}</p>
              </div>
              {/* Placeholder for additional analytics */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Additional Metric</h3>
                <p className="text-2xl font-bold text-blue-600">N/A</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
