"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "../../../components/Sidebar";
import Header from "../../../components/Header";
import dynamic from "next/dynamic";

// Dynamically import chart components for better SSR compatibility
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });

// Mock data for demonstration
const mockUserCounts = [
  { role: "ZS", count: 12 },
  { role: "DCP", count: 5 },
  { role: "ACP", count: 7 },
  { role: "SHO", count: 20 },
  { role: "ADMIN", count: 2 },
];
const mockAppStates = [
  { state: "Pending", count: 30 },
  { state: "Approved", count: 18 },
  { state: "Rejected", count: 6 },
];
const mockAppOverTime = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  data: [10, 15, 20, 18, 25, 30],
};
const mockRoleLoad = {
  labels: ["ZS", "DCP", "ACP", "SHO"],
  data: [12, 5, 7, 20],
};
const mockRecentActivities = [
  { action: "User created", user: "admin1", time: "2025-06-28 10:00" },
  { action: "Role updated", user: "admin2", time: "2025-06-28 09:30" },
  { action: "User deleted", user: "admin1", time: "2025-06-27 17:45" },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <Header 
        onSearch={() => {}} 
        onDateFilter={() => {}} 
        onReset={() => {}} 
      />
  <main className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%]">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User counts per role */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-2">Users per Role</h2>
              <ul>
                {mockUserCounts.map(u => (
                  <li key={u.role} className="flex justify-between py-1">
                    <span>{u.role}</span>
                    <span className="font-bold">{u.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Application states */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-semibold mb-2">Applications by State</h2>
              <ul>
                {mockAppStates.map(a => (
                  <li key={a.state} className="flex justify-between py-1">
                    <span>{a.state}</span>
                    <span className="font-bold">{a.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Applications over time chart */}
            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
              <h2 className="font-semibold mb-2">Applications Over Time</h2>
              <div className="h-64">
                <Line
                  data={{
                    labels: mockAppOverTime.labels,
                    datasets: [
                      {
                        label: "Applications",
                        data: mockAppOverTime.data,
                        backgroundColor: "#6366F1",
                        borderColor: "#6366F1",
                        fill: false,
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
            {/* Role-wise application load chart */}
            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
              <h2 className="font-semibold mb-2">Role-wise Application Load</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: mockRoleLoad.labels,
                    datasets: [
                      {
                        label: "Applications",
                        data: mockRoleLoad.data,
                        backgroundColor: "#60a5fa",
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
            {/* Recent admin activities */}
            <div className="bg-white rounded-lg shadow p-6 col-span-1 md:col-span-2">
              <h2 className="font-semibold mb-2">Recent Admin Activities</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Action</th>
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentActivities.map((a, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1">{a.action}</td>
                      <td className="py-1">{a.user}</td>
                      <td className="py-1">{a.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
