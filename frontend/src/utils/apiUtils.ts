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
