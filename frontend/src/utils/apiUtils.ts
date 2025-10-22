import { fetchData } from '../api/axiosConfig';

export const fetchNextUsers = async (): Promise<{ value: string; label: string }[]> => {
  const data = await fetchData('/users/next');
  // Expect data.users or data depending on API shape
  const users = data.users || data.data || data;
  return users.map((user: any) => ({
    value: user.id,
    label: `${user.name} (${user.designation || user.role})`,
  }));
};

// Generic users fetcher aligned with backend UserController (GET /users?role=...)
export interface ApiUser {
  id: string | number;
  username: string;
  email?: string;
  role?: string | null;
}

export const fetchUsers = async (role?: string): Promise<ApiUser[]> => {
  const params = role ? { role } : {} as any;
  const data = await fetchData('/users', params);
  // Controller returns an array; but allow wrappers too
  const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? []);
  return list as ApiUser[];
};

export const fetchUsersByRoles = async (roles: string[]): Promise<ApiUser[]> => {
  const results = await Promise.all(roles.map((r) => fetchUsers(r)));
  const merged: Record<string, ApiUser> = {};
  for (const arr of results) {
    for (const u of arr) {
      const key = String(u.id);
      merged[key] = u; // last write wins, fine for dedupe
    }
  }
  return Object.values(merged);
};
