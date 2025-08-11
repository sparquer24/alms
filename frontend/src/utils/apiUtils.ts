export const fetchNextUsers = async (): Promise<{ value: string; label: string }[]> => {
  const response = await fetch('/api/users/next');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data.users.map((user: any) => ({
    value: user.id,
    label: `${user.name} (${user.designation || user.role})`,
  }));
};
