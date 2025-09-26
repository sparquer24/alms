"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AuthApi, UserApi } from '@/config/APIClient';
import { useAuthSync } from '@/hooks/useAuthSync';

interface AdminUser {
  id: string | number;
  username?: string;
  email?: string;
  name?: string;
  role?: string;
  designation?: string;
  createdAt?: string;
  lastLogin?: string;
}

type FetchState = {
  loading: boolean;
  error: string | null;
  data: AdminUser[];
};

const initialState: FetchState = { loading: true, error: null, data: [] };

export default function AdminHomePage() {
  const { token } = useAuthSync();
  const [state, setState] = useState<FetchState>(initialState);
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = useCallback(async (role?: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      // Prefer existing UserApi (wraps apiClient) if no role filter needed
      let response: any;
      if (role) {
        // Direct call with query param (UserApi.getByRole already supports role)
        response = await UserApi.getByRole(role);
      } else {
        response = await UserApi.getByRole(''); // Will fetch all if backend treats empty as all
      }
      // Response normalization: { success, body } or raw array
      const raw = response?.body?.users || response?.body || response?.data || response;
      const arr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.users) ? raw.users : []);
      const mapped: AdminUser[] = arr.map(u => ({
        id: u.id ?? u.userId ?? u._id ?? crypto.randomUUID(),
        username: u.username,
        email: u.email,
        name: u.name || u.fullName || u.username,
        role: typeof u.role === 'object' ? (u.role?.code || u.role?.name || u.role?.key) : u.role,
        designation: u.designation,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }));
      setState({ loading: false, error: null, data: mapped });
    } catch (e: any) {
      setState({ loading: false, error: e?.message || 'Failed to load users', data: [] });
    }
  }, []);

  useEffect(() => {
    if (!token) return; // layout will handle redirect
    fetchUsers(roleFilter || undefined);
  }, [token, roleFilter, fetchUsers]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    state.data.forEach(u => { if (u.role) set.add(String(u.role).toUpperCase()); });
    return Array.from(set).sort();
  }, [state.data]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">User overview (live from /users endpoint)</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700" htmlFor="roleFilter">Role:</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => fetchUsers(roleFilter || undefined)}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={state.loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status / Error */}
      {state.error && (
        <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full text-sm table-auto border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 w-14">S.No.</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Username</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Role</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Designation</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Created</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Last Login</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {state.loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500 border-b border-gray-100">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!state.loading && state.data.length === 0 && !state.error && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500 border-b border-gray-100">No users found.</td>
                </tr>
              )}
              {!state.loading && state.data.map((user, idx) => (
                <tr
                  key={user.id}
                  className={"transition-colors " + (idx % 2 === 0 ? 'bg-white hover:bg-blue-50/60' : 'bg-gray-50 hover:bg-blue-50/60')}
                >
                  <td className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-600 border-b border-gray-100 max-w-[140px] truncate" title={String(user.id)}>{user.id}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{user.username || '-'}</td>
                  <td className="px-3 py-2 border-b border-gray-100">{user.email || '-'}</td>
                  <td className="px-3 py-2 border-b border-gray-100">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/30 uppercase">
                      {user.role || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-gray-100">{user.designation || '-'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-500 border-b border-gray-100">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-500 border-b border-gray-100">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
