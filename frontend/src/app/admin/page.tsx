"use client";

import { useAuthSync } from "@/hooks/useAuthSync";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import ConfirmationModal from '@/components/ConfirmationModal';
import Link from 'next/link';
import { PageLayoutSkeleton } from '@/components/Skeleton';

// Dynamically import charts to avoid SSR issues
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const PieChart = dynamic(() => import('@/components/charts/PieChart'), { ssr: false });

// Chart data shapes expected by chart components
type LineDataset = {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

type PieDataset = {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderColor?: string[];
  borderWidth?: number;
};

type LineChartData = { labels: string[]; datasets: LineDataset[] };

type PieChartData = { labels: string[]; datasets: PieDataset[] };

type RecentActivity = { description: string; user: string; date: string };

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6'];

// Coerce API responses into chart-ready shapes
const toLineChartData = (src: any): LineChartData => {
  if (src && typeof src === 'object' && Array.isArray(src.labels) && Array.isArray(src.datasets)) {
    return src as LineChartData;
  }
  const arr = Array.isArray(src) ? src : [];
  const labels = arr.map((i: any, idx: number) => i?.label ?? i?.date ?? i?.name ?? `Item ${idx + 1}`);
  const data = arr.map((i: any) => Number(i?.value ?? i?.count ?? i?.total ?? 0));
  return { labels, datasets: [{ label: 'Applications', data }] };
};

const toPieChartData = (src: any): PieChartData => {
  if (src && typeof src === 'object' && Array.isArray(src.labels) && Array.isArray(src.datasets)) {
    return src as PieChartData;
  }
  const arr = Array.isArray(src) ? src : [];
  const labels = arr.map((i: any, idx: number) => i?.label ?? i?.role ?? i?.name ?? `Item ${idx + 1}`);
  const data = arr.map((i: any) => Number(i?.value ?? i?.count ?? i?.total ?? 0));
  const backgroundColor = labels.map((_: any, idx: number) => PIE_COLORS[idx % PIE_COLORS.length]);
  return { labels, datasets: [{ label: 'Roles', data, backgroundColor }] };
};

export default function AdminDashboard() {
  const { userRole, token } = useAuthSync();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    totalUsers: number;
    totalApplications: number;
    applicationsOverTime: LineChartData;
    roleWiseApplications: PieChartData;
    recentActivities: RecentActivity[];
  }>({
    totalUsers: 0,
    totalApplications: 0,
    applicationsOverTime: { labels: [], datasets: [{ label: 'Applications', data: [] }] },
    roleWiseApplications: { labels: [], datasets: [{ label: 'Roles', data: [], backgroundColor: [] }] },
    recentActivities: [],
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [userStatsRes, appStatsRes] = await Promise.all([
          fetch('/admin/user-stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/admin/application-stats', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!userStatsRes.ok || !appStatsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const userStats = await userStatsRes.json();
        const appStats = await appStatsRes.json();

        setDashboardData({
          totalUsers: Number(userStats.totalUsers ?? 0),
          totalApplications: Number(appStats.totalApplications ?? 0),
          applicationsOverTime: toLineChartData(appStats.applicationsOverTime),
          roleWiseApplications: toPieChartData(appStats.roleWiseApplications),
          recentActivities: Array.isArray(appStats.recentActivities)
            ? appStats.recentActivities.map((a: any) => ({
                description: String(a?.description ?? a?.activity ?? ''),
                user: String(a?.user ?? a?.by ?? a?.username ?? ''),
                date: String(a?.date ?? a?.createdAt ?? a?.time ?? ''),
              }))
            : [],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && userRole === 'ADMIN') {
      fetchDashboardData();
    } else {
      router.push('/login');
    }
  }, [token, userRole, router]);

  const handleDeleteUser = (userId: string) => {
    setSelectedUser(userId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    console.log(`User with ID ${selectedUser} deleted.`); // Replace with actual delete logic
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const cancelDeleteUser = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return <PageLayoutSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the Arms License Management System administrative interface
        </p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p className="text-2xl">{dashboardData.totalUsers}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Applications</h2>
          <p className="text-2xl">{dashboardData.totalApplications}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Applications Over Time</h2>
          <LineChart data={dashboardData.applicationsOverTime} />
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold">Role-wise Application Count</h2>
          <PieChart data={dashboardData.roleWiseApplications} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold">Recent Activities</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b p-2">Activity</th>
              <th className="border-b p-2">User</th>
              <th className="border-b p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.recentActivities.map((activity, index) => (
              <tr key={index}>
                <td className="border-b p-2">{activity.description}</td>
                <td className="border-b p-2">{activity.user}</td>
                <td className="border-b p-2">{activity.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Example User List */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold">User List</h2>
        <ul>
          {['User1', 'User2', 'User3'].map((user, index) => (
            <li key={index} className="flex justify-between items-center border-b py-2">
              <span>{user}</span>
              <button
                onClick={() => handleDeleteUser(user)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation to User Management */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/usermanagement">
              <a className="text-blue-600 hover:underline">Go to User Management</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/addadmin">
              <a className="text-blue-600 hover:underline">Add Admin</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/rolemapping">
              <a className="text-blue-600 hover:underline">Role Mapping</a>
            </Link>
          </li>
          <li>
            <Link href="/admin/analytics">
              <a className="text-blue-600 hover:underline">Analytics</a>
            </Link>
          </li>
        </ul>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteUser}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${selectedUser}? This action cannot be undone.`}
      />
    </div>
  );
}
